// ========================================================
// FILE: assets/js/index.js
// TRANG CHỦ MRO KHANG NAM
// ========================================================

// ========================================================
// 1. TẠO CATEGORY CHÍNH
// ========================================================

async function loadMainCategories() {

    const grid =
        document.getElementById(
            "categoryGrid"
        );

    if (!grid) return;


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from('categories')
                .select('*, sub_categories(*)')
                .order(
                    'name',
                    {
                        ascending: true
                    }
                );


        if (error) {
            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {

            grid.innerHTML = `
                <p
                    class="cat-empty"
                    style="
                        grid-column:1/-1;
                        text-align:center;
                    "
                >
                    Chưa có danh mục nào trong kho!
                </p>
            `;

            return;
        }


        let html = '';


        data.forEach(
            cat => {

                let subCatListHTML =
                    '';


                // ==================================================
                // SORT SUBCATEGORY A → Z
                // ==================================================

                const sortedSubCategories =
                    Array.isArray(
                        cat.sub_categories
                    )
                        ? [
                            ...cat.sub_categories
                        ].sort(
                            (a, b) =>
                                String(
                                    a.name || ''
                                ).localeCompare(
                                    String(
                                        b.name || ''
                                    ),
                                    'vi',
                                    {
                                        sensitivity:
                                            'base'
                                    }
                                )
                        )
                        : [];


                // ==================================================
                // HIỂN THỊ 4 SUBCATEGORY
                // ==================================================

                if (
                    sortedSubCategories.length > 0
                ) {

                    const limitSubs =
                        sortedSubCategories
                            .slice(
                                0,
                                4
                            );


                    limitSubs.forEach(
                        sub => {

                            subCatListHTML += `
                                <li class="category-item">

                                    <span
                                        class="category-dot"
                                    ></span>

                                    <a
                                        href="pages/family.html?slug=${encodeURIComponent(sub.slug)}"
                                        class="category-link"
                                        title="${escapeIndexHTML(sub.name)}"
                                    >
                                        ${escapeIndexHTML(sub.name)}
                                    </a>

                                </li>
                            `;

                        }
                    );

                } else {

                    subCatListHTML =
                        `
                        <li class="cat-empty">
                            Đang cập nhật...
                        </li>
                        `;

                }


                // ==================================================
                // INITIALS
                // ==================================================

                const initials =
                    String(
                        cat.name || ''
                    )
                        .trim()
                        .split(/\s+/)
                        .slice(
                            0,
                            3
                        )
                        .map(
                            word =>
                                word[0]
                        )
                        .join('')
                        .toUpperCase();


                // ==================================================
                // CATEGORY CARD
                // ==================================================

                html += `
                    <div
                        class="category-card"
                    >

                        <div class="category-watermark">
                            ${escapeIndexHTML(initials)}
                        </div>


                        <div class="category-header">

                            <h3 class="category-title">
                                <a
                                    href="pages/subcategory.html?slug=${encodeURIComponent(cat.slug)}"
                                    class="category-title-link"
                                >
                                    ${escapeIndexHTML(cat.name)}
                                </a>
                            </h3>

                            <div class="category-divider"></div>

                        </div>


                        <ul class="category-list">
                            ${subCatListHTML}
                        </ul>

                    </div>
                `;

            }
        );


        grid.innerHTML =
            html;


    } catch (error) {

        console.error(
            "Lỗi tải Category:",
            error
        );


        grid.innerHTML = `
            <p
                class="cat-empty"
                style="
                    grid-column:1/-1;
                    text-align:center;
                    color:red;
                "
            >
                Lỗi mạng:
                ${escapeIndexHTML(
                    error.message
                )}
            </p>
        `;

    }

}


// ========================================================
// 2. KÉO THƯƠNG HIỆU
// ========================================================

async function loadBrandsToMarquee() {

    const container =
        document.getElementById(
            'brandScrollContainer'
        );

    if (!container) return;


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from('brands')
                .select('*');


        if (error) {
            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {

            container.innerHTML = `
                <span class="brand-marquee-loading">
                    Chưa có thương hiệu nào.
                </span>
            `;

            return;
        }


        let brandItemsHTML =
            '';


        data.forEach(
            brand => {

                brandItemsHTML += `
                    <a
                        href="pages/products.html?brand_id=${encodeURIComponent(brand.id)}"
                        class="brand-link"
                    >
                        ${escapeIndexHTML(brand.name)}
                    </a>
                `;

            }
        );


        container.innerHTML = `
            <div class="brand-track-group">
                ${brandItemsHTML}
            </div>

            <div
                class="brand-track-group"
                aria-hidden="true"
            >
                ${brandItemsHTML}
            </div>
        `;


        initDragAndScroll(
            'brandScrollContainer',
            1.5
        );


    } catch (error) {

        container.innerHTML = `
            <span
                class="brand-marquee-loading"
                style="color:#fca5a5;"
            >
                Lỗi tải dữ liệu:
                ${escapeIndexHTML(
                    error.message
                )}
            </span>
        `;

    }

}


// ========================================================
// 3. PRODUCT IMAGE CDN
// ========================================================

const INDEX_IMAGE_CDN_BASE =
    "https://mrokhangnam-image.khangnamvn.workers.dev";


function buildIndexImageUrl(
    imagePath
) {

    if (!imagePath) {

        return "../assets/images/world mark.png";

    }


    const cleanPath =
        String(
            imagePath
        ).trim();


    if (!cleanPath) {

        return "../assets/images/world mark.png";

    }


    if (
        /^https?:\/\//i.test(
            cleanPath
        )
    ) {

        return cleanPath;

    }


    return `${INDEX_IMAGE_CDN_BASE}/${cleanPath.replace(/^\/+/, "")}`;

}


// ========================================================
// 4. PRODUCT SHOWCASE
// ========================================================

const INDEX_PRODUCT_LIMIT = 20;


// ========================================================
// PRODUCT QUERY
// Dùng chung cho Best Seller + Category Showcase
// ========================================================

async function fetchProductsByCategory(categoryId = null) {

    let query = window.supabaseClient
        .from('products')
        .select(`
            id,
            sku,
            name,
            slug,
            image_path,
            unit,
            category_id,
            stock_quantity,
            price,
            discount_price,
            badge,
            created_at,
            brands(name)
        `)
        .order('created_at', {
            ascending: false
        })
        .limit(INDEX_PRODUCT_LIMIT);


    if (categoryId) {

        query = query.eq(
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


    return data || [];

}


// ========================================================
// RENDER PRODUCT CARD
// ========================================================

function renderIndexProductCard(item) {

    const brandName =
        item.brands
            ? item.brands.name
            : 'OEM';

    const salesQuantity =
    item.sales
        ? Number(
            item.sales.sales_quantity || 0
        )
        : 0;

    // ----------------------------------------------------
    // BADGE TRÁI
    // ----------------------------------------------------

    let leftBadgeHTML = '';


    if (
        item.badge &&
        String(item.badge).trim() !== ''
    ) {

        const badgeVal =
            String(item.badge)
                .trim()
                .toUpperCase();


        let badgeType =
            'product-badge-custom';


        if (badgeVal === 'NEW') {

            badgeType =
                'product-badge-new';

        } else if (badgeVal === 'HOT') {

            badgeType =
                'product-badge-hot';

        } else if (badgeVal === 'SALE') {

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


        leftBadgeHTML = `
            <span class="product-badge ${badgeType}">
                ${escapeIndexHTML(badgeVal)}
            </span>
        `;

    }


    // ----------------------------------------------------
    // BADGE PHẢI
    // ----------------------------------------------------

    let rightBadgeHTML = '';


    if (
        item.discount_price &&
        item.price &&
        item.discount_price > 0 &&
        item.discount_price < item.price
    ) {

        const percent =
            Math.round(
                (
                    (item.price - item.discount_price)
                    /
                    item.price
                ) * 100
            );


        rightBadgeHTML = `
            <span class="product-badge product-badge-sale">
                GIẢM ${percent}%
            </span>
        `;

    } else if (
        item.stock_quantity !== undefined &&
        item.stock_quantity <= 0
    ) {

        rightBadgeHTML = `
            <span class="product-badge product-badge-preorder">
                Pre-order
            </span>
        `;

    } else {

        rightBadgeHTML = `
            <span class="product-badge product-badge-stock">
                Có sẵn
            </span>
        `;

    }


    const productImage =
        buildIndexImageUrl(
            item.image_path
        );


    return `
        <div
            class="product-card"
            data-product-id="${escapeIndexHTML(item.id)}"
            data-product-slug="${escapeIndexHTML(item.slug || '')}"
        >

            <div class="product-image-link">

                ${leftBadgeHTML}

                ${rightBadgeHTML}

                <img
                    src="${escapeIndexHTML(productImage)}"
                    alt="${escapeIndexHTML(item.name || '')}"
                    class="product-img"
                    loading="lazy"
                    draggable="false"
                    onerror="
                        this.onerror=null;
                        this.src='assets/images/world mark.png';
                    "
                >

            </div>


            <div class="product-info">

                <div class="product-brand">
                    ${escapeIndexHTML(brandName)}
                </div>


                <div
                    class="product-name"
                    title="${escapeIndexHTML(item.name || '')}"
                >
                    ${escapeIndexHTML(item.name || '')}
                </div>


                <div class="product-meta">

                    <div class="product-sku">
                        SKU:
                        ${escapeIndexHTML(
                            item.sku || 'Đang cập nhật'
                        )}
                    </div>

                    <div class="product-unit">
                        ${escapeIndexHTML(
                            item.unit || 'Cái'
                        )}
                    </div>

                </div>

            </div>

        </div>
    `;

}


// ========================================================
// RENDER PRODUCT SLIDER
// ========================================================

function renderProductSlider(
    containerId,
    products
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    if (
        !products ||
        products.length === 0
    ) {

        container.innerHTML = `
            <p class="empty-msg">
                Chưa có sản phẩm trong danh mục này.
            </p>
        `;

        return;

    }


    const productItemsHTML =
        products
            .map(
                product =>
                    renderIndexProductCard(
                        product
                    )
            )
            .join('');


    // Nhân đôi track để infinite carousel
    container.innerHTML = `
        <div class="product-slider-track">
            ${productItemsHTML}
        </div>

        <div
            class="product-slider-track"
            aria-hidden="true"
        >
            ${productItemsHTML}
        </div>
    `;


    // ----------------------------------------------------
    // DRAG / AUTO SCROLL
    // ----------------------------------------------------

    if (
        typeof initDragAndScroll ===
        'function'
    ) {

        initDragAndScroll(
            containerId,
            1.5
        );

    }

}


// ========================================================
// BIND CLICK PRODUCT CARD
// ========================================================

function bindProductSliderClick(
    containerId
) {

    const slider =
        document.getElementById(
            containerId
        );


    if (
        !slider ||
        slider.dataset.clickBound
    ) {

        return;

    }


    slider.dataset.clickBound =
        'true';


    slider.addEventListener(
        'click',
        function (event) {

            // Vừa kéo slider → không mở product
            if (
                slider.isDraggingActive
            ) {

                return;

            }


            // Không can thiệp link/button
            if (
                event.target.closest('a') ||
                event.target.closest('button')
            ) {

                return;

            }


            const card =
                event.target.closest(
                    '.product-card'
                );


            if (!card) {
                return;
            }


            const productSlug =
                card.dataset.productSlug;


            if (!productSlug) {

                console.warn(
                    'Product: thiếu slug'
                );

                return;

            }


            const encodedSlug =
                encodeURIComponent(
                    productSlug
                );


            const isLocal =
                window.location.hostname ===
                    'localhost' ||
                window.location.hostname ===
                    '127.0.0.1';


            if (isLocal) {

                window.location.href =
                    `pages/product-detail.html?slug=${encodedSlug}`;

            } else {

                window.location.href =
                    `/${encodedSlug}.html`;

            }

        }
    );

}

// ========================================================
// BEST SELLER - SALES STATS
// ========================================================
async function fetchBestSellingProducts() {

    // ----------------------------------------------------
    // 1. LẤY THỐNG KÊ BÁN HÀNG
    // ----------------------------------------------------
    const {
        data: salesData,
        error: salesError
    } = await window.supabaseClient
        .from('product_sales_stats')
        .select(`
            product_id,
            sales_quantity,
            sales_revenue,
            order_count
        `)
        .order('sales_quantity', {
            ascending: false
        })
        .limit(INDEX_PRODUCT_LIMIT);

    if (salesError) {
        console.error(
            'Lỗi product_sales_stats:',
            salesError
        );

        throw salesError;
    }

    // ----------------------------------------------------
    // 2. KHÔNG CÓ LỊCH SỬ BÁN HÀNG
    // ----------------------------------------------------
    if (!salesData || salesData.length === 0) {

        console.log(
            '[BEST SELLER] Chưa có dữ liệu sales.'
        );

        return {
            products: [],
            hasSalesData: false
        };
    }

    console.log(
        '[BEST SELLER] Sales stats:',
        salesData
    );

    // ----------------------------------------------------
    // 3. LẤY PRODUCT ID
    // ----------------------------------------------------
    const productIds = salesData
        .map(item => item.product_id)
        .filter(Boolean);

    if (productIds.length === 0) {

        return {
            products: [],
            hasSalesData: false
        };
    }

    // ----------------------------------------------------
    // 4. LẤY THÔNG TIN PRODUCT
    // ----------------------------------------------------
    const {
        data: products,
        error: productError
    } = await window.supabaseClient
        .from('products')
        .select(`
            id,
            sku,
            name,
            slug,
            image_path,
            unit,
            category_id,
            stock_quantity,
            price,
            discount_price,
            badge,
            created_at,
            brands(name)
        `)
        .in('id', productIds);

    if (productError) {
        console.error(
            'Lỗi lấy products Best Seller:',
            productError
        );

        throw productError;
    }

    // ----------------------------------------------------
    // 5. GHÉP SALES STATS
    // ----------------------------------------------------
    const salesMap = new Map(
        salesData.map(item => [
            item.product_id,
            item
        ])
    );

    const sortedProducts = (products || [])
        .map(product => {

            const sales =
                salesMap.get(product.id) || {
                    sales_quantity: 0,
                    sales_revenue: 0,
                    order_count: 0
                };

            return {
                ...product,
                sales: sales
            };
        })
        .filter(product => {
            // Chỉ lấy sản phẩm thực sự có bán
            return Number(
                product.sales.sales_quantity
            ) > 0;
        })
        .sort((a, b) => {

            return Number(
                b.sales.sales_quantity
            ) - Number(
                a.sales.sales_quantity
            );

        })
        .slice(0, INDEX_PRODUCT_LIMIT);

    console.log(
        '[BEST SELLER] Products:',
        sortedProducts
    );

    return {
        products: sortedProducts,
        hasSalesData: sortedProducts.length > 0
    };
}

// ========================================================
// BEST SELLER FALLBACK
// Dùng khi chưa có dữ liệu completed / delivered
// ========================================================

async function fetchBestSellerFallback() {

    const {
        data,
        error
    } = await window.supabaseClient
        .from('products')
        .select(`
            id,
            sku,
            name,
            slug,
            image_path,
            unit,
            category_id,
            stock_quantity,
            price,
            discount_price,
            badge,
            created_at,
            brands(name)
        `)
        .gt(
            'stock_quantity',
            0
        )
        .order(
            'created_at',
            {
                ascending: false
            }
        )
        .limit(
            INDEX_PRODUCT_LIMIT
        );


    if (error) {
        throw error;
    }


    return data || [];

}

// ========================================================
// LOAD BEST SELLERS
// ========================================================

async function loadBestSellers() {

    const container =
        document.getElementById(
            'bestSellingGrid'
        );


    if (!container) {
        return;
    }


    try {

        // ------------------------------------------------
        // 1. ƯU TIÊN DỮ LIỆU SALES THẬT
        // ------------------------------------------------

        const result =
            await fetchBestSellingProducts();


        let products =
            result.products;


        // ------------------------------------------------
        // 2. FALLBACK KHI CHƯA CÓ LỊCH SỬ BÁN
        // ------------------------------------------------

        if (
            !result.hasSalesData ||
            products.length === 0
        ) {

            products =
                await fetchBestSellerFallback();

        }


        // ------------------------------------------------
        // 3. RENDER
        // ------------------------------------------------

        renderProductSlider(
            'bestSellingGrid',
            products
        );


        // ------------------------------------------------
        // 4. CLICK PRODUCT
        // ------------------------------------------------

        bindProductSliderClick(
            'bestSellingGrid'
        );


    } catch (error) {

        console.error(
            'Lỗi tải Best Seller:',
            error
        );


        container.innerHTML = `
            <p
                class="empty-msg"
                style="color:red;"
            >
                Không thể tải sản phẩm.
            </p>
        `;

    }

}


// ========================================================
// LẤY 2 CATEGORY CÓ NHIỀU PRODUCT NHẤT
// ========================================================

async function loadTopProductCategories() {

    try {

        const {
            data,
            error
        } = await window.supabaseClient
            .from('categories')
            .select(`
                id,
                name,
                slug,
                products(id)
            `);


        if (error) {
            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {

            return [];

        }


        const categories =
            data
                .map(category => {

                    const products =
                        Array.isArray(
                            category.products
                        )
                            ? category.products
                            : [];


                    return {

                        id:
                            category.id,

                        name:
                            category.name,

                        slug:
                            category.slug,

                        productCount:
                            products.length

                    };

                })
                .filter(
                    category =>
                        category.productCount > 0
                )
                .sort(
                    (a, b) =>
                        b.productCount -
                        a.productCount
                )
                .slice(
                    0,
                    2
                );


        return categories;


    } catch (error) {

        console.error(
            'Lỗi lấy top categories:',
            error
        );


        return [];

    }

}


// ========================================================
// CONFIG CATEGORY SECTION
// ========================================================

function updateCategorySection(
    sectionNumber,
    category
) {

    const section =
        document.getElementById(
            `topCategorySection${sectionNumber}`
        );


    if (!section) {
        return;
    }


    // Không có category
    if (!category) {

        section.style.display =
            'none';

        return;

    }


    const title =
        document.getElementById(
            `topCategoryTitle${sectionNumber}`
        );


    const desc =
        document.getElementById(
            `topCategoryDesc${sectionNumber}`
        );


    const link =
        document.getElementById(
            `topCategoryLink${sectionNumber}`
        );


    const mobileLink =
        document.getElementById(
            `topCategoryMobileLink${sectionNumber}`
        );


    if (title) {

        title.innerHTML = `
            ${escapeIndexHTML(category.name)}
            <span class="section-title-line"></span>
        `;

    }


    if (desc) {

        desc.textContent =
            `Khám phá ${category.productCount} sản phẩm nổi bật trong danh mục ${category.name}.`;

    }


    const categoryUrl =
        `pages/subcategory.html?slug=${encodeURIComponent(category.slug)}`;


    if (link) {

        link.href =
            categoryUrl;

    }


    if (mobileLink) {

        mobileLink.href =
            categoryUrl;

    }

}


// ========================================================
// LOAD CATEGORY PRODUCT SECTION
// ========================================================

async function loadCategoryProductSection(
    sectionNumber,
    category
) {

    if (!category) {
        return;
    }


    const gridId =
        `topCategoryGrid${sectionNumber}`;


    const grid =
        document.getElementById(
            gridId
        );


    if (!grid) {
        return;
    }


    try {

        updateCategorySection(
            sectionNumber,
            category
        );


        const products =
            await fetchProductsByCategory(
                category.id
            );


        renderProductSlider(
            gridId,
            products
        );


        bindProductSliderClick(
            gridId
        );


    } catch (error) {

        console.error(
            `Lỗi tải category #${sectionNumber}:`,
            error
        );


        grid.innerHTML = `
            <p
                class="empty-msg"
                style="color:red;"
            >
                Không thể tải sản phẩm.
            </p>
        `;

    }

}


// ========================================================
// LOAD TOÀN BỘ PRODUCT SHOWCASE
// ========================================================

async function loadProductShowcase() {

    // ----------------------------------------------------
    // 1. BEST SELLERS
    // ----------------------------------------------------

    loadBestSellers();


    // ----------------------------------------------------
    // 2. TOP 2 CATEGORY
    // ----------------------------------------------------

    const topCategories =
        await loadTopProductCategories();


    const category1 =
        topCategories[0] ||
        null;


    const category2 =
        topCategories[1] ||
        null;


    await Promise.all([

        loadCategoryProductSection(
            1,
            category1
        ),

        loadCategoryProductSection(
            2,
            category2
        )

    ]);

}

// ========================================================
// 6. THÊM VÀO GIỎ TỪ TRANG CHỦ
// ========================================================

function addToRFQCartFromIndex(
    sku,
    name,
    brand,
    unit
) {

    try {

        let cart =
            JSON.parse(
                localStorage.getItem(
                    'mro_rfq_cart'
                )
            ) || [];


        if (
            !Array.isArray(cart)
        ) {

            cart = [];

        }


        let existingItem =
            cart.find(
                item =>
                    item.sku === sku
            );


        if (existingItem) {

            existingItem.qty +=
                1;

        } else {

            cart.push({

                sku:
                    sku,

                name:
                    name,

                brand:
                    brand,

                unit:
                    unit,

                qty:
                    1

            });

        }


        localStorage.setItem(
            'mro_rfq_cart',
            JSON.stringify(
                cart
            )
        );


        window.location.href =
            'pages/rfq.html';


    } catch (error) {

        console.error(
            "Lỗi giỏ hàng:",
            error
        );


        alert(
            "Có lỗi xảy ra khi thêm vào giỏ. Vui lòng thử lại."
        );

    }

}


/* ========================================================
   HÀM KÉO THẢ + AUTO SCROLL INFINITE
   CLICK / DRAG TÁCH RIÊNG
======================================================== */
function initDragAndScroll(sliderId, speed = 1) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;

    // Cleanup instance cũ
    if (slider._cancelSlider) {
        slider._cancelSlider();
    }

    slider.style.scrollBehavior = 'auto';

    let animationFrame = null;
    let resizeObserver = null;

    let isPointerDown = false;
    let isDragging = false;
    let isHovering = false;

    let startX = 0;
    let startScrollLeft = 0;
    let loopWidth = 0;

    const DRAG_THRESHOLD = 8;
    const DRAG_SPEED = 1.5;

    // ====================================================
    // TRẠNG THÁI CLICK / DRAG
    // ====================================================

    slider.isDraggingActive = false;

    // ====================================================
    // TÍNH CHIỀU RỘNG 1 VÒNG
    // ====================================================

    const calculateLoopWidth = () => {

        const tracks = slider.querySelectorAll(
            '.product-slider-track, .brand-track-group'
        );

        if (tracks.length < 2) {
            loopWidth = 0;
            return;
        }

        const firstTrack = tracks[0];
        const secondTrack = tracks[1];

        loopWidth =
            secondTrack.offsetLeft -
            firstTrack.offsetLeft;

        if (loopWidth <= 0) {
            loopWidth = firstTrack.scrollWidth;
        }
    };

    // ====================================================
    // NORMALIZE INFINITE SCROLL
    // ====================================================

    const normalizeScroll = () => {

        if (!loopWidth || loopWidth <= 0) {
            return;
        }

        slider.style.scrollBehavior = 'auto';

        if (slider.scrollLeft >= loopWidth) {

            slider.scrollLeft -= loopWidth;

        } else if (slider.scrollLeft <= 0) {

            slider.scrollLeft += loopWidth;
        }
    };

    // ====================================================
    // AUTO PLAY
    // ====================================================

    const animate = () => {

        if (
            !isPointerDown &&
            !isHovering &&
            loopWidth > 0
        ) {

            slider.scrollLeft += speed;

            normalizeScroll();
        }

        animationFrame =
            requestAnimationFrame(animate);
    };

    // ====================================================
    // POINTER DOWN
    // ====================================================

    const onPointerDown = (event) => {

        if (
            event.pointerType === 'mouse' &&
            event.button !== 0
        ) {
            return;
        }

        isPointerDown = true;
        isDragging = false;

        slider.isDraggingActive = false;

        startX = event.clientX;
        startScrollLeft = slider.scrollLeft;

        slider.style.cursor = 'grabbing';
        slider.style.scrollBehavior = 'auto';

        /*
         * KHÔNG dùng setPointerCapture ngay lập tức.
         *
         * Chờ đến khi user thực sự kéo mới capture.
         * Điều này giúp click card hoạt động bình thường.
         */
    };

    // ====================================================
    // POINTER MOVE
    // ====================================================

    const onPointerMove = (event) => {

        if (!isPointerDown) {
            return;
        }

        const distance =
            event.clientX - startX;

        const walk =
            distance * DRAG_SPEED;

        // Chưa vượt ngưỡng → vẫn là CLICK
        if (!isDragging) {

            if (
                Math.abs(distance) <
                DRAG_THRESHOLD
            ) {
                return;
            }

            // Chính thức trở thành DRAG
            isDragging = true;

            slider.isDraggingActive = true;

            // Chỉ capture khi đã thật sự drag
            slider.setPointerCapture?.(
                event.pointerId
            );
        }

        // Chỉ preventDefault khi thật sự drag
        event.preventDefault();

        slider.scrollLeft =
            startScrollLeft - walk;

        normalizeScroll();
    };

    // ====================================================
    // POINTER UP
    // ====================================================

    const stopDragging = (event) => {

        if (!isPointerDown) {
            return;
        }

        isPointerDown = false;

        const wasDragging = isDragging;

        isDragging = false;

        slider.style.cursor = 'grab';

        if (wasDragging) {

            slider.isDraggingActive = true;

            try {
                slider.releasePointerCapture?.(
                    event?.pointerId
                );
            } catch (error) {
                // Ignore
            }

            /*
             * Giữ cờ một chút để browser không
             * biến thao tác drag thành click.
             */
            setTimeout(() => {

                slider.isDraggingActive = false;

            }, 150);

        } else {

            // Click bình thường
            slider.isDraggingActive = false;
        }
    };

    // ====================================================
    // POINTER CANCEL
    // ====================================================

    const onPointerCancel = (event) => {

        isPointerDown = false;
        isDragging = false;

        slider.isDraggingActive = false;

        slider.style.cursor = 'grab';

        try {
            slider.releasePointerCapture?.(
                event?.pointerId
            );
        } catch (error) {
            // Ignore
        }
    };

    // ====================================================
    // HOVER
    // ====================================================

    const onMouseEnter = () => {
        isHovering = true;
    };

    const onMouseLeave = () => {

        isHovering = false;

        /*
         * Không gọi stopDragging() ở đây.
         *
         * Vì mouseleave không đồng nghĩa với pointerup.
         */
    };

    // ====================================================
    // EVENT LISTENERS
    // ====================================================

    slider.addEventListener(
        'pointerdown',
        onPointerDown
    );

    slider.addEventListener(
        'pointermove',
        onPointerMove,
        { passive: false }
    );

    slider.addEventListener(
        'pointerup',
        stopDragging
    );

    slider.addEventListener(
        'pointercancel',
        onPointerCancel
    );

    slider.addEventListener(
        'mouseenter',
        onMouseEnter
    );

    slider.addEventListener(
        'mouseleave',
        onMouseLeave
    );

    // ====================================================
    // CHỐNG GHOST DRAG CỦA IMAGE / LINK
    // ====================================================

    slider
        .querySelectorAll('img')
        .forEach(element => {

            element.setAttribute(
                'draggable',
                'false'
            );

            element.addEventListener(
                'dragstart',
                event => {
                    event.preventDefault();
                }
            );
        });

    // ====================================================
    // INIT
    // ====================================================

    calculateLoopWidth();

    animationFrame =
        requestAnimationFrame(animate);

    slider.style.cursor = 'grab';
    slider.style.userSelect = 'none';

    // ====================================================
    // RESIZE
    // ====================================================

    resizeObserver =
        new ResizeObserver(() => {

            calculateLoopWidth();
            normalizeScroll();

        });

    resizeObserver.observe(slider);

    // ====================================================
    // CLEANUP
    // ====================================================

    slider._cancelSlider = () => {

        if (animationFrame) {
            cancelAnimationFrame(
                animationFrame
            );
        }

        if (resizeObserver) {
            resizeObserver.disconnect();
        }

        slider.removeEventListener(
            'pointerdown',
            onPointerDown
        );

        slider.removeEventListener(
            'pointermove',
            onPointerMove
        );

        slider.removeEventListener(
            'pointerup',
            stopDragging
        );

        slider.removeEventListener(
            'pointercancel',
            onPointerCancel
        );

        slider.removeEventListener(
            'mouseenter',
            onMouseEnter
        );

        slider.removeEventListener(
            'mouseleave',
            onMouseLeave
        );
    };
}


// --- 8. KÉO DỮ LIỆU TIN TỨC (BLOG) LÊN TRANG CHỦ ---
async function loadHomeBlogs() {
    const container = document.getElementById('homeBlogGrid');
    if (!container) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('blogs')
            .select('title, slug, thumbnail')
            .order('created_at', { ascending: false })
            .limit(3); 

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="cat-empty" style="grid-column: 1/-1; text-align: center;">Chưa có bài viết nào.</p>';
            return;
        }

        let html = '';
        data.forEach(post => {
            const imgUrl = post.thumbnail || 'https://via.placeholder.com/600x400?text=Tin+Tuc+MRO';
            
            // ĐÃ FIX: Dùng đúng các class tĩnh (blog-card, blog-img, blog-title...)
            html += `
            <article class="blog-card">
                <a href="pages/blog-detail.html?slug=${post.slug}" class="blog-img-link">
                    <img src="${imgUrl}" alt="${post.title}" class="blog-img">
                </a>
                <div class="blog-content">
                    <div class="blog-tag">Tin Tức MRO</div>
                    <a href="pages/blog-detail.html?slug=${post.slug}" class="blog-title" title="${post.title}">
                        ${post.title}
                    </a>
                    <a href="pages/blog-detail.html?slug=${post.slug}" class="blog-read-more">
                        Xem chi tiết <span>→</span>
                    </a>
                </div>
            </article>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error("Lỗi tải blog trang chủ:", error);
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red; font-weight: bold;">Không thể tải tin tức.</p>`;
    }
}


// ========================================================
// 9. INDUSTRIES
// ========================================================

async function loadIndustries() {

    const container =
        document.getElementById(
            'industriesGrid'
        );


    if (!container) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from('industries')
                .select('*')
                .neq(
                    'is_active',
                    false
                )
                .order(
                    'id',
                    {
                        ascending: true
                    }
                )
                .limit(6);


        if (error) {
            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {

            container.innerHTML = `
                <p
                    class="cat-empty"
                    style="
                        grid-column:1/-1;
                        text-align:center;
                    "
                >
                    Chưa có dữ liệu ngành nghề.
                </p>
            `;

            return;

        }


        const defaultIcons = [
            '🏭',
            '🍜',
            '⚡',
            '🏗️',
            '🚗',
            '🧪',
            '⛏️',
            '🏥',
            '⚙️',
            '🔧',
            '📦',
            '💻'
        ];


        let html =
            '';


        data.forEach(
            (item, index) => {

                const fallbackIcon =
                    defaultIcons[
                        index %
                        defaultIcons.length
                    ];


                const iconHtml =
                    item.icon_url

                        ? `
                            <img
                                src="${escapeIndexHTML(item.icon_url)}"
                                alt="${escapeIndexHTML(item.name || '')}"
                                class="industry-icon-img"
                            >
                        `

                        : `
                            <div
                                class="industry-icon-fallback"
                            >
                                ${fallbackIcon}
                            </div>
                        `;


                html += `
                    <a
                        href="pages/products.html?industry_id=${encodeURIComponent(item.id)}"
                        class="industry-card"
                    >

                        <div
                            class="industry-icon-wrapper"
                        >
                            ${iconHtml}
                        </div>


                        <h3 class="industry-name">
                            ${escapeIndexHTML(
                                item.name || ''
                            )}
                        </h3>

                    </a>
                `;

            }
        );


        container.innerHTML =
            html;


    } catch (error) {

        console.error(
            "Lỗi tải Industries:",
            error
        );


        container.innerHTML = `
            <p
                style="
                    grid-column:1/-1;
                    text-align:center;
                    color:red;
                    font-weight:bold;
                "
            >
                Không thể tải danh sách ngành nghề.
            </p>
        `;

    }

}


// ========================================================
// 10. ESCAPE HTML
// ========================================================

function escapeIndexHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return '';

    }


    const div =
        document.createElement(
            'div'
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}


window.onload = async function () {

    // ====================================================
    // TRANG CHỦ
    // ====================================================

    loadMainCategories();

    loadBrandsToMarquee();

    loadProductShowcase();

    loadHomeBlogs();

    loadIndustries();


    // ====================================================
    // AUTH
    // ====================================================

    if (
        typeof checkCustomerAuth ===
        "function"
    ) {

        try {

            const user =
                await checkCustomerAuth();


            if (user) {

                document
                    .getElementById(
                        "btnGuestLogin"
                    )
                    ?.classList.add(
                        "d-none"
                    );


                const userProfileBtn =
                    document.getElementById(
                        "btnUserProfile"
                    );


                if (
                    userProfileBtn
                ) {

                    userProfileBtn.classList.remove(
                        "d-none"
                    );

                }

            }

        } catch (error) {

            console.error(
                "Lỗi xác thực:",
                error
            );

        }

    }

};


// ========================================================
// SCROLL PRODUCT SECTION
// ========================================================

window.scrollProductSection = function (
    sliderId,
    amount
) {

    const slider =
        document.getElementById(
            sliderId
        );


    if (!slider) {
        return;
    }


    slider.style.scrollBehavior =
        'smooth';


    slider.scrollBy({
        left: amount,
        behavior: 'smooth'
    });


    setTimeout(() => {

        slider.style.scrollBehavior =
            'auto';

    }, 400);

};