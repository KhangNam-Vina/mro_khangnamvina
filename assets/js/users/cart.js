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

    const CART_IMAGE_CDN_BASE =
    "https://mrokhangnam-image.khangnamvn.workers.dev";

function buildCartImageUrl(imagePath) {

    if (!imagePath) {
        return "../assets/images/no-image.png";
    }

    const cleanPath =
        String(imagePath).trim();

    if (!cleanPath) {
        return "../assets/images/no-image.png";
    }

    // Giữ an toàn nếu localStorage cũ còn URL đầy đủ
    if (/^https?:\/\//i.test(cleanPath)) {
        return cleanPath;
    }

    return `${CART_IMAGE_CDN_BASE}/${cleanPath.replace(/^\/+/, "")}`;
}

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
// 5. THÊM / CẬP NHẬT SẢN PHẨM TRONG GIỎ
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


    const product =
        window.currentProductData;


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


    /*
     * =====================================================
     * LẤY SIZE HIỆN TẠI
     * =====================================================
     */

    const selectedSize =
        normalizeCartSize(
            getSelectedProductSize(
                product
            )
        );


    /*
     * =====================================================
     * CART KEY MỚI
     * =====================================================
     */

    const newCartKey =
        getCartItemKey(
            product.id,
            selectedSize
        );


    let shoppingCart =
        getShoppingCart();


    /*
     * =====================================================
     * KIỂM TRA CÓ ĐANG EDIT KHÔNG
     *
     * URL:
     *
     * product-detail.html
     * ?id=123
     * &edit_cart_key=123__SIZE__2.2MM
     * =====================================================
     */

    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const encodedEditCartKey =
        urlParams.get(
            "edit_cart_key"
        );


    const editCartKey =
        encodedEditCartKey
            ? decodeURIComponent(
                encodedEditCartKey
            )
            : null;


    /*
     * =====================================================
     * CHẾ ĐỘ CHỈNH SỬA
     * =====================================================
     */

    if (editCartKey) {

        const oldIndex =
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
                        editCartKey
                    );
                }
            );


        /*
         * Không tìm thấy item cũ
         */
        if (
            oldIndex === -1
        ) {

            console.warn(
                "Không tìm thấy item cũ để chỉnh sửa:",
                editCartKey
            );

        } else {

            const oldItem =
                shoppingCart[
                    oldIndex
                ];


            /*
             * =================================================
             * TRƯỜNG HỢP:
             *
             * Size KHÔNG thay đổi
             *
             * → chỉ cập nhật Qty
             * =================================================
             */

            if (
                newCartKey ===
                editCartKey
            ) {

                shoppingCart[
                    oldIndex
                ] = {

                    ...oldItem,

                    id:
                        product.id,

                    cartKey:
                        newCartKey,

                    sku:
                        product.sku,

                    name:
                        product.name,

                    price:
                        Number(
                            product.price
                        ) || 0,

                    image:
                        buildCartImageUrl(
                            product.image_path
                        ),

                    unit:
                        product.unit ||
                        "Cái",

                    size:
                        selectedSize,

                    /*
                     * Giữ Qty mà người dùng
                     * đang nhập trên detail.
                     */
                    qty:
                        qty
                };

            }


            /*
             * =================================================
             * TRƯỜNG HỢP:
             *
             * Size ĐÃ THAY ĐỔI
             * =================================================
             */

            else {

                /*
                 * Kiểm tra Size mới đã tồn tại
                 * trong cart hay chưa.
                 */
                const existingNewIndex =
                    shoppingCart.findIndex(
                        (item, index) => {

                            if (
                                index ===
                                oldIndex
                            ) {
                                return false;
                            }

                            const itemKey =
                                item.cartKey ||
                                getCartItemKey(
                                    item.id,
                                    item.size
                                );

                            return (
                                itemKey ===
                                newCartKey
                            );
                        }
                    );


                /*
                 * =================================================
                 * SIZE MỚI ĐÃ CÓ TRONG CART
                 *
                 * → Gộp Qty
                 * → Xóa dòng cũ
                 * =================================================
                 */

                if (
                    existingNewIndex !== -1
                ) {

                    shoppingCart[
                        existingNewIndex
                    ].qty =
                        (
                            Number(
                                shoppingCart[
                                    existingNewIndex
                                ].qty
                            ) || 0
                        ) + qty;


                    /*
                     * Xóa item cũ.
                     */
                    shoppingCart.splice(
                        oldIndex,
                        1
                    );

                }


                /*
                 * =================================================
                 * SIZE MỚI CHƯA CÓ
                 *
                 * → Thay item cũ bằng item mới
                 * =================================================
                 */

                else {

                    shoppingCart[
                        oldIndex
                    ] = {

                        cartKey:
                            newCartKey,

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
                            buildCartImageUrl(
                                product.image_path
                            ),

                        unit:
                            product.unit ||
                            "Cái",

                        size:
                            selectedSize,

                        qty:
                            qty
                    };
                }
            }
        }


        /*
         * =====================================================
         * SAVE
         * =====================================================
         */

        saveShoppingCart(
            shoppingCart
        );


        /*
         * =====================================================
         * THÔNG BÁO
         * =====================================================
         */

        const sizeText =
            selectedSize
                ? ` - Size ${selectedSize}`
                : "";


        const message =
            `Đã cập nhật ${qty} ${
                product.unit || "Cái"
            }${sizeText} trong Giỏ hàng!`;


        if (
            window.utils &&
            typeof window.utils.showToast ===
                "function"
        ) {

            window.utils.showToast(
                message,
                "success"
            );

        }


        /*
         * =====================================================
         * QUAY LẠI CART
         * =====================================================
         */

        setTimeout(
            () => {

                window.location.href =
                    "cart.html";

            },
            300
        );


        return;
    }


    /*
     * =====================================================
     * CHẾ ĐỘ THÊM MỚI
     * =====================================================
     */

    const existingIndex =
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
                    newCartKey
                );
            }
        );


    /*
     * ĐÃ CÓ CÙNG PRODUCT + SIZE
     *
     * → cộng Qty
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


        shoppingCart[
            existingIndex
        ].cartKey =
            newCartKey;

    }


    /*
     * CHƯA CÓ
     *
     * → tạo item mới
     */
    else {

        shoppingCart.push({

            cartKey:
                newCartKey,

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
                buildCartImageUrl(
                    product.image_path
                ),

            unit:
                product.unit ||
                "Cái",

            size:
                selectedSize,

            qty:
                qty
        });
    }


    /*
     * SAVE
     */

    saveShoppingCart(
        shoppingCart
    );


    /*
     * TOAST
     */

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
// 6. RENDER GIỎ HÀNG (ĐÃ FIX INLINE LAYOUT)
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

    /* GIỎ TRỐNG */
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

    /* CÓ SẢN PHẨM */
    container.classList.remove("is-hidden");
    if (emptyState) emptyState.classList.add("is-hidden");
    setCheckoutState(checkoutButton, false);

    let html = "";
    let subtotal = 0;
    let totalItems = 0;

    shoppingCart.forEach(item => {
        const price = Number(item.price) || 0;
        const qty = Math.max(1, Number(item.qty) || 1);
        const itemTotal = price * qty;

        subtotal += itemTotal;
        totalItems += qty;

        const priceFormat = formatCurrency(price);
        const itemTotalFormat = formatCurrency(itemTotal);
        const image = item.image || "https://via.placeholder.com/150?text=No+Image";
        const cartKey = item.cartKey || getCartItemKey(item.id, item.size);
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
                    <img src="${escapeAttribute(image)}" alt="${safeName}" loading="lazy">
                </div>

                <div class="cart-item-content">
                    
                    <!-- DÒNG TRÊN: THÔNG TIN SẢN PHẨM -->
                    <div class="cart-item-info">
                        <span class="cart-item-sku">SKU: ${safeSku}</span>
                        <a href="product-detail.html?id=${encodeURIComponent(item.id)}" class="cart-item-name">
                            ${safeName}
                        </a>
                        ${sizeHTML}
                    </div>

                    <!-- DÒNG DƯỚI: BẢNG ĐIỀU KHIỂN GỘP CHUNG (INLINE) -->
                    <div class="cart-item-inline-controls">
                        
                        <!-- BÊN TRÁI: GIÁ, SL, THÀNH TIỀN -->
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

                        <!-- BÊN PHẢI: SỬA, XÓA ĐỒNG BỘ ĐỊNH DẠNG -->
                        <div class="cart-inline-actions">
                            <button type="button" class="cart-btn-action cart-btn-edit" onclick="editShoppingCartItem('${encodedCartKey}')" title="Đổi Size">
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
// CHỈNH SỬA SẢN PHẨM TRONG GIỎ
// ========================================================

window.editShoppingCartItem =
function (encodedCartKey) {

    const cartKey =
        decodeURIComponent(
            encodedCartKey
        );

    const shoppingCart =
        getShoppingCart();

    const item =
        shoppingCart.find(
            cartItem => {

                const itemKey =
                    cartItem.cartKey ||
                    getCartItemKey(
                        cartItem.id,
                        cartItem.size
                    );

                return (
                    itemKey ===
                    cartKey
                );
            }
        );

    if (!item) {

        console.error(
            "Không tìm thấy sản phẩm cần chỉnh sửa:",
            cartKey
        );

        return;
    }


    /*
     * Product ID thật.
     *
     * Ưu tiên id mới,
     * fallback product_id cho dữ liệu cũ.
     */
    const productId =
        item.id ??
        item.product_id;


    if (!productId) {

        alert(
            "Không xác định được sản phẩm để chỉnh sửa."
        );

        return;
    }


    /*
     * Encode toàn bộ cartKey.
     *
     * cartKey có thể chứa Size:
     *
     * 123__SIZE__2.2MM
     */
    const editKey =
        encodeURIComponent(
            cartKey
        );


    /*
     * Chuyển sang Product Detail
     *
     * edit_cart_key dùng để báo cho
     * product-detail.js biết đây là
     * chế độ CHỈNH SỬA.
     */
    window.location.href =
        `product-detail.html?id=${encodeURIComponent(
            productId
        )}&edit_cart_key=${editKey}`;
};

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