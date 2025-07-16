
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




const roles = ['super_admin', 'franchise_admin', 'trainer', 'staff'] as const;
  const keys = [
    'view_members',
    'edit_members',
    'view_reports',
    'edit_schedule',
    'manage_billing',
    'assign_trainers',
  ] as const;

  for (const role of roles) {
    for (const key of keys) {
      await prisma.permission.upsert({
        where: {
          role_key: {
            role,
            key,
          },
        },
        update: {},
        create: {
          role,
          key,
          allowed: role === 'super_admin', // Default: only super_admin gets all initially
        },
      });
    }
  }

  await prisma.trainingResource.create({
  data: {
    title: 'How to Check In Members',
    description: 'This guide explains member check-in flow',
    type: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=I2JM92yfs7g&list=RDI2JM92yfs7g&start_radio=1&ab_channel=90%27sDard-BollywoodSongs',
    roles: ['franchise_admin', 'staff'],
    tags: ['checkin', 'operations'],
  },
});

await prisma.trainingResource.create({
  data: {
    title: 'Gym SOP PDF',
    description: 'Standard Operating Procedures for staff',
    type: 'document',
    fileUrl: '/uploads/gym-sop.pdf',
    tags: ['operations', 'safety'],
    roles: ['staff', 'trainer'],
  },
});


  console.log('✅ Seed complete: users, trainers, permissions, club.');
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
