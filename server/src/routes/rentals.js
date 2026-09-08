import { Router } from 'express';
import db from '../db.js';
import { requireUser } from '../middleware/auth.js';
import {
  calcBlocks,
  calcPrice,
  validateRentalDates,
} from '../utils/helpers.js';
import {
  checkUserConflict,
  checkVehicleAvailability,
  confirmHold,
  completePayment,
  createHold,
  getRentalById,
  getUserRentals,
  getVehicleAvailability,
  getVehicleBlockedPeriods,
  listAvailableVehicles,
  updateRentalCoverage,
} from '../services/rentalService.js';
import { enrichRentalForClient } from '../utils/incidentWindow.js';
import { COVERAGE_TYPES, coveragePrice } from '../constants/incidents.js';

const router = Router();

router.get('/vehicles', (req, res) => {
  const { startAt, endAt } = req.query;
  if (startAt && endAt) {
    const validation = validateRentalDates(startAt, endAt);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }
  }
  const vehicles = listAvailableVehicles(startAt, endAt);
  res.json({ vehicles });
});

router.get('/vehicles/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND active = 1').get(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'خودرو یافت نشد.' });

  const { startAt, endAt } = req.query;
  const availability = getVehicleAvailability(req.params.id, startAt, endAt);
  const blockedPeriods = getVehicleBlockedPeriods(req.params.id);
  res.json({ vehicle, availability, blockedPeriods });
});

router.post('/quote', (req, res) => {
  const { vehicleId, startAt, endAt } = req.body;
  const validation = validateRentalDates(startAt, endAt);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND active = 1').get(vehicleId);
  if (!vehicle) return res.status(404).json({ error: 'خودرو یافت نشد.' });

  const blocks = calcBlocks(validation.hours);
  const total = calcPrice(vehicle.base_price, vehicle.extra_price, validation.hours);

  res.json({
    hours: validation.hours,
    basePrice: vehicle.base_price,
    extraBlocks: blocks.extra,
    extraUnitPrice: vehicle.extra_price,
    totalAmount: total,
    coverageOptions: Object.values(COVERAGE_TYPES).map((c) => ({
      key: c.key,
      label: c.label,
      price: c.price,
    })),
  });
});

router.post('/validate', requireUser, (req, res) => {
  const { vehicleId, startAt, endAt } = req.body;
  const validation = validateRentalDates(startAt, endAt);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const vehicleCheck = checkVehicleAvailability(vehicleId, startAt, endAt);
  if (!vehicleCheck.available) {
    return res.status(409).json({ error: vehicleCheck.error });
  }

  const userCheck = checkUserConflict(req.user.id, startAt, endAt);
  if (userCheck.conflict) {
    return res.status(409).json({ error: userCheck.error });
  }

  res.json({ ok: true });
});

router.post('/hold', requireUser, (req, res) => {
  if (req.user.kycStatus !== 'approved') {
    return res.status(403).json({ error: 'تا پیش از تأیید گواهینامه، امکان Hold وجود ندارد.' });
  }

  const { vehicleId, purpose, startAt, endAt, coverageType } = req.body;
  const validation = validateRentalDates(startAt, endAt);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND active = 1').get(vehicleId);
  if (!vehicle) return res.status(404).json({ error: 'خودرو یافت نشد.' });

  const blocks = calcBlocks(validation.hours);
  const total = calcPrice(vehicle.base_price, vehicle.extra_price, validation.hours);

  try {
    const rental = createHold(req.user.id, {
      vehicleId,
      purpose,
      startAt,
      endAt,
      hours: validation.hours,
      totalAmount: total,
      basePrice: vehicle.base_price,
      extraBlocks: blocks.extra,
      extraUnitPrice: vehicle.extra_price,
      coverageType: coverageType || 'none',
    });

    res.status(201).json({ rental });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

router.get('/mine', requireUser, (req, res) => {
  const rentals = getUserRentals(req.user.id).map(enrichRentalForClient);
  res.json({ rentals });
});

router.get('/:id', requireUser, (req, res) => {
  const rental = db.prepare(`
    SELECT r.*, v.name as vehicle_name, v.trim as vehicle_trim
    FROM rentals r
    JOIN vehicles v ON v.id = r.vehicle_id
    WHERE r.id = ? AND r.user_id = ?
  `).get(req.params.id, req.user.id);

  if (!rental) return res.status(404).json({ error: 'رزرو یافت نشد.' });
  res.json({ rental: enrichRentalForClient(rental) });
});

router.patch('/:id/coverage', requireUser, (req, res) => {
  try {
    const { coverageType } = req.body;
    const rental = updateRentalCoverage(Number(req.params.id), req.user.id, coverageType);
    res.json({ rental });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/confirm', requireUser, (req, res) => {
  try {
    const rental = confirmHold(Number(req.params.id), req.user.id);
    res.json({ rental });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/pay', requireUser, (req, res) => {
  if (req.user.kycStatus !== 'approved') {
    return res.status(403).json({ error: 'گواهینامه تأیید نشده است.' });
  }

  const rental = getRentalById(Number(req.params.id));
  if (!rental || rental.user_id !== req.user.id) {
    return res.status(404).json({ error: 'رزرو یافت نشد.' });
  }

  const { success } = req.body;
  if (!success) {
    return res.json({ ok: false, message: 'پرداخت ناموفق بود. می‌توانید دوباره تلاش کنید.' });
  }

  try {
    const paymentRef = `PAY-${Date.now()}`;
    const updated = completePayment(rental.id, req.user.id, paymentRef);
    res.json({ ok: true, rental: updated });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

export default router;
