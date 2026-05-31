import { Router } from 'express';
import {
	loginController,
	logoutController,
	protectedTestController,
	registerController,
	resendOTPController,
	verifyOTPController,
} from './auth.controller';
import { protect } from '../../middlewares/protect-middleware';

const router = Router();

router.post('/register', registerController);
router.post('/verify-otp', verifyOTPController);
router.post('/resend-otp', resendOTPController);
router.post('/login', loginController);
router.post('/logout', logoutController);

// Temporary endpoint for testing protected routes
router.get('/protected-test', protect, protectedTestController);

export default router;
