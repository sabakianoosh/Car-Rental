import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { UserFooter, UserHeader } from '../components/UserShell';
import { Icon } from '../components/Icon';
import { badgeClass, kycLabel, toFa } from '../utils/format';

export default function ProfilePage() {
  const { user, refresh, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAuthed) navigate('/auth');
  }, [isAuthed, navigate]);

  useEffect(() => {
    if (!isAuthed) return;
  
    let interval;
  
    const checkKyc = async () => {
      try {
        const status = await api.kycStatus();
        setKyc(status);
  
        // وقتی تأیید شد، اطلاعات کاربر را هم به‌روز می‌کنیم
        if (status.status === 'approved') {
          await refresh();
  
          if (interval) {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('KYC status check failed:', err);
      }
    };
  
    // یک بار در ابتدا
    checkKyc();
  
    // سپس هر 1 ثانیه
    interval = setInterval(checkKyc, 1000);
  
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAuthed, refresh]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.uploadKyc(file);
      setSuccess('گواهینامه با موفقیت ارسال شد و در انتظار بررسی است.');
      await refresh();
      setKyc(await api.kycStatus());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <UserHeader active="profile" />
      <main className="container-narrow" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <h1 className="section-title">پروفایل</h1>
        <p className="section-sub mb-24">اطلاعات حساب و احراز هویت</p>

        <div className="card card-pad mb-16">
          <div className="row between mb-16">
            <div className="row gap-sm"><div className="avatar">{user.username?.[0]}</div><div><div className="strong">{user.username}</div><div className="muted small tnum">{toFa(user.phone)}</div></div></div>
          </div>
        </div>

        <div className="card card-pad">
          <div className="row between mb-16">
            <h3>گواهینامه (KYC)</h3>
            <span className={`badge ${badgeClass(user.kycStatus || kyc?.status)}`}><span className="dot" />{kycLabel(user.kycStatus || kyc?.status)}</span>
          </div>

          {user.kycStatus === 'rejected' && (
            <div className="alert alert-danger mb-16"><Icon name="alert" className="ic" /><div><strong>رد شده</strong>{user.kycRejectionReason || kyc?.rejectionReason}</div></div>
          )}

          {(user.kycStatus === 'not_submitted' || user.kycStatus === 'rejected') && (
            <label className="dropzone" style={{ position: 'relative' }}>
              <input type="file" accept="image/*" onChange={upload} disabled={loading} />
              <div className="icon"><Icon name="upload" /></div>
              <div className="strong">بارگذاری تصویر گواهینامه</div>
              <div className="muted small">JPG/PNG تا ۵ مگابایت</div>
            </label>
          )}

          {user.kycStatus === 'pending' && (
            <div className="alert alert-warn"><Icon name="clock" className="ic" /><div>مدارک شما در انتظار بررسی ادمین است.</div></div>
          )}

          {(user.kycStatus === 'approved' || kyc?.status === 'approved') && (
            <div className="alert alert-success">
              <Icon name="checkCircle" className="ic" />
              <div>گواهینامه تأیید شده — می‌توانید رزرو و پرداخت کنید.</div>
            </div>
          )}

          {error && <div className="error-text mt-16"><Icon name="alert" />{error}</div>}
          {success && <div className="success-text mt-16"><Icon name="check" />{success}</div>}
        </div>

        <Link to="/my-reservations" className="btn btn-outline btn-block mt-16">مشاهده رزروهای من</Link>
      </main>
      <UserFooter />
    </>
  );
}
