import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SetUserPasswordForm } from './set-user-password';
import { SetUserRoleForm } from './set-user-role';
import { DeleteUserForm } from './delete-user';

/**
 * Renders a div containing an accordion with options to edit a user's password, role or delete the user. Usable on dedicated user page or in user edit sheet
 * @param {string} userId - The user ID of the user to edit
 * @param {'single' | 'multiple'} displayType - The type of display to use for the accordion (single or multiple) --> single for user edit sheet, multiple for dedicated user page
 * @param {() => void} onClose - The optional callback function to use to close the dialog
 * @returns
 */
export default function EditUserContent({
  userId,
  displayType,
  onClose,
}: {
  userId: string;
  displayType: 'single' | 'multiple';
  onClose?: () => void;
}) {
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
