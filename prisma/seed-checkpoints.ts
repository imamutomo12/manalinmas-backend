require('dotenv/config');

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const checkpointData = [
  {
    name: 'Gerbang Masuk Blok S',
    latitude: -6.967002273755356,
    longitude: 107.57935148824724,
    block: 'S',
  },
  {
    name: 'Jalan Blok S',
    latitude: -6.967086844522384,
    longitude: 107.58010442486825,
    block: 'S',
  },
  {
    name: 'Masjid & Blok G',
    latitude: -6.968174929921945,
    longitude: 107.58078281605296,
    block: 'G',
  },
  {
    name: 'Blok L Utara',
    latitude: -6.967226448077418,
    longitude: 107.58257393423762,
    block: 'L',
  },
  {
    name: 'SDN Sukamenak Indah',
    latitude: -6.9675395294179445,
    longitude: 107.582261626117,
    block: 'L',
  },
  {
    name: 'Blok N Tengah',
    latitude: -6.9687890764776155,
    longitude: 107.58188417755592,
    block: 'N',
  },
  {
    name: 'Blok N Selatan',
    latitude: -6.969674987206065,
    longitude: 107.58189088310945,
    block: 'N',
  },
  {
    name: 'Blok P Selatan',
    latitude: -6.9692880287825645,
    longitude: 107.5825493156013,
    block: 'P',
  },
  {
    name: 'Simpang Blok P',
    latitude: -6.96822885064635,
    longitude: 107.5825463185239,
    block: 'P',
  },
  {
    name: 'Simpang Blok Q1',
    latitude: -6.967823803261531,
    longitude: 107.58289962030436,
    block: 'Q',
  },
  {
    name: 'Simpang Blok Q2',
    latitude: -6.968727331662114,
    longitude: 107.58290514816518,
    block: 'Q',
  },
  {
    name: 'Simpang Blok Q & R',
    latitude: -6.9681786304179045,
    longitude: 107.58362192551463,
    block: 'Q/R',
  },
  {
    name: 'Ujung Timur Blok R',
    latitude: -6.968235329575048,
    longitude: 107.58427421136052,
    block: 'R',
  },
  {
    name: 'Lapangan Olahraga',
    latitude: -6.968780372748741,
    longitude: 107.58392411445577,
    block: 'R',
  },
];

async function main() {
  await prisma.patrolCheckpoint.createMany({
    data: checkpointData.map((cp) => ({
      ...cp,
      radiusMeters: 20,
      description: `Checkpoint ${cp.name}`,
    })),
  });

  console.log('✅ Checkpoints added');
}

main().finally(async () => {
  await prisma.$disconnect();
});
