import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { AdminLayout } from '../../components/AdminLayout';
import { INCIDENT_STATUSES, INCIDENT_TYPES, statusLabel, typeLabel } from '../../constants/incidents';

export default function AdminIncidentsPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({});
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({ rentalId: '', type: 'breakdown', description: '', assignee: '' });

  const load = () => {
    const q = new URLSearchParams();
    if (filterStatus) q.set('status', filterStatus);
    if (filterType) q.set('type', filterType);
    const qs = q.toString();
    return fetch(`/api/admin/incidents${qs ? `?${qs}` : ''}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setIncidents(d.incidents); setStats(d.stats || {}); });
  };

  useEffect(() => {
    api.adminMe().catch(() => navigate('/admin'));
    load();
  }, [navigate, filterStatus, filterType]);

  const create = async (e) => {
    e.preventDefault();
    await api.adminCreateIncident({ ...form, rentalId: Number(form.rentalId) });
    setForm({ rentalId: '', type: 'breakdown', description: '', assignee: '' });
    load();
  };

  return (
    <AdminLayout active="incidents">
      <h2 className="section-title">مدیریت رخدادها</h2>

      <div className="kpi-grid mb-24">
        <div className="kpi card card-pad"><div className="k-val tnum">{stats.open ?? 0}</div><div className="k-lbl">باز</div></div>
        <div className="kpi card card-pad"><div className="k-val tnum">{stats.urgent ?? 0}</div><div className="k-lbl">فوری</div></div>
        <div className="kpi card card-pad"><div className="k-val tnum">{stats.awaitingDecision ?? 0}</div><div className="k-lbl">انتظار تصمیم</div></div>
        <div className="kpi card card-pad"><div className="k-val tnum">{stats.total ?? 0}</div><div className="k-lbl">کل</div></div>
      </div>

      <div className="row gap-sm mb-16">
        <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">همه وضعیت‌ها</option>
          {Object.keys(INCIDENT_STATUSES).map((k) => <option key={k} value={k}>{INCIDENT_STATUSES[k].label}</option>)}
        </select>
        <select className="select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">همه انواع</option>
          {Object.keys(INCIDENT_TYPES).map((k) => <option key={k} value={k}>{INCIDENT_TYPES[k].label}</option>)}
        </select>
      </div>

      <form className="card card-pad mb-24" onSubmit={create} style={{ maxWidth: 560 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>ثبت رخداد توسط ادمین</h3>
        <div className="field mb-16"><label className="label">شناسه رزرو</label><input className="input" type="number" value={form.rentalId} onChange={(e) => setForm({ ...form, rentalId: e.target.value })} required /></div>
        <div className="field mb-16">
          <label className="label">نوع</label>
          <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {Object.keys(INCIDENT_TYPES).map((k) => <option key={k} value={k}>{INCIDENT_TYPES[k].label}</option>)}
          </select>
        </div>
        <div className="field mb-16"><label className="label">توضیح</label><textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="field mb-16"><label className="label">مسئول</label><input className="input" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} /></div>
        <button type="submit" className="btn btn-primary">ثبت</button>
      </form>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr><th>کد</th><th>رزرو</th><th>نوع</th><th>وضعیت</th><th>اولویت</th><th>مسئول</th><th></th></tr>
          </thead>
          <tbody>
            {incidents.map((i) => (
              <tr key={i.id}>
                <td className="tnum">{i.incident_code}</td>
                <td>{i.reservation_code}</td>
                <td>{typeLabel(i.type)}</td>
                <td><span className={`badge ${INCIDENT_STATUSES[i.status]?.badge}`}>{statusLabel(i.status)}</span></td>
                <td>{i.priority === 'urgent' ? <span className="badge badge-urgent">فوری</span> : 'عادی'}</td>
                <td>{i.assignee || '—'}</td>
                <td><Link to={`/admin/incidents/${i.id}`} className="btn btn-ghost btn-sm">جزئیات</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
