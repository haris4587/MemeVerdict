# Testing

MemeVerdict ships with two layers of automated tests:

## Direct-mode (in-memory, no Docker)

Fastest feedback — runs the contract in a Python-native interpreter and
mocks `gl.nondet.web` and `gl.nondet.exec_prompt`.

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest contract/tests -v
```

### What the suite covers

| File | Scope |
|------|-------|
| `test_create_claim.py::TestCreateClaimValid` | Valid claim is created and readable via `get_claim`, `list_claims`, `list_by_creator`. |
| `test_create_claim.py::TestValidation` | Rejects vague questions, missing `?`, short criteria, unknown category, empty / non-list `authoritative_sources`, missing deadline. |
| `test_create_claim.py::TestDuplicates` | Rejects duplicate `claim_id`. |
| `test_create_claim.py::TestImmutability` | Verifies no `edit_claim` / `update_claim` / `set_question` / `set_criteria` / `set_deadline` method exists AND that `add_evidence` does not change any immutable field. |
| `test_resolve_claim.py::TestResolveYes` | Mocked YES verdict is persisted, `evidence_digest` is a 64-char sha256 hex. |
| `test_resolve_claim.py::TestResolveNo` | Mocked NO verdict is persisted. |
| `test_resolve_claim.py::TestResolveUnresolved` | Missing evidence and malformed LLM output both downgrade to UNRESOLVED. |
| `test_resolve_claim.py::TestResolveGuards` | Cannot resolve twice, cannot add evidence after resolve, missing claim raises. |
| `test_admin.py` | Owner-only pause, non-owner cannot pause, paused blocks new claims, ownership can be transferred. |

## Integration mode (against a running GenLayer environment)

Once direct tests pass, run against a real GenLayer environment:

```bash
# GLSim — fast, no Docker
pip install "genlayer-test[sim]"
gltest run tests/integration -v --network localnet

# or a local GenLayer Studio
genlayer init && genlayer up
gltest run tests/integration -v --network localnet

# or Testnet Bradbury (needs private keys configured in gltest.config.yaml)
gltest run tests/integration -v --network bradbury
```

For the initial delivery, the priority is the direct-mode suite above —
integration tests can be added once a live deploy is available.

## Manual test cases (what to try in the UI)

- **Wallet failure** — deny the MetaMask prompt: the UI must surface the
  error without corrupting state.
- **Wrong network** — switch MetaMask to a non-GenLayer chain: the button
  must become *Switch to GenLayer Studio* and successfully add the chain.
- **Ambiguous claim** — try to submit a claim with `question = "Will DOGE moon?"`
  — the contract must revert; the UI must show the revert reason.
- **Consensus failure** — during a real resolution, if the leader
  rotates, the *Consensus pending…* chip stays visible until finalization.
- **Transaction retry** — after an error, hitting *Submit* again should
  produce a new tx hash (the app never reuses a stale one).
