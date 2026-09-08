import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { AdminLayout } from '../../components/AdminLayout';
import { badgeClass, kycLabel } from '../../utils/format';

export default function AdminKycPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [reason, setReason] = useState('');

  const load = () => api.adminKyc().then((d) => setRequests(d.requests));
  useEffect(() => {
    api.adminMe().catch(() => navigate('/admin'));
    load();
  }, [navigate]);

  const review = async (userId, approved) => {
    await api.adminReviewKyc(userId, { approved, reason: approved ? undefined : reason || 'مدارک نامعتبر' });
    setReason('');
    load();
  };

  const pending = requests.filter((r) => r.kyc_status === 'pending');

  return (
    <AdminLayout active="kyc">
      <h2 className="section-title">بررسی گواهینامه</h2>
      <p className="section-sub mb-24">{pending.length} درخواست در انتظار</p>
      <div className="stack" style={{ '--gap': '12px' }}>
        {requests.filter((r) => r.kyc_status === 'pending').map((r) => (
          <div key={r.id} className="card card-pad">
            <div className="row between mb-8">
              <div><div className="strong">{r.username}</div><div className="muted small">{r.phone}</div></div>
              <span className={`badge ${badgeClass(r.kyc_status)}`}>{kycLabel(r.kyc_status)}</span>
            </div>
            {r.kyc_file_path && (
              <a href={`/api/admin/kyc/${r.id}/file`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm mb-8">مشاهده تصویر</a>
            )}
            <input className="input mb-8" placeholder="دلیل رد (در صورت نیاز)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="row gap-sm">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => review(r.id, true)}>تأیید</button>
              <button type="button" className="btn btn-danger-soft btn-sm" onClick={() => review(r.id, false)}>رد</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <div className="card card-pad muted center-text">درخواست pending وجود ندارد.</div>}
      </div>
    </AdminLayout>
  );
}
