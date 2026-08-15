// ========================================================
// FILE: assets/js/users/subcategory.js
// Nâng cấp:
// - Promise.all
// - Dynamic SEO Meta
// - JSON-LD
// - Live Search
// - Product Count
// ========================================================

let allSubCats = [];
let productCounts = {};

const fallbackIcons = [
    '📦',
    '🔧',
    '⚙️',
    '🛠',
    '🧰',
    '🔩'
];


// ========================================================
// 1. FETCH SUBCATEGORIES
// ========================================================

async function fetchSubCategories() {

    if (!window.supabaseClient) {
        throw new Error(
            'Supabase chưa khởi tạo.'
        );
    }


    const container =
        document.getElementById(
            'subCategoryContainer'
        );

    const skeleton =
        document.getElementById(
            'skeletonLoading'
        );

    const emptyState =
        document.getElementById(
            'emptyState'
        );

    const title =
        document.getElementById(
            'pageTitle'
        );

    const bcCategory =
        document.getElementById(
            'bcCategory'
        );


    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const catId =
        urlParams.get(
            'category_id'
        );


    // ====================================================
    // KHÔNG CÓ CATEGORY ID
    // ====================================================

    if (!catId) {

        skeleton?.classList.add(
            'is-hidden'
        );

        emptyState?.classList.remove(
            'is-hidden'
        );

        if (title) {
            title.textContent =
                'Lỗi đường dẫn';
        }

        return;
    }


    // ====================================================
    // LOAD RELATED CATEGORY
    // ====================================================

    loadRelatedCategories(catId);


    try {

        // ==================================================
        // 3 QUERY CHẠY SONG SONG
        // ==================================================

        const [
            catRes,
            subRes,
            prodRes
        ] = await Promise.all([

            window.supabaseClient
                .from('categories')
                .select('name')
                .eq('id', catId)
                .single(),

            window.supabaseClient
                .from('sub_categories')
                .select('*')
                .eq(
                    'category_id',
                    catId
                )
                .order(
                    'id',
                    {
                        ascending: true
                    }
                ),

            window.supabaseClient
                .from('products')
                .select('sub_category_id')
                .eq(
                    'category_id',
                    catId
                )

        ]);


        if (catRes.error) {
            throw catRes.error;
        }

        if (subRes.error) {
            throw subRes.error;
        }


        const catInfo =
            catRes.data;

        allSubCats =
            subRes.data || [];


        // ==================================================
        // RESET PRODUCT COUNTS
        // ==================================================

        productCounts = {};


        // ==================================================
        // ĐẾM PRODUCT
        // ==================================================

        if (prodRes.data) {

            prodRes.data.forEach(
                product => {

                    if (
                        product.sub_category_id
                    ) {

                        productCounts[
                            product.sub_category_id
                        ] =
                            (
                                productCounts[
                                    product.sub_category_id
                                ] || 0
                            ) + 1;

                    }

                }
            );

        }


        // ==================================================
        // DYNAMIC SEO
        // ==================================================

        if (catInfo) {

            const categoryName =
                catInfo.name;


            if (title) {
                title.textContent =
                    categoryName;
            }


            if (bcCategory) {
                bcCategory.textContent =
                    categoryName;
            }


            const dynamicTitle =
                `${categoryName} - Danh mục nhóm hàng | MRO Khang Nam`;


            const dynamicDesc =
                `Khám phá các nhóm sản phẩm thuộc danh mục ${categoryName} chính hãng. Cập nhật các dòng vật tư công nghiệp mới nhất tại MRO Khang Nam.`;


            const currentUrl =
                window.location.href.split('#')[0];


            document.title =
                dynamicTitle;


            document
                .querySelector(
                    'meta[name="description"]'
                )
                ?.setAttribute(
                    'content',
                    dynamicDesc
                );


            document
                .getElementById(
                    'canonicalUrl'
                )
                ?.setAttribute(
                    'href',
                    currentUrl
                );


            document
                .getElementById(
                    'ogUrl'
                )
                ?.setAttribute(
                    'content',
                    currentUrl
                );


            document
                .getElementById(
                    'ogTitle'
                )
                ?.setAttribute(
                    'content',
                    dynamicTitle
                );


            document
                .getElementById(
                    'ogDesc'
                )
                ?.setAttribute(
                    'content',
                    dynamicDesc
                );


            // ==================================================
            // JSON-LD
            // ==================================================

            const schemaData = {

                '@context':
                    'https://schema.org',

                '@type':
                    'BreadcrumbList',

                itemListElement: [

                    {
                        '@type':
                            'ListItem',

                        position: 1,

                        name:
                            'Trang chủ',

                        item:
                            window.location.origin
                    },

                    {
                        '@type':
                            'ListItem',

                        position: 2,

                        name:
                            'Nhóm Hàng',

                        item:
                            `${window.location.origin}/category.html`
                    },

                    {
                        '@type':
                            'ListItem',

                        position: 3,

                        name:
                            categoryName,

                        item:
                            currentUrl
                    }

                ]

            };


            const schemaElement =
                document.getElementById(
                    'breadcrumbSchema'
                );


            if (schemaElement) {

                schemaElement.textContent =
                    JSON.stringify(
                        schemaData
                    );

            }

        }


        // ==================================================
        // HIDE SKELETON
        // ==================================================

        skeleton?.classList.add(
            'is-hidden'
        );


        // ==================================================
        // EMPTY
        // ==================================================

        if (
            allSubCats.length === 0
        ) {

            emptyState?.classList.remove(
                'is-hidden'
            );

            return;
        }


        // ==================================================
        // RENDER
        // ==================================================

        container?.classList.remove(
            'is-hidden'
        );

        renderSubCategories(
            allSubCats
        );


    } catch (error) {

        console.error(
            'Lỗi fetchSubCategories:',
            error
        );


        skeleton?.classList.add(
            'is-hidden'
        );


        container?.classList.remove(
            'is-hidden'
        );


        if (container) {

            container.innerHTML = `
                <div class="subcategory-error">
                    Lỗi kết nối:
                    ${escapeHTML(
                        error.message
                    )}
                </div>
            `;

        }

    }
}


// ========================================================
// 2. RENDER SUBCATEGORY
// ========================================================

function renderSubCategories(
    dataList
) {

    const container =
        document.getElementById(
            'subCategoryContainer'
        );

    const emptyState =
        document.getElementById(
            'emptyState'
        );


    if (!container || !emptyState) {
        return;
    }


    // ====================================================
    // EMPTY SEARCH
    // ====================================================

    if (
        dataList.length === 0
    ) {

        container.innerHTML = '';

        container.classList.add(
            'is-hidden'
        );

        emptyState.classList.remove(
            'is-hidden'
        );

        return;
    }


    emptyState.classList.add(
        'is-hidden'
    );


    container.classList.remove(
        'is-hidden'
    );


    let html = '';


    dataList.forEach(
        (sub, index) => {

            const icon =
                fallbackIcons[
                    index %
                    fallbackIcons.length
                ];


            const pCount =
                productCounts[
                    sub.id
                ] || 0;


            html += `
                <a
                    href="family.html?sub_category_id=${encodeURIComponent(sub.id)}"
                    class="subcategory-card"
                    aria-label="Xem nhóm hàng ${escapeHTML(sub.name)}"
                >

                    <div class="subcategory-card-overlay"></div>


                    <span class="subcategory-card-icon">
                        ${icon}
                    </span>


                    <h2 class="subcategory-card-title">
                        ${escapeHTML(sub.name)}
                    </h2>


                    <span class="subcategory-card-count">
                        ${pCount} sản phẩm
                    </span>

                </a>
            `;

        }
    );


    container.innerHTML =
        html;
}


// ========================================================
// 3. LIVE SEARCH
// ========================================================

const searchInput =
    document.getElementById(
        'searchSubcat'
    );


searchInput?.addEventListener(
    'input',
    function (event) {

        const keyword =
            event.target.value
                .toLowerCase()
                .trim();


        if (!keyword) {

            renderSubCategories(
                allSubCats
            );

            return;
        }


        const filtered =
            allSubCats.filter(
                sub => {

                    return (
                        sub.name &&
                        sub.name
                            .toLowerCase()
                            .includes(
                                keyword
                            )
                    );

                }
            );


        renderSubCategories(
            filtered
        );

    }
);


// ========================================================
// 4. AUTH
// ========================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        await fetchSubCategories();


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


                    const userProfileBtn =
                        document.getElementById(
                            'btnUserProfile'
                        );


                    if (userProfileBtn) {

                        userProfileBtn.classList.remove(
                            'is-hidden'
                        );

                    }

                }

            } catch (error) {

                console.error(
                    'Lỗi khi check auth:',
                    error
                );

            }

        }

    }
);


// ========================================================
// 5. RELATED CATEGORIES
// ========================================================

async function loadRelatedCategories(
    currentCatId
) {

    const container =
        document.getElementById(
            'relatedCategoriesContainer'
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
                .from('categories')
                .select(
                    'id, name'
                )
                .neq(
                    'id',
                    currentCatId
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
                <span class="subcategory-related-empty">
                    Không có dữ liệu.
                </span>
            `;

            return;
        }


        let html = '';


        data.forEach(
            category => {

                html += `
                    <a
                        href="subcategory.html?category_id=${encodeURIComponent(category.id)}"
                        class="subcategory-related-link"
                    >
                        ${escapeHTML(
                            category.name
                        )}
                    </a>
                `;

            }
        );


        container.innerHTML =
            html;


    } catch (error) {

        console.error(
            'Lỗi tải danh mục liên quan:',
            error
        );

        container.innerHTML = '';

    }
}


// ========================================================
// 6. ESCAPE HTML
// ========================================================

function escapeHTML(
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