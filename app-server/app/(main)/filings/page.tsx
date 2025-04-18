import { DataTable } from '@/components/main/data-table/data-table';
import { FormError } from '@/components/form-error';
import { columns, OwnershipFilingColumn } from './columns';
import { AppMainContent } from '@/components/main/app-maincontent';
import { filingsTableParamatersSchema } from '@/schemas';
import { aggregateRawOwnershipFilingsWithDecode } from '@/lib/dbconnector';
import { buildFilter } from '@/lib/tablefilter';
import { parseIssuer, parseReportingOwners } from '@/data/cik';

/**
 * Defines the available search parameters for the filing table.
 */
interface FilingsPageSearchParams {
  page?: string;
  pageSize?: string;
  sort?: string;
  order?: string;
  [key: string]: string | string[] | undefined;
}

/**
 * Wraps the FilingsPageSearchParams in a Promise to allow for async loading of this page
 */
interface FilingsPageProps {
  searchParams: Promise<FilingsPageSearchParams>;
}

/**
 * Renders the main content of the filing table page
 *
 * @param {FilingsPageProps} - The search parameters for the filing table
 * @returns - The filing table page layout containing an overview of all filings.
 */
export default async function FilingsPage({ searchParams: searchParams }: FilingsPageProps) {
  // default values
  let page = 1;
  let pageSize = 10;
  let parsingError = '';
  let totalCount = 0;
  let filings: OwnershipFilingColumn[] = [];

  // Parse search parameters to prevent malicious input
  const parsedParams = filingsTableParamatersSchema.safeParse(await searchParams);
  let validParams: FilingsPageSearchParams = {};
  if (parsedParams.success) {
    validParams = parsedParams.data;
  } else {
    parsingError =
      'Ungültige Parameter wurden entfernt. Detaillierter Fehlerbeschrieb: ' +
      JSON.stringify(parsedParams.error.format(), null, 2);

    // only copy successfully parsed parameters to validParams
    validParams = Object.fromEntries(
      Object.entries(await searchParams).filter(
        ([key]) =>
          (parsedParams.error.format() as Record<string, any>)[key] === undefined &&
          key in filingsTableParamatersSchema.shape,
      ),
    );
  }

  // Handle pagination parameters
  if (validParams.page && !isNaN(parseInt(validParams.page, 10)))
    page = parseInt(validParams.page, 10);
  if (validParams.pageSize && !isNaN(parseInt(validParams.pageSize, 10)))
    pageSize = parseInt(validParams.pageSize, 10);

  // Handle sorting parameters
  let sortColumn = validParams.sort || 'periodOfReport'; // Default to sorting by periodOfReport
  const sortOrder = validParams.order || 'desc'; // Default to descending order (--> most recent entry first)

  // translate simplified sorting columns to actual nested column names
  if (sortColumn === 'issuer') sortColumn = 'formData.issuer.issuerTradingSymbol';
  else if (sortColumn === 'periodOfReport') sortColumn = 'formData.periodOfReport';
  else if (sortColumn === 'reportingOwner')
    sortColumn = 'formData.reportingOwner.0.reportingOwnerId.rptOwnerName'; // note: we are always sorting by the first reporting owner to be consistent with the table display

  // Handle filtering parameters
  let filter = buildFilter(validParams, 'filing', true);

  const totalCountResult = await aggregateRawOwnershipFilingsWithDecode({
    pipeline: [{ $match: filter }, { $count: 'total' }],
  });
  if (Array.isArray(totalCountResult) && totalCountResult.length > 0)
    totalCount = (totalCountResult[0] as { total: number }).total;
  else totalCount = 0;

  // if page is out of bounds, set it to the last page
  if (page > Math.ceil(totalCount / pageSize)) {
    page = Math.ceil(totalCount / pageSize);
  }

  if (0 < totalCount) {
    const rawFilings = await aggregateRawOwnershipFilingsWithDecode({
      pipeline: [
        { $match: filter },
        {
          $sort: {
            [sortColumn]: sortOrder === 'asc' ? 1 : -1,
            filingId: sortOrder === 'asc' ? 1 : -1, // always sort by filingId as a secondary sort key to ensure consistent ordering
          },
        },
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
      ],
    });

    // Parse the raw filings into a format that can be displayed in the table
    if (Array.isArray(rawFilings) && rawFilings.length > 0) {
      filings = rawFilings.map((filing) => ({
        filingId: filing.filingId ?? 'Unknown ID',
        formType: filing.formType ?? 'Unknown Form',
        periodOfReport: filing.formData?.periodOfReport?.$date
          ? new Date(filing.formData.periodOfReport.$date)
          : undefined,
        issuer: parseIssuer(filing) ?? { cik: 'unknown CIK', cikName: 'unknown name' },
        reportingOwner: parseReportingOwners(filing),
        dateFiled: filing.dateFiled?.$date ? new Date(filing.dateFiled.$date) : undefined,
      }));
    }
  }

  return (
    <AppMainContent pathComponents={[{ title: 'Einreichungen', path: '/filings' }]}>
      <FormError message={parsingError} />
      <div className="flex justify-center">
        <DataTable
          columns={columns}
          data={filings}
          totalCount={totalCount}
          currentPage={page}
          pageSize={pageSize}
        />
      </div>
    </AppMainContent>
  );
}
