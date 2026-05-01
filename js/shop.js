
document.addEventListener('DOMContentLoaded', async () => {
    const productGrid = document.getElementById('product-grid');
    const categoryContainer = document.getElementById('category-filters');
    const sortSelect = document.getElementById('sort-select');
    const priceRange = document.getElementById('price-range');
    const priceValue = document.getElementById('price-value');
    const resetBtn = document.getElementById('reset-filters');
    const resultsCount = document.getElementById('results-count');

    let allProducts = [];

    async function loadShop() {
        showSpinner();
        try {
            // Fetch everything
            const { data: products, error } = await window.db.from('products').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            allProducts = products || [];

            // Populate Categories in Sidebar
            const uniqueCats = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();
            categoryContainer.innerHTML = uniqueCats.map(cat => `
                <div class="cat-item group cursor-pointer flex items-center justify-between py-1 transition-all" data-value="${cat}">
                    <span class="text-text-muted group-hover:text-accent transition-colors text-sm uppercase tracking-widest">${cat}</span>
                    <div class="w-4 h-4 border border-accent/20 rounded-sm flex items-center justify-center group-[.active]:border-accent group-[.active]:bg-accent/10">
                        <span class="material-symbols-outlined text-[10px] text-accent hidden group-[.active]:block">check</span>
                    </div>
                </div>
            `).join('');

            // Check category from URL if exists
            const urlParams = new URLSearchParams(window.location.search);
            const urlCat = urlParams.get('category');
            if (urlCat) {
                const item = categoryContainer.querySelector(`.cat-item[data-value="${urlCat}"]`);
                if (item) item.classList.add('active');
            }

            // Sync search if triggered from header
            const globalSearch = document.getElementById('global-search');
            if (urlParams.get('search') && globalSearch) {
                globalSearch.value = urlParams.get('search');
            }

            applyFilters();
            
            // Single choice selection logic
            categoryContainer.addEventListener('click', (e) => {
                const item = e.target.closest('.cat-item');
                if (!item) return;

                const isActive = item.classList.contains('active');
                
                // Reset all
                document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
                
                // Toggle current (if it wasn't active, make it active. if it was, leave it reset for "All")
                if (!isActive) item.classList.add('active');

                applyFilters();
            });

        } catch (e) {
            console.error('Failed to load shop:', e);
            showToast('Failed to load pieces', 'error');
        } finally {
            hideSpinner();
        }
    }

    function applyFilters() {
        let filtered = [...allProducts];
        
        // Search Filter (if any)
        const searchQuery = document.getElementById('global-search')?.value.toLowerCase();
        if (searchQuery) {
            filtered = filtered.filter(p => 
                p.title.toLowerCase().includes(searchQuery) || 
                p.category.toLowerCase().includes(searchQuery) ||
                (p.sku && p.sku.toLowerCase().includes(searchQuery))
            );
        }

        // Category Filter
        const activeCat = document.querySelector('.cat-item.active')?.dataset.value;
        if (activeCat) {
            filtered = filtered.filter(p => p.category === activeCat);
        }

        // Price Filter
        const maxPrice = parseInt(priceRange.value);
        filtered = filtered.filter(p => p.price <= maxPrice);

        // Sort
        const sortBy = sortSelect.value;
        if (sortBy === 'price-low') filtered.sort((a, b) => a.price - b.price);
        if (sortBy === 'price-high') filtered.sort((a, b) => b.price - a.price);

        if (resultsCount) resultsCount.textContent = `Showing ${filtered.length} pieces`;
        renderGrid(filtered);
    }

    function renderGrid(products) {
        productGrid.innerHTML = '';
        if (products.length === 0) {
            productGrid.innerHTML = '<div class="col-span-full text-center py-20"><p class="text-text-muted italic mb-4">No pieces found in this vibration.</p><button onclick="window.location.reload()" class="btn-outline py-2 px-6 text-[10px]">Reset View</button></div>';
            return;
        }
        products.forEach(p => renderProductCard(p, productGrid));
        initScrollReveal();
    }

    // Event Listeners
    sortSelect?.addEventListener('change', applyFilters);
    priceRange?.addEventListener('input', (e) => {
        priceValue.textContent = `₹${parseInt(e.target.value).toLocaleString('en-IN')}`;
        applyFilters();
    });
    
    document.getElementById('global-search')?.addEventListener('input', applyFilters);
    
    resetBtn?.addEventListener('click', () => {
        document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
        document.getElementById('global-search').value = '';
        priceRange.value = 100000;
        priceValue.textContent = '₹1,00,000';
        applyFilters();
    });

    loadShop();
});
