import express from 'express';
import cors from 'cors';
import { connectDB } from './config/dbConfig';
import { errorHandler } from './middlewares/error-middleware';

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use(errorHandler);

export default app;
