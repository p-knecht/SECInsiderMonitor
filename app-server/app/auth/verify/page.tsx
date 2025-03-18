import { CardWrapper } from '@/components/auth/card-wrapper';
import { VerifyContent } from '@/components/auth/verify-content';
import { Suspense } from 'react';

/**
 * Renders the content of the verify account page (allows to verify the account with a verification token).
 *
 * @returns {JSX.Element} - The verify account page layout.
 */
export default function VerifyPage() {
  return (
    <CardWrapper
      cardTitle="Konto-Verifikation"
      cardDescription="Konto wird verifiziert..."
      footerLinkLabel="Zur Anmeldung"
      footerLinkHref="/auth/login"
    >
      <Suspense>
        <VerifyContent />
      </Suspense>
    </CardWrapper>
  );
}
