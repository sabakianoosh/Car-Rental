import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export const TEHRAN = 'Asia/Tehran';
export const OTP_CODE = '111111';
export const HOLD_MINUTES = 10;
export const MIN_HOURS = 12;
export const MAX_HOURS = 240;

export const ACTIVE_RENTAL_STATUSES = ['hold', 'pending_payment', 'paid', 'delivered'];

export function nowTehran() {
  return dayjs().tz(TEHRAN);
}

export function parseTehranDateTime(isoOrLocal) {
  const parsed = dayjs(isoOrLocal);
  if (!parsed.isValid()) return dayjs.tz(isoOrLocal, TEHRAN);
  return parsed.tz(TEHRAN);
}

export function formatTehran(date) {
  return dayjs(date).tz(TEHRAN).format('YYYY-MM-DDTHH:mm:ssZ');
}

export function validatePhone(phone) {
  const cleaned = String(phone || '').replace(/\D/g, '');
  if (/^09\d{9}$/.test(cleaned)) return '0' + cleaned.slice(1);
  if (/^9\d{9}$/.test(cleaned)) return '0' + cleaned;
  return null;
}

export function validateUsername(username) {
  const u = String(username || '').trim().replace(/\s+/g, ' ');
  if (u.length < 2 || u.length > 60) return null;
  if (!/^[\u0600-\u06FFa-zA-Z0-9_\-. ]+$/.test(u)) return null;
  return u;
}

export function buildDisplayName(firstName, lastName) {
  const first = String(firstName || '').trim();
  const last = String(lastName || '').trim();
  const full = `${first} ${last}`.trim();
  if (!first || !last) return null;
  return validateUsername(full);
}

export function calcPrice(basePrice, extraPrice, hours) {
  if (hours <= 12) return basePrice;
  const extraBlocks = Math.ceil((hours - 12) / 12);
  return basePrice + extraBlocks * extraPrice;
}

export function calcBlocks(hours) {
  if (hours <= 12) return { first: 1, extra: 0 };
  return { first: 1, extra: Math.ceil((hours - 12) / 12) };
}

export function calcHours(startAt, endAt) {
  const start = parseTehranDateTime(startAt);
  const end = parseTehranDateTime(endAt);
  return end.diff(start, 'hour', true);
}

export function validateRentalDates(startAt, endAt) {
  const start = parseTehranDateTime(startAt);
  const end = parseTehranDateTime(endAt);
  const now = nowTehran();

  if (!start.isValid() || !end.isValid()) {
    return { ok: false, error: 'تاریخ یا زمان نامعتبر است.' };
  }

  if (start.isBefore(now, 'minute')) {
    return { ok: false, error: 'تاریخ شروع نمی‌تواند در گذشته باشد.' };
  }

  if (!end.isAfter(start)) {
    return { ok: false, error: 'زمان پایان باید بعد از زمان شروع باشد.' };
  }

  const hours = end.diff(start, 'hour', true);
  if (hours < MIN_HOURS) {
    return { ok: false, error: 'حداقل مدت اجاره ۱۲ ساعت است.' };
  }
  if (hours > MAX_HOURS) {
    return { ok: false, error: 'حداکثر مدت اجاره ۱۰ روز (۲۴۰ ساعت) است.' };
  }

  return { ok: true, hours: Math.ceil(hours) };
}

export function datesOverlap(aStart, aEnd, bStart, bEnd) {
  const s1 = parseTehranDateTime(aStart);
  const e1 = parseTehranDateTime(aEnd);
  const s2 = parseTehranDateTime(bStart);
  const e2 = parseTehranDateTime(bEnd);
  return s1.isBefore(e2) && s2.isBefore(e1);
}

export function generateReservationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RK-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function isHoldValid(rental) {
  if (rental.status !== 'hold' && rental.status !== 'pending_payment') return false;
  if (!rental.hold_expires_at) return false;
  return parseTehranDateTime(rental.hold_expires_at).isAfter(nowTehran());
}

export function expireStaleHolds(db) {
  const now = formatTehran(nowTehran());
  db.prepare(`
    UPDATE rentals
    SET status = 'expired_hold', updated_at = datetime('now')
    WHERE status IN ('hold', 'pending_payment')
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at < ?
  `).run(now);
}
