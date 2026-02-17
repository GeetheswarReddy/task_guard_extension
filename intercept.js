document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const domain = params.get('domain') || '';
    const originalUrl = params.get('url') || '';
    const intent = params.get('intent') || '';
    const intentCategory = params.get('intentCategory') || '';
    const sessionId = params.get('sessionId') || '';

    document.getElementById('display_intent').textContent = intent || 'No intent set';
    document.getElementById('display_domain').textContent = domain;

    // Allow — let the user proceed
    document.getElementById('btn_allow').addEventListener('click', () => {
        const addToAllowlist = document.getElementById('add_to_allowlist').checked;

        // Log the decision
        chrome.runtime.sendMessage({
            action: 'logDecision',
            data: {
                sessionId: sessionId,
                intent: intent,
                intentCategory: intentCategory,
                domain: domain,
                url: originalUrl,
                decision: 'allow',
                addedToAllowlist: addToAllowlist
            }
        });

        // If user wants to permanently allow, add to allowlist
        if (addToAllowlist) {
            chrome.storage.local.get(['allowlist'], (data) => {
                const allowlist = data.allowlist || [];
                if (!allowlist.includes(domain)) {
                    allowlist.push(domain);
                    chrome.storage.local.set({ allowlist: allowlist }, () => {
                        window.location.href = originalUrl;
                    });
                } else {
                    window.location.href = originalUrl;
                }
            });
        } else {
            // Temporarily allow by navigating directly
            // We need to add to a temporary session allowlist so it doesn't re-intercept
            chrome.storage.local.get(['tempAllowlist'], (data) => {
                const tempList = data.tempAllowlist || [];
                if (!tempList.includes(domain)) {
                    tempList.push(domain);
                    chrome.storage.local.set({ tempAllowlist: tempList }, () => {
                        window.location.href = originalUrl;
                    });
                } else {
                    window.location.href = originalUrl;
                }
            });
        }
    });

    // Block — go back or close tab
    document.getElementById('btn_block').addEventListener('click', () => {
        // Log the decision
        chrome.runtime.sendMessage({
            action: 'logDecision',
            data: {
                sessionId: sessionId,
                intent: intent,
                intentCategory: intentCategory,
                domain: domain,
                url: originalUrl,
                decision: 'block',
                addedToAllowlist: false
            }
        });

        // Try to go back, or close the tab
        if (window.history.length > 1) {
            window.history.go(-2); // go back past the intercept redirect
        } else {
            window.close();
        }
    });
});
