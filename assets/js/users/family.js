// ========================================================
// FILE: assets/js/users/family.js
// Luồng:
// Category -> Subcategory -> Family -> Products
//
// Nâng cấp:
// - Promise.all
// - Dynamic SEO
// - Product Count
// - Breadcrumb
// - Client-side Search
// ========================================================

let allFamilies = [];


// ========================================================
// 1. FETCH FAMILY
// ========================================================

async function fetchFamilies() {

    if (
        typeof supabaseClient === 'undefined' ||
        !supabaseClient
    ) {
        throw new Error(
            'Supabase chưa khởi tạo.'
        );
    }


    const container =
        document.getElementById(
            'familyContainer'
        );

    const title =
        document.getElementById(
            'pageTitle'
        );

    const emptyState =
        document.getElementById(
            'emptyState'
        );


    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const subCatId =
        urlParams.get(
            'sub_category_id'
        );


    // ====================================================
    // KIỂM TRA URL
    // ====================================================

    if (!subCatId) {

        if (title) {
            title.textContent =
                'Lỗi đường dẫn';
        }

        emptyState?.classList.remove(
            'is-hidden'
        );

        return;
    }


    // ====================================================
    // LOADING SKELETON
    // ====================================================

    if (container) {

        container.innerHTML = Array(4)
            .fill(null)
            .map(() => `
                <div class="family-skeleton-card">

                    <div class="family-skeleton-title"></div>

                    <div class="family-skeleton-text"></div>

                </div>
            `)
            .join('');

    }


    try {

        // ==================================================
        // QUERY SONG SONG
        // ==================================================

        const [
            subCatRes,
            familiesRes
        ] = await Promise.all([

            supabaseClient
                .from('sub_categories')
                .select(
                    'name, category_id, categories(name)'
                )
                .eq(
                    'id',
                    subCatId
                )
                .single(),

            supabaseClient
                .from('families')
                .select(
                    '*, products(id)'
                )
                .eq(
                    'sub_category_id',
                    subCatId
                )
                .order(
                    'name',
                    {
                        ascending: true
                    }
                )

        ]);


        if (subCatRes.error) {
            throw subCatRes.error;
        }

        if (familiesRes.error) {
            throw familiesRes.error;
        }


        const subCatInfo =
            subCatRes.data;

        allFamilies =
            familiesRes.data || [];

        const familyCount =
            document.getElementById(
                'familyCount'
            );

        if (familyCount) {

            familyCount.textContent =
                allFamilies.length;

        }

        // ==================================================
        // SEO + BREADCRUMB
        // ==================================================

        if (subCatInfo) {

            const catName =
                subCatInfo.categories
                    ? subCatInfo.categories.name
                    : 'Danh mục';

            const catId =
                subCatInfo.category_id;

            const subName =
                subCatInfo.name;

            const currentUrl =
                window.location.href
                    .split('#')[0];

            const seoTitle =
                `${subName} | ${catName} | MRO Khang Nam`;

            const seoDesc =
                `MRO Khang Nam phân phối đầy đủ dòng sản phẩm ${subName} thuộc nhóm ${catName} chính hãng với giá tốt nhất.`;


            // ==================================================
            // META
            // ==================================================

            document.title =
                seoTitle;


            document
                .querySelector(
                    'meta[name="description"]'
                )
                ?.setAttribute(
                    'content',
                    seoDesc
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
                    seoTitle
                );


            document
                .getElementById(
                    'ogDesc'
                )
                ?.setAttribute(
                    'content',
                    seoDesc
                );


            // ==================================================
            // TITLE
            // ==================================================

            if (title) {
                title.textContent =
                    subName;
            }


            // ==================================================
            // BREADCRUMB
            // ==================================================

            const bcParent =
                document.getElementById(
                    'bcParentCategory'
                );

            const bcSeparator =
                document.getElementById(
                    'bcSeparator'
                );

            const bcCurrent =
                document.getElementById(
                    'bcCurrent'
                );


            if (
                bcParent &&
                catId
            ) {

                bcParent.href =
                    `subcategory.html?category_id=${encodeURIComponent(catId)}`;

                bcParent.textContent =
                    catName;

                bcParent.classList.remove(
                    'is-hidden'
                );


                if (bcSeparator) {

                    bcSeparator.classList.remove(
                        'is-hidden'
                    );

                }

            }


            if (bcCurrent) {

                bcCurrent.textContent =
                    subName;

                bcCurrent.classList.remove(
                    'catalog-breadcrumb-loading'
                );

            }


            // ==================================================
            // JSON-LD
            // ==================================================

            const schemaData = {

                '@context':
                    'https://schema.org',

                '@graph': [

                    {
                        '@type':
                            'BreadcrumbList',

                        itemListElement: [

                            {
                                '@type':
                                    'ListItem',

                                position: 1,

                                name:
                                    'Home',

                                item:
                                    window.location.origin
                            },

                            {
                                '@type':
                                    'ListItem',

                                position: 2,

                                name:
                                    'Danh Mục',

                                item:
                                    `${window.location.origin}/pages/category.html`
                            },

                            {
                                '@type':
                                    'ListItem',

                                position: 3,

                                name:
                                    catName,

                                item:
                                    `${window.location.origin}/pages/subcategory.html?category_id=${catId}`
                            },

                            {
                                '@type':
                                    'ListItem',

                                position: 4,

                                name:
                                    subName,

                                item:
                                    currentUrl
                            }

                        ]

                    },

                    {
                        '@type':
                            'CollectionPage',

                        name:
                            seoTitle,

                        description:
                            seoDesc
                    }

                ]

            };


            const schemaElement =
                document.getElementById(
                    'schemaJSON'
                );


            if (schemaElement) {

                schemaElement.textContent =
                    JSON.stringify(
                        schemaData
                    );

            }

        }


        // ==================================================
        // RENDER
        // ==================================================

        renderFamilies(
            allFamilies
        );


    } catch (error) {

        console.error(
            'Lỗi fetchFamilies:',
            error
        );


        if (container) {

            container.innerHTML = `
                <div class="catalog-error">
                    Lỗi hệ thống:
                    ${escapeFamilyHTML(
                        error.message
                    )}
                </div>
            `;

        }

    }

}


// ========================================================
// 2. RENDER FAMILY
// ========================================================

function renderFamilies(
    dataList
) {

    const container =
        document.getElementById(
            'familyContainer'
        );

    const emptyState =
        document.getElementById(
            'emptyState'
        );


    if (
        !container ||
        !emptyState
    ) {
        return;
    }


    // ====================================================
    // EMPTY
    // ====================================================

    if (
        dataList.length === 0
    ) {

        container.innerHTML = '';

        emptyState.classList.remove(
            'is-hidden'
        );

        return;
    }


    emptyState.classList.add(
        'is-hidden'
    );


    let html = '';


    dataList.forEach(
        family => {

            // ==================================================
            // PRODUCT COUNT
            // ==================================================

            const skuCount =
                family.products
                    ? family.products.length
                    : 0;


            // ==================================================
            // THUMBNAIL
            // ==================================================

            const thumbUrl =
                family.thumbnail_url ||
                'https://placehold.co/150x100/f5f6f8/a0aec0?text=No+Image';


            const familyName =
                family.name || '';


            // ==================================================
            // CARD
            // ==================================================

            html += `
                <a
                    href="products.html?family_id=${encodeURIComponent(family.id)}"
                    aria-label="Xem dòng sản phẩm ${escapeFamilyHTML(familyName)}"
                    class="family-card"
                >

                    <div class="family-card-image">

                        <img
                            src="${escapeFamilyHTML(thumbUrl)}"
                            alt="${escapeFamilyHTML(familyName)}"
                            class="family-card-image-element"
                            loading="lazy"
                            onerror="this.onerror=null;this.src='https://placehold.co/150x100/f5f6f8/a0aec0?text=No+Image';"
                        >

                    </div>


                    <div class="family-card-body">

                        <h2 class="family-card-title">
                            ${escapeFamilyHTML(familyName)}
                        </h2>


                        <div class="family-card-footer">

                            <span class="family-card-count">
                                ${skuCount} SKU
                            </span>

                            <span class="family-card-link">
                                Khám phá →
                            </span>

                        </div>

                    </div>

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

document
    .getElementById('searchFamily')
    ?.addEventListener(
        'input',
        function (event) {

            const keyword =
                event.target.value
                    .toLowerCase()
                    .trim();


            if (!keyword) {

                renderFamilies(
                    allFamilies
                );

                return;
            }


            const filtered =
                allFamilies.filter(
                    family => {

                        return (
                            family.name &&
                            family.name
                                .toLowerCase()
                                .includes(
                                    keyword
                                )
                        );

                    }
                );


            renderFamilies(
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

        await fetchFamilies();


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
// 5. ESCAPE HTML
// ========================================================

function escapeFamilyHTML(
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