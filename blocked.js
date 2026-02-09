let selectedMinutes = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Load existing timer state
    loadTimerState();

    // Timer button selection
    document.querySelectorAll('.timer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedMinutes = parseInt(btn.dataset.minutes);
        });
    });

    // Submit intent
    document.getElementById('submit_intent').addEventListener('click', startFocusSession);
});

function loadTimerState() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage API not available. Make sure you are running this as an extension.');
        return;
    }
    chrome.storage.local.get(['timerEndTime', 'intent', 'taskDescription'], (data) => {
        if (data.timerEndTime) {
            const remaining = data.timerEndTime - Date.now();
            if (remaining > 0) {
                // Timer is running, show remaining time
                document.getElementById('intent_entry').style.display = 'none';
                document.getElementById('select_timer').querySelector('.timer-buttons').style.display = 'none';
                document.getElementById('select_timer').querySelector('.timer-label').textContent = 'Time Remaining:';
                document.getElementById('timer_display').style.display = 'block';
                document.getElementById('submit_intent').textContent = 'End Session';
                document.getElementById('submit_intent').onclick = endSession;
                updateTimerDisplay(remaining);
                setInterval(() => {
                    chrome.storage.local.get(['timerEndTime'], (d) => {
                        if (d.timerEndTime) {
                            const rem = d.timerEndTime - Date.now();
                            if (rem > 0) {
                                updateTimerDisplay(rem);
                            } else {
                                location.reload();
                            }
                        }
                    });
                }, 1000);
            }
        }
    });
}

function updateTimerDisplay(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    document.getElementById('timer_display').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startFocusSession() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
        alert('Chrome extension APIs not available. Please use this through the extension popup.');
        return;
    }

    const intent = document.getElementById('intent_input').value;
    const taskDescription = document.getElementById('task_description').value;

    if (!intent) {
        alert('Please enter your intent');
        return;
    }
    if (selectedMinutes === 0) {
        alert('Please select a focus duration');
        return;
    }

    const endTime = Date.now() + (selectedMinutes * 60 * 1000);

    chrome.storage.local.set({
        intent: intent,
        taskDescription: taskDescription,
        timerEndTime: endTime,
        timerMinutes: selectedMinutes
    }, () => {
        // Notify background script to start timer
        chrome.runtime.sendMessage({
            action: 'startTimer',
            minutes: selectedMinutes,
            endTime: endTime
        });
        window.location.href = "allowlist.html";
    });
}

function endSession() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
        alert('Chrome extension APIs not available.');
        return;
    }
    chrome.storage.local.remove(['timerEndTime', 'intent', 'taskDescription', 'timerMinutes'], () => {
        chrome.runtime.sendMessage({ action: 'stopTimer' });
        location.reload();
    });
}