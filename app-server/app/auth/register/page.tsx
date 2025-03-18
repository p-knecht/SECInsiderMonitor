'use client';

import { CardWrapper } from '@/components/auth/card-wrapper';
import { RegisterForm } from '@/components/auth/register-form';
import { FormError } from '@/components/form-error';
import { useState, useEffect } from 'react';
import { isRegistrationDisabled } from '@/actions/auth/register';

/**
 * Renders the content of the register page.
 *
 * @returns {JSX.Element} - The register page layout containing the register form.
 */
export default function RegisterPage() {
  const [registrationDisabled, setRegistrationDisabled] = useState<boolean>(false);

  // Check if registration is disabled and hide form + show message if it is
  useEffect(() => {
    /**
     * Checks if registration is disabled and sets the state accordingly.
     *
     * @returns {Promise<void>} - A promise that resolves when the registration status is checked.
     */
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
