# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
MemeVerdict — a decentralized adjudication Intelligent Contract for
real-world meme-coin events.

Users create claims with immutable resolution rules (question,
resolution criteria, deadline, authoritative sources).  When a
resolution is requested, GenLayer validators fetch web evidence,
reason about it with an LLM, and reach consensus on a structured
verdict:

    YES         event verifiably occurred
    NO          event verifiably did NOT occur
    UNRESOLVED  evidence insufficient or contradictory

MemeVerdict deliberately contains NO betting, wagering, odds or
payout logic — it is a pure adjudication layer that later projects
(e.g. ClearMarket) can settle prediction markets against.
"""

import json
import hashlib
from dataclasses import dataclass

from genlayer import *
import genlayer.gl.vm as glvm


# ---------------------------------------------------------------------------
# Event categories accepted by the contract.  Kept as a set of string
# constants (not an Enum) so it is trivial to serialize into JSON, cross
# language boundaries, and extend in future upgrades.
# ---------------------------------------------------------------------------
CATEGORY_EXCHANGE_LISTING = "exchange_listing"
CATEGORY_TOKEN_BURN       = "token_burn"
CATEGORY_PARTNERSHIP      = "partnership"
CATEGORY_MIGRATION        = "blockchain_migration"
CATEGORY_HOLDER_MILESTONE = "holder_milestone"
CATEGORY_SUPPLY_CHANGE    = "supply_change"
CATEGORY_ANNOUNCEMENT     = "team_announcement"
CATEGORY_FEATURE_LAUNCH   = "feature_launch"
CATEGORY_CUSTOM           = "custom"

ALLOWED_CATEGORIES = {
    CATEGORY_EXCHANGE_LISTING,
    CATEGORY_TOKEN_BURN,
    CATEGORY_PARTNERSHIP,
    CATEGORY_MIGRATION,
    CATEGORY_HOLDER_MILESTONE,
    CATEGORY_SUPPLY_CHANGE,
    CATEGORY_ANNOUNCEMENT,
    CATEGORY_FEATURE_LAUNCH,
    CATEGORY_CUSTOM,
}


# ---------------------------------------------------------------------------
# Lifecycle states.  A claim can only ever move forward:
#   OPEN → RESOLUTION_REQUESTED → RESOLVED
# ---------------------------------------------------------------------------
STATUS_OPEN                 = "OPEN"
STATUS_RESOLUTION_REQUESTED = "RESOLUTION_REQUESTED"
STATUS_RESOLVED             = "RESOLVED"

VERDICT_PENDING    = "PENDING"
VERDICT_YES        = "YES"
VERDICT_NO         = "NO"
VERDICT_UNRESOLVED = "UNRESOLVED"


# ---------------------------------------------------------------------------
# Storage records
# ---------------------------------------------------------------------------
@allow_storage
@dataclass
class Claim:
    # Immutable specification (locked at creation)
    claim_id: str
    title: str
    token_name: str
    token_symbol: str
    category: str
    question: str                # the exact yes/no question
    resolution_criteria: str     # explicit rules the validators must apply
    deadline: str                # ISO-8601 date/datetime — "on or before"
    authoritative_sources: str   # JSON list of allowed source URLs/domains
    optional_evidence: str       # JSON list of user-supplied evidence URLs
    creator: Address
    created_at: u256

    # Mutable audit fields (updated only by contract during resolution)
    status: str
    verdict: str
    reasoning_summary: str
    evidence_digest: str         # sha256 hex of the retrieved evidence blob
    resolved_at: u256
    leader_evidence_urls: str    # JSON list retrieved by the LLM leader


# ---------------------------------------------------------------------------
# The MemeVerdict contract
# ---------------------------------------------------------------------------
class MemeVerdict(gl.Contract):
    # id → Claim
    claims: TreeMap[str, Claim]
    # ordered index of all claim ids ever created (JSON string workaround
    # for the nested-array-in-TreeMap gotcha; keeps ordering deterministic)
    claim_ids: DynArray[str]
    # per-creator index
    by_creator: TreeMap[Address, DynArray[str]]

    # An administrator that can only *pause* the contract in an emergency —
    # they can never edit an existing claim's resolution rules.
    owner: Address
    paused: bool

    def __init__(self):
        self.owner = gl.message.sender_address
        self.paused = False

    # ------------------------------------------------------------------ util

    @staticmethod
    def _sha256_hex(text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def _require_not_paused(self):
        if self.paused:
            raise Exception("Contract is paused")

    def _require_owner(self):
        if gl.message.sender_address != self.owner:
            raise Exception("Only the owner can call this method")

    @staticmethod
    def _validate_claim_spec(
        title: str,
        token_name: str,
        token_symbol: str,
        category: str,
        question: str,
        resolution_criteria: str,
        deadline: str,
        authoritative_sources_json: str,
    ) -> None:
        """Reject vague / underspecified claims BEFORE they are stored."""
        if len(title.strip()) < 6:
            raise Exception("Title too short")
        if len(token_name.strip()) < 1:
            raise Exception("Token name required")
        if len(token_symbol.strip()) < 1 or len(token_symbol) > 20:
            raise Exception("Token symbol required (1-20 chars)")
        if category not in ALLOWED_CATEGORIES:
            raise Exception(f"Unsupported category: {category}")
        q = question.strip()
        if len(q) < 20:
            raise Exception(
                "Resolution question too short — must clearly describe the "
                "yes/no event, the exact subject, and any deadline"
            )
        # A well-formed question must be a *yes/no* question. We enforce a
        # very light heuristic: it should end with a '?' and reference the
        # token symbol or a specific event verb.
        if not q.endswith("?"):
            raise Exception("Resolution question must be a yes/no question ending with '?'")
        if len(resolution_criteria.strip()) < 20:
            raise Exception(
                "Resolution criteria too short — spell out what evidence "
                "would produce YES, NO, and UNRESOLVED"
            )
        if len(deadline.strip()) < 4:
            raise Exception("Deadline required (ISO-8601 date recommended)")
        # authoritative_sources must be a JSON list of at least one URL/domain
        try:
            sources = json.loads(authoritative_sources_json)
        except Exception:
            raise Exception("authoritative_sources must be a JSON array")
        if not isinstance(sources, list) or len(sources) == 0:
            raise Exception(
                "At least one authoritative source (URL or domain) is required"
            )
        for s in sources:
            if not isinstance(s, str) or len(s.strip()) < 4:
                raise Exception("Each authoritative source must be a non-empty string")

    # -------------------------------------------------------------- lifecycle

    @gl.public.write
    def create_claim(
        self,
        claim_id: str,
        title: str,
        token_name: str,
        token_symbol: str,
        category: str,
        question: str,
        resolution_criteria: str,
        deadline: str,
        authoritative_sources_json: str,
        optional_evidence_json: str = "[]",
    ) -> str:
        """Create a new MemeVerdict claim.

        The (title, question, resolution_criteria, deadline,
        authoritative_sources) tuple is *locked* — no method on this
        contract can rewrite them once stored.
        """
        self._require_not_paused()

        if claim_id in self.claims:
            raise Exception("claim_id already exists")
        if len(claim_id.strip()) < 3:
            raise Exception("claim_id must be at least 3 chars")

        self._validate_claim_spec(
            title=title,
            token_name=token_name,
            token_symbol=token_symbol,
            category=category,
            question=question,
            resolution_criteria=resolution_criteria,
            deadline=deadline,
            authoritative_sources_json=authoritative_sources_json,
        )

        # Validate optional evidence JSON shape (may be empty).
        try:
            evidence = json.loads(optional_evidence_json)
            if not isinstance(evidence, list):
                raise Exception()
            for u in evidence:
                if not isinstance(u, str):
                    raise Exception()
        except Exception:
            raise Exception("optional_evidence_json must be a JSON array of URL strings")

        claim = Claim(
            claim_id=claim_id,
            title=title.strip(),
            token_name=token_name.strip(),
            token_symbol=token_symbol.strip().upper(),
            category=category,
            question=question.strip(),
            resolution_criteria=resolution_criteria.strip(),
            deadline=deadline.strip(),
            authoritative_sources=authoritative_sources_json,
            optional_evidence=optional_evidence_json,
            creator=gl.message.sender_address,
            # Monotonic per-contract counter — a deterministic stand-in for a
            # wall clock, which GenVM intentionally does not expose.
            created_at=u256(int(len(self.claim_ids))),
            status=STATUS_OPEN,
            verdict=VERDICT_PENDING,
            reasoning_summary="",
            evidence_digest="",
            resolved_at=u256(0),
            leader_evidence_urls="[]",
        )
        self.claims[claim_id] = claim
        self.claim_ids.append(claim_id)

        by_creator_list = self.by_creator.get_or_insert_default(gl.message.sender_address)
        by_creator_list.append(claim_id)
        return claim_id

    @gl.public.write
    def add_evidence(self, claim_id: str, evidence_url: str) -> None:
        """Append an *optional* evidence URL that validators may consult.
        Does NOT change the resolution rules and cannot be called once the
        claim has been resolved."""
        self._require_not_paused()
        if claim_id not in self.claims:
            raise Exception("claim_id not found")
        claim = self.claims[claim_id]
        if claim.status == STATUS_RESOLVED:
            raise Exception("Cannot add evidence to a resolved claim")
        if not isinstance(evidence_url, str) or len(evidence_url.strip()) < 6:
            raise Exception("evidence_url too short")

        current = json.loads(claim.optional_evidence or "[]")
        current.append(evidence_url.strip())
        claim.optional_evidence = json.dumps(current)

    # -------------------------------------------------------- adjudication

    def _adjudicate(
        self,
        claim_id: str,
        title: str,
        token_symbol: str,
        category: str,
        question: str,
        resolution_criteria: str,
        deadline: str,
        authoritative_sources_json: str,
        optional_evidence_json: str,
    ) -> dict:
        """The core GenLayer consensus block.

        LEADER   fetches every authoritative + optional source URL,
                 concatenates the extracted text, then asks the LLM
                 to derive a structured verdict.
        VALIDATOR independently repeats the same fetch + reasoning
                 and *compares stable fields* (verdict + top evidence
                 URL).  Reasoning text is stored but never compared.
        """
        def leader_fn() -> dict:
            sources = json.loads(authoritative_sources_json)
            optional = json.loads(optional_evidence_json or "[]")
            all_urls = []
            for s in sources:
                if isinstance(s, str) and (s.startswith("http://") or s.startswith("https://")):
                    all_urls.append(s)
            for s in optional:
                if isinstance(s, str) and (s.startswith("http://") or s.startswith("https://")):
                    all_urls.append(s)

            # de-duplicate while preserving order
            seen = set()
            urls = []
            for u in all_urls:
                if u not in seen:
                    seen.add(u)
                    urls.append(u)

            # Retrieve up to 6 pages to keep prompt size sane
            urls = urls[:6]
            fetched = []
            for u in urls:
                try:
                    body = gl.nondet.web.render(u, mode="text")
                    if body:
                        fetched.append({"url": u, "text": str(body)[:6000]})
                except Exception as fetch_err:  # noqa: BLE001
                    fetched.append({"url": u, "text": f"[FETCH_ERROR: {fetch_err}]"})

            # Build the evidence blob and prompt.
            evidence_blob = "\n\n".join(
                f"### SOURCE {i+1}: {f['url']}\n{f['text']}"
                for i, f in enumerate(fetched)
            ) or "[NO EVIDENCE RETRIEVED]"

            prompt = f"""You are an impartial adjudicator for a MemeVerdict claim.

CLAIM ID: {claim_id}
TITLE: {title}
TOKEN: {token_symbol}
CATEGORY: {category}
QUESTION (yes/no): {question}
RESOLUTION CRITERIA:
{resolution_criteria}

DEADLINE (on or before): {deadline}

You may only rely on the evidence below.  Prefer PRIMARY authoritative
sources (official exchange announcement pages, official project channels,
blockchain explorers).  Ignore anonymous social replies and low-quality
blogs.  If evidence is missing, contradictory, or clearly insufficient,
answer "UNRESOLVED" — never guess.

EVIDENCE:
{evidence_blob}

Respond with STRICT JSON of this shape and nothing else:
{{
  "verdict": "YES" | "NO" | "UNRESOLVED",
  "confidence_percent": <integer between 0 and 100>,
  "top_evidence_url": <string, the single URL you weighed most heavily, or "">,
  "reasoning": <string, 1-4 sentence summary a human can audit>
}}
"""
            raw = gl.nondet.exec_prompt(prompt, response_format="json")

            # Defensive parsing — LLMs sometimes wrap in fences or add prose.
            parsed = _parse_llm_json(raw)

            verdict = str(parsed.get("verdict", "UNRESOLVED")).upper()
            if verdict not in {VERDICT_YES, VERDICT_NO, VERDICT_UNRESOLVED}:
                verdict = VERDICT_UNRESOLVED

            top_url = str(parsed.get("top_evidence_url", "") or "")
            reasoning = str(parsed.get("reasoning", "") or "")[:1200]

            # ─── Integer-only confidence ────────────────────────────────
            # GenVM calldata is NOT float-encodable — Python floats returned
            # from a nondet block (even wrapped in a dict) will crash the
            # consensus round with:
            #     TypeError: not calldata encodable <x>: float
            # So we normalize the LLM's confidence — which may come back as
            # 0-1 float, 0-100 int, or a string — into a plain int in
            # [0, 100] BEFORE it ever crosses the calldata boundary.
            raw_conf = parsed.get("confidence_percent", parsed.get("confidence", 0))
            try:
                if isinstance(raw_conf, str):
                    raw_conf = raw_conf.strip().rstrip("%")
                    if "." in raw_conf:
                        num = float(raw_conf)
                    else:
                        num = int(raw_conf)
                else:
                    num = raw_conf
                # If the model returned a 0-1 fractional confidence, scale
                # it to 0-100 so the on-chain unit is uniform.
                num_f = float(num)
                if num_f <= 1.0 and num_f > 0.0:
                    num_f = num_f * 100.0
                # Round-to-int, then clamp — the stored value is a plain int.
                confidence_percent = int(round(num_f))
            except Exception:
                confidence_percent = 0
            if confidence_percent < 0:
                confidence_percent = 0
            if confidence_percent > 100:
                confidence_percent = 100

            digest = MemeVerdict._sha256_hex(evidence_blob)

            # IMPORTANT: every value in this dict must be calldata-encodable
            # by GenVM. Allowed: str, bool, int, list[str], list[int], dict
            # of those.  NEVER float, NEVER Decimal, NEVER bytes-view.
            return {
                "verdict": verdict,
                "confidence_percent": int(confidence_percent),
                "top_evidence_url": top_url,
                "reasoning": reasoning,
                "evidence_digest": digest,
                "evidence_urls": urls,
            }

        def validator_fn(leader_result) -> bool:
            # Reject VM errors / user errors — force leader rotation.
            if not isinstance(leader_result, glvm.Return):
                return False
            data = leader_result.calldata
            if not isinstance(data, dict):
                return False

            # Independently repeat the task.
            try:
                mine = leader_fn()
            except Exception:
                return False

            # Compare only the stable decision fields — never reasoning text.
            if mine.get("verdict") != data.get("verdict"):
                return False

            # If the leader said UNRESOLVED, do not require url match — many
            # empty evidence sets are legitimately UNRESOLVED.
            if data.get("verdict") == VERDICT_UNRESOLVED:
                return True

            # For YES / NO we require that the validator also *found* at least
            # one authoritative URL and that verdicts match — url string does
            # NOT have to match exactly (pages update), but the domain of the
            # top evidence URL should overlap with the accepted source list.
            try:
                authoritative = json.loads(authoritative_sources_json)
            except Exception:
                authoritative = []
            leader_top = str(data.get("top_evidence_url", "") or "").lower()
            my_top = str(mine.get("top_evidence_url", "") or "").lower()

            def _domain_of(u: str) -> str:
                if "://" in u:
                    u = u.split("://", 1)[1]
                return u.split("/", 1)[0]

            leader_domain = _domain_of(leader_top)
            my_domain = _domain_of(my_top)

            def _accepts(dom: str) -> bool:
                if not dom:
                    return False
                for s in authoritative:
                    s_str = str(s).lower()
                    if s_str.startswith("http"):
                        s_str = _domain_of(s_str)
                    if s_str and s_str in dom:
                        return True
                return False

            # Either validator or leader must have grounded on an
            # authoritative domain.  This keeps a lazy validator from
            # rubber-stamping fabricated evidence.
            return _accepts(leader_domain) or _accepts(my_domain)

        result = glvm.run_nondet_unsafe(leader_fn, validator_fn)
        return result

    @gl.public.write
    def request_resolution(self, claim_id: str) -> dict:
        """Trigger GenLayer consensus adjudication for a claim.

        Storage writes only happen AFTER the non-deterministic block
        returns — see the GenVM equivalence-principle rules."""
        self._require_not_paused()
        if claim_id not in self.claims:
            raise Exception("claim_id not found")
        claim = self.claims[claim_id]
        if claim.status == STATUS_RESOLVED:
            raise Exception("Claim already resolved")

        # Mark that resolution has been requested BEFORE the nondet block —
        # this write is deterministic and gives the frontend a status hook.
        claim.status = STATUS_RESOLUTION_REQUESTED
        self.claims[claim_id] = claim

        adjudication = self._adjudicate(
            claim_id=claim.claim_id,
            title=claim.title,
            token_symbol=claim.token_symbol,
            category=claim.category,
            question=claim.question,
            resolution_criteria=claim.resolution_criteria,
            deadline=claim.deadline,
            authoritative_sources_json=claim.authoritative_sources,
            optional_evidence_json=claim.optional_evidence,
        )

        # Persist the verdict (deterministic side-effect after consensus).
        claim = self.claims[claim_id]  # re-read
        claim.status = STATUS_RESOLVED
        claim.verdict = str(adjudication.get("verdict", VERDICT_UNRESOLVED))
        claim.reasoning_summary = str(adjudication.get("reasoning", ""))[:1200]
        claim.evidence_digest = str(adjudication.get("evidence_digest", ""))
        claim.leader_evidence_urls = json.dumps(
            adjudication.get("evidence_urls", []) or []
        )
        # resolved_at is a best-effort marker.  GenVM does not expose a
        # wall clock, so we use monotonic claim_ids length as a
        # deterministic proxy for the audit trail.
        claim.resolved_at = u256(int(len(self.claim_ids)))
        self.claims[claim_id] = claim

        return {
            "claim_id": claim_id,
            "verdict": claim.verdict,
            "reasoning": claim.reasoning_summary,
            "evidence_digest": claim.evidence_digest,
        }

    # -------------------------------------------------------- admin (safe)

    @gl.public.write
    def set_paused(self, paused: bool) -> bool:
        """Emergency pause — cannot rewrite existing claim resolution
        rules, only prevents new claims and new resolution requests."""
        self._require_owner()
        self.paused = bool(paused)
        return self.paused

    @gl.public.write
    def transfer_ownership(self, new_owner: str) -> str:
        self._require_owner()
        if isinstance(new_owner, (str, bytes)):
            new_owner_addr = Address(new_owner)
        else:
            new_owner_addr = new_owner
        self.owner = new_owner_addr
        return str(self.owner)

    # ---------------------------------------------------------- read/views

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner.as_hex

    @gl.public.view
    def is_paused(self) -> bool:
        return self.paused

    @gl.public.view
    def get_claim_count(self) -> int:
        return len(self.claim_ids)

    @gl.public.view
    def get_claim(self, claim_id: str) -> dict:
        if claim_id not in self.claims:
            raise Exception("claim_id not found")
        c = self.claims[claim_id]
        return _claim_to_dict(c)

    @gl.public.view
    def get_verdict(self, claim_id: str) -> dict:
        if claim_id not in self.claims:
            raise Exception("claim_id not found")
        c = self.claims[claim_id]
        return {
            "claim_id": c.claim_id,
            "status": c.status,
            "verdict": c.verdict,
            "reasoning": c.reasoning_summary,
            "evidence_digest": c.evidence_digest,
            "leader_evidence_urls": json.loads(c.leader_evidence_urls or "[]"),
        }

    @gl.public.view
    def list_claim_ids(self, offset: int = 0, limit: int = 50) -> list:
        n = len(self.claim_ids)
        start = max(0, int(offset))
        end = min(n, start + max(0, int(limit)))
        return [self.claim_ids[i] for i in range(start, end)]

    @gl.public.view
    def list_claims(self, offset: int = 0, limit: int = 50) -> list:
        ids = self.list_claim_ids(offset, limit)
        return [_claim_to_dict(self.claims[i]) for i in ids]

    @gl.public.view
    def list_by_creator(self, creator_address: str) -> list:
        addr = Address(creator_address)
        if addr not in self.by_creator:
            return []
        arr = self.by_creator[addr]
        return [_claim_to_dict(self.claims[arr[i]]) for i in range(len(arr))]

    @gl.public.view
    def allowed_categories(self) -> list:
        return sorted(list(ALLOWED_CATEGORIES))


# ---------------------------------------------------------------------------
# Module-level helpers (allowed — pure Python, no storage)
# ---------------------------------------------------------------------------
def _claim_to_dict(c: "Claim") -> dict:
    return {
        "claim_id": c.claim_id,
        "title": c.title,
        "token_name": c.token_name,
        "token_symbol": c.token_symbol,
        "category": c.category,
        "question": c.question,
        "resolution_criteria": c.resolution_criteria,
        "deadline": c.deadline,
        "authoritative_sources": json.loads(c.authoritative_sources or "[]"),
        "optional_evidence": json.loads(c.optional_evidence or "[]"),
        "creator": c.creator.as_hex,
        "created_at": int(c.created_at),
        "status": c.status,
        "verdict": c.verdict,
        "reasoning_summary": c.reasoning_summary,
        "evidence_digest": c.evidence_digest,
        "resolved_at": int(c.resolved_at),
        "leader_evidence_urls": json.loads(c.leader_evidence_urls or "[]"),
    }


def _parse_llm_json(raw):
    """Robustly parse the LLM response into a dict.  Handles code fences,
    trailing prose, and dict passthrough."""
    if isinstance(raw, dict):
        return raw
    s = str(raw).strip()
    s = s.replace("```json", "").replace("```", "").strip()
    if s.startswith("{"):
        try:
            return json.loads(s)
        except Exception:
            pass
    start = s.find("{")
    end = s.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(s[start:end])
        except Exception:
            pass
    return {
        "verdict": "UNRESOLVED",
        "confidence_percent": 0,
        "top_evidence_url": "",
        "reasoning": "",
    }
