import { CardWrapper } from '@/components/auth/card-wrapper';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <CardWrapper
      cardTitle="Neues Passwort setzen"
      cardDescription="Setze ein neues Passwort für dein Konto"
      footerLinkLabel="Zurück zur Anmeldung"
      footerLinkHref="/auth/login"
    >
      <ResetPasswordForm />
    </CardWrapper>
  );
}
