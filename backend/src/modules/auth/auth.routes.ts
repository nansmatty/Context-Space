import { Router } from 'express';
import { loginController, logoutController, registerController, resendOTPController, verifyOTPController } from './auth.controller';

const router = Router();

router.post('/register', registerController);
router.post('/verify-otp', verifyOTPController);
router.post('/resend-otp', resendOTPController);
router.post('/login', loginController);
router.post('/logout', logoutController);

export default router;
