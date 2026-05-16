import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import crypto from 'crypto';

import { errorHandler } from './middlewares/error-middleware';
import documentRoutes from './modules/document/document.routes';
import { notFoundHandler } from './middlewares/not-found-middleware';

const app = express();

app.use((req, res, next) => {
	req.requestId = crypto.randomUUID();
	next();
});

app.use(cors());
app.use(helmet());

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	message: 'Too many requests from this IP, please try again later',
});

app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(mongoSanitize());
app.use(hpp());

app.use('/api/documents', documentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
