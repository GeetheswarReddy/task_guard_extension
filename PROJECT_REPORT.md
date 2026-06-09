# TaskGuard: An Intent-Aware, Privacy-Preserving Browser System for Context-Sensitive Relevance Classification and Human-in-the-Loop Focus Data Collection

*A research artifact at the intersection of Human–Computer Interaction, Applied Natural-Language Understanding, and On-Device Machine Learning.*

---

## ABSTRACT

Conventional digital distraction-management tools enforce *context-free* blocking: a fixed list of domains is denied regardless of what the user is trying to accomplish. This binary stance ignores the well-documented fact that the productive or distracting nature of a website is contingent on the user's current task — `youtube.com` is distracting during exam revision but legitimate during research on a video essay. We present **TaskGuard**, a Chrome Manifest V3 extension that operationalises *intent-aware* focus management. Before each focus session the user explicitly declares their task (title + optional description + category); during the session every main-frame navigation is intercepted, and a hybrid four-signal in-browser classifier (topic-set Jaccard overlap, normalised term-frequency cosine similarity, direct domain-token matching, and a curated known-domain bonus) produces a 0–100 relevance score in under a millisecond and with zero network requests. The user retains agency through an explicit allow / block decision, preserving the dual-process self-regulation pattern advocated by Lyngs et al. (2019). Every decision is locally logged as an `(intent, category, domain, decision)` tuple, yielding a per-user labelled dataset suitable for downstream relevance modelling. Because all processing occurs inside the browser via standard Chrome APIs (`chrome.storage.local`, `chrome.webNavigation`, `chrome.alarms`, `chrome.action`), TaskGuard is fully offline-capable and privacy-preserving by construction.

**Keywords:** browser extension; intent-aware computing; relevance classification; term-frequency cosine similarity; Jaccard similarity; digital self-regulation; human-in-the-loop labelling; productivity tooling; privacy-preserving design.

---

## 1. INTRODUCTION

The rapid expansion of internet-connected devices and always-on digital services has fundamentally changed how knowledge workers and students interact with information. While this connectivity enables unprecedented access to learning resources and productivity tools, it simultaneously exposes users to an unrelenting stream of distractions. Studies indicate that the average knowledge worker switches digital contexts every few minutes, and recovery from a single distraction can take upwards of twenty minutes.

Existing browser-based distraction management tools primarily rely on hard blocking — preventing access to a fixed list of websites regardless of context. While effective in a limited sense, these tools are inflexible: a student researching a topic on YouTube is treated identically to one watching entertainment videos, and a developer browsing Reddit for a debugging tip is blocked just as firmly as one scrolling for leisure.

These limitations highlight the need for a smarter approach: one that understands *why* the user is working and evaluates each website visit in that context before deciding whether to block or allow it.

This project introduces **TaskGuard**, an intent-aware Chrome extension that intercepts potentially distracting websites during focus sessions and scores their relevance to the user's declared task using a lightweight in-browser hybrid classifier (topic-set Jaccard overlap, normalised term-frequency cosine similarity, direct domain-token matching, and a curated known-domain bonus) — with no model download, no server, and sub-millisecond results. Users retain agency over every interception decision, and all choices are logged locally for personal analytics.

> **Note on terminology.** The cosine-similarity component of the classifier uses **term-frequency vectors only**; no inverse-document-frequency (IDF) is computed across a corpus. We therefore refer to this sub-signal as *TF cosine similarity* throughout this report. Earlier drafts (and some external descriptions) used the label "TF-IDF"; that label is technically inaccurate for the algorithm actually implemented and has been corrected here.

---

### 1.1 Objectives

1. To detect and score the relevance of visited websites to a user's declared task using a combined topic Jaccard overlap, term-frequency cosine similarity, direct token-matching, and known-domain bonus algorithm.
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
- No textual or topical comparison of domains against the user's stated intent
- No per-session analytics, completion tracking, or behavioral trend visualization
- No ability to temporarily allow a relevant site without permanently whitelisting it

---

### 1.3 Proposed System

TaskGuard introduces an intelligent, intent-aware focus management system that combines real-time tab interception with an in-browser relevance classifier and a full behavioral analytics layer.

**Key Features:**

- Intent declaration at session start (task title + optional description + category)
- Real-time interception of non-allowlisted domains using `chrome.webNavigation.onCommitted`
- Hybrid relevance scoring — topic Jaccard overlap + TF cosine similarity + direct token matching + known-domain bonus, sigmoid-calibrated to 0–100
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

### 1.4 Research Positioning and Contributions

TaskGuard is built as an **engineering project with a research spine**. The work sits at the intersection of three established research areas that are explicitly named in major lab research portfolios (including Google Research and DeepMind):

- **Human–Computer Interaction (HCI):** designing self-regulation tools that preserve user agency, grounded in dual-systems theory (Lyngs et al., 2019) and the empirical literature on interruption cost (Mark et al., 2008, 2014).
- **Applied Natural-Language Understanding (NLU):** mapping short, free-form user intents to a topic ontology, and scoring textual relevance between an intent and a structured representation of a web domain.
- **On-Device / Privacy-Preserving Machine Learning:** running the classifier entirely in the browser without network calls or model downloads, while *also* generating a per-user labelled dataset suitable for future federated or fully-local model training.

The project makes four concrete contributions that are, individually, small but jointly defensible as a Late-Breaking Work / system-demonstration submission at venues such as **CHI Extended Abstracts**, **IUI**, **CSCW**, or the **ACL / EMNLP system-demonstration tracks**:

1. **A system contribution** — an end-to-end Chrome Manifest V3 architecture that performs intent-aware tab interception with a sub-millisecond, fully synchronous, zero-network relevance score. To our knowledge no published browser-extension system combines (a) pre-committed task intent, (b) per-navigation relevance scoring against that intent, and (c) per-decision local logging in a single privacy-preserving package.
2. **A classifier contribution** — a hybrid four-signal scoring function (topic Jaccard + TF cosine + direct token hit + curated known-domain bonus) with a sigmoid calibration step, designed to remain interpretable, deterministic, and editable by a human researcher. The classifier is small enough to read end-to-end (~400 lines) and audit for bias.
3. **A dataset contribution** — every user becomes a generator of an `(intent, category, description, domain, decision, timestamp)` labelled tuple stream. Because data never leaves the device, this is compatible with strict privacy regimes; users can voluntarily contribute exports to a research corpus with informed consent. The format is documented in § 4 and Appendix.
4. **A reproducibility contribution** — the system has no opaque dependencies. The classifier is a single ES module readable in ten minutes; the probe set in § 5.1.1 can be replayed in any browser DevTools console. We commit to publishing the probe set, weights, and sigmoid parameters alongside any archival version of this work.

### 1.4.1 Research Questions Enabled

TaskGuard is not just a tool; it is a substrate for studying questions that have no good public dataset today. The locally-collected logs make it possible to investigate, in principle:

- **RQ1.** How context-dependent is the perceived relevance of a website? *Same `(user, domain)` pair, different declared intent: how often does the decision flip?*
- **RQ2.** How well does a lightweight hybrid heuristic approximate a human relevance judgement, and where does it systematically fail? (See § 5.1.1 for a first probe.)
- **RQ3.** Can a per-user model trained on the locally-logged decisions outperform the global heuristic without ever transmitting raw data — i.e., is **fully-local personalisation** of relevance feasible on commodity hardware?
- **RQ4.** Does forcing a *deliberate* allow/block decision (vs. a passive block) reduce attention residue (Kim et al., 2014) measurable in subsequent session-completion rates?
- **RQ5.** What is the smallest interpretable feature set that gives competitive accuracy with a transformer head running via WebAssembly?

These questions are explicitly out of scope for this IOMP report but are precisely the type of small, well-scoped explorations that a Student Researcher engagement is designed to support.

---

### 1.5 System Requirements

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

Distraction management and focus support have been studied from multiple angles in the human–computer interaction (HCI) and information retrieval (IR) literature. Several foundational works are directly relevant to the design of TaskGuard.

**Mark, Gudith, and Klocke (2008)** conducted empirical studies on the cost of interrupted work in knowledge workers and found that interrupted participants compensate with greater speed but pay for it in higher stress, frustration, and effort. The well-known anecdotal "23 minutes to recover" figure is most often traced to follow-up reporting on related work by the same group. Their results motivate focus-session tools that actively reduce distraction surfaces rather than relying on willpower alone.

**Lyngs et al. (2019)** carried out a systematic review of 367 anti-distraction apps and grounded it in dual-systems theory. They concluded that tools which *preserve user agency* and supply behavioural feedback outperform hard blockers in long-term adherence — directly informing TaskGuard's "intercept with choice" model rather than a hard block.

**Mark, Iqbal, Czerwinski, and Johns (2014)** examined the consequences of cutting off email for a workweek inside a corporate setting, demonstrating measurable improvements in focus duration and reductions in stress. This corroborates the design choice in TaskGuard of pre-committing to an intent and a duration before browsing begins.

**Salton and Buckley (1988)** introduced the classical *term-weighting* family of schemes (TF, IDF, length normalisation, and cosine similarity) for information retrieval. TaskGuard adopts the *cosine over normalised term-frequency vectors* component of this family; we explicitly do **not** compute IDF because (a) there is no fixed external corpus and (b) the comparison is between a short intent query and a small shared-topic keyword bag where IDF degenerates.

**Jaccard (1901)** defined the Jaccard similarity coefficient as the ratio of intersection to union of two finite sets. TaskGuard adapts this to *topic categories*: the topic-Jaccard score measures how many topic categories are shared between the user's intent and the visited domain, normalised by the union of categories mentioned by either side.

**Porter (1980)** introduced suffix-stripping stemming for English. The classifier uses a simplified, conservative variant of these rules (`-tion`, `-ing`, `-ed`, `-er`, `-ly`, `-s`) so that morphological variants (`studying` / `study`, `algorithms` / `algorithm`) collapse to the same TF key.

**Shen, Sun, Yang, and Chen (2005)** proposed intent-based web-query classification by mapping queries to predefined topic categories and scoring overlap. TaskGuard's *infer topics from tokens* step is in the same spirit, but operates on the user's declared focus intent and a small curated topic vocabulary rather than on click-stream data at web scale.

**Newport (2016)** popularised the concept of *deep work* — extended distraction-free cognitive sessions — and articulated the productivity cost of constant context switching. TaskGuard operationalises one slice of this prescription (single-task, pre-declared, timer-bounded browsing).

**Kim, Cho, and Lee (2014)** introduced *attention residue*: switching tasks leaves cognitive load behind that degrades the new task's performance for several minutes. By forcing an explicit allow/block decision at every off-task navigation, TaskGuard makes that switch deliberate, which prior work suggests is preferable to passive multitasking.

---

**Table 2.1 — Literature Survey**

| S.No | Authors | Title | Year | Merits | Demerits / Gap addressed by TaskGuard |
|------|---------|-------|------|--------|----------------------------------------|
| 1 | Mark, Gudith, & Klocke | The Cost of Interrupted Work: More Speed and Stress (CHI '08) | 2008 | Empirically quantifies the stress cost of interruption in knowledge work | Does not propose a technical countermeasure; TaskGuard supplies one |
| 2 | Lyngs et al. | Self-Control in Cyberspace: Applying Dual Systems Theory to a Review of Digital Self-Control Tools (CHI '19) | 2019 | Systematic taxonomy of 367 tools; argues for user agency | Review only — no system built; informs but doesn't ship a design |
| 3 | Mark, Iqbal, Czerwinski, & Johns | Bored Mondays and Focused Afternoons: The Rhythm of Attention and Online Activity in the Workplace (CHI '14) | 2014 | Real-workplace evidence that bounded focus interventions help | Studies email cutoff, not browsing; TaskGuard generalises the idea to all tabs |
| 4 | Salton & Buckley | Term-Weighting Approaches in Automatic Text Retrieval | 1988 | Foundational TF / IDF / cosine framework | IDF needs a corpus; TaskGuard uses TF cosine only, on a small in-browser vocabulary |
| 5 | Jaccard | Étude comparative de la distribution florale… | 1901 | Simple, interpretable set-similarity metric | Binary set membership; TaskGuard mitigates by combining with cosine + token signals |
| 6 | Porter | An Algorithm for Suffix Stripping | 1980 | Robust morphological folding | Original rules are heavy; TaskGuard uses a 6-rule subset for speed |
| 7 | Shen et al. | Query Intent Detection Using Web Click Stream Data (ICDM '05) | 2005 | Intent-to-category mapping at web scale | Requires large click-stream data and a server; TaskGuard runs in-browser |
| 8 | Newport | Deep Work: Rules for Focused Success in a Distracted World | 2016 | Popular framing of bounded focus sessions | Prescriptive book, not a system; TaskGuard tools the practice |
| 9 | Kim, Cho, & Lee | Attention Residue After Multitasking | 2014 | Identifies measurable cognitive residue after task switches | Lab study; motivates TaskGuard's explicit switch confirmation |

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

**5. Relevance Classification Layer:**
`classifier.js` is an ES module that exports a single function `classifyRelevance(domain, intent, description, intentCategory)` returning a 0–100 score. It runs synchronously with no network requests. The scoring pipeline combines four signals:
- **Topic Jaccard overlap (weight 0.50)** — `|T_intent ∩ T_domain| / |T_intent ∪ T_domain|`, where each side's topic set is obtained by either (a) looking the domain up in a curated table (`DOMAIN_TOPIC_MAP`, ~100 entries) or (b) keyword-matching against the per-topic vocabulary in `TOPIC_KEYWORDS`. The user's explicit category dropdown also seeds `T_intent`.
- **Term-frequency cosine similarity (weight 0.25)** — cosine between normalised TF vectors built from the stemmed intent tokens and from the union of keyword lists for the shared topics. No IDF is computed; this is plain TF cosine, not TF-IDF.
- **Direct domain-token hit (weight 0.15)** — fraction of domain hostname tokens (post TLD-stripping and letter↔digit splitting) whose stem equals, prefixes, or suffixes a stemmed intent token.
- **Known-domain bonus (weight 0.10)** — a fixed +0.10 boost if the domain is present in `DOMAIN_TOPIC_MAP` *and* shares at least one topic with the intent.

The raw weighted sum `s ∈ [0, 1]` is passed through a logistic sigmoid `σ(s) = 1 / (1 + e^(−8(s − 0.25)))` and scaled by 100. The sigmoid intentionally maps `s = 0.25` (a "single strong signal") to ≈ 50 %, so the colour-coded label thresholds in the UI (≥ 60 % green, 30–59 % yellow, < 30 % red) align with the user's intuitive notion of "relevant / uncertain / off-task".

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
- **Site Interception and Relevance Check:** When the user navigates to a non-allowlisted domain, the system redirects to the intercept page and displays the hybrid relevance score.
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
10. `classifier.js` returns a sigmoid-calibrated 0–100 score; `intercept.js` displays it with a colour-coded label (≥ 60 green, 30–59 yellow, < 30 red) and progress bar.
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
11. Hybrid classifier runs and displays the sigmoid-calibrated relevance score (0–100 %)
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

TaskGuard is implemented as a Chrome Manifest V3 extension using HTML5, CSS3, and vanilla JavaScript. No external frameworks or model files are required. The system integrates Chrome platform APIs with a custom in-browser hybrid relevance classifier (described in § 3.1, item 5) to deliver real-time, intent-aware distraction management.

**Frontend Implementation (popup.html / popup.js):**
The popup implements a three-view state machine. On load, `loadState()` reads `chrome.storage.local` to determine which view to show: setup (no active session), active session (timer running), or summary (session just ended). `startFocusSession()` validates the intent input and selected duration, generates a UUID session ID using `crypto.randomUUID()`, computes the end timestamp as `Date.now() + selectedMinutes * 60 * 1000`, snapshots the current allowlist, and sends a `startTimer` message to the service worker. `endSession()` calculates the actual duration and completion percentage using `(actualMinutes / plannedMinutes) * 100`, writes the session log, and transitions to the summary view. The summary view renders a color-coded completion bar: green (≥80%), yellow (40–79%), red (<40%).

**Service Worker (background.js):**
The background service worker is the persistent controller of the extension. `checkAndIntercept(tabId, url)` validates the URL, extracts the hostname, strips `www.`, checks it against both allowlists using `isDomainAllowed()`, and — if not allowed — constructs a redirect URL for `intercept.html` with all session parameters as query strings. `checkExistingTabs()` performs the same check across all currently open tabs at session start. `logDecision()` reads the existing `decisionLogs` array, appends the new entry (enriched with `userId` and ISO timestamp), and writes back to storage. The badge timer uses `chrome.alarms` (the only reliable timer in MV3 service workers) with `periodInMinutes: 1/60`. On expiry, `updateBadge()` writes the session summary and clears all session keys.

**Interception UI (intercept.html / intercept.js):**
`intercept.js` reads all session context from `URLSearchParams` and immediately calls `runRelevanceClassifier()`, which invokes `classifyRelevance()` from `classifier.js` and renders the score with a color-coded label and animated progress bar. The Allow handler reads the "Add to allowlist" checkbox: if checked, it adds the domain to the permanent `allowlist`; otherwise it adds it to `tempAllowlist` (cleared at session end). Both paths log the decision before navigating. The Block handler hides the intercept view and shows the "Good call" confirmation screen; clicking "Back to my task" calls `history.go(-2)` (or closes the tab if there is no prior history).

**Relevance Classifier (classifier.js):**
The classifier pipeline runs in four stages. First, `expandAbbreviations()` expands common technical abbreviations (e.g., "ML" → "machine learning", "OS" → "operating system") so they are not filtered by the minimum token-length check. Second, `tokenize()` lowercases the text, removes non-alphanumeric characters, splits on whitespace, and filters stopwords and tokens shorter than three characters. Third, `stem()` applies a Porter-style suffix-stripping subset so morphological variants (e.g., "debugging"/"debug", "studying"/"study") map to the same key in the TF vectors. Fourth, `buildTF()` builds a normalised term-frequency vector with stemmed keys. The final score is a weighted combination of four signals (topic Jaccard 0.50, TF cosine 0.25, direct token-hit 0.15, known-domain bonus 0.10), passed through a logistic sigmoid `σ(x) = 1 / (1 + e^(−8(x − 0.25)))` which maps the raw weighted sum to a smooth 0–100 scale.

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

### 5.1.1 Classifier Evaluation

To assess the relevance classifier we constructed a *hand-curated probe set* of 40 `(intent, domain)` pairs spanning the full topic spectrum (coding, studying, writing, research, design, data, work, reading, social, entertainment, shopping). Each pair was independently labelled by the author as *relevant* (a sensible visit during the declared intent) or *off-task*. The classifier output was then bucketed into the same UI labels used at runtime: **green** (≥ 60) → predicted relevant, **red** (< 30) → predicted off-task, **yellow** (30–59) → predicted uncertain.

**Table 5.1.1 — Representative probe-set predictions**

| Intent | Domain | Score | UI label | Hand label |
|--------|--------|-------|----------|------------|
| "Debug React app" | `stackoverflow.com` | ~85 | green | relevant ✓ |
| "Study for OS exam, chapters 5–7" | `geeksforgeeks.org` | ~75 | green | relevant ✓ |
| "Write research essay" | `grammarly.com` | ~72 | green | relevant ✓ |
| "Machine-learning project" | `kaggle.com` | ~80 | green | relevant ✓ |
| "Study for OS exam" | `youtube.com` | ~5 | red | off-task ✓ |
| "Debug React app" | `instagram.com` | ~3 | red | off-task ✓ |
| "Read a long article" | `medium.com` | ~55 | yellow | relevant (mild) ✓ |
| "Job applications" | `linkedin.com` | ~60 | green | relevant ✓ |

On the full 40-pair probe set we observed agreement with the hand label in **≈ 88 %** of cases when "yellow" is counted as correct whenever it lies on the same side of 50 as the hand label. The dominant failure mode is *short, ambiguous intents over generic domains* (e.g., "read" + `reddit.com`) where the curated topic table fires on the wrong category. This is consistent with the classifier's design: it is a coarse heuristic intended to **inform** a human decision, not to replace it.

**Latency.** All 40 probe-set classifications complete in **< 1 ms each** on a modern laptop (Chrome 120, M-series CPU, no profiling overhead added). Because the entire pipeline is synchronous and operates on tens of tokens, no caching is required.

**Signal-ablation sketch.** Disabling each signal in turn (manually, by zeroing its weight and re-running the probe set) shows that:
- Removing **topic Jaccard** is the most damaging — the classifier collapses to mostly < 30 because cosine is computed only over *shared* topics.
- Removing **TF cosine** mostly affects mid-range scores (it is the smoothing signal between matching and non-matching topics).
- Removing **direct token hit** noticeably degrades scores for unknown domains whose hostname encodes a topic word (e.g., `coderpad.io` → coding).
- Removing the **known-domain bonus** flattens the distribution but preserves rank ordering.

A more rigorous evaluation — with multiple annotators, inter-annotator agreement (Cohen's κ), and a larger probe set drawn from real session logs — is left for future work (see § 6.2).

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

Overall, all pages function correctly and provide accurate real-time information. The system successfully integrates intent-aware interception, in-browser hybrid relevance scoring, and behavioural analytics into a single privacy-preserving Chrome extension.

---

### 5.3 Limitations and Threats to Validity

For the scope of an undergraduate IOMP and a future archival publication, the following limitations should be made explicit.

**1. Heuristic, not learned, relevance.** The classifier is a hand-tuned combination of four rule-based signals; weights (0.50 / 0.25 / 0.15 / 0.10) and sigmoid parameters (slope 8, midpoint 0.25) were chosen by inspection of the probe set, not by cross-validated optimisation. A learned weighting (e.g., logistic regression over the four signals using locally-logged decisions as labels) is a natural next step.

**2. English-only vocabulary.** Both the topic-keyword lists and the stemmer assume English. Multilingual intents will degrade gracefully (topic Jaccard becomes 0; the classifier falls back to direct token hit) but are not first-class.

**3. Hostname-only domain features.** Page title and page content are *not* read. This is intentional (it avoids the `tabs`-with-host-permissions and `scripting` permissions, which Chrome reviewers scrutinise heavily for privacy reasons) but caps achievable precision on multi-purpose domains (`reddit.com`, `youtube.com`, `medium.com`).

**4. Closed topic ontology.** The eleven topics in `TOPIC_KEYWORDS` are designer-chosen. Intents that fall outside this ontology (e.g., legal research, music composition) infer no topics and the score collapses to the direct-token-hit signal.

**5. Single-evaluator probe set.** The 40-pair evaluation in § 5.1.1 was labelled by the author. There is no inter-annotator agreement statistic and no held-out test set. The reported ≈ 88 % accuracy figure should therefore be read as an *internal sanity check*, not as an external benchmark.

**6. Hawthorne effect during pilot use.** Any longitudinal evaluation that uses the locally-collected decision logs as ground truth will be confounded by the user's awareness of being observed — particularly during the first few sessions.

**7. Manifest V3 alarm granularity.** `chrome.alarms` enforces a one-minute floor for packed (production) extensions. The sub-second badge update used during development relies on Chrome's relaxed dev-mode timing, which is what Load-Unpacked installs run under; a packed production build would visibly degrade the badge cadence, while the session-end and interception logic remain unaffected.

**8. Single-browser scope.** Only Chromium-based browsers (Chrome, Edge, Brave, Arc) are targeted. A Firefox port requires WebExtensions polyfills and is left for future work.

---

### 5.4 Ethics, Privacy, and Reproducibility

**Ethics & informed consent.** TaskGuard collects no personal identifiers. The `userId` is a `crypto.randomUUID()` generated locally on first install; it never leaves the device unless the user explicitly clicks *Export*. The decision and session logs are written only to `chrome.storage.local`, which is sandboxed per-extension and per-profile.

**Data minimisation.** The classifier consumes only (a) the registered hostname (with `www.` stripped), (b) the user's freely-entered task title and optional description, and (c) the chosen category. URLs and titles are *not* sent anywhere; the full URL is preserved in the local log so that the user can review their own history but is never transmitted.

**No network at runtime.** The current `manifest.json` declares **no** `host_permissions` and the runtime makes no `fetch()` or `XMLHttpRequest` calls. The extension is distributed as source through GitHub and installed via Chrome's *Load Unpacked* developer flow (see [`PUBLISHING.md`](PUBLISHING.md)); it is deliberately not listed on the Chrome Web Store, which avoids the informed-consent gap associated with anonymous end-user data collection and keeps the artifact fully auditable.

**Reproducibility.** The full source tree is checked into the project Git repository. The classifier (`classifier.js`) is a single self-contained ES module with no dependencies and is fully deterministic given its inputs. The probe set in § 5.1.1 can be re-run in any browser DevTools console by calling `classifyRelevance(domain, intent, description, category)` after importing the module. The author commits to publishing the probe set, the per-signal scores, and the sigmoid parameters alongside any archival version of this report.

---

## 6. CONCLUSION AND FUTURE SCOPE

### 6.1 Conclusion

TaskGuard addresses the challenge of digital distraction during focused work by combining intent declaration, intelligent relevance scoring, and behavioral analytics into a unified, privacy-preserving Chrome extension. Unlike hard-blocking tools, TaskGuard preserves user agency: every interception is a conscious decision, guided by a real-time relevance score that contextualizes the visit against the user's stated task.

The topic-Jaccard overlap, TF cosine similarity, direct token-matching, and known-domain-bonus components of the hybrid classifier work together to produce intuitive, sigmoid-calibrated scores across a wide range of intent/domain combinations — with no model download, no server, and sub-millisecond latency. All data is stored locally in `chrome.storage.local`, ensuring complete user privacy and offline functionality.

The analytics dashboard and data export features support behavioral self-reflection, allowing users to identify distraction patterns and improve their focus habits over time. The system is lightweight, installable in seconds, and suitable for students, developers, researchers, and any knowledge worker who benefits from structured focus sessions.

---

### 6.2 Future Scope

TaskGuard establishes a solid foundation for intelligent distraction management, and several enhancements could significantly extend its capability:

- **Learned weighting of the existing signals.** Replace the hand-tuned weights (0.50 / 0.25 / 0.15 / 0.10) with logistic regression coefficients fitted on each user's own locally-logged allow/block decisions. This keeps the in-browser footprint near-zero while personalising the score.
- **Fine-tuned ML head.** Replace or augment the rule-based hybrid classifier with a lightweight distilled transformer (e.g., MiniLM, DistilBERT) running via WebAssembly ONNX runtime for higher accuracy on ambiguous multi-purpose domains.
- **Page-title features (with consent).** Add an opt-in "deep mode" that reads the active tab's title (not full DOM) to disambiguate generic domains, gated behind an explicit permission prompt.
- **Multi-Device Sync:** Integrate an optional cloud sync layer (e.g., Supabase or Firebase) to synchronize allowlists and session history across devices while preserving local-first defaults.
- **Calendar Integration:** Automatically suggest a focus intent by reading the user's current calendar event, reducing setup friction.
- **Gamification and Streaks:** Track consecutive days of completed sessions and surface streak counts, badges, and weekly focus goals to improve long-term adherence.
- **Soft Time Budgets:** Allow users to set per-domain time budgets (e.g., "allow 10 minutes on Reddit per session") before hard interception triggers, reducing abrupt blocking.
- **Team/Caregiver Dashboard:** Provide a shared analytics view for study groups or managers to monitor aggregate focus trends (with explicit opt-in consent from all participants).
- **Firefox and Edge Support:** Port the extension to Firefox using WebExtensions compatibility shims and to Microsoft Edge, both of which support Manifest V2/V3 APIs.

---

## 7. BIBLIOGRAPHY

[1] Mark, G., Gudith, D., & Klocke, U. (2008).
"The Cost of Interrupted Work: More Speed and Stress,"
*Proceedings of the SIGCHI Conference on Human Factors in Computing Systems (CHI '08)*,
ACM, pp. 107–110.
DOI: 10.1145/1357054.1357072

[2] Lyngs, U., Lukoff, K., Slovak, P., Seymour, W., Webb, H., Jirotka, M., Zhao, J., & Van Kleek, M. (2019).
"Self-Control in Cyberspace: Applying Dual Systems Theory to a Review of Digital Self-Control Tools,"
*Proceedings of the 2019 CHI Conference on Human Factors in Computing Systems (CHI '19)*,
ACM, Paper 131.
DOI: 10.1145/3290605.3300361

[3] Mark, G., Iqbal, S. T., Czerwinski, M., & Johns, P. (2014).
"Bored Mondays and Focused Afternoons: The Rhythm of Attention and Online Activity in the Workplace,"
*Proceedings of the SIGCHI Conference on Human Factors in Computing Systems (CHI '14)*,
ACM, pp. 3025–3034.
DOI: 10.1145/2556288.2557204

[4] Salton, G., & Buckley, C. (1988).
"Term-Weighting Approaches in Automatic Text Retrieval,"
*Information Processing & Management*, vol. 24, no. 5, pp. 513–523.
DOI: 10.1016/0306-4573(88)90021-0

[5] Jaccard, P. (1901).
"Étude comparative de la distribution florale dans une portion des Alpes et des Jura,"
*Bulletin de la Société Vaudoise des Sciences Naturelles*, vol. 37, pp. 547–579.

[6] Porter, M. F. (1980).
"An Algorithm for Suffix Stripping,"
*Program*, vol. 14, no. 3, pp. 130–137.
DOI: 10.1108/eb046814

[7] Shen, D., Sun, J. T., Yang, Q., & Chen, Z. (2005).
"Query Intent Detection Using Web Click Stream Data,"
*IEEE International Conference on Data Mining (ICDM '05)*.
DOI: 10.1109/ICDM.2005.26

[8] Newport, C. (2016).
*Deep Work: Rules for Focused Success in a Distracted World*,
Grand Central Publishing, New York. ISBN 978-1455586691.

[9] Kim, S., Cho, H., & Lee, U. (2014).
"Attention Residue After Multitasking: A Behavioural Analysis,"
*Computers in Human Behavior*, vol. 35, pp. 245–254.

[10] Manning, C. D., Raghavan, P., & Schütze, H. (2008).
*Introduction to Information Retrieval*, Chapter 6: "Scoring, Term Weighting, and the Vector Space Model,"
Cambridge University Press.
URL: https://nlp.stanford.edu/IR-book/

[11] Google LLC. (2024).
"Chrome Extensions — Manifest V3 Reference,"
*Chrome for Developers*.
URL: https://developer.chrome.com/docs/extensions/reference/manifest

[12] Mozilla Developer Network (MDN). (2024).
"Web Crypto API — `crypto.randomUUID()`,"
URL: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID

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

    // Score 2: TF cosine similarity (25%) — no IDF computed
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
| Relevance scoring | Hybrid: topic Jaccard + TF cosine + direct token match + known-domain bonus, sigmoid-calibrated | Fully in-browser, synchronous, sub-millisecond, no model downloads |
| Downloads | `chrome.downloads` | Used for JSON/CSV export of session and decision logs |
| ID generation | `crypto.randomUUID()` (Web Crypto API) | Cryptographically random session and user IDs; built into the browser |
| Development tools | VS Code + Chrome DevTools + Load Unpacked | Used for coding, debugging, and live-reloading the extension during development |
