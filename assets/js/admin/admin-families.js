// ========================================================
// FILE: assets/js/admin/admin-families.js
// Nâng cấp: Bỏ Service Layer, Tích hợp Slug + Thumbnail, Pagination chuẩn
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
    inSlug: document.getElementById('inSlug'),
    inThumbnail: document.getElementById('inThumbnail'),
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
        DOM.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.trim().toLowerCase();
            state.currentPage = 1;
            fetchFamilies();
        });
    }

    // Auto generate Slug
    DOM.inName?.addEventListener('input', (e) => {
        if (!state.editingId) {
            DOM.inSlug.value = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
        }
    });

    if (DOM.form) DOM.form.addEventListener('submit', saveFamily);
    if (DOM.btnCancel) DOM.btnCancel.addEventListener('click', cancelEdit);

    fetchFamilies();
});

async function loadDropdownSubCategories() {
    try {
        const { data, error } = await window.supabaseClient.from('sub_categories').select('id, name').order('name');
        if (error) throw error;
        state.subCategories = data || []; 
        DOM.selSubCategory.innerHTML = '<option value="">-- Chọn nhóm hàng --</option>' + 
            state.subCategories.map(sub => `<option value="${sub.id}">${sub.name}</option>`).join('');
    } catch (error) {
        console.error("Lỗi tải danh mục:", error);
    }
}

// --------------------------------------------------------
// SUPABASE DIRECT CALLS
// --------------------------------------------------------
async function fetchFamilies() {
    if (DOM.tbody) DOM.tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10"><div class="animate-spin inline-block w-6 h-6 border-2 border-kn-blue border-t-transparent rounded-full"></div></td></tr>`;

    try {
        const from = (state.currentPage - 1) * state.itemsPerPage;
        const to = from + state.itemsPerPage - 1;

        let query = window.supabaseClient
            .from('families')
            .select('*, sub_categories(name)', { count: 'exact' });

        if (state.searchQuery) {
            query = query.or(`name.ilike.%${state.searchQuery}%,slug.ilike.%${state.searchQuery}%`);
        }

        const { data, count, error } = await query.order('id', { ascending: false }).range(from, to);

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
    const payload = {
        name: DOM.inName.value.trim(),
        slug: DOM.inSlug.value.trim(),
        thumbnail_url: DOM.inThumbnail.value.trim() || null,
        sub_category_id: DOM.selSubCategory.value
    };

    if (!payload.name || !payload.sub_category_id || !payload.slug) {
        return alert("Vui lòng nhập đủ các trường bắt buộc!");
    }

    DOM.btnSave.disabled = true;
    DOM.btnSave.innerText = "Đang lưu...";

    try {
        // Kiểm tra trùng tên trong cùng 1 danh mục
        let checkQuery = window.supabaseClient.from('families').select('id').eq('name', payload.name).eq('sub_category_id', payload.sub_category_id);
        if (state.editingId) checkQuery = checkQuery.neq('id', state.editingId);
        
        const { data: existing } = await checkQuery.maybeSingle();
        if (existing) {
            alert(`Dòng sản phẩm "${payload.name}" đã tồn tại trong nhóm này!`);
            DOM.inName.focus();
            return;
        }

        if (state.editingId) {
            const { error } = await window.supabaseClient.from('families').update(payload).eq('id', state.editingId);
            if (error) throw error;
        } else {
            const { error } = await window.supabaseClient.from('families').insert([payload]);
            if (error) throw error;
        }

        cancelEdit();
        fetchFamilies();
    } catch (error) {
        alert(`Lỗi: ${error.message}`);
    } finally {
        DOM.btnSave.disabled = false;
        DOM.btnSave.innerText = state.editingId ? "Cập Nhật" : "Lưu Dữ Liệu";
    }
}

window.deleteFamily = async function(id) {
    if (!confirm(`Bạn có chắc chắn muốn xóa dòng sản phẩm này?`)) return;

    try {
        const { error } = await window.supabaseClient.from('families').delete().eq('id', id);
        if (error) {
            if (error.code === '23503') return alert(`Không thể xóa! Dòng sản phẩm này đang chứa sản phẩm con.`);
            throw error;
        }

        if (state.families.length === 1 && state.currentPage > 1) state.currentPage--;
        fetchFamilies();
    } catch (error) {
        alert("Lỗi xóa: " + error.message);
    }
}

// --------------------------------------------------------
// RENDER GIAO DIỆN
// --------------------------------------------------------
window.editFamily = function(id) {
    const item = state.families.find(f => f.id == id);
    if (!item) return;

    state.editingId = item.id;
    DOM.inName.value = item.name;
    DOM.inSlug.value = item.slug || '';
    DOM.inThumbnail.value = item.thumbnail_url || '';
    DOM.selSubCategory.value = item.sub_category_id;

    DOM.btnSave.innerHTML = "Cập Nhật";
    DOM.btnCancel.classList.remove('hidden');
    document.getElementById('formTitle').innerText = "Chỉnh sửa Dòng sản phẩm";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    state.editingId = null;
    DOM.form.reset();
    DOM.btnSave.innerHTML = "Lưu Dữ Liệu";
    DOM.btnCancel.classList.add('hidden');
    document.getElementById('formTitle').innerText = "Thêm Dòng sản phẩm Mới";
}

function renderFamilies() {
    if (!DOM.tbody) return;
    if (state.families.length === 0) {
        DOM.tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-400 font-medium">Chưa có dữ liệu!</td></tr>`;
        return;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;

    DOM.tbody.innerHTML = state.families.map((item, index) => {
        const safeName = item.name;
        const parentCatName = item.sub_categories ? item.sub_categories.name : '<span class="text-red-500">Mất link</span>';
        const imgObj = item.thumbnail_url 
            ? `<img src="${item.thumbnail_url}" class="w-10 h-10 object-contain bg-white border rounded">`
            : `<div class="w-10 h-10 bg-gray-100 border rounded flex items-center justify-center text-xs text-gray-400">No Img</div>`;

        return `
            <tr class="border-b border-gray-100 hover:bg-blue-50/30 transition group">
                <td class="p-4 text-center font-bold text-gray-400 text-xs">${from + index + 1}</td>
                <td class="p-4 text-center">${imgObj}</td>
                <td class="p-4">
                    <div class="font-bold text-gray-900 text-sm">${safeName}</div>
                    <div class="text-xs text-gray-400 mt-1">Slug: ${item.slug || '--'}</div>
                </td>
                <td class="p-4 text-xs text-gray-600">
                    <!-- ĐÃ THÊM 'inline-block' VÀ 'whitespace-nowrap' ĐỂ TRÁNH RỚT DÒNG BỂ BACKGROUND -->
                    <span class="inline-block font-bold border border-gray-200 bg-gray-100 px-2.5 py-1.5 rounded-md text-xs">${parentCatName}</span>
                </td>
                <td class="p-4 text-center space-x-1">
                    <button onclick="editFamily(${item.id})" class="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition font-bold text-xs uppercase" title="Sửa">Sửa</button>
                    <button onclick="deleteFamily(${item.id})" class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition font-bold text-xs uppercase" title="Xóa">Xóa</button>
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

    let html = `<button onclick="state.currentPage--; fetchFamilies()" ${state.currentPage === 1 ? 'disabled class="px-3 py-1.5 rounded-lg text-gray-400 bg-transparent"' : 'class="px-3 py-1.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm font-bold"'}>&laquo; Prev</button><div class="flex space-x-1">`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button onclick="state.currentPage = ${i}; fetchFamilies()" class="px-3 py-1.5 rounded-lg font-bold shadow-sm transition ${i === state.currentPage ? 'bg-kn-blue text-white border border-kn-blue' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}">${i}</button>`;
    }
    html += `</div><button onclick="state.currentPage++; fetchFamilies()" ${state.currentPage === totalPages ? 'disabled class="px-3 py-1.5 rounded-lg text-gray-400 bg-transparent"' : 'class="px-3 py-1.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm font-bold"'}>Next &raquo;</button>`;
    DOM.pagination.innerHTML = html;
}