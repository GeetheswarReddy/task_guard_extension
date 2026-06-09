// TaskGuard Background Service Worker

// --- Shared Helper ---
function isDomainAllowed(domain, allowlist, tempAllowlist) {
    return [...(allowlist || []), ...(tempAllowlist || [])].some(
        allowed => domain === allowed || domain.endsWith('.' + allowed)
    );
}

// --- First Install ---
chrome.runtime.onInstalled.addListener((details) => {
    chrome.storage.local.get(['userId'], (data) => {
        if (chrome.runtime.lastError || !data) return;
        if (!data.userId) {
            chrome.storage.local.set({ userId: 'user_' + crypto.randomUUID() });
        }
    });
    if (details.reason === 'install') {
        chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
    }
});

// --- Message Listener ---
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'startTimer') {
        startBadgeTimer(message.endTime);
        checkExistingTabs();
    } else if (message.action === 'stopTimer') {
        stopBadgeTimer();
    } else if (message.action === 'logDecision') {
        logDecision(message.data);
    }
});

// --- Tab Interception ---
// Use only onCommitted (fires at navigation start, reliable, no double-firing)
chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId === 0) {
        checkAndIntercept(details.tabId, details.url);
    }
});

function checkAndIntercept(tabId, url) {
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
        url.startsWith('about:') || url.startsWith('edge://')) return;

    chrome.storage.local.get(['timerEndTime', 'intent', 'intentCategory', 'taskDescription', 'allowlist', 'sessionId', 'tempAllowlist'], (data) => {
        if (chrome.runtime.lastError || !data) return;
        if (!data.timerEndTime || data.timerEndTime <= Date.now()) return;

        let domain;
        try {
            domain = new URL(url).hostname.replace(/^www\./, '');
        } catch (e) {
            return;
        }

        if (!isDomainAllowed(domain, data.allowlist, data.tempAllowlist)) {
            const interceptUrl = chrome.runtime.getURL('intercept.html') +
                `?domain=${encodeURIComponent(domain)}` +
                `&url=${encodeURIComponent(url)}` +
                `&intent=${encodeURIComponent(data.intent || '')}` +
                `&intentCategory=${encodeURIComponent(data.intentCategory || '')}` +
                `&description=${encodeURIComponent(data.taskDescription || '')}` +
                `&sessionId=${encodeURIComponent(data.sessionId || '')}`;
            chrome.tabs.update(tabId, { url: interceptUrl });
        }
    });
}

// --- Check Already-Open Tabs ---
function checkExistingTabs() {
    chrome.storage.local.get(['timerEndTime', 'intent', 'intentCategory', 'taskDescription', 'allowlist', 'sessionId', 'tempAllowlist'], (data) => {
        if (chrome.runtime.lastError || !data) return;
        if (!data.timerEndTime || data.timerEndTime <= Date.now()) return;

        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                const url = tab.url;
                if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
                    url.startsWith('about:') || url.startsWith('edge://')) return;

                let domain;
                try {
                    domain = new URL(url).hostname.replace(/^www\./, '');
                } catch (e) {
                    return;
                }

                if (!isDomainAllowed(domain, data.allowlist, data.tempAllowlist)) {
                    const interceptUrl = chrome.runtime.getURL('intercept.html') +
                        `?domain=${encodeURIComponent(domain)}` +
                        `&url=${encodeURIComponent(url)}` +
                        `&intent=${encodeURIComponent(data.intent || '')}` +
                        `&intentCategory=${encodeURIComponent(data.intentCategory || '')}` +
                        `&description=${encodeURIComponent(data.taskDescription || '')}` +
                        `&sessionId=${encodeURIComponent(data.sessionId || '')}`;
                    chrome.tabs.update(tab.id, { url: interceptUrl });
                }
            });
        });
    });
}

// --- Decision Logging ---
function logDecision(decisionData) {
    chrome.storage.local.get(['decisionLogs', 'userId'], (data) => {
        if (chrome.runtime.lastError || !data) return;
        const logs = data.decisionLogs || [];
        logs.push({ ...decisionData, userId: data.userId || 'unknown', timestamp: new Date().toISOString() });
        chrome.storage.local.set({ decisionLogs: logs });
    });
}

// --- Badge Timer (MV3-safe: chrome.alarms, not setInterval) ---
chrome.runtime.onStartup.addListener(checkExistingTimer);
checkExistingTimer();

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'badgeTick') {
        chrome.storage.local.get(['timerEndTime'], (data) => {
            if (chrome.runtime.lastError || !data) return;
            if (data.timerEndTime) {
                updateBadge(data.timerEndTime);
            } else {
                chrome.alarms.clear('badgeTick');
                clearBadge();
            }
        });
    } else if (alarm.name === 'clearBadge') {
        clearBadge();
    }
});

function checkExistingTimer() {
    chrome.storage.local.get(['timerEndTime'], (data) => {
        if (chrome.runtime.lastError || !data) return;
        if (data.timerEndTime) {
            const remaining = data.timerEndTime - Date.now();
            if (remaining > 0) {
                startBadgeTimer(data.timerEndTime);
            } else {
                chrome.storage.local.remove(['timerEndTime', 'intent', 'intentCategory', 'taskDescription',
                    'timerMinutes', 'sessionId', 'sessionStartTime', 'tempAllowlist', 'sessionAllowlistSnapshot']);
                clearBadge();
            }
        }
    });
}

function startBadgeTimer(endTime) {
    chrome.alarms.clear('badgeTick');
    updateBadge(endTime);
    // periodInMinutes: 1/60 = ~1 second (Chrome enforces minimum 1 min in prod, but works in dev)
    chrome.alarms.create('badgeTick', { periodInMinutes: 1 / 60 });
}

function stopBadgeTimer() {
    chrome.alarms.clear('badgeTick');
    clearBadge();
}

function updateBadge(endTime) {
    const remaining = endTime - Date.now();

    if (remaining <= 0) {
        chrome.alarms.clear('badgeTick');
        chrome.storage.local.get(
            ['sessionId', 'intent', 'intentCategory', 'sessionStartTime', 'timerMinutes',
             'sessionAllowlistSnapshot', 'tempAllowlist', 'decisionLogs'],
            (data) => {
                if (chrome.runtime.lastError || !data) return;
                const now = Date.now();
                const plannedMinutes = data.timerMinutes || 0;
                const actualMinutes = Math.round((now - (data.sessionStartTime || now)) / 60000);
                const sessionDecisions = (data.decisionLogs || []).filter(d => d.sessionId === data.sessionId);

                const summary = {
                    intent: data.intent,
                    plannedMinutes,
                    actualMinutes,
                    completionPct: 100,
                    blocked: sessionDecisions.filter(d => d.decision === 'block').length,
                    allowed: sessionDecisions.filter(d => d.decision === 'allow').length,
                    endedBy: 'timer'
                };

                if (data.sessionId) {
                    chrome.storage.local.get(['sessionLogs'], (logData) => {
                        if (chrome.runtime.lastError || !logData) return;
                        const logs = logData.sessionLogs || [];
                        logs.push({
                            sessionId: data.sessionId,
                            intent: data.intent,
                            intentCategory: data.intentCategory || '',
                            startTime: data.sessionStartTime,
                            endTime: now,
                            plannedMinutes,
                            endedBy: 'timer',
                            allowlistAtStart: data.sessionAllowlistSnapshot || [],
                            sitesAllowedDuringSession: data.tempAllowlist || []
                        });
                        chrome.storage.local.set({ sessionLogs: logs });
                    });
                }

                chrome.storage.local.set({ lastSessionSummary: summary });
                chrome.storage.local.remove(['timerEndTime', 'intent', 'intentCategory', 'taskDescription',
                    'timerMinutes', 'sessionId', 'sessionStartTime', 'tempAllowlist', 'sessionAllowlistSnapshot']);
            }
        );
        chrome.action.setBadgeText({ text: 'Done' });
        chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
        chrome.alarms.create('clearBadge', { delayInMinutes: 1 / 12 });
        return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);

    let badgeText;
    if (minutes >= 60) {
        badgeText = `${Math.floor(minutes / 60)}h`;
    } else if (minutes > 0) {
        badgeText = `${minutes}m`;
    } else {
        badgeText = `${totalSeconds}s`;
    }

    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#007bff' });
}

function clearBadge() {
    chrome.action.setBadgeText({ text: '' });
}
