// ========================================================
// FILE: assets/js/products.js
// TRANG SẢN PHẨM
//
// - Lọc sản phẩm
// - Phân trang
// - Sắp xếp
// - Lọc Subcategory
// - Lọc Brand
// - Active Filters
// - Badge / Tồn kho / Giá
// ========================================================

const ITEMS_PER_PAGE = 16;

let currentSort = 'newest';


// ========================================================
// 1. UTILITY
// ========================================================

function escapeProductsHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return '';
    }

    const div =
        document.createElement('div');

    div.textContent =
        String(value);

    return div.innerHTML;
}


function formatCurrency(value) {

    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return 'Liên hệ';
    }

    return (
        new Intl.NumberFormat('vi-VN')
            .format(value)
        + ' đ'
    );
}


// ========================================================
// 2. FETCH PRODUCT
// ========================================================

async function fetchFilteredProducts() {

    const container =
        document.getElementById(
            'productGrid'
        );

    const paginationContainer =
        document.getElementById(
            'paginationContainer'
        );

    const title =
        document.getElementById(
            'pageTitle'
        );

    const countSpan =
        document.getElementById(
            'productCount'
        );

    const breadcrumbEl =
        document.getElementById(
            'breadcrumbCurrent'
        );


    if (
        !container ||
        !paginationContainer
    ) {
        return;
    }


    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const categoryId =
        urlParams.get(
            'category_id'
        );

    const subCategoryId =
        urlParams.get(
            'sub_category_id'
        );

    const brandId =
        urlParams.get(
            'brand_id'
        );

    const searchQuery =
        urlParams.get(
            'search'
        );

    const familyId =
        urlParams.get(
            'family_id'
        );


    let currentPage = 1;


    if (
        urlParams.has('page')
    ) {

        const parsedPage =
            parseInt(
                urlParams.get('page'),
                10
            );

        if (
            Number.isInteger(parsedPage) &&
            parsedPage > 0
        ) {
            currentPage =
                parsedPage;
        }

    }


    const from =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

    const to =
        from +
        ITEMS_PER_PAGE -
        1;


    try {

        // ==================================================
        // SKELETON
        // ==================================================

        const skeletonHtml =
            Array(8)
                .fill(null)
                .map(() => `
                    <div class="product-skeleton-card">

                        <div class="product-skeleton-image"></div>

                        <div class="product-skeleton-body">

                            <div class="product-skeleton-row">
                                <div class="product-skeleton-short"></div>
                                <div class="product-skeleton-short small"></div>
                            </div>

                            <div class="product-skeleton-line"></div>

                            <div class="product-skeleton-line medium"></div>

                            <div class="product-skeleton-bottom">

                                <div class="product-skeleton-tiny"></div>

                                <div class="product-skeleton-price"></div>

                            </div>

                        </div>

                    </div>
                `)
                .join('');


        container.innerHTML =
            skeletonHtml;

        paginationContainer.innerHTML =
            '';


        // ==================================================
        // QUERY
        // ==================================================

        let query =
            window.supabaseClient
                .from('products')
                .select(
                    '*, brands(name)',
                    {
                        count: 'exact'
                    }
                );


        let pageTitleText =
            'Tất cả sản phẩm';

        let breadcrumbText =
            'Danh sách sản phẩm';


        // ==================================================
        // SEARCH
        // ==================================================

        if (searchQuery) {

            query =
                query.or(
                    `name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`
                );

            pageTitleText =
                `Kết quả tìm kiếm: "${searchQuery}"`;

            breadcrumbText =
                'Tìm kiếm';

        }


        // ==================================================
        // CATEGORY
        // ==================================================

        if (categoryId) {

            query =
                query.eq(
                    'category_id',
                    categoryId
                );

            if (
                !searchQuery
            ) {

                pageTitleText =
                    'Sản phẩm theo Danh mục';

                breadcrumbText =
                    'Danh mục';

            }

        }


        // ==================================================
        // SUBCATEGORY
        // ==================================================

        if (subCategoryId) {

            if (
                subCategoryId.includes(',')
            ) {

                const idList =
                    subCategoryId
                        .split(',')
                        .map(
                            id =>
                                parseInt(
                                    id.trim(),
                                    10
                                )
                        )
                        .filter(
                            id =>
                                !Number.isNaN(id)
                        );


                if (
                    idList.length > 0
                ) {

                    query =
                        query.in(
                            'sub_category_id',
                            idList
                        );

                }

            } else {

                query =
                    query.eq(
                        'sub_category_id',
                        subCategoryId
                    );

            }


            if (
                !searchQuery &&
                !categoryId
            ) {

                pageTitleText =
                    'Sản phẩm đã lọc';

                breadcrumbText =
                    'Sản phẩm';

            }

        }


        // ==================================================
        // BRAND
        // ==================================================

        if (brandId) {

            if (
                brandId.includes(',')
            ) {

                const idList =
                    brandId
                        .split(',')
                        .map(
                            id =>
                                parseInt(
                                    id.trim(),
                                    10
                                )
                        )
                        .filter(
                            id =>
                                !Number.isNaN(id)
                        );


                if (
                    idList.length > 0
                ) {

                    query =
                        query.in(
                            'brand_id',
                            idList
                        );

                }

            } else {

                query =
                    query.eq(
                        'brand_id',
                        brandId
                    );

            }


            if (
                !searchQuery &&
                !categoryId &&
                !subCategoryId
            ) {

                pageTitleText =
                    'Sản phẩm theo Thương hiệu';

                breadcrumbText =
                    'Thương hiệu';

            }

        }


        // ==================================================
        // FAMILY
        // ==================================================

        if (familyId) {

            query =
                query.eq(
                    'family_id',
                    familyId
                );


            if (
                !searchQuery
            ) {

                pageTitleText =
                    'Sản phẩm cùng Dòng';

                breadcrumbText =
                    'Family';

            }

        }


        // ==================================================
        // SORT
        // ==================================================

        if (
            currentSort ===
            'newest'
        ) {

            query =
                query.order(
                    'created_at',
                    {
                        ascending: false
                    }
                );

        } else if (
            currentSort ===
            'price_asc'
        ) {

            query =
                query.order(
                    'price',
                    {
                        ascending: true
                    }
                );

        } else if (
            currentSort ===
            'price_desc'
        ) {

            query =
                query.order(
                    'price',
                    {
                        ascending: false
                    }
                );

        } else if (
            currentSort ===
            'name_asc'
        ) {

            query =
                query.order(
                    'name',
                    {
                        ascending: true
                    }
                );

        }


        // ==================================================
        // PAGINATION
        // ==================================================

        query =
            query.range(
                from,
                to
            );


        if (title) {
            title.textContent =
                pageTitleText;
        }


        if (breadcrumbEl) {
            breadcrumbEl.textContent =
                breadcrumbText;
        }


        // ==================================================
        // EXECUTE
        // ==================================================

        const {
            data,
            error,
            count
        } = await query;


        if (error) {
            throw error;
        }


        if (countSpan) {

            countSpan.textContent =
                count || 0;

        }


        container.innerHTML =
            '';

        paginationContainer.innerHTML =
            '';


        // ==================================================
        // EMPTY
        // ==================================================

        if (
            count === 0 ||
            !data ||
            data.length === 0
        ) {

            container.innerHTML = `
                <div class="products-empty">
                    Không tìm thấy sản phẩm nào phù hợp!
                </div>
            `;

            return;
        }


        // ==================================================
        // RENDER PRODUCT
        // ==================================================

        data.forEach(
            item => {

                const brandName =
                    item.brands
                        ? item.brands.name
                        : 'OEM';


                let priceHtml =
                    '';


                let rightBadgeHtml =
                    '';


                // ==================================================
                // PRICE / STOCK
                // ==================================================

                if (
                    item.discount_price &&
                    item.discount_price > 0 &&
                    item.discount_price < item.price
                ) {

                    const percent =
                        Math.round(
                            (
                                (
                                    item.price -
                                    item.discount_price
                                ) /
                                item.price
                            ) * 100
                        );


                    rightBadgeHtml = `
                        <span class="product-badge product-badge-sale">
                            GIẢM ${percent}%
                        </span>
                    `;


                    priceHtml = `
                        <div class="product-price-discount">

                            <span class="product-price-old">
                                ${formatCurrency(item.price)}
                            </span>

                            <span class="product-price-sale">
                                ${formatCurrency(item.discount_price)}
                            </span>

                        </div>
                    `;

                } else {

                    if (
                        item.stock_quantity !==
                        undefined &&
                        item.stock_quantity <= 0
                    ) {

                        rightBadgeHtml = `
                            <span class="product-badge product-badge-preorder">
                                Pre-order
                            </span>
                        `;

                    } else {

                        rightBadgeHtml = `
                            <span class="product-badge product-badge-stock">
                                Có sẵn
                            </span>
                        `;

                    }


                    const normalPrice =
                        item.price
                            ? formatCurrency(item.price)
                            : 'Liên hệ';


                    priceHtml = `
                        <span class="product-price-normal">
                            ${normalPrice}
                        </span>
                    `;

                }


                // ==================================================
                // CUSTOM BADGE
                // ==================================================

                let leftBadgeHtml =
                    '';


                if (
                    item.badge &&
                    item.badge.trim() !== ''
                ) {

                    const badgeVal =
                        item.badge
                            .trim()
                            .toUpperCase();


                    let badgeType =
                        'product-badge-custom';


                    if (
                        badgeVal === 'NEW'
                    ) {
                        badgeType =
                            'product-badge-new';

                    } else if (
                        badgeVal === 'HOT'
                    ) {
                        badgeType =
                            'product-badge-hot';

                    } else if (
                        badgeVal === 'SALE'
                    ) {
                        badgeType =
                            'product-badge-sale-custom';

                    } else if (
                        badgeVal === 'BEST SELLER'
                    ) {
                        badgeType =
                            'product-badge-best';

                    } else if (
                        badgeVal === 'CLEARANCE'
                    ) {
                        badgeType =
                            'product-badge-clearance';
                    }


                    leftBadgeHtml = `
                        <span class="product-badge ${badgeType}">
                            ${escapeProductsHTML(badgeVal)}
                        </span>
                    `;

                }


                // ==================================================
                // PRODUCT CARD
                // ==================================================

                container.innerHTML += `
                    <article class="product-card">

                        <a
                            href="product-detail.html?id=${encodeURIComponent(item.id)}"
                            class="product-card-image"
                        >

                            ${leftBadgeHtml}

                            ${rightBadgeHtml}

                            <img
                                src="${escapeProductsHTML(item.image_url || '')}"
                                alt="${escapeProductsHTML(item.name || '')}"
                                loading="lazy"
                                onerror="this.onerror=null;this.src='../assets/images/world mark.png';"
                            >

                        </a>


                        <div class="product-card-body">

                            <div class="product-meta">

                                <span class="product-sku">
                                    ${escapeProductsHTML(item.sku || '')}
                                </span>

                                <span class="product-brand">
                                    ${escapeProductsHTML(brandName)}
                                </span>

                            </div>


                            <a
                                href="product-detail.html?id=${encodeURIComponent(item.id)}"
                                class="product-card-name-link"
                            >

                                <h3 class="product-card-name">
                                    ${escapeProductsHTML(item.name || '')}
                                </h3>

                            </a>


                            <div class="product-card-footer">

                                <span class="product-unit">
                                    ĐVT:
                                    <strong>
                                        ${escapeProductsHTML(item.unit || '')}
                                    </strong>
                                </span>

                                ${priceHtml}

                            </div>

                        </div>

                    </article>
                `;

            }
        );


        // ==================================================
        // PAGINATION
        // ==================================================

        const totalPages =
            Math.ceil(
                count /
                ITEMS_PER_PAGE
            );


        if (
            totalPages > 1
        ) {

            const buildUrl =
                page => {

                    const newParams =
                        new URLSearchParams(
                            window.location.search
                        );

                    newParams.set(
                        'page',
                        page
                    );

                    return (
                        window.location.pathname +
                        '?' +
                        newParams.toString()
                    );

                };


            if (
                currentPage > 1
            ) {

                paginationContainer.innerHTML += `
                    <a
                        href="${buildUrl(currentPage - 1)}"
                        class="pagination-button pagination-arrow"
                    >
                        &laquo;
                    </a>
                `;

            }


            for (
                let page = 1;
                page <= totalPages;
                page++
            ) {

                if (
                    page === currentPage
                ) {

                    paginationContainer.innerHTML += `
                        <span class="pagination-button pagination-current">
                            ${page}
                        </span>
                    `;

                } else {

                    paginationContainer.innerHTML += `
                        <a
                            href="${buildUrl(page)}"
                            class="pagination-button pagination-link"
                        >
                            ${page}
                        </a>
                    `;

                }

            }


            if (
                currentPage < totalPages
            ) {

                paginationContainer.innerHTML += `
                    <a
                        href="${buildUrl(currentPage + 1)}"
                        class="pagination-button pagination-arrow"
                    >
                        &raquo;
                    </a>
                `;

            }

        }


    } catch (error) {

        console.error(
            'Lỗi tải sản phẩm:',
            error
        );


        container.innerHTML = `
            <div class="products-error">
                Lỗi:
                ${escapeProductsHTML(
                    error.message
                )}
            </div>
        `;

    }
}


// ========================================================
// 3. LOAD SIDEBAR
// ========================================================

async function loadSidebar() {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const familyId =
        urlParams.get(
            'family_id'
        );

    const subCategoryId =
        urlParams.get(
            'sub_category_id'
        );

    const categoryId =
        urlParams.get(
            'category_id'
        );


    const filterCategoryBlock =
        document.getElementById(
            'filterCategoryBlock'
        );

    const subCatContainer =
        document.getElementById(
            'subCategoryFilterContainer'
        );

    const brandContainer =
        document.getElementById(
            'brandFilterContainer'
        );


    if (
        !brandContainer ||
        !subCatContainer
    ) {
        return;
    }


    try {

        // ==================================================
        // PRODUCT DATA FOR COUNTS
        // ==================================================

        let prodQuery =
            window.supabaseClient
                .from('products')
                .select(
                    'sub_category_id, brands(id, name)'
                );


        if (familyId) {

            prodQuery =
                prodQuery.eq(
                    'family_id',
                    familyId
                );

        } else if (
            subCategoryId
        ) {

            const idList =
                subCategoryId
                    .split(',')
                    .map(
                        id =>
                            parseInt(
                                id.trim(),
                                10
                            )
                    )
                    .filter(
                        id =>
                            !Number.isNaN(id)
                    );


            if (
                idList.length > 0
            ) {

                prodQuery =
                    prodQuery.in(
                        'sub_category_id',
                        idList
                    );

            }

        } else if (
            categoryId
        ) {

            prodQuery =
                prodQuery.eq(
                    'category_id',
                    categoryId
                );

        }


        const {
            data: prodData,
            error: prodError
        } = await prodQuery;


        if (prodError) {
            throw prodError;
        }


        const subCatCounts =
            {};

        const brandCounts =
            {};

        const uniqueBrands =
            [];

        const brandIds =
            new Set();


        if (prodData) {

            prodData.forEach(
                item => {

                    if (
                        item.sub_category_id
                    ) {

                        subCatCounts[
                            item.sub_category_id
                        ] =
                            (
                                subCatCounts[
                                    item.sub_category_id
                                ] || 0
                            ) + 1;

                    }


                    if (
                        item.brands &&
                        item.brands.id
                    ) {

                        brandCounts[
                            item.brands.id
                        ] =
                            (
                                brandCounts[
                                    item.brands.id
                                ] || 0
                            ) + 1;


                        if (
                            !brandIds.has(
                                item.brands.id
                            )
                        ) {

                            brandIds.add(
                                item.brands.id
                            );

                            uniqueBrands.push(
                                item.brands
                            );

                        }

                    }

                }
            );

        }


        // ==================================================
        // SUBCATEGORY SEARCH
        // ==================================================

        const searchSubcatLocal =
            document.getElementById(
                'searchSubcatLocal'
            );


        if (
            searchSubcatLocal
        ) {

            searchSubcatLocal.addEventListener(
                'input',
                event => {

                    const keyword =
                        event.target.value
                            .toLowerCase()
                            .trim();


                    subCatContainer
                        .querySelectorAll(
                            '.products-filter-item'
                        )
                        .forEach(
                            item => {

                                const text =
                                    item.textContent
                                        .toLowerCase();


                                item.classList.toggle(
                                    'is-filter-hidden',
                                    !text.includes(
                                        keyword
                                    )
                                );

                            }
                        );

                }
            );

        }


        // ==================================================
        // BRAND SEARCH
        // ==================================================

        const searchBrandLocal =
            document.getElementById(
                'searchBrandLocal'
            );


        if (
            searchBrandLocal
        ) {

            searchBrandLocal.addEventListener(
                'input',
                event => {

                    const keyword =
                        event.target.value
                            .toLowerCase()
                            .trim();


                    brandContainer
                        .querySelectorAll(
                            '.products-filter-item'
                        )
                        .forEach(
                            item => {

                                const text =
                                    item.textContent
                                        .toLowerCase();


                                item.classList.toggle(
                                    'is-filter-hidden',
                                    !text.includes(
                                        keyword
                                    )
                                );

                            }
                        );

                }
            );

        }


        // ==================================================
        // SUBCATEGORY RENDER
        // ==================================================

        if (familyId) {

            filterCategoryBlock?.classList.add(
                'is-hidden'
            );

        } else {

            filterCategoryBlock?.classList.remove(
                'is-hidden'
            );


            let subQuery =
                window.supabaseClient
                    .from('sub_categories')
                    .select(
                        'id, name'
                    )
                    .order(
                        'name',
                        {
                            ascending: true
                        }
                    );


            if (categoryId) {

                subQuery =
                    subQuery.eq(
                        'category_id',
                        categoryId
                    );

            }


            const {
                data: subCats
            } =
                await subQuery;


            const currentSubIds =
                subCategoryId
                    ? subCategoryId.split(',')
                    : [];


            let subHtml =
                '';


            if (
                subCats &&
                subCats.length > 0
            ) {

                subCats.forEach(
                    sub => {

                        const isChecked =
                            currentSubIds.includes(
                                sub.id.toString()
                            );


                        const count =
                            subCatCounts[
                                sub.id
                            ] || 0;


                        subHtml += `
                            <label
                                class="products-filter-item"
                            >

                                <span class="products-filter-check-wrap">

                                    <input
                                        type="checkbox"
                                        value="${sub.id}"
                                        ${isChecked ? 'checked' : ''}
                                        class="sidebar-filter-cb products-checkbox"
                                        data-filter="sub_category_id"
                                        data-name="${escapeProductsHTML(sub.name)}"
                                    >

                                    <span class="products-filter-name">
                                        ${escapeProductsHTML(sub.name)}
                                    </span>

                                </span>

                                <span class="products-filter-count">
                                    ${count}
                                </span>

                            </label>
                        `;

                    }
                );

            } else {

                subHtml = `
                    <p class="products-filter-empty">
                        Không có phân loại nào.
                    </p>
                `;

            }


            subCatContainer.innerHTML =
                subHtml;

        }


        // ==================================================
        // BRAND RENDER
        // ==================================================

        uniqueBrands.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        );


        const selectedBrandIds =
            urlParams.get(
                'brand_id'
            )
                ? urlParams
                    .get('brand_id')
                    .split(',')
                : [];


        let brandHtml =
            '';


        if (
            uniqueBrands.length === 0
        ) {

            brandHtml = `
                <p class="products-filter-empty">
                    Chưa có thương hiệu nào.
                </p>
            `;

        } else {

            uniqueBrands.forEach(
                brand => {

                    const isChecked =
                        selectedBrandIds.includes(
                            brand.id.toString()
                        );


                    const count =
                        brandCounts[
                            brand.id
                        ] || 0;


                    brandHtml += `
                        <label
                            class="products-filter-item"
                        >

                            <span class="products-filter-check-wrap">

                                <input
                                    type="checkbox"
                                    value="${brand.id}"
                                    ${isChecked ? 'checked' : ''}
                                    class="sidebar-filter-cb products-checkbox"
                                    data-filter="brand_id"
                                    data-name="${escapeProductsHTML(brand.name)}"
                                >

                                <span class="products-filter-name">
                                    ${escapeProductsHTML(brand.name)}
                                </span>

                            </span>

                            <span class="products-filter-count">
                                ${count}
                            </span>

                        </label>
                    `;

                }
            );

        }


        brandContainer.innerHTML =
            brandHtml;


        // ==================================================
        // REGISTER CHECKBOX EVENTS
        // ==================================================

        document
            .querySelectorAll(
                '.sidebar-filter-cb'
            )
            .forEach(
                checkbox => {

                    checkbox.addEventListener(
                        'change',
                        () => {

                            toggleFilter(
                                checkbox.dataset.filter,
                                checkbox.value
                            );

                        }
                    );

                }
            );


        renderActiveFilters();


    } catch (error) {

        console.error(
            'Lỗi tải Sidebar:',
            error
        );


        brandContainer.innerHTML = `
            <p class="products-filter-error">
                Lỗi tải dữ liệu.
            </p>
        `;

    }

}


// ========================================================
// 4. TOGGLE FILTER
// ========================================================

function toggleFilter(
    filterType,
    value
) {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    let currentValues =
        urlParams.get(
            filterType
        )
            ? urlParams
                .get(filterType)
                .split(',')
            : [];


    if (
        currentValues.includes(
            value
        )
    ) {

        currentValues =
            currentValues.filter(
                valueItem =>
                    valueItem !== value
            );

    } else {

        currentValues.push(
            value
        );

    }


    if (
        currentValues.length > 0
    ) {

        urlParams.set(
            filterType,
            currentValues.join(',')
        );

    } else {

        urlParams.delete(
            filterType
        );

    }


    urlParams.delete(
        'page'
    );


    window.location.search =
        urlParams.toString();
}


window.toggleFilter =
    toggleFilter;


// ========================================================
// 5. ACTIVE FILTERS
// ========================================================

function renderActiveFilters() {

    const container =
        document.getElementById(
            'activeFiltersContainer'
        );


    if (!container) {
        return;
    }


    const checkboxes =
        document.querySelectorAll(
            '.sidebar-filter-cb:checked'
        );


    if (
        checkboxes.length === 0
    ) {

        container.innerHTML =
            '';

        return;
    }


    let html = `
        <span class="active-filter-label">
            Đang lọc:
        </span>
    `;


    checkboxes.forEach(
        checkbox => {

            const filterType =
                checkbox.dataset.filter;

            const name =
                checkbox.dataset.name ||
                '';


            html += `
                <button
                    type="button"
                    class="active-filter-tag"
                    data-filter-type="${escapeProductsHTML(filterType)}"
                    data-filter-id="${escapeProductsHTML(checkbox.value)}"
                >

                    <span>
                        ${escapeProductsHTML(name)}
                    </span>

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
                            d="M6 18L18 6M6 6l12 12"
                        ></path>
                    </svg>

                </button>
            `;

        }
    );


    container.innerHTML =
        html;


    container
        .querySelectorAll(
            '.active-filter-tag'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        removeFilter(
                            button.dataset.filterType,
                            button.dataset.filterId
                        );

                    }
                );

            }
        );

}


// ========================================================
// 6. REMOVE FILTER
// ========================================================

function removeFilter(
    filterType,
    idToRemove
) {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const currentValues =
        urlParams.get(
            filterType
        )
            ? urlParams
                .get(filterType)
                .split(',')
            : [];


    const newValues =
        currentValues.filter(
            id =>
                id !== idToRemove
        );


    if (
        newValues.length > 0
    ) {

        urlParams.set(
            filterType,
            newValues.join(',')
        );

    } else {

        urlParams.delete(
            filterType
        );

    }


    urlParams.delete(
        'page'
    );


    window.location.search =
        urlParams.toString();
}


window.removeFilter =
    removeFilter;


// ========================================================
// 7. DYNAMIC BRANDS
// ========================================================

async function loadDynamicBrands(
    familyId,
    subCategoryId,
    categoryId
) {

    const brandContainer =
        document.getElementById(
            'brandFilterContainer'
        );


    if (!brandContainer) {
        return;
    }


    try {

        brandContainer.innerHTML = `
            <p class="products-filter-loading">
                Đang quét thương hiệu...
            </p>
        `;


        let query =
            window.supabaseClient
                .from('products')
                .select(
                    'brands(id, name)'
                );


        if (familyId) {

            query =
                query.eq(
                    'family_id',
                    familyId
                );

        } else if (
            subCategoryId
        ) {

            query =
                query.eq(
                    'sub_category_id',
                    subCategoryId
                );

        } else if (
            categoryId
        ) {

            query =
                query.eq(
                    'category_id',
                    categoryId
                );

        }


        const {
            data,
            error
        } = await query;


        if (error) {
            throw error;
        }


        const uniqueBrands =
            [];

        const brandIds =
            new Set();


        data.forEach(
            item => {

                if (
                    item.brands &&
                    item.brands.id &&
                    !brandIds.has(
                        item.brands.id
                    )
                ) {

                    brandIds.add(
                        item.brands.id
                    );

                    uniqueBrands.push(
                        item.brands
                    );

                }

            }
        );


        if (
            uniqueBrands.length === 0
        ) {

            brandContainer.innerHTML = `
                <p class="products-filter-empty">
                    Không có dữ liệu thương hiệu.
                </p>
            `;

            return;
        }


        uniqueBrands.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        );


        const urlParams =
            new URLSearchParams(
                window.location.search
            );


        const selectedBrands =
            urlParams.get(
                'brand_id'
            )
                ? urlParams
                    .get('brand_id')
                    .split(',')
                : [];


        let html =
            '';


        uniqueBrands.forEach(
            brand => {

                const isChecked =
                    selectedBrands.includes(
                        brand.id.toString()
                    );


                html += `
                    <label
                        class="products-filter-item products-filter-item-simple"
                    >

                        <span class="products-filter-check-wrap">

                            <input
                                type="checkbox"
                                value="${brand.id}"
                                ${isChecked ? 'checked' : ''}
                                class="sidebar-filter-cb products-checkbox"
                                data-filter="brand_id"
                                data-name="${escapeProductsHTML(brand.name)}"
                            >

                            <span class="products-filter-name">
                                ${escapeProductsHTML(brand.name)}
                            </span>

                        </span>

                    </label>
                `;

            }
        );


        brandContainer.innerHTML =
            html;


        brandContainer
            .querySelectorAll(
                '.sidebar-filter-cb'
            )
            .forEach(
                checkbox => {

                    checkbox.addEventListener(
                        'change',
                        () => {

                            toggleFilter(
                                checkbox.dataset.filter,
                                checkbox.value
                            );

                        }
                    );

                }
            );


    } catch (error) {

        console.error(
            'Lỗi tải Brand động:',
            error
        );


        brandContainer.innerHTML = `
            <p class="products-filter-error">
                Lỗi tải dữ liệu.
            </p>
        `;

    }

}


// ========================================================
// 8. SORT
// ========================================================

function initSortDropdown() {

    const sortDropdown =
        document.getElementById(
            'sortDropdown'
        );


    if (!sortDropdown) {
        return;
    }


    sortDropdown.addEventListener(
        'change',
        function () {

            currentSort =
                this.value;


            const urlParams =
                new URLSearchParams(
                    window.location.search
                );


            urlParams.delete(
                'page'
            );


            const newUrl =
                window.location.pathname +
                (
                    urlParams.toString()
                        ? '?' +
                          urlParams.toString()
                        : ''
                );


            window.history.replaceState(
                {},
                '',
                newUrl
            );


            fetchFilteredProducts();

        }
    );

}


// ========================================================
// 9. INIT
// ========================================================

window.addEventListener(
    'load',
    async () => {

        initSortDropdown();

        await loadSidebar();

        await fetchFilteredProducts();


        if (
            typeof checkCustomerAuth ===
            'function'
        ) {

            try {

                const user =
                    await checkCustomerAuth();


                if (user) {

                    document
                        .getElementById(
                            'btnGuestLogin'
                        )
                        ?.classList.add(
                            'is-hidden'
                        );


                    document
                        .getElementById(
                            'btnUserProfile'
                        )
                        ?.classList.remove(
                            'is-hidden'
                        );

                }

            } catch (error) {

                console.error(
                    'Lỗi xác thực:',
                    error
                );

            }

        }

    }
);