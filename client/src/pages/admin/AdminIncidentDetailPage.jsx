import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { AdminLayout } from '../../components/AdminLayout';
import { Icon } from '../../components/Icon';
import { INCIDENT_STATUSES, INCIDENT_TYPES, statusLabel } from '../../constants/incidents';
import { toman } from '../../utils/format';

export default function AdminIncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState('');
  const [assignee, setAssignee] = useState('');
  const [note, setNote] = useState('');
  const [chargeLabel, setChargeLabel] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [decisionType, setDecisionType] = useState('charge');
  const [decisionAmount, setDecisionAmount] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api.adminIncident(id).then((d) => {
    setDetail(d);
    setStatus(d.incident.status);
    setAssignee(d.incident.assignee || '');
  });

  useEffect(() => {
    api.adminMe().catch(() => navigate('/admin'));
    load();
  }, [id, navigate]);

  const saveStatus = async () => {
    await api.adminUpdateIncident(id, { status, assignee, note });
    setMsg('وضعیت به‌روز شد.');
    load();
  };

  const addCharge = async () => {
    await api.adminAddIncidentCharge(id, { label: chargeLabel, amount: Number(chargeAmount), chargeType: 'fee' });
    setChargeLabel('');
    setChargeAmount('');
    load();
  };

  const addDecision = async () => {
    await api.adminAddIncidentDecision(id, {
      decisionType,
      amount: decisionAmount ? Number(decisionAmount) : null,
      note,
    });
    setMsg('تصمیم مالی ثبت شد.');
    load();
  };

  if (!detail) {
    return <AdminLayout active="incidents"><div className="spinner" style={{ margin: 40 }} /></AdminLayout>;
  }

  const { incident, history, charges, decisions } = detail;
  const t = INCIDENT_TYPES[incident.type];

  return (
    <AdminLayout active="incidents">
      <Link to="/admin/incidents" className="btn btn-ghost btn-sm mb-16"><Icon name="arrowL" /> فهرست رخدادها</Link>

      <div className="row gap-sm mb-16">
        <div className={`inc-icon ${incident.type}`}><Icon name={t?.icon || 'incident'} /></div>
        <div className="grow">
          <h2 className="section-title" style={{ margin: 0 }}>{incident.typeLabel}</h2>
          <div className="muted tnum">{incident.incident_code} — {incident.reservation_code}</div>
        </div>
        <span className={`badge ${INCIDENT_STATUSES[incident.status]?.badge}`}>{statusLabel(incident.status)}</span>
      </div>

      {msg && <div className="alert alert-success mb-16">{msg}</div>}

      <div className="two-col">
        <div className="stack">
          <div className="card card-pad mb-16">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>اطلاعات</h3>
            <div className="sumrow"><span>کاربر</span><span>{incident.username}</span></div>
            <div className="sumrow"><span>خودرو</span><span>{incident.vehicle_name}</span></div>
            <div className="sumrow"><span>شرح</span><span>{incident.description || '—'}</span></div>
            <div className="sumrow"><span>اولویت</span><span>{incident.priority === 'urgent' ? 'فوری' : 'عادی'}</span></div>
          </div>

          <div className="card card-pad">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>تاریخچه</h3>
            {history.map((h) => (
              <div key={h.id} className="act-item">
                <div className="act-dot admin" />
                <div>
                  <div>{statusLabel(h.to_status)}</div>
                  {h.note && <div className="muted small">{h.note}</div>}
                  <div className="muted small">{h.created_at} — {h.actor || 'سیستم'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <div className="card card-pad mb-16">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>تغییر وضعیت</h3>
            <div className="field mb-8">
              <label className="label">وضعیت</label>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.keys(INCIDENT_STATUSES).map((k) => (
                  <option key={k} value={k}>{INCIDENT_STATUSES[k].label}</option>
                ))}
              </select>
            </div>
            <div className="field mb-8">
              <label className="label">مسئول</label>
              <input className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
            </div>
            <div className="field mb-8">
              <label className="label">یادداشت</label>
              <textarea className="textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={saveStatus}>ذخیره</button>
          </div>

          <div className="card card-pad mb-16">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>هزینه / بدهی</h3>
            <div className="field mb-8"><input className="input" placeholder="عنوان" value={chargeLabel} onChange={(e) => setChargeLabel(e.target.value)} /></div>
            <div className="field mb-8"><input className="input" type="number" placeholder="مبلغ (تومان)" value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} /></div>
            <button type="button" className="btn btn-secondary btn-block" onClick={addCharge}>افزودن هزینه</button>
            {charges?.map((c) => (
              <div key={c.id} className="sumrow mt-8"><span>{c.label}</span><span>{toman(c.amount)}</span></div>
            ))}
          </div>

          <div className="card card-pad decision-panel">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>تصمیم مالی نهایی</h3>
            <div className="field mb-8">
              <select className="select" value={decisionType} onChange={(e) => setDecisionType(e.target.value)}>
                <option value="charge">بدهکار</option>
                <option value="refund">بستانکار</option>
                <option value="zero">بدون هزینه</option>
                <option value="coverage">پوشش بیمه</option>
              </select>
            </div>
            <div className="field mb-8"><input className="input" type="number" placeholder="مبلغ" value={decisionAmount} onChange={(e) => setDecisionAmount(e.target.value)} /></div>
            <button type="button" className="btn btn-primary btn-block" onClick={addDecision}>ثبت تسویه</button>
            {decisions?.map((d) => (
              <div key={d.id} className="sumrow mt-8"><span>{d.decision_type}</span><span>{d.amount != null ? toman(d.amount) : '—'}</span></div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
