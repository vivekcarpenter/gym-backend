// gym-api/src/controllers/pos.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        clubId: req.user.clubId,
      },
    });
    res.json(products);
  } catch (err) {
    console.error('GET /products error:', err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, category, price, stock } = req.body;
    const product = await prisma.product.create({
      data: {
        name,
        category,
        price: parseFloat(price),
        stock: parseInt(stock),
        clubId: req.user.clubId,
      },
    });
    res.status(201).json(product);
  } catch (err) {
    console.error('POST /products error:', err);
    res.status(500).json({ message: 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, price, stock } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        price: parseFloat(price),
        stock: parseInt(stock),
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('PUT /products/:id error:', err);
    res.status(500).json({ message: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('DELETE /products/:id error:', err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

export const processTransaction = async (req: Request, res: Response) => {
  const staffId = req.user?.id;
  const clubId = req.user?.clubId;
  // Destructure memberId from the request body
  const { method, items, memberId } = req.body;

  if (!staffId || !clubId || !method || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid transaction request.' });
  }

  try {
    const total = items.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0
    );

    const createdTx = await prisma.productTransaction.create({
      data: {
        staffId,
        clubId,
        method,
        total,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }
      },
      include: { items: true }
    });

    // Decrease stock for each product
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    // Create Invoice, using the memberId from the request body, which can be null
    await prisma.invoice.create({
      data: {
        memberId: memberId || null, // Use the memberId from req.body, default to null if not provided
        planName: 'POS Sale',
        amount: total,
        status: 'paid',
        clubId,
        issuedAt: new Date(),
        dueDate: new Date(),
      }
    });

    res.status(201).json({ message: 'Transaction completed', transaction: createdTx });
  } catch (error) {
    console.error('Transaction failed:', error);
    res.status(500).json({ error: 'Failed to process transaction.' });
  }
};

