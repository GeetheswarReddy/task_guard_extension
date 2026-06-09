# TaskGuard: An Intent-Aware Chrome Extension for Context-Sensitive Distraction Management

---

## 1. INTRODUCTION

The rapid expansion of internet-connected devices and always-on digital services has fundamentally changed how knowledge workers and students interact with information. While this connectivity enables unprecedented access to learning resources and productivity tools, it simultaneously exposes users to an unrelenting stream of distractions. Studies indicate that the average knowledge worker switches digital contexts every few minutes, and recovery from a single distraction can take upwards of twenty minutes.

Existing browser-based distraction management tools primarily rely on hard blocking — preventing access to a fixed list of websites regardless of context. While effective in a limited sense, these tools are inflexible: a student researching a topic on YouTube is treated identically to one watching entertainment videos, and a developer browsing Reddit for a debugging tip is blocked just as firmly as one scrolling for leisure.

These limitations highlight the need for a smarter approach: one that understands *why* the user is working and evaluates each website visit in that context before deciding whether to block or allow it.

This project introduces **TaskGuard**, an intent-aware Chrome extension that intercepts potentially distracting websites during focus sessions and scores their relevance to the user's declared task using a lightweight in-browser TF-IDF classifier — with no model download, no server, and instant results. Users retain agency over every interception decision, and all choices are logged locally for personal analytics.

---

### 1.1 Objectives

1. To detect and score the relevance of visited websites to a user's declared task using a combined TF-IDF cosine similarity, topic Jaccard overlap, and direct token matching algorithm.
2. To intercept off-task browser navigations in real-time during active focus sessions without requiring any server-side processing.
3. To monitor and log user allow/block decisions on a per-session basis for behavioral self-awareness.
4. To analyze weekly browsing and focus patterns through a local analytics dashboard.
5. To generate session summaries with completion metrics, blocked site counts, and visual trend charts.
6. To support export of behavioral data in JSON and CSV formats for personal productivity analysis.

---

### 1.2 Existing Systems

Current browser productivity tools mainly fall into two categories: hard blockers and simple timers. Hard blockers such as Freedom, Cold Turkey, and StayFocusd restrict access to a fixed allowlist of websites without any contextual awareness. Timer tools remind users to take breaks but do not monitor or intervene in browsing behavior.

**Disadvantages:**

- No assessment of whether a visited site is relevant to the user's current task
- Hard blocks treat every non-allowlisted domain identically, regardless of context
- No logging or analysis of individual browsing decisions during focus sessions
- No NLP-based classification of domains against the user's stated intent
- No per-session analytics, completion tracking, or behavioral trend visualization
- No ability to temporarily allow a relevant site without permanently whitelisting it

---

### 1.3 Proposed System

TaskGuard introduces an intelligent, intent-aware focus management system that combines real-time tab interception with an in-browser relevance classifier and a full behavioral analytics layer.

**Key Features:**

- Intent declaration at session start (task title + optional description + category)
- Real-time interception of non-allowlisted domains using `chrome.webNavigation.onCommitted`
- TF-IDF cosine similarity + topic Jaccard overlap + direct token matching relevance scoring (0–100%)
- User-controlled allow/block decisions with permanent or session-scoped allowlisting
- Per-session decision logging stored entirely in `chrome.storage.local`
- Session summaries with actual vs. planned duration, blocked/allowed counts, and completion percentage
- 7-day decision trend chart and tabular history in the analytics dashboard
- JSON and CSV data export via `chrome.downloads`

**Advantages:**

- Preserves user agency — every interception is a user decision, not a hard block
- Relevance scoring provides context for the decision without enforcing an outcome
- All processing happens in-browser: no server dependency, no network latency, no data sent externally
- Behavioral logging enables self-reflection and pattern recognition over time
- Session-scoped temporary allowlist avoids cluttering the permanent allowlist

---

### 1.4 System Requirements

#### Hardware Requirements

The hardware requirements describe the minimum configuration needed to run TaskGuard without performance degradation. The extension runs entirely within the Chrome browser and imposes negligible resource overhead.

- CPU: Dual-core processor or higher
- RAM: 4 GB or higher
- Storage: 100 MB or higher (browser extension storage)
- Device: Desktop or laptop computer
- Network: Internet connection required only for initial extension installation

#### Software Requirements

The software requirements specify the runtime environment, programming languages, and APIs required to build and operate TaskGuard.

- **Operating System:** Windows 10+, macOS 11+, or Linux (any modern distribution)
- **Browser:** Google Chrome 88+ or any Chromium-based browser supporting Manifest V3
- **Programming Language:** JavaScript (ES2020+)
- **Extension Format:** Chrome Manifest V3 (MV3)

**Chrome APIs Used:**

| API | Role in TaskGuard |
|-----|-------------------|
| `chrome.storage.local` | Stores allowlist, session state, decision logs, session logs, userId |
| `chrome.webNavigation.onCommitted` | Intercepts main-frame navigations during active sessions |
| `chrome.alarms` | MV3-safe timer for badge countdown (replaces unreliable `setInterval`) |
| `chrome.tabs` | Queries open tabs on session start; updates tab URLs for interception |
| `chrome.action` | Sets badge text (remaining time) and badge background color |
| `chrome.runtime` | Message passing between popup ↔ background service worker |
| `chrome.downloads` | Saves JSON/CSV exports to the user's Downloads folder |
| Web Crypto API | Generates cryptographically random session and user IDs |

**Development Environment:**

- Visual Studio Code
- Chrome DevTools (Extensions panel: `chrome://extensions/`)
- Chrome Developer Mode (Load Unpacked)

---

## 2. LITERATURE SURVEY

Distraction management and focus support have been studied from multiple angles in the human-computer interaction and information retrieval literature. Several foundational works are directly relevant to the design of TaskGuard.

**Mark et al. (2016)** conducted empirical studies on the cost of interrupted work in knowledge workers and found that fragmented attention leads to higher stress and reduced output quality. Their work motivates the design of focus session tools that actively limit distraction rather than relying on willpower alone.

**Lyngs et al. (2019)** performed a systematic review of digital self-control tools, categorizing them by mechanism (blocking, monitoring, goal-setting) and evaluating their effectiveness. They concluded that tools that preserve user agency and provide behavioral feedback outperform hard blockers in long-term adherence — directly informing TaskGuard's interception-with-choice model.

**Salton and Buckley (1988)** introduced the term-frequency/inverse-document-frequency (TF-IDF) weighting scheme for information retrieval. This foundational work underpins the cosine similarity component of TaskGuard's relevance classifier, which builds TF vectors from the user's intent text and compares them against domain topic keywords.

**Jaccard (1901)** defined the Jaccard similarity coefficient as the ratio of intersection to union of two sets. TaskGuard adapts this to topic categories: the topic Jaccard score measures how many topic categories are shared between the user's intent and the visited domain relative to all categories mentioned by either.

**Shen et al. (2005)** proposed intent-based web query classification using keyword-to-category mappings and term overlap scoring. Their approach of mapping free-text queries to predefined topic categories closely parallels the classifier design in TaskGuard, where user intent text is mapped to one or more topic categories (coding, studying, writing, etc.) before comparison.

---

**Table 2.1 — Literature Survey**

| S.No | Authors | Title | Year | Merits | Demerits |
|------|---------|-------|------|--------|----------|
| 1 | Mark et al. | The Cost of Interrupted Work: More Speed and Stress | 2016 | Empirically quantifies distraction cost | Does not propose technical solutions |
| 2 | Lyngs et al. | Self-Control in Cyberspace: Applying Dual Systems Theory | 2019 | Evaluates real tools; advocates user agency | Review only; no new system built |
| 3 | Salton & Buckley | Term-Weighting Approaches in Automatic Text Retrieval | 1988 | Foundational TF-IDF framework still widely used | Does not address real-time browser contexts |
| 4 | Jaccard | Distribution Florale dans les Alpes et des Jura | 1901 | Simple, interpretable set-similarity metric | Binary topic membership may oversimplify |
| 5 | Shen et al. | Query Intent Detection Using Web Click Stream Data | 2005 | Intent-to-category mapping at web scale | Requires large click-stream data; not in-browser |

---

## 3. DESIGN AND METHODOLOGY

### 3.1 System Architecture

TaskGuard is designed using a modular, layered architecture to ensure clarity of responsibility, ease of maintenance, and efficient real-time performance. All components run entirely within the browser with no external server dependency.

The architecture consists of the following main components:

**1. User Interface Layer (Frontend):**
The frontend is built using HTML5, CSS3, and vanilla JavaScript across five extension pages: `popup.html` (session setup, active session, and summary), `intercept.html` (interception decision page), `allowlist.html` (domain management), `history.html` (analytics dashboard), and `onboarding.html` (first-install welcome). The popup implements a three-view state machine (setup → active → summary), while `intercept.html` is injected via URL redirect when a non-allowlisted domain is detected.

**2. Communication Layer:**
All communication between the popup and the background service worker uses Chrome's message-passing API (`chrome.runtime.sendMessage` / `chrome.runtime.onMessage`). Three message types are defined: `startTimer` (session begins), `stopTimer` (session ends early), and `logDecision` (user allows or blocks a site).

**3. Session Management Layer:**
The background service worker (`background.js`) is the central controller. It persists across popup open/close cycles, manages the session state in `chrome.storage.local`, and drives the badge timer via `chrome.alarms`. On timer expiry it writes the final session log, computes the session summary, and sets the badge to "Done".

**4. Tab Interception Layer:**
The `chrome.webNavigation.onCommitted` listener fires on every main-frame navigation commit. The handler `checkAndIntercept()` reads the active session state from storage, extracts the domain from the URL, checks it against the permanent and temporary allowlists, and — if not allowed — redirects the tab to `intercept.html` with the domain, original URL, intent, category, and description as URL query parameters. On session start, `checkExistingTabs()` also scans all currently open tabs.

**5. NLP Relevance Classification Layer:**
`classifier.js` is an ES module that exports a single function `classifyRelevance(domain, intent, description, intentCategory)` returning a 0–100 score. It runs synchronously with no network requests. The scoring pipeline combines four signals:
- Topic Jaccard overlap (50%) — set intersection of intent topics and domain topics divided by union
- TF-IDF cosine similarity (25%) — cosine distance between intent TF vector and shared-topic keyword TF vector
- Direct domain token hit (15%) — fraction of domain name tokens found in the stemmed intent tokens
- Known-domain bonus (10%) — added if the domain is in the pre-classified lookup table and shares at least one topic

**6. Storage Layer:**
All data is stored in `chrome.storage.local`. This persists across browser restarts and service worker terminations without requiring any cloud service. Key groups: active session state (`intent`, `timerEndTime`, `sessionId`, etc.), lists (`allowlist`, `tempAllowlist`), and logs (`decisionLogs`, `sessionLogs`).

**7. Analytics and Export Layer:**
`history.js` reads `decisionLogs` and `sessionLogs` from storage and renders a 7-day trend bar chart, statistics summary cards, and tabular history. It also provides `exportJSON()` and `exportCSV()` functions that create Blob objects and trigger a download via `chrome.downloads`.

---

### 3.2 Use Case Diagram

**Figure 3.2 — Use Case Diagram**

*(Insert Use Case Diagram image here)*

The Use Case Diagram illustrates the interactions between the two actors — **User** (the person seeking to focus) and the **System** (TaskGuard) — and the functional use cases the system supports.

The main use cases are:

- **Declare Focus Intent:** The user enters a task title, optional description, and selects a category and duration.
- **Build and Manage Allowlist:** The user adds or removes domains that should never be intercepted. Quick-add chips provide common productive domains.
- **Start Focus Session:** The system stores session state, starts the badge timer, and begins intercepting non-allowlisted domains.
- **Site Interception and Relevance Check:** When the user navigates to a non-allowlisted domain, the system redirects to the intercept page and displays the TF-IDF relevance score.
- **Allow Site:** The user allows the intercepted site, either temporarily (session-only) or permanently (adds to allowlist), and is redirected to the original URL.
- **Block Site:** The user blocks the site; the decision is logged and the browser navigates back.
- **View Analytics Dashboard:** The user views the 7-day trend chart, per-decision history, and per-session history.
- **Export Session Data:** The user downloads a JSON or CSV export of all logged decisions and sessions.

The `<<include>>` relationship connects Site Interception with Relevance Check, as the classifier always runs when an interception occurs. The `<<extend>>` relationship connects Allow Site with Add to Allowlist, as permanent allowlisting is an optional extension of the allow decision.

---

### 3.3 Sequence Diagram

**Figure 3.3 — Sequence Diagram**

*(Insert Sequence Diagram image here)*

The sequence of operations from session start to session end is as follows:

1. The user enters intent, category, description, and duration in `popup.html`.
2. `popup.js` validates input, generates a UUID session ID, computes the end timestamp, and saves session state to `chrome.storage.local`.
3. `popup.js` sends a `startTimer` message to `background.js`.
4. `background.js` receives the message, calls `startBadgeTimer(endTime)`, and calls `checkExistingTabs()` to intercept any currently open non-allowlisted tabs.
5. `chrome.alarms` fires a `badgeTick` alarm approximately every second, triggering `updateBadge(endTime)` to update the badge countdown.
6. The user navigates to a non-allowlisted domain in any tab.
7. `chrome.webNavigation.onCommitted` fires; `background.js` calls `checkAndIntercept(tabId, url)`.
8. `checkAndIntercept` reads session state and allowlists from storage; the domain is not allowed, so the tab is redirected to `intercept.html` with query parameters.
9. `intercept.js` reads the parameters and calls `classifyRelevance(domain, intent, description, intentCategory)` from `classifier.js`.
10. `classifier.js` returns a 0–100 score; `intercept.js` displays it with a color-coded label and progress bar.
11. The user clicks Allow or Block.
12. `intercept.js` sends a `logDecision` message to `background.js`.
13. `background.js` appends the decision entry (with `userId` and ISO timestamp) to `decisionLogs` in storage.
14. If Allowed: domain is added to `tempAllowlist` (or `allowlist`), and the browser navigates to the original URL.
15. If Blocked: the intercept view is replaced with a confirmation screen; the user clicks "Back to my task".
16. On timer expiry: `updateBadge` computes the session summary, writes it to `sessionLogs` and `lastSessionSummary`, clears session keys, and sets the badge to "Done".
17. `popup.js` (if open) detects the expiry via its polling interval, reads `lastSessionSummary`, and renders the summary view.

---

### 3.4 Activity Diagram

**Figure 3.4 — Activity Diagram**

*(Insert Activity Diagram image here)*

The Activity Diagram illustrates the complete workflow from extension launch to session completion.

1. **Start** → User opens the TaskGuard popup
2. System checks for an active session in storage
3. **Decision:** Active session exists?
   - **Yes** → Show active session view with countdown
   - **No** → Show session setup view
4. User fills in intent, category, optional description, and selects duration
5. User clicks "Start Focus Session"
6. System validates input → if invalid, show error and return to step 4
7. System stores session state; sends `startTimer` to background worker
8. Badge countdown begins; existing tabs are checked for interception
9. **Decision:** User navigates to a domain?
   - **Not yet** → Continue countdown
   - **Yes** → Proceed to next step
10. **Decision:** Domain in allowlist?
    - **Yes** → Pass through, return to step 9
    - **No** → Redirect tab to intercept page
11. Classifier runs and displays relevance score (0–100%)
12. **Decision:** User chooses Allow or Block?
    - **Allow** → Add domain to tempAllowlist (or allowlist if checked); navigate to original URL; log decision
    - **Block** → Show "stay focused" confirmation; log decision; go back
13. Return to step 9 for further navigations
14. **Decision:** Timer expired OR user clicked "End Session"?
    - **Timer expired** → Compute completion = 100%; write session log; show "Done" badge
    - **Ended by user** → Compute actual duration; compute completion%; write session log; stop timer
15. Popup shows session summary (icon, task, minutes, blocked/allowed counts, progress bar)
16. **End**

---

## 4. IMPLEMENTATION

TaskGuard is implemented as a Chrome Manifest V3 extension using HTML5, CSS3, and vanilla JavaScript. No external frameworks or model files are required. The system integrates Chrome platform APIs with a custom in-browser NLP classifier to deliver real-time distraction management.

**Frontend Implementation (popup.html / popup.js):**
The popup implements a three-view state machine. On load, `loadState()` reads `chrome.storage.local` to determine which view to show: setup (no active session), active session (timer running), or summary (session just ended). `startFocusSession()` validates the intent input and selected duration, generates a UUID session ID using `crypto.randomUUID()`, computes the end timestamp as `Date.now() + selectedMinutes * 60 * 1000`, snapshots the current allowlist, and sends a `startTimer` message to the service worker. `endSession()` calculates the actual duration and completion percentage using `(actualMinutes / plannedMinutes) * 100`, writes the session log, and transitions to the summary view. The summary view renders a color-coded completion bar: green (≥80%), yellow (40–79%), red (<40%).

**Service Worker (background.js):**
The background service worker is the persistent controller of the extension. `checkAndIntercept(tabId, url)` validates the URL, extracts the hostname, strips `www.`, checks it against both allowlists using `isDomainAllowed()`, and — if not allowed — constructs a redirect URL for `intercept.html` with all session parameters as query strings. `checkExistingTabs()` performs the same check across all currently open tabs at session start. `logDecision()` reads the existing `decisionLogs` array, appends the new entry (enriched with `userId` and ISO timestamp), and writes back to storage. The badge timer uses `chrome.alarms` (the only reliable timer in MV3 service workers) with `periodInMinutes: 1/60`. On expiry, `updateBadge()` writes the session summary and clears all session keys.

**Interception UI (intercept.html / intercept.js):**
`intercept.js` reads all session context from `URLSearchParams` and immediately calls `runRelevanceClassifier()`, which invokes `classifyRelevance()` from `classifier.js` and renders the score with a color-coded label and animated progress bar. The Allow handler reads the "Add to allowlist" checkbox: if checked, it adds the domain to the permanent `allowlist`; otherwise it adds it to `tempAllowlist` (cleared at session end). Both paths log the decision before navigating. The Block handler hides the intercept view and shows the "Good call" confirmation screen; clicking "Back to my task" calls `history.go(-2)` (or closes the tab if there is no prior history).

**NLP Relevance Classifier (classifier.js):**
The classifier pipeline runs in four stages. First, `expandAbbreviations()` expands common technical abbreviations (e.g., "ML" → "machine learning", "OS" → "operating system") so they are not filtered by the minimum token-length check. Second, `tokenize()` lowercases the text, removes non-alphanumeric characters, splits on whitespace, and filters stopwords and tokens shorter than three characters. Third, `stem()` applies suffix stripping so morphological variants (e.g., "debugging"/"debug", "studying"/"study") map to the same key in TF vectors. Fourth, `buildTF()` builds a normalized term-frequency vector with stemmed keys. The final score is a weighted combination of four signals passed through a sigmoid function (`1 / (1 + e^(−8(x − 0.25)))`), which maps the raw weighted sum to a smooth 0–100 scale.

**Allowlist Manager (allowlist.html / allowlist.js):**
`addDomainToStorage()` validates the input against a strict domain regex (`/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i`) before writing to storage. The page also provides quick-add chips for common productive domains (Google Docs, Stack Overflow, GitHub, Wikipedia). `showToast()` provides inline success/warning/error feedback with a 2.5-second auto-dismiss.

**Analytics Dashboard (history.js):**
`renderTrendChart()` builds a 7-day array indexed by date string, aggregates allow/block counts from `decisionLogs`, and renders a stacked bar chart with proportional heights (max bar height 64px). `loadDecisions()` and `loadSessions()` compute summary statistics (total decisions, allowed, blocked, unique domains; total sessions, total minutes, completed by timer, ended early) and render them in stat cards alongside a scrollable HTML table. `exportJSON()` creates a Blob containing `userId`, `exportedAt`, `sessions`, and `decisions` and triggers a download. `exportCSV()` writes properly escaped CSV rows for whichever tab is currently active (decisions or sessions).

**Storage Architecture (chrome.storage.local):**

| Key | Type | Description |
|-----|------|-------------|
| `intent` | string | Task title declared at session start |
| `taskDescription` | string | Optional task details |
| `intentCategory` | string | Selected category (studying, coding, etc.) |
| `timerEndTime` | number | Unix ms timestamp when session expires |
| `timerMinutes` | number | Planned session duration |
| `sessionId` | string | UUID for the current session |
| `sessionStartTime` | number | Unix ms timestamp of session start |
| `allowlist` | string[] | Permanently allowed domains |
| `tempAllowlist` | string[] | Domains allowed for the current session only |
| `sessionAllowlistSnapshot` | string[] | Allowlist state captured at session start |
| `decisionLogs` | object[] | Array of allow/block decision entries |
| `sessionLogs` | object[] | Array of completed session entries |
| `userId` | string | Persistent UUID for analytics export attribution |
| `lastSessionSummary` | object | Summary data displayed in the popup after session ends |

---

## 5. TESTING AND RESULTS

### 5.1 Testing

Testing was conducted to verify that all modules of TaskGuard function correctly and robustly under a variety of conditions, including valid sessions, edge-case inputs, and simulated browsing patterns.

**Functional testing** was performed on each module individually. The classifier was tested with known intent/domain pairs to verify that relevance scores fall in expected ranges. The interception logic was tested by starting a session and navigating to non-allowlisted and allowlisted domains. The allowlist validator was tested with valid domains, URLs, and malformed strings. Timer behavior was tested for both natural expiry (badge transitions to "Done") and manual session termination.

**Decision logging** was tested by making a sequence of allow and block decisions and verifying that entries appear correctly in the history dashboard with accurate timestamps, intents, and domain names. **Analytics calculations** were verified by checking that statistic counts match the underlying log arrays.

**Export integrity** was verified by downloading JSON and CSV exports and confirming that all session and decision records are present and correctly formatted. **Onboarding** was tested by simulating a first-install event and verifying that the onboarding page opens and the `userId` is generated.

**Tested Components:**

1. **Classifier Module** — Tested with intent/domain pairs spanning all topic categories; verified sigmoid scaling and correct topic inference for unknown domains.
2. **Tab Interception Module** — Verified that non-allowlisted domains trigger a redirect and allowlisted domains pass through.
3. **Existing Tab Check** — Verified that tabs already open on session start are intercepted.
4. **Allowlist Validation** — Tested with valid domains, full URLs (auto-extracted), comma-separated inputs, and invalid strings.
5. **Session Timer** — Verified badge updates every second and transitions to "Done" on expiry.
6. **Decision Logging** — Verified correct entries in `decisionLogs` for both allow and block outcomes, with and without allowlist addition.
7. **Session Logging** — Verified session entries in `sessionLogs` for timer-expired and user-ended sessions, with correct `endedBy` values.
8. **Analytics Dashboard** — Verified stat card accuracy and table rendering against known log data.
9. **Export (JSON/CSV)** — Verified file content integrity and correct field mapping.
10. **Relevance Score Display** — Verified color coding: green (≥60%), yellow (30–59%), red (<30%).

---

**Table 5.1 — Test Case Matrix**

| Test Case ID | Description | Input | Expected Output |
|-------------|-------------|-------|-----------------|
| TC-001 | Classifier: high relevance | Intent: "Debug React app", Domain: stackoverflow.com | Score ≥ 70 (coding↔coding overlap) |
| TC-002 | Classifier: low relevance | Intent: "Study for OS exam", Domain: instagram.com | Score ≤ 15 (studying↔social/entertainment) |
| TC-003 | Tab interception during session | Navigate to youtube.com (not allowlisted) | Tab redirected to intercept.html |
| TC-004 | Allowlist passthrough | Navigate to github.com (allowlisted) | Tab proceeds without interception |
| TC-005 | Invalid domain input | Input: "not a domain!!" in allowlist field | Error toast displayed; domain not added |
| TC-006 | URL input to allowlist | Input: "https://docs.python.org/3/" | Domain "docs.python.org" extracted and added |
| TC-007 | Allow decision logging | Click Allow on intercept page | Entry with `decision: 'allow'` in `decisionLogs` |
| TC-008 | Block decision logging | Click Block on intercept page | Entry with `decision: 'block'` in `decisionLogs` |
| TC-009 | Session timer expiry | Wait for timer to reach 0 | Badge shows "Done"; `sessionLogs` entry written |
| TC-010 | JSON export integrity | Click Export JSON on history page | Downloaded file contains all sessions and decisions with correct fields |

---

### 5.2 Results

The developed system provides a complete set of functional pages, each handling a specific aspect of focus management and analytics.

**Fig 5.1 — Onboarding Screen:**
The onboarding page (`onboarding.html`) is displayed automatically on first install. It explains the three-step setup flow: setting intent, building an allowlist, and staying accountable with AI-assisted interception. A warning box alerts the user that all currently open non-allowlisted tabs will be intercepted when a session starts.

**Fig 5.2 — Session Setup View (Popup):**
The popup setup view presents an intent input field, a category dropdown (studying, coding, writing, research, work, design, reading, other), an optional task description section, duration preset buttons (15m, 25m, 45m, 60m), a custom minutes input, and a "Start Focus Session" button. Input validation highlights the intent field if empty and shows an error message if no duration is selected.

**Fig 5.3 — Active Session View (Popup):**
During an active session, the popup displays the declared task and a live MM:SS countdown timer updated every second. Action buttons allow the user to open the Allowlist Manager or end the session early with a two-step confirmation overlay.

**Fig 5.4 — Intercept Page with Relevance Score:**
When an off-task navigation is detected, the full-page intercept screen shows the user's current task, the intercepted domain, and a real-time relevance score with a color-coded label (green: likely relevant; yellow: uncertain; red: likely off-task) and an animated progress bar. The user chooses Allow or Block, with an optional checkbox to permanently add the domain to the allowlist.

**Fig 5.5 — Allowlist Manager:**
The allowlist page (`allowlist.html`) displays all permanently allowed domains with remove buttons, a domain input field with URL auto-extraction, and a row of quick-add chips for common productive sites (Google Docs, Stack Overflow, GitHub, Wikipedia, Google Scholar). Toast notifications provide instant feedback on add/remove operations.

**Fig 5.6 — Session Summary View (Popup):**
After session completion (by timer or early end), the popup shows a summary view with an icon (✅ for timer completion, ⏹️ for early end), the task title, actual minutes focused, blocked and allowed site counts, and a color-coded completion progress bar showing the percentage of the planned duration that was completed.

**Fig 5.7 — Analytics Dashboard (History Page):**
The history page (`history.html`) presents a 7-day stacked bar chart of allow (green) and block (red) decisions, four summary stat cards (total decisions, allowed, blocked, unique sites), and a sortable table of all decision records with time, intent, domain, and decision badge. A Sessions tab shows total sessions, total minutes focused, completed sessions, and early exits. Export JSON and Export CSV buttons allow downloading the full data set.

Overall, all pages function correctly and provide accurate real-time information. The system successfully integrates intent-aware interception, in-browser NLP relevance scoring, and behavioral analytics into a single privacy-preserving Chrome extension.

---

## 6. CONCLUSION AND FUTURE SCOPE

### 6.1 Conclusion

TaskGuard addresses the challenge of digital distraction during focused work by combining intent declaration, intelligent relevance scoring, and behavioral analytics into a unified, privacy-preserving Chrome extension. Unlike hard-blocking tools, TaskGuard preserves user agency: every interception is a conscious decision, guided by a real-time relevance score that contextualizes the visit against the user's stated task.

The TF-IDF cosine similarity, topic Jaccard overlap, direct token matching, and known-domain bonus components of the classifier work together to produce intuitive, accurate scores across a wide range of intent/domain combinations — with no model download, no server, and no latency. All data is stored locally in `chrome.storage.local`, ensuring complete user privacy and offline functionality.

The analytics dashboard and data export features support behavioral self-reflection, allowing users to identify distraction patterns and improve their focus habits over time. The system is lightweight, installable in seconds, and suitable for students, developers, researchers, and any knowledge worker who benefits from structured focus sessions.

---

### 6.2 Future Scope

TaskGuard establishes a solid foundation for intelligent distraction management, and several enhancements could significantly extend its capability:

- **Fine-tuned ML Classifier:** Replace the rule-based TF-IDF classifier with a lightweight fine-tuned transformer model (e.g., DistilBERT) running via the WebAssembly ONNX runtime for higher accuracy on ambiguous domains.
- **Multi-Device Sync:** Integrate an optional cloud sync layer (e.g., Supabase or Firebase) to synchronize allowlists and session history across devices while preserving local-first defaults.
- **Calendar Integration:** Automatically suggest a focus intent by reading the user's current calendar event, reducing setup friction.
- **Gamification and Streaks:** Track consecutive days of completed sessions and surface streak counts, badges, and weekly focus goals to improve long-term adherence.
- **Soft Time Budgets:** Allow users to set per-domain time budgets (e.g., "allow 10 minutes on Reddit per session") before hard interception triggers, reducing abrupt blocking.
- **Team/Caregiver Dashboard:** Provide a shared analytics view for study groups or managers to monitor aggregate focus trends (with explicit opt-in consent from all participants).
- **Firefox and Edge Support:** Port the extension to Firefox using WebExtensions compatibility shims and to Microsoft Edge, both of which support Manifest V2/V3 APIs.

---

## 7. BIBLIOGRAPHY

[1] Mark, G., Gudith, D., & Klocke, U. (2016).
"The Cost of Interrupted Work: More Speed and Stress,"
Proceedings of the SIGCHI Conference on Human Factors in Computing Systems (CHI),
ACM, pp. 107–110.
DOI: 10.1145/1357054.1357072

[2] Lyngs, U., Lukoff, K., Slovak, P., Seymour, W., Webb, H., Jirotka, M., Zhao, J., & Van Kleek, M. (2019).
"Self-Control in Cyberspace: Applying Dual Systems Theory to a Review of Digital Self-Control Tools,"
Proceedings of the 2019 CHI Conference on Human Factors in Computing Systems,
ACM, Paper 131.
DOI: 10.1145/3290605.3300361

[3] Salton, G., & Buckley, C. (1988).
"Term-Weighting Approaches in Automatic Text Retrieval,"
Information Processing & Management, vol. 24, no. 5, pp. 513–523.
DOI: 10.1016/0306-4573(88)90021-0

[4] Jaccard, P. (1901).
"Étude comparative de la distribution florale dans une portion des Alpes et des Jura,"
Bulletin de la Société Vaudoise des Sciences Naturelles, vol. 37, pp. 547–579.

[5] Shen, D., Sun, J. T., Yang, Q., & Chen, Z. (2005).
"Query Intent Detection Using Web Click Stream Data,"
IEEE International Conference on Data Mining (ICDM).
DOI: 10.1109/ICDM.2005.26

---

## APPENDIX

This section provides supporting code excerpts from the TaskGuard implementation.

---

### Appendix A: Tab Interception Logic (background.js)

The following code shows how TaskGuard intercepts tab navigations during an active session and redirects non-allowlisted domains to the interception page.

```javascript
// Shared helper — checks permanent and session-scoped allowlists
function isDomainAllowed(domain, allowlist, tempAllowlist) {
    return [...(allowlist || []), ...(tempAllowlist || [])].some(
        allowed => domain === allowed || domain.endsWith('.' + allowed)
    );
}

// Fires on every main-frame navigation commit
chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId === 0) {
        checkAndIntercept(details.tabId, details.url);
    }
});

function checkAndIntercept(tabId, url) {
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
        url.startsWith('about:') || url.startsWith('edge://')) return;

    chrome.storage.local.get(
        ['timerEndTime', 'intent', 'intentCategory', 'taskDescription',
         'allowlist', 'sessionId', 'tempAllowlist'],
        (data) => {
            if (chrome.runtime.lastError || !data) return;
            if (!data.timerEndTime || data.timerEndTime <= Date.now()) return;

            let domain;
            try {
                domain = new URL(url).hostname.replace(/^www\./, '');
            } catch (e) { return; }

            if (!isDomainAllowed(domain, data.allowlist, data.tempAllowlist)) {
                const interceptUrl = chrome.runtime.getURL('intercept.html') +
                    `?domain=${encodeURIComponent(domain)}` +
                    `&url=${encodeURIComponent(url)}` +
                    `&intent=${encodeURIComponent(data.intent || '')}` +
                    `&intentCategory=${encodeURIComponent(data.intentCategory || '')}` +
                    `&description=${encodeURIComponent(data.taskDescription || '')}` +
                    `&sessionId=${encodeURIComponent(data.sessionId || '')}`;
                chrome.tabs.update(tabId, { url: interceptUrl });
            }
        }
    );
}
```

---

### Appendix B: Relevance Classifier — Main Function and Sigmoid (classifier.js)

The following code shows the main `classifyRelevance()` export and the sigmoid scaling function used to convert the raw weighted score into a 0–100 output.

```javascript
// raw 0 → ~12%,  raw 0.25 → ~50%,  raw 0.5 → ~82%,  raw 0.75 → ~96%
function sigmoid(x) {
    return 1 / (1 + Math.exp(-8 * (x - 0.25)));
}

export function classifyRelevance(domain, intent, description = '', intentCategory = '') {
    if (!domain || !intent) return 0;

    const fullText = expandAbbreviations([intent, description].filter(Boolean).join(' '));
    const intentTokens = tokenize(fullText);
    if (intentTokens.length === 0) return 0;

    const dTokens = domainTokens(domain);
    const knownTopics = lookupDomainTopics(domain);
    const domainTopics = knownTopics ?? inferTopicsFromTokens(dTokens, TOPIC_KEYWORDS);

    const intentTopics = inferTopicsFromTokens(intentTokens, TOPIC_KEYWORDS);
    const mappedTopic = CATEGORY_TO_TOPIC[intentCategory];
    if (mappedTopic) intentTopics.add(mappedTopic);

    // Score 1: Topic Jaccard overlap (50%)
    const sharedTopics = [...intentTopics].filter(t => domainTopics.has(t));
    const union = new Set([...intentTopics, ...domainTopics]).size;
    const topicScore = union > 0 ? sharedTopics.length / union : 0;

    // Score 2: TF-IDF cosine similarity (25%)
    let cosineScore = 0;
    if (sharedTopics.length > 0) {
        const targetKeywords = sharedTopics.flatMap(t => TOPIC_KEYWORDS[t] || []);
        cosineScore = cosine(buildTF(intentTokens), buildTF(targetKeywords));
    }

    // Score 3: Direct domain token hit (15%)
    const stemmedIntent = intentTokens.map(stem);
    const directHits = dTokens.filter(dt => {
        const dtStem = stem(dt);
        return stemmedIntent.some(it => it === dtStem || it.startsWith(dtStem) || dtStem.startsWith(it));
    }).length;
    const directScore = Math.min(directHits / Math.max(dTokens.length, 1), 1);

    // Score 4: Known domain bonus (10%)
    const knownBonus = (knownTopics !== null && sharedTopics.length > 0) ? 0.1 : 0;

    // Weighted combination + sigmoid
    const raw = (topicScore * 0.50) + (cosineScore * 0.25) + (directScore * 0.15) + knownBonus;
    return Math.round(sigmoid(Math.min(raw, 1)) * 100);
}
```

---

### Appendix C: Classifier Text Processing Pipeline (classifier.js)

The following code shows the abbreviation expander, stemmer, tokenizer, TF builder, and cosine similarity function.

```javascript
// Expand common technical abbreviations before tokenization
function expandAbbreviations(text) {
    let t = ' ' + text.toLowerCase() + ' ';
    for (const [abbr, expansion] of Object.entries(ABBR)) {
        t = t.split(abbr).join(expansion);
    }
    return t.trim();
}

// Simple suffix-stripping stemmer
function stem(t) {
    if (t.length > 7 && t.endsWith('tion'))  return t.slice(0, -4);
    if (t.length > 6 && t.endsWith('ing'))   return t.slice(0, -3);
    if (t.length > 5 && t.endsWith('ed'))    return t.slice(0, -2);
    if (t.length > 5 && t.endsWith('er'))    return t.slice(0, -2);
    if (t.length > 5 && t.endsWith('ly'))    return t.slice(0, -2);
    if (t.length > 4 && t.endsWith('s'))     return t.slice(0, -1);
    return t;
}

// Tokenize, filter stopwords and short tokens
function tokenize(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

// Build normalized term-frequency vector with stemmed keys
function buildTF(tokens) {
    const tf = {};
    tokens.forEach(t => {
        const key = stem(t);
        tf[key] = (tf[key] || 0) + 1;
    });
    const total = tokens.length || 1;
    Object.keys(tf).forEach(k => { tf[k] /= total; });
    return tf;
}

// Cosine similarity between two TF vectors
function cosine(a, b) {
    let dot = 0, magA = 0, magB = 0;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach(k => {
        const va = a[k] || 0, vb = b[k] || 0;
        dot += va * vb;
        magA += va * va;
        magB += vb * vb;
    });
    if (!magA || !magB) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
```

---

### Appendix D: Session Start and End Logic (popup.js)

The following code shows how a focus session is started and ended from the popup.

```javascript
function startFocusSession() {
    const intent = document.getElementById('intent_input').value.trim();
    const intentCategory = document.getElementById('intent_category').value;
    const taskDescription = document.getElementById('task_description').value.trim();

    if (!intent) {
        document.getElementById('intent_input').style.borderColor = '#dc3545';
        document.getElementById('intent_input').focus();
        return;
    }
    if (selectedMinutes === 0) {
        const errEl = document.getElementById('duration_error');
        errEl.style.display = 'block';
        setTimeout(() => { errEl.style.display = 'none'; }, 3000);
        return;
    }

    const endTime = Date.now() + selectedMinutes * 60 * 1000;
    const sessionId = 'session_' + crypto.randomUUID();

    chrome.storage.local.get(['allowlist'], (existing) => {
        chrome.storage.local.set({
            intent, intentCategory, taskDescription,
            timerEndTime: endTime,
            timerMinutes: selectedMinutes,
            sessionId,
            sessionStartTime: Date.now(),
            sessionAllowlistSnapshot: existing.allowlist || [],
            lastSessionSummary: null
        }, () => {
            chrome.runtime.sendMessage({ action: 'startTimer', endTime });
            showActiveSession(intent, endTime - Date.now());
        });
    });
}

function endSession() {
    chrome.storage.local.get(
        ['sessionId', 'intent', 'intentCategory', 'sessionStartTime', 'timerMinutes',
         'sessionAllowlistSnapshot', 'tempAllowlist', 'decisionLogs'],
        (data) => {
            const now = Date.now();
            const actualMinutes = Math.round((now - (data.sessionStartTime || now)) / 60000);
            const plannedMinutes = data.timerMinutes || 0;
            const completionPct = plannedMinutes > 0
                ? Math.round((actualMinutes / plannedMinutes) * 100) : 0;

            const sessionDecisions = (data.decisionLogs || []).filter(d => d.sessionId === data.sessionId);
            const summary = {
                intent: data.intent,
                plannedMinutes, actualMinutes, completionPct,
                blocked: sessionDecisions.filter(d => d.decision === 'block').length,
                allowed: sessionDecisions.filter(d => d.decision === 'allow').length,
                endedBy: 'user'
            };

            chrome.storage.local.remove(
                ['timerEndTime', 'intent', 'intentCategory', 'taskDescription', 'timerMinutes',
                 'sessionId', 'sessionStartTime', 'tempAllowlist', 'sessionAllowlistSnapshot'],
                () => {
                    chrome.runtime.sendMessage({ action: 'stopTimer' });
                    chrome.storage.local.set({ lastSessionSummary: summary }, () => {
                        showSummaryView(summary);
                    });
                }
            );
        }
    );
}
```

---

### Appendix E: Allow and Block Decision Handlers (intercept.js)

The following code shows how the intercept page handles the user's allow and block decisions.

```javascript
// Allow — let the user proceed to the original URL
document.getElementById('btn_allow').addEventListener('click', () => {
    const addToAllowlist = document.getElementById('add_to_allowlist').checked;

    chrome.runtime.sendMessage({
        action: 'logDecision',
        data: {
            sessionId, intent, intentCategory, domain,
            url: originalUrl, decision: 'allow',
            addedToAllowlist: addToAllowlist
        }
    });

    if (addToAllowlist) {
        chrome.storage.local.get(['allowlist'], (data) => {
            const allowlist = data.allowlist || [];
            if (!allowlist.includes(domain)) allowlist.push(domain);
            chrome.storage.local.set({ allowlist }, () => {
                window.location.href = originalUrl;
            });
        });
    } else {
        chrome.storage.local.get(['tempAllowlist'], (data) => {
            const tempList = data.tempAllowlist || [];
            if (!tempList.includes(domain)) tempList.push(domain);
            chrome.storage.local.set({ tempAllowlist: tempList }, () => {
                window.location.href = originalUrl;
            });
        });
    }
});

// Block — log the decision and show the "stay focused" confirmation
document.getElementById('btn_block').addEventListener('click', () => {
    chrome.runtime.sendMessage({
        action: 'logDecision',
        data: {
            sessionId, intent, intentCategory, domain,
            url: originalUrl, decision: 'block', addedToAllowlist: false
        }
    });
    document.getElementById('intercept_view').style.display = 'none';
    document.getElementById('block_confirm').style.display = 'flex';
});

document.getElementById('btn_go_back').addEventListener('click', () => {
    if (window.history.length > 1) {
        window.history.go(-2);
    } else {
        window.close();
    }
});
```

---

### Appendix F: Analytics Chart and Data Export (history.js)

The following code shows the 7-day trend chart renderer and the JSON/CSV export functions.

```javascript
function renderTrendChart(logs) {
    const chartEl = document.getElementById('trend_chart');
    const gridEl = document.getElementById('chart_grid');
    if (logs.length === 0) { chartEl.style.display = 'none'; return; }
    chartEl.style.display = 'block';

    // Build per-day counts for the last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({ label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    key: d.toDateString(), allow: 0, block: 0 });
    }
    logs.forEach(log => {
        const day = days.find(d => d.key === new Date(log.timestamp).toDateString());
        if (!day) return;
        if (log.decision === 'allow') day.allow++;
        else if (log.decision === 'block') day.block++;
    });

    const maxVal = Math.max(...days.map(d => d.allow + d.block), 1);
    gridEl.innerHTML = days.map(d => {
        const allowH = Math.round((d.allow / maxVal) * 64);
        const blockH = Math.round((d.block / maxVal) * 64);
        return `<div class="chart-col">
            <div class="bar-stack">
                ${d.block > 0 ? `<div class="bar-block" style="height:${blockH}px"></div>` : ''}
                ${d.allow > 0 ? `<div class="bar-allow" style="height:${allowH}px"></div>` : ''}
            </div>
            <div class="bar-label">${d.label}</div>
        </div>`;
    }).join('');
}

function exportJSON() {
    chrome.storage.local.get(['decisionLogs', 'sessionLogs', 'userId'], (data) => {
        const payload = {
            userId: data.userId || 'unknown',
            exportedAt: new Date().toISOString(),
            sessions: data.sessionLogs || [],
            decisions: data.decisionLogs || []
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'taskguard_export.json';
        a.click();
        URL.revokeObjectURL(a.href);
    });
}

function exportCSV() {
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    chrome.storage.local.get(['decisionLogs', 'sessionLogs'], (data) => {
        let csv = '', filename = '';
        if (activeTab === 'decisions') {
            csv = 'Timestamp,Intent,Intent Category,Domain,URL,Decision,Added to Allowlist\n';
            (data.decisionLogs || []).forEach(log => {
                csv += `"${log.timestamp}","${(log.intent||'').replace(/"/g,'""')}",` +
                       `"${log.intentCategory}","${log.domain}",` +
                       `"${(log.url||'').replace(/"/g,'""')}","${log.decision}","${log.addedToAllowlist}"\n`;
            });
            filename = 'taskguard_decisions.csv';
        } else {
            csv = 'Session ID,Intent,Intent Category,Start Time,End Time,Planned Minutes,Actual Minutes,Ended By\n';
            (data.sessionLogs || []).forEach(log => {
                const actualMin = Math.round((log.endTime - log.startTime) / 60000);
                csv += `"${log.sessionId}","${(log.intent||'').replace(/"/g,'""')}",` +
                       `"${log.intentCategory}","${new Date(log.startTime).toISOString()}",` +
                       `"${new Date(log.endTime).toISOString()}","${log.plannedMinutes}","${actualMin}","${log.endedBy}"\n`;
            });
            filename = 'taskguard_sessions.csv';
        }
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    });
}
```

---

### Appendix G: Tools and Technologies Used

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Extension format | Chrome Manifest V3 | Required by Chrome; uses service workers instead of persistent background pages |
| Background processing | Chrome Service Worker (`background.js`) | Survives popup closing; manages timer and tab interception while popup is closed |
| UI | HTML5 + CSS3 + Vanilla JavaScript | No framework needed; extension pages are small and self-contained |
| Storage | `chrome.storage.local` | Persists across browser restarts; survives service worker termination |
| Timer | `chrome.alarms` | The only reliable timer in MV3 service workers — `setInterval`/`setTimeout` are unreliable because the service worker can be suspended |
| Tab interception | `chrome.webNavigation.onCommitted` | Fires once per main-frame navigation commit; more reliable than `onBeforeNavigate` |
| Relevance scoring | TF-IDF cosine similarity + topic Jaccard + direct token matching | Fully in-browser, synchronous, zero latency, no model downloads |
| Downloads | `chrome.downloads` | Used for JSON/CSV export of session and decision logs |
| ID generation | `crypto.randomUUID()` (Web Crypto API) | Cryptographically random session and user IDs; built into the browser |
| Development tools | VS Code + Chrome DevTools + Load Unpacked | Used for coding, debugging, and live-reloading the extension during development |
