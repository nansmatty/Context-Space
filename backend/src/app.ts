import express from 'express';
import cors from 'cors';
import { connectDB } from './config/dbConfig';
import { errorHandler } from './middlewares/error-middleware';
import documentRoutes from './modules/document/document.routes';
import { notFoundHandler } from './middlewares/not-found-middleware';

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// app.use((req, res, next) => {
// 	req.requestId = crypto.randomUUID();
// 	next();
// });

app.use('/api/documents', documentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
