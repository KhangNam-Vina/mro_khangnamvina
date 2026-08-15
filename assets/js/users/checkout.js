// ========================================================
// FILE: assets/js/users/checkout.js
// XỬ LÝ THANH TOÁN ĐƠN MUA NGAY
// STATIC CSS VERSION
// ========================================================

"use strict";


let currentUser = null;
let shoppingCart = [];
let checkoutTotalAmount = 0;


// ========================================================
// 1. INIT CHECKOUT
// ========================================================

async function initCheckout() {

    shoppingCart =
        getShoppingCart();


    /*
     * Giỏ hàng trống
     */

    if (
        shoppingCart.length ===
        0
    ) {

        alert(
            "Giỏ hàng của bạn đang trống! Vui lòng chọn sản phẩm trước khi thanh toán."
        );

        window.location.href =
            "products.html";

        return;
    }


    /*
     * Kiểm tra Supabase
     */

    if (
        !window.supabaseClient
    ) {

        console.error(
            "Supabase chưa được khởi tạo!"
        );

        return;
    }


    /*
     * Kiểm tra đăng nhập
     */

    const {
        data: {
            session
        }
    } =
        await window.supabaseClient
            .auth
            .getSession();


    if (!session) {

        alert(
            "Vui lòng đăng nhập để tiến hành đặt hàng!"
        );


        localStorage.setItem(
            "redirect_after_login",
            "checkout.html"
        );


        window.location.href =
            "login.html";

        return;
    }


    currentUser =
        session.user;


    renderCheckoutBill();
}


// ========================================================
// 2. RENDER MINI BILL
// ========================================================

function renderCheckoutBill() {

    const container =
        document.getElementById(
            "checkoutItemsContainer"
        );

    const subtotalElement =
        document.getElementById(
            "checkoutSubtotal"
        );

    const totalElement =
        document.getElementById(
            "checkoutTotal"
        );


    if (!container) {
        return;
    }


    let html =
        "";

    checkoutTotalAmount =
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


            const itemSubtotal =
                price *
                qty;


            checkoutTotalAmount +=
                itemSubtotal;


            const priceFormat =
                formatCurrency(
                    price
                );


            const image =
                item.image ||
                "https://via.placeholder.com/150?text=No+Image";


            const safeName =
                escapeHTML(
                    item.name ||
                    "Sản phẩm"
                );


            const safeUnit =
                escapeHTML(
                    item.unit ||
                    "Cái"
                );


            html += `

                <article class="checkout-item">

                    <div class="checkout-item-image">

                        <img
                            src="${escapeAttribute(image)}"
                            alt="${safeName}"
                            loading="lazy"
                        >

                    </div>


                    <div class="checkout-item-info">

                        <h4
                            class="checkout-item-name"
                            title="${safeName}"
                        >
                            ${safeName}
                        </h4>


                        <div class="checkout-item-meta">

                            <span class="checkout-item-quantity">
                                SL: ${qty} ${safeUnit}
                            </span>


                            <span class="checkout-item-price">
                                ${priceFormat}
                            </span>

                        </div>

                    </div>

                </article>

            `;
        }
    );


    container.innerHTML =
        html;


    const finalTotal =
        formatCurrency(
            checkoutTotalAmount
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
// 3. SUBMIT ORDER
// ========================================================

async function handleOrderSubmit(
    event
) {

    event.preventDefault();


    const btnSubmit =
        document.getElementById(
            "btnSubmitOrder"
        );

    const loadingScreen =
        document.getElementById(
            "checkoutLoading"
        );

    const form =
        document.getElementById(
            "checkoutForm"
        );


    /*
     * Lấy dữ liệu form
     */

    const shippingName =
        getInputValue(
            "shippingName"
        );

    const shippingPhone =
        getInputValue(
            "shippingPhone"
        );

    const shippingAddress =
        getInputValue(
            "shippingAddress"
        );

    const orderNotes =
        getInputValue(
            "orderNotes"
        );


    /*
     * Validate
     */

    if (
        !shippingName ||
        !shippingPhone ||
        !shippingAddress
    ) {

        alert(
            "Vui lòng điền đầy đủ thông tin giao hàng có đánh dấu (*)"
        );

        return;
    }


    /*
     * Kiểm tra user
     */

    if (!currentUser) {

        alert(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        );

        window.location.href =
            "login.html";

        return;
    }


    try {

        /*
         * Disable UI
         */

        setSubmitLoading(
            btnSubmit,
            true
        );


        if (form) {

            form.classList.add(
                "is-hidden"
            );
        }


        if (loadingScreen) {

            loadingScreen.classList.remove(
                "is-hidden"
            );
        }


        /*
         * Tạo mã đơn
         */

        const dateStr =
            new Date()
                .toISOString()
                .slice(
                    0,
                    10
                )
                .replace(
                    /-/g,
                    ""
                );


        const randomNum =
            Math.floor(
                1000 +
                Math.random() *
                9000
            );


        const orderCode =
            `ORD-${dateStr}-${randomNum}`;


        /*
         * INSERT ORDERS
         */

        const {
            data: newOrder,
            error: orderError
        } =
            await window.supabaseClient
                .from("orders")
                .insert([
                    {
                        user_id:
                            currentUser.id,

                        order_code:
                            orderCode,

                        status:
                            "pending",

                        subtotal:
                            checkoutTotalAmount,

                        shipping_fee:
                            0,

                        total:
                            checkoutTotalAmount,

                        shipping_name:
                            shippingName,

                        shipping_phone:
                            shippingPhone,

                        shipping_address:
                            shippingAddress,

                        note:
                            orderNotes
                    }
                ])
                .select()
                .single();


        if (orderError) {
            throw orderError;
        }


        /*
         * Chuẩn bị order_items
         */

        const orderItemsData =
            shoppingCart.map(
                item => ({

                    order_id:
                        newOrder.id,

                    product_id:
                        item.id,

                    product_name:
                        item.name,

                    sku:
                        item.sku,

                    unit_price:
                        Number(
                            item.price
                        ) || 0,

                    quantity:
                        Number(
                            item.qty
                        ) || 1,

                    subtotal:
                        (
                            Number(
                                item.price
                            ) || 0
                        ) *
                        (
                            Number(
                                item.qty
                            ) || 1
                        )
                })
            );


        /*
         * INSERT ORDER ITEMS
         */

        const {
            error: itemsError
        } =
            await window.supabaseClient
                .from("order_items")
                .insert(
                    orderItemsData
                );


        if (itemsError) {
            throw itemsError;
        }


        /*
         * Xóa giỏ hàng
         */

        localStorage.removeItem(
            "mro_shopping_cart"
        );


        /*
         * Cập nhật header cart
         */

        if (
            typeof updateHeaderCartCount ===
            "function"
        ) {

            updateHeaderCartCount();
        }


        /*
         * Thành công
         */

        alert(
            `🎉 Đặt hàng thành công!\n\n` +
            `Mã đơn hàng của bạn là: ${orderCode}\n\n` +
            `Chúng tôi sẽ sớm liên hệ để xác nhận.`
        );


        /*
         * Redirect
         */

        window.location.href =
            "my-orders.html";


    } catch (error) {

        console.error(
            "Lỗi chốt đơn:",
            error
        );


        alert(
            `❌ Có lỗi xảy ra trong quá trình đặt hàng: ${error.message}`
        );


        /*
         * Khôi phục UI
         */

        if (btnSubmit) {

            setSubmitLoading(
                btnSubmit,
                false
            );
        }


        if (form) {

            form.classList.remove(
                "is-hidden"
            );
        }


        if (loadingScreen) {

            loadingScreen.classList.add(
                "is-hidden"
            );
        }
    }
}


// ========================================================
// 4. BUTTON LOADING STATE
// ========================================================

function setSubmitLoading(
    button,
    loading
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.disabled =
            true;

        button.classList.add(
            "is-disabled"
        );

        button.innerHTML = `

            <svg
                class="checkout-submit-spinner"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
            >

                <circle
                    class="checkout-submit-spinner-track"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                ></circle>

                <path
                    class="checkout-submit-spinner-head"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>

            </svg>

            <span>
                Đang xử lý...
            </span>

        `;

    } else {

        button.disabled =
            false;

        button.classList.remove(
            "is-disabled"
        );

        button.innerHTML = `

            <span>
                Xác Nhận Đặt Hàng
            </span>

            <svg
                class="checkout-submit-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                ></path>
            </svg>

        `;
    }
}


// ========================================================
// 5. STORAGE
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


// ========================================================
// 6. FORMAT MONEY
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
// 7. HELPERS
// ========================================================

function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    return element
        ? element.value.trim()
        : "";
}


function setText(
    element,
    value
) {

    if (element) {

        element.textContent =
            value ?? "";
    }
}


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
// 8. INIT
// ========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initCheckout();


        const form =
            document.getElementById(
                "checkoutForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                handleOrderSubmit
            );
        }

    }
);