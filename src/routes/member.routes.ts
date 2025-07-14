//src>routes>member.routes.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, work, dateOfBirth, gender, avatar,
      club, keyFob, tags, note, memberType,
      address, marketing, additional, emergency,
      medicalInfo,
    } = req.body;

    const newMember = await prisma.member.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        work,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        avatarUrl: avatar || null,
        keyFob,
        tags,
        note,
        memberType,

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
        trainerId: additional?.trainerId || null,
        joiningDate: additional?.joiningDate ? new Date(additional.joiningDate) : null,
        occupation: additional?.occupation || null,
        organization: additional?.organization || null,
        involvementType: additional?.involvementType || null,

        // Emergency
    

        emergency: emergency || [],

        medicalInfo,
        clubId: club,
      },
    });

    res.status(201).json(newMember);
  } catch (err) {
    console.error('Add Member Error:', err);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// Add membership to a Member

router.post('/:id/membership', async (req, res) => {
  try {
    const { id } = req.params;
    const { planName, startDate, endDate, autoRenew, status } = req.body;

    const plan = await prisma.membershipPlan.findUnique({
  where: { name: planName },
});
if (!plan) {
  return res.status(400).json({ error: 'Invalid plan selected' });
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

    await prisma.invoice.create({
  data: {
    memberId: id,
    planName,
    amount: plan.price,
    status: 'unpaid',
    issuedAt: new Date(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
  },
});

    res.status(201).json(membership);
  } catch (err) {
    console.error('Add Membership Error:', err);
    res.status(500).json({ error: 'Failed to create membership' });
  }
});


router.get('/', async (req, res) => {
  try {
    const { tab = 'all', search = '', page = 1, limit = 10, clubId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let whereClause: any = {
      clubId: String(clubId),
    };

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

// GET /api/members/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        trainer: true,
        club: true,
        membership:true,
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
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updated = await prisma.member.update({
      where: { id },
      data: {
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        email: updatedData.email,
        phone: updatedData.phone,
        work: updatedData.work,
        dateOfBirth: updatedData.dateOfBirth ? new Date(updatedData.dateOfBirth) : null,
        gender: updatedData.gender,
        avatarUrl: updatedData.avatar || null,
        keyFob: updatedData.keyFob,
        tags: updatedData.tags,
        note: updatedData.note,
        memberType: updatedData.memberType,

        // Address
        street: updatedData.address?.street || null,
        city: updatedData.address?.city || null,
        state: updatedData.address?.state || null,
        zip: updatedData.address?.zip || null,
        addressSearch: updatedData.address?.search || null,

        // Marketing
        salesRep: updatedData.marketing?.salesRep || null,
        sourcePromotion: updatedData.marketing?.sourcePromotion || null,
        referredBy: updatedData.marketing?.referredBy || null,

        // Additional
        trainerId: updatedData.additional?.trainerId || null,
        joiningDate: updatedData.additional?.joiningDate ? new Date(updatedData.additional.joiningDate) : null,
        occupation: updatedData.additional?.occupation || null,
        organization: updatedData.additional?.organization || null,
        involvementType: updatedData.additional?.involvementType || null,

        // Emergency
        emergency: updatedData.emergency || [],
//medical information
        medicalInfo: updatedData.medicalInfo || '',
allergies: updatedData.allergies || '',
medications: updatedData.medications || '',
chronicConditions: updatedData.chronicConditions || '',
injuries: updatedData.injuries || '',
doctorContact: updatedData.doctorContact || '',
lastExamDate: updatedData.lastExamDate ? new Date(updatedData.lastExamDate) : null,
        clubId: updatedData.club,
      },
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating member:', err);
    return res.status(500).json({ error: 'Failed to update member' });
  }
});




export default router;
