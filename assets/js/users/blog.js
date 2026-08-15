// ========================================================
// FILE: assets/js/users/blog.js
// QUẢN LÝ TIN TỨC CHUẨN B2B
// - Normalize tiếng Việt
// - Auto Filter
// - Search
// - Pagination
// - Featured Post
// - Sidebar Latest Posts
// - Auth UI
// ========================================================

let allBlogsData = [];
let currentFilteredData = [];
let currentPage = 1;

const POSTS_PER_PAGE = 7;


// ========================================================
// 1. CHUẨN HÓA TEXT
// ========================================================

function normalizeText(text) {
    return (text || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}


// ========================================================
// 2. LOAD BLOG
// ========================================================

async function loadBlogs() {

    const skeleton = document.getElementById("skeletonLoading");
    const grid = document.getElementById("blogGrid");

    if (!grid || !skeleton) return;

    try {

        const { data, error } = await window.supabaseClient
            .from("blogs")
            .select(
                "id, title, slug, thumbnail, summary, created_at, content, category"
            )
            .eq("is_active", true)
            .order("created_at", {
                ascending: false
            });

        if (error) throw error;

        allBlogsData = data || [];

        // Sidebar bài viết mới nhất
        renderSidebarBlogList(allBlogsData);

        skeleton.classList.add("is-hidden");

        // Auto filter từ URL
        const urlParams = new URLSearchParams(
            window.location.search
        );

        const autoFilterCat = urlParams.get("cat");

        if (autoFilterCat) {

            filterBlog(
                autoFilterCat,
                null
            );

        } else {

            currentFilteredData = allBlogsData;

            renderBlogPage(1);
        }

    } catch (error) {

        console.error("Lỗi tải blog:", error);

        skeleton.classList.add("is-hidden");

        grid.innerHTML = `
            <div class="blog-error">
                Lỗi kết nối máy chủ: ${error.message}
            </div>
        `;
    }
}


// ========================================================
// 3. RENDER PAGE
// ========================================================

function renderBlogPage(page) {

    currentPage = page;

    const startIndex =
        (page - 1) * POSTS_PER_PAGE;

    const endIndex =
        startIndex + POSTS_PER_PAGE;

    const pageData =
        currentFilteredData.slice(
            startIndex,
            endIndex
        );

    renderBlogList(
        pageData,
        page
    );

    renderPagination(
        currentFilteredData.length,
        page
    );

    const filtersArea =
        document.getElementById(
            "categoryFilters"
        );

    if (
        filtersArea &&
        page > 1
    ) {
        filtersArea.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


// ========================================================
// 4. PAGINATION
// ========================================================

function renderPagination(
    totalItems,
    currentPage
) {

    const paginationContainer =
        document.getElementById(
            "paginationContainer"
        );

    if (!paginationContainer) return;

    const totalPages =
        Math.ceil(
            totalItems / POSTS_PER_PAGE
        );

    if (totalPages <= 1) {

        paginationContainer.innerHTML = "";

        return;
    }

    let html = "";

    // Previous
    if (currentPage > 1) {

        html += `
            <button
                type="button"
                onclick="renderBlogPage(${currentPage - 1})"
                class="blog-pagination-button"
            >
                &laquo; Trước
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
                <button
                    type="button"
                    class="blog-pagination-button is-active"
                >
                    ${i}
                </button>
            `;

        } else {

            html += `
                <button
                    type="button"
                    onclick="renderBlogPage(${i})"
                    class="blog-pagination-button"
                >
                    ${i}
                </button>
            `;
        }
    }


    // Next
    if (
        currentPage < totalPages
    ) {

        html += `
            <button
                type="button"
                onclick="renderBlogPage(${currentPage + 1})"
                class="blog-pagination-button"
            >
                Sau &raquo;
            </button>
        `;
    }

    paginationContainer.innerHTML = html;
}


// ========================================================
// 5. RENDER BLOG LIST
// ========================================================

function renderBlogList(
    data,
    page = 1
) {

    const featuredArea =
        document.getElementById(
            "featuredPostArea"
        );

    const grid =
        document.getElementById(
            "blogGrid"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );

    const countLabel =
        document.getElementById(
            "blogCount"
        );

    if (countLabel) {

        countLabel.textContent =
            `${currentFilteredData.length} bài viết`;
    }


    // Empty
    if (!data.length) {

        featuredArea.innerHTML = "";

        grid.innerHTML = "";

        emptyState.classList.remove(
            "is-hidden"
        );

        return;
    }


    emptyState.classList.add(
        "is-hidden"
    );


    const fallbackImage =
        "../assets/images/world mark.png";

    let remainingPosts = [];


    // ====================================================
    // FEATURED
    // ====================================================

    if (page === 1) {

        featuredArea.classList.remove(
            "is-hidden"
        );

        const featuredPost = data[0];

        const readTime1 =
            estimateReadTime(
                featuredPost.content ||
                featuredPost.summary
            );


        featuredArea.innerHTML = `

            <a
                href="blog-detail.html?slug=${featuredPost.slug}"
                class="blog-featured-card"
            >

                <div class="blog-featured-inner">

                    <!-- IMAGE -->
                    <div class="blog-featured-image-wrapper">

                        <img
                            src="${featuredPost.thumbnail || fallbackImage}"
                            onerror="this.onerror=null; this.src='${fallbackImage}';"
                            alt="${featuredPost.title}"
                            class="blog-featured-image"
                        >

                        <div class="blog-featured-badge">
                            Bài Nổi Bật
                        </div>

                    </div>


                    <!-- CONTENT -->
                    <div class="blog-featured-content">

                        <div class="blog-featured-meta">

                            <span class="blog-meta-item">

                                <svg
                                    class="blog-meta-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    ></path>
                                </svg>

                                ${formatDate(
                                    featuredPost.created_at
                                )}

                            </span>


                            <span class="blog-meta-item">

                                <svg
                                    class="blog-meta-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    ></path>
                                </svg>

                                Đọc ${readTime1} phút

                            </span>

                        </div>


                        <h2 class="blog-featured-title">
                            ${featuredPost.title}
                        </h2>


                        <p class="blog-featured-summary">
                            ${featuredPost.summary || ""}
                        </p>


                        <span class="blog-read-more featured">
                            Tìm hiểu thêm

                            <svg
                                class="blog-read-more-icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                ></path>
                            </svg>

                        </span>

                    </div>

                </div>

            </a>
        `;


        remainingPosts =
            data.slice(1);

    } else {

        featuredArea.classList.add(
            "is-hidden"
        );

        featuredArea.innerHTML = "";

        remainingPosts = data;
    }


    // ====================================================
    // NORMAL GRID
    // ====================================================

    let html = "";

    remainingPosts.forEach(
        post => {

            const readTime =
                estimateReadTime(
                    post.content ||
                    post.summary
                );


            html += `

                <article class="blog-card">

                    <!-- IMAGE -->

                    <a
                        href="blog-detail.html?slug=${post.slug}"
                        class="blog-card-image-link"
                    >

                        <img
                            src="${post.thumbnail || fallbackImage}"
                            onerror="this.onerror=null; this.src='${fallbackImage}';"
                            alt="${post.title}"
                            loading="lazy"
                            class="blog-card-image"
                        >

                    </a>


                    <!-- BODY -->

                    <div class="blog-card-body">

                        <div class="blog-card-meta">

                            <span>
                                ${formatDate(
                                    post.created_at
                                )}
                            </span>

                            <span>
                                Đọc ${readTime} phút
                            </span>

                        </div>


                        <a
                            href="blog-detail.html?slug=${post.slug}"
                            class="blog-card-title-link"
                        >

                            <h3 class="blog-card-title">
                                ${post.title}
                            </h3>

                        </a>


                        <p class="blog-card-summary">
                            ${post.summary || ""}
                        </p>


                        <a
                            href="blog-detail.html?slug=${post.slug}"
                            class="blog-card-read-more"
                        >

                            Đọc tiếp

                            <svg
                                class="blog-read-more-icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                                ></path>
                            </svg>

                        </a>

                    </div>

                </article>
            `;
        }
    );

    grid.innerHTML = html;
}


// ========================================================
// 6. FILTER CATEGORY
// ========================================================

window.filterBlog = function (
    keyword,
    btnElement
) {

    document
        .querySelectorAll(".cat-btn")
        .forEach(btn => {

            btn.classList.remove(
                "is-active"
            );

        });


    if (btnElement) {

        btnElement.classList.add(
            "is-active"
        );

    } else {

        const targetBtn =
            document.querySelector(
                `.cat-btn[data-cat="${keyword}"]`
            );

        if (targetBtn) {

            targetBtn.classList.add(
                "is-active"
            );
        }
    }


    if (keyword === "ALL") {

        currentFilteredData =
            allBlogsData;

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

    } else {

        currentFilteredData =
            allBlogsData.filter(
                post => {

                    if (!post.category) {
                        return false;
                    }

                    return (
                        post.category.toLowerCase() ===
                        keyword.toLowerCase()
                    );
                }
            );
    }


    renderBlogPage(1);
};


// ========================================================
// 7. SEARCH
// ========================================================

window.handleSearch = function () {

    const input =
        document.getElementById(
            "blogSearchInput"
        );

    if (!input) return;


    const keyword =
        normalizeText(
            input.value.trim()
        );


    document
        .querySelectorAll(".cat-btn")
        .forEach(btn => {

            btn.classList.remove(
                "is-active"
            );

        });


    if (!keyword) {

        const allBtn =
            document.querySelector(
                '.cat-btn[data-cat="ALL"]'
            );

        if (allBtn) {

            allBtn.classList.add(
                "is-active"
            );
        }

        currentFilteredData =
            allBlogsData;

    } else {

        currentFilteredData =
            allBlogsData.filter(
                post => {

                    const safeTitle =
                        normalizeText(
                            post.title
                        );

                    const safeSummary =
                        normalizeText(
                            post.summary
                        );

                    const safeCategory =
                        normalizeText(
                            post.category
                        );

                    const safeSlug =
                        normalizeText(
                            post.slug
                        );

                    const safeContent =
                        normalizeText(
                            (post.content || "")
                                .replace(
                                    /(<([^>]+)>)/gi,
                                    ""
                                )
                        );


                    return (
                        safeTitle.includes(keyword) ||
                        safeSummary.includes(keyword) ||
                        safeCategory.includes(keyword) ||
                        safeSlug.includes(keyword) ||
                        safeContent.includes(keyword)
                    );
                }
            );
    }


    renderBlogPage(1);
};


// ========================================================
// 8. SEARCH EVENTS
// ========================================================

document
    .getElementById("blogSearchInput")
    ?.addEventListener(
        "input",
        window.handleSearch
    );


document
    .getElementById("blogSearchInput")
    ?.addEventListener(
        "keypress",
        function (e) {

            if (e.key === "Enter") {

                e.preventDefault();

                window.handleSearch();
            }

        }
    );


// ========================================================
// 9. READ TIME
// ========================================================

function estimateReadTime(text) {

    if (!text) return 2;

    const wordCount =
        text
            .replace(
                /(<([^>]+)>)/gi,
                ""
            )
            .split(/\s+/)
            .length;

    const time =
        Math.ceil(
            wordCount / 200
        );

    return time < 1
        ? 1
        : time;
}


// ========================================================
// 10. FORMAT DATE
// ========================================================

function formatDate(
    dateString
) {

    const d =
        new Date(dateString);

    return `
        ${d.getDate()
            .toString()
            .padStart(2, "0")
        }/
        ${(
            d.getMonth() + 1
        )
            .toString()
            .padStart(2, "0")
        }/
        ${d.getFullYear()}
    `;
}


// ========================================================
// 11. SIDEBAR BLOG
// ========================================================

function renderSidebarBlogList(
    data
) {

    const container =
        document.getElementById(
            "sidebarBlogList"
        );

    if (!container) return;


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `
            <p class="blog-sidebar-empty">
                Chưa có bài viết nào.
            </p>
        `;

        return;
    }


    const recentPosts =
        data.slice(0, 5);

    let html = "";

    const fallbackImage =
        "../assets/images/world mark.png";


    recentPosts.forEach(
        post => {

            html += `

                <a
                    href="blog-detail.html?slug=${post.slug}"
                    class="blog-sidebar-post"
                >

                    <div class="blog-sidebar-post-image-wrapper">

                        <img
                            src="${post.thumbnail || fallbackImage}"
                            onerror="this.onerror=null; this.src='${fallbackImage}';"
                            alt="${post.title}"
                            class="blog-sidebar-post-image"
                        >

                    </div>


                    <div class="blog-sidebar-post-content">

                        <h4 class="blog-sidebar-post-title">
                            ${post.title}
                        </h4>

                        <span class="blog-sidebar-post-date">
                            ${formatDate(
                                post.created_at
                            )}
                        </span>

                    </div>

                </a>
            `;
        }
    );


    container.innerHTML = html;
}


// ========================================================
// 12. DOM READY
// ========================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadBlogs();


        if (
            typeof window.checkCustomerAuth ===
            "function"
        ) {

            try {

                const user =
                    await window.checkCustomerAuth();

                if (user) {

                    document
                        .getElementById(
                            "btnGuestLogin"
                        )
                        ?.classList.add(
                            "is-hidden"
                        );


                    const userProfileBtn =
                        document.getElementById(
                            "btnUserProfile"
                        );

                    if (
                        userProfileBtn
                    ) {

                        userProfileBtn.classList.remove(
                            "is-hidden"
                        );

                        userProfileBtn.classList.add(
                            "is-flex"
                        );
                    }
                }

            } catch (err) {

                console.error(
                    "Lỗi xác thực:",
                    err
                );
            }
        }
    }
);