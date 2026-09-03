# MemeVerdict

**MemeVerdict is a GenLayer Intelligent Contract and dApp for verifiable verdicts on real-world meme-coin events.** Claims lock explicit resolution rules, deadlines, and authoritative sources; GenLayer validators fetch web evidence, reason over it, and finalize `YES`, `NO`, or `UNRESOLVED` verdicts with an auditable evidence digest.

## Live v2 deployment

- **Official contract:** `0x96a9B51C30a0Af126C7d4594489e2940F1f44621`
- **Deployment transaction:** `0x67217d9b3fc896c5ca9765b1bb4f0c103f05d475ce124899e20e21771bfec776`
- **Successful YES claim:** `meme-doge-core-api-1147-001`
- **Claim creation transaction:** `0xe07cea3242aae1c2679363143e95502133d6c432ee4c0a0d5b1dde7e67d1b2ef`
- **Full Consensus YES transaction:** `0xbb53b48924d406e016b207c4dff77b2b468a9c1db70740740adb262a70bcd183`
- **Evidence digest:** `a9d26973da816ca0e54267beaa47e3224f09e7f1c10370ae7c47eae622fb45a3`
- **Authoritative evidence:** https://api.github.com/repos/dogecoin/dogecoin/releases/tags/v1.14.7
- **Final verdict:** `YES`

## Live frontend

- **MemeVerdict dApp:** https://4173-sbx-66429d05403ce7e6aa5af1d6bdc135b0.sandbox.westus2-prod.sspark.ai
- **Direct live YES verdict:** https://4173-sbx-66429d05403ce7e6aa5af1d6bdc135b0.sandbox.westus2-prod.sspark.ai/claims/meme-doge-core-api-1147-001

The frontend reads claim and verdict data from the deployed Intelligent Contract; the live result is not hard-coded.

## Canonical project source

The complete, current project is under [`MemeVerdict/`](MemeVerdict/):

- [Full project README](MemeVerdict/README.md)
- [Intelligent Contract](MemeVerdict/contract/meme_verdict.py)
- [Frontend](MemeVerdict/frontend/)
- [Architecture](MemeVerdict/docs/architecture.md)
- [Deployment evidence](MemeVerdict/docs/deployment.md)
- [Testing](MemeVerdict/docs/testing.md)
- [Demo scenarios](MemeVerdict/docs/demo.md)

## What the live test proved

MemeVerdict v2 completed a real GenLayer Full Consensus adjudication against the official Dogecoin GitHub API. The source identified `Dogecoin Core 1.14.7` with `published_at: 2024-02-28T18:14:21Z`, satisfying the claim deadline. The contract finalized `YES` and stored its reasoning, evidence URL, and SHA-256 evidence digest on-chain.

The earlier v1 debug deployment exposed a GenVM float-calldata serialization issue; v2 migrated confidence values to integer `confidence_percent` and includes regression coverage preventing Python floats from crossing the calldata boundary.

## Submission status

Contract deployment, live consensus testing, frontend configuration, and public frontend publication are complete. The remaining project-level step is to capture final screenshots and submit the project/evidence links through the GenLayer project submission flow.
