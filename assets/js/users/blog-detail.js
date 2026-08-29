// ========================================================
// FILE: assets/js/users/blog-detail.js
// TRANG CHI TIẾT BÀI VIẾT
// Tách hoàn toàn UI khỏi Tailwind
// ========================================================

'use strict';


// ========================================================
// 1. LẤY CHI TIẾT BÀI VIẾT
// ========================================================

async function fetchBlogDetail() {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const slug =
        urlParams.get('slug');


    if (!slug) {

        showError();

        return;
    }


    try {

        // ------------------------------------------------
        // SUPABASE
        // ------------------------------------------------

        const {
            data,
            error
        } = await window.supabaseClient
            .from('blogs')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .single();


        if (error || !data) {

            throw (
                error ||
                new Error(
                    'Không tìm thấy bài viết.'
                )
            );
        }


        // ------------------------------------------------
        // TĂNG VIEW
        // ------------------------------------------------

        window.supabaseClient
            .rpc(
                'increment_blog_view',
                {
                    blog_slug: slug
                }
            )
            .then(
                ({ error }) => {

                    if (error) {

                        console.error(
                            'Lỗi tăng view:',
                            error
                        );
                    }
                }
            );


        // ------------------------------------------------
        // LOADING -> ARTICLE
        // ------------------------------------------------

        document
            .getElementById('loadingState')
            ?.classList.add(
                'is-hidden'
            );


        document
            .getElementById('blogArticle')
            ?.classList.remove(
                'is-hidden'
            );


        // ------------------------------------------------
        // SEO
        // ------------------------------------------------

        updateSEO(data);


        // ------------------------------------------------
        // CATEGORY
        // ------------------------------------------------

        const badge =
            document.getElementById(
                'blogCategoryBadge'
            );


        if (badge) {

            const catName =
                data.category &&
                data.category !== 'ALL'

                    ? data.category
                    : 'Tin Tức Chung';


            const filterValue =
                data.category &&
                data.category !== 'ALL'

                    ? data.category
                    : 'ALL';


            badge.textContent =
                catName;


            badge.href =
                `blog.html?cat=${encodeURIComponent(
                    filterValue
                )}`;
        }


        // ------------------------------------------------
        // BREADCRUMB
        // ------------------------------------------------

        const breadcrumbTitle =
            document.getElementById(
                'breadcrumbTitle'
            );


        if (breadcrumbTitle) {

            breadcrumbTitle.textContent =
                utils.escapeHTML(
                    data.title
                );
        }


        // ------------------------------------------------
        // TITLE
        // ------------------------------------------------

        const blogTitle =
            document.getElementById(
                'blogTitle'
            );


        if (blogTitle) {

            blogTitle.textContent =
                utils.escapeHTML(
                    data.title
                );
        }


        // ------------------------------------------------
        // THUMBNAIL
        // ------------------------------------------------

        const fallbackImage =
            '../assets/images/world mark.png';


        const blogThumb =
            document.getElementById(
                'blogThumb'
            );


        if (blogThumb) {

            blogThumb.src =
                data.thumbnail ||
                fallbackImage;


            blogThumb.alt =
                utils.escapeHTML(
                    data.title
                );


            blogThumb.onerror =
                function () {

                    this.onerror = null;

                    this.src =
                        fallbackImage;
                };
        }


        // ------------------------------------------------
        // DATE
        // ------------------------------------------------

        const publishDate =
            new Date(
                data.created_at
            ).toLocaleDateString(
                'vi-VN'
            );


        document
            .getElementById('blogDate')
            ?.replaceChildren(
                document.createTextNode(
                    publishDate
                )
            );


        document
            .getElementById('updateDate')
            ?.replaceChildren(
                document.createTextNode(
                    publishDate
                )
            );


        // ------------------------------------------------
        // READ TIME
        // ------------------------------------------------

        const readTime =
            estimateReadTime(
                data.content
            );


        const readTimeElement =
            document.getElementById(
                'readTime'
            );


        if (readTimeElement) {

            readTimeElement.innerText =
                `${readTime} phút đọc`;
        }


        // ------------------------------------------------
        // VIEW COUNT
        // ------------------------------------------------

        const currentView =
            data.view_count || 0;


        const viewCountElement =
            document.getElementById(
                'viewCount'
            );


        if (viewCountElement) {

            viewCountElement.innerText =
                (
                    currentView + 1
                ).toLocaleString();
        }


        // ------------------------------------------------
        // CONTENT
        // ------------------------------------------------

        const contentContainer =
            document.getElementById(
                'blogContent'
            );


        if (contentContainer) {

            contentContainer.innerHTML =
                data.content || '';


            generateTOC(
                contentContainer
            );
        }


        // ------------------------------------------------
        // RELATED + NAV
        // ------------------------------------------------

        await loadRelatedAndNav(
            data.created_at,
            slug
        );

    } catch (error) {

        console.error(
            'Lỗi tải chi tiết blog:',
            error
        );

        showError();
    }
}


// ========================================================
// 2. SEO
// ========================================================

function updateSEO(data) {

    const title =
        `${data.title} | MRO Khang Nam`;


    document.title =
        title;


    const pageTitle =
        document.getElementById(
            'pageTitle'
        );


    if (pageTitle) {

        pageTitle.textContent =
            title;
    }


    const summary =
        data.summary ||
        `Đọc bài viết về ${data.title} tại Khang Nam Vina.`;


    const metaDesc =
        document.getElementById(
            'metaDesc'
        );


    if (metaDesc) {

        metaDesc.setAttribute(
            'content',
            summary
        );
    }


    const ogTitle =
        document.getElementById(
            'ogTitle'
        );


    if (ogTitle) {

        ogTitle.setAttribute(
            'content',
            data.title
        );
    }


    const ogDesc =
        document.getElementById(
            'ogDesc'
        );


    if (ogDesc) {

        ogDesc.setAttribute(
            'content',
            summary
        );
    }


    const ogImage =
        document.getElementById(
            'ogImage'
        );


    if (
        ogImage &&
        data.thumbnail
    ) {

        ogImage.setAttribute(
            'content',
            data.thumbnail
        );
    }


    // JSON-LD

    const schema = {

        "@context":
            "https://schema.org",

        "@type":
            "Article",

        "headline":
            data.title,

        "image":
            data.thumbnail
                ? [data.thumbnail]
                : [],

        "datePublished":
            data.created_at,

        "author": [

            {
                "@type":
                    "Organization",

                "name":
                    "Khang Nam Technical Team",

                "url":
                    "https://khangnamvina.com"
            }
        ]
    };


    const schemaElement =
        document.getElementById(
            'schemaArticle'
        );


    if (schemaElement) {

        schemaElement.textContent =
            JSON.stringify(
                schema
            );
    }
}


// ========================================================
// 3. GENERATE TOC (ĐÃ FIX: TỰ ĐỘNG ẨN NẾU KHÔNG CÓ TIÊU ĐỀ)
// ========================================================
function generateTOC(container) {

    const tocContainer =
        document.getElementById('blogTOC');

    const tocCard =
        document.querySelector('.blog-detail-toc-card');

    if (!tocContainer) return;

    const headings =
        container.querySelectorAll('h2, h3');

    /*
     * Nếu không có heading:
     * vẫn giữ card mục lục,
     * nhưng hiển thị thông báo nhẹ.
     */
    if (headings.length === 0) {
    tocContainer.innerHTML = `
        <p class="toc-empty">
            Nội dung bài viết chưa có mục lục.
        </p>
    `;

    return;
}

    if (tocCard) {
        tocCard.style.display = 'block';
    }

    let tocHTML =
        '<ul class="toc-list">';

    headings.forEach(
        (heading, index) => {

            const id =
                `heading-${index}`;

            heading.id = id;

            const isH3 =
                heading.tagName.toLowerCase() === 'h3';

            const itemClass =
                isH3
                    ? 'toc-item-sub'
                    : 'toc-item-main';

            tocHTML += `
                <li class="${itemClass}">
                    <a
                        href="#${id}"
                        class="toc-link"
                        title="${utils.escapeHTML(
                            heading.innerText
                        )}"
                    >
                        ${isH3 ? '- ' : ''}
                        ${utils.escapeHTML(
                            heading.innerText
                        )}
                    </a>
                </li>
            `;
        }
    );

    tocHTML += '</ul>';

    tocContainer.innerHTML =
        tocHTML;
}


// ========================================================
// 4. RELATED + PREV / NEXT
// ========================================================

async function loadRelatedAndNav(
    currentDate,
    currentSlug
) {

    try {

        const fallbackImage =
            '../assets/images/world mark.png';


        // =================================================
        // RELATED
        // =================================================

        const {
            data: relatedData,
            error: relatedError
        } = await window.supabaseClient
            .from('blogs')
            .select(
                'title, slug, thumbnail, created_at'
            )
            .neq(
                'slug',
                currentSlug
            )
            .eq(
                'is_active',
                true
            )
            .order(
                'created_at',
                {
                    ascending: false
                }
            )
            .limit(3);


        if (relatedError) {

            console.error(
                'Lỗi lấy bài viết liên quan:',
                relatedError
            );
        }


        if (
            relatedData &&
            relatedData.length > 0
        ) {

            const relatedSection =
                document.getElementById(
                    'relatedSection'
                );


            const relatedGrid =
                document.getElementById(
                    'relatedGrid'
                );


            if (relatedSection) {

                relatedSection.classList.remove(
                    'is-hidden'
                );
            }


            if (relatedGrid) {

                let html = '';


                relatedData.forEach(
                    post => {

                        const image =
                            post.thumbnail ||
                            fallbackImage;


                        html += `

                            <a
                                href="blog-detail.html?slug=${encodeURIComponent(
                                    post.slug
                                )}"
                                class="related-post-card"
                            >

                                <div class="related-post-thumb">

                                    <img
                                        src="${utils.escapeHTML(
                                            image
                                        )}"
                                        alt="${utils.escapeHTML(
                                            post.title
                                        )}"
                                        onerror="this.onerror=null; this.src='${fallbackImage}';"
                                    >

                                </div>


                                <div class="related-post-info">

                                    <h4 class="related-post-title">
                                        ${utils.escapeHTML(
                                            post.title
                                        )}
                                    </h4>

                                    <span class="related-post-date">
                                        ${
                                            new Date(
                                                post.created_at
                                            ).toLocaleDateString(
                                                'vi-VN'
                                            )
                                        }
                                    </span>

                                </div>

                            </a>
                        `;
                    }
                );


                relatedGrid.innerHTML =
                    html;
            }
        }


        // =================================================
        // PREV
        // =================================================

        const {
            data: prevData
        } = await window.supabaseClient
            .from('blogs')
            .select(
                'title, slug'
            )
            .eq(
                'is_active',
                true
            )
            .lt(
                'created_at',
                currentDate
            )
            .order(
                'created_at',
                {
                    ascending: false
                }
            )
            .limit(1);


        if (
            prevData &&
            prevData.length > 0
        ) {

            const el =
                document.getElementById(
                    'prevPost'
                );


            if (el) {

                el.href =
                    `blog-detail.html?slug=${encodeURIComponent(
                        prevData[0].slug
                    )}`;


                const titleElement =
                    document.getElementById(
                        'prevTitle'
                    );


                if (titleElement) {

                    titleElement.innerText =
                        utils.escapeHTML(
                            prevData[0].title
                        );
                }


                el.classList.remove(
                    'is-hidden'
                );
            }
        }


        // =================================================
        // NEXT
        // =================================================

        const {
            data: nextData
        } = await window.supabaseClient
            .from('blogs')
            .select(
                'title, slug'
            )
            .eq(
                'is_active',
                true
            )
            .gt(
                'created_at',
                currentDate
            )
            .order(
                'created_at',
                {
                    ascending: true
                }
            )
            .limit(1);


        if (
            nextData &&
            nextData.length > 0
        ) {

            const el =
                document.getElementById(
                    'nextPost'
                );


            if (el) {

                el.href =
                    `blog-detail.html?slug=${encodeURIComponent(
                        nextData[0].slug
                    )}`;


                const titleElement =
                    document.getElementById(
                        'nextTitle'
                    );


                if (titleElement) {

                    titleElement.innerText =
                        utils.escapeHTML(
                            nextData[0].title
                        );
                }


                el.classList.remove(
                    'is-hidden'
                );
            }
        }

    } catch (error) {

        console.error(
            'Lỗi lấy bài liên quan:',
            error
        );
    }
}


// ========================================================
// 5. SHARE FUNCTIONS
// ========================================================

function initShareButtons() {

    const facebook =
        document.getElementById(
            'shareFacebook'
        );


    const linkedin =
        document.getElementById(
            'shareLinkedIn'
        );


    const copy =
        document.getElementById(
            'copyArticleLink'
        );


    facebook?.addEventListener(
        'click',
        () => {

            window.open(
                'https://www.facebook.com/sharer/sharer.php?u=' +
                encodeURIComponent(
                    location.href
                ),
                '_blank',
                'noopener,noreferrer,width=700,height=600'
            );
        }
    );


    linkedin?.addEventListener(
        'click',
        () => {

            window.open(
                'https://www.linkedin.com/sharing/share-offsite/?url=' +
                encodeURIComponent(
                    location.href
                ),
                '_blank',
                'noopener,noreferrer,width=700,height=600'
            );
        }
    );


    copy?.addEventListener(
        'click',
        async () => {

            try {

                await navigator.clipboard.writeText(
                    location.href
                );

                if (
                    window.utils &&
                    typeof window.utils.showToast ===
                    'function'
                ) {

                    window.utils.showToast(
                        'Đã copy link!',
                        'success'
                    );

                } else {

                    alert(
                        'Đã copy link!'
                    );
                }

            } catch (error) {

                console.error(
                    'Lỗi copy link:',
                    error
                );

                alert(
                    'Không thể copy link.'
                );
            }
        }
    );
}


// ========================================================
// 6. READ TIME
// ========================================================

function estimateReadTime(
    text
) {

    if (!text) {

        return 2;
    }


    const plainText =
        text.replace(
            /(<([^>]+)>)/gi,
            ''
        );


    const words =
        plainText
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    return Math.max(
        1,
        Math.ceil(
            words.length / 200
        )
    );
}


// ========================================================
// 7. ERROR
// ========================================================

function showError() {

    document
        .getElementById(
            'loadingState'
        )
        ?.classList.add(
            'is-hidden'
        );


    document
        .getElementById(
            'errorState'
        )
        ?.classList.remove(
            'is-hidden'
        );
}


// ========================================================
// 8. AUTH
// ========================================================

async function initAuthUI() {

    try {

        let isUserLoggedIn =
            false;


        // Cách 1
        if (
            typeof window.checkCustomerAuth ===
            'function'
        ) {

            isUserLoggedIn =
                !!(
                    await window.checkCustomerAuth()
                );

        }

        // Cách 2
        else if (
            typeof window.Auth !==
            'undefined' &&
            typeof window.Auth.getCurrentUser ===
            'function'
        ) {

            isUserLoggedIn =
                !!(
                    await window.Auth.getCurrentUser()
                );

        }

        // Cách 3
        else if (
            window.supabaseClient
        ) {

            const {
                data
            } =
                await window.supabaseClient
                    .auth
                    .getSession();


            isUserLoggedIn =
                !!data?.session;
        }


        if (
            !isUserLoggedIn
        ) {

            return;
        }


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

            userProfileBtn.classList.add(
                'is-flex'
            );
        }

    } catch (error) {

        console.error(
            'Lỗi bật trạng thái tài khoản:',
            error
        );
    }
}



// ========================================================
// 9. DOM READY
// ========================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        await fetchBlogDetail();

        initShareButtons();

        await initAuthUI();
    }
);