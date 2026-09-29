// Cliente de la API. La sesión viaja en una cookie httpOnly + SameSite=Strict
// que JavaScript no puede leer, así que un XSS no podría robar el token.

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

async function request(method, url, body) {
  const options = { method, credentials: 'same-origin', headers: { Accept: 'application/json' } };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new ApiError(res.status, data.error?.message || 'Ocurrió un error inesperado', data.error?.details);
    if (res.status === 401 && !url.startsWith('/api/auth/')) onUnauthorized(err);
    throw err;
  }
  return data;
}

const qs = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return clean.length ? `?${new URLSearchParams(clean)}` : '';
};

export const api = {
  me: () => request('GET', '/api/auth/me'),
  login: (email, password) => request('POST', '/api/auth/login', { email, password }),
  register: (payload) => request('POST', '/api/auth/register', payload),
  logout: () => request('POST', '/api/auth/logout'),

  publicStats: () => request('GET', '/api/stats/public'),
  stats: () => request('GET', '/api/stats'),

  donations: (filters) => request('GET', `/api/donations${qs(filters)}`),
  createDonation: (payload) => request('POST', '/api/donations', payload),
  cancelDonation: (id) => request('PATCH', `/api/donations/${encodeURIComponent(id)}/cancel`),

  requests: (filters) => request('GET', `/api/requests${qs(filters)}`),
  createRequest: (donationId, message) => request('POST', '/api/requests', { donationId, message }),
  cancelRequest: (id) => request('PATCH', `/api/requests/${encodeURIComponent(id)}/cancel`),
  approveRequest: (id) => request('PATCH', `/api/requests/${encodeURIComponent(id)}/approve`),
  rejectRequest: (id, reason) => request('PATCH', `/api/requests/${encodeURIComponent(id)}/reject`, { reason }),
  revokeRequest: (id, reason) => request('PATCH', `/api/requests/${encodeURIComponent(id)}/revoke`, { reason }),
  confirmRequest: (id) => request('PATCH', `/api/requests/${encodeURIComponent(id)}/confirm`),

  users: (filters) => request('GET', `/api/admin/users${qs(filters)}`),
  setUserStatus: (id, status) => request('PATCH', `/api/admin/users/${encodeURIComponent(id)}/status`, { status }),
  audit: () => request('GET', '/api/admin/audit'),
};
