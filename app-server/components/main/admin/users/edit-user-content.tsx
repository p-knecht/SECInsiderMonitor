import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useSession } from 'next-auth/react';
import { SetUserPasswordForm } from './set-user-password';
import { FormError } from '@/components/form-error';
import { SetUserRoleForm } from './set-user-role';
import { DeleteUserForm } from './delete-user';

export default function EditUserContent({
  userId,
  displayType,
  onClose,
}: {
  userId: string;
  displayType: 'single' | 'multiple';
  onClose?: () => void;
}) {
  // only show edit options if user id is not same as current user

  return (
    <div className="pl-4 pr-4 rounded-lg border bg-white">
      <Accordion type={displayType} collapsible>
        <AccordionItem value="set-password">
          <AccordionTrigger>Passwort ändern</AccordionTrigger>
          <AccordionContent>
            <SetUserPasswordForm userId={userId} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="set-role">
          <AccordionTrigger>Benutzerrolle ändern</AccordionTrigger>
          <AccordionContent>
            <SetUserRoleForm userId={userId} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="delete-user">
          <AccordionTrigger>Benutzer löschen</AccordionTrigger>
          <AccordionContent>
            <DeleteUserForm userId={userId} onClose={onClose} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
