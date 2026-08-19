/* =========================================================
   FILE: assets/js/admin/admin-products.js

   QUẢN LÝ SẢN PHẨM
   ---------------------------------------------------------
   DATABASE CONTRACT - KHÔNG THAY ĐỔI

   products:
   - sku
   - name
   - category_id
   - sub_category_id
   - family_id
   - industry_id
   - brand_id
   - origin
   - price
   - discount_price
   - unit
   - stock_quantity
   - min_order_quantity
   - badge
   - image_url
   - images
   - datasheet_url
   - short_description
   - specifications
   - description
   - available_sizes
   - size

   Brand:
   - Nếu brand tồn tại -> dùng brand_id
   - Nếu chưa tồn tại -> tạo brands trước
   - Sau đó lưu brand_id vào products

   Size:
   - available_sizes là nguồn chính
   - size là fallback cho dữ liệu cũ
   - Không thay đổi cấu trúc database
========================================================= */


/* =========================================================
   STATE
========================================================= */

const state = {

    products: [],

    categories: [],

    subCategories: [],

    families: [],

    industries: [],

    brands: [],

    editingId: null,

    currentPage: 1,

    itemsPerPage: 10,

    totalItems: 0,

    searchQuery: "",

    filterCategoryId: "all",

    filterIndustryId: "all",

    filterStock: "all"

};


/* =========================================================
   DOM
========================================================= */

const DOM = {

    listView:
        document.getElementById(
            "productListView"
        ),

    formView:
        document.getElementById(
            "productFormView"
        ),

    form:
        document.getElementById(
            "productForm"
        ),

    tableBody:
        document.getElementById(
            "productTableBody"
        ),

    pagination:
        document.getElementById(
            "paginationContainer"
        ),

    search:
        document.getElementById(
            "searchInput"
        ),

    btnAdd:
        document.getElementById(
            "btnAddProduct"
        ),

    btnBack:
        document.getElementById(
            "btnBackToProducts"
        ),

    btnCancel:
        document.getElementById(
            "btnCancelForm"
        ),

    btnSubmit:
        document.getElementById(
            "btnSubmit"
        ),

    formTitle:
        document.getElementById(
            "formTitle"
        ),

    category:
        document.getElementById(
            "category_id"
        ),

    subCategory:
        document.getElementById(
            "sub_category_id"
        ),

    family:
        document.getElementById(
            "family_id"
        ),

    industry:
        document.getElementById(
            "industrySelect"
        ),

    filterCategory:
        document.getElementById(
            "filterCategorySelect"
        ),

    filterIndustry:
        document.getElementById(
            "filterIndustrySelect"
        ),

    filterStock:
        document.getElementById(
            "filterStockSelect"
        ),

    total:
        document.getElementById(
            "productTotal"
        ),

    inStock:
        document.getElementById(
            "productInStock"
        ),

    outOfStock:
        document.getElementById(
            "productOutOfStock"
        ),

    onSale:
        document.getElementById(
            "productOnSale"
        ),

    toast:
        document.getElementById(
            "toastContainer"
        )

};


/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value).replace(
        /[&<>'"]/g,
        character => ({

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"

        })[character]
    );

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


function formatCurrency(value) {

    const number =
        Number(value);

    if (
        !number
    ) {

        return "Liên hệ";

    }

    return new Intl.NumberFormat(
        "vi-VN"
    ).format(number) + " đ";

}


/* =========================================================
   FORMAT SIZE
   ---------------------------------------------------------
   available_sizes:
       ["S", "M", "L"]

   hoặc:

       "S,M,L"

   fallback:

       size = "S"

   => render:
       S M L
========================================================= */

function normalizeProductSizes(product) {

    if (!product) {

        return [];

    }


    let sizes =
        product.available_sizes;


    /*
       JSONB bình thường:
       ["S", "M", "L"]
    */

    if (
        Array.isArray(sizes)
    ) {

        sizes =
            sizes
                .map(
                    size =>
                        String(size)
                            .trim()
                )
                .filter(Boolean);

    }


    /*
       Trường hợp dữ liệu trả về dạng string:
       "S,M,L"
    */

    else if (
        typeof sizes === "string"
    ) {

        sizes =
            sizes
                .split(",")
                .map(
                    size =>
                        size.trim()
                )
                .filter(Boolean);

    }


    else {

        sizes = [];

    }


    /*
       Fallback dữ liệu cũ:
       size = "S"
       hoặc:
       size = "S,M,L"
    */

    if (
        sizes.length === 0 &&
        product.size !== null &&
        product.size !== undefined &&
        String(product.size).trim()
    ) {

        sizes =
            String(product.size)
                .split(",")
                .map(
                    size =>
                        size.trim()
                )
                .filter(Boolean);

    }


    /*
       Loại bỏ size trùng
    */

    sizes =
        [
            ...new Set(
                sizes
            )
        ];


    return sizes;

}


function renderProductSizes(product) {

    const sizes =
        normalizeProductSizes(
            product
        );


    if (
        sizes.length === 0
    ) {

        return `

            <span
                class="
                    text-xs
                    text-gray-400
                    italic
                "
            >
                —
            </span>

        `;

    }


    return `

        <div
            class="
                flex
                flex-wrap
                items-center
                gap-1
                max-w-[180px]
            "
        >

            ${
                sizes
                    .map(
                        size => `

                            <span
                                class="
                                    inline-flex
                                    items-center
                                    justify-center
                                    min-w-[28px]
                                    px-2
                                    py-1
                                    rounded-md
                                    bg-blue-50
                                    border
                                    border-blue-100
                                    text-kn-blue
                                    text-[10px]
                                    font-black
                                    leading-none
                                "
                                title="Size ${escapeAttribute(
                                    size
                                )}"
                            >
                                ${escapeHTML(size)}
                            </span>

                        `
                    )
                    .join("")
            }

        </div>

    `;

}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initCKEditor();

        bindEvents();

        await loadAllDropdowns();

        await fetchProducts();

    }
);


/* =========================================================
   CKEDITOR
========================================================= */

function initCKEditor() {

    if (
        typeof CKEDITOR === "undefined"
    ) {

        return;

    }


    const description =
        document.getElementById(
            "description"
        );


    if (
        !description
    ) {

        return;

    }


    if (
        !CKEDITOR.instances.description
    ) {

        CKEDITOR.replace(
            "description",
            {
                height: 250
            }
        );

    }

}


/* =========================================================
   LOAD DROPDOWNS
========================================================= */

async function loadAllDropdowns() {

    try {

        const [

            categoryResult,

            subCategoryResult,

            familyResult,

            industryResult,

            brandResult

        ] =
            await Promise.all([

                window.supabaseClient

                    .from(
                        "categories"
                    )

                    .select(
                        "id, name"
                    )

                    .order(
                        "name",
                        {
                            ascending: true
                        }
                    ),


                window.supabaseClient

                    .from(
                        "sub_categories"
                    )

                    .select(
                        "id, name, category_id"
                    )

                    .order(
                        "name",
                        {
                            ascending: true
                        }
                    ),


                window.supabaseClient

                    .from(
                        "families"
                    )

                    .select(
                        "id, name, sub_category_id"
                    )

                    .order(
                        "name",
                        {
                            ascending: true
                        }
                    ),


                window.supabaseClient

                    .from(
                        "industries"
                    )

                    .select(
                        "id, name"
                    )

                    .order(
                        "name",
                        {
                            ascending: true
                        }
                    ),


                window.supabaseClient

                    .from(
                        "brands"
                    )

                    .select(
                        "id, name"
                    )

                    .order(
                        "name",
                        {
                            ascending: true
                        }
                    )

            ]);


        if (
            categoryResult.error
        ) {

            throw categoryResult.error;

        }


        if (
            subCategoryResult.error
        ) {

            throw subCategoryResult.error;

        }


        if (
            familyResult.error
        ) {

            throw familyResult.error;

        }


        if (
            industryResult.error
        ) {

            throw industryResult.error;

        }


        if (
            brandResult.error
        ) {

            throw brandResult.error;

        }


        state.categories =
            categoryResult.data || [];


        state.subCategories =
            subCategoryResult.data || [];


        state.families =
            familyResult.data || [];


        state.industries =
            industryResult.data || [];


        state.brands =
            brandResult.data || [];


        populateSelect(
            DOM.category,
            state.categories,
            "-- Chọn danh mục gốc --"
        );


        populateSelect(
            DOM.industry,
            state.industries,
            "-- Chọn ngành hàng --"
        );


        populateSelect(
            DOM.filterCategory,
            state.categories,
            "Tất cả danh mục"
        );


        populateSelect(
            DOM.filterIndustry,
            state.industries,
            "Tất cả ngành hàng"
        );


        resetCatalogDropdowns();

        refreshBrandDatalist();


    } catch (
        error
    ) {

        console.error(
            "Lỗi tải Dropdowns:",
            error
        );


        showToast(
            "Không thể tải dữ liệu danh mục.",
            "error"
        );

    }

}


/* =========================================================
   SELECT
========================================================= */

function populateSelect(
    element,
    data,
    placeholder
) {

    if (
        !element
    ) {

        return;

    }


    element.innerHTML = `

        <option value="">
            ${escapeHTML(
                placeholder
            )}
        </option>

        ${
            (data || [])
                .map(
                    item => `

                        <option
                            value="${escapeAttribute(
                                item.id
                            )}"
                        >
                            ${escapeHTML(
                                item.name
                            )}
                        </option>

                    `
                )
                .join("")
        }

    `;

}


/* =========================================================
   BRAND DATALIST
========================================================= */

function refreshBrandDatalist() {

    const brandList =
        document.getElementById(
            "brandList"
        );


    if (
        !brandList
    ) {

        return;

    }


    brandList.innerHTML =
        state.brands
            .map(
                brand => `

                    <option
                        value="${escapeAttribute(
                            brand.name
                        )}"
                    ></option>

                `
            )
            .join("");

}


/* =========================================================
   CATALOG CASCADE
========================================================= */

function resetCatalogDropdowns() {

    populateSelect(
        DOM.subCategory,
        [],
        "-- Chọn nhóm hàng --"
    );


    populateSelect(
        DOM.family,
        [],
        "-- Chọn dòng sản phẩm --"
    );

}


function updateSubCategories(
    categoryId
) {

    const filtered =
        categoryId

            ? state.subCategories.filter(
                item =>
                    String(
                        item.category_id
                    ) ===
                    String(
                        categoryId
                    )
            )

            : [];


    populateSelect(
        DOM.subCategory,
        filtered,
        "-- Chọn nhóm hàng --"
    );


    populateSelect(
        DOM.family,
        [],
        "-- Chọn dòng sản phẩm --"
    );

}


function updateFamilies(
    subCategoryId
) {

    const filtered =
        subCategoryId

            ? state.families.filter(
                item =>
                    String(
                        item.sub_category_id
                    ) ===
                    String(
                        subCategoryId
                    )
            )

            : [];


    populateSelect(
        DOM.family,
        filtered,
        "-- Chọn dòng sản phẩm --"
    );

}


/* =========================================================
   FETCH PRODUCTS
========================================================= */

async function fetchProducts() {

    if (
        !DOM.tableBody
    ) {

        return;

    }


    renderTableLoading();


    try {

        const from =
            (
                state.currentPage - 1
            ) *
            state.itemsPerPage;


        const to =
            from +
            state.itemsPerPage -
            1;


        let query =
            window.supabaseClient

                .from(
                    "products"
                )

                .select(
                    "*, brands(name)",
                    {
                        count: "exact"
                    }
                );


        /* -----------------------------------------
           SEARCH
        ------------------------------------------ */

        if (
            state.searchQuery
        ) {

            const keyword =
                state.searchQuery
                    .replace(
                        /[%_,]/g,
                        ""
                    );


            if (
                keyword
            ) {

                query =
                    query.or(
                        `sku.ilike.%${keyword}%,name.ilike.%${keyword}%`
                    );

            }

        }


        /* -----------------------------------------
           CATEGORY
        ------------------------------------------ */

        if (
            state.filterCategoryId !==
            "all"
        ) {

            query =
                query.eq(
                    "category_id",
                    state.filterCategoryId
                );

        }


        /* -----------------------------------------
           INDUSTRY
        ------------------------------------------ */

        if (
            state.filterIndustryId !==
            "all"
        ) {

            query =
                query.eq(
                    "industry_id",
                    state.filterIndustryId
                );

        }


        /* -----------------------------------------
           STOCK
        ------------------------------------------ */

        if (
            state.filterStock ===
            "in_stock"
        ) {

            query =
                query.gt(
                    "stock_quantity",
                    0
                );

        }


        if (
            state.filterStock ===
            "out_of_stock"
        ) {

            query =
                query.lte(
                    "stock_quantity",
                    0
                );

        }


        /* -----------------------------------------
           FETCH
        ------------------------------------------ */

        const {
            data,
            count,
            error
        } =
            await query

                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )

                .range(
                    from,
                    to
                );


        if (
            error
        ) {

            throw error;

        }


        state.products =
            data || [];


        state.totalItems =
            count || 0;


        updateStatistics();

        renderProducts();

        renderPagination();


    } catch (
        error
    ) {

        console.error(
            "Lỗi tải sản phẩm:",
            error
        );


        DOM.tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="
                        text-center
                        py-12
                        text-red-500
                        font-bold
                    "
                >

                    Không thể tải danh sách sản phẩm.

                    <div
                        class="
                            text-xs
                            font-normal
                            mt-1
                            text-red-400
                        "
                    >
                        ${escapeHTML(
                            error.message
                        )}
                    </div>

                </td>

            </tr>

        `;

    }

}


/* =========================================================
   LOADING
========================================================= */

function renderTableLoading() {

    if (
        !DOM.tableBody
    ) {

        return;

    }


    DOM.tableBody.innerHTML = `

        <tr>

            <td
                colspan="9"
                class="
                    text-center
                    py-12
                    text-gray-400
                "
            >

                <div
                    class="
                        inline-block
                        w-6
                        h-6
                        border-2
                        border-kn-blue
                        border-t-transparent
                        rounded-full
                        animate-spin
                    "
                ></div>

                <div class="mt-2">
                    Đang tải sản phẩm...
                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   STATISTICS
========================================================= */

async function updateStatistics() {

    if (
        DOM.total
    ) {

        DOM.total.textContent =
            state.totalItems;

    }


    const inStock =
        state.products.filter(
            product =>
                Number(
                    product.stock_quantity
                ) > 0
        ).length;


    const outOfStock =
        state.products.filter(
            product =>
                Number(
                    product.stock_quantity
                ) <= 0
        ).length;


    const onSale =
        state.products.filter(
            product => {

                const price =
                    Number(
                        product.price
                    );


                const discount =
                    Number(
                        product.discount_price
                    );


                return (
                    discount > 0 &&
                    price > 0 &&
                    discount < price
                );

            }
        ).length;


    if (
        DOM.inStock
    ) {

        DOM.inStock.textContent =
            inStock;

    }


    if (
        DOM.outOfStock
    ) {

        DOM.outOfStock.textContent =
            outOfStock;

    }


    if (
        DOM.onSale
    ) {

        DOM.onSale.textContent =
            onSale;

    }

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts() {

    if (
        !DOM.tableBody
    ) {

        return;

    }


    if (
        state.products.length === 0
    ) {

        DOM.tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="
                        text-center
                        py-14
                        text-gray-400
                    "
                >

                    <div
                        class="
                            w-12
                            h-12
                            rounded-full
                            bg-gray-100
                            flex
                            items-center
                            justify-center
                            mx-auto
                            mb-3
                        "
                    >

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-6 h-6 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >

                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0l-8 5-8-5m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5"
                            />

                        </svg>

                    </div>


                    <div
                        class="
                            font-bold
                            text-gray-500
                        "
                    >
                        Không tìm thấy sản phẩm.
                    </div>

                    <div
                        class="
                            text-xs
                            text-gray-400
                            mt-1
                        "
                    >
                        Thử thay đổi từ khóa hoặc bộ lọc.
                    </div>

                </td>

            </tr>

        `;

        return;

    }


    const from =
        (
            state.currentPage - 1
        ) *
        state.itemsPerPage;


    DOM.tableBody.innerHTML =
        state.products

            .map(
                (
                    item,
                    index
                ) => {

                    const brandName =
                        item.brands?.name ||
                        "OEM";


                    const imgObj =
                        item.image_url

                            ? `

                                <img
                                    src="${escapeAttribute(
                                        item.image_url
                                    )}"
                                    alt="${escapeAttribute(
                                        item.name
                                    )}"
                                    class="
                                        w-10
                                        h-10
                                        object-contain
                                        mx-auto
                                        border
                                        border-gray-200
                                        rounded
                                        bg-white
                                    "
                                    loading="lazy"
                                >

                            `

                            : `

                                <div
                                    class="
                                        w-10
                                        h-10
                                        bg-gray-100
                                        border
                                        border-gray-200
                                        rounded
                                        flex
                                        items-center
                                        justify-center
                                        text-[10px]
                                        text-gray-400
                                        mx-auto
                                    "
                                >
                                    No Img
                                </div>

                            `;


                    const priceHTML =
                        item.discount_price &&
                        Number(
                            item.discount_price
                        ) > 0 &&
                        Number(
                            item.discount_price
                        ) <
                        Number(
                            item.price
                        )

                            ? `

                                <div>

                                    <div
                                        class="
                                            font-black
                                            text-kn-orange
                                        "
                                    >
                                        ${formatCurrency(
                                            item.discount_price
                                        )}
                                    </div>

                                    <div
                                        class="
                                            text-[10px]
                                            text-gray-400
                                            line-through
                                            mt-0.5
                                        "
                                    >
                                        ${formatCurrency(
                                            item.price
                                        )}
                                    </div>

                                </div>

                            `

                            : `

                                <span
                                    class="
                                        font-bold
                                        text-gray-800
                                    "
                                >
                                    ${formatCurrency(
                                        item.price
                                    )}
                                </span>

                            `;


                    const stock =
                        Number(
                            item.stock_quantity
                        ) || 0;


                    const stockHTML =
                        stock > 0

                            ? `

                                <span
                                    class="
                                        inline-flex
                                        items-center
                                        gap-1
                                        px-2.5
                                        py-1.5
                                        rounded-lg
                                        bg-green-50
                                        border
                                        border-green-100
                                        text-green-700
                                        text-xs
                                        font-black
                                    "
                                >

                                    <span
                                        class="
                                            w-1.5
                                            h-1.5
                                            rounded-full
                                            bg-green-500
                                        "
                                    ></span>

                                    ${stock}

                                </span>

                            `

                            : `

                                <span
                                    class="
                                        inline-flex
                                        items-center
                                        gap-1
                                        px-2.5
                                        py-1.5
                                        rounded-lg
                                        bg-red-50
                                        border
                                        border-red-100
                                        text-red-600
                                        text-xs
                                        font-black
                                    "
                                >

                                    <span
                                        class="
                                            w-1.5
                                            h-1.5
                                            rounded-full
                                            bg-red-500
                                        "
                                    ></span>

                                    Hết hàng

                                </span>

                            `;


                    return `

                        <tr
                            class="
                                border-b
                                border-gray-100
                                hover:bg-blue-50/30
                                transition
                            "
                        >

                            <!-- STT -->

                            <td
                                class="
                                    px-4
                                    py-4
                                    text-center
                                    font-bold
                                    text-gray-400
                                    text-xs
                                "
                            >
                                ${
                                    from +
                                    index +
                                    1
                                }
                            </td>


                            <!-- IMAGE -->

                            <td
                                class="
                                    px-4
                                    py-4
                                    text-center
                                "
                            >
                                ${imgObj}
                            </td>


                            <!-- SKU -->

                            <td
                                class="
                                    px-4
                                    py-4
                                "
                            >

                                <span
                                    class="
                                        font-mono
                                        font-bold
                                        text-kn-blue
                                        text-xs
                                    "
                                >
                                    ${escapeHTML(
                                        item.sku
                                    )}
                                </span>

                            </td>


                            <!-- PRODUCT -->

                            <td
                                class="
                                    px-4
                                    py-4
                                "
                            >

                                <div
                                    class="
                                        max-w-[260px]
                                    "
                                >

                                    <div
                                        class="
                                            font-bold
                                            text-gray-800
                                            text-sm
                                            leading-snug
                                        "
                                        title="${escapeAttribute(
                                            item.name
                                        )}"
                                    >
                                        ${escapeHTML(
                                            item.name
                                        )}
                                    </div>

                                </div>

                            </td>


                            <!-- BRAND -->

                            <td
                                class="
                                    px-4
                                    py-4
                                "
                            >

                                <span
                                    class="
                                        inline-flex
                                        items-center
                                        px-2.5
                                        py-1.5
                                        rounded-lg
                                        bg-gray-50
                                        border
                                        border-gray-200
                                        text-xs
                                        font-bold
                                        text-gray-600
                                        uppercase
                                    "
                                >
                                    ${escapeHTML(
                                        brandName
                                    )}
                                </span>

                            </td>


                            <!-- SIZE -->

                            <td
                                class="
                                    px-4
                                    py-4
                                "
                            >

                                ${renderProductSizes(
                                    item
                                )}

                            </td>


                            <!-- PRICE -->

                            <td
                                class="
                                    px-4
                                    py-4
                                "
                            >

                                ${priceHTML}

                            </td>


                            <!-- STOCK -->

                            <td
                                class="
                                    px-4
                                    py-4
                                    text-center
                                "
                            >

                                ${stockHTML}

                            </td>


                            <!-- ACTIONS -->

                            <td
                                class="
                                    px-4
                                    py-4
                                    text-center
                                    whitespace-nowrap
                                "
                            >

                                <div
                                    class="
                                        inline-flex
                                        items-center
                                        gap-1
                                    "
                                >

                                    <button
                                        type="button"
                                        data-action="edit"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                        title="Sửa sản phẩm"
                                        class="
                                            p-2
                                            text-blue-600
                                            hover:bg-blue-100
                                            rounded-lg
                                            transition
                                            font-bold
                                        "
                                    >

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="w-4 h-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >

                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />

                                        </svg>

                                    </button>


                                    <button
                                        type="button"
                                        data-action="delete"
                                        data-id="${escapeAttribute(
                                            item.id
                                        )}"
                                        title="Xóa sản phẩm"
                                        class="
                                            p-2
                                            text-red-500
                                            hover:bg-red-50
                                            rounded-lg
                                            transition
                                            font-bold
                                        "
                                    >

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="w-4 h-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >

                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4V4a1 1 0 011-1h4a1 1 0 011 1v3m5 0H4"
                                            />

                                        </svg>

                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   PAGINATION
========================================================= */

function renderPagination() {

    if (
        !DOM.pagination
    ) {

        return;

    }


    const totalPages =
        Math.ceil(
            state.totalItems /
            state.itemsPerPage
        );


    if (
        totalPages <= 1
    ) {

        DOM.pagination.innerHTML = `

            <span
                class="
                    text-xs
                    text-gray-500
                "
            >
                ${state.totalItems}
                sản phẩm
            </span>

        `;

        return;

    }


    const startItem =
        (
            (
                state.currentPage - 1
            ) *
            state.itemsPerPage
        ) + 1;


    const endItem =
        Math.min(
            state.currentPage *
                state.itemsPerPage,
            state.totalItems
        );


    const pages = [];


    pages.push(1);


    if (
        state.currentPage > 3
    ) {

        pages.push(
            "..."
        );

    }


    const start =
        Math.max(
            2,
            state.currentPage - 1
        );


    const end =
        Math.min(
            totalPages - 1,
            state.currentPage + 1
        );


    for (
        let page = start;
        page <= end;
        page++
    ) {

        pages.push(
            page
        );

    }


    if (
        state.currentPage <
        totalPages - 2
    ) {

        pages.push(
            "..."
        );

    }


    if (
        totalPages > 1
    ) {

        pages.push(
            totalPages
        );

    }


    DOM.pagination.innerHTML = `

        <div
            class="
                text-xs
                text-gray-500
            "
        >

            Hiển thị

            <strong
                class="
                    text-gray-700
                "
            >
                ${startItem}-${endItem}
            </strong>

            /

            <strong
                class="
                    text-gray-700
                "
            >
                ${state.totalItems}
            </strong>

        </div>


        <div
            class="
                flex
                items-center
                gap-1
            "
        >

            <button
                type="button"
                data-page-action="prev"
                ${
                    state.currentPage === 1
                        ? "disabled"
                        : ""
                }
                class="
                    px-3
                    py-1.5
                    rounded-lg
                    text-xs
                    font-bold
                    border
                    ${
                        state.currentPage === 1

                            ? `
                                text-gray-300
                                border-gray-100
                                cursor-not-allowed
                            `

                            : `
                                text-gray-600
                                border-gray-200
                                hover:bg-gray-50
                            `
                    }
                "
            >
                ← Trước
            </button>


            ${
                pages
                    .map(
                        page => {

                            if (
                                page === "..."
                            ) {

                                return `

                                    <span
                                        class="
                                            px-2
                                            text-gray-400
                                            text-xs
                                        "
                                    >
                                        ...
                                    </span>

                                `;

                            }


                            return `

                                <button
                                    type="button"
                                    data-page="${page}"
                                    class="
                                        min-w-8
                                        px-2
                                        py-1.5
                                        rounded-lg
                                        text-xs
                                        font-bold
                                        border
                                        ${
                                            page ===
                                            state.currentPage

                                                ? `
                                                    bg-kn-blue
                                                    text-white
                                                    border-kn-blue
                                                `

                                                : `
                                                    bg-white
                                                    text-gray-600
                                                    border-gray-200
                                                    hover:bg-gray-50
                                                `
                                        }
                                    "
                                >
                                    ${page}
                                </button>

                            `;

                        }
                    )
                    .join("")
            }


            <button
                type="button"
                data-page-action="next"
                ${
                    state.currentPage === totalPages
                        ? "disabled"
                        : ""
                }
                class="
                    px-3
                    py-1.5
                    rounded-lg
                    text-xs
                    font-bold
                    border
                    ${
                        state.currentPage === totalPages

                            ? `
                                text-gray-300
                                border-gray-100
                                cursor-not-allowed
                            `

                            : `
                                text-gray-600
                                border-gray-200
                                hover:bg-gray-50
                            `
                    }
                "
            >
                Sau →
            </button>

        </div>

    `;

}


/* =========================================================
   SHOW ADD FORM
========================================================= */

function showAddForm() {

    state.editingId =
        null;


    if (
        DOM.form
    ) {

        DOM.form.reset();

    }


    if (
        typeof CKEDITOR !== "undefined" &&
        CKEDITOR.instances.description
    ) {

        CKEDITOR.instances.description.setData(
            ""
        );

    }


    if (
        DOM.formTitle
    ) {

        DOM.formTitle.textContent =
            "Nhập Sản Phẩm Mới";

    }


    if (
        DOM.btnSubmit
    ) {

        DOM.btnSubmit.textContent =
            "Nhập kho sản phẩm";

    }


    resetCatalogDropdowns();


    DOM.listView?.classList.add(
        "hidden"
    );


    DOM.formView?.classList.remove(
        "hidden"
    );


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


/* =========================================================
   CANCEL FORM
========================================================= */

function cancelForm() {

    state.editingId =
        null;


    DOM.formView?.classList.add(
        "hidden"
    );


    DOM.listView?.classList.remove(
        "hidden"
    );


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


/* =========================================================
   EDIT PRODUCT
========================================================= */

function editProduct(
    id
) {

    const item =
        state.products.find(
            product =>
                String(
                    product.id
                ) ===
                String(id)
        );


    if (
        !item
    ) {

        showToast(
            "Không tìm thấy sản phẩm.",
            "error"
        );

        return;

    }


    state.editingId =
        item.id;


    /* -----------------------------------------
       BASIC
    ------------------------------------------ */

    const sku =
        document.getElementById(
            "sku"
        );

    const name =
        document.getElementById(
            "name"
        );

    const origin =
        document.getElementById(
            "origin"
        );

    const price =
        document.getElementById(
            "price"
        );

    const discountPrice =
        document.getElementById(
            "discount_price"
        );

    const unit =
        document.getElementById(
            "unit"
        );

    const stock =
        document.getElementById(
            "stock_quantity"
        );

    const minOrder =
        document.getElementById(
            "min_order_quantity"
        );

    const badge =
        document.getElementById(
            "badge"
        );


    if (sku) {

        sku.value =
            item.sku || "";

    }


    if (name) {

        name.value =
            item.name || "";

    }


    if (origin) {

        origin.value =
            item.origin || "";

    }


    if (price) {

        price.value =
            item.price || "";

    }


    if (discountPrice) {

        discountPrice.value =
            item.discount_price || "";

    }


    if (unit) {

        unit.value =
            item.unit || "Cái";

    }


    if (stock) {

        stock.value =
            item.stock_quantity || 0;

    }


    if (minOrder) {

        minOrder.value =
            item.min_order_quantity || 1;

    }


    if (badge) {

        badge.value =
            item.badge || "";

    }


    /* -----------------------------------------
       IMAGE / DOCUMENT
    ------------------------------------------ */

    const imageUrl =
        document.getElementById(
            "image_url"
        );

    const extraImages =
        document.getElementById(
            "inExtraImages"
        );

    const datasheet =
        document.getElementById(
            "inDatasheet"
        );


    if (imageUrl) {

        imageUrl.value =
            item.image_url || "";

    }


    if (extraImages) {

        extraImages.value =
            item.images || "";

    }


    if (datasheet) {

        datasheet.value =
            item.datasheet_url || "";

    }


    /* -----------------------------------------
       CONTENT
    ------------------------------------------ */

    const shortDescription =
        document.getElementById(
            "short_description"
        );

    const specifications =
        document.getElementById(
            "specifications"
        );


    if (shortDescription) {

        shortDescription.value =
            item.short_description || "";

    }


    if (specifications) {

        specifications.value =
            item.specifications || "";

    }


    if (
        typeof CKEDITOR !== "undefined" &&
        CKEDITOR.instances.description
    ) {

        CKEDITOR.instances.description.setData(
            item.description || ""
        );

    } else {

        const description =
            document.getElementById(
                "description"
            );


        if (description) {

            description.value =
                item.description || "";

        }

    }


    /* -----------------------------------------
       SIZE
       available_sizes -> size fallback
    ------------------------------------------ */

    const availableSizes =
        document.getElementById(
            "available_sizes"
        );


    if (
        availableSizes
    ) {

        const sizes =
            normalizeProductSizes(
                item
            );


        availableSizes.value =
            sizes.join(
                ", "
            );

    }


    /* -----------------------------------------
       CATEGORY CASCADE
    ------------------------------------------ */

    if (
        DOM.category
    ) {

        DOM.category.value =
            item.category_id || "";


        updateSubCategories(
            item.category_id
        );

    }


    if (
        DOM.subCategory
    ) {

        DOM.subCategory.value =
            item.sub_category_id || "";


        updateFamilies(
            item.sub_category_id
        );

    }


    if (
        DOM.family
    ) {

        DOM.family.value =
            item.family_id || "";

    }


    if (
        DOM.industry
    ) {

        DOM.industry.value =
            item.industry_id || "";

    }


    /* -----------------------------------------
       BRAND
    ------------------------------------------ */

    const brandInput =
        document.getElementById(
            "brand_input"
        );


    if (
        brandInput
    ) {

        if (
            item.brand_id
        ) {

            const foundBrand =
                state.brands.find(
                    brand =>
                        String(
                            brand.id
                        ) ===
                        String(
                            item.brand_id
                        )
                );


            brandInput.value =
                foundBrand
                    ? foundBrand.name
                    : "";

        } else {

            brandInput.value =
                "";

        }

    }


    /* -----------------------------------------
       SHOW FORM
    ------------------------------------------ */

    if (
        DOM.formTitle
    ) {

        DOM.formTitle.textContent =
            "Sửa Sản Phẩm: " +
            (
                item.sku ||
                ""
            );

    }


    if (
        DOM.btnSubmit
    ) {

        DOM.btnSubmit.textContent =
            "Cập nhật sản phẩm";

    }


    DOM.listView?.classList.add(
        "hidden"
    );


    DOM.formView?.classList.remove(
        "hidden"
    );


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


/* =========================================================
   SAVE PRODUCT
   ---------------------------------------------------------
   DATABASE PAYLOAD GIỮ NGUYÊN
========================================================= */

async function saveProduct(
    event
) {

    if (
        event
    ) {

        event.preventDefault();

    }


    const btn =
        DOM.btnSubmit;


    if (
        !btn
    ) {

        return;

    }


    const originalText =
        btn.textContent;


    btn.disabled =
        true;


    btn.textContent =
        "Đang lưu...";


    try {

        /* -----------------------------------------
           CKEDITOR
        ------------------------------------------ */

        let descValue =
            "";


        if (
            typeof CKEDITOR !== "undefined" &&
            CKEDITOR.instances.description
        ) {

            descValue =
                CKEDITOR.instances.description.getData();

        } else {

            const description =
                document.getElementById(
                    "description"
                );


            descValue =
                description
                    ? description.value
                    : "";

        }


        /* -----------------------------------------
           BRAND
           GIỮ NGUYÊN LOGIC CŨ
        ------------------------------------------ */

        const brandInput =
            document.getElementById(
                "brand_input"
            );


        const brandInputText =
            brandInput
                ? brandInput.value.trim()
                : "";


        let finalBrandId =
            null;


        if (
            brandInputText
        ) {

            const foundBrand =
                state.brands.find(
                    brand =>
                        brand.name
                            .toLowerCase() ===
                        brandInputText
                            .toLowerCase()
                );


            if (
                foundBrand
            ) {

                finalBrandId =
                    foundBrand.id;

            } else {

                btn.textContent =
                    "Đang tạo hãng mới...";


                const {
                    data: newBrand,
                    error: brandError
                } =
                    await window.supabaseClient

                        .from(
                            "brands"
                        )

                        .insert([
                            {
                                name:
                                    brandInputText
                            }
                        ])

                        .select(
                            "id, name"
                        )

                        .single();


                if (
                    brandError
                ) {

                    throw new Error(
                        "Lỗi khi tạo Thương hiệu mới: " +
                        brandError.message
                    );

                }


                finalBrandId =
                    newBrand.id;


                state.brands.push(
                    newBrand
                );


                refreshBrandDatalist();

            }

        }


        /* -----------------------------------------
           SIZE
           INPUT:
           S, M, L, XL

           DATABASE:
           ["S", "M", "L", "XL"]
        ------------------------------------------ */

        const sizeInput =
            document.getElementById(
                "available_sizes"
            );


        const sizeText =
            sizeInput
                ? sizeInput.value.trim()
                : "";


        let sizesArray =
            null;


        if (
            sizeText
        ) {

            sizesArray =
                sizeText
                    .split(",")
                    .map(
                        size =>
                            size.trim()
                    )
                    .filter(Boolean);


            sizesArray =
                [
                    ...new Set(
                        sizesArray
                    )
                ];

        }


        /* -----------------------------------------
           DATABASE PAYLOAD
           KHÔNG ĐỔI
        ------------------------------------------ */

        btn.textContent =
            "Đang lưu sản phẩm...";


        const payload = {

            sku:
                document
                    .getElementById(
                        "sku"
                    )
                    .value
                    .trim(),


            name:
                document
                    .getElementById(
                        "name"
                    )
                    .value
                    .trim(),


            available_sizes:
                sizesArray,


            category_id:
                document
                    .getElementById(
                        "category_id"
                    )
                    .value ||
                null,


            sub_category_id:
                document
                    .getElementById(
                        "sub_category_id"
                    )
                    .value ||
                null,


            family_id:
                document
                    .getElementById(
                        "family_id"
                    )
                    .value ||
                null,


            industry_id:
                document
                    .getElementById(
                        "industrySelect"
                    )
                    .value ||
                null,


            brand_id:
                finalBrandId,


            origin:
                document
                    .getElementById(
                        "origin"
                    )
                    .value
                    .trim() ||
                null,


            price:
                document
                    .getElementById(
                        "price"
                    )
                    .value ||
                null,


            discount_price:
                document
                    .getElementById(
                        "discount_price"
                    )
                    .value ||
                null,


            unit:
                document
                    .getElementById(
                        "unit"
                    )
                    .value ||
                "Cái",


            stock_quantity:
                document
                    .getElementById(
                        "stock_quantity"
                    )
                    .value ||
                0,


            min_order_quantity:
                document
                    .getElementById(
                        "min_order_quantity"
                    )
                    .value ||
                1,


            badge:
                document
                    .getElementById(
                        "badge"
                    )
                    .value ||
                null,


            image_url:
                document
                    .getElementById(
                        "image_url"
                    )
                    .value
                    .trim() ||
                null,


            images:
                document
                    .getElementById(
                        "inExtraImages"
                    )
                    .value
                    .trim() ||
                null,


            datasheet_url:
                document
                    .getElementById(
                        "inDatasheet"
                    )
                    .value
                    .trim() ||
                null,


            short_description:
                document
                    .getElementById(
                        "short_description"
                    )
                    .value
                    .trim() ||
                null,


            specifications:
                document
                    .getElementById(
                        "specifications"
                    )
                    .value
                    .trim() ||
                null,


            description:
                descValue ||
                null

        };


        /* -----------------------------------------
           VALIDATION
        ------------------------------------------ */

        if (
            !payload.sku
        ) {

            throw new Error(
                "Mã SKU là bắt buộc!"
            );

        }


        if (
            !payload.name
        ) {

            throw new Error(
                "Tên sản phẩm là bắt buộc!"
            );

        }


        /* -----------------------------------------
           UPDATE
        ------------------------------------------ */

        if (
            state.editingId
        ) {

            const {
                error
            } =
                await window.supabaseClient

                    .from(
                        "products"
                    )

                    .update(
                        payload
                    )

                    .eq(
                        "id",
                        state.editingId
                    );


            if (
                error
            ) {

                throw error;

            }


            showToast(
                "Đã cập nhật sản phẩm!",
                "success"
            );

        }


        /* -----------------------------------------
           INSERT
        ------------------------------------------ */

        else {

            const {
                error
            } =
                await window.supabaseClient

                    .from(
                        "products"
                    )

                    .insert([
                        payload
                    ]);


            if (
                error
            ) {

                throw error;

            }


            state.currentPage =
                1;


            showToast(
                "Thêm sản phẩm thành công!",
                "success"
            );

        }


        cancelForm();

        await fetchProducts();


    } catch (
        error
    ) {

        console.error(
            "Lỗi lưu sản phẩm:",
            error
        );


        showToast(
            "Lỗi khi lưu: " +
            error.message,
            "error"
        );


    } finally {

        btn.disabled =
            false;


        btn.textContent =
            originalText;

    }

}


/* =========================================================
   DELETE PRODUCT
========================================================= */

async function deleteProduct(
    id
) {

    const item =
        state.products.find(
            product =>
                String(
                    product.id
                ) ===
                String(id)
        );


    if (
        !item
    ) {

        showToast(
            "Không tìm thấy sản phẩm.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Xóa vĩnh viễn sản phẩm "${item.name}"?\n\nSKU: ${item.sku}`
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        const {
            error
        } =
            await window.supabaseClient

                .from(
                    "products"
                )

                .delete()

                .eq(
                    "id",
                    id
                );


        if (
            error
        ) {

            throw error;

        }


        if (
            state.products.length === 1 &&
            state.currentPage > 1
        ) {

            state.currentPage--;

        }


        showToast(
            "Đã xóa sản phẩm.",
            "success"
        );


        await fetchProducts();


    } catch (
        error
    ) {

        console.error(
            "Lỗi xóa sản phẩm:",
            error
        );


        showToast(
            "Lỗi xóa: " +
            error.message,
            "error"
        );

    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    if (
        !DOM.toast
    ) {

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    const bgColor =
        type === "success"
            ? "bg-green-500"
            : "bg-red-500";


    toast.className = `

        ${bgColor}

        text-white

        px-4
        py-2

        rounded

        shadow-lg

        transform
        transition-all
        duration-300

        translate-y-0
        opacity-100

        mb-2

        font-bold
        text-sm

        flex
        items-center
        gap-2

        z-50

    `;


    toast.innerHTML =
        type === "success"

            ? `
                <span>✔</span>
                ${escapeHTML(message)}
            `

            : `
                <span>⚠</span>
                ${escapeHTML(message)}
            `;


    DOM.toast.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.classList.add(
                "opacity-0",
                "translate-y-2"
            );


            setTimeout(
                () => {

                    toast.remove();

                },
                300
            );

        },
        3000
    );

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

    /* -----------------------------------------
       ADD PRODUCT
    ------------------------------------------ */

    DOM.btnAdd?.addEventListener(
        "click",
        showAddForm
    );


    /* -----------------------------------------
       BACK
    ------------------------------------------ */

    DOM.btnBack?.addEventListener(
        "click",
        cancelForm
    );


    /* -----------------------------------------
       CANCEL
    ------------------------------------------ */

    DOM.btnCancel?.addEventListener(
        "click",
        cancelForm
    );


    /* -----------------------------------------
       FORM SUBMIT
    ------------------------------------------ */

    DOM.form?.addEventListener(
        "submit",
        saveProduct
    );


    /* -----------------------------------------
       CATEGORY CASCADE
    ------------------------------------------ */

    DOM.category?.addEventListener(
        "change",
        event => {

            updateSubCategories(
                event.target.value
            );

        }
    );


    /* -----------------------------------------
       SUBCATEGORY CASCADE
    ------------------------------------------ */

    DOM.subCategory?.addEventListener(
        "change",
        event => {

            updateFamilies(
                event.target.value
            );

        }
    );


    /* -----------------------------------------
       SEARCH
    ------------------------------------------ */

    let searchTimer;


    DOM.search?.addEventListener(
        "input",
        event => {

            clearTimeout(
                searchTimer
            );


            searchTimer =
                setTimeout(
                    () => {

                        state.searchQuery =
                            event.target.value
                                .trim();


                        state.currentPage =
                            1;


                        fetchProducts();

                    },
                    300
                );

        }
    );


    /* -----------------------------------------
       FILTER CATEGORY
    ------------------------------------------ */

    DOM.filterCategory?.addEventListener(
        "change",
        event => {

            state.filterCategoryId =
                event.target.value;


            state.currentPage =
                1;


            fetchProducts();

        }
    );


    /* -----------------------------------------
       FILTER INDUSTRY
    ------------------------------------------ */

    DOM.filterIndustry?.addEventListener(
        "change",
        event => {

            state.filterIndustryId =
                event.target.value;


            state.currentPage =
                1;


            fetchProducts();

        }
    );


    /* -----------------------------------------
       FILTER STOCK
    ------------------------------------------ */

    DOM.filterStock?.addEventListener(
        "change",
        event => {

            state.filterStock =
                event.target.value;


            state.currentPage =
                1;


            fetchProducts();

        }
    );


    /* -----------------------------------------
       TABLE ACTIONS
    ------------------------------------------ */

    DOM.tableBody?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (
                !button
            ) {

                return;

            }


            const id =
                button.dataset.id;


            const action =
                button.dataset.action;


            if (
                action === "edit"
            ) {

                editProduct(
                    id
                );

            }


            if (
                action === "delete"
            ) {

                deleteProduct(
                    id
                );

            }

        }
    );


    /* -----------------------------------------
       PAGINATION
    ------------------------------------------ */

    DOM.pagination?.addEventListener(
        "click",
        event => {

            const pageButton =
                event.target.closest(
                    "button[data-page]"
                );


            if (
                pageButton
            ) {

                const page =
                    Number(
                        pageButton.dataset.page
                    );


                if (
                    page &&
                    page !==
                    state.currentPage
                ) {

                    state.currentPage =
                        page;


                    fetchProducts();

                }


                return;

            }


            const actionButton =
                event.target.closest(
                    "button[data-page-action]"
                );


            if (
                !actionButton
            ) {

                return;

            }


            const totalPages =
                Math.ceil(
                    state.totalItems /
                    state.itemsPerPage
                );


            if (
                actionButton.dataset.pageAction ===
                "prev" &&
                state.currentPage > 1
            ) {

                state.currentPage--;

                fetchProducts();

            }


            if (
                actionButton.dataset.pageAction ===
                "next" &&
                state.currentPage <
                    totalPages
            ) {

                state.currentPage++;

                fetchProducts();

            }

        }
    );

}


/* =========================================================
   BACKWARD COMPATIBILITY
   ---------------------------------------------------------
   Giữ lại để những chỗ khác trong HTML/JS nếu đang gọi
   trực tiếp các function này thì không bị gãy.
========================================================= */

window.showAddForm =
    showAddForm;


window.cancelForm =
    cancelForm;


window.saveProduct =
    saveProduct;


window.editProduct =
    editProduct;


window.deleteProduct =
    deleteProduct;


window.fetchProducts =
    fetchProducts;