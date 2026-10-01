import { Router } from 'express';
import { createClerkClient } from '@clerk/backend';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import { sendOtpEmail } from '../utils/mailer.js';

const router = Router();

// In-memory OTP storage with 5-minute TTL:
// email -> { otp, expiresAt, attempts }
const emailOtpStore = new Map();

// Helper to clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of emailOtpStore.entries()) {
    if (data.expiresAt < now) {
      emailOtpStore.delete(email);
    }
  }
}, 60 * 1000);

let clerkClient = null;
if (env.CLERK_SECRET_KEY) {
  clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
}

/**
 * POST /api/auth/email/send-otp
 * Body: { email: string }
 */
router.post('/email/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Generate 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    emailOtpStore.set(cleanEmail, {
      otp,
      expiresAt,
      attempts: 0,
    });

    console.log(`[auth] OTP generated for email [${cleanEmail}]: [${otp}] (expires in 5 min)`);

    let emailSent = false;
    try {
      emailSent = await sendOtpEmail({ to: cleanEmail, otp });
    } catch (e) {
      console.warn('[auth] Error sending OTP email:', e.message);
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? `Verification code sent to ${cleanEmail}. Check your inbox.`
        : `Verification code generated for ${cleanEmail}.`,
      devOtp: env.NODE_ENV !== 'production' || !emailSent ? otp : undefined,
      email: cleanEmail,
    });
  } catch (err) {
    console.error('[auth] email/send-otp error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate OTP. Please try again.' });
  }
});

/**
 * POST /api/auth/email/verify-otp
 * Body: { email: string, otp: string, name?: string }
 */
router.post('/email/verify-otp', async (req, res) => {
  try {
    const { email, otp, name } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email address and OTP code are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const record = emailOtpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      emailOtpStore.delete(cleanEmail);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
    }

    if (record.otp !== String(otp).trim()) {
      record.attempts += 1;
      if (record.attempts >= 5) {
        emailOtpStore.delete(cleanEmail);
        return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
      }
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check and try again.' });
    }

    // OTP is valid! Consume it
    emailOtpStore.delete(cleanEmail);

    const displayName = (name && name.trim()) || cleanEmail.split('@')[0];

    let clerkUser = null;
    let signInToken = null;

    if (clerkClient) {
      try {
        const existing = await clerkClient.users.getUserList({ emailAddress: [cleanEmail] });
        if (existing.data && existing.data.length > 0) {
          clerkUser = existing.data[0];
        } else {
          clerkUser = await clerkClient.users.createUser({
            emailAddress: [cleanEmail],
            firstName: displayName,
            skipPasswordRequirement: true,
            publicMetadata: {
              role: 'user',
            },
          });
        }

        // Generate single-use ticket token for Clerk frontend sign-in
        const tokenObj = await clerkClient.signInTokens.createSignInToken({
          userId: clerkUser.id,
          expiresInSeconds: 600,
        });
        signInToken = tokenObj.token;
      } catch (clerkErr) {
        console.warn('[auth] Clerk user/token handling warning:', clerkErr?.errors || clerkErr?.message);
      }
    }

    // Upsert user in MongoDB
    let dbUser = await User.findOne({ email: cleanEmail });

    if (!dbUser) {
      dbUser = await User.create({
        name: displayName,
        email: cleanEmail,
        role: 'user',
        clerkId: clerkUser?.id || undefined,
      });
    } else {
      if (clerkUser?.id && !dbUser.clerkId) dbUser.clerkId = clerkUser.id;
      if (!dbUser.name && displayName) dbUser.name = displayName;
      await dbUser.save();
    }

    // Fallback JWT token
    const jwtToken = jwt.sign(
      { id: dbUser._id, userId: clerkUser?.id || dbUser._id, email: cleanEmail, role: dbUser.role },
      env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      signInToken,
      jwtToken,
      user: {
        id: dbUser._id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
      },
    });
  } catch (err) {
    console.error('[auth] email/verify-otp error:', err);
    return res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
});

export default router;
