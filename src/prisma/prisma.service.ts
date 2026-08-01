import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // 1. Read connection string from environment
    const connectionString = process.env.DATABASE_URL;

    // 2. Initialize the Postgres Pool
    const pool = new Pool({ connectionString });

    // 3. Initialize the Prisma Adapter
    const adapter = new PrismaPg(pool);

    // 4. Pass the adapter to the PrismaClient constructor
    super({
      adapter,
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
