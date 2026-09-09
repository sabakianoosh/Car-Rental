import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { Icon } from '../../components/Icon';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.remove('has-botnav');
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.adminLogin(username, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'linear-gradient(150deg,var(--green-900),var(--green-700))' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 20 }}>
        <div className="center-text mb-24" style={{ color: '#fff' }}>
          <div className="brand center" style={{ justifyContent: 'center', color: '#fff', fontSize: 22 }}>
            <span className="logo" style={{ background: 'rgba(255,255,255,.18)' }}><Icon name="car" /></span>
            ری‌کار
          </div>
          <p style={{ color: '#bfe0cf', marginTop: 6 }}>پنل مدیریت</p>
        </div>
        <form className="card card-pad" onSubmit={login}>
          <h1 style={{ fontSize: 20, marginBottom: 4 }}>ورود مدیران</h1>
          <p className="muted small mb-24">MVP: admin / admin</p>
          <div className="field mb-16">
            <label className="label">نام کاربری</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
          </div>
          <div className="field mb-8">
            <label className="label">رمز عبور</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="admin" />
          </div>
          {error && <div className="alert alert-danger mb-16" style={{ fontSize: 13 }}><Icon name="alert" className="ic" /><div>{error}</div></div>}
          <button type="submit" className={`btn btn-primary btn-lg btn-block mt-8 ${loading ? 'loading' : ''}`}>ورود</button>
        </form>
      </div>
    </div>
  );
}
