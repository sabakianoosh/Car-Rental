const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toFa(n) {
  return String(n).replace(/[0-9]/g, (d) => faDigits[+d]);
}

export function toman(n) {
  return `${toFa(Number(n).toLocaleString('en-US'))} تومان`;
}

export function fa(n) {
  return toFa(Number(n).toLocaleString('en-US'));
}

export function statusLabel(status) {
  const map = {
    hold: 'Hold فعال',
    pending_payment: 'در انتظار پرداخت',
    paid: 'پرداخت‌شده / آماده تحویل',
    delivered: 'تحویل‌شده / در حال اجاره',
    completed: 'پایان‌یافته',
    expired_hold: 'Hold منقضی',
    payment_review: 'نیازمند بررسی',
    draft: 'پیش‌نویس',
  };
  return map[status] || status;
}

export function kycLabel(status) {
  const map = {
    not_submitted: 'ارسال‌نشده',
    pending: 'در انتظار بررسی',
    approved: 'تأییدشده',
    rejected: 'ردشده',
  };
  return map[status] || status;
}

export function badgeClass(status) {
  const map = {
    hold: 'badge-warn',
    pending_payment: 'badge-info',
    paid: 'badge-branch',
    delivered: 'badge-green',
    completed: 'badge-muted',
    expired_hold: 'badge-danger',
    not_submitted: 'badge-muted',
    pending: 'badge-warn',
    approved: 'badge-green',
    rejected: 'badge-danger',
  };
  return map[status] || 'badge-muted';
}

export function vehicleImageUrl(filename) {
  if (!filename) return null;
  if (filename.startsWith('/') || filename.startsWith('http')) return filename;
  const name = filename.includes('/') ? filename.split('/').pop() : filename;
  return `/api/uploads/${name}`;
}

export function validatePhoneInput(value) {
  const cleaned = String(value || '').replace(/\D/g, '');
  if (/^9\d{9}$/.test(cleaned)) return cleaned;
  return null;
}

export function formatPhoneDisplay(phone) {
  const p = String(phone || '').replace(/^0/, '');
  return toFa(`0${p.slice(0, 3)} ••• ${p.slice(-4)}`);
}

export const RENT_PURPOSES = [
  'سفر و گردشگری',
  'کار و جلسات',
  'جابه‌جایی خانوادگی',
  'امور اداری',
  'سایر',
];

export const BRANCH_INFO = {
  name: 'شعبه مرکزی تهران',
  address: 'تهران، خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۱۲۳۴',
  phone: '۰۲۱-۸۸۷۷۶۶۵۵',
  hours: 'شنبه تا پنج‌شنبه ۸:۰۰–۲۰:۰۰',
};
