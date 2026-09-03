import { useWallet, shortAddress, NETWORK_LABEL } from "../lib/wallet";

export function WalletButton() {
  const w = useWallet();

  if (!w.hasMetaMask) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noreferrer"
        className="btn ghost small wallet-button"
      >
        <span className="wallet-status-dot off" />
        Install MetaMask
      </a>
    );
  }

  if (!w.isConnected) {
    return (
      <button
        className="btn primary wallet-button"
        onClick={() => void w.connect()}
        disabled={w.isLoading}
      >
        <span className="wallet-status-dot off" />
        {w.isLoading ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  if (!w.onCorrectNetwork) {
    return (
      <button
        className="btn accent wallet-button"
        onClick={() => void w.switchNetwork()}
        title={"Switch to " + NETWORK_LABEL}
      >
        <span className="wallet-status-dot warn" />
        Switch to {NETWORK_LABEL}
      </button>
    );
  }

  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <span
        className="pill"
        title={NETWORK_LABEL}
        style={{ borderColor: "var(--line-strong)" }}
      >
        <span className="wallet-status-dot" /> {NETWORK_LABEL}
      </span>
      <span className="pill brand mono" title={w.address ?? ""}>
        {shortAddress(w.address)}
      </span>
      <button className="btn ghost small" onClick={w.disconnect}>
        Disconnect
      </button>
    </div>
  );
}
