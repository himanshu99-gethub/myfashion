
async function fetchProducts(filters = {}) {
    let query = window.db.from('products').select('*');
    
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.is_trending) query = query.eq('is_trending', true);
    if (filters.is_featured) query = query.eq('is_featured', true);
    
    try {
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching products:', error);
            showToast('Unable to connect to databank. Check config.', 'error');
            return [];
        }
        return data || [];
    } catch (e) {
        console.error('Exception fetching products (likely missing API keys):', e);
        showToast('Supabase connection failed. Missing valid keys?', 'error');
        return [];
    }
}

function renderProductCard(product, container) {
    const card = document.createElement('div');
    card.className = 'product-card group relative flex flex-col p-4';
    card.setAttribute('data-reveal', '');
    
    const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;
    
    card.innerHTML = `
        <div class="relative aspect-[3/4] bg-secondary rounded-lg overflow-hidden mb-6">
            ${discount > 0 ? `<span class="absolute top-4 left-4 z-10 bg-accent text-black text-[10px] font-bold px-3 py-1 uppercase tracking-tighter">-${discount}%</span>` : ''}
            <img src="${product.image_url}" class="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="${product.title}">
            
            <!-- Quick Actions -->
            <div class="absolute bottom-0 w-full bg-primary/80 backdrop-blur px-4 py-3 flex justify-between items-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <button class="wishlist-btn hover:text-accent transition-colors" data-id="${product.id}">
                    <span class="material-symbols-outlined text-xl">favorite</span>
                </button>
                <button onclick="window.location.href='product.html?id=${product.id}'" class="hover:text-accent transition-colors">
                    <span class="material-symbols-outlined text-xl">visibility</span>
                </button>
                <button class="add-to-cart-btn hover:text-accent transition-colors" data-id="${product.id}">
                    <span class="material-symbols-outlined text-xl">shopping_cart</span>
                </button>
            </div>
        </div>
        
        <div class="flex flex-col flex-1">
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-syne text-lg tracking-tight group-hover:text-accent transition-colors uppercase">${product.title}</h3>
                <span class="font-syne font-bold text-accent">₹${product.price.toLocaleString('en-IN')}</span>
            </div>
            
            <p class="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-4">${product.category}</p>
            
            <div class="flex gap-1 mb-6">
                ${renderStars(product.rating || 4)}
            </div>
            
            <button class="mt-auto w-full py-3 border border-accent/20 text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-black transition-all add-to-cart-btn" data-id="${product.id}">
                Add to selection
            </button>
        </div>
    `;
    
    container.appendChild(card);
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="material-symbols-outlined text-accent text-[10px]" style="font-variation-settings: 'FILL' ${i <= rating ? 1 : 0};">star</span>`;
    }
    return stars;
}

// Logic for add to cart and wishlist
document.addEventListener('click', async (e) => {
    if (e.target.closest('.add-to-cart-btn')) {
        const btn = e.target.closest('.add-to-cart-btn');
        const productId = btn.dataset.id;
        // Import addToCart dynamically to avoid circular dependency
        await addToCart(productId);
    }
    
    if (e.target.closest('.wishlist-btn')) {
        const btn = e.target.closest('.wishlist-btn');
        const icon = btn.querySelector('.material-symbols-outlined');
        icon.style.fontVariationSettings = "'FILL' 1";
        showToast('Added to wishlist', 'success');
    }
});
