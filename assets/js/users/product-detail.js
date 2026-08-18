// ========================================================
// FILE: assets/js/users/product-detail.js
// XỬ LÝ LOGIC TRANG CHI TIẾT SẢN PHẨM & RFQ
// ĐÃ FIX LỖI XUNG ĐỘT BIẾN (SYNTAX ERROR)
// ========================================================

let currentMOQ = 1;
let currentStock = 0;


/* ========================================================
   HELPER (ĐÃ ĐỔI TÊN ĐỂ TRÁNH TRÙNG LẶP VỚI CART.JS)
======================================================== */

const pdEscapeHTML = (value) => {
    if (typeof utils !== "undefined" && typeof utils.escapeHTML === "function") {
        return utils.escapeHTML(value ?? "");
    }

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};


const pdCleanUrl = (url) => {
    if (!url) return "";

    return url
        .replace(/['"\[\]\n\r]/g, "")
        .trim();
};


const pdFormatCurrency = (value) => {
    if (!value || Number(value) <= 0) {
        return "Liên hệ";
    }

    return new Intl.NumberFormat("vi-VN").format(value) + " đ";
};


/* ========================================================
   1. LOAD PRODUCT DETAIL
======================================================== */

async function loadProductDetail() {

    const urlParams = new URLSearchParams(
        window.location.search
    );

    const productId = urlParams.get("id");

    const mainContent =
        document.getElementById("mainContent");

    const loadingScreen =
        document.getElementById("loadingScreen");

    const errorScreen =
        document.getElementById("errorScreen");

    const errorText =
        document.getElementById("errorText");

    const previousPage =
        document.referrer.toLowerCase();

    const bcParentPage =
        document.getElementById("bcParentPage");

    const bcCurrentProduct =
        document.getElementById("bcCurrentProduct");


    /* -----------------------------------------------------
       INVALID URL
    ----------------------------------------------------- */

    if (!productId) {

        loadingScreen?.classList.add("is-hidden");
        errorScreen?.classList.remove("is-hidden");

        if (errorText) {
            errorText.innerText =
                "Đường dẫn không hợp lệ. Thiếu mã ID sản phẩm.";
        }

        return;
    }


    try {

        /* -------------------------------------------------
           FETCH PRODUCT
        ------------------------------------------------- */

        const {
            data: item,
            error
        } = await window.supabaseClient
            .from("products")
            .select(`
                *,
                categories(id, name),
                sub_categories(id, name),
                brands(id, name)
            `)
            .eq("id", productId)
            .single();


        if (error) {
            throw error;
        }

        if (!item) {
            throw new Error("Sản phẩm không tồn tại");
        }


        /* -------------------------------------------------
           SAVE CURRENT PRODUCT
        ------------------------------------------------- */

        window.currentProductData = item;

        currentMOQ =
            Number(item.min_order_quantity) || 1;

        currentStock =
            Number(item.stock_quantity) || 0;


        /* -------------------------------------------------
           BASIC DATA
        ------------------------------------------------- */

        const brandName =
            item.brands?.name || "OEM";

        const priceFormat =
            pdFormatCurrency(item.price);


        document.title =
            `${item.name} - MRO Khang Nam`;


        /* -------------------------------------------------
           BREADCRUMB
        ------------------------------------------------- */

        if (bcParentPage) {

            if (
                previousPage.includes(
                    "promotions.html"
                )
            ) {

                bcParentPage.href =
                    "promotions.html";

                bcParentPage.innerText =
                    "Giảm giá";

            } else {

                bcParentPage.href =
                    "products.html";

                bcParentPage.innerText =
                    "Sản phẩm";
            }
        }


        if (bcCurrentProduct) {

            bcCurrentProduct.innerText =
                item.name;

            bcCurrentProduct.classList.remove(
                "is-loading"
            );
        }


        /* -------------------------------------------------
           PRODUCT BASIC INFO
        ------------------------------------------------- */

        const brandLabel =
            document.getElementById("brandLabel");

        if (brandLabel) {
            brandLabel.innerText =
                brandName;
        }


        const productName =
            document.getElementById("productName");

        if (productName) {
            productName.innerText =
                item.name;
        }


        const shortDescription =
            document.getElementById("shortDescription");

        if (shortDescription) {

            shortDescription.innerText =
                item.short_description ||
                "Sản phẩm vật tư chuyên dụng chính hãng. Vui lòng xem thông số chi tiết bên dưới.";
        }


        const detailSku =
            document.getElementById("detailSku");

        if (detailSku) {
            detailSku.innerText =
                item.sku || "";
        }


        const detailBrand =
            document.getElementById("detailBrand");

        if (detailBrand) {
            detailBrand.innerText =
                brandName;
        }


        const detailUnit =
            document.getElementById("detailUnit");

        if (detailUnit) {
            detailUnit.innerText =
                item.unit || "Cái";
        }


        const detailOrigin =
            document.getElementById("detailOrigin");

        if (detailOrigin) {
            detailOrigin.innerText =
                item.origin || "Đang cập nhật";
        }


       /* -------------------------------------------------
           PRICE (ĐÃ FIX: ƯU TIÊN GIÁ KHUYẾN MÃI)
        ------------------------------------------------- */
        const detailPrice = document.getElementById("detailPrice");

        if (detailPrice) {
            // Nếu có giá giảm và giá giảm nhỏ hơn giá gốc
            if (item.discount_price && Number(item.discount_price) > 0 && Number(item.discount_price) < Number(item.price)) {
                const oldPrice = pdFormatCurrency(item.price);
                const newPrice = pdFormatCurrency(item.discount_price);
                
                // Hiển thị giá cũ bị gạch chéo ở trên, giá mới màu cam chà bá ở dưới
                detailPrice.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: flex-start;">
                        <span style="font-size: 14px; color: #9ca3af; text-decoration: line-through; font-weight: 600; line-height: 1;">${oldPrice}</span>
                        <span>${newPrice}</span>
                    </div>
                `;
            } else {
                // Nếu không có giảm giá thì hiện giá gốc bình thường
                detailPrice.innerHTML = priceFormat;
            }
        }


        /* -------------------------------------------------
           ORIGIN BADGE
        ------------------------------------------------- */

        const badgeOrigin =
            document.getElementById("badgeOrigin");

        if (
            badgeOrigin &&
            item.origin &&
            item.origin.toUpperCase() === "JAPAN"
        ) {

            badgeOrigin.classList.remove(
                "is-hidden"
            );
        }


        /* -------------------------------------------------
           STATUS BADGE
        ------------------------------------------------- */

        if (
            item.badge &&
            item.badge.trim() !== ""
        ) {

            const badgeEl =
                document.getElementById("badgeStatus");

            if (badgeEl) {

                const badgeVal =
                    item.badge
                        .trim()
                        .toUpperCase();

                let badgeClass =
                    "badge-default";


                if (badgeVal === "NEW") {
                    badgeClass = "badge-new";
                } else if (badgeVal === "HOT") {
                    badgeClass = "badge-hot";
                } else if (badgeVal === "SALE") {
                    badgeClass = "badge-sale";
                } else if (
                    badgeVal === "BEST SELLER"
                ) {
                    badgeClass = "badge-best";
                } else if (
                    badgeVal === "CLEARANCE"
                ) {
                    badgeClass = "badge-clearance";
                }


                badgeEl.className =
                    `product-badge ${badgeClass}`;

                badgeEl.innerText =
                    badgeVal;

                badgeEl.classList.remove(
                    "is-hidden"
                );
            }
        }


        /* -------------------------------------------------
           STOCK
        ------------------------------------------------- */

        const stockEl =
            document.getElementById(
                "detailStock"
            );


        if (stockEl) {

            if (currentStock > 0) {

                stockEl.className =
                    "product-stock-value stock-ready";

                stockEl.innerHTML = `
                    <svg
                        width="16"
                        height="16"
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
                    Tình trạng: Sẵn sàng giao hàng
                `;

            } else {

                stockEl.className =
                    "product-stock-value stock-preorder";

                stockEl.innerHTML = `
                    <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                    </svg>
                    Tình trạng: Pre-order (Liên hệ)
                `;
            }
        }


        /* -------------------------------------------------
           MOQ
        ------------------------------------------------- */

        const qtyInput =
            document.getElementById("buyQty");

        if (qtyInput) {

            qtyInput.min =
                currentMOQ;

            qtyInput.value =
                currentMOQ;
        }


        if (currentMOQ > 1) {

            const moqNote =
                document.getElementById("moqNote");

            const moqVal =
                document.getElementById("moqVal");


            if (moqVal) {

                moqVal.innerText =
                    `${currentMOQ} ${item.unit || "Cái"}`;
            }


            if (moqNote) {

                moqNote.classList.remove(
                    "is-hidden"
                );
            }
        }


        /* -------------------------------------------------
           IMAGE GALLERY
        ------------------------------------------------- */

        let allValidImages = [];

        const safeMainImg =
            pdCleanUrl(item.image_url);


        if (safeMainImg) {
            allValidImages.push(
                safeMainImg
            );
        }


        if (item.images) {

            let rawExtraImgs = [];


            if (Array.isArray(item.images)) {

                rawExtraImgs =
                    item.images;

            } else if (
                typeof item.images === "string"
            ) {

                rawExtraImgs =
                    item.images.split(
                        /[\n,]+/
                    );
            }


            rawExtraImgs.forEach(
                (rawUrl) => {

                    const safeUrl =
                        pdCleanUrl(rawUrl);


                    if (
                        safeUrl &&
                        safeUrl !== safeMainImg &&
                        !allValidImages.includes(
                            safeUrl
                        )
                    ) {

                        allValidImages.push(
                            safeUrl
                        );
                    }
                }
            );
        }


        const domMainImg =
            document.getElementById(
                "mainImage"
            );

        const domThumbList =
            document.getElementById(
                "thumbnailList"
            );


        if (
            allValidImages.length > 0
        ) {

            if (domMainImg) {

                domMainImg.src =
                    allValidImages[0];

                domMainImg.onerror =
                    function () {

                        this.onerror = null;

                        this.src =
                            "../assets/images/world mark.png";
                    };
            }


            if (domThumbList) {

                domThumbList.innerHTML =
                    "";


                allValidImages.forEach(
                    (url, index) => {

                        const activeClass =
                            index === 0
                                ? "is-active"
                                : "";


                        domThumbList.innerHTML += `
                            <div
                                class="thumbnail-item ${activeClass}"
                                onclick="changeMainImage('${pdEscapeHTML(url)}', this)"
                            >
                                <img
                                    src="${pdEscapeHTML(url)}"
                                    alt="Ảnh sản phẩm"
                                >
                            </div>
                        `;
                    }
                );
            }

        } else {

            if (domMainImg) {

                domMainImg.src =
                    "../assets/images/world mark.png";
            }

            if (domThumbList) {

                domThumbList.innerHTML =
                    "";
            }
        }


        /* -------------------------------------------------
           DESCRIPTION
        ------------------------------------------------- */

        const descText =
            item.description ||
            "Đang cập nhật mô tả chi tiết.";


        const tabDescContent =
            document.getElementById(
                "tabDescContent"
            );


        if (tabDescContent) {

            tabDescContent.innerHTML =
                descText;
        }


        /* -------------------------------------------------
           TECHNICAL DETAILS
        ------------------------------------------------- */

        const techDetails =
            document.getElementById(
                "techDetails"
            );


        if (techDetails) {

            techDetails.innerHTML =
                item.specifications ||
                "Chưa có dữ liệu.";
        }


        /* -------------------------------------------------
           DATASHEET
        ------------------------------------------------- */

        const tabDocsContent =
            document.getElementById(
                "tabDocsContent"
            );


        if (tabDocsContent) {

            if (item.datasheet_url) {

                tabDocsContent.innerHTML = `
                    <div class="product-document-card">

                        <div class="product-document-info">

                            <div class="product-document-icon">
                                <svg
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    ></path>
                                </svg>
                            </div>

                            <div class="product-document-text">

                                <div class="product-document-title">
                                    Tài liệu kỹ thuật
                                </div>

                                <div class="product-document-type">
                                    PDF Document
                                </div>

                            </div>

                        </div>

                        <a
                            href="${pdEscapeHTML(item.datasheet_url)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="product-document-button"
                        >
                            Tải về
                        </a>

                    </div>
                `;

            } else {

                tabDocsContent.innerHTML = `
                    <p class="product-docs-empty">
                        Chưa có tài liệu tải về bổ sung cho sản phẩm này.
                    </p>
                `;
            }
        }


        /* -------------------------------------------------
           SALES MODE + BUTTONS
        ------------------------------------------------- */

        const salesMode =
            item.sales_mode || "BOTH";

        const actionContainer =
            document.getElementById(
                "productActionButtons"
            );


        let actionHtml = "";


        if (
            salesMode === "BOTH" ||
            salesMode === "RFQ"
        ) {

            actionHtml += `
                <button
                    type="button"
                    onclick="addToRFQCart()"
                    class="product-action-button action-rfq"
                >
                    <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        ></path>
                    </svg>

                    Thêm Yêu Cầu Báo Giá
                </button>
            `;
        }


        if (
            (
                salesMode === "BOTH" ||
                salesMode === "BUY"
            ) &&
            Number(item.price) > 0
        ) {

            actionHtml += `
                <button
                    type="button"
                    onclick="addToShoppingCart()"
                    class="product-action-button action-buy"
                >
                    <span aria-hidden="true">🛒</span>
                    Mua Ngay
                </button>
            `;
        }


        if (actionContainer) {

            actionContainer.innerHTML =
                actionHtml;
        }


        /* -------------------------------------------------
           SHOW MAIN
        ------------------------------------------------- */

        loadingScreen?.classList.add(
            "is-hidden"
        );

        mainContent?.classList.remove(
            "is-hidden"
        );


        /* -------------------------------------------------
           LOAD RELATED + SALE
        ------------------------------------------------- */

        await Promise.all([
            loadRelatedProducts(item),
            loadSaleProductsSidebar(item.id)
        ]);

    } catch (err) {

        console.error(
            "Lỗi tải chi tiết:",
            err
        );

        loadingScreen?.classList.add(
            "is-hidden"
        );

        errorScreen?.classList.remove(
            "is-hidden"
        );

        if (errorText) {
            errorText.innerText =
                err.message ||
                "Không thể tải dữ liệu sản phẩm.";
        }
    }
}


/* ========================================================
   2. CHANGE MAIN IMAGE
======================================================== */

function changeMainImage(
    src,
    element
) {

    const mainImage =
        document.getElementById(
            "mainImage"
        );


    if (mainImage) {

        mainImage.src =
            src;
    }


    document
        .querySelectorAll(
            ".thumbnail-item"
        )
        .forEach(
            (el) => {

                el.classList.remove(
                    "is-active"
                );
            }
        );


    if (element) {

        element.classList.add(
            "is-active"
        );
    }
}


/* ========================================================
   3. SWITCH TAB
======================================================== */

function switchTab(
    tabName
) {

    const tabs = [
        "desc",
        "tech",
        "docs"
    ];


    tabs.forEach(
        (tab) => {

            const suffix =
                tab.charAt(0)
                    .toUpperCase() +
                tab.slice(1);


            const btn =
                document.getElementById(
                    `tab${suffix}Btn`
                );

            const content =
                document.getElementById(
                    `tab${suffix}Content`
                );


            if (!btn || !content) {
                return;
            }


            if (tab === tabName) {

                btn.classList.add(
                    "is-active"
                );

                content.classList.remove(
                    "is-hidden"
                );

            } else {

                btn.classList.remove(
                    "is-active"
                );

                content.classList.add(
                    "is-hidden"
                );
            }
        }
    );
}


/* ========================================================
   4. CHANGE QUANTITY
======================================================== */

function changeQty(step) {

    const qtyInput =
        document.getElementById(
            "buyQty"
        );


    if (!qtyInput) {
        return;
    }


    const currentVal =
        parseInt(
            qtyInput.value
        ) || currentMOQ;


    let newVal =
        currentVal + step;


    if (
        newVal <
        currentMOQ
    ) {

        newVal =
            currentMOQ;
    }


    qtyInput.value =
        newVal;
}


/* ========================================================
   5. ADD TO RFQ CART
======================================================== */

function addToRFQCart() {

    const qtyInput =
        document.getElementById(
            "buyQty"
        );


    if (!qtyInput) {
        return;
    }


    const qtyToAdd =
        parseInt(
            qtyInput.value
        ) || 0;


    if (
        qtyToAdd <
        currentMOQ
    ) {

        alert(
            `❌ Sản phẩm này yêu cầu số lượng đặt mua tối thiểu (MOQ) là: ${currentMOQ}.\n\nVui lòng nhập số lượng hợp lệ để tiếp tục!`
        );

        qtyInput.value =
            currentMOQ;

        return;
    }


    let cart =
        JSON.parse(
            localStorage.getItem(
                "mro_rfq_cart"
            )
        ) || [];


    const currentItem = {

        sku:
            document.getElementById(
                "detailSku"
            )?.innerText || "",

        name:
            document.getElementById(
                "productName"
            )?.innerText || "",

        brand:
            document.getElementById(
                "detailBrand"
            )?.innerText || "",

        unit:
            document.getElementById(
                "detailUnit"
            )?.innerText || "",

        qty:
            qtyToAdd
    };


    const existingItem =
        cart.find(
            item =>
                item.sku ===
                currentItem.sku
        );


    if (existingItem) {

        existingItem.qty +=
            qtyToAdd;

    } else {

        cart.push(
            currentItem
        );
    }


    localStorage.setItem(
        "mro_rfq_cart",
        JSON.stringify(cart)
    );


    window.location.href =
        "rfq.html";
}


/* ========================================================
   6. RELATED PRODUCTS
======================================================== */

async function loadRelatedProducts(
    currentItem
) {

    const grid =
        document.getElementById(
            "relatedProductsGrid"
        );

    const introText =
        document.getElementById(
            "relatedIntro"
        );

    const viewAllBtn =
        document.getElementById(
            "viewAllRelated"
        );


    if (!grid) {
        return;
    }


    if (
        currentItem.sub_category_id &&
        viewAllBtn
    ) {

        viewAllBtn.href =
            `products.html?sub_category_id=${currentItem.sub_category_id}`;
    }


    let queryColumn =
        null;

    let queryValue =
        null;


    if (currentItem.family_id) {

        queryColumn =
            "family_id";

        queryValue =
            currentItem.family_id;


        if (
            currentItem.brands &&
            introText
        ) {

            introText.innerText =
                `Các sản phẩm cùng thương hiệu ${currentItem.brands.name} bạn có thể quan tâm.`;
        }

    } else if (
        currentItem.sub_category_id
    ) {

        queryColumn =
            "sub_category_id";

        queryValue =
            currentItem.sub_category_id;


        if (
            currentItem.sub_categories &&
            introText
        ) {

            introText.innerText =
                `Các thiết bị thuộc nhóm ${currentItem.sub_categories.name} bạn có thể quan tâm.`;
        }
    }


    if (!queryValue) {

        grid.innerHTML = `
            <p class="related-product-message">
                Không có sản phẩm cùng dòng.
            </p>
        `;

        introText?.classList.add(
            "is-hidden"
        );

        return;
    }


    try {

        const {
            data,
            error
        } = await window.supabaseClient
            .from("products")
            .select(`
                *,
                brands(name)
            `)
            .eq(
                queryColumn,
                queryValue
            )
            .neq(
                "id",
                currentItem.id
            )
            .limit(4);


        if (error) {
            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {

            grid.innerHTML = `
                <p class="related-product-message">
                    Chưa có sản phẩm liên quan.
                </p>
            `;

            introText?.classList.add(
                "is-hidden"
            );

            return;
        }


        grid.innerHTML =
            "";


        data.forEach(
            (item) => {

                const brandName =
                    item.brands?.name ||
                    "OEM";


                const img =
                    item.image_url ||
                    "../assets/images/world mark.png";


                grid.innerHTML += `

                    <div class="related-product-card">

                        <a
                            href="product-detail.html?id=${item.id}"
                            class="related-product-image-link"
                        >
                            <img
                                src="${pdEscapeHTML(img)}"
                                alt="${pdEscapeHTML(item.name || "")}"
                                class="related-product-image"
                            >
                        </a>


                        <div class="related-product-body">

                            <div class="related-product-brand">
                                ${pdEscapeHTML(brandName)}
                            </div>


                            <a
                                href="product-detail.html?id=${item.id}"
                            >
                                <h4 class="related-product-name">
                                    ${pdEscapeHTML(item.name || "")}
                                </h4>
                            </a>


                            <div class="related-product-footer">

                                <div class="related-product-sku">
                                    SKU: ${pdEscapeHTML(item.sku || "")}
                                </div>

                                <div class="related-product-stock">
                                    IN STOCK
                                </div>

                            </div>

                        </div>

                    </div>

                `;
            }
        );

    } catch (err) {

        console.error(
            "Related Products:",
            err
        );

        grid.innerHTML = `
            <p class="related-product-error">
                Lỗi tải dữ liệu sản phẩm cùng dòng.
            </p>
        `;
    }
}


/* ========================================================
   7. SALE PRODUCTS SIDEBAR
======================================================== */

async function loadSaleProductsSidebar(
    currentProductId
) {

    const container =
        document.getElementById(
            "saleProductsSidebar"
        );


    if (!container) {
        return;
    }


    try {

        const {
            data,
            error
        } = await window.supabaseClient
            .from("products")
            .select(`
                *,
                brands(name)
            `)
            .gt(
                "discount_price",
                0
            )
            .neq(
                "id",
                currentProductId
            )
            .limit(20);


        if (error) {
            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {

            container.innerHTML = `
                <p class="product-sale-empty">
                    Hiện tại đang không có chương trình khuyến mãi.
                </p>
            `;

            return;
        }


        const shuffledData =
            data.sort(
                () =>
                    0.5 -
                    Math.random()
            );


        const randomPicks =
            shuffledData.slice(
                0,
                4
            );


        let html =
            "";


        randomPicks.forEach(
            (item) => {

                const brandName =
                    item.brands?.name ||
                    "OEM";


                const img =
                    item.image_url ||
                    "../assets/images/world mark.png";


                const originalPrice =
                    item.price
                        ? pdFormatCurrency(
                            item.price
                        )
                        : "";


                const discountPrice =
                    item.discount_price
                        ? pdFormatCurrency(
                            item.discount_price
                        )
                        : "Liên hệ";


                html += `

                    <a
                        href="product-detail.html?id=${item.id}"
                        class="product-sale-item"
                    >

                        <div class="product-sale-image">

                            <img
                                src="${pdEscapeHTML(img)}"
                                alt="${pdEscapeHTML(item.name || "")}"
                            >

                        </div>


                        <div class="product-sale-info">

                            <div class="product-sale-brand">
                                ${pdEscapeHTML(brandName)}
                            </div>


                            <h4 class="product-sale-name">
                                ${pdEscapeHTML(item.name || "")}
                            </h4>


                            <div class="product-sale-prices">

                                <span class="product-sale-old-price">
                                    ${originalPrice}
                                </span>

                                <span class="product-sale-new-price">
                                    ${discountPrice}
                                </span>

                            </div>

                        </div>

                    </a>

                `;
            }
        );


        container.innerHTML =
            html;

    } catch (err) {

        console.error(
            "Sale Sidebar Products:",
            err
        );

        container.innerHTML = `
            <p class="product-sale-empty">
                Lỗi tải dữ liệu.
            </p>
        `;
    }
}


/* ========================================================
   8. RFQ LOCAL STORAGE
======================================================== */

function loadCartFromStorage() {

    const cartList =
        document.getElementById(
            "cartList"
        );


    if (!cartList) {
        return;
    }


    const cartItems =
        JSON.parse(
            localStorage.getItem(
                "mro_rfq_cart"
            )
        ) || [];


    if (
        cartItems.length === 0
    ) {

        cartList.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="rfq-cart-empty"
                >
                    Giỏ yêu cầu của bạn đang trống.
                </td>
            </tr>
        `;

        return;
    }


    cartList.innerHTML =
        "";


    cartItems.forEach(
        (item) => {

            cartList.innerHTML += `

                <tr class="rfq-cart-row">

                    <td class="rfq-cart-sku">
                        ${pdEscapeHTML(item.sku)}
                    </td>

                    <td class="rfq-cart-name">
                        ${pdEscapeHTML(item.name)}
                    </td>

                    <td class="rfq-cart-brand">
                        ${pdEscapeHTML(item.brand)}
                    </td>

                    <td class="rfq-cart-qty-cell">

                        <div class="rfq-cart-qty">

                            <button
                                type="button"
                                onclick="updateQty('${pdEscapeHTML(item.sku)}', -1)"
                            >
                                -
                            </button>

                            <input
                                type="number"
                                value="${item.qty}"
                                readonly
                            >

                            <button
                                type="button"
                                onclick="updateQty('${pdEscapeHTML(item.sku)}', 1)"
                            >
                                +
                            </button>

                        </div>

                    </td>

                    <td class="rfq-cart-remove-cell">

                        <button
                            type="button"
                            onclick="removeItem('${pdEscapeHTML(item.sku)}')"
                            class="rfq-cart-remove"
                        >
                            Xóa
                        </button>

                    </td>

                </tr>

            `;
        }
    );
}


/* ========================================================
   9. UPDATE RFQ QUANTITY
======================================================== */

function updateQty(
    sku,
    change
) {

    let cartItems =
        JSON.parse(
            localStorage.getItem(
                "mro_rfq_cart"
            )
        ) || [];


    const item =
        cartItems.find(
            i =>
                i.sku === sku
        );


    if (item) {

        item.qty +=
            change;


        if (item.qty < 1) {
            item.qty = 1;
        }


        localStorage.setItem(
            "mro_rfq_cart",
            JSON.stringify(
                cartItems
            )
        );


        loadCartFromStorage();
    }
}


/* ========================================================
   10. REMOVE RFQ ITEM
======================================================== */

function removeItem(
    sku
) {

    let cartItems =
        JSON.parse(
            localStorage.getItem(
                "mro_rfq_cart"
            )
        ) || [];


    cartItems =
        cartItems.filter(
            i =>
                i.sku !== sku
        );


    localStorage.setItem(
        "mro_rfq_cart",
        JSON.stringify(
            cartItems
        )
    );


    loadCartFromStorage();
}


/* ========================================================
   11. SHARE
======================================================== */

function shareProduct() {

    const productUrl =
        window.location.href;

    const productTitle =
        document.getElementById(
            "productName"
        )?.innerText ||
        document.title;


    if (
        navigator.share
    ) {

        navigator.share({

            title:
                productTitle,

            text:
                "Tham khảo vật tư này trên MRO Khang Nam:",

            url:
                productUrl

        })
        .catch(
            (err) =>
                console.error(
                    "Lỗi chia sẻ:",
                    err
                )
        );

    } else {

        navigator.clipboard
            .writeText(
                productUrl
            )
            .then(
                () => {

                    alert(
                        "✅ Đã copy link sản phẩm! Bạn có thể dán (Ctrl+V) để chia sẻ."
                    );
                }
            )
            .catch(
                (err) => {

                    console.error(
                        "Không thể copy link:",
                        err
                    );
                }
            );
    }
}


/* ========================================================
   12. PRINT
======================================================== */

function printProduct() {
    window.print();
}


/* ========================================================
   HIỆU ỨNG ZOOM KÍNH LÚP ẢNH SẢN PHẨM (MAGNIFIER)
======================================================== */
function initMagnifierZoom() {
    const wrapper = document.querySelector('.product-main-image-wrapper');
    const img = document.getElementById('mainImage');

    if (!wrapper || !img) return;

    // Khi chuột di chuyển bên trong khung ảnh
    wrapper.addEventListener('mousemove', function(e) {
        const rect = wrapper.getBoundingClientRect();
        
        // Tính toán tọa độ chuột theo phần trăm (0% -> 100%)
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Tắt transition khi đang di chuột để ảnh chạy theo mượt mà, không bị giật lag
        img.style.transition = 'none';
        
        // Đặt tâm phóng to vào đúng tọa độ con chuột
        img.style.transformOrigin = `${x}% ${y}%`;
        
        // Phóng to gấp 2.2 lần (Bro có thể chỉnh số này to nhỏ tùy ý)
        img.style.transform = 'scale(2.2)'; 
    });

    // Khi chuột rời khỏi khung ảnh
    wrapper.addEventListener('mouseleave', function() {
        // Bật lại hiệu ứng mượt (transition) để thu nhỏ từ từ
        img.style.transition = 'transform 0.4s ease';
        img.style.transformOrigin = 'center center';
        img.style.transform = 'scale(1)'; // Trả về nguyên trạng
    });

    // Lúc mới đưa chuột vào cũng cho phóng to từ từ cho mượt
    wrapper.addEventListener('mouseenter', function() {
        img.style.transition = 'transform 0.4s ease';
    });
}

/* ========================================================
   KHỞI TẠO TRANG (INIT)
======================================================== */
window.addEventListener(
    "load",
    async () => {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.get("id")) {
            await loadProductDetail();
        }

        if (
            document.getElementById(
                "cartList"
            )
        ) {
            loadCartFromStorage();
        }

        // KÍCH HOẠT HIỆU ỨNG ZOOM KÍNH LÚP TẠI ĐÂY
        initMagnifierZoom();

        /* -----------------------------------------------
           XÁC THỰC "TRÙM CUỐI" ĐỒNG BỘ CSS TĨNH
        ------------------------------------------------ */
        try {
            let isUserLoggedIn = false;
            if (typeof checkCustomerAuth === 'function') {
                isUserLoggedIn = !!(await checkCustomerAuth());
            } else if (typeof window.checkCustomerAuth === 'function') {
                isUserLoggedIn = !!(await window.checkCustomerAuth());
            } else if (typeof Auth !== 'undefined' && typeof Auth.getCurrentUser === 'function') {
                isUserLoggedIn = !!(await Auth.getCurrentUser());
            } else if (window.supabaseClient) {
                const { data } = await window.supabaseClient.auth.getSession();
                isUserLoggedIn = !!data?.session;
            }

            if (isUserLoggedIn) {
                const guestBtn = document.getElementById("btnGuestLogin");
                if (guestBtn) guestBtn.classList.add("d-none");
                
                const userProfileBtn = document.getElementById("btnUserProfile");
                if (userProfileBtn) {
                    userProfileBtn.classList.remove("d-none", "hidden", "is-hidden");
                }
            }
        } catch (err) {
            console.error("Lỗi xác thực:", err);
        }
    }
);

