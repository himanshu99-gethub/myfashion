
document.addEventListener('DOMContentLoaded', async () => {
    const addForm = document.getElementById('add-product-form');
    const adminList = document.getElementById('admin-product-list');
    const countEl = document.getElementById('product-count');

    async function checkAdmin() {
        const { data: { user } } = await window.db.auth.getUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        if (user.email === 'admin@myfashion.com' || user.email === 'admin@fashion.com') {
            return; // allowed
        }
        
        const { data: userData } = await window.db.from('users').select('role').eq('id', user.id).single();
        if (userData?.role !== 'admin') {
            showToast('Access Violation. Elevate privileges.', 'error');
            setTimeout(() => window.location.href = 'index.html', 1500);
        }
    }

    async function loadAdminProducts() {
        showSpinner();
        const { data: products, error } = await window.db
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            showToast('Registry breach', 'error');
            hideSpinner();
            return;
        }

        renderAdminProducts(products);
        countEl.textContent = `${products.length} PIECES REGISTERED`;
        hideSpinner();
    }

    function renderAdminProducts(products) {
        adminList.innerHTML = '';
        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'admin-card p-4 rounded-2xl flex items-center justify-between gap-6 hover:bg-secondary/50 transition-all';
            div.innerHTML = `
                <div class="flex items-center gap-6 flex-grow">
                    <img src="${p.image_url}" class="w-12 h-16 object-cover rounded-lg">
                    <div>
                        <h4 class="text-xs font-bold uppercase tracking-widest text-text-white">${p.title}</h4>
                        <p class="text-[10px] text-text-muted mt-1">${p.category} | ₹${p.price.toLocaleString('en-IN')}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <button class="delete-btn text-error hover:scale-110 transition-transform" data-id="${p.id}">
                        <span class="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            `;
            adminList.appendChild(div);
        });
    }

    addForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        showSpinner();

        const product = {
            title: document.getElementById('title').value,
            price: parseFloat(document.getElementById('price').value),
            category: document.getElementById('category').value,
            image_url: document.getElementById('image_url').value,
            description: document.getElementById('description').value,
            is_trending: document.getElementById('is_trending').checked
        };

        const { error } = await window.db.from('products').insert(product);

        if (error) {
            showToast(error.message, 'error');
        } else {
            showToast('Curation Successful', 'success');
            addForm.reset();
            loadAdminProducts();
        }
        hideSpinner();
    });

    adminList?.addEventListener('click', async (e) => {
        const delBtn = e.target.closest('.delete-btn');
        if (delBtn) {
            if (confirm('Authorize deletion of this piece?')) {
                showSpinner();
                const { error } = await window.db.from('products').delete().eq('id', delBtn.dataset.id);
                if (error) showToast(error.message, 'error');
                else loadAdminProducts();
                hideSpinner();
            }
        }
    });

    await checkAdmin();
    loadAdminProducts();
});
