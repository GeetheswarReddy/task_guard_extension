# Publishing TaskGuard to the Chrome Web Store

---

## Prerequisites

### 1. Google Developer Account
- Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- Sign in with a Google account
- Pay the **one-time $5 USD registration fee** (required once per developer account, not per extension)

### 2. Clean Your Repo First

Delete the following files — they are dev artifacts and should not be in your published package:

```
explanation.txt
PROJECT_OVERVIEW.md
TaskGuard.md
To-do.md
```

Also make sure `.git/` is excluded (it is automatically excluded when you zip the folder manually — do not zip the `.git/` directory).

---

## Step 1 — Prepare Required Assets

The store requires specific image assets. You currently have only `image.png` (used as the extension icon). You need:

### Extension Icons (already partially done)
Your `image.png` is used at 16×16, 48×48, and 128×128. For best quality, create separate PNG files at each size rather than scaling one image:

| File | Size | Used for |
|------|------|----------|
| `icon16.png` | 16×16 px | Browser toolbar (small) |
| `icon48.png` | 48×48 px | Extensions management page |
| `icon128.png` | 128×128 px | Chrome Web Store listing |

Update `manifest.json` to reference them:
```json
"icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
}
```

### Store Listing Screenshots (required)
You need **at least 1 screenshot**, recommended 3–5. Each must be exactly:
- **1280×800 px** or **640×400 px** (PNG or JPEG)

Suggested screenshots:
1. Popup in setup view (entering task + duration)
2. Intercept page in action (blocking a site with AI score visible)
3. History dashboard (decisions tab with chart)
4. Allowlist manager page

### Promotional Tile (optional but recommended)
- **440×280 px** PNG — shown in the Web Store search results
- Use your extension name, icon, and a short tagline ("Stay focused by declaring your intent")

### Store Listing Copy
Prepare these texts before submitting:

| Field | Limit | Suggested |
|-------|-------|-----------|
| **Name** | 45 chars | `TaskGuard – Intent-Aware Focus` |
| **Short description** | 132 chars | `Declare your task, set a timer, and let TaskGuard intercept distracting sites with on-device AI relevance scoring.` |
| **Detailed description** | 16,000 chars | Expand from README — explain features, data privacy (local-only), AI scoring, allowlist |
| **Category** | select one | `Productivity` |
| **Language** | select | `English` |

---

## Step 2 — Review Permissions (Important for Review)

The Chrome Web Store review team scrutinizes permissions. For each permission you declare in `manifest.json`, you must justify it in your store description or privacy policy.

Your current permissions and justifications:

| Permission | Why it's needed | Risk level |
|-----------|-----------------|------------|
| `storage` | Saves allowlist, session logs, and timer state locally | Low |
| `alarms` | Drives the badge countdown timer reliably in a service worker | Low |
| `tabs` | Intercepts already-open tabs when a session starts | Medium — must explain |
| `webNavigation` | Detects every main-frame navigation to trigger interception | Medium — must explain |
| `downloads` | Lets users export their data as JSON/CSV | Low |

**In your store description, add a privacy note like:**
> "TaskGuard reads tab URLs only during active focus sessions to determine whether to show the intercept page. No URL data is sent to any server. All data is stored locally on your device using chrome.storage.local."

### Host Permissions
Your manifest declares:
```json
"host_permissions": [
    "https://huggingface.co/*",
    "https://*.huggingface.co/*",
    "https://*.hf.co/*"
]
```
This is needed to download the AI model on first use. Explain this in your description:
> "On first use, the AI relevance model (~40 MB) is downloaded from Hugging Face and cached locally. After the first download, the extension works fully offline."

---

## Step 3 — Create the ZIP Package

Do **not** use git archive. Manually zip only the files the extension needs:

**Files to include:**
```
manifest.json
background.js
popup.html
popup.js
intercept.html
intercept.js
allowlist.html
allowlist.js
history.html
history.js
onboarding.html
onboarding.js
classifier.js
transformers.min.js
ort-wasm.wasm
ort-wasm-simd.wasm
icon16.png
icon48.png
icon128.png
```

**Files to exclude:**
```
.git/
explanation.txt
PROJECT_OVERVIEW.md
TaskGuard.md
To-do.md
README.md
PUBLISHING.md
image.png  (if replaced by icon16/48/128.png)
```

Create the zip from your terminal:
```bash
cd /path/to/browser_focus_extension
zip -r taskguard.zip manifest.json background.js popup.html popup.js intercept.html intercept.js allowlist.html allowlist.js history.html history.js onboarding.html onboarding.js classifier.js transformers.min.js ort-wasm.wasm ort-wasm-simd.wasm icon16.png icon48.png icon128.png
```

> **Important:** The `ort-wasm-simd.wasm` and `ort-wasm.wasm` files are binary and may be large (~4–8 MB each). The Web Store accepts packages up to **128 MB**, so this is fine.

---

## Step 4 — Submit to the Chrome Web Store

1. Go to the [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **New Item**
3. Upload your `taskguard.zip`
4. Fill in all store listing fields (name, description, screenshots, category)
5. Set **Visibility**: Public or Unlisted
   - **Unlisted** = only people with the direct link can install it (good for testing with users before going public)
   - **Public** = appears in search results
6. Fill in the **Privacy practices** tab:
   - Does your extension collect user data? → **No** (all storage is local)
   - Check "I certify that the following is accurate..."
7. Click **Submit for Review**

### Review Timeline
- Google's automated + manual review typically takes **1–3 business days**
- If rejected, you'll receive an email with a specific reason
- Common rejection reasons: vague permissions justification, missing privacy policy, low-quality screenshots

---

## Step 5 — Write a Privacy Policy (Required)

Even though TaskGuard doesn't collect personal data, Google requires a privacy policy URL if your extension uses any of: `storage`, `tabs`, `webNavigation`, or `downloads`.

Create a simple one-page privacy policy. You can host it free on:
- [GitHub Pages](https://pages.github.com/) — create a `privacy.html` in your repo
- [Notion](https://notion.so) — publish a page publicly

**Minimum content your privacy policy must include:**
```
- What data is collected: None. All data stays on your device.
- Where data is stored: chrome.storage.local (your browser only)
- Data sharing: No data is shared with any third party
- External requests: The AI model is downloaded once from Hugging Face (huggingface.co) 
  on first use and cached locally. No user data is sent in this request.
- Contact: your email address
```

Add the privacy policy URL in the store listing under **Privacy practices → Privacy policy URL**.

---

## Optional: Publish to Microsoft Edge Add-ons Store

TaskGuard already handles `edge://` URLs in `background.js`, so it's compatible. Edge uses the same MV3 format.

1. Go to [Microsoft Edge Add-ons Developer Dashboard](https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview)
2. Sign in with a Microsoft account (free, no registration fee)
3. Click **Create new extension** → upload the same `taskguard.zip`
4. Fill in store listing details
5. Submit — review takes 3–7 business days

---

## Post-Publish Checklist

- [ ] One-time $5 developer registration fee paid
- [ ] Dev artifacts deleted (`explanation.txt`, `PROJECT_OVERVIEW.md`, `TaskGuard.md`, `To-do.md`)
- [ ] Icons created at 16×16, 48×48, 128×128 px
- [ ] At least 1 screenshot at 1280×800 px
- [ ] Privacy policy hosted and URL ready
- [ ] ZIP created with only required files
- [ ] Store listing: name, short description, full description filled
- [ ] Permissions justified in store description
- [ ] Visibility set (Public vs Unlisted)
- [ ] Submitted and email notifications enabled
