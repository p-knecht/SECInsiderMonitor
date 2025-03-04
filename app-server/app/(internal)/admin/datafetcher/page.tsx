import fs from 'fs';
import path from 'path';
import { RoleGate } from '@/components/auth/role-gate';
import { AppMainContent } from '@/components/main/app-maincontent';
import { UserRole } from '@prisma/client';
import LogfileList from '@/components/main/admin/datafetcher/logfile-listing';
import { Card, CardContent } from '@/components/ui/card';
import { currentUser } from '@/lib/auth';
import { LogfileSchema } from '@/schemas';

export interface Logfile {
  filename: string;
  state: 'ok' | 'warn' | 'error' | 'unknown';
}

export default async function datafetcherPage() {
  const LOG_DIR = 'logs';

  // Check the overall state of a logfile (to allow a quick overview in the frontend)
  function checkLogfileState(logfile: string): Logfile['state'] {
    const filePath = path.join(LOG_DIR, logfile);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      if (['[ERROR]', '[FATAL]'].some((keyword) => fileContent.includes(keyword))) return 'error';
      if (fileContent.includes('[WARN]')) return 'warn';
      return 'ok';
    } catch (error) {
      return 'unknown';
    }
  }

  let logfiles: Logfile[] = [];
  if ((await currentUser())?.role === UserRole.admin) {
    // Load all logfiles and sort them by date (only when the user is an admin)
    logfiles = fs
      .readdirSync(LOG_DIR)
      .filter((file) => LogfileSchema.safeParse(file).success)
      .map((file) => ({
        filename: file,
        state: checkLogfileState(file),
      }))
      .sort((a, b) => b.filename.localeCompare(a.filename));
  }

  return (
    <AppMainContent
      pathComponents={[
        { title: 'Administration', path: undefined },
        { title: 'Datafetcher-Logs', path: '/admin/datafetcher' },
      ]}
    >
      <RoleGate roles={[UserRole.admin]}>
        <Card className="shadow-md border bg-white">
          <CardContent>
            {logfiles.length === 0 ? (
              <p className="text-gray-500">Keine Logfiles gefunden.</p>
            ) : (
              <LogfileList logfiles={logfiles} />
            )}
          </CardContent>
        </Card>
      </RoleGate>
    </AppMainContent>
  );
}
