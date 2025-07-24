import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fetch leads by status and clubId
export const getLeadsByStatus = async (req: Request, res: Response) => {
  const { status, clubId } = req.query;

  if (!status ) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const whereClause: any = { // Use 'any' for now to allow dynamic properties
      status: status as string,
    };

    // Conditionally add clubId to the where clause if it's provided and not an empty string
    if (clubId && clubId !== '') { // Check if clubId exists and is not an empty string
      whereClause.clubId = clubId as string;
    }
    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        member: true,
      },
    });

    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads by status', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

// Fetch single lead by id
export const getLeadById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: id.toString() },
      include: { member: true },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead by ID', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
};

// Create a new lead
export const createLead = async (req: Request, res: Response) => {
  const { name, email, phone, status, clubId, prospectId } = req.body;

  if (!name || !email || !phone || !status || !clubId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const leadData : any = ({
      
        name,
        email,
        phone,
        status,
        club: { connect: { id: clubId } },
    
    });

    // If a prospectId is provided, connect the new lead to that member
    if (prospectId) {
      // Ensure that the Member with prospectId exists and is a 'prospect'
      const existingProspect = await prisma.member.findUnique({
        where: { id: prospectId },
        // You might want to add a check here if memberType === 'prospect'
        // If not a prospect, you might throw an error or handle differently.
      });

      if (existingProspect) {
        leadData.member = { connect: { id: prospectId } };
      } else {
        console.warn(`Prospect with ID ${prospectId} not found or not a valid prospect.`);
        // Decide how to handle this:
        // Option A: Just proceed with creating the lead without linking to a member.
        // Option B: Return an error if linking to a prospect is mandatory.
      }
    }

    const newlead = await prisma.lead.create({
      data: leadData,
    });

    res.status(201).json(newlead);
  } catch (error) {
    console.error('Error creating lead', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
};

// Update an existing lead


export const updateLead = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, status } = req.body;

  if (!name || !email || !phone || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const lead = await prisma.lead.update({
      where: { id: id.toString() }, 
      data: { name, email, phone, status },
    });

    res.json(lead);
  } catch (error) {
    console.error('Error updating lead', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

// Delete a lead
export const deleteLead = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.lead.delete({
      where: { id: id.toString() },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting lead', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
};

// Get all prospects
export const getAllProspects = async (req: Request, res: Response) => {
  try {
    const prospects = await prisma.member.findMany({
      where: { memberType: 'prospect' },
      include: { 
        club: true, // Include club information if needed
        lead: {
            select: { id: true } // Include lead ID to check if the prospect has a lead
        }
       },
    });

    res.json(prospects);
  } catch (error) {
    console.error('Error fetching prospects', error);
    res.status(500).json({ error: 'Failed to fetch prospects' });
  }
};

// Add communication to a lead
export const addCommunication = async (req: Request, res: Response) => {
  const { leadId, memberId, type, content, note, clubId } = req.body;

  if (!leadId || !type || !note || !clubId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const communicationData : any = ({
      
        lead: { connect: { id: leadId } },
        
        type,
        content,
        note,
        club: { connect: { id: clubId } },
      
    });
     if (memberId) { // Only add member connection if memberId is present
      communicationData.member = { connect: { id: memberId } };
    }
     const communication = await prisma.communication.create({
      data: communicationData, // Use the dynamically built data object
    });

    const updatedLead = await prisma.lead.update({
      where: { id: leadId }, // Use leadId to find the lead
      data: { status: 'CONTACTED' }, // Set its status to CONTACTED
    });

    res.status(201).json(updatedLead);
  } catch (error) {
    console.error('Error adding communication', error);
    res.status(500).json({ error: 'Failed to add communication' });
  }
};

// Fetch staff members for assignment
export const getStaffMembers = async (req: Request, res: Response) => {
  try {
    const staff = await prisma.user.findMany({
      where: { role: 'staff' },
    });

    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff members', error);
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
};

// controllers/crm.controller.ts

// ... (existing imports and other controller functions)

export const convertLead = async (req: Request, res: Response) => {
  const { id } = req.params; // ID from URL

  try {
    // Fetch lead with member
    const leadToConvert = await prisma.lead.findUnique({
      where: { id: id.toString() },
      include: { member: true }, // just 'true' for include
    });

    if (!leadToConvert) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // Transactionally convert lead + update member if linked
    let actions = [
      prisma.lead.update({
        where: { id: id.toString() },
        data: {
          status: 'CONVERTED',
          convertedAt: new Date(),
        },
      }),
    ];

    if (leadToConvert.member?.id) {
  actions.push(
    prisma.member.update({
      where: { id: leadToConvert.member.id.toString() },
      data: { memberType: 'member' },
    })
  );
}

    const [updatedLead] = await prisma.$transaction(actions);

    res.status(200).json(updatedLead);
  } catch (error) {
    console.error('Error converting lead:', error);
    res.status(500).json({ message: 'Failed to convert lead', error: (error as Error).message });
  }
};


