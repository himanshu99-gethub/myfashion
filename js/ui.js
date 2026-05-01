// MyFashion UI Utilities

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="material-symbols-outlined">
                ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
            </span>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 320);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function showSpinner() {
    const spinner = document.createElement('div');
    spinner.id = 'luxe-spinner';
    spinner.className = 'fixed inset-0 z-[9999] bg-primary/80 flex items-center justify-center backdrop-blur-sm';
    spinner.innerHTML = `
        <div class="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(255,205,0,0.3)]"></div>
    `;
    document.body.appendChild(spinner);
}

function hideSpinner() {
    const spinner = document.getElementById('luxe-spinner');
    if (spinner) spinner.remove();
}

// Scroll Reveal
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
}

// Sticky Header
function initStickyHeader() {
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled', 'py-4');
            header.classList.remove('py-6');
        } else {
            header.classList.remove('scrolled', 'py-4');
            header.classList.add('py-6');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    if(document.getElementById('main-header')) {
        initStickyHeader();
    }
});
