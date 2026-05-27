import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import styles from './Panel.module.css'

export default function GovernancePanel() {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    title: '',
    description: '',
    quorum: '3',
    duration_hours: '48',
  })
  const [voteState, setVoteState] = useState({})
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await api.governance.list()
      setProposals(data)
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
    try {
      await api.governance.create({
        ...form,
        quorum: parseInt(form.quorum),
        duration_hours: parseInt(form.duration_hours),
      })
      setForm({ title: '', description: '', quorum: '3', duration_hours: '48' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function castVote(proposal_id, vote) {
    setVoteState((s) => ({ ...s, [proposal_id]: 'voting' }))
    try {
      await api.governance.vote({ proposal_id, vote })
      setVoteState((s) => ({ ...s, [proposal_id]: 'voted' }))
      load()
    } catch (e) {
      setVoteState((s) => ({ ...s, [proposal_id]: `err: ${e.message}` }))
    }
  }

  return (
    <div className={styles.panel}>
      {/* Create proposal */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Create Encrypted Proposal</h3>
        <div className={styles.field}>
          <label>Title (encrypted at rest)</label>
          <input
            type="text"
            placeholder="Allocate 50,000 USDC to dev fund"
            value={form.title}
            onChange={update('title')}
          />
        </div>
        <div className={styles.field}>
          <label>Description</label>
          <textarea
            rows={3}
            placeholder="Full proposal context..."
            value={form.description}
            onChange={update('description')}
          />
        </div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Quorum (votes needed)</label>
            <input
              type="number"
              value={form.quorum}
              onChange={update('quorum')}
            />
          </div>
          <div className={styles.field}>
            <label>Duration (hours)</label>
            <input
              type="number"
              value={form.duration_hours}
              onChange={update('duration_hours')}
            />
          </div>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.btn} onClick={create}>
          Submit Encrypted Proposal
        </button>
      </div>

      {/* Proposals list */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Active Proposals</h3>
        {loading ? (
          <p className={styles.hint}>Loading proposals...</p>
        ) : proposals.length === 0 ? (
          <p className={styles.hint}>No proposals yet.</p>
        ) : (
          <div className={styles.proposalList}>
            {proposals.map((p) => (
              <div className={styles.proposal} key={p.id}>
                <div className={styles.proposalHeader}>
                  <h4>{p.title}</h4>
                  <span className={styles[`status_${p.status}`]}>{p.status}</span>
                </div>
                <p className={styles.proposalDesc}>{p.description}</p>
                <div className={styles.proposalMeta}>
                  <span>Quorum: {p.quorum}</span>
                  <span>Votes: {p.vote_count}</span>
                  <span>Ends: {new Date(p.ends_at).toLocaleDateString()}</span>
                </div>
                {p.status === 'active' && (
                  <div className={styles.voteRow}>
                    {voteState[p.id] === 'voted' ? (
                      <span className={styles.votedBadge}>✓ Vote recorded (ZK commitment)</span>
                    ) : (
                      <>
                        <button
                          className={styles.voteYes}
                          onClick={() => castVote(p.id, 'yes')}
                          disabled={voteState[p.id] === 'voting'}
                        >
                          Yes
                        </button>
                        <button
                          className={styles.voteNo}
                          onClick={() => castVote(p.id, 'no')}
                          disabled={voteState[p.id] === 'voting'}
                        >
                          No
                        </button>
                        <button
                          className={styles.voteAbstain}
                          onClick={() => castVote(p.id, 'abstain')}
                          disabled={voteState[p.id] === 'voting'}
                        >
                          Abstain
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}