import styles from "./PrivacyStageBar.module.css";

// Fhenix Privacy Stages framework — published Dec 2025
// https://www.fhenix.io/blog/fhenix402
const STAGES = [
  {
    n: 0,
    label: "TEE-Only",
    desc: "Trust the hardware enclave",
    active: false,
  },
  {
    n: 1,
    label: "ZK Proofs",
    desc: "Prove computation without revealing inputs",
    active: false,
  },
  {
    n: 2,
    label: "MPC",
    desc: "Multi-party secret sharing",
    active: false,
  },
  {
    n: 3,
    label: "FHE",
    desc: "Compute directly on ciphertext — Privara's level",
    active: true,
  },
];

export default function PrivacyStageBar() {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.title}>Privacy Stage</span>
        <a
          href="https://www.fhenix.io/blog/fhenix402"
          target="_blank"
          rel="noreferrer"
          className={styles.source}
        >
          Fhenix Framework ↗
        </a>
      </div>
      <div className={styles.stages}>
        {STAGES.map((s) => (
          <div
            key={s.n}
            className={s.active ? styles.stageActive : styles.stage}
          >
            <div className={styles.stageNum}>Stage {s.n}</div>
            <div className={styles.stageLabel}>{s.label}</div>
            <div className={styles.stageDesc}>{s.desc}</div>
            {s.active && <div className={styles.stageBadge}>Privara</div>}
          </div>
        ))}
      </div>
      <p className={styles.caption}>
        Privara operates at <strong>Stage 3 — FHE</strong>. Payroll amounts and
        votes are encrypted before leaving the browser. On-chain computation runs
        on ciphertext. No plaintext ever touches the network.
      </p>
    </div>
  );
}