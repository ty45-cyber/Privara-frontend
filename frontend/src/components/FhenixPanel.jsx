import { useState, useEffect } from "react";
import { getContract } from "viem";
import {
  connectCofhe,
  encryptPayrollAmount,
  encryptVote,
  unsealAmount,
  getPermission,
  getClient,
  explorerUrl,
  isConnected,
} from "../fhenix";
import { api } from "../api";
import styles from "./Panel.module.css";
import fxStyles from "./FhenixPanel.module.css";

const PAYROLL_ABI = [
  {
    name: "createEntry",
    type: "function",
    inputs: [
      { name: "payee", type: "address" },
      { name: "encryptedAmount", type: "tuple", components: [{ name: "data", type: "bytes" }] },
      { name: "currency", type: "uint8" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    name: "markProcessed",
    type: "function",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "entryCount",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
];

const GOVERNANCE_ABI = [
  {
    name: "createProposal",
    type: "function",
    inputs: [
      { name: "titleHash", type: "bytes32" },
      { name: "quorum", type: "uint32" },
      { name: "durationSeconds", type: "uint256" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    name: "castVote",
    type: "function",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "encryptedVote", type: "tuple", components: [{ name: "data", type: "bytes" }] },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "hasVoted",
    type: "function",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    name: "proposalCount",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
];

const CURRENCY_CODES = { USDC: 0, USDT: 1, ETH: 2 };

export default function FhenixPanel({ payrollAddress, governanceAddress }) {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [txLog, setTxLog] = useState([]);
  const [error, setError] = useState(null);

  const [payrollForm, setPayrollForm] = useState({
    payee: "", amount: "", currency: "USDC",
  });
  const [submittingPayroll, setSubmittingPayroll] = useState(false);

  const [voteForm, setVoteForm] = useState({ proposalId: "", vote: "yes" });
  const [submittingVote, setSubmittingVote] = useState(false);

  useEffect(() => {
    api.blockchain.network().then(setNetworkInfo).catch(() => {});
  }, []);

  async function connect() {
    setError(null);
    setConnecting(true);
    try {
      const address = await connectCofhe();
      setWallet(address);
      const data = await api.blockchain.balance(address);
      setBalance(data.balance);
    } catch (e) {
      setError(e.message);
    } finally {
      setConnecting(false);
    }
  }

  function logTx(label, hash, chain) {
    setTxLog((prev) => [
      { label, hash, url: explorerUrl(hash, chain), time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9),
    ]);
  }

  async function submitPayrollEntry() {
    setError(null);
    setSubmittingPayroll(true);
    try {
      const client = getClient();
      const contract = getContract({
        address: payrollAddress,
        abi: PAYROLL_ABI,
        client,
      });

      const encAmount = await encryptPayrollAmount(parseFloat(payrollForm.amount));
      const hash = await contract.write.createEntry([
        payrollForm.payee,
        encAmount,
        CURRENCY_CODES[payrollForm.currency],
      ]);

      logTx("FHE Payroll Entry", hash, "arb-sepolia");
      await api.blockchain.verifyTx(hash);
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
      const client = getClient();
      const contract = getContract({
        address: governanceAddress,
        abi: GOVERNANCE_ABI,
        client,
      });

      const encVote = await encryptVote(voteForm.vote);
      const hash = await contract.write.castVote([
        BigInt(voteForm.proposalId),
        encVote,
      ]);

      logTx(`FHE Vote — proposal ${voteForm.proposalId}`, hash, "arb-sepolia");
      await api.blockchain.verifyTx(hash);
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
          <span className={fxStyles.networkName}>CoFHE on Arbitrum Sepolia</span>
          <span className={fxStyles.chainId}>Chain ID 421614</span>
        </div>
        <div className={fxStyles.networkRight}>
          {networkInfo?.latest_block && (
            <span className={fxStyles.blockNum}>
              Block #{networkInfo.latest_block.toLocaleString()}
            </span>
          )}
          <a
            href="https://sepolia.arbiscan.io"
            target="_blank"
            rel="noreferrer"
            className={fxStyles.explorerLink}
          >
            Arbiscan ↗
          </a>
        </div>
      </div>

      {!wallet ? (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Connect Wallet — CoFHE Testnet</h3>
          <p className={fxStyles.hint}>
            Connect MetaMask to Arbitrum Sepolia (CoFHE) to submit FHE-encrypted
            payroll entries and governance votes directly on-chain.
            Powered by <strong>cofhejs</strong> — Fhenix's current SDK.
          </p>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.btn} onClick={connect} disabled={connecting}>
            {connecting ? "Initializing cofhejs..." : "Connect MetaMask"}
          </button>
        </div>
      ) : (
        <>
          <div className={fxStyles.walletCard}>
            <div className={fxStyles.walletLeft}>
              <span className={fxStyles.walletLabel}>Connected Wallet</span>
              <span className={fxStyles.walletAddress}>
                {wallet.slice(0, 6)}...{wallet.slice(-4)}
              </span>
            </div>
            <div className={fxStyles.walletRight}>
              <span className={fxStyles.walletLabel}>Balance</span>
              <span className={fxStyles.walletBalance}>{balance || "—"}</span>
            </div>
          </div>

          {/* FHE Payroll */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              On-Chain FHE Payroll — PrivaraPayroll.sol
            </h3>
            <p className={fxStyles.hint}>
              Amount encrypted via <code>cofhejs.encrypt(Encryptable.uint128)</code> before
              submission. Stored as <code>euint128</code> — invisible to block explorers and
              node operators. Only the payee can decrypt their own payout.
            </p>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Payee Wallet Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={payrollForm.payee}
                  onChange={upd(setPayrollForm, "payee")}
                />
              </div>
              <div className={styles.field}>
                <label>Currency</label>
                <select value={payrollForm.currency} onChange={upd(setPayrollForm, "currency")}>
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
              disabled={submittingPayroll || !payrollAddress}
            >
              {submittingPayroll ? "Encrypting & Submitting..." : "Submit FHE Entry"}
            </button>
            {!payrollAddress && (
              <p className={styles.hint}>Set VITE_PAYROLL_ADDRESS in .env</p>
            )}
          </div>

          {/* FHE Vote */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              On-Chain FHE Vote — PrivaraGovernance.sol
            </h3>
            <p className={fxStyles.hint}>
              Vote encrypted via <code>cofhejs.encrypt(Encryptable.uint8)</code>.
              Accumulated homomorphically — no individual vote decrypted on-chain.
              Tally sealed and revealed only by admin after voting closes.
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
                <select value={voteForm.vote} onChange={upd(setVoteForm, "vote")}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="abstain">Abstain</option>
                </select>
              </div>
            </div>
            <button
              className={styles.btn}
              onClick={submitVote}
              disabled={submittingVote || !governanceAddress}
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
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)} ↗
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