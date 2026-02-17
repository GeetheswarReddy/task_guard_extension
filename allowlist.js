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
    let domain = input.value.trim().toLowerCase();
    if (!domain) return;

    // Clean up the input - extract domain from URL if needed
    domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');

    addDomainToStorage(domain);
    input.value = '';
}

function addDomainToStorage(domain) {
    chrome.storage.local.get(['allowlist'], (data) => {
        const allowlist = data.allowlist || [];
        if (allowlist.includes(domain)) return; // already exists
        allowlist.push(domain);
        chrome.storage.local.set({ allowlist: allowlist }, () => {
            loadAllowlist();
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
