import { Router } from 'express';
import multer from 'multer';
import { uploadDocument } from './document.controller';
import { AppError } from '../../utils/global-error-handler';

const router = Router();

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit\
	fileFilter: (req, file, cb) => {
		if (file.mimetype === 'application/pdf') {
			cb(null, true);
		} else {
			cb(new AppError('Only PDF documents are allowed', 400));
		}
	},
});

router.post('/upload', upload.single('file'), uploadDocument);

export default router;
