import { Link } from "react-router-dom";
import { LiveProof } from "../components/LiveProof";

const categories = [
  "Exchange listing",
  "Token burn",
  "Partnership",
  "Chain migration",
  "Holder milestone",
  "Supply change",
  "Team announcement",
  "Feature launch",
];

export function Landing() {
  return (
    <div className="landing-page">
      <section className="hero hero-protocol">
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <div className="eyebrow hero-eyebrow"><span /> Built on GenLayer Intelligent Contracts</div>
        <h1>
          Turn meme-coin claims into
          <span> auditable verdicts.</span>
        </h1>
        <p className="lead">
          MemeVerdict locks precise resolution rules, gathers authoritative web
          evidence, and lets GenLayer validators decide whether a real-world
          crypto event actually happened.
        </p>
        <div className="cta">
          <Link to="/create" className="btn primary hero-primary">Create a claim</Link>
          <Link to="/claims" className="btn ghost">Explore live claims</Link>
        </div>
        <div className="hero-trust-row">
          <span><i className="trust-icon">✓</i> Immutable resolution rules</span>
          <span><i className="trust-icon">✓</i> Validator consensus</span>
          <span><i className="trust-icon">✓</i> SHA-256 evidence digest</span>
        </div>
      </section>

      <LiveProof />

      <section className="section process-section">
        <div className="section-kicker">How it works</div>
        <div className="section-heading-row">
          <div>
            <h2 className="display-section-title">From claim to final verdict.</h2>
            <p className="section-lead max-copy">
              Every important decision is separated into a clear step, so a
              reviewer can audit what was defined, what was read, and what the
              validator network agreed on.
            </p>
          </div>
        </div>
        <div className="process-grid">
          {[
            ["01", "Define", "Write an exact yes/no event question with a deadline."],
            ["02", "Lock", "Resolution criteria and authoritative sources become immutable."],
            ["03", "Retrieve", "Validators fetch the declared evidence directly from the web."],
            ["04", "Reason", "Independent LLM-assisted adjudication runs under GenLayer consensus."],
            ["05", "Finalize", "YES, NO, or UNRESOLVED is stored with reasoning and an evidence digest."],
          ].map(([n, title, copy]) => (
            <article className="process-card" key={n}>
              <div className="process-number">{n}</div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section grid two feature-grid">
        <article className="feature-panel feature-panel-large">
          <div className="section-kicker">Why GenLayer</div>
          <h2>Web-aware adjudication without a single oracle.</h2>
          <p>
            Traditional smart contracts cannot independently inspect a Binance
            announcement, a GitHub release, or a blockchain explorer page. A
            centralized oracle can, but then the verdict depends on one party.
          </p>
          <p>
            MemeVerdict uses GenLayer so validators can independently retrieve
            evidence, reason over it, and agree only on stable decision fields.
          </p>
          <div className="feature-rule">
            <span>Consensus output</span>
            <strong>YES · NO · UNRESOLVED</strong>
          </div>
        </article>

        <article className="feature-panel">
          <div className="section-kicker">Evidence trust boundary</div>
          <h2>Better sources carry more weight.</h2>
          <ol className="trust-list">
            <li><span>1</span><div><strong>Primary authoritative source</strong><small>Official exchange, project, or API evidence</small></div></li>
            <li><span>2</span><div><strong>Independent authoritative source</strong><small>Explorer or independently verifiable record</small></div></li>
            <li><span>3</span><div><strong>High-quality secondary source</strong><small>Useful context, never enough to fabricate certainty</small></div></li>
          </ol>
          <div className="unresolved-note">Insufficient evidence → <strong>UNRESOLVED</strong>, not a guess.</div>
        </article>
      </section>

      <section className="section category-section">
        <div className="section-kicker">Supported events</div>
        <h2 className="display-section-title">Built for checkable meme-coin events.</h2>
        <div className="category-cloud">
          {categories.map((category) => <span key={category}>{category}</span>)}
          <span>Custom event</span>
        </div>
      </section>

      <section className="section final-cta-panel">
        <div>
          <div className="section-kicker">Start with the rules</div>
          <h2>Make the claim precise before anyone argues about the outcome.</h2>
        </div>
        <div className="final-cta-actions">
          <Link to="/create" className="btn primary">Create a MemeVerdict claim</Link>
          <Link to="/claims/meme-doge-core-api-1147-001" className="btn ghost">View the live YES proof</Link>
        </div>
      </section>
    </div>
  );
}
