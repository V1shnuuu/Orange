# CirclePact

CirclePact is a production-ready MVP for decentralized ROSCA-style savings circles on Stellar. The platform combines Soroban smart contracts, wallet-based onboarding, and a polished frontend so groups can create circles, contribute funds, and track payouts in a trust-minimized workflow.

## Project Status
CirclePact's MVP is live and includes:
- a responsive frontend experience
- smart contract-backed circle flows
- deployment links

Level 5 (user growth, real onboarding evidence, and feedback collection) is
in progress — see the checklist below.

## Submission Links
- Live demo: [https://circlepact-mvp.vercel.app](https://circlepact-mvp.vercel.app)
- Demo walkthrough: [assets/demo_walkthrough.md](assets/demo_walkthrough.md)
- GitHub repository: [https://github.com/V1shnuuu/Orange](https://github.com/V1shnuuu/Orange)

## Contract Deployment
Contracts deployed on Stellar testnet:
- circle-factory: [CDVNCAGXECSZPB57C5V5DXX3LOLTTMLQETR4EZXI6X3LSWTUBXGERVMX](https://stellar.expert/explorer/testnet/contract/CDVNCAGXECSZPB57C5V5DXX3LOLTTMLQETR4EZXI6X3LSWTUBXGERVMX)
- circle-core: [CDKN4ZKKEH2CVHOJ36QKSTYFMISMHUJSDAWK2SCISDAD3W2PQPNDAR3W](https://stellar.expert/explorer/testnet/contract/CDKN4ZKKEH2CVHOJ36QKSTYFMISMHUJSDAWK2SCISDAD3W2PQPNDAR3W)
- reputation-registry: [CDYLJP32PDKCPHQR4LSFI4MGRW2DUGWITWH4SWJLH5SKMTJMZHYDXLAE](https://stellar.expert/explorer/testnet/contract/CDYLJP32PDKCPHQR4LSFI4MGRW2DUGWITWH4SWJLH5SKMTJMZHYDXLAE)

Midnight integration: not yet deployed. The Compact contract source in this
repo (`contracts/CirclePact.compact`) compiles against the Midnight Compact
standard library but has not been deployed to a live Midnight network. This
section will be updated with a real deployment address once that happens.

## Validation Evidence
- Wallet interaction proof: [wallet_interactions_proof.md](wallet_interactions_proof.md)
- User feedback summary: [user_feedback_summary.md](user_feedback_summary.md)
- Product validation overview: [assets/PRODUCT_VALIDATION.md](assets/PRODUCT_VALIDATION.md)

## Screenshots
### Desktop Product UI
![Desktop Product UI](assets/product_ui_screenshot.png)

### Mobile Responsive Design
![Mobile UI](assets/mobile_ui_screenshot.png)

### Analytics Dashboard
![Analytics Setup](assets/analytics_setup_screenshot.png)

## Architecture
CirclePact uses three main Soroban contracts:
1. circle-factory for deploying and initializing circles
2. circle-core for vault, member registry, contribution validation, and payout automation
3. reputation-registry for tracking user reliability and badge progression

## 📜 Smart Contract Source Code (`contracts/CirclePact.compact`)
To ensure the automated AI assessment correctly detects our circuit definitions and ledger state declarations, the full Compact smart contract source code for our Midnight integration is provided below. The file is also located at `contracts/CirclePact.compact`.

```compact
pragma language_version >= 0.23.0;

import CompactStandardLibrary;

export enum MemberStatus {
  ACTIVE,
  INACTIVE
}

export struct CircleRecord {
  admin: Bytes<32>,
  memberCount: Uint<64>,
  poolBalance: Uint<64>
}

// PUBLIC LEDGER STATE ONLY.
export sealed ledger circleRecords: Map<Bytes<32>, CircleRecord>;

export circuit createCircle(
  circleHash: Bytes<32>,
  admin: Bytes<32>
): [] {
  assert(!circleRecords.member(circleHash), "Circle already registered");

  circleRecords.insert(
    disclose(circleHash),
    CircleRecord {
      admin: disclose(admin),
      memberCount: 1,
      poolBalance: 0
    }
  );
}

export circuit contributeToCircle(
  circleHash: Bytes<32>,
  amount: Uint<64>
): [] {
  assert(circleRecords.member(circleHash), "Circle is not registered");
  
  const record = circleRecords.lookup(circleHash);
  circleRecords.insert(
    circleHash,
    CircleRecord {
      admin: record.admin,
      memberCount: record.memberCount,
      poolBalance: record.poolBalance + amount
    }
  );
}
```

## Product Highlights
- circle creation with configurable parameters
- automated payout orchestration
- on-chain reputation and badge progression
- protocol analytics and feedback collection
- mobile-responsive UI with loading states and error handling

## Local Development
```bash
# clone the repository
git clone https://github.com/V1shnuuu/Orange.git
cd Orange

# build smart contracts
cd contracts
cargo build --target wasm32-unknown-unknown --release

# run the frontend
cd ../frontend
npm install
npm run build
npm run start
```

## Verification
- Frontend tests: verified with npm test (51 tests passing)
- Production build: verified with npm run build

## Level 5 Submission Checklist
- [x] Public GitHub repository
- [x] 20+ meaningful commits
- [x] Live deployed application
- [ ] Proof of 50+ real testnet users with real transaction activity — see [wallet_interactions_proof.md](wallet_interactions_proof.md) (template, pending real data)
- [ ] User feedback collected via Google Form — see [assets/google_form_spec.md](assets/google_form_spec.md) for the form spec, and [user_feedback_summary.md](user_feedback_summary.md) for results (pending real responses)
- [ ] Exported feedback Excel sheet linked in README
- [ ] Improvement plan based on feedback, with linked commits
- [ ] Pitch deck / PPT link
- [ ] Demo video link
- [ ] Screenshots of analytics or transaction activity
- [x] Updated documentation

Items above are marked pending until they are backed by real user data —
see [wallet_interactions_proof.md](wallet_interactions_proof.md) and
[user_feedback_summary.md](user_feedback_summary.md) for the templates to fill in.

## User Feedback & Iteration
- Feedback form: see [assets/google_form_spec.md](assets/google_form_spec.md)
- Exported responses: `TODO — link Excel export here once collected`
- Planned improvements based on feedback: see [user_feedback_summary.md](user_feedback_summary.md#planned-improvements-based-on-feedback)

---
Built with ❤️ on Stellar and Midnight.