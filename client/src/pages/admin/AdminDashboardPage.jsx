import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { AdminLayout } from '../../components/AdminLayout';
import { toFa } from '../../utils/format';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.adminMe().catch(() => navigate('/admin'));
    api.adminDashboard().then(setData).catch(() => navigate('/admin'));
  }, [navigate]);

  if (!data) return <AdminLayout><div className="spinner" /></AdminLayout>;

  const kpis = [
    { label: 'کاربران', value: data.stats.users },
    { label: 'خودروهای فعال', value: data.stats.vehicles },
    { label: 'KYC در انتظار', value: data.stats.pendingKyc },
    { label: 'رزرو فعال', value: data.stats.activeRentals },
  ];

  return (
    <AdminLayout active="dash">
      <div className="kpi-grid mb-24">
        {kpis.map((k) => (
          <div key={k.label} className="card kpi">
            <div className="k-label">{k.label}</div>
            <div className="k-value tnum">{toFa(k.value)}</div>
          </div>
        ))}
      </div>
      <div className="card card-pad">
        <h3 className="mb-16">آخرین رزروها</h3>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>کد</th><th>کاربر</th><th>خودرو</th><th>وضعیت</th><th>مبلغ</th></tr></thead>
            <tbody>
              {data.recentRentals.map((r) => (
                <tr key={r.id}>
                  <td className="tnum">{r.reservation_code}</td>
                  <td>{r.username}</td>
                  <td>{r.vehicle_name}</td>
                  <td>{r.status}</td>
                  <td className="tnum">{toFa(r.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
