//src/routes/billing.routes.ts
import express from 'express';
import { PrismaClient , InvoiceStatus} from '@prisma/client';
import { Request, Response } from 'express';

const router = express.Router();
const prisma = new PrismaClient();







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



// GET /api/billing/recent?limit=5
router.get('/recent', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { issuedAt: 'desc' },
      take: limit,
      include: {
        member: {
          select: { firstName: true, lastName: true },
        },
        club: {
          select: { name: true },
        },
      },
    });

    const result = invoices.map((inv) => ({
      id: inv.id,
       memberName: inv.member ? `${inv.member.firstName} ${inv.member.lastName}` : 'Unknown Member',
      amount: inv.amount,
      status: inv.status,
      issuedAt: inv.issuedAt,
      dueDate: inv.dueDate,
      clubName: inv.club.name,
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching recent invoices:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// router.get('/summary', async (req, res) => {
//   const { clubId, startDate, endDate } = req.query;

//   if (!clubId) return res.status(400).json({ error: 'Missing clubId' });

//   try {
//     const filters = {
//       clubId: String(clubId),
//       issuedAt: {
//         gte: startDate ? new Date(String(startDate)) : undefined,
//         lte: endDate ? new Date(String(endDate)) : undefined,
//       },
//     };

//     const [totalRevenue, unpaidDues, activeMembers] = await Promise.all([
//       prisma.invoice.aggregate({
//         where: { ...filters, status: 'paid' },
//         _sum: { amount: true },
//       }),
//       prisma.invoice.aggregate({
//         where: { ...filters, status: { in: ['unpaid', 'overdue', 'failed'] } },
//         _sum: { amount: true },
//       }),
//       prisma.member.count({
//         where: { clubId: String(clubId), memberType: 'member' },
//       }),
//     ]);

//     res.json({
//       totalRevenue: totalRevenue._sum.amount ?? 0,
//       unpaidDues: unpaidDues._sum.amount ?? 0,
//       activeMembers,
//       attendanceRate: 78, // placeholder until real logic exists
//     });
//   } catch (err) {
//     console.error('Summary error:', err);
//     res.status(500).json({ error: 'Failed to calculate summary' });
//   }
// });
// router.get('/summary', async (req, res) => {
//   const { clubId, startDate, endDate } = req.query;

//   // IMPORTANT CHANGE: Remove the direct 400 error if clubId is missing.
//   // Instead, we'll build the filters conditionally.
//   // if (!clubId) return res.status(400).json({ error: 'Missing clubId' }); // <-- REMOVE THIS LINE

//   // Build filters object conditionally
//   let invoiceFilters: any = {
//     issuedAt: {
//       gte: startDate ? new Date(String(startDate)) : undefined,
//       lte: endDate ? new Date(String(endDate)) : undefined,
//     },
//   };

//   let memberCountFilters: any = {
//     memberType: 'member' // Always count members, not prospects, for this summary
//   };

  

//   // If clubId is provided, apply the filter to both invoice and member queries
//   if (clubId) {
//     invoiceFilters.clubId = String(clubId);
//     memberCountFilters.clubId = String(clubId);
//   }

//   try {
//     const [totalRevenueResult, unpaidDuesResult, activeMembersCount] = await Promise.all([
//       prisma.invoice.aggregate({
//         where: { ...invoiceFilters, status: 'paid' },
//         _sum: { amount: true },
//       }),
//       prisma.invoice.aggregate({
//         where: { ...invoiceFilters, status: { in: ['unpaid', 'overdue', 'failed'] } },
//         _sum: { amount: true },
//       }),
//       prisma.member.count({
//         where: memberCountFilters, // Use the dynamically built memberCountFilters
//       }),
//     ]);

//     res.json({
//       totalRevenue: totalRevenueResult._sum.amount ?? 0,
//       unpaidDues: unpaidDuesResult._sum.amount ?? 0,
//       activeMembers: activeMembersCount,
//       attendanceRate: 78, // placeholder until real logic exists
//     });
//   } catch (err) {
//     console.error('Summary error:', err);
//     res.status(500).json({ error: 'Failed to calculate summary' });
//   }
// });


router.get('/summary', async (req, res) => {
  const { clubId, startDate, endDate } = req.query;

  let invoiceFilters: any = {
    issuedAt: {
      gte: startDate ? new Date(String(startDate)) : undefined,
      lte: endDate ? new Date(String(endDate)) : undefined,
    },
  };

  let memberCountFilters: any = {
    memberType: 'member'
  };

  // Define date filters for attendance/schedule queries
  const attendanceDateFilters = {
    gte: startDate ? new Date(String(startDate)) : undefined,
    lte: endDate ? new Date(String(endDate)) : undefined,
  };

  // If clubId is provided, apply the filter to all queries
  if (clubId) {
    invoiceFilters.clubId = String(clubId);
    memberCountFilters.clubId = String(clubId);
  } else {
    console.log('Backend /api/billing/summary: No clubId provided, fetching GLOBAL summary.');
  }

  try {
    const [totalRevenueResult, unpaidDuesResult, activeMembersCount, totalBookingsResult, totalAttendancesResult] = await Promise.all([
      prisma.invoice.aggregate({
        where: { ...invoiceFilters, status: InvoiceStatus.paid },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { ...invoiceFilters, status: { in: [InvoiceStatus.unpaid, InvoiceStatus.overdue, InvoiceStatus.failed] } },
        _sum: { amount: true },
      }),
      prisma.member.count({
        where: memberCountFilters,
      }),
      // New: Count total confirmed bookings for classes within the period
      prisma.booking.count({
        where: {
          status: 'confirmed',
          schedule: {
            date: attendanceDateFilters,
            ...(clubId && { clubId: String(clubId) }), // Apply clubId filter if present
          },
        },
      }),
      // New: Count total present attendances for classes within the period
      prisma.attendance.count({
        where: {
          status: 'present',
          markedAt: attendanceDateFilters, // Attendance markedAt should be within the period
          ...(clubId && { clubId: String(clubId) }), // Apply clubId filter if present
        },
      }),
    ]);

    const totalConfirmedBookings = totalBookingsResult ?? 0;
    const totalPresentAttendances = totalAttendancesResult ?? 0;

    let attendanceRate = 0;
    if (totalConfirmedBookings > 0) {
      attendanceRate = (totalPresentAttendances / totalConfirmedBookings) * 100;
    }

    res.json({
      totalRevenue: totalRevenueResult._sum.amount ?? 0,
      unpaidDues: unpaidDuesResult._sum.amount ?? 0,
      activeMembers: activeMembersCount,
      attendanceRate: parseFloat(attendanceRate.toFixed(2)), // Format to 2 decimal places
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

router.get('/monthly-revenue', async (req, res) => {
  const { clubId, month, year } = req.query; // month (1-12), year (e.g., 2023)

  const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
  const currentMonth = month ? parseInt(month as string) - 1 : new Date().getMonth();

  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0);

  let invoiceFilters: any = {
    status: InvoiceStatus.paid,
    issuedAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (clubId) {
    invoiceFilters.clubId = String(clubId);
  } else {
    console.log('Backend /api/billing/monthly-revenue: No clubId provided, fetching GLOBAL monthly revenue.');
  }

  try {
    const monthlyRevenueResult = await prisma.invoice.aggregate({
      where: invoiceFilters,
      _sum: { amount: true },
    });

    const totalMonthlyRevenue = monthlyRevenueResult._sum.amount ?? 0;

    res.json({ monthlyRevenue: totalMonthlyRevenue });
  } catch (err) {
    console.error('Error fetching monthly revenue:', err);
    res.status(500).json({ error: 'Failed to fetch monthly revenue' });
  }
});

// router.get('/revenue-trend', async (req, res) => {
//   const { clubId, startDate, endDate } = req.query; // Add startDate and endDate for optional filtering

//   // IMPORTANT CHANGE: Remove the direct 400 error if clubId is missing.
//   // if (!clubId) return res.status(400).json({ error: 'Missing clubId' }); // <-- REMOVE THIS LINE

//   // Define date range. Default to last 30 days if not provided, or a larger range.
//   // For a trend graph, a default range is usually good. Let's use 90 days for example.
//   const defaultDays = 90;
//   const end = endDate ? new Date(String(endDate)) : new Date();
//   const start = startDate ? new Date(String(startDate)) : new Date();
//   if (!startDate) { // If no startDate provided, default to 90 days ago
//     start.setDate(end.getDate() - defaultDays);
//   }

//   start.setHours(0, 0, 0, 0); // Set to start of the day
//   end.setHours(23, 59, 59, 999); // Set to end of the day

//   let whereClause: any = {
//     status: 'paid', // Only sum paid invoices
//     issuedAt: {
//       gte: start,
//       lte: end,
//     },
//   };

//   // Conditionally add clubId to whereClause
//   if (clubId) {
//     whereClause.clubId = String(clubId);
//     console.log(`Backend /api/billing/revenue-trend: clubId provided (${clubId}), fetching club-specific revenue trend.`);
//   } else {
//     console.log('Backend /api/billing/revenue-trend: No clubId provided, fetching GLOBAL revenue trend.');
//   }

//   try {
//     const results = await prisma.$queryRawUnsafe<
//   { date: string; revenue: number }[]
// >(`
//   SELECT 
//     DATE("issuedAt") AS date, 
//     SUM("amount") AS revenue 
//   FROM "Invoice"
//   WHERE "status" = 'paid'
//     AND "issuedAt" BETWEEN $1 AND $2
//     ${clubId ? `AND "clubId" = '${clubId}'` : ''}
//   GROUP BY DATE("issuedAt")
//   ORDER BY DATE("issuedAt") ASC
// `, start, end);

// console.log('Backend: Raw query results for revenue-trend:', results);

//     // Fill in missing dates with 0 revenue to ensure a continuous trend line
//     const trend: { date: string; revenue: number }[] = [];
//     let currentDate = new Date(start);
//     while (currentDate <= end) {
//       const dateKey = currentDate.toISOString().split('T')[0];
//       const found = results.find(r => r.date === dateKey);
//       trend.push({
//         date: dateKey,
//         revenue: found ? Number(found.revenue) : 0,
//       });
//       currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
//     }

//      console.log('Backend: Processed revenue trend data sent to frontend:', trend); // <-- ADD THIS LINE

//     res.json(trend);
//   } catch (err) {
//     console.error('Revenue trend error:', err);
//     res.status(500).json({ error: 'Failed to fetch revenue trend' });
//   }
// });

router.get('/revenue-trend', async (req: Request, res: Response) => {
  const { clubId, startDate, endDate } = req.query;

  // Define date range.
  const defaultDays = 90;
  const end = endDate ? new Date(String(endDate)) : new Date();
  const start = startDate ? new Date(String(startDate)) : new Date();

  if (!startDate) {
    start.setDate(end.getDate() - defaultDays);
  }

  let whereClause: any = {
    status: InvoiceStatus.paid, // Use enum for status
    issuedAt: {
      gte: start,
      lte: end,
    },
  };

  if (clubId) {
    whereClause.clubId = String(clubId);
    console.log(`Backend /api/billing/revenue-trend: clubId provided (${clubId}), fetching club-specific revenue trend.`);
  } else {
    console.log('Backend /api/billing/revenue-trend: No clubId provided, fetching GLOBAL revenue trend.');
  }

  console.log('Backend /api/billing/revenue-trend: Querying with startDate:', start.toISOString(), 'endDate:', end.toISOString());
  console.log('Backend /api/billing/revenue-trend: Where clause:', JSON.stringify(whereClause, null, 2));

  try {
    // First, let's see what invoices we actually find
    const allInvoices = await prisma.invoice.findMany({
      where: whereClause,
      select: {
        id: true,
        amount: true,
        issuedAt: true,
        status: true,
      },
      orderBy: {
        issuedAt: 'asc',
      },
    });

    console.log('Backend /api/billing/revenue-trend: Found invoices:', allInvoices.length);
    console.log('Backend /api/billing/revenue-trend: Sample invoices:', allInvoices.slice(0, 5));

    // Aggregate by date (YYYY-MM-DD) in the application layer
    const dailyAggregatedRevenue: { [key: string]: number } = {};

    allInvoices.forEach(invoice => {
      // Convert to local date string to avoid timezone issues
      // This ensures consistent date grouping
      const invoiceDate = new Date(invoice.issuedAt);
      const dateKey = invoiceDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      console.log(`Processing invoice ${invoice.id}: ${invoice.issuedAt} -> ${dateKey}, amount: ${invoice.amount}`);
      
      if (!dailyAggregatedRevenue[dateKey]) {
        dailyAggregatedRevenue[dateKey] = 0;
      }
      dailyAggregatedRevenue[dateKey] += Number(invoice.amount) || 0;
    });

    console.log('Backend /api/billing/revenue-trend: Daily aggregated revenue:', dailyAggregatedRevenue);

    // Fill in missing dates with 0 revenue
    const trend: { date: string; revenue: number }[] = [];
    let currentDate = new Date(start);

    // Make sure `currentDate` is also at the start of the day for consistent comparison
    currentDate.setHours(0, 0, 0, 0);
    const endDateCopy = new Date(end);
    endDateCopy.setHours(23, 59, 59, 999);

    while (currentDate <= endDateCopy) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const revenue = dailyAggregatedRevenue[dateKey] || 0;
      
      trend.push({
        date: dateKey,
        revenue: revenue,
      });
      
      currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
      currentDate.setHours(0, 0, 0, 0); // Ensure it stays at the start of the day
    }

    console.log('Backend: Processed revenue trend data sent to frontend (first 10 items):');
    console.log(trend.slice(0, 10));
    console.log('Backend: Non-zero revenue days:');
    console.log(trend.filter(item => item.revenue > 0));
  


  
    res.json(trend);

  } catch (err) {
    console.error('Revenue trend error:', err);
    res.status(500).json({ error: 'Failed to fetch revenue trend' });
  }
});



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

// router.get('/', async (req, res) => {
//   const { clubId, startDate, endDate, type } = req.query;

//   if (!clubId) return res.status(400).json({ error: 'Missing clubId' });

//   try {
//     const invoices = await prisma.invoice.findMany({
//       where: {
//         clubId: String(clubId),
//         issuedAt: {
//           gte: startDate ? new Date(String(startDate)) : undefined,
//           lte: endDate ? new Date(String(endDate)) : undefined,
//         },
//         ...(type && { member: { membershipType: String(type) } }),
//       },
//      include: {
//         member: {
//           select: { firstName: true, lastName: true },
//         },
//       },
//       orderBy: { issuedAt: 'desc' },
//     });

//     const response = invoices.map(inv => ({
//       id: inv.id,
//       memberName: `${inv.member.firstName} ${inv.member.lastName}`,
//       amount: inv.amount,
//       status: inv.status,
//       issuedAt: inv.issuedAt,
//       dueDate: inv.dueDate,
//     }));

//     res.json(response);
//   } catch (err) {
//     console.error('Error fetching billing data:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });


router.get('/', async (req, res) => {
  const { clubId, startDate, endDate, type, limit } = req.query; // Add limit to query params
  const take = parseInt(limit as string) || undefined; // Parse limit, default to undefined if not provided

  // IMPORTANT CHANGE: Remove the direct 400 error if clubId is missing.
  // if (!clubId) return res.status(400).json({ error: 'Missing clubId' }); // <-- REMOVE THIS LINE

  let whereClause: any = {
    issuedAt: {
      gte: startDate ? new Date(String(startDate)) : undefined,
      lte: endDate ? new Date(String(endDate)) : undefined,
    },
    ...(type && { member: { memberType: String(type) } }), // Corrected from membershipType to memberType as per schema
  };

  if (clubId) {
    whereClause.clubId = String(clubId);
  } else {
    console.log('Backend /api/billing: No clubId provided, fetching GLOBAL invoices.');
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where: whereClause, // Use the dynamically built whereClause
      include: {
        member: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { issuedAt: 'desc' },
      take: take, // Apply the limit
    });

    const response = invoices.map(inv => ({
      id: inv.id,
      memberName: inv.member ? `${inv.member.firstName} ${inv.member.lastName}` : 'Unknown Member',
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










export default router;





