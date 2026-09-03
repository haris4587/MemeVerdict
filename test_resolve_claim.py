"""Adjudication tests — the GenLayer consensus block.

These mock the web fetch and the LLM prompt so we can verify the
contract's decision-classification logic without a live network.
"""
import json
import pytest

from .conftest import CONTRACT_PATH, SAMPLE_CLAIM


class TestResolveYes:
    def test_yes_verdict_is_stored(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        c.create_claim(**SAMPLE_CLAIM)

        # Simulate the leader fetching a page that confirms the listing.
        direct_vm.mock_web(
            r".*example-exchange\.com.*",
            "Official announcement: DOGEDEMO/USDT spot trading is now live. "
            "Listed on 2026-09-15 by Example Exchange.",
        )
        direct_vm.mock_web(r".*", "no evidence here")
        direct_vm.mock_llm(
            r".*",
            json.dumps({
                "verdict": "YES",
                "confidence_percent": 92,
                "top_evidence_url": "https://www.example-exchange.com/announcements",
                "reasoning": "Official Example Exchange announcement confirms "
                             "DOGEDEMO/USDT spot trading was live before 2026-09-30.",
            }),
        )

        c.request_resolution(SAMPLE_CLAIM["claim_id"])
        v = c.get_verdict(SAMPLE_CLAIM["claim_id"])
        assert v["status"] == "RESOLVED"
        assert v["verdict"] == "YES"
        assert v["reasoning"].startswith("Official Example Exchange")
        assert len(v["evidence_digest"]) == 64  # sha256 hex


class TestResolveNo:
    def test_no_verdict_is_stored(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        c.create_claim(**SAMPLE_CLAIM)

        direct_vm.mock_web(
            r".*example-exchange\.com.*",
            "Example Exchange has NOT listed DOGEDEMO. The token is not "
            "available on our platform as of 2026-10-05.",
        )
        direct_vm.mock_llm(
            r".*",
            json.dumps({
                "verdict": "NO",
                "confidence_percent": 90,
                "top_evidence_url": "https://www.example-exchange.com/markets/DOGEDEMO",
                "reasoning": "Official exchange page confirms DOGEDEMO was not "
                             "listed by the deadline.",
            }),
        )

        c.request_resolution(SAMPLE_CLAIM["claim_id"])
        v = c.get_verdict(SAMPLE_CLAIM["claim_id"])
        assert v["verdict"] == "NO"
        assert v["status"] == "RESOLVED"


class TestResolveUnresolved:
    def test_unresolved_when_evidence_thin(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        c.create_claim(**SAMPLE_CLAIM)

        direct_vm.mock_web(r".*", "")
        direct_vm.mock_llm(
            r".*",
            json.dumps({
                "verdict": "UNRESOLVED",
                "confidence_percent": 20,
                "top_evidence_url": "",
                "reasoning": "No reliable evidence retrieved from the "
                             "authoritative sources.",
            }),
        )

        c.request_resolution(SAMPLE_CLAIM["claim_id"])
        v = c.get_verdict(SAMPLE_CLAIM["claim_id"])
        assert v["verdict"] == "UNRESOLVED"

    def test_unresolved_defaults_from_bad_llm_output(self, direct_vm, direct_deploy):
        """Malformed LLM output must NOT produce a false YES/NO."""
        c = direct_deploy(CONTRACT_PATH)
        c.create_claim(**SAMPLE_CLAIM)

        direct_vm.mock_web(r".*", "some content")
        direct_vm.mock_llm(r".*", '```json\n{"verdict": "MAYBE"}\n```')

        c.request_resolution(SAMPLE_CLAIM["claim_id"])
        v = c.get_verdict(SAMPLE_CLAIM["claim_id"])
        assert v["verdict"] == "UNRESOLVED"


class TestCalldataEncodableOnly:
    """Regression for the on-chain TypeError: not calldata encodable 1.0: float.

    Every value the leader_fn returns must be a str, bool, int, or list/dict
    of those — never a Python float — otherwise GenVM's calldata encoder
    aborts the whole consensus round.
    """

    def _resolve_with_confidence(self, direct_vm, direct_deploy, raw_confidence_value):
        c = direct_deploy(CONTRACT_PATH)
        c.create_claim(**SAMPLE_CLAIM)
        direct_vm.mock_web(r".*", "listed on 2026-09-15 on example-exchange.com")
        direct_vm.mock_llm(
            r".*",
            json.dumps({
                "verdict": "YES",
                # cover legacy float, integer 0-100, string with %, and 0-1 float
                "confidence_percent": raw_confidence_value if isinstance(raw_confidence_value, int) else None,
                "confidence": raw_confidence_value,
                "top_evidence_url": "https://www.example-exchange.com/announcements",
                "reasoning": "ok",
            }),
        )
        c.request_resolution(SAMPLE_CLAIM["claim_id"])
        return c.get_verdict(SAMPLE_CLAIM["claim_id"])

    def test_legacy_float_0_to_1_does_not_break_consensus(self, direct_vm, direct_deploy):
        # This is the exact shape that triggered the on-chain crash.
        v = self._resolve_with_confidence(direct_vm, direct_deploy, 1.0)
        assert v["verdict"] == "YES"
        assert v["status"] == "RESOLVED"

    def test_integer_percent_encodes_fine(self, direct_vm, direct_deploy):
        v = self._resolve_with_confidence(direct_vm, direct_deploy, 87)
        assert v["verdict"] == "YES"

    def test_verdict_payload_contains_no_python_float(self, direct_vm, direct_deploy):
        """The dict returned from get_verdict must be pure calldata-safe types."""
        v = self._resolve_with_confidence(direct_vm, direct_deploy, 0.5)
        # Walk the whole payload recursively — no bare float allowed.
        def _no_floats(x):
            if isinstance(x, float):
                raise AssertionError(f"Leaked float in verdict payload: {x!r}")
            if isinstance(x, dict):
                for v in x.values():
                    _no_floats(v)
            elif isinstance(x, (list, tuple)):
                for i in x:
                    _no_floats(i)
        _no_floats(v)


class TestResolveGuards:
    def test_cannot_resolve_twice(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        c.create_claim(**SAMPLE_CLAIM)
        direct_vm.mock_web(r".*", "listed")
        direct_vm.mock_llm(r".*", json.dumps({
            "verdict": "YES", "confidence_percent": 80,
            "top_evidence_url": "https://www.example-exchange.com/announcements",
            "reasoning": "ok",
        }))
        c.request_resolution(SAMPLE_CLAIM["claim_id"])
        with pytest.raises(Exception):
            c.request_resolution(SAMPLE_CLAIM["claim_id"])

    def test_cannot_add_evidence_after_resolve(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        c.create_claim(**SAMPLE_CLAIM)
        direct_vm.mock_web(r".*", "listed")
        direct_vm.mock_llm(r".*", json.dumps({
            "verdict": "YES", "confidence_percent": 80,
            "top_evidence_url": "https://www.example-exchange.com/announcements",
            "reasoning": "ok",
        }))
        c.request_resolution(SAMPLE_CLAIM["claim_id"])
        with pytest.raises(Exception):
            c.add_evidence(SAMPLE_CLAIM["claim_id"], "https://x.example/late")

    def test_missing_claim_raises(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        with pytest.raises(Exception):
            c.request_resolution("does-not-exist")
        with pytest.raises(Exception):
            c.get_claim("does-not-exist")
