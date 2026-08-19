// ========================================================
// FILE: assets/js/users/cart.js
// QUẢN LÝ GIỎ HÀNG MUA SẮM
//
// QUY TẮC:
// 1. Cùng product ID + cùng SIZE => cùng 1 dòng
// 2. Cùng product ID + khác SIZE => 2 dòng khác nhau
// 3. Size được lưu trực tiếp trong localStorage
// 4. Không thay đổi database
// ========================================================

"use strict";


// ========================================================
// 1. CONSTANT
// ========================================================

const CART_STORAGE_KEY =
    "mro_shopping_cart";


function getSelectedProductSize(product) {

    /*
     * =====================================================
     * ƯU TIÊN 1:
     * Lấy trực tiếp Size đang được chọn trên giao diện.
     *
     * product-detail.js đang đánh dấu:
     *
     * .product-size-btn.is-active
     *
     * và lưu Size trong:
     *
     * data-size="S"
     * data-size="M"
     * data-size="L"
     * =====================================================
     */

    const activeSizeButton =
        document.querySelector(
            ".product-size-btn.is-active"
        );


    if (activeSizeButton) {

        const activeSize =
            activeSizeButton.dataset.size ||
            activeSizeButton.getAttribute(
                "data-size"
            ) ||
            "";


        if (
            String(
                activeSize
            ).trim()
        ) {

            return String(
                activeSize
            ).trim();
        }
    }


    /*
     * =====================================================
     * ƯU TIÊN 2:
     * Nếu product đã có selectedSize.
     * =====================================================
     */

    if (
        product &&
        product.selectedSize !== undefined &&
        product.selectedSize !== null
    ) {

        return String(
            product.selectedSize
        ).trim();
    }


    /*
     * =====================================================
     * ƯU TIÊN 3:
     * Nếu product đã có size.
     * =====================================================
     */

    if (
        product &&
        product.size !== undefined &&
        product.size !== null
    ) {

        return String(
            product.size
        ).trim();
    }


    /*
     * =====================================================
     * ƯU TIÊN 4:
     * Fallback cũ.
     * =====================================================
     */

    if (
        window.selectedProductSize !== undefined &&
        window.selectedProductSize !== null
    ) {

        return String(
            window.selectedProductSize
        ).trim();
    }


    /*
     * =====================================================
     * Không có Size.
     * =====================================================
     */

    return "";
}


// ========================================================
// 3. CHUẨN HÓA SIZE
// ========================================================

function normalizeCartSize(size) {

    if (
        size === undefined ||
        size === null
    ) {

        return "";
    }


    return String(size)
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();
}


// ========================================================
// 4. TẠO CART KEY
// ========================================================

function getCartItemKey(
    id,
    size
) {

    const normalizedId =
        String(id ?? "").trim();


    const normalizedSize =
        normalizeCartSize(size);


    /*
     * ID + SIZE chính là identity
     * của một dòng trong giỏ hàng.
     */
    return (
        `${normalizedId}__SIZE__${normalizedSize}`
    );
}


// ========================================================
// 5. THÊM SẢN PHẨM VÀO GIỎ
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
        Math.max(
            1,
            parseInt(
                qtyInput
                    ? qtyInput.value
                    : 1,
                10
            ) || 1
        );


    const product =
        window.currentProductData;


    /*
     * LẤY SIZE ĐANG CHỌN.
     */
    const selectedSize =
        normalizeCartSize(
            getSelectedProductSize(
                product
            )
        );


    /*
     * Identity của item:
     *
     * product.id + size
     */
    const cartKey =
        getCartItemKey(
            product.id,
            selectedSize
        );


    let shoppingCart =
        getShoppingCart();


    /*
     * Tìm đúng sản phẩm + đúng size.
     */
    const existingIndex =
        shoppingCart.findIndex(
            item => {

                /*
                 * Ưu tiên cartKey mới.
                 */
                if (
                    item.cartKey
                ) {

                    return (
                        item.cartKey ===
                        cartKey
                    );
                }


                /*
                 * Fallback cho dữ liệu
                 * localStorage cũ.
                 */
                return (
                    String(item.id) ===
                        String(product.id) &&
                    normalizeCartSize(
                        item.size
                    ) ===
                        selectedSize
                );
            }
        );


    /*
     * ĐÃ CÓ CÙNG ID + SIZE
     */
    if (
        existingIndex > -1
    ) {

        shoppingCart[
            existingIndex
        ].qty =
            (
                Number(
                    shoppingCart[
                        existingIndex
                    ].qty
                ) || 0
            ) + qty;


        /*
         * Chuẩn hóa lại cartKey
         * cho dữ liệu cũ.
         */
        shoppingCart[
            existingIndex
        ].cartKey =
            cartKey;


        shoppingCart[
            existingIndex
        ].size =
            selectedSize;

    }


    /*
     * CHƯA CÓ ID + SIZE
     */
    else {

        shoppingCart.push({

            /*
             * Identity chính.
             */
            cartKey:
                cartKey,

            id:
                product.id,

            sku:
                product.sku,

            name:
                product.name,

            price:
                Number(
                    product.price
                ) || 0,

            image:
                product.image_url,

            unit:
                product.unit ||
                "Cái",

            /*
             * SIZE RẤT QUAN TRỌNG.
             */
            size:
                selectedSize,

            qty:
                qty
        });
    }


    saveShoppingCart(
        shoppingCart
    );


    const sizeText =
        selectedSize
            ? ` - Size ${selectedSize}`
            : "";


    const message =
        `Đã thêm ${qty} ${
            product.unit || "Cái"
        }${sizeText} vào Giỏ hàng!`;


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
// 6. RENDER GIỎ HÀNG
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


            /*
             * ID + SIZE được dùng làm
             * identity của dòng.
             */
            const cartKey =
                item.cartKey ||
                getCartItemKey(
                    item.id,
                    item.size
                );


            const encodedCartKey =
                encodeURIComponent(
                    cartKey
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


            const normalizedSize =
                normalizeCartSize(
                    item.size
                );


            const safeSize =
                escapeHTML(
                    normalizedSize
                );


            /*
             * HIỂN THỊ SIZE
             */
            const sizeHTML =
                normalizedSize
                    ? `
                        <span class="cart-item-size">
                            Size:
                            <strong>
                                ${safeSize}
                            </strong>
                        </span>
                    `
                    : "";


            html += `

                <article
                    class="cart-item"
                    data-cart-key="${escapeAttribute(
                        cartKey
                    )}"
                >

                    <button
                        type="button"
                        class="cart-item-remove"
                        onclick="removeCartItem('${encodedCartKey}')"
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
                                href="product-detail.html?id=${encodeURIComponent(
                                    item.id
                                )}"
                                class="cart-item-name"
                            >
                                ${safeName}
                            </a>


                            ${sizeHTML}


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
                                    onclick="updateCartQty('${encodedCartKey}', -1)"
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
                                    onclick="updateCartQty('${encodedCartKey}', 1)"
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
// 7. CẬP NHẬT SỐ LƯỢNG
// ========================================================

window.updateCartQty =
function (
    encodedCartKey,
    change
) {

    const cartKey =
        decodeURIComponent(
            encodedCartKey
        );


    let shoppingCart =
        getShoppingCart();


    const itemIndex =
        shoppingCart.findIndex(
            item => {

                const itemKey =
                    item.cartKey ||
                    getCartItemKey(
                        item.id,
                        item.size
                    );


                return (
                    itemKey ===
                    cartKey
                );
            }
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


    /*
     * Chuẩn hóa cartKey.
     */
    shoppingCart[
        itemIndex
    ].cartKey =
        shoppingCart[
            itemIndex
        ].cartKey ||
        cartKey;


    saveShoppingCart(
        shoppingCart
    );


    renderCartItems();

    updateHeaderCart();
};


// ========================================================
// 8. XÓA SẢN PHẨM
// ========================================================

window.removeCartItem =
function (
    encodedCartKey
) {

    const cartKey =
        decodeURIComponent(
            encodedCartKey
        );


    let shoppingCart =
        getShoppingCart();


    shoppingCart =
        shoppingCart.filter(
            item => {

                const itemKey =
                    item.cartKey ||
                    getCartItemKey(
                        item.id,
                        item.size
                    );


                return (
                    itemKey !==
                    cartKey
                );
            }
        );


    saveShoppingCart(
        shoppingCart
    );


    renderCartItems();

    updateHeaderCart();
};


// ========================================================
// 9. CHUYỂN CHECKOUT
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
// 10. STORAGE HELPERS
// ========================================================

function getShoppingCart() {

    try {

        const raw =
            localStorage.getItem(
                CART_STORAGE_KEY
            );


        if (!raw) {
            return [];
        }


        const parsed =
            JSON.parse(
                raw
            );


        if (
            !Array.isArray(
                parsed
            )
        ) {

            return [];
        }


        /*
         * MIGRATION NHẸ:
         * Các item cũ chưa có cartKey
         * vẫn được tính bằng ID + SIZE.
         */
        return parsed.map(
            item => ({

                ...item,

                size:
                    normalizeCartSize(
                        item.size
                    ),

                cartKey:
                    item.cartKey ||
                    getCartItemKey(
                        item.id,
                        item.size
                    )
            })
        );

    } catch (error) {

        console.error(
            "Lỗi đọc giỏ hàng:",
            error
        );

        return [];
    }
}


// ========================================================
// 11. SAVE CART
// ========================================================

function saveShoppingCart(
    cart
) {

    const normalizedCart =
        Array.isArray(cart)
            ? cart.map(
                item => ({

                    ...item,

                    size:
                        normalizeCartSize(
                            item.size
                        ),

                    cartKey:
                        item.cartKey ||
                        getCartItemKey(
                            item.id,
                            item.size
                        )
                })
            )
            : [];


    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(
            normalizedCart
        )
    );
}


// ========================================================
// 12. HEADER CART COUNT
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
// 13. CHECKOUT BUTTON STATE
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
// 14. CURRENCY
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
// 15. DOM HELPERS
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
// 16. ESCAPE HELPERS
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
// 17. INIT
// ========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderCartItems();

        updateHeaderCart();
    }
);