import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  GENLAYER_CHAIN_ID,
  GENLAYER_CHAIN_ID_HEX,
  GENLAYER_CHAIN_NAME,
  NETWORK_INFO,
} from "./config";

// ─── Ethereum provider types ────────────────────────────────────────────
interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (
    event: string,
    handler: (...args: unknown[]) => void
  ) => void;
}
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const DISCONNECT_FLAG = "memeverdict.wallet.disconnected";

export interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  hasMetaMask: boolean;
  onCorrectNetwork: boolean;
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}

// ─── Low-level helpers ──────────────────────────────────────────────────
function getProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

async function getAccounts(): Promise<string[]> {
  const p = getProvider();
  if (!p) return [];
  try {
    const a = (await p.request({ method: "eth_accounts" })) as string[];
    return a || [];
  } catch {
    return [];
  }
}

async function getChainId(): Promise<string | null> {
  const p = getProvider();
  if (!p) return null;
  try {
    return (await p.request({ method: "eth_chainId" })) as string;
  } catch {
    return null;
  }
}

async function requestAccounts(): Promise<string[]> {
  const p = getProvider();
  if (!p) throw new Error("MetaMask is not installed");
  const a = (await p.request({ method: "eth_requestAccounts" })) as string[];
  return a || [];
}

async function addNetwork(): Promise<void> {
  const p = getProvider();
  if (!p) throw new Error("MetaMask is not installed");
  await p.request({
    method: "wallet_addEthereumChain",
    params: [NETWORK_INFO],
  });
}

async function switchOrAdd(): Promise<void> {
  const p = getProvider();
  if (!p) throw new Error("MetaMask is not installed");
  try {
    await p.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GENLAYER_CHAIN_ID_HEX }],
    });
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    if (e.code === 4902) {
      await addNetwork();
    } else {
      throw new Error(e.message || "Failed to switch network");
    }
  }
}

// ─── Provider component ─────────────────────────────────────────────────
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isLoading: true,
    hasMetaMask: false,
    onCorrectNetwork: false,
  });

  const refresh = useCallback(async () => {
    const p = getProvider();
    if (!p) {
      setState({
        address: null,
        chainId: null,
        isConnected: false,
        isLoading: false,
        hasMetaMask: false,
        onCorrectNetwork: false,
      });
      return;
    }
    const accounts = window.localStorage.getItem(DISCONNECT_FLAG) === "true" ? [] : await getAccounts();
    const chainId = await getChainId();
    const onCorrect = chainId
      ? parseInt(chainId, 16) === GENLAYER_CHAIN_ID
      : false;
    setState({
      address: accounts[0] ?? null,
      chainId,
      isConnected: accounts.length > 0,
      isLoading: false,
      hasMetaMask: true,
      onCorrectNetwork: onCorrect,
    });
  }, []);

  useEffect(() => {
    refresh();
    const p = getProvider();
    if (!p) return;

    const onAccountsChanged = () => refresh();
    const onChainChanged = () => refresh();
    p.on("accountsChanged", onAccountsChanged);
    p.on("chainChanged", onChainChanged);
    return () => {
      p.removeListener("accountsChanged", onAccountsChanged);
      p.removeListener("chainChanged", onChainChanged);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      await requestAccounts();
      window.localStorage.removeItem(DISCONNECT_FLAG);
      const chainId = await getChainId();
      const onCorrect = chainId
        ? parseInt(chainId, 16) === GENLAYER_CHAIN_ID
        : false;
      if (!onCorrect) {
        await switchOrAdd();
      }
    } finally {
      await refresh();
    }
  }, [refresh]);

  const disconnect = useCallback(() => {
    window.localStorage.setItem(DISCONNECT_FLAG, "true");
    setState((s) => ({ ...s, address: null, isConnected: false }));
  }, []);

  const switchNetwork = useCallback(async () => {
    await switchOrAdd();
    await refresh();
  }, [refresh]);

  return (
    <WalletContext.Provider
      value={{ ...state, connect, disconnect, switchNetwork }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// ─── UI helpers ─────────────────────────────────────────────────────────
export function shortAddress(addr: string | null | undefined): string {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export const NETWORK_LABEL = GENLAYER_CHAIN_NAME;
