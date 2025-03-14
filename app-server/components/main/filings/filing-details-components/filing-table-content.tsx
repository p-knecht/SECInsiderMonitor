import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ReactNode } from 'react';

// code lists as specified by the SEC
const transactionCodes: Record<string, string> = {
  A: 'A: Grant, award or other acquisition pursuant to Rule 16b-3(d)',
  C: 'C: Conversion of derivative security',
  D: 'D: Disposition to the issuer of issuer equity securities pursuant to Rule 16b-3(e)',
  E: 'E: Expiration of short derivative position',
  F: 'F: Payment of exercise price or tax liability by delivering or withholding securities incident to the receipt, exercise or vesting of a security issued in accordance with Rule 16b-3',
  G: 'G: Bona fide gift',
  H: 'H: Expiration (or cancellation) of long derivative position with value received',
  I: 'I: Discretionary transaction in accordance with Rule 16b-3(f) resulting in acquisition or disposition of issuer securities',
  J: 'J: Other acquisition or disposition (describe transaction)',
  L: 'L: Small acquisition under Rule 16a-6',
  M: 'M: Exercise or conversion of derivative security exempted pursuant to Rule 16b-3',
  O: 'O: Exercise of out-of-the-money derivative security',
  P: 'P: Open market or private purchase of non-derivative or derivative security',
  S: 'S: Open market or private sale of non-derivative or derivative security',
  U: 'U: Disposition pursuant to a tender of shares in a change of control transaction',
  W: 'W: Acquisition or disposition by will or the laws of descent and distribution',
  X: 'X: Exercise of in-the-money or at-the-money derivative security',
  Z: 'Z: Deposit into or withdrawal from voting trust',
};

const timelinessCodes: Record<string, string> = {
  E: 'E: Early',
  L: 'L: Late',
  '-': 'On-time',
};

const acquiredDisposedCodes: Record<string, string> = {
  A: 'A: Acquired',
  D: 'D: Disposed',
};

const ownerTypeCodes: Record<string, string> = {
  D: 'D: Direct',
  I: 'I: Indirect',
};

// utility function to create a coded element with a tooltip
function createCodedElement(code: string, dictionary: Record<string, string>): ReactNode {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="underline decoration-dotted font-bold cursor-help text-gray-900">
          {code}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs">{dictionary[code] || 'Fehler: Unbekannter Code'}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// utility function to build the content of a field/cell
export function buildFieldContent(
  obj: any,
  footnotes: { id: string; text: string }[] = [],
  customType: string | null = null,
  unnumberFootnotes: boolean = false,
): ReactNode {
  // if object does not exist or is empty, set it to '-'
  if (obj == undefined || obj == null || obj === '') obj = '-';
  // if object is a string, number or date, return it directly
  if (obj instanceof Date) obj = obj.toLocaleDateString();
  if (typeof obj === 'string' || typeof obj === 'number')
    return <span className="font-bold text-gray-900">{obj}</span>;

  let value: string | number | Date | null | undefined | ReactNode = null;
  switch (customType) {
    case 'transactionTimeliness': // custom case for transactionTimeliness
      if (obj.value == '') obj.value = '-'; // if value is empty, set it to '-'
      value = createCodedElement(obj.value, timelinessCodes);
      break;
    case 'acquiredDisposedCode': // custom case for acquiredDisposedCode
      value = createCodedElement(obj.value, acquiredDisposedCodes);
      break;
    case 'directOrIndirectOwnership': // custom case for directOrIndirectOwnership
      value = createCodedElement(obj.value, ownerTypeCodes);
      break;
    case 'transactionAmounts': // custom case for transactionAmounts
      value = (
        <>
          <p className="text-gray-500 mb-1">
            Shares:
            <br />
            {buildFieldContent(obj.transactionShares, footnotes, null, unnumberFootnotes)}
          </p>
          {obj.transactionTotalValue && (
            <p className="text-gray-500 mb-1">
              Total Value:
              <br />
              {buildFieldContent('USD', footnotes, null, unnumberFootnotes)}{' '}
              {buildFieldContent(obj.transactionTotalValue, footnotes, null, unnumberFootnotes)}
            </p>
          )}
          <p className="text-gray-500 mb-1">
            Price Per Share:
            <br /> {buildFieldContent('USD', footnotes, null, unnumberFootnotes)}{' '}
            {buildFieldContent(obj.transactionPricePerShare, footnotes, null, unnumberFootnotes)}
          </p>
          <p className="text-gray-500 mb-1">
            Acquired/Disposed:
            <br />
            {buildFieldContent(
              obj.transactionAcquiredDisposedCode,
              footnotes,
              'acquiredDisposedCode',
              unnumberFootnotes,
            )}
          </p>
        </>
      );
      break;
    case 'ownershipNature': // custom case for ownershipNature
      value = (
        <>
          <p className="text-gray-500 mb-1">
            Direct/Indirect Ownership:
            <br />
            {buildFieldContent(
              obj.directOrIndirectOwnership,
              footnotes,
              'directOrIndirectOwnership',
              unnumberFootnotes,
            )}
          </p>
          {obj.directOrIndirectOwnership.value.toUpperCase() === 'I' && (
            <p className="text-gray-500 mb-1">
              Nature of Ownership:
              <br />
              {buildFieldContent(obj.natureOfOwnership, footnotes, null, unnumberFootnotes)}
            </p>
          )}
        </>
      );
      break;
    case 'underlyingSecurity': // custom case for underlyingSecurity
      value = (
        <>
          <p className="text-gray-500 mb-1">
            Title:
            <br />
            {buildFieldContent(obj.underlyingSecurityTitle, footnotes, null, unnumberFootnotes)}
          </p>
          <p className="text-gray-500 mb-1">
            Shares:
            <br />
            {buildFieldContent(obj.underlyingSecurityShares, footnotes, null, unnumberFootnotes)}
          </p>
          {obj.underlyingSecurityValue && (
            <p className="text-gray-500 mb-1">
              Value:
              <br />
              {buildFieldContent('USD', footnotes, null, unnumberFootnotes)}{' '}
              {buildFieldContent(obj.underlyingSecurityValue, footnotes, null, unnumberFootnotes)}
            </p>
          )}
        </>
      );
      break;
    case 'postTransactionAmounts': // custom case for postTransactionAmounts
      value = // if sharesOwnedFollowingTransaction or valueOwnedFollowingTransaction exist, display them --> according to SEC specifications one of them must exist
        (
          <>
            {obj.sharesOwnedFollowingTransaction && (
              <p className="text-gray-500 mb-1">
                Shares Owned:
                <br />
                {buildFieldContent(
                  obj.sharesOwnedFollowingTransaction,
                  footnotes,
                  null,
                  unnumberFootnotes,
                )}
              </p>
            )}{' '}
            {obj.valueOwnedFollowingTransaction && (
              <p className="text-gray-500 mb-1">
                Value Owned:
                <br />
                {buildFieldContent('USD', footnotes, null, unnumberFootnotes)}{' '}
                {buildFieldContent(
                  obj.valueOwnedFollowingTransaction,
                  footnotes,
                  null,
                  unnumberFootnotes,
                )}
              </p>
            )}
          </>
        );
      break;
    case 'transactionCoding': // custom case for transactionCoding
      value = (
        <>
          {obj.transactionCode && (
            <p className="text-gray-500 mb-1">
              Transaction Code:
              <br />
              {createCodedElement(obj.transactionCode, transactionCodes)}
            </p>
          )}
          {obj.transactionFormType && (
            <p className="text-gray-500 mb-1">
              Form Type:
              <br />
              {buildFieldContent(obj.transactionFormType, footnotes, null, unnumberFootnotes)}
            </p>
          )}
          {obj.equitySwapInvolved !== undefined && (
            <p className="text-gray-500 mb-1">
              Equity Swap:
              <br />
              <span className="font-bold text-gray-900">
                {obj.equitySwapInvolved ? 'Yes' : 'No'}
              </span>
            </p>
          )}
        </>
      );
      break;
    default: // default case: return the value of the object
      value = buildFieldContent(obj.value, footnotes, null, unnumberFootnotes);
      break;
  }

  // lookup attached footnotes and format them
  const footnotesMap = new Map(footnotes.map(({ id, text }) => [id, text]));

  const footNotes = obj.footnoteId?.map(({ id }: { id: string }) => {
    const footnoteText = footnotesMap.get(id) || 'Fehler: Verweis konnte nicht aufgelöst werden.';
    return (
      <Tooltip key={id}>
        <TooltipTrigger asChild>
          <sup className="ml-0.5 text-xs text-blue-600 cursor-help">
            [{unnumberFootnotes ? 'FN' : id}]
          </sup>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">
            <span className="text-blue-300 font-bold">[{unnumberFootnotes ? 'FN' : id}] </span>
            {footnoteText}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  });

  return (
    <span>
      {value}
      {footNotes}
    </span>
  );
}
