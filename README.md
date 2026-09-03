<h1 align="center">MemeVerdict</h1>

<p align="center">
  <em>Verifiable verdicts on real-world meme-coin events, adjudicated by GenLayer consensus.</em>
</p>

<p align="center">
  <strong>Live on GenLayer Studio:</strong>
  <code>0x96a9B51C30a0Af126C7d4594489e2940F1f44621</code><br/>
  First on-chain YES verdict: <code>meme-doge-core-api-1147-001</code>
  &middot; consensus tx <code>0xbb53b489…bcd183</code>
</p>

<p align="center">
  <strong>Live frontend:</strong>
  <a href="https://4173-sbx-66429d05403ce7e6aa5af1d6bdc135b0.sandbox.westus2-prod.sspark.ai">https://4173-sbx-66429d05403ce7e6aa5af1d6bdc135b0.sandbox.westus2-prod.sspark.ai</a><br/>
  Direct on-chain YES verdict:
  <a href="https://4173-sbx-66429d05403ce7e6aa5af1d6bdc135b0.sandbox.westus2-prod.sspark.ai/claims/meme-doge-core-api-1147-001">meme-doge-core-api-1147-001</a>
</p>

<p align="center">
  <a href="https://genlayer.com"><img alt="Built on GenLayer" src="https://img.shields.io/badge/Built%20on-GenLayer-8b5cf6?style=for-the-badge"></a>
  <img alt="Python 3.12" src="https://img.shields.io/badge/contract-Python%203.12-22d3ee?style=for-the-badge">
  <img alt="React + Vite" src="https://img.shields.io/badge/frontend-React%20%2B%20Vite-a78bfa?style=for-the-badge">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-lightgrey?style=for-the-badge">
</p>

---

## 1. What MemeVerdict is

**MemeVerdict is a decentralized adjudication system for real-world events involving meme coins.** Instead of predicting prices, users create clearly defined claims about *events* — "was this token listed on Binance?", "did the team actually burn 1 B tokens?", "did the migration to Solana happen before the deadline?" — and a quorum of GenLayer validators reads the authoritative sources, reasons about the evidence, and produces a signed on-chain verdict:

```
VERDICT ∈ { YES, NO, UNRESOLVED }
```

Every resolved claim carries a reasoning summary, an SHA-256 digest of the retrieved evidence, and the exact URLs the leader validator relied on — so it stays auditable long after those webpages change.

MemeVerdict is deliberately a **pure adjudication layer**: no betting, no wagering, no token payouts. Prediction-market projects (e.g. the sibling **ClearMarket** project on the roadmap) can settle their outcomes against MemeVerdict verdicts.

## 2. Why GenLayer is necessary

A traditional smart contract cannot ask *"did Binance actually list this token?"* — it has no web access. A single oracle can, but then a single party can be corrupted and the whole verdict is a leap of faith.

A GenLayer **Intelligent Contract** solves exactly this: many validators independently fetch the same authoritative pages, reason about them with an LLM, and only accept the verdict if the network agrees on the *decision*. The reasoning text is allowed to differ between validators — only the stable decision fields have to match — which is the [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle) applied to fact-adjudication.

That is the exact primitive MemeVerdict is built on.

## 3. The problem being solved

Meme-coin communities constantly argue about events that are technically checkable but socially disputed:

- "Yes, we got listed on Binance!" — actually a MEXC listing that a screenshot misrepresented.
- "1 B tokens burned!" — the transaction points to a wallet the team still controls.
- "Partnership announced with X" — X never signed off; only a fan mock-up circulated.

MemeVerdict forces every claim to be phrased as a **yes/no question with an explicit deadline and an explicit list of authoritative sources**, and then lets a decentralized set of validators — not the project team, not a single API — decide whether the event happened.

## 4. How Intelligent Contract consensus works here

```
                          ┌────────────────────────────┐
                          │       Claim created         │
                          │  (immutable spec locked)    │
                          └─────────────┬──────────────┘
                                        │
                            request_resolution(claim_id)
                                        │
                                        ▼
             ┌──────────────────── GenLayer consensus ────────────────────┐
             │  LEADER          fetch every authoritative source          │
             │                  → LLM prompt(question, criteria, evidence)│
             │                  → { verdict, reasoning, top_url, digest } │
             │                                                            │
             │  VALIDATORS      independently repeat the fetch + prompt   │
             │                  compare STABLE fields:                    │
             │                    · verdict must match                    │
             │                    · YES/NO grounded in authoritative dom. │
             │                    · reasoning text is NEVER compared      │
             └────────────────────────────┬───────────────────────────────┘
                                          │
                                consensus succeeds
                                          │
                                          ▼
                            Persist verdict + digest + reasoning
                            → status = RESOLVED
```

Under the hood the contract uses `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` from the GenVM SDK — the recommended pattern for production Intelligent Contracts — with a custom validator that:

1. Rejects when the leader function raised (via `isinstance(result, gl.vm.Return)`).
2. Independently re-runs the leader function inside itself (no leader trust).
3. Compares only the decision fields (`verdict`, top-evidence domain).
4. Requires the top-evidence URL to fall inside the declared authoritative source list for YES / NO verdicts — a lazy validator cannot rubber-stamp fabricated evidence.

See [`contract/meme_verdict.py`](contract/meme_verdict.py) for the implementation and [`docs/architecture.md`](docs/architecture.md) for the full write-up.

## 5. Architecture

```
MemeVerdict/
├── contract/
│   ├── meme_verdict.py        # Intelligent Contract (GenVM Python)
│   └── tests/                  # Direct-mode pytest suite
│
├── frontend/                   # React + Vite dApp
│   ├── src/
│   │   ├── pages/              # Landing, Explorer, Create, Detail
│   │   ├── components/         # WalletButton, ContractStatusBanner
│   │   ├── lib/
│   │   │   ├── config.ts       # env-driven contract & network config
│   │   │   ├── wallet.tsx      # MetaMask provider + hook
│   │   │   └── genlayer.ts     # genlayer-js wrapper (reads + writes)
│   │   └── styles/global.css
│   └── public/
│
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── testing.md
│   └── demo.md
│
├── scripts/
│   └── deploy_hints.md         # step-by-step deploy walk-through
│
├── gltest.config.yaml
├── requirements.txt
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

## 6. Claim lifecycle

```
   OPEN ─── request_resolution() ───▶ RESOLUTION_REQUESTED
                                              │
                                        consensus block
                                              ▼
                                          RESOLVED
                                              ▲
                                              │
                                       verdict ∈ {YES, NO, UNRESOLVED}
```

The `(title, question, resolution_criteria, deadline, authoritative_sources, category, token_symbol)` tuple is *locked* at creation. No public method on the contract can rewrite those fields — verified by the test `test_no_edit_method_exists`.

## 7. Resolution methodology

The leader is instructed to:

- Retrieve up to **six** authoritative + optional URLs.
- Trust **primary official sources** first (exchange announcement pages, official project channels, blockchain explorers).
- Ignore anonymous social replies and low-quality blogs.
- Return `UNRESOLVED` when evidence is missing, insufficient, or contradictory — the contract never forces a YES/NO.

The validator repeats the fetch + prompt independently, then applies `_domain_of()` to the top-evidence URLs and requires that at least one side grounded on a domain that was in the caller-declared authoritative source list. Verdict text must match exactly; reasoning text is stored but never compared.

## 8. Evidence trust model

Preferred, in order:

1. **Primary authoritative source** — e.g. `binance.com/en/support/announcement/…`
2. **Independent authoritative source** — e.g. a blockchain explorer transaction page
3. **High-quality secondary source** — e.g. Coindesk, TheBlock (never anon Twitter replies)

At the moment the verdict is written, the contract stores:

- normalized evidence URLs the leader used
- `sha256` digest of the concatenated evidence text
- reasoning summary (1–4 sentences)
- final verdict
- deterministic `resolved_at` monotonic counter

Even after the source pages change, that record proves *what* the network reasoned over.

## 9. Contract methods

Writes (require a wallet signature):

| Method | Purpose |
|--------|---------|
| `create_claim(claim_id, title, token_name, token_symbol, category, question, resolution_criteria, deadline, authoritative_sources_json, optional_evidence_json="[]")` | Register a new claim with **immutable** resolution rules. Rejects vague / underspecified inputs. |
| `add_evidence(claim_id, url)` | Append an optional evidence URL. Cannot change resolution rules. Rejected once the claim is resolved. |
| `request_resolution(claim_id)` | Trigger the GenLayer consensus block that decides YES / NO / UNRESOLVED. |
| `set_paused(bool)` | Owner-only emergency pause. Does **not** allow rewriting existing claims. |
| `transfer_ownership(new_owner)` | Owner-only. |

Reads (free):

| Method | Returns |
|--------|---------|
| `get_owner()` | The contract owner address (hex) |
| `is_paused()` | Boolean |
| `get_claim_count()` | Total number of claims ever created |
| `get_claim(claim_id)` | Full claim record (see `Claim` dataclass) |
| `get_verdict(claim_id)` | Only the verdict payload — cheap for polling |
| `list_claim_ids(offset, limit)` | Paginated list of claim ids |
| `list_claims(offset, limit)` | Paginated list of full claim records |
| `list_by_creator(address)` | Every claim created by an address |
| `allowed_categories()` | The set of accepted event categories |

## 10. Frontend functionality

- **Landing** — explains what MemeVerdict does and shows the 5-step user flow.
- **Wallet connection** — MetaMask, GenLayer network auto-add / auto-switch, disconnect intent persisted in `localStorage` so a refresh does not silently reconnect.
- **Create Claim** — full form with a live JSON preview of the exact payload that will be written on-chain, plus client-side validation that mirrors the on-chain rules.
- **Claim Explorer** — every claim on this deployment, with badges for status and verdict.
- **Claim Detail** — immutable spec, list of authoritative sources, reasoning summary, evidence digest, leader URLs, and a *Request GenLayer resolution* button that visibly walks through: **Wallet confirmation → Submitted → Consensus pending → Finalized**.

## 11. Local setup

```bash
# ---- Contract side ----
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Fast in-memory tests (no Docker, no live network):
pytest contract/tests -v

# Lint the contract with the GenVM linter:
genvm-linter check contract/meme_verdict.py

# ---- Frontend ----
cp .env.example .env      # then fill in VITE_MEMEVERDICT_CONTRACT_ADDRESS
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## 12. Deployment instructions

The recommended path is via [GenLayer Studio](https://studio.genlayer.com). The full manual walk-through — including the exact wallet steps you (not the AI) must perform — is in [`docs/deployment.md`](docs/deployment.md) and reproduced as the checklist at the end of this README.

## 13. Testing instructions

See [`docs/testing.md`](docs/testing.md). Direct-mode tests cover:

- valid claim creation
- invalid vague claims (rejected)
- duplicate claim ids (rejected)
- immutable-rules guarantee (no edit method exists)
- deadline handling
- optional-evidence submission
- YES resolution
- NO resolution
- UNRESOLVED resolution
- malformed LLM output → forced UNRESOLVED
- cannot resolve twice
- cannot add evidence after resolve
- non-owner cannot pause
- owner can pause / transfer ownership

## 14. Demo scenario

The primary deterministic demo:

> **Token:** DOGEDEMO
> **Category:** Exchange Listing
> **Claim:** "Did Example Exchange officially list DOGEDEMO for spot trading on or before 30 September 2026?"
> **YES** only if an official exchange announcement or market page confirms spot trading was live before the deadline.
> **NO** if the exchange or the project confirm no such listing occurred by the deadline.
> **UNRESOLVED** if reliable evidence is missing or contradictory.

Two additional scripted demos (**NO** and **UNRESOLVED**) plus screenshot suggestions are in [`docs/demo.md`](docs/demo.md).

## 15. Security & limitations

- **No wall clock.** GenVM intentionally does not expose a wall clock inside the contract; MemeVerdict uses monotonic counters (`created_at`, `resolved_at`) as an audit stand-in and enforces deadlines *inside the resolution prompt* rather than on-chain.
- **LLM non-determinism.** Reasoning text is never compared across validators; only the stable decision fields are. Malformed LLM output is defensively parsed and downgraded to `UNRESOLVED` rather than a false YES/NO.
- **Integer-only numerics on the wire.** GenVM's calldata encoder does not accept Python `float` values — returning one from a `@gl.public.*` method (or from a `run_nondet_unsafe` leader dict) aborts the whole consensus round with `TypeError: not calldata encodable <x>: float`. MemeVerdict returns **only** `str` / `bool` / `int` / `list` / `dict` values through calldata, and the LLM confidence is stored as an integer `confidence_percent ∈ [0, 100]`. See [`docs/architecture.md → Calldata encoding rules`](docs/architecture.md).
- **Web fetches can fail.** The leader records `[FETCH_ERROR:…]` per URL so a single dead source cannot silently swing a verdict.
- **The contract is an adjudicator, not a court.** Genuinely disputed facts (rumors of an unannounced burn) should resolve to `UNRESOLVED`, not a coin-flip.
- **Do not commit `.env`.** `.env` is git-ignored; only `.env.example` should ever be in the repo.

### Debug deployment history

- **v1 (debug, discarded)** — first live full-consensus run failed with
  `TypeError: not calldata encodable 1.0: float` on the leader's
  `confidence` field. Reference tx:
  `0x4adf3f0cb7ae852528491ab869a7d756ae87d3934c97d5e50b50b58b576ed921`.
- **v2 (current, production)** — `confidence` migrated to integer
  `confidence_percent`; every leader-returned value is now
  calldata-encodable; regression test
  `TestCalldataEncodableOnly` walks the verdict payload and fails on
  any leaked Python `float`. The v2 contract is the one to redeploy as
  the official MemeVerdict deployment.

## 16. Future roadmap

- **ClearMarket** — a *separate* prediction-market project that will settle payouts against MemeVerdict verdicts. MemeVerdict's adjudication engine is intentionally modular so ClearMarket can import it as-is. **No** betting logic will ever be added to this repository.
- Multi-language claim titles / questions.
- Native explorer transaction fetchers (Etherscan, Solscan, BscScan) as first-class evidence types.
- Appeal window using GenLayer's built-in appeal primitives.
- Fee-profile-driven writes for cheap production usage.

---

## ✅ Live deployment status

MemeVerdict v2 is deployed and has completed a real Full Consensus adjudication.

- [x] GitHub repository created
- [x] Intelligent Contract v2 deployed on GenLayer Studio
- [x] Real claim created on-chain
- [x] Real Full Consensus resolution completed
- [x] Final on-chain verdict: **YES**
- [x] Evidence digest stored on-chain
- [x] Frontend configured for the v2 contract
- [x] Frontend exposes a direct link to the live YES claim
- [x] Current public frontend published

### Official evidence

- **Contract:** `0x96a9B51C30a0Af126C7d4594489e2940F1f44621`
- **Deployment tx:** `0x67217d9b3fc896c5ca9765b1bb4f0c103f05d475ce124899e20e21771bfec776`
- **YES claim:** `meme-doge-core-api-1147-001`
- **Claim creation tx:** `0xe07cea3242aae1c2679363143e95502133d6c432ee4c0a0d5b1dde7e67d1b2ef`
- **Full Consensus tx:** `0xbb53b48924d406e016b207c4dff77b2b468a9c1db70740740adb262a70bcd183`
- **Evidence digest:** `a9d26973da816ca0e54267beaa47e3224f09e7f1c10370ae7c47eae622fb45a3`
- **Authoritative evidence:** `https://api.github.com/repos/dogecoin/dogecoin/releases/tags/v1.14.7`
- **Frontend:** https://4173-sbx-66429d05403ce7e6aa5af1d6bdc135b0.sandbox.westus2-prod.sspark.ai
- **Direct verdict:** https://4173-sbx-66429d05403ce7e6aa5af1d6bdc135b0.sandbox.westus2-prod.sspark.ai/claims/meme-doge-core-api-1147-001

The remaining project-level action is to capture final screenshots and submit these evidence links through the GenLayer project submission flow.

---

<p align="center"><sub>MemeVerdict is a standalone GenLayer Intelligent Contract project.
Kept fully separate from the sibling <em>RugShield</em> and future <em>ClearMarket</em> repositories.</sub></p>
