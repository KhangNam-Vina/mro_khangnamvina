// ============================================================
// FILE: assets/js/admin/admin-dashboard.js
// DASHBOARD TỔNG QUAN v2.2 - MRO KHANG NAM
// ============================================================

"use strict";

const DASHBOARD = {
    chart: null,
    // Bao thầu cả viết hoa lẫn viết thường để Supabase không bị mù
    pendingOrderStatuses: ["pending", "Pending", "chờ xử lý", "Chờ xử lý", "chờ xác nhận", "Chờ xác nhận", "new", "New"],
    pendingRfqStatuses: ["pending", "Pending", "chờ xử lý", "Chờ xử lý", "chờ báo giá", "Chờ báo giá"],
    pendingContactStatuses: ["pending", "Pending", "chờ duyệt", "Chờ duyệt", "chưa đọc", "Chưa đọc"]
};

const DOM = {
    // KPIs
    kpiRevenue: document.getElementById("kpiRevenue"),
    kpiRevenueGrowth: document.getElementById("kpiRevenueGrowth"),
    kpiOrdersPending: document.getElementById("kpiOrdersPending"),
    kpiRfqPending: document.getElementById("kpiRfqPending"),
    kpiContactPending: document.getElementById("kpiContactPending"),
    
    // Hot Queue
    hqOrders: document.getElementById("hqOrders"),
    hqRfqs: document.getElementById("hqRfqs"),
    hqContacts: document.getElementById("hqContacts"),

    // Tables
    hotOrdersBody: document.getElementById("hotOrdersBody"),
    hotRfqBody: document.getElementById("hotRfqBody"),
    hotContactsBody: document.getElementById("hotContactsBody"),

    // Secondary Stats
    statUsers: document.getElementById("statUsers"),
    statProducts: document.getElementById("statProducts"),
    statBlogs: document.getElementById("statBlogs"),

    // Controls
    btnRefresh: document.getElementById("btnRefreshDashboard"),
    chartMonthFilter: document.getElementById("chartMonthFilter"),
    activityChart: document.getElementById("activityChart")
};

document.addEventListener("DOMContentLoaded", async () => {
    setDefaultMonth();
    setupEvents();
    await loadDashboard();
});

function setupEvents() {
    if (DOM.btnRefresh) {
        DOM.btnRefresh.addEventListener("click", async () => {
            const originalHtml = DOM.btnRefresh.innerHTML;
            DOM.btnRefresh.disabled = true;
            DOM.btnRefresh.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Đang tải...`;
            
            await loadDashboard();
            
            DOM.btnRefresh.disabled = false;
            DOM.btnRefresh.innerHTML = originalHtml;
        });
    }

    if (DOM.chartMonthFilter) {
        DOM.chartMonthFilter.addEventListener("change", loadActivityChart);
    }
}

async function loadDashboard() {
    if (!window.supabaseClient) {
        console.error("Không tìm thấy supabaseClient.");
        return;
    }

    // Load song song mọi thứ để tối ưu tốc độ
    await Promise.all([
        loadCoreKPIs(),
        loadRevenue(), // Kéo lại Doanh thu hiển thị lên thẻ KPI trên cùng
        loadRecentHotOrders(),
        loadRecentHotRfqs(),
        loadRecentContacts(),
        loadSecondaryStats(),
        loadActivityChart()
    ]);
}

// ============================================================
// 1. CORE KPIs (COUNT CHUẨN XÁC, KHÔNG LIMIT)
// ============================================================
async function loadCoreKPIs() {
    try {
        const [ordersRes, rfqsRes, contactsRes] = await Promise.all([
            window.supabaseClient.from("orders").select("id", { count: "exact", head: true }).in("status", DASHBOARD.pendingOrderStatuses),
            window.supabaseClient.from("rfqs").select("id", { count: "exact", head: true }).in("status", DASHBOARD.pendingRfqStatuses),
            window.supabaseClient.from("contacts").select("id", { count: "exact", head: true }).in("status", DASHBOARD.pendingContactStatuses)
        ]);

        const pendingOrdersCount = ordersRes.count || 0;
        const pendingRfqsCount = rfqsRes.count || 0;
        const pendingContactsCount = contactsRes.count || 0;

        // Cập nhật thẻ KPI chính
        setText(DOM.kpiOrdersPending, pendingOrdersCount);
        setText(DOM.kpiRfqPending, pendingRfqsCount);
        setText(DOM.kpiContactPending, pendingContactsCount);

        // Cập nhật khu vực CẦN XỬ LÝ NGAY
        setText(DOM.hqOrders, pendingOrdersCount);
        setText(DOM.hqRfqs, pendingRfqsCount);
        setText(DOM.hqContacts, pendingContactsCount);

    } catch (error) {
        console.error("Lỗi tải KPI cốt lõi:", error);
        setText(DOM.kpiOrdersPending, "--");
        setText(DOM.kpiRfqPending, "--");
        setText(DOM.kpiContactPending, "--");
    }
}

// ============================================================
// 2. DOANH THU & TĂNG TRƯỞNG (CHỈ HIỆN Ở THẺ KPI)
// ============================================================
async function loadRevenue() {
    try {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

        // Query đơn hàng tháng này (Bỏ qua Đã hủy)
        const currentMonthQuery = window.supabaseClient.from("orders")
            .select("total")
            .gte("created_at", startOfThisMonth)
            .not("status", "in", '("cancelled","canceled","đã hủy","hủy")');

        // Query đơn hàng tháng trước (Bỏ qua Đã hủy)
        const lastMonthQuery = window.supabaseClient.from("orders")
            .select("total")
            .gte("created_at", startOfLastMonth)
            .lte("created_at", endOfLastMonth)
            .not("status", "in", '("cancelled","canceled","đã hủy","hủy")');

        const [currRes, lastRes] = await Promise.all([currentMonthQuery, lastMonthQuery]);
        
        if (currRes.error) throw currRes.error;
        if (lastRes.error) throw lastRes.error;

        const currentRevenue = (currRes.data || []).reduce((sum, order) => sum + (Number(order.total) || 0), 0);
        const lastRevenue = (lastRes.data || []).reduce((sum, order) => sum + (Number(order.total) || 0), 0);

        // Render Doanh thu
        if (DOM.kpiRevenue) {
            DOM.kpiRevenue.textContent = new Intl.NumberFormat("vi-VN").format(currentRevenue) + " ₫";
        }

        // Render Tăng trưởng
        if (DOM.kpiRevenueGrowth) {
            if (lastRevenue === 0) {
                DOM.kpiRevenueGrowth.innerHTML = `<span class="text-gray-400">Không có dữ liệu tháng trước</span>`;
            } else {
                const growth = ((currentRevenue - lastRevenue) / lastRevenue) * 100;
                if (growth >= 0) {
                    DOM.kpiRevenueGrowth.innerHTML = `↑ ${growth.toFixed(1)}% <span class="text-gray-400 font-normal">so với tháng trước</span>`;
                    DOM.kpiRevenueGrowth.className = "text-xs font-bold text-green-500 mt-1.5 flex items-center gap-1 relative z-10";
                } else {
                    DOM.kpiRevenueGrowth.innerHTML = `↓ ${Math.abs(growth).toFixed(1)}% <span class="text-gray-400 font-normal">so với tháng trước</span>`;
                    DOM.kpiRevenueGrowth.className = "text-xs font-bold text-red-500 mt-1.5 flex items-center gap-1 relative z-10";
                }
            }
        }
    } catch (error) {
        console.error("Lỗi tính doanh thu:", error);
        if(DOM.kpiRevenue) DOM.kpiRevenue.textContent = "--";
        if(DOM.kpiRevenueGrowth) DOM.kpiRevenueGrowth.innerHTML = "Không thể tải số liệu";
    }
}

// ============================================================
// 3. DANH SÁCH HOT (CHỈ LẤY PENDING)
// ============================================================
async function loadRecentHotOrders() {
    try {
        const { data, error } = await window.supabaseClient.from("orders")
            .select("id, order_code, shipping_name, created_at, status")
            .in("status", DASHBOARD.pendingOrderStatuses)
            .order("created_at", { ascending: false })
            .limit(5);

        if (error) throw error;

        renderHotList(DOM.hotOrdersBody, data, "Chưa có đơn hàng nào chờ xử lý.", (item) => {
            return `
                <tr class="hover:bg-blue-50/50 transition border-b border-gray-50 last:border-0">
                    <td class="px-5 py-3">
                        <div class="font-bold text-kn-blue text-xs">${escapeHTML(item.order_code || `ORD-${item.id}`)}</div>
                        <div class="text-[11px] text-gray-500 mt-0.5">${formatDate(item.created_at)}</div>
                    </td>
                    <td class="px-5 py-3 font-medium text-gray-800 text-xs">${escapeHTML(item.shipping_name || "Khách hàng")}</td>
                    <td class="px-5 py-3 text-right">
                        <a href="manage-order-detail.html?id=${item.id}" class="inline-block px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-600 hover:text-kn-blue hover:border-kn-blue transition">Xem</a>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        renderError(DOM.hotOrdersBody, 3, "Lỗi tải đơn hàng mới.");
    }
}

async function loadRecentHotRfqs() {
    try {
        const { data, error } = await window.supabaseClient.from("rfqs")
            .select("id, rfq_code, company_name, created_at, status")
            .in("status", DASHBOARD.pendingRfqStatuses)
            .order("created_at", { ascending: false })
            .limit(5);

        if (error) throw error;

        renderHotList(DOM.hotRfqBody, data, "Chưa có RFQ nào chờ báo giá.", (item) => {
            return `
                <tr class="hover:bg-orange-50/50 transition border-b border-gray-50 last:border-0">
                    <td class="px-5 py-3">
                        <div class="font-bold text-kn-orange text-xs">${escapeHTML(item.rfq_code || `RFQ-${item.id}`)}</div>
                        <div class="text-[11px] text-gray-500 mt-0.5">${formatDate(item.created_at)}</div>
                    </td>
                    <td class="px-5 py-3 font-medium text-gray-800 text-xs">${escapeHTML(item.company_name || "Khách vãng lai")}</td>
                    <td class="px-5 py-3 text-right">
                        <a href="manage-rfq-detail.html?id=${item.id}" class="inline-block px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-600 hover:text-kn-orange hover:border-kn-orange transition">Xem</a>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        renderError(DOM.hotRfqBody, 3, "Lỗi tải RFQ mới.");
    }
}

async function loadRecentContacts() {
    try {
        const { data, error } = await window.supabaseClient.from("contacts")
            .select("*")
            .in("status", DASHBOARD.pendingContactStatuses)
            .order("created_at", { ascending: false })
            .limit(5);

        if (error) throw error;

        renderHotList(DOM.hotContactsBody, data, "Chưa có liên hệ nào chờ phản hồi.", (item) => {
            const name = item.name || item.full_name || item.contact_name || "Khách hàng";
            return `
                <tr class="hover:bg-red-50/50 transition border-b border-gray-50 last:border-0">
                    <td class="px-5 py-3 font-bold text-gray-800 text-xs">${escapeHTML(name)}</td>
                    <td class="px-5 py-3 text-xs text-gray-600">${escapeHTML(item.email || item.phone || "-")}</td>
                    <td class="px-5 py-3 text-[11px] text-gray-500">${formatDate(item.created_at)}</td>
                    <td class="px-5 py-3 text-right">
                        <a href="manage-contacts.html" class="inline-block px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-600 hover:text-red-500 hover:border-red-500 transition">Xử lý</a>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        renderError(DOM.hotContactsBody, 4, "Lỗi tải liên hệ mới.");
    }
}

// ============================================================
// 4. BIỂU ĐỒ (CHỈ HIỂN THỊ SỐ LƯỢNG ĐƠN & BÁO GIÁ)
// ============================================================
async function loadActivityChart() {
    if (!DOM.activityChart) return;

    try {
        const selected = DOM.chartMonthFilter?.value;
        let selectedDate = selected ? new Date(`${selected}-01T00:00:00`) : new Date();
        const months = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - i, 1);
            months.push({
                key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
                label: `T${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`,
                orderCount: 0,
                rfqCount: 0
            });
        }

        const startDate = new Date(months[0].key + "-01T00:00:00").toISOString();
        const endMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);
        const endDate = endMonthDate.toISOString();

        // Kéo số liệu Đơn hàng & Báo giá
        const [orderResult, rfqResult] = await Promise.all([
            window.supabaseClient.from("orders").select("created_at").gte("created_at", startDate).lte("created_at", endDate),
            window.supabaseClient.from("rfqs").select("created_at").gte("created_at", startDate).lte("created_at", endDate)
        ]);

        if (orderResult.error) throw orderResult.error;
        if (rfqResult.error) throw rfqResult.error;

        (orderResult.data || []).forEach(row => {
            const date = new Date(row.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const monthObj = months.find(m => m.key === key);
            if (monthObj) monthObj.orderCount++;
        });

        (rfqResult.data || []).forEach(row => {
            const date = new Date(row.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const monthObj = months.find(m => m.key === key);
            if (monthObj) monthObj.rfqCount++;
        });

        const labels = months.map(m => m.label);
        const orderData = months.map(m => m.orderCount);
        const rfqData = months.map(m => m.rfqCount);

        if (DASHBOARD.chart) {
            DASHBOARD.chart.destroy();
        }

        DASHBOARD.chart = new Chart(DOM.activityChart.getContext("2d"), {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Đơn hàng",
                        data: orderData,
                        backgroundColor: "#00479b",
                        borderRadius: 4
                    },
                    {
                        label: "Yêu cầu Báo giá",
                        data: rfqData,
                        backgroundColor: "#ff5e00",
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom", labels: { usePointStyle: true, padding: 20 } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 },
                        grid: { color: "#f3f4f6" }
                    },
                    x: { grid: { display: false } }
                }
            }
        });

    } catch (error) {
        console.error("Lỗi biểu đồ dashboard:", error);
    }
}

// ============================================================
// 5. THỐNG KÊ PHỤ (SECONDARY STATS)
// ============================================================
async function loadSecondaryStats() {
    try {
        const [usersRes, productsRes, blogsRes] = await Promise.all([
            window.supabaseClient.from("profiles").select("id", { count: "exact", head: true }),
            window.supabaseClient.from("products").select("id", { count: "exact", head: true }),
            window.supabaseClient.from("blogs").select("id", { count: "exact", head: true })
        ]);

        setText(DOM.statUsers, usersRes.count || "--");
        setText(DOM.statProducts, productsRes.count || "--");
        setText(DOM.statBlogs, blogsRes.count || "--");
    } catch (error) {
        setText(DOM.statUsers, "--");
        setText(DOM.statProducts, "--");
        setText(DOM.statBlogs, "--");
    }
}

// ============================================================
// HELPERS
// ============================================================
function renderHotList(tbody, data, emptyMessage, mapFn) {
    if (!tbody) return;
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-400 text-xs italic">${emptyMessage}</td></tr>`;
        return;
    }
    tbody.innerHTML = data.map(mapFn).join("");
}

function renderError(tbody, colspan, message) {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-6 text-red-500 font-bold text-xs">-- ${message} --</td></tr>`;
}

function setText(element, value) {
    if (element) element.textContent = value;
}

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function escapeHTML(value) {
    if (window.utils && typeof window.utils.escapeHTML === "function") {
        return window.utils.escapeHTML(String(value ?? ""));
    }
    return String(value ?? "").replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);
}

function setDefaultMonth() {
    if (!DOM.chartMonthFilter) return;
    const today = new Date();
    DOM.chartMonthFilter.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}