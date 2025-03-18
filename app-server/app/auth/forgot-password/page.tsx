import { CardWrapper } from '@/components/auth/card-wrapper';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

/**
 * Renders the content of the forgot password page to allow users to request a password reset token.
 *
 * @returns {JSX.Element} - The forgot password page layout containing the forgot password form.
 */
export default function ForgotPasswordPage() {
  return (
    <CardWrapper
      cardTitle="Passwort vergessen?"
      cardDescription="Ein Link zum Zurücksetzen des Passworts wird an die E-Mail-Adresse gesendet"
      footerLinkLabel="Zurück zur Anmeldung"
      footerLinkHref="/auth/login"
    >
      <ForgotPasswordForm />
    </CardWrapper>
  );
}
