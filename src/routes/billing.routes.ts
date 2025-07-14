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




export default router; 
