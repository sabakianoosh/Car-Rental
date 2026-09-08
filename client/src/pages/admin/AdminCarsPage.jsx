import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { AdminLayout } from '../../components/AdminLayout';
import { toFa, toman } from '../../utils/format';

export default function AdminCarsPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.adminMe().catch(() => navigate('/admin'));
    api.adminVehicles().then((d) => setVehicles(d.vehicles));
  }, [navigate]);

  return (
    <AdminLayout active="cars">
      <div className="row between mb-24">
        <h2 className="section-title mt-0">مدیریت خودروها</h2>
        <Link to="/admin/cars/new" className="btn btn-primary btn-sm">+ خودرو جدید</Link>
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>نام</th><th>قیمت پایه</th><th>۱۲ساعت بعدی</th><th>وضعیت</th><th></th></tr></thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td><div className="cell-main">{v.name}</div><div className="cell-sub">{v.trim}</div></td>
                <td className="tnum">{toman(v.base_price)}</td>
                <td className="tnum">{toman(v.extra_price)}</td>
                <td>{v.active ? 'فعال' : 'غیرفعال'}</td>
                <td><Link to={`/admin/cars/${v.id}`} className="btn btn-ghost btn-sm">ویرایش</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
