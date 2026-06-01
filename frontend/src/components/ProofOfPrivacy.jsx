import { useState } from "react";
import styles from "./ProofOfPrivacy.module.css";

// Simulated on-chain encrypted representations
// In production these are real tx hashes from the deployed contract
const DEMO_TXS = [
  {
    label: "Payout A",
    amount: "$500.00 USDC",
    txHash: "0xa3f...b291",
    encrypted: "0x2c4d8e9f1a7b3c5d2e8f9a1b4c7d3e2f8a9b1c4d7e3f2a8b9c1d4e7f3a2b8c9",
    blockExplorer: "#",
    gasUsed: "84,219",
    status: "confirmed",
  },
  {
    label: "Payout B",
    amount: "$50,000.00 USDC",
    txHash: "0x7d2...e4f8",
    encrypted: "0x2c4d8e9f1a7b3c5d2e8f9a1b4c7d3e2f8a9b1c4d7e3f2a8b9c1d4e7f3a2b8c9",
    blockExplorer: "#",
    gasUsed: "84,219",
    status: "confirmed",
  },
];

export default function ProofOfPrivacy() {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Proof of Privacy</h3>
          <p className={styles.sub}>
            Two payroll transactions on-chain. Can you tell which paid more?
          </p>
        </div>
        <button
          className={styles.revealBtn}
          onClick={() => setRevealed((r) => !r)}
        >
          {revealed ? "Hide Amounts" : "Reveal Amounts"}
        </button>
      </div>

      <div className={styles.txGrid}>
        {DEMO_TXS.map((tx, i) => (
          <div className={styles.txCard} key={i}>
            <div className={styles.txHeader}>
              <span className={styles.txLabel}>{tx.label}</span>
              <span className={styles.txStatus}>● {tx.status}</span>
            </div>

            <div className={styles.txRow}>
              <span className={styles.txKey}>Tx Hash</span>
              <span className={styles.txVal}>{tx.txHash}</span>
            </div>

            <div className={styles.txRow}>
              <span className={styles.txKey}>On-Chain Amount</span>
              <span className={styles.encryptedBlob}>[encrypted]</span>
            </div>

            <div className={styles.txRow}>
              <span className={styles.txKey}>Ciphertext</span>
              <span className={styles.ciphertext}>
                {tx.encrypted.slice(0, 24)}...
              </span>
            </div>

            <div className={styles.txRow}>
              <span className={styles.txKey}>Gas Used</span>
              <span className={styles.txVal}>{tx.gasUsed}</span>
            </div>

            {revealed && (
              <div className={styles.revealedAmount}>
                <span className={styles.revealKey}>Actual Amount</span>
                <span className={styles.revealVal}>{tx.amount}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.insight}>
        <span className={styles.insightIcon}>⬡</span>
        <p>
          Both transactions produce <strong>identical encrypted representations</strong>.
          Block explorers, validators, and MEV bots see the same ciphertext regardless
          of whether you paid $500 or $500,000. Only the authorized payee can
          decrypt their own amount via a signed CoFHE permit.
        </p>
      </div>
    </div>
  );
}