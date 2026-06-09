# TaskGuard

> **A research artifact at the intersection of HCI, applied NLU, and on-device ML.**
> An intent-aware Chrome extension that scores the contextual relevance of every visited website against a user-declared task using a lightweight, interpretable, fully in-browser hybrid classifier (topic-set Jaccard + TF cosine similarity + direct token match + curated known-domain bonus) — no model download, no server, sub-millisecond latency.

Most existing distraction-management tools enforce *context-free* blocking: a fixed allowlist or denylist, applied identically regardless of what the user is currently trying to do. TaskGuard operationalises the alternative: **the user pre-declares an intent, the system intercepts non-allowlisted navigations during the session, and a transparent relevance score informs — but does not replace — the human allow/block decision.** Every decision is logged locally as a labelled tuple, giving each user their own privacy-preserving dataset for downstream relevance modelling.

For the full academic write-up see [`PROJECT_REPORT.md`](PROJECT_REPORT.md); for a one-page research positioning brief see [`RESEARCH_STATEMENT.md`](RESEARCH_STATEMENT.md).

## Research Contributions

1. **System** — an end-to-end Chrome MV3 architecture for intent-aware tab interception with synchronous, zero-network relevance scoring.
2. **Classifier** — a deterministic, ~400-line, four-signal hybrid scorer (interpretable, auditable, edit-friendly).
3. **Dataset format** — a documented `(intent, category, description, domain, decision, timestamp)` schema generated locally by every user, with informed-consent export.
4. **Reproducibility** — no opaque dependencies; the classifier and probe set can be replayed in any browser DevTools console.

---

## How It Works

1. You declare your task title + optional description, pick a duration → session starts
2. Every tab navigation is checked against your allowlist
3. Non-allowlisted sites are redirected to the intercept page, which asks "Is this relevant?"
4. The hybrid relevance classifier instantly scores the site using your task title **and** description
5. Your allow/block decisions are logged locally for personal analytics

---

## File-by-File Breakdown

### Core Extension

| File | Role | Key tech |
|------|------|----------|
| `manifest.json` | Extension config — permissions, service worker, popup, web-accessible resources | Chrome Manifest V3 |
| `background.js` | Service worker — intercepts tab navigations, manages badge timer via `chrome.alarms`, logs sessions on timer expiry | `chrome.webNavigation`, `chrome.alarms`, `chrome.action` |
| `popup.html / popup.js` | Main UI — three views: session setup, active session countdown, session summary | Vanilla JS state machine, `chrome.storage.local` |
| `intercept.html / intercept.js` | Full-page block screen — runs the relevance classifier, shows relevance score, handles allow/block decisions | ES module import, `URLSearchParams` |
| `allowlist.html / allowlist.js` | Allowlist manager — add/remove domains, quick-add chips, toast notifications for feedback | `chrome.storage.local`, regex domain validation |
| `history.html / history.js` | Analytics dashboard — 7-day trend chart, decisions + sessions tabs, CSV/JSON export | `chrome.storage.local`, DOM table rendering |
| `onboarding.html / onboarding.js` | One-time welcome screen on first install | `chrome.runtime.onInstalled` |

### Relevance Classifier

| File | Role |
|------|------|
| `classifier.js` | Exports `classifyRelevance(domain, intent, description, intentCategory)` → 0–100 score. Fully synchronous, no imports, no network requests. |

**How the classifier works:**

Scoring combines four signals with fixed weights, passed through a sigmoid for smooth scaling:

| Signal | Weight | Mechanism |
|--------|--------|-----------|
| **Topic Jaccard overlap** | 50% | Both the intent text and the domain are mapped to topic categories (coding, studying, writing, research, design, data, social, entertainment, etc.) via keyword lists. Score = `|intent ∩ domain| / |intent ∪ domain|`. |
| **Term-frequency cosine similarity** | 25% | Normalized term-frequency vectors are built from the intent+description tokens and from the union of keyword lists for the shared topics. Cosine similarity between the two vectors. Stemming is applied so morphological variants map to the same key. |
| **Direct token hit** | 15% | The domain hostname is tokenized (split on `.`, TLDs stripped, letter/digit boundaries separated). Score = fraction of domain tokens whose stem matches (equal, prefix, or suffix) a stemmed intent token. |
| **Known-domain bonus** | 10% | Added if the domain appears in the built-in lookup table **and** shares at least one topic with the intent. |

The weighted sum (range 0–1) is passed through `sigmoid(x) = 1 / (1 + e^(−8(x − 0.25)))`, which calibrates the score (raw 0 → ~12%, 0.25 → 50%, 0.5 → ~82%) and is then rounded to an integer 0–100.

The classifier has a built-in lookup table covering ~100 common domains mapped to their topic categories. Unknown domains fall back to token-based topic inference using the topic keyword lists.

> **Naming note.** The cosine-similarity component uses term-frequency vectors only — no inverse document frequency is computed, so it is *TF cosine similarity*, not classical TF-IDF. Earlier drafts of this README mistakenly used the term "TF-IDF"; this has been corrected for accuracy.

**Example scores:**

| Intent + Description | Domain | Score | Reason |
|----------------------|--------|-------|--------|
| "Debug React app" | `stackoverflow.com` | ~85% | coding↔coding, direct token overlap |
| "Study for OS exam, chapters 5–7" | `geeksforgeeks.org` | ~75% | studying/coding↔studying/coding |
| "Write research essay" | `grammarly.com` | ~72% | writing↔writing |
| "Machine learning project" | `kaggle.com` | ~80% | data/coding↔data/coding |
| "Study for OS exam" | `youtube.com` | ~5% | studying↔entertainment, no overlap |
| "Debug React app" | `instagram.com` | ~3% | coding↔social/entertainment |

### Assets

| File | Status | Notes |
|------|--------|-------|
| `image.png` | Required | Extension icon (used for 16×16, 48×48, 128×128) |
| `README.md` | Keep | This file |
| `PUBLISHING.md` | Keep | Distribution rationale + Load-Unpacked install guide |
| `PROJECT_REPORT.md` | Keep | Full project report for academic submission |
| `RESEARCH_STATEMENT.md` | Keep | One-page research positioning brief |
| `TaskGuard.md` | Keep | Feature catalogue (at-a-glance summary; not bundled with the extension) |

> Historical note: an earlier prototype used a Hugging Face DeBERTa model loaded via `transformers.js` and an ONNX WebAssembly runtime (`ort-wasm.wasm`, `ort-wasm-simd.wasm`, `transformers.min.js`). That dependency stack was removed in favour of the fully in-browser hybrid classifier described above; none of those files are part of the current repository.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Extension format | Manifest V3 (MV3) | Required by Chrome; uses service workers instead of persistent background pages |
| Background processing | Chrome Service Worker (`background.js`) | Survives popup closing; manages timer and tab interception while popup is closed |
| UI | HTML5 + CSS3 + Vanilla JavaScript | No framework needed; extension pages are small and self-contained |
| Storage | `chrome.storage.local` | Persists across browser restarts; survives service worker termination |
| Timer | `chrome.alarms` | The only reliable timer in MV3 service workers — `setInterval`/`setTimeout` are unreliable because the SW can be suspended |
| Tab interception | `chrome.webNavigation.onCommitted` | Fires once per main-frame navigation commit; more reliable than `onBeforeNavigate` |
| Relevance scoring | Topic Jaccard + TF cosine similarity + direct token matching + known-domain bonus | Fully in-browser, synchronous, zero latency, no downloads |
| Downloads | `chrome.downloads` | Used for JSON/CSV export of session and decision logs |
| ID generation | `crypto.randomUUID()` (Web Crypto API) | Cryptographically random session and user IDs; built into the browser, no library needed |

---

## Chrome APIs Used

| API | What it does in TaskGuard |
|-----|--------------------------|
| `chrome.storage.local` | Stores allowlist, active session state, task title/description, decision logs, session logs |
| `chrome.alarms` | Badge countdown tick (~1 s in dev); clears "Done" badge after session ends |
| `chrome.tabs` | Queries all open tabs on session start to intercept already-open non-allowlisted sites |
| `chrome.webNavigation.onCommitted` | Fires when a tab commits to a new URL; triggers the interception check |
| `chrome.action` | Sets badge text (remaining time) and badge background color |
| `chrome.runtime` | Message passing between popup ↔ background; `getURL()` for extension page paths |
| `chrome.downloads` | Saves exported data as `.json` or `.csv` |

---

## Data Model

All data is stored locally in `chrome.storage.local`. Nothing is sent to any server.

**Active session keys:**

| Key | Type | Description |
|-----|------|-------------|
| `intent` | string | Task title entered by user |
| `taskDescription` | string | Optional task details |
| `intentCategory` | string | Selected category (studying, coding, etc.) |
| `timerEndTime` | number | Unix ms timestamp when session expires |
| `timerMinutes` | number | Planned duration |
| `sessionId` | string | UUID for this session |
| `sessionStartTime` | number | Unix ms timestamp of session start |
| `allowlist` | string[] | Permanent allowlisted domains |
| `tempAllowlist` | string[] | Domains allowed only for this session |
| `sessionAllowlistSnapshot` | string[] | Allowlist state at session start |

**Decision log entry:**
```json
{
  "sessionId": "session_<uuid>",
  "intent": "Study for OS exam",
  "intentCategory": "studying",
  "domain": "youtube.com",
  "url": "https://youtube.com/watch?v=...",
  "decision": "block",
  "addedToAllowlist": false,
  "userId": "user_<uuid>",
  "timestamp": "2025-04-27T10:32:00.000Z"
}
```

**Session log entry:**
```json
{
  "sessionId": "session_<uuid>",
  "intent": "Study for OS exam",
  "intentCategory": "studying",
  "startTime": 1745747520000,
  "endTime": 1745749320000,
  "plannedMinutes": 45,
  "endedBy": "timer",
  "allowlistAtStart": ["github.com", "stackoverflow.com"],
  "sitesAllowedDuringSession": ["geeksforgeeks.org"]
}
```

---

## Installation (Development)

1. Clone this repo
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select this folder
5. Pin the TaskGuard icon to your toolbar

---

## Distribution

TaskGuard is **deliberately not published to the Chrome Web Store** — it is distributed as an open-source research artifact via GitHub and installed using Chrome's *Load Unpacked* developer flow. See [PUBLISHING.md](PUBLISHING.md) for the rationale and step-by-step install instructions.
