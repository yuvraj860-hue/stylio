import dotenv from 'dotenv';
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';

const JWT_SECRET = process.env.JWT_SECRET || '';
if (NODE_ENV === 'production' && !JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/stylio',
  JWT_SECRET: JWT_SECRET || 'stylio_dev_secret_change_me',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'STYLIO <no-reply@stylio.in>',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',
  NODE_ENV,
};

export default env;