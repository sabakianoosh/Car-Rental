import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useActiveRental } from '../context/ActiveRentalContext';
import { UserFooter, UserHeader } from '../components/UserShell';
import { Icon } from '../components/Icon';
import { BRANCH_INFO, toFa, toman } from '../utils/format';

export default function ConfirmationPage() {
  const { id } = useParams();
  const { refresh: refreshActive } = useActiveRental();
  const [rental, setRental] = useState(null);

  useEffect(() => {
    const load = () => api.getRental(id).then((d) => {
      setRental(d.rental);
      refreshActive();
    });
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [id, refreshActive]);

  if (!rental) return (<><UserHeader /><main className="container page-loading"><div className="spinner" style={{ margin: '40px auto' }} /></main></>);

  const isDelivered = rental.status === 'delivered';
  const isPaid = rental.status === 'paid';

  return (
    <>
      <UserHeader />
      <main className="container-narrow" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <div className="state empty" style={{ padding: '20px 0' }}>
          <div className="art"><Icon name="checkCircle" /></div>
          <h1 className="section-title">{isDelivered ? 'خودرو تحویل شد — اجاره فعال است' : 'رزرو با موفقیت ثبت شد'}</h1>
          <p className="muted">کد رزرو: <strong className="tnum">{rental.reservation_code}</strong></p>
        </div>

        {isDelivered && (
          <div className="card card-pad mb-16 active-rental-card">
            <span className="live-badge mb-12"><span className="blink" />اجاره فعال</span>
            <p className="mb-16">از این لحظه می‌توانید رخدادها (تصادف، خرابی، خسارت و …) را ثبت و پیگیری کنید.</p>
            <Link to="/rent/active" className="btn btn-primary btn-lg btn-block">ورود به اجاره فعال</Link>
            <Link to={`/incidents/new?rental=${rental.id}&type=accident`} className="btn btn-outline btn-block mt-8">ثبت رخداد فوری</Link>
          </div>
        )}

        {isPaid && (
          <div className="alert alert-info mb-16">
            <Icon name="info" />
            <div>برای فعال شدن بخش مدیریت رخداد، ابتدا به شعبه مراجعه کنید تا خودرو تحویل داده شود.</div>
          </div>
        )}

        <div className="card card-pad mb-16">
          <h3 className="mb-16">راهنمای مراجعه به شعبه</h3>
          {!isDelivered && (
            <div className="alert alert-info mb-16"><Icon name="info" className="ic" /><div>پس از پرداخت، برای تحویل خودرو به شعبه مراجعه کنید و چک ضمانت ارائه دهید.</div></div>
          )}
          <div className="sumrow"><span className="lbl">شعبه</span><span>{BRANCH_INFO.name}</span></div>
          <div className="sumrow"><span className="lbl">آدرس</span><span>{BRANCH_INFO.address}</span></div>
          <div className="sumrow"><span className="lbl">تماس</span><span className="tnum">{BRANCH_INFO.phone}</span></div>
          <div className="sumrow"><span className="lbl">ساعات کاری</span><span>{BRANCH_INFO.hours}</span></div>
          <div className="sumrow total"><span className="lbl">مبلغ پرداخت‌شده</span><span className="tnum">{toman(rental.total_amount)}</span></div>
          <div className="sumrow"><span className="lbl">مدت</span><span>{toFa(rental.hours)} ساعت</span></div>
        </div>

        <Link to="/my-reservations" className="btn btn-primary btn-block mb-8">مشاهده رزروهای من</Link>
        <Link to="/" className="btn btn-outline btn-block">بازگشت به خانه</Link>
      </main>
      <UserFooter />
    </>
  );
}
