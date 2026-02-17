Here’s a **detailed but structured feature list** you can use for a **presentation, README, or methodology section**.
I’ve grouped them so it’s easy to explain *what the system does* vs *what it enables for research*.

---

## **Core User Features**

### 1. Intent Declaration

* Users explicitly declare their current task before starting a focus session
* Supports short natural-language descriptions (e.g., *“Prepare for OS exam”*)
* Intent is treated as contextual ground truth, not inferred behavior

---

### 2. Focus Session Management

* Predefined focus durations (15, 25, 45, 60 minutes)
* One-click session start and manual termination
* Session state persists across browser restarts
* Visual feedback via extension badge countdown

---

### 3. Context-Aware Website Interception

* Monitors active tabs during focus sessions
* Extracts website domain when a page is accessed
* Differentiates between allowlisted and non-allowlisted sites
* Same website can behave differently under different intents

---

### 4. Relevance Validation Prompt

* Triggered when a potentially distracting site is accessed
* Displays current task intent for context reinforcement
* Asks the user to validate relevance explicitly:

  * **Allow** (relevant to task)
  * **Block** (distracting for task)
* Decision is enforced immediately

---

### 5. Allowlist Management

* Users can pre-approve trusted websites
* Allowlist applies only during focus sessions
* Reduces unnecessary prompts for clearly relevant resources

---

## **Data Collection & Research Features**

### 6. Human-in-the-Loop Decision Logging

* Every allow/block action is logged as labeled data
* Captures:

  * Task intent
  * Website domain
  * User decision
  * Timestamp
  * Session ID
* Decisions act as human-validated relevance labels

---

### 7. Pseudonymous User Identification

* Each extension install generates a random anonymous user ID
* No login or personal data required
* Enables per-user and cross-user analysis while preserving privacy

---

### 8. Local-First Data Storage

* All session and decision data stored using `chrome.storage.local`
* No external servers or cloud storage
* Fully offline and privacy-preserving by design

---

### 9. Dataset Generation

* Accumulates intent–website–decision triples over time
* Enables analysis of context dependency (same site, different outcomes)
* Serves as a novel labeled dataset for:

  * Relevance modeling
  * Focus behavior analysis
  * Productivity research

---

### 10. Data Export

* Users can explicitly export their interaction data
* Supports JSON (and optionally CSV) format
* Enables offline analysis, aggregation, and ML experiments
* Maintains informed user consent

---

## **Baseline Intelligence Features**

### 11. Semantic Relevance Estimation

* Uses TF-IDF similarity between:

  * User intent text
  * Website metadata (title / domain keywords)
* Provides baseline relevance prediction
* Used for comparison with human decisions

---

### 12. Explainable Decisions

* System can display why a site was flagged (keyword overlap, similarity score)
* Improves transparency and user trust
* Supports explainable AI principles

---

## **System-Level Features**

### 13. Lightweight Architecture

* Built entirely with web technologies
* No build tools or external dependencies
* Fast response time suitable for real-time browsing

---

### 14. Privacy & Ethics by Design

* No passive tracking
* No hidden data collection
* Explicit user interaction required for every labeled decision
* Data ownership remains with the user

---

## **One-Line Summary You Can Say Confidently**

> TaskGuard combines intent-aware focus management with human-validated data collection, enabling both immediate distraction control and long-term learning of why users focus or get distracted.

