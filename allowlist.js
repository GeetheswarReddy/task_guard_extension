document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('add_allowlist');
    const input = document.getElementById('allowlist_input');

    loadAllowlist();

    addBtn.addEventListener('click', () => addSite());
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addSite();
    });

    // Quick-add chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            addDomainToStorage(chip.dataset.domain);
        });
    });

    // Back link
    document.getElementById('back_link').addEventListener('click', () => {
        window.close();
    });
});

function addSite() {
    const input = document.getElementById('allowlist_input');
    const rawInput = input.value.trim().toLowerCase();
    if (!rawInput) return;

    // Support comma-separated domains
    const domains = rawInput.split(',').map(d => {
        // Clean up each domain - extract domain from URL if needed
        return d.trim()
            .replace(/^https?:\/\//, '')
            .replace(/\/.*$/, '')
            .replace(/^www\./, '');
    }).filter(d => d.length > 0);

    // Add all domains
    domains.forEach(domain => addDomainToStorage(domain));
    input.value = '';
}

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function showToast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type}`;
    el.style.display = 'block';
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.style.display = 'none'; }, 2500);
}

function addDomainToStorage(domain) {
    if (!DOMAIN_RE.test(domain)) {
        showToast(`"${domain}" is not a valid domain`, 'error');
        return;
    }
    chrome.storage.local.get(['allowlist'], (data) => {
        const allowlist = data.allowlist || [];
        if (allowlist.includes(domain)) {
            showToast(`${domain} is already in your allowlist`, 'warn');
            return;
        }
        allowlist.push(domain);
        chrome.storage.local.set({ allowlist: allowlist }, () => {
            loadAllowlist();
            showToast(`${domain} added`, 'success');
        });
    });
}

function removeDomain(domain) {
    chrome.storage.local.get(['allowlist'], (data) => {
        const allowlist = (data.allowlist || []).filter(d => d !== domain);
        chrome.storage.local.set({ allowlist: allowlist }, () => {
            loadAllowlist();
        });
    });
}

function loadAllowlist() {
    chrome.storage.local.get(['allowlist'], (data) => {
        const allowlist = data.allowlist || [];
        const list = document.getElementById('allowlist_display');
        const emptyState = document.getElementById('empty_state');

        list.innerHTML = '';

        if (allowlist.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        allowlist.forEach(domain => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="domain">${domain}</span>
                <button class="remove-btn" title="Remove">&times;</button>
            `;
            li.querySelector('.remove-btn').addEventListener('click', () => removeDomain(domain));
            list.appendChild(li);
        });
    });
}
