TaskGuard


 🎯 TASKGUARD: Final Project Document

📋 PROJECT TITLE
TaskGuard: An Intent-Aware Browser Extension for Context-Sensitive Distraction Management

🎯 PROJECT OVERVIEW
TaskGuard is a Chrome browser extension that employs intent-based blocking to help users maintain focus on their declared tasks. Unlike traditional time-based website blockers, TaskGuard dynamically evaluates website relevance to the user's current work intent, providing intelligent prompts that encourage conscious decision-making about online distractions.

🔬 AIMS
Primary Aim:
To develop and evaluate an intent-aware distraction management system that enhances user focus through context-sensitive website blocking and explainable decision prompts.
Secondary Aims:
• Create a human-in-the-loop learning system that respects user autonomy while reducing impulsive browsing • Generate a labeled dataset of task intent and website relevance judgments for future research • Demonstrate that making blocking decisions explicit improves user self-awareness of distraction patterns • Design a practical productivity tool that balances effectiveness with user control

🎓 OBJECTIVES
Technical Objectives:
OBJ-1: System Development • Build a fully functional Chrome extension using Manifest V3 APIs • Implement declarativeNetRequest for efficient URL interception • Create intuitive user interfaces for intent management and blocking decisions • Develop local data storage and export functionality
OBJ-2: Intelligent Relevance Detection • Implement semantic similarity algorithm (TF-IDF/embeddings) to match websites against declared intents • Extract website metadata (title, description, keywords) for relevance assessment • Design explainable scoring system that shows matched/missing keywords • Achieve <100ms response time for relevance calculations
OBJ-3: Data Collection Infrastructure • Design comprehensive logging schema capturing intent, URL, decision, score, and timestamp • Implement privacy-preserving data storage (local-only, user-controlled export) • Create data export functionality in CSV/JSON formats • Build analytics dashboard for personal insights
Research Objectives:
OBJ-4: User Behavior Analysis • Document patterns in override decisions (when users bypass blocks) • Analyze correlation between relevance scores and user decisions • Identify common intent categories and associated website patterns • Measure behavioral changes over extended usage periods
OBJ-5: System Evaluation • Compare intent-based blocking against baseline browsing behavior • Assess prediction accuracy of relevance algorithm • Evaluate user experience through usability metrics (SUS, NASA-TLX) • Gather qualitative feedback on decision-making process
OBJ-6: Dataset Contribution • Collect 200-500 labeled intent-website relevance pairs • Create annotation guidelines and intent taxonomy • Release anonymized dataset for reproducibility • Enable future research on context-aware productivity tools

✨ KEY FEATURES
Core Features:
1. Intent Declaration Interface • Clean popup interface for entering current task/goal • Intent history with quick-select from previous tasks • Visual indicator of active intent in extension badge • Support for multiple intent formats (study, work, research, creative) • Auto-save and persistence across browser sessions
2. Intelligent Blocking System • Real-time interception of non-approved website access • Dynamic relevance calculation using semantic matching • Custom blocking page with contextual information • Three decision options: Allow Once, Add to Allowlist, Block & Return • Keyboard shortcuts for quick decisions (Enter/Escape)
3. Explainable Relevance Scoring • Percentage-based relevance score (0-100%) • Visual indicators (🟢 High, 🟡 Medium, 🔴 Low relevance) • Keyword matching display showing:
* ✓ Matched terms between intent and website
* ✗ Missing key terms from intent • Plain-language explanation of scoring logic • Confidence indicators for borderline cases
4. Allowlist Management • Pre-approved websites for each intent • Quick-add functionality from blocking page • Bulk import/export of allowlists • Intent-specific allowlists (different sites for different tasks) • Temporary vs. permanent allowlist options • Domain-level and URL-level whitelisting
5. Comprehensive Data Logging • Automatic logging of all blocking events with:
* Task intent text
* Target website URL and metadata
* Relevance score and matched keywords
* User decision (allowed/blocked)
* Decision latency (time to decide)
* Session context (time of day, day of week) • Privacy-first: all data stored locally, no cloud sync • User-controlled data retention and deletion
6. Analytics Dashboard • Personal productivity insights:
* Total blocks vs. allows
* Override rate (allowed despite low relevance)
* Most common distractions by intent type
* Focus improvement trends over time • Visual charts and graphs for pattern recognition • Exportable reports for self-reflection
7. Settings & Customization • Sensitivity threshold adjustment (minimum relevance for auto-allow) • UI theme options (light/dark mode) • Notification preferences • Data export to CSV/JSON formats • Reset and clear data options • Import/export configuration profiles

🏗️ SYSTEM ARCHITECTURE
Technical Stack:
• Frontend: HTML5, CSS3, Vanilla JavaScript • Chrome APIs: declarativeNetRequest, storage, tabs, alarms • NLP/ML: TF-IDF for text similarity, optional Sentence-BERT integration • Data Storage: chrome.storage.local (IndexedDB fallback) • Build Tools: None required (pure web technologies)
Component Structure:
┌─────────────────────────────────────────┐
│          User Interface Layer           │
├─────────────────────────────────────────┤
│  • Intent Popup                         │
│  • Blocking Interstitial Page          │
│  • Settings & Analytics Dashboard      │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│         Core Logic Layer                │
├─────────────────────────────────────────┤
│  • Background Service Worker            │
│  • URL Interception Engine              │
│  • Relevance Scoring Algorithm          │
│  • Decision Handler                     │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│         Data Management Layer           │
├─────────────────────────────────────────┤
│  • Local Storage Manager                │
│  • Logging Service                      │
│  • Export/Import Handlers               │
│  • Analytics Processor                  │
└─────────────────────────────────────────┘

📊 SUCCESS METRICS
Technical Success Criteria:
• Extension loads and activates without errors on Chrome/Edge • Blocking decisions execute within 100ms • Zero data loss across browser restarts • Compatible with 95%+ of popular websites • Export functionality works for datasets 1000+ entries
User Experience Metrics:
• System Usability Scale (SUS) score ≥ 70 (above average) • Task completion rate for declaring intents ≥ 90% • User retention (continued use after 1 week) ≥ 60% • Cognitive load (NASA-TLX) comparable to manual blocking
Effectiveness Metrics:
• Reduction in off-task browsing time ≥ 20% vs. baseline • User-reported focus improvement (Likert scale) ≥ 4/5 • Override rate (allowed despite block) < 35% (balanced control) • Prediction agreement with user decisions ≥ 65%

🔄 WORKFLOW EXAMPLE
Typical User Session:
1. Task Initiation
User clicks extension → Enters "Writing research paper on AI ethics"
→ Pre-approves: scholar.google.com, arxiv.org, university library
2. Focus Period
User browses approved sites freely
Tries to visit twitter.com → BLOCKED
3. Blocking Decision
┌─────────────────────────────────────────┐
│ 🎯 Current Intent:                      │
│ "Writing research paper on AI ethics"   │
│                                         │
│ 🌐 Attempting to access:                │
│ twitter.com - "Social networking"       │
│                                         │
│ 📊 Relevance: 12% 🔴                    │
│ ✓ Matched: None                         │
│ ✗ Missing: research, paper, AI, ethics  │
│                                         │
│ [Allow Once] [Add to List] [← Block]   │
└─────────────────────────────────────────┘

User selects "Block" → Returns to previous page
Decision logged with score and timestamp
4. End of Session
User completes task → Views analytics
"Blocked 8 distractions, stayed focused for 90 minutes"
Exports session data for personal review

📈 DEVELOPMENT PHASES
Phase 1: MVP Development (4 weeks)
• Basic intent entry and allowlist management • URL interception and blocking page • Simple keyword-based relevance scoring • Local data logging
Deliverable: Functional extension for personal use
Phase 2: Enhancement (2 weeks)
• Improved TF-IDF semantic matching • Analytics dashboard • UI/UX polish and dark mode • Data export functionality
Deliverable: Chrome Web Store-ready version
Phase 3: Evaluation (2-6 weeks)
• Self-study OR user study deployment • Data collection (200-500 decisions) • Statistical analysis and pattern identification • Qualitative feedback gathering
Deliverable: Research dataset and insights
Phase 4: Documentation (2 weeks)
• Academic paper writing (4-8 pages) • GitHub repository with README • Dataset release with documentation • Demo video and screenshots
Deliverable: Submission-ready research paper

🎯 RESEARCH QUESTIONS
RQ1: Does intent-based blocking reduce self-reported distraction compared to baseline browsing?
RQ2: What patterns emerge in user override behavior when blocking decisions are made explicit?
RQ3: Can semantic similarity algorithms predict website relevance to task intents with acceptable accuracy (≥65% agreement)?
RQ4: How does requiring conscious justification for site access affect user self-awareness of distraction triggers?
RQ5: What intent categories and website patterns are most common in knowledge work contexts?

📚 EXPECTED CONTRIBUTIONS
To Research Community:
• Novel approach to distraction management through intent-awareness • Labeled dataset of task intent-website relevance pairs • Analysis of human override behavior in blocking systems • Design patterns for explainable productivity tools
To User Community:
• Free, open-source focus tool with transparent logic • Alternative to rigid time-based blocking systems • Personal analytics for understanding distraction patterns • Customizable system respecting user autonomy
To Academic Portfolio:
• Working software system demonstrating technical skills • Published research paper (conference/journal) • Open-source contribution with potential citations • Evidence of human-centered design thinking

🎓 TARGET PUBLICATION VENUES
Primary Targets (UGC Category I):
• CHI Extended Abstracts - ACM Conference on Human Factors in Computing Systems • Behaviour & Information Technology - Taylor & Francis journal • International Journal of Human-Computer Interaction - Taylor & Francis journal
Secondary Targets:
• UMAP - User Modeling, Adaptation and Personalization conference • IndiaHCI - Indian HCI Conference (growing regional venue) • College/University symposiums - Initial validation venue
Alternative Outlets:
• Tool/Demo tracks at major HCI conferences • Dataset papers at specialized workshops • ArXiv preprint for early visibility

💡 PROJECT TAGLINE
"TaskGuard: Stay focused by declaring your intent, not fighting your willpower."

🔑 UNIQUE SELLING POINTS
What makes TaskGuard different:
✓ Context-aware, not time-aware - Blocks based on task relevance, not arbitrary timers
✓ Transparent AI - Shows exactly why sites are blocked with explainable scores
✓ User autonomy - Every block can be overridden; your data trains the system, not vice versa
✓ Research-driven - Built on cognitive science principles of self-control and goal-setting
✓ Privacy-first - All data stays local, you control exports
✓ Dual-purpose - Practical tool AND research instrument

✅ PROJECT DELIVERABLES CHECKLIST
Software:
* [ ] Functional Chrome extension (Manifest V3)
* [ ] GitHub repository with documentation
* [ ] Chrome Web Store listing (optional)
* [ ] Demo video (2-3 minutes)
Research:
* [ ] Dataset of 200-500 labeled decisions
* [ ] Statistical analysis report
* [ ] 4-8 page academic paper
* [ ] Presentation slides
Documentation:
* [ ] User guide and FAQ
* [ ] Developer documentation for contributors
* [ ] Dataset annotation guidelines
* [ ] Ethical considerations statement

🚀 GETTING STARTED
Immediate next steps:
1. Week 1: Chrome extension tutorial + basic blocker prototype
2. Week 2-4: Implement core features (intent UI, relevance scoring, logging)
3. Week 5: Personal testing and iteration
4. Week 6+: Decide on self-study vs. user study path
Resource requirements: • Chrome browser + text editor (VS Code recommended) • 8-10 hours per week for 8-10 weeks • AI coding assistant (Claude/ChatGPT/Copilot) • (Optional) 5-8 test users if pursuing user study

This is your complete project blueprint. Ready to start building? 🛠️
