//src/routes/billing.routes.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/:memberId/payment-method', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { cardNumber, expiry, cvc } = req.body;

    const last4 = cardNumber.slice(-4);
    const [expMonthStr, expYearStr] = expiry.split('/');

    const brand = 'visa'; // placeholder — you'd detect brand in real Stripe integration
    const stripePaymentMethodId = `fake_${Math.random().toString(36).substring(2, 10)}`; // mock ID

    const method = await prisma.paymentMethod.create({
      data: {
        memberId,
        stripePaymentMethodId,
        cardBrand: brand,
        last4,
        expMonth: parseInt(expMonthStr),
        expYear: parseInt('20' + expYearStr), // e.g., 25 -> 2025
      },
    });

    res.status(201).json(method);
  } catch (err) {
    console.error('Save Payment Method Error:', err);
    res.status(500).json({ error: 'Failed to save payment method' });
  }
});

// router.get('/:memberId', async (req: Request, res: Response) => {
//   const { memberId } = req.params;

//   try {
//     const member = await prisma.member.findUnique({
//       where: { id: memberId },
//       include: {
//         paymentMethod: true,
//         // If you add invoice model later, include it here too
//         // invoices: true,
//       },
//     });

//     if (!member) {
//       return res.status(404).json({ error: 'Member not found' });
//     }

//     res.json({
//       paymentMethod: member.paymentMethod,
//       invoices: [], // Temporary — until invoices are added
//     });
//   } catch (err) {
//     console.error('Fetch billing error:', err);
//     res.status(500).json({ error: 'Failed to fetch billing data' });
//   }
// });


router.get('/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { memberId },
    });

    const invoices = await prisma.invoice.findMany({
      where: { memberId },
      orderBy: { issuedAt: 'desc' },
    });

    res.json({ paymentMethod, invoices });
  } catch (err) {
    console.error('Fetch billing error:', err);
    res.status(500).json({ error: 'Failed to fetch billing data' });
  }
});

// PATCH /api/billing/invoices/:id/pay
router.patch('/invoices/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'paid' },
    });

    res.json(invoice);
  } catch (err) {
    console.error('Invoice payment error:', err);
    res.status(500).json({ error: 'Failed to mark invoice as paid' });
  }
});


//to get all 
router.get('/', async (req, res) => {
  const { clubId, startDate, endDate, type } = req.query;

  if (!clubId) return res.status(400).json({ error: 'Missing clubId' });

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        clubId: String(clubId),
        issuedAt: {
          gte: startDate ? new Date(String(startDate)) : undefined,
          lte: endDate ? new Date(String(endDate)) : undefined,
        },
        ...(type && { member: { membershipType: String(type) } }),
      },
     include: {
        member: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    const response = invoices.map(inv => ({
      id: inv.id,
      memberName: `${inv.member.firstName} ${inv.member.lastName}`,
      amount: inv.amount,
      status: inv.status,
      issuedAt: inv.issuedAt,
      dueDate: inv.dueDate,
    }));

    res.json(response);
  } catch (err) {
    console.error('Error fetching billing data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/summary', async (req, res) => {
  const { clubId, startDate, endDate } = req.query;

  if (!clubId) return res.status(400).json({ error: 'Missing clubId' });

  try {
    const filters = {
      clubId: String(clubId),
      issuedAt: {
        gte: startDate ? new Date(String(startDate)) : undefined,
        lte: endDate ? new Date(String(endDate)) : undefined,
      },
    };

    const [totalRevenue, unpaidDues, activeMembers] = await Promise.all([
      prisma.invoice.aggregate({
        where: { ...filters, status: 'paid' },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { ...filters, status: { in: ['unpaid', 'overdue', 'failed'] } },
        _sum: { amount: true },
      }),
      prisma.member.count({
        where: { clubId: String(clubId), memberType: 'member' },
      }),
    ]);

    res.json({
      totalRevenue: totalRevenue._sum.amount ?? 0,
      unpaidDues: unpaidDues._sum.amount ?? 0,
      activeMembers,
      attendanceRate: 78, // placeholder until real logic exists
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Failed to calculate summary' });
  }
});

router.get('/members', async (req, res) => {
  const { clubId, membershipType } = req.query;

  if (!clubId) {
    return res.status(400).json({ error: 'clubId is required' });
  }

  try {
    const members = await prisma.member.findMany({
      where: {
        clubId: String(clubId),
        ...(membershipType && { memberType: String(membershipType) }),
      },
      orderBy: { createdAt: 'desc' },
    });

    const response = members.map((m) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      memberType: m.memberType,
      createdAt: m.createdAt,
    }));

    res.json(response);
  } catch (err) {
    console.error('Fetch members error:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

export default router;





