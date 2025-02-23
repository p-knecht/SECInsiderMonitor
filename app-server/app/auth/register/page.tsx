import { CardWrapper } from '@/components/auth/card-wrapper';
import { RegisterForm } from '@/components/auth/register-form';
import { FormError } from '@/components/form-error';

export default function RegisterPage() {
  return (
    <CardWrapper
      cardTitle="Konto erstellen"
      cardDescription="Neues Konto erstellen, um Zugriff auf SIM zu erhalten."
      footerLinkLabel="Konto bereits vorhanden? Jetzt anmelden"
      footerLinkHref="/auth/login"
    >
      {process.env.SERVER_DISABLE_REGISTRATION?.toLowerCase() === 'true' ? (
        <FormError message="Registrierung ist derzeit deaktiviert." />
      ) : (
        <RegisterForm />
      )}
    </CardWrapper>
  );
}
