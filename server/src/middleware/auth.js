import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'rikar-dev-secret-change-in-production';

export function signUserToken(user) {
  return jwt.sign({ sub: user.id, phone: user.phone, username: user.username, role: 'user' }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function signAdminToken(admin) {
  return jwt.sign({ sub: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, {
    expiresIn: '12h',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function signSignupToken(phone) {
  return jwt.sign({ phone, purpose: 'signup' }, JWT_SECRET, { expiresIn: '10m' });
}

export function verifySignupToken(token) {
  const payload = verifyToken(token);
  if (payload.purpose !== 'signup' || !payload.phone) {
    throw new Error('invalid signup token');
  }
  return payload.phone;
}

export function requireUser(req, res, next) {
  const token = req.cookies?.user_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'لطفاً وارد حساب کاربری شوید.' });
  }
  try {
    const payload = verifyToken(token);
    if (payload.role !== 'user') {
      return res.status(401).json({ error: 'دسترسی غیرمجاز.' });
    }
    const row = db.prepare('SELECT id, phone, username, kyc_status, kyc_rejection_reason FROM users WHERE id = ?').get(payload.sub);
    if (!row) return res.status(401).json({ error: 'کاربر یافت نشد.' });
    req.user = {
      id: row.id,
      phone: row.phone,
      username: row.username,
      kycStatus: row.kyc_status,
      kycRejectionReason: row.kyc_rejection_reason,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'نشست منقضی شده است. دوباره وارد شوید.' });
  }
}

export function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'دسترسی ادمین نیاز است.' });
  }
  try {
    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
    }
    req.admin = { id: payload.sub, username: payload.username };
    next();
  } catch {
    return res.status(401).json({ error: 'نشست ادمین منقضی شده است.' });
  }
}

export function setUserCookie(res, token) {
  res.cookie('user_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function setAdminCookie(res, token) {
  res.cookie('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 12 * 60 * 60 * 1000,
  });
}

export function clearUserCookie(res) {
  res.clearCookie('user_token');
}

export function clearAdminCookie(res) {
  res.clearCookie('admin_token');
}
