import { Routes, Route, NavLink } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { CreateClaim } from "./pages/CreateClaim";
import { ClaimExplorer } from "./pages/ClaimExplorer";
import { ClaimDetail } from "./pages/ClaimDetail";
import { WalletButton } from "./components/WalletButton";
import { MEMEVERDICT_CONTRACT_ADDRESS } from "./lib/config";

function shortContract(address: string) {
  return address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "Not configured";
}

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="brand" aria-label="MemeVerdict home">
          <span className="brand-mark"><i /></span>
          <span className="brand-text">Meme<span className="brand-accent">Verdict</span></span>
        </NavLink>
        <nav className="app-nav">
          <NavLink to="/claims">Claims</NavLink>
          <NavLink to="/create">Create claim</NavLink>
          <a href="https://github.com/haris4587/MemeVerdict" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <WalletButton />
      </header>

      <div className="network-strip">
        <span className="network-live"><i /> GenLayer Studio</span>
        <span className="network-contract">Contract <code>{shortContract(MEMEVERDICT_CONTRACT_ADDRESS)}</code></span>
      </div>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/claims" element={<ClaimExplorer />} />
          <Route path="/create" element={<CreateClaim />} />
          <Route path="/claims/:claimId" element={<ClaimDetail />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="footer-brand-row">
          <span className="footer-brand">MemeVerdict</span>
          <span>Verifiable real-world event adjudication on GenLayer.</span>
        </div>
        <div className="footer-links">
          <a href="https://genlayer.com" target="_blank" rel="noreferrer">GenLayer</a>
          <a href="https://github.com/haris4587/MemeVerdict" target="_blank" rel="noreferrer">Source</a>
          <NavLink to="/claims">Claims</NavLink>
        </div>
        <div className="footer-note">MemeVerdict is an adjudication layer. No betting, wagering, token payouts, or financial advice.</div>
      </footer>
    </div>
  );
}
