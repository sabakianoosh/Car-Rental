const ICONS = {
  car: '<path d="M5 13l1.5-4.5A2 2 0 018.4 7h7.2a2 2 0 011.9 1.5L19 13m-14 0h14m-14 0v4m14-4v4M7 17h.01M17 17h.01"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v3M16 3v3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4l3 2"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  alert: '<path d="M12 3l9.5 16.5H2.5L12 3z"/><path d="M12 10v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  upload: '<path d="M12 15V4M8 8l4-4 4 4M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3"/>',
  receipt: '<path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3 5 4.5z"/>',
  location: '<path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  phone: '<path d="M4 5c0 8 7 15 15 15l2-3-4-2-2 2c-3-1.5-5.5-4-7-7l2-2-2-4-3 2z"/>',
  chevronL: '<path d="M15 6l-6 6 6 6"/>',
  chevronR: '<path d="M9 6l6 6-6 6"/>',
  arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M17 4l2 2M14 7l2 2"/>',
  fuel: '<path d="M5 21V5a2 2 0 012-2h5a2 2 0 012 2v16M4 21h11M14 8h2a2 2 0 012 2v6a1.5 1.5 0 003 0V9l-2.5-2.5"/>',
  gauge: '<path d="M12 13l4-4"/><circle cx="12" cy="13" r="8"/><path d="M4 13a8 8 0 0116 0"/>',
  transmission: '<circle cx="7" cy="7" r="2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="7" r="2"/><path d="M7 9v6M7 7h10M17 9v-.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4l10-10-4-4L4 16v4z"/>',
  logout: '<path d="M10 5H6a2 2 0 00-2 2v10a2 2 0 002 2h4M16 15l3-3-3-3M9 12h10"/>',
  incident: '<path d="M12 9v4M12 16h.01"/><path d="M5.07 19H19a2 2 0 001.75-2.96L13.75 4a2 2 0 00-3.5 0l-7 12.04A2 2 0 005.07 19z"/>',
  ambulance: '<rect x="3" y="11" width="18" height="9" rx="2"/><path d="M3 13h1a3 3 0 013 3v1H3m15 0h-1a3 3 0 01-3-3v-1h4M10 7h4M12 5v4"/><circle cx="7" cy="20" r="1"/><circle cx="17" cy="20" r="1"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>',
  fine: '<path d="M4 20h16M6 4h12l2 4-7 12-7-12L6 4zM9 4l3 16M15 4l-3 16"/>',
  coverage: '<path d="M12 3l8 3.5v5c0 4.5-3 8-8 10-5-2-8-5.5-8-10V6.5L12 3z"/>',
  earlyReturn: '<path d="M19 12H5M11 18l-6-6 6-6"/><path d="M21 18v-1a4 4 0 00-4-4h-1"/>',
  lateReturn: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  userRepair: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/><path d="M2 22l3-3"/>',
  warning: '<path d="M12 9v4M12 16h.01"/><path d="M5.07 19H19a2 2 0 001.75-2.96L13.75 4a2 2 0 00-3.5 0l-7 12.04A2 2 0 005.07 19z"/>',
  carCrash: '<path d="M5 13l1.5-4.5A2 2 0 018.4 7h7.2a2 2 0 011.9 1.5L19 13m-14 0h14m-14 0v4m14-4v4M7 17h.01M17 17h.01"/><path d="M2 9l3-3M22 9l-3-3"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
  camera: '<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>',
  money: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5h4.5a1.5 1.5 0 010 3H10a1.5 1.5 0 000 3H15"/>',
  xCircle: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
};

export function Icon({ name, className = '' }) {
  const path = ICONS[name] || '';
  return (
    <svg
      className={`ic ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}
