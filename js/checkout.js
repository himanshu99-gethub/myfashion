
document.addEventListener('DOMContentLoaded', async () => {
    const summaryItems = document.getElementById('order-summary-items');
    const subtotalEl = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const checkoutForm = document.getElementById('checkout-form');

    let cartData = [];
    let totalValuation = 0;

    async function loadSummary() {
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

            if (error || !cartItems || !cartItems.length) {
                window.location.href = 'cart.html';
                return;
            }

            cartData = cartItems;
            renderSummary(cartItems);
        } catch(e) {
            console.error('Checkout initialization failed:', e);
            showToast('Unable to securely connect to database.', 'error');
            setTimeout(() => window.location.href = 'cart.html', 1500);
        } finally {
            hideSpinner();
        }
    }

    function renderSummary(items) {
        summaryItems.innerHTML = '';
        let subtotal = 0;

        items.forEach(item => {
            const product = item.products;
            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            const div = document.createElement('div');
            div.className = 'flex gap-6 items-center';
            div.innerHTML = `
                <div class="w-16 aspect-[3/4] bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                    <img src="${product.image_url}" class="w-full h-full object-cover">
                </div>
                <div class="flex-grow">
                    <h4 class="text-[10px] uppercase font-bold tracking-widest text-text-white line-clamp-1">${product.title}</h4>
                    <p class="text-[10px] text-text-muted">QTY: ${item.quantity}</p>
                    <p class="text-[10px] font-bold text-accent mt-1">₹${product.price.toLocaleString('en-IN')}</p>
                </div>
            `;
            summaryItems.appendChild(div);
        });

        totalValuation = subtotal;
        subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
        totalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    }

    placeOrderBtn?.addEventListener('click', async () => {
        if (!checkoutForm.checkValidity()) {
            checkoutForm.reportValidity();
            return;
        }

        showSpinner();
        const { data: { user } } = await window.db.auth.getUser();
        
        try {
            // 1. Create Order
            const { data: order, error: orderError } = await window.db
                .from('orders')
                .insert({
                    user_id: user.id,
                    total_price: totalValuation,
                    status: 'Processing',
                    shipping_address: `${document.getElementById('address').value}, ${document.getElementById('city').value} - ${document.getElementById('pincode').value}`,
                    phone: document.getElementById('phone').value,
                    full_name: document.getElementById('full_name').value
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            const orderItems = cartData.map(item => ({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.products.price
            }));

            const { error: itemsError } = await window.db
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Clear Cart
            await window.db.from('cart').delete().eq('user_id', user.id);

            showToast('Protocol Authorized. Order Confirmed.', 'success');
            setTimeout(() => window.location.href = `success.html?order_id=${order.id}`, 1500);
            
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideSpinner();
        }
    });

    loadSummary();
});
