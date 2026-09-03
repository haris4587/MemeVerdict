import { Routes, Route, NavLink } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { CreateClaim } from "./pages/CreateClaim";
import { ClaimExplorer } from "./pages/ClaimExplorer";
import { ClaimDetail } from "./pages/ClaimDetail";
import { WalletButton } from "./components/WalletButton";

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="brand">
          <span className="brand-mark">◇</span>
          <span className="brand-text">
            Meme<span className="brand-accent">Verdict</span>
          </span>
        </NavLink>
        <nav className="app-nav">
          <NavLink to="/claims">Claims</NavLink>
          <NavLink to="/create">Create</NavLink>
          <a
            href="https://docs.genlayer.com/"
            target="_blank"
            rel="noreferrer"
          >
            GenLayer&nbsp;Docs
          </a>
        </nav>
        <WalletButton />
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/claims" element={<ClaimExplorer />} />
          <Route path="/create" element={<CreateClaim />} />
          <Route path="/claims/:claimId" element={<ClaimDetail />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div>
          Built on <a href="https://genlayer.com" target="_blank" rel="noreferrer">GenLayer</a>{" "}
          — Intelligent Contracts with real-world reasoning.
        </div>
        <div className="muted">
          MemeVerdict is an adjudication layer. It does <em>not</em> take
          bets and does not offer financial advice.
        </div>
      </footer>
    </div>
  );
}
