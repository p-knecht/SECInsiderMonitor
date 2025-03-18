'use client';

import { useState } from 'react';
import { PulseLoader } from 'react-spinners';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { verifyToken } from '@/actions/auth/verify';

/**
 * Renders verification page content to verify a user account using a verification token.
 *
 * @returns {JSX.Element} - The rendered verification component
 */
export const VerifyContent = () => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');

  const verificationToken: string = useSearchParams().get('token') || ''; // get verification token from URL query parameter

  /**
   * Sends a request to the server to verify the user's account with the given verification token.
   *
   * @returns {Promise<void>} - The promise that resolves when the verification request is complete
   */
  const onSubmit = useCallback(async () => {
    // using useCallback to prevent infinite loop --> only called when verificationToken changes
    if (!verificationToken)
      setErrorMessage('Verifizierungscode fehlt'); // show error if no verification token is provided
    else {
      // send verification request
      verifyToken(verificationToken).then((data) => {
        // handle response and update fields
        setErrorMessage(data?.error);
        setSuccessMessage(data?.success);
      });
    }
  }, [verificationToken]);

  useEffect(() => {
    onSubmit(); // call onSubmit automatically when component is loaded
  }, [onSubmit]);

  return (
    <div className="flex items-center w-full justify-center">
      {!errorMessage && !successMessage && <PulseLoader color="#555" />}
      <FormError message={errorMessage} />
      <FormSuccess message={successMessage} />
    </div>
  );
};
