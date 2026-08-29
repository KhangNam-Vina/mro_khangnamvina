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
                                        href="pages/family.html?sub_category_id=${encodeURIComponent(sub.id)}"
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
                                    href="pages/subcategory.html?category_id=${encodeURIComponent(cat.id)}"
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
// 4. KÉO SẢN PHẨM BÁN CHẠY (BIẾN TOÀN BỘ CARD THÀNH LINK)
// ========================================================

async function loadBestSellers(filterKeyword = 'ALL') {
    const container = document.getElementById('bestSellingGrid');
    if (!container) return;

    // SKELETON LOADING (Đã gỡ nút button ở dưới)
    container.innerHTML = `
        <div class="product-slider-track">
            <div class="product-skeleton"><div class="skel-img"></div><div class="skel-line w-1-3 mb-2"></div><div class="skel-line w-full mb-2"></div><div class="skel-line w-2-3 mb-auto"></div></div>
            <div class="product-skeleton"><div class="skel-img"></div><div class="skel-line w-1-3 mb-2"></div><div class="skel-line w-full mb-2"></div><div class="skel-line w-2-3 mb-auto"></div></div>
            <div class="product-skeleton hidden-mobile"><div class="skel-img"></div><div class="skel-line w-1-3 mb-2"></div><div class="skel-line w-full mb-2"></div><div class="skel-line w-2-3 mb-auto"></div></div>
            <div class="product-skeleton hidden-tablet"><div class="skel-img"></div><div class="skel-line w-1-3 mb-2"></div><div class="skel-line w-full mb-2"></div><div class="skel-line w-2-3 mb-auto"></div></div>
        </div>
    `;

    try {
        let query = window.supabaseClient
            .from('products')
            .select('id, sku, name, image_path, unit, category_id, stock_quantity, price, discount_price, badge, brands(name)')
            .order('created_at', { ascending: false });

        if (filterKeyword !== 'ALL') {
            query = query.eq('category_id', filterKeyword);
        }

        const { data, error } = await query.limit(8);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `<p class="empty-msg">Chưa có sản phẩm nào cho danh mục này.</p>`;
            return;
        }

        let productItemsHTML = '';

        data.forEach(item => {
            const brandName = item.brands ? item.brands.name : 'OEM';
            
            // Xử lý Badge Trái
            let leftBadgeHTML = '';
            if (item.badge && String(item.badge).trim() !== '') {
                const badgeVal = String(item.badge).trim().toUpperCase();
                let badgeType = 'product-badge-custom';
                if (badgeVal === 'NEW') badgeType = 'product-badge-new';
                else if (badgeVal === 'HOT') badgeType = 'product-badge-hot';
                else if (badgeVal === 'SALE') badgeType = 'product-badge-sale-custom';
                else if (badgeVal === 'BEST SELLER') badgeType = 'product-badge-best';
                else if (badgeVal === 'CLEARANCE') badgeType = 'product-badge-clearance';
                
                leftBadgeHTML = `<span class="product-badge ${badgeType}">${escapeIndexHTML(badgeVal)}</span>`;
            }

            // Xử lý Badge Phải
            let rightBadgeHTML = '';
            if (item.discount_price && item.discount_price > 0 && item.discount_price < item.price) {
                const percent = Math.round(((item.price - item.discount_price) / item.price) * 100);
                rightBadgeHTML = `<span class="product-badge product-badge-sale">GIẢM ${percent}%</span>`;
            } else {
                if (item.stock_quantity !== undefined && item.stock_quantity <= 0) {
                    rightBadgeHTML = `<span class="product-badge product-badge-preorder">Pre-order</span>`;
                } else {
                    rightBadgeHTML = `<span class="product-badge product-badge-stock">Có sẵn</span>`;
                }
            }

            const productImage = buildIndexImageUrl(item.image_path);

            // ĐÃ FIX: Dùng thẻ <a> bọc toàn bộ thẻ card để trình duyệt tự hiểu đây là link đích thực
            productItemsHTML += `
                <a href="pages/product-detail.html?id=${encodeURIComponent(item.id)}" class="product-card" style="text-decoration: none; cursor: pointer;">
                    
                    <div class="product-image-link" style="border-bottom: 1px solid #eef0f3; pointer-events: none;">
                        ${leftBadgeHTML}
                        ${rightBadgeHTML}
                        <img src="${escapeIndexHTML(productImage)}" alt="${escapeIndexHTML(item.name || '')}" class="product-img" loading="lazy" onerror="this.onerror=null;this.src='assets/images/world mark.png';">
                    </div>

                    <div class="product-info">
                        <div class="product-brand">${escapeIndexHTML(brandName)}</div>
                        
                        <div class="product-name" title="${escapeIndexHTML(item.name || '')}">
                            ${escapeIndexHTML(item.name || '')}
                        </div>

                        <div class="product-meta">
                            <div class="product-sku" style="display: inline-block;">SKU: ${escapeIndexHTML(item.sku || 'Đang cập nhật')}</div><br>
                            <div class="product-unit" style="display: inline-block; margin-top: 4px;">${escapeIndexHTML(item.unit || 'Cái')}</div>
                        </div>
                    </div>
                </a>
            `;
        });

        container.innerHTML = `
            <div class="product-slider-track">${productItemsHTML}</div>
            <div class="product-slider-track" aria-hidden="true">${productItemsHTML}</div>
        `;

        // Gọi lại hàm kéo thả
        initDragAndScroll('bestSellingGrid', 2);

    } catch (error) {
        console.error("Lỗi tải Best Seller:", error);
        container.innerHTML = `<p class="empty-msg" style="color:red;">Lỗi lấy dữ liệu: ${escapeIndexHTML(error.message)}</p>`;
    }
}


// ========================================================
// 5. TẠO TABS BEST SELLER
// ========================================================

async function initBestSellerTabs() {

    const tabsContainer =
        document.getElementById(
            'bestSellerTabs'
        );


    if (!tabsContainer) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from('categories')
                .select(
                    'id, name, products(id)'
                );


        if (error) {
            throw error;
        }


        const topCategories =
            data
                .map(
                    cat => ({

                        id:
                            cat.id,

                        name:
                            cat.name,

                        count:
                            cat.products
                                ? cat.products.length
                                : 0

                    })
                )
                .filter(
                    cat =>
                        cat.count > 0
                )
                .sort(
                    (a, b) =>
                        b.count -
                        a.count
                )
                .slice(
                    0,
                    4
                );


        let html = `
            <button
                type="button"
                data-filter="ALL"
                class="home-tab-btn is-active"
            >
                ALL
            </button>
        `;


        topCategories.forEach(
            cat => {

                html += `
                    <button
                        type="button"
                        data-filter="${encodeURIComponent(cat.id)}"
                        class="home-tab-btn"
                    >
                        ${escapeIndexHTML(
                            cat.name
                        )}
                    </button>
                `;

            }
        );


        tabsContainer.innerHTML =
            html;


        const tabs =
            tabsContainer.querySelectorAll(
                '.home-tab-btn'
            );


        tabs.forEach(
            tab => {

                tab.addEventListener(
                    'click',
                    e => {

                        tabs.forEach(
                            t =>
                                t.classList.remove(
                                    'is-active'
                                )
                        );


                        const clickedBtn =
                            e.currentTarget;


                        clickedBtn.classList.add(
                            'is-active'
                        );


                        const filterValue =
                            clickedBtn.getAttribute(
                                'data-filter'
                            );


                        if (
                            typeof loadBestSellers ===
                            'function'
                        ) {

                            loadBestSellers(
                                filterValue
                            );

                        }

                    }
                );

            }
        );


        const btnAll =
            tabsContainer.querySelector(
                '[data-filter="ALL"]'
            );


        if (
            btnAll &&
            typeof loadBestSellers ===
                'function'
        ) {

            loadBestSellers(
                'ALL'
            );

        }


    } catch (error) {

        console.error(
            "Lỗi tải Tabs Best Seller:",
            error
        );


        tabsContainer.innerHTML = `
            <span
                style="
                    font-size:12px;
                    color:red;
                "
            >
                Lỗi tải bộ lọc
            </span>
        `;

    }

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
   BẢN TỐI ƯU - KHÔNG GÂY LOOP LAYOUT
======================================================== */
function initDragAndScroll(sliderId, speed = 1) {

    const slider =
        document.getElementById(sliderId);

    if (!slider) {
        return;
    }


    /* ====================================================
       CLEANUP INSTANCE CŨ
    ==================================================== */

    if (slider._cancelSlider) {
        slider._cancelSlider();
    }


    let animationFrame = null;

    let isDragging = false;
    let hasDragged = false;
    let isHovering = false;

    let startX = 0;
    let startScrollLeft = 0;

    let loopWidth = 0;

    let resetTimer = null;


    /* ====================================================
       TÍNH WIDTH 1 TRACK
       CHỈ TÍNH KHI CẦN
    ==================================================== */

    const calculateLoopWidth = () => {

        const tracks =
    slider.querySelectorAll(
        '.product-slider-track, .brand-track-group'
    );


        if (tracks.length < 2) {

            loopWidth = 0;

            return;

        }


        const firstTrack =
            tracks[0];

        const secondTrack =
            tracks[1];


        /*
           Vì 2 track nằm nối tiếp nhau
           nên khoảng cách giữa chúng
           chính là width của 1 loop.
        */

        const width =
            secondTrack.offsetLeft -
            firstTrack.offsetLeft;


        if (width > 0) {

            loopWidth = width;

        } else {

            loopWidth =
                firstTrack.scrollWidth;

        }

    };


    /* ====================================================
       NORMALIZE
    ==================================================== */

    const normalizeScroll = () => {

        if (
            !loopWidth ||
            loopWidth <= 0
        ) {

            return;

        }


        /*
           Chỉ cần 1 lần reset.
           Không dùng while để tránh
           loop vô hạn khi layout lỗi.
        */

        if (
            slider.scrollLeft >=
            loopWidth
        ) {

            slider.scrollLeft -=
                loopWidth;

        }


        else if (
            slider.scrollLeft < 0
        ) {

            slider.scrollLeft +=
                loopWidth;

        }

    };


    /* ====================================================
       AUTO SCROLL
    ==================================================== */

    const animate = () => {

        if (
            !isDragging &&
            !isHovering &&
            loopWidth > 0
        ) {

            slider.scrollLeft +=
                speed;


            if (
                slider.scrollLeft >=
                loopWidth
            ) {

                slider.scrollLeft -=
                    loopWidth;

            }

        }


        animationFrame =
            requestAnimationFrame(
                animate
            );

    };


    /* ====================================================
       INIT WIDTH
       CHỈ TÍNH 1 LẦN BAN ĐẦU
    ==================================================== */

    calculateLoopWidth();


    animationFrame =
        requestAnimationFrame(
            animate
        );


    /* ====================================================
       POINTER DOWN
    ==================================================== */

    const onPointerDown = (event) => {

        if (
            event.pointerType === 'mouse' &&
            event.button !== 0
        ) {

            return;

        }


        isDragging = true;

        hasDragged = false;


        startX =
            event.clientX;


        startScrollLeft =
            slider.scrollLeft;


        slider.setPointerCapture?.(
            event.pointerId
        );


        slider.style.cursor =
            'grabbing';

    };


    /* ====================================================
       POINTER MOVE
    ==================================================== */

    const onPointerMove = (event) => {

        if (!isDragging) {

            return;

        }


        event.preventDefault();


        const walk =
            (
                event.clientX -
                startX
            ) * 1.5;


        let targetScroll =
            startScrollLeft -
            walk;


        if (
            loopWidth > 0
        ) {

            if (
                targetScroll >=
                loopWidth
            ) {

                targetScroll -=
                    loopWidth;


                startScrollLeft -=
                    loopWidth;

            }


            else if (
                targetScroll < 0
            ) {

                targetScroll +=
                    loopWidth;


                startScrollLeft +=
                    loopWidth;

            }

        }


        slider.scrollLeft =
            targetScroll;


        if (
            Math.abs(walk) > 5
        ) {

            hasDragged = true;

        }

    };


    /* ====================================================
       STOP DRAG
    ==================================================== */

    const stopDragging = (event) => {

        if (!isDragging) {

            return;

        }


        isDragging = false;


        slider.releasePointerCapture?.(
            event?.pointerId
        );


        slider.style.cursor =
            'grab';


        if (resetTimer) {

            clearTimeout(
                resetTimer
            );

        }


        resetTimer =
            setTimeout(
                () => {

                    hasDragged = false;

                },
                80
            );

    };


    /* ====================================================
       CLICK
    ==================================================== */

    const onClick = (event) => {

        if (
            hasDragged
        ) {

            event.preventDefault();
            event.stopPropagation();

        }

    };


    /* ====================================================
       HOVER
    ==================================================== */

    const onMouseEnter = () => {

        isHovering = true;

    };


    const onMouseLeave = () => {

        isHovering = false;

        stopDragging();

    };


    /* ====================================================
       EVENTS
    ==================================================== */

    slider.addEventListener(
        'pointerdown',
        onPointerDown
    );


    slider.addEventListener(
        'pointermove',
        onPointerMove,
        {
            passive: false
        }
    );


    slider.addEventListener(
        'pointerup',
        stopDragging
    );


    slider.addEventListener(
        'pointercancel',
        stopDragging
    );


    slider.addEventListener(
        'click',
        onClick,
        true
    );


    slider.addEventListener(
        'mouseenter',
        onMouseEnter
    );


    slider.addEventListener(
        'mouseleave',
        onMouseLeave
    );


    /* ====================================================
       CHỐNG GHOST DRAG
    ==================================================== */

    slider
        .querySelectorAll(
            'img, a'
        )
        .forEach(
            element => {

                element.setAttribute(
                    'draggable',
                    'false'
                );

                element.addEventListener(
                    'dragstart',
                    event =>
                        event.preventDefault()
                );

            }
        );


    slider.style.cursor =
        'grab';

    slider.style.userSelect =
        'none';


    /* ====================================================
       RESIZE
       CHỈ RECALCULATE KHI KÍCH THƯỚC THAY ĐỔI
    ==================================================== */

    const resizeObserver =
        new ResizeObserver(
            () => {

                calculateLoopWidth();

                normalizeScroll();

            }
        );


    resizeObserver.observe(
        slider
    );


    /* ====================================================
       CLEANUP
    ==================================================== */

    slider._cancelSlider =
        () => {

            if (
                animationFrame
            ) {

                cancelAnimationFrame(
                    animationFrame
                );

                animationFrame =
                    null;

            }


            if (
                resetTimer
            ) {

                clearTimeout(
                    resetTimer
                );

                resetTimer =
                    null;

            }


            resizeObserver.disconnect();


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
                stopDragging
            );


            slider.removeEventListener(
                'click',
                onClick,
                true
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


// ========================================================
// 11. INIT
// ========================================================

window.onload =
    async function () {

        initBestSellerTabs();

        loadMainCategories();

        loadBrandsToMarquee();

        loadHomeBlogs();

        loadIndustries();


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
// 12. NÚT CUỘN BEST SELLER
// ========================================================

window.scrollBestSellers =
    function (
        amount
    ) {

        const slider =
            document.getElementById(
                'bestSellingGrid'
            );


        if (!slider) {
            return;
        }


        if (
            slider.scrollInterval
        ) {

            clearInterval(
                slider.scrollInterval
            );

        }


        if (
            slider.resumeTimeout
        ) {

            clearTimeout(
                slider.resumeTimeout
            );

        }


        slider.scrollBy({

            left:
                amount,

            behavior:
                'smooth'

        });


        slider.resumeTimeout =
            setTimeout(
                () => {

                    slider.dispatchEvent(
                        new Event(
                            'mouseleave'
                        )
                    );

                },
                600
            );

    };