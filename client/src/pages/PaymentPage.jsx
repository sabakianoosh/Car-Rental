import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { UserFooter, UserHeader } from '../components/UserShell';
import { Icon } from '../components/Icon';
import { toman } from '../utils/format';

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getRental(id).then((d) => setRental(d.rental)).catch((e) => setError(e.message));
  }, [id]);

  const pay = async (success) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.payRental(id, success);
      setResult(success ? 'success' : 'fail');
      if (success) setTimeout(() => navigate(`/rent/confirmation/${id}`), 1200);
    } catch (err) {
      setError(err.message);
      setResult('fail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <UserHeader />
      <main className="container-narrow" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <h1 className="section-title">پرداخت آنلاین</h1>
        <p className="section-sub mb-24">درگاه پرداخت (MVP — شبیه‌سازی)</p>

        {rental && (
          <div className="card card-pad mb-16">
            <div className="sumrow total"><span className="lbl">مبلغ قابل پرداخت</span><span className="tnum">{toman(rental.total_amount)}</span></div>
          </div>
        )}

        {result === 'success' && (
          <div className="alert alert-success mb-16"><Icon name="checkCircle" className="ic" /><div><strong>پرداخت موفق</strong>در حال انتقال...</div></div>
        )}
        {result === 'fail' && (
          <div className="alert alert-danger mb-16"><Icon name="alert" className="ic" /><div><strong>پرداخت ناموفق</strong>{error || 'می‌توانید دوباره تلاش کنید.'}</div></div>
        )}

        <div className="card card-pad">
          <p className="muted small mb-16">برای تست MVP، یکی از گزینه‌ها را انتخاب کنید:</p>
          <button type="button" className={`btn btn-primary btn-lg btn-block mb-8 ${loading ? 'loading' : ''}`} onClick={() => pay(true)}>پرداخت موفق (شبیه‌سازی)</button>
          <button type="button" className="btn btn-outline btn-block" onClick={() => pay(false)} disabled={loading}>پرداخت ناموفق (شبیه‌سازی)</button>
        </div>
      </main>
      <UserFooter />
    </>
  );
}
