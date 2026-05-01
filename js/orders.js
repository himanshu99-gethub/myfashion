
document.addEventListener('DOMContentLoaded', async () => {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    async function loadOrders() {
        showSpinner();
        const { data: { user } } = await window.db.auth.getUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const { data: orders, error } = await window.db
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products (*)
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            ordersList.innerHTML = `<p class="text-center py-20 text-error uppercase tracking-widest text-xs">Failed to retrieve dossiers</p>`;
            hideSpinner();
            return;
        }

        renderOrders(orders);
        hideSpinner();
    }

    function renderOrders(orders) {
        if (!orders || orders.length === 0) {
            ordersList.innerHTML = `
                <div class="text-center py-20 border border-dashed border-accent/20 rounded-3xl">
                    <p class="text-text-muted italic mb-6 uppercase tracking-widest text-[10px]">No historical records found for this identity.</p>
                    <a href="shop.html" class="btn-outline py-3 px-8 text-xs">Acquisition Realm</a>
                </div>
            `;
            return;
        }

        ordersList.innerHTML = '';
        orders.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            const div = document.createElement('div');
            div.className = 'order-card p-10 rounded-[2rem] flex flex-col gap-10';
            div.setAttribute('data-reveal', '');
            
            div.innerHTML = `
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-accent/10 pb-10">
                    <div>
                        <span class="text-accent text-[10px] uppercase font-bold tracking-[0.3em] block mb-1">Dossier #${order.id.slice(0,8).toUpperCase()}</span>
                        <h3 class="text-2xl font-bebas tracking-widest uppercase">${date}</h3>
                    </div>
                    <div class="text-right">
                        <span class="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusClass(order.status)}">
                            ${order.status}
                        </span>
                        <p class="text-2xl font-syne font-bold text-accent mt-3">₹${order.total_price.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    ${order.order_items.map(item => `
                        <div class="flex gap-4 items-center bg-secondary/30 p-4 rounded-xl">
                            <img src="${item.products.image_url}" class="w-16 h-20 object-cover rounded-lg">
                            <div>
                                <h4 class="text-[10px] uppercase font-bold tracking-widest text-text-white line-clamp-1">${item.products.title}</h4>
                                <p class="text-[10px] text-text-muted mt-1">QTY: ${item.quantity}</p>
                                <p class="text-[10px] text-accent mt-1">₹${item.price.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="flex flex-col md:flex-row justify-between items-center pt-8 gap-6 text-[10px] uppercase tracking-[0.2em] font-bold text-text-muted">
                    <p>SHIPPING TO: ${order.shipping_address}</p>
                    <button class="hover:text-accent transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">download</span>
                        Download Transaction Receipt
                    </button>
                </div>
            `;
            ordersList.appendChild(div);
        });
        initScrollReveal();
    }

    function getStatusClass(status) {
        switch(status.toLowerCase()) {
            case 'processing': return 'bg-accent/10 text-accent';
            case 'completed': return 'bg-success/10 text-success';
            case 'cancelled':  return 'bg-error/10 text-error';
            default: return 'bg-secondary text-text-muted';
        }
    }

    loadOrders();
});
