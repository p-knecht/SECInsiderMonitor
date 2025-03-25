import { AppMainContent } from '@/components/main/app-maincontent';
import ShowFilingContent from '@/components/main/filings/filing-content';

/**
 * Renders the main content of the filing details page.
 *
 * @param {Promise<{ id: string }>} props.params - The filing ID to display.
 * @returns {JSX.Element} - The filing details page layout with filing information.
 */
export default async function FilingPage(props: { params: Promise<{ id: string }> }) {
  const filingId = (await props.params).id;
  return (
    <AppMainContent
      pathComponents={[
        { title: 'Einreichungen', path: '/filings' },
        { title: 'Einreichung anzeigen', path: `/filings/${filingId}` },
      ]}
    >
      <ShowFilingContent filingId={filingId} type="page" />
    </AppMainContent>
  );
}
