// ========================================================
// FILE: assets/js/users/cart.js
// QUẢN LÝ GIỎ HÀNG MUA SẮM
// ========================================================

"use strict";

const CART_STORAGE_KEY = "mro_shopping_cart";
const CART_IMAGE_CDN_BASE = "https://mrokhangnam-image.khangnamvn.workers.dev";
const CART_MAX_QTY = 1000000;

function buildCartImageUrl(imagePath) {
    if (!imagePath) return "../assets/images/world mark.png";
    const cleanPath = String(imagePath).trim();
    if (!cleanPath || cleanPath.includes("via.placeholder.com")) return "../assets/images/world mark.png";
    if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
    return `${CART_IMAGE_CDN_BASE}/${cleanPath.replace(/^\/+/, "")}`;
}

// ĐÃ FIX: Hàm đọc giá tiền tương thích cả SP cũ và Biến thể mới
function getCartProductPrice(item) {
    if (!item) return 0;
    if (item.unit_price) return Number(item.unit_price);
    
    const discountPrice = Number(item.discount_price);
    const regularPrice = Number(item.price);
    if (Number.isFinite(discountPrice) && discountPrice > 0 && discountPrice < regularPrice) {
        return discountPrice;
    }
    return Number.isFinite(regularPrice) ? regularPrice : 0;
}

function normalizeCartSize(size) {
    if (size === undefined || size === null) return "";
    return String(size).trim().replace(/\s+/g, " ").toUpperCase();
}

function getCartItemKey(id, size) {
    const normalizedId = String(id ?? "").trim();
    const normalizedSize = normalizeCartSize(size);
    return `${normalizedId}__SIZE__${normalizedSize}`;
}

function getShoppingCart() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.map(item => {
            const rawQty = Number(item.qty);
            const minQty = Number(item.min_order_quantity) || 1;
            const safeQty = Number.isInteger(rawQty) ? Math.max(minQty, rawQty) : minQty;

            return {
                ...item,
                qty: safeQty,
                size: normalizeCartSize(item.size),
                cartKey: item.cartKey || getCartItemKey(item.product_id || item.id, item.size)
            };
        });
    } catch (error) {
        console.error("Lỗi đọc giỏ hàng:", error);
        return [];
    }
}

function saveShoppingCart(cart) {
    const normalizedCart = Array.isArray(cart) ? cart.map(item => ({
        ...item,
        size: normalizeCartSize(item.size),
        cartKey: item.cartKey || getCartItemKey(item.product_id || item.id, item.size)
    })) : [];
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedCart));
}

function updateHeaderCart() {
    if (typeof updateHeaderCartCount === "function") {
        updateHeaderCartCount();
    }
}

function setCheckoutState(button, disabled) {
    if (!button) return;
    button.disabled = disabled;
    if (disabled) button.classList.add("is-disabled");
    else button.classList.remove("is-disabled");
}

function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + " đ";
}

function setText(element, value) {
    if (element) element.textContent = value ?? "";
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHTML(value);
}

// ========================================================
// RENDER GIỎ HÀNG CHÍNH
// ========================================================
function renderCartItems() {
    const container = document.getElementById("cartItemsContainer");
    const emptyState = document.getElementById("emptyCartState");
    const countText = document.getElementById("cartItemCountText");
    const subtotalElement = document.getElementById("subtotalAmount");
    const totalElement = document.getElementById("totalAmount");
    const checkoutButton = document.getElementById("btnProceedCheckout");

    if (!container) return;

    const shoppingCart = getShoppingCart();

    if (shoppingCart.length === 0) {
        container.innerHTML = "";
        container.classList.add("is-hidden");
        if (emptyState) emptyState.classList.remove("is-hidden");
        setText(countText, "0 sản phẩm");
        setText(subtotalElement, "0 đ");
        setText(totalElement, "0 đ");
        setCheckoutState(checkoutButton, true);
        return;
    }

    container.classList.remove("is-hidden");
    if (emptyState) emptyState.classList.add("is-hidden");
    setCheckoutState(checkoutButton, false);

    let html = "";
    let subtotal = 0;
    let totalItems = 0;

    shoppingCart.forEach(item => {
        // ĐÃ FIX: Lấy chuẩn giá tiền và số lượng B2B
        const price = getCartProductPrice(item);
        const minQty = Number(item.min_order_quantity) || 1;
        const qty = Math.max(minQty, Number(item.qty) || 1);
        const itemTotal = price * qty;

        subtotal += itemTotal;
        totalItems += qty;

        const priceFormat = formatCurrency(price);
        const itemTotalFormat = formatCurrency(itemTotal);
        const image = buildCartImageUrl(item.image);
        
        const productId = item.product_id || item.id;
        const cartKey = item.cartKey || getCartItemKey(productId, item.size);
        const encodedCartKey = encodeURIComponent(cartKey);
        
        const safeName = escapeHTML(item.name || "Sản phẩm");
        const safeSku = escapeHTML(item.sku || "-");
        const safeUnit = escapeHTML(item.unit || "Cái");
        const normalizedSize = normalizeCartSize(item.size);
        const safeSize = escapeHTML(normalizedSize);

        const sizeHTML = normalizedSize
            ? `<span class="cart-item-size">Size: <strong>${safeSize}</strong></span>`
            : "";

        html += `
            <article class="cart-item" data-cart-key="${escapeAttribute(cartKey)}">
                <div class="cart-item-image">
                    <img src="${escapeAttribute(image)}" alt="${safeName}" loading="lazy" onerror="this.src='../assets/images/world mark.png'">
                </div>
                <div class="cart-item-content">
                    <div class="cart-item-info">
                        <span class="cart-item-sku">SKU: ${safeSku}</span>
                        <a href="product-detail.html?id=${encodeURIComponent(productId)}" class="cart-item-name">
                            ${safeName}
                        </a>
                        ${sizeHTML}
                    </div>

                    <div class="cart-item-inline-controls">
                        <div class="cart-controls-left">
                            <div class="cart-inline-price">
                                ${priceFormat} <span>/ ${safeUnit}</span>
                            </div>
                            <div class="cart-quantity-control">
                                <button type="button" class="cart-quantity-button" onclick="updateCartQty('${encodedCartKey}', -1)" aria-label="Giảm">-</button>
                                <input type="text" class="cart-quantity-input" value="${qty}" readonly aria-label="Số lượng">
                                <button type="button" class="cart-quantity-button" onclick="updateCartQty('${encodedCartKey}', 1)" aria-label="Tăng">+</button>
                            </div>
                            <div class="cart-inline-total" title="Thành tiền">
                                ${itemTotalFormat}
                            </div>
                        </div>

                        <div class="cart-inline-actions">
                            <button type="button" class="cart-btn-action cart-btn-edit" onclick="editShoppingCartItem('${encodedCartKey}')" title="Chỉnh sửa">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z"/></svg>
                                <span>Chỉnh sửa</span>
                            </button>
                            <div class="cart-action-divider"></div>
                            <button type="button" class="cart-btn-action cart-btn-delete" onclick="removeCartItem('${encodedCartKey}')" title="Xóa khỏi giỏ">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                <span>Xóa bỏ</span>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    });

    container.innerHTML = html;
    setText(countText, `${totalItems} sản phẩm`);
    const finalTotal = formatCurrency(subtotal);
    setText(subtotalElement, finalTotal);
    setText(totalElement, finalTotal);
}

// ========================================================
// CÁC THAO TÁC CART (SỬA / XÓA / TĂNG GIẢM)
// ========================================================
window.editShoppingCartItem = function (encodedCartKey) {
    const cartKey = decodeURIComponent(encodedCartKey);
    const shoppingCart = getShoppingCart();
    const item = shoppingCart.find(cartItem => (cartItem.cartKey || getCartItemKey(cartItem.product_id || cartItem.id, cartItem.size)) === cartKey);

    if (!item) return;

    const productId = item.product_id ?? item.id;
    if (!productId) {
        alert("Không xác định được sản phẩm để chỉnh sửa.");
        return;
    }

    const editKey = encodeURIComponent(cartKey);
    window.location.href = `product-detail.html?id=${encodeURIComponent(productId)}&edit_cart_key=${editKey}`;
};

window.updateCartQty = function (encodedCartKey, change) {
    const cartKey = decodeURIComponent(encodedCartKey);
    let shoppingCart = getShoppingCart();
    
    const itemIndex = shoppingCart.findIndex(item => (item.cartKey || getCartItemKey(item.product_id || item.id, item.size)) === cartKey);
    if (itemIndex === -1) return;

    const item = shoppingCart[itemIndex];
    const currentQty = Number(item.qty) || 1;
    const numericChange = Number(change);
    if (!Number.isFinite(numericChange)) return;

    const minQty = Number(item.min_order_quantity) || 1;
    const stockQty = Number(item.stock_quantity) || 0;
    const maxQty = stockQty > 0 ? stockQty : CART_MAX_QTY;

    let newQty = currentQty + numericChange;
    newQty = Math.min(maxQty, Math.max(minQty, Math.trunc(newQty)));

    shoppingCart[itemIndex].qty = newQty;
    shoppingCart[itemIndex].cartKey = item.cartKey || cartKey;

    saveShoppingCart(shoppingCart);
    renderCartItems();
    updateHeaderCart();
};

window.removeCartItem = function (encodedCartKey) {
    const cartKey = decodeURIComponent(encodedCartKey);
    let shoppingCart = getShoppingCart();
    shoppingCart = shoppingCart.filter(item => (item.cartKey || getCartItemKey(item.product_id || item.id, item.size)) !== cartKey);
    
    saveShoppingCart(shoppingCart);
    renderCartItems();
    updateHeaderCart();
};

window.proceedToCheckout = function () {
    const shoppingCart = getShoppingCart();
    if (shoppingCart.length === 0) return;
    window.location.href = "checkout.html";
};

// ========================================================
// INIT
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    renderCartItems();
    updateHeaderCart();
});