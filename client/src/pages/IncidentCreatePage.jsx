import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useActiveRental } from '../context/ActiveRentalContext';
import { UserFooter, UserHeader } from '../components/UserShell';
import { Icon } from '../components/Icon';
import { INCIDENT_TYPES } from '../constants/incidents';

const STEPS = ['نوع', 'جزئیات', 'پیوست', 'تأیید'];

export default function IncidentCreatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isAuthed } = useAuth();
  const { rental: activeRental, refresh } = useActiveRental();
  const rentalId = Number(params.get('rental')) || activeRental?.id;

  const presetType = params.get('type');
  const [step, setStep] = useState(1);
  const [type, setType] = useState(presetType || '');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [vehicleState, setVehicleState] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  useEffect(() => {
    if (!isAuthed) { navigate('/auth'); return; }
    refresh().then((d) => {
      const rid = Number(params.get('rental')) || d?.rental?.id;
      if (!rid) navigate('/rent/active');
    });
  }, [isAuthed, navigate, refresh, params]);

  const types = useMemo(() => Object.values(INCIDENT_TYPES), []);

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { incident } = await api.createIncident({
        rentalId,
        type,
        description,
        location,
        vehicleState,
        metadata: {},
      });
      if (files.length) await api.uploadIncidentPhotos(incident.id, files);
      setCreated(incident);
      setStep(5);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const rental = activeRental;

  if (!rental || rental.id !== rentalId) {
    return (<><UserHeader /><main className="container page-loading"><div className="spinner" style={{ margin: '40px auto' }} /></main></>);
  }

  return (
    <>
      <UserHeader />
      <main className="container-narrow" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <div className="row gap-sm mb-16">
          <Link to="/rent/active" className="btn btn-ghost btn-sm"><Icon name="arrowL" /> بازگشت</Link>
          <span className="badge badge-muted tnum">{rental.reservation_code}</span>
        </div>

        {step <= 4 && (
          <div className="flow-steps mb-24">
            {STEPS.map((label, i) => (
              <div key={label} className={`flow-step ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}>
                <span className="s-num">{step > i + 1 ? '✓' : i + 1}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        {error && <div className="alert alert-danger mb-16"><Icon name="alert" />{error}</div>}

        {step === 1 && (
          <>
            <h1 className="section-title">چه اتفاقی افتاده؟</h1>
            <div className="inc-type-grid mb-24">
              {types.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`inc-type-card ${type === t.key ? 'selected' : ''} ${t.urgent ? 'urgent-type' : ''}`}
                  onClick={() => setType(t.key)}
                >
                  <div className={`inc-icon ${t.key}`}><Icon name={t.icon} /></div>
                  <span className="type-label">{t.label}</span>
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-primary btn-block" disabled={!type} onClick={() => setStep(2)}>ادامه</button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="section-title">توضیح رخداد</h1>
            <div className="card card-pad stack">
              <div className="field"><label className="label">شرح</label><textarea className="textarea" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
              <div className="field"><label className="label">موقعیت (اختیاری)</label><input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="مثلاً اتوبان کرج" /></div>
              <div className="field">
                <label className="label">وضعیت خودرو</label>
                <select className="select" value={vehicleState} onChange={(e) => setVehicleState(e.target.value)}>
                  <option value="">—</option>
                  <option value="drivable">قابل حرکت</option>
                  <option value="not_drivable">غیرقابل حرکت</option>
                  <option value="unknown">نامشخص</option>
                </select>
              </div>
            </div>
            <div className="row gap-sm mt-16">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>قبلی</button>
              <button type="button" className="btn btn-primary grow" disabled={!description.trim()} onClick={() => setStep(3)}>ادامه</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="section-title">پیوست تصویر</h1>
            <div className="card card-pad">
              <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} />
              <p className="muted small mt-8">حداکثر ۸ تصویر — اختیاری</p>
            </div>
            <div className="row gap-sm mt-16">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>قبلی</button>
              <button type="button" className="btn btn-primary grow" onClick={() => setStep(4)}>ادامه</button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="section-title">تأیید و ارسال</h1>
            <div className="card card-pad mb-16">
              <div className="sumrow"><span>نوع</span><strong>{INCIDENT_TYPES[type]?.label}</strong></div>
              <div className="sumrow"><span>شرح</span><span>{description}</span></div>
              {location && <div className="sumrow"><span>موقعیت</span><span>{location}</span></div>}
            </div>
            <div className="row gap-sm">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(3)}>قبلی</button>
              <button type="button" className="btn btn-primary grow" disabled={submitting} onClick={submit}>{submitting ? 'در حال ثبت…' : 'ثبت رخداد'}</button>
            </div>
          </>
        )}

        {step === 5 && created && (
          <div className="card card-pad center-text">
            <div className="state success"><div className="art"><Icon name="checkCircle" /></div></div>
            <h2>رخداد ثبت شد</h2>
            <p className="muted">کد پیگیری: <strong className="tnum">{created.incident_code}</strong></p>
            <div className="row gap-sm center mt-16">
              <Link to={`/incidents/${created.id}`} className="btn btn-primary">مشاهده جزئیات</Link>
              <Link to="/rent/active" className="btn btn-ghost">بازگشت به اجاره فعال</Link>
            </div>
          </div>
        )}
      </main>
      <UserFooter />
    </>
  );
}
