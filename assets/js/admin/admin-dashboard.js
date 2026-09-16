// ============================================================
// FILE: assets/js/admin/admin-dashboard.js
// DASHBOARD TỔNG QUAN v3.0 (SUPER OPTIMIZED RPC)
// ============================================================

"use strict";

const DASHBOARD = {
    chart: null
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

    // TỐI ƯU CỰC ĐỘ: Từ 13 requests trước đây, giờ gom lại chạy song song ĐÚNG 2 REQUEST!
    await Promise.all([
        loadMainSummary(),
        loadActivityChart()
    ]);
}

// ============================================================
// HÀM TRIỆU HỒI DỮ LIỆU TỔNG HỢP QUA RPC (SUPABASE)
// ============================================================
async function loadMainSummary() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    try {
        // GỌI ĐÚNG 1 LẦN DUY NHẤT TRÊN SERVER
        const { data, error } = await window.supabaseClient.rpc('get_admin_dashboard_summary', {
            this_month_start: startOfThisMonth,
            last_month_start: startOfLastMonth,
            last_month_end: endOfLastMonth
        });

        if (error) throw error;

        // 1. CẬP NHẬT CÁC CON SỐ KPI & CẦN XỬ LÝ
        setText(DOM.kpiOrdersPending, data.pending_orders);
        setText(DOM.kpiRfqPending, data.pending_rfqs);
        setText(DOM.kpiContactPending, data.pending_contacts);
        
        setText(DOM.hqOrders, data.pending_orders);
        setText(DOM.hqRfqs, data.pending_rfqs);
        setText(DOM.hqContacts, data.pending_contacts);

        // 2. CẬP NHẬT DOANH THU & TĂNG TRƯỞNG
        if (DOM.kpiRevenue) {
            DOM.kpiRevenue.textContent = new Intl.NumberFormat("vi-VN").format(data.current_revenue) + " ₫";
        }
        if (DOM.kpiRevenueGrowth) {
            if (data.last_revenue === 0) {
                DOM.kpiRevenueGrowth.innerHTML = `<span class="text-gray-400">Không có dữ liệu tháng trước</span>`;
            } else {
                const growth = ((data.current_revenue - data.last_revenue) / data.last_revenue) * 100;
                if (growth >= 0) {
                    DOM.kpiRevenueGrowth.innerHTML = `↑ ${growth.toFixed(1)}% <span class="text-gray-400 font-normal">so với tháng trước</span>`;
                    DOM.kpiRevenueGrowth.className = "text-xs font-bold text-green-500 mt-1.5 flex items-center gap-1 relative z-10";
                } else {
                    DOM.kpiRevenueGrowth.innerHTML = `↓ ${Math.abs(growth).toFixed(1)}% <span class="text-gray-400 font-normal">so với tháng trước</span>`;
                    DOM.kpiRevenueGrowth.className = "text-xs font-bold text-red-500 mt-1.5 flex items-center gap-1 relative z-10";
                }
            }
        }

        // 3. CẬP NHẬT THỐNG KÊ PHỤ
        setText(DOM.statUsers, data.total_users);
        setText(DOM.statProducts, data.total_products);
        setText(DOM.statBlogs, data.total_blogs);

        // 4. VẼ 3 BẢNG LIST HOT (CHỜ XỬ LÝ)
        renderHotList(DOM.hotOrdersBody, data.hot_orders, "Chưa có đơn hàng nào chờ xử lý.", (item) => {
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

        renderHotList(DOM.hotRfqBody, data.hot_rfqs, "Chưa có RFQ nào chờ báo giá.", (item) => {
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

        renderHotList(DOM.hotContactsBody, data.hot_contacts, "Chưa có liên hệ nào chờ phản hồi.", (item) => {
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
        console.error("Lỗi tải Dashboard Summary:", error);
        setText(DOM.kpiOrdersPending, "--");
        setText(DOM.kpiRfqPending, "--");
        setText(DOM.kpiContactPending, "--");
        if(DOM.kpiRevenue) DOM.kpiRevenue.textContent = "--";
        if(DOM.kpiRevenueGrowth) DOM.kpiRevenueGrowth.innerHTML = "Lỗi kết nối";
        renderError(DOM.hotOrdersBody, 3, "Lỗi tải dữ liệu.");
        renderError(DOM.hotRfqBody, 3, "Lỗi tải dữ liệu.");
        renderError(DOM.hotContactsBody, 4, "Lỗi tải dữ liệu.");
    }
}

// ============================================================
// 4. BIỂU ĐỒ (DỮ LIỆU ĐỘC LẬP - 2 REQUESTS)
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

        // Kéo số liệu Đơn hàng & Báo giá cho biểu đồ
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
// CÁC HÀM TIỆN ÍCH (HELPERS)
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