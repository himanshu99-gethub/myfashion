
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('product-detail-container');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'shop.html';
        return;
    }

    async function loadProduct() {
        showSpinner();
        const { data: product, error } = await window.db
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error || !product) {
            container.innerHTML = `<p class="text-center py-20 text-error">The piece you seek has vanished into shard space.</p>`;
            hideSpinner();
            return;
        }

        renderDetail(product);
        hideSpinner();
    }

    function renderDetail(product) {
        container.innerHTML = `
            <div class="flex flex-col lg:flex-row gap-16" data-reveal>
                <!-- Gallery -->
                <div class="lg:w-1/2 space-y-6">
                    <div class="aspect-[4/5] bg-secondary rounded-2xl overflow-hidden group">
                        <img src="${product.image_url}" class="w-full h-full object-cover transition-all duration-700" alt="${product.title}">
                    </div>
                </div>

                <!-- Info -->
                <div class="lg:w-1/2 space-y-10">
                    <div class="space-y-4">
                        <span class="text-accent tracking-[0.4em] uppercase text-xs font-bold block">${product.category}</span>
                        <h1 class="text-6xl font-bebas tracking-widest leading-none">${product.title}</h1>
                        <p class="text-4xl font-syne font-bold text-accent">₹${product.price.toLocaleString('en-IN')}</p>
                    </div>

                    <p class="text-text-muted text-lg leading-relaxed">
                        ${product.description || 'Architectural precision meets wearable art. A core piece for the modern monolith.'}
                    </p>

                    <div class="space-y-6">
                        <div class="flex items-center gap-6">
                            <div class="flex border border-accent/20 rounded-lg overflow-hidden">
                                <button id="dec-qty" class="px-4 py-2 hover:bg-accent/10">-</button>
                                <input type="number" id="qty" value="1" min="1" class="w-16 bg-transparent border-none text-center focus:ring-0">
                                <button id="inc-qty" class="px-4 py-2 hover:bg-accent/10">+</button>
                            </div>
                            <button id="add-btn" class="btn-primary flex-grow py-4 text-sm font-bold tracking-widest">
                                Add to selection
                            </button>
                        </div>
                        <button id="wish-btn" class="btn-outline w-full py-4 text-sm font-bold tracking-widest">
                            Add to wishlist
                        </button>
                    </div>

                    <div class="pt-10 border-t border-accent/10 grid grid-cols-2 gap-8 text-[10px] uppercase tracking-widest font-bold">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-accent">local_shipping</span>
                            <span>Complimentary Delivery</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-accent">verified_user</span>
                            <span>Lifetime Warranty</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Event Listeners for new logic
        const addBtn = document.getElementById('add-btn');
        const qtyInput = document.getElementById('qty');
        
        document.getElementById('inc-qty')?.addEventListener('click', () => qtyInput.value++);
        document.getElementById('dec-qty')?.addEventListener('click', () => {
            if (qtyInput.value > 1) qtyInput.value--;
        });

        addBtn?.addEventListener('click', async () => {
            const qty = parseInt(qtyInput.value);
            await addToCart(product.id, qty);
        });
    }

    loadProduct();
});
