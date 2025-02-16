import { XMLParser } from 'fast-xml-parser';

/**
 *  Recursively replaces empty strings with null in an object.
 *
 * @param {Record<string, any>} obj - object to replace empty strings in
 * @returns {Record<string, any>} object with empty strings replaced with null
 */
function replaceEmptyStrings(obj: Record<string, any>): Record<string, any> {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(replaceEmptyStrings);
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      value === '' ? null : replaceEmptyStrings(value),
    ]),
  );
}

////////////////////////
// Ownership Forms Parser
////////////////////////

// define data types for tags within ownership forms with non-string or non-object values to ensure proper parsing
const arrayTags: string[] = [
  'reportingOwner',
  'ownerSignature',
  'nonDerivativeTransaction',
  'nonDerivativeHolding',
  'derivativeTransaction',
  'derivativeHolding',
  'footnote',
  'footnoteId',
];
const dateTimeTags: string[] = [
  'periodOfReport',
  'signatureDate',
  'transactionDate.value',
  'deemedExecutionDate.value',
  'exerciseDate.value',
  'expirationDate.value',
];
const booleanTags: string[] = [
  'noSecuritiesOwned',
  'notSubjectToSection16',
  'form3HoldingsReported',
  'form4TransactionsReported',
  'aff10b5One',
  'rptOwnerGoodAddress',
  'isDirector',
  'isOfficer',
  'isTenPercentOwner',
  'isOther',
  'equitySwapInvolved',
];
const floatTags: string[] = [
  'transactionShares.value',
  'transactionTotalValue.value',
  'sharesOwnedFollowingTransaction.value',
  'valueOwnedFollowingTransaction.value',
  'conversionOrExercisePrice.value',
  'underlyingSecurityShares.value',
  'underlyingSecurityValue.value',
  'transactionPricePerShare.value',
];

// Specific parser for ownership forms
const parser: XMLParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: 'text',
  allowBooleanAttributes: true,
  processEntities: false,
  ignoreDeclaration: true,
  isArray: (tagName) => {
    return arrayTags.includes(tagName);
  },
  parseTagValue: false,
  tagValueProcessor: (tagName, tagValue, jPath) => {
    if (dateTimeTags.some((x) => jPath.endsWith(`.${x}`)))
      return new Date(tagValue.substring(0, 10)).toISOString();
    if (booleanTags.some((x) => jPath.endsWith(`.${x}`)))
      return tagValue == '1' || tagValue.toLowerCase() == 'true';
    if (floatTags.some((x) => jPath.endsWith(`.${x}`))) return parseFloat(tagValue);
  },
});

/**
 *  Parses an ownership form XML string into a valid, prisma ready ownership form JSON object.
 *
 * @param {string} xmlData - the XML string containing the ownership form data.
 * @returns {Record<string,any>} parsed ownership form JSON object
 */
function parseOwnershipForm(xmlData: string): Record<string, any> {
  const parsedFilingData: Record<string, any> = replaceEmptyStrings(
    parser.parse(xmlData)['ownershipDocument'],
  );
  return parsedFilingData;
}

export { parseOwnershipForm };
