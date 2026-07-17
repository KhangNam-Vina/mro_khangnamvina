// ========================================================
// FILE: assets/js/admin-families.js
// SẠCH 100% - CHỈ CÒN LOGIC GIAO DIỆN
// ========================================================

const state = {
    families: [],
    subCategories: [],
    editingId: null,
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    searchQuery: ''
};

const DOM = {
    form: document.getElementById('familyForm'),
    inName: document.getElementById('inName'),
    selSubCategory: document.getElementById('selSubCategory'),
    btnSave: document.getElementById('btnSaveFamily'),
    btnCancel: document.getElementById('btnCancelEdit'),
    tbody: document.getElementById('familyTableBody'),
    pagination: document.getElementById('paginationContainer'),
    searchInput: document.getElementById('searchFamilyInput')
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadDropdownSubCategories();
    
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                state.searchQuery = e.target.value.trim();
                state.currentPage = 1;
                fetchFamilies();
            }
        });
    }

    if (DOM.form) DOM.form.addEventListener('submit', saveFamily);
    if (DOM.btnCancel) DOM.btnCancel.addEventListener('click', cancelEdit);

    fetchFamilies();
});

// Tạm gọi Supabase trực tiếp ở đây (Nếu rảnh ông có thể bóc ra thành CategoryService)
async function loadDropdownSubCategories() {
    try {
        const { data, error } = await supabaseClient.from('sub_categories').select('id, name').order('name');
        if (error) throw error;
        state.subCategories = data || []; 
        DOM.selSubCategory.innerHTML = '<option value="">-- Chọn Phân loại --</option>' + 
            state.subCategories.map(sub => `<option value="${sub.id}">${window.utils.escapeHTML(sub.name)}</option>`).join('');
    } catch (error) {
        window.utils.showToast("Lỗi tải danh mục: " + error.message, "error");
    }
}

// --------------------------------------------------------
// GỌI API QUA TẦNG SERVICE LAYER
// --------------------------------------------------------
async function fetchFamilies() {
    if (DOM.tbody) DOM.tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10"><div class="animate-spin inline-block w-8 h-8 border-4 border-kn-blue border-t-transparent rounded-full mb-2"></div><br><span class="text-gray-500 font-bold">Đang tải...</span></td></tr>`;

    try {
        const { data, count, error } = await FamilyService.getList({
            page: state.currentPage,
            limit: state.itemsPerPage,
            search: state.searchQuery
        });
        
        if (error) throw error;

        state.families = data || [];
        state.totalItems = count || 0;

        renderFamilies();
        renderPagination();
    } catch (error) {
        DOM.tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500 font-bold">Lỗi: ${error.message}</td></tr>`;
    }
}

async function saveFamily(event) {
    event.preventDefault();
    const name = DOM.inName.value.trim();
    const subCatId = DOM.selSubCategory.value;

    if (!name || !subCatId) return window.utils.showToast("Vui lòng nhập tên và chọn phân loại!", "error");

    window.utils.toggleBtn(DOM.btnSave, true, "Đang lưu...");

    try {
        // Gọi Service kiểm tra trùng lặp
        const { data: existing, error: checkErr } = await FamilyService.checkExist(name, subCatId, state.editingId);
        if (checkErr) throw checkErr;
        
        if (existing) {
            window.utils.showToast(`Dòng sản phẩm "${name}" đã tồn tại trong danh mục này!`, "warning");
            DOM.inName.focus();
            return;
        }

        const payload = { name: name, sub_category_id: subCatId };

        // Gọi Service Lưu
        if (state.editingId) {
            const { error } = await FamilyService.update(state.editingId, payload);
            if (error) throw error;
            window.utils.showToast("Cập nhật thành công!", "success");
        } else {
            const { error } = await FamilyService.create(payload);
            if (error) throw error;
            window.utils.showToast("Thêm mới thành công!", "success");
        }

        cancelEdit();
        fetchFamilies();
    } catch (error) {
        window.utils.showToast(`Lỗi: ${error.message}`, "error");
    } finally {
        window.utils.toggleBtn(DOM.btnSave, false, state.editingId ? 'Cập Nhật' : 'Thêm Mới');
    }
}

window.deleteFamily = async function(id) {
    const item = state.families.find(f => f.id == id);
    if (!item) return;

    if (!confirm(`Xóa dòng sản phẩm: "${item.name}"?`)) return;

    try {
        // Gọi Service Xóa
        const { error } = await FamilyService.delete(id);
        if (error) {
            if (error.code === '23503') return window.utils.showToast(`Không thể xóa! "${item.name}" đang chứa sản phẩm.`, "error");
            throw error;
        }

        window.utils.showToast("Đã xóa thành công!", "success");
        if (state.families.length === 1 && state.currentPage > 1) state.currentPage--;
        fetchFamilies();
    } catch (error) {
        window.utils.showToast("Lỗi xóa: " + error.message, "error");
    }
}

// --------------------------------------------------------
// GIAO DIỆN (UI)
// --------------------------------------------------------
window.editFamily = function(id) {
    const item = state.families.find(f => f.id == id);
    if (!item) return;

    state.editingId = item.id;
    DOM.inName.value = item.name;
    DOM.selSubCategory.value = item.sub_category_id;

    DOM.btnSave.innerHTML = "Cập Nhật";
    DOM.btnSave.classList.replace('bg-kn-blue', 'bg-green-600');
    DOM.btnCancel.classList.remove('hidden');
    DOM.inName.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    state.editingId = null;
    DOM.form.reset();
    DOM.btnSave.innerHTML = "Thêm Mới";
    DOM.btnSave.classList.replace('bg-green-600', 'bg-kn-blue');
    DOM.btnCancel.classList.add('hidden');
}

function renderFamilies() {
    if (!DOM.tbody) return;
    if (state.families.length === 0) {
        DOM.tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500 font-bold">Chưa có dữ liệu!</td></tr>`;
        return;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;
    
    DOM.tbody.innerHTML = state.families.map((item, index) => {
        const safeName = window.utils.escapeHTML(item.name);
        const parentCat = state.subCategories.find(sub => sub.id == item.sub_category_id);
        const parentCatName = parentCat ? window.utils.escapeHTML(parentCat.name) : '-';
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '-';

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="p-4 text-center font-bold text-gray-500">${from + index + 1}</td>
                <td class="p-4 font-bold text-gray-800">${safeName}</td>
                <td class="p-4 text-sm text-gray-600 bg-gray-50"><span class="font-medium bg-gray-200 px-2 py-1 rounded text-xs">${parentCatName}</span></td>
                <td class="p-4 text-xs text-gray-500">${dateStr}</td>
                <td class="p-4 text-right space-x-2">
                    <button onclick="editFamily(${item.id})" class="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded font-bold hover:bg-blue-200">Sửa</button>
                    <button onclick="deleteFamily(${item.id})" class="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded font-bold hover:bg-red-200">Xóa</button>
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
    if (state.currentPage > 1) html += `<button onclick="state.currentPage--; fetchFamilies()" class="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50">&laquo;</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === state.currentPage) html += `<button class="px-3 py-1 bg-kn-orange text-white rounded text-sm font-bold">${i}</button>`;
        else html += `<button onclick="state.currentPage = ${i}; fetchFamilies()" class="px-3 py-1 bg-white border rounded text-sm hover:bg-blue-50">${i}</button>`;
    }
    if (state.currentPage < totalPages) html += `<button onclick="state.currentPage++; fetchFamilies()" class="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50">&raquo;</button>`;
    DOM.pagination.innerHTML = html;
}