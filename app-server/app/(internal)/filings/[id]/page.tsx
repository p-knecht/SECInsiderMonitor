import { AppMainContent } from '@/components/main/app-maincontent';
import ShowFilingContent from '@/components/main/filings/filing-content';

export default async function FilingPage(props: { params: Promise<{ id: string }> }) {
  const filingId = (await props.params).id;
  console.log(filingId);

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
