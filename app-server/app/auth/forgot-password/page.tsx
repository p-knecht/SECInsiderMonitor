import { CardWrapper } from '@/components/auth/card-wrapper';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

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
