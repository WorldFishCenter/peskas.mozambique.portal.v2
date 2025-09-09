import AuthWrapperFour from '@/app/shared/auth-layout/auth-wrapper-four';
import ResetPasswordForm from './reset-password-form';

export default function ForgotPassword({
  params: { lang, token },
}: {
  params: { lang?: string, token: string };
}) {
  return (
    <AuthWrapperFour
      title={
        <>
          Reset your password.
        </>
      }
      lang={lang}
    >
      <ResetPasswordForm lang={lang} token={token}/>
    </AuthWrapperFour>
  );
}
