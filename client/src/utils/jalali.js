import { jalaaliMonthLength as jMonthLen, toGregorian, toJalaali } from 'jalaali-js';

export const P_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/** Tehran-local Gregorian parts for "now" */
export function tehranNowParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return {
    year: +get('year'),
    month: +get('month'),
    day: +get('day'),
    hour: +get('hour'),
    minute: +get('minute'),
  };
}

export function gregorianToJalali(gy, gm, gd) {
  return toJalaali(gy, gm, gd);
}

export function jalaliToGregorian(jy, jm, jd) {
  return toGregorian(jy, jm, jd);
}

export function todayJalali() {
  const t = tehranNowParts();
  return gregorianToJalali(t.year, t.month, t.day);
}

export function isSameJalaliDay(a, b) {
  return a.jy === b.jy && a.jm === b.jm && a.jd === b.jd;
}

export function isToday(jy, jm, jd) {
  const t = todayJalali();
  return jy === t.jy && jm === t.jm && jd === t.jd;
}

/** ساعت پیشنهادی شروع: یک ساعت بعد از الان (تهران) */
export function suggestedStartHour() {
  const { hour } = tehranNowParts();
  return Math.min(hour + 1, 23);
}

export function tehranISO(gy, gm, gd, hour, minute = 0) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${gy}-${pad(gm)}-${pad(gd)}T${pad(hour)}:${pad(minute)}:00+03:30`;
}

export function parseTehranISO(iso) {
  return new Date(iso).getTime();
}

/** Persian week: 0=Saturday … 6=Friday */
export function persianWeekday(gy, gm, gd) {
  const d = new Date(gy, gm - 1, gd);
  return (d.getDay() + 1) % 7;
}

export function jalaliMonthLength(jy, jm) {
  return jMonthLen(jm, jy);
}

export function buildJalaliMonthGrid(jy, jm) {
  const len = jalaliMonthLength(jy, jm);
  const g0 = jalaliToGregorian(jy, jm, 1);
  const firstWd = persianWeekday(g0.gy, g0.gm, g0.gd);
  const today = todayJalali();
  const cells = [];

  for (let i = 0; i < firstWd; i += 1) cells.push(null);

  for (let jd = 1; jd <= len; jd += 1) {
    const g = jalaliToGregorian(jy, jm, jd);
    const date = new Date(g.gy, g.gm - 1, g.gd, 12, 0, 0);
    const isPast = jy < today.jy
      || (jy === today.jy && jm < today.jm)
      || (jy === today.jy && jm === today.jm && jd < today.jd);
    cells.push({ jy, jm, jd, date, isPast });
  }

  return cells;
}

export function formatJalaliLabel(jy, jm, jd, hour) {
  const h = String(hour).padStart(2, '0');
  return `${jd} ${P_MONTHS[jm - 1]} ${h}:00`;
}

export function jalaliKey(jy, jm, jd) {
  return jy * 10000 + jm * 100 + jd;
}

export function compareJalali(a, b) {
  return jalaliKey(a.jy, a.jm, a.jd) - jalaliKey(b.jy, b.jm, b.jd);
}

export function makeRangeFromSelection(start, end, startHour, endHour) {
  const gs = jalaliToGregorian(start.jy, start.jm, start.jd);
  const ge = jalaliToGregorian(end.jy, end.jm, end.jd);
  const startAt = tehranISO(gs.gy, gs.gm, gs.gd, startHour);
  const endAt = tehranISO(ge.gy, ge.gm, ge.gd, endHour);
  const hours = (parseTehranISO(endAt) - parseTehranISO(startAt)) / 3600000;
  const label = `${formatJalaliLabel(start.jy, start.jm, start.jd, startHour)} ← ${formatJalaliLabel(end.jy, end.jm, end.jd, endHour)}`;
  return { startAt, endAt, hours, label, startHour, endHour };
}

export function isStartInPast(start, startHour) {
  const gs = jalaliToGregorian(start.jy, start.jm, start.jd);
  const startMs = parseTehranISO(tehranISO(gs.gy, gs.gm, gs.gd, startHour));
  const now = tehranNowParts();
  const nowMs = parseTehranISO(tehranISO(now.year, now.month, now.day, now.hour, now.minute));
  return startMs < nowMs;
}

export function datesOverlap(aStart, aEnd, bStart, bEnd) {
  const s1 = parseTehranISO(aStart);
  const e1 = parseTehranISO(aEnd);
  const s2 = parseTehranISO(bStart);
  const e2 = parseTehranISO(bEnd);
  return s1 < e2 && s2 < e1;
}

export function isJalaliDayBlocked(jy, jm, jd, blockedPeriods) {
  if (!blockedPeriods?.length) return false;
  const gs = jalaliToGregorian(jy, jm, jd);
  const dayStart = tehranISO(gs.gy, gs.gm, gs.gd, 0);
  const dayEnd = tehranISO(gs.gy, gs.gm, gs.gd, 23, 59);
  return blockedPeriods.some((p) => datesOverlap(dayStart, dayEnd, p.startAt, p.endAt));
}

export function rangeOverlapsBlocked(start, end, startHour, endHour, blockedPeriods) {
  if (!start || !end || !blockedPeriods?.length) return false;
  const range = makeRangeFromSelection(start, end, startHour, endHour);
  return blockedPeriods.some((p) => datesOverlap(range.startAt, range.endAt, p.startAt, p.endAt));
}

export function parsePresetRange(preset) {
  if (!preset?.startAt) return null;
  const s = new Date(preset.startAt);
  const e = new Date(preset.endAt);
  const sj = gregorianToJalali(s.getFullYear(), s.getMonth() + 1, s.getDate());
  const ej = gregorianToJalali(e.getFullYear(), e.getMonth() + 1, e.getDate());
  return {
    start: { jy: sj.jy, jm: sj.jm, jd: sj.jd, date: s },
    end: { jy: ej.jy, jm: ej.jm, jd: ej.jd, date: e },
    startHour: s.getHours(),
    endHour: e.getHours(),
    viewYear: sj.jy,
    viewMonth: sj.jm,
  };
}
