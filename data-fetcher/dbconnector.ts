import { PrismaClient } from '@prisma/client';

const dbconnector: PrismaClient = new PrismaClient(); // Create a new PrismaClient instance (as a singleton)

export default dbconnector;
