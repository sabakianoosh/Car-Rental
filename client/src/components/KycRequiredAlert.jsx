import { Link } from 'react-router-dom';
import { Icon } from './Icon';

export function KycRequiredAlert({ message, className = 'mb-16' }) {
  return (
    <div className={`alert alert-warn ${className}`} style={{ fontSize: 14 }}>
      <Icon name="shield" className="ic" />
      <div>
        <strong>{message || 'تا پیش از تأیید گواهینامه، امکان ادامه وجود ندارد.'}</strong>
        <div className="mt-8">
          <Link to="/profile" className="btn btn-secondary btn-sm">بارگذاری گواهینامه</Link>
        </div>
      </div>
    </div>
  );
}
