'use client';

import { OwnershipFiling, ReportingRelationship } from '@prisma/client';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Building2, CheckIcon, Network, XIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';

/**
 * Renders a component that displays the main information from the header of the filing like issuer information, additional filing information ("flags") and reporting owner information.
 *
 * @param {OwnershipFiling} filingData - The filing data to display
 * @returns {JSX.Element} - The component that displays the main information from the header of the filing
 */
export default function FilingHeader({ filingData }: { filingData: OwnershipFiling }) {
  const { formData } = filingData;
  const router = useRouter();

  const renderBoolean = (value?: boolean | null) => (
    <span className="flex items-center gap-1">
      {value ? (
        <CheckIcon className="w-5 h-5 text-green-600" />
      ) : (
        <XIcon className="w-5 h-5 text-red-600" />
      )}
      {value ? 'Ja' : 'Nein'}
    </span>
  );

  const getRoles = (relationship: ReportingRelationship) =>
    [
      relationship.isDirector && 'Director',
      relationship.isOfficer &&
        (relationship.officerTitle ? `Officer (${relationship.officerTitle})` : 'Officer'),
      relationship.isTenPercentOwner && '10% Owner',
      relationship.isOther &&
        (relationship.otherText ? `Other (${relationship.otherText})` : 'Other'),
    ]
      .filter(Boolean)
      .join('; ');

  // calculate dates for usage in links for analysis pages
  const fromDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
    .toISOString()
    .split('T')[0];
  const toDate = new Date().toISOString().split('T')[0];

  const items = [
    {
      title: 'Issuer Information',
      data: [
        { label: 'Issuer Name:', value: formData?.issuer?.issuerName },
        {
          label: 'Issuer CIK:',
          value: (
            <span className="flex items-center gap-2">
              {formData?.issuer?.issuerCik}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Building2
                    className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-800"
                    onClick={() =>
                      router.push(
                        `/company-analysis?cik=${formData?.issuer?.issuerCik}&from=${fromDate}&to=${toDate}`,
                      )
                    }
                  />
                </TooltipTrigger>
                <TooltipContent>Unternehmensanalyse öffnen</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Network
                    className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-800"
                    onClick={() =>
                      router.push(
                        `/network-analysis?cik=${formData?.issuer?.issuerCik}&from=${fromDate}&to=${toDate}&depth=3`,
                      )
                    }
                  />
                </TooltipTrigger>
                <TooltipContent>Netzwerkanalyse öffnen</TooltipContent>
              </Tooltip>
            </span>
          ),
        },
        { label: 'Trading Symbol:', value: formData?.issuer?.issuerTradingSymbol },
      ],
    },
    {
      title: 'Additional Filing Information',
      data: [
        {
          forms: ['3', '4', '5'],
          label: 'Period of Report:',
          value: formData?.periodOfReport
            ? new Date(formData.periodOfReport).toLocaleDateString()
            : 'N/A',
        },
        {
          forms: ['3'],
          label: 'No Securities Owned:',
          value: renderBoolean(formData?.noSecuritiesOwned),
        },
        {
          forms: ['4', '5'],
          label: 'Not Subject to Section 16:',
          value: renderBoolean(formData?.notSubjectToSection16),
        },
        {
          forms: ['5'],
          label: 'Form 3 Holdings Reported:',
          value: renderBoolean(formData?.form3HoldingsReported),
        },
        {
          forms: ['5'],
          label: 'Form 4 Transactions Reported:',
          value: renderBoolean(formData?.form4TransactionsReported),
        },
        {
          forms: ['3', '4', '5'],
          label: '10b5-1 Trading Plan:',
          value: renderBoolean(formData?.aff10b5One),
        },
      ].filter(({ forms }) => forms.includes(filingData.formType)),
    },
  ];
  return (
    <div className="flex gap-3 flex-col lg:flex-row w-full">
      <div className="flex flex-col gap-3 w-full lg:flex-1 2xl:flex-row">
        {items.map(({ title, data }) => (
          <Card key={title} className="border shadow-sm py-3 2xl:flex-1">
            <CardContent className="flex flex-col gap-2">
              <CardTitle className="font-semibold text-gray-800 pb-1">{title}</CardTitle>
              {data.map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <span className="min-w-36 max-w-36 font-medium text-gray-400">{label}</span>
                  <span className="text-gray-900 break-words">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border shadow-sm py-3 lg:flex-1">
        <CardContent className="flex flex-col gap-2">
          <CardTitle className="font-semibold text-gray-800 pb-1">
            Reporting Owner Information
          </CardTitle>
          {formData?.reportingOwner?.length ? (
            formData.reportingOwner.map((owner, index) => (
              <div key={index} className="border rounded-md p-1 px-2 bg-gray-50">
                <p className="text-sm text-gray-900">{owner.reportingOwnerId.rptOwnerName}</p>
                <p className="text-sm text-gray-900">
                  <span className="flex items-center gap-2">
                    CIK: ({owner.reportingOwnerId.rptOwnerCik})
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Network
                          className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-800"
                          onClick={() =>
                            router.push(
                              `/network-analysis?cik=${owner.reportingOwnerId.rptOwnerCik}&from=${fromDate}&to=${toDate}&depth=3`,
                            )
                          }
                        />
                      </TooltipTrigger>
                      <TooltipContent>Netzwerkanalyse öffnen</TooltipContent>
                    </Tooltip>
                  </span>
                </p>

                {owner.reportingOwnerAddress && (
                  <p className="text-[10px] text-gray-400">
                    Address (
                    {owner.reportingOwnerAddress.rptOwnerGoodAddress ? 'verified' : 'not verified'}
                    ): {owner.reportingOwnerAddress.rptOwnerStreet1}
                    {owner.reportingOwnerAddress.rptOwnerStreet2 &&
                      `, ${owner.reportingOwnerAddress.rptOwnerStreet2}`}{' '}
                    | {owner.reportingOwnerAddress.rptOwnerCity},{' '}
                    {owner.reportingOwnerAddress.rptOwnerState}{' '}
                    {owner.reportingOwnerAddress.rptOwnerZipCode}
                    {owner.reportingOwnerAddress.rptOwnerStateDescription &&
                      ` (${owner.reportingOwnerAddress.rptOwnerStateDescription})`}
                  </p>
                )}
                <p className="text-sm text-gray-700 mt-2">
                  <span className="font-semibold">Role(s):</span>{' '}
                  {getRoles(owner.reportingOwnerRelationship)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center w-full">Keine Reporting Owner vorhanden.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
