import express from 'express';
import cors from 'cors';
import { connectDB } from './config/dbConfig';
import { errorHandler } from './middlewares/error-middleware';
import documentRoutes from './modules/document/document.routes';

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/documents', documentRoutes);

app.use(errorHandler);

export default app;
