import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useActiveRental } from '../context/ActiveRentalContext';
import { UserFooter, UserHeader } from '../components/UserShell';
import { ActiveRentalBanner } from '../components/ActiveRentalBanner';
import { Icon } from '../components/Icon';
import { badgeClass, statusLabel, toFa, toman } from '../utils/format';

export default function MyReservationsPage() {
  const { isAuthed } = useAuth();
  const { hasActive, refresh: refreshActive } = useActiveRental();
  const navigate = useNavigate();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.getMyRentals().then((d) => setRentals(d.rentals));

  useEffect(() => {
    if (!isAuthed) { navigate('/auth'); return; }
    load().finally(() => setLoading(false));
  }, [isAuthed, navigate]);

  useEffect(() => {
    if (isAuthed) refreshActive();
  }, [isAuthed, rentals, refreshActive]);

  const delivered = rentals.find((r) => r.status === 'delivered');
  const paidWaiting = rentals.find((r) => r.status === 'paid');

  return (
    <>
      <UserHeader active="res" />
      <main className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <h1 className="section-title">رزروهای من</h1>
        <p className="section-sub mb-24">لیست رزروها و وضعیت هر کدام</p>

        {hasActive && delivered && (
          <div className="card card-pad mb-24 active-rental-card">
            <div className="row between wrap gap-sm mb-12">
              <div>
                <span className="live-badge mb-8"><span className="blink" />اجاره فعال — مدیریت رخداد</span>
                <div className="strong" style={{ fontSize: 18 }}>{delivered.vehicle_name}</div>
                <div className="muted small">پس از تحویل خودرو، ثبت تصادف، خرابی و سایر رخدادها از اینجا انجام می‌شود.</div>
              </div>
              <Link to="/rent/active" className="btn btn-primary btn-lg mobile-stack-cta">ورود به اجاره فعال</Link>
            </div>
            <div className="row gap-sm wrap">
              <Link to={`/incidents/new?rental=${delivered.id}&type=accident`} className="quick-chip urgent">تصادف</Link>
              <Link to={`/incidents/new?rental=${delivered.id}&type=breakdown`} className="quick-chip">خرابی</Link>
              <Link to={`/incidents/new?rental=${delivered.id}`} className="quick-chip">ثبت رخداد</Link>
            </div>
          </div>
        )}

        {!hasActive && paidWaiting && (
          <div className="alert alert-info mb-24">
            <Icon name="info" />
            <div>
              <strong>رزرو پرداخت‌شده — در انتظار تحویل فیزیکی</strong>
              <p className="muted small mt-8">{paidWaiting.incidentWindowMessage || 'پس از تحویل خودرو در شعبه توسط کارشناس، ثبت رخداد (تصادف، خرابی، …) از لحظه تحویل تا بازگشت خودرو فعال می‌شود.'}</p>
              <Link to={`/rent/confirmation/${paidWaiting.id}`} className="btn btn-ghost btn-sm mt-8">راهنمای شعبه</Link>
            </div>
          </div>
        )}

        <ActiveRentalBanner compact />

        {loading && <div className="spinner" style={{ margin: '40px auto' }} />}

        {!loading && rentals.length === 0 && (
          <div className="card"><div className="state empty"><h3>رزروی ندارید</h3><Link to="/" className="btn btn-primary">مشاهده خودروها</Link></div></div>
        )}

        {!loading && rentals.length > 0 && (
          <div className="stack" style={{ '--gap': '12px' }}>
            {rentals.map((r) => (
              <div key={r.id} className={`card card-pad ${r.status === 'delivered' ? 'border-green' : ''}`}>
                <div className="row between wrap mb-8">
                  <div><div className="strong">{r.vehicle_name}</div><div className="muted small">{r.purpose}</div></div>
                  <span className={`badge ${badgeClass(r.status)}`}><span className="dot" />{statusLabel(r.status)}</span>
                </div>
                <div className="row wrap gap-sm muted small mb-8">
                  <span>کد: <strong className="tnum">{r.reservation_code}</strong></span>
                  <span>مدت: {toFa(r.hours)} ساعت</span>
                  <span>{toman(r.total_amount)}</span>
                </div>
                <div className="row gap-sm wrap">
                  {r.status === 'paid' && (
                    <Link to={`/rent/confirmation/${r.id}`} className="btn btn-secondary btn-sm">راهنمای شعبه</Link>
                  )}
                {r.canReportIncidents && (
                    <>
                      <Link to="/rent/active" className="btn btn-primary btn-sm">اجاره فعال</Link>
                      <Link to={`/incidents/new?rental=${r.id}`} className="btn btn-outline btn-sm">ثبت رخداد</Link>
                    </>
                  )}
                  {r.status === 'delivered' && !r.canReportIncidents && (
                    <span className="muted small">ثبت رخداد غیرفعال</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <UserFooter />
    </>
  );
}
