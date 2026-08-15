// ========================================================
// FILE: assets/js/admin/admin-users.js
// QUẢN LÝ NHÂN VIÊN & KHÁCH HÀNG (ĐÃ FIX LỖI)
// ========================================================

const state = {
    users: [],
    currentTab: 'staff', 
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    searchQuery: ''
};

const DOM = {
    thead: document.getElementById('tableHeader'),
    tbody: document.getElementById('userTableBody'),
    pagination: document.getElementById('paginationContainer'),
    searchInput: document.getElementById('searchInput'),
    btnTabStaff: document.getElementById('btnTabStaff'),
    btnTabCustomer: document.getElementById('btnTabCustomer'),
    btnAddStaff: document.getElementById('btnAddStaff'),
    modal: document.getElementById('userModal'),
    modalTitle: document.getElementById('modalTitle'),
    form: document.getElementById('userForm'),
    inUserId: document.getElementById('inUserId'),
    inUserEmail: document.getElementById('inUserEmail'),
    inUserRole: document.getElementById('inUserRole'),
    btnSave: document.getElementById('btnSaveUser'),
    toastContainer: document.getElementById('toastContainer')
};

const utils = {
    escapeHTML: (str) => {
        if (!str) return '';
        return str.toString().replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    },
    showToast: (message, type = 'success') => {
        if (!DOM.toastContainer) return;
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const toast = document.createElement('div');
        toast.className = `${bgColor} text-white px-4 py-2 rounded shadow-lg transform transition-all duration-300 translate-y-0 opacity-100 mb-2 font-bold text-sm`;
        toast.innerHTML = type === 'success' ? `✔ ${message}` : `⚠ ${message}`;
        DOM.toastContainer.appendChild(toast);
        setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-2'); setTimeout(() => toast.remove(), 300); }, 3000);
    },
    toggleButtonLoading: (btn, isLoading, text) => {
        if (!btn) return;
        btn.disabled = isLoading;
        btn.innerHTML = isLoading ? `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Đang xử lý...` : text;
    }
};

// ĐÃ FIX: CHÈN LÍNH GÁC BẢO MẬT
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.checkAdminAuth === 'function') {
        const user = await window.checkAdminAuth();
        if (!user) return; 
    }

    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                state.searchQuery = e.target.value.trim();
                state.currentPage = 1;
                fetchData();
            }
        });
    }
    switchTab('staff'); 
});

window.switchTab = function(tab) {
    state.currentTab = tab;
    state.currentPage = 1;
    state.searchQuery = '';
    if(DOM.searchInput) DOM.searchInput.value = '';

    if (tab === 'staff') {
        DOM.btnTabStaff.className = "pb-3 px-2 font-bold text-sm text-gray-900 border-b-2 border-gray-900 transition";
        DOM.btnTabCustomer.className = "pb-3 px-2 font-bold text-sm text-gray-500 hover:text-gray-800 transition border-b-2 border-transparent";
        DOM.btnAddStaff.classList.remove('hidden'); 
        
        DOM.thead.innerHTML = `
            <th class="p-4 text-center w-12">#</th>
            <th class="p-4 w-12"></th>
            <th class="p-4">Email Đăng nhập</th>
            <th class="p-4 w-40">Quyền (Role)</th>
            <th class="p-4 w-32">Ngày cấp</th>
            <th class="p-4 text-center w-24">Thao tác</th>
        `;
    } else {
        DOM.btnTabCustomer.className = "pb-3 px-2 font-bold text-sm text-gray-900 border-b-2 border-gray-900 transition";
        DOM.btnTabStaff.className = "pb-3 px-2 font-bold text-sm text-gray-500 hover:text-gray-800 transition border-b-2 border-transparent";
        DOM.btnAddStaff.classList.add('hidden'); 
        
        DOM.thead.innerHTML = `
            <th class="p-4 text-center w-12">#</th>
            <th class="p-4 w-12"></th>
            <th class="p-4">Khách hàng</th>
            <th class="p-4 w-48">Liên hệ</th>
            <th class="p-4 w-32">Ngày ĐK</th>
            <th class="p-4 text-center w-24">Xóa KH</th>
        `;
    }
    fetchData();
};

async function fetchData() {
    if (DOM.tbody) DOM.tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10"><div class="w-8 h-8 border-4 border-kn-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div><span class="text-gray-500 font-bold">Đang tải dữ liệu...</span></td></tr>`;

    const from = (state.currentPage - 1) * state.itemsPerPage;
    const to = from + state.itemsPerPage - 1;
    const targetTable = state.currentTab === 'staff' ? 'admins' : 'profiles';

    try {
        // ĐÃ FIX: THÊM window.
        let query = window.supabaseClient
            .from(targetTable)
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (state.searchQuery) {
            if (state.currentTab === 'staff') {
                query = query.ilike('email', `%${state.searchQuery}%`);
            } else {
                query = query.or(`email.ilike.%${state.searchQuery}%,full_name.ilike.%${state.searchQuery}%,phone.ilike.%${state.searchQuery}%`);
            }
        }

        const { data, count, error } = await query;
        if (error) throw error;

        state.users = data || [];
        state.totalItems = count || 0;

        renderUsers();
        renderPagination();

    } catch (error) {
        if (DOM.tbody) DOM.tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-red-500 font-bold">Lỗi: ${error.message}</td></tr>`;
    }
}

function renderUsers() {
    if (!DOM.tbody) return;
    if (state.users.length === 0) {
        DOM.tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-400 font-medium">Chưa có dữ liệu!</td></tr>`;
        return;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;
    
    DOM.tbody.innerHTML = state.users.map((item, index) => {
        const safeEmail = utils.escapeHTML(item.email);
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '-';
        
        if (state.currentTab === 'staff') {
            let roleBadge = '';
            if (item.role === 'admin') roleBadge = '<span class="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Admin</span>';
            else if (item.role === 'editor') roleBadge = '<span class="bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Editor</span>';
            else roleBadge = '<span class="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Sales</span>';

            return `
                <tr class="border-b border-gray-100 hover:bg-gray-50 transition group">
                    <td class="p-4 text-center font-bold text-gray-400 text-xs">${from + index + 1}</td>
                    <td class="p-4 text-center">
                        <div class="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">${safeEmail.charAt(0)}</div>
                    </td>
                    <td class="p-4 font-bold text-gray-900 text-sm">${safeEmail}</td>
                    <td class="p-4">${roleBadge}</td>
                    <td class="p-4 text-xs text-gray-500 font-medium">${dateStr}</td>
                    <td class="p-4 text-center space-x-1">
                        <button onclick="showUserModal('${item.id}')" class="p-1.5 text-gray-400 hover:text-kn-blue hover:bg-blue-50 rounded-lg transition"><svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                        <button onclick="deleteStaff('${item.id}', '${safeEmail}')" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </td>
                </tr>
            `;
        } else {
            const safeName = utils.escapeHTML(item.full_name || 'Chưa cập nhật');
            const safePhone = utils.escapeHTML(item.phone || '-');
            const safeCompany = utils.escapeHTML(item.company || 'Cá nhân');

            return `
                <tr class="border-b border-gray-100 hover:bg-gray-50 transition group">
                    <td class="p-4 text-center font-bold text-gray-400 text-xs">${from + index + 1}</td>
                    <td class="p-4 text-center">
                        <div class="w-8 h-8 rounded-full bg-kn-blue text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">${safeEmail.charAt(0)}</div>
                    </td>
                    <td class="p-4">
                        <p class="font-bold text-gray-900 text-sm">${safeEmail}</p>
                        <p class="text-[10px] text-gray-500 bg-gray-100 inline-block px-1.5 py-0.5 rounded border border-gray-200 mt-1 font-bold">${safeCompany}</p>
                    </td>
                    <td class="p-4">
                        <p class="text-xs text-gray-800 font-bold">${safeName}</p>
                        <p class="text-xs text-gray-500 mt-0.5">SĐT: ${safePhone}</p>
                    </td>
                    <td class="p-4 text-xs text-gray-500 font-medium">${dateStr}</td>
                    <td class="p-4 text-center">
                        <button onclick="deleteCustomer('${item.id}', '${safeEmail}')" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Xóa tài khoản khách"><svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </td>
                </tr>
            `;
        }
    }).join('');
}

window.showUserModal = function(id = null) {
    DOM.form.reset(); DOM.inUserId.value = '';
    if (id) {
        const user = state.users.find(u => u.id == id);
        if (user) {
            DOM.inUserId.value = user.id;
            DOM.inUserEmail.value = user.email;
            DOM.inUserRole.value = user.role;
            DOM.modalTitle.innerText = "Sửa Quyền Tài khoản";
        }
    } else DOM.modalTitle.innerText = "Cấp Quyền Mới";
    DOM.modal.classList.remove('hidden');
};

window.closeUserModal = function() { DOM.modal.classList.add('hidden'); };

window.saveUser = async function() {
    const email = DOM.inUserEmail.value.trim().toLowerCase();
    const role = DOM.inUserRole.value;
    const editId = DOM.inUserId.value;

    if (!email) return utils.showToast("Vui lòng nhập Email!", "error");
    utils.toggleButtonLoading(DOM.btnSave, true, "Đang xử lý...");

    try {
        if (!editId) {
            // ĐÃ FIX: THÊM window.
            const { data: existUser } = await window.supabaseClient.from('admins').select('id').eq('email', email).maybeSingle();
            if (existUser) return utils.showToast(`Email ${email} đã được cấp quyền!`, "error");
        }

        const payload = { email: email, role: role };
        if (editId) {
            // ĐÃ FIX: THÊM window.
            const { error } = await window.supabaseClient.from('admins').update(payload).eq('id', editId);
            if (error) throw error;
            utils.showToast("Cập nhật quyền thành công!", "success");
        } else {
            // ĐÃ FIX: THÊM window.
            const { error } = await window.supabaseClient.from('admins').insert([payload]);
            if (error) throw error;
            utils.showToast("Đã cấp quyền tài khoản mới!", "success");
        }
        closeUserModal(); fetchData();

    } catch (error) { utils.showToast(`Lỗi: ${error.message}`, "error"); } 
    finally { utils.toggleButtonLoading(DOM.btnSave, false, "Lưu Quyền"); }
};

window.deleteStaff = async function(id, email) {
    if (!confirm(`Thu hồi toàn bộ quyền quản trị của nhân viên: ${email}?`)) return;
    try {
        // ĐÃ FIX: THÊM window.
        const { error } = await window.supabaseClient.from('admins').delete().eq('id', id);
        if (error) throw error;
        utils.showToast("Đã thu hồi quyền thành công!", "success");
        if (state.users.length === 1 && state.currentPage > 1) state.currentPage--;
        fetchData();
    } catch (error) { utils.showToast(`Lỗi thu hồi: ${error.message}`, "error"); }
};

window.deleteCustomer = async function(id, email) {
    if (!confirm(`Xóa vĩnh viễn hồ sơ khách hàng: ${email}?\n(Lưu ý: Thao tác này chỉ xóa hồ sơ hiển thị, tài khoản gốc vẫn còn trong Auth)`)) return;
    try {
        // ĐÃ FIX: THÊM window.
        const { error } = await window.supabaseClient.from('profiles').delete().eq('id', id);
        if (error) throw error;
        utils.showToast("Đã xóa hồ sơ khách hàng!", "success");
        if (state.users.length === 1 && state.currentPage > 1) state.currentPage--;
        fetchData();
    } catch (error) { utils.showToast(`Lỗi xóa: ${error.message}`, "error"); }
};

function renderPagination() {
    if (!DOM.pagination) return;
    DOM.pagination.innerHTML = '';
    const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
    if (totalPages <= 1) return;

    let html = `<button onclick="state.currentPage--; fetchData()" ${state.currentPage === 1 ? 'disabled class="px-3 py-1.5 rounded-lg text-gray-400 bg-transparent"' : 'class="px-3 py-1.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm font-bold"'}>&laquo; Prev</button><div class="flex space-x-1">`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button onclick="state.currentPage = ${i}; fetchData()" class="px-3 py-1.5 rounded-lg font-bold shadow-sm transition ${i === state.currentPage ? 'bg-gray-900 text-white border border-gray-900' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}">${i}</button>`;
    }
    html += `</div><button onclick="state.currentPage++; fetchData()" ${state.currentPage === totalPages ? 'disabled class="px-3 py-1.5 rounded-lg text-gray-400 bg-transparent"' : 'class="px-3 py-1.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm font-bold"'}>Next &raquo;</button>`;
    DOM.pagination.innerHTML = html;
}