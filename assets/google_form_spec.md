# CirclePact — User Onboarding & Feedback Google Form Spec

Build this at forms.google.com. Suggested title: "CirclePact Testnet User Feedback".

## Fields

1. **Name** — Short answer, required
2. **Email** — Short answer, required, response validation: "Email"
3. **Stellar Wallet Address (Freighter, testnet)** — Short answer, required
   - Add response validation: regex `^G[A-Z2-7]{55}$` to catch malformed addresses
4. **Which action(s) did you perform in the app?** — Checkboxes, required
   - Created a circle
   - Joined a circle
   - Made a contribution
   - Claimed a payout
   - Other: ___
5. **Link to your transaction on Stellar Expert (testnet)** — Short answer, required
   - Helper text: "Paste the tx hash or full stellar.expert testnet link for the transaction above"
6. **Rate your experience (1–5)** — Linear scale, required
7. **What did you like most?** — Paragraph, optional
8. **What should we improve?** — Paragraph, optional
9. **Any bugs or issues you hit?** — Paragraph, optional

## Setup steps
1. Create the form with the fields above.
2. In the form's Responses tab, click the Sheets icon to auto-create a linked
   Google Sheet — this is your live response log.
3. Share the live form link with testers (Discord, Twitter, Telegram, etc.)
   alongside a link to the live app.
4. Before submission: File → Download → Microsoft Excel (.xlsx) from the
   linked Sheet, commit it to the repo (e.g. `assets/user_feedback_responses.xlsx`),
   and link it from the README and `user_feedback_summary.md`.
5. Cross-reference each response's wallet address against a real testnet
   transaction (Stellar Expert) before counting it toward the 50-user
   requirement — don't count a form submission alone as "active usage proof."
