import { ChangePasswordForm } from '@/components/main/account/change-password';
import { DeleteAccountForm } from '@/components/main/account/delete-account';
import { AppMainContent } from '@/components/main/app-maincontent';

/**
 * Renders the main content of the account management page.
 *
 * @returns {JSX.Element} - The account page layout with password change and account deletion forms.
 */
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
