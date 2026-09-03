/**
 * Thin wrapper around genlayer-js that produces a browser-signable
 * client for MemeVerdict transactions.  All contract calls go through
 * here, so a future migration (e.g. new SDK version, new chain) can
 * happen in one place.
 */
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { MEMEVERDICT_CONTRACT_ADDRESS } from "./config";

type Address = `0x${string}`;

export function createReadClient() {
  return createClient({ chain: studionet as never });
}

export function createSigningClient(account: string) {
  return createClient({
    chain: studionet as never,
    account: account as Address,
  });
}

export function contractAddress(): Address {
  if (!MEMEVERDICT_CONTRACT_ADDRESS) {
    throw new Error(
      "MemeVerdict contract address not configured. " +
        "Set VITE_MEMEVERDICT_CONTRACT_ADDRESS in your .env file."
    );
  }
  return MEMEVERDICT_CONTRACT_ADDRESS as Address;
}

// ─── Reads ──────────────────────────────────────────────────────────────
export async function readGetClaimCount(): Promise<number> {
  const client = createReadClient();
  const res = (await client.readContract({
    address: contractAddress(),
    functionName: "get_claim_count",
    args: [],
  })) as unknown as number;
  return Number(res);
}

export async function readListClaims(offset = 0, limit = 50) {
  const client = createReadClient();
  const res = await client.readContract({
    address: contractAddress(),
    functionName: "list_claims",
    args: [offset, limit],
  });
  return res as unknown as Claim[];
}

export async function readGetClaim(claimId: string) {
  const client = createReadClient();
  const res = await client.readContract({
    address: contractAddress(),
    functionName: "get_claim",
    args: [claimId],
  });
  return res as unknown as Claim;
}

export async function readAllowedCategories(): Promise<string[]> {
  const client = createReadClient();
  const res = await client.readContract({
    address: contractAddress(),
    functionName: "allowed_categories",
    args: [],
  });
  return res as unknown as string[];
}

// ─── Writes ─────────────────────────────────────────────────────────────
export interface CreateClaimInput {
  claim_id: string;
  title: string;
  token_name: string;
  token_symbol: string;
  category: string;
  question: string;
  resolution_criteria: string;
  deadline: string;
  authoritative_sources_json: string;
  optional_evidence_json: string;
}

export async function writeCreateClaim(account: string, input: CreateClaimInput) {
  const client = createSigningClient(account);
  const hash = await client.writeContract({
    address: contractAddress(),
    functionName: "create_claim",
    args: [
      input.claim_id,
      input.title,
      input.token_name,
      input.token_symbol,
      input.category,
      input.question,
      input.resolution_criteria,
      input.deadline,
      input.authoritative_sources_json,
      input.optional_evidence_json,
    ],
    value: 0n,
  });
  return hash as string;
}

export async function writeRequestResolution(account: string, claimId: string) {
  const client = createSigningClient(account);
  const hash = await client.writeContract({
    address: contractAddress(),
    functionName: "request_resolution",
    args: [claimId],
    value: 0n,
  });
  return hash as string;
}

export async function writeAddEvidence(
  account: string,
  claimId: string,
  url: string
) {
  const client = createSigningClient(account);
  const hash = await client.writeContract({
    address: contractAddress(),
    functionName: "add_evidence",
    args: [claimId, url],
    value: 0n,
  });
  return hash as string;
}

export async function waitFinal(hash: string) {
  const client = createReadClient();
  // waitForDecision waits for a materialized decision; waitForFinalization
  // additionally waits for final fee settlement.
  if (typeof (client as { waitForFinalization?: unknown }).waitForFinalization === "function") {
    return await (client as unknown as {
      waitForFinalization: (a: { hash: string }) => Promise<unknown>;
    }).waitForFinalization({ hash });
  }
  return await (client as unknown as {
    waitForDecision: (a: { hash: string }) => Promise<unknown>;
  }).waitForDecision({ hash });
}

// ─── Types ──────────────────────────────────────────────────────────────
export interface Claim {
  claim_id: string;
  title: string;
  token_name: string;
  token_symbol: string;
  category: string;
  question: string;
  resolution_criteria: string;
  deadline: string;
  authoritative_sources: string[];
  optional_evidence: string[];
  creator: string;
  created_at: number;
  status: "OPEN" | "RESOLUTION_REQUESTED" | "RESOLVED";
  verdict: "PENDING" | "YES" | "NO" | "UNRESOLVED";
  reasoning_summary: string;
  evidence_digest: string;
  resolved_at: number;
  leader_evidence_urls: string[];
}
