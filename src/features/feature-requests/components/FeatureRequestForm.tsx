import { FormEvent, useEffect, useRef, useState } from 'react';
import { supportApi, type SupportType } from '../api/supportApi';
import { ApiError } from '../../../shared/api/httpClient';
import { env } from '../../../config/env';
import { TurnstileWidget, type TurnstileWidgetHandle } from './TurnstileWidget';

const TYPE_OPTIONS: { value: SupportType; label: string }[] = [
  { value: 'new_feature', label: 'New Feature' },
  { value: 'bug_fix', label: 'Bug Report' },
  { value: 'misc_support', label: 'Miscellaneous Support' },
];

/** Client-side limits mirroring the backend validation (UX only — the
 * backend is the real enforcement). */
const TITLE_MAX = 200;
const DESCRIPTION_MAX = 5000;
const EMAIL_MAX = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Delay before retrying when the submit happened too fast after the
 * form token was fetched (the backend requires age >= 3 s). */
const TOO_FAST_RETRY_DELAY_MS = 3000;

interface FieldErrors {
  title?: string;
  description?: string;
  email?: string;
}

/**
 * Reason codes the backend returns inside a 400 body when an anti-spam
 * check fails. The exact JSON shape isn't pinned down by the spec, so we
 * match on substrings of the raw body.
 */
const FORM_TOKEN_EXPIRED = 'form-token-expired';
const FORM_TOKEN_TOO_FAST = 'form-token-too-fast';
const INVALID_TURNSTILE_TOKEN = 'invalid-turnstile-token';
const MISSING_TURNSTILE_TOKEN = 'missing-turnstile-token';

/**
 * User-facing submit error messages. Deliberately generic — never reveal
 * which anti-spam check failed.
 */
function getSubmitErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) {
      const waitSeconds = err.retryAfterSeconds;
      if (waitSeconds !== undefined && waitSeconds > 0) {
        const minutes = Math.ceil(waitSeconds / 60);
        return `Too many requests. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
      }
      return 'Too many requests. Please try again later.';
    }
    if (err.status >= 400 && err.status < 500) {
      return 'Something went wrong. Please try again.';
    }
    return 'Something went wrong. Please try again later.';
  }
  // fetch() rejects with TypeError on network failures / CORS issues.
  if (err instanceof TypeError) {
    return 'Network error. Please check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Inspect the raw 400 body for a token-related reason code, so we can
 * refetch the form token / reset the Turnstile widget and retry once.
 * Returns true when the reason matches.
 */
function errorMentions(err: ApiError, ...reasons: string[]): boolean {
  return reasons.some((reason) => err.message.includes(reason));
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function FeatureRequestForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [priority, setPriority] = useState('low');
  const [requestType, setRequestType] = useState<SupportType>('new_feature');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  /** Honeypot. Real users never see or fill it; bots that do are silently
   * dropped server-side. Never prefill or trim. */
  const [honeypot, setHoneypot] = useState('');

  const turnstileEnabled = env.turnstileSiteKey !== '';
  const [formToken, setFormToken] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle | null>(null);

  useEffect(() => {
    if (!turnstileEnabled) return;
    let cancelled = false;
    supportApi
      .getFormToken()
      .then((res) => {
        if (!cancelled) setFormToken(res.token);
      })
      .catch(() => {
        // The submit path refetches a token and retries if the backend
        // rejects the form; nothing to show the user here yet.
      });
    return () => {
      cancelled = true;
    };
  }, [turnstileEnabled]);

  async function refetchFormToken(): Promise<string | null> {
    try {
      const res = await supportApi.getFormToken();
      setFormToken(res.token);
      return res.token;
    } catch {
      return null;
    }
  }

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!title.trim()) errors.title = 'Title is required.';
    else if (title.trim().length > TITLE_MAX) errors.title = `Title must be at most ${TITLE_MAX} characters.`;
    if (!description.trim()) errors.description = 'Description is required.';
    else if (description.trim().length > DESCRIPTION_MAX)
      errors.description = `Description must be at most ${DESCRIPTION_MAX} characters.`;
    if (!email.trim()) errors.email = 'Contact email is required.';
    else if (email.trim().length > EMAIL_MAX) errors.email = `Email must be at most ${EMAIL_MAX} characters.`;
    else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Please enter a valid email address.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: undefined }));
  }

  function handleDescriptionChange(value: string) {
    setDescription(value);
    if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: undefined }));
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
  }

  async function postTicket(payload: Parameters<typeof supportApi.create>[0]) {
    // Token lifecycle: on a token-related 400, refresh the relevant token
    // and retry once. Anything else propagates to the caller.
    try {
      return await supportApi.create(payload);
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 400) throw err;

      if (errorMentions(err, FORM_TOKEN_EXPIRED, FORM_TOKEN_TOO_FAST)) {
        if (err.message.includes(FORM_TOKEN_TOO_FAST)) await sleep(TOO_FAST_RETRY_DELAY_MS);
        const freshToken = await refetchFormToken();
        if (!freshToken) throw err;
        return await supportApi.create({ ...payload, formToken: freshToken });
      }

      if (errorMentions(err, INVALID_TURNSTILE_TOKEN, MISSING_TURNSTILE_TOKEN)) {
        // Single-use token: make the user re-complete the widget.
        turnstileRef.current?.reset();
        setTurnstileToken(null);
      }
      throw err;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await postTicket({
        title,
        description,
        contactEmail: email,
        priority,
        type: requestType,
        website: honeypot,
        ...(turnstileEnabled
          ? {
              formToken: formToken ?? undefined,
              'cf-turnstile-response': turnstileToken ?? undefined,
            }
          : {}),
      });
      setSubmitted(true);
      setTitle('');
      setDescription('');
      setEmail('');
      setPriority('low');
      setRequestType('new_feature');
      setHoneypot('');
      setFieldErrors({});
      // Tokens are single-use: reset so the next submit needs a fresh one.
      setFormToken(null);
      if (turnstileEnabled) {
        turnstileRef.current?.reset();
        void refetchFormToken();
      }
    } catch (err) {
      setError(getSubmitErrorMessage(err));
      // Turnstile tokens are single-use; the widget must be re-completed
      // before the next attempt regardless of why the submit failed.
      if (turnstileEnabled) {
        turnstileRef.current?.reset();
      }
      setTurnstileToken(null);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    !submitting && (!turnstileEnabled || turnstileToken !== null);

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-lg flex flex-col gap-md">
      <h3 className="font-headline-sm text-headline-sm text-on-surface">Submit a Request</h3>

      {submitted && (
        <div className="flex items-center gap-2 p-sm rounded-lg bg-secondary/10 border border-secondary/20 text-secondary">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="font-label-md text-label-md">Your request has been submitted successfully!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-sm rounded-lg bg-error/10 border border-error/20 text-error">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="font-label-md text-label-md">{error}</span>
        </div>
      )}

      {/* Honeypot: visually off-screen, not keyboard-reachable, invisible to
          assistive tech. Bots that fill it are silently dropped server-side. */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, opacity: 0 }}
      />

      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fr-title">Title</label>
        <input
          id="fr-title"
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          maxLength={TITLE_MAX}
          aria-invalid={fieldErrors.title !== undefined}
          placeholder="A short name for your request"
          className="w-full px-md py-sm rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
        />
        {fieldErrors.title && (
          <span className="font-label-sm text-label-sm text-error" role="alert">{fieldErrors.title}</span>
        )}
      </div>

      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fr-desc">Description</label>
        <textarea
          id="fr-desc"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          required
          rows={5}
          maxLength={DESCRIPTION_MAX}
          aria-invalid={fieldErrors.description !== undefined}
          placeholder="Describe your request in detail..."
          className="w-full px-md py-sm rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
        />
        {fieldErrors.description && (
          <span className="font-label-sm text-label-sm text-error" role="alert">{fieldErrors.description}</span>
        )}
      </div>

      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fr-email">Contact Email</label>
        <input
          id="fr-email"
          type="email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          required
          maxLength={EMAIL_MAX}
          aria-invalid={fieldErrors.email !== undefined}
          placeholder="your@email.com"
          className="w-full px-md py-sm rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
        />
        {fieldErrors.email && (
          <span className="font-label-sm text-label-sm text-error" role="alert">{fieldErrors.email}</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-md">
        <div className="flex flex-col gap-xs flex-1">
          <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fr-type">Type of Request</label>
          <select
            id="fr-type"
            value={requestType}
            onChange={(e) => setRequestType(e.target.value as SupportType)}
            className="w-full px-md py-sm rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-body-md text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-xs flex-1">
          <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fr-priority">Priority Level</label>
          <select
            id="fr-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-md py-sm rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-body-md text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {turnstileEnabled && (
        <TurnstileWidget ref={turnstileRef} siteKey={env.turnstileSiteKey} onTokenChange={setTurnstileToken} />
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting…' : 'Submit Request'}
      </button>
    </form>
  );
}
