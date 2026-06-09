import { classifyRelevance } from './classifier.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const domain = params.get('domain') || '';
    const originalUrl = params.get('url') || '';
    const intent = params.get('intent') || '';
    const intentCategory = params.get('intentCategory') || '';
    const description = params.get('description') || '';
    const sessionId = params.get('sessionId') || '';

    document.getElementById('display_intent').textContent = intent || 'No intent set';
    document.getElementById('display_domain').textContent = domain;

    // TF-IDF relevance scoring — runs synchronously, no model required
    runRelevanceClassifier(domain, intent, description, intentCategory);

    // Allow — let the user proceed
    document.getElementById('btn_allow').addEventListener('click', () => {
        const addToAllowlist = document.getElementById('add_to_allowlist').checked;

        chrome.runtime.sendMessage({
            action: 'logDecision',
            data: { sessionId, intent, intentCategory, domain, url: originalUrl, decision: 'allow', addedToAllowlist: addToAllowlist }
        });

        if (addToAllowlist) {
            chrome.storage.local.get(['allowlist'], (data) => {
                const allowlist = data.allowlist || [];
                if (!allowlist.includes(domain)) allowlist.push(domain);
                chrome.storage.local.set({ allowlist }, () => { window.location.href = originalUrl; });
            });
        } else {
            chrome.storage.local.get(['tempAllowlist'], (data) => {
                const tempList = data.tempAllowlist || [];
                if (!tempList.includes(domain)) tempList.push(domain);
                chrome.storage.local.set({ tempAllowlist: tempList }, () => { window.location.href = originalUrl; });
            });
        }
    });

    // Block — show confirmation then go back
    document.getElementById('btn_block').addEventListener('click', () => {
        chrome.runtime.sendMessage({
            action: 'logDecision',
            data: { sessionId, intent, intentCategory, domain, url: originalUrl, decision: 'block', addedToAllowlist: false }
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
});

function runRelevanceClassifier(domain, intent, description, intentCategory) {
    if (!intent) return;

    const row = document.getElementById('relevance_row');
    const scoreEl = document.getElementById('relevance_score');
    const barEl = document.getElementById('relevance_bar');

    row.style.display = 'block';

    try {
        const score = classifyRelevance(domain, intent, description, intentCategory);

        const color = score >= 60 ? '#00b894' : score >= 30 ? '#fdcb6e' : '#e74c3c';
        const label = score >= 60 ? 'likely relevant' : score >= 30 ? 'uncertain' : 'likely off-task';

        scoreEl.innerHTML = `<span style="color:${color}">${score}% &mdash; ${label}</span>`;
        barEl.style.width = `${score}%`;
        barEl.style.background = color;
    } catch {
        row.style.display = 'none';
    }
}
