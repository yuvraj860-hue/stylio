import app from './app.js';
import connectDB, { isUsingMemoryServer } from './config/db.js';
import env from './config/env.js';
import seedDatabase from './seed.js';
import mongoose from 'mongoose';

app.listen(env.PORT, () => {
  console.log(`STYLIO backend running on port ${env.PORT} (${env.NODE_ENV})`);
});

const onDBReady = async () => {
  if (mongoose.connection.readyState !== 1) {
    setTimeout(onDBReady, 500);
    return;
  }
  if (env.NODE_ENV !== 'production' || isUsingMemoryServer()) {
    try {
      await seedDatabase();
    } catch (err) {
      console.warn(`[server] Auto-seed skipped: ${err.message}`);
    }
  }
};

connectDB();
mongoose.connection.once('connected', onDBReady);