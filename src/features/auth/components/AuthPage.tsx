import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { env } from '../../../config/env';
import { Footer } from '../../../shared/components/layout/Footer';
import { Header } from '../../../shared/components/layout/Header';
import { getErrorMessage } from '../../../shared/lib/errors';
import { SupportPane, type SupportAvatar } from './SupportPane';

export interface AuthPageProps {
  heading: string;
  subheading: string;
  identityLabel: string;
  identityPlaceholder: string;
  secretLabel: string;
  rememberMeLabel: string;
  forgotLabel: string;
  submitLabel: string;
  mainTopPaddingClassName?: string;
  onLoginSuccess?: (idToken: string) => Promise<void> | void;
  supportAvatars?: SupportAvatar[];
  oracleCardImageSrc?: string;
}

export function AuthPage({
  heading,
  subheading,
  identityLabel,
  identityPlaceholder,
  secretLabel,
  rememberMeLabel,
  forgotLabel,
  submitLabel,
  mainTopPaddingClassName = 'pt-24',
  onLoginSuccess,
  supportAvatars,
  oracleCardImageSrc,
}: AuthPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogleSuccess(response: CredentialResponse) {
    if (!response.credential) {
      setError('Google Sign-In failed to return credentials.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onLoginSuccess?.(response.credential);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="font-body-md text-body-md bg-background min-h-screen flex flex-col">
      <Header />
      <main className={`flex-grow ${mainTopPaddingClassName} pb-xl px-margin-mobile md:px-margin-desktop max-w-[1200px] mx-auto w-full flex items-center justify-center relative`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl w-full relative z-10">
          <section className="lg:col-span-7 flex flex-col justify-center">
            <div className="glass-panel p-lg rounded-xl mystic-glow">
              <div className="mb-lg">
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">{heading}</h2>
                <p className="text-on-surface-variant font-body-md">{subheading}</p>
              </div>

              <form className="space-y-md" onSubmit={(event) => event.preventDefault()}>
                <FormField label={identityLabel} placeholder={identityPlaceholder} type="text" />
                <FormField label={secretLabel} placeholder="••••••••" type="password" />

                <div className="flex items-center justify-between py-xs">
                  <label className="flex items-center gap-sm cursor-pointer group">
                    <input className="w-5 h-5 rounded border-outline-variant bg-surface-container-low text-primary focus:ring-primary" type="checkbox" disabled />
                    <span className="font-label-sm text-on-surface-variant group-hover:text-primary transition-colors">{rememberMeLabel}</span>
                  </label>
                  <span className="font-label-sm text-outline">{forgotLabel}</span>
                </div>

                {error && <p className="font-label-sm text-error" role="alert">{error}</p>}

                <div className="pt-sm space-y-md">
                  <button className="primary-btn-gloss w-full py-md rounded-full text-on-primary font-headline-md flex items-center justify-center gap-sm transition-transform active:scale-95 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed" type="submit" disabled>
                    <span className="material-symbols-outlined">bolt</span>
                    {submitLabel}
                  </button>
                  <div className="flex items-center gap-md text-outline-variant py-sm">
                    <div className="h-px flex-grow bg-outline-variant/30" />
                    <span className="font-label-sm uppercase tracking-widest">or</span>
                    <div className="h-px flex-grow bg-outline-variant/30" />
                  </div>
                  {env.googleClientId ? (
                    <div className={`flex justify-center ${isSubmitting ? 'pointer-events-none opacity-60' : ''}`} aria-busy={isSubmitting}>
                      <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google Sign-In was cancelled or failed.')} text="signin_with" shape="pill" size="large" width="320" />
                    </div>
                  ) : (
                    <p className="font-label-sm text-error text-center" role="alert">
                      Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID to enable login.
                    </p>
                  )}
                  {isSubmitting && <p className="font-label-sm text-primary text-center" role="status">Signing in…</p>}
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

function FormField({ label, placeholder, type }: { label: string; placeholder: string; type: 'text' | 'password' }) {
  return (
    <div className="flex flex-col gap-xs">
      <label className="font-label-md text-on-surface-variant px-xs">{label}</label>
      <input className="mana-input bg-surface-container-low border-none rounded-lg p-md text-on-surface w-full transition-all disabled:opacity-60" placeholder={placeholder} type={type} disabled />
    </div>
  );
}
