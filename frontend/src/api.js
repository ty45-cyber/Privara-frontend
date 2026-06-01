// Set VITE_MOCK=true in .env to use mock API (no backend needed)
// Set VITE_MOCK=false and VITE_API_URL=https://... for live backend

import { api as mockApi } from './mock/mockApi.js'

const USE_MOCK = import.meta.env.VITE_MOCK === 'true'
  || !import.meta.env.VITE_API_URL

if (USE_MOCK) {
  console.info('[Privara] Running in MOCK mode — no backend required')
}

const BASE = import.meta.env.VITE_API_URL || ''

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

export const api = USE_MOCK ? mockApi : {
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

  audit: {
    generateReport: () => request('/api/audit/report', { method: 'POST' }),
    listReports:    () => request('/api/audit/reports'),
  },

  intents: {
    create: (body)=> request('/api/intents', { method: 'POST', body: JSON.stringify(body) }),
    list:   ()    => request('/api/intents'),
  },

  blockchain: {
    network:  ()      => request('/api/blockchain/network'),
    verifyTx: (hash)  => request('/api/blockchain/verify-tx', {
      method: 'POST', body: JSON.stringify({ tx_hash: hash }),
    }),
    balance: (address) => request(`/api/blockchain/balance?address=${address}`),
  },
}