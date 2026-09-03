/**
 * MemeVerdict — runtime configuration read from Vite env variables.
 *
 * All contract-level configuration is exposed via NEXT_/VITE_ style
 * environment variables so a new deployment only requires editing
 * `.env` — no source code changes.
 */
export const GENLAYER_RPC_URL: string =
  import.meta.env.VITE_GENLAYER_RPC_URL || "https://studio.genlayer.com/api";

export const GENLAYER_CHAIN_ID: number = parseInt(
  import.meta.env.VITE_GENLAYER_CHAIN_ID || "61999",
  10
);

export const GENLAYER_CHAIN_ID_HEX: string = `0x${GENLAYER_CHAIN_ID.toString(
  16
).toUpperCase()}`;

export const GENLAYER_CHAIN_NAME: string =
  import.meta.env.VITE_GENLAYER_CHAIN_NAME || "GenLayer Studio";

export const GENLAYER_SYMBOL: string =
  import.meta.env.VITE_GENLAYER_SYMBOL || "GEN";

export const MEMEVERDICT_CONTRACT_ADDRESS: string =
  (import.meta.env.VITE_MEMEVERDICT_CONTRACT_ADDRESS as string) ||
  "0x96a9B51C30a0Af126C7d4594489e2940F1f44621";

export const NETWORK_INFO = {
  chainId: GENLAYER_CHAIN_ID_HEX,
  chainName: GENLAYER_CHAIN_NAME,
  nativeCurrency: {
    name: GENLAYER_SYMBOL,
    symbol: GENLAYER_SYMBOL,
    decimals: 18,
  },
  rpcUrls: [GENLAYER_RPC_URL],
  blockExplorerUrls: [],
};

export function hasContractConfigured(): boolean {
  return typeof MEMEVERDICT_CONTRACT_ADDRESS === "string" &&
    MEMEVERDICT_CONTRACT_ADDRESS.startsWith("0x") &&
    MEMEVERDICT_CONTRACT_ADDRESS.length >= 40;
}
