# TaskGuard: Feature List

## Core User Features

### 1. Intent Declaration
- Users explicitly declare their current task before starting a focus session
- Supports short natural-language descriptions (e.g., "Prepare for OS exam")
- Category selection: Studying, Coding, Writing, Research, Work, Design, Reading, Other
- Intent is treated as contextual ground truth, not inferred behavior

### 2. Focus Session Management
- Predefined focus durations (15, 25, 45, 60 minutes)
- One-click session start and manual termination
- Session state persists across browser restarts
- Visual feedback via extension badge countdown

### 3. Context-Aware Website Interception
- Monitors active tabs during focus sessions (including already-open tabs at session start)
- Extracts website domain when a page is accessed
- Differentiates between allowlisted and non-allowlisted sites
- Same website can behave differently under different intents

### 4. Relevance Validation Prompt
- Triggered when a potentially distracting site is accessed
- Displays current task intent for context reinforcement
- User explicitly validates relevance: Allow (relevant) or Block (distracting)
- Decision is enforced immediately

### 5. Allowlist Management
- Users can pre-approve trusted websites permanently or for the current session only
- Reduces unnecessary prompts for clearly relevant resources

---

## Data Collection & Research Features

### 6. Human-in-the-Loop Decision Logging
- Every allow/block action is logged as labeled data
- Captures: task intent, website domain, user decision, timestamp, session ID
- Decisions act as human-validated relevance labels

### 7. Pseudonymous User Identification
- Each install generates a random anonymous user ID
- No login or personal data required
- Enables per-user analysis while preserving privacy

### 8. Local-First Data Storage
- All session and decision data stored using `chrome.storage.local`
- No external servers or cloud storage
- Fully offline and privacy-preserving by design

### 9. Dataset Generation
- Accumulates intent–website–decision triples over time
- Enables analysis of context dependency (same site, different outcomes under different intents)
- Serves as a labeled dataset for relevance modeling and focus behavior analysis

### 10. Data Export
- Users can export their interaction data as JSON
- Enables offline analysis and research use
- Maintains informed user consent

---

## Planned Features

### 11. Semantic Relevance Scoring (TF-IDF)
- Compare user intent text against page title/domain keywords
- Baseline model trained on CLINC150 dataset
- Provide automatic relevance prediction before prompting user

### 12. Explainable Decisions
- Display why a site was flagged (keyword overlap, similarity score)
- Improves transparency and user trust
