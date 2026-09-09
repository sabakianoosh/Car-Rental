import { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icon';
import { toFa } from '../utils/format';
import {
  P_MONTHS,
  buildJalaliMonthGrid,
  compareJalali,
  isJalaliDayBlocked,
  isSameJalaliDay,
  isStartInPast,
  isToday,
  jalaliKey,
  makeRangeFromSelection,
  parsePresetRange,
  rangeOverlapsBlocked,
  suggestedStartHour,
  todayJalali,
} from '../utils/jalali';

function applyTodayStartHour(picked, currentEnd, currentEndHour) {
  const hour = suggestedStartHour();
  let endHour = currentEndHour;
  if (currentEnd && isSameJalaliDay(picked, currentEnd) && endHour <= hour) {
    endHour = Math.min(hour + 12, 23);
  }
  return { startHour: hour, endHour };
}

export function RangePickerModal({ open, onClose, onApply, preset, blockedPeriods = [] }) {
  const today = todayJalali();
  const [viewYear, setViewYear] = useState(today.jy);
  const [viewMonth, setViewMonth] = useState(today.jm);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [startHour, setStartHour] = useState(suggestedStartHour());
  const [endHour, setEndHour] = useState(10);

  useEffect(() => {
    if (!open) return;
    const parsed = parsePresetRange(preset);
    if (parsed) {
      setViewYear(parsed.viewYear);
      setViewMonth(parsed.viewMonth);
      setStart(parsed.start);
      setEnd(parsed.end);
      setStartHour(parsed.startHour);
      setEndHour(parsed.endHour);
    } else {
      setViewYear(today.jy);
      setViewMonth(today.jm);
      setStart(null);
      setEnd(null);
      setStartHour(suggestedStartHour());
      setEndHour(10);
    }
  }, [open, preset]);

  const cells = useMemo(() => buildJalaliMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const summary = useMemo(() => {
    if (!start || !end) return null;
    if (compareJalali(start, end) >= 0) {
      return { ok: false, msg: 'روز پایان باید بعد از روز شروع باشد.' };
    }
    if (isStartInPast(start, startHour)) {
      return { ok: false, msg: 'ساعت شروع نمی‌تواند در گذشته باشد. ساعت را به‌روز کنید.' };
    }
    if (rangeOverlapsBlocked(start, end, startHour, endHour, blockedPeriods)) {
      return { ok: false, msg: 'بازه انتخابی با روزهای رزروشده هم‌پوشانی دارد. روزهای خط‌خورده را انتخاب نکنید.' };
    }
    const range = makeRangeFromSelection(start, end, startHour, endHour);
    if (range.hours < 12) return { ok: false, msg: 'مدت انتخابی کمتر از ۱۲ ساعت است.' };
    if (range.hours > 240) return { ok: false, msg: 'مدت انتخابی بیش از ۱۰ روز است.' };
    return { ok: true, ...range, hours: Math.ceil(range.hours) };
  }, [start, end, startHour, endHour, blockedPeriods]);

  if (!open) return null;

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const canGoPrev = viewYear > today.jy || (viewYear === today.jy && viewMonth > today.jm);

  const selectDay = (cell) => {
    if (!cell || cell.isPast || isJalaliDayBlocked(cell.jy, cell.jm, cell.jd, blockedPeriods)) return;
    const picked = { jy: cell.jy, jm: cell.jm, jd: cell.jd, date: cell.date };

    if (!start || (start && end)) {
      setStart(picked);
      setEnd(null);
      if (isToday(picked.jy, picked.jm, picked.jd)) {
        const { startHour: sh } = applyTodayStartHour(picked, null, endHour);
        setStartHour(sh);
      }
    } else if (compareJalali(picked, start) > 0) {
      setEnd(picked);
      if (isToday(picked.jy, picked.jm, picked.jd) && isSameJalaliDay(picked, start)) {
        const minEnd = Math.min(startHour + 12, 23);
        if (endHour <= startHour) setEndHour(minEnd);
      }
    } else {
      setStart(picked);
      setEnd(null);
      if (isToday(picked.jy, picked.jm, picked.jd)) {
        const { startHour: sh } = applyTodayStartHour(picked, null, endHour);
        setStartHour(sh);
      }
    }
  };

  const onStartHourChange = (h) => {
    setStartHour(h);
    if (end && isSameJalaliDay(start, end) && endHour <= h) {
      setEndHour(Math.min(h + 12, 23));
    }
  };

  const isSelected = (cell) => {
    if (!cell) return '';
    const k = jalaliKey(cell.jy, cell.jm, cell.jd);
    const sk = start ? jalaliKey(start.jy, start.jm, start.jd) : null;
    const ek = end ? jalaliKey(end.jy, end.jm, end.jd) : null;
    const blocked = isJalaliDayBlocked(cell.jy, cell.jm, cell.jd, blockedPeriods);
    let cls = 'rp-day';
    if (cell.isPast) cls += ' disabled';
    if (blocked) cls += ' blocked';
    if (sk && k === sk) cls += ' sel start';
    if (ek && k === ek) cls += ' sel end';
    if (sk && ek && k > sk && k < ek) cls += ' inrange';
    return cls;
  };

  const apply = () => {
    if (!summary?.ok) return;
    onApply(summary);
    onClose();
  };

  const minStartHour = start && isToday(start.jy, start.jm, start.jd)
    ? suggestedStartHour()
    : 0;

  const hasBlocked = blockedPeriods.length > 0;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal rp-modal">
        <div className="modal-head">
          <h3>انتخاب بازه اجاره</h3>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-info mb-16" style={{ fontSize: 13 }}>
            <Icon name="info" className="ic" />
            <div>حداقل ۱۲ ساعت و حداکثر ۱۰ روز (۲۴۰ ساعت). تاریخ‌ها شمسی و به‌وقت تهران.</div>
          </div>
          {hasBlocked && (
            <div className="alert alert-neutral mb-16 rp-legend" style={{ fontSize: 13 }}>
              <Icon name="calendar" className="ic" />
              <div>
                <strong>روزهای خط‌خورده</strong> برای این خودرو قبلاً رزرو شده‌اند و قابل انتخاب نیستند.
              </div>
            </div>
          )}
          <div className="rp-head row between mb-8">
            <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} onClick={prevMonth} disabled={!canGoPrev}>
              <Icon name="chevronR" />
            </button>
            <strong>{P_MONTHS[viewMonth - 1]} {toFa(viewYear)}</strong>
            <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} onClick={nextMonth}>
              <Icon name="chevronL" />
            </button>
          </div>
          <div className="rp-week">{['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((d) => <span key={d}>{d}</span>)}</div>
          <div className="rp-grid">
            {cells.map((cell, i) => (
              cell ? (
                <button
                  key={`${cell.jy}-${cell.jm}-${cell.jd}`}
                  type="button"
                  className={isSelected(cell)}
                  disabled={cell.isPast || isJalaliDayBlocked(cell.jy, cell.jm, cell.jd, blockedPeriods)}
                  onClick={() => selectDay(cell)}
                  title={isJalaliDayBlocked(cell.jy, cell.jm, cell.jd, blockedPeriods) ? 'رزرو شده' : undefined}
                >
                  {toFa(cell.jd)}
                </button>
              ) : <span key={`empty-${i}`} />
            ))}
          </div>
          <div className="rp-hours">
            <div className="field">
              <label className="label">ساعت شروع</label>
              <select className="select" value={startHour} onChange={(e) => onStartHourChange(+e.target.value)}>
                {Array.from({ length: 24 }, (_, h) => h).filter((h) => h >= minStartHour).map((h) => (
                  <option key={h} value={h}>{toFa(String(h).padStart(2, '0'))}:۰۰</option>
                ))}
              </select>
              {start && isToday(start.jy, start.jm, start.jd) && (
                <div className="hint">برای امروز، از ساعت {toFa(String(minStartHour).padStart(2, '0'))}:۰۰ به بعد</div>
              )}
            </div>
            <div className="field">
              <label className="label">ساعت پایان</label>
              <select className="select" value={endHour} onChange={(e) => setEndHour(+e.target.value)}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{toFa(String(h).padStart(2, '0'))}:۰۰</option>
                ))}
              </select>
            </div>
          </div>
          {summary && (
            <div className={`alert mt-16 ${summary.ok ? 'alert-success' : 'alert-warn'}`} style={{ fontSize: 13.5 }}>
              <Icon name={summary.ok ? 'check' : 'alert'} className="ic" />
              <div>
                {summary.ok
                  ? <>مدت: <strong>{toFa(summary.hours)} ساعت</strong> — {summary.label}</>
                  : summary.msg}
              </div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>انصراف</button>
          <button type="button" className="btn btn-primary" disabled={!summary?.ok} onClick={apply}>اعمال بازه</button>
        </div>
      </div>
      <style>{`
        .rp-week{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;color:var(--muted);font-size:12px;margin-bottom:6px}
        .rp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
        .rp-hours{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
        .rp-day{height:38px;border:0;background:transparent;border-radius:var(--r-sm);font-size:14px;font-weight:600;color:var(--ink);transition:.12s;position:relative}
        .rp-day:hover:not(.disabled):not(.blocked){background:var(--green-50)}
        .rp-day.disabled{color:var(--muted-2);opacity:.5;cursor:not-allowed}
        .rp-day.blocked{color:var(--danger);opacity:.78;cursor:not-allowed;text-decoration:line-through;text-decoration-thickness:2px;background:var(--danger-bg)}
        .rp-day.inrange{background:var(--green-50)}
        .rp-day.sel{background:var(--green-600);color:#fff;text-decoration:none;opacity:1}
        .rp-day.blocked.sel{background:var(--danger);color:#fff}
        .rp-legend strong{display:block;margin-bottom:2px}
        @media (max-width:480px){
          .rp-hours{grid-template-columns:1fr}
          .rp-day{height:40px;font-size:13px}
        }
      `}</style>
    </div>
  );
}
