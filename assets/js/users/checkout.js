// ========================================================
// FILE: assets/js/users/checkout.js
// XỬ LÝ THANH TOÁN ĐƠN MUA NGAY
// ĐÃ ĐỒNG BỘ SIZE SẢN PHẨM
// ========================================================

"use strict";

let currentUser = null;
let shoppingCart = [];
let checkoutTotalAmount = 0;

const CHECKOUT_MIN_QTY = 1;

const CHECKOUT_MAX_QTY = 1000000;

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

    // ========================================================
    // TỰ ĐỘNG ĐIỀN THÔNG TIN GIAO HÀNG TỪ DATABASE
    // ========================================================
    try {
        // Dùng select('*') để lấy hết, tránh lỗi sai tên cột làm sập truy vấn
        const { data: profile, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (error) {
            console.error("Lỗi khi kéo data từ Supabase:", error.message);
        }

        // Trỏ tới các ô Input trên form HTML
        const nameInput = document.getElementById("shippingName");
        const phoneInput = document.getElementById("shippingPhone");
        const addressInput = document.getElementById("shippingAddress");

        // Quét nhiều trường hợp tên cột mà bro có thể đã đặt trong Database
        const profileName = profile?.full_name || profile?.name || profile?.contact_name || profile?.contact_person || "";
        const profilePhone = profile?.phone || profile?.phone_number || "";
        const profileAddress = profile?.address || profile?.shipping_address || profile?.company_address || "";

        // Tên dự phòng (phòng khi bảng profile thật sự rỗng)
        const fallbackName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || "";

        // Bơm dữ liệu vào ô Input
        if (nameInput) nameInput.value = profileName || fallbackName;
        if (phoneInput) phoneInput.value = profilePhone || currentUser.phone || "";
        if (addressInput) addressInput.value = profileAddress || "";
        
    } catch (err) {
        console.error("Lỗi tự động điền thông tin profile:", err);
    }

    // Render bảng tính tiền ở cột trái
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
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
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

    let orderItemsData = [];

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


       const now =
    new Date();


const dateStr =
    now
        .toLocaleDateString(
            "sv-SE",
            {
                timeZone:
                    "Asia/Ho_Chi_Minh"
            }
        )
        .replace(
            /-/g,
            ""
        );


const timePart =
    now
        .toLocaleTimeString(
            "en-GB",
            {
                timeZone:
                    "Asia/Ho_Chi_Minh",
                hour12:
                    false
            }
        )
        .slice(
            0,
            8
        )
        .replace(
            /:/g,
            ""
        );

        const randomPart =
            Math.random()
                .toString(36)
                .substring(
                    2,
                    8
                )
                .toUpperCase();

        const orderCode =
            `ORD-${dateStr}-${timePart}-${randomPart}`;

        /*
        * CREATE ORDER + ORDER ITEMS
        * ATOMIC TRANSACTION VIA RPC
        */

        orderItemsData =
            shoppingCart.map(
                item => ({

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

                    quantity:
                        Number(
                            item.qty
                        )
                                    })
                                );

        const {
            data: newOrderId,
            error: orderError
        } =
            await window.supabaseClient
                .rpc(
                    "create_order_transaction",
                    {
                        p_user_id:
                            currentUser.id,

                        p_order_code:
                            orderCode,

                        p_subtotal:
                            checkoutTotalAmount,

                        p_shipping_fee:
                            0,

                        p_total:
                            checkoutTotalAmount,

                        p_shipping_name:
                            shippingName,

                        p_shipping_phone:
                            shippingPhone,

                        p_shipping_address:
                            shippingAddress,

                        p_note:
                            orderNotes,

                        p_items:
                            orderItemsData
                    }
                );


        if (orderError) {
            throw orderError;
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


        const errorMessage =
    error?.message || "";

const stockMatch =
    errorMessage.match(
        /Insufficient stock for product ([a-f0-9-]{36})/i
    );


if (stockMatch) {

    const productId =
        stockMatch[1];

    const product =
        orderItemsData.find(
            item =>
                item.product_id ===
                productId
        );

    const productName =
        product?.product_name ||
        "Sản phẩm";

    alert(
        `Sản phẩm "${productName}" không đủ số lượng trong kho.\n\n` +
        `Vui lòng giảm số lượng và thử lại.`
    );

} else if (
    errorMessage.includes(
        "Price changed"
    )
) {

    alert(
        "Giá sản phẩm đã thay đổi.\n\n" +
        "Vui lòng tải lại giỏ hàng và kiểm tra lại giá trước khi đặt hàng."
    );

} else {

    alert(
        "Không thể đặt hàng lúc này.\n\n" +
        "Vui lòng thử lại sau."
    );
}


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