// ========================================================
// FILE: assets/js/users/my-orders-detail.js
// CHI TIẾT ĐƠN HÀNG MUA TRỰC TIẾP
// - Không sử dụng ảnh sản phẩm
// - Đồng bộ schema orders / order_items
// - Khách hàng chỉ được hủy khi đơn đang pending
// ========================================================

let currentUser = null;
let currentOrderItems = [];
let currentOrder = null;

// ========================================================
// INIT
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
        console.error("Lỗi khởi tạo trang chi tiết đơn hàng:", error);
        showOrderError(
            "Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau."
        );
    }
});

// ========================================================
// LẤY USER HIỆN TẠI
// ========================================================

async function getCurrentCustomer() {

    if (typeof window.checkCustomerAuth === "function") {
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

// ========================================================
// LOAD SIDEBAR PROFILE
// ========================================================

async function loadSidebarProfile() {

    const nameEl =
        document.getElementById("sidebarUserName");

    const emailEl =
        document.getElementById("sidebarUserEmail");

    const avatarEl =
        document.getElementById("userAvatarInitials");

    let fullName =
        currentUser?.user_metadata?.full_name ||
        "Khách hàng";

    try {

        const { data: profile, error } =
            await window.supabaseClient
                .from("profiles")
                .select("full_name")
                .eq("id", currentUser.id)
                .maybeSingle();

        if (!error && profile?.full_name) {
            fullName = profile.full_name;
        }

    } catch (error) {

        console.error(
            "Không thể tải profile:",
            error
        );
    }

    if (nameEl) {
        nameEl.textContent = fullName;
    }

    if (emailEl) {
        emailEl.textContent =
            currentUser?.email || "-";
    }

    if (
        avatarEl &&
        fullName &&
        fullName !== "Khách hàng"
    ) {

        const parts =
            fullName
                .trim()
                .split(/\s+/);

        let initials =
            parts[0]?.charAt(0)?.toUpperCase() || "";

        if (parts.length > 1) {

            initials +=
                parts[parts.length - 1]
                    ?.charAt(0)
                    ?.toUpperCase() || "";
        }

        avatarEl.textContent =
            initials || "KN";
    }
}

// ========================================================
// LOAD ORDER DETAIL
// ========================================================

async function loadOrderDetail() {

    const params =
        new URLSearchParams(window.location.search);

    const orderId =
        params.get("id");

    if (!orderId) {

        showOrderError(
            "Không tìm thấy mã đơn hàng trong đường dẫn."
        );

        return;
    }

    // ----------------------------------------------------
    // LOAD ORDER
    // ----------------------------------------------------

    const { data: order, error: orderError } =
        await window.supabaseClient
            .from("orders")
            .select(`
                id,
                user_id,
                order_code,
                status,
                subtotal,
                shipping_fee,
                total,
                shipping_name,
                shipping_phone,
                shipping_address,
                note,
                created_at,
                payment_method
            `)
            .eq("id", orderId)
            .eq("user_id", currentUser.id)
            .maybeSingle();

    if (orderError) {
        throw orderError;
    }

    if (!order) {

        showOrderError(
            "Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này."
        );

        return;
    }

    currentOrder = order;

    // ----------------------------------------------------
    // LOAD ORDER ITEMS
    // Không JOIN products vì không dùng ảnh
    // ----------------------------------------------------

    const { data: items, error: itemsError } =
        await window.supabaseClient
            .from("order_items")
            .select(`
                id,
                order_id,
                product_id,
                product_name,
                sku,
                unit_price,
                quantity,
                subtotal,
                size
            `)
            .eq("order_id", orderId)
            .order("id", {
                ascending: true
            });

    if (itemsError) {
        throw itemsError;
    }

    currentOrderItems = items || [];

    window.currentOrderItems =
        currentOrderItems;

    window.currentOrder =
        currentOrder;

    // ----------------------------------------------------
    // RENDER
    // ----------------------------------------------------

    renderOrderDetail(
        currentOrder,
        currentOrderItems
    );

    const loading =
        document.getElementById("orderLoading");

    const content =
        document.getElementById(
            "orderDetailContent"
        );

    if (loading) {
        loading.classList.add("d-none");
    }

    if (content) {
        content.classList.remove("d-none");
    }
}

// ========================================================
// RENDER ORDER DETAIL
// ========================================================

function renderOrderDetail(order, items) {

    const orderCode =
        document.getElementById("orderCode");

    const orderDate =
        document.getElementById("orderDate");

    const statusText =
        document.getElementById("orderStatusText");

    const statusBadge =
        document.getElementById("orderStatus");

    const itemCount =
        document.getElementById("orderItemCount");

    const total =
        document.getElementById("orderTotal");

    const totalBottom =
        document.getElementById(
            "orderTotalBottom"
        );

    // ----------------------------------------------------
    // HEADER
    // ----------------------------------------------------

    if (orderCode) {
        orderCode.textContent =
            order.order_code || "-";
    }

    if (orderDate) {
        orderDate.textContent =
            formatDateTime(order.created_at);
    }

    // ----------------------------------------------------
    // STATUS
    // ----------------------------------------------------

    const status =
        getOrderStatusMeta(order.status);

    if (statusBadge) {

        statusBadge.textContent =
            status.label;

        statusBadge.className =
            `status-badge ${status.class}`;
    }

    if (statusText) {

        statusText.textContent =
            status.label;
    }

    // ----------------------------------------------------
    // ITEM COUNT
    // ----------------------------------------------------

    if (itemCount) {

        itemCount.textContent =
            formatItemCount(items);
    }

    // ----------------------------------------------------
    // TOTAL
    // ----------------------------------------------------

    const orderTotal =
        Number(order.total ?? calculateItemsTotal(items));

    if (total) {

        total.textContent =
            formatCurrency(orderTotal);
    }

    if (totalBottom) {

        totalBottom.textContent =
            formatCurrency(orderTotal);
    }

    // ----------------------------------------------------
    // SHIPPING
    // ----------------------------------------------------

    const shipName =
        document.getElementById("shippingName");

    const shipPhone =
        document.getElementById("shippingPhone");

    const shipAddress =
        document.getElementById("shippingAddress");

    const shipNote =
        document.getElementById("shippingNote");

    if (shipName) {
        shipName.textContent =
            order.shipping_name || "-";
    }

    if (shipPhone) {
        shipPhone.textContent =
            order.shipping_phone || "-";
    }

    if (shipAddress) {
        shipAddress.textContent =
            order.shipping_address || "-";
    }

    if (shipNote) {
        shipNote.textContent =
            order.note || "Không có ghi chú";
    }

    // ----------------------------------------------------
    // PRODUCTS
    // ----------------------------------------------------

    renderOrderItems(items);

    // ----------------------------------------------------
    // CANCEL BUTTON
    // Chỉ pending mới được hủy
    // ----------------------------------------------------

    updateCancelButton(order.status);
}

// ========================================================
// UPDATE CANCEL BUTTON
// ========================================================

function updateCancelButton(status) {

    const btnCancel =
        document.getElementById(
            "btnCancelOrder"
        );

    if (!btnCancel) {
        return;
    }

    if (status === "pending") {

        btnCancel.classList.remove(
            "d-none"
        );

    } else {

        btnCancel.classList.add(
            "d-none"
        );
    }
}

// ========================================================
// RENDER ORDER ITEMS
// ========================================================

function renderOrderItems(items) {

    const body =
        document.getElementById(
            "orderItemsBody"
        );

    if (!body) {
        return;
    }

    if (!items || items.length === 0) {

        body.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:24px;
                        color:#6b7280;
                        font-style:italic;
                    "
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
                escapeHtml(
                    item.product_name ||
                    "Sản phẩm"
                );

            const sku =
                escapeHtml(
                    item.sku || "N/A"
                );

            const size =
                escapeHtml(
                    item.size || "-"
                );

            const quantity =
                Number(
                    item.quantity || 0
                );

            const unitPrice =
                Number(
                    item.unit_price || 0
                );

            const subtotal =
                Number(
                    item.subtotal ??
                    unitPrice * quantity
                );

            return `
                <tr
                    style="
                        border-bottom:1px solid #f3f4f6;
                        transition:background-color .2s;
                    "
                    onmouseover="
                        this.style.backgroundColor='#f9fafb'
                    "
                    onmouseout="
                        this.style.backgroundColor='transparent'
                    "
                >

                    <!-- PRODUCT NAME -->
                    <td style="padding:16px;">
                        <strong
                            style="
                                color:#00479b;
                                display:block;
                                font-size:14px;
                            "
                        >
                            ${productName}
                        </strong>
                    </td>

                    <!-- SKU -->
                    <td style="padding:16px;">

                        <span
                            style="
                                font-family:monospace;
                                font-weight:900;
                                color:#4b5563;
                                font-size:12px;
                                background:#f3f4f6;
                                padding:4px 8px;
                                border-radius:4px;
                            "
                        >
                            ${sku}
                        </span>

                    </td>

                    <!-- SIZE -->
                    <td
                        style="
                            padding:16px;
                            text-align:center;
                            font-weight:800;
                            color:#374151;
                            font-size:13px;
                        "
                    >
                        ${size}
                    </td>

                    <!-- UNIT PRICE -->
                    <td
                        style="
                            padding:16px;
                            text-align:right;
                            color:#374151;
                            font-size:13px;
                            font-weight:600;
                        "
                    >
                        ${formatCurrency(unitPrice)}
                    </td>

                    <!-- QUANTITY -->
                    <td
                        style="
                            padding:16px;
                            text-align:center;
                            font-weight:900;
                            color:#1f2937;
                            font-size:14px;
                        "
                    >
                        ${quantity}
                    </td>

                    <!-- SUBTOTAL -->
                    <td
                        style="
                            padding:16px;
                            text-align:right;
                            color:#ff5e00;
                            font-weight:900;
                            font-size:15px;
                        "
                    >
                        ${formatCurrency(subtotal)}
                    </td>

                </tr>
            `;

        }).join("");
}

// ========================================================
// MUA LẠI ĐƠN HÀNG
// ========================================================

window.reorderCurrentItems =
    function () {

        if (
            !window.currentOrderItems ||
            window.currentOrderItems.length === 0
        ) {

            alert(
                "Đơn hàng chưa có sản phẩm để mua lại."
            );

            return;
        }

        let shoppingCart =
            JSON.parse(
                localStorage.getItem(
                    "mro_shopping_cart"
                )
            ) || [];

        window.currentOrderItems.forEach(
            item => {

                const productId =
                    item.product_id || null;

                const size =
                    item.size
                        ? String(item.size).trim()
                        : null;

                const qty =
                    Math.max(
                        1,
                        Number(item.quantity) || 1
                    );

                const productName =
                    item.product_name ||
                    "Sản phẩm";

                // ----------------------------------------
                // CHECK EXISTING CART ITEM
                // ----------------------------------------

                const existingIndex =
                    shoppingCart.findIndex(
                        cartItem => {

                            const cartProductId =
                                cartItem.id ||
                                cartItem.product_id ||
                                null;

                            const cartSize =
                                cartItem.size
                                    ? String(
                                        cartItem.size
                                    ).trim()
                                    : null;

                            return (
                                String(
                                    cartProductId
                                ) ===
                                String(
                                    productId
                                ) &&
                                cartSize === size
                            );
                        }
                    );

                // ----------------------------------------
                // ĐÃ CÓ TRONG CART
                // ----------------------------------------

                if (existingIndex > -1) {

                    shoppingCart[
                        existingIndex
                    ].qty =
                        (
                            Number(
                                shoppingCart[
                                    existingIndex
                                ].qty
                            ) || 0
                        ) + qty;

                }

                // ----------------------------------------
                // CHƯA CÓ
                // ----------------------------------------

                else {

                    shoppingCart.push({

                        id: productId,

                        sku:
                            item.sku || "",

                        name:
                            productName,

                        price:
                            Number(
                                item.unit_price || 0
                            ),

                        unit:
                            item.unit || "Cái",

                        size:
                            size,

                        qty:
                            qty
                    });
                }
            }
        );

        localStorage.setItem(
            "mro_shopping_cart",
            JSON.stringify(shoppingCart)
        );

        if (
            window.utils &&
            typeof window.utils.showToast ===
                "function"
        ) {

            window.utils.showToast(
                "Đã thêm sản phẩm vào giỏ hàng!",
                "success"
            );

            setTimeout(() => {

                window.location.href =
                    "cart.html";

            }, 1000);

        } else {

            alert(
                "Đã thêm sản phẩm vào giỏ hàng!"
            );

            window.location.href =
                "cart.html";
        }
    };

// ========================================================
// HỦY ĐƠN HÀNG
// ========================================================
//
// QUY TẮC:
// pending       -> được hủy
// processing    -> không được hủy
// shipping      -> không được hủy
// completed     -> không được hủy
// cancelled     -> không được hủy
//
// Quan trọng:
// UPDATE có thêm .eq("status", "pending")
// để chống race-condition.
// ========================================================

// ========================================================
// HỦY ĐƠN HÀNG (MỞ MODAL & LƯU LÝ DO)
// ========================================================

const cancelModal = document.getElementById("cancelOrderModal");
const cancelForm = document.getElementById("cancelOrderForm");
const reasonOtherTextarea = document.getElementById("cancelReasonOther");
const btnConfirmCancel = document.getElementById("btnConfirmCancel");

// Lắng nghe sự kiện chọn Radio để hiện ô nhập chữ nếu chọn "Khác"
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

// Hàm mở Modal (thay cho alert cũ)
window.cancelOrder = function () {
    if (!currentUser) return alert("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.");
    if (!currentOrder || currentOrder.status !== "pending") return alert("Đơn hàng này không còn ở trạng thái có thể hủy.");
    
    if (cancelModal) cancelModal.classList.remove("d-none");
};

// Hàm đóng Modal
window.closeCancelModal = function () {
    if (cancelModal) cancelModal.classList.add("d-none");
};

// Xử lý khi bấm nút "Xác nhận Hủy" trong Modal
if (cancelForm) {
    cancelForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const params = new URLSearchParams(window.location.search);
        const orderId = params.get("id");

        // Lấy lý do được chọn
        const formData = new FormData(cancelForm);
        let selectedReason = formData.get("cancel_reason");
        if (selectedReason === "Khác") {
            selectedReason = reasonOtherTextarea.value.trim() || "Lý do khác";
        }

        btnConfirmCancel.disabled = true;
        btnConfirmCancel.textContent = "Đang xử lý...";

        try {
            // Update Supabase: status thành 'cancelled' và LƯU LÝ DO vào cột cancel_reason (hoặc note)
            const { error } = await window.supabaseClient
                .from("orders")
                .update({ 
                    status: "cancelled",
                    cancel_reason: selectedReason // <-- Lưu ý: Đảm bảo bảng orders có cột cancel_reason
                })
                .eq("id", orderId)
                .eq("user_id", currentUser.id)
                .eq("status", "pending");

            if (error) throw error;

            closeCancelModal();

            if (window.utils && typeof window.utils.showToast === "function") {
                window.utils.showToast("Hủy đơn hàng thành công!", "success");
            } else {
                alert("Hủy đơn hàng thành công!");
            }

            // F5 lại trang để hiển thị Badge "Đã hủy"
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error("Lỗi hủy đơn:", error);
            alert("Có lỗi xảy ra khi hủy đơn. Vui lòng liên hệ Hotline Khang Nam.");
            btnConfirmCancel.disabled = false;
            btnConfirmCancel.textContent = "Xác nhận Hủy";
        }
    });
}

// ========================================================
// LOGOUT
// ========================================================

window.handleLogout =
    async function () {

        try {

            if (
                window.supabaseClient
            ) {

                await window.supabaseClient
                    .auth
                    .signOut();
            }

            localStorage.removeItem(
                "kn_customer_session"
            );

            window.location.href =
                "login.html";

        } catch (error) {

            console.error(
                "Lỗi đăng xuất:",
                error
            );
        }
    };

window.handleCustomerLogout =
    window.handleLogout;

// ========================================================
// ORDER STATUS (ĐỒNG BỘ VỚI TRANG DANH SÁCH)
// ========================================================

function getOrderStatusMeta(status) {
    // Ép chữ thường và xóa khoảng trắng thừa
    const safeStatus = String(status || "").toLowerCase().trim();

    // 1. Chờ xác nhận (Màu Cam)
    if (safeStatus.includes("pending")) {
        return { label: "Chờ xác nhận", class: "status-pending" };
    }

    // 2. Đã xác nhận / Đang xử lý (Màu Xanh Dương - Khớp với chữ "confirmed" trong DB)
    if (safeStatus.includes("confirmed") || safeStatus.includes("processing")) {
        return { label: "Đã xác nhận", class: "status-processing" };
    }

    // 3. Đã giao / Đang giao (Màu Xanh Lá - Khớp với trang Danh sách)
    if (safeStatus.includes("shipping") || safeStatus.includes("delivered") || safeStatus.includes("shipped")) {
        return { label: "Đã giao", class: "status-completed" };
    }

    // 4. Hoàn thành (Màu Xanh Lá)
    if (safeStatus.includes("completed")) {
        return { label: "Hoàn thành", class: "status-completed" };
    }

    // 5. Đã hủy (Màu Đỏ)
    if (safeStatus.includes("cancel") || safeStatus.includes("hủy")) {
        return { label: "Đã hủy", class: "status-cancelled" };
    }

    // Mặc định nếu gặp trạng thái lạ
    return { label: status || "Chờ xác nhận", class: "status-pending" };
}

// ========================================================
// FORMAT DATE
// ========================================================

function formatDateTime(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";
    }

    return date.toLocaleString(
        "vi-VN"
    );
}

// ========================================================
// FORMAT CURRENCY
// ========================================================

function formatCurrency(value) {

    return (
        new Intl.NumberFormat(
            "vi-VN"
        ).format(
            Number(value) || 0
        ) +
        " đ"
    );
}

// ========================================================
// FORMAT ITEM COUNT
// ========================================================

function formatItemCount(items) {

    const count =
        Array.isArray(items)
            ? items.length
            : 0;

    return `${count} sản phẩm`;
}

// ========================================================
// CALCULATE TOTAL
// ========================================================

function calculateItemsTotal(items) {

    if (!Array.isArray(items)) {
        return 0;
    }

    return items.reduce(
        (total, item) => {

            const subtotal =
                Number(
                    item.subtotal
                );

            if (
                Number.isFinite(
                    subtotal
                )
            ) {

                return (
                    total + subtotal
                );
            }

            const unitPrice =
                Number(
                    item.unit_price
                ) || 0;

            const quantity =
                Number(
                    item.quantity
                ) || 0;

            return (
                total +
                unitPrice *
                    quantity
            );

        },
        0
    );
}

// ========================================================
// ESCAPE HTML
// ========================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

// ========================================================
// SHOW ERROR
// ========================================================

function showOrderError(message) {

    const loading =
        document.getElementById(
            "orderLoading"
        );

    const errorBox =
        document.getElementById(
            "orderError"
        );

    const content =
        document.getElementById(
            "orderDetailContent"
        );

    const errorText =
        document.getElementById(
            "orderErrorMessage"
        );

    if (loading) {
        loading.classList.add(
            "d-none"
        );
    }

    if (content) {
        content.classList.add(
            "d-none"
        );
    }

    if (errorBox) {
        errorBox.classList.remove(
            "d-none"
        );
    }

    if (errorText) {
        errorText.textContent =
            message;
    }
}