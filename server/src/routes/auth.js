import { Router } from 'express';
import db from '../db.js';
import {
  clearUserCookie,
  requireUser,
  setUserCookie,
  signSignupToken,
  signUserToken,
  verifySignupToken,
} from '../middleware/auth.js';
import { OTP_CODE, validatePhone, validateUsername, buildDisplayName } from '../utils/helpers.js';

const router = Router();

router.post('/send-otp', (req, res) => {
  const phone = validatePhone(req.body.phone);
  if (!phone) {
    return res.status(400).json({ error: 'شماره موبایل باید ۱۰ رقم و با ۹ شروع شود.' });
  }

  const existing = db.prepare('SELECT id, phone, username FROM users WHERE phone = ?').get(phone);
  res.json({
    ok: true,
    isRegistered: !!existing,
    phone,
    username: existing?.username || null,
    message: 'کد تأیید ارسال شد.',
  });
});

router.post('/verify-otp', (req, res) => {
  const phone = validatePhone(req.body.phone);
  const otp = String(req.body.otp || '').trim();
  const username = req.body.username ? validateUsername(req.body.username) : null;
  const displayName = username || buildDisplayName(req.body.firstName, req.body.lastName);

  if (!phone) {
    return res.status(400).json({ error: 'شماره موبایل نامعتبر است.' });
  }
  if (otp !== OTP_CODE) {
    return res.status(400).json({ error: 'کد واردشده نادرست است. دوباره تلاش کن.' });
  }

  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  let isNewUser = false;

  if (!user) {
    if (!displayName) {
      return res.json({
        ok: true,
        needsName: true,
        signupToken: signSignupToken(phone),
      });
    }

    const phoneExists = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (phoneExists) {
      return res.status(409).json({ error: 'این شماره موبایل قبلاً ثبت شده است.' });
    }

    let finalUsername = displayName;
    const usernameExists = db.prepare('SELECT id FROM users WHERE username = ?').get(finalUsername);
    if (usernameExists) {
      finalUsername = validateUsername(`${displayName} ${phone.slice(-4)}`);
    }

    const info = db.prepare('INSERT INTO users (phone, username) VALUES (?, ?)').run(phone, finalUsername);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    isNewUser = true;
  }

  const token = signUserToken(user);
  setUserCookie(res, token);

  res.json({
    ok: true,
    isNewUser,
    user: {
      id: user.id,
      phone: user.phone,
      username: user.username,
      kycStatus: user.kyc_status,
      kycRejectionReason: user.kyc_rejection_reason,
    },
  });
});

router.post('/register', (req, res) => {
  let phone = validatePhone(req.body.phone);
  const username = validateUsername(req.body.username)
    || buildDisplayName(req.body.firstName, req.body.lastName);
  const otp = String(req.body.otp || '').trim();
  const signupToken = req.body.signupToken;

  if (signupToken) {
    try {
      phone = validatePhone(verifySignupToken(signupToken));
    } catch {
      return res.status(401).json({ error: 'نشست ثبت‌نام منقضی شده. دوباره شماره را تأیید کن.' });
    }
  } else if (otp === OTP_CODE) {
    phone = validatePhone(req.body.phone);
  } else {
    return res.status(400).json({ error: 'تأیید شماره الزامی است.' });
  }

  if (!phone) {
    return res.status(400).json({ error: 'شماره موبایل نامعتبر است.' });
  }
  if (!username) {
    return res.status(400).json({ error: 'نام و نام خانوادگی الزامی است.' });
  }

  const phoneExists = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (phoneExists) {
    return res.status(409).json({ error: 'این شماره موبایل قبلاً ثبت شده است.' });
  }

  let finalUsername = username;
  const usernameExists = db.prepare('SELECT id FROM users WHERE username = ?').get(finalUsername);
  if (usernameExists) {
    finalUsername = validateUsername(`${username} ${phone.slice(-4)}`);
  }

  const info = db.prepare('INSERT INTO users (phone, username) VALUES (?, ?)').run(phone, finalUsername);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = signUserToken(user);
  setUserCookie(res, token);

  res.status(201).json({
    ok: true,
    user: {
      id: user.id,
      phone: user.phone,
      username: user.username,
      kycStatus: user.kyc_status,
    },
  });
});

router.get('/me', requireUser, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', (_req, res) => {
  clearUserCookie(res);
  res.json({ ok: true });
});

export default router;
