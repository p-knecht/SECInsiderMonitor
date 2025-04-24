'use server';

import * as z from 'zod';
import { aggregateRawOwnershipFilingsWithDecode } from '@/lib/dbconnector';
import { AnalysisSchema } from '@/schemas';
import { lookupCik } from '../filings/loopkup-cik';
import { authenticateAndHandleInputs, AuthenticatedAnalysisResult } from './utils';

/**
 * Return data for the network analysis
 */
export interface NetworkAnalysisData {
  error?: string;
  nodes?: {
    cik: string;
    cikInfo: {
      cikName: string;
      cikTicker?: string;
    };
    depthRemaining: number;
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
    depth?: number;
    from: string;
    to: string;
  };
  queryCikInfo?: {
    cikName: string;
    cikTicker?: string;
  };
}

/**
 * Recursively build the node tree for the network analysis
 *
 * @param {string} cik - CIK to be fetched
 * @param {number} depthRemaining - remaining depth for the current node (decreased with each recursion, if 0, no further recursion is done)
 * @param {NetworkAnalysisData} returnData - object to store the results
 * @param {Date} fromDate - start date for the analysis
 * @param {Date} toDate - end date for the analysis
 * @returns
 */
const buildNodeTree = async (
  cik: string,
  depthRemaining: number,
  returnData: NetworkAnalysisData,
  fromDate: Date,
  toDate: Date,
) => {
  // recursion break conditions (to prevent infinite loops)
  if (depthRemaining < 0) return; // max depth reached
  const existingNode = returnData.nodes?.find((node) => node.cik === cik);
  if (existingNode) {
    // if depthRemaining of existing node is lower, update it -->  get always highest depthRemaining
    if (existingNode.depthRemaining < depthRemaining) existingNode.depthRemaining = depthRemaining;
    return; // node already fetched -> skip further processing
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
        nodeInfo.cikTicker &&
        nodeInfo.cikTicker.toUpperCase() !== 'NONE' &&
        nodeInfo.cikTicker.toUpperCase() !== 'N/A'
          ? nodeInfo.cikTicker
          : undefined,
    },
    depthRemaining: depthRemaining,
  });

  // get all edges for this node (run both queries (issuer, reporting owner) in parallel)
  const [filingsAsIssuer, filingsAsReportingOwner] = await Promise.all([
    // find all filings where the cik is the issuer
    aggregateRawOwnershipFilingsWithDecode({
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
    aggregateRawOwnershipFilingsWithDecode({
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
            retiredRelation: '$formData.notSubjectToSection16',
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

  // store discovered ciks in set to avoid duplicates
  const discoveredCiks: Set<string> = new Set<string>();

  for (const filing of allRelevantFilings) {
    // add involved ciks to discoveredCiks set
    discoveredCiks.add(filing.issuerCik);
    discoveredCiks.add(filing.reportingOwnerCik);

    // add edge to returnData if not already present
    let existingEdge = returnData.edges?.find(
      (edge) => edge.issuerCik === filing.issuerCik && edge.ownerCik === filing.reportingOwnerCik,
    );

    // if existing edge is older than filing, remove it
    // (this should in general not happen on consistent data/query results, as the result should be same from issuer and owner perspective)
    if (existingEdge && existingEdge.latestDateFiled < filing.dateFiled) {
      returnData.edges = returnData.edges?.filter(
        (edge) => edge.issuerCik !== filing.issuerCik && edge.ownerCik !== filing.reportingOwnerCik,
      );
      existingEdge = undefined;
    }

    if (!existingEdge) {
      // handle relationType --> convert boolean flags to human readable strings
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
    await buildNodeTree(discoveredCik, depthRemaining - 1, returnData, fromDate, toDate);
};

/**
 * Execute the network analysis for the given input data
 *
 * @param {z.infer<typeof AnalysisSchema>} data - input data for the network analysis containing the cik, depth, from and to date
 * @returns {Promise<NetworkAnalysisData>} - a promise that resolves to the network analysis data
 */
export const analyseNetwork = async (
  data: z.infer<typeof AnalysisSchema>,
): Promise<NetworkAnalysisData> => {
  const preparedInputs: AuthenticatedAnalysisResult = await authenticateAndHandleInputs(data, true);
  if (preparedInputs.error) return { error: preparedInputs.error }; // repropagate error if any occured

  // initialize returnData
  const returnData: NetworkAnalysisData = {
    queryParams: preparedInputs.queryParams,
    queryCikInfo: preparedInputs.queryCikInfo,
    nodes: [],
    edges: [],
  };

  // initialize arrays in returnData
  returnData.edges = [];
  returnData.nodes = [];

  try {
    // Phase 1: Build tree
    await buildNodeTree(
      preparedInputs.queryParams?.cik!,
      preparedInputs.queryParams?.depth!,
      returnData,
      preparedInputs.fromDate!,
      preparedInputs.toDate!,
    ); // using non-null assertion operator (!) as the values are validated/assured in authenticateAndHandleInputs

    // Phase 2: Prune dongeling edges (edges without nodes on both sides)
    returnData.edges = returnData.edges?.filter((edge) => {
      const issuerNode = returnData.nodes?.find((node) => node.cik === edge.issuerCik);
      const ownerNode = returnData.nodes?.find((node) => node.cik === edge.ownerCik);
      return issuerNode && ownerNode;
    });
  } catch (error) {
    console.error(`Error in analyseNetwork: ${error}`);
    return { error: 'Interner Serverfehler' };
  }
  return returnData;
};
