import { AppMainContent } from '@/components/main/app-maincontent';
import { FilingSummary } from '@/components/main/dashboard/show-filing-summary';
import { FilingTrend } from '@/components/main/dashboard/show-filing-trend';
import { TopIssuers } from '@/components/main/dashboard/show-top-issuers';
import { TopReportingOwners } from '@/components/main/dashboard/show-top-owners';

export default function dashboardPage() {
  return (
    <AppMainContent pathComponents={[{ title: 'Dashboard', path: '/dashboard' }]}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FilingSummary />
        <FilingTrend />
        <TopIssuers />
        <TopReportingOwners />
      </div>
    </AppMainContent>
  );
}
