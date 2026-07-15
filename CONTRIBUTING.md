# Contributing to SplitStream

Thank you for your interest in contributing! This document explains how to set up your development environment, run tests, and submit changes.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Submitting a Pull Request](#submitting-a-pull-request)

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| Rust | stable (for contracts) |
| Stellar CLI | latest |

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### Contract Setup

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

---

## Project Structure

```
Orange/
├── frontend/          # Next.js frontend
│   ├── src/
│   │   ├── app/       # Next.js app router pages
│   │   ├── components/# Reusable UI components
│   │   ├── hooks/     # Custom React hooks
│   │   └── lib/       # Utilities & Stellar SDK wrappers
│   └── vitest.config.ts
├── contracts/
│   ├── split-registry/  # Soroban split registry contract
│   └── payment-vault/   # Soroban payment vault contract
└── README.md
```

---

## Development Workflow

1. **Fork** the repository and create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make focused commits** — one logical change per commit, using [Conventional Commits](https://www.conventionalcommits.org/) prefixes:
   - `feat:` — new feature
   - `fix:` — bug fix
   - `refactor:` — code change without behavior change
   - `test:` — adding or updating tests
   - `docs:` — documentation only
   - `chore:` — build, config, dependency updates

3. **Run tests** before pushing:
   ```bash
   cd frontend && npm test
   ```

4. **Lint** your code:
   ```bash
   cd frontend && npm run lint
   ```

---

## Coding Standards

- **TypeScript** — all frontend code must be typed; avoid `any`.
- **React Hooks** — custom hooks live in `src/hooks/` and follow the `use` prefix convention.
- **Components** — keep components focused and co-locate tests in `src/components/__tests__/`.
- **Stellar SDK** — all SDK interactions go through `src/lib/stellar.ts`; never import the SDK directly in components.
- **Error handling** — use `classifyError()` from `src/lib/errors.ts` for all contract/wallet errors.

---

## Submitting a Pull Request

1. Push your branch and open a PR against `main`.
2. Fill in the PR template — include a description, screenshots (for UI changes), and test evidence.
3. Ensure CI passes (lint + tests).
4. Request a review from a maintainer.

We aim to review PRs within 48 hours. Thank you for contributing! 🎉
