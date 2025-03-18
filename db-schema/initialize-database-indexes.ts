import { IndexSpecification, MongoClient } from 'mongodb';

/**
 * Initialize database indexes for the ownershipFiling collection.
 *
 * @returns {Promise<void>} - A promise that resolves when the initialization is complete.
 */
export async function initializeDatabaseIndexes() {
  try {
    console.log('Initializing database indexes...');

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // get native MongoDB client (as PrismaClient does not support index creation on nested fields yet)
    const mongoClient = await new MongoClient(process.env.DATABASE_URL).connect();

    // get collection and list of existing indexes
    const collection = mongoClient.db().collection('OwnershipFiling');
    const existingIndexes = await collection.indexes();
    const existingIndexNames = existingIndexes.map((idx: any) => idx.name);

    // define list of required indexes
    const requiredIndexes: { key: IndexSpecification; name: string }[] = [
      { key: { filingId: 1 }, name: 'filingId_index' },
      { key: { dateFiled: -1 }, name: 'dateFiled_index' },
      { key: { formType: 1 }, name: 'formType_index' },
      { key: { 'formData.periodOfReport': -1 }, name: 'periodOfReport_index' },
      { key: { 'formData.issuer.issuerCik': 1 }, name: 'issuerCik_index' },
      { key: { 'formData.issuer.issuerName': 1 }, name: 'issuerName_index' },
      { key: { 'formData.issuer.issuerTicker': 1 }, name: 'issuerTicker_index' },
      {
        key: { 'formData.reportingOwner.reportingOwnerId.rptOwnerCik': 1 },
        name: 'reportingOwnerCik_index',
      },
      {
        key: { 'formData.reportingOwner.reportingOwnerId.rptOwnerName': 1 },
        name: 'reportingOwnerName_index',
      },
    ];

    // for each required index, check if it exists and create it if not
    for (const index of requiredIndexes) {
      if (!existingIndexNames.includes(index.name)) {
        console.log(`Creating index: ${index.name}`);
        await collection.createIndex(index.key, { name: index.name });
      }
    }
    console.log('Database indexes initialized successfully');

    await mongoClient.close();
  } catch (error) {
    console.error(`Error initializing database indexes: ${error}`);
  }
}

// start the database indexes initialization process
initializeDatabaseIndexes();
