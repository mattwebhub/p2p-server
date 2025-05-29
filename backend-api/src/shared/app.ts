import express from 'express';
import cors from 'cors';
import { roomsRouter } from './rooms/routes';
import { turnRouter } from './turn/routes';
import { errorHandler } from './shared/middleware/errorHandler';

// Create Express application
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/rooms', roomsRouter);
app.use('/api', turnRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
