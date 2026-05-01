
async function addToCart(productId, quantity = 1) {
    try {
        const { data: { user }, error: authError } = await window.db.auth.getUser();
        if (authError || !user) {
            showToast('Please login to curate your bag', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        // Check if item already exists
        const { data: existing } = await window.db
            .from('cart')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();

        if (existing) {
            await window.db
                .from('cart')
                .update({ quantity: existing.quantity + quantity })
                .eq('id', existing.id);
        } else {
            await window.db
                .from('cart')
                .insert({ user_id: user.id, product_id: productId, quantity });
        }
        
        showToast('Added to selection', 'success');
        updateCartCount();
    } catch (error) {
        showToast('Selection failed. Connected to DB?', 'error');
    }
}

async function updateCartCount() {
    try {
        const { data: { user }, error: authError } = await window.db.auth.getUser();
        if (authError || !user) return;

        const { data } = await window.db
            .from('cart')
            .select('quantity')
            .eq('user_id', user.id);
        
        const count = data?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
        const badge = document.getElementById('cart-count');
        if (badge) badge.textContent = count;
    } catch (e) {
        console.warn('Failed to update cart count:', e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;

    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    async function loadCart() {
        showSpinner();
        try {
            const { data: { user }, error: authError } = await window.db.auth.getUser();
            if (authError || !user) {
                window.location.href = 'login.html';
                return;
            }

            const { data: cartItems, error } = await window.db
                .from('cart')
                .select('*, products(*)')
                .eq('user_id', user.id);

            if (error) {
                showToast('Failed to retrieve bag', 'error');
            } else {
                renderCart(cartItems);
            }
        } catch(e) {
            console.error('Exception loading cart:', e);
            showToast('Unable to connect to databank', 'error');
            renderCart([]); // default empty state
        } finally {
            hideSpinner();
        }
    }

    function renderCart(items) {
        if (!items || items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="text-center py-20 border border-dashed border-accent/20 rounded-2xl">
                    <p class="text-text-muted italic mb-6">Your bag is currently a void.</p>
                    <a href="shop.html" class="btn-outline py-3 px-8 text-xs">Begin Curation</a>
                </div>
            `;
            subtotalEl.textContent = '₹0';
            totalEl.textContent = '₹0';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        cartItemsContainer.innerHTML = '';
        let total = 0;

        items.forEach(item => {
            const product = item.products;
            const itemTotal = product.price * item.quantity;
            total += itemTotal;

            const div = document.createElement('div');
            div.className = 'cart-item group flex flex-col md:flex-row gap-8 items-center bg-secondary/30 p-6 rounded-2xl border border-accent/5 hover:border-accent/10 transition-all';
            div.innerHTML = `
                <div class="w-32 aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
                    <img src="${product.image_url}" class="w-full h-full object-cover transition-all">
                </div>
                <div class="flex-grow space-y-2">
                    <h3 class="text-2xl font-bebas tracking-widest text-text-white">${product.title}</h3>
                    <p class="text-[10px] uppercase tracking-widest text-text-muted">${product.category}</p>
                    <p class="text-accent font-bold">₹${product.price.toLocaleString('en-IN')}</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex border border-accent/20 rounded overflow-hidden text-xs">
                        <button class="px-3 py-1 hover:bg-accent/10 dec-qty" data-id="${item.id}" data-qty="${item.quantity}">-</button>
                        <span class="px-4 py-1 bg-primary/40">${item.quantity}</span>
                        <button class="px-3 py-1 hover:bg-accent/10 inc-qty" data-id="${item.id}" data-qty="${item.quantity}">+</button>
                    </div>
                    <button class="remove-item text-error hover:scale-110 transition-transform" data-id="${item.id}">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            `;
            cartItemsContainer.appendChild(div);
        });

        subtotalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
        totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
    }

    cartItemsContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;
        if (btn.classList.contains('remove-item')) {
            await window.db.from('cart').delete().eq('id', id);
            loadCart();
        } else if (btn.classList.contains('inc-qty')) {
            await window.db.from('cart').update({ quantity: parseInt(btn.dataset.qty) + 1 }).eq('id', id);
            loadCart();
        } else if (btn.classList.contains('dec-qty')) {
            const newQty = parseInt(btn.dataset.qty) - 1;
            if (newQty > 0) {
                await window.db.from('cart').update({ quantity: newQty }).eq('id', id);
                loadCart();
            }
        }
    });

    checkoutBtn?.addEventListener('click', () => {
        window.location.href = 'checkout.html';
    });

    loadCart();
});
