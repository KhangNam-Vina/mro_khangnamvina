// ========================================================
// FILE: assets/js/users/my-orders.js
// QUẢN LÝ LỊCH SỬ ĐƠN HÀNG MUA TRỰC TIẾP
// ========================================================

let currentUser = null;
let allOrdersData = [];

// ========================================================
// INIT
// ========================================================

document.addEventListener("DOMContentLoaded", async () => {
    try {
        currentUser = await getCurrentCustomer();

        console.log("[MY ORDERS] Current user:", currentUser);

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
            loadingUI.innerHTML = `
                <p class="state-desc" style="color:#dc2626;">
                    Không thể tải dữ liệu. Vui lòng thử lại sau.
                </p>
            `;
        }
    }
});

// ========================================================
// AUTH
// ========================================================

async function getCurrentCustomer() {

    if (typeof window.checkCustomerAuth === "function") {
        const user = await window.checkCustomerAuth();

        if (user) {
            return user;
        }
    }

    if (!window.supabaseClient) {
        console.error("[MY ORDERS] supabaseClient không tồn tại.");
        return null;
    }

    const {
        data,
        error
    } = await window.supabaseClient.auth.getSession();

    if (error) {
        console.error("[MY ORDERS] Lỗi getSession:", error);
        throw error;
    }

    return data?.session?.user || null;
}

// ========================================================
// SIDEBAR PROFILE
// ========================================================

async function loadSidebarProfile() {

    const nameEl = document.getElementById("sidebarUserName");
    const emailEl = document.getElementById("sidebarUserEmail");
    const avatarEl = document.getElementById("userAvatarInitials");

    let fullName =
        currentUser?.user_metadata?.full_name ||
        "Khách hàng";

    try {

        const {
            data: profile,
            error
        } = await window.supabaseClient
            .from("profiles")
            .select("full_name")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (error) {
            console.warn(
                "[MY ORDERS] Không lấy được profile:",
                error
            );
        }

        if (profile?.full_name) {
            fullName = profile.full_name;
        }

    } catch (error) {
        console.warn(
            "[MY ORDERS] Lỗi profile:",
            error
        );
    }

    if (nameEl) {
        nameEl.textContent = fullName;
    }

    if (emailEl) {
        emailEl.textContent =
            currentUser.email || "-";
    }

    if (
        avatarEl &&
        fullName &&
        fullName !== "Khách hàng"
    ) {

        const parts =
            fullName.trim().split(/\s+/);

        let initials =
            parts[0]?.charAt(0)?.toUpperCase() || "";

        if (parts.length > 1) {
            initials +=
                parts[parts.length - 1]
                    .charAt(0)
                    .toUpperCase();
        }

        avatarEl.textContent =
            initials || "KN";
    }
}

// ========================================================
// LOAD ORDERS
// ========================================================

async function loadMyOrders() {

    const loadingUI =
        document.getElementById("ordersLoading");

    const emptyUI =
        document.getElementById("emptyOrdersState");

    const tableWrapper =
        document.getElementById("ordersTableWrapper");

    try {

        console.log(
            "[MY ORDERS] Đang tải orders của user:",
            currentUser.id
        );

        // ==================================================
        // QUAN TRỌNG:
        // DÙNG SELECT * ĐỂ TRÁNH QUERY FAIL DO COLUMN
        // ==================================================

        const {
            data: orders,
            error
        } = await window.supabaseClient
            .from("orders")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", {
                ascending: false
            });

        // ==================================================
        // LOG FULL ERROR
        // ==================================================

        if (error) {

            console.error(
                "[MY ORDERS] SUPABASE ERROR:",
                error
            );

            console.error(
                "[MY ORDERS] message:",
                error.message
            );

            console.error(
                "[MY ORDERS] details:",
                error.details
            );

            console.error(
                "[MY ORDERS] hint:",
                error.hint
            );

            console.error(
                "[MY ORDERS] code:",
                error.code
            );

            throw error;
        }

        console.log(
            "[MY ORDERS] Orders nhận được:",
            orders
        );

        allOrdersData =
            Array.isArray(orders)
                ? orders
                : [];

        // Ẩn loading
        if (loadingUI) {
            loadingUI.classList.add("d-none");
        }

        // Không có đơn
        if (allOrdersData.length === 0) {

            if (emptyUI) {
                emptyUI.classList.remove("d-none");
            }

            if (tableWrapper) {
                tableWrapper.classList.add("d-none");
            }

            renderOrdersTable([]);

            return;
        }

        // Có đơn
        if (emptyUI) {
            emptyUI.classList.add("d-none");
        }

        if (tableWrapper) {
            tableWrapper.classList.remove("d-none");
        }

        renderOrdersTable(allOrdersData);

    } catch (error) {

        console.error(
            "[MY ORDERS] LỖI TẢI ĐƠN HÀNG:",
            error
        );

        if (loadingUI) {

            loadingUI.classList.remove("d-none");

            loadingUI.innerHTML = `
                <p class="state-desc" style="
                    color:#dc2626;
                    font-weight:600;
                ">
                    Không thể tải danh sách đơn hàng.
                </p>
            `;
        }

        if (tableWrapper) {
            tableWrapper.classList.add("d-none");
        }

        if (emptyUI) {
            emptyUI.classList.add("d-none");
        }
    }
}

// ========================================================
// RENDER TABLE
// ========================================================

function renderOrdersTable(dataList) {

    const tableBody =
        document.getElementById("ordersTableBody");

    const countUI =
        document.getElementById("totalOrdersCount");

    if (!tableBody) {
        return;
    }

    if (countUI) {
        countUI.textContent =
            `${dataList.length} đơn hàng`;
    }

    if (
        !Array.isArray(dataList) ||
        dataList.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center"
                    style="
                        padding:30px;
                        color:#6b7280;
                    "
                >
                    Không tìm thấy đơn hàng nào.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML =
        dataList.map(order => {

            const dateStr =
                formatDateTime(order.created_at);

            const total =
                Number(order.total) || 0;

            const totalFormat =
                new Intl.NumberFormat("vi-VN")
                    .format(total) + " đ";

            const statusConfig =
                getOrderStatusConfig(order.status);

            return `
                <tr>

                    <td class="order-code-text">
                        ${escapeHTML(
                            order.order_code || "N/A"
                        )}
                    </td>

                    <td>
                        ${dateStr}
                    </td>

                    <td class="text-right order-total-text">
                        ${totalFormat}
                    </td>

                    <td class="text-center">

                        <span
                            class="status-badge ${statusConfig.class}"
                        >
                            ${statusConfig.label}
                        </span>

                    </td>

                    <td class="text-center">

                        <a
                            href="my-orders-detail.html?id=${encodeURIComponent(order.id)}"
                            class="btn-outline-blue"
                        >
                            Xem chi tiết
                        </a>

                    </td>

                </tr>
            `;

        }).join("");
}

// ========================================================
// SEARCH
// ========================================================

function setupSearchLogic() {

    const searchInput =
        document.getElementById(
            "searchOrderInput"
        );

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener(
        "input",
        event => {

            const keyword =
                String(
                    event.target.value || ""
                )
                .toLowerCase()
                .trim();

            if (!keyword) {

                renderOrdersTable(
                    allOrdersData
                );

                return;
            }

            const filtered =
                allOrdersData.filter(order => {

                    const code =
                        String(
                            order.order_code || ""
                        ).toLowerCase();

                    return code.includes(keyword);
                });

            renderOrdersTable(filtered);
        }
    );
}

// ========================================================
// STATUS
// ĐỒNG BỘ VỚI ADMIN-ORDERS.JS
// ========================================================

function getOrderStatusConfig(status) {

    const normalized =
        String(status || "")
            .trim()
            .toLowerCase();

    const configs = {

        pending: {
            label: "Chờ xử lý",
            class: "status-pending"
        },

        confirmed: {
            label: "Đã xác nhận",
            class: "status-confirmed"
        },

        processing: {
            label: "Đang xử lý",
            class: "status-processing"
        },

        shipped: {
            label: "Đang giao",
            class: "status-shipped"
        },

        delivered: {
            label: "Đã giao",
            class: "status-delivered"
        },

        cancelled: {
            label: "Đã hủy",
            class: "status-cancelled"
        }

    };

    return configs[normalized] || {
        label: status || "Không xác định",
        class: "status-unknown"
    };
}

// ========================================================
// DATE
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
        "vi-VN",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

// ========================================================
// ESCAPE HTML
// ========================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ========================================================
// LOGOUT
// ========================================================

window.handleCustomerLogout =
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
                "[MY ORDERS] Logout error:",
                error
            );

            window.location.href =
                "login.html";
        }
    };