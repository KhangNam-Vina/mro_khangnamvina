// ========================================================
// FILE: assets/js/admin-industries.js
// QUẢN LÝ NGÀNH HÀNG (INDUSTRY) - CHUẨN SENIOR FRONTEND
// ========================================================

// 1. STATE & DOM CACHE
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
    inImg: document.getElementById('inImg'),
    inDesc: document.getElementById('inDesc'),
    btnSave: document.getElementById('btnSaveIndustry'),
    btnCancel: document.getElementById('btnCancelEdit'),
    tbody: document.getElementById('industryTableBody'),
    pagination: document.getElementById('paginationContainer'),
    searchInput: document.getElementById('searchIndustryInput'),
    toastContainer: document.getElementById('toastContainer')
};

// 2. UTILS
const utils = {
    escapeHTML: (str) => {
        if (!str) return '';
        return str.toString().replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
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
        DOM.formTitle.innerText = "Thêm Ngành Hàng Mới";
        DOM.btnSave.innerHTML = "Thêm Mới";
        DOM.btnSave.classList.replace('bg-green-600', 'bg-kn-blue');
        DOM.btnSave.classList.replace('hover:bg-green-700', 'hover:bg-blue-800');
        DOM.btnCancel.classList.add('hidden');
        DOM.inName.focus();
    }
};

// 3. INIT (Khởi tạo sự kiện 1 lần duy nhất)
document.addEventListener('DOMContentLoaded', () => {
    // Tìm kiếm
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                state.searchQuery = e.target.value.trim();
                state.currentPage = 1;
                fetchIndustries();
            }
        });
    }

    // Submit Form
    if (DOM.form) {
        DOM.form.addEventListener('submit', saveIndustry);
    }

    // Hủy sửa
    if (DOM.btnCancel) {
        DOM.btnCancel.addEventListener('click', utils.resetForm);
    }

    fetchIndustries();
});

// 4. CORE FUNCTIONS
async function fetchIndustries() {
    if (DOM.tbody) DOM.tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10"><div class="w-8 h-8 border-4 border-kn-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div><span class="text-gray-500 font-bold">Đang tải dữ liệu...</span></td></tr>`;

    const from = (state.currentPage - 1) * state.itemsPerPage;
    const to = from + state.itemsPerPage - 1;

    try {
        let query = supabaseClient
            .from('industries')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (state.searchQuery) {
            query = query.ilike('name', `%${state.searchQuery}%`);
        }

        const { data, count, error } = await query;
        if (error) throw error;

        state.industries = data || [];
        state.totalItems = count || 0;

        renderIndustries();
        renderPagination();

    } catch (error) {
        if (DOM.tbody) DOM.tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500 font-bold">Lỗi: ${error.message}</td></tr>`;
        utils.showToast(`Lỗi tải dữ liệu: ${error.message}`, 'error');
    }
}

async function saveIndustry(event) {
    event.preventDefault();
    const name = DOM.inName.value.trim();
    const image_url = DOM.inImg.value.trim();
    const description = DOM.inDesc.value.trim();

    // Validation xịn sò
    if (name.length < 2) {
        utils.showToast("Tên ngành hàng phải từ 2 ký tự trở lên!", "warning");
        DOM.inName.focus();
        return;
    }

    utils.toggleBtn(DOM.btnSave, true, "Đang lưu...");

    try {
        // Check Duplicate
        let checkQuery = supabaseClient.from('industries').select('id').eq('name', name);
        if (state.editingId) checkQuery = checkQuery.neq('id', state.editingId);
        
        const { data: existing, error: checkErr } = await checkQuery;
        if (checkErr) throw checkErr;
        
        if (existing && existing.length > 0) {
            utils.showToast(`Ngành hàng "${name}" đã tồn tại!`, "warning");
            DOM.inName.focus();
            return;
        }

        const payload = { name, image_url, description };

        if (state.editingId) {
            const { error } = await supabaseClient.from('industries').update(payload).eq('id', state.editingId);
            if (error) throw error;
            utils.showToast("Cập nhật thành công!", "success");
        } else {
            const { error } = await supabaseClient.from('industries').insert([payload]);
            if (error) throw error;
            utils.showToast("Thêm ngành hàng mới thành công!", "success");
        }

        utils.resetForm();
        await fetchIndustries(); // Không dùng location.reload()

    } catch (error) {
        utils.showToast(`Lỗi: ${error.message}`, "error");
    } finally {
        utils.toggleBtn(DOM.btnSave, false, state.editingId ? 'Cập Nhật' : 'Thêm Mới');
    }
}

// Bơm lên Form để Sửa (Gán vào window để HTML button onclick gọi được)
window.editIndustry = function(id) {
    const item = state.industries.find(ind => ind.id == id);
    if (!item) {
        utils.showToast("Không tìm thấy dữ liệu!", "error");
        return;
    }

    state.editingId = item.id;
    DOM.inName.value = item.name;
    DOM.inImg.value = item.image_url || '';
    DOM.inDesc.value = item.description || '';

    DOM.formTitle.innerText = "Sửa Ngành Hàng";
    DOM.btnSave.innerHTML = "Cập Nhật";
    DOM.btnSave.classList.replace('bg-kn-blue', 'bg-green-600');
    DOM.btnSave.classList.replace('hover:bg-blue-800', 'hover:bg-green-700');
    DOM.btnCancel.classList.remove('hidden');

    DOM.inName.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.deleteIndustry = async function(id) {
    const item = state.industries.find(ind => ind.id == id);
    if (!item) return;

    if (!confirm(`Xóa ngành hàng "${item.name}"?`)) return;

    // Lấy button delete theo ID để disable (Chống spam click)
    const btnDel = document.getElementById(`btnDel_${id}`);
    utils.toggleBtn(btnDel, true, "Xóa...");

    try {
        const { error } = await supabaseClient.from('industries').delete().eq('id', id);
        
        if (error) {
            if (error.code === '23503') {
                utils.showToast(`LỖI: "${item.name}" đang chứa sản phẩm. Xóa sản phẩm trước!`, "error");
            } else {
                throw error;
            }
            return;
        }

        utils.showToast("Đã xóa thành công!", "success");
        if (state.industries.length === 1 && state.currentPage > 1) state.currentPage--;
        await fetchIndustries();

    } catch (error) {
        utils.showToast(`Lỗi xóa: ${error.message}`, "error");
    } finally {
        utils.toggleBtn(btnDel, false, "Xóa");
    }
}

// 5. RENDER UI
function renderIndustries() {
    if (!DOM.tbody) return;
    
    if (state.industries.length === 0) {
        DOM.tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500 font-bold">Chưa có ngành hàng nào!</td></tr>`;
        return;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;
    
    DOM.tbody.innerHTML = state.industries.map((item, index) => {
        const safeName = utils.escapeHTML(item.name);
        const safeDesc = utils.escapeHTML(item.description || '');
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '-';
        const imgTag = item.image_url ? `<img src="${utils.escapeHTML(item.image_url)}" class="w-12 h-12 object-cover rounded shadow-sm border border-gray-200" onerror="this.src='https://placehold.co/48x48?text=No+Img'">` : '<div class="w-12 h-12 bg-gray-100 flex items-center justify-center rounded text-xs text-gray-400">Trống</div>';

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                <td class="p-4 text-center font-bold text-gray-500">${from + index + 1}</td>
                <td class="p-4">${imgTag}</td>
                <td class="p-4 font-bold text-gray-800">${safeName}</td>
                <td class="p-4 text-sm text-gray-600 max-w-xs truncate">${safeDesc}</td>
                <td class="p-4 text-right space-x-2">
                    <button onclick="editIndustry(${item.id})" class="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded font-bold hover:bg-blue-200 transition">Sửa</button>
                    <button id="btnDel_${item.id}" onclick="deleteIndustry(${item.id})" class="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded font-bold hover:bg-red-200 transition">Xóa</button>
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
    if (state.currentPage > 1) {
        html += `<button onclick="state.currentPage--; fetchIndustries()" class="px-3 py-1 bg-white border rounded text-sm text-gray-600 hover:bg-gray-50">&laquo;</button>`;
    }
    for (let i = 1; i <= totalPages; i++) {
        if (i === state.currentPage) {
            html += `<button class="px-3 py-1 bg-kn-orange text-white border border-kn-orange rounded text-sm font-bold">${i}</button>`;
        } else {
            html += `<button onclick="state.currentPage = ${i}; fetchIndustries()" class="px-3 py-1 bg-white border rounded text-sm text-kn-blue hover:bg-blue-50">${i}</button>`;
        }
    }
    if (state.currentPage < totalPages) {
        html += `<button onclick="state.currentPage++; fetchIndustries()" class="px-3 py-1 bg-white border rounded text-sm text-gray-600 hover:bg-gray-50">&raquo;</button>`;
    }
    DOM.pagination.innerHTML = html;
}