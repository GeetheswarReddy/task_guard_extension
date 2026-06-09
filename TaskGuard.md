# TaskGuard: Feature List

> This file is the at-a-glance feature catalogue. For implementation details see [`README.md`](README.md); for the full academic write-up see [`PROJECT_REPORT.md`](PROJECT_REPORT.md); for the one-page research-positioning brief see [`RESEARCH_STATEMENT.md`](RESEARCH_STATEMENT.md).
>
> TaskGuard is framed as a **research artifact at the intersection of HCI, applied NLU, and on-device ML**, not as a standalone productivity tool.

## Core User Features

### 1. Intent Declaration
- Users explicitly declare their current task before starting a focus session
- Supports short natural-language task titles (e.g., "Prepare for OS exam")
- Optional task description for richer context
- Category selection: Studying, Coding, Writing, Research, Work, Design, Reading, Other
- Intent is treated as contextual ground truth, not inferred behaviour

### 2. Focus Session Management
- Predefined focus durations (15, 25, 45, 60 minutes) plus a custom minutes input
- One-click session start; two-step confirmation for early termination
- Session state persists across browser restarts (`chrome.storage.local`)
- Visual feedback via extension badge countdown driven by `chrome.alarms`
- Post-session summary view: planned vs. actual minutes, blocked/allowed counts, completion progress bar

### 3. Context-Aware Website Interception
- Monitors active tabs during focus sessions (including tabs already open when the session begins)
- Extracts the registered hostname when a page is accessed
- Differentiates between permanent allowlist, session-scoped temporary allowlist, and everything else
- Same website can behave differently under different intents (e.g., YouTube during *Study* vs. during *Research a video essay*)

### 4. Relevance Validation Prompt
- Triggered when a non-allowlisted site is accessed during a session
- Displays the user's current task intent for context reinforcement
- Shows a 0–100 relevance score with a colour-coded label (green / yellow / red) and progress bar
- User explicitly validates: **Allow** (with optional permanent allowlisting) or **Block**
- Decision is enforced immediately and logged

### 5. Allowlist Management
- Pre-approve trusted websites permanently or for the current session only
- Quick-add chips for common productive domains (Google Docs, Stack Overflow, GitHub, Wikipedia, Google Scholar)
- Strict regex validation; supports comma-separated bulk add and URL → domain extraction

---

## Relevance Classifier (Implemented)

### 6. Hybrid In-Browser Relevance Scoring
Four-signal classifier in `classifier.js`, runs synchronously with no model download:

| Signal | Weight | Idea |
|--------|--------|------|
| Topic Jaccard overlap | 50 % | Map intent + domain to topic categories via keyword lists; compute set Jaccard |
| Term-frequency cosine similarity | 25 % | Build normalised TF vectors over stemmed tokens of intent vs. shared-topic keyword set; compute cosine |
| Direct domain token hit | 15 % | Fraction of domain tokens whose stem matches an intent token (equal, prefix, or suffix) |
| Known-domain bonus | 10 % | +0.10 if domain is in the curated lookup table **and** shares ≥ 1 topic with the intent |

Raw 0–1 weighted sum is passed through a logistic sigmoid (`1 / (1 + e^(−8(x − 0.25)))`) and rounded to an integer 0–100.

> The cosine component uses **term-frequency only** — no inverse-document-frequency is computed across a corpus. It is therefore *TF cosine similarity*, not classical TF-IDF.

### 7. Explainable Score (Partial)
- The colour-coded label (likely relevant / uncertain / likely off-task) and the progress bar provide a coarse explanation of the score.
- *Planned:* surface the contributing signals (which topics matched, which keywords overlapped) directly on the intercept page.

---

## Data Collection & Research Features

### 8. Human-in-the-Loop Decision Logging
- Every allow/block action is logged as labelled data
- Captures: `sessionId`, `intent`, `intentCategory`, `domain`, `url`, `decision`, `addedToAllowlist`, `userId`, ISO `timestamp`
- Decisions act as human-validated relevance labels suitable for downstream model training

### 9. Pseudonymous User Identification
- Each install generates a random anonymous `userId` (`crypto.randomUUID()`)
- No login or personal data required
- Enables per-user analysis while preserving privacy

### 10. Local-First Data Storage
- All session and decision data stored using `chrome.storage.local`
- No external servers, no cloud storage, no analytics SDKs
- Fully offline and privacy-preserving by design

### 11. Dataset Generation
- Accumulates intent–description–category–domain–decision tuples over time
- Enables analysis of context dependency (same site, different outcomes under different intents)
- Serves as a labelled dataset for relevance modelling and focus-behaviour research

### 12. Data Export
- Users can export their interaction data as JSON (sessions + decisions + userId + ISO export timestamp) or CSV (active tab only)
- Enables offline analysis and research use
- Maintains informed user consent

### 13. Analytics Dashboard
- 7-day stacked bar chart of allow/block decisions
- Summary stat cards (decisions tab: total / allowed / blocked / unique sites; sessions tab: total / minutes focused / completed / ended early)
- Sortable tabular history with intent, domain, and decision badge

---

## Planned / Future Work

- **Surface signal contributions.** Show which topics matched and which tokens overlapped on the intercept page (full explainability).
- **Fine-tuned ML head.** Replace the rule-based hybrid classifier with a lightweight on-device transformer (e.g., distilled MiniLM) via WebAssembly ONNX, using the locally-collected decision logs for fine-tuning.
- **Calendar-driven intent suggestion.** Pre-fill the intent field from the user's current calendar event.
- **Per-domain time budgets.** Soft caps before hard interception triggers.
- **Cross-device sync.** Optional, end-to-end encrypted.
- **Firefox / Edge ports.** Edge is already supported; Firefox needs a WebExtensions compatibility pass.
