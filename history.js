document.addEventListener('DOMContentLoaded', () => {
    loadTab('decisions');

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadTab(tab.dataset.tab);
        });
    });

    document.getElementById('btn_export_json').addEventListener('click', exportJSON);
    document.getElementById('btn_export_csv').addEventListener('click', exportCSV);
    document.getElementById('btn_clear').addEventListener('click', clearData);
});

function loadTab(tabName) {
    if (tabName === 'decisions') {
        loadDecisions();
    } else {
        loadSessions();
    }
}

function loadDecisions() {
    chrome.storage.local.get(['decisionLogs'], (data) => {
        const logs = (data.decisionLogs || []).slice().reverse();

        const statsEl = document.getElementById('stats');
        const contentEl = document.getElementById('content');

        const allowCount = logs.filter(l => l.decision === 'allow').length;
        const blockCount = logs.filter(l => l.decision === 'block').length;
        const uniqueDomains = new Set(logs.map(l => l.domain)).size;

        statsEl.innerHTML = `
            <div class="stat-card">
                <div class="number">${logs.length}</div>
                <div class="label">Total Decisions</div>
            </div>
            <div class="stat-card">
                <div class="number">${allowCount}</div>
                <div class="label">Allowed</div>
            </div>
            <div class="stat-card">
                <div class="number">${blockCount}</div>
                <div class="label">Blocked</div>
            </div>
            <div class="stat-card">
                <div class="number">${uniqueDomains}</div>
                <div class="label">Unique Sites</div>
            </div>
        `;

        if (logs.length === 0) {
            contentEl.innerHTML = '<div class="empty-state">No decisions recorded yet. Start a focus session and browse to see data here.</div>';
            return;
        }

        let html = `<table>
            <thead><tr>
                <th>Time</th>
                <th>Intent</th>
                <th>Website</th>
                <th>Decision</th>
            </tr></thead><tbody>`;

        logs.forEach(log => {
            const time = new Date(log.timestamp).toLocaleString();
            const badge = log.decision === 'allow' ? 'badge-allow' : 'badge-block';
            html += `<tr>
                <td>${time}</td>
                <td>${escapeHtml(log.intent || '—')}</td>
                <td>${escapeHtml(log.domain || '—')}</td>
                <td><span class="badge ${badge}">${log.decision}</span></td>
            </tr>`;
        });

        html += '</tbody></table>';
        contentEl.innerHTML = html;
    });
}

function loadSessions() {
    chrome.storage.local.get(['sessionLogs'], (data) => {
        const logs = (data.sessionLogs || []).slice().reverse();

        const statsEl = document.getElementById('stats');
        const contentEl = document.getElementById('content');

        const totalMinutes = logs.reduce((sum, l) => {
            const duration = (l.endTime - l.startTime) / 60000;
            return sum + duration;
        }, 0);

        const completedByTimer = logs.filter(l => l.endedBy === 'timer').length;

        statsEl.innerHTML = `
            <div class="stat-card">
                <div class="number">${logs.length}</div>
                <div class="label">Total Sessions</div>
            </div>
            <div class="stat-card">
                <div class="number">${Math.round(totalMinutes)}</div>
                <div class="label">Minutes Focused</div>
            </div>
            <div class="stat-card">
                <div class="number">${completedByTimer}</div>
                <div class="label">Completed</div>
            </div>
            <div class="stat-card">
                <div class="number">${logs.length - completedByTimer}</div>
                <div class="label">Ended Early</div>
            </div>
        `;

        if (logs.length === 0) {
            contentEl.innerHTML = '<div class="empty-state">No sessions recorded yet. Start your first focus session!</div>';
            return;
        }

        let html = `<table>
            <thead><tr>
                <th>Date</th>
                <th>Intent</th>
                <th>Planned</th>
                <th>Actual</th>
                <th>Ended By</th>
            </tr></thead><tbody>`;

        logs.forEach(log => {
            const date = new Date(log.startTime).toLocaleString();
            const actualMin = Math.round((log.endTime - log.startTime) / 60000);
            const badgeClass = log.endedBy === 'timer' ? 'badge-timer' : 'badge-user';
            html += `<tr>
                <td>${date}</td>
                <td>${escapeHtml(log.intent || '—')}</td>
                <td>${log.plannedMinutes}m</td>
                <td>${actualMin}m</td>
                <td><span class="badge ${badgeClass}">${log.endedBy}</span></td>
            </tr>`;
        });

        html += '</tbody></table>';
        contentEl.innerHTML = html;
    });
}

function exportJSON() {
    chrome.storage.local.get(['decisionLogs', 'sessionLogs', 'userId'], (data) => {
        const exportPayload = {
            userId: data.userId || 'unknown',
            exportedAt: new Date().toISOString(),
            sessions: data.sessionLogs || [],
            decisions: data.decisionLogs || []
        };
        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'taskguard_export.json';
        a.click();
        URL.revokeObjectURL(url);
    });
}

function exportCSV() {
    const activeTab = document.querySelector('.tab.active').dataset.tab;

    chrome.storage.local.get(['decisionLogs', 'sessionLogs'], (data) => {
        let csv = '';
        let filename = '';

        if (activeTab === 'decisions') {
            const logs = data.decisionLogs || [];
            csv = 'Timestamp,Intent,Intent Category,Domain,URL,Decision,Added to Allowlist\n';
            logs.forEach(log => {
                csv += `"${log.timestamp || ''}","${(log.intent || '').replace(/"/g, '""')}","${log.intentCategory || ''}","${log.domain || ''}","${(log.url || '').replace(/"/g, '""')}","${log.decision || ''}","${log.addedToAllowlist || false}"\n`;
            });
            filename = 'taskguard_decisions.csv';
        } else {
            const logs = data.sessionLogs || [];
            csv = 'Session ID,Intent,Intent Category,Start Time,End Time,Planned Minutes,Actual Minutes,Ended By\n';
            logs.forEach(log => {
                const actualMin = Math.round((log.endTime - log.startTime) / 60000);
                csv += `"${log.sessionId || ''}","${(log.intent || '').replace(/"/g, '""')}","${log.intentCategory || ''}","${new Date(log.startTime).toISOString()}","${new Date(log.endTime).toISOString()}","${log.plannedMinutes || ''}","${actualMin}","${log.endedBy || ''}"\n`;
            });
            filename = 'taskguard_sessions.csv';
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    });
}

function clearData() {
    if (confirm('Are you sure you want to clear all history data? This cannot be undone.')) {
        chrome.storage.local.remove(['decisionLogs', 'sessionLogs'], () => {
            loadTab(document.querySelector('.tab.active').dataset.tab);
        });
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
