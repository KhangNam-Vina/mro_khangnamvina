// ========================================================
// FILE: assets/js/users/promotions.js
// TRANG SẢN PHẨM KHUYẾN MÃI
// ========================================================

const ITEMS_PER_PAGE = 24;

let currentSort = 'newest';

const PROMOTION_IMAGE_CDN_BASE =
    "https://mrokhangnam-image.khangnamvn.workers.dev";

function buildPromotionImageUrl(imagePath) {

    if (!imagePath) {
        return "../assets/images/world mark.png";
    }

    const cleanPath =
        String(imagePath).trim();

    if (!cleanPath) {
        return "../assets/images/world mark.png";
    }

    // An toàn trong giai đoạn chuyển đổi
    if (/^https?:\/\//i.test(cleanPath)) {
        return cleanPath;
    }

    return `${PROMOTION_IMAGE_CDN_BASE}/${cleanPath.replace(/^\/+/, "")}`;
}

// ========================================================
// UTILITY
// ========================================================

function escapePromotionHTML(value) {

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
// 1. FETCH PRODUCTS
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


    if (!container) {
        return;
    }


    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const categoryId =
        urlParams.get('category_id');

    const subCategoryId =
        urlParams.get('sub_category_id');

    const brandId =
        urlParams.get('brand_id');

    const searchQuery =
        urlParams.get('search');


    let currentPage = 1;


    if (urlParams.has('page')) {

        const parsed =
            parseInt(
                urlParams.get('page'),
                10
            );

        if (
            Number.isInteger(parsed) &&
            parsed > 0
        ) {
            currentPage =
                parsed;
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

        container.innerHTML =
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


        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }


        // ==================================================
        // QUERY CHỈ LẤY SẢN PHẨM GIẢM GIÁ
        // ==================================================

        let query =
    window.supabaseClient
        .from('products')
        .select(
            'id, sku, name, price, discount_price, image_path, unit, badge, category_id, sub_category_id, brand_id, created_at, brands(name)',
            {
                count: 'exact'
            }
        )
        .gt(
            'discount_price',
            0
        );


        // ==================================================
        // SEARCH
        // ==================================================

        if (searchQuery) {

            query =
                query.or(
                    `name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`
                );

            if (title) {
                title.textContent =
                    `Kết quả KM: "${searchQuery}"`;
            }

        } else if (title) {

            title.textContent =
                'Tất cả sản phẩm giảm giá';

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

        }


        // ==================================================
        // SORT
        // ==================================================

        if (
            currentSort === 'newest'
        ) {

            query =
                query.order(
                    'created_at',
                    {
                        ascending: false
                    }
                );

        } else if (
            currentSort === 'price_asc'
        ) {

            query =
                query.order(
                    'price',
                    {
                        ascending: true
                    }
                );

        } else if (
            currentSort === 'price_desc'
        ) {

            query =
                query.order(
                    'price',
                    {
                        ascending: false
                    }
                );

        } else if (
            currentSort === 'name_asc'
        ) {

            query =
                query.order(
                    'name',
                    {
                        ascending: true
                    }
                );

        }


        query =
            query.range(
                from,
                to
            );


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


        if (
            !data ||
            data.length === 0 ||
            count === 0
        ) {

            container.innerHTML = `
                <div class="promotion-empty">

                    <svg
                        class="promotion-empty-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                    </svg>

                    <p>
                        Hiện chưa có sản phẩm giảm giá nào
                        phù hợp với bộ lọc!
                    </p>

                    <a
                        href="promotions.html"
                        class="promotion-reset-button"
                    >
                        Xóa bộ lọc
                    </a>

                </div>
            `;

            return;
        }


        // ==================================================
        // RENDER PRODUCTS
        // ==================================================

        data.forEach(
            item => {

                const brandName =
                    item.brands
                        ? item.brands.name
                        : 'OEM';


                // ==================================================
                // DISCOUNT
                // ==================================================

                let percent = 0;

                if (
                    item.price &&
                    item.discount_price
                ) {

                    percent =
                        Math.round(
                            (
                                (
                                    item.price -
                                    item.discount_price
                                ) /
                                item.price
                            ) * 100
                        );

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

                    const badge =
                        item.badge
                            .trim()
                            .toUpperCase();


                    let badgeClass =
                        'product-badge-custom';


                    if (
                        badge === 'NEW'
                    ) {

                        badgeClass =
                            'product-badge-new';

                    } else if (
                        badge === 'HOT'
                    ) {

                        badgeClass =
                            'product-badge-hot';

                    } else if (
                        badge === 'SALE'
                    ) {

                        badgeClass =
                            'product-badge-sale-custom';

                    }


                    leftBadgeHtml = `
                        <span class="product-badge ${badgeClass}">
                            ${escapePromotionHTML(badge)}
                        </span>
                    `;

                }


                // ==================================================
                // PRODUCT CARD
                // ==================================================

                container.innerHTML += `
                    <article class="product-card promotion-product-card">

                        <a
                            href="product-detail.html?id=${encodeURIComponent(item.id)}"
                            class="product-card-image"
                        >

                            ${leftBadgeHtml}

                            <span class="product-badge promotion-discount-badge">
                                GIẢM ${percent}%
                            </span>


                            <img
                                src="${escapePromotionHTML(buildPromotionImageUrl(item.image_path))}"
                                alt="${escapePromotionHTML(item.name || '')}"
                                loading="lazy"
                                onerror="this.onerror=null;this.src='../assets/images/world mark.png';"
                            >

                        </a>


                        <div class="product-card-body promotion-product-body">

                            <div class="product-meta">

                                <span class="product-sku">
                                    ${escapePromotionHTML(item.sku || '')}
                                </span>

                                <span class="product-brand">
                                    ${escapePromotionHTML(brandName)}
                                </span>

                            </div>


                            <a
                                href="product-detail.html?id=${encodeURIComponent(item.id)}"
                                class="product-card-name-link"
                            >

                                <h3 class="product-card-name">
                                    ${escapePromotionHTML(item.name || '')}
                                </h3>

                            </a>


                            <div class="promotion-price-row">

                                <span class="product-unit">
                                    ĐVT:
                                    <strong>
                                        ${escapePromotionHTML(item.unit || '')}
                                    </strong>
                                </span>


                                <div class="product-price-discount">

                                    <span class="product-price-old">
                                        ${formatCurrency(item.price)}
                                    </span>

                                    <span class="product-price-sale">
                                        ${formatCurrency(item.discount_price)}
                                    </span>

                                </div>

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
            totalPages > 1 &&
            paginationContainer
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

                paginationContainer.innerHTML +=
                    page === currentPage
                        ? `
                            <span class="pagination-button pagination-current">
                                ${page}
                            </span>
                        `
                        : `
                            <a
                                href="${buildUrl(page)}"
                                class="pagination-button pagination-link"
                            >
                                ${page}
                            </a>
                        `;

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
            'Lỗi tải sản phẩm khuyến mãi:',
            error
        );

        container.innerHTML = `
            <div class="products-error">
                Lỗi:
                ${escapePromotionHTML(error.message)}
            </div>
        `;

    }

}


// ========================================================
// 2. SIDEBAR
// ========================================================

async function loadSidebar() {

    const catContainer =
        document.getElementById(
            'sidebarCategoryList'
        );

    const brandContainer =
        document.getElementById(
            'sidebarBrandList'
        );


    if (
        !catContainer ||
        !brandContainer
    ) {
        return;
    }


    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const currentSubIds =
        urlParams.get(
            'sub_category_id'
        )
            ? urlParams
                .get('sub_category_id')
                .split(',')
            : [];


    const currentBrandIds =
        urlParams.get(
            'brand_id'
        )
            ? urlParams
                .get('brand_id')
                .split(',')
            : [];


    try {

        const [
            catRes,
            brandRes,
            promoRes
        ] = await Promise.all([

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
                ),

            window.supabaseClient
                .from('brands')
                .select(
                    'id, name'
                )
                .order(
                    'name',
                    {
                        ascending: true
                    }
                ),

            window.supabaseClient
                .from('products')
                .select(
                    'sub_category_id, brand_id'
                )
                .gt(
                    'discount_price',
                    0
                )

        ]);


        if (catRes.error) {
            throw catRes.error;
        }

        if (brandRes.error) {
            throw brandRes.error;
        }

        if (promoRes.error) {
            throw promoRes.error;
        }


        const subCatCounts =
            {};

        const brandCounts =
            {};


        (promoRes.data || [])
            .forEach(
                product => {

                    if (
                        product.sub_category_id
                    ) {

                        subCatCounts[
                            product.sub_category_id
                        ] =
                            (
                                subCatCounts[
                                    product.sub_category_id
                                ] || 0
                            ) + 1;

                    }


                    if (
                        product.brand_id
                    ) {

                        brandCounts[
                            product.brand_id
                        ] =
                            (
                                brandCounts[
                                    product.brand_id
                                ] || 0
                            ) + 1;

                    }

                }
            );


        // ==================================================
        // RENDER LIST
        // ==================================================

        function renderList(
            dataList,
            selectedIds,
            filterKey,
            countMap
        ) {

            if (
                !dataList ||
                dataList.length === 0
            ) {

                return `
                    <p class="products-filter-empty">
                        Trống.
                    </p>
                `;

            }


            let html = '';


            dataList.forEach(
                item => {

                    const checked =
                        selectedIds.includes(
                            item.id.toString()
                        );


                    const count =
                        countMap[
                            item.id
                        ] || 0;


                    if (
                        count === 0 &&
                        !checked
                    ) {
                        return;
                    }


                    html += `
                        <label
                            class="products-filter-item"
                        >

                            <span class="products-filter-check-wrap">

                                <input
                                    type="checkbox"
                                    class="products-checkbox sidebar-filter-cb"
                                    value="${item.id}"
                                    data-name="${escapePromotionHTML(item.name)}"
                                    data-filter="${filterKey}"
                                    ${checked ? 'checked' : ''}
                                >

                                <span class="products-filter-name">
                                    ${escapePromotionHTML(item.name)}
                                </span>

                            </span>


                            <span class="products-filter-count">
                                ${count}
                            </span>

                        </label>
                    `;

                }
            );


            return html;

        }


        catContainer.innerHTML =
            renderList(
                catRes.data,
                currentSubIds,
                'sub_category_id',
                subCatCounts
            );


        brandContainer.innerHTML =
            renderList(
                brandRes.data,
                currentBrandIds,
                'brand_id',
                brandCounts
            );


        // ==================================================
        // CHECKBOX
        // ==================================================

        document
            .querySelectorAll(
                '.sidebar-filter-cb'
            )
            .forEach(
                checkbox => {

                    checkbox.addEventListener(
                        'change',
                        applySidebarFilter
                    );

                }
            );


        // ==================================================
        // LOCAL SEARCH
        // ==================================================

        setupLocalSearch(
            'searchSubcatLocal',
            catContainer
        );

        setupLocalSearch(
            'searchBrandLocal',
            brandContainer
        );


        renderActiveFilters();


    } catch (error) {

        console.error(
            'Lỗi tải Sidebar Promotion:',
            error
        );


        catContainer.innerHTML =
            '<span class="products-filter-error">Lỗi kết nối...</span>';

        brandContainer.innerHTML =
            '<span class="products-filter-error">Lỗi kết nối...</span>';

    }

}


// ========================================================
// 3. LOCAL SEARCH
// ========================================================

function setupLocalSearch(
    inputId,
    container
) {

    const input =
        document.getElementById(
            inputId
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        'input',
        event => {

            const keyword =
                event.target.value
                    .toLowerCase()
                    .trim();


            container
                .querySelectorAll(
                    '.products-filter-item'
                )
                .forEach(
                    item => {

                        item.classList.toggle(
                            'is-filter-hidden',
                            !item.textContent
                                .toLowerCase()
                                .includes(
                                    keyword
                                )
                        );

                    }
                );

        }
    );

}


// ========================================================
// 4. FILTER
// ========================================================

function applySidebarFilter() {

    const checkboxes =
        document.querySelectorAll(
            '.sidebar-filter-cb:checked'
        );


    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const subIds = [];
    const brandIds = [];


    checkboxes.forEach(
        checkbox => {

            const type =
                checkbox.dataset.filter;


            if (
                type ===
                'sub_category_id'
            ) {
                subIds.push(
                    checkbox.value
                );
            }


            if (
                type ===
                'brand_id'
            ) {
                brandIds.push(
                    checkbox.value
                );
            }

        }
    );


    if (
        subIds.length
    ) {

        urlParams.set(
            'sub_category_id',
            subIds.join(',')
        );

    } else {

        urlParams.delete(
            'sub_category_id'
        );

    }


    if (
        brandIds.length
    ) {

        urlParams.set(
            'brand_id',
            brandIds.join(',')
        );

    } else {

        urlParams.delete(
            'brand_id'
        );

    }


    urlParams.delete(
        'page'
    );


    window.location.search =
        urlParams.toString();

}


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


    const checked =
        document.querySelectorAll(
            '.sidebar-filter-cb:checked'
        );


    if (
        checked.length === 0
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


    checked.forEach(
        checkbox => {

            html += `
                <button
                    type="button"
                    class="active-filter-tag promotion-filter-tag"
                    data-filter="${escapePromotionHTML(checkbox.dataset.filter)}"
                    data-value="${escapePromotionHTML(checkbox.value)}"
                >

                    ${escapePromotionHTML(
                        checkbox.dataset.name
                    )}

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
            '.promotion-filter-tag'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        removeFilter(
                            button.dataset.filter,
                            button.dataset.value
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


    const values =
        urlParams.get(
            filterType
        )
            ? urlParams
                .get(filterType)
                .split(',')
            : [];


    const newValues =
        values.filter(
            id =>
                id !== idToRemove
        );


    if (
        newValues.length
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


// ========================================================
// 7. SORT
// ========================================================

function initSort() {

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
// 8. INIT
// ========================================================

window.addEventListener(
    'load',
    async () => {

        initSort();

        await loadSidebar();

        await fetchFilteredProducts();


        if (
            typeof window.checkCustomerAuth ===
            'function'
        ) {

            try {

                const user =
                    await window.checkCustomerAuth();


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