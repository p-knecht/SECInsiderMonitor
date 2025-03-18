'use client';

import { CardWrapper } from '@/components/auth/card-wrapper';
import { LoginForm } from '@/components/auth/login-form';
import { useState, useEffect } from 'react';
import { isRegistrationDisabled } from '@/actions/auth/register';

/**
 * Renders the content of the login page.
 *
 * @returns {JSX.Element} - The login page layout containing the login form.
 */
export default function LoginPage() {
  const [registrationDisabled, setRegistrationDisabled] = useState<boolean>(true);

  // Check if registration is disabled and hide the registration link if it is
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
      cardTitle="Willkommen bei SIM"
      cardDescription="Mit bestehendem Konto anmelden"
      footerLinkLabel={registrationDisabled ? '' : 'Noch kein Konto? Jetzt registrieren'}
      footerLinkHref={registrationDisabled ? '' : '/auth/register'}
    >
      <LoginForm />
    </CardWrapper>
  );
}
