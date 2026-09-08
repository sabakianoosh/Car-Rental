import db from '../db.js';
import {
  ACTIVE_RENTAL_STATUSES,
  datesOverlap,
  expireStaleHolds,
  formatTehran,
  generateReservationCode,
  HOLD_MINUTES,
  isHoldValid,
  nowTehran,
  parseTehranDateTime,
} from '../utils/helpers.js';
import { coveragePrice, isValidCoverageType } from '../constants/incidents.js';
import { createAdminIncident, addIncidentCharge } from './incidentService.js';

function getBlockingRentals({ vehicleId, userId, excludeRentalId } = {}) {
  expireStaleHolds(db);

  let sql = `
    SELECT * FROM rentals
    WHERE status IN (${ACTIVE_RENTAL_STATUSES.map(() => '?').join(',')})
  `;
  const params = [...ACTIVE_RENTAL_STATUSES];

  if (excludeRentalId) {
    sql += ' AND id != ?';
    params.push(excludeRentalId);
  }

  const rows = db.prepare(sql).all(...params);

  return rows.filter((r) => {
    if (r.status === 'hold' || r.status === 'pending_payment') {
      return isHoldValid(r);
    }
    return true;
  }).filter((r) => {
    if (vehicleId && r.vehicle_id === vehicleId) return true;
    if (userId && r.user_id === userId) return true;
    return !vehicleId && !userId;
  });
}

export function checkVehicleAvailability(vehicleId, startAt, endAt, excludeRentalId) {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND active = 1').get(vehicleId);
  if (!vehicle) {
    return { available: false, error: 'خودرو یافت نشد یا غیرفعال است.' };
  }

  const conflicts = getBlockingRentals({ vehicleId, excludeRentalId });
  const overlap = conflicts.find((r) => datesOverlap(startAt, endAt, r.start_at, r.end_at));

  if (overlap) {
    return { available: false, error: 'این خودرو در بازه انتخابی در دسترس نیست.' };
  }

  return { available: true, vehicle };
}

export function checkUserConflict(userId, startAt, endAt, excludeRentalId) {
  const conflicts = getBlockingRentals({ userId, excludeRentalId });
  const overlap = conflicts.find((r) => datesOverlap(startAt, endAt, r.start_at, r.end_at));

  if (overlap) {
    return {
      conflict: true,
      error: 'شما در این بازه زمانی رزرو فعال دیگری دارید و نمی‌توانید خودروی دوم اجاره کنید.',
    };
  }

  return { conflict: false };
}

export function listAvailableVehicles(startAt, endAt) {
  expireStaleHolds(db);
  const vehicles = db.prepare('SELECT * FROM vehicles WHERE active = 1 ORDER BY base_price ASC').all();
  if (!startAt || !endAt) {
    return vehicles.map((v) => ({ ...v, available: null }));
  }

  const blocking = getBlockingRentals();
  return vehicles.map((vehicle) => {
    const conflict = blocking.some(
      (r) => r.vehicle_id === vehicle.id && datesOverlap(startAt, endAt, r.start_at, r.end_at)
    );
    return { ...vehicle, available: !conflict };
  });
}

export function getVehicleAvailability(vehicleId, startAt, endAt) {
  if (!startAt || !endAt) {
    return { available: null, message: 'برای بررسی موجودی، زمان را انتخاب کنید' };
  }
  const result = checkVehicleAvailability(vehicleId, startAt, endAt);
  return { available: result.available, message: result.error || null };
}

export function getVehicleBlockedPeriods(vehicleId) {
  return getBlockingRentals({ vehicleId }).map((r) => ({
    startAt: r.start_at,
    endAt: r.end_at,
    status: r.status,
  }));
}

export function createHold(userId, payload) {
  const {
    vehicleId, purpose, startAt, endAt, hours,
    totalAmount, basePrice, extraBlocks, extraUnitPrice,
    coverageType = 'none',
  } = payload;

  const covType = isValidCoverageType(coverageType) ? coverageType : 'none';
  const covAmount = coveragePrice(covType);
  const grandTotal = totalAmount + covAmount;

  const normalizedStart = formatTehran(parseTehranDateTime(startAt));
  const normalizedEnd = formatTehran(parseTehranDateTime(endAt));

  const vehicleCheck = checkVehicleAvailability(vehicleId, normalizedStart, normalizedEnd);
  if (!vehicleCheck.available) {
    throw new Error(vehicleCheck.error);
  }

  const userCheck = checkUserConflict(userId, normalizedStart, normalizedEnd);
  if (userCheck.conflict) {
    throw new Error(userCheck.error);
  }

  const holdExpires = formatTehran(nowTehran().add(HOLD_MINUTES, 'minute'));
  const code = generateReservationCode();

  const info = db.prepare(`
    INSERT INTO rentals (
      user_id, vehicle_id, purpose, start_at, end_at, hours,
      base_price, extra_blocks, extra_unit_price, total_amount,
      coverage_type, coverage_amount,
      status, reservation_code, hold_expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'hold', ?, ?)
  `).run(
    userId, vehicleId, purpose, normalizedStart, normalizedEnd, hours,
    basePrice, extraBlocks, extraUnitPrice, grandTotal,
    covType, covAmount,
    code, holdExpires
  );

  return db.prepare('SELECT * FROM rentals WHERE id = ?').get(info.lastInsertRowid);
}

export function updateRentalCoverage(rentalId, userId, coverageType) {
  if (!isValidCoverageType(coverageType)) {
    throw new Error('نوع پوشش نامعتبر است.');
  }

  const rental = db.prepare('SELECT * FROM rentals WHERE id = ? AND user_id = ?').get(rentalId, userId);
  if (!rental) throw new Error('رزرو یافت نشد.');
  if (!['hold', 'pending_payment'].includes(rental.status)) {
    throw new Error('پوشش فقط قبل از پرداخت قابل تغییر است.');
  }

  const covAmount = coveragePrice(coverageType);
  const baseTotal = rental.base_price + rental.extra_blocks * rental.extra_unit_price;
  const grandTotal = baseTotal + covAmount;

  db.prepare(`
    UPDATE rentals SET
      coverage_type = ?,
      coverage_amount = ?,
      total_amount = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(coverageType, covAmount, grandTotal, rentalId);

  return db.prepare('SELECT * FROM rentals WHERE id = ?').get(rentalId);
}

export function deliverRental(rentalId) {
  db.prepare(`
    UPDATE rentals SET status = 'delivered', delivered_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(rentalId);
  return db.prepare('SELECT * FROM rentals WHERE id = ?').get(rentalId);
}

export function returnRental(rentalId, payload = {}) {
  const { actualReturnAt, notes, anomaly, lateFee, createLateIncident } = payload;
  db.prepare(`
    UPDATE rentals SET
      status = 'completed',
      returned_at = datetime('now'),
      actual_return_at = COALESCE(?, datetime('now')),
      return_notes = ?,
      return_anomaly = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(actualReturnAt || null, notes || null, anomaly ? 1 : 0, rentalId);

  const rental = db.prepare('SELECT * FROM rentals WHERE id = ?').get(rentalId);

  if (anomaly) {
    createAdminIncident({
      rentalId,
      type: 'abnormal',
      description: notes || 'وضعیت غیرعادی در بازگشت خودرو',
      assignee: 'شعبه',
    });
  }

  if (createLateIncident || lateFee) {
    const inc = createAdminIncident({
      rentalId,
      type: 'late',
      description: notes || 'بازگشت دیرهنگام',
      assignee: 'عملیات',
    });
    if (lateFee && inc?.id) {
      addIncidentCharge(inc.id, {
        label: 'هزینه تأخیر',
        amount: lateFee,
        chargeType: 'fee',
        note: notes,
      });
    }
  }

  return rental;
}

export function getRentalById(id) {
  return db.prepare('SELECT * FROM rentals WHERE id = ?').get(id);
}

export function getUserRentals(userId) {
  expireStaleHolds(db);
  return db.prepare(`
    SELECT r.*, v.name as vehicle_name, v.trim as vehicle_trim, v.color as vehicle_color
    FROM rentals r
    JOIN vehicles v ON v.id = r.vehicle_id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `).all(userId);
}

export function confirmHold(rentalId, userId) {
  const rental = db.prepare('SELECT * FROM rentals WHERE id = ? AND user_id = ?').get(rentalId, userId);
  if (!rental) throw new Error('رزرو یافت نشد.');
  if (rental.status !== 'hold') throw new Error('وضعیت رزرو برای تأیید معتبر نیست.');
  if (!isHoldValid(rental)) throw new Error('مهلت Hold منقضی شده است. لطفاً دوباره تلاش کنید.');

  const vehicleCheck = checkVehicleAvailability(rental.vehicle_id, rental.start_at, rental.end_at, rental.id);
  if (!vehicleCheck.available) throw new Error(vehicleCheck.error);

  db.prepare(`
    UPDATE rentals SET status = 'pending_payment', updated_at = datetime('now')
    WHERE id = ?
  `).run(rentalId);

  return db.prepare('SELECT * FROM rentals WHERE id = ?').get(rentalId);
}

export function completePayment(rentalId, userId, paymentRef) {
  const rental = db.prepare('SELECT * FROM rentals WHERE id = ? AND user_id = ?').get(rentalId, userId);
  if (!rental) throw new Error('رزرو یافت نشد.');
  if (rental.status === 'paid') return rental;
  if (rental.status !== 'pending_payment') throw new Error('رزرو در وضعیت پرداخت نیست.');

  if (!isHoldValid(rental)) {
    const vehicleCheck = checkVehicleAvailability(rental.vehicle_id, rental.start_at, rental.end_at, rental.id);
    if (!vehicleCheck.available) {
      db.prepare(`
        UPDATE rentals SET status = 'payment_review', payment_ref = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(paymentRef, rentalId);
      throw new Error('پرداخت دریافت شد اما خودرو دیگر موجود نیست. مورد برای بررسی ثبت شد.');
    }
  }

  db.prepare(`
    UPDATE rentals
    SET status = 'paid', payment_status = 'paid', payment_ref = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(paymentRef, rentalId);

  return db.prepare('SELECT * FROM rentals WHERE id = ?').get(rentalId);
}

export function findRentalByCode(code) {
  return db.prepare(`
    SELECT r.*, u.username, u.phone, v.name as vehicle_name
    FROM rentals r
    JOIN users u ON u.id = r.user_id
    JOIN vehicles v ON v.id = r.vehicle_id
    WHERE r.reservation_code = ?
  `).get(code);
}

export function updateRentalStatus(rentalId, status) {
  db.prepare(`
    UPDATE rentals SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, rentalId);
  return db.prepare('SELECT * FROM rentals WHERE id = ?').get(rentalId);
}
