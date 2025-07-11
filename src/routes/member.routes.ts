import express from 'express';
import { PrismaClient } from '@prisma/client';

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
        emergencyName: emergency?.name || null,
        emergencyRelationship: emergency?.relationship || null,
        emergencyPhone: emergency?.phone || null,
        emergencyEmail: emergency?.email || null,

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
      },
    });

    if (!member) return res.status(404).json({ error: 'Member not found' });

    res.json(member);
  } catch (err) {
    console.error('Fetch member detail error:', err);
    res.status(500).json({ error: 'Failed to fetch member details' });
  }
});



export default router;
