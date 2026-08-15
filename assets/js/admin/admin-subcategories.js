// ========================================================
// FILE: assets/js/admin/manage-subcategories.js
// CÓ TÍCH HỢP PHÂN TRANG (PAGINATION) VÀ TÌM KIẾM SERVER-SIDE
// ========================================================

const state = {
    allSubCats: [],
    allParents: [],
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    searchQuery: '',
    filterParentId: 'all'
};

// 1. TẢI DỮ LIỆU DANH MỤC GỐC (Chạy 1 lần lúc mở trang)
async function loadDropdowns() {
    try {
        const { data } = await window.supabaseClient.from('categories').select('id, name').order('name');
        state.allParents = data || [];
        populateParentDropdowns();
    } catch (err) {
        console.error("Lỗi tải danh mục gốc:", err);
    }
}

// 2. TẢI DỮ LIỆU NHÓM HÀNG (Có Phân Trang)
async function loadData() {
    const tbody = document.getElementById('tableBody');
    const stats = document.getElementById('subcatStats');
    
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8"><div class="animate-spin inline-block w-6 h-6 border-2 border-kn-blue border-t-transparent rounded-full"></div></td></tr>`;
    
    try {
        const from = (state.currentPage - 1) * state.itemsPerPage;
        const to = from + state.itemsPerPage - 1;

        let query = window.supabaseClient
            .from('sub_categories')
            .select('*, categories(name)', { count: 'exact' });

        // Lọc theo từ khóa
        if (state.searchQuery) {
            query = query.or(`name.ilike.%${state.searchQuery}%,slug.ilike.%${state.searchQuery}%`);
        }
        
        // Lọc theo danh mục cha
        if (state.filterParentId !== 'all') {
            query = query.eq('category_id', state.filterParentId);
        }

      const { data, count, error } = await query.order('id', { ascending: true }).range(from, to);

        if (error) throw error;
        
        state.allSubCats = data || [];
        state.totalItems = count || 0;
        
        if (stats) stats.innerText = `${state.totalItems} nhóm hàng`;

        renderTable(state.allSubCats);
        renderPagination();
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500 font-bold">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    }
}

// 3. RENDER BẢNG
function renderTable(list) {
    const tbody = document.getElementById('tableBody');
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-12 text-gray-400 font-medium">Không có dữ liệu phù hợp.</td></tr>`;
        return;
    }

    let html = '';
    list.forEach(item => {
        const parentName = item.categories ? item.categories.name : '<span class="text-red-500">Mất link</span>';
        
        html += `
            <tr class="hover:bg-blue-50/40 transition group">
                <td class="py-3 px-4 text-center font-bold text-gray-400 text-xs">#${item.id}</td>
                <td class="py-3 px-4 font-bold text-gray-900">${escapeHTML(item.name)}</td>
                <td class="py-3 px-4 text-xs">
                    <span class="inline-block font-bold border border-gray-200 bg-gray-100 px-2.5 py-1.5 rounded-md text-gray-700">${parentName}</span>
                </td>
                <td class="py-3 px-4 text-xs font-mono text-gray-500">${escapeHTML(item.slug || '--')}</td>
                <td class="py-3 px-4 text-right space-x-1">
                    <button onclick="editItem(${item.id})" class="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition font-bold text-xs uppercase">Sửa</button>
                    <button onclick="deleteItem(${item.id}, '${escapeHTML(item.name)}')" class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition font-bold text-xs uppercase">Xóa</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// 4. RENDER PHÂN TRANG
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    container.innerHTML = '';
    const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
    if (totalPages <= 1) return;

    let html = `<button onclick="state.currentPage--; loadData()" ${state.currentPage === 1 ? 'disabled class="px-3 py-1.5 rounded-lg text-gray-400 bg-transparent"' : 'class="px-3 py-1.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm font-bold"'}>&laquo; Trước</button><div class="flex space-x-1">`;
    
    for (let i = 1; i <= totalPages; i++) {
        html += `<button onclick="state.currentPage = ${i}; loadData()" class="px-3 py-1.5 rounded-lg font-bold shadow-sm transition ${i === state.currentPage ? 'bg-kn-blue text-white border border-kn-blue' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}">${i}</button>`;
    }
    
    html += `</div><button onclick="state.currentPage++; loadData()" ${state.currentPage === totalPages ? 'disabled class="px-3 py-1.5 rounded-lg text-gray-400 bg-transparent"' : 'class="px-3 py-1.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm font-bold"'}>Sau &raquo;</button>`;
    
    container.innerHTML = html;
}

// 5. ĐỔ DATA VÀO DROPDOWN LỌC & FORM
function populateParentDropdowns() {
    const filterSelect = document.getElementById('filterParentSelect');
    const formSelect = document.getElementById('parentCategory');
    
    let optionsHtml = '<option value="">-- Chọn Danh Mục Gốc --</option>';
    state.allParents.forEach(p => {
        optionsHtml += `<option value="${p.id}">${p.name}</option>`;
    });

    if (formSelect) formSelect.innerHTML = optionsHtml;
    
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="all">Tất cả danh mục gốc</option>' + 
            state.allParents.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
}

// 6. TÌM KIẾM & LỌC (Reset về trang 1)
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    state.currentPage = 1; 
    loadData();
});

document.getElementById('filterParentSelect')?.addEventListener('change', (e) => {
    state.filterParentId = e.target.value;
    state.currentPage = 1;
    loadData();
});

// 7. MỞ/ĐÓNG MODAL & AUTO SLUG
window.openModal = function(item = null) {
    const modal = document.getElementById('formModal');
    if (item) {
        document.getElementById('modalTitle').innerText = "Chỉnh Sửa Nhóm Hàng";
        document.getElementById('subId').value = item.id;
        document.getElementById('parentCategory').value = item.category_id || '';
        document.getElementById('subName').value = item.name || '';
        document.getElementById('subSlug').value = item.slug || '';
        document.getElementById('subMetaTitle').value = item.meta_title || '';
        document.getElementById('subMetaDesc').value = item.meta_description || '';
    } else {
        document.getElementById('modalTitle').innerText = "Thêm Nhóm Hàng Mới";
        document.getElementById('dataForm').reset();
        document.getElementById('subId').value = '';
    }
    modal.classList.remove('hidden');
};

window.closeModal = function() {
    document.getElementById('formModal').classList.add('hidden');
};

window.editItem = function(id) {
    const item = state.allSubCats.find(c => c.id === id);
    if (item) openModal(item);
};

document.getElementById('subName')?.addEventListener('input', function(e) {
    const slugInput = document.getElementById('subSlug');
    if (slugInput && !document.getElementById('subId').value) {
        slugInput.value = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    }
});

// 8. LƯU DỮ LIỆU
document.getElementById('dataForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('subId').value;
    const payload = {
        category_id: document.getElementById('parentCategory').value,
        name: document.getElementById('subName').value.trim(),
        slug: document.getElementById('subSlug').value.trim(),
        meta_title: document.getElementById('subMetaTitle').value.trim() || null,
        meta_description: document.getElementById('subMetaDesc').value.trim() || null
    };

    const btn = document.getElementById('btnSubmit');
    btn.disabled = true;
    btn.innerText = "Đang lưu...";

    try {
        if (id) {
            const { error } = await window.supabaseClient.from('sub_categories').update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await window.supabaseClient.from('sub_categories').insert([payload]);
            if (error) throw error;
            state.currentPage = 1; // Thêm mới thì về trang 1
        }
        closeModal();
        await loadData();
    } catch (error) {
        alert("Lỗi: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Lưu Dữ Liệu";
    }
});

// 9. XÓA
window.deleteItem = async function(id, name) {
    if (!confirm(`Xóa vĩnh viễn nhóm hàng "${name}"?`)) return;
    try {
        const { error } = await window.supabaseClient.from('sub_categories').delete().eq('id', id);
        if (error) {
            if (error.code === '23503') return alert("Không thể xóa vì đang có Dòng sản phẩm (Family) phụ thuộc vào nhóm này.");
            throw error;
        }
        
        // Nếu xóa hết item ở trang cuối thì lùi về 1 trang
        if (state.allSubCats.length === 1 && state.currentPage > 1) {
            state.currentPage--;
        }
        await loadData();
    } catch (error) {
        alert("Lỗi xóa: " + error.message);
    }
};

function escapeHTML(str) { return !str ? '' : str.replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag)); }

document.addEventListener("DOMContentLoaded", async () => {
    await loadDropdowns();
    await loadData();
});