import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const localDevelopmentUrl =
  'postgresql://postgres:postgres@localhost:5433/monex-turbo-starter-template-db?schema=public';

const prismaClientSingleton = () => {
  // Production must name its database; the local default would otherwise
  // send a misconfigured deployment to whatever listens on localhost:5433.
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required in production.');
  }
  const connectionString = process.env.DATABASE_URL || localDevelopmentUrl;

  // The adapter owns its pool when given a config, so $disconnect() closes
  // it; an externally created pool would stay open until its idle timeout.
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export * from '@prisma/client';
