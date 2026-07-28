# CirclePact — Pitch Deck Content Draft

Use this as the content source for your PPT/Gamma deck. Each `##` is one slide.
Replace every `[FILL IN]` with real numbers once you have them — do not present
placeholder numbers as real in the final deck.

---

## 1. Title
**CirclePact**
Trust-minimized savings circles, on-chain.
Built on Stellar (Soroban) + Midnight
[your name / team] — [date]

---

## 2. Problem Statement
- ROSCAs (rotating savings and credit associations) are used by an estimated
  1B+ people worldwide (informal savings circles, chit funds, tandas, susu,
  stokvels) — but they run on trust, paper records, and cash.
- No transparency: members can't verify the pool balance or payout order.
- No enforcement: organizers can disappear with funds; late/missed
  contributions have no automated consequence.
- No portable reputation: a reliable saver in one circle has no way to prove
  it when joining a new one.

---

## 3. Solution
CirclePact turns informal savings circles into an on-chain protocol:
- **circle-factory**: anyone can deploy a new circle with configurable
  parameters (contribution amount, cycle length, member cap).
- **circle-core**: holds the pooled funds in a vault, validates contributions,
  and automates payouts — no organizer custody of funds.
- **reputation-registry**: tracks on-chain participation history so reliable
  members build a portable, verifiable reputation across circles.

Everything is enforced by Soroban smart contracts, not trust in an organizer.

---

## 4. Market Opportunity
- ROSCA-style saving is a global, cross-cultural pattern (chit funds in
  India, tandas in Latin America, susu in West Africa, stokvels in South
  Africa, gye in Korea) — informal but massive in aggregate volume.
- Growing wallet-holding, crypto-familiar population in the exact regions
  where informal savings circles are most common.
- On-chain rails remove the two biggest failure modes of informal
  circles — embezzlement risk and lack of portable trust — without requiring
  a bank or centralized fintech intermediary.
- [FILL IN: any specific market sizing figures you want to cite — cite a source]

---

## 5. Architecture
Three Soroban contracts on Stellar testnet:
1. **circle-factory** — deploys and initializes new circles
2. **circle-core** — vault, member registry, contribution validation, payout automation
3. **reputation-registry** — reliability tracking and badge progression

Frontend: Next.js, wallet-based auth (Freighter), responsive UI with
real-time contribution/payout tracking.

Midnight integration: Compact contract (`contracts/CirclePact.compact`)
defining circle records on Midnight's ledger — [FILL IN current deployment
status once live].

[Insert architecture diagram here — contracts + frontend + wallet flow]

---

## 6. Growth Strategy
- **Onboarding**: Google Form + guided wallet-connect flow gets new testers
  from signup to their first on-chain action in one flow — see
  [assets/google_form_spec.md](google_form_spec.md).
- **Community-led testing**: recruiting testers directly from Stellar/Soroban
  and Midnight developer communities, Discord, and hackathon channels.
- **Feedback loop**: every feature iteration is tied back to a real feedback
  submission — see [user_feedback_summary.md](../user_feedback_summary.md).
- **Retention**: reputation-registry gives users a reason to keep
  participating across multiple circles rather than a single one-off use.
- [FILL IN: real user count once form data is in — "X users onboarded, Y%
  completed a second circle"]

---

## 7. Future Roadmap
- Expand Midnight integration for privacy-preserving circle membership/contributions
- Mainnet deployment path once testnet validation is complete
- Export/analytics tooling (requested in early feedback)
- Multi-asset contribution support (beyond a single stablecoin)
- Mobile-first PWA polish
- [FILL IN: any roadmap items specific to feedback you actually collect]

---

## 8. Demo
[Link your recorded demo video here once ready]
Live app: https://circlepact-mvp.vercel.app

---

## 9. Ask / Close
- [FILL IN: what you're asking for — feedback, users, ecosystem support, etc.]
- GitHub: https://github.com/V1shnuuu/Orange
