// Usage:
//   node scripts/make-admin.js --email=you@example.com [--name="Your Name"] [--role=admin]
//
// Links a Clerk user (by email) to MongoDB and sets role + Clerk publicMetadata.
// Requires CLERK_SECRET_KEY in backend/.env for Clerk lookup/metadata update.
// Falls back to email-only Mongo upsert if Clerk lookup fails.
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, ...rest] = a.slice(2).split('=');
      return [k, rest.join('=')];
    })
);

const email = (args.email || '').toLowerCase().trim();
const name = (args.name || 'STYLIO Admin').trim();
const role = (args.role || 'admin').trim();

if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
  console.error('Provide a valid email: node scripts/make-admin.js --email=you@example.com');
  process.exit(1);
}
if (!['admin', 'delivery', 'warehouse', 'user'].includes(role)) {
  console.error('Invalid role. Use: admin | delivery | warehouse | user');
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stylio';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || '';

let clerkId = null;

if (CLERK_SECRET_KEY) {
  try {
    const { createClerkClient } = await import('@clerk/backend');
    const clerk = createClerkClient({
      secretKey: CLERK_SECRET_KEY,
      publishableKey: CLERK_PUBLISHABLE_KEY || undefined,
    });
    const list = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
    const clerkUser = list?.data?.[0];
    if (clerkUser) {
      clerkId = clerkUser.id;
      console.log(`[make-admin] Found Clerk user: ${clerkId}`);
      await clerk.users.updateUser(clerkId, {
        publicMetadata: { ...(clerkUser.publicMetadata || {}), role },
      });
      console.log(`[make-admin] Set Clerk publicMetadata.role=${role}`);
    } else {
      console.warn('[make-admin] No Clerk user found for this email (sign up via Clerk first, then re-run to link).');
    }
  } catch (err) {
    console.warn(`[make-admin] Clerk lookup failed: ${err.message} — continuing with email-only upsert.`);
  }
} else {
  console.warn('[make-admin] CLERK_SECRET_KEY not set — continuing with email-only upsert.');
}

await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
const { default: User } = await import('../src/models/User.js');

let user = clerkId ? await User.findOne({ clerkId }) : null;
if (!user) {
  user = await User.findOne({ email });
}
if (user) {
  user.role = role;
  if (clerkId && !user.clerkId) user.clerkId = clerkId;
  if (clerkId && user.email !== email) {
    console.warn(`[make-admin] NOTE: user already linked to ${user.email}; keeping existing email. Delete duplicates manually if needed.`);
  }
  await user.save();
  console.log(`[make-admin] Updated existing user ${user.email} -> role=${user.role}`);
} else {
  user = await User.create({ name, email, clerkId: clerkId || undefined, role });
  console.log(`[make-admin] Created user ${user.email} with role=${user.role}`);
}

console.log(JSON.stringify({ id: String(user._id), email: user.email, role: user.role, clerkId: user.clerkId || null }));
await mongoose.disconnect();
process.exit(0);
