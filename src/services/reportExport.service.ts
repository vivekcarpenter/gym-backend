import { PrismaClient } from '@prisma/client';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

export const generateCSVBuffer = async (filters: any) => {
  const data = await fetchFilteredData(filters);

  if (!data.length) {
    return Buffer.from('No data found for selected filters.');
  }

  const fields = Object.keys(data[0] || {});
  const parser = new Parser({ fields });
  const csv = parser.parse(data);

  return Buffer.from(csv);
};

export const generatePDFBuffer = async (filters: any) => {
  const data = await fetchFilteredData(filters);
  const doc = new PDFDocument();

  doc.fontSize(18).text('Gym Report', { align: 'center' }).moveDown();

  if (!data.length) {
    doc.fontSize(14).text('No data found for selected filters.', { align: 'center' });
  } else {
    data.forEach((entry, index) => {
      doc.fontSize(12).text(`${index + 1}. ${JSON.stringify(entry)}`);
    });
  }

  doc.end();

  // ✅ Correct way to handle ES module import
  try {
    const { default: getStream } = await import('get-stream');
    return await getStream.buffer(doc);
  } catch (error) {
    // Fallback method if get-stream fails
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      doc.on('error', (err) => {
        reject(err);
      });
    });
  }
};

const fetchFilteredData = async (filters: any) => {
  const { startDate, endDate, clubId, membershipType } = filters;

  return await prisma.member.findMany({
    where: {
      clubId: clubId || undefined,
      membershipType: membershipType || undefined,
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    include: {
      club: true,
      membership: true,
    },
  });
};