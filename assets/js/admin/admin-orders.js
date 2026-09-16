// ========================================================
// FILE: admin-orders.js
// QUẢN LÝ ĐƠN HÀNG (CÓ BỘ LỌC TÌM KIẾM, TRẠNG THÁI, NGÀY THÁNG)
// ========================================================

const orderState = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    searchQuery: "",
    status: "all",
    date: "", // <-- Trạng thái lọc ngày
    orders: []
};

const orderDOM = {};

// ========================================================
// 1. CACHE DOM
// ========================================================
function cacheOrderDOM() {
    orderDOM.tableBody = document.getElementById("orderTableBody");
    orderDOM.pagination = document.getElementById("paginationContainer");
    orderDOM.search = document.getElementById("searchOrderInput");
    orderDOM.status = document.getElementById("statusFilter");
    orderDOM.date = document.getElementById("dateFilter"); // <-- DOM của ngày
    orderDOM.refresh = document.getElementById("btnRefreshOrders");
    
    orderDOM.kpiTotal = document.getElementById("kpiTotal");
    orderDOM.kpiPending = document.getElementById("kpiPending");
    orderDOM.kpiProcessing = document.getElementById("kpiProcessing");
    orderDOM.kpiDelivered = document.getElementById("kpiDelivered");
}

// ========================================================
// 2. ESCAPE HTML & FORMATTERS
// ========================================================
function escapeOrderHTML(value) {
    if (window.utils && typeof window.utils.escapeHTML === "function") {
        return window.utils.escapeHTML(value ?? "");
    }
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatOrderMoney(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "0 ₫";
    return number.toLocaleString("vi-VN") + " ₫";
}

function formatOrderDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function getOrderStatusMeta(status) {
    const normalized = String(status || "").trim().toLowerCase();
    const statuses = {
        pending: { label: "Chờ xử lý", className: "bg-orange-100 text-orange-700 border-orange-200" },
        confirmed: { label: "Đã xác nhận", className: "bg-blue-100 text-blue-700 border-blue-200" },
        processing: { label: "Đang xử lý", className: "bg-purple-100 text-purple-700 border-purple-200" },
        shipped: { label: "Đang giao", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
        delivered: { label: "Đã giao", className: "bg-green-100 text-green-700 border-green-200" },
        cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-700 border-red-200" }
    };
    return statuses[normalized] || { label: status || "Không xác định", className: "bg-gray-100 text-gray-600 border-gray-200" };
}

// ========================================================
// 3. KPI
// ========================================================
async function loadOrderKPIs() {
    if (!window.supabaseClient) return;

    try {
        const [totalResult, pendingResult, processingResult, deliveredResult] = await Promise.all([
            window.supabaseClient.from("orders").select("id", { count: "exact", head: true }),
            window.supabaseClient.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
            window.supabaseClient.from("orders").select("id", { count: "exact", head: true }).eq("status", "processing"),
            window.supabaseClient.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered")
        ]);

        if (orderDOM.kpiTotal) orderDOM.kpiTotal.textContent = totalResult.count || 0;
        if (orderDOM.kpiPending) orderDOM.kpiPending.textContent = pendingResult.count || 0;
        if (orderDOM.kpiProcessing) orderDOM.kpiProcessing.textContent = processingResult.count || 0;
        if (orderDOM.kpiDelivered) orderDOM.kpiDelivered.textContent = deliveredResult.count || 0;

    } catch (error) {
        console.error("Lỗi tải KPI đơn hàng:", error);
    }
}

// ========================================================
// 4. LOAD ORDERS
// ========================================================
async function fetchOrders() {
    if (!window.supabaseClient) {
        renderOrderMessage("Supabase chưa được khởi tạo.", true);
        return;
    }

    renderOrderMessage("Đang tải đơn hàng...");

    const from = (orderState.currentPage - 1) * orderState.itemsPerPage;
    const to = from + orderState.itemsPerPage - 1;

    try {
        let query = window.supabaseClient
            .from("orders")
            .select(`id, user_id, order_code, status, subtotal, shipping_fee, total, shipping_name, shipping_phone, shipping_address, note, created_at`, { count: "exact" })
            .order("created_at", { ascending: false })
            .range(from, to);

        // Lọc trạng thái
        if (orderState.status !== "all") {
            query = query.eq("status", orderState.status);
        }

        // Lọc ngày (Chuyển đổi timezone chuẩn)
        if (orderState.date) {
            const startDate = new Date(`${orderState.date}T00:00:00`).toISOString();
            const endDate = new Date(`${orderState.date}T23:59:59.999`).toISOString();
            query = query.gte("created_at", startDate).lte("created_at", endDate);
        }

        // Lọc Text
        const keyword = orderState.searchQuery.trim();
        if (keyword) {
            query = query.or(`order_code.ilike.%${keyword}%,shipping_name.ilike.%${keyword}%,shipping_phone.ilike.%${keyword}%`);
        }

        const { data, count, error } = await query;
        if (error) throw error;

        orderState.orders = data || [];
        orderState.totalItems = count || 0;

        renderOrders();
        renderOrderPagination();

    } catch (error) {
        console.error("Lỗi tải orders:", error);
        renderOrderMessage("Không thể tải đơn hàng: " + error.message, true);
    }
}

// ========================================================
// 5. RENDER TABLE
// ========================================================
function renderOrders() {
    if (!orderDOM.tableBody) return;

    if (orderState.orders.length === 0) {
        orderDOM.tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="p-12 text-center">
                    <div class="text-4xl mb-3 text-gray-300"><svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg></div>
                    <p class="font-bold text-gray-500">Không tìm thấy đơn hàng</p>
                    <p class="text-xs text-gray-400 mt-1">Thử thay đổi từ khóa, ngày tháng hoặc trạng thái.</p>
                </td>
            </tr>
        `;
        return;
    }

    const offset = (orderState.currentPage - 1) * orderState.itemsPerPage;

    orderDOM.tableBody.innerHTML = orderState.orders.map((order, index) => {
        const status = getOrderStatusMeta(order.status);
        const customerName = order.shipping_name || "Khách hàng";
        const phone = order.shipping_phone || "-";

        return `
            <tr class="border-b border-gray-100 hover:bg-blue-50/50 transition">
                <td class="p-4 text-center text-gray-400 text-xs font-bold border-r border-gray-50">
                    ${offset + index + 1}
                </td>
                <td class="p-4">
                    <a href="manage-order-detail.html?id=${encodeURIComponent(order.id)}" class="font-black text-kn-blue hover:underline">
                        ${escapeOrderHTML(order.order_code)}
                    </a>
                    <p class="text-[10px] text-gray-400 mt-1 font-mono">ID #${escapeOrderHTML(order.id)}</p>
                </td>
                <td class="p-4">
                    <p class="font-bold text-gray-800">${escapeOrderHTML(customerName)}</p>
                    <p class="text-xs text-gray-500 mt-1 font-mono">${escapeOrderHTML(phone)}</p>
                </td>
                <td class="p-4 text-sm text-gray-600">
                    ${escapeOrderHTML(formatOrderDate(order.created_at))}
                </td>
                <td class="p-4 text-right font-black whitespace-nowrap text-kn-blue">
                    ${escapeOrderHTML(formatOrderMoney(order.total))}
                </td>
                <td class="p-4 text-center">
                    <span class="inline-flex px-2.5 py-1 rounded-full border text-[11px] font-black whitespace-nowrap ${status.className}">
                        ${escapeOrderHTML(status.label)}
                    </span>
                </td>
                <td class="p-4 text-right">
                    <a href="manage-order-detail.html?id=${encodeURIComponent(order.id)}" class="inline-flex px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:text-kn-blue hover:border-kn-blue hover:bg-blue-50 text-[11px] font-bold transition shadow-sm">
                        Xem đơn
                    </a>
                </td>
            </tr>
        `;
    }).join("");
}

// ========================================================
// 6. PAGINATION
// ========================================================
function renderOrderPagination() {
    if (!orderDOM.pagination) return;

    const totalPages = Math.ceil(orderState.totalItems / orderState.itemsPerPage);

    if (totalPages <= 1) {
        orderDOM.pagination.innerHTML = "";
        return;
    }

    let html = "";

    if (orderState.currentPage > 1) {
        html += `<button type="button" onclick="changeOrderPage(${orderState.currentPage - 1})" class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50">&laquo;</button>`;
    }

    const startPage = Math.max(1, orderState.currentPage - 3);
    const endPage = Math.min(totalPages, startPage + 6);

    for (let page = startPage; page <= endPage; page++) {
        const active = page === orderState.currentPage;
        html += `<button type="button" onclick="changeOrderPage(${page})" class="px-3 py-1.5 rounded-lg border text-sm font-bold transition ${active ? "bg-kn-blue text-white border-kn-blue" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}">${page}</button>`;
    }

    if (orderState.currentPage < totalPages) {
        html += `<button type="button" onclick="changeOrderPage(${orderState.currentPage + 1})" class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50">&raquo;</button>`;
    }

    orderDOM.pagination.innerHTML = `<div class="flex items-center gap-1">${html}</div>`;
}

window.changeOrderPage = function (page) {
    const totalPages = Math.max(1, Math.ceil(orderState.totalItems / orderState.itemsPerPage));
    orderState.currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
    fetchOrders();
};

function renderOrderMessage(message, isError = false) {
    if (!orderDOM.tableBody) return;
    orderDOM.tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="p-12 text-center ${isError ? "text-red-500" : "text-gray-400"} font-bold text-sm">
                ${escapeOrderHTML(message)}
            </td>
        </tr>
    `;
}

// ========================================================
// 7. EVENTS
// ========================================================
function bindOrderEvents() {

    // Sự kiện Gõ phím tìm kiếm
    if (orderDOM.search) {
        let searchTimer = null;
        orderDOM.search.addEventListener("input", () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                orderState.searchQuery = orderDOM.search.value.trim();
                orderState.currentPage = 1;
                fetchOrders();
            }, 300);
        });
    }

    // Sự kiện đổi trạng thái
    if (orderDOM.status) {
        orderDOM.status.addEventListener("change", () => {
            orderState.status = orderDOM.status.value;
            orderState.currentPage = 1;
            fetchOrders();
        });
    }

    // Sự kiện đổi ngày
    if (orderDOM.date) {
        orderDOM.date.addEventListener("change", () => {
            orderState.date = orderDOM.date.value;
            orderState.currentPage = 1;
            fetchOrders();
        });
    }

    // Sự kiện click nút Tải lại
    if (orderDOM.refresh) {
        orderDOM.refresh.addEventListener("click", async () => {
            orderDOM.refresh.disabled = true;
            orderDOM.refresh.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Đang tải...`;

            // Reset tất cả bộ lọc khi ấn Làm mới
            orderState.searchQuery = "";
            orderState.status = "all";
            orderState.date = "";
            orderState.currentPage = 1;

            if (orderDOM.search) orderDOM.search.value = "";
            if (orderDOM.status) orderDOM.status.value = "all";
            if (orderDOM.date) orderDOM.date.value = "";

            await Promise.all([
                fetchOrders(),
                loadOrderKPIs()
            ]);

            orderDOM.refresh.disabled = false;
            orderDOM.refresh.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Làm mới`;
        });
    }
}

// ========================================================
// 8. INIT
// ========================================================
document.addEventListener("DOMContentLoaded", async () => {
    cacheOrderDOM();
    bindOrderEvents();

    await Promise.all([
        fetchOrders(),
        loadOrderKPIs()
    ]);
});