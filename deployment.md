# Deployment

MemeVerdict has two independent deployments: the **Intelligent Contract** (on GenLayer) and the **frontend** (any static host).

> ⚠️ Every step below that involves a wallet signature or an account
> upload must be performed by **you**, not by an AI. Private keys must
> never leave your machine.

## 1. Prerequisites

- A GenLayer wallet — MetaMask configured for either **GenLayer Studio** or **Testnet Bradbury**.
- Node.js 20+ and Python 3.12+ locally.

## 2. Deploy the Intelligent Contract via GenLayer Studio

1. Open <https://studio.genlayer.com/>.
2. Connect your wallet in Studio (top-right).
3. Create a new contract → paste the full contents of [`contract/meme_verdict.py`](../contract/meme_verdict.py).
4. Click **Deploy**. Approve the transaction in your wallet.
5. Wait for the deploy transaction to finalize; Studio will show the **contract address**.
6. Copy that address. You will paste it into `.env` below.

## 3. Run the first Full Consensus transaction

From Studio (or from the running dApp once configured):

1. Call `create_claim(...)` with the DOGEDEMO demo values from [`docs/demo.md`](demo.md). Approve in wallet.
2. Once the claim is on-chain, call `request_resolution("dogedemo-listing-2026-09-30")` (or your generated `claim_id`). Approve in wallet.
3. Wait for the **Full Consensus** round to finalize. Studio's Consensus panel shows leader / validator activity in real time.
4. Record the finalized transaction hash for `request_resolution` — this is your **consensus transaction hash**.

## 4. Configure the frontend

At the repo root:

```bash
cp .env.example .env
```

Fill in:

```env
VITE_GENLAYER_RPC_URL=https://studio.genlayer.com/api
VITE_GENLAYER_CHAIN_ID=61999
VITE_GENLAYER_CHAIN_NAME=GenLayer Studio
VITE_GENLAYER_SYMBOL=GEN
VITE_MEMEVERDICT_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

Note: `VITE_MEMEVERDICT_CONTRACT_ADDRESS` is the **only** field you must change after each deploy. There are no other places in the source that reference the contract address.

## 5. Run the frontend locally

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. From the UI:

- Click **Connect Wallet** — MetaMask should prompt.
- If the network doesn't match, the button becomes **Switch to GenLayer Studio** — click it once; the app will call `wallet_addEthereumChain` if the network isn't yet in MetaMask.
- Navigate to **Create** and submit the DOGEDEMO demo claim (or any other well-formed claim).
- Navigate to the claim detail page and click **Request GenLayer Resolution**. Watch the transaction chip walk through *Wallet confirmation → Submitted → Consensus pending → Finalized*.

## 6. Deploy the frontend

Any static host works — GitHub Pages, Cloudflare Pages, Vercel, Netlify, S3.

```bash
cd frontend
npm run build          # outputs frontend/dist
```

Deploy `frontend/dist` to your host of choice.
Set the same `VITE_*` env variables in the host's build settings.

## 7. Record what you deployed

Fill these in and commit to the repo (or paste into your submission form):

```
Contract address:         0x96a9B51C30a0Af126C7d4594489e2940F1f44621
Deployment tx hash:       0x67217d9b3fc896c5ca9765b1bb4f0c103f05d475ce124899e20e21771bfec776
First YES consensus tx:   0xbb53b48924d406e016b207c4dff77b2b468a9c1db70740740adb262a70bcd183
Frontend URL:             https://4173-sbx-66429d05403ce7e6aa5af1d6bdc135b0.sandbox.westus2-prod.sspark.ai
Direct YES verdict URL:   https://4173-sbx-66429d05403ce7e6aa5af1d6bdc135b0.sandbox.westus2-prod.sspark.ai/claims/meme-doge-core-api-1147-001
GitHub repo:              https://github.com/haris4587/MemeVerdict
```

## OFFICIAL MemeVerdict v2 deployment (recorded on 2026-09-03)

```
Contract address:              0x96a9B51C30a0Af126C7d4594489e2940F1f44621
Deployment transaction:        0x67217d9b3fc896c5ca9765b1bb4f0c103f05d475ce124899e20e21771bfec776
First YES consensus tx:        0xbb53b48924d406e016b207c4dff77b2b468a9c1db70740740adb262a70bcd183
First resolved claim id:       meme-doge-core-api-1147-001
Final verdict for that claim:  YES
Evidence digest (sha256):      a9d26973da816ca0e54267beaa47e3224f09e7f1c10370ae7c47eae622fb45a3
Leader evidence URL:           https://api.github.com/repos/dogecoin/dogecoin/releases/tags/v1.14.7
Contract reasoning:            Dogecoin Core v1.14.7 was officially published on 2024-02-28.
Network:                       GenLayer Studio (chain 61999)
RPC:                           https://studio.genlayer.com/api
```

The frontend `.env` files at the repo root and inside `frontend/` are
pre-populated with these values; nothing further needs to change for
this deployment.
