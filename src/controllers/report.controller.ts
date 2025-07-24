import { Request, Response } from 'express';
import { generateCSVBuffer, generatePDFBuffer } from '../services/reportExport.service';

export const exportCSVReport = async (req: Request, res: Response) => {
  try {
    const filters = req.body;
    const csvBuffer = await generateCSVBuffer(filters);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="gym_report.csv"');
    res.send(csvBuffer);
  } catch (err) {
    console.error('CSV export failed:', err);
    res.status(500).json({ error: 'Failed to generate CSV export.' });
  }
};

export const exportPDFReport = async (req: Request, res: Response) => {
  try {
    const filters = req.body;
    const pdfBuffer = await generatePDFBuffer(filters);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="gym_report.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF export failed:', err);
    res.status(500).json({ error: 'Failed to generate PDF export.' });
  }
};
