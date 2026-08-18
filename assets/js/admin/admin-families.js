/* =========================================================
   ADMIN FAMILIES
   QUẢN LÝ DÒNG SẢN PHẨM

   Catalog:
   Category
      ↓
   Subcategory
      ↓
   Family
      ↓
   Product
========================================================= */


const state = {

    families: [],

    subCategories: [],

    editingId: null,

    currentPage: 1,

    itemsPerPage: 10,

    totalItems: 0,

    searchQuery: "",

    filterSubCategoryId: "all"

};


/* =========================================================
   DOM
========================================================= */

const DOM = {

    form:
        document.getElementById(
            "familyForm"
        ),

    modal:
        document.getElementById(
            "familyModal"
        ),

    modalTitle:
        document.getElementById(
            "modalTitle"
        ),

    familyId:
        document.getElementById(
            "familyId"
        ),

    inName:
        document.getElementById(
            "inName"
        ),

    inSlug:
        document.getElementById(
            "inSlug"
        ),

    inThumbnail:
        document.getElementById(
            "inThumbnail"
        ),

    thumbnailPreview:
        document.getElementById(
            "thumbnailPreview"
        ),

    selSubCategory:
        document.getElementById(
            "selSubCategory"
        ),

    filterSubCategory:
        document.getElementById(
            "filterSubCategorySelect"
        ),

    btnAdd:
        document.getElementById(
            "btnAddFamily"
        ),

    btnSave:
        document.getElementById(
            "btnSaveFamily"
        ),

    btnCancel:
        document.getElementById(
            "btnCancelEdit"
        ),

    btnClose:
        document.getElementById(
            "btnCloseModal"
        ),

    tbody:
        document.getElementById(
            "familyTableBody"
        ),

    pagination:
        document.getElementById(
            "paginationContainer"
        ),

    searchInput:
        document.getElementById(
            "searchFamilyInput"
        ),

    total:
        document.getElementById(
            "familyTotal"
        ),

    linked:
        document.getElementById(
            "familyLinked"
        ),

    broken:
        document.getElementById(
            "familyBroken"
        ),

    toast:
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
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   SLUG
========================================================= */

function generateSlug(
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
            /[^a-z0-9\s-]/g,
            ""
        )

        .trim()

        .replace(
            /\s+/g,
            "-"
        )

        .replace(
            /-+/g,
            "-"
        );

}


/* =========================================================
   LOAD SUBCATEGORIES
========================================================= */

async function loadDropdownSubCategories() {

    try {

        const {
            data,
            error
        } =
            await window.supabaseClient

                .from(
                    "sub_categories"
                )

                .select(
                    "id, name"
                )

                .order(
                    "name",
                    {
                        ascending: true
                    }
                );


        if (error) {

            throw error;

        }


        state.subCategories =
            data || [];


        renderSubCategoryDropdowns();


    } catch (error) {

        console.error(
            "Lỗi tải nhóm hàng:",
            error
        );


        showToast(
            "Không thể tải danh sách nhóm hàng.",
            "error"
        );

    }

}


/* =========================================================
   RENDER SUBCATEGORY DROPDOWNS
========================================================= */

function renderSubCategoryDropdowns() {

    const options =
        state.subCategories
            .map(
                sub => `
                    <option
                        value="${escapeAttribute(sub.id)}"
                    >
                        ${escapeHTML(sub.name)}
                    </option>
                `
            )
            .join("");


    if (
        DOM.selSubCategory
    ) {

        DOM.selSubCategory.innerHTML = `

            <option value="">
                -- Chọn nhóm hàng --
            </option>

            ${options}

        `;

    }


    if (
        DOM.filterSubCategory
    ) {

        DOM.filterSubCategory.innerHTML = `

            <option value="all">
                Tất cả nhóm hàng
            </option>

            ${options}

        `;

    }

}


/* =========================================================
   LOAD FAMILIES
========================================================= */

async function fetchFamilies() {

    if (
        DOM.tbody
    ) {

        DOM.tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="
                        text-center
                        py-12
                        text-gray-400
                    "
                >

                    <div
                        class="
                            inline-block
                            w-6
                            h-6
                            border-2
                            border-kn-blue
                            border-t-transparent
                            rounded-full
                            animate-spin
                        "
                    ></div>

                    <div class="mt-2">
                        Đang tải dữ liệu...
                    </div>

                </td>

            </tr>

        `;

    }


    try {

        const from =
            (
                state.currentPage - 1
            ) *
            state.itemsPerPage;


        const to =
            from +
            state.itemsPerPage -
            1;


        let query =
            window.supabaseClient

                .from(
                    "families"
                )

                .select(
                    `
                        *,
                        sub_categories (
                            id,
                            name
                        )
                    `,
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


            if (keyword) {

                query =
                    query.or(
                        `name.ilike.%${keyword}%,slug.ilike.%${keyword}%`
                    );

            }

        }


        /* -----------------------------------------
           FILTER
        ------------------------------------------ */

        if (
            state.filterSubCategoryId !==
            "all"
        ) {

            query =
                query.eq(
                    "sub_category_id",
                    state.filterSubCategoryId
                );

        }


        /* -----------------------------------------
           QUERY
        ------------------------------------------ */

        const {
            data,
            count,
            error
        } =
            await query

                .order(
                    "id",
                    {
                        ascending: false
                    }
                )

                .range(
                    from,
                    to
                );


        if (error) {

            throw error;

        }


        state.families =
            data || [];


        state.totalItems =
            count || 0;


        updateStatistics();

        renderFamilies();

        renderPagination();


    } catch (error) {

        console.error(
            "Lỗi tải Family:",
            error
        );


        if (
            DOM.tbody
        ) {

            DOM.tbody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="
                            text-center
                            py-12
                            text-red-500
                            font-bold
                        "
                    >

                        Không thể tải dữ liệu.

                        <div
                            class="
                                text-xs
                                font-normal
                                text-red-400
                                mt-1
                            "
                        >
                            ${escapeHTML(
                                error.message
                            )}
                        </div>

                    </td>

                </tr>

            `;

        }

    }

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    const linked =
        state.families.filter(
            item =>
                item.sub_categories &&
                item.sub_categories.id
        ).length;


    const broken =
        state.families.filter(
            item =>
                !item.sub_categories
        ).length;


    if (
        DOM.total
    ) {

        DOM.total.textContent =
            state.totalItems;

    }


    if (
        DOM.linked
    ) {

        DOM.linked.textContent =
            linked;

    }


    if (
        DOM.broken
    ) {

        DOM.broken.textContent =
            broken;

    }

}


/* =========================================================
   RENDER FAMILIES
========================================================= */

function renderFamilies() {

    if (
        !DOM.tbody
    ) {

        return;

    }


    if (
        state.families.length === 0
    ) {

        DOM.tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
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
                            rounded-full
                            bg-gray-100
                            flex
                            items-center
                            justify-center
                            mx-auto
                            mb-3
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
                                d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0H4"
                            />
                        </svg>

                    </div>


                    <div
                        class="
                            font-bold
                            text-gray-500
                        "
                    >
                        Không tìm thấy dòng sản phẩm
                    </div>


                    <div
                        class="
                            text-xs
                            mt-1
                        "
                    >
                        Thử thay đổi từ khóa hoặc nhóm hàng.
                    </div>

                </td>

            </tr>

        `;

        return;

    }


    DOM.tbody.innerHTML =
        state.families
            .map(
                item => {

                    const parent =
                        item.sub_categories;


                    const parentHTML =
                        parent

                            ? `
                                <span
                                    class="
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        px-2.5
                                        py-1.5
                                        rounded-lg
                                        bg-blue-50
                                        border
                                        border-blue-100
                                        text-blue-700
                                        font-bold
                                        text-xs
                                        whitespace-nowrap
                                    "
                                >

                                    <svg
                                        class="w-3.5 h-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M4 6h16M4 12h16M4 18h10"
                                        />
                                    </svg>

                                    ${escapeHTML(
                                        parent.name
                                    )}

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
                                        bg-red-50
                                        border
                                        border-red-100
                                        text-red-600
                                        font-bold
                                        text-xs
                                    "
                                >

                                    <span
                                        class="
                                            w-1.5
                                            h-1.5
                                            rounded-full
                                            bg-red-500
                                        "
                                    ></span>

                                    Mất liên kết

                                </span>
                            `;


                    const imageHTML =
                        item.thumbnail_url

                            ? `
                                <div
                                    class="
                                        w-10
                                        h-10
                                        mx-auto
                                        rounded-lg
                                        bg-white
                                        border
                                        border-gray-200
                                        overflow-hidden
                                        flex
                                        items-center
                                        justify-center
                                    "
                                >

                                    <img
                                        src="${escapeAttribute(
                                            item.thumbnail_url
                                        )}"
                                        alt="${escapeAttribute(
                                            item.name
                                        )}"
                                        class="
                                            w-full
                                            h-full
                                            object-contain
                                        "
                                        loading="lazy"
                                        onerror="
                                            this.style.display='none';
                                            this.nextElementSibling.classList.remove('hidden');
                                        "
                                    >

                                    <span
                                        class="
                                            hidden
                                            text-[9px]
                                            font-bold
                                            text-gray-400
                                        "
                                    >
                                        IMG
                                    </span>

                                </div>
                            `

                            : `
                                <div
                                    class="
                                        w-10
                                        h-10
                                        mx-auto
                                        rounded-lg
                                        bg-gray-100
                                        border
                                        border-gray-200
                                        flex
                                        items-center
                                        justify-center
                                        text-[9px]
                                        font-bold
                                        text-gray-400
                                    "
                                >
                                    No Img
                                </div>
                            `;


                    return `

                        <tr
                            class="
                                group
                                hover:bg-blue-50/40
                                transition-colors
                            "
                        >


                            <!-- ID -->

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
                                #${item.id}
                            </td>


                            <!-- IMAGE -->

                            <td
                                class="
                                    px-4
                                    py-4
                                    text-center
                                "
                            >
                                ${imageHTML}
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
                                        font-bold
                                        text-gray-900
                                    "
                                >
                                    ${escapeHTML(
                                        item.name
                                    )}
                                </div>

                            </td>


                            <!-- PARENT -->

                            <td
                                class="
                                    px-4
                                    py-4
                                "
                            >

                                ${parentHTML}

                            </td>


                            <!-- SLUG -->

                            <td
                                class="
                                    px-4
                                    py-4
                                "
                            >

                                <span
                                    class="
                                        inline-block
                                        px-2.5
                                        py-1
                                        rounded-md
                                        bg-gray-50
                                        border
                                        border-gray-200
                                        text-xs
                                        font-mono
                                        text-gray-500
                                    "
                                >
                                    ${escapeHTML(
                                        item.slug ||
                                        "--"
                                    )}
                                </span>

                            </td>


                            <!-- ACTION -->

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
                                        data-id="${item.id}"
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
                                        data-id="${item.id}"
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
                ${state.totalItems} dòng sản phẩm
            </span>

        `;

        return;

    }


    const startItem =
        (
            (
                state.currentPage - 1
            ) *
            state.itemsPerPage
        ) + 1;


    const endItem =
        Math.min(
            state.currentPage *
                state.itemsPerPage,
            state.totalItems
        );


    const pages = [];


    pages.push(
        1
    );


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


    if (
        totalPages > 1
    ) {

        pages.push(
            totalPages
        );

    }


    DOM.pagination.innerHTML = `

        <div
            class="
                text-xs
                text-gray-500
            "
        >
            Hiển thị
            <strong class="text-gray-700">
                ${startItem}-${endItem}
            </strong>
            /
            <strong class="text-gray-700">
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


            ${pages
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
                .join("")}


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
   OPEN MODAL
========================================================= */

function openFamilyModal(
    item = null
) {

    if (
        !DOM.modal
    ) {

        return;

    }


    if (
        item
    ) {

        state.editingId =
            item.id;


        DOM.modalTitle.textContent =
            "Chỉnh sửa dòng sản phẩm";


        DOM.familyId.value =
            item.id;


        DOM.selSubCategory.value =
            item.sub_category_id ||
            "";


        DOM.inName.value =
            item.name ||
            "";


        DOM.inSlug.value =
            item.slug ||
            "";


        DOM.inThumbnail.value =
            item.thumbnail_url ||
            "";


        updateThumbnailPreview(
            item.thumbnail_url
        );

    } else {

        state.editingId =
            null;


        DOM.form.reset();


        DOM.familyId.value =
            "";


        DOM.modalTitle.textContent =
            "Thêm dòng sản phẩm";


        DOM.selSubCategory.value =
            "";


        updateThumbnailPreview(
            ""
        );

    }


    DOM.modal.classList.remove(
        "hidden"
    );

    DOM.modal.classList.add(
        "flex"
    );


    setTimeout(
        () => {

            DOM.selSubCategory?.focus();

        },
        50
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeFamilyModal() {

    if (
        !DOM.modal
    ) {

        return;

    }


    DOM.modal.classList.add(
        "hidden"
    );

    DOM.modal.classList.remove(
        "flex"
    );


    state.editingId =
        null;

}


/* =========================================================
   EDIT
========================================================= */

function editFamily(
    id
) {

    const item =
        state.families.find(
            family =>
                Number(
                    family.id
                ) ===
                Number(id)
        );


    if (
        !item
    ) {

        showToast(
            "Không tìm thấy dòng sản phẩm.",
            "error"
        );

        return;

    }


    openFamilyModal(
        item
    );

}


/* =========================================================
   SAVE
========================================================= */

async function saveFamily(
    event
) {

    event.preventDefault();


    const payload = {

        name:
            DOM.inName.value.trim(),

        slug:
            DOM.inSlug.value.trim(),

        thumbnail_url:
            DOM.inThumbnail.value.trim() ||
            null,

        sub_category_id:
            DOM.selSubCategory.value

    };


    if (
        !payload.name
    ) {

        showToast(
            "Vui lòng nhập tên dòng sản phẩm.",
            "error"
        );

        DOM.inName.focus();

        return;

    }


    if (
        !payload.slug
    ) {

        showToast(
            "Vui lòng nhập slug.",
            "error"
        );

        DOM.inSlug.focus();

        return;

    }


    if (
        !payload.sub_category_id
    ) {

        showToast(
            "Vui lòng chọn nhóm hàng.",
            "error"
        );

        DOM.selSubCategory.focus();

        return;

    }


    const originalText =
        DOM.btnSave.innerHTML;


    DOM.btnSave.disabled =
        true;


    DOM.btnSave.innerHTML =
        "Đang lưu...";


    try {

        /* -----------------------------------------
           CHECK DUPLICATE
        ------------------------------------------ */

        let checkQuery =
            window.supabaseClient

                .from(
                    "families"
                )

                .select(
                    "id"
                )

                .eq(
                    "name",
                    payload.name
                )

                .eq(
                    "sub_category_id",
                    payload.sub_category_id
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
            await checkQuery
                .maybeSingle();


        if (
            checkError
        ) {

            throw checkError;

        }


        if (
            existing
        ) {

            showToast(
                `Dòng sản phẩm "${payload.name}" đã tồn tại trong nhóm này.`,
                "error"
            );

            DOM.inName.focus();

            return;

        }


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
                        "families"
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
                "Cập nhật dòng sản phẩm thành công.",
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
                        "families"
                    )

                    .insert([
                        payload
                    ]);


            if (
                error
            ) {

                throw error;

            }


            state.currentPage =
                1;


            showToast(
                "Thêm dòng sản phẩm thành công.",
                "success"
            );

        }


        closeFamilyModal();

        await fetchFamilies();


    } catch (error) {

        console.error(
            "Lỗi lưu Family:",
            error
        );


        showToast(
            `Không thể lưu dòng sản phẩm: ${error.message}`,
            "error"
        );


    } finally {

        DOM.btnSave.disabled =
            false;


        DOM.btnSave.innerHTML =
            originalText;

    }

}


/* =========================================================
   CHECK PRODUCT DEPENDENCY
========================================================= */

async function checkProductDependencies(
    familyId
) {

    const {
        count,
        error
    } =
        await window.supabaseClient

            .from(
                "products"
            )

            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )

            .eq(
                "family_id",
                familyId
            );


    if (
        error
    ) {

        /*
           Nếu products.family_id chưa tồn tại
           trong schema hiện tại thì không tự
           chặn delete bằng một giả định sai.

           FK bên database vẫn sẽ bảo vệ dữ liệu.
        */

        if (
            error.code === "42703"
        ) {

            return 0;

        }


        throw error;

    }


    return count || 0;

}


/* =========================================================
   DELETE
========================================================= */

async function deleteFamily(
    id
) {

    const item =
        state.families.find(
            family =>
                Number(
                    family.id
                ) ===
                Number(id)
        );


    if (
        !item
    ) {

        showToast(
            "Không tìm thấy dòng sản phẩm.",
            "error"
        );

        return;

    }


    try {

        const productCount =
            await checkProductDependencies(
                id
            );


        if (
            productCount > 0
        ) {

            showToast(
                `Không thể xóa "${item.name}" vì đang có ${productCount} sản phẩm thuộc dòng này.`,
                "error"
            );

            return;

        }


        const confirmed =
            window.confirm(
                `Bạn có chắc muốn xóa dòng sản phẩm "${item.name}"?`
            );


        if (
            !confirmed
        ) {

            return;

        }


        const {
            error
        } =
            await window.supabaseClient

                .from(
                    "families"
                )

                .delete()

                .eq(
                    "id",
                    id
                );


        if (
            error
        ) {

            if (
                error.code ===
                "23503"
            ) {

                showToast(
                    "Không thể xóa vì dòng sản phẩm đang được dữ liệu khác sử dụng.",
                    "error"
                );

                return;

            }


            throw error;

        }


        if (
            state.families.length === 1 &&
            state.currentPage > 1
        ) {

            state.currentPage--;

        }


        showToast(
            "Đã xóa dòng sản phẩm.",
            "success"
        );


        await fetchFamilies();


    } catch (error) {

        console.error(
            "Lỗi xóa Family:",
            error
        );


        showToast(
            `Không thể xóa dòng sản phẩm: ${error.message}`,
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
        !DOM.thumbnailPreview
    ) {

        return;

    }


    if (
        !url
    ) {

        DOM.thumbnailPreview.classList.add(
            "hidden"
        );

        DOM.thumbnailPreview.innerHTML =
            "";

        return;

    }


    DOM.thumbnailPreview.classList.remove(
        "hidden"
    );


    DOM.thumbnailPreview.innerHTML = `

        <div
            class="
                flex
                items-center
                gap-3
            "
        >

            <div
                class="
                    w-16
                    h-16
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    overflow-hidden
                    flex
                    items-center
                    justify-center
                "
            >

                <img
                    src="${escapeAttribute(url)}"
                    alt="Thumbnail preview"
                    class="
                        w-full
                        h-full
                        object-contain
                    "
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.classList.remove('hidden');
                    "
                >

                <span
                    class="
                        hidden
                        text-[9px]
                        text-gray-400
                        font-bold
                    "
                >
                    Không tải được
                </span>

            </div>


            <div>

                <div
                    class="
                        text-xs
                        font-bold
                        text-gray-700
                    "
                >
                    Xem trước thumbnail
                </div>

                <div
                    class="
                        text-[11px]
                        text-gray-400
                        mt-1
                        break-all
                    "
                >
                    ${escapeHTML(url)}
                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    if (
        !DOM.toast
    ) {

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    const success =
        type === "success";


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
            success
                ? "bg-gray-900"
                : "bg-red-600"
        }

        opacity-0
        translate-y-2

        transition-all
        duration-300

    `;


    toast.innerHTML = `

        ${
            success

                ? `
                    <svg
                        class="w-4 h-4 text-green-400 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="m5 12 4 4L19 6"
                        />
                    </svg>
                `

                : `
                    <svg
                        class="w-4 h-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18 18 6M6 6l12 12"
                        />
                    </svg>
                `
        }

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    DOM.toast.appendChild(
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
        () => {

            openFamilyModal();

        }
    );


    /* -----------------------------------------
       CLOSE
    ------------------------------------------ */

    DOM.btnClose?.addEventListener(
        "click",
        closeFamilyModal
    );


    DOM.btnCancel?.addEventListener(
        "click",
        closeFamilyModal
    );


    /* -----------------------------------------
       BACKDROP
    ------------------------------------------ */

    DOM.modal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                DOM.modal
            ) {

                closeFamilyModal();

            }

        }
    );


    /* -----------------------------------------
       ESC
    ------------------------------------------ */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                DOM.modal &&
                !DOM.modal.classList.contains(
                    "hidden"
                )
            ) {

                closeFamilyModal();

            }

        }
    );


    /* -----------------------------------------
       SEARCH DEBOUNCE
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


                        fetchFamilies();

                    },
                    300
                );

        }
    );


    /* -----------------------------------------
       FILTER
    ------------------------------------------ */

    DOM.filterSubCategory?.addEventListener(
        "change",
        event => {

            state.filterSubCategoryId =
                event.target.value;


            state.currentPage =
                1;


            fetchFamilies();

        }
    );


    /* -----------------------------------------
       FORM
    ------------------------------------------ */

    DOM.form?.addEventListener(
        "submit",
        saveFamily
    );


    /* -----------------------------------------
       AUTO SLUG
    ------------------------------------------ */

    DOM.inName?.addEventListener(
        "input",
        event => {

            if (
                state.editingId
            ) {

                return;

            }


            DOM.inSlug.value =
                generateSlug(
                    event.target.value
                );

        }
    );


    /* -----------------------------------------
       SLUG NORMALIZE
    ------------------------------------------ */

    DOM.inSlug?.addEventListener(
        "blur",
        () => {

            DOM.inSlug.value =
                generateSlug(
                    DOM.inSlug.value
                );

        }
    );


    /* -----------------------------------------
       THUMBNAIL PREVIEW
    ------------------------------------------ */

    DOM.inThumbnail?.addEventListener(
        "input",
        event => {

            updateThumbnailPreview(
                event.target.value.trim()
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

                editFamily(
                    id
                );

            }


            if (
                action === "delete"
            ) {

                deleteFamily(
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


                    fetchFamilies();

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

                fetchFamilies();

            }


            if (
                actionButton.dataset.pageAction ===
                "next" &&
                state.currentPage <
                    totalPages
            ) {

                state.currentPage++;

                fetchFamilies();

            }

        }
    );

}


/* =========================================================
   BACKWARD COMPATIBILITY
========================================================= */

window.editFamily =
    editFamily;


window.deleteFamily =
    deleteFamily;


window.fetchFamilies =
    fetchFamilies;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        bindEvents();

        await loadDropdownSubCategories();

        await fetchFamilies();

    }
);