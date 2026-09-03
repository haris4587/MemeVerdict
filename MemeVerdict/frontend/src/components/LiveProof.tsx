import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { readGetClaim, readGetClaimCount, type Claim } from "../lib/genlayer";
import { MEMEVERDICT_CONTRACT_ADDRESS } from "../lib/config";

const LIVE_CLAIM_ID = "meme-doge-core-api-1147-001";

function verdictClass(verdict: Claim["verdict"]) {
  if (verdict === "YES") return "good";
  if (verdict === "NO") return "bad";
  if (verdict === "UNRESOLVED") return "warn";
  return "";
}

export function LiveProof() {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [claimCount, setClaimCount] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([readGetClaim(LIVE_CLAIM_ID), readGetClaimCount()])
      .then(([liveClaim, count]) => {
        if (!active) return;
        setClaim(liveClaim);
        setClaimCount(count);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="live-proof-shell">
      <div className="live-proof-copy">
        <div className="eyebrow">Live contract proof</div>
        <h2>Not a mockup. Read the verdict from GenLayer.</h2>
        <p>
          This panel queries the deployed MemeVerdict Intelligent Contract.
          The showcased claim was adjudicated against the official Dogecoin
          GitHub API and finalized through GenLayer consensus.
        </p>
        <div className="contract-chip-row">
          <span className="contract-chip-label">Contract</span>
          <code className="contract-chip">{MEMEVERDICT_CONTRACT_ADDRESS}</code>
        </div>
        <div className="proof-actions">
          <Link className="btn primary" to={`/claims/${LIVE_CLAIM_ID}`}>
            Inspect live verdict
          </Link>
          <Link className="btn ghost" to="/claims">
            Open claim explorer
          </Link>
        </div>
      </div>

      <div className="live-proof-card">
        {error ? (
          <div className="proof-loading">
            <span className="proof-dot warn" />
            Live RPC is temporarily unavailable. Open the claim directly to retry.
          </div>
        ) : !claim ? (
          <div className="proof-loading">
            <span className="proof-dot" />
            Reading live contract state…
          </div>
        ) : (
          <>
            <div className="proof-topline">
              <span className="pill accent">On-chain claim</span>
              <span className="network-live"><i /> GenLayer Studio</span>
            </div>
            <div className="proof-token-row">
              <div className="proof-token-icon">Ð</div>
              <div>
                <div className="proof-title">{claim.title}</div>
                <div className="proof-meta">{claim.token_symbol} · {claim.category.replaceAll("_", " ")}</div>
              </div>
            </div>
            <div className="proof-verdict-row">
              <div>
                <span className="proof-label">Consensus verdict</span>
                <div className={`proof-verdict ${verdictClass(claim.verdict)}`}>{claim.verdict}</div>
              </div>
              <div className="proof-side-stat">
                <span className="proof-label">Status</span>
                <strong>{claim.status}</strong>
              </div>
            </div>
            <div className="proof-reasoning">
              <span className="proof-label">Validator reasoning</span>
              <p>{claim.reasoning_summary || "Reasoning pending."}</p>
            </div>
            <div className="proof-foot">
              <div>
                <span className="proof-label">Evidence digest</span>
                <code>{claim.evidence_digest ? `${claim.evidence_digest.slice(0, 16)}…${claim.evidence_digest.slice(-8)}` : "—"}</code>
              </div>
              <div className="proof-side-stat">
                <span className="proof-label">Claims on deployment</span>
                <strong>{claimCount ?? "—"}</strong>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
