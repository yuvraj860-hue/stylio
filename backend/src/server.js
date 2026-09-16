import app from './app.js';
import connectDB from './config/db.js';
import env from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`STYLIO backend running on port ${env.PORT} (${env.NODE_ENV})`);
});

connectDB();