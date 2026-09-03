import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { WalletProvider } from "./lib/wallet";
import "./styles/global.css";
import "./styles/site.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <WalletProvider>
        <App />
      </WalletProvider>
    </HashRouter>
  </React.StrictMode>
);
