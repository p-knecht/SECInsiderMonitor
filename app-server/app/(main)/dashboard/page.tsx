import { AppMainContent } from '@/components/main/app-maincontent';
import { FilingSummary } from '@/components/main/dashboard/show-filing-summary';
import { FilingTrend } from '@/components/main/dashboard/show-filing-trend';
import { TopIssuers } from '@/components/main/dashboard/show-top-issuers';
import { TopReportingOwners } from '@/components/main/dashboard/show-top-owners';

/**
 * Renders the main content of the dashboard page.
 *
 * @returns {JSX.Element} - The dashboard page layout containing an a summary of the latest filings, a trend chart of the latest filings, a list of the top issuers and a list of the top reporting owners.
 */
export default function DashboardPage() {
  return (
    <AppMainContent pathComponents={[{ title: 'Dashboard', path: '/dashboard' }]}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <FilingSummary />
        <FilingTrend />
        <TopIssuers />
        <TopReportingOwners />
      </div>
    </AppMainContent>
  );
}
