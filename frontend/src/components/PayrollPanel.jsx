import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import styles from './Panel.module.css'

export default function PayrollPanel() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    contractor_name: '',
    amount: '',
    currency: 'USDC',
    wallet_address: '',
  })
  const [error, setError] = useState(null)
  const [auditMsg, setAuditMsg] = useState({})

  const load = useCallback(async () => {
    try {
      const data = await api.payroll.list()
      setEntries(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function create() {
    setError(null)
    setCreating(true)
    try {
      await api.payroll.create({ ...form, amount: parseFloat(form.amount) })
      setForm({ contractor_name: '', amount: '', currency: 'USDC', wallet_address: '' })
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  async function audit(id) {
    try {
      const data = await api.payroll.audit(id)
      setAuditMsg((m) => ({ ...m, [id]: data.audit_token }))
    } catch (e) {
      setAuditMsg((m) => ({ ...m, [id]: `Error: ${e.message}` }))
    }
  }

  return (
    <div className={styles.panel}>
      {/* Create form */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>New Encrypted Payout</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Contractor Name</label>
            <input
              type="text"
              placeholder="Jane Doe"
              value={form.contractor_name}
              onChange={update('contractor_name')}
            />
          </div>
          <div className={styles.field}>
            <label>Currency</label>
            <select value={form.currency} onChange={update('currency')}>
              <option>USDC</option>
              <option>USDT</option>
              <option>ETH</option>
              <option>KES</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Amount</label>
            <input
              type="number"
              placeholder="5000.00"
              value={form.amount}
              onChange={update('amount')}
            />
          </div>
          <div className={styles.field}>
            <label>Wallet Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={form.wallet_address}
              onChange={update('wallet_address')}
            />
          </div>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.btn} onClick={create} disabled={creating}>
          {creating ? 'Encrypting...' : 'Create Encrypted Entry'}
        </button>
      </div>

      {/* Entries table */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Encrypted Payroll Ledger</h3>
        {loading ? (
          <p className={styles.hint}>Loading encrypted records...</p>
        ) : entries.length === 0 ? (
          <p className={styles.hint}>No payroll entries yet.</p>
        ) : (
          <div className={styles.table}>
            <div className={styles.thead}>
              <span>Contractor</span>
              <span>Amount</span>
              <span>Status</span>
              <span>ZK Commitment</span>
              <span>Action</span>
            </div>
            {entries.map((e) => (
              <div className={styles.trow} key={e.id}>
                <span>{e.contractor_name}</span>
                <span className={styles.amount}>
                  {e.amount.toLocaleString()} {e.currency}
                </span>
                <span>
                  <span className={styles[`status_${e.status}`]}>{e.status}</span>
                </span>
                <span className={styles.commit}>
                  {e.zk_commitment.slice(0, 16)}...
                </span>
                <span>
                  {auditMsg[e.id] ? (
                    <span className={styles.auditToken}>{auditMsg[e.id].slice(0, 12)}…</span>
                  ) : (
                    <button className={styles.btnSmall} onClick={() => audit(e.id)}>
                      Audit
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}