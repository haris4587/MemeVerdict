import { evidenceHref } from "../lib/evidence";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  readGetClaim,
  writeRequestResolution,
  writeAddEvidence,
  waitFinal,
  type Claim,
} from "../lib/genlayer";
import { useWallet, shortAddress } from "../lib/wallet";
import { ContractStatusBanner } from "../components/ContractStatusBanner";

type TxState =
  | { kind: "idle" }
  | { kind: "signing" }
  | { kind: "submitted"; hash: string }
  | { kind: "finalizing"; hash: string }
  | { kind: "done"; hash: string }
  | { kind: "error"; message: string };

function verdictBanner(claim: Claim) {
  const cls =
    claim.verdict === "YES" ? "yes"
    : claim.verdict === "NO" ? "no"
    : claim.verdict === "UNRESOLVED" ? "unresolved"
    : "pending";
  return (
    <div className={`verdict-banner ${cls}`}>
      <div>
        <div className="label">Final verdict</div>
        <div className={`value ${cls}`}>{claim.verdict}</div>
      </div>
      <div style={{ textAlign: "right", color: "var(--text-dim)", fontSize: 13 }}>
        <div>Status</div>
        <div style={{ color: "var(--text)", fontWeight: 600 }}>{claim.status}</div>
      </div>
    </div>
  );
}

export function ClaimDetail() {
  const { claimId = "" } = useParams();
  const w = useWallet();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [resolveTx, setResolveTx] = useState<TxState>({ kind: "idle" });
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceTx, setEvidenceTx] = useState<TxState>({ kind: "idle" });

  async function refresh() {
    setErr(null);
    try {
      const c = await readGetClaim(claimId);
      setClaim(c);
    } catch (e) {
      const m = e as { message?: string };
      setErr(m.message || "Failed to load claim");
    }
  }

  useEffect(() => {
    setClaim(null);
    setErr(null);
    setResolveTx({ kind: "idle" });
    setEvidenceTx({ kind: "idle" });
    if (claimId) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  async function requestResolution() {
    if (!w.address || !claim) return;
    setResolveTx({ kind: "signing" });
    try {
      const hash = await writeRequestResolution(w.address, claim.claim_id);
      setResolveTx({ kind: "submitted", hash });
      setResolveTx({ kind: "finalizing", hash });
      await waitFinal(hash);
      setResolveTx({ kind: "done", hash });
      await refresh();
    } catch (e) {
      const m = e as { message?: string };
      setResolveTx({ kind: "error", message: m.message || "Transaction failed" });
    }
  }

  async function submitEvidence() {
    if (!w.address || !claim || !evidenceUrl.trim()) return;
    setEvidenceTx({ kind: "signing" });
    try {
      const hash = await writeAddEvidence(w.address, claim.claim_id, evidenceUrl.trim());
      setEvidenceTx({ kind: "finalizing", hash });
      await waitFinal(hash);
      setEvidenceTx({ kind: "done", hash });
      setEvidenceUrl("");
      await refresh();
    } catch (e) {
      const m = e as { message?: string };
      setEvidenceTx({ kind: "error", message: m.message || "Transaction failed" });
    }
  }

  return (
    <div>
      <ContractStatusBanner />
      <div style={{ marginBottom: 10 }}>
        <Link to="/claims" className="mono">← All claims</Link>
      </div>

      {err && <div className="notice">{err}</div>}

      {!claim ? (
        <div className="empty">{err ? "Claim unavailable. Refresh to retry." : "Loading claim…"}</div>
      ) : (
        <>
          <h1 style={{ margin: "6px 0 8px", letterSpacing: "-0.01em" }}>{claim.title}</h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            <span className="pill">{claim.token_symbol}</span>
            <span className="pill accent">{claim.category}</span>
            <span className="pill">deadline&nbsp;{claim.deadline}</span>
            <span className="pill mono">{claim.claim_id}</span>
          </div>

          {verdictBanner(claim)}

          <div className="grid two section">
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Immutable claim specification</h3>
              <div className="field">
                <label>Resolution question</label>
                <div>{claim.question}</div>
              </div>
              <div className="field">
                <label>Resolution criteria</label>
                <div style={{ whiteSpace: "pre-wrap" }}>{claim.resolution_criteria}</div>
              </div>
              <div className="field">
                <label>Authoritative sources</label>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {claim.authoritative_sources.map((s) => (
                    <li key={s}><a href={evidenceHref(s)} target="_blank" rel="noreferrer">{s}</a></li>
                  ))}
                </ul>
              </div>
              <div className="field">
                <label>Optional evidence URLs</label>
                {claim.optional_evidence.length === 0 ? (
                  <div className="muted">— none —</div>
                ) : (
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {claim.optional_evidence.map((s) => (
                      <li key={s}><a href={evidenceHref(s)} target="_blank" rel="noreferrer">{s}</a></li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="field">
                <label>Creator</label>
                <div className="mono" title={claim.creator}>{shortAddress(claim.creator)}</div>
              </div>
            </div>

            <div>
              <div className="card">
                <h3 style={{ marginTop: 0 }}>GenLayer consensus</h3>
                {claim.status !== "RESOLVED" ? (
                  <>
                    <p className="muted">
                      Request the Intelligent Contract to run the adjudication
                      pipeline. Validators will independently fetch the
                      authoritative sources, reason about them with an LLM,
                      and reach consensus on <strong>YES</strong>,{" "}
                      <strong>NO</strong>, or <strong>UNRESOLVED</strong>.
                    </p>
                    <button
                      className="btn primary"
                      disabled={!w.isConnected || !w.onCorrectNetwork ||
                        resolveTx.kind === "signing" || resolveTx.kind === "submitted" ||
                        resolveTx.kind === "finalizing"}
                      onClick={requestResolution}
                    >
                      {resolveTx.kind === "signing" ? "Waiting for wallet…"
                        : resolveTx.kind === "finalizing" ? "Consensus pending…"
                        : "Request GenLayer resolution"}
                    </button>
                    {(resolveTx.kind === "finalizing" || resolveTx.kind === "submitted") && (
                      <div className="tx-banner" style={{ marginTop: 12 }}>
                        <span className="dot" />
                        <div>
                          <div>Wallet confirmed → submitted → consensus pending → finalized</div>
                          <div className="hash">{resolveTx.hash}</div>
                        </div>
                      </div>
                    )}
                    {resolveTx.kind === "done" && (
                      <div className="tx-banner" style={{ marginTop: 12, borderColor: "rgba(34,197,94,0.5)" }}>
                        <span className="dot" style={{ background: "var(--good)" }} />
                        <div>
                          <div>Resolution finalized.</div>
                          <div className="hash">{resolveTx.hash}</div>
                        </div>
                      </div>
                    )}
                    {resolveTx.kind === "error" && (
                      <div className="notice" style={{ marginTop: 12 }}>{resolveTx.message}</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="field">
                      <label>Reasoning summary</label>
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {claim.reasoning_summary || "—"}
                      </div>
                    </div>
                    <div className="field">
                      <label>Evidence digest (sha256)</label>
                      <div className="hash">{claim.evidence_digest || "—"}</div>
                    </div>
                    <div className="field">
                      <label>URLs used by the leader validator</label>
                      {claim.leader_evidence_urls.length === 0 ? (
                        <div className="muted">— none —</div>
                      ) : (
                        <ul style={{ paddingLeft: 20, margin: 0 }}>
                          {claim.leader_evidence_urls.map((u) => (
                            <li key={u}><a href={evidenceHref(u)} target="_blank" rel="noreferrer">{u}</a></li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>

              {claim.status !== "RESOLVED" && (
                <div className="card" style={{ marginTop: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Add optional evidence</h3>
                  <p className="muted">
                    Anyone can attach an additional URL that validators may
                    consult. This <strong>does not</strong> change the
                    immutable resolution rules.
                  </p>
                  <div className="field">
                    <input
                      type="text"
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      placeholder="https://…"
                    />
                  </div>
                  <button
                    className="btn"
                    disabled={!w.isConnected || !w.onCorrectNetwork || !evidenceUrl.trim() ||
                      evidenceTx.kind === "signing" || evidenceTx.kind === "finalizing"}
                    onClick={submitEvidence}
                  >
                    {evidenceTx.kind === "finalizing" ? "Submitting…" : "Add evidence"}
                  </button>
                  {evidenceTx.kind === "error" && (
                    <div className="notice" style={{ marginTop: 12 }}>{evidenceTx.message}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
