import AuthWrapperFour from '@/app/shared/auth-layout/auth-wrapper-four';
import ForgetPasswordForm from './forgot-password-form';

export default function ForgotPassword({
  params: { lang },
}: {
  params: { lang?: string };
}) {
  return (
    <AuthWrapperFour
      title={
        <>
          Having trouble to sign in? <br className="hidden sm:inline-block" />{' '}
          Send reset link to your email.
        </>
      }
      lang={lang}
    >
      <ForgetPasswordForm lang={lang}/>
    </AuthWrapperFour>
  );
}
