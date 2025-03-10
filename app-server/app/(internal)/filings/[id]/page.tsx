import { AppMainContent } from '@/components/main/app-maincontent';
import ShowFilingContent from '@/components/main/filings/filing-content';

interface FilingPageProps {
  params: {
    id: string;
  };
}

export default async function EditUserPage({ params }: FilingPageProps) {
  const filingId = (await params).id;

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
