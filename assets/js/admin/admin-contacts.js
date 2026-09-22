// ========================================================
// FILE: assets/js/admin/admin-contacts.js
// QUẢN LÝ LIÊN HỆ - TÍCH HỢP TAB TRẠNG THÁI, CONFIG & THỐNG KÊ
// ========================================================

// 1. STATE & DOM CACHE
const state = {
    contacts: [],
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    searchQuery: '',
    dateFilter: 'all',
    statusFilter: 'all', // Biến lưu trạng thái Tab
    isConfigLoaded: false
};

const DOM = {
    tbody: document.getElementById('contactTableBody'),
    pagination: document.getElementById('paginationContainer'),
    searchInput: document.getElementById('searchContactInput'),
    filterSelect: document.getElementById('filterDateSelect'),
    btnRefresh: document.getElementById('btnRefresh'),
    toastContainer: document.getElementById('toastContainer'),
    
    statTotal: document.getElementById('statTotalContacts'),
    statPending: document.getElementById('statPendingContacts'),
    statProcessed: document.getElementById('statProcessedContacts'),
    statToday: document.getElementById('statTodayContacts')
};

// 2. UTILS
const utils = {
    escapeHTML: (str) => {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
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
    bindEvents();
    fetchInboxData();
});

// ==========================================
// HÀM CLICK CHỌN TAB TRẠNG THÁI
// ==========================================
window.filterContactStatus = function(status, btn) {
    // Trả các nút về xám
    document.querySelectorAll('.contact-status-btn').forEach(b => {
        b.classList.remove('bg-white', 'text-kn-blue', 'shadow-sm');
        b.classList.add('text-gray-500', 'hover:text-gray-800', 'hover:bg-white/50');
    });
    // Sáng nút được click
    if(btn) {
        btn.classList.remove('text-gray-500', 'hover:text-gray-800', 'hover:bg-white/50');
        btn.classList.add('bg-white', 'text-kn-blue', 'shadow-sm');
    }
    state.statusFilter = status;
    state.currentPage = 1;
    fetchContacts();
};

function bindEvents() {
    if (DOM.searchInput) {
        let searchTimer;
        DOM.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                state.searchQuery = e.target.value.trim();
                state.currentPage = 1;
                fetchContacts();
            }, 300);
        });
    }

    if (DOM.filterSelect) {
        DOM.filterSelect.addEventListener('change', (e) => {
            state.dateFilter = e.target.value;
            state.currentPage = 1;
            fetchContacts();
        });
    }

    if (DOM.btnRefresh) {
        DOM.btnRefresh.addEventListener('click', async () => {
            const originalHtml = DOM.btnRefresh.innerHTML;
            DOM.btnRefresh.disabled = true;
            DOM.btnRefresh.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Đang tải...`;
            
            if (!document.getElementById('tabInbox').classList.contains('hidden')) {
                // Reset filter
                state.searchQuery = '';
                state.dateFilter = 'all';
                state.statusFilter = 'all';
                state.currentPage = 1;
                if(DOM.searchInput) DOM.searchInput.value = '';
                if(DOM.filterSelect) DOM.filterSelect.value = 'all';
                
                // Trả Tabs về "Tất cả"
                document.querySelectorAll('.contact-status-btn').forEach((b, idx) => {
                    if (idx === 0) {
                        b.classList.add('bg-white', 'text-kn-blue', 'shadow-sm');
                        b.classList.remove('text-gray-500', 'hover:text-gray-800', 'hover:bg-white/50');
                    } else {
                        b.classList.remove('bg-white', 'text-kn-blue', 'shadow-sm');
                        b.classList.add('text-gray-500', 'hover:text-gray-800', 'hover:bg-white/50');
                    }
                });
                
                await fetchInboxData();
            } else {
                await loadContactConfig();
            }
            
            DOM.btnRefresh.disabled = false;
            DOM.btnRefresh.innerHTML = originalHtml;
        });
    }
}

window.switchTab = function(tabId) {
    const btnInbox = document.getElementById('tabInboxBtn');
    const btnConfig = document.getElementById('tabConfigBtn');
    const contentInbox = document.getElementById('tabInbox');
    const contentConfig = document.getElementById('tabConfig');

    const activeClass = "py-3 text-kn-blue border-b-2 border-kn-blue font-bold text-sm transition";
    const inactiveClass = "py-3 text-gray-500 border-b-2 border-transparent hover:text-kn-blue font-bold text-sm transition";

    if (tabId === 'inbox') {
        btnInbox.className = activeClass;
        btnConfig.className = inactiveClass;
        contentInbox.classList.remove('hidden');
        contentConfig.classList.add('hidden');
    } else {
        btnConfig.className = activeClass;
        btnInbox.className = inactiveClass;
        contentConfig.classList.remove('hidden');
        contentInbox.classList.add('hidden');
        if (!state.isConfigLoaded) loadContactConfig();
    }
}

// ==========================================
// PHẦN 1: LOGIC QUẢN LÝ INBOX & KPI
// ==========================================
async function fetchInboxData() {
    await Promise.all([
        fetchContacts(),
        loadContactKPIs()
    ]);
}

async function loadContactKPIs() {
    if (!window.supabaseClient) return;
    try {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);

        const [totalRes, processedRes, todayRes] = await Promise.all([
            window.supabaseClient.from('contacts').select('id', { count: 'exact', head: true }),
            window.supabaseClient.from('contacts').select('id', { count: 'exact', head: true }).eq('status', 'processed'),
            window.supabaseClient.from('contacts').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString())
        ]);

        const total = totalRes.count || 0;
        const processed = processedRes.count || 0;
        const pending = total - processed;
        const today = todayRes.count || 0;

        if (DOM.statTotal) DOM.statTotal.textContent = total;
        if (DOM.statProcessed) DOM.statProcessed.textContent = processed;
        if (DOM.statPending) DOM.statPending.textContent = pending;
        if (DOM.statToday) DOM.statToday.textContent = today;
    } catch (error) {
        console.error("Lỗi tải KPI liên hệ:", error);
    }
}

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

        // LỌC THEO TABS TRẠNG THÁI
        if (state.statusFilter === 'processed') {
            query = query.eq('status', 'processed');
        } else if (state.statusFilter === 'pending') {
            // Chờ xử lý là những contact rỗng status hoặc ghi rõ pending
            query = query.or('status.eq.pending,status.is.null'); 
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
        
        // Nếu đang ở Tab "Chờ xử lý", sau khi xử lý xong thì xóa luôn khỏi list cho sạch
        if (state.statusFilter === 'pending') {
            state.contacts = state.contacts.filter(c => c.id != id);
            state.totalItems--;
        } else {
            const index = state.contacts.findIndex(c => c.id == id);
            if(index !== -1) state.contacts[index].status = 'processed';
        }
        
        renderContacts();
        loadContactKPIs();

    } catch (error) {
        utils.showToast("Lỗi cập nhật: " + error.message, "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Xong';
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
        
        await fetchInboxData();
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
        
        const isProcessed = item.status === 'processed';
        const statusBadge = isProcessed 
            ? `<span class="inline-block mt-2 px-2.5 py-1 bg-green-100 text-green-700 text-[10px] rounded-full border border-green-200 font-bold uppercase tracking-wider">Đã xử lý</span>`
            : `<span class="inline-block mt-2 px-2.5 py-1 bg-orange-100 text-orange-700 text-[10px] rounded-full border border-orange-200 font-bold uppercase tracking-wider">Chờ xử lý</span>`;

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                <td class="p-4 text-center font-bold text-gray-400 text-xs border-r border-gray-50">${from + index + 1}</td>
                <td class="p-4">
                    <p class="font-black text-gray-800">${safeName}</p>
                    <p class="text-[11px] text-gray-500 bg-gray-200 inline-block px-2 py-0.5 rounded mt-1">${safeCompany}</p>
                    <br>${statusBadge}
                </td>
                <td class="p-4 text-sm font-mono text-gray-600">
                    <div class="flex items-center space-x-2 group">
                        <a href="mailto:${safeEmail}" class="hover:underline line-clamp-1">${safeEmail}</a>
                        <button onclick="utils.copyText('${item.email}')" class="text-gray-500 bg-gray-200 hover:bg-gray-300 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition" title="Copy Email">Copy</button>
                    </div>
                    <div class="flex items-center space-x-2 mt-1 group">
                        <a href="tel:${safePhone}" class="hover:text-kn-blue">${safePhone}</a>
                        <button onclick="utils.copyText('${item.phone}')" class="text-gray-500 bg-gray-200 hover:bg-gray-300 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition" title="Copy SĐT">Copy</button>
                    </div>
                </td>
                <td class="p-4 text-sm text-gray-600 break-words max-w-xs leading-relaxed whitespace-normal">${safeMessage}</td>
                <td class="p-4 text-[11px] text-gray-500 font-medium whitespace-nowrap">${dateStr}</td> 
                <td class="p-4 text-right align-middle">
                    <div class="flex items-center justify-end gap-1.5">
                        ${!isProcessed ? `<button id="btnProcess_${item.id}" onclick="markAsProcessed('${item.id}')" class="px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition font-bold text-[11px] uppercase whitespace-nowrap">Đã xử lý</button>` : ''}
                        <button id="btnDelete_${item.id}" onclick="deleteContact('${item.id}')" class="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition font-bold text-[11px] uppercase whitespace-nowrap">Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderEmpty() { 
    DOM.tbody.innerHTML = `<tr><td colspan="6" class="text-center py-16 text-gray-500"><div class="font-bold">Không tìm thấy liên hệ nào!</div><div class="text-xs text-gray-400 mt-1">Thử thay đổi từ khóa, khoảng thời gian hoặc trạng thái.</div></td></tr>`; 
}
function renderError(msg) { 
    DOM.tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-red-500 font-bold">Lỗi: ${msg}</td></tr>`; 
}

function renderPagination() {
    if (!DOM.pagination) return;
    DOM.pagination.innerHTML = '';
    const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
    if (totalPages <= 1) return;

    let html = '';
    if (state.currentPage > 1) html += `<button onclick="state.currentPage--; fetchContacts()" class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50">&laquo;</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === state.currentPage) html += `<button class="px-3 py-1.5 bg-kn-blue text-white border border-kn-blue rounded-lg text-sm font-bold">${i}</button>`;
        else html += `<button onclick="state.currentPage = ${i}; fetchContacts()" class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">${i}</button>`;
    }
    if (state.currentPage < totalPages) html += `<button onclick="state.currentPage++; fetchContacts()" class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50">&raquo;</button>`;
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
            
            const proofs = data.proofs || [];
            renderProofs(proofs);
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

    const proofInputs = document.querySelectorAll('.proof-input');
    const proofsArray = Array.from(proofInputs).map(input => input.value.trim()).filter(val => val !== '');

    const payload = {
        id: 1,
        hotline: document.getElementById('cfgHotline').value.trim(),
        email_sales: document.getElementById('cfgEmail').value.trim(),
        address: document.getElementById('cfgAddress').value.trim(),
        support_time: document.getElementById('cfgSupportTime').value.trim(),
        map_iframe_url: document.getElementById('cfgMapUrl').value.trim(),
        proofs: proofsArray, 
        updated_at: new Date().toISOString()
    };

    try {
        const { error } = await window.supabaseClient.from('contact_page').upsert(payload);
        if (error) throw error;
        utils.showToast("Lưu cấu hình thành công!", "success");
    } catch (err) {
        utils.showToast("Lỗi khi lưu: " + err.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Lưu Thay Đổi";
    }
}

function renderProofs(proofsArray) {
    const container = document.getElementById('proofsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    if (proofsArray.length === 0) checkEmptyProofs();
    else proofsArray.forEach(proof => addProofRow(proof));
}

window.addProofRow = function(value = '') {
    const container = document.getElementById('proofsContainer');
    const emptyMsg = document.getElementById('emptyProofMsg');
    if (emptyMsg) emptyMsg.classList.add('hidden');

    const row = document.createElement('div');
    row.className = 'flex items-center space-x-3 proof-row';
    
    row.innerHTML = `
        <span class="bg-green-100 text-green-700 p-1.5 rounded-full cursor-move">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </span>
        <input type="text" value="${utils.escapeHTML(value)}" class="proof-input flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kn-blue outline-none text-sm" placeholder="VD: Hợp tác 1000+ nhà máy FDI...">
        <button type="button" onclick="this.parentElement.remove(); checkEmptyProofs();" class="text-red-500 text-xs font-bold hover:bg-red-50 px-3 py-2 rounded-lg transition" title="Xóa dòng này">
            XÓA
        </button>
    `;
    container.appendChild(row);
}

window.checkEmptyProofs = function() {
    const container = document.getElementById('proofsContainer');
    const emptyMsg = document.getElementById('emptyProofMsg');
    if (container && container.children.length === 0 && emptyMsg) {
        emptyMsg.classList.remove('hidden');
    }
}