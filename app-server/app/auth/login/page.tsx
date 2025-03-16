'use client';

import { CardWrapper } from '@/components/auth/card-wrapper';
import { LoginForm } from '@/components/auth/login-form';
import { useState, useEffect } from 'react';
import { isRegistrationDisabled } from '@/actions/auth/register';

export default function LoginPage() {
  const [registrationDisabled, setRegistrationDisabled] = useState<boolean>(true);

  useEffect(() => {
    const checkRegistrationDisabled = async () => {
      setRegistrationDisabled(await isRegistrationDisabled());
    };
    checkRegistrationDisabled();
  }, []);

  return (
    <CardWrapper
      cardTitle="Willkommen bei SIM"
      cardDescription="Mit bestehendem Konto anmelden"
      footerLinkLabel={registrationDisabled ? '' : 'Noch kein Konto? Jetzt registrieren'}
      footerLinkHref={registrationDisabled ? '' : '/auth/register'}
    >
      <LoginForm />
    </CardWrapper>
  );
}
