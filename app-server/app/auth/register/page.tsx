'use client';

import { CardWrapper } from '@/components/auth/card-wrapper';
import { RegisterForm } from '@/components/auth/register-form';
import { FormError } from '@/components/form-error';
import { useState, useEffect } from 'react';
import { isRegistrationDisabled } from '@/actions/auth/register';

export default function RegisterPage() {
  const [registrationDisabled, setRegistrationDisabled] = useState<boolean>(false);

  useEffect(() => {
    const checkRegistrationDisabled = async () => {
      setRegistrationDisabled(await isRegistrationDisabled());
    };
    checkRegistrationDisabled();
  }, []);

  return (
    <CardWrapper
      cardTitle="Konto erstellen"
      cardDescription="Neues Konto erstellen, um Zugriff auf SIM zu erhalten."
      footerLinkLabel="Konto bereits vorhanden? Jetzt anmelden"
      footerLinkHref="/auth/login"
    >
      {registrationDisabled ? (
        <FormError message="Registrierung ist derzeit deaktiviert." />
      ) : (
        <RegisterForm />
      )}
    </CardWrapper>
  );
}
