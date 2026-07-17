// ========================================================
// FILE: assets/js/admin-contacts.js
// QUẢN LÝ LIÊN HỆ - CHUẨN SENIOR REFACTORED
// ========================================================

// 1. STATE & DOM CACHE
const state = {
    contacts: [],
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    searchQuery: '',
    dateFilter: 'all' // all, today, 7days, 30days
};

const DOM = {
    tbody: document.getElementById('contactTableBody'),
    pagination: document.getElementById('paginationContainer'),
    searchInput: document.getElementById('searchContactInput'),
    filterSelect: document.getElementById('filterDateSelect'),
    toastContainer: document.getElementById('toastContainer')
};

// 2. UTILS (Công cụ hỗ trợ: Tránh XSS XSS, Toast, Copy)
const utils = {
    // 🛡️ Chống hack XSS tuyệt đối theo lời Senior
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
        toast.className = `${bgColor} text-white px-4 py-2 rounded shadow-lg transform transition-all duration-300 translate-y-0 opacity-100 mb-2 font-bold text-sm`;
        toast.innerHTML = type === 'success' ? `✔ ${message}` : `⚠ ${message}`;
        
        DOM.toastContainer.appendChild(toast);
        
        // Tự động biến mất sau 3 giây
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// 3. INIT (Khởi tạo)
window.addEventListener('load', () => {
    // Sự kiện Tìm kiếm
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                state.searchQuery = e.target.value.trim();
                state.currentPage = 1;
                fetchContacts();
            }
        });
    }

    // Sự kiện Lọc thời gian
    if (DOM.filterSelect) {
        DOM.filterSelect.addEventListener('change', (e) => {
            state.dateFilter = e.target.value;
            state.currentPage = 1;
            fetchContacts();
        });
    }

    fetchContacts();
});

// 4. CORE FUNCTIONS
async function fetchContacts() {
    if (DOM.tbody) {
        DOM.tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10"><div class="w-8 h-8 border-4 border-kn-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div><span class="text-gray-500 font-bold">Đang tải dữ liệu...</span></td></tr>`;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;
    const to = from + state.itemsPerPage - 1;

    try {
        let query = supabaseClient
            .from('contacts')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false }) // Sort chuẩn theo DB
            .range(from, to);

        // Áp dụng Tìm kiếm
        if (state.searchQuery) {
            query = query.or(`name.ilike.%${state.searchQuery}%,email.ilike.%${state.searchQuery}%,phone.ilike.%${state.searchQuery}%,company.ilike.%${state.searchQuery}%`);
        }

        // Áp dụng Lọc ngày
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

async function deleteContact(id) {
    if (!confirm("Xóa vĩnh viễn liên hệ này khỏi hệ thống?")) return;
    
    // Disable nút khi xóa để tránh Spam click
    const btn = document.getElementById(`btnDelete_${id}`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Đang xóa...';
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    try {
        const { error } = await supabaseClient.from('contacts').delete().eq('id', id);
        if (error) throw error;
        
        utils.showToast("Xóa thành công", "success");
        
        if (state.contacts.length === 1 && state.currentPage > 1) {
            state.currentPage--;
        }
        fetchContacts(); // Không reload trang

    } catch (error) {
        utils.showToast("Lỗi xóa: " + error.message, "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Xóa';
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

// 5. RENDER UI
function renderContacts() {
    if (!DOM.tbody) return;
    
    if (state.contacts.length === 0) {
        renderEmpty();
        return;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;
    
    DOM.tbody.innerHTML = state.contacts.map((item, index) => {
        const safeName = utils.escapeHTML(item.name);
        const safeEmail = utils.escapeHTML(item.email);
        const safePhone = utils.escapeHTML(item.phone);
        const safeCompany = utils.escapeHTML(item.company || 'Cá nhân');
        const safeMessage = utils.escapeHTML(item.message);
        const dateStr = utils.formatDate(item.created_at);

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                <td class="p-4 text-center font-bold text-gray-500">${from + index + 1}</td>
                <td class="p-4">
                    <p class="font-bold text-gray-800">${safeName}</p>
                    <p class="text-xs text-gray-500 bg-gray-200 inline-block px-2 py-0.5 rounded mt-1">${safeCompany}</p>
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
                    <button id="btnDelete_${item.id}" onclick="deleteContact('${item.id}')" class="text-xs bg-red-100 text-red-700 px-4 py-2 rounded font-bold hover:bg-red-200 transition shadow-sm">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderEmpty() {
    DOM.tbody.innerHTML = `<tr><td colspan="6" class="text-center py-16 text-gray-500"><div class="text-4xl mb-3">📭</div><div class="font-bold">Không tìm thấy liên hệ nào!</div></td></tr>`;
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
    if (state.currentPage > 1) {
        html += `<button onclick="state.currentPage--; fetchContacts()" class="px-3 py-1 bg-white border rounded text-sm text-gray-600 hover:bg-gray-50">&laquo;</button>`;
    }
    for (let i = 1; i <= totalPages; i++) {
        if (i === state.currentPage) {
            html += `<button class="px-3 py-1 bg-kn-orange text-white border border-kn-orange rounded text-sm font-bold">${i}</button>`;
        } else {
            html += `<button onclick="state.currentPage = ${i}; fetchContacts()" class="px-3 py-1 bg-white border rounded text-sm text-kn-blue hover:bg-blue-50">${i}</button>`;
        }
    }
    if (state.currentPage < totalPages) {
        html += `<button onclick="state.currentPage++; fetchContacts()" class="px-3 py-1 bg-white border rounded text-sm text-gray-600 hover:bg-gray-50">&raquo;</button>`;
    }
    DOM.pagination.innerHTML = html;
}