import { useState, useEffect } from 'react'
import {
  connectCofhe,
  encryptPayrollAmount,
  encryptVote,
  submitFhePayroll,
  submitFheVote,
  explorerUrl,
} from '../fhenix'
import { api } from '../api'
import { getMockTxLog, getMockWallet } from '../mock/mockApi.js'
import styles  from './Panel.module.css'
import fxStyles from './FhenixPanel.module.css'

const CURRENCY_CODES = { USDC: 0, USDT: 1, ETH: 2 }

export default function FhenixPanel() {
  const [wallet,  setWallet]  = useState(null)
  const [balance, setBalance] = useState(null)
  const [netInfo, setNetInfo] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [txLog, setTxLog] = useState([])
  const [error, setError] = useState(null)

  const [payrollForm, setPayrollForm] = useState({ payee: '', amount: '', currency: 'USDC' })
  const [submittingPayroll, setSubmittingPayroll] = useState(false)
  const [encryptStep, setEncryptStep] = useState('')

  const [voteForm, setVoteForm] = useState({ proposalId: '', vote: 'yes' })
  const [submittingVote, setSubmittingVote] = useState(false)

  useEffect(() => {
    api.blockchain.network().then(setNetInfo).catch(() => {})
  }, [])

  // Refresh tx log from mock state
  function refreshTxLog() {
    setTxLog(getMockTxLog ? getMockTxLog().slice(0, 10) : [])
  }

  async function connect() {
    setError(null)
    setConnecting(true)
    try {
      const address = await connectCofhe()
      setWallet(address)
      setBalance('0.042180 ETH')
      refreshTxLog()
    } catch (e) {
      setError(e.message)
    } finally {
      setConnecting(false)
    }
  }

  async function submitPayrollEntry() {
    setError(null)
    setSubmittingPayroll(true)
    try {
      setEncryptStep('Encrypting amount via cofhejs.encrypt(Encryptable.uint128)...')
      await encryptPayrollAmount(parseFloat(payrollForm.amount))

      setEncryptStep('Submitting encrypted entry to PrivaraPayrollV2...')
      const hash = await submitFhePayroll({
        payee:    payrollForm.payee,
        amount:   parseFloat(payrollForm.amount),
        currency: payrollForm.currency,
      })

      setEncryptStep('Verifying on Arbitrum Sepolia...')
      await api.blockchain.verifyTx(hash)

      setPayrollForm({ payee: '', amount: '', currency: 'USDC' })
      setEncryptStep('')
      refreshTxLog()
    } catch (e) {
      setError(e.message)
      setEncryptStep('')
    } finally {
      setSubmittingPayroll(false)
    }
  }

  async function submitVote() {
    setError(null)
    setSubmittingVote(true)
    try {
      setEncryptStep('Encrypting vote via cofhejs.encrypt(Encryptable.uint8)...')
      await encryptVote(voteForm.vote)

      setEncryptStep('Submitting to PrivaraGovernance.castVote()...')
      const hash = await submitFheVote({
        proposalId: voteForm.proposalId,
        vote:       voteForm.vote,
      })

      await api.blockchain.verifyTx(hash)
      setVoteForm({ proposalId: '', vote: 'yes' })
      setEncryptStep('')
      refreshTxLog()
    } catch (e) {
      setError(e.message)
      setEncryptStep('')
    } finally {
      setSubmittingVote(false)
    }
  }

  function upd(setter, field) {
    return (e) => setter(f => ({ ...f, [field]: e.target.value }))
  }

  return (
    <div className={styles.panel}>

      {/* Network Banner */}
      <div className={fxStyles.networkBanner}>
        <div className={fxStyles.networkLeft}>
          <span className={fxStyles.fheDot} />
          <span className={fxStyles.networkName}>CoFHE on Arbitrum Sepolia</span>
          <span className={fxStyles.chainId}>Chain ID 421614</span>
        </div>
        <div className={fxStyles.networkRight}>
          {netInfo?.latest_block && (
            <span className={fxStyles.blockNum}>
              Block #{netInfo.latest_block.toLocaleString()}
            </span>
          )}
          <a href="https://sepolia.arbiscan.io" target="_blank"
             rel="noreferrer" className={fxStyles.explorerLink}>
            Arbiscan ↗
          </a>
        </div>
      </div>

      {!wallet ? (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Connect On-Chain Wallet</h3>
          <p className={fxStyles.hint}>
            Connect to Fhenix CoFHE on Arbitrum Sepolia to submit
            FHE-encrypted payroll entries and governance votes on-chain.
            Amounts encrypted via <code>cofhejs.encrypt(Encryptable.uint128)</code>
            — never visible to validators or block explorers.
          </p>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.btn} onClick={connect} disabled={connecting}>
            {connecting ? 'Initializing cofhejs...' : 'Connect Wallet'}
          </button>
        </div>
      ) : (
        <>
          {/* Wallet card */}
          <div className={fxStyles.walletCard}>
            <div className={fxStyles.walletLeft}>
              <span className={fxStyles.walletLabel}>Connected</span>
              <span className={fxStyles.walletAddress}>{wallet}</span>
            </div>
            <div className={fxStyles.walletRight}>
              <span className={fxStyles.walletLabel}>Balance</span>
              <span className={fxStyles.walletBalance}>{balance}</span>
            </div>
          </div>

          {/* Encrypt status */}
          {encryptStep && (
            <div className={fxStyles.encryptStatus}>
              <span className={fxStyles.fheDot} />
              {encryptStep}
            </div>
          )}

          {/* FHE Payroll */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              On-Chain FHE Payroll — PrivaraPayrollV2.sol
            </h3>
            <p className={fxStyles.hint}>
              Amount encrypted as <code>euint128</code> before submission.
              On-chain value shows <code>[encrypted]</code> — invisible
              to block explorers and validators.
            </p>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Payee Wallet</label>
                <input type="text" placeholder="0x..."
                  value={payrollForm.payee}
                  onChange={upd(setPayrollForm, 'payee')} />
              </div>
              <div className={styles.field}>
                <label>Currency</label>
                <select value={payrollForm.currency}
                  onChange={upd(setPayrollForm, 'currency')}>
                  <option>USDC</option>
                  <option>USDT</option>
                  <option>ETH</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Amount (encrypted before tx)</label>
                <input type="number" placeholder="5000.00"
                  value={payrollForm.amount}
                  onChange={upd(setPayrollForm, 'amount')} />
              </div>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.btn} onClick={submitPayrollEntry}
              disabled={submittingPayroll}>
              {submittingPayroll ? 'Encrypting & Submitting...' : 'Submit FHE Entry'}
            </button>
          </div>

          {/* FHE Vote */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              On-Chain FHE Vote — PrivaraGovernance.sol
            </h3>
            <p className={fxStyles.hint}>
              Vote encrypted as <code>euint8</code>. Accumulated
              homomorphically — no individual vote ever decrypted on-chain.
            </p>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Proposal ID</label>
                <input type="number" placeholder="0"
                  value={voteForm.proposalId}
                  onChange={upd(setVoteForm, 'proposalId')} />
              </div>
              <div className={styles.field}>
                <label>Your Vote</label>
                <select value={voteForm.vote}
                  onChange={upd(setVoteForm, 'vote')}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="abstain">Abstain</option>
                </select>
              </div>
            </div>
            <button className={styles.btn} onClick={submitVote}
              disabled={submittingVote}>
              {submittingVote ? 'Encrypting & Voting...' : 'Cast FHE Vote'}
            </button>
          </div>

          {/* Tx log */}
          {txLog.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>On-Chain Transaction Log</h3>
              <div className={fxStyles.txLog}>
                {txLog.map((tx, i) => (
                  <div className={fxStyles.txRow} key={i}>
                    <span className={fxStyles.txLabel}>{tx.label}</span>
                    <span className={fxStyles.txTime}>
                      {new Date(tx.created_at).toLocaleTimeString()}
                    </span>
                    <a href={tx.explorer_url} target="_blank"
                       rel="noreferrer" className={fxStyles.txHash}>
                      {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-6)} ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}