// ========================================================
// FILE: admin-order-detail.js
// CHI TIẾT + XỬ LÝ ĐƠN HÀNG ADMIN (ĐÃ ĐỒNG BỘ GIAO DIỆN)
// ========================================================

const orderDetailState = {
    orderId: null,
    order: null,
    items: [],
    profile: null,
    updatingStatus: false,
    cancellingOrder: false
};

const orderDetailDOM = {};

// ========================================================
// 1. STATUS WORKFLOW
// ========================================================
const ORDER_STATUS_FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"];
const ORDER_STATUS_META = {
    pending: { label: "Chờ xử lý", className: "bg-orange-100 text-orange-700 border-orange-200", description: "Đơn hàng mới được tạo và đang chờ xác nhận." },
    confirmed: { label: "Đã xác nhận", className: "bg-blue-100 text-blue-700 border-blue-200", description: "Đơn hàng đã được admin xác nhận." },
    processing: { label: "Đang xử lý", className: "bg-purple-100 text-purple-700 border-purple-200", description: "Đơn hàng đang được chuẩn bị." },
    shipped: { label: "Đang giao", className: "bg-indigo-100 text-indigo-700 border-indigo-200", description: "Đơn hàng đã được bàn giao cho đơn vị giao hàng." },
    delivered: { label: "Đã giao", className: "bg-green-100 text-green-700 border-green-200", description: "Đơn hàng đã giao thành công." },
    cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-700 border-red-200", description: "Đơn hàng đã bị hủy." }
};

// ========================================================
// 2. CACHE DOM
// ========================================================
function cacheOrderDetailDOM() {
    orderDetailDOM.loading = document.getElementById("orderDetailLoading");
    orderDetailDOM.error = document.getElementById("orderDetailError");
    orderDetailDOM.errorText = document.getElementById("orderDetailErrorText");
    orderDetailDOM.content = document.getElementById("orderDetailContent");

    // HEADER
    orderDetailDOM.orderCode = document.getElementById("orderCode");
    orderDetailDOM.orderCreatedAt = document.getElementById("orderCreatedAt");
    orderDetailDOM.orderStatusSelect = document.getElementById("orderStatusSelect");
    orderDetailDOM.updateStatusButton = document.getElementById("btnUpdateOrderStatus");

    // STATUS PROGRESS (KHÔI PHỤC)
    orderDetailDOM.statusProgress = document.getElementById("orderStatusProgress");
    orderDetailDOM.statusDescription = document.getElementById("orderStatusDescription");

    // CANCELLATION
    orderDetailDOM.cancellationSection = document.getElementById("orderCancellationSection");
    orderDetailDOM.cancellationReason = document.getElementById("orderCancellationReason");

    // CUSTOMER
    orderDetailDOM.customerName = document.getElementById("customerName");
    orderDetailDOM.customerPhone = document.getElementById("customerPhone");
    orderDetailDOM.customerEmail = document.getElementById("customerEmail");

    // SHIPPING & PAYMENT
    orderDetailDOM.shippingName = document.getElementById("shippingName");
    orderDetailDOM.shippingPhone = document.getElementById("shippingPhone");
    orderDetailDOM.shippingAddress = document.getElementById("shippingAddress");
    orderDetailDOM.shippingNote = document.getElementById("shippingNote");
    orderDetailDOM.paymentMethod = document.getElementById("paymentMethod");

    // ITEMS
    orderDetailDOM.itemsBody = document.getElementById("orderItemsBody");

    // SUMMARY
    orderDetailDOM.orderSubtotalBottom = document.getElementById("orderSubtotalBottom");
    orderDetailDOM.orderTotalBottom = document.getElementById("orderTotalBottom");

    // QUICK INFO
    orderDetailDOM.quickOrderCode = document.getElementById("quickOrderCode");
    orderDetailDOM.quickCreatedAt = document.getElementById("quickCreatedAt");
    orderDetailDOM.quickItemsCount = document.getElementById("quickItemsCount");

    // CANCEL MODAL
    orderDetailDOM.cancelModal = document.getElementById("cancelOrderModal");
    orderDetailDOM.cancelOverlay = document.getElementById("cancelOrderOverlay");
    orderDetailDOM.cancelOrderCode = document.getElementById("cancelOrderCode");
    orderDetailDOM.cancelReason = document.getElementById("cancelOrderReason");
    orderDetailDOM.cancelReasonError = document.getElementById("cancelOrderReasonError");
    orderDetailDOM.cancelReasonCount = document.getElementById("cancelOrderReasonCount");
    orderDetailDOM.closeCancelModal = document.getElementById("btnCloseCancelModal");
    orderDetailDOM.cancelModalButton = document.getElementById("btnCancelOrderModal");
    orderDetailDOM.confirmCancelButton = document.getElementById("btnConfirmCancelOrder");
}

// ========================================================
// 3. HELPERS
// ========================================================
function escapeOrderDetailHTML(value) {
    if (window.utils && typeof window.utils.escapeHTML === "function") return window.utils.escapeHTML(value ?? "");
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatOrderDetailMoney(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "0 ₫";
    return number.toLocaleString("vi-VN") + " ₫";
}

function formatOrderDetailDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// ========================================================
// 4. STATUS HELPERS
// ========================================================
function getOrderDetailStatusMeta(status) {
    const normalized = String(status || "").trim().toLowerCase();
    return ORDER_STATUS_META[normalized] || { label: "Không xác định", className: "bg-gray-100 text-gray-600 border-gray-200", description: "Trạng thái đơn hàng không xác định." };
}

function getStatusIndex(status) { return ORDER_STATUS_FLOW.indexOf(String(status || "").trim().toLowerCase()); }

function canTransitionOrderStatus(oldStatus, newStatus) {
    oldStatus = String(oldStatus || "").trim().toLowerCase();
    newStatus = String(newStatus || "").trim().toLowerCase();
    if (!oldStatus || !newStatus) return false;
    if (oldStatus === newStatus) return false;
    if (oldStatus === "delivered" || oldStatus === "cancelled") return false;
    if (newStatus === "cancelled") return ["pending", "confirmed", "processing"].includes(oldStatus);
    const oldIndex = getStatusIndex(oldStatus);
    const newIndex = getStatusIndex(newStatus);
    if (oldIndex === -1 || newIndex === -1) return false;
    return newIndex === oldIndex + 1;
}

function getAllowedNextStatuses(currentStatus) {
    const normalized = String(currentStatus || "").trim().toLowerCase();
    if (normalized === "delivered" || normalized === "cancelled") return [];
    const index = getStatusIndex(normalized);
    if (index === -1) return [];
    const result = [];
    if (index < ORDER_STATUS_FLOW.length - 1) result.push(ORDER_STATUS_FLOW[index + 1]);
    if (["pending", "confirmed", "processing"].includes(normalized)) result.push("cancelled");
    return result;
}

function getOrderIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return null;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) return null;
    return numericId;
}

// ========================================================
// 6. LOAD DATA
// ========================================================
async function loadOrderDetail() {
    if (!window.supabaseClient) throw new Error("Supabase chưa được khởi tạo.");
    
    const { data: order, error } = await window.supabaseClient
        .from("orders")
        .select(`id, user_id, order_code, status, subtotal, shipping_fee, total, shipping_name, shipping_phone, shipping_address, note, cancel_reason, created_at, payment_method`)
        .eq("id", orderDetailState.orderId)
        .single();
        
    if (error) throw error;
    if (!order) throw new Error("Không tìm thấy đơn hàng.");
    orderDetailState.order = order;
}

async function loadOrderItems() {
    if (!window.supabaseClient) return;
    const { data: items, error } = await window.supabaseClient
        .from("order_items")
        .select(`id, order_id, product_id, product_name, sku, size, unit_price, quantity, subtotal`)
        .eq("order_id", orderDetailState.orderId)
        .order("id", { ascending: true });
        
    if (error) throw error;
    orderDetailState.items = items || [];
}

async function loadCustomerProfile() { 
    const order = orderDetailState.order;
    if (!order || !order.user_id) {
        orderDetailState.profile = null;
        return;
    }
    
    try {
        const { data: profile } = await window.supabaseClient
            .from("profiles")
            .select("full_name, phone, email")
            .eq("id", order.user_id)
            .maybeSingle();
            
        orderDetailState.profile = profile || null;
    } catch (error) {
        console.error("Lỗi lấy profile khách hàng:", error);
        orderDetailState.profile = null;
    }
}

// ========================================================
// 9. RENDER UI COMPONENTS
// ========================================================
function renderOrderHeader() {
    const order = orderDetailState.order;
    if (!order) return;
    orderDetailDOM.orderCode.textContent = order.order_code || "-";
    orderDetailDOM.orderCreatedAt.textContent = formatOrderDetailDate(order.created_at);
    
    renderStatusSelect();
    renderStatusProgress(); // Gọi lại hàm thanh tiến trình
    renderCancellationReason();
    
    orderDetailDOM.quickOrderCode.textContent = order.order_code || "-";
    orderDetailDOM.quickCreatedAt.textContent = formatOrderDetailDate(order.created_at);
}

function renderStatusSelect() {
    const select = orderDetailDOM.orderStatusSelect;
    const order = orderDetailState.order;
    if (!select || !order) return;

    const currentStatus = String(order.status || "").trim().toLowerCase();
    const allowedStatuses = getAllowedNextStatuses(currentStatus);
    select.innerHTML = "";

    const currentOption = document.createElement("option");
    currentOption.value = currentStatus;
    currentOption.textContent = getOrderDetailStatusMeta(currentStatus).label + " (hiện tại)";
    select.appendChild(currentOption);

    allowedStatuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = getOrderDetailStatusMeta(status).label;
        select.appendChild(option);
    });

    select.value = currentStatus;
    const isLocked = currentStatus === "delivered" || currentStatus === "cancelled";
    select.disabled = isLocked || orderDetailState.updatingStatus;

    if (orderDetailDOM.updateStatusButton) {
        orderDetailDOM.updateStatusButton.disabled = isLocked || orderDetailState.updatingStatus || allowedStatuses.length === 0;
    }
    updateStatusButtonLabel();
}

function updateStatusButtonLabel() {
    const button = orderDetailDOM.updateStatusButton;
    const select = orderDetailDOM.orderStatusSelect;
    if (!button || !select) return;

    if (orderDetailState.updatingStatus) { button.textContent = "Đang cập nhật..."; return; }
    const currentStatus = orderDetailState.order?.status;
    const selectedStatus = select.value;

    if (!currentStatus || currentStatus === selectedStatus) { button.textContent = "Cập nhật trạng thái"; return; }
    if (selectedStatus === "cancelled") { button.textContent = "Xác nhận hủy đơn"; return; }
    button.textContent = "Cập nhật trạng thái";
}

// ========================================================
// 10. RENDER STATUS PROGRESS (KHÔI PHỤC THANH TIẾN TRÌNH 1-5)
// ========================================================
function renderStatusProgress() {
    const container = orderDetailDOM.statusProgress;
    const description = orderDetailDOM.statusDescription;
    const order = orderDetailState.order;
    if (!container || !order) return;

    const currentStatus = String(order.status || "").trim().toLowerCase();
    const currentIndex = getStatusIndex(currentStatus);
    container.innerHTML = "";

    ORDER_STATUS_FLOW.forEach((status, index) => {
        const meta = getOrderDetailStatusMeta(status);
        const isCompleted = currentIndex !== -1 && index < currentIndex;
        const isCurrent = status === currentStatus;
        const isFuture = currentIndex !== -1 && index > currentIndex;
        
        const isLast = index === ORDER_STATUS_FLOW.length - 1;

        const wrapper = document.createElement("div");
        wrapper.className = isLast ? "relative" : "flex-1 relative pr-2 min-w-[120px]";
        
        wrapper.innerHTML = `
            <div class="flex items-center">
                <div class="w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-black z-10 ${isCurrent ? "bg-kn-blue text-white border-kn-blue" : isCompleted ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-400 border-gray-300"}">
                    ${isCompleted ? "✓" : index + 1}
                </div>
                ${!isLast ? `<div class="h-0.5 flex-1 ml-2 ${index < currentIndex ? "bg-green-500" : "bg-gray-200"}"></div>` : ""}
            </div>
            <p class="text-[11px] mt-2 font-black uppercase tracking-wider whitespace-nowrap ${isCurrent ? "text-kn-blue" : isFuture ? "text-gray-400" : "text-gray-600"} ${isLast ? '-ml-1.5' : ''}">${escapeOrderDetailHTML(meta.label)}</p>
        `;
        container.appendChild(wrapper);
    });

    if (description) {
        if (currentStatus === "cancelled") {
            // Đổi text thành màu đỏ, xóa luôn cục nhãn dư thừa chèn vào flexbox
            description.innerHTML = `<span class="text-red-500">Đơn hàng đã bị hủy và không thể tiếp tục xử lý.</span>`;
        }
        else if (currentStatus === "delivered") description.textContent = "Đơn hàng đã hoàn tất.";
        else description.textContent = getOrderDetailStatusMeta(currentStatus).description;
    }
}

function renderCancellationReason() {
    const order = orderDetailState.order;
    const section = orderDetailDOM.cancellationSection;
    const reason = orderDetailDOM.cancellationReason;
    if (!section || !reason || !order) return;

    const status = String(order.status || "").trim().toLowerCase();
    if (status !== "cancelled") { section.classList.add("hidden"); reason.textContent = ""; return; }

    const cancellationReason = String(order.cancel_reason || "").trim();
    section.classList.remove("hidden");
    reason.textContent = cancellationReason || "Không có lý do hủy được ghi nhận.";
}

function renderCustomer() {
    const order = orderDetailState.order;
    const profile = orderDetailState.profile;
    const name = profile?.full_name || order?.shipping_name || "Khách hàng";
    const phone = profile?.phone || order?.shipping_phone || "-";
    const email = profile?.email || "-";

    orderDetailDOM.customerName.textContent = name;
    orderDetailDOM.customerPhone.textContent = phone;
    orderDetailDOM.customerEmail.textContent = email;
}

function renderShipping() {
    const order = orderDetailState.order;
    if (!order) return;

    if(orderDetailDOM.shippingName) orderDetailDOM.shippingName.textContent = order.shipping_name || "-";
    if(orderDetailDOM.shippingPhone) orderDetailDOM.shippingPhone.textContent = order.shipping_phone || "-";
    if(orderDetailDOM.shippingAddress) orderDetailDOM.shippingAddress.textContent = order.shipping_address || "-";
    
    const shippingNoteEl = document.getElementById("shippingNote");
    if (shippingNoteEl) {
        shippingNoteEl.textContent = order.note || "Không có ghi chú";
    }

    if (orderDetailDOM.paymentMethod) {
        const pmMap = {
            "cod": "Thanh toán khi nhận hàng (COD)",
            "bank_transfer": "Chuyển khoản qua Ngân hàng",
            "cash": "Thanh toán bằng Tiền mặt",
            "credit": "Công nợ doanh nghiệp"
        };
        orderDetailDOM.paymentMethod.textContent = pmMap[order.payment_method] || order.payment_method || "Thanh toán khi nhận hàng (COD)";
    }
}

function renderItems() {
    if (!orderDetailDOM.itemsBody) return;
    const items = orderDetailState.items;

    if (orderDetailDOM.quickItemsCount) {
        orderDetailDOM.quickItemsCount.textContent = items.reduce((total, item) => total + Number(item.quantity || 0), 0);
    }

    if (!items.length) {
        orderDetailDOM.itemsBody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-gray-400">Đơn hàng chưa có sản phẩm.</td></tr>`;
        return;
    }

    let calculatedTotal = 0;

    orderDetailDOM.itemsBody.innerHTML = items.map(item => {
        const size = item.size !== undefined && item.size !== null ? String(item.size).trim() : "";
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unit_price || 0);
        const subtotal = Number(item.subtotal ?? (unitPrice * quantity));
        
        calculatedTotal += subtotal;

        return `
            <tr class="hover:bg-blue-50/30 transition-colors">
                <td class="p-4">
                    <strong class="text-kn-blue block text-[13px] font-bold leading-snug">${escapeOrderDetailHTML(item.product_name || "Sản phẩm")}</strong>
                </td>
                <td class="p-4">
                    <span class="font-mono font-bold text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded tracking-tight">${escapeOrderDetailHTML(item.sku || "-")}</span>
                </td>
                <td class="p-4 text-center">
                    ${size ? `<span class="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded border border-orange-200 bg-orange-50 text-orange-600 text-xs font-black">${escapeOrderDetailHTML(size)}</span>` : `<span class="text-gray-400">-</span>`}
                </td>
                <td class="p-4 text-right font-semibold text-gray-700 text-[13px]">
                    ${formatOrderDetailMoney(unitPrice)}
                </td>
                <td class="p-4 text-center font-black text-gray-900 text-[13px]">
                    ${escapeOrderDetailHTML(quantity)}
                </td>
                <td class="p-4 text-right font-black text-kn-orange text-[14px] whitespace-nowrap">
                    ${formatOrderDetailMoney(subtotal)}
                </td>
            </tr>
        `;
    }).join("");

    if (orderDetailDOM.orderSubtotalBottom) orderDetailDOM.orderSubtotalBottom.textContent = formatOrderDetailMoney(calculatedTotal);
    if (orderDetailDOM.orderTotalBottom) orderDetailDOM.orderTotalBottom.textContent = formatOrderDetailMoney(calculatedTotal);
}

function renderOrderDetail() {
    renderOrderHeader();
    renderCustomer();
    renderShipping();
    renderItems();
}

// ========================================================
// 20. CANCEL LOGIC
// ========================================================
function openCancelOrderModal() {
    const order = orderDetailState.order;
    if (!order) return;

    const currentStatus = String(order.status || "").trim().toLowerCase();
    if (!["pending", "confirmed", "processing"].includes(currentStatus)) { alert("Đơn hàng hiện tại không thể hủy."); return; }
    if (orderDetailState.updatingStatus || orderDetailState.cancellingOrder) return;

    if (orderDetailDOM.cancelModal) {
        orderDetailDOM.cancelModal.classList.remove("hidden");
        orderDetailDOM.cancelModal.classList.add("flex");
    }

    if (orderDetailDOM.cancelOrderCode) orderDetailDOM.cancelOrderCode.textContent = `Mã đơn: ${order.order_code || "#" + order.id}`;

    if (orderDetailDOM.cancelReason) {
        orderDetailDOM.cancelReason.value = "";
        updateCancelReasonCounter();
        clearCancelReasonError();
        setTimeout(() => { orderDetailDOM.cancelReason.focus(); }, 50);
    }
    document.body.classList.add("overflow-hidden");
}

function closeCancelOrderModal() {
    if (orderDetailState.cancellingOrder) return;
    if (orderDetailDOM.cancelModal) {
        orderDetailDOM.cancelModal.classList.add("hidden");
        orderDetailDOM.cancelModal.classList.remove("flex");
    }
    document.body.classList.remove("overflow-hidden");
}

function clearCancelReasonError() {
    if (orderDetailDOM.cancelReasonError) orderDetailDOM.cancelReasonError.textContent = "";
    if (orderDetailDOM.cancelReason) orderDetailDOM.cancelReason.classList.remove("border-red-400", "ring-2", "ring-red-100");
}

function validateCancelReason() {
    if (!orderDetailDOM.cancelReason) return null;
    const reason = String(orderDetailDOM.cancelReason.value || "").trim();
    if (!reason || reason.length < 3) {
        if (orderDetailDOM.cancelReasonError) orderDetailDOM.cancelReasonError.textContent = "Vui lòng nhập lý do hủy ít nhất 3 ký tự.";
        orderDetailDOM.cancelReason.classList.add("border-red-400", "ring-2", "ring-red-100");
        orderDetailDOM.cancelReason.focus();
        return null;
    }
    clearCancelReasonError();
    return reason;
}

function updateCancelReasonCounter() {
    if (!orderDetailDOM.cancelReason || !orderDetailDOM.cancelReasonCount) return;
    const length = orderDetailDOM.cancelReason.value.length;
    orderDetailDOM.cancelReasonCount.textContent = `${length}/500`;
}

async function updateOrderStatus() {
    if (!orderDetailState.order || orderDetailState.updatingStatus || orderDetailState.cancellingOrder) return;

    const oldStatus = String(orderDetailState.order.status || "").trim().toLowerCase();
    const newStatus = String(orderDetailDOM.orderStatusSelect.value || "").trim().toLowerCase();

    if (oldStatus === newStatus) return;
    if (!canTransitionOrderStatus(oldStatus, newStatus)) { alert("Không thể chuyển sang trạng thái này."); renderStatusSelect(); return; }

    if (newStatus === "cancelled") { openCancelOrderModal(); return; }

    const oldMeta = getOrderDetailStatusMeta(oldStatus);
    const newMeta = getOrderDetailStatusMeta(newStatus);
    const orderCode = orderDetailState.order.order_code || `#${orderDetailState.orderId}`;
    const confirmed = window.confirm(`Cập nhật trạng thái đơn hàng ${orderCode}?\n\n${oldMeta.label} → ${newMeta.label}`);

    if (!confirmed) { renderStatusSelect(); return; }

    orderDetailState.updatingStatus = true;
    renderStatusSelect();

    try {
        const { data, error } = await window.supabaseClient.from("orders").update({ status: newStatus }).eq("id", orderDetailState.orderId)
            .select(`id, order_code, status, subtotal, shipping_fee, total, shipping_name, shipping_phone, shipping_address, note, cancel_reason, created_at, payment_method`).single();

        if (error) throw error;
        if (!data) throw new Error("Không nhận được dữ liệu đơn hàng sau khi cập nhật.");

        orderDetailState.order = data;
        orderDetailState.updatingStatus = false;
        renderOrderDetail();
        alert("Đã cập nhật trạng thái đơn hàng.");
    } catch (error) {
        console.error("Lỗi cập nhật trạng thái:", error);
        orderDetailState.updatingStatus = false;
        renderOrderDetail();
        alert("Không thể cập nhật trạng thái:\n" + (error.message || "Lỗi không xác định."));
    }
}

async function confirmCancelOrder() {
    if (!orderDetailState.order || orderDetailState.cancellingOrder || orderDetailState.updatingStatus) return;

    const reason = validateCancelReason();
    if (!reason) return;

    const orderCode = orderDetailState.order.order_code || `#${orderDetailState.orderId}`;
    orderDetailState.cancellingOrder = true;

    if (orderDetailDOM.confirmCancelButton) {
        orderDetailDOM.confirmCancelButton.disabled = true;
        orderDetailDOM.confirmCancelButton.textContent = "Đang hủy đơn...";
    }

    try {
        const { data, error } = await window.supabaseClient.from("orders").update({ status: "cancelled", cancel_reason: reason }).eq("id", orderDetailState.orderId)
            .select(`id, order_code, status, subtotal, shipping_fee, total, shipping_name, shipping_phone, shipping_address, note, cancel_reason, created_at, payment_method`).single();

        if (error) throw error;
        if (!data) throw new Error("Không nhận được dữ liệu đơn hàng sau khi hủy.");

        orderDetailState.order = data;
        orderDetailState.cancellingOrder = false;
        closeCancelOrderModal();
        renderOrderDetail();
        alert(`Đã hủy đơn hàng ${orderCode}.`);
    } catch (error) {
        console.error("Lỗi hủy đơn hàng:", error);
        orderDetailState.cancellingOrder = false;
        if (orderDetailDOM.confirmCancelButton) {
            orderDetailDOM.confirmCancelButton.disabled = false;
            orderDetailDOM.confirmCancelButton.textContent = "Xác nhận hủy đơn";
        }
        alert("Không thể hủy đơn hàng:\n" + (error.message || "Lỗi không xác định."));
    }
}

// ========================================================
// 27. SHOW STATES
// ========================================================
function showOrderDetailError(message) {
    if (orderDetailDOM.loading) orderDetailDOM.loading.classList.add("hidden");
    if (orderDetailDOM.content) orderDetailDOM.content.classList.add("hidden");
    if (orderDetailDOM.error) orderDetailDOM.error.classList.remove("hidden");
    if (orderDetailDOM.errorText) orderDetailDOM.errorText.textContent = message;
}

function showOrderDetailContent() {
    if (orderDetailDOM.loading) orderDetailDOM.loading.classList.add("hidden");
    if (orderDetailDOM.error) orderDetailDOM.error.classList.add("hidden");
    if (orderDetailDOM.content) orderDetailDOM.content.classList.remove("hidden");
}

function bindOrderDetailEvents() {
    if (orderDetailDOM.updateStatusButton) orderDetailDOM.updateStatusButton.addEventListener("click", updateOrderStatus);
    if (orderDetailDOM.orderStatusSelect) orderDetailDOM.orderStatusSelect.addEventListener("change", () => { updateStatusButtonLabel(); });
    if (orderDetailDOM.closeCancelModal) orderDetailDOM.closeCancelModal.addEventListener("click", closeCancelOrderModal);
    if (orderDetailDOM.cancelModalButton) orderDetailDOM.cancelModalButton.addEventListener("click", closeCancelOrderModal);
    if (orderDetailDOM.cancelOverlay) orderDetailDOM.cancelOverlay.addEventListener("click", closeCancelOrderModal);
    if (orderDetailDOM.confirmCancelButton) orderDetailDOM.confirmCancelButton.addEventListener("click", confirmCancelOrder);

    if (orderDetailDOM.cancelReason) {
        orderDetailDOM.cancelReason.addEventListener("input", () => { updateCancelReasonCounter(); clearCancelReasonError(); });
        orderDetailDOM.cancelReason.addEventListener("keydown", event => {
            if (event.key === "Enter" && event.ctrlKey) { event.preventDefault(); confirmCancelOrder(); }
        });
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && orderDetailDOM.cancelModal && !orderDetailDOM.cancelModal.classList.contains("hidden")) {
            closeCancelOrderModal();
        }
    });
}

// ========================================================
// 30. INIT
// ========================================================
document.addEventListener("DOMContentLoaded", async () => {
    cacheOrderDetailDOM();

    orderDetailState.orderId = getOrderIdFromURL();
    if (!orderDetailState.orderId) { showOrderDetailError("URL không có mã đơn hàng hợp lệ. Hãy mở trang từ danh sách đơn hàng."); return; }

    bindOrderDetailEvents();

    try {
        await loadOrderDetail();
        await loadOrderItems();
        await loadCustomerProfile();

        renderOrderDetail();
        showOrderDetailContent();

    } catch (error) {
        console.error("Lỗi khởi tạo chi tiết đơn hàng:", error);
        showOrderDetailError(error.message || "Có lỗi xảy ra khi tải đơn hàng.");
    }
});