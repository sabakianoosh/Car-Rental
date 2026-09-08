import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActiveRental } from '../context/ActiveRentalContext';
import { UserFooter, UserHeader } from '../components/UserShell';
import { Icon } from '../components/Icon';
import { INCIDENT_TYPES, INCIDENT_STATUSES, COVERAGE_TYPES, coverageLabel } from '../constants/incidents';
import { BRANCH_INFO, toFa, toman } from '../utils/format';

function IncStatusBadge({ status }) {
  const s = INCIDENT_STATUSES[status] || INCIDENT_STATUSES.submitted;
  return <span className={`badge ${s.badge}`}>{s.label}</span>;
}

function IncIcon({ type }) {
  const t = INCIDENT_TYPES[type] || INCIDENT_TYPES.damage;
  return (
    <div className={`inc-icon ${type}`}>
      <Icon name={t.icon} />
    </div>
  );
}

function useTimeRemaining(endAt) {
  const [label, setLabel] = useState('');
  const [overdue, setOverdue] = useState(false);
  useEffect(() => {
    if (!endAt) return;
    const tick = () => {
      const diff = new Date(endAt) - Date.now();
      if (diff <= 0) {
        setOverdue(true);
        const late = Math.abs(diff);
        const h = Math.floor(late / 3600000);
        const m = Math.floor((late % 3600000) / 60000);
        setLabel(toFa(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`));
        return;
      }
      setOverdue(false);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(toFa(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endAt]);
  return { label, overdue };
}

export default function ActiveRentalPage() {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  const { rental, incidents, loading, refresh, canReportIncidents, incidentWindow } = useActiveRental();
  const timer = useTimeRemaining(rental?.end_at);

  useEffect(() => {
    if (!isAuthed) navigate('/auth');
  }, [isAuthed, navigate]);

  useEffect(() => {
    if (isAuthed) refresh();
  }, [isAuthed, refresh]);

  if (loading && !rental) {
    return (<><UserHeader active="active" /><main className="container" style={{ padding: 40 }}><div className="spinner" style={{ margin: '40px auto' }} /></main></>);
  }

  if (!rental) {
    return (
      <>
        <UserHeader active="active" />
        <main className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
          <div className="card card-pad center-text">
            <div className="state empty">
              <div className="art"><Icon name="car" /></div>
              <h3>اجاره فعالی ندارید</h3>
              <p className="muted mb-16">پس از <strong>تحویل خودرو در شعبه</strong>، این بخش فعال می‌شود و می‌توانید رخدادها را ثبت کنید.</p>
              <div className="alert alert-info mb-16" style={{ textAlign: 'right' }}>
                <Icon name="info" />
                <div>مراحل: رزرو → پرداخت → مراجعه به شعبه → تحویل توسط کارشناس → فعال شدن «اجاره فعال»</div>
              </div>
              <Link to="/my-reservations" className="btn btn-secondary mb-8">رزروهای من</Link>
              <Link to="/" className="btn btn-primary">مرور خودروها</Link>
            </div>
          </div>
        </main>
        <UserFooter />
      </>
    );
  }

  const cov = rental.coverage_type || 'none';
  const covInfo = COVERAGE_TYPES[cov] || COVERAGE_TYPES.none;
  const quickTypes = ['accident', 'breakdown', 'early'];

  return (
    <>
      <UserHeader active="active" />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        {incidentWindow?.message && (
          <div className="alert alert-success mb-16">
            <Icon name="shield" />
            <div>{incidentWindow.message}</div>
          </div>
        )}

        <div className="rental-hero mb-16">
          <div className="row between mb-8">
            <span className="live-badge"><span className="blink" />در حال اجاره</span>
            <span className="badge tnum" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>{rental.reservation_code}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{rental.vehicle_name} {rental.vehicle_trim ? `— ${rental.vehicle_trim}` : ''}</div>
          <div className="muted" style={{ color: '#b9e6cf', fontSize: 13 }}>{rental.vehicle_color || ''}</div>
          <div className="row gap-sm mt-16" style={{ flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: '#b9e6cf' }}>شروع</div>
              <div className="tnum" style={{ fontWeight: 700 }}>{rental.start_at?.slice(0, 16)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: '#b9e6cf' }}>پایان مقرر</div>
              <div className="tnum" style={{ fontWeight: 700 }}>{rental.end_at?.slice(0, 16)}</div>
            </div>
          </div>
          <div className="row between mt-16" style={{ background: 'rgba(0,0,0,.2)', borderRadius: 8, padding: '10px 14px' }}>
            <span style={{ fontSize: 12, color: '#b9e6cf' }}>{timer.overdue ? 'تأخیر' : 'زمان باقی‌مانده'}</span>
            <span className="tnum" style={{ fontWeight: 800, fontSize: 18 }}>{timer.label}</span>
          </div>
          <div className="mt-16">
            <span className={`coverage-badge ${cov}`} style={{ background: 'rgba(255,255,255,.15)', color: cov === 'none' ? '#f87171' : '#4ade80' }}>
              <Icon name="coverage" /> {coverageLabel(cov)}
            </span>
          </div>
        </div>

        {timer.overdue && (
          <div className="alert alert-danger mb-16">
            <Icon name="lateReturn" />
            <div>
              <strong>بازگشت دیرهنگام</strong>
              <p className="muted small mt-8">هرچه سریع‌تر خودرو را به شعبه بازگردانید.</p>
              <Link to={`/incidents/new?type=late&rental=${rental.id}`} className="btn btn-danger btn-sm mt-8">ثبت تأخیر</Link>
            </div>
          </div>
        )}

        <div className="emergency-bar mb-16">
          <div className="em-icon"><Icon name="ambulance" /></div>
          <div>
            <div className="em-title">اورژانس / تصادف؟</div>
            <div className="row gap-sm mt-8" style={{ flexWrap: 'wrap', fontSize: 13, fontWeight: 700 }}>
              <span>اورژانس ۱۱۵</span><span>پلیس ۱۱۰</span><span>پشتیبانی {BRANCH_INFO.phone}</span>
            </div>
          </div>
        </div>

        <div className="row gap-sm mb-24" style={{ flexWrap: 'wrap' }}>
          {canReportIncidents && quickTypes.map((t) => (
            <Link key={t} to={`/incidents/new?type=${t}&rental=${rental.id}`} className={`quick-chip ${INCIDENT_TYPES[t].urgent ? 'urgent' : ''}`}>
              <Icon name={INCIDENT_TYPES[t].icon} /> {INCIDENT_TYPES[t].label}
            </Link>
          ))}
          {canReportIncidents && (
            <Link to={`/incidents/new?rental=${rental.id}`} className="quick-chip">
              <Icon name="incident" /> سایر رخدادها
            </Link>
          )}
        </div>

        <div className="card card-pad mb-16">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>پوشش خسارت</h3>
          {cov === 'none' ? (
            <div className="alert alert-danger">
              <Icon name="warning" />
              <div><strong>بدون پوشش</strong> — در صورت خسارت، هزینه‌ها مستقیماً بر عهده شماست.</div>
            </div>
          ) : (
            <div className="alert alert-success">
              <Icon name="shield" />
              <div>
                <strong>{covInfo.label}</strong> — {covInfo.price ? `+${toman(covInfo.price)}` : ''} در زمان ثبت رخداد لحاظ می‌شود.
              </div>
            </div>
          )}
        </div>

        <div className="card mb-16">
          <div className="card-pad row between">
            <h3 style={{ fontSize: 15, margin: 0 }}>رخدادها</h3>
            <Link to={`/incidents/new?rental=${rental.id}`} className="btn btn-secondary btn-sm" style={{ opacity: canReportIncidents ? 1 : 0.5, pointerEvents: canReportIncidents ? 'auto' : 'none' }}>
              <Icon name="plus" /> ثبت رخداد
            </Link>
          </div>
          {incidents.length === 0 ? (
            <div className="card-pad center-text muted" style={{ paddingTop: 0 }}>
              <div className="state empty" style={{ padding: '24px 0' }}>
                <div className="art"><Icon name="check" /></div>
                <h3>رخداد فعالی ندارید</h3>
                <p>در صورت بروز مشکل، رخداد جدید ثبت کنید.</p>
              </div>
            </div>
          ) : (
            incidents.map((inc) => (
              <Link key={inc.id} to={`/incidents/${inc.id}`} className="inc-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <IncIcon type={inc.type} />
                <div className="grow">
                  <div className="row between">
                    <strong>{inc.typeLabel}</strong>
                    <IncStatusBadge status={inc.status} />
                  </div>
                  <div className="muted small mt-8">{inc.incident_code}</div>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>جزئیات اجاره</h3>
          <div className="sumrow"><span className="lbl">کد رزرو</span><span className="tnum">{rental.reservation_code}</span></div>
          <div className="sumrow"><span className="lbl">مدت</span><span>{toFa(rental.hours)} ساعت</span></div>
          <div className="sumrow"><span className="lbl">مبلغ</span><span className="tnum">{toman(rental.total_amount)}</span></div>
          <div className="sumrow"><span className="lbl">شعبه</span><span>{BRANCH_INFO.name}</span></div>
        </div>
      </main>
      <UserFooter />
    </>
  );
}
