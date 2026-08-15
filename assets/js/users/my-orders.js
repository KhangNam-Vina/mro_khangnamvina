// ========================================================
// FILE: assets/js/users/my-orders.js
// QUẢN LÝ LỊCH SỬ ĐƠN HÀNG MUA TRỰC TIẾP
// ========================================================

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra lính gác (Auth)
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

        // Kéo thông tin từ bảng profiles để đồng bộ Tên và Avatar
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

        // Cập nhật thông tin lên Sidebar
        const nameEl = document.getElementById('sidebarUserName');
        const emailEl = document.getElementById('sidebarUserEmail');
        const avatarEl = document.getElementById('userAvatarInitials');

        if (nameEl) nameEl.innerText = fullName;
        if (emailEl) emailEl.innerText = currentUser.email;

        // Tạo chữ viết tắt cho Avatar (Ví dụ: Tiến Nguyễn -> TN)
        if (avatarEl && fullName !== 'Khách hàng') {
            const nameParts = fullName.trim().split(' ');
            let initials = nameParts[0].charAt(0).toUpperCase();
            if (nameParts.length > 1) {
                initials += nameParts[nameParts.length - 1].charAt(0).toUpperCase();
            }
            avatarEl.innerText = initials;
        }

        // 2. Tải danh sách đơn hàng
        await loadMyOrders();

    } catch (err) {
        console.error("Lỗi xác thực:", err);
        window.location.href = 'login.html';
    }
});

// Hàm kéo dữ liệu từ Supabase bảng `orders`
async function loadMyOrders() {
    const loadingUI = document.getElementById('ordersLoading');
    const emptyUI = document.getElementById('emptyOrdersState');
    const tableWrapper = document.getElementById('ordersTableWrapper');
    const tableBody = document.getElementById('ordersTableBody');
    const countUI = document.getElementById('totalOrdersCount');

    try {
        const { data: orders, error } = await window.supabaseClient
            .from('orders')
            .select('id, order_code, created_at, total, status')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Tắt vòng quay loading
        loadingUI.classList.add('d-none');

        // Check nếu không có đơn nào
        if (!orders || orders.length === 0) {
            emptyUI.classList.remove('d-none');
            return;
        }

        // Hiện bảng và cập nhật số lượng
        tableWrapper.classList.remove('d-none');
        countUI.innerText = `${orders.length} đơn hàng`;

        // Render từng dòng
        let html = '';
        orders.forEach(order => {
            const dateObj = new Date(order.created_at);
            const dateStr = dateObj.toLocaleDateString('vi-VN', {
                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
            });
            const totalFormat = new Intl.NumberFormat('vi-VN').format(order.total) + ' đ';
            const statusConfig = getOrderStatusConfig(order.status);

            html += `
                <tr>
                    <td class="order-code-text">${order.order_code || 'N/A'}</td>
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

    } catch (err) {
        console.error("Lỗi tải đơn hàng:", err);
        loadingUI.innerHTML = `<p class="state-desc" style="color:red;">Lỗi kết nối dữ liệu: ${err.message}</p>`;
    }
}

// Cấu hình nhãn trạng thái tĩnh
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