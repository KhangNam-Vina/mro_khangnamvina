// ========================================================
// FILE: assets/js/users/my-orders-detail.js
// CHI TIẾT ĐƠN HÀNG MUA TRỰC TIẾP
// ĐÃ ĐỒNG BỘ SIZE & TÍNH NĂNG HỦY ĐƠN
// ========================================================

let currentUser = null;
let currentOrderItems = [];

const ORDER_DETAIL_IMAGE_CDN_BASE =
    "https://mrokhangnam-image.khangnamvn.workers.dev";

function buildOrderDetailImageUrl(imagePath) {

    if (!imagePath) {
        return "../assets/images/no-image.png";
    }

    const cleanPath =
        String(imagePath).trim();

    if (!cleanPath) {
        return "../assets/images/no-image.png";
    }

    // Giữ an toàn nếu dữ liệu cũ còn URL đầy đủ
    if (/^https?:\/\//i.test(cleanPath)) {
        return cleanPath;
    }

    return `${ORDER_DETAIL_IMAGE_CDN_BASE}/${cleanPath.replace(/^\/+/, "")}`;
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        currentUser = await getCurrentCustomer();
        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }
        await loadSidebarProfile();
        await loadOrderDetail();
    } catch (error) {
        console.error("Lỗi khởi tạo:", error);
        showOrderError("Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau.");
    }
});

async function getCurrentCustomer() {
    if (typeof window.checkCustomerAuth === "function") {
        const user = await window.checkCustomerAuth();
        if (user) return user;
    }
    if (!window.supabaseClient) return null;
    const { data, error } = await window.supabaseClient.auth.getSession();
    if (error) throw error;
    return data?.session?.user || null;
}

async function loadSidebarProfile() {
    const nameEl = document.getElementById("sidebarUserName");
    const emailEl = document.getElementById("sidebarUserEmail");
    const avatarEl = document.getElementById("userAvatarInitials");

    let fullName = currentUser.user_metadata?.full_name || "Khách hàng";

    try {
        const { data: profile, error } = await window.supabaseClient
            .from("profiles").select("full_name").eq("id", currentUser.id).maybeSingle();

        if (!error && profile?.full_name) fullName = profile.full_name;
    } catch (error) {}

    if (nameEl) nameEl.textContent = fullName;
    if (emailEl) emailEl.textContent = currentUser.email || "-";
    if (avatarEl && fullName !== "Khách hàng") {
        const parts = fullName.trim().split(/\s+/);
        let initials = parts[0]?.charAt(0)?.toUpperCase() || "";
        if (parts.length > 1) initials += parts[parts.length - 1].charAt(0).toUpperCase();
        avatarEl.textContent = initials || "KN";
    }
}

async function loadOrderDetail() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("id");

    if (!orderId) {
        showOrderError("Không tìm thấy mã đơn hàng trong đường dẫn.");
        return;
    }

    const { data: order, error: orderError } = await window.supabaseClient
        .from("orders").select("*").eq("id", orderId).eq("user_id", currentUser.id).maybeSingle();

    if (orderError) throw orderError;
    if (!order) {
        showOrderError("Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này.");
        return;
    }

    const { data: items, error: itemsError } = await window.supabaseClient
        .from("order_items")
        .select(`*, products (image_path)`)
        .eq("order_id", orderId)
        .order("id", { ascending: true });

    if (itemsError) throw itemsError;

    currentOrderItems = items || [];
    renderOrderDetail(order, currentOrderItems);

    const loading = document.getElementById("orderLoading");
    const content = document.getElementById("orderDetailContent");
    if (loading) loading.classList.add("d-none");
    if (content) content.classList.remove("d-none");
}

function renderOrderDetail(order, items) {
    const orderCode = document.getElementById("orderCode");
    const orderDate = document.getElementById("orderDate");
    const statusText = document.getElementById("orderStatusText");
    const statusBadge = document.getElementById("orderStatus");
    const itemCount = document.getElementById("orderItemCount");
    const total = document.getElementById("orderTotal");
    const totalBottom = document.getElementById("orderTotalBottom");

    if (orderCode) orderCode.textContent = order.order_code || "-";
    if (orderDate) orderDate.textContent = formatDateTime(order.created_at);

    const status = getOrderStatusMeta(order.status);
    if (statusBadge) {
        statusBadge.textContent = status.label;
        statusBadge.className = `status-badge ${status.class}`;
    }
    if (statusText) statusText.textContent = status.label;
    if (itemCount) itemCount.textContent = formatItemCount(items);

    const orderTotal = Number(order.total ?? calculateItemsTotal(items));
    if (total) total.textContent = formatCurrency(orderTotal);
    if (totalBottom) totalBottom.textContent = formatCurrency(orderTotal);

    const shipName = document.getElementById("shippingName");
    const shipPhone = document.getElementById("shippingPhone");
    const shipAddress = document.getElementById("shippingAddress");
    const shipNote = document.getElementById("shippingNote");

    if (shipName) shipName.textContent = order.shipping_name || "-";
    if (shipPhone) shipPhone.textContent = order.shipping_phone || "-";
    if (shipAddress) shipAddress.textContent = order.shipping_address || "-";
    if (shipNote) shipNote.textContent = order.notes || order.note || "Không có ghi chú";

    window.currentOrderItems = items;
    renderOrderItems(items);

    // HIỆN / ẨN NÚT HỦY ĐƠN DỰA THEO TRẠNG THÁI
    const btnCancel = document.getElementById("btnCancelOrder");
    if (btnCancel) {
        if (order.status === 'pending') {
            btnCancel.classList.remove("d-none");
        } else {
            btnCancel.classList.add("d-none");
        }
    }
}

function renderOrderItems(items) {
    const body = document.getElementById("orderItemsBody");
    if (!body) return;

    if (!items || !items.length) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: #6b7280; font-style: italic;">Đơn hàng chưa có sản phẩm nào.</td></tr>`;
        return;
    }

    body.innerHTML = items.map(item => {
        let rawName = item.product_name || item.name || "Sản phẩm";
        let cleanName = String(rawName).replace(/\s*\(Size:\s*[^)]+\)/i, '').trim();

        const productName = escapeHtml(cleanName);
        const sku = escapeHtml(item.sku || "N/A");
        const size = escapeHtml(String(item.size ?? "-"));
        const quantity = escapeHtml(String(item.quantity ?? item.qty ?? 0));
        const unitPrice = Number(item.unit_price ?? item.price ?? 0);
        const subtotal = Number(item.subtotal ?? item.total ?? (unitPrice * Number(quantity)));
        const imageUrl =
    buildOrderDetailImageUrl(
        item.products?.image_path
    );

        return `
            <tr style="border-bottom: 1px solid #f3f4f6; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f9fafb'" onmouseout="this.style.backgroundColor='transparent'">
                <td style="padding: 16px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 56px; height: 56px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 4px; flex-shrink: 0;">
                            <img src="${escapeHtml(imageUrl)}" alt="${productName}" style="width:100%; height:100%; object-fit:contain;" onerror="this.onerror=null; this.src='../assets/images/world mark.png';">
                        </div>
                        <div>
                            <strong style="color: #00479b; display: block; font-size: 14px;">${productName}</strong>
                        </div>
                    </div>
                </td>
                <td style="padding: 16px;">
                    <span style="font-family: monospace; font-weight: 900; color: #4b5563; font-size: 12px; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${sku}</span>
                </td>
                <td style="padding: 16px; text-align: center; font-weight: 800; color: #374151; font-size: 13px;">
                    ${size}
                </td>
                <td style="padding: 16px; text-align: right; color: #374151; font-size: 13px; font-weight: 600;">
                    ${formatCurrency(unitPrice)}
                </td>
                <td style="padding: 16px; text-align: center; font-weight: 900; color: #1f2937; font-size: 14px;">
                    ${quantity}
                </td>
                <td style="padding: 16px; text-align: right; color: #ff5e00; font-weight: 900; font-size: 15px;">
                    ${formatCurrency(subtotal)}
                </td>
            </tr>
        `;
    }).join("");
}

window.reorderCurrentItems = function () {
    if (!window.currentOrderItems || window.currentOrderItems.length === 0) {
        alert("Đơn hàng chưa có sản phẩm để mua lại.");
        return;
    }

    let shoppingCart = JSON.parse(localStorage.getItem("mro_shopping_cart")) || [];

    window.currentOrderItems.forEach(item => {
        const productId = item.product_id || item.id || null;
        const size = item.size ? String(item.size).trim() : null;
        const qty = Math.max(1, Number(item.quantity ?? item.qty ?? 1) || 1);

        let rawName = item.product_name || item.name || "Sản phẩm";
        let cleanName = String(rawName).replace(/\s*\(Size:\s*[^)]+\)/i, '').trim();

        const existingIndex = shoppingCart.findIndex(cartItem => {
            const cartProductId = cartItem.id || cartItem.product_id || null;
            const cartSize = cartItem.size ? String(cartItem.size).trim() : null;
            return (String(cartProductId) === String(productId) && cartSize === size);
        });

        if (existingIndex > -1) {
            shoppingCart[existingIndex].qty = (Number(shoppingCart[existingIndex].qty) || 0) + qty;
        } else {
            shoppingCart.push({
                id: productId,
                sku: item.sku || "",
                name: cleanName,
                price: Number(item.unit_price || item.price || 0),
                image: buildOrderDetailImageUrl(
    item.products?.image_path
),
                unit: item.unit || "Cái",
                size: size,
                qty: qty
            });
        }
    });

    localStorage.setItem("mro_shopping_cart", JSON.stringify(shoppingCart));

    if (window.utils && typeof window.utils.showToast === "function") {
        window.utils.showToast("Đã thêm sản phẩm vào giỏ hàng!", "success");
        setTimeout(() => { window.location.href = "cart.html"; }, 1000);
    } else {
        alert("Đã thêm sản phẩm vào giỏ hàng!");
        window.location.href = "cart.html";
    }
};

window.handleLogout = async function () {
    try {
        await window.supabaseClient.auth.signOut();
        localStorage.removeItem("kn_customer_session");
        window.location.href = "login.html";
    } catch (error) {}
};
window.handleCustomerLogout = window.handleLogout;

// ========================================================
// HỦY ĐƠN HÀNG (CHỈ DÀNH CHO B2C LÚC PENDING)
// ========================================================
window.cancelOrder = async function() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("id");

    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.")) {
        return;
    }

    try {
        const { error } = await window.supabaseClient
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", orderId)
            .eq("user_id", currentUser.id);

        if (error) throw error;

        if (window.utils && typeof window.utils.showToast === "function") {
            window.utils.showToast("Hủy đơn hàng thành công!", "success");
        } else {
            alert("Hủy đơn hàng thành công!");
        }

        // Delay 1 giây rồi F5 lại trang để hiển thị Badge "Đã hủy"
        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        console.error("Lỗi hủy đơn:", error);
        alert("Có lỗi xảy ra khi hủy đơn. Vui lòng liên hệ Hotline Khang Nam.");
    }
};

function getOrderStatusMeta(status) {
    const map = {
        pending: { label: "Chờ xử lý", class: "status-pending" },
        processing: { label: "Đang xử lý", class: "status-processing" },
        shipping: { label: "Đang giao", class: "status-shipping" },
        completed: { label: "Hoàn thành", class: "status-completed" },
        cancelled: { label: "Đã hủy", class: "status-cancelled" }
    };
    return map[status] || { label: status || "Không xác định", class: "status-pending" };
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN");
}

function formatCurrency(value) { return new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + " đ"; }
function formatItemCount(items) { return `${items.length} sản phẩm`; }
function calculateItemsTotal(items) {
    return items.reduce((total, item) => total + (Number(item.subtotal) || (Number(item.unit_price) || 0) * (Number(item.quantity) || 0)), 0);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function showOrderError(message) {
    const loading = document.getElementById("orderLoading");
    const errorBox = document.getElementById("orderError");
    const content = document.getElementById("orderDetailContent");
    const errorText = document.getElementById("orderErrorMessage");

    if (loading) loading.classList.add("d-none");
    if (content) content.classList.add("d-none");
    if (errorBox) errorBox.classList.remove("d-none");
    if (errorText) errorText.textContent = message;
}