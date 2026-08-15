// ========================================================
// FILE: assets/js/users/brands.js
// ENGINE LỌC, TÌM KIẾM & PHÂN TRANG THƯƠNG HIỆU CHUẨN B2B
// ========================================================

let allBrandsData = [];
let currentFilteredData = [];
let currentLetterFilter = 'ALL';

let currentPage = 1;
const ITEMS_PER_PAGE = 18;


// ========================================================
// INIT
// ========================================================

async function initBrandsPage() {

    if (!window.supabaseClient) {
        console.error("Supabase chưa khởi tạo.");
        return;
    }

    try {

        const { data, error } = await window.supabaseClient
            .from('brands')
            .select('id, name, products(id)')
            .order('name', { ascending: true });

        if (error) throw error;

        allBrandsData = (data || []).map(brand => ({
            id: brand.id,
            name: brand.name,
            productCount: brand.products
                ? brand.products.length
                : 0
        }));

        currentFilteredData = allBrandsData;

        const statBrands = document.getElementById('statBrands');

        if (statBrands) {
            statBrands.innerText = `${allBrandsData.length}+`;
        }

        buildAZFilter();
        renderFeaturedBrands();
        renderFilteredBrands();

        const searchInput = document.getElementById('searchBrand');

        if (searchInput) {
            searchInput.addEventListener(
                'input',
                handleSearch
            );
        }

    } catch (err) {

        console.error(
            "Lỗi lấy dữ liệu brands:",
            err
        );

        const container =
            document.getElementById(
                'brandsContainer'
            );

        if (container) {

            container.innerHTML = `
                <div class="brand-error">
                    Lỗi kết nối máy chủ:
                    ${err.message}
                </div>
            `;
        }
    }
}


// ========================================================
// A-Z FILTER
// ========================================================

function buildAZFilter() {

    const filterContainer =
        document.getElementById('azFilter');

    if (!filterContainer) return;

    const alphabet =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    let html = `
        <button
            type="button"
            onclick="filterByLetter('ALL')"
            id="btn-filter-ALL"
            class="brand-letter-button is-active"
        >
            All
        </button>
    `;

    alphabet.forEach(letter => {

        const hasBrands =
            allBrandsData.some(
                brand =>
                    brand.name
                        .toUpperCase()
                        .startsWith(letter)
            );

        if (hasBrands) {

            html += `
                <button
                    type="button"
                    onclick="filterByLetter('${letter}')"
                    id="btn-filter-${letter}"
                    class="brand-letter-button"
                >
                    ${letter}
                </button>
            `;

        } else {

            html += `
                <button
                    type="button"
                    disabled
                    class="brand-letter-button is-disabled"
                >
                    ${letter}
                </button>
            `;
        }

    });

    filterContainer.innerHTML = html;
}


// ========================================================
// FILTER LETTER
// ========================================================

window.filterByLetter = function(letter) {

    currentLetterFilter = letter;

    const searchInput =
        document.getElementById('searchBrand');

    if (searchInput) {
        searchInput.value = '';
    }

    currentPage = 1;

    document
        .querySelectorAll('#azFilter button')
        .forEach(button => {

            if (!button.disabled) {

                button.classList.remove(
                    'is-active'
                );
            }
        });

    const activeButton =
        document.getElementById(
            `btn-filter-${letter}`
        );

    if (activeButton) {
        activeButton.classList.add(
            'is-active'
        );
    }


    if (letter !== 'ALL') {

        currentFilteredData =
            allBrandsData.filter(
                brand =>
                    brand.name
                        .toUpperCase()
                        .startsWith(letter)
            );

        const filterText =
            document.getElementById(
                'currentFilterText'
            );

        if (filterText) {
            filterText.innerText =
                `(Bắt đầu bằng chữ ${letter})`;
        }

    } else {

        currentFilteredData =
            allBrandsData;

        const filterText =
            document.getElementById(
                'currentFilterText'
            );

        if (filterText) {
            filterText.innerText = '';
        }
    }

    renderFilteredBrands();
};


// ========================================================
// SEARCH
// ========================================================

function handleSearch(event) {

    const keyword =
        event.target.value
            .toLowerCase()
            .trim();

    currentPage = 1;

    if (keyword) {

        currentLetterFilter = 'ALL';

        const filterText =
            document.getElementById(
                'currentFilterText'
            );

        if (filterText) {
            filterText.innerText =
                `(Kết quả tìm kiếm: "${keyword}")`;
        }

        document
            .querySelectorAll('#azFilter button')
            .forEach(button => {

                if (!button.disabled) {
                    button.classList.remove(
                        'is-active'
                    );
                }
            });

        document
            .getElementById('btn-filter-ALL')
            ?.classList.add('is-active');

    } else {

        const filterText =
            document.getElementById(
                'currentFilterText'
            );

        if (filterText) {
            filterText.innerText = '';
        }
    }


    currentFilteredData =
        allBrandsData.filter(
            brand =>
                brand.name
                    .toLowerCase()
                    .includes(keyword)
        );

    renderFilteredBrands();
}


// ========================================================
// FEATURED
// ========================================================

function renderFeaturedBrands() {

    const container =
        document.getElementById(
            'featuredBrands'
        );

    if (!container) return;

    const featured =
        [...allBrandsData]
            .sort(
                (a, b) =>
                    b.productCount -
                    a.productCount
            )
            .slice(0, 6);

    let html = '';

    featured.forEach(brand => {
        html += generateBrandCard(
            brand,
            true
        );
    });

    container.innerHTML = html;
}


// ========================================================
// FILTERED BRANDS
// ========================================================

function renderFilteredBrands() {

    const container =
        document.getElementById(
            'brandsContainer'
        );

    const emptyState =
        document.getElementById(
            'emptyState'
        );

    const countText =
        document.getElementById(
            'brandCountText'
        );

    const paginationContainer =
        document.getElementById(
            'paginationContainer'
        );

    if (!container) return;

    const totalItems =
        currentFilteredData.length;

    if (countText) {
        countText.innerText =
            `${totalItems} Thương Hiệu`;
    }


    if (totalItems === 0) {

        container.innerHTML = '';

        container.classList.add(
            'is-hidden'
        );

        emptyState?.classList.remove(
            'is-hidden'
        );

        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }

        return;
    }


    container.classList.remove(
        'is-hidden'
    );

    emptyState?.classList.add(
        'is-hidden'
    );


    const totalPages =
        Math.ceil(
            totalItems /
            ITEMS_PER_PAGE
        );

    const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

    const endIndex =
        startIndex +
        ITEMS_PER_PAGE;

    const paginatedData =
        currentFilteredData.slice(
            startIndex,
            endIndex
        );


    let html = '';

    paginatedData.forEach(brand => {

        html += generateBrandCard(
            brand,
            false
        );

    });

    container.innerHTML = html;

    renderPagination(totalPages);
}


// ========================================================
// PAGINATION
// ========================================================

function renderPagination(totalPages) {

    const container =
        document.getElementById(
            'paginationContainer'
        );

    if (!container) return;

    if (totalPages <= 1) {

        container.innerHTML = '';
        return;
    }

    let html = '';


    if (currentPage > 1) {

        html += `
            <button
                type="button"
                onclick="changePage(${currentPage - 1})"
                class="brand-pagination-button brand-pagination-arrow"
            >
                «
            </button>
        `;
    }


    for (
        let i = 1;
        i <= totalPages;
        i++
    ) {

        if (i === currentPage) {

            html += `
                <button
                    type="button"
                    class="brand-pagination-button is-current"
                >
                    ${i}
                </button>
            `;

        } else {

            html += `
                <button
                    type="button"
                    onclick="changePage(${i})"
                    class="brand-pagination-button"
                >
                    ${i}
                </button>
            `;
        }
    }


    if (currentPage < totalPages) {

        html += `
            <button
                type="button"
                onclick="changePage(${currentPage + 1})"
                class="brand-pagination-button brand-pagination-arrow"
            >
                »
            </button>
        `;
    }

    container.innerHTML = html;
}


// ========================================================
// CHANGE PAGE
// ========================================================

window.changePage = function(page) {

    currentPage = page;

    renderFilteredBrands();

    const list =
        document.getElementById(
            'brandsContainer'
        );

    if (!list) return;

    const listTop =
        list.offsetTop;

    window.scrollTo({
        top: listTop - 150,
        behavior: 'smooth'
    });
};


// ========================================================
// RESET FILTER
// ========================================================

window.resetFilters = function() {

    filterByLetter('ALL');
};


// ========================================================
// GENERATE BRAND CARD
// ========================================================

function generateBrandCard(
    brand,
    isFeatured
) {

    const link =
        `products.html?brand_id=${brand.id}`;

    const featureClass =
        isFeatured
            ? 'brand-card-featured'
            : '';

    return `
        <a
            href="${link}"
            class="brand-card ${featureClass}"
            title="${brand.name}"
        >

            <div class="brand-card-main">

                <h3 class="brand-card-title">
                    ${brand.name}
                </h3>

            </div>


            <div class="brand-card-hover">

                <span class="brand-card-hover-name">
                    ${brand.name}
                </span>

                <span class="brand-card-hover-count">
                    ${brand.productCount} Sản phẩm →
                </span>

            </div>

        </a>
    `;
}


// ========================================================
// INIT
// ========================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await initBrandsPage();

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
                            "hidden"
                        );

                    const userProfileBtn =
                        document.getElementById(
                            "btnUserProfile"
                        );

                    if (userProfileBtn) {

                        userProfileBtn.classList.remove(
                            "hidden"
                        );

                        userProfileBtn.classList.add(
                            "flex"
                        );
                    }
                }

            } catch (err) {

                console.error(
                    "Lỗi check auth:",
                    err
                );
            }
        }
    }
);