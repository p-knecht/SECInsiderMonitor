'use server';

import { auth } from '@/auth';
import { getUserById } from '@/data/user';
import { LogfileSchema } from '@/schemas';
import { UserRole } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const LOG_DIR = 'logs';

export async function loadLogfile(logfile: string): Promise<string> {
  // revalidate received (unsafe) values from client
  const validatedData = LogfileSchema.safeParse(logfile);
  if (!validatedData.success) return 'Ungültiger Logfile-Name';

  // get user session
  const session = await auth();
  if (!session?.user.id) return 'Ungültige Sitzung';

  // get requesting user object
  const requestingUser = await getUserById(session.user.id);
  if (!requestingUser) return 'Anfragender Benutzer existiert nicht';

  // check if user has permission to read logfiles (only admins are allowed)
  if (requestingUser?.role != UserRole.admin)
    return 'Der anfragende Benutzer hat keine Berechtigung für diese Aktion';

  const filePath = path.join(LOG_DIR, logfile);
  try {
    if (!fs.existsSync(filePath)) return 'Fehler: Logfile nicht gefunden.';

    // read and return logfile content
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return 'Fehler beim Laden des Logfiles.';
  }
}
