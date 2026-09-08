export const INCIDENT_TYPES = {
  accident: { key: 'accident', label: 'تصادف', urgent: true },
  breakdown: { key: 'breakdown', label: 'خرابی خودرو', urgent: true },
  damage: { key: 'damage', label: 'خسارت', urgent: false },
  fine: { key: 'fine', label: 'جریمه', urgent: false },
  coverage: { key: 'coverage', label: 'مسئله پوشش/بیمه', urgent: false },
  early: { key: 'early', label: 'بازگشت زودهنگام', urgent: false },
  late: { key: 'late', label: 'بازگشت دیرهنگام', urgent: false },
  userrepair: { key: 'userrepair', label: 'تعمیر توسط کاربر', urgent: false },
  abnormal: { key: 'abnormal', label: 'وضعیت غیرعادی بازگشت', urgent: false },
};

export const INCIDENT_STATUSES = {
  submitted: { key: 'submitted', label: 'ثبت‌شده', step: 0 },
  under_review: { key: 'under_review', label: 'در حال بررسی', step: 1 },
  action_required: { key: 'action_required', label: 'نیاز به اقدام کاربر', step: 1 },
  in_progress: { key: 'in_progress', label: 'در حال پیگیری', step: 2 },
  awaiting_decision: { key: 'awaiting_decision', label: 'در انتظار تصمیم', step: 2 },
  resolved: { key: 'resolved', label: 'رسیدگی‌شده', step: 3 },
  settled: { key: 'settled', label: 'تسویه‌شده', step: 4 },
  closed: { key: 'closed', label: 'بسته‌شده', step: 4 },
};

export const COVERAGE_TYPES = {
  none: { key: 'none', label: 'بدون پوشش', price: 0 },
  basic: { key: 'basic', label: 'پوشش پایه', price: 150_000 },
  comprehensive: { key: 'comprehensive', label: 'پوشش جامع', price: 350_000 },
};

export const VALID_TRANSITIONS = {
  submitted: ['under_review', 'action_required', 'closed'],
  under_review: ['action_required', 'in_progress', 'awaiting_decision', 'resolved', 'closed'],
  action_required: ['under_review', 'in_progress', 'closed'],
  in_progress: ['awaiting_decision', 'resolved', 'action_required'],
  awaiting_decision: ['resolved', 'in_progress', 'action_required'],
  resolved: ['settled', 'closed', 'in_progress'],
  settled: ['closed'],
  closed: [],
};

export function coveragePrice(type) {
  return COVERAGE_TYPES[type]?.price ?? 0;
}

export function isValidIncidentType(type) {
  return Boolean(INCIDENT_TYPES[type]);
}

export function isValidIncidentStatus(status) {
  return Boolean(INCIDENT_STATUSES[status]);
}

export function isValidCoverageType(type) {
  return Boolean(COVERAGE_TYPES[type]);
}

export function canTransition(from, to) {
  if (from === to) return true;
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function formatIncidentCode(id) {
  return `INC-${String(id).padStart(5, '0')}`;
}
