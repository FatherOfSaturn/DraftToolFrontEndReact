import { AuthPage, type SupportAvatar } from '../components/login/AuthPage';

export type { SupportAvatar };

export interface LoginPortalPageProps {
  /** Called after the (fully mocked) login form passes basic validation
   * and "submits" successfully. There is no real auth backend behind
   * this page — this is the seam where you'd wire in a real API call
   * and only call onLoginSuccess once that call actually succeeds. For
   * now it fires after a simulated delay as long as both fields are
   * non-empty. */
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

/**
 * The login screen actually routed at /login ("Portal" copy variant).
 * Internally this is just AuthPage configured with this variant's copy
 * — see components/login/AuthPage.tsx for the shared form/support-pane
 * implementation, and components/login/LoginPage.tsx for the other
 * ("Grimoire") copy variant that isn't currently routed.
 */
export function LoginPortalPage({ onLoginSuccess, supportAvatars, oracleCardImageSrc }: LoginPortalPageProps) {
  return (
    <AuthPage
      heading="Login"
      subheading="Log in or create an account to easily access your data."
      identityLabel="Username"
      identityPlaceholder="Mike Hawkslong"
      secretLabel="Password"
      rememberMeLabel="Remember my credentials"
      forgotLabel="Forgot your password?"
      submitLabel="Login"
      oauthLabel="Sign in Google"
      mainTopPaddingClassName="pt-32"
      onLoginSuccess={onLoginSuccess}
      supportAvatars={supportAvatars}
      oracleCardImageSrc={oracleCardImageSrc}
    />
  );
}
