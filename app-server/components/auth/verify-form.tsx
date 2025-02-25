'use client';

import { useState } from 'react';
import { PulseLoader } from 'react-spinners';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { verifyToken } from '@/actions/auth/verify';

export const VerifyForm = () => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>('');

  const verificationToken: string = useSearchParams().get('token') || '';

  const onSubmit = useCallback(async () => {
    if (!verificationToken) setErrorMessage('Verifizierungscode fehlt');
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
    onSubmit();
  }, [onSubmit]);

  return (
    <div className="flex items-center w-full justify-center">
      {!errorMessage && !successMessage && <PulseLoader color="#555" />}
      <FormError message={errorMessage} />
      <FormSuccess message={successMessage} />
    </div>
  );
};
