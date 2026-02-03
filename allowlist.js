//DOMContentLoaded event to ensure the DOM is fully loaded before attaching event listeners instead of using plain click event
document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('add_allowlist');
    const input = document.getElementById('allowlist_input');
    const list = document.getElementById('allowlist_display');

    if (!addBtn) return;

    addBtn.addEventListener('click', () => {
        if (!input || !list) return;
        const value = input.value.trim();
        if (!value) return;
        const listItem = document.createElement('li');
        listItem.textContent = value;
        list.appendChild(listItem);
        input.value = '';
    });
});