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

const ITEMS_PER_PAGE = 20;

let currentSort = 'newest';

const IMAGE_CDN_BASE =
    'https://mrokhangnam-image.khangnamvn.workers.dev';

function buildProductImageUrl(imagePath) {

    if (!imagePath) {
        return '../assets/images/world mark.png';
    }

    let path = String(imagePath)
        .trim()
        .replace(/^['"\[\]\n\r]+|['"\[\]\n\r]+$/g, '');

    if (!path) {
        return '../assets/images/world mark.png';
    }

    if (path.startsWith(IMAGE_CDN_BASE)) {
        return path;
    }

    const supabasePrefix =
        'https://wnhrkziiujbswnrfnlly.supabase.co/storage/v1/object/public/product-images/';

    if (path.startsWith(supabasePrefix)) {
        path = path.slice(
            supabasePrefix.length
        );
    }

    path = path.replace(
        /^\/+/,
        ''
    );

    return `${IMAGE_CDN_BASE}/${path}`;
}

const isLocal =
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost';

function buildProductDetailUrl(item) {
    if (!item?.slug) {
        return isLocal
            ? `product-detail.html?id=${encodeURIComponent(item?.id || '')}`
            : `/pages/product-detail.html?id=${encodeURIComponent(item?.id || '')}`;
    }

    return isLocal
        ? `/pages/product-detail.html?slug=${encodeURIComponent(item.slug)}`
        : `/${encodeURIComponent(item.slug)}.html`;
}

// ========================================================
// SEARCH HELPERS (ĐÃ FIX LỖI GIẤY / GIẦY)
// ========================================================

async function findProductIdsBySearch(searchText) {

    const trimmedSearch = String(searchText || '').trim().replace(/\s+/g, ' ');

    if (!trimmedSearch) {
        return null;
    }

    // 1. Smart Search: Kiểm tra xem từ khóa có chứa dấu tiếng Việt hay không?
    const hasAccents = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(trimmedSearch);

    // 2. Tạo tokens (băm từ khóa ra thành từng mảnh)
    let tokens = [];
    
    if (hasAccents) {
        // TRƯỜNG HỢP CÓ DẤU: Giữ nguyên từng chữ, chỉ viết thường
        tokens = trimmedSearch.toLowerCase().split(' ').filter(Boolean);
    } else {
        // TRƯỜNG HỢP KHÔNG DẤU: Lột sạch dấu phòng hờ để tìm tương đối
        const normalizedSearch = trimmedSearch
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase();
        tokens = normalizedSearch.split(' ').filter(Boolean);
    }

    if (tokens.length === 0) {
        return null;
    }

    let matchedProductIds = null;

    for (const token of tokens) {

        // ------------------------------------------------
        // 1. Tìm theo tên / search_name / SKU
        // ------------------------------------------------
        
        // Điều kiện BỌC THÉP: 
        // - CÓ DẤU -> Ép tìm ở cột 'name' gốc (Giấy != Giầy)
        // - KHÔNG DẤU -> Cho phép tìm ở cột 'search_name' (giay == giay)
        const orCondition = hasAccents 
            ? `name.ilike.%${token}%,sku.ilike.%${token}%` 
            : `search_name.ilike.%${token}%,search_sku.ilike.%${token}%`;

        const {
            data: productMatches,
            error: productError
        } = await window.supabaseClient
            .from('products')
            .select('id')
            .or(orCondition);

        if (productError) {
            throw productError;
        }

        let tokenProductIds =
            new Set(
                (productMatches || [])
                    .map(product => product.id)
                    .filter(Boolean)
            );


        // ------------------------------------------------
        // 2. Tìm theo BRAND
        // ------------------------------------------------

        const {
            data: brandMatches,
            error: brandError
        } = await window.supabaseClient
            .from('brands')
            .select('id, name')
            .ilike(
                'name',
                `%${token}%`
            );

        if (brandError) {
            throw brandError;
        }

        const brandIds =
            (brandMatches || [])
                .map(brand => brand.id)
                .filter(Boolean);


        if (brandIds.length > 0) {

            const {
                data: brandProducts,
                error: brandProductError
            } = await window.supabaseClient
                .from('products')
                .select('id')
                .in(
                    'brand_id',
                    brandIds
                );

            if (brandProductError) {
                throw brandProductError;
            }

            (brandProducts || []).forEach(
                product => {
                    if (product.id) {
                        tokenProductIds.add(
                            product.id
                        );
                    }
                }
            );
        }


        // ------------------------------------------------
        // 3. INTERSECTION giữa các token
        // ------------------------------------------------

        if (matchedProductIds === null) {

            matchedProductIds =
                tokenProductIds;

        } else {

            matchedProductIds =
                new Set(
                    [...matchedProductIds]
                        .filter(
                            id =>
                                tokenProductIds.has(id)
                        )
                );
        }

        // Không còn sản phẩm nào
        if (matchedProductIds.size === 0) {
            return [];
        }
    }

    return [...matchedProductIds];
}

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
// SEO META
// ========================================================

function updateProductsSEO({
    title,
    description,
    h1,
    canonicalUrl
}) {

    // ==============================
    // TITLE
    // ==============================

    if (title) {

        document.title =
            title;

        const ogTitle =
            document.getElementById(
                'ogTitle'
            );

        if (ogTitle) {

            ogTitle.setAttribute(
                'content',
                title
            );

        }

    }


    // ==============================
    // DESCRIPTION
    // ==============================

    if (description) {

        const metaDescription =
            document.getElementById(
                'metaDescription'
            );

        if (metaDescription) {

            metaDescription.setAttribute(
                'content',
                description
            );

        }


        const ogDescription =
            document.getElementById(
                'ogDescription'
            );

        if (ogDescription) {

            ogDescription.setAttribute(
                'content',
                description
            );

        }

    }


    // ==============================
    // CANONICAL
    // ==============================

    if (canonicalUrl) {

        let canonicalEl =
            document.querySelector(
                'link[rel="canonical"]'
            );

        if (!canonicalEl) {

            canonicalEl =
                document.createElement(
                    'link'
                );

            canonicalEl.rel =
                'canonical';

            document.head.appendChild(
                canonicalEl
            );

        }

        canonicalEl.href =
            canonicalUrl;


        const ogUrl =
            document.getElementById(
                'ogUrl'
            );

        if (ogUrl) {

            ogUrl.setAttribute(
                'content',
                canonicalUrl
            );

        }

    }


    // ==============================
    // H1
    // ==============================

    if (h1) {

        const heroTitle =
            document.getElementById(
                'catalogHeroTitle'
            );

        if (heroTitle) {

            heroTitle.textContent =
                h1;

        }

    }

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

const familySlug =
    urlParams.get(
        'slug'
    );



    const industryId =
        urlParams.get(
            'industry_id'
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

        // ==================================================
        // FAMILY SLUG → FAMILY ID
        // ==================================================

        let resolvedFamilyId =
            familyId || null;

        let familyInfo =
            null;

        if (familySlug) {

            const {
                data,
                error
            } = await window.supabaseClient
                .from('families')
                .select(
                    'id, name, slug, sub_category_id, sub_categories(name, slug, category_id, categories(name, slug))'
                )
                .eq(
                    'slug',
                    familySlug
                )
                .single();

            if (error) {
                throw error;
            }

            if (!data) {
                throw new Error(
                    'Không tìm thấy dòng sản phẩm.'
                );
            }

            familyInfo =
                data;

            resolvedFamilyId =
                data.id;

        }

        let pageTitleText =
            'Tất cả sản phẩm';

        let breadcrumbText =
            'Danh sách sản phẩm';

        let seoTitle =
            'Sản phẩm | MRO Khang Nam';

        let seoDescription =
            'Khám phá danh mục sản phẩm vật tư công nghiệp chính hãng tại MRO Khang Nam.';

        let seoH1 =
            'Sản phẩm';


        // ==================================================
        // FAMILY SEO URL
        // ==================================================

        const familyCanonicalUrl =
            familyInfo?.slug
                ? new URL(
                    `/${encodeURIComponent(
                        String(familyInfo.slug).trim()
                    )}.html`,
                    window.location.origin
                ).href
                : window.location.href.split('#')[0];

        const familySubCategory =
            familyInfo?.sub_categories || null;

        const familyCategory =
            familySubCategory?.categories || null;

                const familyName =
            familyInfo?.name ||
            'Dòng sản phẩm';

        const subCategoryName =
            familySubCategory?.name ||
            'Nhóm hàng';

        const categoryName =
            familyCategory?.name ||
            'Danh mục';

        const categorySlug =
            familyCategory?.slug ||
            '';

        const subCategorySlug =
            familySubCategory?.slug ||
            '';

        // ==================================================
        // SEARCH
        // ========================================================

if (searchQuery) {

    const trimmedSearch =
        searchQuery
            .trim()
            .replace(/\s+/g, ' ');


    if (trimmedSearch) {

        const searchProductIds =
            await findProductIdsBySearch(
                trimmedSearch
            );


        /*
         * Không có kết quả:
         *
         * .in('id', [])
         *
         * không nên gửi xuống Supabase.
         *
         * Dùng một ID chắc chắn không tồn tại
         * để trả về 0 sản phẩm.
         */
        if (
            Array.isArray(searchProductIds) &&
            searchProductIds.length === 0
        ) {

            query =
                query.eq(
                    'id',
                    '__NO_SEARCH_RESULT__'
                );

        } else if (
            Array.isArray(searchProductIds)
        ) {

            query =
                query.in(
                    'id',
                    searchProductIds
                );

        }
    }


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

        if (resolvedFamilyId) {

    query =
        query.eq(
            'family_id',
            resolvedFamilyId
        );

    if (
        !searchQuery
    ) {

        pageTitleText =
            familyInfo?.name ||
            'Sản phẩm cùng Dòng';

        breadcrumbText =
            familyInfo?.name ||
            'Family';


        seoH1 =
            familyName;


        seoTitle =
            `${familyName} | MRO Khang Nam`;


        seoDescription =
            `Khám phá các sản phẩm ${familyName} chính hãng tại MRO Khang Nam. Thông tin kỹ thuật, mã SKU và giải pháp vật tư công nghiệp cho doanh nghiệp.`;

    }

}


        // ==================================================
        // INDUSTRY
        // ==================================================

        if (industryId) {

            query =
                query.eq(
                    'industry_id',
                    industryId
                );

            if (
                !searchQuery
            ) {

                pageTitleText =
                    'Sản phẩm theo Ngành hàng';

                breadcrumbText =
                    'Ngành hàng';

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
        // PAGINATION QUERY
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

        updateProductsSEO({
        title: seoTitle,
        description: seoDescription,
        h1: seoH1,
        canonicalUrl: familyInfo
            ? familyCanonicalUrl
            : new URL(
                '/pages/products.html',
                window.location.origin
            ).href
    });

        // ==================================================
        // FAMILY BREADCRUMB + SEO
        // ==================================================

        if (familyInfo) {

        const existingJsonLd =
        document.getElementById(
            'familyBreadcrumbJsonLd'
        );

        if (existingJsonLd) {
            existingJsonLd.remove();
        }


        const breadcrumbItems = [

    {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item:
            `${window.location.origin}/`
    }

];


if (categorySlug) {

    breadcrumbItems.push({

        '@type': 'ListItem',

        position:
            breadcrumbItems.length + 1,

        name:
            categoryName,

        item:
            `${window.location.origin}/${encodeURIComponent(categorySlug)}.html`

    });

}


if (subCategorySlug) {

    breadcrumbItems.push({

        '@type': 'ListItem',

        position:
            breadcrumbItems.length + 1,

        name:
            subCategoryName,

        item:
            `${window.location.origin}/${encodeURIComponent(subCategorySlug)}.html`

    });

}


if (familyInfo?.slug) {

    breadcrumbItems.push({

        '@type': 'ListItem',

        position:
            breadcrumbItems.length + 1,

        name:
            familyName,

        item:
            familyCanonicalUrl

    });

}


const jsonLd =
    document.createElement('script');

jsonLd.type =
    'application/ld+json';

jsonLd.id =
    'familyBreadcrumbJsonLd';

jsonLd.textContent =
    JSON.stringify({

        '@context':
            'https://schema.org',

        '@type':
            'BreadcrumbList',

        itemListElement:
            breadcrumbItems

    });


document.head.appendChild(
    jsonLd
);

    // ------------------------------------------------
    // FAMILY BREADCRUMB
    // ------------------------------------------------

    const bcCategorySeparator =
    document.getElementById(
        'breadcrumbCategorySeparator'
    );

const bcSubCategorySeparator =
    document.getElementById(
        'breadcrumbSubCategorySeparator'
    );

const bcCategory =
    document.getElementById(
        'breadcrumbCategory'
    );

const bcSubCategory =
    document.getElementById(
        'breadcrumbSubCategory'
    );

const bcFamily =
    document.getElementById(
        'breadcrumbCurrent'
    );


   if (bcCategory && categorySlug) {

    bcCategory.textContent =
        categoryName;

    bcCategory.href =
        isLocal
            ? `/pages/subcategory.html?slug=${encodeURIComponent(categorySlug)}`
            : `/${encodeURIComponent(categorySlug)}.html`;

    bcCategory.classList.remove('is-hidden');

    if (bcCategorySeparator) {
        bcCategorySeparator.classList.remove('is-hidden');
    }

}

if (bcSubCategory && subCategorySlug) {

    bcSubCategory.textContent =
        subCategoryName;

    bcSubCategory.href =
    isLocal
        ? `/pages/family.html?slug=${encodeURIComponent(subCategorySlug)}`
        : `/${encodeURIComponent(subCategorySlug)}.html`;

    bcSubCategory.classList.remove('is-hidden');

    if (bcSubCategorySeparator) {
        bcSubCategorySeparator.classList.remove('is-hidden');
    }

}


    if (bcFamily) {

        bcFamily.textContent =
            familyName;

    }

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
                            href="${buildProductDetailUrl(item)}"
                            class="product-card-image"
                        >

                            ${leftBadgeHtml}

                            ${rightBadgeHtml}

                            <img
                                src="${escapeProductsHTML(
                                    buildProductImageUrl(
                                        item.image_path
                                    )
                                )}"
                                alt="${escapeProductsHTML(
                                    item.name || ''
                                )}"
                                loading="lazy"
                                onerror="this.onerror=null;this.src='../assets/images/world mark.png';"
                            >

                        </a>


                        <div class="product-card-body">

                            <div class="product-meta">

                                <span class="product-sku">
                                    ${escapeProductsHTML(
                                        item.sku || ''
                                    )}
                                </span>

                                <span class="product-brand">
                                    ${escapeProductsHTML(
                                        brandName
                                    )}
                                </span>

                            </div>


                            <a
                               href="${buildProductDetailUrl(item)}"
                                class="product-card-name-link"
                            >

                                <h3 class="product-card-name">
                                    ${escapeProductsHTML(
                                        item.name || ''
                                    )}
                                </h3>

                            </a>


                            <div class="product-card-footer">

                                <span class="product-unit">
                                    ĐVT:
                                    <strong>
                                        ${escapeProductsHTML(
                                            item.unit || ''
                                        )}
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


            let pages = [];


            // ==================================================
            // 7 TRANG TRỞ XUỐNG
            // ==================================================

            if (
                totalPages <= 7
            ) {

                for (
                    let page = 1;
                    page <= totalPages;
                    page++
                ) {

                    pages.push(
                        page
                    );

                }

            }


            // ==================================================
            // NHIỀU TRANG
            // ==================================================

            else {

                if (
                    currentPage <= 4
                ) {

                    pages = [
                        1,
                        2,
                        3,
                        4,
                        5,
                        '...',
                        totalPages
                    ];

                } else if (
                    currentPage >=
                    totalPages - 3
                ) {

                    pages = [
                        1,
                        '...',
                        totalPages - 4,
                        totalPages - 3,
                        totalPages - 2,
                        totalPages - 1,
                        totalPages
                    ];

                } else {

                    pages = [
                        1,
                        '...',
                        currentPage - 1,
                        currentPage,
                        currentPage + 1,
                        '...',
                        totalPages
                    ];

                }

            }


            // ==================================================
            // PREVIOUS
            // ==================================================

            if (
                currentPage > 1
            ) {

                paginationContainer.innerHTML += `
                    <a
                        href="${buildUrl(
                            currentPage - 1
                        )}"
                        class="pagination-button pagination-arrow"
                    >
                        &laquo;
                    </a>
                `;

            }


            // ==================================================
            // PAGE NUMBERS
            // ==================================================

            pages.forEach(
                page => {

                    if (
                        page === '...'
                    ) {

                        paginationContainer.innerHTML += `
                            <span
                                class="pagination-button pagination-ellipsis"
                            >
                                ...
                            </span>
                        `;

                        return;

                    }


                    if (
                        page === currentPage
                    ) {

                        paginationContainer.innerHTML += `
                            <span
                                class="pagination-button pagination-current"
                            >
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
            );


            // ==================================================
            // NEXT
            // ==================================================

            if (
                currentPage < totalPages
            ) {

                paginationContainer.innerHTML += `
                    <a
                        href="${buildUrl(
                            currentPage + 1
                        )}"
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

const familySlug =
    urlParams.get(
        'slug'
    );

    const subCategoryId =
        urlParams.get(
            'sub_category_id'
        );

    const categoryId =
        urlParams.get(
            'category_id'
        );

    const industryId =
        urlParams.get(
            'industry_id'
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
    // RESOLVE FAMILY SLUG → FAMILY ID
    // ==================================================

    let resolvedSidebarFamilyId =
        familyId || null;

    if (familySlug) {

        const {
            data: familyInfo,
            error: familyError
        } = await window.supabaseClient
            .from('families')
            .select(
                'id'
            )
            .eq(
                'slug',
                familySlug
            )
            .single();

        if (familyError) {
            throw familyError;
        }

        if (!familyInfo) {
            throw new Error(
                'Không tìm thấy dòng sản phẩm.'
            );
        }

        resolvedSidebarFamilyId =
            familyInfo.id;

    }


    // ==================================================
    // PRODUCT DATA FOR COUNTS
    // ==================================================

        let prodQuery =
            window.supabaseClient
                .from('products')
                .select(
                    'sub_category_id, brands(id, name)'
                );


        if (resolvedSidebarFamilyId) {

    prodQuery =
        prodQuery.eq(
            'family_id',
            resolvedSidebarFamilyId
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

        } else if (
            industryId
        ) {

            prodQuery =
                prodQuery.eq(
                    'industry_id',
                    industryId
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

        if (resolvedSidebarFamilyId) {

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
                                        data-name="${escapeProductsHTML(
                                            sub.name
                                        )}"
                                    >

                                    <span class="products-filter-name">
                                        ${escapeProductsHTML(
                                            sub.name
                                        )}
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
                                    data-name="${escapeProductsHTML(
                                        brand.name
                                    )}"
                                >

                                <span class="products-filter-name">
                                    ${escapeProductsHTML(
                                        brand.name
                                    )}
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
                    data-filter-type="${escapeProductsHTML(
                        filterType
                    )}"
                    data-filter-id="${escapeProductsHTML(
                        checkbox.value
                    )}"
                >

                    <span>
                        ${escapeProductsHTML(
                            name
                        )}
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
                                data-name="${escapeProductsHTML(
                                    brand.name
                                )}"
                            >

                            <span class="products-filter-name">
                                ${escapeProductsHTML(
                                    brand.name
                                )}
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