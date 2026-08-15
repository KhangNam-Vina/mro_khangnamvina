// ========================================================
// MY RFQ LOGIC
// ========================================================
"use strict";

let allRFQsData = [];

document.addEventListener("DOMContentLoaded", async () => {
    setupSearch();
    await loadMyRFQs();
});

async function loadMyRFQs() {
    const tbody = document.getElementById("rfqTableBody");
    if (!tbody) return;

    try {
        let user = null;
        if (typeof Auth !== 'undefined' && typeof Auth.getCurrentUser === 'function') {
            user = await Auth.getCurrentUser();
        } else if (typeof checkCustomerAuth === 'function') {
            user = await checkCustomerAuth();
        } else if (window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getUser();
            user = data?.user;
        }

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const { data, error } = await window.supabaseClient
            .from("rfqs").select("id, rfq_code, created_at, company_name, status")
            .eq("user_id", user.id).order("created_at", { ascending: false });

        if (error) throw error;

        allRFQsData = Array.isArray(data) ? data : [];
        updateDashboardStats(allRFQsData);
        renderRfqTable(allRFQsData);
        await loadSidebarProfile(user);

    } catch (error) {
        console.error("Lỗi:", error);
        tbody.innerHTML = `<tr><td colspan="5" class="rfq-table-empty error-msg">Lỗi tải dữ liệu.</td></tr>`;
    }
}

function renderRfqTable(dataList) {
    const tbody = document.getElementById("rfqTableBody");
    const emptyState = document.getElementById("emptyState");
    if (!tbody) return;

    if (!Array.isArray(dataList) || dataList.length === 0) {
        tbody.innerHTML = "";
        if (emptyState) emptyState.classList.remove("is-hidden");
        return;
    }

    if (emptyState) emptyState.classList.add("is-hidden");

    tbody.innerHTML = dataList.map(item => {
        const dateObj = new Date(item.created_at);
        const formattedDate = dateObj.toLocaleDateString("vi-VN");
        const formattedTime = dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        const status = item.status || "Chờ xử lý";
        const statusLower = status.toLowerCase();

        let statusClass = "status-pending";
        if (statusLower.includes("đã báo giá")) statusClass = "status-quoted";
        else if (statusLower.includes("hoàn thành")) statusClass = "status-completed";
        else if (statusLower.includes("từ chối") || statusLower.includes("hủy")) statusClass = "status-canceled";
        else if (statusLower.includes("đã gửi") || statusLower.includes("mới")) statusClass = "status-new";

        return `
            <tr class="rfq-table-row">
                <td class="rfq-col-code">${escapeHTML(item.rfq_code || "RFQ-N/A")}</td>
                <td class="rfq-col-date"><span>${formattedDate}</span><span class="rfq-time">${formattedTime}</span></td>
                <td class="rfq-col-company">${escapeHTML(item.company_name || "Khách hàng")}</td>
                <td class="rfq-col-status"><span class="rfq-badge ${statusClass}"><span class="rfq-badge-dot"></span>${escapeHTML(status)}</span></td>
                <td class="rfq-col-action"><a href="my-rfq-detail.html?id=${encodeURIComponent(item.id)}" class="btn-view-detail">Xem</a></td>
            </tr>
        `;
    }).join("");
}

function updateDashboardStats(data) {
    const totalEl = document.getElementById("statTotal");
    const pendingEl = document.getElementById("statPending");
    const quotedEl = document.getElementById("statQuoted");
    const canceledEl = document.getElementById("statCanceled");

    if (totalEl) totalEl.innerText = data.length;
    let p = 0, q = 0, c = 0;

    data.forEach(item => {
        const st = (item.status || "").toLowerCase();
        if (st.includes("từ chối") || st.includes("hủy")) c++;
        else if (st.includes("đã báo giá") || st.includes("hoàn thành")) q++;
        else p++;
    });

    if (pendingEl) pendingEl.innerText = p;
    if (quotedEl) quotedEl.innerText = q;
    if (canceledEl) canceledEl.innerText = c;
}

window.filterByStatus = function (statusValue, btn) {
    document.querySelectorAll(".status-btn").forEach(b => b.classList.remove("is-active"));
    if (btn) btn.classList.add("is-active");

    const searchInput = document.getElementById("searchRfqInput");
    if (searchInput) searchInput.value = "";

    if (statusValue === "ALL") { renderRfqTable(allRFQsData); return; }

    const target = statusValue.toLowerCase();
    const filtered = allRFQsData.filter(item => {
        const curr = (item.status || "").toLowerCase();
        if (target === "chờ xử lý" || target === "đang xử lý") {
            return !curr.includes("đã báo giá") && !curr.includes("hoàn thành") && !curr.includes("từ chối") && !curr.includes("hủy");
        }
        if (target === "đã báo giá") return curr.includes("đã báo giá") || curr.includes("hoàn thành");
        if (target === "từ chối") return curr.includes("từ chối") || curr.includes("hủy");
        return curr.includes(target);
    });
    renderRfqTable(filtered);
};

function setupSearch() {
    const searchInput = document.getElementById("searchRfqInput");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
        const kw = String(e.target.value || "").toLowerCase().trim();
        document.querySelectorAll(".status-btn").forEach(b => b.classList.remove("is-active"));

        if (!kw) {
            document.querySelector('.status-btn[onclick*="ALL"]')?.classList.add("is-active");
            renderRfqTable(allRFQsData); return;
        }

        const searched = allRFQsData.filter(item => String(item.rfq_code || "").toLowerCase().includes(kw));
        renderRfqTable(searched);
    });
}

async function loadSidebarProfile(user) {
    try {
        const { data } = await window.supabaseClient.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
        const fbName = user.email ? user.email.split("@")[0] : "Khang Nam";
        const fName = data?.full_name || fbName;

        const nEl = document.getElementById("sidebarUserName");
        const eEl = document.getElementById("sidebarUserEmail");
        const aEl = document.getElementById("userAvatarInitials");

        if (nEl) nEl.textContent = fName;
        if (eEl) eEl.textContent = user.email || "-";
        if (aEl) aEl.textContent = getInitials(fName);
    } catch (e) {}
}

window.handleLogout = async function () {
    try {
        await window.supabaseClient.auth.signOut();
        localStorage.removeItem("kn_customer_session");
        window.location.href = "login.html";
    } catch (error) {}
};

function getInitials(name) {
    const s = String(name || "").trim();
    if (!s) return "KN";
    const p = s.split(/\s+/).filter(Boolean);
    if (p.length === 1) return p[0].substring(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function escapeHTML(v) {
    if (window.utils?.escapeHTML) return window.utils.escapeHTML(v ?? "");
    return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}