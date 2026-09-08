import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRent } from '../context/RentContext';
import { UserFooter, UserHeader } from '../components/UserShell';
import { KycRequiredAlert } from '../components/KycRequiredAlert';
import { RENT_PURPOSES } from '../utils/format';

export default function RentPurposePage() {
  const navigate = useNavigate();
  const { isAuthed, user } = useAuth();
  const { purpose, setPurpose, vehicleId, range } = useRent();
  const [selected, setSelected] = useState(purpose || '');
  const [custom, setCustom] = useState('');
  const [kycError, setKycError] = useState(false);

  if (!isAuthed) { navigate('/auth'); return null; }
  if (!vehicleId || !range) { navigate('/'); return null; }

  const continueFlow = () => {
    if (user?.kycStatus !== 'approved') {
      setKycError(true);
      return;
    }
    const finalPurpose = selected === 'سایر' ? custom.trim() : selected;
    if (!finalPurpose) return;
    setPurpose(finalPurpose);
    navigate('/rent/summary');
  };

  return (
    <>
      <UserHeader />
      <main className="container-narrow" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <div className="stepper mb-24">
          <span className="step done"><span className="num">۱</span>خودرو</span><span className="bar" />
          <span className="step active"><span className="num">۲</span>هدف</span><span className="bar" />
          <span className="step"><span className="num">۳</span>خلاصه</span><span className="bar" />
          <span className="step"><span className="num">۴</span>پرداخت</span>
        </div>
        <h1 className="section-title">هدف اجاره</h1>
        <p className="section-sub mb-24">هدف خود از اجاره خودرو را انتخاب کنید.</p>
        <div className="stack" style={{ '--gap': '10px' }}>
          {RENT_PURPOSES.map((p) => (
            <label key={p} className={`opt-card ${selected === p ? 'selected' : ''}`}>
              <input type="radio" name="purpose" hidden checked={selected === p} onChange={() => setSelected(p)} />
              <span className="radio" />
              <span>{p}</span>
            </label>
          ))}
        </div>
        {selected === 'سایر' && (
          <div className="field mt-16">
            <label className="label">توضیح</label>
            <input className="input" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="هدف خود را بنویسید" />
          </div>
        )}
        {kycError && <KycRequiredAlert className="mb-16" />}
        <button type="button" className="btn btn-primary btn-lg btn-block mt-24" onClick={continueFlow}>ادامه</button>
      </main>
      <UserFooter />
    </>
  );
}
