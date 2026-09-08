import { Router } from 'express';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import db, { uploadsDir } from '../db.js';
import {
  clearAdminCookie,
  requireAdmin,
  setAdminCookie,
  signAdminToken,
} from '../middleware/auth.js';
import {
  findRentalByCode,
  deliverRental,
  returnRental,
} from '../services/rentalService.js';
import {
  listAllIncidents,
  getIncidentStats,
  getIncidentDetail,
  createAdminIncident,
  updateIncidentAdmin,
  addIncidentCharge,
  addIncidentDecision,
} from '../services/incidentService.js';
import { INCIDENT_TYPES, INCIDENT_STATUSES } from '../constants/incidents.js';
import { expireStaleHolds } from '../utils/helpers.js';

const router = Router();

const carImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `car_${req.params.id}_${Date.now()}${ext}`);
  },
});

const uploadCarImage = multer({
  storage: carImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('فقط تصاویر JPG/PNG/WebP مجاز است.'));
  },
});

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

  if (!admin) {
    return res.status(401).json({ error: 'نام کاربری یا رمز عبور نادرست است.' });
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'نام کاربری یا رمز عبور نادرست است.' });
  }

  const token = signAdminToken(admin);
  setAdminCookie(res, token);
  res.json({ ok: true, admin: { username: admin.username } });
});

router.post('/logout', (_req, res) => {
  clearAdminCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

router.get('/dashboard', requireAdmin, (_req, res) => {
  expireStaleHolds(db);
  const stats = {
    users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    vehicles: db.prepare('SELECT COUNT(*) as c FROM vehicles WHERE active = 1').get().c,
    pendingKyc: db.prepare("SELECT COUNT(*) as c FROM users WHERE kyc_status = 'pending'").get().c,
    activeRentals: db.prepare("SELECT COUNT(*) as c FROM rentals WHERE status IN ('paid','delivered')").get().c,
    pendingPayment: db.prepare("SELECT COUNT(*) as c FROM rentals WHERE status = 'pending_payment'").get().c,
    openIncidents: db.prepare("SELECT COUNT(*) as c FROM incidents WHERE status NOT IN ('closed', 'settled')").get().c,
  };
  const recentRentals = db.prepare(`
    SELECT r.*, u.username, v.name as vehicle_name
    FROM rentals r
    JOIN users u ON u.id = r.user_id
    JOIN vehicles v ON v.id = r.vehicle_id
    ORDER BY r.created_at DESC LIMIT 8
  `).all();
  res.json({ stats, recentRentals });
});

router.get('/vehicles', requireAdmin, (_req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY created_at DESC').all();
  res.json({ vehicles });
});

router.post('/vehicles', requireAdmin, (req, res) => {
  const {
    id, name, trim, basePrice, extraPrice, seats, fuel, gear, km, color, imageUrl, active,
  } = req.body;

  if (!id || !name || basePrice == null || extraPrice == null) {
    return res.status(400).json({ error: 'اطلاعات خودرو ناقص است.' });
  }

  try {
    db.prepare(`
      INSERT INTO vehicles (id, name, trim, base_price, extra_price, seats, fuel, gear, km, color, image_url, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, trim || '', Number(basePrice), Number(extraPrice),
      seats || 5, fuel || '', gear || '', km || '', color || '', imageUrl || '', active ? 1 : 0
    );
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    res.status(201).json({ vehicle });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'شناسه خودرو تکراری است.' });
    }
    throw err;
  }
});

router.put('/vehicles/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'خودرو یافت نشد.' });

  const {
    name, trim, basePrice, extraPrice, seats, fuel, gear, km, color, imageUrl, active,
  } = req.body;

  db.prepare(`
    UPDATE vehicles SET
      name = ?, trim = ?, base_price = ?, extra_price = ?,
      seats = ?, fuel = ?, gear = ?, km = ?, color = ?, image_url = ?, active = ?
    WHERE id = ?
  `).run(
    name ?? existing.name,
    trim ?? existing.trim,
    basePrice != null ? Number(basePrice) : existing.base_price,
    extraPrice != null ? Number(extraPrice) : existing.extra_price,
    seats ?? existing.seats,
    fuel ?? existing.fuel,
    gear ?? existing.gear,
    km ?? existing.km,
    color ?? existing.color,
    imageUrl !== undefined && imageUrl !== '' ? imageUrl : existing.image_url,
    active != null ? (active ? 1 : 0) : existing.active,
    req.params.id
  );

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  res.json({ vehicle });
});

router.post('/vehicles/:id/image', requireAdmin, (req, res, next) => {
  uploadCarImage.single('image')(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? 'حجم فایل بیش از ۵ مگابایت است.'
        : (err.message || 'خطا در بارگذاری تصویر.');
      return res.status(400).json({ error: msg });
    }
    next();
  });
}, (req, res) => {
  const existing = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'خودرو یافت نشد.' });
  if (!req.file) return res.status(400).json({ error: 'فایل تصویر الزامی است.' });

  if (existing.image_url) {
    const oldPath = path.join(uploadsDir, path.basename(existing.image_url));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  db.prepare('UPDATE vehicles SET image_url = ? WHERE id = ?').run(req.file.filename, req.params.id);
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  res.json({ ok: true, vehicle });
});

router.get('/kyc', requireAdmin, (_req, res) => {
  const pending = db.prepare(`
    SELECT id, phone, username, kyc_status, kyc_file_path, kyc_rejection_reason, created_at
    FROM users
    WHERE kyc_status IN ('pending', 'approved', 'rejected')
    ORDER BY CASE kyc_status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC
  `).all();
  res.json({ requests: pending });
});

router.get('/kyc/:userId/file', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT kyc_file_path FROM users WHERE id = ?').get(req.params.userId);
  if (!user?.kyc_file_path) return res.status(404).json({ error: 'فایل یافت نشد.' });
  const filePath = path.join(uploadsDir, path.basename(user.kyc_file_path));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'فایل موجود نیست.' });
  res.sendFile(filePath);
});

router.post('/kyc/:userId/review', requireAdmin, (req, res) => {
  const { approved, reason } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });

  if (approved) {
    db.prepare(`
      UPDATE users SET kyc_status = 'approved', kyc_rejection_reason = NULL,
        kyc_reviewed_at = datetime('now'), kyc_reviewed_by = ?
      WHERE id = ?
    `).run(req.admin.id, user.id);
  } else {
    db.prepare(`
      UPDATE users SET kyc_status = 'rejected', kyc_rejection_reason = ?,
        kyc_reviewed_at = datetime('now'), kyc_reviewed_by = ?
      WHERE id = ?
    `).run(reason || 'مدارک نامعتبر است.', req.admin.id, user.id);
  }

  const updated = db.prepare('SELECT id, username, phone, kyc_status, kyc_rejection_reason FROM users WHERE id = ?').get(user.id);
  res.json({ user: updated });
});

router.get('/rentals', requireAdmin, (_req, res) => {
  expireStaleHolds(db);
  const rentals = db.prepare(`
    SELECT r.*, u.username, u.phone, v.name as vehicle_name
    FROM rentals r
    JOIN users u ON u.id = r.user_id
    JOIN vehicles v ON v.id = r.vehicle_id
    ORDER BY r.created_at DESC
  `).all();
  res.json({ rentals });
});

router.get('/branch/search', requireAdmin, (req, res) => {
  const code = String(req.query.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'کد رزرو الزامی است.' });
  const rental = findRentalByCode(code);
  if (!rental) return res.status(404).json({ error: 'رزروی با این کد یافت نشد.' });
  res.json({ rental });
});

router.post('/branch/:id/deliver', requireAdmin, (req, res) => {
  const rental = db.prepare('SELECT * FROM rentals WHERE id = ?').get(req.params.id);
  if (!rental) return res.status(404).json({ error: 'رزرو یافت نشد.' });
  if (rental.status !== 'paid') {
    return res.status(400).json({ error: 'فقط رزروهای پرداخت‌شده قابل تحویل هستند.' });
  }
  const updated = deliverRental(rental.id);
  res.json({
    rental: updated,
    message: 'تحویل خودرو ثبت شد. ثبت رخداد برای کاربر از این لحظه تا بازگشت خودرو فعال است.',
  });
});

router.post('/branch/:id/return', requireAdmin, (req, res) => {
  const rental = db.prepare('SELECT * FROM rentals WHERE id = ?').get(req.params.id);
  if (!rental) return res.status(404).json({ error: 'رزرو یافت نشد.' });
  if (rental.status !== 'delivered') {
    return res.status(400).json({ error: 'فقط اجاره‌های در حال استفاده قابل بازگشت هستند.' });
  }

  const {
    checklistOk, anomaly, notes, lateFee, createLateIncident, actualReturnAt,
  } = req.body;

  if (checklistOk === false && !anomaly) {
    return res.status(400).json({ error: 'در صورت عدم تأیید چک‌لیست، وضعیت غیرعادی را علامت بزنید.' });
  }

  const updated = returnRental(rental.id, {
    actualReturnAt,
    notes,
    anomaly: Boolean(anomaly),
    lateFee: lateFee ? Number(lateFee) : null,
    createLateIncident: Boolean(createLateIncident),
  });
  res.json({ rental: updated });
});

router.get('/incidents/meta', requireAdmin, (_req, res) => {
  res.json({
    types: INCIDENT_TYPES,
    statuses: INCIDENT_STATUSES,
    stats: getIncidentStats(),
  });
});

router.get('/incidents', requireAdmin, (req, res) => {
  const { status, type, priority } = req.query;
  const incidents = listAllIncidents({ status, type, priority });
  res.json({ incidents, stats: getIncidentStats() });
});

router.get('/incidents/:id', requireAdmin, (req, res) => {
  const detail = getIncidentDetail(Number(req.params.id));
  if (!detail) return res.status(404).json({ error: 'رخداد یافت نشد.' });
  res.json(detail);
});

router.post('/incidents', requireAdmin, (req, res) => {
  try {
    const incident = createAdminIncident(req.body);
    res.status(201).json({ incident });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/incidents/:id', requireAdmin, (req, res) => {
  try {
    const incident = updateIncidentAdmin(Number(req.params.id), {
      ...req.body,
      actor: req.admin?.username || 'admin',
    });
    res.json({ incident });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/incidents/:id/charges', requireAdmin, (req, res) => {
  try {
    const charge = addIncidentCharge(Number(req.params.id), req.body);
    res.status(201).json({ charge });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/incidents/:id/decisions', requireAdmin, (req, res) => {
  try {
    const decision = addIncidentDecision(Number(req.params.id), {
      ...req.body,
      decidedBy: req.admin?.username || 'admin',
    });
    const detail = getIncidentDetail(Number(req.params.id));
    res.status(201).json({ decision, incident: detail?.incident });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export { ADMIN_USER, ADMIN_PASS };
export default router;
