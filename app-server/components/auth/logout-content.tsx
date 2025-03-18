'use client';
import { useEffect } from 'react';
import { logout } from '@/actions/auth/logout';
import { PulseLoader } from 'react-spinners';

/**
 * Renders logout content showing a loading spinner while the user is being logged out.
 *
 * @returns {JSX.Element} - The rendered logout component
 */
export const LogoutContent = () => {
  useEffect(() => {
    const timeout = setTimeout(async () => {
      await logout(); // server-side logout
    }, 1000); // start logout procedure after 1 second

    return () => clearTimeout(timeout); // clear timeout
  }, []);

  return (
    <div className="flex items-center w-full justify-center">
      <PulseLoader color="#555" />
    </div>
  );
};
