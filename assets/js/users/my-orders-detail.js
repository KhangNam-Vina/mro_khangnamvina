// ========================================================
// FILE: assets/js/users/my-orders-detail.js
// CHI TIẾT ĐƠN HÀNG MUA TRỰC TIẾP
// ========================================================

let currentUser = null;
let currentOrderItems = [];
let currentOrder = null;

// ========================================================
// CÁC HÀM TIỆN ÍCH
// ========================================================
function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
}

function formatCurrency(value) { 
    return new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + " đ"; 
}

function formatItemCount(items) { 
    return `${Array.isArray(items) ? items.length : 0} sản phẩm`; 
}

function calculateItemsTotal(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => {
        const subtotal = Number(item.subtotal);
        if (Number.isFinite(subtotal)) return total + subtotal;
        return total + ((Number(item.unit_price) || 0) * (Number(item.quantity) || 0));
    }, 0);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function showOrderError(message) {
    document.getElementById("orderLoading")?.classList.add("d-none");
    document.getElementById("orderDetailContent")?.classList.add("d-none");
    document.getElementById("orderError")?.classList.remove("d-none");
    const errorText = document.getElementById("orderErrorMessage");
    if (errorText) errorText.textContent = message;
}

function getOrderStatusMeta(status) {
    const safeStatus = String(status || "").toLowerCase().trim();
    if (safeStatus.includes("pending")) return { label: "Chờ xác nhận", class: "status-pending" };
    if (safeStatus.includes("confirmed") || safeStatus.includes("processing")) return { label: "Đã xác nhận", class: "status-processing" };
    if (safeStatus.includes("shipping") || safeStatus.includes("delivered") || safeStatus.includes("shipped") || safeStatus.includes("completed")) return { label: "Đã giao", class: "status-completed" };
    if (safeStatus.includes("cancel") || safeStatus.includes("hủy")) return { label: "Đã hủy", class: "status-cancelled" };
    return { label: status || "Chờ xác nhận", class: "status-pending" };
}

// ========================================================
// LUỒNG KHỞI TẠO (INIT)
// ========================================================
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
    let fullName = currentUser?.user_metadata?.full_name || "Khách hàng";

    try {
        const { data: profile } = await window.supabaseClient.from("profiles").select("full_name").eq("id", currentUser.id).maybeSingle();
        if (profile?.full_name) fullName = profile.full_name;
    } catch (error) { console.error(error); }

    if (nameEl) nameEl.textContent = fullName;
    if (emailEl) emailEl.textContent = currentUser?.email || "-";
    if (avatarEl && fullName && fullName !== "Khách hàng") {
        const parts = fullName.trim().split(/\s+/);
        let initials = parts[0]?.charAt(0)?.toUpperCase() || "";
        if (parts.length > 1) initials += parts[parts.length - 1]?.charAt(0)?.toUpperCase() || "";
        avatarEl.textContent = initials || "KN";
    }
}

async function loadOrderDetail() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("id");

    if (!orderId) { showOrderError("Không tìm thấy mã đơn hàng."); return; }

    const { data: order, error: orderError } = await window.supabaseClient
        .from("orders")
        .select(`id, user_id, order_code, status, subtotal, shipping_fee, total, shipping_name, shipping_phone, shipping_address, note, created_at, payment_method`)
        .eq("id", orderId)
        .eq("user_id", currentUser.id)
        .maybeSingle();

    if (orderError) throw orderError;
    if (!order) { showOrderError("Đơn hàng không tồn tại hoặc bạn không có quyền xem."); return; }
    currentOrder = order;

    const { data: items, error: itemsError } = await window.supabaseClient
        .from("order_items")
        .select(`id, order_id, product_id, product_name, sku, unit_price, quantity, subtotal, size`)
        .eq("order_id", orderId)
        .order("id", { ascending: true });

    if (itemsError) throw itemsError;
    currentOrderItems = items || [];
    window.currentOrderItems = currentOrderItems;
    window.currentOrder = currentOrder;

    renderOrderDetail(currentOrder, currentOrderItems);

    document.getElementById("orderLoading")?.classList.add("d-none");
    document.getElementById("orderDetailContent")?.classList.remove("d-none");
}

function renderOrderDetail(order, items) {
    // HEADER
    const orderCode = document.getElementById("orderCode");
    const orderDate = document.getElementById("orderDate");
    const statusText = document.getElementById("orderStatusText");
    const itemCount = document.getElementById("orderItemCount");

    if (orderCode) orderCode.textContent = order.order_code || "-";
    if (orderDate) orderDate.textContent = formatDateTime(order.created_at);

    // STATUS
    const status = getOrderStatusMeta(order.status);
    if (statusText) statusText.textContent = status.label;
    if (itemCount) itemCount.textContent = formatItemCount(items);

    // SHIPPING INFO & PAYMENT METHOD
    const shipName = document.getElementById("shippingName");
    const shipPhone = document.getElementById("shippingPhone");
    const shipAddress = document.getElementById("shippingAddress");
    const shipNote = document.getElementById("shippingNote");
    const paymentMethodEl = document.getElementById("paymentMethod");

    if (shipName) shipName.textContent = order.shipping_name || "-";
    if (shipPhone) shipPhone.textContent = order.shipping_phone || "-";
    if (shipAddress) shipAddress.textContent = order.shipping_address || "-";
    if (shipNote) shipNote.textContent = order.note || "Không có ghi chú";
    
    if (paymentMethodEl) {
        const pmMap = {
            "cod": "Thanh toán khi nhận hàng (COD)",
            "bank_transfer": "Chuyển khoản qua Ngân hàng",
            "cash": "Thanh toán bằng Tiền mặt",
            "credit": "Công nợ doanh nghiệp"
        };
        paymentMethodEl.textContent = pmMap[order.payment_method] || order.payment_method || "Thanh toán khi nhận hàng (COD)";
    }

    // CHI TIẾT TỔNG TIỀN (CHỈ TÍNH TIỀN HÀNG)
    const totalBottom = document.getElementById("orderTotalBottom");
    const totalTop = document.getElementById("orderTotal");
    
    const orderTotal = calculateItemsTotal(items);
    
    if (totalTop) totalTop.textContent = formatCurrency(orderTotal);
    if (totalBottom) totalBottom.textContent = formatCurrency(orderTotal);

    // RENDER SẢN PHẨM & CÁC NÚT HỦY
    renderOrderItems(items);
    updateCancelButton(order.status);
}

function updateCancelButton(status) {
    const btnCancel = document.getElementById("btnCancelOrder");
    if (!btnCancel) return;
    if (status === "pending") btnCancel.classList.remove("d-none");
    else btnCancel.classList.add("d-none");
}

function renderOrderItems(items) {
    const body = document.getElementById("orderItemsBody");
    if (!body) return;

    if (!items || items.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#6b7280; font-style:italic;">Đơn hàng chưa có sản phẩm nào.</td></tr>`;
        return;
    }

    body.innerHTML = items.map(item => {
        const productName = escapeHtml(item.product_name || "Sản phẩm");
        const sku = escapeHtml(item.sku || "N/A");
        const size = escapeHtml(item.size || "-");
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unit_price || 0);
        const subtotal = Number(item.subtotal ?? (unitPrice * quantity));

        return `
            <tr style="border-bottom:1px solid #f3f4f6; transition:background-color .2s;" onmouseover="this.style.backgroundColor='#f8fbff'" onmouseout="this.style.backgroundColor='transparent'">
                <td style="padding:14px 16px;">
                    <strong style="color:#00479b; display:block; font-size:13px; font-weight:700; line-height:1.4;">${productName}</strong>
                </td>
                <td style="padding:14px 16px;">
                    <span style="font-family:monospace; font-weight:700; color:#4b5563; font-size:12px; background:#f3f4f6; padding:4px 8px; border-radius:4px; letter-spacing:-0.5px;">${sku}</span>
                </td>
                <td style="padding:14px 16px; text-align:center; font-weight:700; color:#374151; font-size:13px;">
                    ${size}
                </td>
                <td style="padding:14px 16px; text-align:right; color:#374151; font-size:13px; font-weight:600;">
                    ${formatCurrency(unitPrice)}
                </td>
                <td style="padding:14px 16px; text-align:center; font-weight:800; color:#111827; font-size:13px;">
                    ${quantity}
                </td>
                <td style="padding:14px 16px; text-align:right; color:#ff5e00; font-weight:800; font-size:14px;">
                    ${formatCurrency(subtotal)}
                </td>
            </tr>
        `;
    }).join("");
}

// ========================================================
// MUA LẠI ĐƠN HÀNG VÀ HỦY ĐƠN HÀNG
// ========================================================
window.reorderCurrentItems = function () {
    if (!window.currentOrderItems || window.currentOrderItems.length === 0) {
        alert("Đơn hàng chưa có sản phẩm để mua lại."); return;
    }

    let shoppingCart = JSON.parse(localStorage.getItem("mro_shopping_cart")) || [];

    window.currentOrderItems.forEach(item => {
        const productId = item.product_id || null;
        const size = item.size ? String(item.size).trim() : null;
        const qty = Math.max(1, Number(item.quantity) || 1);
        const productName = item.product_name || "Sản phẩm";

        const existingIndex = shoppingCart.findIndex(cartItem => {
            const cartProductId = cartItem.id || cartItem.product_id || null;
            const cartSize = cartItem.size ? String(cartItem.size).trim() : null;
            return (String(cartProductId) === String(productId) && cartSize === size);
        });

        if (existingIndex > -1) {
            shoppingCart[existingIndex].qty = (Number(shoppingCart[existingIndex].qty) || 0) + qty;
        } else {
            shoppingCart.push({
                id: productId, sku: item.sku || "", name: productName,
                price: Number(item.unit_price || 0), unit: item.unit || "Cái", size: size, qty: qty
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

const cancelModal = document.getElementById("cancelOrderModal");
const cancelForm = document.getElementById("cancelOrderForm");
const reasonOtherTextarea = document.getElementById("cancelReasonOther");
const btnConfirmCancel = document.getElementById("btnConfirmCancel");

if (cancelForm) {
    cancelForm.addEventListener("change", (e) => {
        if (e.target.name === "cancel_reason") {
            if (e.target.value === "Khác") {
                reasonOtherTextarea.classList.remove("d-none");
                reasonOtherTextarea.focus();
            } else {
                reasonOtherTextarea.classList.add("d-none");
                reasonOtherTextarea.value = "";
            }
        }
    });
}

window.cancelOrder = function () {
    if (!currentUser) return alert("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.");
    if (!currentOrder || currentOrder.status !== "pending") return alert("Đơn hàng này không còn ở trạng thái có thể hủy.");
    if (cancelModal) cancelModal.classList.remove("d-none");
};

window.closeCancelModal = function () { if (cancelModal) cancelModal.classList.add("d-none"); };

if (cancelForm) {
    cancelForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get("id");

        const formData = new FormData(cancelForm);
        let selectedReason = formData.get("cancel_reason");
        if (selectedReason === "Khác") selectedReason = reasonOtherTextarea.value.trim() || "Lý do khác";

        btnConfirmCancel.disabled = true;
        btnConfirmCancel.textContent = "Đang xử lý...";

        try {
            const { error } = await window.supabaseClient
                .from("orders")
                .update({ status: "cancelled", cancel_reason: selectedReason })
                .eq("id", orderId)
                .eq("user_id", currentUser.id)
                .eq("status", "pending");

            if (error) throw error;
            closeCancelModal();

            if (window.utils && typeof window.utils.showToast === "function") window.utils.showToast("Hủy đơn hàng thành công!", "success");
            else alert("Hủy đơn hàng thành công!");

            setTimeout(() => { window.location.reload(); }, 1000);
        } catch (error) {
            console.error("Lỗi hủy đơn:", error);
            alert("Có lỗi xảy ra khi hủy đơn. Vui lòng liên hệ Hotline.");
            btnConfirmCancel.disabled = false;
            btnConfirmCancel.textContent = "Xác nhận Hủy";
        }
    });
}

window.handleLogout = async function () {
    try {
        if (window.supabaseClient) await window.supabaseClient.auth.signOut();
        localStorage.removeItem("kn_customer_session");
        window.location.href = "login.html";
    } catch (error) { console.error(error); }
};
window.handleCustomerLogout = window.handleLogout;