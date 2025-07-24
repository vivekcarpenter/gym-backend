// gym-api/src/controllers/pos.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/request.types';

const prisma = new PrismaClient();

// GET /products
export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const products = await prisma.product.findMany({
      where: {
        clubId: req.user?.clubId,
      },
    });
    res.json(products);
  } catch (err) {
    console.error('GET /products error:', err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// POST /products
export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const { name, category, price, stock } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        category,
        price: parseFloat(price),
        stock: parseInt(stock),
        clubId: req?.user?.clubId as string,
      },
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('POST /products error:', err);
    res.status(500).json({ message: 'Failed to create product' });
  }
};

// PUT /products/:id
export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

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

// DELETE /products/:id
export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const { id } = req.params;

    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('DELETE /products/:id error:', err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

// POST /products/transaction
export const processTransaction = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const { id: staffId, clubId } = req.user;
  const { method, items, memberId } = req.body;

  if (!staffId || !clubId || !method || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid transaction request.' });
  }

  try {
    const total = items.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0
    );

    // Create transaction
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
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    // Update stock for each product
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Create invoice if memberId is provided
    if (memberId) {
      await prisma.invoice.create({
        data: {
          memberId,
          planName: 'POS Sale',
          amount: total,
          status: 'paid',
          clubId,
          issuedAt: new Date(),
          dueDate: new Date(),
        },
      });
    }

    res.status(201).json({ message: 'Transaction completed', transaction: createdTx });
  } catch (error) {
    console.error('Transaction failed:', error);
    res.status(500).json({ error: 'Failed to process transaction.' });
  }
};
