export interface CikObject {
  cik: string;
  cikName: string;
  cikTicker?: string;
}

export const parseIssuer = (filing: any): CikObject | null => {
  if (!filing?.formData?.issuer) {
    return null;
  }

  return {
    cik: filing.formData.issuer.issuerCik ?? 'unknown CIK',
    cikName: filing.formData.issuer.issuerName.replace(/&amp;/g, '&') ?? 'unknown name',
    cikTicker: filing.formData.issuer.issuerTradingSymbol ?? undefined,
  };
};

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
