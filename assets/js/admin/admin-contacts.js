// ========================================================
// FILE: assets/js/admin-contacts.js
// QUẢN LÝ LIÊN HỆ - TÍCH HỢP TAB, CONFIG & TRẠNG THÁI
// ========================================================

// 1. STATE & DOM CACHE
const state = {
    contacts: [],
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    searchQuery: '',
    dateFilter: 'all',
    isConfigLoaded: false
};

const DOM = {
    tbody: document.getElementById('contactTableBody'),
    pagination: document.getElementById('paginationContainer'),
    searchInput: document.getElementById('searchContactInput'),
    filterSelect: document.getElementById('filterDateSelect'),
    toastContainer: document.getElementById('toastContainer')
};

// 2. UTILS
const utils = {
    escapeHTML: (str) => {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    },
    formatDate: (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    },
    copyText: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            utils.showToast('Đã copy: ' + text, 'success');
        } catch (err) {
            utils.showToast('Lỗi copy!', 'error');
        }
    },
    showToast: (message, type = 'success') => {
        if (!DOM.toastContainer) return;
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const toast = document.createElement('div');
        toast.className = `${bgColor} text-white px-4 py-2 rounded shadow-lg transform transition-all duration-300 translate-y-0 opacity-100 mb-2 font-bold text-sm z-50`;
        toast.innerHTML = type === 'success' ? `✔ ${message}` : `⚠ ${message}`;
        DOM.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// 3. INIT & TAB SWITCHER
window.addEventListener('load', () => {
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                state.searchQuery = e.target.value.trim();
                state.currentPage = 1;
                fetchContacts();
            }
        });
    }
    if (DOM.filterSelect) {
        DOM.filterSelect.addEventListener('change', (e) => {
            state.dateFilter = e.target.value;
            state.currentPage = 1;
            fetchContacts();
        });
    }
    fetchContacts();
});

window.switchTab = function(tabId) {
    const btnInbox = document.getElementById('tabInboxBtn');
    const btnConfig = document.getElementById('tabConfigBtn');
    const contentInbox = document.getElementById('tabInbox');
    const contentConfig = document.getElementById('tabConfig');
    const headerFilters = document.getElementById('headerFilters');

    const activeClass = "py-3 text-kn-blue border-b-2 border-kn-blue font-bold text-sm transition";
    const inactiveClass = "py-3 text-gray-500 border-b-2 border-transparent hover:text-kn-blue font-bold text-sm transition";

    if (tabId === 'inbox') {
        btnInbox.className = activeClass;
        btnConfig.className = inactiveClass;
        contentInbox.classList.remove('hidden');
        contentConfig.classList.add('hidden');
        if (headerFilters) {
            headerFilters.style.opacity = '1';
            headerFilters.style.pointerEvents = 'auto';
        }
    } else {
        btnConfig.className = activeClass;
        btnInbox.className = inactiveClass;
        contentConfig.classList.remove('hidden');
        contentInbox.classList.add('hidden');
        if (headerFilters) {
            headerFilters.style.opacity = '0';
            headerFilters.style.pointerEvents = 'none';
        }
        if (!state.isConfigLoaded) loadContactConfig();
    }
}

// ==========================================
// PHẦN 1: LOGIC QUẢN LÝ INBOX
// ==========================================
async function fetchContacts() {
    if (DOM.tbody) {
        DOM.tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10"><div class="w-8 h-8 border-4 border-kn-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div><span class="text-gray-500 font-bold">Đang tải dữ liệu...</span></td></tr>`;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;
    const to = from + state.itemsPerPage - 1;

    try {
        let query = window.supabaseClient
            .from('contacts')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (state.searchQuery) query = query.or(`name.ilike.%${state.searchQuery}%,email.ilike.%${state.searchQuery}%,phone.ilike.%${state.searchQuery}%,company.ilike.%${state.searchQuery}%`);
        
        if (state.dateFilter !== 'all') {
            const now = new Date();
            let pastDate = new Date();
            if (state.dateFilter === 'today') pastDate.setHours(0,0,0,0);
            else if (state.dateFilter === '7days') pastDate.setDate(now.getDate() - 7);
            else if (state.dateFilter === '30days') pastDate.setDate(now.getDate() - 30);
            query = query.gte('created_at', pastDate.toISOString());
        }

        const { data, count, error } = await query;
        if (error) throw error;

        state.contacts = data || [];
        state.totalItems = count || 0;
        renderContacts();
        renderPagination();

    } catch (error) {
        renderError(error.message);
    }
}

// HÀM MỚI: ĐÁNH DẤU ĐÃ XỬ LÝ
window.markAsProcessed = async function(id) {
    if (!confirm("Đánh dấu liên hệ này đã được xử lý xong?")) return;
    
    const btn = document.getElementById(`btnProcess_${id}`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '...';
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    try {
        const { error } = await window.supabaseClient
            .from('contacts')
            .update({ status: 'processed' })
            .eq('id', id);

        if (error) throw error;
        
        utils.showToast("Cập nhật trạng thái thành công!", "success");
        
        // Cập nhật lại UI ngay lập tức không cần fetch lại database
        const index = state.contacts.findIndex(c => c.id == id);
        if(index !== -1) {
            state.contacts[index].status = 'processed';
            renderContacts();
        }

    } catch (error) {
        utils.showToast("Lỗi cập nhật: " + error.message, "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '✔ Xong';
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

window.deleteContact = async function(id) {
    if (!confirm("Xóa vĩnh viễn liên hệ này khỏi hệ thống?")) return;
    const btn = document.getElementById(`btnDelete_${id}`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Đang xóa...';
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    try {
        const { error } = await window.supabaseClient.from('contacts').delete().eq('id', id);
        if (error) throw error;
        utils.showToast("Xóa thành công", "success");
        if (state.contacts.length === 1 && state.currentPage > 1) state.currentPage--;
        fetchContacts();
    } catch (error) {
        utils.showToast("Lỗi xóa: " + error.message, "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Xóa';
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

function renderContacts() {
    if (!DOM.tbody) return;
    if (state.contacts.length === 0) return renderEmpty();
    const from = (state.currentPage - 1) * state.itemsPerPage;
    
    DOM.tbody.innerHTML = state.contacts.map((item, index) => {
        const safeName = utils.escapeHTML(item.name);
        const safeEmail = utils.escapeHTML(item.email);
        const safePhone = utils.escapeHTML(item.phone);
        const safeCompany = utils.escapeHTML(item.company || 'Cá nhân');
        const safeMessage = utils.escapeHTML(item.message);
        const dateStr = utils.formatDate(item.created_at);
        
        // Logic kiểm tra trạng thái
        const isProcessed = item.status === 'processed';
        const statusBadge = isProcessed 
            ? `<span class="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded border border-green-200 font-bold uppercase tracking-wider">✔ Đã xử lý</span>`
            : `<span class="inline-block mt-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] rounded border border-orange-200 font-bold uppercase tracking-wider">⏳ Chờ xử lý</span>`;

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                <td class="p-4 text-center font-bold text-gray-500">${from + index + 1}</td>
                <td class="p-4">
                    <p class="font-bold text-gray-800">${safeName}</p>
                    <p class="text-xs text-gray-500 bg-gray-200 inline-block px-2 py-0.5 rounded mt-1">${safeCompany}</p>
                    <br>${statusBadge}
                </td>
                <td class="p-4 text-sm">
                    <div class="flex items-center space-x-2 group">
                        <a href="mailto:${safeEmail}" class="text-kn-blue hover:underline line-clamp-1">${safeEmail}</a>
                        <button onclick="utils.copyText('${item.email}')" class="text-gray-300 hover:text-kn-orange opacity-0 group-hover:opacity-100 transition" title="Copy Email">📋</button>
                    </div>
                    <div class="flex items-center space-x-2 mt-1 group">
                        <a href="tel:${safePhone}" class="text-gray-600 font-bold hover:text-kn-blue">${safePhone}</a>
                        <button onclick="utils.copyText('${item.phone}')" class="text-gray-300 hover:text-kn-orange opacity-0 group-hover:opacity-100 transition" title="Copy SĐT">📋</button>
                    </div>
                </td>
                <td class="p-4 text-sm text-gray-600 break-words max-w-xs leading-relaxed">${safeMessage}</td>
                <td class="p-4 text-xs text-gray-500 font-medium">${dateStr}</td>
                <td class="p-4 text-right">
                    <div class="flex justify-end space-x-2">
                        ${!isProcessed ? `<button id="btnProcess_${item.id}" onclick="markAsProcessed('${item.id}')" class="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded font-bold hover:bg-green-200 transition shadow-sm whitespace-nowrap">✔ Xong</button>` : ''}
                        <button id="btnDelete_${item.id}" onclick="deleteContact('${item.id}')" class="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded font-bold hover:bg-red-200 transition shadow-sm whitespace-nowrap">🗑 Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderEmpty() { DOM.tbody.innerHTML = `<tr><td colspan="6" class="text-center py-16 text-gray-500"><div class="text-4xl mb-3">📭</div><div class="font-bold">Không tìm thấy liên hệ nào!</div></td></tr>`; }
function renderError(msg) { DOM.tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-red-500 font-bold">Lỗi: ${msg}</td></tr>`; }

function renderPagination() {
    if (!DOM.pagination) return;
    DOM.pagination.innerHTML = '';
    const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
    if (totalPages <= 1) return;

    let html = '';
    if (state.currentPage > 1) html += `<button onclick="state.currentPage--; fetchContacts()" class="px-3 py-1 bg-white border rounded text-sm text-gray-600 hover:bg-gray-50">&laquo;</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === state.currentPage) html += `<button class="px-3 py-1 bg-kn-orange text-white border border-kn-orange rounded text-sm font-bold">${i}</button>`;
        else html += `<button onclick="state.currentPage = ${i}; fetchContacts()" class="px-3 py-1 bg-white border rounded text-sm text-kn-blue hover:bg-blue-50">${i}</button>`;
    }
    if (state.currentPage < totalPages) html += `<button onclick="state.currentPage++; fetchContacts()" class="px-3 py-1 bg-white border rounded text-sm text-gray-600 hover:bg-gray-50">&raquo;</button>`;
    DOM.pagination.innerHTML = html;
}

// ==========================================
// PHẦN 2: LOGIC QUẢN LÝ CONFIG (Tab 2)
// ==========================================
async function loadContactConfig() {
    try {
        const { data, error } = await window.supabaseClient
            .from('contact_page')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        if (error) throw error;
        
        if (data) {
            document.getElementById('cfgHotline').value = data.hotline || '';
            document.getElementById('cfgEmail').value = data.email_sales || '';
            document.getElementById('cfgAddress').value = data.address || '';
            document.getElementById('cfgSupportTime').value = data.support_time || '';
            document.getElementById('cfgMapUrl').value = data.map_iframe_url || '';
            document.getElementById('cfgProof1').value = data.proof_1 || '';
            document.getElementById('cfgProof2').value = data.proof_2 || '';
            document.getElementById('cfgProof3').value = data.proof_3 || '';
            document.getElementById('cfgProof4').value = data.proof_4 || '';
        }
        state.isConfigLoaded = true;
    } catch (err) {
        utils.showToast("Lỗi tải cấu hình: " + err.message, "error");
    }
}

window.saveContactConfig = async function() {
    const btn = document.getElementById('btnSaveConfig');
    btn.disabled = true;
    btn.innerHTML = "Đang lưu...";

    const payload = {
        id: 1,
        hotline: document.getElementById('cfgHotline').value.trim(),
        email_sales: document.getElementById('cfgEmail').value.trim(),
        address: document.getElementById('cfgAddress').value.trim(),
        support_time: document.getElementById('cfgSupportTime').value.trim(),
        map_iframe_url: document.getElementById('cfgMapUrl').value.trim(),
        proof_1: document.getElementById('cfgProof1').value.trim(),
        proof_2: document.getElementById('cfgProof2').value.trim(),
        proof_3: document.getElementById('cfgProof3').value.trim(),
        proof_4: document.getElementById('cfgProof4').value.trim(),
        updated_at: new Date().toISOString()
    };

    try {
        const { error } = await window.supabaseClient
            .from('contact_page')
            .upsert(payload);

        if (error) throw error;
        utils.showToast("Lưu cấu hình thành công!", "success");
    } catch (err) {
        utils.showToast("Lỗi khi lưu: " + err.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Lưu Thay Đổi";
    }
}