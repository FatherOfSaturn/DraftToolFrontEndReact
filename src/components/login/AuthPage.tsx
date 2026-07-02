import { useState, type FormEvent } from 'react';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';

export interface SupportAvatar {
  src: string;
  alt: string;
}

export interface AuthPageCopy {
  /** Heading inside the glass login panel, e.g. "Login" or "Login to Grimoire". */
  heading: string;
  /** Supporting line under the heading. */
  subheading: string;
  /** Label + placeholder for the identity field (always type="text"). */
  identityLabel: string;
  identityPlaceholder: string;
  /** Label for the secret field (always type="password", always masked-dots placeholder). */
  secretLabel: string;
  /** "Remember me" checkbox copy. */
  rememberMeLabel: string;
  /** "Forgot password" link copy. */
  forgotLabel: string;
  /** Submit button copy shown when not submitting ("Entering…" is used
   * for both variants while submitting, so it isn't parametrized). */
  submitLabel: string;
  /** OAuth button copy. */
  oauthLabel: string;
  /** Top padding utility class for <main>. The two existing pages use
   * slightly different vertical rhythm (pt-24 vs pt-32); kept as a prop
   * rather than homogenized, since unifying spacing wasn't asked for and
   * would visibly shift either page. Defaults to 'pt-24'. */
  mainTopPaddingClassName?: string;
}

export interface AuthPageProps extends AuthPageCopy {
  /** Called after the (fully mocked) login form passes basic validation
   * and "submits" successfully. There is no real auth backend yet — this
   * is the seam where you'd wire in a real API call and only call
   * onLoginSuccess once that call actually succeeds. For now it fires
   * after a simulated delay as long as both fields are non-empty. */
  onLoginSuccess?: (identity: string) => void;
  /** Avatar images shown in the "Joined by 1.2k Arcanists" row. Pass
   * your own URLs — defaults to colored-initial placeholders if
   * omitted, so the page still renders something sensible without any
   * images wired up yet. */
  supportAvatars?: SupportAvatar[];
  /** Background image for the "Current Oracle" decorative card.
   * Defaults to a plain gradient if omitted. */
  oracleCardImageSrc?: string;
}

const DEFAULT_AVATAR_SEEDS = ['A', 'B', 'C'];

/**
 * Shared login screen: form, validation, mocked submit flow, and the
 * "Support the Archives" side panel. Both real entry points —
 * LoginPage (components/login/) and the routed LoginPortalPage
 * (pages/) — render this with different copy props. It was previously
 * two near-identical ~250-line files (same form, same support pane,
 * same avatar/oracle-card sub-components) that had drifted slightly in
 * copy; this is now the one implementation both configure.
 *
 * The validation-error and OAuth-placeholder messages are identical in
 * both source pages (they both say "Arcane Identity and Secret Cipher",
 * even on the page that labels the fields "Username"/"Password") — kept
 * hardcoded here rather than parametrized, since that's a faithful
 * reproduction of the original copy rather than something to fix.
 */
export function AuthPage({
  heading,
  subheading,
  identityLabel,
  identityPlaceholder,
  secretLabel,
  rememberMeLabel,
  forgotLabel,
  submitLabel,
  oauthLabel,
  mainTopPaddingClassName = 'pt-24',
  onLoginSuccess,
  supportAvatars,
  oracleCardImageSrc,
}: AuthPageProps) {
  const [identity, setIdentity] = useState('');
  const [secret, setSecret] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!identity.trim() || !secret.trim()) {
      setError('Both your Arcane Identity and Secret Cipher are required.');
      return;
    }

    setSubmitting(true);
    // No real auth backend exists yet — this simulates a network round
    // trip so the loading state is visible. Replace with a real API call
    // when one exists, and only call onLoginSuccess if it actually succeeds.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmitting(false);
    onLoginSuccess?.(identity.trim());
  }

  function handleOAuthClick() {
    // Decorative / inert per product direction — no real OAuth flow wired up.
    setError('Mana Gate sign-in is not connected yet.');
  }

  return (
    <div className="font-body-md text-body-md bg-background min-h-screen flex flex-col">
      <Header />

      <main
        className={`flex-grow ${mainTopPaddingClassName} pb-xl px-margin-mobile md:px-margin-desktop max-w-[1200px] mx-auto w-full flex items-center justify-center relative`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl w-full relative z-10">
          <section className="lg:col-span-7 flex flex-col justify-center">
            <div className="glass-panel p-lg rounded-xl mystic-glow">
              <div className="mb-lg">
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">{heading}</h2>
                <p className="text-on-surface-variant font-body-md">{subheading}</p>
              </div>

              <form className="space-y-md" onSubmit={handleSubmit}>
                <FormField
                  label={identityLabel}
                  placeholder={identityPlaceholder}
                  type="text"
                  value={identity}
                  onChange={setIdentity}
                  disabled={submitting}
                />
                <FormField
                  label={secretLabel}
                  placeholder="••••••••"
                  type="password"
                  value={secret}
                  onChange={setSecret}
                  disabled={submitting}
                />

                <div className="flex items-center justify-between py-xs">
                  <label className="flex items-center gap-sm cursor-pointer group">
                    <input
                      className="w-5 h-5 rounded border-outline-variant bg-surface-container-low text-primary focus:ring-primary"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={submitting}
                    />
                    <span className="font-label-sm text-on-surface-variant group-hover:text-primary transition-colors">
                      {rememberMeLabel}
                    </span>
                  </label>
                  <a className="font-label-sm text-primary hover:underline" href="#">
                    {forgotLabel}
                  </a>
                </div>

                {error && (
                  <p className="font-label-sm text-error" role="alert">
                    {error}
                  </p>
                )}

                <div className="pt-sm space-y-md">
                  <button
                    className="primary-btn-gloss w-full py-md rounded-full text-on-primary font-headline-md flex items-center justify-center gap-sm transition-transform active:scale-95 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={submitting}
                  >
                    <span className="material-symbols-outlined">bolt</span>
                    {submitting ? 'Entering…' : submitLabel}
                  </button>

                  <div className="flex items-center gap-md text-outline-variant py-sm">
                    <div className="h-px flex-grow bg-outline-variant/30" />
                    <span className="font-label-sm uppercase tracking-widest">or</span>
                    <div className="h-px flex-grow bg-outline-variant/30" />
                  </div>

                  <button
                    className="w-full py-md rounded-full bg-transparent border border-secondary text-secondary font-label-md flex items-center justify-center gap-sm hover:bg-secondary/10 transition-all active:scale-95"
                    type="button"
                    onClick={handleOAuthClick}
                  >
                    <span className="material-symbols-outlined">token</span>
                    {oauthLabel}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <SupportPane supportAvatars={supportAvatars} oracleCardImageSrc={oracleCardImageSrc} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface FormFieldProps {
  label: string;
  placeholder: string;
  type: 'text' | 'password';
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function FormField({ label, placeholder, type, value, onChange, disabled }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label className="font-label-md text-on-surface-variant px-xs">{label}</label>
      <input
        className="mana-input bg-surface-container-low border-none rounded-lg p-md text-on-surface w-full transition-all disabled:opacity-60"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

const SUPPORT_TIERS = [
  { amount: '5 Crystals', label: 'Initiate Tier', icon: 'diamond', bg: 'bg-primary-container/10' },
  // The original mockup's HTML has data-icon="tempest" here but the
  // actual rendered <span> text is "compost" — a leftover mismatch from
  // their icon picker, not something to carry forward. Using "compost"
  // since that's what actually renders.
  { amount: '10 Crystals', label: 'Adept Tier', icon: 'compost', bg: 'bg-primary-container/20' },
];

interface SupportPaneProps {
  supportAvatars?: SupportAvatar[];
  oracleCardImageSrc?: string;
}

function SupportPane({ supportAvatars, oracleCardImageSrc }: SupportPaneProps) {
  return (
    <section className="lg:col-span-5 flex flex-col gap-md">
      <div className="glass-panel p-lg rounded-xl flex flex-col h-full">
        <div className="mb-md">
          <span className="inline-block px-sm py-xs bg-tertiary-container/20 text-tertiary rounded-full font-label-sm mb-sm border border-tertiary-container/30">
            PATRONS NEEDED
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface">Support the Archives</h2>
          <p className="text-on-surface-variant text-body-md mt-xs">
            Help the Scribes maintain the magical stability of our digital collective.
          </p>
        </div>

        <div className="space-y-sm flex-grow">
          {SUPPORT_TIERS.map((tier) => (
            <button
              key={tier.amount}
              type="button"
              className="group w-full p-md rounded-lg bg-surface-container-low border border-outline-variant/20 hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-md">
                <div className={`w-12 h-12 rounded-lg ${tier.bg} flex items-center justify-center text-primary`}>
                  <span className="material-symbols-outlined text-headline-md">{tier.icon}</span>
                </div>
                <div className="text-left">
                  <h3 className="font-label-md text-on-surface">{tier.amount}</h3>
                  <p className="font-label-sm text-on-surface-variant">{tier.label}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary group-hover:translate-x-1 transition-all">
                chevron_right
              </span>
            </button>
          ))}

          <button
            type="button"
            className="group w-full p-md rounded-lg bg-surface-container-lowest border border-dashed border-outline-variant/40 hover:border-tertiary transition-all cursor-pointer flex items-center justify-center gap-sm"
          >
            <span className="material-symbols-outlined text-tertiary">volunteer_activism</span>
            <span className="font-label-md text-on-surface">Custom Offering</span>
          </button>
        </div>

        <div className="mt-lg pt-md border-t border-outline-variant/10">
          <div className="flex items-center gap-sm mb-sm">
            <div className="flex -space-x-2">
              {supportAvatars && supportAvatars.length > 0
                ? supportAvatars.map((avatar, i) => <SupportAvatarImage key={i} avatar={avatar} />)
                : DEFAULT_AVATAR_SEEDS.map((seed) => <AvatarStub key={seed} seed={seed} />)}
            </div>
            <p className="font-label-sm text-on-surface-variant">Joined by 1.2k Arcanists</p>
          </div>
        </div>
      </div>

      <DecorativeOracleCard imageSrc={oracleCardImageSrc} />
    </section>
  );
}

function SupportAvatarImage({ avatar }: { avatar: SupportAvatar }) {
  return (
    <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-variant overflow-hidden">
      <img className="w-full h-full object-cover" src={avatar.src} alt={avatar.alt} />
    </div>
  );
}

function AvatarStub({ seed }: { seed: string }) {
  return (
    <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-variant overflow-hidden flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
      {seed}
    </div>
  );
}

function DecorativeOracleCard({ imageSrc }: { imageSrc?: string }) {
  return (
    <div className="relative h-40 rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary-container/30 via-surface-container to-secondary-container/20">
      {imageSrc && <img className="absolute inset-0 w-full h-full object-cover" src={imageSrc} alt="" />}
      <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-80" />
      <div className="absolute bottom-md left-md">
        <p className="font-label-sm text-primary uppercase tracking-tighter">Current Oracle</p>
        <h4 className="font-headline-md text-on-surface">The Weaver of Fates</h4>
      </div>
    </div>
  );
}
