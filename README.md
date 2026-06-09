# TaskGuard

An intent-aware Chrome extension that intercepts distracting websites during focus sessions and scores their relevance to your declared task using a lightweight in-browser TF-IDF classifier — no model download, no server, instant results.

---

## How It Works

1. You declare your task title + optional description, pick a duration → session starts
2. Every tab navigation is checked against your allowlist
3. Non-allowlisted sites are redirected to the intercept page, which asks "Is this relevant?"
4. The TF-IDF classifier instantly scores relevance using your task title **and** description
5. Your allow/block decisions are logged locally for personal analytics

---

## File-by-File Breakdown

### Core Extension

| File | Role | Key tech |
|------|------|----------|
| `manifest.json` | Extension config — permissions, service worker, popup, web-accessible resources | Chrome Manifest V3 |
| `background.js` | Service worker — intercepts tab navigations, manages badge timer via `chrome.alarms`, logs sessions on timer expiry | `chrome.webNavigation`, `chrome.alarms`, `chrome.action` |
| `popup.html / popup.js` | Main UI — three views: session setup, active session countdown, session summary | Vanilla JS state machine, `chrome.storage.local` |
| `intercept.html / intercept.js` | Full-page block screen — runs the TF-IDF classifier, shows relevance score, handles allow/block decisions | ES module import, `URLSearchParams` |
| `allowlist.html / allowlist.js` | Allowlist manager — add/remove domains, quick-add chips, toast notifications for feedback | `chrome.storage.local`, regex domain validation |
| `history.html / history.js` | Analytics dashboard — 7-day trend chart, decisions + sessions tabs, CSV/JSON export | `chrome.storage.local`, DOM table rendering |
| `onboarding.html / onboarding.js` | One-time welcome screen on first install | `chrome.runtime.onInstalled` |

### Relevance Classifier

| File | Role |
|------|------|
| `classifier.js` | Exports `classifyRelevance(domain, intent, description)` → 0–100 score. Fully synchronous, no imports, no network requests. |

**How the classifier works:**

Scoring uses three signals combined with fixed weights:

| Signal | Weight | Mechanism |
|--------|--------|-----------|
| **Topic Jaccard overlap** | 55% | Both the intent text and domain are mapped to topic categories (coding, studying, writing, research, design, data, social, entertainment, etc.) via keyword lists. Score = shared categories / total categories. |
| **TF-IDF cosine similarity** | 30% | Term-frequency vectors are built from intent+description and from the domain's expanded keyword set (domain tokens + all keywords for its topic categories). Cosine similarity between them. |
| **Direct token hit** | 15% | Domain name is split into tokens (e.g. `stackoverflow` → `stack`, `overflow`). Score = fraction of domain tokens that appear literally in intent/description. |

The classifier has a built-in lookup table covering ~80 common domains mapped to their topic categories. Unknown domains fall back to token-based topic inference.

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
| `image.png` | Required | Extension icon (16×16, 48×48, 128×128) |
| `README.md` | Keep | This file |
| `PUBLISHING.md` | Keep | Chrome Web Store submission guide |
| `explanation.txt` | **Delete** | Outdated — references `blocked.html`/`blocked.js` which no longer exist |
| `PROJECT_OVERVIEW.md` | **Delete** | Academic planning document, not part of the extension |
| `TaskGuard.md` | **Delete** | Feature list planning doc |
| `To-do.md` | **Delete** | Dev roadmap artifact |
| `transformers.min.js` | **Delete** | No longer used — DeBERTa model removed |
| `ort-wasm.wasm` | **Delete** | No longer used — ONNX runtime removed |
| `ort-wasm-simd.wasm` | **Delete** | No longer used — ONNX runtime removed |

> The last three files were part of the old Hugging Face DeBERTa classifier (~80–100 MB total). They are not referenced anywhere and are safe to delete.

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
| Relevance scoring | TF-IDF cosine similarity + topic Jaccard + direct token matching | Fully in-browser, synchronous, zero latency, no downloads |
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

## Publishing

See [PUBLISHING.md](PUBLISHING.md) for step-by-step Chrome Web Store submission instructions.
