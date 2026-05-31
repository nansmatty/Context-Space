import { Router } from 'express';
import multer from 'multer';
import { askQuestion, uploadDocument } from './document.controller';
import { AppError } from '../../utils/global-error-handler';
import { protect } from '../../middlewares/protect-middleware';

const router = Router();

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit\
	fileFilter: (_req, file, cb) => {
		if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
			cb(null, true);
		} else {
			cb(new AppError('Only PDF and TXT documents are allowed', 400));
		}
	},
});

router.post('/upload', protect, upload.single('file'), uploadDocument);
router.post('/ask', protect, askQuestion);

export default router;
