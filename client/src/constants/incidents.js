export const INCIDENT_TYPES = {
  accident: { key: 'accident', label: 'تصادف', icon: 'carCrash', urgent: true },
  breakdown: { key: 'breakdown', label: 'خرابی خودرو', icon: 'wrench', urgent: true },
  damage: { key: 'damage', label: 'خسارت', icon: 'warning', urgent: false },
  fine: { key: 'fine', label: 'جریمه', icon: 'fine', urgent: false },
  coverage: { key: 'coverage', label: 'مسئله پوشش/بیمه', icon: 'coverage', urgent: false },
  early: { key: 'early', label: 'بازگشت زودهنگام', icon: 'earlyReturn', urgent: false },
  late: { key: 'late', label: 'بازگشت دیرهنگام', icon: 'lateReturn', urgent: false },
  userrepair: { key: 'userrepair', label: 'تعمیر توسط کاربر', icon: 'userRepair', urgent: false },
  abnormal: { key: 'abnormal', label: 'وضعیت غیرعادی بازگشت', icon: 'flag', urgent: false },
};

export const INCIDENT_STATUSES = {
  submitted: { key: 'submitted', label: 'ثبت‌شده', badge: 'badge-submitted' },
  under_review: { key: 'under_review', label: 'در حال بررسی', badge: 'badge-under-review' },
  action_required: { key: 'action_required', label: 'نیاز به اقدام کاربر', badge: 'badge-action-req' },
  in_progress: { key: 'in_progress', label: 'در حال پیگیری', badge: 'badge-in-progress' },
  awaiting_decision: { key: 'awaiting_decision', label: 'در انتظار تصمیم', badge: 'badge-await-decision' },
  resolved: { key: 'resolved', label: 'رسیدگی‌شده', badge: 'badge-resolved' },
  settled: { key: 'settled', label: 'تسویه‌شده', badge: 'badge-settled' },
  closed: { key: 'closed', label: 'بسته‌شده', badge: 'badge-closed' },
};

export const COVERAGE_TYPES = {
  none: { key: 'none', label: 'بدون پوشش', price: 0 },
  basic: { key: 'basic', label: 'پوشش پایه', price: 150_000 },
  comprehensive: { key: 'comprehensive', label: 'پوشش جامع', price: 350_000 },
};

export const LIFECYCLE_STEPS = ['submitted', 'under_review', 'in_progress', 'resolved', 'settled'];

export function statusLabel(key) {
  return INCIDENT_STATUSES[key]?.label || key;
}

export function typeLabel(key) {
  return INCIDENT_TYPES[key]?.label || key;
}

export function coverageLabel(key) {
  return COVERAGE_TYPES[key]?.label || key;
}
