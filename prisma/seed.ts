import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 👇 Step 1: Create a dummy club
  const club = await prisma.club.upsert({
    where: { id: 'club1' },
    update: {},
    create: {
      id: 'club1',
      name: 'Golf Simulator',
      location: 'City Center'
    },
  });

  // 👇 Step 2: Create users referencing that club
  // ✅ Step 2: Upsert super admin
await prisma.user.upsert({
  where: { email: 'super@gym.com' },
  update: {
    password: hashedPassword,
    role: 'super_admin',
    clubId: null,
  },
  create: {
    email: 'super@gym.com',
    password: hashedPassword,
    role: 'super_admin',
  },
});

// ✅ Step 3: Upsert franchise admin
await prisma.user.upsert({
  where: { email: 'franchise@gym.com' },
  update: {
    password: hashedPassword,
    role: 'franchise_admin',
    clubId: club.id,
  },
  create: {
    email: 'franchise@gym.com',
    password: hashedPassword,
    role: 'franchise_admin',
    clubId: club.id,
  },
});


  // 👇 Step 3: Create a trainer linked to the club
  await prisma.trainer.upsert({
    where: { email: 'trainer@gym.com' },
    update: {},
    create: {
      name: 'Jane Trainer',
      email: 'trainer@gym.com',
      clubId: club.id
    },
  });

  console.log('✅ Seeded test club, users, and trainer');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
