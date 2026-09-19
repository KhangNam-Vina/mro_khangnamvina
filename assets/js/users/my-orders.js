// ========================================================
// FILE: assets/js/users/my-orders.js
// QUẢN LÝ LỊCH SỬ ĐƠN HÀNG MUA TRỰC TIẾP (TÍCH HỢP TABS ĐỒNG BỘ RFQ)
// ========================================================

let currentUser = null;
let allOrdersData = [];

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
        await loadMyOrders();
        setupSearchLogic();

    } catch (error) {
        console.error("[MY ORDERS] Lỗi khởi tạo:", error);
        const loadingUI = document.getElementById("ordersLoading");
        if (loadingUI) {
            loadingUI.innerHTML = `<p class="state-desc" style="color:#dc2626;">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>`;
        }
    }
});

// ========================================================
// AUTH
// ========================================================

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

// ========================================================
// SIDEBAR PROFILE
// ========================================================

async function loadSidebarProfile() {
    const nameEl = document.getElementById("sidebarUserName");
    const emailEl = document.getElementById("sidebarUserEmail");
    const avatarEl = document.getElementById("userAvatarInitials");
    let fullName = currentUser?.user_metadata?.full_name || "Khách hàng";

    try {
        const { data: profile } = await window.supabaseClient
            .from("profiles")
            .select("full_name")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (profile?.full_name) fullName = profile.full_name;
    } catch (error) {
        console.warn("[MY ORDERS] Lỗi profile:", error);
    }

    if (nameEl) nameEl.textContent = fullName;
    if (emailEl) emailEl.textContent = currentUser.email || "-";
    if (avatarEl && fullName && fullName !== "Khách hàng") {
        const parts = fullName.trim().split(/\s+/);
        let initials = parts[0]?.charAt(0)?.toUpperCase() || "";
        if (parts.length > 1) {
            initials += parts[parts.length - 1].charAt(0).toUpperCase();
        }
        avatarEl.textContent = initials || "KN";
    }
}

// ========================================================
// LOAD ORDERS
// ========================================================

async function loadMyOrders() {
    const loadingUI = document.getElementById("ordersLoading");
    const emptyUI = document.getElementById("emptyOrdersState");
    const tableWrapper = document.getElementById("ordersTableWrapper");

    try {
        const { data: orders, error } = await window.supabaseClient
            .from("orders")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        allOrdersData = Array.isArray(orders) ? orders : [];
        updateDashboardStats(allOrdersData);

        if (loadingUI) loadingUI.classList.add("d-none");

        if (allOrdersData.length === 0) {
            if (emptyUI) emptyUI.classList.remove("d-none");
            if (tableWrapper) tableWrapper.classList.add("d-none");
            renderOrdersTable([]);
            return;
        }

        if (emptyUI) emptyUI.classList.add("d-none");
        if (tableWrapper) tableWrapper.classList.remove("d-none");

        renderOrdersTable(allOrdersData);

    } catch (error) {
        console.error("[MY ORDERS] LỖI TẢI ĐƠN HÀNG:", error);
        if (loadingUI) {
            loadingUI.classList.remove("d-none");
            loadingUI.innerHTML = `<p class="state-desc" style="color:#dc2626; font-weight:600;">Không thể tải danh sách đơn hàng.</p>`;
        }
        if (tableWrapper) tableWrapper.classList.add("d-none");
        if (emptyUI) emptyUI.classList.add("d-none");
    }
}

// ========================================================
// KPI STATS
// ========================================================
function updateDashboardStats(data) {
    const totalEl = document.getElementById("statTotal");
    const pendingEl = document.getElementById("statPending");
    const shippedEl = document.getElementById("statShipped");
    const deliveredEl = document.getElementById("statDelivered");

    if (totalEl) totalEl.innerText = data.length;

    let pendingCount = 0, shippedCount = 0, deliveredCount = 0;

    data.forEach(order => {
        const st = (order.status || "").toLowerCase();
        if (st === "delivered") {
            deliveredCount++;
        } else if (st === "shipped") {
            shippedCount++;
        } else if (st !== "cancelled") {
            pendingCount++; 
        }
    });

    if (pendingEl) pendingEl.innerText = pendingCount;
    if (shippedEl) shippedEl.innerText = shippedCount;
    if (deliveredEl) deliveredEl.innerText = deliveredCount;
}

// ========================================================
// FILTER TABS LOGIC
// ========================================================
window.filterOrdersByStatus = function (statusValue, btn) {
    // Đổi màu tab đang active
    document.querySelectorAll(".order-status-btn").forEach(b => b.classList.remove("is-active"));
    if (btn) btn.classList.add("is-active");

    // Xóa nội dung tìm kiếm khi đổi Tab
    const searchInput = document.getElementById("searchOrderInput");
    if (searchInput) searchInput.value = "";

    if (statusValue === "ALL") { 
        renderOrdersTable(allOrdersData); 
        return; 
    }

    const target = statusValue.toLowerCase();
    const filtered = allOrdersData.filter(order => {
        const curr = String(order.status || "").toLowerCase();

        if (target === "đang xử lý") return ["pending", "confirmed", "processing"].includes(curr);
        if (target === "đang giao") return curr === "shipped";
        if (target === "đã hoàn thành") return curr === "delivered";
        if (target === "đã hủy") return curr === "cancelled";
        
        return false;
    });

    renderOrdersTable(filtered);
};

// ========================================================
// SEARCH
// ========================================================

function setupSearchLogic() {
    const searchInput = document.getElementById("searchOrderInput");
    if (!searchInput) return;

    searchInput.addEventListener("input", event => {
        const keyword = String(event.target.value || "").toLowerCase().trim();

        // Gõ tìm kiếm thì reset các Tab lọc về trạng thái bình thường
        document.querySelectorAll(".order-status-btn").forEach(b => b.classList.remove("is-active"));

        if (!keyword) {
            document.querySelector('.order-status-btn[onclick*="ALL"]')?.classList.add("is-active");
            renderOrdersTable(allOrdersData);
            return;
        }

        const filtered = allOrdersData.filter(order => {
            const code = String(order.order_code || "").toLowerCase();
            return code.includes(keyword);
        });
        renderOrdersTable(filtered);
    });
}

// ========================================================
// RENDER TABLE
// ========================================================

function renderOrdersTable(dataList) {
    const tableBody = document.getElementById("ordersTableBody");
    if (!tableBody) return;

    if (!Array.isArray(dataList) || dataList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:30px; color:#6b7280;">Không tìm thấy đơn hàng nào.</td></tr>`;
        return;
    }

    tableBody.innerHTML = dataList.map(order => {
        const dateStr = formatDateTime(order.created_at);
        const total = Number(order.total) || 0;
        const totalFormat = new Intl.NumberFormat("vi-VN").format(total) + " đ";
        const statusConfig = getOrderStatusConfig(order.status);

        return `
            <tr class="orders-table-row">
                <td class="orders-col-code">${escapeHTML(order.order_code || "N/A")}</td>
                <td class="orders-col-date">${dateStr}</td>
                <td class="text-right orders-col-total">${totalFormat}</td>
                <td class="text-center orders-col-status">
                    <span class="orders-status-badge ${statusConfig.class}">
                        ${statusConfig.label}
                    </span>
                </td>
                <td class="text-center orders-col-action">
                    <a href="my-orders-detail.html?id=${encodeURIComponent(order.id)}" class="btn-view-detail">
                        Xem
                    </a>
                </td>
            </tr>
        `;
    }).join("");
}

// ========================================================
// STATUS & FORMATTERS
// ========================================================

function getOrderStatusConfig(status) {
    const normalized = String(status || "").trim().toLowerCase();
    const configs = {
        pending: { label: "Chờ xử lý", class: "status-pending" },
        confirmed: { label: "Đã xác nhận", class: "status-confirmed" },
        processing: { label: "Đang xử lý", class: "status-processing" },
        shipped: { label: "Đang giao", class: "status-shipped" },
        delivered: { label: "Đã hoàn thành", class: "status-delivered" },
        cancelled: { label: "Đã hủy", class: "status-cancelled" }
    };
    return configs[normalized] || { label: status || "Không xác định", class: "status-unknown" };
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN") + " <span style='margin-left: 4px; color: #9ca3af; font-size: 11px;'>" + date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + "</span>";
}

function escapeHTML(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.handleCustomerLogout = async function () {
    try {
        if (window.supabaseClient) await window.supabaseClient.auth.signOut();
        localStorage.removeItem("kn_customer_session");
        window.location.href = "login.html";
    } catch (error) {
        window.location.href = "login.html";
    }
};