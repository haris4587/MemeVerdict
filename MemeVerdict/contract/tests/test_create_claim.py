"""Claim-creation and immutability tests for MemeVerdict."""
import json
import pytest

from .conftest import CONTRACT_PATH, SAMPLE_CLAIM


class TestCreateClaimValid:
    def test_create_valid_claim(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        c.create_claim(**SAMPLE_CLAIM)

        assert c.get_claim_count() == 1
        got = c.get_claim(SAMPLE_CLAIM["claim_id"])
        assert got["status"] == "OPEN"
        assert got["verdict"] == "PENDING"
        assert got["token_symbol"] == "DOGEDEMO"
        assert got["category"] == "exchange_listing"
        assert got["question"] == SAMPLE_CLAIM["question"]

    def test_list_by_creator(self, direct_vm, direct_deploy, direct_alice):
        c = direct_deploy(CONTRACT_PATH)
        c.connect(direct_alice).create_claim(**SAMPLE_CLAIM)
        mine = c.list_by_creator("0x" + direct_alice.hex())
        assert len(mine) == 1
        assert mine[0]["claim_id"] == SAMPLE_CLAIM["claim_id"]


class TestValidation:
    """The contract must REJECT vague / underspecified claims."""

    def test_reject_vague_question(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        bad = dict(SAMPLE_CLAIM, question="Will DOGE be huge")  # no ? and too short
        with pytest.raises(Exception):
            c.create_claim(**bad)

    def test_reject_missing_yn_marker(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        bad = dict(SAMPLE_CLAIM, question="This is a long enough statement but not a question.")
        with pytest.raises(Exception):
            c.create_claim(**bad)

    def test_reject_short_criteria(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        bad = dict(SAMPLE_CLAIM, resolution_criteria="Yes if listed.")
        with pytest.raises(Exception):
            c.create_claim(**bad)

    def test_reject_bad_category(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        bad = dict(SAMPLE_CLAIM, category="lambo_prediction")
        with pytest.raises(Exception):
            c.create_claim(**bad)

    def test_reject_empty_sources(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        bad = dict(SAMPLE_CLAIM, authoritative_sources_json="[]")
        with pytest.raises(Exception):
            c.create_claim(**bad)

    def test_reject_non_list_sources(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        bad = dict(SAMPLE_CLAIM, authoritative_sources_json='{"url": "x"}')
        with pytest.raises(Exception):
            c.create_claim(**bad)

    def test_reject_missing_deadline(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        bad = dict(SAMPLE_CLAIM, deadline="")
        with pytest.raises(Exception):
            c.create_claim(**bad)


class TestDuplicates:
    def test_reject_duplicate_claim_id(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        c.create_claim(**SAMPLE_CLAIM)
        with pytest.raises(Exception):
            c.create_claim(**SAMPLE_CLAIM)


class TestImmutability:
    """Claim resolution rules cannot be silently rewritten by ANY method."""

    def test_no_edit_method_exists(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        c.create_claim(**SAMPLE_CLAIM)
        for banned in ("edit_claim", "update_claim", "set_question",
                       "set_criteria", "set_deadline"):
            assert not hasattr(c, banned), (
                f"Contract must not expose {banned}() — claim spec must be immutable"
            )

    def test_add_evidence_does_not_change_rules(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        c.create_claim(**SAMPLE_CLAIM)
        before = c.get_claim(SAMPLE_CLAIM["claim_id"])
        c.add_evidence(SAMPLE_CLAIM["claim_id"], "https://example.com/proof")
        after = c.get_claim(SAMPLE_CLAIM["claim_id"])

        # Immutable fields unchanged
        for k in ("title", "question", "resolution_criteria", "deadline",
                  "authoritative_sources", "category", "token_symbol"):
            assert before[k] == after[k], f"immutable field '{k}' was changed"

        # Only the optional evidence list grew
        assert len(after["optional_evidence"]) == len(before["optional_evidence"]) + 1
