import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // For generating mock setup tokens
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

const prisma = new PrismaClient();

// Helper to generate a future date for token expiry (e.g., 24 hours from now)
const getFutureDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10); // Standard password for active users
  const JWT_SECRET_MOCK = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-seed'; // Use your actual JWT_SECRET in .env!

  // --- CLUBS ---
  // Ensure the HQ club is retrieved or created so its ID is available for tasks
  const hqClub = await prisma.club.upsert({
    where: { id: 'clb_hq' }, // Using a custom ID for HQ
    update: {},
    create: {
      id: 'clb_hq',
      name: 'Gym Fitness HQ',
      location: 'New York, NY',
      timezone: 'America/New_York',
      clubEmail: 'hq@gymfitness.com',
    },
  });
  console.log('Seeded: HQ Club (ID: clb_hq)');

  const chicagoClub = await prisma.club.create({
    data: {
      name: 'Gym Chicago',
      location: 'Chicago, IL',
      timezone: 'America/Chicago',
      clubEmail: 'chicago@gymfitness.com',
    },
  });
  console.log('Seeded: Chicago Club (ID:', chicagoClub.id, ')');

  const austinClub = await prisma.club.create({
    data: {
      name: 'Gym Austin',
      location: 'Austin, TX',
      timezone: 'America/Chicago',
      clubEmail: 'austin@gymfitness.com',
    },
  });
  console.log('Seeded: Austin Club (ID:', austinClub.id, ')');

  // --- USERS ---
  // Super Admin (ACTIVE) - Store in a variable
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'super@gym.com' },
    update: {},
    create: {
      email: 'super@gym.com',
      password: hashedPassword,
      role: 'super_admin',
      name: 'Super Admin',
      clubId: null, // Global access
      status: 'ACTIVE',
    },
  });
  console.log('Seeded: Super Admin User (super@gym.com)');

  // Franchise Admins (ACTIVE) - Store in variables
  const franchiseChicagoUser = await prisma.user.upsert({
    where: { email: 'franchise.chicago@gym.com' },
    update: {},
    create: {
      email: 'franchise.chicago@gym.com',
      password: hashedPassword,
      role: 'franchise_admin',
      name: 'Jennifer Adams',
      clubId: chicagoClub.id,
      status: 'ACTIVE',
    },
  });
  console.log('Seeded: Franchise Admin (franchise.chicago@gym.com)');

  const franchiseAustinUser = await prisma.user.upsert({
    where: { email: 'franchise.austin@gym.com' },
    update: {},
    create: {
      email: 'franchise.austin@gym.com',
      password: hashedPassword,
      role: 'franchise_admin',
      name: 'Robert Chan',
      clubId: austinClub.id,
      status: 'ACTIVE',
    },
  });
  console.log('Seeded: Franchise Admin (franchise.austin@gym.com)');

  // Trainers (PENDING - for password setup)
  const trainerAlyssaUser = await prisma.user.upsert({
    where: { email: 'alyssa@gym.com' },
    update: {},
    create: {
      email: 'alyssa@gym.com',
      role: 'trainer',
      name: 'Alyssa Kathan',
      clubId: chicagoClub.id,
      status: 'PENDING',
      setupPasswordToken: jwt.sign({ userId: uuidv4(), email: 'alyssa@gym.com' }, JWT_SECRET_MOCK, { expiresIn: '1d' }), // Mock token
      setupPasswordExpires: getFutureDate(1),
    },
  });
  console.log('Seeded: Trainer User (alyssa@gym.com) - PENDING');


  const trainerJordanUser = await prisma.user.upsert({
    where: { email: 'jordan@gym.com' },
    update: {},
    create: {
      email: 'jordan@gym.com',
      role: 'trainer',
      name: 'Jordan Sparks',
      clubId: austinClub.id,
      status: 'PENDING',
      setupPasswordToken: jwt.sign({ userId: uuidv4(), email: 'jordan@gym.com' }, JWT_SECRET_MOCK, { expiresIn: '1d' }), // Mock token
      setupPasswordExpires: getFutureDate(1),
    },
  });
  console.log('Seeded: Trainer User (jordan@gym.com) - PENDING');

  // Staff (PENDING - for password setup)
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@gym.com' },
    update: {},
    create: {
      email: 'staff@gym.com',
      role: 'staff',
      name: 'Sarah Staff',
      clubId: chicagoClub.id,
      status: 'PENDING',
      setupPasswordToken: jwt.sign({ userId: uuidv4(), email: 'staff@gym.com' }, JWT_SECRET_MOCK, { expiresIn: '1d' }), // Mock token
      setupPasswordExpires: getFutureDate(1),
    },
  });
  console.log('Seeded: Staff User (staff@gym.com) - PENDING');

  // Members (some ACTIVE, some PENDING)
  const memberEmmaUser = await prisma.user.upsert({
    where: { email: 'emma@gym.com' },
    update: {},
    create: { email: 'emma@gym.com', password: hashedPassword, role: 'member', name: 'Emma Stone', clubId: chicagoClub.id, status: 'ACTIVE' }
  });
  console.log('Seeded: Member User (emma@gym.com) - ACTIVE');

  const memberJakeUser = await prisma.user.upsert({
    where: { email: 'jake@gym.com' },
    update: {},
    create: { email: 'jake@gym.com', password: hashedPassword, role: 'member', name: 'Jake Harris', clubId: austinClub.id, status: 'ACTIVE' }
  });
  console.log('Seeded: Member User (jake@gym.com) - ACTIVE');

  const memberTinaUser = await prisma.user.upsert({
    where: { email: 'tina@gym.com' },
    update: {},
    create: {
      email: 'tina@gym.com',
      role: 'member',
      name: 'Tina Ray',
      clubId: chicagoClub.id,
      status: 'PENDING',
      setupPasswordToken: jwt.sign({ userId: uuidv4(), email: 'tina@gym.com' }, JWT_SECRET_MOCK, { expiresIn: '1d' }), // Mock token
      setupPasswordExpires: getFutureDate(1),
    }
  });
  console.log('Seeded: Member User (tina@gym.com) - PENDING');


  // --- TRAINER PROFILES ---
  const trainerAlyssa = await prisma.trainer.upsert({
    where: { email: 'alyssa@gym.com' },
    update: {},
    create: {
      name: 'Alyssa Kathan',
      email: 'alyssa@gym.com',
      clubId: chicagoClub.id,
      userId: trainerAlyssaUser.id, // Link to the user created above
      specialization: 'Strength Training',
      phone: '312-555-1234',
    },
  });
  console.log('Seeded: Trainer Profile (Alyssa Kathan)');

  const trainerJordan = await prisma.trainer.upsert({
    where: { email: 'jordan@gym.com' },
    update: {},
    create: {
      name: 'Jordan Sparks',
      email: 'jordan@gym.com',
      clubId: austinClub.id,
      userId: trainerJordanUser.id, // Link to the user created above
      specialization: 'HIIT & Cardio',
      phone: '737-555-6543',
    },
  });
  console.log('Seeded: Trainer Profile (Jordan Sparks)');

  // --- MEMBER PROFILES ---
  const emmaMember = await prisma.member.upsert({
    where: { email: 'emma@gym.com' },
    update: {},
    create: {
      firstName: 'Emma',
      lastName: 'Stone',
      email: 'emma@gym.com',
      gender: 'female',
      clubId: chicagoClub.id,
      userId: memberEmmaUser.id,
      memberType: 'member',
      joiningDate: new Date('2024-01-15'),
    },
  });
  console.log('Seeded: Member Profile (Emma Stone)');

  const jakeMember = await prisma.member.upsert({
    where: { email: 'jake@gym.com' },
    update: {},
    create: {
      firstName: 'Jake',
      lastName: 'Harris',
      email: 'jake@gym.com',
      gender: 'male',
      clubId: austinClub.id,
      userId: memberJakeUser.id,
      memberType: 'member',
      joiningDate: new Date('2024-03-01'),
    },
  });
  console.log('Seeded: Member Profile (Jake Harris)');

  const tinaMember = await prisma.member.upsert({
    where: { email: 'tina@gym.com' },
    update: {},
    create: {
      firstName: 'Tina',
      lastName: 'Ray',
      email: 'tina@gym.com',
      gender: 'female',
      clubId: chicagoClub.id,
      userId: memberTinaUser.id, // Link to PENDING user
      memberType: 'member',
      joiningDate: new Date('2024-02-10'),
    },
  });
  console.log('Seeded: Member Profile (Tina Ray)');

  // --- MEMBERSHIP PLANS ---
  const monthlyUnlimited = await prisma.membershipPlan.upsert({
    where: { name: 'Monthly Unlimited' },
    update: {},
    create: { name: 'Monthly Unlimited', price: 60, durationInDays: 30, description: 'Unlimited gym access for 30 days' },
  });
  const annualUnlimited = await prisma.membershipPlan.upsert({
    where: { name: 'Annual Unlimited' },
    update: {},
    create: { name: 'Annual Unlimited', price: 600, durationInDays: 365, description: 'Unlimited access with discounted rate' },
  });
  console.log('Seeded: Membership Plans');


  // --- INVOICES (for revenue trend over last few months) ---
  const today = new Date();
  const getInvoiceDate = (monthsAgo: number, day: number) => {
    return new Date(today.getFullYear(), today.getMonth() - monthsAgo, day);
  };

  await prisma.invoice.createMany({
    data: [
      // Emma (Chicago) - Monthly, paid for 3 months
      { memberId: emmaMember.id, planName: monthlyUnlimited.name, amount: monthlyUnlimited.price, clubId: chicagoClub.id, status: 'paid', issuedAt: getInvoiceDate(3, 15), dueDate: getInvoiceDate(2, 15) },
      { memberId: emmaMember.id, planName: monthlyUnlimited.name, amount: monthlyUnlimited.price, clubId: chicagoClub.id, status: 'paid', issuedAt: getInvoiceDate(2, 15), dueDate: getInvoiceDate(1, 15) },
      { memberId: emmaMember.id, planName: monthlyUnlimited.name, amount: monthlyUnlimited.price, clubId: chicagoClub.id, status: 'paid', issuedAt: getInvoiceDate(1, 15), dueDate: getInvoiceDate(0, 15) },
      // Jake (Austin) - Annual, paid once
      { memberId: jakeMember.id, planName: annualUnlimited.name, amount: annualUnlimited.price, clubId: austinClub.id, status: 'paid', issuedAt: getInvoiceDate(4, 10), dueDate: getInvoiceDate(3, 10) },
      // Tina (Chicago) - Monthly, unpaid
      { memberId: tinaMember.id, planName: monthlyUnlimited.name, amount: monthlyUnlimited.price, clubId: chicagoClub.id, status: 'unpaid', issuedAt: today, dueDate: getFutureDate(7) },
    ],
    skipDuplicates: true, // Use skipDuplicates if running multiple times without full reset
  });
  console.log('Seeded: Invoices');


  // --- CLASS SCHEDULES & BOOKINGS ---
  const classDate = getFutureDate(5); // 5 days from now
  const hiitClass = await prisma.classSchedule.upsert({
    where: { id: 'class_hiit_chicago' }, // Custom ID for upsert
    update: {},
    create: {
      id: 'class_hiit_chicago',
      title: 'HIIT Bootcamp',
      date: classDate,
      duration: 60,
      maxCapacity: 15,
      trainerId: trainerAlyssa.id,
      clubId: chicagoClub.id,
      classType: 'Group Session',
      status: 'scheduled',
    },
  });
  console.log('Seeded: HIIT Bootcamp Class Schedule');

  await prisma.booking.createMany({
    data: [
      { memberId: emmaMember.id, scheduleId: hiitClass.id, status: 'confirmed' },
      { memberId: tinaMember.id, scheduleId: hiitClass.id, status: 'waitlisted' },
    ],
    skipDuplicates: true,
  });
  console.log('Seeded: Class Bookings');


  // --- PERMISSIONS ---
  const roles = ['super_admin', 'franchise_admin', 'trainer', 'staff', 'member'] as const;
  const permissionKeys = [
    'view_dashboard', 'view_members', 'edit_members', 'view_reports', 'manage_billing',
    'view_schedule', 'edit_schedule', 'manage_trainers', 'manage_staff', 'manage_clubs',
    'view_leads', 'edit_leads', 'view_products', 'manage_products', 'view_tasks', 'manage_tasks',
    'view_resources', 'manage_resources', 'view_communications', 'send_communications',
    'self_book_classes', 'view_own_profile', 'edit_own_profile', 'view_own_invoices', 'view_own_attendances'
  ] as const;

  for (const role of roles) {
    for (const key of permissionKeys) {
      await prisma.permission.upsert({
        where: { role_key: { role, key } },
        update: {},
        create: {
          role,
          key,
          // Define permissions logic here:
          allowed: (role === 'super_admin') ||
                   (role === 'franchise_admin' && !['manage_clubs'].includes(key)) || // Franchise admin can't manage clubs themselves
                   (role === 'trainer' && ['view_dashboard', 'view_schedule', 'edit_schedule', 'view_members', 'view_resources', 'view_own_profile', 'edit_own_profile', 'view_own_attendances'].includes(key)) ||
                   (role === 'staff' && ['view_dashboard', 'view_members', 'view_schedule', 'view_resources', 'view_communications', 'send_communications', 'view_products', 'manage_products', 'view_tasks', 'manage_tasks', 'view_own_profile', 'edit_own_profile', 'view_own_attendances'].includes(key)) ||
                   (role === 'member' && ['view_dashboard', 'view_schedule', 'self_book_classes', 'view_own_profile', 'edit_own_profile', 'view_own_invoices', 'view_own_attendances', 'view_resources'].includes(key))
        },
      });
    }
  }
  console.log('Seeded: Permissions');


  // --- TRAINING RESOURCES ---
  await prisma.trainingResource.createMany({
    data: [
      {
        title: 'Gym SOP PDF',
        description: 'Standard Operating Procedures for all staff',
        type: 'document',
        fileUrl: '/uploads/gym-sop.pdf',
        tags: ['operations', 'rules'],
        roles: ['staff', 'trainer', 'franchise_admin', 'super_admin'],
      },
      {
        title: 'Member Check-In Tutorial',
        description: 'How to check in members at the front desk',
        type: 'video',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder, replace with actual video
        tags: ['checkin', 'frontdesk'],
        roles: ['franchise_admin', 'staff'],
      },
    ],
    skipDuplicates: true,
  });
  console.log('Seeded: Training Resources');

  // --- LEADS ---
  const lead1 = await prisma.lead.upsert({
    where: { email: 'prospect1@gym.com' },
    update: {},
    create: {
      name: 'Liam Hunt',
      email: 'prospect1@gym.com',
      phone: '555-111-2222',
      status: 'NEW',
      clubId: chicagoClub.id,
      leadSource: 'Website Form',
      assignedFor: franchiseChicagoUser.id, // Assign to Chicago admin
    },
  });
  console.log('Seeded: Lead 1');

  const lead2 = await prisma.lead.upsert({
    where: { email: 'prospect2@gym.com' },
    update: {},
    create: {
      name: 'Grace Miles',
      email: 'prospect2@gym.com',
      phone: '555-333-4444',
      status: 'CONTACTED',
      clubId: austinClub.id,
      leadSource: 'Referral',
      assignedFor: franchiseAustinUser.id, // Assign to Austin admin
    },
  });
  console.log('Seeded: Lead 2');

  // --- PRODUCTS & TRANSACTIONS ---
  // Fix: Use createMany with skipDuplicates or ensure unique IDs for upsert.
  // For products, if 'name' is not @unique, we can't use it in 'where'.
  // We'll just create them, and if you run seed multiple times, they'll be duplicated unless ids match.
  // A better solution would be to add @unique to 'name' in Product model if it truly is unique.
  // For now, let's create them and capture their IDs.

  const productsToCreate = [
    { name: 'Protein Powder', category: 'Supplements', price: 35.00, stock: 50, clubId: hqClub.id },
    { name: 'Gym Water Bottle', category: 'Merchandise', price: 15.00, stock: 100, clubId: chicagoClub.id },
  ];

  // Manual loop to get created product IDs, assuming they don't exist yet for simplicity in seeding
  const createdProducts = [];
  for (const productData of productsToCreate) {
      const existingProduct = await prisma.product.findFirst({
          where: { name: productData.name, clubId: productData.clubId }
      });
      if (existingProduct) {
          createdProducts.push(existingProduct);
      } else {
          createdProducts.push(await prisma.product.create({ data: productData }));
      }
  }

  const proteinPowder = createdProducts.find(p => p.name === 'Protein Powder');
  const waterBottle = createdProducts.find(p => p.name === 'Gym Water Bottle');

  console.log('Seeded: Products');

  const staffTransactionUser = await prisma.user.findFirst({ where: { role: 'staff', clubId: chicagoClub.id } });

  if (staffTransactionUser && proteinPowder && waterBottle) {
    const transaction1 = await prisma.productTransaction.create({
      data: {
        staffId: staffTransactionUser.id,
        clubId: chicagoClub.id,
        total: 50.00,
        method: 'card',
        items: {
          create: [
            { productId: proteinPowder.id, quantity: 1, unitPrice: 35.00 },
            { productId: waterBottle.id, quantity: 1, unitPrice: 15.00 },
          ],
        },
      },
    });
    console.log('Seeded: Product Transaction 1');
  } else {
    console.warn('Skipped seeding product transaction: Missing staff user or products.');
  }

  // --- TASKS ---
  await prisma.task.createMany({
    data: [
      {
        title: 'Check equipment maintenance logs',
        description: 'Review logs for last month and schedule repairs if needed.',
        status: 'PENDING',
        dueDate: getFutureDate(10),
        assignedTo: franchiseChicagoUser.id,
        assignedBy: superAdminUser.id, // Fixed: Use the actual superAdminUser variable
        clubId: chicagoClub.id,
      },
      {
        title: 'Follow up with new prospects',
        description: 'Call new leads from yesterday and schedule tours.',
        status: 'PENDING',
        dueDate: getFutureDate(2),
        assignedTo: staffUser.id,
        assignedBy: franchiseChicagoUser.id,
        clubId: chicagoClub.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log('Seeded: Tasks');


  console.log('✅ All data seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());