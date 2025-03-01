import { CardWrapper } from '@/components/auth/card-wrapper';
import { VerifyForm } from '@/components/auth/verify-form';
import { Suspense } from 'react';

export default function VerifyPage() {
  return (
    <CardWrapper
      cardTitle="Konto-Verifikation"
      cardDescription="Konto wird verifiziert..."
      footerLinkLabel="Zur Anmeldung"
      footerLinkHref="/auth/login"
    >
      <Suspense>
        <VerifyForm />
      </Suspense>
    </CardWrapper>
  );
}
