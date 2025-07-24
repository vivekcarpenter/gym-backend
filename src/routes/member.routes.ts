//src>routes>member.routes.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { getMembersByTrainer } from '../controllers/member.controller';
import { getMemberJoinTrend } from '../controllers/member.controller';
import { upload } from '../middlewares/upload';


const router = express.Router();
const prisma = new PrismaClient();



router.get('/join-trend', getMemberJoinTrend);

router.get('/count', async (req, res) => {
  try {
    const count = await prisma.member.count({
      where: { memberType: 'member' },
    });
    res.json({ count });
  } catch (err) {
    console.error('Error fetching member count:', err);
    res.status(500).json({ error: 'Failed to fetch member count' });
  }
});



router.get('/search', async (req, res) => {
  const { q = '', clubId } = req.query;

  if (!clubId) {
    return res.status(400).json({ error: 'Missing clubId' });
  }

  try {
    let members;

    if (q.length === 0) {
      // Return recent active members when no query provided
      members = await prisma.member.findMany({
        where: {
          clubId: String(clubId),
          memberType: 'member',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          keyFob: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    } else {
      // Perform filtered search
      members = await prisma.member.findMany({
        where: {
          clubId: String(clubId),
          OR: [
            { firstName: { contains: String(q), mode: 'insensitive' } },
            { lastName: { contains: String(q), mode: 'insensitive' } },
            { email: { contains: String(q), mode: 'insensitive' } },
            { keyFob: { contains: String(q), mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          keyFob: true,
        },
        take: 15,
      });
    }

    res.json(members);
  } catch (err) {
    console.error('Search Error:', err);
    res.status(500).json({ error: 'Failed to search members' });
  }
});


router.get('/by-trainer', getMembersByTrainer); 

// router.post('/', async (req, res) => {
//   try {
//     const {
//       firstName, lastName, email, phone, work, dateOfBirth, gender, avatar,
//       club, keyFob, tags, note, memberType,
//       address, marketing, additional, emergency,
//       medicalInfo,
//     } = req.body;

//     const newMember = await prisma.member.create({
//       data: {
//         firstName,
//         lastName,
//         email,
//         phone,
//         work,
//         dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
//         gender,
//         avatarUrl: avatar || null,
//         keyFob,
//         tags,
//         note,
//         memberType,

//         // Address
//         street: address?.street || null,
//         city: address?.city || null,
//         state: address?.state || null,
//         zip: address?.zip || null,
//         addressSearch: address?.search || null,

//         // Marketing
//         salesRep: marketing?.salesRep || null,
//         sourcePromotion: marketing?.sourcePromotion || null,
//         referredBy: marketing?.referredBy || null,

//         // Additional
//         trainerId: additional?.trainerId || null,
//         joiningDate: additional?.joiningDate ? new Date(additional.joiningDate) : null,
//         occupation: additional?.occupation || null,
//         organization: additional?.organization || null,
//         involvementType: additional?.involvementType || null,

//         // Emergency
    

//         emergency: emergency || [],

//         medicalInfo,
//         clubId: club,
//       },
//     });

//     res.status(201).json(newMember);
//   } catch (err) {
//     console.error('Add Member Error:', err);
//     res.status(500).json({ error: 'Failed to create member' });
//   }
// });



// router.post('/:id/membership', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { planName, startDate, endDate, autoRenew, status } = req.body;

//     const plan = await prisma.membershipPlan.findUnique({
//   where: { name: planName },
// });
// if (!plan) {
//   return res.status(400).json({ error: 'Invalid plan selected' });
// }


//     const active = await prisma.membership.findFirst({
//   where: { memberId: id, status: 'active' }

// });

// if (active) {
//   return res.status(400).json({
//     error: 'This member already has an active membership. Please cancel or expire it first.'
//   });
// }

//     const membership = await prisma.membership.create({
//       data: {
//         planName,
//         startDate: new Date(startDate),
//         endDate: new Date(endDate),
//         autoRenew,
//         status,
//         memberId: id,
//       },
//     });

//     const member = await prisma.member.findUnique({
//       where: { id },
//       select: { clubId: true },
//     });

//     if (!member) {
//       return res.status(404).json({ error: 'Member not found' });
//     }

//     await prisma.invoice.create({
//   data: {
//     memberId: id,
//     planName,
//     amount: plan.price,
//     status: 'unpaid',
//     clubId: member.clubId,
//     issuedAt: new Date(),
//     dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
//   },
// });

//     res.status(201).json(membership);
//   } catch (err) {
//     console.error('Add Membership Error:', err);
//     res.status(500).json({ error: 'Failed to create membership' });
//   }
// });
// In your member.routes.ts, update the membership creation route:


router.post('/', upload.single('avatar'), async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, work, dateOfBirth, gender,
      keyFob, tags, note, memberType, medicalInfo, club
    } = req.body;


     const targetClubId = club || clubId;

    // Validate that club ID is provided
    if (!targetClubId) {
      return res.status(400).json({ error: 'Club ID is required' });
    }

    // Verify the club exists
    const existingClub = await prisma.club.findUnique({
      where: { id: targetClubId }
    });

    if (!existingClub) {
      return res.status(400).json({ error: 'Club not found' });
    }
    const address = JSON.parse(req.body.address || '{}');
    const marketing = JSON.parse(req.body.marketing || '{}');
    const additional = JSON.parse(req.body.additional || '{}');
    const emergency = JSON.parse(req.body.emergency || '[]');

    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newMember = await prisma.member.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        work,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        avatarUrl,
        keyFob,
        tags,
        note,
        memberType,
         club: {
          connect: { id: targetClubId }
        },

        // Address
        street: address?.street || null,
        city: address?.city || null,
        state: address?.state || null,
        zip: address?.zip || null,
        addressSearch: address?.search || null,

        // Marketing
        salesRep: marketing?.salesRep || null,
        sourcePromotion: marketing?.sourcePromotion || null,
        referredBy: marketing?.referredBy || null,

        // Additional
        trainer: additional?.trainerId // <--- Change this line
          ? { connect: { id: additional.trainerId } }
          : undefined,
        joiningDate: additional?.joiningDate ? new Date(additional.joiningDate) : null,
        occupation: additional?.occupation || null,
        organization: additional?.organization || null,
        involvementType: additional?.involvementType || null,

        // Emergency
        emergency,
        medicalInfo,
      },
      include: {
        club: true, // Include club data in response
        trainer: true // Include trainer data if exists
      }
    });

   res.status(201).json(newMember);
  } catch (err) {
    console.error('Add Member Error:', err);
    
    // More specific error handling
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'A member with this email already exists' });
    }
    
    if (err.code === 'P2025') {
      return res.status(400).json({ error: 'Referenced club or trainer not found' });
    }

    res.status(500).json({ error: 'Failed to create member' });
  }
});

router.post('/:id/membership', async (req, res) => {
  try {
    const { id } = req.params;
    const { planName, startDate, endDate, autoRenew, status } = req.body;

    console.log('Creating membership for member:', id);
    console.log('Request body:', req.body);

    const plan = await prisma.membershipPlan.findUnique({
      where: { name: planName },
    });
    
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const active = await prisma.membership.findFirst({
      where: { memberId: id, status: 'active' }
    });

    if (active) {
      return res.status(400).json({
        error: 'This member already has an active membership. Please cancel or expire it first.'
      });
    }

    const membership = await prisma.membership.create({
      data: {
        planName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        autoRenew,
        status,
        memberId: id,
      },
    });

    console.log('Membership created:', membership);

    // Get member details
    const member = await prisma.member.findUnique({
      where: { id },
      select: { clubId: true, firstName: true, lastName: true },
    });

    console.log('Member found:', member);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (!member.clubId) {
      return res.status(400).json({ error: 'Member does not have a clubId assigned' });
    }

    // Create invoice with detailed logging
    console.log('Creating invoice with data:', {
      memberId: id,
      planName,
      amount: plan.price,
      status: 'unpaid',
      clubId: member.clubId,
      issuedAt: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    });

    try {
      const invoice = await prisma.invoice.create({
        data: {
          memberId: id,
          planName,
          amount: plan.price,
          status: 'unpaid',
          clubId: member.clubId,
          issuedAt: new Date(),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        },
      });

      console.log('Invoice created successfully:', invoice);
      
      res.status(201).json({
        membership,
        invoice,
        message: 'Membership and invoice created successfully'
      });
      
    } catch (invoiceError) {
      console.error('Invoice creation error:', invoiceError);
      
      // If invoice creation fails, we might want to rollback the membership
      await prisma.membership.delete({
        where: { id: membership.id }
      });
      
      return res.status(500).json({ 
        error: 'Failed to create invoice', 
        details: invoiceError.message 
      });
    }

  } catch (err) {
    console.error('Add Membership Error:', err);
    res.status(500).json({ 
      error: 'Failed to create membership',
      details: err.message 
    });
  }
});


router.get('/', async (req, res) => {
  try {
    const { tab = 'all', search = '', page = 1, limit = 10, clubId, trainerId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let whereClause: any = {
      clubId: String(clubId),
    };

    if (trainerId) {
    whereClause.trainerId = trainerId; // ✅ FILTER BY TRAINER
  }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    switch (tab) {
      case 'active':
        whereClause.memberType = 'member';
        break;
      case 'expired':
        whereClause.memberType = 'member';
        whereClause.keyFob = null;
        break;
      case 'prospect':
        whereClause.memberType = 'prospect';
        break;
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        whereClause.createdAt = { gte: thirtyDaysAgo };
        break;
      default:
        break;
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.member.count({ where: whereClause }),
    ]);

    res.json({
      data: members,
      meta: {
        total,
        page: Number(page),
        pageSize: Number(limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.get('/upcoming-renewals', async (req, res) => {
  const { clubId, days = 7 } = req.query;

  if (!clubId) return res.status(400).json({ error: 'Missing clubId' });

  const upcomingDate = new Date();
  upcomingDate.setDate(upcomingDate.getDate() + Number(days));

  try {
    const count = await prisma.membership.count({
      where: {
        member: { clubId: String(clubId) },
        endDate: {
          gte: new Date(),
          lte: upcomingDate,
        },
        status: 'active',
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching upcoming renewals:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming renewals' });
  }
});


// GET /api/members/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        trainer: true,
        club: true,
        membership: {
      orderBy: { startDate: 'desc' }, // Get most recent first
      take: 1,                        // Optional: only return one latest
    },
      },
    });

      console.log('👨‍⚕️ Full member details:', member); // ✅ ADD THIS

    if (!member) return res.status(404).json({ error: 'Member not found' });

    res.json(member);
  } catch (err) {
    console.error('Fetch member detail error:', err);
    res.status(500).json({ error: 'Failed to fetch member details' });
  }
});

//update member

// PUT /api/members/:id
// router.put('/:id', async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const updatedData = req.body;

//     const updated = await prisma.member.update({
//       where: { id },
//       data: {
//         firstName: updatedData.firstName,
//         lastName: updatedData.lastName,
//         email: updatedData.email,
//         phone: updatedData.phone,
//         work: updatedData.work,
//         dateOfBirth: updatedData.dateOfBirth ? new Date(updatedData.dateOfBirth) : null,
//         gender: updatedData.gender,
//         avatarUrl: updatedData.avatar || null,
//         keyFob: updatedData.keyFob,
//         tags: updatedData.tags,
//         note: updatedData.note,
//         memberType: updatedData.memberType,

//         // Address
//         street: updatedData.address?.street || null,
//         city: updatedData.address?.city || null,
//         state: updatedData.address?.state || null,
//         zip: updatedData.address?.zip || null,
//         addressSearch: updatedData.address?.search || null,

//         // Marketing
//         salesRep: updatedData.marketing?.salesRep || null,
//         sourcePromotion: updatedData.marketing?.sourcePromotion || null,
//         referredBy: updatedData.marketing?.referredBy || null,

//         // Additional
//         trainerId: updatedData.additional?.trainerId || null,
//         joiningDate: updatedData.additional?.joiningDate ? new Date(updatedData.additional.joiningDate) : null,
//         occupation: updatedData.additional?.occupation || null,
//         organization: updatedData.additional?.organization || null,
//         involvementType: updatedData.additional?.involvementType || null,

//         // Emergency
//         emergency: updatedData.emergency || [],
// //medical information
//         medicalInfo: updatedData.medicalInfo || '',
// allergies: updatedData.allergies || '',
// medications: updatedData.medications || '',
// chronicConditions: updatedData.chronicConditions || '',
// injuries: updatedData.injuries || '',
// doctorContact: updatedData.doctorContact || '',
// lastExamDate: updatedData.lastExamDate ? new Date(updatedData.lastExamDate) : null,
//         clubId: updatedData.club,
//       },
//     });

//     return res.status(200).json(updated);
//   } catch (err) {
//     console.error('Error updating member:', err);
//     return res.status(500).json({ error: 'Failed to update member' });
//   }
// });

// PATCH /api/members/:id → partial update
// router.patch('/:id', async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const updated = await prisma.member.update({
//       where: { id },
//       data: req.body, // allows partial fields like { emergency: [...] }
//     });

//     return res.status(200).json(updated);
//   } catch (err) {
//     console.error('Error patching member:', err);
//     return res.status(500).json({ error: 'Failed to update member' });
//   }
// });



// Your other member routes...

// The new PATCH endpoint
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const incomingData = req.body; // This is the payload from the frontend (EditDetailsPanel's form state)

    // Build the data object for Prisma's update operation
    const updatePayload: { [key: string]: any } = {};

    // --- Direct scalar fields ---
    // Only include if they exist in the incomingData
    if (incomingData.firstName !== undefined) updatePayload.firstName = incomingData.firstName;
    if (incomingData.lastName !== undefined) updatePayload.lastName = incomingData.lastName;
    if (incomingData.email !== undefined) updatePayload.email = incomingData.email;
    if (incomingData.phone !== undefined) updatePayload.phone = incomingData.phone;
    if (incomingData.work !== undefined) updatePayload.work = incomingData.work;
    if (incomingData.gender !== undefined) updatePayload.gender = incomingData.gender;
    if (incomingData.avatarUrl !== undefined) updatePayload.avatarUrl = incomingData.avatarUrl; // Assuming 'avatarUrl' now, not 'avatar'
    if (incomingData.keyFob !== undefined) updatePayload.keyFob = incomingData.keyFob;
    if (incomingData.tags !== undefined) updatePayload.tags = incomingData.tags;
    if (incomingData.note !== undefined) updatePayload.note = incomingData.note;
    if (incomingData.memberType !== undefined) updatePayload.memberType = incomingData.memberType;
    if (incomingData.medicalInfo !== undefined) updatePayload.medicalInfo = incomingData.medicalInfo;
    if (incomingData.allergies !== undefined) updatePayload.allergies = incomingData.allergies;
    if (incomingData.medications !== undefined) updatePayload.medications = incomingData.medications;
    if (incomingData.chronicConditions !== undefined) updatePayload.chronicConditions = incomingData.chronicConditions;
    if (incomingData.injuries !== undefined) updatePayload.injuries = incomingData.injuries;
    if (incomingData.doctorContact !== undefined) updatePayload.doctorContact = incomingData.doctorContact;


    // --- Date fields transformation ---
    // Ensure they are converted to Date objects or null if empty string
    if (incomingData.dateOfBirth !== undefined) {
      updatePayload.dateOfBirth = incomingData.dateOfBirth ? new Date(incomingData.dateOfBirth) : null;
    }
    if (incomingData.lastExamDate !== undefined) {
      updatePayload.lastExamDate = incomingData.lastExamDate ? new Date(incomingData.lastExamDate) : null;
    }

    // --- Nested objects (address, marketing, additional) ---
    // These typically map to direct fields on the Member model, but were grouped on frontend.
    // Ensure we check for the existence of the nested object first.

    // Address fields
    if (incomingData.street !== undefined) updatePayload.street = incomingData.street;
    if (incomingData.city !== undefined) updatePayload.city = incomingData.city;
    if (incomingData.state !== undefined) updatePayload.state = incomingData.state;
    if (incomingData.zip !== undefined) updatePayload.zip = incomingData.zip;
    if (incomingData.addressSearch !== undefined) updatePayload.addressSearch = incomingData.addressSearch;


    // Marketing fields
    if (incomingData.salesRep !== undefined) updatePayload.salesRep = incomingData.salesRep;
    if (incomingData.sourcePromotion !== undefined) updatePayload.sourcePromotion = incomingData.sourcePromotion;
    if (incomingData.referredBy !== undefined) updatePayload.referredBy = incomingData.referredBy;

    // Additional fields
    if (incomingData.trainerId !== undefined) updatePayload.trainerId = incomingData.trainerId; // Direct foreign key
    if (incomingData.joiningDate !== undefined) {
        updatePayload.joiningDate = incomingData.joiningDate ? new Date(incomingData.joiningDate) : null;
    }
    if (incomingData.occupation !== undefined) updatePayload.occupation = incomingData.occupation;
    if (incomingData.organization !== undefined) updatePayload.organization = incomingData.organization;
    if (incomingData.involvementType !== undefined) updatePayload.involvementType = incomingData.involvementType;

    // --- Emergency (JSONB array field) ---
    // This is passed directly as an array from the frontend to the JSONB field in DB.
    if (incomingData.emergency !== undefined) {
      updatePayload.emergency = incomingData.emergency;
    }

    // --- clubId (Foreign Key) ---
    // This is a direct foreign key and is sent as `clubId` from the frontend (from form.clubId)
    // The previous error showed `clubId: "0b2511fa-af90-4f0a-9737-3a195d068a22"` was being passed correctly.
    if (incomingData.clubId !== undefined) {
      updatePayload.clubId = incomingData.clubId;
    }


    // IMPORTANT: Exclude fields that are NOT part of your Member model's direct columns
    // or are relationships that require special Prisma syntax (like `connect`).
    // Examples to explicitly NOT include: `id`, `user`, `club` (the object, only `clubId` is a scalar),
    // `membership`, `billing`, `createdAt`, `updatedAt`, `__typename` (if from GraphQL), etc.
    // The previous error was caused by `id` and `userId` being sent directly in `data`.


    console.log('Updating member with ID:', id);
    console.log('Data being sent to Prisma:', updatePayload); // Log the payload to ensure it's correct

    const updated = await prisma.member.update({
      where: { id },
      data: updatePayload, // Use the carefully constructed updatePayload
    });

    return res.status(200).json(updated);
  } catch (err: any) {
    console.error('Error patching member:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Request body that caused error:', req.body); // Still good to log the raw incoming data for debugging
    return res.status(500).json({ error: 'Failed to update member', details: err.message });
  }
});

export default router; // Don't forget to export your router


// GET /api/members/:id/sessions - All attendance sessions for a member
router.get('/:id/sessions', async (req, res) => {
  const { id } = req.params;

  try {
    const attendanceRecords = await prisma.attendance.findMany({
      where: { memberId: id },
      orderBy: { markedAt: 'desc' },
      include: {
        schedule: {
          include: {
            trainer: { select: { name: true } },
            location: { select: { name: true } }
          }
        }
      }
    });

    res.json(attendanceRecords);
  } catch (err) {
    console.error('Error fetching session history:', err);
    res.status(500).json({ error: 'Failed to fetch session history' });
  }
});

// GET /api/members/join-trend
router.get('/join-trend', async (req, res) => {
  const { clubId } = req.query;

  if (!clubId) return res.status(400).json({ error: 'Missing clubId' });

  try {
    const result = await prisma.member.groupBy({
      by: ['joiningDate'],
      where: {
        clubId: String(clubId),
        memberType: 'member',
        joiningDate: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        joiningDate: 'asc',
      },
    });

    const trend = result.map((r) => ({
      date: r.joiningDate.toISOString().split('T')[0],
      count: r._count._all,
    }));

    res.json(trend);
  } catch (err) {
    console.error('Join trend error:', err);
    res.status(500).json({ error: 'Failed to fetch join trend' });
  }
});


// GET /api/billing/revenue-trend












export default router;
