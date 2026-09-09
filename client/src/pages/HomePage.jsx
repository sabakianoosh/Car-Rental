import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useRent } from '../context/RentContext';
import { UserFooter, UserHeader } from '../components/UserShell';
import { ActiveRentalBanner } from '../components/ActiveRentalBanner';
import { RangePickerModal } from '../components/RangePicker';
import { Icon } from '../components/Icon';
import { toFa, toman, vehicleImageUrl } from '../utils/format';

const SORT_OPTIONS = [
  { value: 'cheap', label: 'ارزان‌ترین' },
  { value: 'expensive', label: 'گران‌ترین' },
  { value: 'newest', label: 'جدیدترین' },
];

export default function HomePage() {
  const { range, setRange } = useRent();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sort, setSort] = useState('cheap');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = range ? { startAt: range.startAt, endAt: range.endAt } : {};
      const data = await api.getVehicles(params);
      setVehicles(data.vehicles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [range?.startAt, range?.endAt]);

  const sorted = useMemo(() => {
    const list = [...vehicles];
    if (sort === 'cheap') list.sort((a, b) => a.base_price - b.base_price);
    else if (sort === 'expensive') list.sort((a, b) => b.base_price - a.base_price);
    else if (sort === 'newest') list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    return list;
  }, [vehicles, sort]);

  const availableCount = range ? vehicles.filter((v) => v.available).length : vehicles.length;

  return (
    <>
      <UserHeader active="home" />
      <div className="container" style={{ paddingTop: 12 }}>
        <ActiveRentalBanner />
      </div>
      <div className="rangebar">
        <div className="container">
          <div className="range-picker">
            <button type="button" className={`range-btn ${range ? 'set' : ''}`} onClick={() => setPickerOpen(true)}>
              <span className="range-btn-ico">
                <Icon name="calendar" />
              </span>
              <span className="grow">
                <span className="range-btn-t1">بازه اجاره</span>
                <span className="range-btn-t2">{range?.label || 'برای دیدن موجودی، بازه را انتخاب کنید'}</span>
              </span>
              <Icon name="chevronL" />
            </button>
            {range && (
              <button type="button" className="btn btn-ghost btn-sm range-clear" onClick={() => setRange(null)}>حذف بازه</button>
            )}
          </div>
        </div>
      </div>

      <main className="container page-main">
        {!range && (
          <div className="alert alert-info mb-16">
            <Icon name="info" className="ic" />
            <div><strong>این فهرست کل خودروهای فعال است.</strong> برای مشاهده موجودی واقعی یک بازه، تاریخ و ساعت شروع و پایان را انتخاب کنید.</div>
          </div>
        )}

        <div className="results-head">
          <div>
            <h1 className="section-title">خودروها</h1>
            <p className="section-sub">
              {range
                ? `${toFa(availableCount)} از ${toFa(sorted.length)} خودرو در این بازه موجود است`
                : 'همه خودروهای فعال'}
            </p>
          </div>
          <div className="sort-wrap row gap-sm">
            <span className="small muted">مرتب‌سازی:</span>
            <select className="select sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="car-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card car-card"><div className="skeleton sk-thumb" /><div className="card-pad"><div className="skeleton sk-line" /><div className="skeleton sk-line" /></div></div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="card"><div className="state error"><div className="art"><Icon name="alert" /></div><h3>خطا در بارگذاری</h3><p>{error}</p><button type="button" className="btn btn-primary" onClick={load}>تلاش مجدد</button></div></div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div className="car-grid">
            {sorted.map((car) => (
              <Link key={car.id} to={`/cars/${car.id}`} className="card car-card card-hover">
                <div className="thumb">
                  {vehicleImageUrl(car.image_url) ? (
                    <img src={vehicleImageUrl(car.image_url)} alt={car.name} />
                  ) : (
                    <Icon name="car" />
                  )}
                  <span className={`avail badge ${range && car.available === false ? 'badge-warn' : 'badge-green'}`}>
                    <span className="dot" />
                    {!range ? 'فعال' : car.available ? 'موجود' : 'رزرو شده'}
                  </span>
                </div>
                <div className="body">
                  <div className="title">{car.name}</div>
                  <div className="specs"><span className="spec">{car.trim}</span><span className="spec">{car.color}</span></div>
                  <div className="price-row">
                    <div className="price"><div className="amt tnum">{toman(car.base_price)}</div><div className="per">برای ۱۲ ساعت اول</div></div>
                    <span className="btn btn-secondary btn-sm">جزئیات</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <UserFooter />
      <RangePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} preset={range} onApply={(r) => setRange(r)} />
    </>
  );
}
