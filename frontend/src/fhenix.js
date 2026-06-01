// Mock CoFHE/fhenix integration
// Simulates: wallet connect, cofhejs encrypt, tx submission, permit unsealing
// No MetaMask, no network, no cofhejs dependency required

import { mockFhePayroll, mockFheVote, getMockTxLog, getMockWallet } from './mock/mockApi.js'

let _connected = false
let _wallet    = null

export async function connectCofhe() {
  // Simulate wallet connect + cofhejs initialization delay
  await new Promise(r => setTimeout(r, 1200))
  _wallet    = getMockWallet()
  _connected = true
  console.info('[mock cofhejs] Initialized — environment: MOCK')
  console.info('[mock cofhejs] Permit created for', _wallet)
  return _wallet
}

export function isConnected() { return _connected }
export function getClient()   { return null }

export async function encryptPayrollAmount(amountFloat) {
  await new Promise(r => setTimeout(r, 600))
  const microUnits = BigInt(Math.round(amountFloat * 1_000_000))
  console.info(`[mock cofhejs] encrypt(Encryptable.uint128(${microUnits})) → [encrypted blob]`)
  // Return a realistic-looking encrypted blob structure
  return {
    data: '0x' + Array.from({ length: 128 }, () =>
      Math.floor(Math.random() * 16).toString(16)).join(''),
  }
}

export async function encryptVote(voteStr) {
  await new Promise(r => setTimeout(r, 400))
  const codes = { yes: 1n, no: 0n, abstain: 2n }
  const code  = codes[voteStr]
  console.info(`[mock cofhejs] encrypt(Encryptable.uint8(${code})) → [encrypted blob]`)
  return {
    data: '0x' + Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)).join(''),
  }
}

export async function unsealAmount(ctHash) {
  await new Promise(r => setTimeout(r, 500))
  console.info('[mock cofhejs] unseal() → decrypted via permit')
  return Math.random() * 10000
}

export function getPermission() {
  return {
    sealingKey: '0x' + Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)).join(''),
    signature:  '0x' + Array.from({ length: 130 }, () =>
      Math.floor(Math.random() * 16).toString(16)).join(''),
    issuer: _wallet,
  }
}

// Mock on-chain payroll submission
export async function submitFhePayroll({ payee, amount, currency }) {
  return mockFhePayroll({ payee, amount, currency })
}

// Mock on-chain vote submission
export async function submitFheVote({ proposalId, vote }) {
  return mockFheVote({ proposalId, vote })
}

export function explorerUrl(txHash) {
  return `https://sepolia.arbiscan.io/tx/${txHash}`
}

export const COFHE_CHAIN = {
  id:   421614,
  name: 'Arbitrum Sepolia (CoFHE)',
}