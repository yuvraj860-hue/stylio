import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/backend';
import env from '../config/env.js';

export const clerkAuth = ClerkExpressRequireAuth({
  secretKey: env.CLERK_SECRET_KEY,
});

export const clerkOptionalAuth = ClerkExpressWithAuth({
  secretKey: env.CLERK_SECRET_KEY,
});