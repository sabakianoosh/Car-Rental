import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useRent } from '../context/RentContext';
import { UserFooter, UserHeader } from '../components/UserShell';
import { KycRequiredAlert } from '../components/KycRequiredAlert';
import { Icon } from '../components/Icon';
import { COVERAGE_TYPES } from '../constants/incidents';
import { toFa, toman } from '../utils/format';

function useHoldCountdown(expiresAt) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const m = Math.floor(left / 60);
  const s = left % 60;
  return { left, label: toFa(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`), expired: left <= 0 };
}

export default function RentSummaryPage() {
  const navigate = useNavigate();
  const { user, isAuthed } = useAuth();
  const { range, vehicleId, purpose, rentalId, setRentalId } = useRent();
  const [vehicle, setVehicle] = useState(null);
  const [quote, setQuote] = useState(null);
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverage, setCoverage] = useState('none');
  const [savingCov, setSavingCov] = useState(false);
  const [error, setError] = useState('');

  const countdown = useHoldCountdown(rental?.hold_expires_at);

  useEffect(() => {
    if (!isAuthed) navigate('/auth');
    if (!vehicleId || !range || !purpose) navigate('/');
  }, [isAuthed, vehicleId, range, purpose, navigate]);

  useEffect(() => {
    if (user?.kycStatus !== 'approved') {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [vData, qData] = await Promise.all([
          api.getVehicle(vehicleId, { startAt: range.startAt, endAt: range.endAt }),
          api.quote({ vehicleId, startAt: range.startAt, endAt: range.endAt }),
        ]);
        setVehicle(vData.vehicle);
        setQuote(qData);

        if (rentalId) {
          const r = await api.getRental(rentalId);
          setRental(r.rental);
          setCoverage(r.rental.coverage_type || 'none');
        } else {
          const hold = await api.createHold({
            vehicleId,
            purpose,
            startAt: range.startAt,
            endAt: range.endAt,
          });
          setRental(hold.rental);
          setRentalId(hold.rental.id);
          setCoverage(hold.rental.coverage_type || 'none');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectCoverage = async (key) => {
    if (!rental || coverage === key) return;
    setSavingCov(true);
    try {
      const { rental: updated } = await api.updateRentalCoverage(rental.id, key);
      setRental(updated);
      setCoverage(key);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingCov(false);
    }
  };

  const baseTotal = quote ? quote.basePrice + quote.extraBlocks * quote.extraUnitPrice : 0;
  const covAmount = COVERAGE_TYPES[coverage]?.price || 0;
  const grandTotal = baseTotal + covAmount;

  const goPayment = async () => {
    if (countdown.expired) {
      setError('مهلت Hold منقضی شده است.');
      return;
    }
    setLoading(true);
    try {
      await api.confirmRental(rental.id);
      navigate(`/rent/payment/${rental.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !rental) {
    return (<><UserHeader /><main className="container page-loading"><div className="spinner" style={{ margin: '40px auto' }} /></main></>);
  }

  return (
    <>
      <UserHeader />
      <main className="container-narrow" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <h1 className="section-title">خلاصه رزرو</h1>
        {rental?.hold_expires_at && (
          <div className={`hold-bar mb-16 ${countdown.expired ? 'danger' : ''}`}>
            <span><Icon name="clock" /> Hold — فرصت پرداخت</span>
            <span className="time tnum">{countdown.expired ? 'منقضی' : countdown.label}</span>
          </div>
        )}
        {error && <div className="alert alert-danger mb-16"><Icon name="alert" className="ic" /><div>{error}</div></div>}
        {user?.kycStatus !== 'approved' && (
          <KycRequiredAlert />
        )}
        {vehicle && quote && (
          <div className="card card-pad">
            <div className="strong mb-8">{vehicle.name}</div>
            <div className="muted small mb-16">{range.label}</div>
            <div className="sumrow"><span className="lbl">هدف</span><span>{purpose}</span></div>
            <div className="sumrow"><span className="lbl">مدت</span><span>{toFa(quote.hours)} ساعت</span></div>
            <div className="sumrow"><span className="lbl">قیمت پایه</span><span className="tnum">{toman(quote.basePrice)}</span></div>
            <div className="sumrow"><span className="lbl">بازه‌های ۱۲ساعته اضافه ({toFa(quote.extraBlocks)})</span><span className="tnum">{toman(quote.extraBlocks * quote.extraUnitPrice)}</span></div>

            <h3 style={{ fontSize: 15, margin: '20px 0 12px' }}>پوشش خسارت</h3>
            <div className="stack mb-16" style={{ gap: 10 }}>
              {Object.values(COVERAGE_TYPES).map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`coverage-opt ${coverage === c.key ? 'selected' : ''}`}
                  style={{ width: '100%', textAlign: 'inherit' }}
                  disabled={savingCov}
                  onClick={() => selectCoverage(c.key)}
                >
                  <div className="cov-icon"><Icon name={c.key === 'none' ? 'warning' : 'coverage'} /></div>
                  <div className="grow">
                    <div className="cov-title">{c.label}</div>
                    <div className="cov-price">{c.price ? toman(c.price) : 'رایگان'}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="sumrow"><span className="lbl">پوشش</span><span className="tnum">{covAmount ? toman(covAmount) : 'رایگان'}</span></div>
            <div className="sumrow total"><span className="lbl">مبلغ کل</span><span className="tnum">{toman(grandTotal)}</span></div>
            {rental?.reservation_code && (
              <div className="alert alert-neutral mt-16">کد رزرو: <strong className="tnum">{rental.reservation_code}</strong></div>
            )}
            <button type="button" className="btn btn-primary btn-lg btn-block mt-24" disabled={user?.kycStatus !== 'approved' || countdown.expired} onClick={goPayment}>
              تأیید و رفتن به پرداخت
            </button>
          </div>
        )}
      </main>
      <UserFooter />
    </>
  );
}
