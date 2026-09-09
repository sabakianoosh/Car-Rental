import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { AdminLayout } from '../../components/AdminLayout';
import { statusLabel, toman } from '../../utils/format';
import { coverageLabel as covLabel } from '../../constants/incidents';

export default function AdminBranchPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [rental, setRental] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [checklistOk, setChecklistOk] = useState(true);
  const [anomaly, setAnomaly] = useState(false);
  const [notes, setNotes] = useState('');
  const [lateFee, setLateFee] = useState('');
  const [createLateIncident, setCreateLateIncident] = useState(false);

  useEffect(() => { api.adminMe().catch(() => navigate('/admin')); }, [navigate]);

  const search = async () => {
    setError('');
    setMsg('');
    try {
      const data = await api.adminSearchBranch(code);
      setRental(data.rental);
      setChecklistOk(true);
      setAnomaly(false);
      setNotes('');
      setLateFee('');
      setCreateLateIncident(false);
    } catch (err) {
      setError(err.message);
      setRental(null);
    }
  };

  const deliver = async () => {
    const res = await api.adminDeliver(rental.id);
    setMsg(res.message || 'تحویل خودرو ثبت شد. ثبت رخداد برای کاربر فعال شد.');
    search();
  };

  const returnCar = async () => {
    try {
      await api.adminReturnRental(rental.id, {
        checklistOk,
        anomaly,
        notes,
        lateFee: lateFee ? Number(lateFee) : null,
        createLateIncident,
      });
      setMsg('بازگشت خودرو ثبت شد.');
      search();
    } catch (err) {
      setError(err.message);
    }
  };

  const cov = rental?.coverage_type || 'none';

  return (
    <AdminLayout active="branch">
      <h2 className="section-title">عملیات شعبه</h2>
        <div className="card card-pad mb-16" style={{ maxWidth: 480 }}>
        <div className="field mb-8"><label className="label">کد رزرو</label><input className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="RK-XXXXXX" /></div>
        <button type="button" className="btn btn-primary" onClick={search}>جستجو</button>
        {error && <div className="error-text mt-8">{error}</div>}
        {msg && <div className="success-text mt-8">{msg}</div>}
      </div>
      {rental && (
        <div className="card card-pad form-grid">
          <div>
            <div className="strong">{rental.vehicle_name}</div>
            <div className="muted small mb-8">{rental.username} — {statusLabel(rental.status)}</div>
            <div className="sumrow"><span>مبلغ</span><span>{toman(rental.total_amount)}</span></div>
            <div className="sumrow"><span>پوشش</span><span>{covLabel(cov)}</span></div>
            <div className="row gap-sm mt-16">
              {rental.status === 'paid' && (
                <button type="button" className="btn btn-primary" onClick={deliver}>
                  ثبت تحویل به کاربر (فعال‌سازی ثبت رخداد)
                </button>
              )}
            </div>
          </div>

          {rental.status === 'delivered' && (
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>چک‌لیست بازگشت</h3>
              <label className="row gap-sm mb-8">
                <input type="checkbox" checked={checklistOk} onChange={(e) => setChecklistOk(e.target.checked)} />
                خودرو سالم و مطابق تحویل است
              </label>
              <label className="row gap-sm mb-8">
                <input type="checkbox" checked={anomaly} onChange={(e) => setAnomaly(e.target.checked)} />
                وضعیت غیرعادی
              </label>
              <label className="row gap-sm mb-8">
                <input type="checkbox" checked={createLateIncident} onChange={(e) => setCreateLateIncident(e.target.checked)} />
                ثبت رخداد تأخیر
              </label>
              <div className="field mb-8">
                <label className="label">هزینه تأخیر (تومان)</label>
                <input className="input" type="number" value={lateFee} onChange={(e) => setLateFee(e.target.value)} />
              </div>
              <div className="field mb-8">
                <label className="label">یادداشت</label>
                <textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <button type="button" className="btn btn-secondary" onClick={returnCar}>ثبت بازگشت</button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
