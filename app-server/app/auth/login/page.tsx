'use server';

import { CardWrapper } from '@/components/auth/card-wrapper';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage() {
  return (
    <CardWrapper
      cardTitle="Willkommen bei SIM"
      cardDescription="Mit bestehendem Konto anmelden"
      footerLinkLabel={
        process.env.SERVER_DISABLE_REGISTRATION?.toLowerCase() === 'true'
          ? ''
          : 'Noch kein Konto? Jetzt registrieren'
      }
      footerLinkHref={
        process.env.SERVER_DISABLE_REGISTRATION?.toLowerCase() === 'true' ? '' : '/auth/register'
      }
    >
      <LoginForm />
    </CardWrapper>
  );
}
