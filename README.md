# SplitStream

**Programmable Revenue Sharing on Stellar**

SplitStream lets you create programmable revenue splits that automatically distribute USDC to multiple recipients on the Stellar network — atomically, transparently, in real time.

This project is built for the **Stellar Builder Program (Level 3 Orange Belt)**.

## Live Demo
🚀 **Production Deployment:** [https://orange-ten-lac.vercel.app](https://orange-ten-lac.vercel.app)

## Smart Contract Deployments (Testnet)
- **Split Registry Contract ID:** `CBL2M5AOADO6IORQRH24JT5SMMQOXRGEVSPYBVKN5VRMUUOED4EE6TPZ`
- **Payment Vault Contract ID:** `CCDJ4IKHDN4CWWAWB7XIFVM7KFG22KCAKH6V52PZHPQSO5HNO6SCQ5XH`

### Testnet Transaction Report
Here are 3 successful contract interactions executed on the Stellar Testnet:
1. **Transaction 1 (register_split):** [`03772834bba545258cc32d035a09a7e7daca67bc204dfff107227a7b25f98a06`](https://stellar.expert/explorer/testnet/tx/03772834bba545258cc32d035a09a7e7daca67bc204dfff107227a7b25f98a06)
2. **Transaction 2 (register_split):** [`268dd7aa01ddc405c12d4afd3a5ba5d4fa2be03cfdb9be74c0d72603c43e7dfb`](https://stellar.expert/explorer/testnet/tx/268dd7aa01ddc405c12d4afd3a5ba5d4fa2be03cfdb9be74c0d72603c43e7dfb)
3. **Transaction 3 (register_split):** [`0004df6e51383b149347a779c5cd95b8c372300ab48a7ee8eba892b302d197fe`](https://stellar.expert/explorer/testnet/tx/0004df6e51383b149347a779c5cd95b8c372300ab48a7ee8eba892b302d197fe)

### Testnet Dashboards
- **Split Registry Contract:** [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBL2M5AOADO6IORQRH24JT5SMMQOXRGEVSPYBVKN5VRMUUOED4EE6TPZ)
- **Payment Vault Contract:** [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CCDJ4IKHDN4CWWAWB7XIFVM7KFG22KCAKH6V52PZHPQSO5HNO6SCQ5XH)

## Project Structure

This repository is organized into a full-stack monorepo:

- `/contracts/`: The Soroban smart contracts written in Rust.
  - `split-registry`: Manages split configurations, validates recipient shares, and maintains split lifecycles.
  - `payment-vault`: Holds USDC, fetches split configurations, and executes cross-contract distributions.
- `/frontend/`: The Next.js 14 web application interface.

## Smart Contracts

The contracts enforce strict business rules:
- Maximum 10 recipients per split to optimize compute.
- Shares must sum exactly to 100%.
- Split IDs must be unique globally.
- Only the split owner can update or deactivate a split.
- Cross-contract invocation ensures atomic distributions.

### Building and Testing

Ensure you have the Soroban CLI and Rust installed.

```bash
cd contracts

# Build the WebAssembly contracts
cargo build --target wasm32-unknown-unknown --release

# Run the comprehensive test suite
cargo test --all
```

## Frontend Application

The frontend is a modern web application built with:
- Next.js 14 (App Router)
- React 19
- TailwindCSS v4
- Framer Motion
- Stellar Wallets Kit (Freighter, xBull, Albedo support)
- Vitest + Testing Library

### Running Locally

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

### Running Tests

The frontend features a comprehensive Vitest suite covering UI components and hooks.

```bash
cd frontend
npm run test
npm run type-check
```

## CI/CD Pipeline

A complete GitHub Actions workflow is provided in `.github/workflows/ci.yml`. It runs automatically on every push and pull request, executing:
1. Soroban contract tests
2. Frontend linting
3. Frontend unit tests
4. Typescript type-checking

## Design

The UI utilizes a dark editorial theme (#0F0F0F background, #00C9B1 accent) with responsive design and modern web typography (Inter and JetBrains Mono).

- **Mobile First**: All dashboards and transaction flows are fully mobile responsive.
- **Error Handling**: Comprehensive user feedback for network timeouts, contract rejections, and wallet states.
- **Transaction States**: Real-time visual feedback for contract simulation, pending signatures, and final confirmation.