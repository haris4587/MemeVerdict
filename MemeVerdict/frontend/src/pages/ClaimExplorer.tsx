import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { readListClaims, type Claim } from "../lib/genlayer";
import { ContractStatusBanner } from "../components/ContractStatusBanner";
import { hasContractConfigured } from "../lib/config";

function verdictPill(v: Claim["verdict"]) {
  const cls =
    v === "YES" ? "pill good"
    : v === "NO" ? "pill bad"
    : v === "UNRESOLVED" ? "pill warn"
    : "pill";
  return <span className={cls}>{v}</span>;
}

function statusPill(s: Claim["status"]) {
  const cls = s === "RESOLVED" ? "pill accent" : s === "RESOLUTION_REQUESTED" ? "pill brand" : "pill";
  return <span className={cls}>{s.replace("_", " ")}</span>;
}

export function ClaimExplorer() {
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!hasContractConfigured()) {
      setClaims([]);
      return;
    }
    (async () => {
      try {
        const list = await readListClaims(0, 100);
        setClaims(list);
      } catch (e) {
        const m = e as { message?: string };
        setErr(m.message || "Failed to load claims");
        setClaims([]);
      }
    })();
  }, []);

  return (
    <div>
      <div className="section" style={{ marginTop: 0 }}>
        <h1 className="section-title">Claim explorer</h1>
        <p className="section-lead">
          The first 100 claims stored on this MemeVerdict deployment.
        </p>
      </div>

      <ContractStatusBanner />

      {err && <div className="notice" style={{ marginBottom: 12 }}>{err}</div>}

      {err ? <div className="empty">Claims could not be loaded. Refresh to retry.</div> : claims === null ? (
        <div className="empty">Loading claims from the Intelligent Contract…</div>
      ) : claims.length === 0 ? (
        <div className="empty">
          No claims yet. <Link to="/create">Create the first one →</Link>
        </div>
      ) : (
        <div className="claim-grid">
          <div
            className="claim-row"
            style={{ background: "transparent", border: "none", padding: "4px 16px", color: "var(--text-mute)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}
          >
            <div>Title</div>
            <div>Token</div>
            <div>Category</div>
            <div>Status</div>
            <div>Verdict</div>
          </div>
          {claims.map((c) => (
            <Link to={`/claims/${c.claim_id}`} key={c.claim_id} style={{ color: "inherit" }}>
              <div className="claim-row">
                <div className="title">
                  {c.title}
                  <small>
                    <code className="mono">{c.claim_id}</code>
                    {"  ·  "}
                    deadline&nbsp;{c.deadline}
                  </small>
                </div>
                <div><span className="pill">{c.token_symbol}</span></div>
                <div><span className="mono">{c.category}</span></div>
                <div>{statusPill(c.status)}</div>
                <div>{verdictPill(c.verdict)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
