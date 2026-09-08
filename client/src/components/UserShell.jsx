import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useActiveRental } from '../context/ActiveRentalContext';
import { Icon } from './Icon';

export function UserHeader({ active }) {
  const { user, isAuthed, logout } = useAuth();
  const { hasActive } = useActiveRental();
  const location = useLocation();

  const nav = [
    { k: 'home', t: 'خودروها', href: '/', ic: 'car' },
    ...(isAuthed ? [{ k: 'active', t: 'اجاره فعال', href: '/rent/active', ic: 'key', highlight: hasActive }] : []),
    { k: 'res', t: 'رزروهای من', href: '/my-reservations', ic: 'receipt' },
    { k: 'profile', t: 'پروفایل', href: '/profile', ic: 'user' },
  ];

  const current = active || nav.find((n) => location.pathname === n.href || location.pathname.startsWith(n.href + '/'))?.k;

  useEffect(() => {
    document.body.classList.add('has-botnav');
    return () => document.body.classList.remove('has-botnav');
  }, []);

  return (
    <>
      <header className="appbar">
        <div className="container">
          <Link to="/" className="brand">
            <span className="logo"><Icon name="car" /></span>
            <span>ری‌کار<small>اجاره خودرو</small></span>
          </Link>
          <nav className="appnav">
            {nav.map((n) => (
              <Link key={n.k} to={n.href} className={`${current === n.k ? 'active' : ''} ${n.highlight ? 'nav-highlight' : ''}`}>
                {n.t}
                {n.highlight && <span className="nav-dot" aria-hidden />}
              </Link>
            ))}
          </nav>
          {isAuthed ? (
            <div className="row gap-sm appbar-user">
              <div className="avatar" title={user.username}>{user.username?.[0] || '?'}</div>
              <button type="button" className="btn btn-ghost btn-sm appbar-logout" onClick={logout}>
                <Icon name="logout" /> <span className="logout-label">خروج</span>
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-sm" style={{ marginInlineStart: 8 }}>ورود / ثبت‌نام</Link>
          )}
        </div>
      </header>
      <nav className="botnav">
        {nav.map((n) => (
          <Link key={n.k} to={n.href} className={`${current === n.k ? 'active' : ''} ${n.highlight ? 'nav-highlight' : ''}`}>
            <span style={{ position: 'relative' }}>
              <Icon name={n.ic} />
              {n.highlight && <span className="nav-dot bot" aria-hidden />}
            </span>
            {n.t}
          </Link>
        ))}
      </nav>
    </>
  );
}

export function UserFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <span>© ری‌کار — اجاره خودرو V2</span>
        <span className="muted">پشتیبانی: ۰۲۱-۸۸۷۷۶۶۵۵</span>
      </div>
    </footer>
  );
}
