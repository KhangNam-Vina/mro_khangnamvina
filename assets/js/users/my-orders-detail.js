// ========================================================
// FILE: assets/js/users/my-orders-detail.js
// CHI TIẾT ĐƠN HÀNG MUA TRỰC TIẾP
// ========================================================

let currentUser = null;
let currentOrderItems = []; // Biến toàn cục lưu danh sách sp để dùng cho tính năng Mua lại

document.addEventListener('DOMContentLoaded', async () => {
    try {
        currentUser = await getCurrentCustomer();

        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }

        await loadSidebarProfile();
        await loadOrderDetail();
    } catch (error) {
        console.error('Lỗi khởi tạo trang chi tiết đơn hàng:', error);
        showOrderError('Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau.');
    }
});

// ----------------------------------------------------
// 1. KIỂM TRA USER ĐĂNG NHẬP
// ----------------------------------------------------
async function getCurrentCustomer() {
    if (typeof window.checkCustomerAuth === 'function') {
        const user = await window.checkCustomerAuth();

        if (user) {
            return user;
        }
    }

    if (!window.supabaseClient) {
        return null;
    }

    const { data, error } =
        await window.supabaseClient.auth.getSession();

    if (error) {
        throw error;
    }

    return data?.session?.user || null;
}

// ----------------------------------------------------
// 2. LOAD PROFILE SIDEBAR
// ----------------------------------------------------
async function loadSidebarProfile() {
    const nameEl = document.getElementById('sidebarUserName');
    const emailEl = document.getElementById('sidebarUserEmail');
    const avatarEl = document.getElementById('userAvatarInitials');

    let fullName =
        currentUser.user_metadata?.full_name ||
        'Khách hàng';

    try {
        const { data: profile, error } =
            await window.supabaseClient
                .from('profiles')
                .select('full_name')
                .eq('id', currentUser.id)
                .maybeSingle();

        if (!error && profile?.full_name) {
            fullName = profile.full_name;
        }
    } catch (error) {
        console.error(
            'Lỗi tải profile:',
            error
        );
    }

    if (nameEl) {
        nameEl.textContent = fullName;
    }

    if (emailEl) {
        emailEl.textContent =
            currentUser.email || '-';
    }

    if (
        avatarEl &&
        fullName !== 'Khách hàng'
    ) {
        const parts = fullName
            .trim()
            .split(/\s+/);

        let initials =
            parts[0]?.charAt(0)?.toUpperCase() || '';

        if (parts.length > 1) {
            initials +=
                parts[parts.length - 1]
                    .charAt(0)
                    .toUpperCase();
        }

        avatarEl.textContent =
            initials || 'KN';
    }
}

// ----------------------------------------------------
// 3. LOAD ORDER DETAIL
// ----------------------------------------------------
async function loadOrderDetail() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const orderId =
        params.get('id');

    if (!orderId) {
        showOrderError(
            'Không tìm thấy mã đơn hàng trong đường dẫn.'
        );

        return;
    }

    // -----------------------------------------------
    // LOAD ORDER
    // -----------------------------------------------
    const { data: order, error: orderError } =
        await window.supabaseClient
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .eq('user_id', currentUser.id)
            .maybeSingle();

    if (orderError) {
        throw orderError;
    }

    if (!order) {
        showOrderError(
            'Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này.'
        );

        return;
    }

    // -----------------------------------------------
    // LOAD ORDER ITEMS
    // -----------------------------------------------
    const { data: items, error: itemsError } =
        await window.supabaseClient
            .from('order_items')
            .select('*, products(image_url)')
            .eq('order_id', order.id);

    if (itemsError) {
        throw itemsError;
    }

    renderOrder(
        order,
        items || []
    );
}

// ----------------------------------------------------
// 4. RENDER ORDER
// ----------------------------------------------------
function renderOrder(order, items) {
    document
        .getElementById('orderLoading')
        ?.classList.add('d-none');

    document
        .getElementById('orderError')
        ?.classList.add('d-none');

    document
        .getElementById('orderDetailContent')
        ?.classList.remove('d-none');

    const status =
        getOrderStatusConfig(
            order.status
        );

    // Order code
    const orderCodeEl =
        document.getElementById(
            'orderCode'
        );

    if (orderCodeEl) {
        orderCodeEl.textContent =
            order.order_code || 'N/A';
    }

    // Date
    const orderDateEl =
        document.getElementById(
            'orderDate'
        );

    if (orderDateEl) {
        orderDateEl.textContent =
            formatDateTime(
                order.created_at
            );
    }

    // Status badge
    const statusBadge =
        document.getElementById(
            'orderStatus'
        );

    if (statusBadge) {
        statusBadge.textContent =
            status.label;

        statusBadge.className =
            `status-badge ${status.class}`;
    }

    // Status text
    const statusTextEl =
        document.getElementById(
            'orderStatusText'
        );

    if (statusTextEl) {
        statusTextEl.textContent =
            status.label;
    }

    // Item count
    const itemCountEl =
        document.getElementById(
            'orderItemCount'
        );

    if (itemCountEl) {
        itemCountEl.textContent =
            formatItemCount(items);
    }

    // Total
    const total =
        Number(
            order.total ??
            calculateItemsTotal(items)
        );

    const totalEl =
        document.getElementById(
            'orderTotal'
        );

    if (totalEl) {
        totalEl.textContent =
            formatCurrency(total);
    }

    const totalBottomEl =
        document.getElementById(
            'orderTotalBottom'
        );

    if (totalBottomEl) {
        totalBottomEl.textContent =
            formatCurrency(total);
    }

    // -----------------------------------------------
    // HIỂN THỊ THÔNG TIN GIAO HÀNG
    // -----------------------------------------------
    const shipNameEl = document.getElementById('shippingName');
    const shipPhoneEl = document.getElementById('shippingPhone');
    const shipAddressEl = document.getElementById('shippingAddress');
    const shipNoteEl = document.getElementById('shippingNote');

    if (shipNameEl) shipNameEl.textContent = order.shipping_name || '-';
    if (shipPhoneEl) shipPhoneEl.textContent = order.shipping_phone || '-';
    if (shipAddressEl) shipAddressEl.textContent = order.shipping_address || '-';
    if (shipNoteEl) shipNoteEl.textContent = order.notes || order.note || 'Không có ghi chú';

    // Lưu danh sách items vào biến toàn cục để dùng cho nút Mua Lại
    window.currentOrderItems = items;

    renderOrderItems(items);
}

// ----------------------------------------------------
// 5. RENDER ORDER ITEMS (ĐÃ FIX LỖI HIỂN THỊ ẢNH)
// ----------------------------------------------------
function renderOrderItems(items) {
    const body =
        document.getElementById(
            'orderItemsBody'
        );

    if (!body) {
        return;
    }

    if (!items.length) {
        body.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="order-items-empty"
                >
                    Đơn hàng chưa có sản phẩm nào.
                </td>
            </tr>
        `;

        return;
    }

    body.innerHTML =
        items.map(item => {
            const productName =
                item.product_name ||
                item.name ||
                'Sản phẩm';

            const sku =
                item.sku ||
                'N/A';

            const quantity =
                Number(
                    item.quantity ??
                    item.qty ??
                    0
                );

            const unitPrice =
                Number(
                    item.unit_price ??
                    item.price ??
                    0
                );

            const subtotal =
                Number(
                    item.subtotal ??
                    item.total ??
                    (
                        unitPrice *
                        quantity
                    )
                );

            // XỬ LÝ LẤY LINK ẢNH TỪ DATABASE
            const imageUrl = 
               item.products?.image_url || // Ưu tiên 1: Lấy ảnh gốc tươi rói từ bảng Products
                item.image_url ||           // Ưu tiên 2: Lấy từ Order Items (nếu có lưu)
                item.image ||
                '../assets/images/no-image.png';

            return `
                <tr>
                    <td>
                        <div class="order-item-product">

                            <!-- ĐÃ FIX VÒNG LẶP ONERROR VÀ ĐỔI ẢNH DỰ PHÒNG CHUẨN -->
                            <div
                                class="order-item-icon"
                                aria-hidden="true"
                                style="overflow: hidden; background: #fff;"
                            >
                                <img 
                                    src="${escapeHtml(imageUrl)}" 
                                    alt="${escapeHtml(productName)}"
                                    style="width: 100%; height: 100%; object-fit: contain;"
                                    onerror="this.onerror=null; this.src='../assets/images/world mark.png';"
                                >
                            </div>

                            <div class="order-item-product-info">
                                <strong class="order-item-name">
                                    ${escapeHtml(productName)}
                                </strong>
                            </div>

                        </div>
                    </td>

                    <td>
                        <span class="order-item-sku">
                            ${escapeHtml(sku)}
                        </span>
                    </td>

                    <td class="text-center">
                        ${formatNumber(quantity)}
                    </td>

                    <td class="text-right">
                        ${formatCurrency(unitPrice)}
                    </td>

                    <td class="text-right order-item-subtotal">
                        ${formatCurrency(subtotal)}
                    </td>
                </tr>
            `;
        }).join('');
}

// ----------------------------------------------------
// 6. ORDER STATUS
// ----------------------------------------------------
function getOrderStatusConfig(status) {
    const configs = {
        pending: {
            label: 'Chờ xác nhận',
            class: 'status-pending'
        },

        processing: {
            label: 'Đang xử lý',
            class: 'status-processing'
        },

        shipping: {
            label: 'Đang giao hàng',
            class: 'status-shipping'
        },

        completed: {
            label: 'Đã hoàn thành',
            class: 'status-completed'
        },

        cancelled: {
            label: 'Đã hủy',
            class: 'status-cancelled'
        }
    };

    return (
        configs[status] || {
            label: 'Không xác định',
            class: 'status-pending'
        }
    );
}

// ----------------------------------------------------
// 7. FORMAT DATE
// ----------------------------------------------------
function formatDateTime(value) {
    if (!value) {
        return '-';
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '-';
    }

    return date.toLocaleDateString(
        'vi-VN',
        {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }
    );
}

// ----------------------------------------------------
// 8. FORMAT CURRENCY
// ----------------------------------------------------
function formatCurrency(value) {
    return `${new Intl.NumberFormat(
        'vi-VN'
    ).format(
        Number(value || 0)
    )} đ`;
}

// ----------------------------------------------------
// 9. FORMAT NUMBER
// ----------------------------------------------------
function formatNumber(value) {
    return new Intl.NumberFormat(
        'vi-VN'
    ).format(
        Number(value || 0)
    );
}

// ----------------------------------------------------
// 10. FORMAT ITEM COUNT
// ----------------------------------------------------
function formatItemCount(items) {
    const count =
        items.reduce(
            (sum, item) => {
                return (
                    sum +
                    Number(
                        item.quantity ??
                        item.qty ??
                        0
                    )
                );
            },
            0
        );

    return `${formatNumber(
        count
    )} sản phẩm`;
}

// ----------------------------------------------------
// 11. CALCULATE TOTAL
// ----------------------------------------------------
function calculateItemsTotal(items) {
    return items.reduce(
        (sum, item) => {
            const quantity =
                Number(
                    item.quantity ??
                    item.qty ??
                    0
                );

            const unitPrice =
                Number(
                    item.unit_price ??
                    item.price ??
                    0
                );

            const subtotal =
                Number(
                    item.subtotal ??
                    item.total ??
                    (
                        unitPrice *
                        quantity
                    )
                );

            return sum + subtotal;
        },
        0
    );
}

// ----------------------------------------------------
// 12. ESCAPE HTML
// ----------------------------------------------------
function escapeHtml(value) {
    return String(
        value ?? ''
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );
}

// ----------------------------------------------------
// 13. ERROR STATE
// ----------------------------------------------------
function showOrderError(message) {
    document
        .getElementById('orderLoading')
        ?.classList.add('d-none');

    document
        .getElementById('orderDetailContent')
        ?.classList.add('d-none');

    document
        .getElementById('orderError')
        ?.classList.remove('d-none');

    const messageEl =
        document.getElementById(
            'orderErrorMessage'
        );

    if (messageEl) {
        messageEl.textContent =
            message;
    }
}

// ----------------------------------------------------
// 14. CHỨC NĂNG MUA LẠI ĐƠN HÀNG (REORDER)
// ----------------------------------------------------
window.reorderCurrentItems = function() {
    if (!window.currentOrderItems || window.currentOrderItems.length === 0) return;
    
    // Mở giỏ hàng Shopping Cart hiện tại
    let shoppingCart = JSON.parse(localStorage.getItem('mro_shopping_cart')) || [];
    
    window.currentOrderItems.forEach(item => {
        const sku = item.sku;
        const existingIndex = shoppingCart.findIndex(cartItem => cartItem.sku === sku);
        const qty = Number(item.quantity ?? item.qty ?? 1);
        
        if (existingIndex > -1) {
            shoppingCart[existingIndex].qty += qty;
        } else {
            shoppingCart.push({
                id: item.product_id, 
                sku: item.sku,
                name: item.product_name || item.name,
                price: item.unit_price || item.price,
                image: item.image_url || '../assets/images/no-image.png',
                unit: item.unit || 'Cái',
                qty: qty
            });
        }
    });
    
    // Lưu lại và quăng qua trang Cart
    localStorage.setItem('mro_shopping_cart', JSON.stringify(shoppingCart));
    
    if (window.utils && window.utils.showToast) {
        window.utils.showToast('Đã thêm sản phẩm vào giỏ hàng!', 'success');
        setTimeout(() => { window.location.href = 'cart.html'; }, 1000);
    } else {
        alert('Đã thêm tất cả sản phẩm vào giỏ mua hàng trực tiếp!');
        window.location.href = 'cart.html';
    }
}