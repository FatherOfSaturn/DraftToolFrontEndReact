import { FormEvent, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { supportApi, type SupportType } from '../api/supportApi';

const TYPE_OPTIONS: { value: SupportType; label: string }[] = [
  { value: 'new_feature', label: 'New Feature' },
  { value: 'bug_fix', label: 'Bug Report' },
  { value: 'misc_support', label: 'Miscellaneous Support' },
];

export function FeatureRequestForm() {
  const { account } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [priority, setPriority] = useState('low');
  const [requestType, setRequestType] = useState<SupportType>('new_feature');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await supportApi.create({
        title,
        description,
        contactEmail: email,
        priority,
        accountID: account?.accountID ?? null,
        type: requestType,
      });
      setSubmitted(true);
      setTitle('');
      setDescription('');
      setEmail('');
      setPriority('low');
      setRequestType('new_feature');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

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

      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fr-title">Title</label>
        <input
          id="fr-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="A short name for your request"
          className="w-full px-md py-sm rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fr-desc">Description</label>
        <textarea
          id="fr-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          placeholder="Describe your request in detail..."
          className="w-full px-md py-sm rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
        />
      </div>

      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fr-email">Contact Email</label>
        <input
          id="fr-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
          className="w-full px-md py-sm rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
        />
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

      <button
        type="submit"
        disabled={submitting}
        className="px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting…' : 'Submit Request'}
      </button>
    </form>
  );
}
