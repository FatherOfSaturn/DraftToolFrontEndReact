import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { AuthPage } from '../components/AuthPage';
import type { SupportAvatar } from '../components/SupportPane';

export type { SupportAvatar };

export interface LoginPageProps {
  supportAvatars?: SupportAvatar[];
  oracleCardImageSrc?: string;
}

export function LoginPage({ supportAvatars, oracleCardImageSrc }: LoginPageProps) {
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLoginSuccess(idToken: string) {
    await login(idToken);
    navigate('/account');
  }

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
      mainTopPaddingClassName="pt-32"
      onLoginSuccess={handleLoginSuccess}
      supportAvatars={supportAvatars}
      oracleCardImageSrc={oracleCardImageSrc}
    />
  );
}
