# ArcKin — Onchain Inheritance on Arc

> A self-executing digital will for your stablecoins. Lock USDC or EURC, name
> your heirs, and check in to prove you're alive. If you ever go silent, your
> funds are released to your beneficiaries automatically — onchain, with no
> lawyers, courts, or middlemen.

Built on [Arc](https://arc.network), Circle's USDC-native Layer-1, where
**USDC is the gas** and finality is **sub-second** — the two properties that
make a recurring "are you still alive?" check practical and cheap.

---

## How it works

1. **Lock & name heirs.** Deposit USDC/EURC into a *switch* and assign each
   beneficiary a payout share (must total 100%). Funds stay fully under your
   control.
2. **Check in to stay alive.** Before each check-in window closes, tap
   *"I'm alive"*. Depositing, withdrawing, or editing heirs also counts as a
   check-in.
3. **Silence triggers release.** If you miss the window, the switch becomes
   *tripped*. Anyone can call `release()` — but funds only ever go to the
   beneficiaries you set, never the caller. An automated keeper does this the
   moment a deadline passes, so heirs are paid with zero manual action.

## Why Arc

| | On Arc | Typical L1 |
|---|---|---|
| Gas token | USDC (the asset you protect) | A separate volatile coin |
| Finality | ~0.48s, deterministic | Seconds to minutes |
| Recurring check-ins | Cheap & predictable | Fees spike with congestion |
| Inheritance value | Stable for years | Swings with the market |

---

## Repository layout

```
.
├── contracts/             Solidity smart contracts
│   ├── DeadMansSwitch.sol  Core inheritance vault
│   └── test/MockUSDC.sol   6-decimal USDC stand-in for tests
├── test/                  Hardhat test suite (14 tests)
├── scripts/
│   ├── deploy.js           Deploy to Arc Testnet
│   └── keeper.js           Automation worker that releases tripped switches
├── deployments/           Deployed addresses per network
├── ui/                    Frontend (TanStack Start + React 19 + Tailwind)
│   └── src/lib/web3/        Contract wiring (chain, abi, hooks, actions)
├── hardhat.config.js
└── package.json
```

## Smart contract

`DeadMansSwitch.sol` is the heart of the project.

- **State per switch:** owner, token, balance, check-in interval, last check-in,
  released flag, and a list of `{account, shares}` beneficiaries (shares in
  basis points, summing to 10000).
- **Owner actions (while alive):** `createSwitch`, `checkIn`, `deposit`,
  `withdraw`, `updateBeneficiaries`.
- **Release:** `release(id)` is callable by anyone *after* the deadline passes,
  and distributes the balance to beneficiaries by share. Rounding dust goes to
  the last heir.
- **Safety:** `ReentrancyGuard` on every fund-moving function, `SafeERC20` for
  transfers, checks-effects-interactions ordering, and full input validation.

### Network details (Arc Testnet)

| | |
|---|---|
| RPC | `https://rpc.testnet.arc.network` |
| Chain ID | `5042002` |
| Explorer | `https://testnet.arcscan.app` |
| Gas / native | USDC (18 decimals) |
| USDC (ERC-20) | `0x3600000000000000000000000000000000000000` (6 decimals) |
| EURC | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` (6 decimals) |
| DeadMansSwitch | `0xFbb08c350aEc695fC55f1d4C0D945A4147a1915e` |

---

## Getting started

### Prerequisites

- Node.js 20+
- A testnet wallet with USDC from the [Circle Faucet](https://faucet.circle.com)
  (select Arc Testnet). USDC pays for gas.

### 1. Contracts

```bash
npm install
npm test                 # run the test suite (14 passing)
```

Create a `.env` from the template and add a **testnet-only** private key:

```bash
cp .env.example .env
# edit .env -> PRIVATE_KEY=<your testnet key>
```

> ⚠️ Never use a wallet that holds real funds. `.env` is gitignored.

Deploy:

```bash
npm run deploy:arc       # deploys DeadMansSwitch to Arc Testnet
```

### 2. Keeper (automated release)

```bash
npm run keeper           # watches all switches, releases tripped ones
```

In production this role is filled by a decentralized keeper network such as
Chainlink Automation or Gelato. The script does the same job locally for demos.

### 3. Frontend

```bash
cd ui
npm install --legacy-peer-deps
npm run dev              # http://localhost:8080
```

The frontend reads all data live from the contract on Arc. Connect a wallet on
Arc Testnet to create switches, check in, deposit/withdraw, edit heirs, and
claim inheritances.

---

## Contributing

Contributions are welcome. A few good places to start:

- **Keeper hardening** — integrate Chainlink Automation / Gelato instead of the
  local script.
- **Beneficiary count cap** — `release()` loops over heirs; add a max to bound
  gas for very large lists.
- **UI polish** — surface tx toasts, loading skeletons, and filter out
  zero-balance / released switches in the heir view.
- **Multi-network** — generalize `deployments/` and the frontend chain config
  for mainnet once available.

### Workflow

1. Fork and create a feature branch.
2. For contract changes, add/extend tests in `test/` and keep them green
   (`npm test`).
3. For frontend changes, keep `npx tsc --noEmit` clean.
4. Open a PR describing the change and how you tested it.

## Security

This is testnet, unaudited software. Do not use with real funds. If you find a
vulnerability, please open a private report rather than a public issue.

## License

MIT
