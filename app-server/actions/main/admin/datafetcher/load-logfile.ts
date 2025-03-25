'use server';

import { auth } from '@/auth';
import { dbconnector } from '@/lib/dbconnector';
import { LogfileSchema } from '@/schemas';
import { UserRole } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const LOG_DIR = 'logs';

/**
 * Loads the content of a logfile from the server (only admins are allowed to read logfiles)
 *
 * @param {string} logfile - Name of the logfile to load
 * @returns {Promise<string>} - Promise with the content of the logfile
 */
export async function loadLogfile(logfile: string): Promise<string> {
  // revalidate received (unsafe) values from client
  const validatedData = LogfileSchema.safeParse(logfile);
  if (!validatedData.success) return 'Ungültiger Logfile-Name';

  // get user session
  const session = await auth();
  if (!session?.user.id) return 'Ungültige Sitzung';

  // get requesting user object
  const requestingUser = await dbconnector.user.findUnique({
    where: { id: session.user.id },
  });
  if (!requestingUser) return 'Benutzer existiert nicht';

  // check if user has permission to read logfiles (only admins are allowed)
  if (requestingUser?.role != UserRole.admin)
    return 'Der anfragende Benutzer hat keine Berechtigung für diese Aktion';

  const filePath = path.join(LOG_DIR, logfile);
  try {
    // check if logfile exists
    if (!fs.existsSync(filePath)) return 'Fehler: Logfile nicht gefunden.';

    // read and return logfile content
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return 'Fehler beim Laden des Logfiles.';
  }
}
