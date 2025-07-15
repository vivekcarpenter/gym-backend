import express from 'express';
import { getAllClubs, createClub, updateClub, deleteClub , getClubById, 
    getMembersByClub, getClubTrainers, getClubSchedules, getClubInvoices,
suspendClub, activateClub} from '../controllers/club.controller';  
import { PrismaClient } from '@prisma/client';
const router = express.Router();
const prisma = new PrismaClient();


router.get('/', getAllClubs);
router.get('/:id', getClubById);
router.get('/:id/members', getMembersByClub);
router.get('/:id/trainers', getClubTrainers);
router.get('/:id/schedules', getClubSchedules);
router.get('/:id/invoices', getClubInvoices);




router.post('/', createClub);
router.put('/:id', updateClub);
router.delete('/:id', deleteClub);  


router.patch('/:id/suspend', suspendClub);
router.patch('/:id/activate', activateClub);



export default router;



