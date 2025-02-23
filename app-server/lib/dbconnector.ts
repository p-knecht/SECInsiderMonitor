import { PrismaClient } from '@prisma/client';

// use global variable to store PrismClient instance within hot-reloading (development) environment (according to https://authjs.dev/getting-started/adapters/prisma?framework=next-js)
const globalDatabaseConnector = globalThis as unknown as { databaseClient: PrismaClient };

export const dbconnector = globalDatabaseConnector.databaseClient || new PrismaClient(); // Create a new PrismaClient instance (as a singleton) if it does not exist

if (process.env.NODE_ENV !== 'production') globalDatabaseConnector.databaseClient = dbconnector;
