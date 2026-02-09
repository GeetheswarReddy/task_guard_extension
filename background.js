// TaskGuard Background Service Worker

let badgeInterval = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startTimer') {
        startBadgeTimer(message.endTime);
    } else if (message.action === 'stopTimer') {
        stopBadgeTimer();
    }
});

// Check for existing timer on startup
chrome.runtime.onStartup.addListener(() => {
    checkExistingTimer();
});

// Also check when service worker activates
checkExistingTimer();

function checkExistingTimer() {
    chrome.storage.local.get(['timerEndTime'], (data) => {
        if (data.timerEndTime) {
            const remaining = data.timerEndTime - Date.now();
            if (remaining > 0) {
                startBadgeTimer(data.timerEndTime);
            } else {
                // Timer expired, clean up
                chrome.storage.local.remove(['timerEndTime', 'intent', 'taskDescription', 'timerMinutes']);
                clearBadge();
            }
        }
    });
}

function startBadgeTimer(endTime) {
    // Clear any existing interval
    if (badgeInterval) {
        clearInterval(badgeInterval);
    }

    updateBadge(endTime);
    badgeInterval = setInterval(() => {
        updateBadge(endTime);
    }, 1000);
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
        // Timer finished
        stopBadgeTimer();
        chrome.storage.local.remove(['timerEndTime', 'intent', 'taskDescription', 'timerMinutes']);
        chrome.action.setBadgeText({ text: 'Done' });
        chrome.action.setBadgeBackgroundColor({ color: '#28a745' });

        // Clear "Done" after 5 seconds
        setTimeout(() => {
            clearBadge();
        }, 5000);
        return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    let badgeText;
    if (minutes >= 60) {
        // Show hours if >= 60 minutes
        const hours = Math.floor(minutes / 60);
        badgeText = `${hours}h`;
    } else if (minutes > 0) {
        // Show minutes
        badgeText = `${minutes}m`;
    } else {
        // Show seconds when under 1 minute
        badgeText = `${seconds}s`;
    }

    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#007bff' });
}

function clearBadge() {
    chrome.action.setBadgeText({ text: '' });
}
