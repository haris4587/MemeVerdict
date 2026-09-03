import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../lib/wallet";
import { ContractStatusBanner } from "../components/ContractStatusBanner";
import { writeCreateClaim, waitFinal } from "../lib/genlayer";
import { hasContractConfigured } from "../lib/config";

const CATEGORIES = [
  { id: "exchange_listing", label: "Exchange Listing" },
  { id: "token_burn", label: "Token Burn" },
  { id: "partnership", label: "Partnership" },
  { id: "blockchain_migration", label: "Blockchain Migration" },
  { id: "holder_milestone", label: "Holder Milestone" },
  { id: "supply_change", label: "Supply Change" },
  { id: "team_announcement", label: "Team Announcement" },
  { id: "feature_launch", label: "Feature Launch" },
  { id: "custom", label: "Custom Meme-Coin Event" },
];

type TxStatus =
  | { kind: "idle" }
  | { kind: "signing" }
  | { kind: "submitted"; hash: string }
  | { kind: "finalizing"; hash: string }
  | { kind: "done"; hash: string }
  | { kind: "error"; message: string };

export function CreateClaim() {
  const w = useWallet();
  const navigate = useNavigate();

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [category, setCategory] = useState("exchange_listing");
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [criteria, setCriteria] = useState("");
  const [deadline, setDeadline] = useState("");
  const [sourcesText, setSourcesText] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [status, setStatus] = useState<TxStatus>({ kind: "idle" });

  const claimId = useMemo(() => {
    const slug = (title || tokenSymbol || "claim")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const salt = Math.random().toString(36).slice(2, 8);
    return `${slug}-${salt}`;
  }, [title, tokenSymbol]);

  const sourcesArray = useMemo(
    () =>
      sourcesText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [sourcesText]
  );

  const evidenceArray = useMemo(
    () =>
      evidenceText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [evidenceText]
  );

  const preview = useMemo(
    () =>
      JSON.stringify(
        {
          claim_id: claimId,
          title,
          token_name: tokenName,
          token_symbol: tokenSymbol.toUpperCase(),
          category,
          question,
          resolution_criteria: criteria,
          deadline,
          authoritative_sources: sourcesArray,
          optional_evidence: evidenceArray,
        },
        null,
        2
      ),
    [claimId, title, tokenName, tokenSymbol, category, question, criteria, deadline, sourcesArray, evidenceArray]
  );

  const canSubmit =
    hasContractConfigured() &&
    w.isConnected &&
    w.onCorrectNetwork &&
    title.length >= 6 &&
    tokenName.length >= 1 &&
    tokenSymbol.length >= 1 &&
    question.length >= 20 &&
    question.trim().endsWith("?") &&
    criteria.length >= 20 &&
    deadline.length >= 4 &&
    sourcesArray.length >= 1 &&
    status.kind !== "signing" &&
    status.kind !== "submitted" &&
    status.kind !== "finalizing";

  async function submit() {
    if (!w.address) return;
    setStatus({ kind: "signing" });
    try {
      const hash = await writeCreateClaim(w.address, {
        claim_id: claimId,
        title: title.trim(),
        token_name: tokenName.trim(),
        token_symbol: tokenSymbol.trim().toUpperCase(),
        category,
        question: question.trim(),
        resolution_criteria: criteria.trim(),
        deadline: deadline.trim(),
        authoritative_sources_json: JSON.stringify(sourcesArray),
        optional_evidence_json: JSON.stringify(evidenceArray),
      });
      setStatus({ kind: "submitted", hash });
      setStatus({ kind: "finalizing", hash });
      await waitFinal(hash);
      setStatus({ kind: "done", hash });
      setTimeout(() => navigate(`/claims/${claimId}`), 700);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setStatus({ kind: "error", message: e.message || "Transaction failed" });
    }
  }

  return (
    <div>
      <div className="section" style={{ marginTop: 0 }}>
        <h1 className="section-title">Create a MemeVerdict claim</h1>
        <p className="section-lead">
          Define an event with resolution rules that are precise enough for a
          quorum of independent validators to reach the same verdict. Vague
          claims will be rejected by the contract.
        </p>
      </div>

      <ContractStatusBanner />

      {!w.isConnected && (
        <div className="notice" style={{ marginBottom: 16 }}>
          Connect your wallet to submit this transaction. The form below is
          fully usable while disconnected — the <em>Submit</em> button will
          light up once you connect.
        </div>
      )}

      <div className="grid two">
        <div className="card">
          <div className="field">
            <label>Token name</label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="e.g. DogeDemo"
            />
          </div>
          <div className="field">
            <label>Token symbol</label>
            <input
              type="text"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              placeholder="e.g. DOGEDEMO"
            />
          </div>
          <div className="field">
            <label>Event category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Claim title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Did Example Exchange list DOGEDEMO by 2026-09-30?"
            />
          </div>
          <div className="field">
            <label>Exact resolution question (yes/no)</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Did Example Exchange officially list DOGEDEMO for spot trading on or before 2026-09-30?"
            />
            <div className="hint">
              Must end with a “?” and unambiguously describe the event, the
              subject and the deadline.
            </div>
          </div>
          <div className="field">
            <label>Resolution criteria</label>
            <textarea
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="YES only if an official exchange announcement or market page confirms spot trading was live before the deadline. NO if the exchange or the project confirm no such listing occurred by the deadline. UNRESOLVED if evidence is insufficient."
            />
            <div className="hint">
              Spell out exactly what evidence would produce a YES, a NO and
              an UNRESOLVED verdict.
            </div>
          </div>
          <div className="field">
            <label>Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Authoritative sources</label>
            <textarea
              value={sourcesText}
              onChange={(e) => setSourcesText(e.target.value)}
              placeholder={"https://www.example-exchange.com/announcements\nhttps://www.example-exchange.com/markets/DOGEDEMO"}
            />
            <div className="hint">
              One URL per line (or comma-separated). Validators may only
              trust these + officially-recognized secondary sources.
            </div>
          </div>
          <div className="field">
            <label>Optional evidence URLs</label>
            <textarea
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
              placeholder="Optional — extra URLs (blog posts, tweets, explorer transactions)"
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Preview</h3>
          <p className="muted" style={{ marginTop: -6 }}>
            Everything below is written to the contract exactly as shown, and
            the underlined fields become <strong>immutable</strong> once the
            claim is created.
          </p>
          <div className="preview">{preview}</div>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button
              className="btn primary"
              disabled={!canSubmit}
              onClick={submit}
            >
              {status.kind === "signing" ? "Waiting for wallet…"
                : status.kind === "submitted" ? "Submitted"
                : status.kind === "finalizing" ? "Consensus pending…"
                : status.kind === "done" ? "Done"
                : "Submit claim"}
            </button>
            <span className="muted" style={{ fontSize: 12 }}>
              claim_id: <code className="mono">{claimId}</code>
            </span>
          </div>

          {status.kind === "submitted" || status.kind === "finalizing" ? (
            <div className="tx-banner" style={{ marginTop: 12 }}>
              <span className="dot" />
              <div>
                <div>Transaction submitted — waiting for GenLayer consensus.</div>
                <div className="hash">{status.hash}</div>
              </div>
            </div>
          ) : null}
          {status.kind === "done" && (
            <div className="tx-banner" style={{ marginTop: 12, borderColor: "rgba(34,197,94,0.5)" }}>
              <span className="dot" style={{ background: "var(--good)" }} />
              <div>
                <div>Claim finalized on-chain.</div>
                <div className="hash">{status.hash}</div>
              </div>
            </div>
          )}
          {status.kind === "error" && (
            <div className="notice" style={{ marginTop: 12 }}>
              {status.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
