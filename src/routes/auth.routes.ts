import { Router } from 'express';
import { loginController , setupPassword} from '../controllers/auth.controller';

const router = Router();

router.post('/login', loginController);

router.post('/set-password', setupPassword);

export default router;