'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { OwnershipFiling } from '@prisma/client';
import FilingHeader from '@/components/main/filings/filing-details-components/filing-header';
import FilingDerivatives from '@/components/main/filings/filing-details-components/filing-derivatives';
import FilingNonDerivatives from '@/components/main/filings/filing-details-components/filing-nonderivatives';
import FilingFootnotes from '@/components/main/filings/filing-details-components/filing-footnotes';
import FilingRemarks from '@/components/main/filings/filing-details-components/filing-remarks';
import FilingSignatures from '@/components/main/filings/filing-details-components/filing-signatures';

export default function FilingContentDetails({
  filingData,
  type,
}: {
  filingData: OwnershipFiling;
  type: 'page' | 'sheet';
}) {
  return (
    <>
      <div className="px-3 rounded-lg border shadow-sm">
        <Accordion
          type={type == 'sheet' ? 'single' : 'multiple'}
          collapsible={type === 'sheet' ? true : undefined}
        >
          <AccordionItem value="header">
            <AccordionTrigger className="pl-2 font-semibold text-gray-800">
              Filing Header
            </AccordionTrigger>
            <AccordionContent>
              <FilingHeader filingData={filingData} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="non-derivatives">
            <AccordionTrigger className="pl-2 font-semibold text-gray-800">
              Non-Derivative Tables
            </AccordionTrigger>
            <AccordionContent>
              <FilingNonDerivatives filingData={filingData} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="derivatives">
            <AccordionTrigger className="pl-2 font-semibold text-gray-800">
              Derivative Tables
            </AccordionTrigger>
            <AccordionContent>
              <FilingDerivatives filingData={filingData} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="footnotes">
            <AccordionTrigger className="pl-2 font-semibold text-gray-800">
              Footnotes
            </AccordionTrigger>
            <AccordionContent>
              <FilingFootnotes filingData={filingData} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="remarks">
            <AccordionTrigger className="pl-2 font-semibold text-gray-800">
              Remarks
            </AccordionTrigger>
            <AccordionContent>
              <FilingRemarks filingData={filingData} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="signatures">
            <AccordionTrigger className="pl-2 font-semibold text-gray-800">
              Owner Signatures
            </AccordionTrigger>
            <AccordionContent>
              <FilingSignatures filingData={filingData} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
}
