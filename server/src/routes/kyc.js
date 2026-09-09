import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import db, { uploadsDir } from '../db.js';
import { requireUser } from '../middleware/auth.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `kyc_${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('فقط تصاویر JPG/PNG/WebP مجاز است.'));
  },
});

router.get('/status', requireUser, (req, res) => {
  const user = db.prepare(`
    SELECT kyc_status, kyc_rejection_reason, kyc_file_path, kyc_reviewed_at
    FROM users WHERE id = ?
  `).get(req.user.id);

  res.json({
    status: user.kyc_status,
    rejectionReason: user.kyc_rejection_reason,
    hasFile: !!user.kyc_file_path,
    reviewedAt: user.kyc_reviewed_at,
  });
});

router.post('/upload', requireUser, upload.single('license'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'فایل گواهینامه الزامی است.' });
  }

  const user = db
    .prepare('SELECT kyc_file_path FROM users WHERE id = ?')
    .get(req.user.id);

  if (user.kyc_file_path) {
    const oldPath = path.join(
      uploadsDir,
      path.basename(user.kyc_file_path)
    );

    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  // ابتدا وضعیت را pending می‌کنیم
  db.prepare(`
    UPDATE users
    SET
      kyc_status = 'pending',
      kyc_file_path = ?,
      kyc_rejection_reason = NULL,
      kyc_reviewed_at = NULL
    WHERE id = ?
  `).run(req.file.filename, req.user.id);

  // پاسخ فوری به فرانت
  res.json({
    ok: true,
    status: 'pending',
  });

  // بعد از 3 ثانیه به صورت خودکار تأیید می‌شود
  setTimeout(() => {
    try {
      db.prepare(`
        UPDATE users
        SET
          kyc_status = 'approved',
          kyc_rejection_reason = NULL,
          kyc_reviewed_at = datetime('now')
        WHERE id = ?
          AND kyc_status = 'pending'
      `).run(req.user.id);

      console.log(`KYC auto-approved for user ${req.user.id}`);
    } catch (error) {
      console.error('KYC auto-approval error:', error);
    }
  }, 3000);
});
router.get('/file', requireUser, (req, res) => {
  const user = db.prepare('SELECT kyc_file_path FROM users WHERE id = ?').get(req.user.id);
  if (!user?.kyc_file_path) {
    return res.status(404).json({ error: 'فایلی یافت نشد.' });
  }
  const filePath = path.join(uploadsDir, path.basename(user.kyc_file_path));
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'فایل موجود نیست.' });
  }
  res.sendFile(filePath);
});

export default router;
