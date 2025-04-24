import { auth } from '@/auth';
import { AnalysisSchema } from '@/schemas';
import { z } from 'zod';
import { lookupCik } from '@/actions/main/filings/loopkup-cik';

/**
 * Prepared and validated input data for the analysis
 */
export interface AuthenticatedAnalysisResult {
  error?: string;
  queryParams?: {
    cik: string;
    depth?: number;
    from: string;
    to: string;
  };
  queryCikInfo?: {
    cikName: string;
    cikTicker?: string;
  };
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Auxiliary function to authenticate the user and handle the input data for the analysis (network and company)
 * @param {z.infer<typeof AnalysisSchema>} data - input data from the client (containing CIK, from, to and optionally depth)
 * @param {boolean} depthUsed - flag indicating if the depth parameter is used in the analysis
 * @returns {Promise<AuthenticatedAnalysisResult>} - a promise with the prepared and validated input data for the analysis
 */
export async function authenticateAndHandleInputs(
  data: z.infer<typeof AnalysisSchema>,
  depthUsed: boolean,
): Promise<AuthenticatedAnalysisResult> {
  // revalidate received (unsafe) values from client
  const validatedData = AnalysisSchema.safeParse(data);
  if (!validatedData.success) return { error: 'Ungültige Anfrage' };

  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return { error: 'Nicht authentifiziert' };

  // check depth parameter (might be mandatory or forbidden, depending on the analysis context)
  if (depthUsed && !validatedData.data.depth) return { error: "Suchparameter 'depth' fehlt" };
  if (!depthUsed && validatedData.data.depth)
    return { error: "Suchparameter 'depth' darf nicht definiert sein" };

  // verify analysis time frame
  const fromDate = new Date(validatedData.data.from);
  const toDate = new Date(validatedData.data.to);
  if (fromDate > toDate) return { error: 'Startdatum muss vor Enddatum liegen' };
  if (toDate > new Date()) return { error: 'Enddatum darf nicht in der Zukunft liegen' };
  if ((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24) > 365.25 * 5)
    return { error: 'Der Analyse-Zeitraum darf maximal 5 Jahre betragen' };

  // verify cik and prepare queryCikInfo
  const cikInfo = await lookupCik({ cik: validatedData.data.cik });
  if (!cikInfo) return { error: 'CIK nicht gefunden' };

  // return prepared input data
  return {
    queryCikInfo: {
      cikName: cikInfo.cikName,
      cikTicker:
        cikInfo.cikTicker &&
        cikInfo.cikTicker.toUpperCase() !== 'NONE' &&
        cikInfo.cikTicker.toUpperCase() !== 'N/A'
          ? cikInfo.cikTicker
          : undefined,
    },
    queryParams: {
      ...validatedData.data,
      ...(depthUsed ? { depth: validatedData.data.depth || 3 } : {}),
    },
    fromDate,
    toDate,
  };
}
