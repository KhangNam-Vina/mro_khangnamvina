// ========================================================
// FILE: assets/js/admin-products.js
// QUẢN LÝ SẢN PHẨM - BẢN CẬP NHẬT (FIX LỖI PGRST116 & SCOPE)
// ========================================================

const state = {
    products: [],
    globalBrands: [],
    editingId: null,
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    searchQuery: ''
};

const DOM = {
    listView: document.getElementById('productListView'),
    formView: document.getElementById('productFormView'),
    form: document.getElementById('productForm'),
    formTitle: document.getElementById('formTitle'),
    inSku: document.getElementById('sku'),
    inName: document.getElementById('name'),
    selCategory: document.getElementById('category_id'),
    selSubCategory: document.getElementById('sub_category_id'),
    selFamily: document.getElementById('family_id'),
    selIndustry: document.getElementById('industrySelect'),
    inBrand: document.getElementById('brand_input'),
    inPrice: document.getElementById('price'),
    inDiscount: document.getElementById('discount_price'),
    selUnit: document.getElementById('unit'),
    inImage: document.getElementById('image_url'),
    inExtraImages: document.getElementById('inExtraImages'),
    inDatasheet: document.getElementById('inDatasheet'),
    inDesc: document.getElementById('description'),
    btnSave: document.getElementById('btnSubmit'),
    btnSearch: document.getElementById('btnSearch'),
    searchInput: document.getElementById('searchSku'),
    tbody: document.getElementById('productTableBody'),
    pagination: document.getElementById('paginationContainer'),
    toastContainer: document.getElementById('toastContainer')
};

const utils = {
    escapeHTML: (str) => {
        if (!str) return '';
        return str.toString().replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    },
    formatCurrency: (val) => {
        if (!val) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
    },
    showToast: (message, type = 'success') => {
        if (!DOM.toastContainer) return;
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-orange-500' : 'bg-red-500';
        const toast = document.createElement('div');
        toast.className = `${bgColor} text-white px-4 py-2 rounded shadow-lg transform transition-all duration-300 translate-y-0 opacity-100 mb-2 font-bold text-sm`;
        toast.innerHTML = type === 'success' ? `✔ ${message}` : `⚠ ${message}`;
        DOM.toastContainer.appendChild(toast);
        setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-2'); setTimeout(() => toast.remove(), 300); }, 3000);
    },
    toggleBtn: (btn, isLoading, text) => {
        if (!btn) return;
        btn.disabled = isLoading;
        btn.innerHTML = isLoading ? `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> ${text}` : text;
    },
    resetForm: () => {
        state.editingId = null;
        DOM.form.reset();
        DOM.inSku.readOnly = false; 
        DOM.inSku.classList.remove('bg-gray-200', 'cursor-not-allowed');
        DOM.selSubCategory.innerHTML = '<option value="">-- Chọn danh mục gốc trước --</option>';
        DOM.selFamily.innerHTML = '<option value="">-- Chọn danh mục con trước --</option>';
        DOM.formTitle.innerText = "Thêm Sản Phẩm Mới";
        DOM.btnSave.innerHTML = "Nhập Kho Sản Phẩm";
        DOM.formView.classList.add('hidden');
        DOM.listView.classList.remove('hidden');
    }
};

// ==========================================
// KHỞI TẠO
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialDropdowns();
    await loadIndustryDropdown();
    
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                state.searchQuery = e.target.value.trim();
                state.currentPage = 1;
                window.fetchProducts();
            }
        });
    }

    if (DOM.btnSearch) {
        DOM.btnSearch.addEventListener('click', () => {
            state.searchQuery = DOM.searchInput.value.trim();
            state.currentPage = 1;
            window.fetchProducts();
        });
    }

    window.fetchProducts();
});

// ==========================================
// ĐẨY HÀM RA WINDOW ĐỂ HTML GỌI ĐƯỢC
// ==========================================
// Thay thế toàn bộ hàm window.fetchProducts cũ bằng cục này:
window.fetchProducts = async function() {
    if (DOM.tbody) DOM.tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10"><div class="w-8 h-8 border-4 border-kn-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div><span class="text-gray-500 font-bold">Đang tải dữ liệu...</span></td></tr>`;

    try {
        // GỌI SERVICE CHUẨN MIDDLE FRONTEND
        const { data, count, error } = await ProductService.getList({
            page: state.currentPage,
            limit: state.itemsPerPage,
            search: state.searchQuery
        });

        if (error) throw error;

        state.products = data || [];
        state.totalItems = count || 0;

        renderProducts();
        renderPagination();

    } catch (error) {
        DOM.tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-red-500 font-bold">Lỗi: ${error.message}</td></tr>`;
        utils.showToast(error.message, 'error');
    }
};

// Thay thế hàm saveProduct cũ bằng bản gọi Service này:
window.saveProduct = async function() {
    const sku = DOM.inSku.value.trim().toUpperCase();
    const name = DOM.inName.value.trim();
    const category_id = DOM.selCategory.value;
    const sub_category_id = DOM.selSubCategory.value;
    const family_id = DOM.selFamily.value;
    const brandInputValue = DOM.inBrand.value.trim();
    const price = DOM.inPrice.value.trim();
    const discountPrice = DOM.inDiscount.value.trim();
    const unit = DOM.selUnit.value;
    const image_url = DOM.inImage.value.trim();
    
    if (!sku || sku.length < 3) return utils.showToast("Mã SKU quá ngắn!", "warning");
    if (!name || name.length < 3) return utils.showToast("Tên sản phẩm phải từ 3 ký tự!", "warning");
    if (!category_id || !sub_category_id || !family_id) return utils.showToast("Vui lòng chọn đầy đủ phân loại!", "warning");

    utils.toggleBtn(DOM.btnSave, true, "Đang xử lý...");

    try {
        // GỌI SERVICE: Kiểm tra trùng SKU
        if (!state.editingId) {
            const { data: existSku, error: errSku } = await ProductService.checkSkuExist(sku); 
            if (errSku) throw errSku;
            
            if (existSku) {
                utils.showToast(`Mã SKU "${sku}" đã tồn tại!`, "error");
                return; 
            }
        }

        // Xử lý Thương hiệu (Vẫn giữ logic Supabase ở đây tạm, hoặc ông có thể tách ra BrandService sau)
        let final_brand_id = null;
        if (brandInputValue) {
            const foundBrand = state.globalBrands.find(b => b.name.toLowerCase() === brandInputValue.toLowerCase());
            if (foundBrand) {
                final_brand_id = foundBrand.id; 
            } else {
                const { data: newBrand, error: brandErr } = await supabaseClient.from('brands').insert([{ name: brandInputValue }]).select('id').single();
                if (brandErr) throw brandErr;
                final_brand_id = newBrand.id;
                state.globalBrands.push({ id: final_brand_id, name: brandInputValue });
            }
        }

        let imagesArray = [];
        if (DOM.inExtraImages.value.trim()) {
            imagesArray = DOM.inExtraImages.value.trim().split(',').map(link => link.trim()).filter(link => link !== '');
        }

        const payload = { 
            sku: sku,
            name: name, 
            category_id: category_id, 
            sub_category_id: sub_category_id,
            family_id: family_id,
            industry_id: DOM.selIndustry.value ? parseInt(DOM.selIndustry.value) : null,
            brand_id: final_brand_id, 
            price: price ? parseInt(price) : null,
            discount_price: discountPrice ? parseInt(discountPrice) : null,
            unit: unit, 
            image_url: image_url || null, 
            description: DOM.inDesc.value.trim(),
            datasheet_url: DOM.inDatasheet.value.trim() || null,
            images: imagesArray.length > 0 ? imagesArray : null
        };

        // GỌI SERVICE: Thêm mới hoặc Cập nhật
        if (state.editingId) {
            const { error } = await ProductService.update(state.editingId, payload);
            if (error) throw error;
            utils.showToast("Cập nhật thành công!", "success");
        } else {
            const { error } = await ProductService.create(payload);
            if (error) throw error;
            utils.showToast("Đã nhập kho sản phẩm mới!", "success");
        }

        utils.resetForm();
        window.fetchProducts();

    } catch (error) {
        utils.showToast("Lỗi hệ thống: " + error.message, "error");
    } finally {
        utils.toggleBtn(DOM.btnSave, false, state.editingId ? "Cập Nhật Sản Phẩm" : "Nhập Kho Sản Phẩm");
    }
};

window.editProduct = async function(id) {
    const item = state.products.find(p => p.id == id);
    if (!item) return;

    state.editingId = item.id;
    DOM.inSku.value = item.sku;
    DOM.inSku.readOnly = true; 
    DOM.inSku.classList.add('bg-gray-200', 'cursor-not-allowed');
    DOM.inName.value = item.name;
    DOM.inPrice.value = item.price || '';
    DOM.inDiscount.value = item.discount_price || '';
    DOM.selUnit.value = item.unit || 'Cái';
    DOM.inImage.value = item.image_url || '';
    DOM.inDesc.value = item.description || '';
    DOM.inDatasheet.value = item.datasheet_url || '';
    
    if (item.industry_id) DOM.selIndustry.value = item.industry_id;

    if (item.category_id) {
        DOM.selCategory.value = item.category_id;
        await loadSubCategories(); 
        if (item.sub_category_id) {
            DOM.selSubCategory.value = item.sub_category_id;
            await loadFamilies(); 
            if (item.family_id) DOM.selFamily.value = item.family_id;
        }
    }

    DOM.inBrand.value = '';
    if (item.brand_id) {
        const foundBrand = state.globalBrands.find(b => b.id === item.brand_id);
        if (foundBrand) DOM.inBrand.value = foundBrand.name;
    }

    DOM.inExtraImages.value = '';
    if (item.images) {
        let arr = Array.isArray(item.images) ? item.images : (typeof item.images === 'string' ? item.images.split(',') : []);
        DOM.inExtraImages.value = arr.join(', ');
    }

    DOM.formTitle.innerText = `Sửa Sản Phẩm: ${item.sku}`;
    DOM.btnSave.innerHTML = "Cập Nhật Sản Phẩm";
    DOM.listView.classList.add('hidden');
    DOM.formView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Thay thế hàm deleteProduct cũ:
window.deleteProduct = async function(id) {
    if (!confirm("Xóa vĩnh viễn sản phẩm này?")) return;
    try {
        // GỌI SERVICE XÓA
        const { error } = await ProductService.delete(id);
        if (error) throw error;
        
        utils.showToast("Đã xóa sản phẩm!", "success");
        if (state.products.length === 1 && state.currentPage > 1) state.currentPage--;
        window.fetchProducts();
    } catch (error) {
        utils.showToast("Lỗi xóa: " + error.message, "error");
    }
};

window.showAddForm = () => {
    utils.resetForm();
    DOM.listView.classList.add('hidden');
    DOM.formView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.cancelForm = () => utils.resetForm();

// Hàm tải Dropdown (Giữ nguyên)
async function loadInitialDropdowns() {
    try {
        const { data: cats } = await supabaseClient.from('categories').select('id, name').order('id');
        if (cats) DOM.selCategory.innerHTML = '<option value="">-- Chọn danh mục gốc --</option>' + cats.map(c => `<option value="${c.id}">${utils.escapeHTML(c.name)}</option>`).join('');
        const { data: brands } = await supabaseClient.from('brands').select('id, name').order('name');
        if (brands) {
            state.globalBrands = brands;
            document.getElementById('brand_list').innerHTML = brands.map(b => `<option value="${utils.escapeHTML(b.name)}">`).join('');
        }
    } catch (err) {}
}

async function loadIndustryDropdown() {
    try {
        const { data } = await supabaseClient.from('industries').select('id, name').order('name');
        if (data) data.forEach(item => DOM.selIndustry.innerHTML += `<option value="${item.id}">${utils.escapeHTML(item.name)}</option>`);
    } catch (err) {}
}

window.loadSubCategories = async function() {
    const catId = DOM.selCategory.value;
    DOM.selFamily.innerHTML = '<option value="">-- Chọn danh mục con trước --</option>';
    if (!catId) {
        DOM.selSubCategory.innerHTML = '<option value="">-- Chọn danh mục gốc trước --</option>';
        return;
    }
    const { data } = await supabaseClient.from('sub_categories').select('id, name').eq('category_id', catId).order('name');
    DOM.selSubCategory.innerHTML = data && data.length > 0 ? '<option value="">-- Chọn danh mục con --</option>' + data.map(s => `<option value="${s.id}">${utils.escapeHTML(s.name)}</option>`).join('') : '<option value="">(Trống)</option>';
};

window.loadFamilies = async function() {
    const subCatId = DOM.selSubCategory.value;
    if (!subCatId) {
        DOM.selFamily.innerHTML = '<option value="">-- Chọn danh mục con trước --</option>';
        return;
    }
    const { data } = await supabaseClient.from('families').select('id, name').eq('sub_category_id', subCatId).order('name');
    DOM.selFamily.innerHTML = data && data.length > 0 ? '<option value="">-- Chọn Dòng SP (Family) --</option>' + data.map(f => `<option value="${f.id}">${utils.escapeHTML(f.name)}</option>`).join('') : '<option value="">(Trống)</option>';
};

// ==========================================
// RENDER UI
// ==========================================
function renderProducts() {
    if (!DOM.tbody) return;
    if (state.totalItems === 0) {
        DOM.tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-500 font-bold">Không tìm thấy sản phẩm nào!</td></tr>`;
        return;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;
    
    // FIX: Dùng chuỗi SVG làm ảnh mặc định để không phụ thuộc vào CDN bên ngoài
    const fallbackImage = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTBweCIgZmlsbD0iI2FhYSIgZHk9Ii4zZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vIEltZzwvdGV4dD48L3N2Zz4=";

    DOM.tbody.innerHTML = state.products.map((item, index) => {
        const safeSku = utils.escapeHTML(item.sku);
        const safeName = utils.escapeHTML(item.name);
        const catName = item.categories ? utils.escapeHTML(item.categories.name) : '-';
        const brandName = item.brands ? utils.escapeHTML(item.brands.name) : 'OEM';
        
        let priceHtml = `<span class="text-gray-800 font-bold">${utils.formatCurrency(item.price)}</span>`;
        if (item.discount_price) {
            priceHtml = `
                <span class="text-gray-400 line-through text-xs block">${utils.formatCurrency(item.price)}</span>
                <span class="text-red-600 font-bold">${utils.formatCurrency(item.discount_price)}</span>
            `;
        }

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                <td class="p-3 text-center text-gray-500 font-medium">${from + index + 1}</td>
                <td class="p-3"><img src="${utils.escapeHTML(item.image_url) || fallbackImage}" class="w-12 h-12 object-cover rounded border" onerror="this.src='${fallbackImage}'"></td>
                <td class="p-3">
                    <p class="font-bold text-kn-blue uppercase text-xs">${safeSku}</p>
                    <p class="font-bold text-gray-800 line-clamp-2">${safeName}</p>
                </td>
                <td class="p-3 text-sm text-gray-600">${catName}<br><span class="text-xs bg-gray-200 px-1 rounded">${brandName}</span></td>
                <td class="p-3 text-right">${priceHtml}</td>
                <td class="p-3 text-center text-sm text-gray-600">${utils.escapeHTML(item.unit)}</td>
                <td class="p-3 text-right space-x-1">
                    <button onclick="window.editProduct(${item.id})" class="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded font-bold hover:bg-blue-200">Sửa</button>
                    <button onclick="window.deleteProduct(${item.id})" class="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded font-bold hover:bg-red-200">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPagination() {
    if (!DOM.pagination) return;
    DOM.pagination.innerHTML = '';
    const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
    if (totalPages <= 1) return;

    let html = '';
    if (state.currentPage > 1) html += `<button onclick="state.currentPage--; window.fetchProducts()" class="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50">&laquo;</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === state.currentPage) html += `<button class="px-3 py-1 bg-kn-orange text-white border border-kn-orange rounded text-sm font-bold">${i}</button>`;
        else html += `<button onclick="state.currentPage = ${i}; window.fetchProducts()" class="px-3 py-1 bg-white border rounded text-sm text-kn-blue hover:bg-blue-50">${i}</button>`;
    }
    if (state.currentPage < totalPages) html += `<button onclick="state.currentPage++; window.fetchProducts()" class="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50">&raquo;</button>`;
    
    DOM.pagination.innerHTML = html;
}