// Realistic mock API — simulates network delays, encrypted fields,
// ZK commitments, and blockchain tx hashes.
// Drop-in replacement for api.js when backend is unavailable.

const delay = (ms) => new Promise(r => setTimeout(r, ms))

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function txHash() {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join('')
}

function zkCommit() {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join('')
}

function merkleRoot() { return zkCommit() }

// ── In-memory state ──────────────────────────────────────────────────────────
const state = {
  token: null,
  user_id: uuid(),
  org_id:  uuid(),

  payroll: [
    {
      id:              uuid(),
      contractor_name: 'Alice Wanjiku',
      amount:          5000.00,
      currency:        'USDC',
      wallet_address:  '0xAbCd...1234',
      status:          'processed',
      zk_commitment:   zkCommit(),
      has_audit_token: true,
    },
    {
      id:              uuid(),
      contractor_name: 'Brian Omondi',
      amount:          3200.00,
      currency:        'USDT',
      wallet_address:  '0xEf01...5678',
      status:          'pending',
      zk_commitment:   zkCommit(),
      has_audit_token: false,
    },
    {
      id:              uuid(),
      contractor_name: 'Carol Muthoni',
      amount:          7500.00,
      currency:        'ETH',
      wallet_address:  '0x9012...9abc',
      status:          'audited',
      zk_commitment:   zkCommit(),
      has_audit_token: true,
    },
  ],

  proposals: [
    {
      id:          uuid(),
      title:       'Allocate 50,000 USDC to dev fund',
      description: 'Fund Q3 development milestones for the Privara protocol.',
      quorum:      3,
      status:      'active',
      ends_at:     new Date(Date.now() + 86400000 * 2).toISOString(),
      vote_count:  4,
    },
    {
      id:          uuid(),
      title:       'Approve PrivaraUSD (pUSD) token launch',
      description: 'Ratify the FHERC20 settlement token for mainnet deployment.',
      quorum:      5,
      status:      'active',
      ends_at:     new Date(Date.now() + 86400000 * 5).toISOString(),
      vote_count:  2,
    },
    {
      id:          uuid(),
      title:       'Expand auditor access to Wave 2 contributors',
      description: 'Grant auditor role to three additional Wave 2 builders.',
      quorum:      2,
      status:      'passed',
      ends_at:     new Date(Date.now() - 86400000).toISOString(),
      vote_count:  6,
    },
  ],

  auditReports: [],

  intents: [
    {
      id:              uuid(),
      payee_address:   '0xAbCd...1234',
      currency:        'USDC',
      on_chain_id:     3,
      status:          'pending',
      process_deadline: new Date(Date.now() + 3600000).toISOString(),
      created_at:      new Date().toISOString(),
    },
  ],

  onchainTxs: [
    {
      tx_hash:      txHash(),
      label:        'FHE Payroll Entry',
      status:       'success',
      explorer_url: 'https://sepolia.arbiscan.io/tx/0xabc123',
      created_at:   new Date(Date.now() - 120000).toISOString(),
    },
    {
      tx_hash:      txHash(),
      label:        'FHE Vote — proposal 0',
      status:       'success',
      explorer_url: 'https://sepolia.arbiscan.io/tx/0xdef456',
      created_at:   new Date(Date.now() - 60000).toISOString(),
    },
  ],
}

// ── Auth ─────────────────────────────────────────────────────────────────────
async function register({ org_name, email, password }) {
  await delay(900)
  if (!org_name || !email || password.length < 12)
    throw new Error('Password must be at least 12 characters')
  state.token = 'mock_jwt_' + uuid()
  return { token: state.token, user_id: state.user_id, org_id: state.org_id }
}

async function login({ email, password }) {
  await delay(700)
  if (!email || !password)
    throw new Error('Authentication failed')
  state.token = 'mock_jwt_' + uuid()
  return { token: state.token, user_id: state.user_id, org_id: state.org_id }
}

// ── Payroll ───────────────────────────────────────────────────────────────────
async function payrollList() {
  await delay(500)
  return [...state.payroll]
}

async function payrollCreate({ contractor_name, amount, currency, wallet_address }) {
  await delay(1200)
  if (!contractor_name) throw new Error('Contractor name is required')
  if (amount <= 0) throw new Error('Amount must be positive')
  const entry = {
    id:              uuid(),
    contractor_name,
    amount:          parseFloat(amount),
    currency,
    wallet_address,
    status:          'pending',
    zk_commitment:   zkCommit(),
    has_audit_token: false,
  }
  state.payroll.unshift(entry)
  return { id: entry.id, zk_commitment: entry.zk_commitment }
}

async function payrollAudit(id) {
  await delay(800)
  const entry = state.payroll.find(e => e.id === id)
  if (!entry) throw new Error('Entry not found')
  entry.status = 'audited'
  entry.has_audit_token = true
  return { audit_token: uuid() }
}

// ── Governance ────────────────────────────────────────────────────────────────
async function proposalList() {
  await delay(500)
  return [...state.proposals]
}

async function proposalCreate({ title, description, quorum, duration_hours }) {
  await delay(1000)
  if (!title.trim()) throw new Error('Title is required')
  const proposal = {
    id:          uuid(),
    title,
    description,
    quorum:      parseInt(quorum),
    status:      'active',
    ends_at:     new Date(Date.now() + duration_hours * 3600000).toISOString(),
    vote_count:  0,
  }
  state.proposals.unshift(proposal)
  return { proposal_id: proposal.id }
}

async function vote({ proposal_id, vote }) {
  await delay(1400)
  const p = state.proposals.find(p => p.id === proposal_id)
  if (!p) throw new Error('Proposal not found')
  if (p.status !== 'active') throw new Error('Proposal is no longer active')
  p.vote_count += 1
  if (p.vote_count >= p.quorum) p.status = 'passed'
  return { status: 'vote_recorded' }
}

// ── Audit ─────────────────────────────────────────────────────────────────────
async function generateReport() {
  await delay(1800)
  const usdc  = state.payroll.filter(e => e.currency === 'USDC').length
  const usdt  = state.payroll.filter(e => e.currency === 'USDT').length
  const eth   = state.payroll.filter(e => e.currency === 'ETH').length
  const report = {
    report_id:        uuid(),
    org_id:           state.org_id,
    generated_at:     new Date().toISOString(),
    entry_count:      state.payroll.length,
    currency_split:   { usdc, usdt, eth, other: 0 },
    merkle_root:      merkleRoot(),
    report_signature: zkCommit(),
    privacy_note:
      'This report contains aggregate statistics only. Individual payroll ' +
      'amounts and contractor identities are encrypted under AES-256-GCM ' +
      'off-chain and euint128 FHE on-chain. No individual record is ' +
      'included in or derivable from this report. Selective transparency ' +
      'pattern per Fhenix CCS 2025.',
  }
  state.auditReports.unshift({
    id:           report.report_id,
    entry_count:  report.entry_count,
    merkle_root:  report.merkle_root,
    generated_at: report.generated_at,
  })
  return report
}

async function listReports() {
  await delay(400)
  return { reports: [...state.auditReports] }
}

// ── Intents ───────────────────────────────────────────────────────────────────
async function createIntent({ payee_address, currency, deadline_seconds }) {
  await delay(900)
  const intent = {
    id:              uuid(),
    payee_address,
    currency,
    on_chain_id:     state.intents.length,
    status:          'pending',
    process_deadline: new Date(Date.now() + deadline_seconds * 1000).toISOString(),
    created_at:      new Date().toISOString(),
  }
  state.intents.unshift(intent)
  return { intent_id: intent.id, status: 'pending', deadline: intent.process_deadline }
}

async function listIntents() {
  await delay(400)
  return { intents: [...state.intents], count: state.intents.length }
}

// ── Blockchain ────────────────────────────────────────────────────────────────
async function networkStatus() {
  await delay(300)
  return {
    chain_id:     421614,
    rpc_url:      'https://sepolia-rollup.arbitrum.io/rpc',
    explorer_url: 'https://sepolia.arbiscan.io',
    latest_block: 198432710 + Math.floor(Math.random() * 100),
    network:      'Fhenix CoFHE / Arbitrum Sepolia',
    status:       'online',
  }
}

async function verifyTx(tx_hash) {
  await delay(1500)
  const record = {
    tx_hash,
    success:      true,
    explorer_url: `https://sepolia.arbiscan.io/tx/${tx_hash}`,
  }
  state.onchainTxs.unshift({
    ...record,
    label:      'Verified Tx',
    status:     'success',
    created_at: new Date().toISOString(),
  })
  return record
}

async function walletBalance(address) {
  await delay(400)
  return { address, balance: '0.042180 ETH', network: 'Arbitrum Sepolia' }
}

// ── Mock FHE operations ───────────────────────────────────────────────────────
// Simulates cofhejs encrypt + on-chain tx submission
export async function mockFhePayroll({ payee, amount, currency }) {
  await delay(800)  // simulate cofhejs encrypt
  await delay(1200) // simulate tx mine time
  const hash = txHash()
  state.onchainTxs.unshift({
    tx_hash:      hash,
    label:        `FHE Payroll Entry — ${currency}`,
    status:       'success',
    explorer_url: `https://sepolia.arbiscan.io/tx/${hash}`,
    created_at:   new Date().toISOString(),
  })
  return hash
}

export async function mockFheVote({ proposalId, vote }) {
  await delay(800)
  await delay(1000)
  const hash = txHash()
  state.onchainTxs.unshift({
    tx_hash:      hash,
    label:        `FHE Vote (${vote}) — proposal ${proposalId}`,
    status:       'success',
    explorer_url: `https://sepolia.arbiscan.io/tx/${hash}`,
    created_at:   new Date().toISOString(),
  })
  return hash
}

export function getMockTxLog() {
  return [...state.onchainTxs]
}

export function getMockWallet() {
  return '0xBr4n...K1su'
}

// ── Export as drop-in api shape ───────────────────────────────────────────────
export const api = {
  register,
  login,
  payroll: {
    list:   payrollList,
    create: payrollCreate,
    audit:  payrollAudit,
  },
  governance: {
    list:   proposalList,
    create: proposalCreate,
    vote,
  },
  audit: {
    generateReport,
    listReports,
  },
  intents: {
    create: createIntent,
    list:   listIntents,
  },
  blockchain: {
    network:  networkStatus,
    verifyTx: (hash) => verifyTx(hash),
    balance:  (addr) => walletBalance(addr),
  },
}