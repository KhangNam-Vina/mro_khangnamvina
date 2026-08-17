// ========================================================
// FILE: assets/js/admin/admin-products.js
// QUẢN LÝ SẢN PHẨM - TÍCH HỢP TỰ ĐỘNG TẠO THƯƠNG HIỆU MỚI
// ========================================================

const state = {
    products: [],
    categories: [],
    subCategories: [],
    families: [],
    industries: [],
    brands: [],
    editingId: null,
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    searchQuery: ''
};

// ========================================================
// 1. KHỞI TẠO
// ========================================================
document.addEventListener("DOMContentLoaded", async () => {
    if (typeof CKEDITOR !== 'undefined' && document.getElementById('description')) {
        CKEDITOR.replace('description', { height: 250 });
    }

    await loadAllDropdowns();
    await fetchProducts();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                state.searchQuery = e.target.value.trim();
                state.currentPage = 1;
                fetchProducts();
            }
        });
    }

    setupCascadingDropdowns();
});

// ========================================================
// 2. TẢI DỮ LIỆU DROPDOWN & KẾT NỐI LIÊN HOÀN
// ========================================================
async function loadAllDropdowns() {
    try {
        const [catRes, subCatRes, famRes, indRes, brandRes] = await Promise.all([
            window.supabaseClient.from('categories').select('id, name'),
            window.supabaseClient.from('sub_categories').select('id, name, category_id'),
            window.supabaseClient.from('families').select('id, name, sub_category_id'),
            window.supabaseClient.from('industries').select('id, name'),
            window.supabaseClient.from('brands').select('id, name')
        ]);

        state.categories = catRes.data || [];
        state.subCategories = subCatRes.data || [];
        state.families = famRes.data || [];
        state.industries = indRes.data || [];
        state.brands = brandRes.data || [];

        populateSelect('category_id', state.categories, '-- Chọn danh mục gốc --');
        populateSelect('industrySelect', state.industries, '-- Chọn ngành hàng --');
        
        refreshBrandDatalist();

    } catch (error) {
        console.error("Lỗi tải Dropdowns:", error);
    }
}

function refreshBrandDatalist() {
    const brandList = document.getElementById('brandList');
    if (brandList) {
        brandList.innerHTML = state.brands.map(b => `<option value="${b.name}"></option>`).join('');
    }
}

function populateSelect(elementId, data, placeholder) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = `<option value="">${placeholder}</option>` + 
        data.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
}

function setupCascadingDropdowns() {
    const catSelect = document.getElementById('category_id');
    const subCatSelect = document.getElementById('sub_category_id');
    const famSelect = document.getElementById('family_id');

    if (catSelect) {
        catSelect.addEventListener('change', (e) => {
            const catId = e.target.value;
            const filteredSubCats = catId ? state.subCategories.filter(s => s.category_id == catId) : state.subCategories;
            populateSelect('sub_category_id', filteredSubCats, '-- Chọn danh mục con --');
            famSelect.innerHTML = '<option value="">-- Chọn dòng sản phẩm --</option>'; 
        });
    }

    if (subCatSelect) {
        subCatSelect.addEventListener('change', (e) => {
            const subId = e.target.value;
            const filteredFamilies = subId ? state.families.filter(f => f.sub_category_id == subId) : state.families;
            populateSelect('family_id', filteredFamilies, '-- Chọn dòng sản phẩm --');
        });
    }
}

// ========================================================
// 3. TẢI VÀ RENDER DANH SÁCH SẢN PHẨM
// ========================================================
async function fetchProducts() {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8"><div class="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>`;

    try {
        let query = window.supabaseClient
            .from('products')
            .select('*, brands(name)', { count: 'exact' });
            
        if (state.searchQuery) {
            query = query.or(`sku.ilike.%${state.searchQuery}%,name.ilike.%${state.searchQuery}%`);
        }

        const from = (state.currentPage - 1) * state.itemsPerPage;
        const to = from + state.itemsPerPage - 1;

        const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

        if (error) throw error;

        state.products = data || [];
        state.totalItems = count || 0;

        renderProducts();
        renderPagination();

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-red-500">Lỗi: ${error.message}</td></tr>`;
    }
}

function renderProducts() {
    const tbody = document.getElementById('productTableBody');
    if (state.totalItems === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-500 font-medium">Không tìm thấy sản phẩm.</td></tr>`;
        return;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;
    
    tbody.innerHTML = state.products.map((item, index) => {
        const brandName = item.brands?.name || 'OEM';
        const imgObj = item.image_url 
            ? `<img src="${item.image_url}" class="w-10 h-10 object-contain mx-auto border rounded bg-white">`
            : `<div class="w-10 h-10 bg-gray-100 border rounded flex items-center justify-center text-[10px] text-gray-400 mx-auto">No Img</div>`;
            
        const priceFmt = item.price ? new Intl.NumberFormat('vi-VN').format(item.price) + ' đ' : 'Liên hệ';

        return `
            <tr class="border-b border-gray-100 hover:bg-blue-50/30 transition">
                <td class="p-4 text-center font-bold text-gray-400 text-xs">${from + index + 1}</td>
                <td class="p-4 text-center">${imgObj}</td>
                <td class="p-4 font-mono font-bold text-kn-blue text-xs">${escapeHTML(item.sku)}</td>
                <td class="p-4 font-bold text-gray-800 text-sm">${escapeHTML(item.name)}</td>
                <td class="p-4 text-gray-600 text-xs font-bold uppercase">${escapeHTML(brandName)}</td>
                <td class="p-4 text-gray-800 font-bold text-sm">${priceFmt}</td>
                <td class="p-4 text-center space-x-1 whitespace-nowrap">
                    <button onclick="editProduct('${item.id}')" class="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition font-bold text-xs uppercase">Sửa</button>
                    <button onclick="deleteProduct('${item.id}')" class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition font-bold text-xs uppercase">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPagination() {
    const pagination = document.getElementById('paginationContainer');
    if (!pagination) return;
    pagination.innerHTML = '';
    const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
    if (totalPages <= 1) return;

    let html = `<button onclick="state.currentPage--; fetchProducts()" ${state.currentPage === 1 ? 'disabled class="px-3 py-1.5 rounded text-gray-400"' : 'class="px-3 py-1.5 rounded bg-white border shadow-sm font-bold"'}>&laquo; Prev</button><div class="flex space-x-1">`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button onclick="state.currentPage = ${i}; fetchProducts()" class="px-3 py-1.5 rounded font-bold shadow-sm ${i === state.currentPage ? 'bg-kn-blue text-white' : 'bg-white border text-gray-600'}">${i}</button>`;
    }
    html += `</div><button onclick="state.currentPage++; fetchProducts()" ${state.currentPage === totalPages ? 'disabled class="px-3 py-1.5 rounded text-gray-400"' : 'class="px-3 py-1.5 rounded bg-white border shadow-sm font-bold"'}>Next &raquo;</button>`;
    pagination.innerHTML = html;
}

// ========================================================
// 4. THÊM / SỬA SẢN PHẨM (AUTO CREATE BRAND)
// ========================================================
window.showAddForm = function() {
    state.editingId = null;
    document.getElementById('productForm').reset();
    if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances.description) {
        CKEDITOR.instances.description.setData('');
    }
    document.getElementById('formTitle').innerText = "Nhập Sản Phẩm Mới";
    document.getElementById('btnSubmit').innerText = "Nhập Kho Sản Phẩm";
    document.getElementById('productListView').classList.add('hidden');
    document.getElementById('productFormView').classList.remove('hidden');
}

window.cancelForm = function() {
    document.getElementById('productListView').classList.remove('hidden');
    document.getElementById('productFormView').classList.add('hidden');
}

window.saveProduct = async function() {
    const btn = document.getElementById('btnSubmit');
    btn.disabled = true;
    btn.innerHTML = "Đang lưu...";

    try {
        // 1. LẤY CKEDITOR 
        let descValue = '';
        if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances.description) {
            descValue = CKEDITOR.instances.description.getData();
        } else {
            descValue = document.getElementById('description').value;
        }

        // 2. XỬ LÝ ID THƯƠNG HIỆU (TỰ ĐỘNG TẠO MỚI NẾU CHƯA CÓ)
        const brandInputText = document.getElementById('brand_input').value.trim();
        let finalBrandId = null;

        if (brandInputText) {
            const foundBrand = state.brands.find(b => b.name.toLowerCase() === brandInputText.toLowerCase());
            
            if (foundBrand) {
                // Đã có sẵn -> Lấy ID
                finalBrandId = foundBrand.id;
            } else {
                // Chưa có -> Bơm lên DB tạo mới ngay lập tức
                btn.innerHTML = "Đang tạo hãng mới...";
                const { data: newBrand, error: brandErr } = await window.supabaseClient
                    .from('brands')
                    .insert([{ name: brandInputText }])
                    .select('id, name')
                    .single();

                if (brandErr) {
                    throw new Error("Lỗi khi tạo Thương hiệu mới: " + brandErr.message);
                }

                // Cập nhật ID mới và đẩy vào mảng state để xài luôn không cần F5
                finalBrandId = newBrand.id;
                state.brands.push(newBrand);
                refreshBrandDatalist();
            }
        }

        // 3. GOM DATA
        btn.innerHTML = "Đang lưu sản phẩm...";
        const payload = {
            sku: document.getElementById('sku').value.trim(),
            name: document.getElementById('name').value.trim(),
            
            category_id: document.getElementById('category_id').value || null,
            sub_category_id: document.getElementById('sub_category_id').value || null,
            family_id: document.getElementById('family_id').value || null,
            industry_id: document.getElementById('industrySelect').value || null,
            brand_id: finalBrandId,
            
            origin: document.getElementById('origin').value.trim() || null,
            price: document.getElementById('price').value || null,
            discount_price: document.getElementById('discount_price').value || null,
            unit: document.getElementById('unit').value || 'Cái',
            stock_quantity: document.getElementById('stock_quantity').value || 0,
            min_order_quantity: document.getElementById('min_order_quantity').value || 1,
            badge: document.getElementById('badge').value || null,
            
            image_url: document.getElementById('image_url').value.trim() || null,
            images: document.getElementById('inExtraImages').value.trim() || null,
            datasheet_url: document.getElementById('inDatasheet').value.trim() || null,
            short_description: document.getElementById('short_description').value.trim() || null,
            specifications: document.getElementById('specifications').value.trim() || null,
            description: descValue || null
        };

        if (!payload.sku || !payload.name) {
            throw new Error("Mã SKU và Tên sản phẩm là bắt buộc!");
        }

        if (state.editingId) {
            const { error } = await window.supabaseClient.from('products').update(payload).eq('id', state.editingId);
            if (error) throw error;
            showToast("Đã cập nhật sản phẩm!", "success");
        } else {
            const { error } = await window.supabaseClient.from('products').insert([payload]);
            if (error) throw error;
            showToast("Thêm sản phẩm thành công!", "success");
        }

        cancelForm();
        fetchProducts();

    } catch (error) {
        console.error(error);
        alert("Lỗi khi lưu: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = state.editingId ? "Cập Nhật Sản Phẩm" : "Nhập Kho Sản Phẩm";
    }
}

// ========================================================
// 5. EDIT & DELETE
// ========================================================
window.editProduct = function(id) {
    const item = state.products.find(p => p.id === id);
    if (!item) return;

    state.editingId = item.id;
    document.getElementById('formTitle').innerText = "Sửa Sản Phẩm: " + item.sku;
    
    document.getElementById('sku').value = item.sku || '';
    document.getElementById('name').value = item.name || '';
    document.getElementById('origin').value = item.origin || '';
    document.getElementById('price').value = item.price || '';
    document.getElementById('discount_price').value = item.discount_price || '';
    document.getElementById('unit').value = item.unit || 'Cái';
    document.getElementById('stock_quantity').value = item.stock_quantity || 0;
    document.getElementById('min_order_quantity').value = item.min_order_quantity || 1;
    document.getElementById('badge').value = item.badge || '';
    
    document.getElementById('image_url').value = item.image_url || '';
    document.getElementById('inExtraImages').value = item.images || '';
    document.getElementById('inDatasheet').value = item.datasheet_url || '';
    document.getElementById('short_description').value = item.short_description || '';
    document.getElementById('specifications').value = item.specifications || '';
    
    if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances.description) {
        CKEDITOR.instances.description.setData(item.description || '');
    } else {
        document.getElementById('description').value = item.description || '';
    }

    document.getElementById('category_id').value = item.category_id || '';
    document.getElementById('category_id').dispatchEvent(new Event('change'));
    
    setTimeout(() => {
        document.getElementById('sub_category_id').value = item.sub_category_id || '';
        document.getElementById('sub_category_id').dispatchEvent(new Event('change'));
        
        setTimeout(() => {
            document.getElementById('family_id').value = item.family_id || '';
        }, 50);
    }, 50);

    document.getElementById('industrySelect').value = item.industry_id || '';
    
    if (item.brand_id) {
        const foundBrand = state.brands.find(b => b.id == item.brand_id);
        document.getElementById('brand_input').value = foundBrand ? foundBrand.name : '';
    } else {
        document.getElementById('brand_input').value = '';
    }

    document.getElementById('btnSubmit').innerText = "Cập Nhật Sản Phẩm";
    document.getElementById('productListView').classList.add('hidden');
    document.getElementById('productFormView').classList.remove('hidden');
}

window.deleteProduct = async function(id) {
    if (!confirm("Xóa vĩnh viễn sản phẩm này?")) return;
    try {
        const { error } = await window.supabaseClient.from('products').delete().eq('id', id);
        if (error) throw error;
        showToast("Xóa thành công!", "success");
        fetchProducts();
    } catch (error) {
        alert("Lỗi xóa: " + error.message);
    }
}

// Utils
function escapeHTML(str) { 
    return !str ? '' : String(str).replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag)); 
}

function showToast(msg, type = "success") {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `${type === 'success' ? 'bg-gray-900' : 'bg-red-600'} text-white px-4 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 transition-all duration-300 transform mb-2`;
    toast.innerHTML = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('opacity-0'); setTimeout(() => toast.remove(), 300); }, 3000);
}