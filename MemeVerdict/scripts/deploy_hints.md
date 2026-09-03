# scripts/deploy_hints.md — one-page cheat-sheet

The AI never deploys on your behalf. Everything below is a copy-paste
walk-through for **you** to run with **your** wallet.

## 1. Studio deploy (fastest)

1. https://studio.genlayer.com/ → *Connect Wallet*
2. New contract → paste `contract/meme_verdict.py`
3. *Deploy* → sign in wallet
4. Copy the contract address into `.env` → `VITE_MEMEVERDICT_CONTRACT_ADDRESS`

## 2. First `create_claim` (from Studio)

- `claim_id`: `dogedemo-listing-2026-09-30`
- `title`: `Did Example Exchange list DOGEDEMO by 2026-09-30?`
- `token_name`: `DogeDemo`
- `token_symbol`: `DOGEDEMO`
- `category`: `exchange_listing`
- `question`: `Did Example Exchange officially list DOGEDEMO for spot trading on or before 2026-09-30?`
- `resolution_criteria`: (see `docs/demo.md`)
- `deadline`: `2026-09-30`
- `authoritative_sources_json`:
  ```json
  ["https://www.example-exchange.com/announcements","https://www.example-exchange.com/markets/DOGEDEMO","https://dogedemo.example/blog"]
  ```
- `optional_evidence_json`: `[]`

## 3. First consensus transaction

Call `request_resolution("dogedemo-listing-2026-09-30")` — approve in wallet — wait for finalization.

## 4. What to record

- Contract address: `0x…`
- Deployment tx hash: `0x…`
- Consensus tx hash: `0x…`
- Frontend URL: `https://…`
