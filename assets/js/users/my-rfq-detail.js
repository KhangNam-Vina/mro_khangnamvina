// ========================================================
// FILE: assets/js/users/my-rfq-detail.js
// CHI TIẾT YÊU CẦU BÁO GIÁ - STATIC CSS VERSION
// Tích hợp Avatar & Sidebar chuẩn từ bảng profiles
// ========================================================

let rfqItemsData = [];
let currentRfqCode = "";

/* ========================================================
   1. KHỞI TẠO & XÁC THỰC
======================================================== */
document.addEventListener("DOMContentLoaded", async () => {
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
            window.location.href = 'login.html';
            return;
        }

        // Load Thông tin Sidebar từ bảng profiles (đồng bộ với các trang khác)
        await loadSidebarProfile(user);

        // Load chi tiết Đơn hàng RFQ
        await loadRFQDetail(user);

        // Kích hoạt thanh tìm kiếm vật tư
        setupSearch();

    } catch (error) {
        console.error("Lỗi khởi tạo:", error);
        showRFQError("Có lỗi xảy ra khi xác thực người dùng.");
    }
});

/* ========================================================
   2. LOGIC CẬP NHẬT SIDEBAR ĐỒNG BỘ
======================================================== */
async function loadSidebarProfile(user) {
    try {
        if (!window.supabaseClient) throw new Error("Chưa kết nối Supabase.");

        // Kéo tên thật từ bảng profiles
        const { data, error } = await window.supabaseClient
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

        if (error) throw error;

        const fallbackName = user.email ? user.email.split("@")[0] : "Khang Nam";
        const fullName = data?.full_name || fallbackName;

        // Bắt ID thông minh (Phòng hờ HTML đang dùng ID cũ hoặc mới)
        const nameEl = document.getElementById("sidebarUserName") || document.getElementById("rfqSidebarName");
        const emailEl = document.getElementById("sidebarUserEmail") || document.getElementById("rfqSidebarEmail");
        const avatarEl = document.getElementById("userAvatarInitials") || document.getElementById("rfqSidebarAvatar");

        if (nameEl) nameEl.textContent = fullName;
        if (emailEl) emailEl.textContent = user.email || "-";
        if (avatarEl) avatarEl.textContent = getAvatarInitials(fullName);

    } catch (error) {
        console.error("Lỗi tải thông tin sidebar:", error);
    }
}

// Logic cắt chữ Avatar (Tiến Nguyễn -> TN)
function getAvatarInitials(fullName) {
    if (!fullName || !String(fullName).trim()) return "KN";
    const names = String(fullName).trim().split(/\s+/).filter(Boolean);
    if (names.length >= 2) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    return String(fullName).substring(0, 2).toUpperCase();
}
if (window.utils) window.utils.getAvatarInitials = getAvatarInitials;

// Nút đăng xuất chung
window.handleLogout = async function () {
    try {
        await window.supabaseClient.auth.signOut();
        localStorage.removeItem("kn_customer_session");
        window.location.href = "login.html";
    } catch (error) {}
};
window.handleCustomerLogout = window.handleLogout;


/* ========================================================
   3. LOAD CHI TIẾT RFQ
======================================================== */
async function loadRFQDetail(user) {
    const loadingScreen = document.getElementById("rfqLoadingScreen");
    const contentScreen = document.getElementById("rfqDetailContent");
    const urlParams = new URLSearchParams(window.location.search);
    const rfqId = urlParams.get("id");

    if (!rfqId) {
        showRFQError("Thiếu mã đơn hàng trên đường dẫn.");
        return;
    }

    try {
        if (!window.supabaseClient) throw new Error("Chưa kết nối được hệ thống máy chủ.");

        const { data: rfq, error: rfqError } = await window.supabaseClient
            .from("rfqs")
            .select("*")
            .eq("id", rfqId)
            .eq("user_id", user.id)
            .single();

        if (rfqError || !rfq) throw new Error("Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.");

        rfqItemsData = Array.isArray(rfq.items) ? rfq.items : [];
        currentRfqCode = rfq.rfq_code || "RFQ-NA";

        // HEADER
        setText("rfqCodeDisplay", currentRfqCode);
        const dateObj = new Date(rfq.created_at);
        const formattedDate = `${dateObj.toLocaleDateString("vi-VN")} ${dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
        setText("rfqDateDisplay", formattedDate);

        // CUSTOMER INFO (Dữ liệu từ đơn hàng, không phải từ bảng profile)
        setText("infoCompany", rfq.company_name || "Khách lẻ");
        setText("infoName", rfq.contact_person || "-");
        setText("infoPhone", rfq.phone || "-");
        setText("infoEmail", rfq.email || "-");
        setText("infoNote", rfq.notes || "Không có ghi chú");

        // STATUS BADGE
        const status = rfq.status || "Chờ xử lý";
        const statusLower = status.toLowerCase();
        const badge = document.getElementById("rfqStatusBadge");
        let timelineLevel = 1;

        if (badge) {
            badge.textContent = status;
            badge.className = "rfq-detail-badge";
            if (statusLower.includes("đã gửi") || statusLower.includes("mới")) {
                addStatusClass(badge, "status-new");
                timelineLevel = 1;
            } else if (statusLower.includes("đang xử lý") || statusLower.includes("chờ")) {
                addStatusClass(badge, "status-pending");
                timelineLevel = 2;
            } else if (statusLower.includes("đã báo giá") || statusLower.includes("thành công")) {
                addStatusClass(badge, "status-quoted");
                timelineLevel = 3;
            } else if (statusLower.includes("từ chối") || statusLower.includes("hủy")) {
                addStatusClass(badge, "status-canceled");
                timelineLevel = 4;
            } else {
                addStatusClass(badge, "status-default");
            }
        }

        // TIMELINE
        renderTimeline(timelineLevel, dateObj.toLocaleDateString("vi-VN"));

        // SUMMARY
        setText("summaryLines", `${rfqItemsData.length} Dòng`);
        const totalQty = rfqItemsData.reduce((total, item) => total + (Number(item.qty) || Number(item.quantity) || 1), 0);
        setText("summaryQty", `${totalQty} Sản phẩm`);

        // PRODUCTS TABLE
        renderItemsTable(rfqItemsData);

        // ẨN LOADING, HIỆN CONTENT
        loadingScreen?.classList.add("is-hidden");
        contentScreen?.classList.remove("is-hidden");

    } catch (error) {
        console.error("Lỗi tải chi tiết RFQ:", error);
        showRFQError(error.message);
    }
}


/* ========================================================
   4. RENDER BẢNG VẬT TƯ
======================================================== */
function renderItemsTable(dataList) {
    const tbody = document.getElementById("rfqItemsBody");
    if (!tbody) return;

    if (!dataList || dataList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="rfq-table-empty">Không có dữ liệu sản phẩm trong đơn này hoặc không khớp từ khóa.</td></tr>`;
        return;
    }

    let html = "";
    dataList.forEach((item, index) => {
        const sku = escapeHTML(item.sku || "-");
        const name = escapeHTML(item.name || item.product_name || "Sản phẩm không tên");
        const brand = escapeHTML(item.brand || "OEM");
        const unit = escapeHTML(item.unit || "Cái");
        const qty = escapeHTML(item.qty || item.quantity || 1);

        html += `
            <tr class="rfq-item-row">
                <td class="rfq-item-stt">${index + 1}</td>
                <td class="rfq-item-sku">${sku}</td>
                <td class="rfq-item-name">${name}</td>
                <td class="rfq-item-brand">${brand}</td>
                <td class="rfq-item-unit">${unit}</td>
                <td class="rfq-item-qty">${qty}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}


/* ========================================================
   5. TIMELINE TRẠNG THÁI
======================================================== */
function renderTimeline(level, createDate) {
    const container = document.getElementById("rfqTimeline");
    if (!container) return;

    let html = `
        <div class="timeline-step step-completed">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <p class="timeline-title">Đã gửi yêu cầu</p>
                <p class="timeline-desc">${escapeHTML(createDate)}</p>
            </div>
        </div>
    `;

    if (level === 4) {
        html += `
            <div class="timeline-step step-canceled">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <p class="timeline-title">Đơn hàng bị hủy / từ chối</p>
                    <p class="timeline-desc">Vui lòng liên hệ Kỹ sư để biết thêm chi tiết</p>
                </div>
            </div>
        `;
        container.innerHTML = html;
        return;
    }

    const isActive2 = level >= 2;
    html += `
        <div class="timeline-step ${isActive2 ? "step-active" : "step-pending"}">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <p class="timeline-title">Sales đã tiếp nhận</p>
                <p class="timeline-desc">${isActive2 ? "Đang kiểm tra tồn kho & giá" : "Chờ xử lý"}</p>
            </div>
        </div>
    `;

    const isActive3 = level >= 3;
    html += `
        <div class="timeline-step ${isActive3 ? "step-quoted" : "step-pending"}">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <p class="timeline-title">Đã gửi Báo giá</p>
                <p class="timeline-desc">${isActive3 ? "Vui lòng kiểm tra Email" : "Chưa có báo giá"}</p>
            </div>
        </div>
    `;

    container.innerHTML = html;
}


/* ========================================================
   6. SEARCH TRONG ĐƠN
======================================================== */
function setupSearch() {
    const searchInput = document.getElementById("searchItemInput");
    if (!searchInput) return;

    searchInput.addEventListener("input", function (event) {
        const keyword = String(event.target.value || "").toLowerCase().trim();
        if (!keyword) {
            renderItemsTable(rfqItemsData);
            return;
        }

        const filtered = rfqItemsData.filter((item) => {
            const sku = String(item.sku || "").toLowerCase();
            const name = String(item.name || item.product_name || "").toLowerCase();
            return sku.includes(keyword) || name.includes(keyword);
        });

        renderItemsTable(filtered);
    });
}


/* ========================================================
   7. EXPORT EXCEL
======================================================== */
window.exportRfqToExcel = function () {
    if (!rfqItemsData || rfqItemsData.length === 0) {
        alert("Không có sản phẩm để xuất!");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "STT,Mã SKU,Tên Sản Phẩm,Thương Hiệu,ĐVT,Số Lượng\n";

    rfqItemsData.forEach((item, index) => {
        const safeSku = csvCSV(item.sku);
        const safeName = csvCSV(item.name || item.product_name);
        const safeBrand = csvCSV(item.brand || "OEM");
        const safeUnit = csvCSV(item.unit || "Cái");
        const qty = Number(item.qty || item.quantity) || 1;

        csvContent += `${index + 1},${safeSku},${safeName},${safeBrand},${safeUnit},${qty}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Don_Hang_${currentRfqCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


/* ========================================================
   8. HELPERS
======================================================== */
function showRFQError(message) {
    const loadingScreen = document.getElementById("rfqLoadingScreen");
    const errorScreen = document.getElementById("rfqErrorScreen");
    const errorText = document.getElementById("rfqErrorText");

    loadingScreen?.classList.add("is-hidden");
    errorScreen?.classList.remove("is-hidden");
    if (errorText) errorText.textContent = message || "Không thể tải dữ liệu yêu cầu báo giá.";
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value ?? "";
}

function addStatusClass(element, className) {
    if (element) element.classList.add(className);
}

function escapeHTML(value) {
    if (window.utils && typeof window.utils.escapeHTML === "function") return window.utils.escapeHTML(value ?? "");
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function csvCSV(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
}