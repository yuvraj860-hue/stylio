import { Router } from 'express';
import { createClerkClient } from '@clerk/backend';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';

const router = Router();

// In-memory OTP storage with 5-minute TTL: phone -> { otp, expiresAt, attempts }
const otpStore = new Map();

// Helper to clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(phone);
    }
  }
}, 60 * 1000);

let clerkClient = null;
if (env.CLERK_SECRET_KEY) {
  clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
}

async function sendSmsNotification(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return false;

  try {
    const rawNumber = phone.replace(/\D/g, '').slice(-10);
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: otp,
        numbers: rawNumber,
      }),
    });
    const result = await res.json();
    return result?.return === true;
  } catch (err) {
    console.warn('[auth] Fast2SMS error:', err.message);
    return false;
  }
}

/**
 * POST /api/auth/phone/send-otp
 * Body: { phone: string }
 */
router.post('/phone/send-otp', async (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }

    // Standardize to 10 digits for storage and lookup
    const standard10 = digitsOnly.slice(-10);

    // Generate 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(standard10, {
      otp,
      expiresAt,
      attempts: 0,
    });

    console.log(`[auth] OTP generated for phone +91-${standard10}: [${otp}] (expires in 5 min)`);

    const smsSent = await sendSmsNotification(standard10, otp);

    return res.status(200).json({
      success: true,
      message: smsSent ? 'OTP sent successfully to your mobile number via SMS.' : 'OTP generated successfully.',
      devOtp: env.NODE_ENV !== 'production' || !smsSent ? otp : undefined,
      phone: `+91 ${standard10}`,
    });
  } catch (err) {
    console.error('[auth] send-otp error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate OTP. Please try again.' });
  }
});

/**
 * POST /api/auth/phone/verify-otp
 * Body: { phone: string, otp: string, name?: string }
 */
router.post('/phone/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body || {};
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP are required.' });
    }

    const digitsOnly = phone.replace(/\D/g, '');
    const standard10 = digitsOnly.slice(-10);

    const record = otpStore.get(standard10);
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new OTP.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(standard10);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (record.otp !== String(otp).trim()) {
      record.attempts += 1;
      if (record.attempts >= 5) {
        otpStore.delete(standard10);
        return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
      }
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check and try again.' });
    }

    // OTP is valid! Consume it
    otpStore.delete(standard10);

    const syntheticEmail = `phone_${standard10}@stylio.in`;
    const displayName = (name && name.trim()) || `Customer ${standard10.slice(-4)}`;

    let clerkUser = null;
    let signInToken = null;

    if (clerkClient) {
      try {
        const existing = await clerkClient.users.getUserList({ emailAddress: [syntheticEmail] });
        if (existing.data && existing.data.length > 0) {
          clerkUser = existing.data[0];
        } else {
          clerkUser = await clerkClient.users.createUser({
            emailAddress: [syntheticEmail],
            firstName: displayName,
            skipPasswordRequirement: true,
            publicMetadata: {
              phone: `+91${standard10}`,
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
    let dbUser = await User.findOne({
      $or: [{ phone: standard10 }, { email: syntheticEmail }],
    });

    if (!dbUser) {
      dbUser = await User.create({
        name: displayName,
        email: syntheticEmail,
        phone: standard10,
        role: 'user',
        clerkId: clerkUser?.id || undefined,
      });
    } else {
      if (!dbUser.phone) dbUser.phone = standard10;
      if (clerkUser?.id && !dbUser.clerkId) dbUser.clerkId = clerkUser.id;
      await dbUser.save();
    }

    // Fallback JWT token
    const jwtToken = jwt.sign(
      { id: dbUser._id, userId: clerkUser?.id || dbUser._id, phone: standard10, role: dbUser.role },
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
        phone: standard10,
        email: dbUser.email,
        role: dbUser.role,
      },
    });
  } catch (err) {
    console.error('[auth] verify-otp error:', err);
    return res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
});

export default router;
