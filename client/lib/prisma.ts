import { PrismaClient } from '@prisma/client'

// Moved global definition to the end to correctly type with ReturnType

const createPrismaClient = () => {
  const baseClient = new PrismaClient({
    log: [{ level: 'warn', emit: 'event' }],
    datasourceUrl: process.env.DATABASE_URL,
  });

  let lastLogged = 0;
  // Handle potential connection issues gracefully with throttling
  baseClient.$on('warn' as any, (e: any) => {
    const now = Date.now();
    if (now - lastLogged > 30000) {
      console.warn('[PRISMA_SOCKET_NOTICE] Direct TCP socket notice (fallback active):', e?.message || e);
      lastLogged = now;
    }
  });

  return baseClient.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (['User', 'Product'].includes(model)) {
            args.where = { ...args.where, deletedAt: null } as any;
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (['User', 'Product'].includes(model)) {
            args.where = { ...args.where, deletedAt: null } as any;
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          if (['User', 'Product'].includes(model)) {
            args.where = { ...args.where, deletedAt: null } as any;
          }
          return query(args);
        },
        async count({ model, args, query }) {
          if (['User', 'Product'].includes(model)) {
            args.where = { ...args.where, deletedAt: null } as any;
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          if (['User', 'Product'].includes(model)) {
            const modelName = model.toLowerCase() as any;
            return (baseClient as any)[modelName].update({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (['User', 'Product'].includes(model)) {
            const modelName = model.toLowerCase() as any;
            return (baseClient as any)[modelName].updateMany({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },
      }
    }
  });
};

const prismaInstance = createPrismaClient();
type PrismaClientType = typeof prismaInstance;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaInstance;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

