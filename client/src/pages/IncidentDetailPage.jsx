import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { UserFooter, UserHeader } from '../components/UserShell';
import { Icon } from '../components/Icon';
import { INCIDENT_STATUSES, INCIDENT_TYPES, LIFECYCLE_STEPS, statusLabel } from '../constants/incidents';
import { toman } from '../utils/format';

function StatusProgress({ status }) {
  const idx = LIFECYCLE_STEPS.findIndex((s) => s === status || INCIDENT_STATUSES[status]?.step >= INCIDENT_STATUSES[s]?.step);
  return (
    <div className="status-progress mb-16">
      {LIFECYCLE_STEPS.map((s, i) => (
        <div key={s} className={`sp-step ${i < idx ? 'done' : i === idx ? 'active' : ''}`}>
          <div className="sp-dot" />
          <div className="sp-label">{INCIDENT_STATUSES[s]?.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthed) { navigate('/auth'); return; }
    api.getIncident(id).then(setDetail).catch(() => navigate('/rent/active')).finally(() => setLoading(false));
  }, [id, isAuthed, navigate]);

  if (loading || !detail) {
    return (<><UserHeader hasActive /><main className="container page-loading"><div className="spinner" style={{ margin: '40px auto' }} /></main></>);
  }

  const { incident, history, attachments, charges, decisions } = detail;
  const t = INCIDENT_TYPES[incident.type];

  return (
    <>
      <UserHeader hasActive />
      <main className="container-narrow" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <Link to="/rent/active" className="btn btn-ghost btn-sm mb-16"><Icon name="arrowL" /> بازگشت</Link>

        <div className="row gap-sm mb-8">
          <div className={`inc-icon ${incident.type}`}><Icon name={t?.icon || 'incident'} /></div>
          <div className="grow">
            <h1 className="section-title" style={{ margin: 0 }}>{incident.typeLabel}</h1>
            <div className="muted tnum">{incident.incident_code}</div>
          </div>
          <span className={`badge ${INCIDENT_STATUSES[incident.status]?.badge}`}>{statusLabel(incident.status)}</span>
        </div>

        <StatusProgress status={incident.status} />

        {incident.status === 'action_required' && (
          <div className="alert alert-warn mb-16">
            <Icon name="alert" />
            <div>تیم عملیات از شما اطلاعات تکمیلی درخواست کرده است. لطفاً با پشتیبانی تماس بگیرید.</div>
          </div>
        )}

        <div className="card card-pad mb-16">
          <div className="sumrow"><span className="lbl">رزرو</span><span className="tnum">{incident.reservation_code}</span></div>
          <div className="sumrow"><span className="lbl">خودرو</span><span>{incident.vehicle_name}</span></div>
          <div className="sumrow"><span className="lbl">شرح</span><span>{incident.description || '—'}</span></div>
          {incident.location && <div className="sumrow"><span className="lbl">موقعیت</span><span>{incident.location}</span></div>}
        </div>

        {attachments?.length > 0 && (
          <div className="card card-pad mb-16">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>پیوست‌ها</h3>
            <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
              {attachments.map((a) => (
                <a key={a.id} href={a.file_path} target="_blank" rel="noreferrer">
                  <img src={a.file_path} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                </a>
              ))}
            </div>
          </div>
        )}

        {(charges?.length > 0 || decisions?.length > 0) && (
          <div className="card card-pad mb-16">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>نتیجه مالی</h3>
            {charges.map((c) => (
              <div key={c.id} className="sumrow"><span>{c.label}</span><span className="tnum">{toman(c.amount)}</span></div>
            ))}
            {decisions.map((d) => (
              <div key={d.id} className="sumrow"><span>{d.decision_type}</span><span className="tnum">{d.amount != null ? toman(d.amount) : '—'}</span></div>
            ))}
          </div>
        )}

        <div className="card card-pad">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>تاریخچه</h3>
          {history.map((h) => (
            <div key={h.id} className="act-item">
              <div className="act-dot" />
              <div>
                <div>{statusLabel(h.to_status)}</div>
                {h.note && <div className="muted small">{h.note}</div>}
                <div className="muted small">{h.created_at}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <UserFooter />
    </>
  );
}
