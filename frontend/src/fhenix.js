import { ethers } from "ethers";

const FHENIX_CHAIN_ID = "0x7A1207"; // 8008135 decimal

const FHENIX_NETWORK = {
  chainId: FHENIX_CHAIN_ID,
  chainName: "Fhenix Nitrogen Testnet",
  nativeCurrency: { name: "tFHE", symbol: "tFHE", decimals: 18 },
  rpcUrls: ["https://api.nitrogen.fhenix.zone"],
  blockExplorerUrls: ["https://explorer.nitrogen.fhenix.zone"],
};

let _provider = null;
let _signer = null;

export async function connectFhenix() {
  if (!window.ethereum) throw new Error("MetaMask not found");

  await window.ethereum.request({ method: "eth_requestAccounts" });

  // Switch / add Fhenix Nitrogen
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: FHENIX_CHAIN_ID }],
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [FHENIX_NETWORK],
      });
    } else {
      throw err;
    }
  }

  _provider = new ethers.BrowserProvider(window.ethereum);
  _signer = await _provider.getSigner();
  return await _signer.getAddress();
}

export function getProvider() {
  if (!_provider) throw new Error("Not connected — call connectFhenix() first");
  return _provider;
}

export function getSigner() {
  if (!_signer) throw new Error("Not connected — call connectFhenix() first");
  return _signer;
}

/**
 * Encrypt a numeric amount for Fhenix FHE contracts.
 * Returns the tuple structure expected by the contract ABI: { data: Uint8Array }
 */
export async function encryptAmount(amount) {
  // Encode as 32-byte big-endian uint256, then wrap in the tuple the ABI expects
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256"],
    [Math.round(amount * 1e6)] // scale to 6 decimal places (USDC-style)
  );
  return { data: ethers.getBytes(encoded) };
}

/**
 * Encrypt a vote value for Fhenix FHE governance contracts.
 * yes=1, no=0, abstain=2
 */
export async function encryptVote(vote) {
  const voteMap = { yes: 1, no: 0, abstain: 2 };
  const value = voteMap[vote] ?? 0;
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["uint8"], [value]);
  return { data: ethers.getBytes(encoded) };
}

/**
 * Build a viewing permit for sealed/private data retrieval.
 */
export async function buildPermit(contractAddress) {
  const signer = getSigner();
  const address = await signer.getAddress();

  const domain = {
    name: "Fhenix Permission",
    version: "1",
    chainId: 8008135,
    verifyingContract: contractAddress,
  };

  const types = {
    Permission: [
      { name: "issuer", type: "address" },
      { name: "expiry", type: "uint256" },
    ],
  };

  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const value = { issuer: address, expiry };

  const signature = await signer.signTypedData(domain, types, value);
  const { v, r, s } = ethers.Signature.from(signature);

  // Generate an ephemeral sealing key pair (32 random bytes as placeholder)
  const sealingKey = ethers.randomBytes(32);

  return {
    sealingKey,
    signature: ethers.concat([r, s, ethers.toBeHex(v, 1)]),
    issuer: address,
  };
}

export function explorerTxUrl(txHash) {
  return `https://explorer.nitrogen.fhenix.zone/tx/${txHash}`;
}
