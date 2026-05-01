document.addEventListener('DOMContentLoaded', async () => {
    // 1. Sidebar Toggle
    const openBtn = document.getElementById('open-sidebar');
    const closeBtn = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');

    if (openBtn) openBtn.addEventListener('click', () => { sidebar.style.left = '0'; sidebar.classList.remove('max-md:-translate-x-full'); sidebar.classList.add('max-md:translate-x-0'); });
    if (closeBtn) closeBtn.addEventListener('click', () => { sidebar.style.left = ''; sidebar.classList.remove('max-md:translate-x-0'); sidebar.classList.add('max-md:-translate-x-full'); });

    // Logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', async () => {
        await window.db.auth.signOut();
        window.location.href = 'index.html';
    });

    // 2. Auth Check
    document.documentElement.style.backgroundColor = '#111721'; // Force dark bg so it never flashes white
    document.body.style.opacity = '0'; // Instantly lock view 
    document.body.style.transition = 'opacity 0.3s ease';
    
    async function checkAdmin() {
        if (!window.db) return null;
        try {
            const { data: { user }, error: authError } = await window.db.auth.getUser();
            if (authError || !user) {
                throw new Error("No user");
            }

            // --- STRICT BYPASS FOR ADMIN ---
            // If the authenticated user is the main admin, immediately grant access
            if (user.email === 'admin@myfashion.com' || user.email === 'admin@fashion.com') {
                return user;
            }

            // For other future admins, check their role in users table
            const { data: profile, error } = await window.db.from('users').select('role').eq('id', user.id).single();

            if (error || !profile || profile.role !== 'admin') {
                throw new Error("Not an admin");
            }
            
            return user;
        } catch (e) {
            window.location.replace('admin_login.html');
            return null;
        }
    }

    const adminUser = await checkAdmin();
    if (!adminUser) return;
    
    // Unlock view now that Admin is verified
    document.body.style.display = 'flex';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 10);

    // Page Specific Logic
    const currentPath = window.location.pathname;

    // ----- DASHBOARD (admin.html) -----
    if (currentPath.includes('admin.html')) {
        async function loadDashboardCards() {
            try {
                const { count: userCount } = await window.db.from('users').select('*', { count: 'exact', head: true });
                const { count: productCount } = await window.db.from('products').select('*', { count: 'exact', head: true });
                const { data: orders } = await window.db.from('orders').select('total_price, created_at');

                document.getElementById('stat-users').innerText = userCount || 0;
                document.getElementById('stat-products').innerText = productCount || 0;
                document.getElementById('stat-orders').innerText = orders?.length || 0;
                
                const revenue = orders?.reduce((acc, order) => acc + (Number(order.total_price) || 0), 0) || 0;
                document.getElementById('stat-revenue').innerText = '₹' + revenue.toLocaleString('en-IN');

                // Basic Charts
                renderCharts(orders || []);
            } catch (e) {
                console.error("Dashboard error", e);
            }
        }

        function renderCharts(orders) {
            // 1. Prepare Last 6 Months Labels
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthLabels = [];
            const revenueData = new Array(6).fill(0);
            const orderCountData = new Array(6).fill(0);
            
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                monthLabels.push(months[d.getMonth()]);
            }

            // 2. Aggregate actual data
            orders.forEach(order => {
                const orderDate = new Date(order.created_at);
                const orderMonth = orderDate.getMonth();
                const orderYear = orderDate.getFullYear();

                // Find if this order falls in our 6-month window
                for (let i = 0; i < 6; i++) {
                    const windowDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
                    if (orderMonth === windowDate.getMonth() && orderYear === windowDate.getFullYear()) {
                        revenueData[i] += Number(order.total_price) || 0;
                        orderCountData[i] += 1;
                        break;
                    }
                }
            });

            // 3. Apply Chart.js Defaults
            Chart.defaults.color = '#9aa3ad';
            Chart.defaults.borderColor = 'rgba(255, 205, 0, 0.1)';
            Chart.defaults.font.family = "'DM Sans', sans-serif";

            // 4. Render Sales Chart
            const salesCtx = document.getElementById('salesChart');
            if (salesCtx) {
                new Chart(salesCtx, {
                    type: 'line',
                    data: {
                        labels: monthLabels,
                        datasets: [{
                            label: 'Revenue (₹)',
                            data: revenueData,
                            borderColor: '#ffcd00',
                            backgroundColor: 'rgba(255, 205, 0, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#ffcd00',
                            pointBorderColor: '#192230',
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: {
                                    callback: function(value) {
                                        return '₹' + value.toLocaleString('en-IN');
                                    }
                                }
                            },
                            x: {
                                grid: { display: false }
                            }
                        }
                    }
                });
            }

            // 5. Render Orders Chart
            const ordersCtx = document.getElementById('ordersChart');
            if (ordersCtx) {
                new Chart(ordersCtx, {
                    type: 'bar',
                    data: {
                        labels: monthLabels,
                        datasets: [{
                            label: 'Orders',
                            data: orderCountData,
                            backgroundColor: '#ffcd00',
                            hoverBackgroundColor: '#ffffff',
                            borderRadius: 6,
                            barThickness: 20
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: { stepSize: 1 }
                            },
                            x: {
                                grid: { display: false }
                            }
                        }
                    }
                });
            }
        }

        loadDashboardCards();
    }

    // ----- PRODUCTS (admin_products.html) -----
    else if (currentPath.includes('admin_products.html')) {
        
        let allProductsCache = [];

        // Make loadProducts global so inline scripts can call it
        window.loadProducts = async function(searchTerm = '') {
            const tbody = document.getElementById('products-tbody');
            const countLabel = document.getElementById('product-count-label');
            if (!tbody) return;

            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-10">
                <div class="flex justify-center"><div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div></div>
            </td></tr>`;

            let query = window.db.from('products').select('*').order('created_at', { ascending: false });
            const { data } = await query;
            allProductsCache = data || [];

            // Populate category datalist
            const datalist = document.getElementById('category-list');
            if (datalist) {
                const uniqueCats = [...new Set(allProductsCache.map(p => p.category).filter(Boolean))].sort();
                datalist.innerHTML = uniqueCats.map(c => `<option value="${c}">`).join('');
            }

            // Filter by search
            let filtered = allProductsCache;
            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                filtered = allProductsCache.filter(p =>
                    (p.title || '').toLowerCase().includes(q) ||
                    (p.category || '').toLowerCase().includes(q) ||
                    (p.sku || '').toLowerCase().includes(q)
                );
            }

            if (countLabel) countLabel.textContent = `${filtered.length} products${searchTerm ? ' matching "' + searchTerm + '"' : ''}`;

            tbody.innerHTML = '';
            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center py-12 text-text-muted italic">No products found.</td></tr>`;
                return;
            }

            tbody.innerHTML = filtered.map(p => {
                const isTrending = p.is_trending;
                const imgSrc = p.image_url || 'https://via.placeholder.com/40';
                return `
                    <tr>
                        <td>
                            <img src="${imgSrc}" 
                                 class="w-12 h-12 object-cover rounded-lg transition-all cursor-pointer"
                                 onerror="this.src='https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100'">
                        </td>
                        <td>
                            <div class="font-bold text-text-white text-xs">${p.title}</div>
                            ${p.description ? `<div class="text-text-muted text-[10px] mt-0.5 truncate max-w-[180px]">${p.description}</div>` : ''}
                        </td>
                        <td class="text-text-muted font-mono text-[10px]">${p.sku || '<span class="opacity-40">—</span>'}</td>
                        <td>
                            <span class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent/10 text-accent">${p.category}</span>
                        </td>
                        <td>
                            <div class="text-accent font-bold">₹${Number(p.price).toLocaleString('en-IN')}</div>
                            ${p.original_price ? `<div class="text-text-muted line-through text-[10px]">₹${Number(p.original_price).toLocaleString('en-IN')}</div>` : ''}
                        </td>
                        <td class="text-text-white">${p.stock ?? 100}</td>
                        <td>
                            ${isTrending 
                                ? `<span class="text-accent text-[10px] font-bold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse inline-block"></span> Yes</span>`
                                : `<span class="text-text-muted text-[10px]">No</span>`}
                        </td>
                        <td class="text-right">
                            <button class="edit-btn text-accent hover:scale-125 transition-transform p-1 mr-2" data-id="${p.id}" title="Edit">
                                <span class="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button class="delete-btn text-error hover:scale-125 transition-transform p-1" data-id="${p.id}" title="Delete">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        };

        // Edit handler
        document.getElementById('products-tbody')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('.edit-btn');
            const delBtn = e.target.closest('.delete-btn');
            
            if (btn) {
                const id = btn.dataset.id;
                const product = allProductsCache.find(p => p.id == id);
                if (product) window.openEditModal(product);
            }

            if (delBtn && confirm('⚠️ Delete this product permanently?')) {
                const { error } = await window.db.from('products').delete().eq('id', delBtn.dataset.id);
                if (error) { showToast('Delete failed: ' + error.message, 'error'); return; }
                showToast('Product deleted', 'success');
                window.loadProducts();
            }
        });

        // Global state for editor
        window.currentEditId = null;

        window.openEditModal = function(product) {
            window.currentEditId = product?.id || null;
            
            const modal = document.getElementById('add-modal');
            const title = modal.querySelector('h2');
            
            if (window.currentEditId) {
                title.innerText = 'Edit Product';
                // Fill inputs
                document.getElementById('p-name').value = product.title || '';
                document.getElementById('p-sku').value = product.sku || '';
                document.getElementById('p-price').value = product.price || '';
                document.getElementById('p-original-price').value = product.original_price || '';
                document.getElementById('p-stock').value = product.stock || 100;
                document.getElementById('p-category').value = product.category || '';
                document.getElementById('p-rating').value = product.rating || 4.5;
                document.getElementById('p-description').value = product.description || '';
                document.getElementById('p-image-url').value = product.image_url || '';
                document.getElementById('p-trending').checked = !!product.is_trending;
                document.getElementById('p-featured').checked = !!product.is_featured;
            } else {
                title.innerText = 'Add New Product';
                document.getElementById('add-product-form').reset();
            }

            // Reset file upload state
            document.getElementById('p-image-file').value = '';
            const preview = document.getElementById('img-preview');
            if (preview) {
                if (window.currentEditId) {
                    preview.src = product.image_url;
                    preview.style.display = 'block';
                } else {
                    preview.src = '';
                    preview.style.display = 'none';
                }
            }
            const label = document.getElementById('file-name-label');
            if (label) label.classList.add('hidden');
            
            switchImageTab('url');
            modal.classList.remove('hidden');
        };

        window.closeAddModal = function() {
            window.currentEditId = null;
            document.getElementById('add-product-form').reset();
            const modal = document.getElementById('add-modal');
            modal.querySelector('h2').innerText = 'Add New Product';
            modal.classList.add('hidden');
        };

        window.submitProduct = async function() {
            const name = document.getElementById('p-name').value.trim();
            const price = parseFloat(document.getElementById('p-price').value);
            const category = document.getElementById('p-category').value.trim();

            if (!name || !price || !category) {
                showToast('Please fill in Name, Price and Category', 'error');
                return;
            }

            let imageUrl = '';
            const activeTab = document.getElementById('tab-url').classList.contains('active') ? 'url' : 'file';

            if (activeTab === 'url') {
                imageUrl = document.getElementById('p-image-url').value.trim();
            } else {
                imageUrl = document.getElementById('img-preview').src;
            }

            if (!imageUrl || imageUrl.includes('window.location.href')) {
                showToast('Please provide a product image', 'error');
                return;
            }

            const productData = {
                title: name,
                price: price,
                original_price: parseFloat(document.getElementById('p-original-price').value) || null,
                category: category,
                image_url: imageUrl,
                description: document.getElementById('p-description').value.trim() || 'Premium curated piece.',
                rating: parseFloat(document.getElementById('p-rating').value) || 4.5,
                sku: document.getElementById('p-sku').value.trim() || null,
                stock: parseInt(document.getElementById('p-stock').value) || 100,
                is_trending: document.getElementById('p-trending').checked,
                is_featured: document.getElementById('p-featured').checked,
            };

            const btn = document.querySelector('[onclick="submitProduct()"]');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<div class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>';
            }

            try {
                let res;
                if (window.currentEditId) {
                    res = await window.db.from('products').update(productData).eq('id', window.currentEditId);
                } else {
                    res = await window.db.from('products').insert(productData);
                }

                if (res.error) throw res.error;
                
                showToast(window.currentEditId ? '✓ Product updated' : '✓ Product added', 'success');
                window.closeAddModal();
                window.loadProducts();
            } catch(e) {
                console.error(e);
                showToast('Execution failed: ' + e.message, 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<span class="material-symbols-outlined text-sm">save</span> Save Product';
                }
            }
        };

        // Live Search
        const searchInput = document.getElementById('search-products');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => window.loadProducts(e.target.value.trim()), 300);
            });
        }

        window.loadProducts();
    }

    // ----- USERS (admin_users.html) -----
    else if (currentPath.includes('admin_users.html')) {
        async function loadUsers() {
            try {
                const { data, error } = await window.db.from('users').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                
                const tbody = document.getElementById('users-tbody');
                if(!tbody) return;
                tbody.innerHTML = '';
                
                tbody.innerHTML = (data || []).map(u => {
                    const date = u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Old User';
                    return `
                        <tr>
                            <td class="font-bold text-text-white">${u.name || 'Anonymous'}</td>
                            <td>${u.email}</td>
                            <td class="text-text-muted capitalize">${u.gender || '--'}</td>
                            <td class="text-text-muted capitalize">${u.city || '--'}</td>
                            <td>${date}</td>
                            <td><span class="${u.role === 'admin' ? 'text-accent border-accent/20 border px-2 py-1 rounded' : 'text-text-muted'}">${u.role || 'user'}</span></td>
                            <td><span class="text-success flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-success"></span> Active</span></td>
                            <td class="text-right">
                               <button class="text-accent underline text-[10px] uppercase">View Details</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            } catch (e) {
                console.error("User Load Error:", e);
                showToast("Failed to load users: " + e.message, "error");
            }
        }
        loadUsers();
    }

    // ----- ORDERS (admin_orders.html) -----
    else if (currentPath.includes('admin_orders.html')) {
        async function loadOrders() {
            try {
                const { data, error } = await window.db.from('orders').select('*').order('created_at', { ascending: false });
                
                if (error) throw error;

                // Fetch user names manually
                const userIds = [...new Set((data || []).map(o => o.user_id).filter(Boolean))];
                let usersMap = {};
                if (userIds.length > 0) {
                    const { data: usersData } = await window.db.from('users').select('id, name').in('id', userIds);
                    (usersData || []).forEach(u => usersMap[u.id] = u.name);
                }
                
                const tbody = document.getElementById('orders-tbody');
                if(!tbody) return;
                
                tbody.innerHTML = (data || []).map(o => {
                    const status = (o.status || 'pending').toLowerCase();
                    const isDelivered = status === 'delivered';
                    const amount = Number(o.total_price) || 0;
                    const userName = usersMap[o.user_id] || o.full_name || 'Guest';
                    return `
                        <tr>
                            <td class="font-bold text-text-white">#${o.id ? o.id.split('-')[0] : '???'}</td>
                            <td>${userName}</td>
                            <td>${o.phone || '--'}</td>
                            <td>₹${amount.toLocaleString('en-IN')}</td>
                            <td>
                                <span class="${isDelivered ? 'text-success' : 'text-accent'} font-bold flex items-center gap-2 capitalize">
                                    <span class="w-2 h-2 rounded-full ${isDelivered ? 'bg-success' : 'bg-accent animate-pulse'}"></span>
                                    ${status}
                                </span>
                            </td>
                            <td class="text-right flex items-center justify-end gap-2">
                                <select class="bg-primary border border-accent/20 text-text-white text-xs p-1 rounded outline-none status-select" data-id="${o.id}">
                                    <option value="pending" ${status==='pending'?'selected':''}>Pending</option>
                                    <option value="shipped" ${status==='shipped'?'selected':''}>Shipped</option>
                                    <option value="delivered" ${status==='delivered'?'selected':''}>Delivered</option>
                                </select>
                            </td>
                        </tr>
                    `;
                }).join('');
            } catch (e) {
                console.error("Order Load Error:", e);
                showToast("Failed to load orders: " + e.message, "error");
            }
        }

        document.getElementById('orders-tbody')?.addEventListener('change', async (e) => {
            if (e.target.classList.contains('status-select')) {
                const newStatus = e.target.value;
                const id = e.target.dataset.id;
                
                const { error } = await window.db.from('orders').update({ status: newStatus }).eq('id', id);
                if (error) {
                    showToast("Update failed: " + error.message, "error");
                    return;
                }
                
                showToast('Order status updated to ' + newStatus, 'success');
                loadOrders(); 
            }
        });

        loadOrders();
    }
});
