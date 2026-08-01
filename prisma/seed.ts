// prisma/seed.ts
require('dotenv/config');
import { PrismaClient, Role, ShiftType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

console.log(
  '🔍 DATABASE_URL from env:',
  process.env.DATABASE_URL ? '✅ Found' : '❌ Missing',
);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment');
}

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

const timeOnly = (hours: number, minutes = 0) =>
  new Date(
    `1970-01-01T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`,
  );

const reguData = [
  {
    name: 'Regu 1',
    members: [
      { fullName: 'Nedy', email: 'nedy@linmas.test', phone: '081234567101' },
      { fullName: 'Udi', email: 'udi@linmas.test', phone: '081234567102' },
      { fullName: 'Amin', email: 'amin@linmas.test', phone: '081234567103' },
    ],
  },
  {
    name: 'Regu 2',
    members: [
      {
        fullName: 'Sukadi',
        email: 'sukadi@linmas.test',
        phone: '081234567201',
      },
      { fullName: 'Jimin', email: 'jimin@linmas.test', phone: '081234567202' },
      { fullName: 'Yuki', email: 'yuki@linmas.test', phone: '081234567203' },
    ],
  },
  {
    name: 'Regu 3',
    members: [
      { fullName: 'Agus', email: 'agus@linmas.test', phone: '081234567301' },
      { fullName: 'Endad', email: 'endad@linmas.test', phone: '081234567302' },
      { fullName: 'Eutik', email: 'eutik@linmas.test', phone: '081234567303' },
    ],
  },
  {
    name: 'Regu 4',
    members: [
      { fullName: 'Supri', email: 'supri@linmas.test', phone: '081234567401' },
      { fullName: 'Aros', email: 'aros@linmas.test', phone: '081234567402' },
      { fullName: 'Udin', email: 'udin@linmas.test', phone: '081234567403' },
    ],
  },
];

const wargaData = [
  {
    fullName: 'Budi Santoso',
    email: 'budi@warga.test',
    phone: '082111111101',
    block: 'Blok J No. 1',
  },
  {
    fullName: 'Siti Aminah',
    email: 'siti@warga.test',
    phone: '082111111102',
    block: 'Blok K No. 5',
  },
  {
    fullName: 'Andi Irawan',
    email: 'andi@warga.test',
    phone: '082111111103',
    block: 'Blok L No. 12',
  },
  {
    fullName: 'Dewi Lestari',
    email: 'dewi@warga.test',
    phone: '082111111104',
    block: 'Blok M No. 8',
  },
  {
    fullName: 'Agung Setiawan',
    email: 'agung@warga.test',
    phone: '082111111105',
    block: 'Blok S No. 22',
  },
];

// Menghasilkan hash yang valid untuk password: password123
const PASSWORD_HASH = bcrypt.hashSync('password123', 10);
async function main() {
  console.log('👤 Creating Koordinator user...');
  await prisma.user.create({
    data: {
      id: randomUUID(),
      role: Role.KOORDINATOR,
      email: 'mochsin@koordinator.test',
      phone_number: '081222222222',
      password_hash: PASSWORD_HASH,
      koordinatorProfile: {
        create: {
          fullName: 'Mochsin Bimahendra',
          appointmentDate: new Date('2025-01-01'), // Tanggal pengangkatan fiktif
        },
      },
    },
  });

  console.log('🏡 Creating Warga users...');
  for (const w of wargaData) {
    await prisma.user.create({
      data: {
        id: randomUUID(),
        role: Role.WARGA,
        email: w.email,
        phone_number: w.phone,
        password_hash: PASSWORD_HASH,
        wargaProfile: {
          create: {
            fullName: w.fullName,
            address: w.block,
          },
        },
      },
    });
  }

  console.log('👥 Creating Linmas users and Regus...');
  const regus: { id: string; name: string; members: { userId: string }[] }[] =
    [];

  for (const r of reguData) {
    const regu = await prisma.regu.create({
      data: {
        name: r.name,
        description: `Tim ${r.name}`,
      },
    });

    const memberIds: string[] = [];
    for (const m of r.members) {
      const user = await prisma.user.create({
        data: {
          id: randomUUID(),
          role: Role.LINMAS,
          email: m.email,
          phone_number: m.phone,
          password_hash: PASSWORD_HASH,
          linmasProfile: {
            create: {
              fullName: m.fullName,
              address: `Alamat ${m.fullName}`,
              employmentDate: new Date('2026-01-01'),
              reguId: regu.id,
            },
          },
        },
      });
      memberIds.push(user.id);
    }

    regus.push({
      id: regu.id,
      name: r.name,
      members: memberIds.map((id) => ({ userId: id })),
    });
  }

  console.log('📅 Generating shifts for July 2026...');
  const year = 2026;
  const month = 6; // Bulan Juli (0-indexed)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const shiftDate = (day: number) => new Date(year, month, day);

  const shiftPromises: Promise<any>[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = shiftDate(day);
    const morningReguIdx = (day - 1) % 4;
    const nightReguIdx = day % 4;

    const morningReguId = regus[morningReguIdx].id;
    const nightReguId = regus[nightReguIdx].id;

    shiftPromises.push(
      prisma.shift.create({
        data: {
          shiftDate: date,
          shiftType: ShiftType.MORNING,
          startTime: timeOnly(7, 0),
          endTime: timeOnly(19, 0),
          reguId: morningReguId,
          assignments: {
            createMany: {
              data: regus[morningReguIdx].members.map((m) => ({
                linmasId: m.userId,
                isSubstitute: false,
              })),
            },
          },
        },
      }),
    );

    shiftPromises.push(
      prisma.shift.create({
        data: {
          shiftDate: date,
          shiftType: ShiftType.NIGHT,
          startTime: timeOnly(19, 0),
          endTime: timeOnly(7, 0),
          reguId: nightReguId,
          assignments: {
            createMany: {
              data: regus[nightReguIdx].members.map((m) => ({
                linmasId: m.userId,
                isSubstitute: false,
              })),
            },
          },
        },
      }),
    );
  }

  await Promise.all(shiftPromises);

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
