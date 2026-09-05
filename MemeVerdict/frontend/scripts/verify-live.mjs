// Read-only integration check. Never requests accounts, signs, or sends a transaction.
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const dir = await mkdtemp(join(tmpdir(), 'memeverdict-'));
const timer = setTimeout(() => { console.error('RPC verification timed out'); process.exit(2); }, 120000);
try {
  const output = join(dir, 'client.mjs');
  await build({entryPoints:['src/lib/genlayer.ts'],bundle:true,platform:'node',format:'esm',outfile:output,define:{'import.meta.env':'{}'}});
  const {readGetClaim, readListClaims, waitFinal} = await import(pathToFileURL(output));
  const claim = await readGetClaim('meme-doge-core-api-1147-001');
  assert.equal(claim.status, 'RESOLVED');
  assert.equal(claim.verdict, 'YES');
  assert.equal(claim.evidence_digest, 'a9d26973da816ca0e54267beaa47e3224f09e7f1c10370ae7c47eae622fb45a3');
  assert.ok(claim.reasoning_summary.length > 20);
  console.log('PASS live YES claim, reasoning and exact evidence digest');
  const claims = await readListClaims(0, 100);
  assert.ok(claims.some(c => c.claim_id === claim.claim_id));
  console.log(`PASS explorer returns ${claims.length} real claims`);
  const tx = await waitFinal('0xbb53b48924d406e016b207c4dff77b2b468a9c1db70740740adb262a70bcd183');
  assert.equal(tx.statusName, 'FINALIZED');
  console.log('PASS historical full-consensus transaction finalized successfully');
} finally { clearTimeout(timer); await rm(dir, {recursive:true,force:true}); }
