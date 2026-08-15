// ========================================================
// FILE: assets/js/users/cart.js
// QUẢN LÝ GIỎ HÀNG TRỰC TIẾP
// STATIC CSS VERSION
// ========================================================

"use strict";


// ========================================================
// 1. THÊM SẢN PHẨM VÀO GIỎ
// ========================================================

window.addToShoppingCart =
function () {

    if (!window.currentProductData) {

        console.error(
            "Chưa tải được dữ liệu sản phẩm."
        );

        alert(
            "Hệ thống đang tải dữ liệu, vui lòng thử lại sau giây lát!"
        );

        return;
    }


    const qtyInput =
        document.getElementById(
            "buyQty"
        );


    const qty =
        parseInt(
            qtyInput
                ? qtyInput.value
                : 1,
            10
        ) || 1;


    const product =
        window.currentProductData;


    let shoppingCart =
        getShoppingCart();


    const existingIndex =
        shoppingCart.findIndex(
            item =>
                String(item.id) ===
                String(product.id)
        );


    if (existingIndex > -1) {

        shoppingCart[
            existingIndex
        ].qty += qty;

    } else {

        shoppingCart.push({

            id:
                product.id,

            sku:
                product.sku,

            name:
                product.name,

            price:
                Number(product.price) || 0,

            image:
                product.image_url,

            unit:
                product.unit || "Cái",

            qty:
                qty
        });
    }


    saveShoppingCart(
        shoppingCart
    );


    const message =
        `Đã thêm ${qty} ${
            product.unit || "Cái"
        } vào Giỏ hàng!`;


    if (
        window.utils &&
        typeof window.utils.showToast ===
            "function"
    ) {

        window.utils.showToast(
            message,
            "success"
        );

    } else {

        alert(
            `🛒 ${message}`
        );
    }


    updateHeaderCart();
};


// ========================================================
// 2. RENDER GIỎ HÀNG
// ========================================================

function renderCartItems() {

    const container =
        document.getElementById(
            "cartItemsContainer"
        );

    const emptyState =
        document.getElementById(
            "emptyCartState"
        );

    const countText =
        document.getElementById(
            "cartItemCountText"
        );

    const subtotalElement =
        document.getElementById(
            "subtotalAmount"
        );

    const totalElement =
        document.getElementById(
            "totalAmount"
        );

    const checkoutButton =
        document.getElementById(
            "btnProceedCheckout"
        );


    /*
     * Không ở trang cart thì bỏ qua.
     */
    if (!container) {
        return;
    }


    const shoppingCart =
        getShoppingCart();


    /*
     * GIỎ TRỐNG
     */
    if (
        shoppingCart.length ===
        0
    ) {

        container.innerHTML =
            "";

        container.classList.add(
            "is-hidden"
        );


        if (emptyState) {

            emptyState.classList.remove(
                "is-hidden"
            );
        }


        setText(
            countText,
            "0 sản phẩm"
        );

        setText(
            subtotalElement,
            "0 đ"
        );

        setText(
            totalElement,
            "0 đ"
        );


        setCheckoutState(
            checkoutButton,
            true
        );


        return;
    }


    /*
     * CÓ SẢN PHẨM
     */
    container.classList.remove(
        "is-hidden"
    );


    if (emptyState) {

        emptyState.classList.add(
            "is-hidden"
        );
    }


    setCheckoutState(
        checkoutButton,
        false
    );


    let html =
        "";

    let subtotal =
        0;

    let totalItems =
        0;


    shoppingCart.forEach(
        item => {

            const price =
                Number(
                    item.price
                ) || 0;


            const qty =
                Math.max(
                    1,
                    Number(
                        item.qty
                    ) || 1
                );


            const itemTotal =
                price * qty;


            subtotal +=
                itemTotal;

            totalItems +=
                qty;


            const priceFormat =
                formatCurrency(
                    price
                );


            const itemTotalFormat =
                formatCurrency(
                    itemTotal
                );


            const image =
                item.image ||
                "https://via.placeholder.com/150?text=No+Image";


            const safeId =
                escapeAttribute(
                    item.id
                );


            const safeName =
                escapeHTML(
                    item.name ||
                    "Sản phẩm"
                );


            const safeSku =
                escapeHTML(
                    item.sku ||
                    "-"
                );


            const safeUnit =
                escapeHTML(
                    item.unit ||
                    "Cái"
                );


            html += `

                <article class="cart-item">

                    <button
                        type="button"
                        class="cart-item-remove"
                        onclick="removeCartItem('${safeId}')"
                        title="Xóa sản phẩm"
                        aria-label="Xóa sản phẩm"
                    >

                        <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                        </svg>

                    </button>


                    <div class="cart-item-image">

                        <img
                            src="${escapeAttribute(image)}"
                            alt="${safeName}"
                            loading="lazy"
                        >

                    </div>


                    <div class="cart-item-content">

                        <div class="cart-item-info">

                            <span class="cart-item-sku">
                                SKU: ${safeSku}
                            </span>


                            <a
                                href="product-detail.html?id=${encodeURIComponent(item.id)}"
                                class="cart-item-name"
                            >
                                ${safeName}
                            </a>


                            <span class="cart-item-price">

                                ${priceFormat}

                                <span class="cart-item-price-unit">
                                    / ${safeUnit}
                                </span>

                            </span>

                        </div>


                        <div class="cart-item-actions">


                            <div class="cart-quantity-control">

                                <button
                                    type="button"
                                    class="cart-quantity-button"
                                    onclick="updateCartQty('${safeId}', -1)"
                                    aria-label="Giảm số lượng"
                                >
                                    -
                                </button>


                                <input
                                    type="text"
                                    class="cart-quantity-input"
                                    value="${qty}"
                                    readonly
                                    aria-label="Số lượng"
                                >


                                <button
                                    type="button"
                                    class="cart-quantity-button"
                                    onclick="updateCartQty('${safeId}', 1)"
                                    aria-label="Tăng số lượng"
                                >
                                    +
                                </button>

                            </div>


                            <div class="cart-item-total">
                                ${itemTotalFormat}
                            </div>

                        </div>

                    </div>

                </article>

            `;
        }
    );


    container.innerHTML =
        html;


    setText(
        countText,
        `${totalItems} sản phẩm`
    );


    const finalTotal =
        formatCurrency(
            subtotal
        );


    setText(
        subtotalElement,
        finalTotal
    );

    setText(
        totalElement,
        finalTotal
    );
}


// ========================================================
// 3. CẬP NHẬT SỐ LƯỢNG
// ========================================================

window.updateCartQty =
function (
    id,
    change
) {

    let shoppingCart =
        getShoppingCart();


    const itemIndex =
        shoppingCart.findIndex(
            item =>
                String(item.id) ===
                String(id)
        );


    if (
        itemIndex ===
        -1
    ) {
        return;
    }


    const currentQty =
        Number(
            shoppingCart[
                itemIndex
            ].qty
        ) || 1;


    let newQty =
        currentQty +
        Number(change);


    if (
        newQty <
        1
    ) {

        newQty =
            1;
    }


    shoppingCart[
        itemIndex
    ].qty =
        newQty;


    saveShoppingCart(
        shoppingCart
    );


    renderCartItems();

    updateHeaderCart();
};


// ========================================================
// 4. XÓA SẢN PHẨM
// ========================================================

window.removeCartItem =
function (
    id
) {

    let shoppingCart =
        getShoppingCart();


    shoppingCart =
        shoppingCart.filter(
            item =>
                String(item.id) !==
                String(id)
        );


    saveShoppingCart(
        shoppingCart
    );


    renderCartItems();

    updateHeaderCart();
};


// ========================================================
// 5. CHUYỂN CHECKOUT
// ========================================================

window.proceedToCheckout =
function () {

    const shoppingCart =
        getShoppingCart();


    if (
        shoppingCart.length ===
        0
    ) {

        return;
    }


    window.location.href =
        "checkout.html";
};


// ========================================================
// 6. STORAGE HELPERS
// ========================================================

function getShoppingCart() {

    try {

        const raw =
            localStorage.getItem(
                "mro_shopping_cart"
            );


        if (!raw) {
            return [];
        }


        const parsed =
            JSON.parse(
                raw
            );


        return Array.isArray(
            parsed
        )
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Lỗi đọc giỏ hàng:",
            error
        );

        return [];
    }
}


function saveShoppingCart(
    cart
) {

    localStorage.setItem(
        "mro_shopping_cart",
        JSON.stringify(
            cart
        )
    );
}


// ========================================================
// 7. HEADER CART COUNT
// ========================================================

function updateHeaderCart() {

    if (
        typeof updateHeaderCartCount ===
        "function"
    ) {

        updateHeaderCartCount();
    }
}


// ========================================================
// 8. CHECKOUT BUTTON STATE
// ========================================================

function setCheckoutState(
    button,
    disabled
) {

    if (!button) {
        return;
    }


    button.disabled =
        disabled;


    if (disabled) {

        button.classList.add(
            "is-disabled"
        );

    } else {

        button.classList.remove(
            "is-disabled"
        );
    }
}


// ========================================================
// 9. CURRENCY
// ========================================================

function formatCurrency(
    value
) {

    return (
        new Intl.NumberFormat(
            "vi-VN"
        ).format(
            Number(value) || 0
        ) +
        " đ"
    );
}


// ========================================================
// 10. DOM HELPERS
// ========================================================

function setText(
    element,
    value
) {

    if (element) {

        element.textContent =
            value ?? "";
    }
}


// ========================================================
// 11. ESCAPE HELPERS
// ========================================================

function escapeHTML(
    value
) {

    if (
        window.utils &&
        typeof window.utils.escapeHTML ===
            "function"
    ) {

        return window.utils.escapeHTML(
            value ?? ""
        );
    }


    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );
}


// ========================================================
// 12. INIT
// ========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderCartItems();

        updateHeaderCart();
    }
);