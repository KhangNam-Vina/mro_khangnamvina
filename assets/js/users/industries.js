// ========================================================
// FILE: assets/js/users/industries.js
// LOGIC QUẢN LÝ TRANG NGÀNH HÀNG B2B
// ========================================================

let allIndustriesData = [];
let filteredData = [];

const ITEMS_PER_PAGE = 6;
let currentPage = 1;


// ========================================================
// LOAD INDUSTRIES
// ========================================================

async function loadIndustries() {

    const grid = document.getElementById('industryGrid');
    const countLabel = document.getElementById('industryCount');

    if (!grid) return;

    try {

        const { data, error } = await window.supabaseClient
            .from('industries')
            .select('*')
            .neq('is_active', false)
            .order('id', { ascending: true });

        if (error) {
            throw error;
        }

        allIndustriesData = data || [];
        filteredData = [...allIndustriesData];

        if (countLabel) {
            countLabel.textContent =
                `${allIndustriesData.length} Ngành Phục Vụ`;
        }

        renderPage();

        // ==================================================
        // SEARCH
        // ==================================================

        const searchInput =
            document.getElementById('searchIndustry');

        if (searchInput) {

            searchInput.addEventListener('input', (e) => {

                const keyword =
                    e.target.value.toLowerCase().trim();

                filteredData =
                    allIndustriesData.filter(industry => {

                        const name =
                            industry.name?.toLowerCase() || '';

                        const description =
                            industry.description?.toLowerCase() || '';

                        return (
                            name.includes(keyword) ||
                            description.includes(keyword)
                        );
                    });

                currentPage = 1;

                renderPage();
            });
        }

    } catch (error) {

        console.error(
            'Lỗi tải trang Ngành hàng:',
            error
        );

        grid.innerHTML = `
            <div class="industries-error">
                Lỗi kết nối máy chủ:
                ${error.message}
            </div>
        `;

        if (countLabel) {
            countLabel.textContent = 'Lỗi dữ liệu';
        }
    }
}


// ========================================================
// RENDER PAGE
// ========================================================

function renderPage() {

    const from =
        (currentPage - 1) * ITEMS_PER_PAGE;

    const to =
        from + ITEMS_PER_PAGE;

    const currentItems =
        filteredData.slice(from, to);

    renderIndustryGrid(currentItems);

    renderPagination(filteredData.length);
}


// ========================================================
// RENDER INDUSTRY GRID
// ========================================================

function renderIndustryGrid(data) {

    const grid =
        document.getElementById('industryGrid');

    const emptyState =
        document.getElementById('emptyState');

    const paginationContainer =
        document.getElementById('paginationContainer');

    if (!grid) return;

    // Không có dữ liệu
    if (!data || data.length === 0) {

        grid.innerHTML = '';
        grid.classList.add('hidden');

        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }

        if (emptyState) {
            emptyState.classList.remove('hidden');
        }

        return;
    }

    grid.classList.remove('hidden');

    if (emptyState) {
        emptyState.classList.add('hidden');
    }


    let html = '';


    data.forEach(item => {

        // ==================================================
        // FEATURES
        // ==================================================

        let featuresHtml = '';
        let featureList = [];

        try {

            if (Array.isArray(item.features)) {

                featureList = item.features;

            } else if (
                typeof item.features === 'string'
            ) {

                featureList =
                    JSON.parse(item.features);
            }

        } catch (error) {

            featureList = [];
        }


        if (
            featureList &&
            featureList.length > 0
        ) {

            featureList
                .slice(0, 3)
                .forEach(feature => {

                    featuresHtml += `
                        <li class="industry-feature">

                            <svg
                                class="industry-feature-icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M5 13l4 4L19 7"
                                ></path>
                            </svg>

                            <span class="industry-feature-text">
                                ${feature}
                            </span>

                        </li>
                    `;
                });

        } else {

            featuresHtml = `
                <li class="industry-feature industry-feature-empty">
                    Đang cập nhật danh mục giải pháp...
                </li>
            `;
        }


        // ==================================================
        // CARD
        // ==================================================

        html += `
            <article class="industry-card">

                <div class="industry-card-image">

                    <div class="industry-card-overlay"></div>

                    <img
                        src="${item.image_url || '../assets/images/world mark.png'}"
                        alt="Vật tư ngành ${item.name}"
                        loading="lazy"
                        class="industry-image"
                        onerror="this.onerror=null; this.src='../assets/images/world mark.png';"
                    >

                    <div class="industry-card-hover">
                        <span class="industry-card-hover-text">
                            Xem Danh Mục SP
                        </span>
                    </div>

                </div>


                <div class="industry-card-body">

                    <h3 class="industry-card-title">
                        ${item.name}
                    </h3>

                    <p class="industry-card-description">
                        ${
                            item.description ||
                            'Cung cấp giải pháp vật tư công nghiệp toàn diện MRO chuyên nghiệp.'
                        }
                    </p>


                    <ul class="industry-feature-list">
                        ${featuresHtml}
                    </ul>


                    <div class="industry-card-footer">

                        <a
                            href="products.html?industry_id=${item.id}"
                            class="industry-card-link"
                        >
                            <span>
                                Truy cập giải pháp
                            </span>

                            <svg
                                class="industry-card-arrow"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                ></path>
                            </svg>
                        </a>

                    </div>

                </div>

            </article>
        `;
    });


    grid.innerHTML = html;
}


// ========================================================
// PAGINATION
// ========================================================

function renderPagination(totalItems) {

    const paginationContainer =
        document.getElementById('paginationContainer');

    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    const totalPages =
        Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (totalPages <= 1) return;


    let html = '';


    // Previous
    if (currentPage > 1) {

        html += `
            <button
                type="button"
                onclick="changePage(${currentPage - 1})"
                class="industry-pagination-button industry-pagination-arrow"
            >
                &laquo;
            </button>
        `;
    }


    // Page numbers
    for (
        let i = 1;
        i <= totalPages;
        i++
    ) {

        if (i === currentPage) {

            html += `
                <span
                    class="industry-pagination-button industry-pagination-current"
                >
                    ${i}
                </span>
            `;

        } else {

            html += `
                <button
                    type="button"
                    onclick="changePage(${i})"
                    class="industry-pagination-button"
                >
                    ${i}
                </button>
            `;
        }
    }


    // Next
    if (currentPage < totalPages) {

        html += `
            <button
                type="button"
                onclick="changePage(${currentPage + 1})"
                class="industry-pagination-button industry-pagination-arrow"
            >
                &raquo;
            </button>
        `;
    }


    paginationContainer.innerHTML = html;
}


// ========================================================
// CHANGE PAGE
// ========================================================

window.changePage = function (pageNumber) {

    currentPage = pageNumber;

    renderPage();

    document
        .getElementById('industryCount')
        ?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
};


// ========================================================
// INIT
// ========================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        await loadIndustries();


        // ==================================================
        // AUTH UI
        // ==================================================

        if (
            typeof window.checkCustomerAuth ===
            'function'
        ) {

            try {

                const user =
                    await window.checkCustomerAuth();

                if (user) {

                    document
                        .getElementById('btnGuestLogin')
                        ?.classList.add('hidden');


                    const userProfileBtn =
                        document.getElementById(
                            'btnUserProfile'
                        );

                    if (userProfileBtn) {

                        userProfileBtn
                            .classList.remove('hidden');

                        userProfileBtn
                            .classList.add('flex');
                    }
                }

            } catch (err) {

                console.error(
                    'Lỗi xác thực Auth:',
                    err
                );
            }
        }
    }
);