import { useState } from 'react'
import PayrollPanel from '../components/PayrollPanel'
import GovernancePanel from '../components/GovernancePanel'
import FhenixPanel from '../components/FhenixPanel'
import PrivacyStageBar from '../components/PrivacyStageBar'
import ProofOfPrivacy from '../components/ProofOfPrivacy'
import styles from './Dashboard.module.css'

const TABS = [
  { id: 'payroll',    label: 'Treasury & Payroll' },
  { id: 'governance', label: 'Private Governance' },
  { id: 'fhenix',     label: 'On-Chain FHE' },
]

const PAYROLL_ADDRESS    = import.meta.env.VITE_PAYROLL_ADDRESS    || ''
const GOVERNANCE_ADDRESS = import.meta.env.VITE_GOVERNANCE_ADDRESS || ''

export default function Dashboard({ onLogout }) {
  const [active, setActive] = useState('payroll')

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sideTop}>
          <div className={styles.logo}>
            <span>⬡</span>
            <span>Privara</span>
          </div>
          <div className={styles.status}>
            <span className={styles.dot} />
            Encrypted session
          </div>
        </div>

        <nav className={styles.nav}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={active === t.id ? styles.navActive : styles.navItem}
              onClick={() => setActive(t.id)}
            >
              {t.id === 'fhenix' ? `⬡ ${t.label}` : t.label}
            </button>
          ))}
        </nav>

        <div className={styles.sideFooter}>
          <div className={styles.stageChip}>Stage 3 — FHE</div>
          <button className={styles.logout} onClick={onLogout}>
            End Session
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.topbar}>
          <h2 className={styles.pageTitle}>
            {TABS.find((t) => t.id === active)?.label}
          </h2>
          <div className={styles.badge}>
            <span className={styles.dot} />
            {active === 'fhenix' ? 'CoFHE Active' : 'AES-256-GCM Active'}
          </div>
        </div>

        <div className={styles.content}>
          {active === 'payroll' && <PayrollPanel />}
          {active === 'governance' && <GovernancePanel />}
          {active === 'fhenix' && (
            <>
              <PrivacyStageBar />
              <div style={{ marginTop: '1.5rem' }}>
                <FhenixPanel
                  payrollAddress={PAYROLL_ADDRESS}
                  governanceAddress={GOVERNANCE_ADDRESS}
                />
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <ProofOfPrivacy />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}