# Architecture

MemeVerdict is composed of four cleanly separated layers.

```
┌────────────────────────────────────────────────────────────────┐
│  1. Frontend display (React + Vite)                            │
│     - forms, previews, verdict banner, transaction chip        │
│     - never contains hard-coded verdicts                       │
└────────────────────────┬───────────────────────────────────────┘
                         │  (read/write JSON-RPC via genlayer-js)
                         ▼
┌────────────────────────────────────────────────────────────────┐
│  2. Wallet / signer (MetaMask + viem inside genlayer-js)       │
│     - user signs create_claim / request_resolution / etc.      │
│     - never reads a private key from disk                      │
└────────────────────────┬───────────────────────────────────────┘
                         │  (EIP-1193 provider)
                         ▼
┌────────────────────────────────────────────────────────────────┐
│  3. Intelligent Contract storage (GenVM Python)                │
│     - TreeMap[str, Claim] + DynArray[str]                      │
│     - IMMUTABLE claim spec fields                              │
│     - status / verdict / evidence_digest updated only after    │
│       the consensus block returns                              │
└────────────────────────┬───────────────────────────────────────┘
                         │  (gl.vm.run_nondet_unsafe)
                         ▼
┌────────────────────────────────────────────────────────────────┐
│  4. GenLayer consensus / adjudication                          │
│     - leader: web.render(url) + exec_prompt(...)               │
│     - validators: independently repeat + compare stable fields │
│     - result is written back to storage AFTER consensus        │
└────────────────────────────────────────────────────────────────┘
```

## Why the strict layering matters

- **Frontend display** never adjudicates. If the contract has not returned a verdict, the UI says `PENDING` — it never guesses.
- **Wallet transactions** are the only path that touches state. Reads are free; writes go through MetaMask.
- **Contract storage** stores facts, not opinions. The `Claim` dataclass separates the immutable spec (`title`, `question`, `resolution_criteria`, `deadline`, `authoritative_sources`, `category`, `token_symbol`) from the auditable-but-write-once outputs (`verdict`, `reasoning_summary`, `evidence_digest`, `leader_evidence_urls`).
- **Consensus** is where non-determinism lives. Following the GenLayer rules, `gl.nondet.web.render` and `gl.nondet.exec_prompt` only run inside `leader_fn` / `validator_fn`. Storage writes only happen back in the deterministic frame.

## The Equivalence Principle we use

Two validators will:

- receive slightly different bytes when they fetch the same URL,
- produce slightly different LLM prose,

but they must agree on:

- `verdict ∈ { YES, NO, UNRESOLVED }`
- the *domain* of the top-evidence URL falling inside the caller-declared `authoritative_sources`

Pattern used: **`run_nondet_unsafe` with a partial-field comparison** (Pattern 2 in the GenLayer docs), with an additional domain-membership check for YES/NO — a lazy validator that only checks `.calldata` is not enough to secure the contract, so the validator re-runs the leader function itself.

## Data model

```python
@allow_storage
@dataclass
class Claim:
    # immutable spec
    claim_id: str
    title: str
    token_name: str
    token_symbol: str
    category: str
    question: str
    resolution_criteria: str
    deadline: str                # ISO-8601 "on or before"
    authoritative_sources: str   # JSON list of URLs/domains
    optional_evidence: str       # JSON list — mutable pre-resolve
    creator: Address
    created_at: u256             # monotonic counter (no wall clock in GenVM)

    # auditable output
    status: str                  # OPEN | RESOLUTION_REQUESTED | RESOLVED
    verdict: str                 # PENDING | YES | NO | UNRESOLVED
    reasoning_summary: str
    evidence_digest: str         # sha256 hex
    resolved_at: u256
    leader_evidence_urls: str    # JSON list retrieved by the leader
```

## Calldata encoding rules (why every returned number is an `int`)

The GenVM calldata encoder deliberately does not support Python
`float` values. Returning one from a `@gl.public.write` /
`@gl.public.view` method — or from the dict that `leader_fn` returns
inside `run_nondet_unsafe` — crashes the consensus round with:

```
TypeError: not calldata encodable 1.0: float
  key 'confidence'
  key 'Return'
```

The v1 debug deployment of MemeVerdict hit exactly this crash on the
first live full-consensus run
(tx `0x4adf3f0cb7ae852528491ab869a7d756ae87d3934c97d5e50b50b58b576ed921`),
because the leader's dict contained `confidence: float ∈ [0, 1]`.

To make MemeVerdict production-safe:

- The prompt now asks the LLM for `confidence_percent`, an **integer in
  `[0, 100]`**. Fractional / string / percentage inputs are all coerced
  to an `int` inside the leader BEFORE the value crosses the calldata
  boundary.
- The fallback in `_parse_llm_json` uses `confidence_percent: 0`.
- Every value the leader returns is now one of: `str`, `bool`, `int`,
  `list[str]`, `list[int]`, or a `dict` of those — never `float`,
  `Decimal`, or `bytes`.
- The `Claim` storage dataclass has zero floating-point fields.
- A regression test suite (`TestCalldataEncodableOnly`) walks the
  verdict payload recursively and fails if any Python `float` re-enters
  the calldata surface.

## Modularity for ClearMarket

Everything below the `create_claim` / `request_resolution` boundary — the leader function, the validator function, the `_domain_of` guard, the `_parse_llm_json` helper — is *not* coupled to any betting logic. A future ClearMarket contract can call MemeVerdict as an external adjudicator (or fork the resolution helpers) without ever touching the market's payment layer. That was the whole point of keeping MemeVerdict free of odds, liquidity pools and payouts.
