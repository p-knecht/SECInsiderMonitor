import { CardWrapper } from '@/components/auth/card-wrapper';
import { VerifyForm } from '@/components/auth/verify-form';

export default function VerifyPage() {
  return (
    <CardWrapper
      cardTitle="Konto-Verifikation"
      cardDescription="Konto wird verifiziert..."
      footerLinkLabel="Zur Anmeldung"
      footerLinkHref="/auth/login"
    >
      <VerifyForm />
    </CardWrapper>
  );
}
