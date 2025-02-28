import { ChangePasswordForm } from '@/components/main/account/change-password';
import { DeleteAccountForm } from '@/components/main/account/delete-account';
import { AppMainContent } from '@/components/main/app-maincontent';

export default function accountPage() {
  return (
    <AppMainContent pathComponents={[{ title: 'Konto verwalten', path: '/account' }]}>
      <div className="flex flex-col sm:flex-row gap-8 justify-center">
        <ChangePasswordForm />
        <DeleteAccountForm />
      </div>
    </AppMainContent>
  );
}
