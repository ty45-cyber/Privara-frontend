// Uses cofhejs/web — the current maintained Fhenix client SDK.
// The old fhenixjs package is archived and must not be used.
import { cofhejs, Encryptable, FheTypes } from "cofhejs/web";
import { createWalletClient, custom } from "viem";
import { arbitrumSepolia } from "viem/chains";

// Fhenix CoFHE runs on Arbitrum Sepolia (current testnet)
// Nitrogen is legacy — we target arb-sepolia for the grant submission
export const COFHE_CHAIN = arbitrumSepolia;

export const FHENIX_NITROGEN = {
  id: 8008135,
  name: "Fhenix Nitrogen",
  nativeCurrency: { name: "tFHE", symbol: "tFHE", decimals: 18 },
  rpcUrls: { default: { http: ["https://api.nitrogen.fhenix.zone"] } },
  blockExplorers: {
    default: {
      name: "Fhenix Explorer",
      url: "https://explorer.nitrogen.fhenix.zone",
    },
  },
};

let _client = null;
let _initialized = false;

/// Connect wallet and initialize cofhejs.
/// Switches MetaMask to Arbitrum Sepolia (CoFHE testnet).
export async function connectCofhe() {
  if (!window.ethereum) {
    throw new Error("MetaMask required. Please install it.");
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  // Switch to Arbitrum Sepolia where CoFHE is deployed
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x66EEE" }], // 421614 = Arb Sepolia
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x66EEE",
          chainName: "Arbitrum Sepolia",
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
          blockExplorerUrls: ["https://sepolia.arbiscan.io"],
        }],
      });
    } else {
      throw err;
    }
  }

  _client = createWalletClient({
    chain: COFHE_CHAIN,
    transport: custom(window.ethereum),
  });

  // Initialize cofhejs with the browser provider
  await cofhejs.initialize({
    provider: window.ethereum,
    signer: accounts[0],
  });

  // Create a permit for this session
  await cofhejs.createPermit();
  _initialized = true;

  return accounts[0];
}

export function isConnected() {
  return _initialized;
}

export function getClient() {
  return _client;
}

/// Encrypt a payroll amount as uint128.
/// Amount is in smallest unit (e.g. USDC with 6 decimals: 5000 USDC = 5000_000000n).
export async function encryptPayrollAmount(amountFloat) {
  if (!_initialized) throw new Error("cofhejs not initialized");
  const microUnits = BigInt(Math.round(amountFloat * 1_000_000));
  const [encrypted] = await cofhejs.encrypt(
    (step) => console.debug(`[cofhejs encrypt] ${step}`),
    [Encryptable.uint128(microUnits)]
  );
  return encrypted;
}

/// Encrypt a vote value as uint8: 1=yes, 0=no, 2=abstain.
export async function encryptVote(voteStr) {
  if (!_initialized) throw new Error("cofhejs not initialized");
  const codes = { yes: 1n, no: 0n, abstain: 2n };
  const code = codes[voteStr];
  if (code === undefined) throw new Error(`Unknown vote: ${voteStr}`);
  const [encrypted] = await cofhejs.encrypt(
    () => {},
    [Encryptable.uint8(code)]
  );
  return encrypted;
}

/// Unseal a sealed output from a contract call.
export async function unsealAmount(ctHash) {
  if (!_initialized) throw new Error("cofhejs not initialized");
  const result = await cofhejs.unseal(ctHash, FheTypes.Uint128);
  if (!result.success) throw new Error("Unseal failed");
  // Convert back from micro-units to display units
  return Number(result.data) / 1_000_000;
}

/// Get the current permit's Permission struct for contract calls.
export function getPermission() {
  const permit = cofhejs.getPermit();
  if (!permit || !permit.data) throw new Error("No active permit");
  return permit.data.getPermission();
}

export function explorerUrl(txHash, chain = "arb-sepolia") {
  if (chain === "arb-sepolia") {
    return `https://sepolia.arbiscan.io/tx/${txHash}`;
  }
  return `https://explorer.nitrogen.fhenix.zone/tx/${txHash}`;
}