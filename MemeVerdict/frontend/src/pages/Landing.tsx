import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div>
      <section className="hero">
        <span className="pill accent">Built on GenLayer · Intelligent Contracts</span>
        <h1>Verifiable verdicts on real-world meme-coin events.</h1>
        <p className="lead">
          MemeVerdict uses GenLayer consensus to decide whether clearly
          defined meme-coin events actually happened — token burns, exchange
          listings, partnerships, holder milestones and more. Every claim is
          adjudicated on real web evidence by a quorum of validators, not by
          a single API or a centralized oracle.
        </p>
        <div className="cta">
          <Link to="/create" className="btn primary">Create a Claim</Link>
          <Link to="/claims" className="btn ghost">Browse Claims</Link>
        </div>

        <div className="flow-steps">
          <div className="flow-step"><span className="num">1</span>Define event</div>
          <div className="flow-step"><span className="num">2</span>Lock resolution rules</div>
          <div className="flow-step"><span className="num">3</span>Submit evidence</div>
          <div className="flow-step"><span className="num">4</span>GenLayer consensus</div>
          <div className="flow-step"><span className="num">5</span>Final verdict</div>
        </div>
      </section>

      <section className="section grid three">
        <div className="card">
          <h3>Immutable resolution rules</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            No vague questions. Every claim locks in an exact yes/no
            question, resolution criteria, deadline and list of
            authoritative sources at the moment it is created — none of
            those fields can be silently rewritten later.
          </p>
        </div>
        <div className="card">
          <h3>Consensus-graded evidence</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            Validators fetch the pages themselves and independently reason
            about the evidence with an LLM. The verdict only stores if
            enough validators agree on the decision. Reasoning text is kept
            but never compared — the contract compares stable decision
            fields.
          </p>
        </div>
        <div className="card">
          <h3>Auditable, later</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            Every resolved claim stores an SHA-256 digest of the retrieved
            evidence, the URLs the leader used, the reasoning summary, and
            the final verdict — so anyone can re-examine the decision even
            if the original webpages later change.
          </p>
        </div>
      </section>

      <section className="section card">
        <h2 style={{ marginTop: 0 }}>Why an Intelligent Contract?</h2>
        <p className="muted">
          A traditional smart contract cannot ask <em>"did Binance actually
          list this token?"</em> — it has no access to the outside world.
          A single oracle can, but then a single party can be corrupted. A
          GenLayer Intelligent Contract lets many validators independently
          <strong> read the same authoritative pages, reason about them
          with an LLM, and only accept the verdict if the network agrees
          on the decision</strong>. That is the exact primitive
          MemeVerdict needs.
        </p>
      </section>

      <section className="section grid two">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Supported event categories</h3>
          <ul style={{ paddingLeft: 20, color: "var(--text-dim)", lineHeight: 1.9 }}>
            <li>Exchange Listing</li>
            <li>Token Burn</li>
            <li>Partnership</li>
            <li>Blockchain Migration</li>
            <li>Holder Milestone</li>
            <li>Supply Change</li>
            <li>Official Team Announcement</li>
            <li>Feature / Product Launch</li>
            <li>Custom Meme-Coin Event</li>
          </ul>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Evidence trust boundary</h3>
          <p className="muted">
            The contract prefers, in order:
          </p>
          <ol style={{ paddingLeft: 20, color: "var(--text-dim)", lineHeight: 1.7 }}>
            <li>Primary authoritative source (e.g. official exchange announcement)</li>
            <li>Independent authoritative source</li>
            <li>High-quality secondary source</li>
          </ol>
          <p className="muted">
            Random social posts, anonymous replies and low-quality blogs
            <strong> cannot</strong> flip a verdict on their own. If the
            evidence is missing or contradictory, the contract returns
            <span className="pill warn" style={{ marginLeft: 8 }}>UNRESOLVED</span>
            instead of forcing a YES or NO.
          </p>
        </div>
      </section>
    </div>
  );
}
