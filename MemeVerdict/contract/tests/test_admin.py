"""Owner / pause guardrails."""
import pytest
from .conftest import CONTRACT_PATH, SAMPLE_CLAIM


class TestPause:
    def test_owner_can_pause_and_unpause(self, direct_vm, direct_deploy, direct_owner):
        c = direct_deploy(CONTRACT_PATH)  # deployed by owner
        assert c.is_paused() is False
        c.set_paused(True)
        assert c.is_paused() is True
        c.set_paused(False)
        assert c.is_paused() is False

    def test_nonowner_cannot_pause(self, direct_vm, direct_deploy, direct_alice):
        c = direct_deploy(CONTRACT_PATH)
        with pytest.raises(Exception):
            c.connect(direct_alice).set_paused(True)

    def test_paused_blocks_new_claims(self, direct_vm, direct_deploy):
        c = direct_deploy(CONTRACT_PATH)
        c.set_paused(True)
        with pytest.raises(Exception):
            c.create_claim(**SAMPLE_CLAIM)


class TestOwnership:
    def test_transfer_ownership(self, direct_vm, direct_deploy, direct_alice):
        c = direct_deploy(CONTRACT_PATH)
        new_owner = "0x" + direct_alice.hex()
        c.transfer_ownership(new_owner)
        assert c.get_owner().lower() == new_owner.lower()
