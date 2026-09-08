import { Link } from 'react-router-dom';
import { useActiveRental } from '../context/ActiveRentalContext';
import { Icon } from './Icon';

export function ActiveRentalBanner({ compact = false }) {
  const { hasActive, rental, canReportIncidents, incidentWindow } = useActiveRental();
  if (!hasActive || !rental) return null;

  if (compact) {
    return (
      <Link to="/rent/active" className="active-rental-banner compact">
        <span className="live-badge"><span className="blink" />اجاره فعال</span>
        <span className="grow">{rental.vehicle_name}</span>
        <Icon name="chevronL" />
      </Link>
    );
  }

  return (
    <div className="active-rental-banner">
      <div className="row gap-sm grow">
        <span className="live-badge"><span className="blink" />در حال اجاره</span>
        <div>
          <strong>{rental.vehicle_name}</strong>
          <div className="muted small">کد: {rental.reservation_code} — {incidentWindow?.message || 'ثبت رخداد فعال است'}</div>
        </div>
      </div>
      <Link to="/rent/active" className="btn btn-primary btn-sm">ورود به اجاره فعال</Link>
    </div>
  );
}
