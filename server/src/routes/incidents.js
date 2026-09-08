import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { requireUser } from '../middleware/auth.js';
import { uploadsDir } from '../db.js';
import {
  assertActiveRentalForUser,
  addIncidentAttachment,
  createIncident,
  getActiveRental,
  getIncidentDetail,
  listUserIncidents,
} from '../services/incidentService.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `incident-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('فقط تصویر مجاز است.'));
    }
    cb(null, true);
  },
});

router.get('/active-rental', requireUser, (req, res) => {
  const data = getActiveRental(req.user.id);
  if (!data) {
    return res.json({
      rental: null,
      incidents: [],
      canReportIncidents: false,
      incidentWindow: {
        active: false,
        message: 'در حال حاضر خودروی تحویل‌داده‌شده‌ای ندارید.',
      },
    });
  }
  res.json(data);
});

router.get('/mine', requireUser, (req, res) => {
  res.json({ incidents: listUserIncidents(req.user.id) });
});

router.get('/:id', requireUser, (req, res) => {
  const detail = getIncidentDetail(Number(req.params.id), { userId: req.user.id });
  if (!detail) return res.status(404).json({ error: 'رخداد یافت نشد.' });
  res.json(detail);
});

router.post('/', requireUser, (req, res) => {
  try {
    const { rentalId, type, description, location, vehicleState, metadata } = req.body;
    assertActiveRentalForUser(Number(rentalId), req.user.id);
    const incident = createIncident(req.user.id, {
      rentalId: Number(rentalId),
      type,
      description,
      location,
      vehicleState,
      metadata,
    });
    res.status(201).json({ incident });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/attachments', requireUser, upload.array('photos', 8), (req, res) => {
  const id = Number(req.params.id);
  const detail = getIncidentDetail(id, { userId: req.user.id });
  if (!detail) return res.status(404).json({ error: 'رخداد یافت نشد.' });

  const files = req.files || [];
  const attachments = files.map((f) => {
    const filePath = `/api/uploads/${f.filename}`;
    return addIncidentAttachment(id, filePath, 'photo');
  });

  res.status(201).json({ attachments });
});

export default router;
