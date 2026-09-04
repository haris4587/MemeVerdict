<p align="center">
  <img src="assets/memeverdict-logo.svg" alt="MemeVerdict logo" width="240" />
</p>

<h1 align="center">MemeVerdict</h1>

<p align="center"><strong>Consensus Adjudication for Real-World Crypto Events</strong></p>
<p align="center">Turn real-world crypto events into verifiable consensus verdicts.</p>

## What is MemeVerdict?

MemeVerdict is a full GenLayer project and dApp for decentralized adjudication of real-world crypto events such as exchange listings, token burns, partnerships, migrations, holder milestones, supply changes, official announcements, and product launches.

Users create immutable claims with an exact yes/no question, explicit resolution criteria, a deadline, and authoritative evidence sources. GenLayer validators independently retrieve public web evidence, reason over it, and finalize one of three outcomes:

- `YES` — the event is verified by sufficient authoritative evidence.
- `NO` — the event is disproven according to the locked resolution rules.
- `UNRESOLVED` — evidence is missing, contradictory, or insufficient.

Resolved claims preserve a reasoning summary, leader evidence URLs, and a SHA-256 evidence digest for later auditing. MemeVerdict is deliberately an adjudication layer only: it contains no betting, wagering, odds, liquidity, or payout logic.

## Project identity

- **Project type:** Full dApp / Project
- **Primary tagline:** Turn real-world crypto events into verifiable consensus verdicts.
- **Tag 1:** AI Adjudication
- **Tag 2:** Crypto Infrastructure
- **Network:** GenLayer Studio / Studionet
- **Chain ID:** `61999`
- **Stack:** GenLayer Intelligent Contract, Python/GenVM, GenLayerJS, React, TypeScript, Vite, MetaMask

## Live v2 deployment

- **Official contract:** `0x96a9B51C30a0Af126C7d4594489e2940F1f44621`
- **Deployment transaction:** `0x67217d9b3fc896c5ca9765b1bb4f0c103f05d475ce124899e20e21771bfec776`
- **Successful YES claim:** `meme-doge-core-api-1147-001`
- **Claim creation transaction:** `0xe07cea3242aae1c2679363143e95502133d6c432ee4c0a0d5b1dde7e67d1b2ef`
- **Full Consensus YES transaction:** `0xbb53b48924d406e016b207c4dff77b2b468a9c1db70740740adb262a70bcd183`
- **Evidence digest:** `a9d26973da816ca0e54267beaa47e3224f09e7f1c10370ae7c47eae622fb45a3`
- **Final verdict:** `YES`
- **Authoritative evidence:** https://api.github.com/repos/dogecoin/dogecoin/releases/tags/v1.14.7

The successful live claim asked whether Dogecoin Core version 1.14.7 was officially published on or before 2024-02-28. The official Dogecoin GitHub API reported `published_at: 2024-02-28T18:14:21Z`, and GenLayer Full Consensus finalized the claim as `YES`.

## Live dApp

- **MemeVerdict dApp:** https://4173-sbx-66429d05403ce7e6aa5af1d6bdc135b0.sandbox.westus2-prod.sspark.ai
- **Direct live YES verdict:** https://4173-sbx-66429d05403ce7e6aa5af1d6bdc135b0.sandbox.westus2-prod.sspark.ai/claims/meme-doge-core-api-1147-001

The frontend reads claim and verdict data from the deployed Intelligent Contract. The showcased YES result is not hard-coded.

## Core features

- MetaMask wallet connection
- GenLayer Studio network switching
- Create Claim
- Claim Explorer
- Claim Detail
- Request GenLayer Resolution
- `YES / NO / UNRESOLVED` verdict display
- Reasoning summaries
- SHA-256 evidence digests
- Leader evidence URLs
- Consensus/finalization status
- Immutable resolution questions and criteria
- Explicit authoritative-source trust boundary
- Defensive `UNRESOLVED` behavior for weak evidence
- Regression protection for GenVM float-calldata serialization

## Canonical source

The complete current project lives under [`MemeVerdict/`](MemeVerdict/):

- [Full project README](MemeVerdict/README.md)
- [Intelligent Contract](MemeVerdict/contract/meme_verdict.py)
- [Frontend](MemeVerdict/frontend/)
- [Architecture](MemeVerdict/docs/architecture.md)
- [Deployment evidence](MemeVerdict/docs/deployment.md)
- [Testing](MemeVerdict/docs/testing.md)
- [Demo scenarios](MemeVerdict/docs/demo.md)

## Architecture

MemeVerdict separates responsibilities cleanly:

1. **React/Vite frontend** — forms, wallet UX, claim explorer, verdict presentation.
2. **MetaMask / GenLayerJS signer layer** — user-approved writes and browser wallet handling.
3. **GenLayer Intelligent Contract** — immutable claim specifications and auditable verdict storage.
4. **GenLayer consensus** — validators retrieve web evidence and independently reason over the locked criteria.

The frontend never adjudicates claims itself and never invents a verdict. If the contract has not finalized a decision, the UI displays the pending state.

## Live testing proof

MemeVerdict v2 completed a real GenLayer Full Consensus adjudication against the official Dogecoin GitHub API and finalized `YES`.

Earlier live testing also demonstrated conservative failure behavior: claims with evidence that could not be sufficiently verified finalized as `UNRESOLVED` rather than forcing a YES/NO answer.

The original v1 debug deployment exposed a GenVM float-calldata serialization issue. v2 migrated confidence values to integer `confidence_percent` and includes regression coverage preventing Python floats from crossing the calldata boundary.

## Submission evidence

Strongest evidence links for reviewers:

1. **Repository:** https://github.com/haris4587/MemeVerdict
2. **Live dApp:** https://4173-sbx-66429d05403ce7e6aa5af1d6bdc135b0.sandbox.westus2-prod.sspark.ai
3. **Direct YES verdict:** https://4173-sbx-66429d05403ce7e6aa5af1d6bdc135b0.sandbox.westus2-prod.sspark.ai/claims/meme-doge-core-api-1147-001
4. **Contract source:** https://github.com/haris4587/MemeVerdict/blob/main/MemeVerdict/contract/meme_verdict.py
5. **Deployment documentation:** https://github.com/haris4587/MemeVerdict/blob/main/MemeVerdict/docs/deployment.md
6. **Official evidence source:** https://api.github.com/repos/dogecoin/dogecoin/releases/tags/v1.14.7

## License

MIT
