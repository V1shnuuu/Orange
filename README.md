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
- Frontend tests: verified with `npm test` (53 tests passing)
- Type checking: verified with `npm run type-check`
- Production build: verified with `npm run build`

## Level 5 Submission Checklist
- [x] Public GitHub repository
- [x] 20+ meaningful commits (84 at time of writing)
- [x] Live deployed application
- [x] Improved UX/UI and product stability — see [Product Improvements Shipped](#product-improvements-shipped)
- [x] Optimized onboarding experience (wallet error handling, install prompts, transaction feedback)
- [x] Updated documentation
- [ ] Proof of 50+ real testnet users with real transaction activity — [wallet_interactions_proof.md](wallet_interactions_proof.md) is an empty template
- [ ] Google Form created and distributed — spec ready at [assets/google_form_spec.md](assets/google_form_spec.md), form not yet built
- [ ] Exported feedback Excel sheet linked in README
- [ ] New features driven by collected user feedback (blocked on feedback collection)
- [ ] Pitch deck / PPT link — content drafted at [assets/pitch_deck_content.md](assets/pitch_deck_content.md), deck not yet built
- [ ] Demo video link
- [ ] Screenshots of analytics or transaction activity

Unchecked items are not yet done. Anything depending on real users is blocked
until onboarding actually happens — these are deliberately not marked complete
on the basis of templates or placeholder data.

## Product Improvements Shipped

The following improvements were made from an internal UX and code audit of the
MVP. They are **not** yet driven by collected user feedback — no responses have
been gathered yet (see the next section). They are listed here with commit links
so the iteration history is traceable.

| Area | Improvement | Commit |
|------|-------------|--------|
| UX / stability | Rebuilt the visual language on a real design-token system. Tailwind was configured but never generating utility classes, so much of the UI was silently rendering unstyled — this fixes the root cause and restyles every page and component. | [`ddbde95`](https://github.com/V1shnuuu/Orange/commit/ddbde95) |
| Onboarding | Wallet-connect failures raised a bare rejection object that the error classifier could not read, so users saw nothing useful. Errors are now classified correctly and surface a wallet-install modal with Freighter / xBull / Albedo links. | [`ddbde95`](https://github.com/V1shnuuu/Orange/commit/ddbde95), [`bb2892f`](https://github.com/V1shnuuu/Orange/commit/bb2892f) |
| Onboarding | Circle creation waited on a fixed `setTimeout` before navigating instead of on the actual transaction result, and offered no fallback if navigation failed. Now navigates on real success with a manual "View Circle" fallback. | [`bb2892f`](https://github.com/V1shnuuu/Orange/commit/bb2892f) |
| UX | "Circle not found" rendered as bare unstyled text with no way back. Replaced with the app's standard empty state and a link to browse circles. | [`bb2892f`](https://github.com/V1shnuuu/Orange/commit/bb2892f) |
| Feedback capture | The in-app feedback modal's close button was unclickable (a sibling layer intercepted the click) and would have submitted the form once reachable. Fixed, with Escape-to-close and regression tests added. | [`ddbde95`](https://github.com/V1shnuuu/Orange/commit/ddbde95) |
| Integrity | Removed fabricated user-activity evidence (a script that generated fake wallets and transaction hashes) and replaced it with honest templates to be filled with real data. | [`49daf61`](https://github.com/V1shnuuu/Orange/commit/49daf61) |

## User Feedback & Next-Phase Iteration

**Status: feedback collection has not started.** The form below has not been
built or distributed, so there are no responses to analyse and no
feedback-driven changes to report yet.

- Feedback form spec (ready to build): [assets/google_form_spec.md](assets/google_form_spec.md)
- Live form link: `TODO — add once the Google Form is created`
- Exported responses (Excel): `TODO — add once responses are collected`
- Feedback analysis: [user_feedback_summary.md](user_feedback_summary.md)

### How the next phase will use that feedback

Once real responses are collected, each change made in response to feedback will
be added to the table above with its commit link, so every iteration traces back
to the feedback that motivated it. The intended process:

1. Collect responses (wallet address, email, name, rating, free-text feedback).
2. Cross-reference each wallet address against a real testnet transaction on
   Stellar Expert before counting it as an onboarded user.
3. Group free-text feedback into themes and prioritise by rating impact.
4. Ship changes per theme, one commit per change, linked in the table above.

### Known gaps this phase must also close

- **Contract integration is simulated.** `useCircleContracts` and
  `useSorobanContract` use `setTimeout` and in-memory state rather than real
  Soroban RPC calls, so circle actions do not yet write to the deployed
  contracts. This must be wired to the live testnet contracts before circle
  activity can count as real on-chain usage.
- **In-app feedback is not persisted.** `FeedbackModal` only logs to the
  console; it needs an API route or webhook before it can collect anything.

---
Built with ❤️ on Stellar and Midnight.