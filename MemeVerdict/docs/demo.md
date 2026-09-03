# Demo scenarios

Three scripted claims that exercise each terminal verdict. The primary
demo (**A**) is deterministic — it does not depend on any real meme
coin — so a reviewer can reproduce it exactly.

## Scenario A — Deterministic YES (primary demo)

```
claim_id:        dogedemo-listing-2026-09-30
title:           Did Example Exchange list DOGEDEMO by 2026-09-30?
token_name:      DogeDemo
token_symbol:    DOGEDEMO
category:        exchange_listing
question:        Did Example Exchange officially list DOGEDEMO for spot
                 trading on or before 2026-09-30?
resolution_criteria:
  YES only if an official Example Exchange announcement page or official
  exchange market page confirms DOGEDEMO/USDT (or DOGEDEMO/USD) spot
  trading was live on or before 2026-09-30.
  NO if the exchange or the project confirm no such listing occurred by
  the deadline.
  UNRESOLVED if evidence is missing or contradictory.
deadline:        2026-09-30
authoritative_sources:
  - https://www.example-exchange.com/announcements
  - https://www.example-exchange.com/markets/DOGEDEMO
  - https://dogedemo.example/blog
```

In the direct-mode test suite the leader is mocked to return

```json
{
  "verdict": "YES",
  "confidence_percent": 92,
  "top_evidence_url": "https://www.example-exchange.com/announcements",
  "reasoning": "Official Example Exchange announcement confirms DOGEDEMO/USDT spot trading was live before 2026-09-30."
}
```

> **Note.** `confidence_percent` is an **integer** in `[0, 100]`. Earlier
> revisions of the prompt used a float `confidence ∈ [0, 1]`; GenVM's
> calldata encoder rejects Python floats with
> `TypeError: not calldata encodable 1.0: float`, so the field was
> migrated to an integer percent. See `docs/architecture.md` → *Calldata
> encoding rules*.

and the contract persists it with an SHA-256 evidence digest. See
`contract/tests/test_resolve_claim.py::TestResolveYes`.

## Scenario B — Deterministic NO

Same claim as **A** but the mocked leader returns:

```json
{
  "verdict": "NO",
  "confidence_percent": 90,
  "top_evidence_url": "https://www.example-exchange.com/markets/DOGEDEMO",
  "reasoning": "Official exchange page confirms DOGEDEMO was not listed by the deadline."
}
```

See `test_resolve_claim.py::TestResolveNo`.

## Scenario C — UNRESOLVED (evidence gap)

Same claim; the leader returns thin / conflicting evidence:

```json
{
  "verdict": "UNRESOLVED",
  "confidence_percent": 20,
  "top_evidence_url": "",
  "reasoning": "No reliable evidence retrieved from the authoritative sources."
}
```

Also covered by a malformed-LLM-output case in
`test_resolve_claim.py::TestResolveUnresolved::test_unresolved_defaults_from_bad_llm_output`
which sends a `MAYBE` value — the contract downgrades it to
`UNRESOLVED` instead of storing garbage.

## What to capture for the GenLayer submission

- Full contract source at deploy time (unchanged from repo)
- Studio deploy transaction hash + finalized status
- First `request_resolution` consensus transaction hash + finalized status
- Screenshots of:
  - Studio consensus panel showing leader + validators
  - Frontend verdict banner showing YES / NO / UNRESOLVED
  - Claim detail page with reasoning summary + evidence digest + leader URLs
