// ========================================================
// FILE: admin-orders.js
// QUẢN LÝ ĐƠN HÀNG
// ========================================================

const orderState = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    searchQuery: "",
    status: "all",
    orders: []
};

const orderDOM = {};


// ========================================================
// 1. CACHE DOM
// ========================================================

function cacheOrderDOM() {
    orderDOM.tableBody =
        document.getElementById("orderTableBody");

    orderDOM.pagination =
        document.getElementById("paginationContainer");

    orderDOM.search =
        document.getElementById("searchOrderInput");

    orderDOM.status =
        document.getElementById("statusFilter");

    orderDOM.refresh =
        document.getElementById("btnRefreshOrders");

    orderDOM.kpiTotal =
        document.getElementById("kpiTotal");

    orderDOM.kpiPending =
        document.getElementById("kpiPending");

    orderDOM.kpiProcessing =
        document.getElementById("kpiProcessing");

    orderDOM.kpiDelivered =
        document.getElementById("kpiDelivered");
}


// ========================================================
// 2. ESCAPE HTML
// ========================================================

function escapeOrderHTML(value) {

    if (
        window.utils &&
        typeof window.utils.escapeHTML === "function"
    ) {
        return window.utils.escapeHTML(value ?? "");
    }

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ========================================================
// 3. FORMAT
// ========================================================

function formatOrderMoney(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0 ₫";
    }

    return (
        number.toLocaleString("vi-VN") +
        " ₫"
    );
}


function formatOrderDate(value) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return (
        date.toLocaleDateString("vi-VN") +
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
// 4. STATUS
// ========================================================

function getOrderStatusMeta(status) {

    const normalized =
        String(status || "")
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
            label: status || "Không xác định",
            className:
                "bg-gray-100 text-gray-600 border-gray-200"
        }
    );
}


// ========================================================
// 5. KPI
// ========================================================

async function loadOrderKPIs() {

    if (!window.supabaseClient) {
        console.error(
            "Không tìm thấy supabaseClient."
        );
        return;
    }

    try {

        const [
            totalResult,
            pendingResult,
            processingResult,
            deliveredResult
        ] = await Promise.all([

            window.supabaseClient
                .from("orders")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                ),

            window.supabaseClient
                .from("orders")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "status",
                    "pending"
                ),

            window.supabaseClient
                .from("orders")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "status",
                    "processing"
                ),

            window.supabaseClient
                .from("orders")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "status",
                    "delivered"
                )
        ]);


        if (totalResult.error) {
            throw totalResult.error;
        }

        if (pendingResult.error) {
            throw pendingResult.error;
        }

        if (processingResult.error) {
            throw processingResult.error;
        }

        if (deliveredResult.error) {
            throw deliveredResult.error;
        }


        if (orderDOM.kpiTotal) {
            orderDOM.kpiTotal.textContent =
                totalResult.count || 0;
        }

        if (orderDOM.kpiPending) {
            orderDOM.kpiPending.textContent =
                pendingResult.count || 0;
        }

        if (orderDOM.kpiProcessing) {
            orderDOM.kpiProcessing.textContent =
                processingResult.count || 0;
        }

        if (orderDOM.kpiDelivered) {
            orderDOM.kpiDelivered.textContent =
                deliveredResult.count || 0;
        }

    } catch (error) {

        console.error(
            "Lỗi tải KPI đơn hàng:",
            error
        );
    }
}


// ========================================================
// 6. LOAD ORDERS
// ========================================================

async function fetchOrders() {

    if (!window.supabaseClient) {

        renderOrderMessage(
            "Supabase chưa được khởi tạo.",
            true
        );

        return;
    }


    renderOrderMessage(
        "Đang tải đơn hàng..."
    );


    const from =
        (
            orderState.currentPage - 1
        ) *
        orderState.itemsPerPage;


    const to =
        from +
        orderState.itemsPerPage -
        1;


    try {

        let query =
            window.supabaseClient
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
                    `,
                    {
                        count: "exact"
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .range(
                    from,
                    to
                );


        if (
            orderState.status !==
            "all"
        ) {

            query =
                query.eq(
                    "status",
                    orderState.status
                );
        }


        const keyword =
            orderState.searchQuery
                .trim();


        if (keyword) {

            query =
                query.or(
                    [
                        `order_code.ilike.%${keyword}%`,
                        `shipping_name.ilike.%${keyword}%`,
                        `shipping_phone.ilike.%${keyword}%`
                    ].join(",")
                );
        }


        const {
            data,
            count,
            error
        } = await query;


        if (error) {
            throw error;
        }


        orderState.orders =
            data || [];

        orderState.totalItems =
            count || 0;


        renderOrders();

        renderOrderPagination();

    } catch (error) {

        console.error(
            "Lỗi tải orders:",
            error
        );

        renderOrderMessage(
            "Không thể tải đơn hàng: " +
            error.message,
            true
        );
    }
}


// ========================================================
// 7. RENDER TABLE
// ========================================================

function renderOrders() {

    if (!orderDOM.tableBody) {
        return;
    }


    if (
        orderState.orders.length === 0
    ) {

        orderDOM.tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="p-12 text-center"
                >

                    <div
                        class="text-4xl mb-3"
                    >
                        📦
                    </div>

                    <p
                        class="font-bold text-gray-700"
                    >
                        Không tìm thấy đơn hàng
                    </p>

                    <p
                        class="text-xs text-gray-400 mt-1"
                    >
                        Thử thay đổi từ khóa hoặc trạng thái.
                    </p>

                </td>
            </tr>
        `;

        return;
    }


    const offset =
        (
            orderState.currentPage - 1
        ) *
        orderState.itemsPerPage;


    orderDOM.tableBody.innerHTML =
        orderState.orders
            .map(
                (
                    order,
                    index
                ) => {

                    const status =
                        getOrderStatusMeta(
                            order.status
                        );


                    const customerName =
                        order.shipping_name ||
                        "Khách hàng";


                    const phone =
                        order.shipping_phone ||
                        "-";


                    return `
                        <tr
                            class="
                                border-b
                                border-gray-100
                                hover:bg-gray-50
                                transition
                            "
                        >

                            <td
                                class="
                                    p-4
                                    text-center
                                    text-gray-400
                                    text-xs
                                    font-bold
                                "
                            >
                                ${offset + index + 1}
                            </td>


                            <td class="p-4">

                                <a
                                    href="
                                        manage-order-detail.html?id=${encodeURIComponent(
                                            order.id
                                        )}
                                    "
                                    class="
                                        font-black
                                        text-kn-blue
                                        hover:underline
                                    "
                                >
                                    ${escapeOrderHTML(
                                        order.order_code
                                    )}
                                </a>

                                <p
                                    class="
                                        text-[11px]
                                        text-gray-400
                                        mt-1
                                    "
                                >
                                    ID #${escapeOrderHTML(
                                        order.id
                                    )}
                                </p>

                            </td>


                            <td class="p-4">

                                <p
                                    class="
                                        font-bold
                                        text-gray-800
                                    "
                                >
                                    ${escapeOrderHTML(
                                        customerName
                                    )}
                                </p>

                                <p
                                    class="
                                        text-xs
                                        text-gray-500
                                        mt-1
                                    "
                                >
                                    ${escapeOrderHTML(
                                        phone
                                    )}
                                </p>

                            </td>


                            <td
                                class="
                                    p-4
                                    text-sm
                                    text-gray-600
                                "
                            >
                                ${escapeOrderHTML(
                                    formatOrderDate(
                                        order.created_at
                                    )
                                )}
                            </td>


                            <td
                                class="
                                    p-4
                                    text-right
                                    font-black
                                    whitespace-nowrap
                                "
                            >
                                ${escapeOrderHTML(
                                    formatOrderMoney(
                                        order.total
                                    )
                                )}
                            </td>


                            <td
                                class="
                                    p-4
                                    text-center
                                "
                            >

                                <span
                                    class="
                                        inline-flex
                                        px-2.5
                                        py-1
                                        rounded-full
                                        border
                                        text-[11px]
                                        font-black
                                        whitespace-nowrap
                                        ${status.className}
                                    "
                                >
                                    ${escapeOrderHTML(
                                        status.label
                                    )}
                                </span>

                            </td>


                            <td
                                class="
                                    p-4
                                    text-right
                                "
                            >

                                <a
                                    href="
                                        manage-order-detail.html?id=${encodeURIComponent(
                                            order.id
                                        )}
                                    "
                                    class="
                                        inline-flex
                                        px-3
                                        py-1.5
                                        rounded-lg
                                        bg-kn-blue
                                        text-white
                                        hover:bg-blue-800
                                        text-xs
                                        font-bold
                                    "
                                >
                                    Xem đơn
                                </a>

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


// ========================================================
// 8. PAGINATION
// ========================================================

function renderOrderPagination() {

    if (!orderDOM.pagination) {
        return;
    }


    const totalPages =
        Math.ceil(
            orderState.totalItems /
            orderState.itemsPerPage
        );


    if (totalPages <= 1) {

        orderDOM.pagination.innerHTML =
            "";

        return;
    }


    let html = "";


    if (
        orderState.currentPage > 1
    ) {

        html += `
            <button
                type="button"
                onclick="
                    changeOrderPage(
                        ${orderState.currentPage - 1}
                    )
                "
                class="
                    px-3
                    py-1.5
                    bg-white
                    border
                    rounded-lg
                    text-sm
                    font-bold
                "
            >
                &laquo;
            </button>
        `;
    }


    const startPage =
        Math.max(
            1,
            orderState.currentPage - 3
        );


    const endPage =
        Math.min(
            totalPages,
            startPage + 6
        );


    for (
        let page = startPage;
        page <= endPage;
        page++
    ) {

        const active =
            page ===
            orderState.currentPage;


        html += `
            <button
                type="button"
                onclick="
                    changeOrderPage(
                        ${page}
                    )
                "
                class="
                    px-3
                    py-1.5
                    rounded-lg
                    border
                    text-sm
                    font-bold
                    ${
                        active
                            ? "bg-kn-blue text-white border-kn-blue"
                            : "bg-white text-gray-600"
                    }
                "
            >
                ${page}
            </button>
        `;
    }


    if (
        orderState.currentPage <
        totalPages
    ) {

        html += `
            <button
                type="button"
                onclick="
                    changeOrderPage(
                        ${orderState.currentPage + 1}
                    )
                "
                class="
                    px-3
                    py-1.5
                    bg-white
                    border
                    rounded-lg
                    text-sm
                    font-bold
                "
            >
                &raquo;
            </button>
        `;
    }


    orderDOM.pagination.innerHTML = `
        <div
            class="
                flex
                items-center
                gap-1
            "
        >
            ${html}
        </div>
    `;
}


window.changeOrderPage =
function (page) {

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                orderState.totalItems /
                orderState.itemsPerPage
            )
        );


    orderState.currentPage =
        Math.min(
            Math.max(
                1,
                Number(page) || 1
            ),
            totalPages
        );


    fetchOrders();
};


// ========================================================
// 9. MESSAGE
// ========================================================

function renderOrderMessage(
    message,
    isError = false
) {

    if (!orderDOM.tableBody) {
        return;
    }


    orderDOM.tableBody.innerHTML = `
        <tr>

            <td
                colspan="7"
                class="
                    p-12
                    text-center
                    ${
                        isError
                            ? "text-red-500"
                            : "text-gray-400"
                    }
                    font-bold
                "
            >
                ${escapeOrderHTML(
                    message
                )}
            </td>

        </tr>
    `;
}


// ========================================================
// 10. EVENTS
// ========================================================

function bindOrderEvents() {

    if (orderDOM.search) {

        let searchTimer = null;


        orderDOM.search.addEventListener(
            "input",
            () => {

                clearTimeout(
                    searchTimer
                );


                searchTimer =
                    setTimeout(
                        () => {

                            orderState.searchQuery =
                                orderDOM.search.value.trim();

                            orderState.currentPage =
                                1;

                            fetchOrders();

                        },
                        300
                    );
            }
        );
    }


    if (orderDOM.status) {

        orderDOM.status.addEventListener(
            "change",
            () => {

                orderState.status =
                    orderDOM.status.value;

                orderState.currentPage =
                    1;

                fetchOrders();
            }
        );
    }


    if (orderDOM.refresh) {

        orderDOM.refresh.addEventListener(
            "click",
            async () => {

                orderDOM.refresh.disabled =
                    true;

                orderDOM.refresh.textContent =
                    "Đang tải...";


                await Promise.all([
                    fetchOrders(),
                    loadOrderKPIs()
                ]);


                orderDOM.refresh.disabled =
                    false;

                orderDOM.refresh.textContent =
                    "↻ Làm mới";
            }
        );
    }
}


// ========================================================
// 11. INIT
// ========================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        cacheOrderDOM();

        bindOrderEvents();


        await Promise.all([
            fetchOrders(),
            loadOrderKPIs()
        ]);

    }
);