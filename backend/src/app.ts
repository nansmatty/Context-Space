import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';

import { errorHandler } from './middlewares/error-middleware';
import authRoutes from './modules/auth/auth.routes';
import documentRoutes from './modules/document/document.routes';
import { notFoundHandler } from './middlewares/not-found-middleware';
import { checkDBHealth } from './config/dbConfig';
import { env } from 'process';

const app = express();

app.use((req, res, next) => {
	req.requestId = crypto.randomUUID();
	next();
});

app.use(
	cors({
		origin: env.NODE_ENV === 'production' ? env.CLIENT_URL : '*',
		credentials: true,
	}),
);
app.use(helmet());
app.use(cookieParser());

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

app.get('/health', async (_req, res) => {
	const dbHealth = await checkDBHealth();

	res.status(dbHealth ? 200 : 503).json({
		status: dbHealth ? 'healthy' : 'unhealthy',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		database: dbHealth ? 'connected' : 'disconnected',
	});
});

app.use('/api/documents', documentRoutes);
app.use('/api/auth', authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
