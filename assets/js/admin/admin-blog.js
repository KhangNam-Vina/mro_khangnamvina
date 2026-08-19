/* =========================================================
   FILE: assets/js/admin/admin-blog.js

   QUẢN LÝ BLOG - STANDARDIZED

   DATABASE CONTRACT - GIỮ NGUYÊN

   blogs:
   - title
   - slug
   - thumbnail
   - summary
   - category
   - is_active
   - content

   KHÔNG đổi schema.
   KHÔNG đổi cách INSERT / UPDATE / DELETE.
========================================================= */


/* =========================================================
   STATE
========================================================= */

const state = {

    blogs: [],

    editingId: null,

    currentPage: 1,

    itemsPerPage: 10,

    totalItems: 0,

    searchQuery: "",

    categoryFilter: "",

    statusFilter: ""

};


/* =========================================================
   DOM
========================================================= */

const DOM = {

    listView:
        document.getElementById(
            "blogListView"
        ),

    formView:
        document.getElementById(
            "blogFormView"
        ),

    form:
        document.getElementById(
            "blogForm"
        ),

    formTitle:
        document.getElementById(
            "formTitle"
        ),

    title:
        document.getElementById(
            "inTitle"
        ),

    slug:
        document.getElementById(
            "inSlug"
        ),

    summary:
        document.getElementById(
            "inSummary"
        ),

    category:
        document.getElementById(
            "inCategory"
        ),

    isActive:
        document.getElementById(
            "inActive"
        ),

    thumbnail:
        document.getElementById(
            "inThumbnail"
        ),

    preview:
        document.getElementById(
            "thumbnailPreview"
        ),

    previewBox:
        document.getElementById(
            "thumbnailPreviewBox"
        ),

    previewEmpty:
        document.getElementById(
            "thumbnailPreviewEmpty"
        ),

    btnAdd:
        document.getElementById(
            "btnAddBlog"
        ),

    btnBack:
        document.getElementById(
            "btnBackToBlogs"
        ),

    btnCancel:
        document.getElementById(
            "btnCancelBlog"
        ),

    btnSave:
        document.getElementById(
            "btnSaveBlog"
        ),

    tbody:
        document.getElementById(
            "blogTableBody"
        ),

    pagination:
        document.getElementById(
            "paginationContainer"
        ),

    search:
        document.getElementById(
            "searchBlogInput"
        ),

    categoryFilter:
        document.getElementById(
            "filterBlogCategory"
        ),

    statusFilter:
        document.getElementById(
            "filterBlogStatus"
        ),

    resultText:
        document.getElementById(
            "blogResultText"
        ),

    total:
        document.getElementById(
            "blogTotal"
        ),

    active:
        document.getElementById(
            "blogActive"
        ),

    inactive:
        document.getElementById(
            "blogInactive"
        ),

    categories:
        document.getElementById(
            "blogCategories"
        ),

    toastContainer:
        document.getElementById(
            "toastContainer"
        )

};


/* =========================================================
   HELPERS
========================================================= */

const utils = {


    escapeHTML(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(
            value
        ).replace(
            /[&<>'"]/g,
            character => ({

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                "'": "&#39;",

                '"': "&quot;"

            })[character]
        );

    },


    generateSlug(
        text
    ) {

        return String(
            text || ""
        )

            .toLowerCase()

            .normalize(
                "NFD"
            )

            .replace(
                /[\u0300-\u036f]/g,
                ""
            )

            .replace(
                /đ/g,
                "d"
            )

            .replace(
                /Đ/g,
                "D"
            )

            .replace(
                /\s+/g,
                "-"
            )

            .replace(
                /[^\w\-]+/g,
                ""
            )

            .replace(
                /\-\-+/g,
                "-"
            )

            .replace(
                /^-+/,
                ""
            )

            .replace(
                /-+$/,
                ""
            );

    },


    showToast(
        message,
        type = "success"
    ) {

        if (
            !DOM.toastContainer
        ) {

            return;

        }


        const toast =
            document.createElement(
                "div"
            );


        const background =
            type === "success"
                ? "bg-gray-900"
                : type === "warning"
                    ? "bg-kn-orange"
                    : "bg-red-600";


        const icon =
            type === "success"
                ? "✓"
                : type === "warning"
                    ? "!"
                    : "×";


        toast.className = `

            pointer-events-auto

            flex
            items-center
            gap-2

            px-4
            py-3

            rounded-xl
            shadow-xl

            text-sm
            font-bold
            text-white

            ${background}

            opacity-0
            translate-y-2

            transition-all
            duration-300

        `;


        toast.innerHTML = `

            <span>
                ${icon}
            </span>

            <span>
                ${utils.escapeHTML(
                    message
                )}
            </span>

        `;


        DOM.toastContainer.appendChild(
            toast
        );


        requestAnimationFrame(
            () => {

                toast.classList.remove(
                    "opacity-0",
                    "translate-y-2"
                );

            }
        );


        setTimeout(
            () => {

                toast.classList.add(
                    "opacity-0",
                    "translate-y-2"
                );


                setTimeout(
                    () => {

                        toast.remove();

                    },
                    300
                );

            },
            3500
        );

    },


    toggleButtonLoading(
        button,
        loading,
        text
    ) {

        if (
            !button
        ) {

            return;

        }


        button.disabled =
            loading;


        button.innerHTML =
            loading

                ? `

                    <span
                        class="
                            animate-spin
                            inline-block
                            w-4
                            h-4
                            border-2
                            border-white
                            border-t-transparent
                            rounded-full
                            mr-2
                            align-middle
                        "
                    ></span>

                    ${utils.escapeHTML(
                        text
                    )}

                `

                : utils.escapeHTML(
                    text
                );

    }

};


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        init();

    }
);


async function init() {

    bindEvents();

    initCKEditor();

    await loadBlogs(
        1
    );

}


/* =========================================================
   CKEDITOR
========================================================= */

function initCKEditor() {

    if (
        typeof CKEDITOR ===
        "undefined"
    ) {

        console.warn(
            "CKEDITOR chưa được load."
        );

        return;

    }


    if (
        CKEDITOR.instances.inContent
    ) {

        return;

    }


    CKEDITOR.replace(
        "inContent",
        {

            height: 400,

            toolbar: [

                {
                    name: "document",
                    items: [
                        "Source"
                    ]
                },

                {
                    name: "basicstyles",
                    items: [
                        "Bold",
                        "Italic",
                        "Underline",
                        "Strike"
                    ]
                },

                {
                    name: "paragraph",
                    items: [
                        "NumberedList",
                        "BulletedList",
                        "-",
                        "Blockquote",
                        "JustifyLeft",
                        "JustifyCenter",
                        "JustifyRight"
                    ]
                },

                {
                    name: "links",
                    items: [
                        "Link",
                        "Unlink"
                    ]
                },

                {
                    name: "insert",
                    items: [
                        "Image",
                        "Table",
                        "HorizontalRule"
                    ]
                },

                {
                    name: "styles",
                    items: [
                        "Format",
                        "Font",
                        "FontSize"
                    ]
                },

                {
                    name: "colors",
                    items: [
                        "TextColor",
                        "BGColor"
                    ]
                }

            ]

        }
    );

}


/* =========================================================
   LOAD BLOGS
========================================================= */

async function loadBlogs(
    page = 1
) {

    state.currentPage =
        Math.max(
            1,
            page
        );


    renderLoading();


    const from =
        (
            state.currentPage -
            1
        ) *
        state.itemsPerPage;


    const to =
        from +
        state.itemsPerPage -
        1;


    try {

        let query =
            window.supabaseClient
                .from(
                    "blogs"
                )
                .select(
                    "*",
                    {
                        count: "exact"
                    }
                );


        /* -----------------------------------------
           SEARCH
        ------------------------------------------ */

        if (
            state.searchQuery
        ) {

            const keyword =
                state.searchQuery
                    .replace(
                        /[%_,]/g,
                        ""
                    );


            if (
                keyword
            ) {

                query =
                    query.or(
                        [
                            `title.ilike.%${keyword}%`,
                            `slug.ilike.%${keyword}%`,
                            `summary.ilike.%${keyword}%`
                        ].join(",")
                    );

            }

        }


        /* -----------------------------------------
           CATEGORY
        ------------------------------------------ */

        if (
            state.categoryFilter
        ) {

            query =
                query.eq(
                    "category",
                    state.categoryFilter
                );

        }


        /* -----------------------------------------
           STATUS
        ------------------------------------------ */

        if (
            state.statusFilter ===
            "active"
        ) {

            query =
                query.eq(
                    "is_active",
                    true
                );

        }


        if (
            state.statusFilter ===
            "inactive"
        ) {

            query =
                query.eq(
                    "is_active",
                    false
                );

        }


        /* -----------------------------------------
           QUERY
        ------------------------------------------ */

        const {
            data,
            error,
            count
        } =
            await query

                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )

                .range(
                    from,
                    to
                );


        if (
            error
        ) {

            throw error;

        }


        state.blogs =
            data || [];


        state.totalItems =
            count || 0;


        updateStatistics();

        renderTable();

        renderPagination();


    } catch (
        error
    ) {

        console.error(
            "Lỗi tải blog:",
            error
        );


        DOM.tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="
                        text-center
                        py-12
                        text-red-500
                        font-bold
                    "
                >

                    Không thể tải danh sách bài viết.

                    <div
                        class="
                            text-xs
                            font-normal
                            mt-1
                        "
                    >
                        ${utils.escapeHTML(
                            error.message
                        )}
                    </div>

                </td>

            </tr>

        `;


        utils.showToast(
            `Lỗi tải danh sách: ${error.message}`,
            "error"
        );

    }

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    if (
        DOM.total
    ) {

        DOM.total.textContent =
            state.totalItems;

    }


    const active =
        state.blogs.filter(
            blog =>
                blog.is_active !== false
        ).length;


    const inactive =
        state.blogs.filter(
            blog =>
                blog.is_active === false
        ).length;


    /*
       Đây là số liệu của trang hiện tại vì query
       đang phân trang. Không tự ý query thêm DB.
    */

    if (
        DOM.active
    ) {

        DOM.active.textContent =
            active;

    }


    if (
        DOM.inactive
    ) {

        DOM.inactive.textContent =
            inactive;

    }


    const categorySet =
        new Set(
            state.blogs
                .map(
                    blog =>
                        blog.category || "ALL"
                )
        );


    if (
        DOM.categories
    ) {

        DOM.categories.textContent =
            categorySet.size;

    }


    if (
        DOM.resultText
    ) {

        DOM.resultText.textContent =
            `${state.totalItems} bài viết`;

    }

}


/* =========================================================
   LOADING
========================================================= */

function renderLoading() {

    if (
        !DOM.tbody
    ) {

        return;

    }


    DOM.tbody.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="
                    text-center
                    py-14
                    text-gray-400
                "
            >

                <div
                    class="
                        inline-block
                        w-7
                        h-7
                        border-2
                        border-kn-blue
                        border-t-transparent
                        rounded-full
                        animate-spin
                    "
                ></div>

                <div
                    class="
                        mt-2
                        text-xs
                    "
                >
                    Đang tải danh sách bài viết...
                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderTable() {

    if (
        !DOM.tbody
    ) {

        return;

    }


    if (
        state.totalItems === 0 ||
        state.blogs.length === 0
    ) {

        DOM.tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="
                        text-center
                        py-14
                        text-gray-400
                    "
                >

                    <div
                        class="
                            w-12
                            h-12
                            mx-auto
                            mb-3
                            rounded-full
                            bg-gray-100
                            flex
                            items-center
                            justify-center
                        "
                    >

                        <svg
                            class="w-6 h-6 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.7"
                                d="M9 13h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0Z"
                            />
                        </svg>

                    </div>


                    <div
                        class="
                            font-bold
                            text-gray-500
                        "
                    >
                        Không tìm thấy bài viết
                    </div>


                    <div
                        class="
                            text-xs
                            mt-1
                        "
                    >
                        Thử thay đổi từ khóa hoặc bộ lọc.
                    </div>

                </td>

            </tr>

        `;

        return;

    }


    const from =
        (
            state.currentPage -
            1
        ) *
        state.itemsPerPage;


    DOM.tbody.innerHTML =
        state.blogs
            .map(
                (
                    item,
                    index
                ) => {

                    const active =
                        item.is_active !== false;


                    const category =
                        item.category &&
                        item.category !== "ALL"

                            ? item.category

                            : "Chung";


                    const date =
                        item.created_at
                            ? new Date(
                                item.created_at
                            ).toLocaleDateString(
                                "vi-VN"
                            )

                            : "—";


                    const status =
                        active

                            ? `

                                <span
                                    class="
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        px-2.5
                                        py-1.5
                                        rounded-lg
                                        bg-green-50
                                        border
                                        border-green-100
                                        text-green-700
                                        text-[10px]
                                        font-black
                                    "
                                >

                                    <span
                                        class="
                                            w-1.5
                                            h-1.5
                                            rounded-full
                                            bg-green-500
                                        "
                                    ></span>

                                    ĐANG HIỆN

                                </span>

                            `

                            : `

                                <span
                                    class="
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        px-2.5
                                        py-1.5
                                        rounded-lg
                                        bg-gray-100
                                        border
                                        border-gray-200
                                        text-gray-500
                                        text-[10px]
                                        font-black
                                    "
                                >

                                    <span
                                        class="
                                            w-1.5
                                            h-1.5
                                            rounded-full
                                            bg-gray-400
                                        "
                                    ></span>

                                    ĐANG ẨN

                                </span>

                            `;


                    return `

                        <tr
                            class="
                                group
                                hover:bg-blue-50/40
                                transition-colors
                            "
                        >


                            <!-- INDEX -->

                            <td
                                class="
                                    px-4
                                    py-4
                                    text-center
                                    text-xs
                                    font-mono
                                    font-bold
                                    text-gray-400
                                "
                            >
                                ${from + index + 1}
                            </td>


                            <!-- THUMBNAIL -->

                            <td
                                class="
                                    px-4
                                    py-4
                                "
                            >

                                <div
                                    class="
                                        w-24
                                        h-14
                                        rounded-lg
                                        border
                                        border-gray-200
                                        bg-gray-100
                                        overflow-hidden
                                    "
                                >

                                    <img
                                        src="${utils.escapeHTML(
                                            item.thumbnail || ""
                                        )}"
                                        alt="${utils.escapeHTML(
                                            item.title
                                        )}"
                                        class="
                                            w-full
                                            h-full
                                            object-cover
                                        "
                                        loading="lazy"
                                        data-thumbnail
                                    >

                                </div>

                            </td>


                            <!-- ARTICLE -->

                            <td
                                class="
                                    px-4
                                    py-4
                                "
                            >

                                <div
                                    class="
                                        font-black
                                        text-gray-900
                                        leading-5
                                        line-clamp-1
                                    "
                                >
                                    ${utils.escapeHTML(
                                        item.title
                                    )}
                                </div>


                                <div
                                    class="
                                        mt-1.5
                                        text-xs
                                        text-gray-400
                                        line-clamp-2
                                        leading-5
                                    "
                                >
                                    ${
                                        item.summary
                                            ? utils.escapeHTML(
                                                item.summary
                                            )
                                            : "Chưa có tóm tắt."
                                    }
                                </div>


                                <div
                                    class="
                                        mt-2
                                        flex
                                        items-center
                                        gap-2
                                        min-w-0
                                    "
                                >

                                    <span
                                        class="
                                            text-[10px]
                                            bg-gray-100
                                            text-gray-600
                                            px-2
                                            py-1
                                            rounded
                                            font-bold
                                            uppercase
                                            whitespace-nowrap
                                        "
                                    >
                                        ${utils.escapeHTML(
                                            category
                                        )}
                                    </span>


                                    <span
                                        class="
                                            text-[10px]
                                            text-gray-400
                                            font-mono
                                            truncate
                                        "
                                    >
                                        /${utils.escapeHTML(
                                            item.slug
                                        )}
                                    </span>

                                </div>

                            </td>


                            <!-- CATEGORY -->

                            <td
                                class="
                                    px-4
                                    py-4
                                "
                            >

                                <span
                                    class="
                                        inline-flex
                                        px-2.5
                                        py-1.5
                                        rounded-lg
                                        bg-blue-50
                                        border
                                        border-blue-100
                                        text-blue-700
                                        text-[10px]
                                        font-black
                                        uppercase
                                    "
                                >
                                    ${utils.escapeHTML(
                                        category
                                    )}
                                </span>

                            </td>


                            <!-- STATUS -->

                            <td
                                class="
                                    px-4
                                    py-4
                                    text-center
                                "
                            >

                                ${status}

                            </td>


                            <!-- DATE -->

                            <td
                                class="
                                    px-4
                                    py-4
                                    text-center
                                "
                            >

                                <span
                                    class="
                                        text-xs
                                        font-medium
                                        text-gray-500
                                        whitespace-nowrap
                                    "
                                >
                                    ${date}
                                </span>

                            </td>


                            <!-- ACTIONS -->

                            <td
                                class="
                                    px-4
                                    py-4
                                "
                            >

                                <div
                                    class="
                                        flex
                                        justify-end
                                        items-center
                                        gap-1
                                    "
                                >

                                    <button
                                        type="button"
                                        data-action="edit"
                                        data-id="${utils.escapeHTML(
                                            item.id
                                        )}"
                                        class="
                                            p-2
                                            rounded-lg
                                            text-blue-600
                                            hover:bg-blue-50
                                            transition
                                        "
                                        title="Chỉnh sửa"
                                    >

                                        <svg
                                            class="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652l-9.193 9.193a4.5 4.5 0 01-1.897 1.13l-2.052-2.052a4.5 4.5 0 011.13-1.897l9.193-9.193z"
                                            />
                                        </svg>

                                    </button>


                                    <button
                                        type="button"
                                        data-action="delete"
                                        data-id="${utils.escapeHTML(
                                            item.id
                                        )}"
                                        class="
                                            p-2
                                            rounded-lg
                                            text-red-500
                                            hover:bg-red-50
                                            transition
                                        "
                                        title="Xóa"
                                    >

                                        <svg
                                            class="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>

                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    bindThumbnailFallbacks();

}


/* =========================================================
   THUMBNAIL FALLBACK
========================================================= */

function bindThumbnailFallbacks() {

    DOM.tbody
        ?.querySelectorAll(
            "img[data-thumbnail]"
        )
        .forEach(
            image => {

                image.addEventListener(
                    "error",
                    () => {

                        image.src =
                            createFallbackImage();


                    },
                    {
                        once: true
                    }
                );

            }
        );

}


function createFallbackImage() {

    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(
            `
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="240"
                    height="140"
                    viewBox="0 0 240 140"
                >

                    <rect
                        width="240"
                        height="140"
                        fill="#f3f4f6"
                    />

                    <text
                        x="120"
                        y="72"
                        text-anchor="middle"
                        font-family="Arial"
                        font-size="13"
                        font-weight="700"
                        fill="#9ca3af"
                    >
                        No Image
                    </text>

                </svg>
            `
        )
    );

}


/* =========================================================
   PAGINATION
========================================================= */

function renderPagination() {

    if (
        !DOM.pagination
    ) {

        return;

    }


    const totalPages =
        Math.ceil(
            state.totalItems /
            state.itemsPerPage
        );


    if (
        totalPages <= 1
    ) {

        DOM.pagination.innerHTML = `

            <span
                class="
                    text-xs
                    text-gray-500
                "
            >
                ${state.totalItems} bài viết
            </span>

        `;

        return;

    }


    const startItem =
        (
            state.currentPage -
            1
        ) *
        state.itemsPerPage +
        1;


    const endItem =
        Math.min(
            state.currentPage *
                state.itemsPerPage,
            state.totalItems
        );


    const pages = [];


    pages.push(1);


    if (
        state.currentPage > 3
    ) {

        pages.push(
            "..."
        );

    }


    const start =
        Math.max(
            2,
            state.currentPage - 1
        );


    const end =
        Math.min(
            totalPages - 1,
            state.currentPage + 1
        );


    for (
        let page = start;
        page <= end;
        page++
    ) {

        pages.push(
            page
        );

    }


    if (
        state.currentPage <
        totalPages - 2
    ) {

        pages.push(
            "..."
        );

    }


    pages.push(
        totalPages
    );


    DOM.pagination.innerHTML = `

        <div
            class="
                text-xs
                text-gray-500
            "
        >

            Hiển thị

            <strong
                class="text-gray-700"
            >
                ${startItem}-${endItem}
            </strong>

            /

            <strong
                class="text-gray-700"
            >
                ${state.totalItems}
            </strong>

        </div>


        <div
            class="
                flex
                items-center
                gap-1
            "
        >

            <button
                type="button"
                data-page-action="prev"
                ${state.currentPage === 1 ? "disabled" : ""}
                class="
                    px-3
                    py-1.5
                    rounded-lg
                    text-xs
                    font-bold
                    border
                    ${
                        state.currentPage === 1
                            ? "text-gray-300 border-gray-100 cursor-not-allowed"
                            : "text-gray-600 border-gray-200 hover:bg-gray-50"
                    }
                "
            >
                ← Trước
            </button>


            ${
                pages
                    .map(
                        page => {

                            if (
                                page === "..."
                            ) {

                                return `

                                    <span
                                        class="
                                            px-2
                                            text-gray-400
                                            text-xs
                                        "
                                    >
                                        ...
                                    </span>

                                `;

                            }


                            return `

                                <button
                                    type="button"
                                    data-page="${page}"
                                    class="
                                        min-w-8
                                        px-2
                                        py-1.5
                                        rounded-lg
                                        text-xs
                                        font-bold
                                        border
                                        ${
                                            page ===
                                            state.currentPage

                                                ? "bg-kn-blue text-white border-kn-blue"

                                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                        }
                                    "
                                >
                                    ${page}
                                </button>

                            `;

                        }
                    )
                    .join("")
            }


            <button
                type="button"
                data-page-action="next"
                ${state.currentPage === totalPages ? "disabled" : ""}
                class="
                    px-3
                    py-1.5
                    rounded-lg
                    text-xs
                    font-bold
                    border
                    ${
                        state.currentPage === totalPages
                            ? "text-gray-300 border-gray-100 cursor-not-allowed"
                            : "text-gray-600 border-gray-200 hover:bg-gray-50"
                    }
                "
            >
                Sau →
            </button>

        </div>

    `;

}


/* =========================================================
   ADD FORM
========================================================= */

function showCreateBlogForm() {

    state.editingId =
        null;


    resetForm();


    DOM.formTitle.textContent =
        "Viết Bài Mới";


    DOM.btnSave.textContent =
        "Lưu Bài Viết";


    DOM.listView.classList.add(
        "hidden"
    );


    DOM.formView.classList.remove(
        "hidden"
    );


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


/* =========================================================
   RESET FORM
========================================================= */

function resetForm() {

    DOM.form?.reset();


    DOM.slug.value =
        "";


    DOM.category.value =
        "ALL";


    DOM.isActive.checked =
        true;


    resetThumbnailPreview();


    if (
        typeof CKEDITOR !==
            "undefined" &&
        CKEDITOR.instances.inContent
    ) {

        CKEDITOR.instances.inContent.setData(
            ""
        );

    }

}


/* =========================================================
   CANCEL
========================================================= */

function cancelEdit() {

    state.editingId =
        null;


    resetForm();


    DOM.formView.classList.add(
        "hidden"
    );


    DOM.listView.classList.remove(
        "hidden"
    );


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


/* =========================================================
   SAVE
========================================================= */

async function saveBlog(
    event
) {

    if (
        event
    ) {

        event.preventDefault();

    }


    const title =
        DOM.title.value.trim();


    const slug =
        DOM.slug.value.trim();


    const thumbnail =
        DOM.thumbnail.value.trim();


    const summary =
        DOM.summary.value.trim();


    const category =
        DOM.category.value;


    const is_active =
        DOM.isActive.checked;


    let content =
        "";


    if (
        typeof CKEDITOR !==
            "undefined" &&
        CKEDITOR.instances.inContent
    ) {

        content =
            CKEDITOR.instances.inContent
                .getData()
                .trim();

    }


    /* -----------------------------------------
       VALIDATE
    ------------------------------------------ */

    if (
        !title ||
        !slug ||
        !thumbnail ||
        !summary ||
        !content
    ) {

        utils.showToast(
            "Vui lòng nhập đủ Tiêu đề, Tóm tắt, Slug, Thumbnail và Nội dung!",
            "warning"
        );

        return;

    }


    utils.toggleButtonLoading(
        DOM.btnSave,
        true,
        "Đang lưu..."
    );


    try {

        /* -----------------------------------------
           CHECK SLUG
        ------------------------------------------ */

        let checkQuery =
            window.supabaseClient
                .from(
                    "blogs"
                )
                .select(
                    "id"
                )
                .eq(
                    "slug",
                    slug
                );


        if (
            state.editingId
        ) {

            checkQuery =
                checkQuery.neq(
                    "id",
                    state.editingId
                );

        }


        const {
            data: existing,
            error: checkError
        } =
            await checkQuery;


        if (
            checkError
        ) {

            throw checkError;

        }


        if (
            existing &&
            existing.length > 0
        ) {

            utils.showToast(
                "Đường dẫn (Slug) đã tồn tại!",
                "warning"
            );


            DOM.slug.focus();


            return;

        }


        /* -----------------------------------------
           PAYLOAD
           GIỮ NGUYÊN
        ------------------------------------------ */

        const payload = {

            title,

            slug,

            thumbnail,

            summary,

            category,

            is_active,

            content

        };


        /* -----------------------------------------
           UPDATE
        ------------------------------------------ */

        if (
            state.editingId
        ) {

            const {
                error
            } =
                await window.supabaseClient

                    .from(
                        "blogs"
                    )

                    .update(
                        payload
                    )

                    .eq(
                        "id",
                        state.editingId
                    );


            if (
                error
            ) {

                throw error;

            }


            utils.showToast(
                "Cập nhật bài viết thành công!",
                "success"
            );

        }


        /* -----------------------------------------
           INSERT
        ------------------------------------------ */

        else {

            const {
                error
            } =
                await window.supabaseClient

                    .from(
                        "blogs"
                    )

                    .insert([
                        payload
                    ]);


            if (
                error
            ) {

                throw error;

            }


            utils.showToast(
                "Thêm bài viết mới thành công!",
                "success"
            );

        }


        const nextPage =
            state.currentPage;


        cancelEdit();


        await loadBlogs(
            nextPage
        );


    } catch (
        error
    ) {

        console.error(
            "Lỗi lưu blog:",
            error
        );


        utils.showToast(
            `Lỗi: ${error.message}`,
            "error"
        );


    } finally {

        utils.toggleButtonLoading(
            DOM.btnSave,
            false,
            state.editingId
                ? "Cập Nhật Bài Viết"
                : "Lưu Bài Viết"
        );

    }

}


/* =========================================================
   EDIT
========================================================= */

async function editBlog(
    id
) {

    try {

        const {
            data: item,
            error
        } =
            await window.supabaseClient

                .from(
                    "blogs"
                )

                .select(
                    "*"
                )

                .eq(
                    "id",
                    id
                )

                .single();


        if (
            error ||
            !item
        ) {

            throw new Error(
                "Không tìm thấy dữ liệu bài viết."
            );

        }


        state.editingId =
            item.id;


        DOM.title.value =
            item.title ||
            "";


        DOM.slug.value =
            item.slug ||
            "";


        DOM.thumbnail.value =
            item.thumbnail ||
            "";


        DOM.summary.value =
            item.summary ||
            "";


        DOM.category.value =
            item.category ||
            "ALL";


        DOM.isActive.checked =
            item.is_active !== false;


        updateThumbnailPreview(
            item.thumbnail
        );


        if (
            typeof CKEDITOR !==
                "undefined" &&
            CKEDITOR.instances.inContent
        ) {

            CKEDITOR.instances.inContent.setData(
                item.content ||
                ""
            );

        }


        DOM.formTitle.textContent =
            "Sửa Bài Viết";


        DOM.btnSave.textContent =
            "Cập Nhật Bài Viết";


        DOM.listView.classList.add(
            "hidden"
        );


        DOM.formView.classList.remove(
            "hidden"
        );


        window.scrollTo(
            {
                top: 0,
                behavior: "smooth"
            }
        );


    } catch (
        error
    ) {

        console.error(
            "Lỗi mở bài viết:",
            error
        );


        utils.showToast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   DELETE
========================================================= */

async function deleteBlog(
    id
) {

    const item =
        state.blogs.find(
            blog =>
                String(
                    blog.id
                ) ===
                String(id)
        );


    const title =
        item?.title ||
        "bài viết này";


    if (
        !window.confirm(
            `Bạn có chắc chắn muốn xóa "${title}" vĩnh viễn?`
        )
    ) {

        return;

    }


    try {

        const {
            error
        } =
            await window.supabaseClient

                .from(
                    "blogs"
                )

                .delete()

                .eq(
                    "id",
                    id
                );


        if (
            error
        ) {

            throw error;

        }


        if (
            state.blogs.length === 1 &&
            state.currentPage > 1
        ) {

            state.currentPage--;

        }


        utils.showToast(
            "Đã xóa bài viết!",
            "success"
        );


        await loadBlogs(
            state.currentPage
        );


    } catch (
        error
    ) {

        console.error(
            "Lỗi xóa blog:",
            error
        );


        utils.showToast(
            `Lỗi xóa: ${error.message}`,
            "error"
        );

    }

}


/* =========================================================
   THUMBNAIL PREVIEW
========================================================= */

function updateThumbnailPreview(
    url
) {

    if (
        !DOM.preview
    ) {

        return;

    }


    const cleanURL =
        String(
            url || ""
        ).trim();


    if (
        !cleanURL
    ) {

        resetThumbnailPreview();

        return;

    }


    DOM.preview.src =
        cleanURL;


    DOM.preview.classList.remove(
        "hidden"
    );


    DOM.previewEmpty?.classList.add(
        "hidden"
    );


    DOM.preview.onerror =
        () => {

            resetThumbnailPreview(
                "Không thể tải ảnh"
            );

        };

}


function resetThumbnailPreview(
    message = "Chưa có ảnh preview"
) {

    if (
        DOM.preview
    ) {

        DOM.preview.src =
            "";


        DOM.preview.classList.add(
            "hidden"
        );

    }


    if (
        DOM.previewEmpty
    ) {

        DOM.previewEmpty.textContent =
            message;


        DOM.previewEmpty.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {


    /* -----------------------------------------
       ADD
    ------------------------------------------ */

    DOM.btnAdd?.addEventListener(
        "click",
        showCreateBlogForm
    );


    /* -----------------------------------------
       BACK
    ------------------------------------------ */

    DOM.btnBack?.addEventListener(
        "click",
        cancelEdit
    );


    /* -----------------------------------------
       CANCEL
    ------------------------------------------ */

    DOM.btnCancel?.addEventListener(
        "click",
        cancelEdit
    );


    /* -----------------------------------------
       FORM
    ------------------------------------------ */

    DOM.form?.addEventListener(
        "submit",
        saveBlog
    );


    /* -----------------------------------------
       TITLE -> SLUG
    ------------------------------------------ */

    DOM.title?.addEventListener(
        "input",
        event => {

            if (
                !state.editingId
            ) {

                DOM.slug.value =
                    utils.generateSlug(
                        event.target.value
                    );

            }

        }
    );


    /* -----------------------------------------
       THUMBNAIL
    ------------------------------------------ */

    DOM.thumbnail?.addEventListener(
        "input",
        event => {

            updateThumbnailPreview(
                event.target.value
            );

        }
    );


    /* -----------------------------------------
       SEARCH
    ------------------------------------------ */

    let searchTimer;


    DOM.search?.addEventListener(
        "input",
        event => {

            clearTimeout(
                searchTimer
            );


            searchTimer =
                setTimeout(
                    () => {

                        state.searchQuery =
                            event.target.value
                                .trim();


                        state.currentPage =
                            1;


                        loadBlogs(
                            1
                        );

                    },
                    250
                );

        }
    );


    /* -----------------------------------------
       CATEGORY FILTER
    ------------------------------------------ */

    DOM.categoryFilter?.addEventListener(
        "change",
        event => {

            state.categoryFilter =
                event.target.value;


            state.currentPage =
                1;


            loadBlogs(
                1
            );

        }
    );


    /* -----------------------------------------
       STATUS FILTER
    ------------------------------------------ */

    DOM.statusFilter?.addEventListener(
        "change",
        event => {

            state.statusFilter =
                event.target.value;


            state.currentPage =
                1;


            loadBlogs(
                1
            );

        }
    );


    /* -----------------------------------------
       TABLE ACTIONS
    ------------------------------------------ */

    DOM.tbody?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (
                !button
            ) {

                return;

            }


            const id =
                button.dataset.id;


            const action =
                button.dataset.action;


            if (
                action ===
                "edit"
            ) {

                editBlog(
                    id
                );

            }


            if (
                action ===
                "delete"
            ) {

                deleteBlog(
                    id
                );

            }

        }
    );


    /* -----------------------------------------
       PAGINATION
    ------------------------------------------ */

    DOM.pagination?.addEventListener(
        "click",
        event => {

            const pageButton =
                event.target.closest(
                    "button[data-page]"
                );


            if (
                pageButton
            ) {

                const page =
                    Number(
                        pageButton.dataset.page
                    );


                if (
                    page &&
                    page !==
                    state.currentPage
                ) {

                    loadBlogs(
                        page
                    );

                }


                return;

            }


            const actionButton =
                event.target.closest(
                    "button[data-page-action]"
                );


            if (
                !actionButton
            ) {

                return;

            }


            const totalPages =
                Math.ceil(
                    state.totalItems /
                    state.itemsPerPage
                );


            if (
                actionButton.dataset.pageAction ===
                    "prev" &&
                state.currentPage > 1
            ) {

                loadBlogs(
                    state.currentPage - 1
                );

            }


            if (
                actionButton.dataset.pageAction ===
                    "next" &&
                state.currentPage <
                    totalPages
            ) {

                loadBlogs(
                    state.currentPage + 1
                );

            }

        }
    );

}


/* =========================================================
   BACKWARD COMPATIBILITY
========================================================= */

window.loadBlogs =
    loadBlogs;


window.showCreateBlogForm =
    showCreateBlogForm;


window.cancelEdit =
    cancelEdit;


window.saveBlog =
    saveBlog;


window.editBlog =
    editBlog;


window.deleteBlog =
    deleteBlog;