let selectedMinutes = 0;
let timerInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    loadState();

    document.querySelectorAll('.timer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedMinutes = parseInt(btn.dataset.minutes);
            document.getElementById('custom_minutes').value = '';
        });
    });

    document.getElementById('custom_minutes').addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (val > 0) {
            document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('selected'));
            selectedMinutes = val;
        } else {
            selectedMinutes = 0;
        }
    });

    document.getElementById('details_toggle').addEventListener('click', () => {
        const section = document.getElementById('details_section');
        const isHidden = section.style.display === 'none';
        section.style.display = isHidden ? 'block' : 'none';
        document.getElementById('details_toggle').textContent = isHidden ? '▲ Hide details' : '▼ Add details';
    });

    document.getElementById('start_session').addEventListener('click', startFocusSession);
    document.getElementById('end_session').addEventListener('click', promptEndSession);
    document.getElementById('end_confirm_yes').addEventListener('click', endSession);
    document.getElementById('end_confirm_no').addEventListener('click', () => {
        document.getElementById('end_confirm_overlay').style.display = 'none';
    });
    document.getElementById('btn_new_session').addEventListener('click', () => {
        chrome.storage.local.remove('lastSessionSummary');
        showSetupView();
    });
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
    chrome.storage.local.get(['timerEndTime', 'intent', 'lastSessionSummary'], (data) => {
        if (data.timerEndTime && data.timerEndTime > Date.now()) {
            showActiveSession(data.intent || 'Focus Session', data.timerEndTime - Date.now());
            return;
        }
        if (data.lastSessionSummary) {
            showSummaryView(data.lastSessionSummary);
            return;
        }
        showSetupView();
    });
}

function showView(id) {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    document.getElementById('end_confirm_overlay').style.display = 'none';
    ['setup_view', 'active_session', 'summary_view'].forEach(v => {
        document.getElementById(v).style.display = v === id ? 'block' : 'none';
    });
}

function showSetupView() { showView('setup_view'); }

function showActiveSession(intent, remaining) {
    showView('active_session');
    document.getElementById('current_intent').textContent = intent;
    updateTimerDisplay(remaining);

    timerInterval = setInterval(() => {
        chrome.storage.local.get(['timerEndTime', 'lastSessionSummary'], (d) => {
            if (d.timerEndTime && d.timerEndTime > Date.now()) {
                updateTimerDisplay(d.timerEndTime - Date.now());
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                if (d.lastSessionSummary) {
                    showSummaryView(d.lastSessionSummary);
                } else {
                    showSetupView();
                }
            }
        });
    }, 1000);
}

function showSummaryView(summary) {
    showView('summary_view');

    const completed = summary.endedBy === 'timer';
    document.getElementById('summary_icon').textContent = completed ? '✅' : '⏹️';
    document.getElementById('summary_title').textContent = completed ? 'Session Complete!' : 'Session Ended';
    document.getElementById('summary_subtitle').textContent = completed
        ? 'Full session finished. Great work!'
        : 'Ended early — every minute focused counts.';

    document.getElementById('summary_intent').textContent = summary.intent || '—';
    document.getElementById('summary_focused').textContent = summary.actualMinutes ?? '—';
    document.getElementById('summary_blocked').textContent = summary.blocked ?? 0;
    document.getElementById('summary_allowed').textContent = summary.allowed ?? 0;

    const pct = Math.min(100, summary.completionPct ?? 0);
    const barColor = pct >= 80 ? '#00b894' : pct >= 40 ? '#fdcb6e' : '#e74c3c';
    document.getElementById('summary_bar').style.width = `${pct}%`;
    document.getElementById('summary_bar').style.background = barColor;
    document.getElementById('summary_completion_label').textContent =
        `${pct}% of ${summary.plannedMinutes ?? '?'}m planned session`;
}

function updateTimerDisplay(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    document.getElementById('timer_display').textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
        const errEl = document.getElementById('duration_error');
        errEl.style.display = 'block';
        setTimeout(() => { errEl.style.display = 'none'; }, 3000);
        return;
    }

    const endTime = Date.now() + selectedMinutes * 60 * 1000;
    const sessionId = 'session_' + crypto.randomUUID();

    chrome.storage.local.get(['allowlist'], (existing) => {
        chrome.storage.local.set({
            intent,
            intentCategory,
            taskDescription,
            timerEndTime: endTime,
            timerMinutes: selectedMinutes,
            sessionId,
            sessionStartTime: Date.now(),
            sessionAllowlistSnapshot: existing.allowlist || [],
            lastSessionSummary: null
        }, () => {
            chrome.runtime.sendMessage({ action: 'startTimer', endTime });
            showActiveSession(intent, endTime - Date.now());
        });
    });
}

function promptEndSession() {
    document.getElementById('end_confirm_overlay').style.display = 'block';
}

function endSession() {

    chrome.storage.local.get(
        ['sessionId', 'intent', 'intentCategory', 'sessionStartTime', 'timerMinutes',
         'sessionAllowlistSnapshot', 'tempAllowlist', 'decisionLogs'],
        (data) => {
            const now = Date.now();
            const actualMinutes = Math.round((now - (data.sessionStartTime || now)) / 60000);
            const plannedMinutes = data.timerMinutes || 0;
            const completionPct = plannedMinutes > 0 ? Math.round((actualMinutes / plannedMinutes) * 100) : 0;

            const sessionDecisions = (data.decisionLogs || []).filter(d => d.sessionId === data.sessionId);
            const blocked = sessionDecisions.filter(d => d.decision === 'block').length;
            const allowed = sessionDecisions.filter(d => d.decision === 'allow').length;

            const summary = {
                intent: data.intent,
                plannedMinutes,
                actualMinutes,
                completionPct,
                blocked,
                allowed,
                endedBy: 'user'
            };

            if (data.sessionId) {
                chrome.storage.local.get(['sessionLogs'], (logData) => {
                    const logs = logData.sessionLogs || [];
                    logs.push({
                        sessionId: data.sessionId,
                        intent: data.intent,
                        intentCategory: data.intentCategory || '',
                        startTime: data.sessionStartTime,
                        endTime: now,
                        plannedMinutes,
                        endedBy: 'user',
                        allowlistAtStart: data.sessionAllowlistSnapshot || [],
                        sitesAllowedDuringSession: data.tempAllowlist || []
                    });
                    chrome.storage.local.set({ sessionLogs: logs });
                });
            }

            chrome.storage.local.remove(
                ['timerEndTime', 'intent', 'intentCategory', 'taskDescription', 'timerMinutes',
                 'sessionId', 'sessionStartTime', 'tempAllowlist', 'sessionAllowlistSnapshot'],
                () => {
                    chrome.runtime.sendMessage({ action: 'stopTimer' });
                    chrome.storage.local.set({ lastSessionSummary: summary }, () => {
                        showSummaryView(summary);
                    });
                }
            );
        }
    );
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
        chrome.downloads
            ? chrome.downloads.download({ url, filename: 'taskguard_export.json' })
            : chrome.tabs.create({ url });
    });
}
