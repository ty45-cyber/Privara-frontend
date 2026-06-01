const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function token() {
  return localStorage.getItem('privara_token')
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/api/auth/login',    { method: 'POST', body: JSON.stringify(body) }),

  payroll: {
    list:   ()    => request('/api/payroll'),
    create: (body)=> request('/api/payroll', { method: 'POST', body: JSON.stringify(body) }),
    audit:  (id)  => request(`/api/payroll/${id}/audit`, { method: 'POST' }),
  },

  governance: {
    list:   ()    => request('/api/governance/proposals'),
    create: (body)=> request('/api/governance/proposals', { method: 'POST', body: JSON.stringify(body) }),
    vote:   (body)=> request('/api/governance/vote', { method: 'POST', body: JSON.stringify(body) }),
  },

  blockchain: {
    network:  ()      => request('/api/blockchain/network'),
    verifyTx: (txHash)=> request('/api/blockchain/verify-tx', {
      method: 'POST',
      body: JSON.stringify({ tx_hash: txHash }),
    }),
    balance: (address) => request(`/api/blockchain/balance?address=${address}`),
  },

  audit: {
    generateReport: () => request('/api/audit/report', { method: 'POST' }),
    listReports:    () => request('/api/audit/reports'),
  },
}