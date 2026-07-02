import { AuthPage } from './AuthPage';

export interface LoginPageProps {
  /** Called after the (fully mocked) login form passes basic validation
   * and "submits" successfully. There is no real auth backend yet — this
   * is the seam where you'd wire in a real API call and only call
   * onLoginSuccess once that call actually succeeds. For now it fires
   * after a simulated delay as long as both fields are non-empty. */
  onLoginSuccess?: (identity: string) => void;
}

/**
 * "Grimoire" flavored login screen — not wired into the app's router
 * (see LoginPortalPage in pages/ for the version that's actually routed
 * at /login). Kept as its own component/export in case it's wired up to
 * a route later; internally it's just AuthPage configured with this
 * variant's copy, so it stays in sync with any future AuthPage changes
 * automatically.
 */
export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  return (
    <AuthPage
      heading="Login to Grimoire"
      subheading="Recite your credentials to access the ancient scrolls."
      identityLabel="Arcane Identity"
      identityPlaceholder="scribe@aetheric.grimoire"
      secretLabel="Secret Cipher"
      rememberMeLabel="Remember my essence"
      forgotLabel="Lost your key?"
      submitLabel="Enter the Grimoire"
      oauthLabel="Sign in with Mana Gate"
      mainTopPaddingClassName="pt-24"
      onLoginSuccess={onLoginSuccess}
    />
  );
}
