// ========================================================
// FILE: assets/js/users/my-orders.js
// QUẢN LÝ LỊCH SỬ ĐƠN HÀNG MUA TRỰC TIẾP
// ========================================================

let currentUser = null;
let allOrdersData = []; // Biến toàn cục để lưu Data phục vụ Search

document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof window.checkCustomerAuth === 'function') {
            currentUser = await window.checkCustomerAuth();
        } else if (window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getSession();
            currentUser = data?.session?.user;
        }

        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }

        let fullName = currentUser.user_metadata?.full_name || 'Khách hàng';
        try {
            const { data: profile } = await window.supabaseClient
                .from('profiles')
                .select('full_name')
                .eq('id', currentUser.id)
                .maybeSingle();
            
            if (profile && profile.full_name) {
                fullName = profile.full_name;
            }
        } catch (e) {
            console.error("Lỗi kéo profile:", e);
        }

        const nameEl = document.getElementById('sidebarUserName');
        const emailEl = document.getElementById('sidebarUserEmail');
        const avatarEl = document.getElementById('userAvatarInitials');

        if (nameEl) nameEl.innerText = fullName;
        if (emailEl) emailEl.innerText = currentUser.email;

        if (avatarEl && fullName !== 'Khách hàng') {
            const nameParts = fullName.trim().split(' ');
            let initials = nameParts[0].charAt(0).toUpperCase();
            if (nameParts.length > 1) {
                initials += nameParts[nameParts.length - 1].charAt(0).toUpperCase();
            }
            avatarEl.innerText = initials;
        }

        // Tải danh sách đơn hàng
        await loadMyOrders();
        
        // Kích hoạt thanh tìm kiếm
        setupSearchLogic();

    } catch (err) {
        console.error("Lỗi xác thực:", err);
        window.location.href = 'login.html';
    }
});

// Hàm gọi Database
async function loadMyOrders() {
    const loadingUI = document.getElementById('ordersLoading');
    const emptyUI = document.getElementById('emptyOrdersState');
    const tableWrapper = document.getElementById('ordersTableWrapper');

    try {
        const { data: orders, error } = await window.supabaseClient
            .from('orders')
            .select('id, order_code, created_at, total, status')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        loadingUI.classList.add('d-none');

        if (!orders || orders.length === 0) {
            emptyUI.classList.remove('d-none');
            return;
        }

        tableWrapper.classList.remove('d-none');
        allOrdersData = orders; // Lưu vào mảng để Search
        
        // Render toàn bộ Data lần đầu
        renderOrdersTable(allOrdersData);

    } catch (err) {
        console.error("Lỗi tải đơn hàng:", err);
        loadingUI.innerHTML = `<p class="state-desc" style="color:red;">Lỗi kết nối dữ liệu: ${err.message}</p>`;
    }
}

// Hàm Vẽ bảng (Được tái sử dụng cho cả Load & Search)
function renderOrdersTable(dataList) {
    const tableBody = document.getElementById('ordersTableBody');
    const countUI = document.getElementById('totalOrdersCount');
    
    if (countUI) {
        countUI.innerText = `${dataList.length} đơn hàng`;
    }

    if (!dataList || dataList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 30px; color: #6b7280;">Không tìm thấy đơn hàng nào khớp với từ khóa.</td></tr>`;
        return;
    }

    let html = '';
    dataList.forEach(order => {
        const dateObj = new Date(order.created_at);
        const dateStr = dateObj.toLocaleDateString('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        const totalFormat = new Intl.NumberFormat('vi-VN').format(order.total) + ' đ';
        const statusConfig = getOrderStatusConfig(order.status);

        html += `
            <tr>
                <td class="order-code-text">${escapeHTML(order.order_code || 'N/A')}</td>
                <td>${dateStr}</td>
                <td class="text-right order-total-text">${totalFormat}</td>
                <td class="text-center">
                    <span class="status-badge ${statusConfig.class}">
                        ${statusConfig.label}
                    </span>
                </td>
                <td class="text-center">
                    <a href="my-orders-detail.html?id=${order.id}" class="btn-outline-blue">
                        Xem chi tiết
                    </a>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

// Hàm khởi tạo Logic Tìm kiếm
function setupSearchLogic() {
    const searchInput = document.getElementById('searchOrderInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (event) => {
        const keyword = String(event.target.value || "").toLowerCase().trim();
        
        if (!keyword) {
            renderOrdersTable(allOrdersData);
            return;
        }

        // Lọc theo Mã Đơn Hàng
        const filtered = allOrdersData.filter(order => {
            const code = String(order.order_code || "").toLowerCase();
            return code.includes(keyword);
        });

        renderOrdersTable(filtered);
    });
}

function getOrderStatusConfig(status) {
    const configs = {
        'pending': { label: 'Chờ xác nhận', class: 'status-pending' },
        'processing': { label: 'Đang xử lý', class: 'status-processing' },
        'shipping': { label: 'Đang giao hàng', class: 'status-shipping' },
        'completed': { label: 'Đã hoàn thành', class: 'status-completed' },
        'cancelled': { label: 'Đã hủy', class: 'status-cancelled' }
    };
    return configs[status] || { label: 'Không xác định', class: 'status-pending' };
}

function escapeHTML(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}