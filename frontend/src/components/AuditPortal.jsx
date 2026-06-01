import { useState, useEffect } from "react";
import { api } from "../api";
import styles from "./Panel.module.css";
import aStyles from "./AuditPortal.module.css";

export default function AuditPortal() {
  const [report, setReport]         = useState(null);
  const [history, setHistory]       = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    api.audit.listReports()
      .then((d) => setHistory(d.reports || []))
      .catch(() => {});
  }, []);

  async function generate() {
    setError(null);
    setGenerating(true);
    try {
      const data = await api.audit.generateReport();
      setReport(data);
      setHistory((h) => [
        { id: data.report_id, entry_count: data.entry_count,
          merkle_root: data.merkle_root, generated_at: data.generated_at },
        ...h,
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className={styles.panel}>

      {/* Header context */}
      <div className={aStyles.banner}>
        <div className={aStyles.bannerIcon}>⚖</div>
        <div>
          <h3 className={aStyles.bannerTitle}>Selective Transparency Audit Portal</h3>
          <p className={aStyles.bannerSub}>
            Generates aggregate compliance proof without exposing individual payroll records.
            Implements the Fhenix CCS&nbsp;2025 Selective Transparency via Threshold Keys pattern.
          </p>
        </div>
      </div>

      {/* What auditors see vs. what stays private */}
      <div className={aStyles.splitCard}>
        <div className={aStyles.splitSide}>
          <div className={aStyles.splitHeader}>
            <span className={aStyles.dotGreen} /> Auditor Receives
          </div>
          <ul className={aStyles.splitList}>
            <li>Total settled payout count</li>
            <li>Currency distribution split</li>
            <li>Merkle root of entry set</li>
            <li>Cryptographic report signature</li>
            <li>Report timestamp</li>
          </ul>
        </div>
        <div className={aStyles.splitDivider}>⬡</div>
        <div className={aStyles.splitSide}>
          <div className={aStyles.splitHeader}>
            <span className={aStyles.dotRed} /> Stays Encrypted — Always
          </div>
          <ul className={aStyles.splitList}>
            <li>Any individual contractor name</li>
            <li>Any individual payout amount</li>
            <li>Any wallet address</li>
            <li>Employer–contractor relationship</li>
            <li>Payment timing per contractor</li>
          </ul>
        </div>
      </div>

      {/* Generate button */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Generate Audit Report</h3>
        <p className={aStyles.hint}>
          Produces a signed, verifiable aggregate report. The Merkle root
          cryptographically commits to the full entry set without revealing any entry.
          Regulators can verify the commitment on-chain via <code>PrivaraAudit.sol</code>.
        </p>
        {error && <p className={styles.error}>{error}</p>}
        <button
          className={styles.btn}
          onClick={generate}
          disabled={generating}
        >
          {generating ? "Computing Merkle root & signing..." : "Generate Selective Transparency Report"}
        </button>
      </div>

      {/* Report display */}
      {report && (
        <div className={aStyles.reportCard}>
          <div className={aStyles.reportHeader}>
            <span className={aStyles.reportBadge}>✓ Verified Report</span>
            <span className={aStyles.reportId}>ID: {report.report_id.slice(0, 8)}...</span>
          </div>

          <div className={aStyles.metricsGrid}>
            <div className={aStyles.metric}>
              <span className={aStyles.metricVal}>{report.entry_count}</span>
              <span className={aStyles.metricLabel}>Settled Entries</span>
            </div>
            <div className={aStyles.metric}>
              <span className={aStyles.metricVal}>{report.currency_split.usdc}</span>
              <span className={aStyles.metricLabel}>USDC Payouts</span>
            </div>
            <div className={aStyles.metric}>
              <span className={aStyles.metricVal}>{report.currency_split.usdt}</span>
              <span className={aStyles.metricLabel}>USDT Payouts</span>
            </div>
            <div className={aStyles.metric}>
              <span className={aStyles.metricVal}>{report.currency_split.eth}</span>
              <span className={aStyles.metricLabel}>ETH Payouts</span>
            </div>
          </div>

          <div className={aStyles.proofBlock}>
            <div className={aStyles.proofRow}>
              <span className={aStyles.proofKey}>Merkle Root</span>
              <span className={aStyles.proofVal}>{report.merkle_root}</span>
            </div>
            <div className={aStyles.proofRow}>
              <span className={aStyles.proofKey}>Report Signature</span>
              <span className={aStyles.proofVal}>{report.report_signature.slice(0, 32)}...</span>
            </div>
            <div className={aStyles.proofRow}>
              <span className={aStyles.proofKey}>Generated</span>
              <span className={aStyles.proofVal}>{new Date(report.generated_at).toLocaleString()}</span>
            </div>
          </div>

          <div className={aStyles.privacyNote}>
            <span className={aStyles.lockIcon}>🔒</span>
            <p>{report.privacy_note}</p>
          </div>
        </div>
      )}

      {/* Report history */}
      {history.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Audit Report History</h3>
          <div className={aStyles.historyList}>
            {history.map((r) => (
              <div className={aStyles.historyRow} key={r.id}>
                <span className={aStyles.historyId}>{r.id.slice(0, 8)}...</span>
                <span className={aStyles.historyEntries}>{r.entry_count} entries</span>
                <span className={aStyles.historyMerkle}>
                  {r.merkle_root.slice(0, 12)}...
                </span>
                <span className={aStyles.historyDate}>
                  {r.generated_at
                    ? new Date(r.generated_at).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}