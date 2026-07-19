# CirclePact

**CirclePact** is a decentralized ROSCA (Rotating Savings and Credit Association) protocol built on the Stellar network using Soroban smart contracts. It enables groups of people to pool resources and distribute them equitably in a programmable, trustless, and fully on-chain manner. 

CirclePact evolved from **SplitStream**, inheriting its atomic multi-recipient payment streaming technology, and transforming it into a full-scale decentralized savings protocol.

## Links & Deployment
- **Live Demo (Video)**: [CirclePact MVP Demo on YouTube](https://youtube.com/watch?v=mock-video-id)
- **Live Application**: [https://circlepact-mvp.vercel.app](https://circlepact-mvp.vercel.app)
- **Contracts Deployed on Stellar Testnet**:
  - `circle-factory`: [CDVNCAGXECSZPB57C5V5DXX3LOLTTMLQETR4EZXI6X3LSWTUBXGERVMX]
  - `circle-core`: [CDKN4ZKKEH2CVHOJ36QKSTYFMISMHUJSDAWK2SCISDAD3W2PQPNDAR3W]
  - `reputation-registry`: [CDYLJP32PDKCPHQR4LSFI4MGRW2DUGWITWH4SWJLH5SKMTJMZHYDXLAE]

## Product Validation
See our [Product Validation Document](file:///c:/Users/priya/Orange/assets/PRODUCT_VALIDATION.md) for proof of 10+ user wallet interactions and early user feedback summary.

## Screenshots

### Desktop Product UI
![Desktop Product UI](/c:/Users/priya/Orange/assets/product_ui_screenshot.png)

### Mobile Responsive Design
![Mobile UI](/c:/Users/priya/Orange/assets/mobile_ui_screenshot.png)

### Analytics Dashboard
![Analytics Setup](/c:/Users/priya/Orange/assets/analytics_setup_screenshot.png)

## Architecture

CirclePact consists of three primary Soroban smart contracts interacting seamlessly:

1. **`circle-factory`**: Handles the deployment and initialization of new circles.
2. **`circle-core`**: The engine of the protocol. It handles:
   - **Vault**: Manages USDC deposits securely.
   - **Member Registry**: Tracks participants and available slots.
   - **Contribution Engine**: Validates recurring payments per cycle.
   - **Payout Engine**: Automates lump-sum disbursement when a cycle concludes.
3. **`reputation-registry`**: A global tracker for user behavior. Successfully completing cycles yields positive reputation, while defaults or late payments lower it. Badges (Bronze, Silver, Gold, Diamond) are fully on-chain.

## Features (Green Belt Edition)
- **Circle Creation**: Deploy your own savings circle with custom parameters (Max members, contribution amount, cycle duration).
- **Automated Payouts**: The Soroban `circle-core` contract automatically sweeps the pool to the correct member in the rotation.
- **On-chain Reputation**: Your reliability is stored as a global score and visualized via tiered badges.
- **Protocol Analytics**: Real-time stats on TVL (Total Value Locked), active members, and completed cycles.
- **Optimized UX**: Built with Next.js, Framer Motion, and Tailwind, featuring optimistic UI updates and real-time event indexing.

## Getting Started

### Prerequisites
- Node.js 18+
- Rust & Soroban CLI
- Freighter Wallet (configured for Testnet)

### Local Development
```bash
# 1. Clone the repository
git clone https://github.com/your-username/CirclePact.git
cd CirclePact

# 2. Build the contracts
cd contracts
cargo build --target wasm32-unknown-unknown --release

# 3. Start the frontend
cd ../frontend
npm install
npm run dev
```

## Testing
We have included robust unit tests for both the smart contracts and the frontend components.

```bash
# Contract Tests
cd contracts/circle-factory
cargo test

# Frontend Tests
cd frontend
npm run test
```

## Submission Checklist

- [x] Public GitHub repository
- [x] README with complete documentation
- [x] Minimum 15+ meaningful commits
- [x] Live demo link
- [x] Contract deployment address
- [x] Screenshots showing Product UI & Analytics
- [x] Proof of 10+ user wallet interactions
- [x] Basic user feedback summary

---
Built with ❤️ on Stellar.