/**
 * TOKO NADYN POS – Modal Module
 */
const Modal = {
    open(title, bodyHTML, footerBtns = [], size = '') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        const footer = document.getElementById('modal-footer');
        if (footerBtns.length) {
            footer.innerHTML = footerBtns.map((b, i) =>
                `<button class="btn ${b.cls || 'btn-outline'}" id="modal-btn-${i}">${b.label}</button>`
            ).join('');
            footer.style.display = '';
            footerBtns.forEach((b, i) => {
                const el = document.getElementById(`modal-btn-${i}`);
                if (el && b.action) el.addEventListener('click', b.action);
            });
        } else {
            footer.style.display = 'none';
        }
        const box = document.getElementById('modal-box');
        box.className = 'modal-box' + (size ? ' ' + size : '');
        document.getElementById('modal-overlay').classList.remove('hidden');
    },

    close() { document.getElementById('modal-overlay').classList.add('hidden'); },

    setBody(html) { document.getElementById('modal-body').innerHTML = html; },
    setTitle(t) { document.getElementById('modal-title').textContent = t; },
};

// Initialize modal close - ONLY via X button, not overlay click
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('modal-close').addEventListener('click', () => Modal.close());
    // NOTE: Overlay click intentionally disabled to prevent accidental data loss
});
