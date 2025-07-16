import express from 'express';
import {
  getTrainingResources,
  createTrainingResource,
  uploadTrainingFile,
} from '../controllers/training.controller';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // For local dev; use S3/Supabase in prod

router.get('/', getTrainingResources);
router.post('/', createTrainingResource);
router.post('/upload', upload.single('file'), uploadTrainingFile);

export default router;
