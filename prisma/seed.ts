
// ⚠️ Dev seed only. NEVER run this in production.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

 

const club = await prisma.club.upsert({
  where: { id: 'club1' },
  update: {},
  create: {
    id: 'club1',
    name: 'Test Gym',
    location: 'Demo City',
    timezone: 'America/Chicago',
    clubEmail: 'testclub@gymfitness.com',
  },
});

await prisma.user.upsert({
  where: { email: 'super@gym.com' },
  update: {},
  create: {
    email: 'super@gym.com',
    password: hashedPassword,
    role: 'super_admin',
  },
});

await prisma.user.upsert({
  where: { email: 'franchise@gym.com' },
  update: {},
  create: {
    email: 'franchise@gym.com',
    password: hashedPassword,
    role: 'franchise_admin',
    clubId: null,
  },
});

await prisma.user.upsert({
  where: { email: 'franchise2@gym.com' },
  update: {},
  create: {
    email: 'franchise2@gym.com',
    password: hashedPassword,
    role: 'franchise_admin',
    clubId: null,
  },
});

await prisma.trainer.createMany({
  data: [
    {
      name: 'Alyssa Kathan',
      email: 'alyssa@gym.com',
      specialization: 'Strength Training',
      phone: '123-456-7890',
      clubId: club.id,
    },
    {
      name: 'Jordan Sparks',
      email: 'jordan@gym.com',
      specialization: 'HIIT & Cardio',
      phone: '987-654-3210',
      clubId: club.id,
    },
  ],
  skipDuplicates: true,
});



}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
