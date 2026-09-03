"""Shared pytest helpers for MemeVerdict direct-mode tests.

These tests use the `genlayer-test` in-memory direct mode — they need
no Docker, no running Studio, and can be run in seconds:

    pip install -r requirements.txt
    pytest contract/tests -v
"""
import json
from pathlib import Path

CONTRACT_PATH = str(Path(__file__).resolve().parents[1] / "meme_verdict.py")


# A tiny, well-formed sample claim used by many tests.
SAMPLE_CLAIM = dict(
    claim_id="dogedemo-listing-2026-09-30",
    title="Did Example Exchange list DOGEDEMO for spot trading by 2026-09-30?",
    token_name="DogeDemo",
    token_symbol="DOGEDEMO",
    category="exchange_listing",
    question=(
        "Did Example Exchange officially list DOGEDEMO for spot trading "
        "on or before 2026-09-30?"
    ),
    resolution_criteria=(
        "YES only if an official Example Exchange announcement page or "
        "official exchange market page confirms DOGEDEMO/USDT (or DOGEDEMO/USD) "
        "spot trading was live on or before 2026-09-30. "
        "NO if the exchange or the project confirm no such listing occurred by "
        "the deadline. UNRESOLVED if evidence is missing or contradictory."
    ),
    deadline="2026-09-30",
    authoritative_sources_json=json.dumps([
        "https://www.example-exchange.com/announcements",
        "https://www.example-exchange.com/markets/DOGEDEMO",
        "https://dogedemo.example/blog",
    ]),
    optional_evidence_json=json.dumps([]),
)
