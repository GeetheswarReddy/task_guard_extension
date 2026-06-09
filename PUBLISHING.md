# Distribution and Installation

> TaskGuard is **deliberately not published to the Chrome Web Store**. It is distributed only as an open-source artifact on GitHub and installed via Chrome's *Load Unpacked* developer flow. This document explains the rationale and the install procedure.

---

## Why no Chrome Web Store listing?

TaskGuard is framed as a **research artifact**, not a consumer product. Distributing via GitHub rather than the Web Store gives three concrete benefits that matter for the project's research positioning:

1. **No informed-consent gap.** Anyone who installs an unpacked developer build has, by definition, opened the repository, read the source, and chosen to load it. There is no anonymous-end-user population whose data-collection consent we would have to handle.
2. **No store-policy churn.** The Web Store's policies around `tabs`, `webNavigation`, and behavioural-analytics extensions change frequently and are scrutinised by automated review. An artifact whose value is reproducibility and auditability should not be hostage to that review loop.
3. **Auditability by default.** GitHub gives reviewers, advisors, and prospective collaborators direct line-numbered access to every signal, weight, and dataset record. A `.zip` artefact pushed to the Web Store does not.

This is an intentional research-hygiene choice. The extension is fully functional and ready to install for any researcher, collaborator, or evaluator who wants to try it.

---

## Installing TaskGuard (Load Unpacked)

### Prerequisites

- **Chromium-based browser:** Google Chrome 88+, Microsoft Edge 88+, Brave, Arc, or any modern Chromium fork. Manifest V3 support is required.
- **Git** (optional — you can also download a ZIP from GitHub).

### Steps

1. **Clone the repository** (or download the ZIP and unzip it):

   ```bash
   git clone <repository-url> taskguard
   cd taskguard
   ```

2. **Open the extensions page** in Chrome / Chromium:

   ```
   chrome://extensions
   ```

   (In Edge, use `edge://extensions`.)

3. **Enable Developer mode** using the toggle in the top-right corner of the extensions page.

4. **Click "Load unpacked"** and select the cloned repository folder (the folder that contains `manifest.json`).

5. The TaskGuard icon should now appear in the extensions area of the toolbar. Pin it for one-click access.

6. **First-install onboarding.** A welcome tab will open the first time you load the extension; close it when you are done reading.

### Updating

To pull updates after the initial install:

```bash
cd taskguard
git pull
```

Then go back to `chrome://extensions` and click the circular **Reload** icon on the TaskGuard card. No re-installation is required.

### Uninstalling

`chrome://extensions` → TaskGuard card → **Remove**. This wipes all `chrome.storage.local` data for the extension (allowlist, session logs, decision logs, `userId`).

---

## Recommended GitHub Hygiene

If you fork or re-host this project, consider:

- **Pinning a release tag** (e.g., `v1.0-iomp`) at the commit used for the IOMP report, so that the report and the code stay synchronised.
- **Adding a `LICENSE` file.** A permissive licence (MIT or Apache-2.0) is consistent with the artifact framing in `RESEARCH_STATEMENT.md`.
- **Publishing the probe set** referenced in § 5.1.1 of `PROJECT_REPORT.md` as a small JSON file in the repository (e.g., `probes/probe_set.json`) so that reproducibility claims are first-class.
- **Excluding personal data** from any committed exports. The `taskguard_export.json` artefact contains a randomly generated `userId` and your real intent / decision history; never commit it.

---

## What does *not* belong in the repository

- Any personal `taskguard_export.json` (decision and session logs).
- Browser profile directories or `chrome.storage.local` dumps.
- Secrets of any kind. The project has no API keys, but if you fork and extend it (e.g., with a future learned model hosted elsewhere), do not commit credentials.

A minimal `.gitignore` is sufficient:

```gitignore
taskguard_export.json
taskguard_decisions.csv
taskguard_sessions.csv
.DS_Store
```

---

## If you change your mind later

The previous version of this file contained a full Chrome Web Store submission walk-through (developer-account setup, store-listing copy, screenshot dimensions, privacy-policy hosting). If TaskGuard is later re-positioned as a public consumer extension, that material is available in the repository's Git history and can be restored verbatim. The current build (`manifest.json`, permissions, in-browser classifier with no `host_permissions`) is already store-compliant; only the listing assets and a hosted privacy policy would need to be added.
