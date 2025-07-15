import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 👇 Step 1: Upsert club
  const club = await prisma.club.upsert({
    where: { id: 'club1' },
    update: {},
    create: {
      id: 'club1',
      name: 'Golf Simulator',
      location: 'City Center',
    },
  });

  // 👇 Step 2: Upsert users
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

  // 👇 Step 3: Upsert multiple trainers
  const trainers = await Promise.all([
    prisma.trainer.upsert({
      where: { email: 'trainer1@gym.com' },
      update: {},
      create: {
        name: 'Mike Bell',
        email: 'trainer1@gym.com',
        clubId: club.id,
      },
    }),
    prisma.trainer.upsert({
      where: { email: 'trainer2@gym.com' },
      update: {},
      create: {
        name: 'Alyssa Kathan',
        email: 'trainer2@gym.com',
        clubId: club.id,
      },
    }),
    prisma.trainer.upsert({
      where: { email: 'trainer3@gym.com' },
      update: {},
      create: {
        name: 'Jordan Sparks',
        email: 'trainer3@gym.com',
        clubId: club.id,
      },
    }),
  ]);

  // 👇 Step 4: Seed membership plans
  await prisma.membershipPlan.createMany({
    data: [
      {
        name: 'Basic',
        description: 'Access to gym equipment and showers',
        price: 29.99,
        durationInDays: 30,
      },
      {
        name: 'Premium',
        description: 'Includes group classes, personal trainer access',
        price: 59.99,
        durationInDays: 30,
      },
      {
        name: 'Annual',
        description: 'Yearly membership with full benefits',
        price: 499.99,
        durationInDays: 365,
      },
    ],
    skipDuplicates: true,
  });



  await prisma.location.createMany({
  data: [
    { name: 'Room A', clubId: club.id },
    { name: 'Room B', clubId: club.id },
    { name: 'Studio 1', clubId: club.id },
  ],
  skipDuplicates: true,
});






  console.log('✅ Seeded club, users, 3 trainers, membership plans, and schedules');
}

//rest is  created manually like member, invoice, .. etc

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
