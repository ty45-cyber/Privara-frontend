import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  connectFhenix,
  encryptAmount,
  encryptVote,
  buildPermit,
  explorerTxUrl,
  getProvider,
  getSigner,
} from "../fhenix";
import { api } from "../api";
import styles from "./Panel.module.css";
import fxStyles from "./FhenixPanel.module.css";

// ABI fragments — only what we call
const PAYROLL_ABI = [
  "function createEntry(address payee, tuple(bytes data) encryptedAmount, uint8 currency) returns (uint256)",
  "function markProcessed(uint256 id)",
  "function getSealedAmount(uint256 id, tuple(bytes sealingKey, bytes signature, address issuer) permission) view returns (bytes)",
  "function entryCount() view returns (uint256)",
];

const GOVERNANCE_ABI = [
  "function createProposal(string titleHash, uint32 quorum, uint256 durationSeconds) returns (uint256)",
  "function castVote(uint256 proposalId, tuple(bytes data) encryptedVote)",
  "function proposalCount() view returns (uint256)",
  "function hasVoted(uint256, address) view returns (bool)",
];

const CURRENCY_MAP = { USDC: 0, USDT: 1, ETH: 2 };

export default function FhenixPanel({ payrollAddress, governanceAddress }) {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [txLog, setTxLog] = useState([]);
  const [error, setError] = useState(null);

  // Payroll form
  const [payrollForm, setPayrollForm] = useState({
    payee: "",
    amount: "",
    currency: "USDC",
  });
  const [submittingPayroll, setSubmittingPayroll] = useState(false);

  // Vote form
  const [voteForm, setVoteForm] = useState({
    proposalId: "",
    vote: "yes",
  });
  const [submittingVote, setSubmittingVote] = useState(false);

  useEffect(() => {
    api.blockchain
      ? api.blockchain.network().then(setNetworkInfo).catch(() => {})
      : null;
  }, []);

  async function connect() {
    setError(null);
    setConnecting(true);
    try {
      const address = await connectFhenix();
      setWallet(address);

      const data = await api.blockchain.balance(address);
      setBalance(data.balance);
    } catch (e) {
      setError(e.message);
    } finally {
      setConnecting(false);
    }
  }

  function logTx(label, txHash) {
    setTxLog((prev) => [
      { label, txHash, url: explorerTxUrl(txHash), time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9),
    ]);
  }

  async function submitPayrollEntry() {
    setError(null);
    setSubmittingPayroll(true);
    try {
      const signer = getSigner();
      const contract = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);

      const encAmount = await encryptAmount(parseFloat(payrollForm.amount));
      const currencyCode = CURRENCY_MAP[payrollForm.currency] ?? 0;

      const tx = await contract.createEntry(
        payrollForm.payee,
        encAmount,
        currencyCode
      );

      logTx("Encrypted Payroll Entry", tx.hash);
      await tx.wait();

      // Inform the Rust backend so it records the on-chain proof
      await api.blockchain.verifyTx(tx.hash);

      setPayrollForm({ payee: "", amount: "", currency: "USDC" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmittingPayroll(false);
    }
  }

  async function submitVote() {
    setError(null);
    setSubmittingVote(true);
    try {
      const signer = getSigner();
      const contract = new ethers.Contract(governanceAddress, GOVERNANCE_ABI, signer);

      const encVote = await encryptVote(voteForm.vote);
      const tx = await contract.castVote(
        parseInt(voteForm.proposalId),
        encVote
      );

      logTx(`Encrypted Vote (proposal ${voteForm.proposalId})`, tx.hash);
      await tx.wait();

      await api.blockchain.verifyTx(tx.hash);
      setVoteForm({ proposalId: "", vote: "yes" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmittingVote(false);
    }
  }

  function upd(setter, field) {
    return (e) => setter((f) => ({ ...f, [field]: e.target.value }));
  }

  return (
    <div className={styles.panel}>
      {/* Network Banner */}
      <div className={fxStyles.networkBanner}>
        <div className={fxStyles.networkLeft}>
          <span className={fxStyles.fheDot} />
          <span className={fxStyles.networkName}>Fhenix Nitrogen Testnet</span>
          <span className={fxStyles.chainId}>Chain ID 8008135</span>
        </div>
        <div className={fxStyles.networkRight}>
          {networkInfo && (
            <span className={fxStyles.blockNum}>
              Block #{networkInfo.latest_block?.toLocaleString()}
            </span>
          )}
          <a
            href="https://explorer.nitrogen.fhenix.zone"
            target="_blank"
            rel="noreferrer"
            className={fxStyles.explorerLink}
          >
            Explorer ↗
          </a>
        </div>
      </div>

      {/* Wallet Connect */}
      {!wallet ? (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Connect On-Chain Wallet</h3>
          <p className={fxStyles.hint}>
            Connect MetaMask to Fhenix Nitrogen to submit FHE-encrypted payroll
            entries and governance votes directly on-chain.
          </p>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.btn} onClick={connect} disabled={connecting}>
            {connecting ? "Connecting to Fhenix..." : "Connect MetaMask"}
          </button>
        </div>
      ) : (
        <>
          {/* Wallet Info */}
          <div className={fxStyles.walletCard}>
            <div className={fxStyles.walletLeft}>
              <span className={fxStyles.walletLabel}>Wallet</span>
              <span className={fxStyles.walletAddress}>
                {wallet.slice(0, 6)}...{wallet.slice(-4)}
              </span>
            </div>
            <div className={fxStyles.walletRight}>
              <span className={fxStyles.walletLabel}>Balance</span>
              <span className={fxStyles.walletBalance}>{balance || "—"}</span>
            </div>
          </div>

          {/* On-chain Payroll */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              On-Chain FHE Payroll — PrivaraPayroll.sol
            </h3>
            <p className={fxStyles.hint}>
              Amount encrypted via fhenix.js before submission. Never visible
              on-chain — even to block explorers.
            </p>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Payee Wallet</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={payrollForm.payee}
                  onChange={upd(setPayrollForm, "payee")}
                />
              </div>
              <div className={styles.field}>
                <label>Currency</label>
                <select
                  value={payrollForm.currency}
                  onChange={upd(setPayrollForm, "currency")}
                >
                  <option>USDC</option>
                  <option>USDT</option>
                  <option>ETH</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Amount (plaintext — encrypted before tx)</label>
                <input
                  type="number"
                  placeholder="5000.00"
                  value={payrollForm.amount}
                  onChange={upd(setPayrollForm, "amount")}
                />
              </div>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button
              className={styles.btn}
              onClick={submitPayrollEntry}
              disabled={submittingPayroll}
            >
              {submittingPayroll
                ? "Encrypting & Submitting..."
                : "Submit FHE Encrypted Entry"}
            </button>
          </div>

          {/* On-chain Vote */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              On-Chain FHE Vote — PrivaraGovernance.sol
            </h3>
            <p className={fxStyles.hint}>
              Vote encrypted via fhenix.js. Tallied homomorphically — no
              individual vote ever decrypted on-chain.
            </p>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Proposal ID</label>
                <input
                  type="number"
                  placeholder="0"
                  value={voteForm.proposalId}
                  onChange={upd(setVoteForm, "proposalId")}
                />
              </div>
              <div className={styles.field}>
                <label>Your Vote</label>
                <select
                  value={voteForm.vote}
                  onChange={upd(setVoteForm, "vote")}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="abstain">Abstain</option>
                </select>
              </div>
            </div>
            <button
              className={styles.btn}
              onClick={submitVote}
              disabled={submittingVote}
            >
              {submittingVote ? "Encrypting & Voting..." : "Cast FHE Vote"}
            </button>
          </div>

          {/* Tx Log */}
          {txLog.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>On-Chain Transaction Log</h3>
              <div className={fxStyles.txLog}>
                {txLog.map((tx, i) => (
                  <div className={fxStyles.txRow} key={i}>
                    <span className={fxStyles.txLabel}>{tx.label}</span>
                    <span className={fxStyles.txTime}>{tx.time}</span>
                    <a
                      href={tx.url}
                      target="_blank"
                      rel="noreferrer"
                      className={fxStyles.txHash}
                    >
                      {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)} ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}