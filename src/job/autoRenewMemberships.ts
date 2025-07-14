//src>>job/autoRenewMemberships.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const renewMemberships = async () => {
  const today = new Date();

  const renewable = await prisma.membership.findMany({
    where: {
      autoRenew: true,
      endDate: { lt: today },
      status: 'active',
    },
  });

  for (const m of renewable) {
    const plan = await prisma.membershipPlan.findUnique({
      where: { name: m.planName },
    });
    if (!plan) continue;

    const newStart = new Date(m.endDate);
    const newEnd = new Date(m.endDate);
    newEnd.setDate(newEnd.getDate() + plan.durationInDays);

    // update membership
    await prisma.membership.update({
      where: { id: m.id },
      data: {
        startDate: newStart,
        endDate: newEnd,
      },
    });

    // generate invoice
    await prisma.invoice.create({
      data: {
        memberId: m.memberId,
        planName: m.planName,
        amount: plan.price,
        status: 'unpaid',
        dueDate: newEnd,
      },
    });
  }

  console.log(`Renewed ${renewable.length} memberships`);
};
