import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

const NAV = [
  { title: 'کلی', items: [{ k: 'dash', t: 'داشبورد', href: '/admin/dashboard', ic: 'dashboard' }] },
  { title: 'خودرو', items: [{ k: 'cars', t: 'خودروها و قیمت', href: '/admin/cars', ic: 'car' }] },
  { title: 'کاربران', items: [{ k: 'kyc', t: 'بررسی گواهینامه', href: '/admin/kyc', ic: 'shield' }] },
  { title: 'عملیات شعبه', items: [
    { k: 'branch', t: 'تحویل و بازگشت', href: '/admin/branch', ic: 'key' },
    { k: 'incidents', t: 'رخدادها', href: '/admin/incidents', ic: 'alert' },
  ] },
];

export function AdminLayout({ children, active }) {
  const location = useLocation();
  const navigate = useNavigate();
  const current = active || NAV.flatMap((g) => g.items).find((it) => location.pathname.startsWith(it.href))?.k;

  return (
    <div className="admin">
      <aside className="sidebar">
        <Link to="/admin/dashboard" className="brand">
          <span className="logo"><Icon name="car" /></span>
          <span>ری‌کار<small>پنل مدیریت</small></span>
        </Link>
        {NAV.map((g) => (
          <div key={g.title}>
            <div className="nav-group">{g.title}</div>
            {g.items.map((it) => (
              <Link key={it.k} to={it.href} className={current === it.k ? 'active' : ''}>
                <Icon name={it.ic} /><span>{it.t}</span>
              </Link>
            ))}
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm mt-24" style={{ color: '#cfe0d7', marginInline: 8 }} onClick={() => navigate('/')}>
          بازگشت به سایت
        </button>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <h1 className="admin-title">پنل مدیریت</h1>
        </header>
        <div className="admin-body">{children}</div>
      </div>
    </div>
  );
}
