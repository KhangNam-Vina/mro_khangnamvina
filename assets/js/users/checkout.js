// ========================================================
// FILE: assets/js/users/checkout.js
// XỬ LÝ THANH TOÁN ĐƠN MUA NGAY
// ĐÃ ĐỒNG BỘ SIZE SẢN PHẨM
// ========================================================

"use strict";

let currentUser = null;
let shoppingCart = [];
let checkoutTotalAmount = 0;


// ========================================================
// 1. INIT CHECKOUT
// ========================================================

async function initCheckout() {

    shoppingCart = getShoppingCart();

    if (
        shoppingCart.length === 0
    ) {

        alert(
            "Giỏ hàng của bạn đang trống! Vui lòng chọn sản phẩm trước khi thanh toán."
        );

        window.location.href =
            "products.html";

        return;
    }


    if (
        !window.supabaseClient
    ) {

        console.error(
            "Supabase chưa được khởi tạo!"
        );

        return;
    }


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


    let html = "";

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
                price * qty;


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


            /*
             * SIZE
             */
            const normalizedSize =
                item.size !== undefined &&
                item.size !== null
                    ? String(
                        item.size
                    ).trim()
                    : "";


            const sizeHTML =
                normalizedSize
                    ? `
                        <span class="checkout-item-size">
                            Size:
                            <strong>
                                ${escapeHTML(
                                    normalizedSize
                                )}
                            </strong>
                        </span>
                    `
                    : "";


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

                            ${sizeHTML}


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


    if (!currentUser) {

        alert(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        );

        window.location.href =
            "login.html";

        return;
    }


    try {

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
         * CREATE ORDER
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
         * CREATE ORDER ITEMS
         *
         * QUAN TRỌNG:
         * Lưu SIZE vào order_items.
         */
        const orderItemsData =
            shoppingCart.map(
                item => ({

                    order_id:
                        newOrder.id,


                    product_id:
                        item.id ||
                        item.product_id ||
                        null,


                    product_name:
                        item.name ||
                        item.product_name ||
                        "Sản phẩm",


                    sku:
                        item.sku ||
                        "",


                    size:
                        item.size !== undefined &&
                        item.size !== null &&
                        String(
                            item.size
                        ).trim()
                            ? String(
                                item.size
                            ).trim()
                            : null,


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
         * XÓA CART
         */
        localStorage.removeItem(
            "mro_shopping_cart"
        );


        if (
            typeof updateHeaderCartCount ===
            "function"
        ) {

            updateHeaderCartCount();
        }


        alert(
            `🎉 Đặt hàng thành công!\n\n` +
            `Mã đơn hàng của bạn là: ${orderCode}\n\n` +
            `Chúng tôi sẽ sớm liên hệ để xác nhận.`
        );


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
// 4. BUTTON LOADING
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

        button.innerHTML =
            "Đang xử lý...";

    } else {

        button.disabled =
            false;

        button.classList.remove(
            "is-disabled"
        );

        button.innerHTML =
            "Đặt hàng";
    }
}


// ========================================================
// 5. LOAD SHOPPING CART
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


        if (
            !Array.isArray(
                parsed
            )
        ) {

            return [];
        }


        /*
         * Chuẩn hóa dữ liệu cart cũ.
         */
        return parsed.map(
            item => ({

                ...item,


                id:
                    item.id ||
                    item.product_id ||
                    null,


                size:
                    item.size !== undefined &&
                    item.size !== null
                        ? String(
                            item.size
                        ).trim()
                        : null

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
// 6. HELPERS
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
// 7. INIT
// ========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

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


        initCheckout();
    }
);  