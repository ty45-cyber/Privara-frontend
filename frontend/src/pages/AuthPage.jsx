import { useState } from 'react'
import { api } from '../api'
import styles from './AuthPage.module.css'

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login') // login | register
  const [form, setForm] = useState({ email: '', password: '', org_name: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function submit() {
    setError(null)
    setLoading(true)
    try {
      const fn = mode === 'login' ? api.login : api.register
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : form
      const data = await fn(body)
      onAuth(data.token)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <span className={styles.logo}>⬡</span>
        <h1>Privara</h1>
        <p>Confidential infrastructure for organizations</p>
      </div>

      <div className={styles.card}>
        <div className={styles.tabs}>
          <button
            className={mode === 'login' ? styles.activeTab : styles.tab}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={mode === 'register' ? styles.activeTab : styles.tab}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        {mode === 'register' && (
          <div className={styles.field}>
            <label>Organization Name</label>
            <input
              type="text"
              placeholder="Acme DAO"
              value={form.org_name}
              onChange={update('org_name')}
            />
          </div>
        )}

        <div className={styles.field}>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@org.xyz"
            value={form.email}
            onChange={update('email')}
          />
        </div>

        <div className={styles.field}>
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••••••"
            value={form.password}
            onChange={update('password')}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.submit}
          onClick={submit}
          disabled={loading}
        >
          {loading ? 'Authenticating...' : mode === 'login' ? 'Enter Vault' : 'Create Vault'}
        </button>

        <p className={styles.hint}>
          AES-256-GCM encrypted · ZK commitment layer · JWT session
        </p>
      </div>
    </div>
  )
}