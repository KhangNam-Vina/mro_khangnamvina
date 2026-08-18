// ========================================================
// FILE: admin-order-detail.js
// CHI TIẾT ĐƠN HÀNG
// ========================================================

const orderDetailState = {
    orderId: null,
    order: null,
    items: [],
    profile: null
};


const orderDetailDOM = {};


// ========================================================
// 1. CACHE DOM
// ========================================================

function cacheOrderDetailDOM() {

    orderDetailDOM.loading =
        document.getElementById(
            "orderDetailLoading"
        );

    orderDetailDOM.error =
        document.getElementById(
            "orderDetailError"
        );

    orderDetailDOM.errorText =
        document.getElementById(
            "orderDetailErrorText"
        );

    orderDetailDOM.content =
        document.getElementById(
            "orderDetailContent"
        );


    orderDetailDOM.orderCode =
        document.getElementById(
            "orderCode"
        );

    orderDetailDOM.orderCreatedAt =
        document.getElementById(
            "orderCreatedAt"
        );

    orderDetailDOM.orderStatusBadge =
        document.getElementById(
            "orderStatusBadge"
        );

    orderDetailDOM.orderStatusSelect =
        document.getElementById(
            "orderStatusSelect"
        );

    orderDetailDOM.updateStatusButton =
        document.getElementById(
            "btnUpdateOrderStatus"
        );


    orderDetailDOM.customerName =
        document.getElementById(
            "customerName"
        );

    orderDetailDOM.customerPhone =
        document.getElementById(
            "customerPhone"
        );

    orderDetailDOM.customerEmail =
        document.getElementById(
            "customerEmail"
        );

    orderDetailDOM.customerUserId =
        document.getElementById(
            "customerUserId"
        );


    orderDetailDOM.shippingName =
        document.getElementById(
            "shippingName"
        );

    orderDetailDOM.shippingPhone =
        document.getElementById(
            "shippingPhone"
        );

    orderDetailDOM.shippingAddress =
        document.getElementById(
            "shippingAddress"
        );


    orderDetailDOM.itemsBody =
        document.getElementById(
            "orderItemsBody"
        );


    orderDetailDOM.orderSubtotal =
        document.getElementById(
            "orderSubtotal"
        );

    orderDetailDOM.orderShippingFee =
        document.getElementById(
            "orderShippingFee"
        );

    orderDetailDOM.orderTotal =
        document.getElementById(
            "orderTotal"
        );


    orderDetailDOM.noteSection =
        document.getElementById(
            "orderNoteSection"
        );

    orderDetailDOM.note =
        document.getElementById(
            "orderNote"
        );


    orderDetailDOM.quickOrderCode =
        document.getElementById(
            "quickOrderCode"
        );

    orderDetailDOM.quickCreatedAt =
        document.getElementById(
            "quickCreatedAt"
        );

    orderDetailDOM.quickItemsCount =
        document.getElementById(
            "quickItemsCount"
        );
}


// ========================================================
// 2. HELPERS
// ========================================================

function escapeOrderDetailHTML(
    value
) {

    if (
        window.utils &&
        typeof window.utils.escapeHTML ===
            "function"
    ) {

        return window.utils.escapeHTML(
            value ?? ""
        );
    }


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


function formatOrderDetailMoney(
    value
) {

    const number =
        Number(value);


    if (
        !Number.isFinite(
            number
        )
    ) {

        return "0 ₫";
    }


    return (
        number.toLocaleString(
            "vi-VN"
        ) +
        " ₫"
    );
}


function formatOrderDetailDate(
    value
) {

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


    return (
        date.toLocaleDateString(
            "vi-VN"
        ) +
        " " +
        date.toLocaleTimeString(
            "vi-VN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        )
    );
}


// ========================================================
// 3. STATUS META
// ========================================================

function getOrderDetailStatusMeta(
    status
) {

    const normalized =
        String(
            status || ""
        )
            .trim()
            .toLowerCase();


    const statuses = {

        pending: {
            label: "Chờ xử lý",
            className:
                "bg-orange-100 text-orange-700 border-orange-200"
        },

        confirmed: {
            label: "Đã xác nhận",
            className:
                "bg-blue-100 text-blue-700 border-blue-200"
        },

        processing: {
            label: "Đang xử lý",
            className:
                "bg-purple-100 text-purple-700 border-purple-200"
        },

        shipped: {
            label: "Đang giao",
            className:
                "bg-indigo-100 text-indigo-700 border-indigo-200"
        },

        delivered: {
            label: "Đã giao",
            className:
                "bg-green-100 text-green-700 border-green-200"
        },

        cancelled: {
            label: "Đã hủy",
            className:
                "bg-red-100 text-red-700 border-red-200"
        }

    };


    return (
        statuses[normalized] || {
            label:
                status ||
                "Không xác định",
            className:
                "bg-gray-100 text-gray-600 border-gray-200"
        }
    );
}


// ========================================================
// 4. GET ORDER ID
// ========================================================

function getOrderIdFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        params.get("id");


    if (!id) {
        return null;
    }


    const numericId =
        Number(id);


    if (
        !Number.isInteger(
            numericId
        ) ||
        numericId <= 0
    ) {

        return null;
    }


    return numericId;
}


// ========================================================
// 5. LOAD ORDER
// ========================================================

async function loadOrderDetail() {

    if (!window.supabaseClient) {

        throw new Error(
            "Supabase chưa được khởi tạo."
        );
    }


    const orderId =
        orderDetailState.orderId;


    const {
        data: order,
        error
    } =
        await window.supabaseClient
            .from("orders")
            .select(
                `
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
                created_at
                `
            )
            .eq(
                "id",
                orderId
            )
            .single();


    if (error) {
        throw error;
    }


    if (!order) {

        throw new Error(
            "Không tìm thấy đơn hàng."
        );
    }


    orderDetailState.order =
        order;
}


// ========================================================
// 6. LOAD ORDER ITEMS
// ========================================================

async function loadOrderItems() {

    if (!window.supabaseClient) {
        return;
    }


    const {
        data: items,
        error
    } =
        await window.supabaseClient
            .from("order_items")
            .select(
                `
                id,
                order_id,
                product_id,
                product_name,
                sku,
                unit_price,
                quantity,
                subtotal
                `
            )
            .eq(
                "order_id",
                orderDetailState.orderId
            )
            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (error) {
        throw error;
    }


    orderDetailState.items =
        items || [];
}


// ========================================================
// 7. LOAD PROFILE
// ========================================================

async function loadCustomerProfile() {

    const order =
        orderDetailState.order;


    if (
        !order ||
        !order.user_id
    ) {

        return;
    }


    const {
        data: profile,
        error
    } =
        await window.supabaseClient
            .from("profiles")
            .select(
                `
                id,
                email,
                full_name,
                phone,
                company,
                company_name,
                tax_id,
                company_address
                `
            )
            .eq(
                "id",
                order.user_id
            )
            .maybeSingle();


    if (error) {

        console.warn(
            "Không lấy được profile:",
            error
        );

        return;
    }


    orderDetailState.profile =
        profile || null;
}


// ========================================================
// 8. RENDER ORDER HEADER
// ========================================================

function renderOrderHeader() {

    const order =
        orderDetailState.order;


    if (!order) {
        return;
    }


    const status =
        getOrderDetailStatusMeta(
            order.status
        );


    orderDetailDOM.orderCode.textContent =
        order.order_code ||
        "-";


    orderDetailDOM.orderCreatedAt.textContent =
        formatOrderDetailDate(
            order.created_at
        );


    orderDetailDOM.orderStatusBadge.className =
        `
        inline-flex
        px-3
        py-1.5
        rounded-full
        border
        text-xs
        font-black
        ${status.className}
        `;


    orderDetailDOM.orderStatusBadge.textContent =
        status.label;


    orderDetailDOM.orderStatusSelect.value =
        order.status || "pending";


    orderDetailDOM.quickOrderCode.textContent =
        order.order_code ||
        "-";


    orderDetailDOM.quickCreatedAt.textContent =
        formatOrderDetailDate(
            order.created_at
        );
}


// ========================================================
// 9. RENDER CUSTOMER
// ========================================================

function renderCustomer() {

    const order =
        orderDetailState.order;


    const profile =
        orderDetailState.profile;


    const name =
        profile?.full_name ||
        order?.shipping_name ||
        "Khách hàng";


    const phone =
        profile?.phone ||
        order?.shipping_phone ||
        "-";


    const email =
        profile?.email ||
        "-";


    orderDetailDOM.customerName.textContent =
        name;


    orderDetailDOM.customerPhone.textContent =
        phone;


    orderDetailDOM.customerEmail.textContent =
        email;


    orderDetailDOM.customerUserId.textContent =
        order?.user_id ||
        "-";
}


// ========================================================
// 10. RENDER SHIPPING
// ========================================================

function renderShipping() {

    const order =
        orderDetailState.order;


    if (!order) {
        return;
    }


    orderDetailDOM.shippingName.textContent =
        order.shipping_name ||
        "-";


    orderDetailDOM.shippingPhone.textContent =
        order.shipping_phone ||
        "-";


    orderDetailDOM.shippingAddress.textContent =
        order.shipping_address ||
        "-";
}


// ========================================================
// 11. RENDER ITEMS
// ========================================================

function renderItems() {

    if (!orderDetailDOM.itemsBody) {
        return;
    }


    const items =
        orderDetailState.items;


    orderDetailDOM.quickItemsCount.textContent =
        items.length;


    if (!items.length) {

        orderDetailDOM.itemsBody.innerHTML = `
            <tr>

                <td
                    colspan="5"
                    class="
                        p-10
                        text-center
                        text-gray-400
                    "
                >
                    Đơn hàng chưa có sản phẩm.
                </td>

            </tr>
        `;

        return;
    }


    orderDetailDOM.itemsBody.innerHTML =
        items
            .map(
                (item) => {

                    return `
                        <tr>

                            <td class="p-4">

                                <p
                                    class="
                                        font-bold
                                        text-gray-800
                                    "
                                >
                                    ${escapeOrderDetailHTML(
                                        item.product_name
                                    )}
                                </p>

                                <p
                                    class="
                                        text-[11px]
                                        text-gray-400
                                        mt-1
                                    "
                                >
                                    Product ID:
                                    ${escapeOrderDetailHTML(
                                        item.product_id
                                    )}
                                </p>

                            </td>


                            <td
                                class="
                                    p-4
                                    text-sm
                                    text-gray-500
                                "
                            >
                                ${
                                    escapeOrderDetailHTML(
                                        item.sku ||
                                        "-"
                                    )
                                }
                            </td>


                            <td
                                class="
                                    p-4
                                    text-right
                                    font-bold
                                    whitespace-nowrap
                                "
                            >
                                ${
                                    escapeOrderDetailHTML(
                                        formatOrderDetailMoney(
                                            item.unit_price
                                        )
                                    )
                                }
                            </td>


                            <td
                                class="
                                    p-4
                                    text-center
                                    font-bold
                                "
                            >
                                ${
                                    escapeOrderDetailHTML(
                                        item.quantity
                                    )
                                }
                            </td>


                            <td
                                class="
                                    p-4
                                    text-right
                                    font-black
                                    whitespace-nowrap
                                "
                            >
                                ${
                                    escapeOrderDetailHTML(
                                        formatOrderDetailMoney(
                                            item.subtotal
                                        )
                                    )
                                }
                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


// ========================================================
// 12. RENDER SUMMARY
// ========================================================

function renderSummary() {

    const order =
        orderDetailState.order;


    if (!order) {
        return;
    }


    orderDetailDOM.orderSubtotal.textContent =
        formatOrderDetailMoney(
            order.subtotal
        );


    orderDetailDOM.orderShippingFee.textContent =
        formatOrderDetailMoney(
            order.shipping_fee
        );


    orderDetailDOM.orderTotal.textContent =
        formatOrderDetailMoney(
            order.total
        );
}


// ========================================================
// 13. RENDER NOTE
// ========================================================

function renderNote() {

    const order =
        orderDetailState.order;


    if (
        !order ||
        !order.note ||
        !String(
            order.note
        ).trim()
    ) {

        orderDetailDOM.noteSection.classList.add(
            "hidden"
        );

        return;
    }


    orderDetailDOM.noteSection.classList.remove(
        "hidden"
    );


    orderDetailDOM.note.textContent =
        order.note;
}


// ========================================================
// 14. RENDER EVERYTHING
// ========================================================

function renderOrderDetail() {

    renderOrderHeader();

    renderCustomer();

    renderShipping();

    renderItems();

    renderSummary();

    renderNote();
}


// ========================================================
// 15. UPDATE STATUS
// ========================================================

async function updateOrderStatus() {

    if (!orderDetailState.order) {
        return;
    }


    const newStatus =
        orderDetailDOM.orderStatusSelect.value;


    const oldStatus =
        orderDetailState.order.status;


    if (
        newStatus ===
        oldStatus
    ) {

        return;
    }


    const button =
        orderDetailDOM.updateStatusButton;


    button.disabled =
        true;


    button.textContent =
        "Đang cập nhật...";


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("orders")
                .update(
                    {
                        status:
                            newStatus
                    }
                )
                .eq(
                    "id",
                    orderDetailState.orderId
                )
                .select()
                .single();


        if (error) {
            throw error;
        }


        orderDetailState.order =
            data;


        renderOrderHeader();


        alert(
            "Đã cập nhật trạng thái đơn hàng."
        );


    } catch (error) {

        console.error(
            "Lỗi cập nhật trạng thái:",
            error
        );


        alert(
            "Không thể cập nhật trạng thái: " +
            error.message
        );


        orderDetailDOM.orderStatusSelect.value =
            oldStatus;

    } finally {

        button.disabled =
            false;

        button.textContent =
            "Cập nhật";
    }
}


// ========================================================
// 16. SHOW ERROR
// ========================================================

function showOrderDetailError(
    message
) {

    if (
        orderDetailDOM.loading
    ) {

        orderDetailDOM.loading.classList.add(
            "hidden"
        );
    }


    if (
        orderDetailDOM.content
    ) {

        orderDetailDOM.content.classList.add(
            "hidden"
        );
    }


    if (
        orderDetailDOM.error
    ) {

        orderDetailDOM.error.classList.remove(
            "hidden"
        );
    }


    if (
        orderDetailDOM.errorText
    ) {

        orderDetailDOM.errorText.textContent =
            message;
    }
}


// ========================================================
// 17. SHOW CONTENT
// ========================================================

function showOrderDetailContent() {

    if (
        orderDetailDOM.loading
    ) {

        orderDetailDOM.loading.classList.add(
            "hidden"
        );
    }


    if (
        orderDetailDOM.error
    ) {

        orderDetailDOM.error.classList.add(
            "hidden"
        );
    }


    if (
        orderDetailDOM.content
    ) {

        orderDetailDOM.content.classList.remove(
            "hidden"
        );
    }
}


// ========================================================
// 18. EVENTS
// ========================================================

function bindOrderDetailEvents() {

    if (
        orderDetailDOM.updateStatusButton
    ) {

        orderDetailDOM.updateStatusButton.addEventListener(
            "click",
            updateOrderStatus
        );
    }
}


// ========================================================
// 19. INIT
// ========================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        cacheOrderDetailDOM();


        orderDetailState.orderId =
            getOrderIdFromURL();


        if (
            !orderDetailState.orderId
        ) {

            showOrderDetailError(
                "URL không có mã đơn hàng hợp lệ. Hãy mở trang từ danh sách đơn hàng."
            );

            return;
        }


        bindOrderDetailEvents();


        try {

            await loadOrderDetail();

            await loadOrderItems();

            await loadCustomerProfile();


            renderOrderDetail();

            showOrderDetailContent();

        } catch (error) {

            console.error(
                "Lỗi khởi tạo chi tiết đơn hàng:",
                error
            );


            showOrderDetailError(
                error.message ||
                "Có lỗi xảy ra khi tải đơn hàng."
            );
        }

    }
);