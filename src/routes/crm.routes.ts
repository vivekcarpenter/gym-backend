import express from 'express';
import {
  getLeadsByStatus,
  getAllProspects,
  createLead,
  updateLead,
  deleteLead,
  getLeadById,
  addCommunication,
  getStaffMembers,
  convertLead,
} from '../controllers/crm.controller';

const router = express.Router();

// Lead routes
router.get('/leads', getLeadsByStatus);          // Get leads by status
router.get('/leads/:id', getLeadById);           // Get single lead
router.post('/leads', createLead);               // Create new lead
router.put('/leads/:id', updateLead);            // Update lead
router.delete('/leads/:id', deleteLead);         // Delete lead

// Prospect routes
router.get('/prospects', getAllProspects);       // Get all prospects

// Communication routes
router.post('/communications', addCommunication); // Add communication to lead

// Staff routes
router.get('/staff', getStaffMembers);           // Get staff members for assignment

router.put('/leads/:id/convert', convertLead);

export default router;
