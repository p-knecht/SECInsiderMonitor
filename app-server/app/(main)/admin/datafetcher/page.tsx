import fs from 'fs';
import path from 'path';
import { RoleGate } from '@/components/role-gate';
import { AppMainContent } from '@/components/main/app-maincontent';
import { UserRole } from '@prisma/client';
import LogfileList from '@/components/main/admin/datafetcher/logfile-listing';
import { Card, CardContent } from '@/components/ui/card';
import { LogfileSchema } from '@/schemas';
import { auth } from '@/auth';

/**
 * Represents a logfile with its filename and state.
 */
export interface Logfile {
  filename: string;
  state: 'ok' | 'warn' | 'error' | 'unknown';
}

/**
 * Renders the main content of the datafetcher logs page.
 *
 * @returns {JSX.Element} - The datafetcher logs page layout containing a list of logfiles and their content
 */
export default async function datafetcherPage() {
  const LOG_DIR = 'logs';

  /**
   * Auxiliary function to check the state of a logfile.
   * @param {string} logfile - content of the logfile to check
   * @returns {Logfile['state']} - the state of the logfile
   */
  function checkLogfileState(logfile: string): Logfile['state'] {
    const filePath = path.join(LOG_DIR, logfile);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      if (['[ERROR]', '[FATAL]'].some((keyword) => fileContent.includes(keyword))) return 'error'; // check for [ERROR] or [FATAL] in the logfile --> error state
      if (fileContent.includes('[WARN]')) return 'warn'; // check for [WARN] in the logfile --> warn state
      return 'ok'; // no error, warn or fatal found --> ok state
    } catch (error) {
      return 'unknown'; // file not found or other error --> unknown state
    }
  }

  let logfiles: Logfile[] = [];
  // only show logfiles when the user is an admin and the log directory exists
  if ((await auth())?.user?.role === UserRole.admin && fs.existsSync(LOG_DIR)) {
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
