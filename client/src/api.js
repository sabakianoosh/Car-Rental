const API = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: options.body instanceof FormData
      ? options.headers
      : { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body instanceof FormData
      ? options.body
      : options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'خطایی رخ داد');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  sendOtp: (phone) => request('/auth/send-otp', { method: 'POST', body: { phone } }),
  verifyOtp: (payload) => request('/auth/verify-otp', { method: 'POST', body: payload }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  getVehicles: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return request(`/rentals/vehicles${q ? `?${q}` : ''}`);
  },
  getVehicle: (id, params) => {
    const q = new URLSearchParams(params || {}).toString();
    return request(`/rentals/vehicles/${id}${q ? `?${q}` : ''}`);
  },
  quote: (payload) => request('/rentals/quote', { method: 'POST', body: payload }),
  validateRental: (payload) => request('/rentals/validate', { method: 'POST', body: payload }),
  createHold: (payload) => request('/rentals/hold', { method: 'POST', body: payload }),
  getMyRentals: () => request('/rentals/mine'),
  getRental: (id) => request(`/rentals/${id}`),
  confirmRental: (id) => request(`/rentals/${id}/confirm`, { method: 'POST' }),
  payRental: (id, success) => request(`/rentals/${id}/pay`, { method: 'POST', body: { success } }),

  kycStatus: () => request('/kyc/status'),
  uploadKyc: (file) => {
    const fd = new FormData();
    fd.append('license', file);
    return request('/kyc/upload', { method: 'POST', body: fd });
  },

  adminLogin: (username, password) => request('/admin/login', { method: 'POST', body: { username, password } }),
  adminLogout: () => request('/admin/logout', { method: 'POST' }),
  adminMe: () => request('/admin/me'),
  adminDashboard: () => request('/admin/dashboard'),
  adminVehicles: () => request('/admin/vehicles'),
  adminCreateVehicle: (payload) => request('/admin/vehicles', { method: 'POST', body: payload }),
  adminUpdateVehicle: (id, payload) => request(`/admin/vehicles/${id}`, { method: 'PUT', body: payload }),
  adminUploadVehicleImage: (id, file) => {
    const fd = new FormData();
    fd.append('image', file);
    return request(`/admin/vehicles/${id}/image`, { method: 'POST', body: fd });
  },
  adminKyc: () => request('/admin/kyc'),
  adminReviewKyc: (userId, payload) => request(`/admin/kyc/${userId}/review`, { method: 'POST', body: payload }),
  adminRentals: () => request('/admin/rentals'),
  adminSearchBranch: (code) => request(`/admin/branch/search?code=${encodeURIComponent(code)}`),
  adminDeliver: (id) => request(`/admin/branch/${id}/deliver`, { method: 'POST' }),
  adminReturn: (id) => request(`/admin/branch/${id}/return`, { method: 'POST' }),
  adminIncidents: () => request('/admin/incidents'),
  adminIncidentsMeta: () => request('/admin/incidents/meta'),
  adminIncident: (id) => request(`/admin/incidents/${id}`),
  adminCreateIncident: (payload) => request('/admin/incidents', { method: 'POST', body: payload }),
  adminUpdateIncident: (id, payload) => request(`/admin/incidents/${id}`, { method: 'PATCH', body: payload }),
  adminAddIncidentCharge: (id, payload) => request(`/admin/incidents/${id}/charges`, { method: 'POST', body: payload }),
  adminAddIncidentDecision: (id, payload) => request(`/admin/incidents/${id}/decisions`, { method: 'POST', body: payload }),
  adminReturnRental: (id, payload) => request(`/admin/branch/${id}/return`, { method: 'POST', body: payload }),

  getActiveRental: () => request('/incidents/active-rental'),
  getMyIncidents: () => request('/incidents/mine'),
  getIncident: (id) => request(`/incidents/${id}`),
  createIncident: (payload) => request('/incidents', { method: 'POST', body: payload }),
  uploadIncidentPhotos: (id, files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('photos', f));
    return request(`/incidents/${id}/attachments`, { method: 'POST', body: fd });
  },
  updateRentalCoverage: (id, coverageType) => request(`/rentals/${id}/coverage`, { method: 'PATCH', body: { coverageType } }),
};
