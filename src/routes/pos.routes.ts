import express from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  processTransaction
} from '../controllers/pos.controller';

import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();


router.get('/', authMiddleware, getProducts);
router.post('/', authMiddleware, createProduct);
router.put('/:id', authMiddleware, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);
router.post('/transactions', authMiddleware, processTransaction);

export default router;
