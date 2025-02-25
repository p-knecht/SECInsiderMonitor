'use client';
import { logout } from '@/actions/auth/logout';
import { PulseLoader } from 'react-spinners';

export const LogoutForm = () => {
  logout();
  return (
    <div className="flex items-center w-full justify-center">
      <PulseLoader color="#555" />
    </div>
  );
};
