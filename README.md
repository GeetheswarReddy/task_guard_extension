# TaskGuard

An intent-aware Chrome extension for context-sensitive distraction management. TaskGuard helps you stay focused by intercepting potentially distracting websites during focus sessions and asking you to validate their relevance to your current task.

## Overview

TaskGuard combines focus session management with human-validated data collection, enabling both immediate distraction control and long-term learning of browsing behavior patterns.

## Features

### Core Functionality

#### 1. Intent Declaration
- Declare your current task before starting a focus session
- Natural-language descriptions (e.g., "Prepare for OS exam")
- Category selection: Studying, Coding, Writing, Research, Work, Design, Reading, Other
- Optional detailed task description

#### 2. Focus Session Management
- Predefined focus durations: 15, 25, 45, or 60 minutes
- One-click session start and manual termination
- Session state persists across browser restarts
- Visual countdown timer in the extension popup
- Badge indicator showing remaining time

#### 3. Website Interception
- Monitors active tabs during focus sessions
- Automatically intercepts non-allowlisted websites
- Displays an interception page with:
  - Your current task/intent for context
  - The website you're trying to access
  - Allow (Relevant) / Block (Distracting) buttons
- Option to permanently add sites to allowlist during interception

#### 4. Allowlist Management
- Pre-approve trusted websites before or during sessions
- Quick-add buttons for common productive sites (Google, Stack Overflow, GitHub, Wikipedia, etc.)
- Temporary session-based allowlist for one-time access
- Permanent allowlist for always-allowed sites

### Data Collection & Analytics

#### 5. Decision Logging
Every allow/block decision is logged with:
- Session ID
- Task intent and category
- Website domain and URL
- User decision (allow/block)
- Timestamp
- Whether added to permanent allowlist

#### 6. Session Logging
Each focus session records:
- Session duration (planned vs actual)
- How session ended (timer completion or user termination)
- Intent and category
- Allowlist state at session start
- Sites allowed during the session

#### 7. History Dashboard
- **Decisions Tab**: View all allow/block decisions with statistics
  - Total decisions count
  - Allowed vs blocked breakdown
  - Unique sites encountered
- **Sessions Tab**: View all focus sessions
  - Total sessions and focus minutes
  - Completion rate (timer vs early end)

#### 8. Data Export
- Export all data as JSON for analysis
- Includes sessions, decisions, and pseudonymous user ID
- Privacy-preserving with user-controlled export

### Privacy & Architecture

- **Local-first storage**: All data stored using `chrome.storage.local`
- **No external servers**: Fully offline and privacy-preserving
- **Pseudonymous identification**: Random user ID for analysis without personal data
- **Lightweight**: Pure JavaScript with no external dependencies

## File Structure

```
browser_focus_extension/
├── manifest.json        # Chrome extension manifest (MV3)
├── background.js        # Service worker for tab monitoring and timer
├── popup.html           # Main extension popup UI
├── popup.js             # Popup logic and session management
├── intercept.html       # Website interception page
├── intercept.js         # Interception page logic
├── allowlist.html       # Allowlist management page
├── allowlist.js         # Allowlist CRUD operations
├── history.html         # History and analytics dashboard
├── history.js           # History display and export logic
├── blocked.html         # Alternative blocked page (legacy)
├── blocked.js           # Legacy blocked page logic
├── image.png            # Extension icon
├── TaskGuard.md         # Feature documentation
├── To-do.md             # Development roadmap
└── README.md            # This file
```

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the `browser_focus_extension` folder
5. The TaskGuard icon will appear in your extensions bar

## Usage

### Starting a Focus Session

1. Click the TaskGuard extension icon
2. Enter what you're working on (e.g., "Study for calculus exam")
3. Select a category that best fits your task
4. Optionally add more details about your task
5. Choose a focus duration (15, 25, 45, or 60 minutes)
6. Click "Start Focus Session"

### During a Session

- The extension badge shows remaining time
- Non-allowlisted websites will be intercepted
- Choose "Allow" if the site is relevant to your task
- Choose "Block" to stay focused
- Check "Always allow this site" to add to permanent allowlist

### Managing Your Allowlist

- Click "Manage Allowlist" during a session, or
- Click "Allowlist" in the footer anytime
- Add domains manually or use quick-add buttons
- Remove sites by clicking the X next to them

### Viewing History

- Click "History" in the footer
- Switch between Decisions and Sessions tabs
- View statistics and detailed logs
- Export data as JSON for further analysis

## Permissions

The extension requires:
- `storage`: Store session data, allowlist, and logs locally
- `alarms`: Manage focus session timers
- `tabs`: Monitor tab URL changes for interception
- `webNavigation`: Detect page navigations for interception

## Technology Stack

- **Manifest Version**: 3 (MV3)
- **Languages**: HTML, CSS, JavaScript
- **APIs**: Chrome Extensions API (storage, alarms, tabs, webNavigation, action)
- **Storage**: chrome.storage.local
- **Architecture**: Service Worker (background.js) + Popup + Full-page UIs

## To-Do List

### Completed

- [x] Multiple sites input in a single field (comma-separated domains)
- [x] User confirmation dialogs for critical actions (end session early, clear data)
- [x] CSV export format option alongside JSON

### Pending (Originally Planned)

- [ ] After-session summary popup with session statistics
- [ ] Semantic relevance estimation using TF-IDF similarity between intent text and website metadata
- [ ] Explainable blocking decisions (display why a site was flagged based on keyword overlap/similarity score)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is for educational and research purposes.

---

> TaskGuard combines intent-aware focus management with human-validated data collection, enabling both immediate distraction control and long-term learning of why users focus or get distracted.
