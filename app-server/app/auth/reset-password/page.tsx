import { CardWrapper } from '@/components/auth/card-wrapper';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Suspense } from 'react';

/**
 * Renders the content of the reset password page (allows to set a new password with a password reset token).
 *
 * @returns {JSX.Element} - The reset password page layout containing the form to set a new password.
 */
export default function ResetPasswordPage() {
  return (
    <CardWrapper
      cardTitle="Neues Passwort setzen"
      cardDescription="Setze ein neues Passwort für dein Konto"
      footerLinkLabel="Zurück zur Anmeldung"
      footerLinkHref="/auth/login"
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </CardWrapper>
  );
}
