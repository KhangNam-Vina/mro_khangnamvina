// ========================================================
// FILE: assets/js/admin-products.js
// QUẢN LÝ SẢN PHẨM - ĐÃ TÍCH HỢP CKEDITOR & MÔ TẢ NGẮN (SEO)
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
    inOrigin: document.getElementById('origin'),
    
    inPrice: document.getElementById('price'),
    inDiscount: document.getElementById('discount_price'),
    selUnit: document.getElementById('unit'),
    inStock: document.getElementById('stock_quantity'),
    inMoq: document.getElementById('min_order_quantity'),
    inIsNew: document.getElementById('is_new'),
    inBadge: document.getElementById('badge'),
    
    inImage: document.getElementById('image_url'),
    inExtraImages: document.getElementById('inExtraImages'),
    inDatasheet: document.getElementById('inDatasheet'),
    inShortDesc: document.getElementById('short_description'), 
    inSpecs: document.getElementById('specifications'),
    inDesc: document.getElementById('description'),
    inBrand: document.getElementById('brand_input'),
    dlBrandList: document.getElementById('brandList'),
    
    btnSave: document.getElementById('btnSubmit'),
    btnSearch: document.getElementById('btnSearch'),
    searchInput: document.getElementById('searchInput'),
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
        btn.innerHTML = isLoading ? `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Đang xử lý...` : text;
    },
    resetForm: () => {
        state.editingId = null;
        DOM.form.reset();
        
        // Reset nội dung của CKEditor và ô mô tả ngắn
        if (typeof CKEDITOR !== 'undefined') {
            if (CKEDITOR.instances.description) CKEDITOR.instances.description.setData('');
            if (CKEDITOR.instances.specifications) CKEDITOR.instances.specifications.setData('');
        }
        if (DOM.inShortDesc) DOM.inShortDesc.value = '';

        DOM.inSku.readOnly = false; 
        DOM.inSku.classList.remove('bg-gray-100', 'cursor-not-allowed', 'text-gray-500');
        DOM.selSubCategory.innerHTML = '<option value="">-- Chọn danh mục gốc trước --</option>';
        DOM.selFamily.innerHTML = '<option value="">-- Chọn danh mục con trước --</option>';
        DOM.formTitle.innerText = "Thêm Sản Phẩm Mới";
        DOM.btnSave.innerHTML = "Nhập Kho Sản Phẩm";
        DOM.formView.classList.add('hidden');
        DOM.listView.classList.remove('hidden');
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // KHỞI TẠO CKEDITOR CHO 2 Ô TEXTAREA MÔ TẢ VÀ THÔNG SỐ KỸ THUẬT
    if (typeof CKEDITOR !== 'undefined') {
        CKEDITOR.replace('specifications');
        CKEDITOR.replace('description');
    }

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

window.fetchProducts = async function() {
    if (DOM.tbody) DOM.tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10"><div class="w-8 h-8 border-4 border-kn-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div><span class="text-gray-500 font-bold">Đang tải dữ liệu...</span></td></tr>`;

    try {
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
    if (price && parseInt(price) < 0) return utils.showToast("Giá không được nhỏ hơn 0!", "warning");
    if (discountPrice && parseInt(discountPrice) < 0) return utils.showToast("Giá khuyến mãi không được nhỏ hơn 0!", "warning");
    if (DOM.inStock.value && parseInt(DOM.inStock.value) < 0) return utils.showToast("Tồn kho không được nhỏ hơn 0!", "warning");
    if (DOM.inMoq.value && parseInt(DOM.inMoq.value) < 1) return utils.showToast("Mua tối thiểu (MOQ) phải từ 1 trở lên!", "warning");

    utils.toggleBtn(DOM.btnSave, true, "Đang xử lý...");

    try {
        if (!state.editingId) {
            const { data: existSku, error: errSku } = await ProductService.checkSkuExist(sku); 
            if (errSku) throw errSku;
            if (existSku) {
                utils.showToast(`Mã SKU "${sku}" đã tồn tại!`, "error");
                return; 
            }
        }

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
            imagesArray = DOM.inExtraImages.value.trim().split('\n')
                .map(link => link.replace(/['"\[\]\{\}\n\r\s]/g, '').trim()) 
                .filter(link => link !== '');
        }

        // Lấy dữ liệu từ CKEditor an toàn
        let specsData = DOM.inSpecs.value.trim();
        let descData = DOM.inDesc.value.trim();
        if (typeof CKEDITOR !== 'undefined') {
            if (CKEDITOR.instances.specifications) specsData = CKEDITOR.instances.specifications.getData();
            if (CKEDITOR.instances.description) descData = CKEDITOR.instances.description.getData();
        }

        const payload = { 
            sku: sku,
            name: name, 
            category_id: category_id, 
            sub_category_id: sub_category_id,
            family_id: family_id,
            industry_id: DOM.selIndustry.value ? parseInt(DOM.selIndustry.value) : null,
            brand_id: final_brand_id, 
            origin: DOM.inOrigin.value.trim() || null,
            price: price ? parseInt(price) : null,
            discount_price: discountPrice ? parseInt(discountPrice) : null,
            unit: unit, 
            stock_quantity: DOM.inStock.value ? parseInt(DOM.inStock.value) : 0,
            min_order_quantity: DOM.inMoq.value ? parseInt(DOM.inMoq.value) : 1,
            badge: DOM.inBadge.value.trim() || null,
            image_url: image_url || null, 
            images: imagesArray.length > 0 ? imagesArray : null,
            datasheet_url: DOM.inDatasheet.value.trim() || null,
            
            // CẬP NHẬT TRƯỜNG DỮ LIỆU TỪ CKEDITOR VÀ Ô MÔ TẢ NGẮN
            short_description: DOM.inShortDesc.value.trim() || null,
            specifications: specsData || null,
            description: descData || null
        };

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
    if(DOM.inSku) {
        DOM.inSku.value = item.sku;
        DOM.inSku.readOnly = true; 
        DOM.inSku.classList.add('bg-gray-100', 'cursor-not-allowed', 'text-gray-500');
    }
    
    if(DOM.inName) DOM.inName.value = item.name || '';
    if(DOM.inOrigin) DOM.inOrigin.value = item.origin || '';
    if(DOM.inPrice) DOM.inPrice.value = item.price || '';
    if(DOM.inDiscount) DOM.inDiscount.value = item.discount_price || '';
    if(DOM.selUnit) DOM.selUnit.value = item.unit || 'Cái';
    if(DOM.inStock) DOM.inStock.value = item.stock_quantity ?? 0;
    if(DOM.inMoq) DOM.inMoq.value = item.min_order_quantity ?? 1;
    if(DOM.inBadge) DOM.inBadge.value = item.badge || '';
    
    if(DOM.inImage) DOM.inImage.value = item.image_url || '';
    if(DOM.inDatasheet) DOM.inDatasheet.value = item.datasheet_url || '';
    if(DOM.inShortDesc) DOM.inShortDesc.value = item.short_description || '';

    // Bơm dữ liệu vào CKEditor
    if (typeof CKEDITOR !== 'undefined') {
        if (CKEDITOR.instances.description) CKEDITOR.instances.description.setData(item.description || '');
        if (CKEDITOR.instances.specifications) CKEDITOR.instances.specifications.setData(item.specifications || '');
    } else {
        if(DOM.inDesc) DOM.inDesc.value = item.description || '';
        if(DOM.inSpecs) DOM.inSpecs.value = item.specifications || '';
    }
    
    if(DOM.inExtraImages) {
        DOM.inExtraImages.value = '';
        if (item.images) {
            let rawExtraImgs = [];
            if (Array.isArray(item.images)) {
                rawExtraImgs = item.images;
            } else if (typeof item.images === 'string') {
                try {
                    // Cố gắng parse JSON nếu dữ liệu bị ép kiểu chuỗi
                    rawExtraImgs = JSON.parse(item.images);
                } catch(e) {
                    // Nếu lỗi thì cắt chuỗi theo dấu phẩy hoặc xuống dòng
                    rawExtraImgs = item.images.split(/[\n,]+/);
                }
            }
            
            // Lọc sạch mọi ký tự lạ trước khi hiển thị ra textarea
            let cleanArr = rawExtraImgs
                .map(url => url.replace(/['"\[\]\{\}\n\r\s]/g, '').trim())
                .filter(url => url !== '');
                
            DOM.inExtraImages.value = cleanArr.join('\n');
        }
    }

    if (DOM.selIndustry && item.industry_id) DOM.selIndustry.value = item.industry_id;

    if (DOM.selCategory && item.category_id) {
        DOM.selCategory.value = item.category_id;
        await loadSubCategories(); 
        if (DOM.selSubCategory && item.sub_category_id) {
            DOM.selSubCategory.value = item.sub_category_id;
            await loadFamilies(); 
            if (DOM.selFamily && item.family_id) DOM.selFamily.value = item.family_id;
        }
    }

    if(DOM.inBrand) {
        DOM.inBrand.value = '';
        if (item.brand_id) {
            const foundBrand = state.globalBrands.find(b => b.id === item.brand_id);
            if (foundBrand) DOM.inBrand.value = foundBrand.name;
        }
    }

    if(DOM.formTitle) DOM.formTitle.innerText = `Sửa Sản Phẩm: ${item.sku}`;
    if(DOM.btnSave) DOM.btnSave.innerHTML = "Cập Nhật Sản Phẩm";
    if(DOM.listView) DOM.listView.classList.add('hidden');
    if(DOM.formView) DOM.formView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteProduct = async function(id) {
    if (!confirm("Xóa vĩnh viễn sản phẩm này?")) return;
    try {
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

async function loadInitialDropdowns() {
    try {
        const { data: cats } = await supabaseClient.from('categories').select('id, name').order('id');
        if (cats) DOM.selCategory.innerHTML = '<option value="">-- Chọn danh mục gốc --</option>' + cats.map(c => `<option value="${c.id}">${utils.escapeHTML(c.name)}</option>`).join('');
        
        const { data: brands } = await supabaseClient.from('brands').select('id, name').order('name');
        if (brands) {
            state.globalBrands = brands;
            // Bơm danh sách thương hiệu vào Datalist HTML
            if (DOM.dlBrandList) {
                DOM.dlBrandList.innerHTML = brands.map(b => `<option value="${utils.escapeHTML(b.name)}">`).join('');
            }
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

function renderProducts() {
    if (!DOM.tbody) return;
    if (state.totalItems === 0) {
        DOM.tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-400 font-medium">Không tìm thấy sản phẩm nào!</td></tr>`;
        return;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;
    const fallbackImage = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTBweCIgZmlsbD0iI2FhYSIgZHk9Ii4zZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vIEltZzwvdGV4dD48L3N2Zz4=";

    DOM.tbody.innerHTML = state.products.map((item, index) => {
        const safeSku = utils.escapeHTML(item.sku);
        const safeName = utils.escapeHTML(item.name);
        const catName = item.categories ? utils.escapeHTML(item.categories.name) : '-';
        const brandName = item.brands ? utils.escapeHTML(item.brands.name) : 'OEM';

        let priceHtml = `<span class="text-gray-900 font-bold">${utils.formatCurrency(item.price)}</span>`;
        if (item.discount_price) {
            priceHtml = `
                <span class="text-gray-400 line-through text-xs block">${utils.formatCurrency(item.price)}</span>
                <span class="text-red-600 font-bold">${utils.formatCurrency(item.discount_price)}</span>
            `;
        }

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition group">
                <td class="p-4 text-center text-gray-400 text-xs font-bold">${from + index + 1}</td>
                <td class="p-4"><img src="${utils.escapeHTML(item.image_url) || fallbackImage}" class="w-10 h-10 object-cover rounded-md border border-gray-200 shadow-sm" onerror="this.src='${fallbackImage}'"></td>
                <td class="p-4 font-bold text-gray-900 text-xs">${safeSku}</td>
                <td class="p-4 font-bold text-gray-700">${safeName}</td>
                <td class="p-4 text-xs text-gray-500">${catName}<br><span class="mt-1 inline-block text-[10px] bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded font-bold">${brandName}</span></td>
                <td class="p-4 text-right">${priceHtml}</td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end space-x-1">
                        <button onclick="window.editProduct('${item.id}')" class="p-1.5 text-gray-400 hover:text-kn-blue hover:bg-blue-50 rounded-lg transition" title="Sửa">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button onclick="window.deleteProduct('${item.id}')" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Xóa">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
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

    let html = `
        <button onclick="state.currentPage--; window.fetchProducts()" 
            ${state.currentPage === 1 ? 'disabled class="px-3 py-1.5 rounded-lg text-gray-400 bg-transparent cursor-not-allowed"' : 'class="px-3 py-1.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 font-bold transition shadow-sm"'}>
            &laquo; Prev
        </button>
        <div class="flex space-x-1">
    `;
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === state.currentPage 
            ? "px-3 py-1.5 rounded-lg text-white bg-gray-900 border border-gray-900 font-bold shadow-sm" 
            : "px-3 py-1.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 font-bold transition shadow-sm";
        html += `<button onclick="state.currentPage = ${i}; window.fetchProducts()" class="${activeClass}">${i}</button>`;
    }
    html += `
        </div>
        <button onclick="state.currentPage++; window.fetchProducts()" 
            ${state.currentPage === totalPages ? 'disabled class="px-3 py-1.5 rounded-lg text-gray-400 bg-transparent cursor-not-allowed"' : 'class="px-3 py-1.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 font-bold transition shadow-sm"'}>
            Next &raquo;
        </button>
    `;
    DOM.pagination.innerHTML = html;
}