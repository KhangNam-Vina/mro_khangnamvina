// ============================================================
// FILE: assets/js/admin/admin-rfq.js
// QUẢN LÝ DANH SÁCH BÁO GIÁ (CÓ TÌM KIẾM, LỌC TRẠNG THÁI, NGÀY THÁNG, THỜI GIAN TOÀN CỤC)
// ============================================================

"use strict";

const rfqState = {
    allData: [],
    filteredData: [],
    page: 1,
    pageSize: 10,
    timeRange: "this_month" // <-- Trạng thái thời gian toàn cục
};

const rfqDOM = {
    tableBody: document.getElementById("rfqTableBody"),
    emptyState: document.getElementById("emptyState"),
    searchInput: document.getElementById("searchInput"),
    statusFilter: document.getElementById("statusFilter"),
    dateFilter: document.getElementById("dateFilter"),
    globalTimeFilter: document.getElementById("globalTimeFilter"), // <-- DOM MỚI
    btnRefresh: document.getElementById("btnRefresh"),
    btnPrev: document.getElementById("btnPrev"),
    btnNext: document.getElementById("btnNext"),
    pageInfo: document.getElementById("pageInfo"),
    resultInfo: document.getElementById("resultInfo"),
    statTotal: document.getElementById("statTotal"),
    statPending: document.getElementById("statPending"),
    statQuoted: document.getElementById("statQuoted"),
    statRejected: document.getElementById("statRejected")
};

document.addEventListener("DOMContentLoaded", async () => {
    if (rfqDOM.globalTimeFilter) rfqDOM.globalTimeFilter.value = rfqState.timeRange;
    bindEvents();
    await loadRfqs();
});

// LẤY KHOẢNG THỜI GIAN THEO LỰA CHỌN
function getTimeRangeDates(range) {
    const now = new Date();
    let start, end;
    
    if (range === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    } else if (range === '7_days') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (range === 'this_month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (range === 'last_month') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else {
        return null; // All time
    }
    return { start: start.toISOString(), end: end.toISOString() };
}

// ============================================================
// EVENTS (Lắng nghe Tìm kiếm, Trạng thái, Ngày, Thời gian chung)
// ============================================================
function bindEvents() {
    
    // GÕ TÌM KIẾM
    if (rfqDOM.searchInput) {
        let searchTimer;
        rfqDOM.searchInput.addEventListener("input", () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                rfqState.page = 1;
                applyFilters(); // Text Search thì lọc cục bộ
            }, 300);
        });
    }

    // LỌC THEO TRẠNG THÁI
    if (rfqDOM.statusFilter) {
        rfqDOM.statusFilter.addEventListener("change", () => {
            rfqState.page = 1;
            applyFilters(); // Trạng thái thì lọc cục bộ
        });
    }

    // BỘ LỌC THEO NGÀY CỤ THỂ (Dưới bảng)
    if (rfqDOM.dateFilter) {
        rfqDOM.dateFilter.addEventListener("change", () => {
            rfqState.page = 1;
            loadRfqs(); // Thay đổi ngày cụ thể thì tải lại Data từ Server để KPI tự update
        });
    }

    // BỘ LỌC THỜI GIAN TOÀN CỤC (Header)
    if (rfqDOM.globalTimeFilter) {
        rfqDOM.globalTimeFilter.addEventListener("change", () => {
            rfqState.timeRange = rfqDOM.globalTimeFilter.value;
            
            // Xóa ngày cụ thể để tránh xung đột
            if (rfqDOM.dateFilter) rfqDOM.dateFilter.value = ""; 
            
            rfqState.page = 1;
            loadRfqs(); // Tải lại Data từ Server
        });
    }

    // NÚT LÀM MỚI TỔNG LỰC
    if (rfqDOM.btnRefresh) {
        rfqDOM.btnRefresh.addEventListener("click", async () => {
            const originalHtml = rfqDOM.btnRefresh.innerHTML;
            rfqDOM.btnRefresh.disabled = true;
            rfqDOM.btnRefresh.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Đang tải...`;

            // Reset Form
            if (rfqDOM.searchInput) rfqDOM.searchInput.value = "";
            if (rfqDOM.statusFilter) rfqDOM.statusFilter.value = "";
            if (rfqDOM.dateFilter) rfqDOM.dateFilter.value = "";
            if (rfqDOM.globalTimeFilter) rfqDOM.globalTimeFilter.value = "this_month";
            rfqState.timeRange = "this_month";
            rfqState.page = 1;

            await loadRfqs();

            rfqDOM.btnRefresh.disabled = false;
            rfqDOM.btnRefresh.innerHTML = originalHtml;
        });
    }

    if (rfqDOM.btnPrev) {
        rfqDOM.btnPrev.addEventListener("click", () => {
            if (rfqState.page > 1) {
                rfqState.page--;
                renderTable();
            }
        });
    }

    if (rfqDOM.btnNext) {
        rfqDOM.btnNext.addEventListener("click", () => {
            const totalPages = Math.max(1, Math.ceil(rfqState.filteredData.length / rfqState.pageSize));
            if (rfqState.page < totalPages) {
                rfqState.page++;
                renderTable();
            }
        });
    }
}

// ============================================================
// LOAD DATA TỪ SERVER (Có áp dụng Lọc Thời Gian Toàn Cục)
// ============================================================
async function loadRfqs() {
    if (!window.supabaseClient) {
        renderError("Không thể kết nối Supabase.");
        return;
    }

    setLoading();

    try {
        let query = window.supabaseClient
            .from("rfqs")
            .select(`id, created_at, rfq_code, company_name, contact_person, phone, email, notes, status, items, user_id, rejection_reason`)
            .order("created_at", { ascending: false });

        // Lọc trên Server theo Ngày cụ thể hoặc Thời gian toàn cục
        const dateFilterVal = rfqDOM.dateFilter?.value || "";
        if (dateFilterVal) {
            const startDate = new Date(`${dateFilterVal}T00:00:00`).toISOString();
            const endDate = new Date(`${dateFilterVal}T23:59:59.999`).toISOString();
            query = query.gte("created_at", startDate).lte("created_at", endDate);
        } else {
            const tr = getTimeRangeDates(rfqState.timeRange);
            if (tr) query = query.gte("created_at", tr.start).lte("created_at", tr.end);
        }

        const { data, error } = await query;
        if (error) throw error;

        rfqState.allData = Array.isArray(data) ? data : [];

        updateStats(); // Cập nhật KPI dựa trên số liệu vừa kéo về
        applyFilters(); // Cập nhật List

    } catch (error) {
        console.error("[admin-rfq] Load RFQ error:", error);
        renderError("Không thể tải danh sách yêu cầu báo giá.");
    }
}

// ============================================================
// LỌC CỤC BỘ (SEARCH + STATUS)
// ============================================================
function applyFilters() {
    const keyword = (rfqDOM.searchInput?.value || "").trim().toLowerCase();
    const status = rfqDOM.statusFilter?.value || "";

    rfqState.filteredData = rfqState.allData.filter((rfq) => {
        // Lọc Chữ
        const searchableText = [rfq.rfq_code, rfq.company_name, rfq.contact_person, rfq.phone, rfq.email].filter(Boolean).join(" ").toLowerCase();
        const matchesKeyword = !keyword || searchableText.includes(keyword);
        
        // Lọc Trạng thái
        const matchesStatus = !status || normalizeStatus(rfq.status) === normalizeStatus(status);

        return matchesKeyword && matchesStatus;
    });

    renderTable();
}

// ============================================================
// RENDER KPI STATS
// ============================================================
function updateStats() {
    const total = rfqState.allData.length;
    const pending = rfqState.allData.filter((item) => normalizeStatus(item.status) === "chờ xử lý").length;
    const quoted = rfqState.allData.filter((item) => normalizeStatus(item.status) === "đã báo giá").length;
    const rejected = rfqState.allData.filter((item) => normalizeStatus(item.status) === "từ chối").length;

    if (rfqDOM.statTotal) rfqDOM.statTotal.textContent = total;
    if (rfqDOM.statPending) rfqDOM.statPending.textContent = pending;
    if (rfqDOM.statQuoted) rfqDOM.statQuoted.textContent = quoted;
    if (rfqDOM.statRejected) rfqDOM.statRejected.textContent = rejected;
}

// ============================================================
// RENDER TABLE & ROWS
// ============================================================
function renderTable() {
    if (!rfqDOM.tableBody) return;

    const total = rfqState.filteredData.length;

    if (total === 0) {
        rfqDOM.tableBody.innerHTML = "";
        showEmpty();
        updatePagination();
        return;
    }

    hideEmpty();

    const start = (rfqState.page - 1) * rfqState.pageSize;
    const end = start + rfqState.pageSize;
    const pageItems = rfqState.filteredData.slice(start, end);

    // Truyền thêm số start để tính STT
    rfqDOM.tableBody.innerHTML = pageItems.map((rfq, index) => renderRow(rfq, start + index)).join("");

    updatePagination();
}

function renderRow(rfq, absoluteIndex) {
    const code = escapeHTML(rfq.rfq_code || `RFQ-${rfq.id}`);
    const company = escapeHTML(rfq.company_name || "Khách vãng lai");
    const contact = escapeHTML(rfq.contact_person || "-");
    const phone = escapeHTML(rfq.phone || "-");
    const status = rfq.status || "Chờ xử lý";
    const statusBadge = renderStatusBadge(status);
    const itemCount = Array.isArray(rfq.items) ? rfq.items.length : 0;
    const date = formatDate(rfq.created_at);

    return `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
            <td class="p-4 text-center text-xs font-bold text-gray-400 border-r border-gray-50">
                ${absoluteIndex + 1}
            </td>
            <td class="p-4">
                <a href="manage-rfq-detail.html?id=${encodeURIComponent(rfq.id)}" class="font-black text-kn-blue hover:underline">
                    ${code}
                </a>
            </td>
            <td class="p-4 text-sm text-gray-600">
                ${date}
            </td>
            <td class="p-4 font-bold text-gray-800">
                ${company}
            </td>
            <td class="p-4 font-medium text-gray-700">
                ${contact}
            </td>
            <td class="p-4 text-sm text-gray-600 font-mono">
                ${phone}
            </td>
            <td class="p-4 text-center">
                <span class="inline-flex min-w-8 justify-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-bold text-xs">
                    ${itemCount}
                </span>
            </td>
            <td class="p-4 text-center">
                ${statusBadge}
            </td>
            <td class="p-4 text-right">
                <a href="manage-rfq-detail.html?id=${encodeURIComponent(rfq.id)}" class="inline-flex px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:text-kn-blue hover:border-kn-blue hover:bg-blue-50 text-[11px] font-bold transition shadow-sm">
                    Xem chi tiết
                </a>
            </td>
        </tr>
    `;
}

// ============================================================
// BADGES & PAGINATION
// ============================================================
function renderStatusBadge(status) {
    const normalized = normalizeStatus(status);

    if (normalized === "đã báo giá") {
        return `<span class="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 font-black text-[11px] whitespace-nowrap">Đã báo giá</span>`;
    }
    if (normalized === "từ chối") {
        return `<span class="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 font-black text-[11px] whitespace-nowrap">Từ chối</span>`;
    }
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200 font-black text-[11px] whitespace-nowrap">Chờ xử lý</span>`;
}

function updatePagination() {
    const total = rfqState.filteredData.length;
    const totalPages = Math.max(1, Math.ceil(total / rfqState.pageSize));

    if (rfqState.page > totalPages) rfqState.page = totalPages;

    if (rfqDOM.pageInfo) rfqDOM.pageInfo.textContent = `${rfqState.page} / ${totalPages}`;
    if (rfqDOM.btnPrev) rfqDOM.btnPrev.disabled = rfqState.page <= 1;
    if (rfqDOM.btnNext) rfqDOM.btnNext.disabled = rfqState.page >= totalPages;

    if (rfqDOM.resultInfo) {
        if (total === 0) {
            rfqDOM.resultInfo.textContent = "0 yêu cầu";
        } else {
            const start = (rfqState.page - 1) * rfqState.pageSize + 1;
            const end = Math.min(rfqState.page * rfqState.pageSize, total);
            rfqDOM.resultInfo.textContent = `Hiển thị ${start}–${end} / ${total} yêu cầu`;
        }
    }
}

// ============================================================
// UTILS & STATES
// ============================================================
function setLoading() {
    hideEmpty();
    if (!rfqDOM.tableBody) return;
    rfqDOM.tableBody.innerHTML = `
        <tr>
            <td colspan="9" class="p-12 text-center text-gray-400 font-bold text-sm">
                <div class="inline-flex items-center gap-2">
                    <svg class="w-4 h-4 animate-spin text-kn-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    Đang tải danh sách RFQ...
                </div>
            </td>
        </tr>
    `;
}

function renderError(message) {
    if (!rfqDOM.tableBody) return;
    rfqDOM.tableBody.innerHTML = `<tr><td colspan="9" class="p-12 text-center text-red-500 font-bold text-sm">${escapeHTML(message)}</td></tr>`;
}

function showEmpty() { if (rfqDOM.emptyState) rfqDOM.emptyState.classList.remove("hidden"); }
function hideEmpty() { if (rfqDOM.emptyState) rfqDOM.emptyState.classList.add("hidden"); }

function normalizeStatus(value) { return String(value || "Chờ xử lý").trim().toLowerCase(); }

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function escapeHTML(value) {
    if (window.utils && typeof window.utils.escapeHTML === "function") return window.utils.escapeHTML(String(value ?? ""));
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}