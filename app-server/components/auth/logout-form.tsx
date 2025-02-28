'use client';
import { useEffect } from 'react';
import { logout } from '@/actions/auth/logout';
import { PulseLoader } from 'react-spinners';

export const LogoutForm = () => {
  useEffect(() => {
    const timeout = setTimeout(async () => {
      await logout();
    }, 1000); // start logout after 1 second

    return () => clearTimeout(timeout); // Cleanup-Funktion
  }, []);

  return (
    <div className="flex items-center w-full justify-center">
      <PulseLoader color="#555" />
    </div>
  );
};
