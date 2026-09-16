import mongoose from 'mongoose';
import env from './env.js';

let dbReady = false;
let retryTimer = null;
let usingMemoryServer = false;

const log = (msg) => console.log(`[db] ${msg}`);
const warn = (msg) => console.warn(`[db] ${msg}`);

mongoose.connection.on('connected', () => {
  dbReady = true;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  log(`MongoDB connected: ${mongoose.connection.host}`);
});

mongoose.connection.on('disconnected', () => {
  dbReady = false;
  warn('MongoDB disconnected. Requests will return 503 until reconnected.');
});

mongoose.connection.on('error', (err) => {
  dbReady = false;
  warn(`MongoDB error: ${err.message}`);
});

export const isDBReady = () => dbReady;

const RETRY_MS = 5000;

const tryConnect = async () => {
  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
  } catch (err) {
    dbReady = false;
    if (usingMemoryServer) {
      warn(`In-memory MongoDB connection failed: ${err.message}. Retrying in ${RETRY_MS / 1000}s…`);
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(tryConnect, RETRY_MS);
      return;
    }
    warn(`MongoDB connection failed (${err.message}). Starting in-memory MongoDB…`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      usingMemoryServer = true;
      global.__stylioMemoryMongo = mongod;
      warn(`In-memory MongoDB started: ${mongod.getUri()}`);
      await mongoose.connect(mongod.getUri(), { serverSelectionTimeoutMS: 3000 });
    } catch (err2) {
      warn(`In-memory MongoDB failed too: ${err2.message}. Retrying in ${RETRY_MS / 1000}s…`);
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(tryConnect, RETRY_MS);
    }
  }
};

const isUsingMemoryServer = () => usingMemoryServer;

const connectDB = () => tryConnect();

export { isUsingMemoryServer };
export default connectDB;