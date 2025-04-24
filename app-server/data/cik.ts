/**
 * Defines the contents of a CIK object.
 */
export interface CikObject {
  cik: string;
  cikName: string;
  cikTicker?: string;
}

/**
 * Parses the issuer information from a filing to a CIK object.
 *
 * @param {any} filing - The SEC filing to be parsed
 * @returns {CikObject | null} - The CIK object representing the issuer, or null if the issuer information is not present
 */
export const parseIssuer = (filing: any): CikObject | null => {
  if (!filing?.formData?.issuer) {
    return null;
  }

  if (
    filing.formData.issuer.issuerTradingSymbol.toLowerCase() === 'none' ||
    filing.formData.issuer.issuerTradingSymbol.toLowerCase() === 'n/a'
  )
    filing.formData.issuer.issuerTradingSymbol = undefined;

  return {
    cik: filing.formData.issuer.issuerCik ?? 'unknown CIK',
    cikName: filing.formData.issuer.issuerName ?? 'unknown name',
    cikTicker: filing.formData.issuer.issuerTradingSymbol ?? undefined,
  };
};

/**
 * Parses the reporting owners from a filing to an array of CIK objects.
 *
 * @param {any} filing - The SEC filing to be parsed
 * @returns {CikObject[]} - The CIK objects representing the reporting owners of the filing (empty array if no reporting owners are present)
 */
export const parseReportingOwners = (filing: any): CikObject[] => {
  if (!filing?.formData?.reportingOwner || !Array.isArray(filing.formData.reportingOwner)) {
    return [];
  }

  return filing.formData.reportingOwner.map((owner: any) => ({
    cik: owner.reportingOwnerId?.rptOwnerCik ?? 'unknown CIK',
    cikName: owner.reportingOwnerId?.rptOwnerName ?? 'unknown name',
    cikTicker: undefined,
  }));
};
