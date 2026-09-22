import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import restRoutes from './routes/index.js';
import { locateRoutes } from './routes/currency.js';
import errorHandler from './middleware/errorHandler.js';
import env from './config/env.js';
import { isDBReady } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

const corsOrigin =
  env.NODE_ENV === 'production'
    ? env.CORS_ORIGIN
      ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : false
    : true;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests, please try again later',
  },
});
app.use('/api', apiLimiter);

app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = states[mongoose.connection.readyState] ?? 'unknown';
  res.status(dbState === 'connected' ? 200 : 503).json({
    status: dbState === 'connected' ? 'ok' : 'degraded',
    service: 'stylio-backend',
    db: dbState,
    mongoUri: env.MONGO_URI.replace(/\/\/[^@/]+@/, '//***@'),
  });
});

locateRoutes(app);

// Return a clear 503 when MongoDB is down instead of letting DB-backed
// routes fail with a 500 (helps during local development / deployments).
app.use('/api', (req, res, next) => {
  if (!isDBReady()) {
    return res.status(503).json({
      status: 503,
      message: 'Database not available. Backend will reconnect automatically once MongoDB is running.',
    });
  }
  next();
});

app.use('/api', restRoutes);

app.use((req, res) => {
  res.status(404).json({ status: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

export default app;