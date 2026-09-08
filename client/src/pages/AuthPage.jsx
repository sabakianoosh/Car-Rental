import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/Icon';
import { formatPhoneDisplay, validatePhoneInput } from '../utils/format';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, refresh } = useAuth();
  const returnTo = location.state?.returnTo || '/';

  const [step, setStep] = useState('phone');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isRegistered, setIsRegistered] = useState(false);
  const [storedUsername, setStoredUsername] = useState('');
  const [signupToken, setSignupToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const verifyingRef = useRef(false);

  const validPhone = validatePhoneInput(phone);

  const submitPhone = async () => {
    if (!validPhone) {
      setError('شماره موبایل باید ۱۰ رقم و با ۹ شروع شود.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.sendOtp(validPhone);
      setIsRegistered(data.isRegistered);
      setStoredUsername(data.username || '');
      setSignupToken('');
      setOtp(['', '', '', '', '', '']);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verify = useCallback(async () => {
    const code = otp.join('');
    if (code.length !== 6 || verifyingRef.current) return;

    verifyingRef.current = true;
    setLoading(true);
    setError('');
    try {
      if (isRegistered) {
        await login({ phone: validPhone, otp: code });
        navigate(returnTo);
        return;
      }

      const data = await api.verifyOtp({ phone: validPhone, otp: code });
      if (data.needsName) {
        setSignupToken(data.signupToken);
        setStep('name');
        return;
      }

      await refresh();
      navigate(returnTo);
    } catch (err) {
      setError(err.message);
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
      verifyingRef.current = false;
    }
  }, [otp, isRegistered, validPhone, login, refresh, navigate, returnTo]);

  const submitName = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('نام و نام خانوادگی الزامی است.');
      return;
    }
    if (!signupToken) {
      setError('لطفاً ابتدا شماره را با کد تأیید کن.');
      setStep('phone');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({
        signupToken,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      navigate(returnTo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'otp' && otp.join('').length === 6) {
      verify();
    }
  }, [otp, step, verify]);

  const onOtpChange = (idx, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = v;
    setOtp(next);
    if (v && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const onOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const onOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(next);
  };

  const backToPhone = () => {
    setSignupToken('');
    setOtp(['', '', '', '', '', '']);
    setStep('phone');
  };

  return (
    <div className="auth-wrap">
      <aside className="auth-aside">
        <Link to="/" className="brand row gap-sm auth-brand">
          <span className="logo"><Icon name="car" /></span>
          <span>ری‌کار<small>اجاره خودرو</small></span>
        </Link>
        <div className="auth-aside-body">
          <h2>خودرویی که می‌خواهی، برای زمانی که می‌خواهی.</h2>
          <p>با شماره موبایل وارد شو. ثبت‌نام و ورود یکپارچه است.</p>
        </div>
        <div className="auth-car-art" aria-hidden="true">
          <svg viewBox="0 0 520 300" role="img">
            <defs>
              <linearGradient id="authCarBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                <stop offset="100%" stopColor="#d8f4e6" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="authCarGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e9fff3" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#9bd4b8" stopOpacity="0.65" />
              </linearGradient>
              <filter id="authCarShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="20" stdDeviation="22" floodColor="#062b1c" floodOpacity="0.28" />
              </filter>
            </defs>
            <path className="auth-road" d="M42 238C145 218 288 217 478 238" />
            <g filter="url(#authCarShadow)">
              <path className="auth-car-base" d="M78 187c5-31 29-53 60-56l48-5 47-48c15-15 35-23 56-23h75c25 0 48 13 61 34l31 51c26 7 43 25 48 51l5 28H75l3-32Z" />
              <path className="auth-car-window" d="M222 126l36-37c9-9 21-14 34-14h39v51H222Z" />
              <path className="auth-car-window" d="M349 75h17c15 0 29 8 37 21l19 30h-73V75Z" />
              <path className="auth-car-line" d="M151 157h272" />
              <path className="auth-car-light" d="M93 185h45" />
              <path className="auth-car-light" d="M447 185h39" />
              <circle className="auth-wheel" cx="162" cy="217" r="33" />
              <circle className="auth-wheel-inner" cx="162" cy="217" r="15" />
              <circle className="auth-wheel" cx="395" cy="217" r="33" />
              <circle className="auth-wheel-inner" cx="395" cy="217" r="15" />
            </g>
            <circle className="auth-orb orb-1" cx="108" cy="72" r="9" />
            <circle className="auth-orb orb-2" cx="456" cy="88" r="13" />
            <circle className="auth-orb orb-3" cx="414" cy="42" r="5" />
          </svg>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <Link to="/" className="back row muted small mb-16"><Icon name="arrowL" /> بازگشت</Link>

          {step === 'phone' && (
            <section className="card card-pad">
              <h1 className="auth-title">ورود یا ثبت‌نام</h1>
              <p className="muted small mb-24">شماره موبایلت را وارد کن؛ کد تأیید برایت ارسال می‌شود.</p>

              <div className="field mb-16">
                <label className="label">شماره موبایل <span className="req">*</span></label>
                <div className="input-group ltr">
                  <span className="addon">+۹۸</span>
                  <input
                    className={`input ${error && !validPhone ? 'error' : ''}`}
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                    placeholder="912 345 6789"
                    onKeyDown={(e) => e.key === 'Enter' && submitPhone()}
                  />
                </div>
                {error && <div className="error-text"><Icon name="alert" />{error}</div>}
                <div className="hint">مثال: ۹۱۲۳۴۵۶۷۸۹</div>
              </div>

              <button type="button" className={`btn btn-primary btn-lg btn-block ${loading ? 'loading' : ''}`} onClick={submitPhone}>
                دریافت کد تأیید
              </button>
            </section>
          )}

          {step === 'otp' && (
            <section className="card card-pad">
              <div className="row between mb-8">
                <h1 className="auth-title">تأیید شماره</h1>
                <button type="button" className="btn btn-ghost btn-sm" onClick={backToPhone}>ویرایش شماره</button>
              </div>
              <p className="muted small mb-16">
                کد ۶ رقمی ارسال‌شده به {formatPhoneDisplay(phone)} را وارد کن.
                {isRegistered && storedUsername && (
                  <> — سلام <span className="strong">{storedUsername}</span></>
                )}
              </p>
              <div className="otp mb-8" onPaste={onOtpPaste}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => onOtpChange(i, e.target.value)}
                    onKeyDown={(e) => onOtpKeyDown(i, e)}
                    disabled={loading}
                  />
                ))}
              </div>
              <p className="hint center-text" style={{ opacity: 0.45, fontSize: 12 }}>OTP: 111111</p>
              {error && <div className="error-text center-text otp-error"><Icon name="alert" />{error}</div>}
              {loading && (
                <p className="hint center-text mt-16">در حال بررسی…</p>
              )}
            </section>
          )}

          {step === 'name' && (
            <section className="card card-pad">
              <div className="row between mb-8">
                <h1 className="auth-title">اطلاعات شما</h1>
                <button type="button" className="btn btn-ghost btn-sm" onClick={backToPhone}>ویرایش شماره</button>
              </div>
              <p className="muted small mb-24">شماره {formatPhoneDisplay(phone)} تأیید شد. برای تکمیل ثبت‌نام، نام و نام خانوادگی را وارد کن.</p>

              <div className="field mb-16">
                <label className="label">نام <span className="req">*</span></label>
                <input
                  className={`input ${error && !firstName.trim() ? 'error' : ''}`}
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setError(''); }}
                  placeholder="مثلاً صبا"
                />
              </div>

              <div className="field mb-16">
                <label className="label">نام خانوادگی <span className="req">*</span></label>
                <input
                  className={`input ${error && !lastName.trim() ? 'error' : ''}`}
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setError(''); }}
                  placeholder="مثلاً احمدی"
                  onKeyDown={(e) => e.key === 'Enter' && submitName()}
                />
              </div>

              {error && <div className="error-text mb-16"><Icon name="alert" />{error}</div>}

              <button type="button" className={`btn btn-primary btn-lg btn-block ${loading ? 'loading' : ''}`} onClick={submitName}>
                ورود به اپ
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
