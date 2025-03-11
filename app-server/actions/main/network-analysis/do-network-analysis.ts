'use server';

import * as z from 'zod';
import { dbconnector } from '@/lib/dbconnector';
import { auth } from '@/auth';
import { AnalysisSchema } from '@/schemas';
import { lookupCik } from '../filings/loopkup-cik';

export interface NetworkAnalysisData {
  title?: string;
  subtitle?: string;
  error?: string;
  nodes?: {
    cik: string;
    cikInfo: {
      cikName: string;
      cikTicker?: string;
    };
    stratum: number;
  }[];
  edges?: {
    issuerCik: string;
    ownerCik: string;
    relationTypes: string[];
    retiredRelation?: boolean;
    latestDateFiled: Date;
  }[];
  queryParams?: {
    cik: string;
    depth: number;
    from: string;
    to: string;
  };
  queryCikInfo?: {
    cikName: string;
    cikTicker?: string;
  };
}

const buildNodeTree = async (
  cik: string,
  stratum: number,
  returnData: NetworkAnalysisData,
  fromDate: Date,
  toDate: Date,
) => {
  // recursion break conditions (to prevent infinite loops)
  if (stratum < 0) return; // max depth reached
  const existingNode = returnData.nodes?.find((node) => node.cik === cik);
  if (existingNode) {
    // if stratum of existing node is lower, update it -->  get always highest stratum
    if (existingNode.stratum < stratum) existingNode.stratum = stratum;
    return; // node already fetched
  }

  // get node information
  const nodeInfo = await lookupCik({ cik });
  if (!nodeInfo) return; // cik not found

  // add node information to returnData
  returnData.nodes?.push({
    cik,
    cikInfo: {
      cikName: nodeInfo.cikName,
      cikTicker:
        nodeInfo.cikTicker && nodeInfo.cikTicker.toUpperCase() !== 'NONE'
          ? nodeInfo.cikTicker
          : undefined,
    },
    stratum,
  });

  // get all edges for this node (run both queries in parallel)
  const [filingsAsIssuer, filingsAsReportingOwner] = await Promise.all([
    // find all filings where the cik is the issuer
    dbconnector.ownershipFiling.aggregateRaw({
      pipeline: [
        {
          // only get filings where the issuer is the cik in defined time frame and has reporting owners
          $match: {
            dateFiled: {
              $gte: { $date: fromDate },
              $lte: { $date: toDate },
            },
            'formData.issuer.issuerCik': cik,
            'formData.reportingOwner': { $exists: true, $ne: null },
          },
        },
        { $unwind: '$formData.reportingOwner' }, // unwind reporting owners to get one document per owner
        {
          // only extract relevant fields to reduce query size
          $project: {
            _id: 0,
            issuerCik: '$formData.issuer.issuerCik',
            dateFiled: 1,
            reportingOwnerCik: '$formData.reportingOwner.reportingOwnerId.rptOwnerCik',
            relationInformation: '$formData.reportingOwner.reportingOwnerRelationship',
            retiredRelation: '$formData.notSubjectToSection16',
          },
        },
      ],
    }),
    // find all filings where the cik is a reporting owner
    dbconnector.ownershipFiling.aggregateRaw({
      pipeline: [
        {
          // only get filings where the cik is a reporting owner in defined time (pre-filtering filings)
          $match: {
            dateFiled: {
              $gte: { $date: fromDate },
              $lte: { $date: toDate },
            },
            'formData.reportingOwner.reportingOwnerId.rptOwnerCik': cik,
          },
        },
        { $unwind: '$formData.reportingOwner' }, // unwind reporting owners to get one document per owner
        {
          $match: {
            'formData.reportingOwner.reportingOwnerId.rptOwnerCik': cik, // re-filter for reporting owner cik after unwind
          },
        },
        {
          // only extract relevant fields to reduce query size
          $project: {
            _id: 0,
            issuerCik: '$formData.issuer.issuerCik',
            dateFiled: 1,
            reportingOwnerCik: '$formData.reportingOwner.reportingOwnerId.rptOwnerCik',
            relationInformation: '$formData.reportingOwner.reportingOwnerRelationship',
            retired: '$formData.notSubjectToSection16',
          },
        },
      ],
    }),
  ]);

  // combine both results
  const allRelevantFilings = [
    ...(Array.isArray(filingsAsIssuer) ? filingsAsIssuer : []),
    ...(Array.isArray(filingsAsReportingOwner) ? filingsAsReportingOwner : []),
  ];

  const discoveredCiks: Set<string> = new Set<string>();

  for (const filing of allRelevantFilings) {
    // add involved ciks to discoveredCiks
    discoveredCiks.add(filing.issuerCik);
    discoveredCiks.add(filing.reportingOwnerCik);

    // add edge to returnData if not already present
    let existingEdge = returnData.edges?.find(
      (edge) => edge.issuerCik === filing.issuerCik && edge.ownerCik === filing.reportingOwnerCik,
    );

    // if existing edge is older than filing, remove it
    // (this should not happen on consistent data/queries, as the result should be same from issuer and owner perspective)
    if (existingEdge && existingEdge.latestDateFiled < filing.dateFiled) {
      returnData.edges = returnData.edges?.filter(
        (edge) => edge.issuerCik !== filing.issuerCik && edge.ownerCik !== filing.reportingOwnerCik,
      );
      existingEdge = undefined;
    }

    if (!existingEdge) {
      // handle relationType
      const relationTypes: string[] = [];
      if (filing.relationInformation.isDirector) relationTypes.push('Director');
      if (filing.relationInformation.isOfficer)
        relationTypes.push(`Officer (${filing.relationInformation.officerTitle})`);
      if (filing.relationInformation.isTenPercentOwner) relationTypes.push('10% Owner');
      if (filing.relationInformation.isOther)
        relationTypes.push(`Other (${filing.relationInformation.otherText})`);

      returnData.edges?.push({
        issuerCik: filing.issuerCik,
        ownerCik: filing.reportingOwnerCik,
        relationTypes: relationTypes,
        retiredRelation: Boolean(filing.retiredRelation),
        latestDateFiled: filing.dateFiled,
      });
    }
  }

  for (const discoveredCik of discoveredCiks)
    await buildNodeTree(discoveredCik, stratum - 1, returnData, fromDate, toDate);
};

export const doNetworkAnalysis = async (
  data: z.infer<typeof AnalysisSchema>,
): Promise<NetworkAnalysisData> => {
  // revalidate received (unsafe) values from client
  const validatedData = AnalysisSchema.safeParse(data);
  if (!validatedData.success || !validatedData.data.depth) return { error: 'Ungültige Anfrage' };

  // check if user is authenticated
  const session = await auth();
  if (!session?.user.id) return { error: 'Nicht authentifiziert' };

  // verify analysis time frame
  const fromDate = new Date(validatedData.data.from);
  const toDate = new Date(validatedData.data.to);
  if (fromDate > toDate) return { error: 'Startdatum muss vor Enddatum liegen' };
  if (toDate > new Date()) return { error: 'Enddatum darf nicht in der Zukunft liegen' };
  if ((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24) > 365.25 * 5)
    return { error: 'Der Analyse-Zeitraum darf maximal 5 Jahre betragen' };

  // verify cik and build cikDisplayName for title
  const cikInfo = await lookupCik({ cik: validatedData.data.cik });
  if (!cikInfo) return { error: 'CIK nicht gefunden' };

  const returnData: NetworkAnalysisData = {
    queryCikInfo: {
      cikName: cikInfo.cikName,
      cikTicker:
        cikInfo.cikTicker && cikInfo.cikTicker.toUpperCase() != 'NONE'
          ? cikInfo.cikTicker
          : undefined,
    },
    queryParams: {
      ...validatedData.data,
      depth: validatedData.data.depth ?? 3, // default depth
    },
    nodes: [],
    edges: [],
  };

  try {
    // Phase 1: Build tree
    await buildNodeTree(
      validatedData.data.cik,
      validatedData.data.depth,
      returnData,
      fromDate,
      toDate,
    );

    // Phase 2: Prune dongeling edges
    returnData.edges = returnData.edges?.filter((edge) => {
      const issuerNode = returnData.nodes?.find((node) => node.cik === edge.issuerCik);
      const ownerNode = returnData.nodes?.find((node) => node.cik === edge.ownerCik);
      return issuerNode && ownerNode;
    });
  } catch (error) {
    console.error(`Error in getEmbeddedDocumentContent: ${error}`);
    return { error: 'Interner Serverfehler' };
  }
  return returnData;
};
