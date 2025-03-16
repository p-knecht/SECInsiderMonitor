import { Prisma, PrismaClient } from '@prisma/client';
import { JsonObject } from '@prisma/client/runtime/library';
import he from 'he';

// use global variable to store PrismClient instance within hot-reloading (development) environment (according to https://authjs.dev/getting-started/adapters/prisma?framework=next-js)
const globalDatabaseConnector = globalThis as unknown as { databaseClient: PrismaClient };

export const dbconnector = globalDatabaseConnector.databaseClient || new PrismaClient(); // Create a new PrismaClient instance (as a singleton) if it does not exist

if (process.env.NODE_ENV !== 'production') globalDatabaseConnector.databaseClient = dbconnector;

/**
 * Aggregate data from ownershipFiling collection with a given aggregation pipeline
 * and decode all string values (only needed for ownershipFiling collection, as it contains HTML-encoded strings).
 * (convenience function to call dbconnector.ownershipFiling.aggregate() and decodeStrings() in sequence)
 *
 * @param {Prisma.OwnershipFilingAggregateRawArgs} args - Aggregation pipeline arguments
 * @returns {Promise<JsonObject>} - Aggregated data with decoded string values.
 */
export async function aggregateRawOwnershipFilingsWithDecode(
  args: Prisma.OwnershipFilingAggregateRawArgs,
): Promise<JsonObject> {
  const rawData = await dbconnector.ownershipFiling.aggregateRaw(args);
  return decodeStrings(rawData);
}

/**
 * Recursively decodes all HTML-encoded string values in an object or array.
 *
 * @param {T} obj - The object or array to decode.
 * @returns {T} - The same object but with all string values decoded.
 */
export function decodeStrings<T>(obj: T): T {
  if (obj instanceof Date) return obj as T; // skip decoding of Date objects
  if (Array.isArray(obj)) return obj.map(decodeStrings) as T;
  if (obj !== null && typeof obj === 'object')
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, decodeStrings(value)]),
    ) as T;
  if (typeof obj === 'string') return he.decode(obj) as T;
  return obj;
}
