
document.addEventListener('DOMContentLoaded', async () => {
    const trendingGrid = document.getElementById('trending-grid');
    const allProductsGrid = document.getElementById('all-products-grid');
    const categoryTabsContainer = document.getElementById('category-tabs');
    const userMenu = document.getElementById('user-menu');
    const loginBtn = document.getElementById('login-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    // Auth Check
    const user = await getCurrentUser();
    const userIconBtn = document.getElementById('user-icon-btn');

    if (user) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (userIconBtn) {
            userIconBtn.classList.remove('hidden');
            const initial = user.name ? user.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U');
            userIconBtn.innerHTML = `
                <span class="font-bold text-accent text-sm">${initial}</span>
                <span class="absolute top-0 right-0 w-2.5 h-2.5 bg-accent rounded-full border-2 border-primary animate-pulse"></span>
            `;
        }
        if (userDropdown) {
            // Dropdown visibility is handled by group-hover in CSS, but we ensure it can be triggered
            if (user.role === 'admin') {
                document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
            }
        }
    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userIconBtn) userIconBtn.classList.add('hidden');
    }

    // Load Featured Products for Homepage
    const featuredGrid = document.getElementById('featured-grid');
    if (featuredGrid) {
        try {
            const { data: featured } = await window.db
                .from('products')
                .select('*')
                .eq('is_featured', true)
                .limit(8)
                .order('created_at', { ascending: false });

            featuredGrid.innerHTML = '';
            if (featured && featured.length > 0) {
                featured.forEach(p => renderProductCard(p, featuredGrid));
            } else {
                // If no featured products, show a few trending ones as fallback
                const { data: trending } = await window.db
                    .from('products')
                    .select('*')
                    .eq('is_trending', true)
                    .limit(4);
                
                if (trending && trending.length > 0) {
                    trending.forEach(p => renderProductCard(p, featuredGrid));
                } else {
                    featuredGrid.innerHTML = '<p class="col-span-full text-center py-10 text-text-muted italic">Curated pieces arriving soon.</p>';
                }
            }
            if (typeof initScrollReveal === 'function') initScrollReveal();
        } catch (e) {
            console.error('Error loading featured pieces:', e);
        }
    }

    // Initial Cart Count
    updateCartCount();

    // UI Events
    userMenu?.addEventListener('mouseenter', () => userDropdown?.classList.remove('hidden'));
    userMenu?.addEventListener('mouseleave', () => {
        if (!user) userDropdown?.classList.add('hidden');
    });

    // Search on homepage — Redirect to Shop with query
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const q = searchInput.value.trim();
                if (q) {
                    window.location.href = `shop.html?search=${encodeURIComponent(q)}`;
                }
            }
        });
    }

    // Initialize Scroll Reveal for any static elements
    if (typeof initScrollReveal === 'function') {
        initScrollReveal();
    }
});
