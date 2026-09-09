import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useRent } from '../context/RentContext';
import { UserFooter, UserHeader } from '../components/UserShell';
import { RangePickerModal } from '../components/RangePicker';
import { KycRequiredAlert } from '../components/KycRequiredAlert';
import { Icon } from '../components/Icon';
import { fa, toFa, toman, vehicleImageUrl } from '../utils/format';

const carDetailsStyles = `
  .gallery { display:grid; grid-template-columns: 2fr 1fr; gap:12px; }
  .gallery .main { aspect-ratio:16/10; border-radius:var(--r-md); background:linear-gradient(135deg,#eef2f7,#dde5ef); display:grid;place-items:center;color:var(--muted-2); overflow:hidden; }
  .gallery .main img { width:100%; height:100%; object-fit:cover; }
  .gallery .side { display:grid; grid-template-rows:1fr 1fr; gap:12px; }
  .gallery .side > div { border-radius:var(--r-md); background:linear-gradient(135deg,#eef2f7,#e3e9f1); display:grid;place-items:center;color:var(--muted-2); min-height:80px; overflow:hidden; }
  .spec-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
  .spec-item { display:flex; gap:10px; align-items:center; padding:12px 14px; border:1px solid var(--line); border-radius:var(--r-sm); min-width:0; }
  .spec-item .ib { width:36px;height:36px;border-radius:9px;background:var(--green-50);color:var(--green-700);display:grid;place-items:center;flex:none; }
  .spec-item .sl { font-size:12px;color:var(--muted); }
  .spec-item .sv { font-weight:700;font-size:14px; word-break:break-word; }
  .breadcrumb { color:var(--muted); font-size:13px; margin:16px 0; }
  .book-card { position:sticky; top:calc(var(--header-h) + 16px); }
  @media (max-width:720px){
    .gallery{grid-template-columns:1fr}
    .gallery .side{grid-template-columns:1fr 1fr;grid-template-rows:none}
    .spec-grid{grid-template-columns:1fr}
    .book-card{position:static}
    .breadcrumb{font-size:12px;margin:12px 0}
  }
`;

function calcPrice(base, extra, hours) {
  if (hours <= 12) return base;
  const extraBlocks = Math.ceil((hours - 12) / 12);
  return base + extraBlocks * extra;
}

export default function CarDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthed, user } = useAuth();
  const { range, setRange, setVehicleId } = useRent();
  const [vehicle, setVehicle] = useState(null);
  const [localRange, setLocalRange] = useState(range);
  const [availability, setAvailability] = useState(null);
  const [blockedPeriods, setBlockedPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectLoading, setSelectLoading] = useState(false);
  const [error, setError] = useState('');
  const [kycError, setKycError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const activeRange = localRange || range;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = activeRange ? { startAt: activeRange.startAt, endAt: activeRange.endAt } : {};
        const data = await api.getVehicle(id, params);
        setVehicle(data.vehicle);
        setAvailability(data.availability);
        setBlockedPeriods(data.blockedPeriods || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, activeRange?.startAt, activeRange?.endAt]);

  const applyRange = (r) => {
    setLocalRange(r);
    setRange(r);
  };

  const rangeState = !activeRange
    ? 'none'
    : availability?.available
      ? 'ok'
      : 'no';

  const estimatedPrice = activeRange && vehicle
    ? calcPrice(vehicle.base_price, vehicle.extra_price, activeRange.hours)
    : null;

  const selectCar = async () => {
    if (!isAuthed) {
      navigate('/auth', { state: { returnTo: `/cars/${id}` } });
      return;
    }
    if (user?.kycStatus !== 'approved') {
      setKycError(true);
      setError('');
      return;
    }
    setKycError(false);
    if (!activeRange) {
      setPickerOpen(true);
      return;
    }
    if (availability?.available === false) return;

    setSelectLoading(true);
    setError('');
    try {
      await api.validateRental({
        vehicleId: id,
        startAt: activeRange.startAt,
        endAt: activeRange.endAt,
      });
      setVehicleId(id);
      setRange(activeRange);
      navigate('/rent/purpose');
    } catch (err) {
      setError(err.message);
    } finally {
      setSelectLoading(false);
    }
  };

  const specs = vehicle ? [
    ['user', 'صندلی', `${toFa(vehicle.seats)} نفر`],
    ['transmission', 'گیربکس', vehicle.gear],
    ['fuel', 'سوخت', vehicle.fuel],
    ['gauge', 'کارکرد', `${vehicle.km} کیلومتر`],
    ['car', 'رنگ', vehicle.color],
    ['shield', 'سال', vehicle.trim?.split('·')[1]?.trim() || '—'],
  ] : [];

  if (loading && !vehicle) {
    return (<><UserHeader /><main className="container page-loading"><div className="spinner" style={{ margin: '40px auto' }} /></main></>);
  }

  if (error && !vehicle) {
    return (<><UserHeader /><main className="container"><div className="state error"><h3>{error}</h3><Link to="/" className="btn btn-primary">بازگشت</Link></div></main></>);
  }

  return (
    <>
      <UserHeader />
      <main className="container" style={{ paddingBottom: 40 }}>
        <div className="breadcrumb">
          <Link to="/" className="muted">خودروها</Link> ‹ <span>{vehicle.name}</span>
        </div>

        <div className="two-col">
          <div>
            <div className="gallery mb-24">
              <div className="main">
                {vehicleImageUrl(vehicle.image_url) ? (
                  <img src={vehicleImageUrl(vehicle.image_url)} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                ) : (
                  <Icon name="car" />
                )}
              </div>
              <div className="side">
                <div>{vehicleImageUrl(vehicle.image_url) ? <img src={vehicleImageUrl(vehicle.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : <Icon name="car" />}</div>
                <div><Icon name="car" /></div>
              </div>
            </div>

            <div className="row between mb-8">
              <div>
                <h1 className="car-title" style={{ fontSize: 24 }}>{vehicle.name}</h1>
                <p className="muted">{vehicle.trim}</p>
              </div>
              {rangeState === 'ok' && (
                <span className="badge badge-green"><span className="dot" />موجود</span>
              )}
              {rangeState === 'no' && (
                <span className="badge badge-danger"><span className="dot" />ناموجود</span>
              )}
            </div>

            <hr className="divider" />
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>مشخصات</h3>
            <div className="spec-grid mb-24">
              {specs.map(([ic, label, val]) => (
                <div key={label} className="spec-item">
                  <span className="ib"><Icon name={ic} /></span>
                  <div><div className="sl">{label}</div><div className="sv">{val}</div></div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 16, marginBottom: 12 }}>شرایط اجاره</h3>
            <div className="stack" style={{ '--gap': '10px' }}>
              <div className="alert alert-neutral" style={{ fontSize: 13.5 }}><Icon name="fuel" className="ic" /><div>هزینه سوخت بر عهده مستأجر است.</div></div>
              <div className="alert alert-neutral" style={{ fontSize: 13.5 }}><Icon name="gauge" className="ic" /><div>در نسخه اول محدودیت کیلومتر و جریمه کارکرد وجود ندارد.</div></div>
              <div className="alert alert-neutral" style={{ fontSize: 13.5 }}><Icon name="key" className="ic" /><div>تحویل و بازگشت فقط حضوری در شعبه تهران، در ازای چک ضمانت.</div></div>
            </div>
          </div>

          <aside>
            <div className="card card-pad book-card">
              <div className="row between mb-16">
                <div>
                  <div className="muted small">قیمت پایه (۱۲ ساعت اول)</div>
                  <div className="tnum" style={{ fontSize: 22, fontWeight: 800 }}>
                    {fa(vehicle.base_price)} <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>تومان</span>
                  </div>
                </div>
              </div>
              <div className="sumrow" style={{ padding: '6px 0' }}>
                <span className="lbl">هر ۱۲ ساعت بعد</span>
                <span className="tnum">+{fa(vehicle.extra_price)} تومان</span>
              </div>

              <hr className="divider" />

              {rangeState === 'none' && (
                <>
                  <div className="alert alert-warn mb-16" style={{ fontSize: 13 }}>
                    <Icon name="clock" className="ic" />
                    <div>برای بررسی موجودی، بازه اجاره را انتخاب کنید.{blockedPeriods.length > 0 && ' روزهای رزروشده در تقویم خط‌خورده نمایش داده می‌شوند.'}</div>
                  </div>
                  <button type="button" className="btn btn-outline btn-block mb-8" onClick={() => setPickerOpen(true)}>
                    <Icon name="calendar" /> انتخاب بازه اجاره
                  </button>
                  <button type="button" className="btn btn-primary btn-lg btn-block" disabled>انتخاب این خودرو</button>
                </>
              )}

              {rangeState === 'ok' && (
                <>
                  <div className="badge badge-green mb-16"><span className="dot" />موجود در بازه انتخابی</div>
                  <div className="alert alert-neutral mb-16" style={{ fontSize: 13 }}>
                    <Icon name="calendar" className="ic" />
                    <div>{activeRange.label}</div>
                  </div>
                  <div className="sumrow"><span className="lbl">مدت</span><span className="tnum">{toFa(activeRange.hours)} ساعت</span></div>
                  <div className="sumrow"><span className="lbl">برآورد مبلغ</span><span className="tnum strong">{toman(estimatedPrice)}</span></div>
                  <button type="button" className="btn btn-ghost btn-sm btn-block mt-8" onClick={() => setPickerOpen(true)}>تغییر بازه</button>
                  <button
                    type="button"
                    className={`btn btn-primary btn-lg btn-block mt-8 ${selectLoading ? 'loading' : ''}`}
                    onClick={selectCar}
                  >
                    انتخاب این خودرو
                  </button>
                  <p className="tiny muted center-text mt-8">انتخاب خودرو، رزرو قطعی نیست و خودرو را نگه نمی‌دارد.</p>
                </>
              )}

              {rangeState === 'no' && (
                <>
                  <div className="alert alert-danger mb-16" style={{ fontSize: 13 }}>
                    <Icon name="alert" className="ic" />
                    <div><strong>در این بازه موجود نیست.</strong> در تقویم، روزهای خط‌خورده رزرو شده‌اند — بازه‌ای بدون هم‌پوشانی انتخاب کنید.</div>
                  </div>
                  <button type="button" className="btn btn-outline btn-block" onClick={() => setPickerOpen(true)}>
                    <Icon name="calendar" /> تغییر بازه
                  </button>
                </>
              )}

              {error && (
                <div className="alert alert-danger mt-16" style={{ fontSize: 13 }}>
                  <Icon name="alert" className="ic" /><div>{error}</div>
                </div>
              )}

              {kycError && (
                <KycRequiredAlert className="mt-16" />
              )}
            </div>
          </aside>
        </div>
      </main>
      <UserFooter />
      <RangePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        preset={activeRange}
        blockedPeriods={blockedPeriods}
        onApply={applyRange}
      />
      <style>{carDetailsStyles}</style>
    </>
  );
}
