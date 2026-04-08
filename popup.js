let selectedMinutes = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadState();

    // Timer button selection
    document.querySelectorAll('.timer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedMinutes = parseInt(btn.dataset.minutes);
        });
    });

    document.getElementById('start_session').addEventListener('click', startFocusSession);
    document.getElementById('end_session').addEventListener('click', endSession);
    document.getElementById('btn_allowlist').addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('allowlist.html') });
    });
    document.getElementById('link_allowlist').addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('allowlist.html') });
    });
    document.getElementById('link_export').addEventListener('click', exportData);
    document.getElementById('link_history').addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
    });
});

function loadState() {
    chrome.storage.local.get(['timerEndTime', 'intent', 'taskDescription'], (data) => {
        if (data.timerEndTime) {
            const remaining = data.timerEndTime - Date.now();
            if (remaining > 0) {
                showActiveSession(data.intent || 'Focus Session', remaining);
                return;
            }
        }
        showSetupView();
    });
}

function showSetupView() {
    document.getElementById('setup_view').style.display = 'block';
    document.getElementById('active_session').style.display = 'none';
}

function showActiveSession(intent, remaining) {
    document.getElementById('setup_view').style.display = 'none';
    document.getElementById('active_session').style.display = 'block';
    document.getElementById('current_intent').textContent = intent;
    updateTimerDisplay(remaining);

    const interval = setInterval(() => {
        chrome.storage.local.get(['timerEndTime'], (d) => {
            if (d.timerEndTime) {
                const rem = d.timerEndTime - Date.now();
                if (rem > 0) {
                    updateTimerDisplay(rem);
                } else {
                    clearInterval(interval);
                    showSetupView();
                }
            } else {
                clearInterval(interval);
                showSetupView();
            }
        });
    }, 1000);
}

function updateTimerDisplay(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    document.getElementById('timer_display').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startFocusSession() {
    const intent = document.getElementById('intent_input').value.trim();
    const intentCategory = document.getElementById('intent_category').value;
    const taskDescription = document.getElementById('task_description').value.trim();

    if (!intent) {
        document.getElementById('intent_input').style.borderColor = '#dc3545';
        document.getElementById('intent_input').focus();
        return;
    }
    if (selectedMinutes === 0) {
        alert('Please select a focus duration');
        return;
    }

    const endTime = Date.now() + (selectedMinutes * 60 * 1000);
    const sessionId = 'session_' + Date.now();

    // Snapshot the current allowlist at session start
    chrome.storage.local.get(['allowlist'], (existing) => {
        const allowlistSnapshot = existing.allowlist || [];

        chrome.storage.local.set({
            intent: intent,
            intentCategory: intentCategory,
            taskDescription: taskDescription,
            timerEndTime: endTime,
            timerMinutes: selectedMinutes,
            sessionId: sessionId,
            sessionStartTime: Date.now(),
            sessionAllowlistSnapshot: allowlistSnapshot
        }, () => {
            chrome.runtime.sendMessage({
                action: 'startTimer',
                endTime: endTime
            });
            showActiveSession(intent, endTime - Date.now());
        });
    });
}

function endSession() {
    // Confirm before ending session early
    if (!confirm('Are you sure you want to end this focus session early?')) {
        return;
    }

    // Log session end before clearing
    chrome.storage.local.get(['sessionId', 'intent', 'intentCategory', 'sessionStartTime', 'timerMinutes', 'sessionAllowlistSnapshot', 'tempAllowlist'], (data) => {
        if (data.sessionId) {
            logSessionEnd(data);
        }
        chrome.storage.local.remove(
            ['timerEndTime', 'intent', 'intentCategory', 'taskDescription', 'timerMinutes', 'sessionId', 'sessionStartTime', 'tempAllowlist', 'sessionAllowlistSnapshot'],
            () => {
                chrome.runtime.sendMessage({ action: 'stopTimer' });
                showSetupView();
            }
        );
    });
}

function logSessionEnd(sessionData) {
    chrome.storage.local.get(['sessionLogs'], (data) => {
        const logs = data.sessionLogs || [];
        logs.push({
            sessionId: sessionData.sessionId,
            intent: sessionData.intent,
            intentCategory: sessionData.intentCategory || '',
            startTime: sessionData.sessionStartTime,
            endTime: Date.now(),
            plannedMinutes: sessionData.timerMinutes,
            endedBy: 'user',
            allowlistAtStart: sessionData.sessionAllowlistSnapshot || [],
            sitesAllowedDuringSession: sessionData.tempAllowlist || []
        });
        chrome.storage.local.set({ sessionLogs: logs });
    });
}

function exportData() {
    chrome.storage.local.get(['decisionLogs', 'sessionLogs', 'userId'], (data) => {
        const exportPayload = {
            userId: data.userId || 'unknown',
            exportedAt: new Date().toISOString(),
            sessions: data.sessionLogs || [],
            decisions: data.decisionLogs || []
        };
        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        chrome.downloads ?
            chrome.downloads.download({ url: url, filename: 'taskguard_export.json' }) :
            // Fallback: open in new tab
            chrome.tabs.create({ url: url });
    });
}
