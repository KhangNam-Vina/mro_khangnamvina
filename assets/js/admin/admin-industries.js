// ========================================================
// FILE: assets/js/admin/admin-industries.js
// QUẢN LÝ NGÀNH HÀNG - ĐÃ FIX ĐỒNG BỘ 7 CỘT & 2 Ô ẢNH
// ========================================================

const state = {
    industries: [],
    editingId: null,
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    searchQuery: ''
};

const DOM = {
    form: document.getElementById('industryForm'),
    formTitle: document.getElementById('formTitle'),
    inName: document.getElementById('inName'),
    inImg: document.getElementById('inImg'),       // Banner
    inIcon: document.getElementById('inIcon'),     // Icon
    inDesc: document.getElementById('inDesc'),
    inFeatures: document.getElementById('inFeatures'), 
    inActive: document.getElementById('inActive'),
    
    btnSave: document.getElementById('btnSaveIndustry'),
    btnCancel: document.getElementById('btnCancelEdit'),
    tbody: document.getElementById('industryTableBody'),
    pagination: document.getElementById('paginationContainer'),
    searchInput: document.getElementById('searchIndustryInput'),
    toastContainer: document.getElementById('toastContainer')
};

function showToast(message, type = 'success') {
    if (!DOM.toastContainer) return;
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-orange-500' : 'bg-red-500';
    const toast = document.createElement('div');
    toast.className = `${bgColor} text-white px-4 py-2 rounded shadow-lg transform transition-all duration-300 translate-y-0 opacity-100 mb-2 font-bold text-sm`;
    toast.innerHTML = type === 'success' ? `✔ ${message}` : `⚠ ${message}`;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-2'); setTimeout(() => toast.remove(), 300); }, 3000);
}

window.fetchIndustries = async function() {
    if (!DOM.tbody) return;
    DOM.tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8"><div class="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>`;

    try {
        let query = supabaseClient.from('industries').select('*', { count: 'exact' });
        
        if (state.searchQuery) {
            query = query.or(`name.ilike.%${state.searchQuery}%,description.ilike.%${state.searchQuery}%`);
        }
        
        query = query.order('id', { ascending: true })
                     .range((state.currentPage - 1) * state.itemsPerPage, state.currentPage * state.itemsPerPage - 1);

        const { data, count, error } = await query;
        if (error) throw error;

        state.industries = data || [];
        state.totalItems = count || 0;
        
        renderIndustries();
        renderPagination();

    } catch (error) {
        DOM.tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-red-500">Lỗi: ${error.message}</td></tr>`;
        showToast(error.message, 'error');
    }
};

function renderIndustries() {
    if (!DOM.tbody) return;
    if (state.totalItems === 0) {
        DOM.tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500">Không tìm thấy ngành hàng nào.</td></tr>`;
        return;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;
    
    DOM.tbody.innerHTML = state.industries.map((item, index) => {
        const safeName = item.name ? item.name.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)) : '';
        const safeDesc = item.description ? item.description.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)) : '';
        
        const badgeClass = item.is_active !== false ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200';
        const badgeText = item.is_active !== false ? 'ĐANG HIỂN THỊ' : 'ĐANG ẨN';

        // Xử lý hiển thị Icon & Banner
        const iconHtml = item.icon_url 
            ? `<img src="${item.icon_url}" class="w-8 h-8 object-contain mx-auto" onerror="this.src='https://placehold.co/32x32?text=Err'">` 
            : `<span class="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-1 rounded">Trống</span>`;
            
        const bannerHtml = item.image_url 
            ? `<img src="${item.image_url}" class="w-12 h-8 object-cover mx-auto rounded border border-gray-200 shadow-sm" onerror="this.src='https://placehold.co/48x32?text=Err'">` 
            : `<span class="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-1 rounded">Trống</span>`;

        return `
            <tr class="border-b border-gray-100 hover:bg-blue-50/30 transition group">
                <td class="p-4 text-center text-gray-400 text-xs font-bold">${from + index + 1}</td>
                <td class="p-4 text-center">${iconHtml}</td>
                <td class="p-4 text-center">${bannerHtml}</td>
                <td class="p-4 font-bold text-gray-800">${safeName}</td>
                <td class="p-4 text-xs text-gray-500 line-clamp-2" title="${safeDesc}">${safeDesc}</td>
                
                <!-- ĐÃ FIX: Thêm whitespace-nowrap để cấm rớt dòng -->
                <td class="p-4 text-center whitespace-nowrap">
                    <span class="inline-block whitespace-nowrap px-2.5 py-1 text-[10px] font-black uppercase rounded border ${badgeClass}">${badgeText}</span>
                </td>
                
                <!-- ĐÃ FIX: Khóa luôn cột thao tác không cho rớt dòng -->
                <td class="p-4 text-center whitespace-nowrap">
                    <div class="flex items-center justify-center space-x-2">
                        <button onclick="editIndustry('${item.id}')" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition" title="Sửa">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button onclick="deleteIndustry('${item.id}')" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition" title="Xóa">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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

    let html = `<button onclick="state.currentPage--; fetchIndustries()" ${state.currentPage === 1 ? 'disabled class="px-3 py-1.5 rounded text-gray-400 bg-transparent"' : 'class="px-3 py-1.5 rounded text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm font-bold"'}>&laquo; Prev</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button onclick="state.currentPage = ${i}; fetchIndustries()" class="px-3 py-1.5 rounded font-bold shadow-sm transition ${i === state.currentPage ? 'bg-kn-blue text-white border border-kn-blue' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}">${i}</button>`;
    }
    html += `<button onclick="state.currentPage++; fetchIndustries()" ${state.currentPage === totalPages ? 'disabled class="px-3 py-1.5 rounded text-gray-400 bg-transparent"' : 'class="px-3 py-1.5 rounded text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm font-bold"'}>Next &raquo;</button>`;
    
    DOM.pagination.innerHTML = html;
}

window.saveIndustry = async function() {
    if (!DOM.inName.value.trim()) return showToast("Tên ngành không được để trống!", "warning");
    
    DOM.btnSave.disabled = true;
    DOM.btnSave.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Đang lưu...`;

    try {
        let featuresArray = [];
        if (DOM.inFeatures && DOM.inFeatures.value.trim()) {
            featuresArray = DOM.inFeatures.value.trim().split(',').map(s => s.trim()).filter(s => s !== '');
        }

        const payload = {
            name: DOM.inName.value.trim(),
            description: DOM.inDesc.value.trim() || null,
            image_url: DOM.inImg.value.trim() || null,
            icon_url: DOM.inIcon.value.trim() || null,
            is_active: DOM.inActive.checked,
            features: featuresArray
        };

        if (state.editingId) {
            const { error } = await supabaseClient.from('industries').update(payload).eq('id', state.editingId);
            if (error) throw error;
            showToast("Đã cập nhật ngành hàng!", "success");
        } else {
            const { error } = await supabaseClient.from('industries').insert([payload]);
            if (error) throw error;
            showToast("Thêm ngành hàng thành công!", "success");
        }

        cancelForm();
        fetchIndustries();

    } catch (error) {
        showToast("Lỗi: " + error.message, "error");
    } finally {
        DOM.btnSave.disabled = false;
        DOM.btnSave.innerHTML = state.editingId ? "Cập Nhật" : "Thêm Mới";
    }
};

window.editIndustry = function(id) {
    const item = state.industries.find(i => i.id == id);
    if (!item) return;

    state.editingId = item.id;
    DOM.inName.value = item.name || '';
    DOM.inDesc.value = item.description || '';
    DOM.inImg.value = item.image_url || '';
    DOM.inIcon.value = item.icon_url || '';
    DOM.inActive.checked = item.is_active !== false;

    if (DOM.inFeatures) {
        let ftStr = '';
        if (Array.isArray(item.features)) ftStr = item.features.join(', ');
        else if (typeof item.features === 'string') {
            try { ftStr = JSON.parse(item.features).join(', '); } 
            catch(e) { ftStr = item.features; }
        }
        DOM.inFeatures.value = ftStr;
    }

    DOM.formTitle.innerText = "Sửa Ngành Hàng";
    DOM.btnSave.innerHTML = "Cập Nhật";
    DOM.btnSave.classList.replace('bg-gray-900', 'bg-green-600');
    DOM.btnSave.classList.replace('hover:bg-black', 'hover:bg-green-700');
    DOM.btnCancel.classList.remove('hidden');
};

window.cancelForm = function() {
    state.editingId = null;
    DOM.form.reset();
    DOM.formTitle.innerText = "Thêm Ngành hàng Mới";
    DOM.btnSave.innerHTML = "Thêm Mới";
    DOM.btnSave.classList.replace('bg-green-600', 'bg-gray-900');
    DOM.btnSave.classList.replace('hover:bg-green-700', 'hover:bg-black');
    DOM.btnCancel.classList.add('hidden');
};

window.deleteIndustry = async function(id) {
    if (!confirm("Bạn có chắc muốn xóa ngành hàng này?")) return;
    try {
        const { error } = await supabaseClient.from('industries').delete().eq('id', id);
        if (error) throw error;
        showToast("Xóa thành công!", "success");
        if (state.industries.length === 1 && state.currentPage > 1) state.currentPage--;
        fetchIndustries();
    } catch (error) {
        showToast("Lỗi xóa: " + error.message, "error");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                state.searchQuery = e.target.value.trim();
                state.currentPage = 1;
                fetchIndustries();
            }
        });
    }
    fetchIndustries();
});