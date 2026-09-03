import { hasContractConfigured, MEMEVERDICT_CONTRACT_ADDRESS } from "../lib/config";

/**
 * Shown at the top of pages that require an on-chain contract to be
 * configured.  Doubles as a hint to the developer during first-time
 * deploy.
 */
export function ContractStatusBanner() {
  if (hasContractConfigured()) return null;
  return (
    <div className="notice" style={{ marginBottom: 20 }}>
      <strong>MemeVerdict contract address is not configured.</strong>
      <div style={{ marginTop: 4 }}>
        Set <code className="mono">VITE_MEMEVERDICT_CONTRACT_ADDRESS</code>{" "}
        in your <code className="mono">.env</code> file after deploying{" "}
        <code className="mono">contract/meme_verdict.py</code>. The frontend
        will read from that address for both listing claims and writing new
        ones — see <code className="mono">docs/deployment.md</code>.
      </div>
      {MEMEVERDICT_CONTRACT_ADDRESS && (
        <div className="hash" style={{ marginTop: 6 }}>
          Current value: {MEMEVERDICT_CONTRACT_ADDRESS}
        </div>
      )}
    </div>
  );
}
