// ========================================================
// FILE: assets/js/users/rfq.js
// RFQ CENTER - MRO KHANG NAM
// ĐÃ FIX: CHƯA ĐĂNG NHẬP VẪN XEM ĐƯỢC GIỎ HÀNG
// TÍCH HỢP AUTO-FILL FORM KHI ĐÃ ĐĂNG NHẬP
// ========================================================

let cartItems = [];
let filteredCart = [];

const RFQ_MIN_QTY = 1;
const RFQ_MAX_QTY = 1000000;


/* ========================================================
   1. LOAD CART
======================================================== */
function loadCartFromStorage() {
    try {
        cartItems = JSON.parse(localStorage.getItem("mro_rfq_cart")) || [];
    } catch (error) {
        console.error("Lỗi đọc RFQ cart:", error);
        cartItems = [];
    }

    filteredCart = [...cartItems];
    updateCartCounters();
    renderCartUI();

    const searchInput = document.getElementById("searchCart");
    if (searchInput && !searchInput.dataset.bound) {
        searchInput.addEventListener("input", handleCartSearch);
        searchInput.dataset.bound = "true";
    }
}


/* ========================================================
   2. SEARCH
======================================================== */
function handleCartSearch(event) {
    const keyword = String(event.target.value || "").toLowerCase().trim();

    if (!keyword) {
        filteredCart = [...cartItems];
    } else {
        filteredCart = cartItems.filter((item) => {
            const sku = String(item.sku || "").toLowerCase();
            const name = String(item.name || "").toLowerCase();
            const brand = String(item.brand || "").toLowerCase();
            const size = String(item.size || item.selectedSize || item.productSize || "").toLowerCase();

            return (
                sku.includes(keyword) ||
                name.includes(keyword) ||
                brand.includes(keyword) ||
                size.includes(keyword)
            );
        });
    }
    renderCartUI();
}


/* ========================================================
   3. COUNTERS
======================================================== */
function updateCartCounters() {
    const totalItems = cartItems.length;
    const headerCount = document.getElementById("cartCountHeader");
    const formCount = document.getElementById("cartCountForm");
    const submitBtn = document.getElementById("submitRfqBtn");

    if (headerCount) headerCount.innerText = `${totalItems} SP`;
    if (formCount) formCount.innerText = `${totalItems} Sản phẩm`;

    if (submitBtn) {
        if (totalItems === 0) {
            submitBtn.disabled = true;
            submitBtn.classList.add("is-disabled");
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove("is-disabled");
        }
    }
}


/* ========================================================
   4. GET SIZE
======================================================== */
function getRFQItemSize(item) {
    return String(item?.size ?? item?.selectedSize ?? item?.productSize ?? "").trim();
}


/* ========================================================
   5. GET ORIGINAL INDEX
======================================================== */
function getOriginalCartIndex(item) {
    return cartItems.indexOf(item);
}


/* ========================================================
   6. RENDER CART
======================================================== */
function renderCartUI() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    /* EMPTY CART */
    if (cartItems.length === 0) {
        grid.innerHTML = `
            <div class="rfq-empty-state">
                <svg class="rfq-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <p class="rfq-empty-title">Danh sách yêu cầu đang trống!</p>
                <a href="products.html" class="rfq-empty-button">→ Đến Kho Hàng chọn vật tư</a>
            </div>
        `;
        return;
    }

    /* SEARCH NO RESULT */
    if (filteredCart.length === 0) {
        grid.innerHTML = `<div class="rfq-filter-empty">Không tìm thấy mã nào phù hợp với từ khóa.</div>`;
        return;
    }

    let html = "";
    filteredCart.forEach((item) => {
        const originalIndex = getOriginalCartIndex(item);
        if (originalIndex < 0) return;

        const size = getRFQItemSize(item);
        const safeSize = escapeRFQValue(size);
        const quantity = Number(item.qty) || 1;

        html += `
            <article class="rfq-product-card" data-cart-index="${originalIndex}">
                <button type="button" onclick="removeItem(${originalIndex})" title="Xóa sản phẩm này" class="rfq-product-remove">XÓA</button>
                <div class="rfq-product-card-top">
                    <div class="rfq-product-brand">${escapeRFQValue(item.brand || "OEM")}</div>
                    <h3 class="rfq-product-name" title="${escapeRFQValue(item.name || "")}">
                        ${escapeRFQValue(item.name || "Sản phẩm")}
                    </h3>
                    <p class="rfq-product-sku">Mã SKU: <strong>${escapeRFQValue(item.sku || "")}</strong></p>
                    ${size ? `<div class="rfq-product-size"><span class="rfq-product-size-label">Size:</span><strong>${safeSize}</strong></div>` : ""}
                </div>
                <div class="rfq-product-footer">
                    <span class="rfq-product-unit">ĐVT: ${escapeRFQValue(item.unit || "Cái")}</span>
                    <div class="rfq-product-qty-wrap">
                        <label class="rfq-product-qty-label" for="rfqQty-${originalIndex}">SL:</label>
                        <input type="number" id="rfqQty-${originalIndex}" min="1" value="${quantity}" class="rfq-product-qty-input" onchange="updateQty(${originalIndex}, this.value)">
                    </div>
                </div>
            </article>
        `;
    });

    grid.innerHTML = html;
}


/* ========================================================
   7. ESCAPE HTML
======================================================== */
function escapeRFQValue(value) {
    if (typeof utils !== "undefined" && typeof utils.escapeHTML === "function") {
        return utils.escapeHTML(value ?? "");
    }
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}


/* ========================================================
   8. UPDATE QUANTITY
======================================================== */
window.updateQty = function (originalIndex, newQty) {
    if (!cartItems[originalIndex]) return;

    const qtyInt = parseInt(newQty, 10);
    cartItems[originalIndex].qty = Number.isFinite(qtyInt) && qtyInt >= 1 ? qtyInt : 1;
    localStorage.setItem("mro_rfq_cart", JSON.stringify(cartItems));

    const searchValue = document.getElementById("searchCart")?.value.toLowerCase().trim() || "";

    if (!searchValue) {
        filteredCart = [...cartItems];
    } else {
        filteredCart = cartItems.filter((item) => {
            const sku = String(item.sku || "").toLowerCase();
            const name = String(item.name || "").toLowerCase();
            const brand = String(item.brand || "").toLowerCase();
            const size = String(item.size || item.selectedSize || item.productSize || "").toLowerCase();

            return sku.includes(searchValue) || name.includes(searchValue) || brand.includes(searchValue) || size.includes(searchValue);
        });
    }

    updateCartCounters();
    renderCartUI();
};


/* ========================================================
   9. REMOVE ITEM
======================================================== */
window.removeItem = function (originalIndex) {
    if (originalIndex < 0 || originalIndex >= cartItems.length) return;
    cartItems.splice(originalIndex, 1);
    localStorage.setItem("mro_rfq_cart", JSON.stringify(cartItems));
    loadCartFromStorage();
};


/* ========================================================
   10. CLEAR ALL
======================================================== */
window.clearAllCart = function () {
    if (cartItems.length === 0) return;
    const confirmed = confirm("Bạn có chắc chắn muốn xóa TOÀN BỘ danh sách yêu cầu không?");
    if (!confirmed) return;

    localStorage.removeItem("mro_rfq_cart");
    const searchInput = document.getElementById("searchCart");
    if (searchInput) searchInput.value = "";
    loadCartFromStorage();
};


/* ========================================================
   11. EXPORT CSV
======================================================== */
window.exportCartToCSV = function () {
    if (cartItems.length === 0) {
        alert("Giỏ hàng đang trống, không có dữ liệu để xuất!");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "STT,Mã SKU,Tên Sản Phẩm,Thương Hiệu,Size,ĐVT,Số Lượng\n";

    cartItems.forEach((item, index) => {
        const safeName = item.name ? String(item.name).replace(/"/g, '""') : "";
        const safeSku = item.sku ? String(item.sku).replace(/"/g, '""') : "";
        const safeBrand = item.brand ? String(item.brand).replace(/"/g, '""') : "OEM";
        const safeSize = getRFQItemSize(item).replace(/"/g, '""');
        const safeUnit = item.unit ? String(item.unit).replace(/"/g, '""') : "Cái";
        const qty = Number(item.qty) || 1;

        csvContent += `${index + 1},"${safeSku}","${safeName}","${safeBrand}","${safeSize}","${safeUnit}",${qty}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `Yeu_Cau_Bao_Gia_MRO_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


/* ========================================================
   12. SUBMIT RFQ
======================================================== */
window.submitRFQ = async function () {
    if (!window.supabaseClient) {
        alert("Lỗi hệ thống: Kết nối máy chủ Supabase chưa sẵn sàng!");
        return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    // KIỂM TRA ĐĂNG NHẬP Ở ĐÂY, NẾU CHƯA THÌ BẮT LƯU LẠI LINK VÀ TỚI TRANG LOGIN
    if (!session) {
        alert("Kho hàng B2B chỉ dành cho đối tác. Vui lòng đăng nhập để gửi đơn báo giá!");
        localStorage.setItem("redirect_after_login", "rfq.html");
        window.location.href = "login.html";
        return;
    }

    const currentUserId = session.user.id;
    const company = document.getElementById("company")?.value.trim();
    const name = document.getElementById("name")?.value.trim();
    const phone = document.getElementById("phone")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const notes = document.getElementById("notes")?.value.trim();

    if (!company || !name || !phone || !email) {
        alert("Vui lòng điền đầy đủ các thông tin có dấu (*) trước khi gửi!");
        return;
    }

    const selectedItems = cartItems.filter(item => Number(item.qty) > 0);
    const invalidQtyItem = selectedItems.find(item => {
        const qty = Number(item.qty);
        return (!Number.isInteger(qty) || qty < RFQ_MIN_QTY || qty > RFQ_MAX_QTY);
    });

    if (invalidQtyItem) {
        alert(`Số lượng RFQ phải là số nguyên từ ${RFQ_MIN_QTY.toLocaleString("vi-VN")} đến ${RFQ_MAX_QTY.toLocaleString("vi-VN")}.`);
        return;
    }

    if (selectedItems.length === 0) {
        alert("Danh sách vật tư yêu cầu đang trống hoặc số lượng không hợp lệ!");
        return;
    }

    const btn = document.getElementById("submitRfqBtn");
    const originalBtnText = btn?.innerHTML || "";

    if (btn) {
        btn.disabled = true;
        btn.classList.add("is-disabled");
        btn.innerHTML = `<span class="rfq-submit-loading"><svg class="rfq-submit-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle class="rfq-spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="rfq-spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Đang gửi đơn báo giá...</span>`;
    }

    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timePart = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const randomCode = `RFQ-${datePart}-${timePart}-${randomPart}`;

    try {
        const { error } = await window.supabaseClient
            .from("rfqs")
            .insert([{
                rfq_code: randomCode,
                company_name: company,
                contact_person: name,
                phone: phone,
                email: email,
                notes: notes,
                status: "Chờ xử lý",
                items: selectedItems,
                user_id: currentUserId
            }]);

        if (error) {
            if (error.code === "23505") throw new Error("Mã RFQ bị trùng. Vui lòng gửi lại yêu cầu.");
            throw error;
        }

        const currentRfqCount = Number(localStorage.getItem("mro_quick_order_rfq_count")) || 0;
        localStorage.setItem("mro_quick_order_rfq_count", String(currentRfqCount + 1));

        alert(`Gửi Yêu Cầu Báo Giá Thành Công!\nMã đơn của bạn là: ${randomCode}`);

        localStorage.removeItem("mro_rfq_cart");
        document.getElementById("rfqForm")?.reset();
        
        const searchInput = document.getElementById("searchCart");
        if (searchInput) searchInput.value = "";

        loadCartFromStorage();

        // CHUYỂN HƯỚNG TỚI TRANG LỊCH SỬ KHI GỬI THÀNH CÔNG
        window.location.href = "my-rfq.html";

    } catch (error) {
        console.error("Lỗi gửi RFQ:", error);
        alert("Lỗi khi gửi yêu cầu báo giá: " + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.classList.remove("is-disabled");
            btn.innerHTML = originalBtnText || "Gửi Yêu Cầu Báo Giá";
        }
    }
};


/* ========================================================
   13. INIT: LOAD GIỎ HÀNG & AUTO-FILL THÔNG TIN
======================================================== */
document.addEventListener("DOMContentLoaded", async () => {

    // 1. LUÔN LOAD GIỎ HÀNG RA MÀN HÌNH NGAY LẬP TỨC 
    loadCartFromStorage();

    try {
        if (!window.supabaseClient) {
            console.error("Cảnh báo: Supabase Client chưa sẵn sàng!");
            return;
        }

        // 2. CHECK XEM KHÁCH ĐÃ ĐĂNG NHẬP CHƯA
        const { data: { session } } = await window.supabaseClient.auth.getSession();

        if (session) {
            const currentUser = session.user;

            // 3. TỰ ĐỘNG ĐIỀN THÔNG TIN (AUTO-FILL)
            try {
                // Quét toàn bộ bảng profile tránh lỗi sai tên cột
                const { data: profile, error } = await window.supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .maybeSingle();

                if (error) console.error("Lỗi khi kéo data từ Supabase:", error.message);

                // Trỏ tới các ô Input trên form HTML
                const companyInput = document.getElementById("company");
                const nameInput = document.getElementById("name");
                const phoneInput = document.getElementById("phone");
                const emailInput = document.getElementById("email");

                // Lấy data với nhiều phương án dự phòng
                const profileCompany = profile?.company_name || profile?.company || "";
                const profileName = profile?.full_name || profile?.name || profile?.contact_name || profile?.contact_person || "";
                const profilePhone = profile?.phone || profile?.phone_number || "";
                const profileEmail = profile?.email || currentUser.email || "";
                const fallbackName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || "";

                // Bơm dữ liệu vào ô Input (Chỉ bơm khi ô đang trống để không ghi đè nếu khách tự gõ trước đó)
                if (companyInput && !companyInput.value) companyInput.value = profileCompany;
                if (nameInput && !nameInput.value) nameInput.value = profileName || fallbackName;
                if (phoneInput && !phoneInput.value) phoneInput.value = profilePhone || currentUser.phone || "";
                if (emailInput && !emailInput.value) emailInput.value = profileEmail;
                
            } catch (err) {
                console.error("Lỗi tự động điền thông tin profile:", err);
            }

            // 4. BẬT NÚT TÀI KHOẢN TRÊN HEADER
            try {
                const guestBtn = document.getElementById("btnGuestLogin");
                if (guestBtn) guestBtn.classList.add("is-hidden", "hidden");

                const userProfileBtn = document.getElementById("btnUserProfile");
                if (userProfileBtn) {
                    userProfileBtn.classList.remove("is-hidden", "hidden");
                    userProfileBtn.classList.add("is-visible-flex", "flex");
                }
            } catch (err) {
                console.error("Lỗi cập nhật UI Header:", err);
            }
        }
    } catch (error) {
        console.error("Lỗi khởi tạo trang RFQ:", error);
    }
});