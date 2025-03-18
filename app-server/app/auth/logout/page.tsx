import { CardWrapper } from '@/components/auth/card-wrapper';
import { LogoutContent } from '@/components/auth/logout-content';

/**
 * Renders the content of the logout page.
 *
 * @returns {JSX.Element} - The logout page layout containing the logout spinner.
 */
export default function LogoutPage() {
  return (
    <CardWrapper cardTitle="Abmeldung" cardDescription="Abmeldung wird durchgeführt...">
      <LogoutContent />
    </CardWrapper>
  );
}
