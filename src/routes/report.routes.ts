import express from 'express';
import { exportCSVReport, exportPDFReport } from '../controllers/report.controller';

const router = express.Router();

router.post('/export-csv', exportCSVReport);
router.post('/export-pdf', exportPDFReport);

export default router;
