import { CardWrapper } from '@/components/auth/card-wrapper';
import { LogoutForm } from '@/components/auth/logout-form';

export default function VerifyPage() {
  return (
    <CardWrapper cardTitle="Abmeldung" cardDescription="Abmeldung wird durchgeführt...">
      <LogoutForm />
    </CardWrapper>
  );
}
