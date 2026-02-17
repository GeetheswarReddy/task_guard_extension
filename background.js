// TaskGuard Background Service Worker

let badgeInterval = null;

// --- Pseudonymous User ID ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['userId'], (data) => {
        if (!data.userId) {
            const userId = 'user_' + crypto.randomUUID();
            chrome.storage.local.set({ userId: userId });
        }
    });
});

// --- Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startTimer') {
        startBadgeTimer(message.endTime);
    } else if (message.action === 'stopTimer') {
        stopBadgeTimer();
    } else if (message.action === 'logDecision') {
        logDecision(message.data);
    }
});

// --- Tab Interception ---
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        checkAndIntercept(tabId, changeInfo.url);
    }
});

chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId === 0) { // main frame only
        checkAndIntercept(details.tabId, details.url);
    }
});

function checkAndIntercept(tabId, url) {
    // Skip chrome:// , extension pages, and empty tabs
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
        url.startsWith('about:') || url.startsWith('edge://')) {
        return;
    }

    chrome.storage.local.get(['timerEndTime', 'intent', 'intentCategory', 'allowlist', 'sessionId', 'tempAllowlist'], (data) => {
        // Only intercept during active focus sessions
        if (!data.timerEndTime || data.timerEndTime <= Date.now()) return;

        let domain;
        try {
            domain = new URL(url).hostname.replace(/^www\./, '');
        } catch (e) {
            return;
        }

        const allowlist = data.allowlist || [];
        const tempAllowlist = data.tempAllowlist || [];

        // Check if domain is allowlisted or temporarily allowed
        const isAllowed = [...allowlist, ...tempAllowlist].some(allowed => {
            return domain === allowed || domain.endsWith('.' + allowed);
        });

        if (!isAllowed) {
            // Redirect to intercept page
            const interceptUrl = chrome.runtime.getURL('intercept.html') +
                `?domain=${encodeURIComponent(domain)}` +
                `&url=${encodeURIComponent(url)}` +
                `&intent=${encodeURIComponent(data.intent || '')}` +
                `&intentCategory=${encodeURIComponent(data.intentCategory || '')}` +
                `&sessionId=${encodeURIComponent(data.sessionId || '')}`;

            chrome.tabs.update(tabId, { url: interceptUrl });
        }
    });
}

// --- Decision Logging ---
function logDecision(decisionData) {
    chrome.storage.local.get(['decisionLogs', 'userId'], (data) => {
        const logs = data.decisionLogs || [];
        logs.push({
            ...decisionData,
            userId: data.userId || 'unknown',
            timestamp: new Date().toISOString()
        });
        chrome.storage.local.set({ decisionLogs: logs });
    });
}

// --- Badge Timer ---
chrome.runtime.onStartup.addListener(() => {
    checkExistingTimer();
});

checkExistingTimer();

function checkExistingTimer() {
    chrome.storage.local.get(['timerEndTime'], (data) => {
        if (data.timerEndTime) {
            const remaining = data.timerEndTime - Date.now();
            if (remaining > 0) {
                startBadgeTimer(data.timerEndTime);
            } else {
                chrome.storage.local.remove(['timerEndTime', 'intent', 'intentCategory', 'taskDescription', 'timerMinutes', 'sessionId', 'sessionStartTime', 'tempAllowlist', 'sessionAllowlistSnapshot']);
                clearBadge();
            }
        }
    });
}

function startBadgeTimer(endTime) {
    if (badgeInterval) clearInterval(badgeInterval);

    updateBadge(endTime);
    badgeInterval = setInterval(() => updateBadge(endTime), 1000);
}

function stopBadgeTimer() {
    if (badgeInterval) {
        clearInterval(badgeInterval);
        badgeInterval = null;
    }
    clearBadge();
}

function updateBadge(endTime) {
    const remaining = endTime - Date.now();

    if (remaining <= 0) {
        stopBadgeTimer();
        // Log session completion
        chrome.storage.local.get(['sessionId', 'intent', 'intentCategory', 'sessionStartTime', 'timerMinutes', 'sessionAllowlistSnapshot', 'tempAllowlist'], (data) => {
            if (data.sessionId) {
                chrome.storage.local.get(['sessionLogs'], (logData) => {
                    const logs = logData.sessionLogs || [];
                    logs.push({
                        sessionId: data.sessionId,
                        intent: data.intent,
                        intentCategory: data.intentCategory || '',
                        startTime: data.sessionStartTime,
                        endTime: Date.now(),
                        plannedMinutes: data.timerMinutes,
                        endedBy: 'timer',
                        allowlistAtStart: data.sessionAllowlistSnapshot || [],
                        sitesAllowedDuringSession: data.tempAllowlist || []
                    });
                    chrome.storage.local.set({ sessionLogs: logs });
                });
            }
            chrome.storage.local.remove(['timerEndTime', 'intent', 'intentCategory', 'taskDescription', 'timerMinutes', 'sessionId', 'sessionStartTime', 'tempAllowlist', 'sessionAllowlistSnapshot']);
        });

        chrome.action.setBadgeText({ text: 'Done' });
        chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
        setTimeout(() => clearBadge(), 5000);
        return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    let badgeText;
    if (minutes >= 60) {
        badgeText = `${Math.floor(minutes / 60)}h`;
    } else if (minutes > 0) {
        badgeText = `${minutes}m`;
    } else {
        badgeText = `${seconds}s`;
    }

    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#007bff' });
}

function clearBadge() {
    chrome.action.setBadgeText({ text: '' });
}
