# Privara — Confidential Infrastructure

Privacy-preserving infrastructure for payments, governance, and computation.

## Tech Stack

**Backend**: Rust + Axum + SQLx + MySQL  
**Frontend**: Vite + React 
**Crypto**: AES-256-GCM encryption, SHA-256 ZK commitments, bcrypt auth  
**Auth**: JWT (12hr expiry, HMAC-SHA256)

## Quick Start

### Backend

```bash
cp .env.example .env
# Edit DATABASE_URL, JWT_SECRET, PRIVARA_MASTER_KEY

cargo run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Architecture
## Fhenix Nitrogen Integration

### Network Details
| Field | Value |
|---|---|
| Network | Fhenix Nitrogen Testnet |
| Chain ID | 8008135 |
| RPC | https://api.nitrogen.fhenix.zone |
| Explorer | https://explorer.nitrogen.fhenix.zone |
| Gas Token | tFHE |
| Faucet | https://faucet.fhenix.zone |

### Contract Deployment

```bash
cd contracts
cp .env.example .env
# Add DEPLOYER_PRIVATE_KEY (fund it with tFHE from faucet first)

npm install
npm run compile
npm run deploy
# Outputs deployed_addresses.json — copy addresses into frontend/.env
```

### Architecture: Dual-Layer Privacy