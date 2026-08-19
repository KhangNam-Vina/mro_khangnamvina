/* =========================================================
   FILE: assets/js/admin/admin-industries.js

   QUẢN LÝ NGÀNH HÀNG
   CHUẨN HÓA UI / UX

   DATABASE CONTRACT - GIỮ NGUYÊN

   industries:
   - name
   - description
   - image_url
   - icon_url
   - is_active
   - features

   KHÔNG:
   - đổi tên column
   - đổi kiểu dữ liệu
   - thêm column
   - sửa schema
   - migration

   CRUD DATABASE GIỮ NGUYÊN:
   INSERT -> industries
   UPDATE -> industries
   DELETE -> industries
========================================================= */


/* =========================================================
   STATE
========================================================= */

const state = {

    industries: [],

    editingId: null,

    currentPage: 1,

    itemsPerPage: 10,

    totalItems: 0,

    searchQuery: ""

};


/* =========================================================
   DOM
========================================================= */

const DOM = {

    form:
        document.getElementById(
            "industryForm"
        ),

    formView:
        document.getElementById(
            "industryFormView"
        ),

    listView:
        document.getElementById(
            "industryListView"
        ),

    formTitle:
        document.getElementById(
            "formTitle"
        ),

    inName:
        document.getElementById(
            "inName"
        ),

    inImg:
        document.getElementById(
            "inImg"
        ),

    inIcon:
        document.getElementById(
            "inIcon"
        ),

    inDesc:
        document.getElementById(
            "inDesc"
        ),

    inFeatures:
        document.getElementById(
            "inFeatures"
        ),

    inActive:
        document.getElementById(
            "inActive"
        ),

    btnAdd:
        document.getElementById(
            "btnAddIndustry"
        ),

    btnBack:
        document.getElementById(
            "btnBackToIndustries"
        ),

    btnSave:
        document.getElementById(
            "btnSaveIndustry"
        ),

    btnCancel:
        document.getElementById(
            "btnCancelEdit"
        ),

    tbody:
        document.getElementById(
            "industryTableBody"
        ),

    pagination:
        document.getElementById(
            "paginationContainer"
        ),

    searchInput:
        document.getElementById(
            "searchIndustryInput"
        ),

    resultText:
        document.getElementById(
            "industryResultText"
        ),

    total:
        document.getElementById(
            "industryTotal"
        ),

    active:
        document.getElementById(
            "industryActive"
        ),

    inactive:
        document.getElementById(
            "industryInactive"
        ),

    withBanner:
        document.getElementById(
            "industryWithBanner"
        ),

    iconPreview:
        document.getElementById(
            "iconPreview"
        ),

    imagePreview:
        document.getElementById(
            "imagePreview"
        ),

    toastContainer:
        document.getElementById(
            "toastContainer"
        )

};


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
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

}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        bindEvents();

        await fetchIndustries();

    }
);


/* =========================================================
   FETCH INDUSTRIES
========================================================= */

async function fetchIndustries() {

    if (
        !DOM.tbody
    ) {

        return;

    }


    renderLoading();


    try {

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


        let query =
            window.supabaseClient
                .from(
                    "industries"
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
                        `name.ilike.%${keyword}%,description.ilike.%${keyword}%`
                    );

            }

        }


        /* -----------------------------------------
           ORDER + PAGINATION
        ------------------------------------------ */

        query =
            query

                .order(
                    "id",
                    {
                        ascending: true
                    }
                )

                .range(
                    from,
                    to
                );


        const {
            data,
            count,
            error
        } =
            await query;


        if (
            error
        ) {

            throw error;

        }


        state.industries =
            data || [];


        state.totalItems =
            count || 0;


        updateStatistics();

        renderIndustries();

        renderPagination();


    } catch (
        error
    ) {

        console.error(
            "Lỗi tải ngành hàng:",
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

                    Không thể tải danh sách ngành hàng.

                    <div
                        class="
                            text-xs
                            font-normal
                            mt-1
                            text-red-400
                        "
                    >
                        ${escapeHTML(
                            error.message
                        )}
                    </div>

                </td>

            </tr>

        `;


        showToast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    const activeCount =
        state.industries.filter(
            item =>
                item.is_active !== false
        ).length;


    const inactiveCount =
        state.industries.filter(
            item =>
                item.is_active === false
        ).length;


    const bannerCount =
        state.industries.filter(
            item =>
                Boolean(
                    item.image_url
                )
        ).length;


    if (
        DOM.total
    ) {

        DOM.total.textContent =
            state.totalItems;

    }


    if (
        DOM.active
    ) {

        DOM.active.textContent =
            activeCount;

    }


    if (
        DOM.inactive
    ) {

        DOM.inactive.textContent =
            inactiveCount;

    }


    if (
        DOM.withBanner
    ) {

        DOM.withBanner.textContent =
            bannerCount;

    }


    if (
        DOM.resultText
    ) {

        DOM.resultText.textContent =
            `${state.totalItems} ngành hàng`;

    }

}


/* =========================================================
   LOADING
========================================================= */

function renderLoading() {

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
                    Đang tải dữ liệu...
                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderIndustries() {

    if (
        !DOM.tbody
    ) {

        return;

    }


    if (
        state.industries.length === 0
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
                                d="M19 11H5m14 0a7 7 0 01-14 0m14 0a7 7 0 01-14 0"
                            />
                        </svg>

                    </div>


                    <div
                        class="
                            font-bold
                            text-gray-500
                        "
                    >
                        Không tìm thấy ngành hàng
                    </div>


                    <div
                        class="
                            text-xs
                            mt-1
                        "
                    >
                        Thử thay đổi từ khóa tìm kiếm.
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
        state.industries
            .map(
                (
                    item,
                    index
                ) => {

                    const active =
                        item.is_active !== false;


                    const iconHTML =
                        item.icon_url

                            ? `

                                <div
                                    class="
                                        w-11
                                        h-11
                                        mx-auto
                                        rounded-lg
                                        border
                                        border-gray-200
                                        bg-white
                                        flex
                                        items-center
                                        justify-center
                                        overflow-hidden
                                    "
                                >

                                    <img
                                        src="${escapeHTML(
                                            item.icon_url
                                        )}"
                                        alt="${escapeHTML(
                                            item.name
                                        )}"
                                        class="
                                            max-w-full
                                            max-h-full
                                            object-contain
                                        "
                                        loading="lazy"
                                        data-image-fallback="icon"
                                    >

                                </div>

                            `

                            : `

                                <div
                                    class="
                                        w-11
                                        h-11
                                        mx-auto
                                        rounded-lg
                                        bg-blue-50
                                        border
                                        border-blue-100
                                        flex
                                        items-center
                                        justify-center
                                        text-kn-blue
                                        text-xs
                                        font-black
                                    "
                                >
                                    IC
                                </div>

                            `;


                    const bannerHTML =
                        item.image_url

                            ? `

                                <div
                                    class="
                                        w-28
                                        h-14
                                        mx-auto
                                        rounded-lg
                                        border
                                        border-gray-200
                                        bg-gray-100
                                        overflow-hidden
                                    "
                                >

                                    <img
                                        src="${escapeHTML(
                                            item.image_url
                                        )}"
                                        alt="${escapeHTML(
                                            item.name
                                        )}"
                                        class="
                                            w-full
                                            h-full
                                            object-cover
                                        "
                                        loading="lazy"
                                        data-image-fallback="banner"
                                    >

                                </div>

                            `

                            : `

                                <div
                                    class="
                                        w-28
                                        h-14
                                        mx-auto
                                        rounded-lg
                                        border
                                        border-dashed
                                        border-gray-300
                                        bg-gray-50
                                        flex
                                        items-center
                                        justify-center
                                        text-[10px]
                                        font-bold
                                        text-gray-400
                                    "
                                >
                                    NO BANNER
                                </div>

                            `;


                    const statusHTML =
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

                                    HIỂN THỊ

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


                            <!-- ICON -->

                            <td
                                class="
                                    px-4
                                    py-4
                                    text-center
                                "
                            >

                                ${iconHTML}

                            </td>


                            <!-- BANNER -->

                            <td
                                class="
                                    px-4
                                    py-4
                                    text-center
                                "
                            >

                                ${bannerHTML}

                            </td>


                            <!-- NAME -->

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
                                    "
                                >
                                    ${escapeHTML(
                                        item.name
                                    )}
                                </div>


                                <div
                                    class="
                                        text-[10px]
                                        text-gray-400
                                        mt-1
                                        font-mono
                                    "
                                >
                                    ID #${escapeHTML(
                                        item.id
                                    )}
                                </div>

                            </td>


                            <!-- DESCRIPTION -->

                            <td
                                class="
                                    px-4
                                    py-4
                                "
                            >

                                <p
                                    class="
                                        text-xs
                                        text-gray-500
                                        leading-5
                                        line-clamp-3
                                    "
                                >
                                    ${
                                        item.description
                                            ? escapeHTML(
                                                item.description
                                            )
                                            : "Chưa có mô tả."
                                    }
                                </p>


                                ${
                                    Array.isArray(
                                        item.features
                                    ) &&
                                    item.features.length

                                        ? `

                                            <div
                                                class="
                                                    flex
                                                    flex-wrap
                                                    gap-1
                                                    mt-2
                                                "
                                            >

                                                ${item.features
                                                    .slice(
                                                        0,
                                                        3
                                                    )
                                                    .map(
                                                        feature => `

                                                            <span
                                                                class="
                                                                    px-1.5
                                                                    py-0.5
                                                                    rounded
                                                                    bg-blue-50
                                                                    text-blue-600
                                                                    text-[9px]
                                                                    font-bold
                                                                "
                                                            >
                                                                ${escapeHTML(
                                                                    feature
                                                                )}
                                                            </span>

                                                        `
                                                    )
                                                    .join("")}

                                            </div>

                                        `

                                        : ""
                                }

                            </td>


                            <!-- STATUS -->

                            <td
                                class="
                                    px-4
                                    py-4
                                    text-center
                                "
                            >

                                ${statusHTML}

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
                                        data-id="${escapeHTML(
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
                                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652l-9.193 9.193a4.5 4.5 0 01-1.897 1.13l-2.052.616.616-2.052a4.5 4.5 0 011.13-1.897l9.193-9.193z"
                                            />
                                        </svg>

                                    </button>


                                    <button
                                        type="button"
                                        data-action="delete"
                                        data-id="${escapeHTML(
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4V4a1 1 0 011-1h4a1 1 0 011 1v3m5 0H4"
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


    bindImageFallbacks();

}


/* =========================================================
   IMAGE FALLBACK
========================================================= */

function bindImageFallbacks() {

    document
        .querySelectorAll(
            "img[data-image-fallback]"
        )
        .forEach(
            image => {

                image.addEventListener(
                    "error",
                    () => {

                        const type =
                            image.dataset
                                .imageFallback;


                        const parent =
                            image.parentElement;


                        if (
                            !parent
                        ) {

                            return;

                        }


                        if (
                            type === "icon"
                        ) {

                            parent.innerHTML = `

                                <span
                                    class="
                                        text-[10px]
                                        font-black
                                        text-gray-400
                                    "
                                >
                                    IC
                                </span>

                            `;

                        } else {

                            parent.innerHTML = `

                                <span
                                    class="
                                        text-[9px]
                                        font-black
                                        text-gray-400
                                    "
                                >
                                    NO BANNER
                                </span>

                            `;

                        }

                    },
                    {
                        once: true
                    }
                );

            }
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
                ${state.totalItems} ngành hàng
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
   SHOW ADD FORM
========================================================= */

function showAddForm() {

    state.editingId =
        null;


    DOM.form.reset();


    DOM.formTitle.textContent =
        "Thêm Ngành hàng Mới";


    DOM.btnSave.textContent =
        "Lưu ngành hàng";


    resetPreviews();


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
   SHOW EDIT FORM
========================================================= */

function editIndustry(
    id
) {

    const item =
        state.industries.find(
            industry =>
                String(
                    industry.id
                ) ===
                String(id)
        );


    if (
        !item
    ) {

        showToast(
            "Không tìm thấy ngành hàng.",
            "error"
        );

        return;

    }


    state.editingId =
        item.id;


    DOM.inName.value =
        item.name ||
        "";


    DOM.inDesc.value =
        item.description ||
        "";


    DOM.inImg.value =
        item.image_url ||
        "";


    DOM.inIcon.value =
        item.icon_url ||
        "";


    DOM.inActive.checked =
        item.is_active !== false;


    /* -----------------------------------------
       FEATURES
    ------------------------------------------ */

    if (
        Array.isArray(
            item.features
        )
    ) {

        DOM.inFeatures.value =
            item.features.join(
                ", "
            );

    } else if (
        typeof item.features ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    item.features
                );


            DOM.inFeatures.value =
                Array.isArray(
                    parsed
                )
                    ? parsed.join(
                        ", "
                    )
                    : item.features;

        } catch (
            error
        ) {

            DOM.inFeatures.value =
                item.features;

        }

    } else {

        DOM.inFeatures.value =
            "";

    }


    DOM.formTitle.textContent =
        "Chỉnh sửa Ngành hàng";


    DOM.btnSave.textContent =
        "Cập nhật ngành hàng";


    updateIconPreview();

    updateImagePreview();


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
   CANCEL FORM
========================================================= */

function cancelForm() {

    state.editingId =
        null;


    DOM.form.reset();


    DOM.inActive.checked =
        true;


    DOM.formTitle.textContent =
        "Thêm Ngành hàng Mới";


    DOM.btnSave.textContent =
        "Lưu ngành hàng";


    resetPreviews();


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
   SAVE INDUSTRY
   DATABASE CONTRACT GIỮ NGUYÊN
========================================================= */

async function saveIndustry(
    event
) {

    if (
        event
    ) {

        event.preventDefault();

    }


    const name =
        DOM.inName.value.trim();


    if (
        !name
    ) {

        showToast(
            "Tên ngành không được để trống!",
            "warning"
        );

        DOM.inName.focus();

        return;

    }


    const originalText =
        DOM.btnSave.textContent;


    DOM.btnSave.disabled =
        true;


    DOM.btnSave.innerHTML = `

        <span
            class="
                inline-block
                w-4
                h-4
                border-2
                border-white
                border-t-transparent
                rounded-full
                animate-spin
                mr-2
                align-middle
            "
        ></span>

        Đang lưu...

    `;


    try {

        /* -----------------------------------------
           FEATURES
           VẪN LƯU ARRAY
        ------------------------------------------ */

        let featuresArray =
            [];


        if (
            DOM.inFeatures &&
            DOM.inFeatures.value.trim()
        ) {

            featuresArray =
                DOM.inFeatures.value
                    .trim()
                    .split(",")
                    .map(
                        item =>
                            item.trim()
                    )
                    .filter(
                        item =>
                            item !== ""
                    );

        }


        /* -----------------------------------------
           PAYLOAD
           GIỮ NGUYÊN 100%
        ------------------------------------------ */

        const payload = {

            name:
                DOM.inName.value.trim(),

            description:
                DOM.inDesc.value.trim() ||
                null,

            image_url:
                DOM.inImg.value.trim() ||
                null,

            icon_url:
                DOM.inIcon.value.trim() ||
                null,

            is_active:
                DOM.inActive.checked,

            features:
                featuresArray

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
                        "industries"
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


            showToast(
                "Đã cập nhật ngành hàng!",
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
                        "industries"
                    )

                    .insert([
                        payload
                    ]);


            if (
                error
            ) {

                throw error;

            }


            showToast(
                "Thêm ngành hàng thành công!",
                "success"
            );

        }


        cancelForm();

        await fetchIndustries();


    } catch (
        error
    ) {

        console.error(
            "Lỗi lưu ngành hàng:",
            error
        );


        showToast(
            "Lỗi: " +
            error.message,
            "error"
        );


    } finally {

        DOM.btnSave.disabled =
            false;


        DOM.btnSave.textContent =
            originalText;

    }

}


/* =========================================================
   DELETE INDUSTRY
========================================================= */

async function deleteIndustry(
    id
) {

    const item =
        state.industries.find(
            industry =>
                String(
                    industry.id
                ) ===
                String(id)
        );


    if (
        !item
    ) {

        showToast(
            "Không tìm thấy ngành hàng.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Bạn có chắc muốn xóa ngành hàng "${item.name}"?`
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        const {
            error
        } =
            await window.supabaseClient

                .from(
                    "industries"
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
            state.industries.length === 1 &&
            state.currentPage > 1
        ) {

            state.currentPage--;

        }


        showToast(
            "Đã xóa ngành hàng.",
            "success"
        );


        await fetchIndustries();


    } catch (
        error
    ) {

        console.error(
            "Lỗi xóa ngành hàng:",
            error
        );


        showToast(
            "Lỗi xóa: " +
            error.message,
            "error"
        );

    }

}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

function updateIconPreview() {

    if (
        !DOM.iconPreview
    ) {

        return;

    }


    const url =
        DOM.inIcon.value.trim();


    if (
        !url
    ) {

        DOM.iconPreview.innerHTML =
            "Chưa có icon";

        return;

    }


    DOM.iconPreview.innerHTML = `

        <img
            src="${escapeHTML(
                url
            )}"
            alt="Icon preview"
            class="
                max-h-20
                max-w-20
                object-contain
            "
        >

    `;


    const image =
        DOM.iconPreview.querySelector(
            "img"
        );


    image.addEventListener(
        "error",
        () => {

            DOM.iconPreview.innerHTML = `

                <span
                    class="
                        text-xs
                        font-bold
                        text-red-400
                    "
                >
                    Không thể tải icon
                </span>

            `;

        },
        {
            once: true
        }
    );

}


function updateImagePreview() {

    if (
        !DOM.imagePreview
    ) {

        return;

    }


    const url =
        DOM.inImg.value.trim();


    if (
        !url
    ) {

        DOM.imagePreview.innerHTML =
            "Chưa có banner";

        return;

    }


    DOM.imagePreview.innerHTML = `

        <img
            src="${escapeHTML(
                url
            )}"
            alt="Banner preview"
            class="
                w-full
                h-full
                object-cover
            "
        >

    `;


    const image =
        DOM.imagePreview.querySelector(
            "img"
        );


    image.addEventListener(
        "error",
        () => {

            DOM.imagePreview.innerHTML = `

                <span
                    class="
                        text-xs
                        font-bold
                        text-red-400
                    "
                >
                    Không thể tải banner
                </span>

            `;

        },
        {
            once: true
        }
    );

}


function resetPreviews() {

    if (
        DOM.iconPreview
    ) {

        DOM.iconPreview.innerHTML =
            "Chưa có icon";

    }


    if (
        DOM.imagePreview
    ) {

        DOM.imagePreview.innerHTML =
            "Chưa có banner";

    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
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


    const isSuccess =
        type === "success";


    const isWarning =
        type === "warning";


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

        ${
            isSuccess
                ? "bg-gray-900"
                : isWarning
                    ? "bg-kn-orange"
                    : "bg-red-600"
        }

        opacity-0
        translate-y-2

        transition-all
        duration-300

    `;


    toast.innerHTML = `

        <span>

            ${
                isSuccess
                    ? "✓"
                    : isWarning
                        ? "!"
                        : "×"
            }

        </span>

        <span>
            ${escapeHTML(
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
        showAddForm
    );


    /* -----------------------------------------
       BACK
    ------------------------------------------ */

    DOM.btnBack?.addEventListener(
        "click",
        cancelForm
    );


    /* -----------------------------------------
       CANCEL
    ------------------------------------------ */

    DOM.btnCancel?.addEventListener(
        "click",
        cancelForm
    );


    /* -----------------------------------------
       FORM SUBMIT
    ------------------------------------------ */

    DOM.form?.addEventListener(
        "submit",
        saveIndustry
    );


    /* -----------------------------------------
       SEARCH
    ------------------------------------------ */

    let searchTimer;


    DOM.searchInput?.addEventListener(
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


                        fetchIndustries();

                    },
                    250
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
                action === "edit"
            ) {

                editIndustry(
                    id
                );

            }


            if (
                action === "delete"
            ) {

                deleteIndustry(
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

                    state.currentPage =
                        page;


                    fetchIndustries();

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

                state.currentPage--;

                fetchIndustries();

            }


            if (
                actionButton.dataset.pageAction ===
                "next" &&
                state.currentPage <
                    totalPages
            ) {

                state.currentPage++;

                fetchIndustries();

            }

        }
    );


    /* -----------------------------------------
       ICON PREVIEW
    ------------------------------------------ */

    DOM.inIcon?.addEventListener(
        "input",
        updateIconPreview
    );


    /* -----------------------------------------
       BANNER PREVIEW
    ------------------------------------------ */

    DOM.inImg?.addEventListener(
        "input",
        updateImagePreview
    );

}


/* =========================================================
   BACKWARD COMPATIBILITY
   Nếu những file khác đang gọi các function cũ
========================================================= */

window.fetchIndustries =
    fetchIndustries;


window.saveIndustry =
    saveIndustry;


window.editIndustry =
    editIndustry;


window.cancelForm =
    cancelForm;


window.deleteIndustry =
    deleteIndustry;