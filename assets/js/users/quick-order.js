// ========================================================
// FILE: assets/js/users/quick-order.js
// QUICK ORDER - LOGIC
// CSS ĐÃ TÁCH KHỎI JS
// ========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const btnProcess =
            document.getElementById(
                "btnProcessQuickOrder"
            );

        const fileInput =
            document.getElementById(
                "quickOrderFile"
            );

        const textInput =
            document.getElementById(
                "quickOrderText"
            );

        const logArea =
            document.getElementById(
                "quickOrderLog"
            );

        const dropzoneText =
            document.getElementById(
                "dropzoneText"
            );


        if (!btnProcess) {
            return;
        }

        updateQuickOrderRfqCount(); 


        /* =================================================
           1. FILE INPUT
        ================================================== */

        if (fileInput) {

            fileInput.addEventListener(
                "change",
                (event) => {

                    const selectedFile =
                        event.target.files?.[0];


                    if (!selectedFile) {
                        return;
                    }


                    if (textInput) {
                        textInput.value =
                            "";
                    }


                    if (dropzoneText) {

                        dropzoneText.innerHTML = `

                            <span class="quick-order-file-selected">
                                📄 Đã tải file:
                                ${escapeQuickOrderHTML(
                                    selectedFile.name
                                )}
                            </span>

                        `;
                    }
                }
            );
        }


        /* =================================================
           2. TEXT INPUT
        ================================================== */

        if (textInput) {

            textInput.addEventListener(
                "input",
                () => {

                    if (
                        !textInput.value
                    ) {
                        return;
                    }


                    if (fileInput) {
                        fileInput.value =
                            "";
                    }


                    if (dropzoneText) {

                        dropzoneText.textContent =
                            "Kéo thả file vào đây";
                    }
                }
            );
        }


        /* =================================================
           3. PROCESS
        ================================================== */

        btnProcess.addEventListener(
            "click",
            async () => {

                if (
                    !window.supabaseClient
                ) {

                    alert(
                        "Lỗi kết nối hệ thống. Vui lòng thử lại sau!"
                    );

                    return;
                }


                let requestedItems =
                    [];

                const textData =
                    textInput?.value
                        .trim() || "";


                const originalBtnText =
                    btnProcess.innerHTML;


                setProcessButtonLoading(
                    btnProcess,
                    true
                );


                if (logArea) {

                    const emptyState =
                        document.getElementById(
                            "emptyLogState"
                        );

                    if (emptyState) {
                        emptyState.classList.add(
                            "is-hidden"
                        );
                    }

                    logArea.innerHTML =
                        "";
                }


                try {

                    /* -------------------------------------
                       TEXT MODE
                    ------------------------------------- */

                    if (textData) {

                        const lines =
                            textData.split(
                                /\r?\n/
                            );


                        lines.forEach(
                            (line) => {

                                const queryStr =
                                    line.trim();


                                if (
                                    queryStr
                                ) {

                                    requestedItems.push(
                                        {
                                            keyword:
                                                queryStr,

                                            quantity:
                                                1
                                        }
                                    );
                                }
                            }
                        );


                        await smartSearchAndRenderTable(
                            requestedItems,
                            logArea
                        );


                        resetButton(
                            btnProcess,
                            originalBtnText
                        );


                        return;
                    }


                    /* -------------------------------------
                       FILE MODE
                    ------------------------------------- */

                    if (
                        fileInput &&
                        fileInput.files.length > 0
                    ) {

                        const file =
                            fileInput.files[0];


                        const reader =
                            new FileReader();


                        reader.onload =
                            async function (
                                event
                            ) {

                                try {

                                    const data =
                                        new Uint8Array(
                                            event.target.result
                                        );


                                    const workbook =
                                        XLSX.read(
                                            data,
                                            {
                                                type:
                                                    "array"
                                            }
                                        );


                                    const firstSheetName =
                                        workbook
                                            .SheetNames[0];


                                    const worksheet =
                                        workbook
                                            .Sheets[
                                                firstSheetName
                                            ];


                                    const json =
                                        XLSX.utils.sheet_to_json(
                                            worksheet,
                                            {
                                                header:
                                                    [
                                                        "keyword",
                                                        "quantity"
                                                    ]
                                            }
                                        );


                                    json.forEach(
                                        (
                                            row,
                                            index
                                        ) => {

                                            const valStr =
                                                String(
                                                    row.keyword ??
                                                    ""
                                                ).trim();


                                            if (
                                                index ===
                                                    0 &&
                                                (
                                                    valStr
                                                        .toLowerCase()
                                                        .includes(
                                                            "sku"
                                                        ) ||
                                                    valStr
                                                        .toLowerCase()
                                                        .includes(
                                                            "mã"
                                                        )
                                                )
                                            ) {

                                                return;
                                            }


                                            if (
                                                valStr &&
                                                valStr !==
                                                    "undefined"
                                            ) {

                                                requestedItems.push(
                                                    {
                                                        keyword:
                                                            valStr,

                                                        quantity:
                                                            Number(
                                                                row.quantity
                                                            ) || 1
                                                    }
                                                );
                                            }
                                        }
                                    );


                                    await smartSearchAndRenderTable(
                                        requestedItems,
                                        logArea
                                    );


                                } catch (
                                    readError
                                ) {

                                    console.error(
                                        "Lỗi đọc Excel:",
                                        readError
                                    );


                                    alert(
                                        "File không đúng định dạng. Vui lòng kiểm tra lại file Excel/CSV!"
                                    );


                                    resetButton(
                                        btnProcess,
                                        originalBtnText
                                    );
                                }
                            };


                        reader.readAsArrayBuffer(
                            file
                        );


                        return;
                    }


                    /* -------------------------------------
                       NO DATA
                    ------------------------------------- */

                    alert(
                        "Vui lòng tải file Excel lên hoặc dán mã sản phẩm vào hộp thoại!"
                    );


                    resetButton(
                        btnProcess,
                        originalBtnText
                    );


                } catch (
                    error
                ) {

                    console.error(
                        "Lỗi hệ thống:",
                        error
                    );


                    alert(
                        "Có lỗi xảy ra khi xử lý dữ liệu!"
                    );


                    resetButton(
                        btnProcess,
                        originalBtnText
                    );
                }
            }
        );
    }
);


/* ========================================================
   4. BUTTON STATE
======================================================== */

function setProcessButtonLoading(
    button,
    isLoading
) {

    if (!button) {
        return;
    }


    if (isLoading) {

        button.disabled =
            true;

        button.classList.add(
            "is-disabled"
        );

        button.innerHTML = `

            <span class="quick-order-button-loading">

                <svg
                    class="quick-order-spinner"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                >
                    <circle
                        class="quick-order-spinner-track"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                    ></circle>

                    <path
                        class="quick-order-spinner-head"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>

                </svg>

                ĐANG QUÉT DỮ LIỆU...

            </span>

        `;

    } else {

        button.disabled =
            false;

        button.classList.remove(
            "is-disabled"
        );
    }
}


function resetButton(
    button,
    text
) {

    if (!button) {
        return;
    }


    button.innerHTML =
        text;

    button.disabled =
        false;

    button.classList.remove(
        "is-disabled"
    );
}

const QUICK_ORDER_IMAGE_CDN_BASE =
    "https://mrokhangnam-image.khangnamvn.workers.dev";

function buildQuickOrderImageUrl(imagePath) {

    if (!imagePath) {
        return "../assets/images/world mark.png";
    }

    const cleanPath =
        String(imagePath).trim();

    if (!cleanPath) {
        return "../assets/images/world mark.png";
    }

    if (/^https?:\/\//i.test(cleanPath)) {
        return cleanPath;
    }

    return `${QUICK_ORDER_IMAGE_CDN_BASE}/${cleanPath.replace(/^\/+/, "")}`;
}

/* ========================================================
   5. SMART SEARCH
======================================================== */

async function smartSearchAndRenderTable(
    items,
    logArea
) {

    const btnProcess =
        document.getElementById(
            "btnProcessQuickOrder"
        );


    try {

        let validProducts =
            [];

        let notFoundList =
            [];


        for (
            const item of items
        ) {

            const query =
                String(
                    item.keyword || ""
                ).trim();


            if (!query) {
                continue;
            }


            /* ---------------------------------------------
               1. EXACT SKU
            --------------------------------------------- */

            let {
                data,
                error
            } =
                await window.supabaseClient
                    .from("products")
                    .select(
    "id, sku, name, image_path, brand_id, brands(name), unit, stock_quantity"
)
                    .eq(
                        "sku",
                        query
                    )
                    .limit(1);


            if (error) {

                console.error(
                    "Lỗi tìm SKU:",
                    error
                );
            }


            /* ---------------------------------------------
               2. PRODUCT NAME FALLBACK
            --------------------------------------------- */

            if (
                !data ||
                data.length === 0
            ) {

                const nameResult =
                    await window.supabaseClient
                        .from("products")
                        .select(
    "id, sku, name, image_path, brand_id, brands(name), unit, stock_quantity"
)
                        .ilike(
                            "name",
                            `%${query}%`
                        )
                        .limit(1);


                data =
                    nameResult.data ||
                    [];
            }


            /* ---------------------------------------------
               3. RESULT
            --------------------------------------------- */

            if (
                data &&
                data.length > 0
            ) {

                const product = data[0];

                const requestedQuantity =
                    Number(item.quantity) || 1;

                const stockQuantity =
                    Number(product.stock_quantity) || 0;

                validProducts.push(
                    {
                        ...product,

                        quantity:
                            requestedQuantity,

                        stock_quantity:
                            stockQuantity,

                        is_in_stock:
                            stockQuantity > 0,

                        is_stock_sufficient:
                            stockQuantity >= requestedQuantity
                    }
                );

            } else {

                notFoundList.push(
                    {
                        keyword:
                            query,

                        quantity:
                            Number(
                                item.quantity
                            ) || 1
                    }
                );
            }
        }


        /* =================================================
           DASHBOARD
        ================================================== */

        const dashTotal =
            document.getElementById(
                "dashTotal"
            );

        const dashInStock =
            document.getElementById(
                "dashInStock"
            );

        const dashQuotation =
            document.getElementById(
                "dashQuotation"
            );

        const dashRfqCount =
            document.getElementById(
                "dashRfqCount"
            );


        const totalCount =
            validProducts.length +
            notFoundList.length;


        if (dashTotal) {

            dashTotal.innerText =
                totalCount;
        }

        if (dashInStock) {

            const inStockCount =
                validProducts.filter(
                    (product) =>
                        product.is_stock_sufficient
                ).length;

            dashInStock.innerText =
                inStockCount;
        }

        if (dashQuotation) {

            dashQuotation.innerText =
                notFoundList.length;
        }


        /* =================================================
           TABLE
        ================================================== */

        let tableHTML = `

            <div class="quick-order-result">


                <div class="quick-order-result-header">

                    <h3 class="quick-order-result-title">
                        Kết Quả Kiểm Tra Kho
                    </h3>

                    <span class="quick-order-result-count">
                        Tổng cộng:
                        ${totalCount}
                        dòng
                    </span>

                </div>


                <div class="quick-order-table-wrapper">

                    <table class="quick-order-table">

                        <thead>

                            <tr>

                                <th>
                                    SKU / Từ khóa
                                </th>

                                <th>
                                    Tên Sản Phẩm
                                </th>

                                <th class="table-cell-center">
                                    Trạng Thái
                                </th>

                                <th class="table-cell-center">
                                    SL
                                </th>

                            </tr>

                        </thead>

                        <tbody>
        `;


        /* ---------------------------------------------
           VALID PRODUCTS
        --------------------------------------------- */

        validProducts.forEach(
            (product) => {

                const safeSku =
                    escapeQuickOrderHTML(
                        product.sku
                    );

                const safeName =
                    escapeQuickOrderHTML(
                        product.name
                    );


                tableHTML += `

                    <tr>

                        <td class="cell-sku">
                            ${safeSku}
                        </td>


                        <td class="cell-name">
                            ${safeName}
                        </td>


                        <td class="cell-status">

                            ${
                                    product.stock_quantity <= 0
                                        ? `
                                            <span class="quick-order-status quick-order-status-warning">
                                                ⚠ Hết hàng
                                            </span>
                                        `
                                        : product.is_stock_sufficient
                                            ? `
                                                <span class="quick-order-status quick-order-status-success">
                                                    ✓ Đủ hàng
                                                </span>
                                            `
                                            : `
                                                <span class="quick-order-status quick-order-status-warning">
                                                    ⚠ Không đủ hàng
                                                    <small>
                                                        Kho: ${Number(product.stock_quantity).toLocaleString("vi-VN")}
                                                        / Cần: ${Number(product.quantity).toLocaleString("vi-VN")}
                                                    </small>
                                                </span>
                                            `
                                }

                        </td>


                        <td class="cell-quantity">
                            ${product.quantity}
                        </td>

                    </tr>

                `;
            }
        );


        /* ---------------------------------------------
           NOT FOUND
        --------------------------------------------- */

        notFoundList.forEach(
            (item) => {

                const safeKeyword =
                    escapeQuickOrderHTML(
                        item.keyword
                    );


                tableHTML += `

                    <tr class="is-not-found">

                        <td class="cell-sku cell-sku-warning">
                            ${safeKeyword}
                        </td>


                        <td class="cell-not-found">
                            Không có sẵn trên hệ thống,
                            cần kiểm tra thủ công.
                        </td>


                        <td class="cell-status">

                            <span class="quick-order-status quick-order-status-warning">
                                ⚠ Cần báo giá ngoài
                            </span>

                        </td>


                        <td class="cell-quantity">
                            ${item.quantity}
                        </td>

                    </tr>

                `;
            }
        );


        tableHTML += `

                        </tbody>

                    </table>

                </div>


                <div class="quick-order-result-footer">

                    <button
                        type="button"
                        onclick="addQuickOrderToCart()"
                        class="quick-order-rfq-button"
                    >
                        Tạo Báo Giá Tất Cả (RFQ)
                    </button>

                </div>

            </div>

        `;


        if (logArea) {

            logArea.innerHTML =
                tableHTML;
        }


        /* =================================================
           SAVE TEMP DATA
        ================================================== */

        window.tempQuickOrderData = [

            ...validProducts.map(
                (product) => ({
                    sku:
                        product.sku,

                    name:
                        product.name,

                    brand:
                        product.brands?.name ||
                        "OEM",

                    image:
    buildQuickOrderImageUrl(
        product.image_path
    ),

                    unit:
                        product.unit ||
                        "Cái",

                    qty:
                        product.quantity
                })
            ),


            ...notFoundList.map(
                (item) => ({
                    sku:
                        item.keyword,

                    name:
                        `[Yêu cầu ngoài] ${item.keyword}`,

                    brand:
                        "OEM",

                    image:
                        null,

                    unit:
                        "Cái",

                    qty:
                        item.quantity
                })
            )

        ];


    } catch (
        dbError
    ) {

        console.error(
            "Lỗi xử lý dữ liệu:",
            dbError
        );


        if (logArea) {

            logArea.innerHTML = `

                <div class="quick-order-error-message">
                    Lỗi tải dữ liệu. Vui lòng thử lại sau.
                </div>

            `;
        }


    } finally {

        resetButton(
            btnProcess,
            "Hệ Thống Bắt Đầu Xử Lý"
        );
    }
}

/* ========================================================
   RFQ CREATED COUNT
======================================================== */

function getQuickOrderRfqCount() {

    return Number(
        localStorage.getItem(
            "mro_quick_order_rfq_count"
        )
    ) || 0;
}

function updateQuickOrderRfqCount() {

    const dashRfqCount =
        document.getElementById(
            "dashRfqCount"
        );

    if (!dashRfqCount) {
        return;
    }

    dashRfqCount.innerText =
        getQuickOrderRfqCount();
}

/* ========================================================
   6. ADD TO RFQ CART
======================================================== */

window.addQuickOrderToCart =
function () {

    if (
        !window.tempQuickOrderData ||
        window.tempQuickOrderData.length === 0
    ) {

        alert(
            "Không có dữ liệu hợp lệ để thêm!"
        );

        return;
    }


    let currentCart =
        [];


    try {

        currentCart =
            JSON.parse(
                localStorage.getItem(
                    "mro_rfq_cart"
                )
            ) || [];

    } catch (error) {

        console.error(
            "Lỗi đọc RFQ cart:",
            error
        );

        currentCart =
            [];
    }


    window.tempQuickOrderData.forEach(
        (newItem) => {

            const existingIndex =
                currentCart.findIndex(
                    (item) =>
                        item.sku ===
                        newItem.sku
                );


            if (
                existingIndex > -1
            ) {

                currentCart[
                    existingIndex
                ].qty +=
                    newItem.qty;

            } else {

                currentCart.push(
                    {
                        sku:
                            newItem.sku,

                        name:
                            newItem.name,

                        brand:
                            newItem.brand,

                        image:
                            newItem.image,

                        unit:
                            newItem.unit,

                        qty:
                            newItem.qty
                    }
                );
            }
        }
    );


    localStorage.setItem(
        "mro_rfq_cart",
        JSON.stringify(
            currentCart
        )
    );


    window.location.href =
        "rfq.html";
};


/* ========================================================
   7. HTML ESCAPE
======================================================== */

function escapeQuickOrderHTML(
    value
) {

    if (
        typeof window.utils !==
            "undefined" &&
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