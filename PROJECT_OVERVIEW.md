# TaskGuard: High-Level Overview

## 1. Problem Statement

In today's digital age, users face constant distractions from websites and online content that pull their attention away from important tasks. Traditional website blockers use rigid, time-based approaches that don't account for the context of what the user is actually trying to accomplish. Users need a smarter solution that understands their current work intent and makes intelligent decisions about which websites are relevant vs. distracting.

**Core Challenge:** How can we help users maintain focus by blocking distractions based on task relevance rather than arbitrary time restrictions?

---

## 2. Introduction

**TaskGuard** is an intent-aware Chrome browser extension designed for context-sensitive distraction management. Unlike conventional blockers that operate on fixed schedules, TaskGuard allows users to declare their current task or intent, then dynamically evaluates website relevance to that goal.

The extension empowers users to:
- Declare what they're working on (e.g., "Writing a research paper on AI ethics")
- Set a focused work duration
- Receive intelligent prompts when accessing potentially distracting websites
- Make conscious decisions about their browsing behavior

**Tagline:** *"Stay focused by declaring your intent, not fighting your willpower."*

---

## 3. Objectives

### Technical Objectives
- Build a fully functional Chrome extension using Manifest V3 APIs
- Implement efficient URL interception and blocking mechanisms
- Create intuitive user interfaces for intent management
- Develop local data storage with privacy-first design
- Achieve fast response times (<100ms) for blocking decisions

### User Experience Objectives
- Enable users to set focus sessions with clear intent declarations
- Provide visual feedback through extension badge countdown
- Support allowlist management for pre-approved websites
- Offer seamless session management (start/end functionality)

### Research Objectives
- Collect data on user distraction patterns
- Analyze correlation between intent and browsing behavior
- Generate insights for improving focus and productivity

---

## 4. Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Chrome APIs** | storage, alarms, action (badge), runtime messaging |
| **Extension Format** | Manifest V3 (latest Chrome extension standard) |
| **Data Storage** | chrome.storage.local (IndexedDB-backed) |
| **Architecture** | Service Worker-based background processing |
| **Build Tools** | None required (pure web technologies) |

---

## 5. Application

### Core Features

| Feature | Description |
|---------|-------------|
| **Intent Declaration** | Text input for users to describe their current task/goal |
| **Task Description** | Additional field for detailed task context |
| **Focus Timer** | Preset durations (15m, 25m, 45m, 60m) for focus sessions |
| **Badge Countdown** | Real-time countdown displayed on extension icon |
| **Allowlist Management** | Add trusted websites that won't be blocked |
| **Session Control** | Start/end focus sessions with one click |
| **Persistent State** | Timer survives browser restarts |

### User Interface Components

1. **Main Popup** (`blocked.html`) - Intent entry and timer selection
2. **Allowlist Page** (`allowlist.html`) - Website whitelist management
3. **Background Worker** (`background.js`) - Badge timer and state management

---

## 6. Workflow

```
+-------------------+     +--------------------+     +------------------+
|  1. TASK START    | --> |  2. FOCUS PERIOD   | --> |  3. SESSION END  |
+-------------------+     +--------------------+     +------------------+
        |                         |                         |
        v                         v                         v
+-------------------+     +--------------------+     +------------------+
| - Click extension |     | - Badge shows time |     | - Timer expires  |
| - Enter intent    |     | - Work on task     |     |   OR             |
| - Set duration    |     | - Manage allowlist |     | - User clicks    |
| - Click Start     |     | - Stay focused     |     |   "End Session"  |
+-------------------+     +--------------------+     +------------------+
```

### Detailed Flow

1. **Session Initiation**
   - User clicks the TaskGuard extension icon
   - Enters their focus intent (e.g., "Complete project report")
   - Optionally adds task description
   - Selects timer duration (15/25/45/60 minutes)
   - Clicks "Start Focus Session"

2. **Active Focus Period**
   - Extension badge displays countdown (e.g., "25m", "10m", "45s")
   - User can access the allowlist to manage approved sites
   - Popup shows remaining time when reopened
   - Timer state persists across browser restarts

3. **Session Completion**
   - Timer reaches zero: Badge shows "Done" (green) for 5 seconds
   - OR user manually ends session via "End Session" button
   - All session data cleared, ready for next focus period

---

## 7. Conclusion

TaskGuard represents a shift from rigid, time-based distraction blocking to intelligent, intent-aware focus management. By requiring users to declare their work intent upfront, the extension promotes conscious decision-making about online activities.

### Key Differentiators
- **Context-Aware:** Blocks based on task relevance, not arbitrary timers
- **User Autonomy:** Users maintain control over their browsing decisions
- **Privacy-First:** All data stored locally, no cloud dependencies
- **Transparent:** Clear visual feedback on focus session status
- **Lightweight:** Pure web technologies, no complex build processes

### Future Potential
- Semantic relevance scoring using NLP/ML
- Analytics dashboard for productivity insights
- Explainable blocking decisions with keyword matching
- Data export for personal review and research

---

*TaskGuard: An Intent-Aware Browser Extension for Context-Sensitive Distraction Management*
