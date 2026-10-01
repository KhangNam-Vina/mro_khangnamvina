// ========================================================
// FILE: assets/js/users/checkout.js
// XỬ LÝ THANH TOÁN ĐƠN MUA NGAY
// ĐÃ ĐỒNG BỘ SIZE SẢN PHẨM & BẢO VỆ FORM SĐT
// ========================================================

"use strict";

let currentUser = null;
let shoppingCart = [];
let checkoutTotalAmount = 0;

const CHECKOUT_MIN_QTY = 1;
const CHECKOUT_MAX_QTY = 1000000;
const CHECKOUT_IMAGE_CDN_BASE = "https://mrokhangnam-image.khangnamvn.workers.dev";

// ========================================================
// 0. HELPERS (FORMAT & URL)
// ========================================================
function buildCheckoutImageUrl(imagePath) {
    if (!imagePath) return "../assets/images/world mark.png";
    const cleanPath = String(imagePath).trim();
    if (!cleanPath || cleanPath.includes("via.placeholder.com")) return "../assets/images/world mark.png";
    if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
    return `${CHECKOUT_IMAGE_CDN_BASE}/${cleanPath.replace(/^\/+/, "")}`;
}

// Hàm lấy giá tiền tương thích cả SP cũ và Biến thể mới
function getCheckoutProductPrice(item) {
    if (!item) return 0;
    if (item.unit_price) return Number(item.unit_price);
    
    const discountPrice = Number(item.discount_price);
    const regularPrice = Number(item.price);
    if (Number.isFinite(discountPrice) && discountPrice > 0 && discountPrice < regularPrice) {
        return discountPrice;
    }
    return Number.isFinite(regularPrice) ? regularPrice : 0;
}

// ========================================================
// 1. INIT CHECKOUT (ĐÃ NÂNG CẤP AUTO-FILL CHỐNG LỖI)
// ========================================================
async function initCheckout() {
    shoppingCart = getShoppingCart();

    const invalidQtyItem = shoppingCart.find(item => {
        const qty = Number(item.qty);
        return (!Number.isInteger(qty) || qty < CHECKOUT_MIN_QTY || qty > CHECKOUT_MAX_QTY);
    });

    if (invalidQtyItem) {
        alert("Giỏ hàng có sản phẩm với số lượng không hợp lệ. Vui lòng kiểm tra lại.");
        window.location.href = "cart.html";
        return;
    }

    if (shoppingCart.length === 0) {
        alert("Giỏ hàng của bạn đang trống! Vui lòng chọn sản phẩm trước khi thanh toán.");
        window.location.href = "products.html";
        return;
    }

    if (!window.supabaseClient) {
        console.error("Supabase chưa được khởi tạo!");
        return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session) {
        alert("Vui lòng đăng nhập để tiến hành đặt hàng!");
        localStorage.setItem("redirect_after_login", "checkout.html");
        window.location.href = "login.html";
        return;
    }

    currentUser = session.user;

    // TỰ ĐỘNG ĐIỀN THÔNG TIN GIAO HÀNG TỪ DATABASE
    try {
        const { data: profile, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (error) {
            console.error("Lỗi khi kéo data từ Supabase:", error.message);
        }

        const nameInput = document.getElementById("shippingName");
        const phoneInput = document.getElementById("shippingPhone");
        const addressInput = document.getElementById("shippingAddress");

        const profileName = profile?.full_name || profile?.name || profile?.contact_name || profile?.contact_person || "";
        const profilePhone = profile?.phone || profile?.phone_number || "";
        const profileAddress = profile?.address || profile?.shipping_address || profile?.company_address || "";
        const fallbackName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || "";

        if (nameInput && !nameInput.value) nameInput.value = profileName || fallbackName;
        if (addressInput && !addressInput.value) addressInput.value = profileAddress || "";
        
        if (phoneInput && !phoneInput.value) {
            const rawPhone = profilePhone || currentUser.phone || "";
            phoneInput.value = rawPhone.replace(/[^0-9]/g, '').slice(0, 11);
        }
        
    } catch (err) {
        console.error("Lỗi tự động điền thông tin profile:", err);
    }

    renderCheckoutBill();
}

// ========================================================
// 2. RENDER MINI BILL (ĐÃ SỬA LỖI GIÁ & HÌNH ẢNH)
// ========================================================
function renderCheckoutBill() {
    const container = document.getElementById("checkoutItemsContainer");
    const subtotalElement = document.getElementById("checkoutSubtotal");
    const totalElement = document.getElementById("checkoutTotal");

    if (!container) return;

    let html = "";
    checkoutTotalAmount = 0;

    shoppingCart.forEach(item => {
        // Sử dụng hàm getCheckoutProductPrice để lấy đúng giá B2B
        const price = getCheckoutProductPrice(item);
        const minQty = Number(item.min_order_quantity) || 1;
        const qty = Math.max(minQty, Number(item.qty) || 1);
        const itemSubtotal = price * qty;
        
        checkoutTotalAmount += itemSubtotal;
        
        const priceFormat = formatCurrency(price);
        
        // Sử dụng hàm buildCheckoutImageUrl để lấy đúng hình ảnh
        const image = buildCheckoutImageUrl(item.image);
        
        const safeName = escapeHTML(item.name || "Sản phẩm");
        const safeUnit = escapeHTML(item.unit || "Cái");

        // Không hiển thị riêng lẻ Size nếu nó đã nằm trong Tên Sản Phẩm (như cách Giỏ hàng đang gộp)
        const sizeHTML = ""; 

        html += `
            <article class="checkout-item">
                <div class="checkout-item-image">
                    <img src="${escapeAttribute(image)}" alt="${safeName}" loading="lazy" onerror="this.src='../assets/images/world mark.png'">
                </div>
                <div class="checkout-item-info">
                    <h4 class="checkout-item-name" title="${safeName}">${safeName}</h4>
                    <div class="checkout-item-meta">
                        ${sizeHTML}
                        <span class="checkout-item-quantity">SL: ${qty} ${safeUnit}</span>
                        <span class="checkout-item-price">${priceFormat}</span>
                    </div>
                </div>
            </article>
        `;
    });

    container.innerHTML = html;
    const finalTotal = formatCurrency(checkoutTotalAmount);
    
    setText(subtotalElement, finalTotal);
    setText(totalElement, finalTotal);
}

// ========================================================
// 3. SUBMIT ORDER
// ========================================================
async function handleOrderSubmit(event) {
    event.preventDefault();

    const btnSubmit = document.getElementById("btnSubmitOrder");
    const loadingScreen = document.getElementById("checkoutLoading");
    const form = document.getElementById("checkoutForm");

    const shippingName = getInputValue("shippingName");
    const shippingPhone = getInputValue("shippingPhone");
    const shippingAddress = getInputValue("shippingAddress");
    const orderNotes = getInputValue("orderNotes");

    if (!shippingName || !shippingPhone || !shippingAddress) {
        alert("Vui lòng điền đầy đủ thông tin giao hàng có đánh dấu (*)");
        return;
    }

    const phoneRegex = /^0[0-9]{9,10}$/;
    if (!phoneRegex.test(shippingPhone)) {
        alert("Số điện thoại không hợp lệ! Vui lòng nhập đúng 10-11 chữ số bắt đầu bằng số 0.");
        document.getElementById("shippingPhone")?.focus();
        return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.setItem("redirect_after_login", "checkout.html");
        window.location.href = "login.html";
        return;
    }

    currentUser = session.user;
    let orderItemsData = [];

    try {
        setSubmitLoading(btnSubmit, true);
        if (form) form.classList.add("is-hidden");
        if (loadingScreen) loadingScreen.classList.remove("is-hidden");

        const now = new Date();
        const dateStr = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).replace(/-/g, "");
        const timePart = now.toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }).slice(0, 8).replace(/:/g, "");
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const orderCode = `ORD-${dateStr}-${timePart}-${randomPart}`;

        // ĐÃ FIX: Truyền thêm Dữ liệu Variant và Attributes xuống DB
        orderItemsData = shoppingCart.map(item => ({
            product_id: item.product_id || item.id || null,
            product_name: item.name || item.product_name || "Sản phẩm",
            sku: item.sku || "",
            size: item.size !== undefined && item.size !== null && String(item.size).trim() ? String(item.size).trim() : null,
            quantity: Number(item.qty),
            // Các dữ liệu B2B mở rộng cho hóa đơn (Mặc dù RPC cũ có thể không lưu nhưng truyền sẵn để dùng sau)
            unit_price: getCheckoutProductPrice(item),
            variant_id: item.variant_id || null,
            attributes: item.attributes || null
        }));

        const { data: newOrderId, error: orderError } = await window.supabaseClient.rpc("create_order_transaction", {
            p_user_id: currentUser.id,
            p_order_code: orderCode,
            p_subtotal: checkoutTotalAmount,
            p_shipping_fee: 0,
            p_total: checkoutTotalAmount,
            p_shipping_name: shippingName,
            p_shipping_phone: shippingPhone,
            p_shipping_address: shippingAddress,
            p_note: orderNotes,
            p_items: orderItemsData
        });

        if (orderError) throw orderError;

        localStorage.removeItem("mro_shopping_cart");
        if (typeof updateHeaderCartCount === "function") updateHeaderCartCount();

        alert(`🎉 Đặt hàng thành công!\n\n` + `Mã đơn hàng của bạn là: ${orderCode}\n\n` + `Chúng tôi sẽ sớm liên hệ để xác nhận.`);
        window.location.href = "my-orders.html";

    } catch (error) {
        console.error("Lỗi chốt đơn:", error);
        const errorMessage = error?.message || "";
        const stockMatch = errorMessage.match(/Insufficient stock for product ([a-f0-9-]{36})/i);

        if (stockMatch) {
            const productId = stockMatch[1];
            const product = orderItemsData.find(item => item.product_id === productId);
            const productName = product?.product_name || "Sản phẩm";
            alert(`Sản phẩm "${productName}" không đủ số lượng trong kho.\n\nVui lòng giảm số lượng và thử lại.`);
        } else if (errorMessage.includes("Price changed")) {
            alert("Giá sản phẩm đã thay đổi.\n\nVui lòng tải lại giỏ hàng và kiểm tra lại giá trước khi đặt hàng.");
        } else {
            alert("Không thể đặt hàng lúc này.\n\nVui lòng thử lại sau.");
        }

        if (btnSubmit) setSubmitLoading(btnSubmit, false);
        if (form) form.classList.remove("is-hidden");
        if (loadingScreen) loadingScreen.classList.add("is-hidden");
    }
}

// ========================================================
// 4. BUTTON LOADING
// ========================================================
function setSubmitLoading(button, loading) {
    if (!button) return;
    if (loading) {
        button.disabled = true;
        button.classList.add("is-disabled");
        button.innerHTML = "Đang xử lý...";
    } else {
        button.disabled = false;
        button.classList.remove("is-disabled");
        button.innerHTML = "XÁC NHẬN ĐẶT HÀNG";
    }
}

// ========================================================
// 5. LOAD SHOPPING CART
// ========================================================
function getShoppingCart() {
    try {
        const raw = localStorage.getItem("mro_shopping_cart");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.map(item => ({
            ...item,
            id: item.id || item.product_id || null,
            size: item.size !== undefined && item.size !== null ? String(item.size).trim() : null
        }));
    } catch (error) {
        console.error("Lỗi đọc giỏ hàng:", error);
        return [];
    }
}

// ========================================================
// 6. HELPERS
// ========================================================
function getInputValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : "";
}

function setText(element, value) {
    if (element) element.textContent = value ?? "";
}

function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + " đ";
}

function escapeHTML(value) {
    if (window.utils && typeof window.utils.escapeHTML === "function") return window.utils.escapeHTML(value ?? "");
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHTML(value);
}

// ========================================================
// 7. INIT
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("checkoutForm");
    if (form) {
        form.addEventListener("submit", handleOrderSubmit);
    }

    const phoneInput = document.getElementById("shippingPhone");
    if (phoneInput) {
        phoneInput.addEventListener("input", function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 11);
        });
    }

    initCheckout();
});