/* =========================================================
   ADMIN SUBCATEGORIES
   QUẢN LÝ NHÓM HÀNG

   - Server-side search
   - Pagination
   - Parent category filter
   - Create
   - Update
   - Delete
   - Dependency protection
   - Auto slug
   - Toast
========================================================= */


const state = {

    currentPage: 1,

    itemsPerPage: 10,

    totalItems: 0,

    searchQuery: "",

    filterParentId: "all",

    currentItems: [],

    allParents: []

};


/* =========================================================
   DOM
========================================================= */

const DOM = {

    tableBody:
        document.getElementById("tableBody"),

    pagination:
        document.getElementById(
            "paginationContainer"
        ),

    search:
        document.getElementById(
            "searchInput"
        ),

    parentFilter:
        document.getElementById(
            "filterParentSelect"
        ),

    parentSelect:
        document.getElementById(
            "parentCategory"
        ),

    modal:
        document.getElementById(
            "formModal"
        ),

    modalTitle:
        document.getElementById(
            "modalTitle"
        ),

    form:
        document.getElementById(
            "dataForm"
        ),

    id:
        document.getElementById(
            "subId"
        ),

    name:
        document.getElementById(
            "subName"
        ),

    slug:
        document.getElementById(
            "subSlug"
        ),

    metaTitle:
        document.getElementById(
            "subMetaTitle"
        ),

    metaDesc:
        document.getElementById(
            "subMetaDesc"
        ),

    submit:
        document.getElementById(
            "btnSubmit"
        ),

    add:
        document.getElementById(
            "btnAddSubcategory"
        ),

    close:
        document.getElementById(
            "btnCloseModal"
        ),

    cancel:
        document.getElementById(
            "btnCancelModal"
        ),

    total:
        document.getElementById(
            "subcatTotal"
        ),

    linked:
        document.getElementById(
            "subcatLinked"
        ),

    broken:
        document.getElementById(
            "subcatBroken"
        ),

    stats:
        document.getElementById(
            "subcatStats"
        ),

    toast:
        document.getElementById(
            "toastContainer"
        )

};


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value).replace(
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
   SLUG
========================================================= */

function generateSlug(
    text
) {

    return String(text || "")

        .toLowerCase()

        .normalize("NFD")

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
   LOAD PARENTS
========================================================= */

async function loadParents() {

    try {

        const {
            data,
            error
        } = await window.supabaseClient

            .from("categories")

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


        state.allParents =
            data || [];


        renderParentDropdowns();


    } catch (error) {

        console.error(
            "Lỗi tải danh mục gốc:",
            error
        );


        showToast(
            "Không thể tải danh mục gốc.",
            "error"
        );

    }

}


/* =========================================================
   RENDER PARENT DROPDOWNS
========================================================= */

function renderParentDropdowns() {

    const options =
        state.allParents
            .map(
                parent => `
                    <option
                        value="${escapeHTML(parent.id)}"
                    >
                        ${escapeHTML(parent.name)}
                    </option>
                `
            )
            .join("");


    if (DOM.parentSelect) {

        DOM.parentSelect.innerHTML = `

            <option value="">
                -- Chọn danh mục gốc --
            </option>

            ${options}

        `;

    }


    if (DOM.parentFilter) {

        DOM.parentFilter.innerHTML = `

            <option value="all">
                Tất cả danh mục gốc
            </option>

            ${options}

        `;

    }

}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadData() {

    if (!DOM.tableBody) {

        return;

    }


    renderLoading();


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
                    "sub_categories"
                )

                .select(
                    `
                        *,
                        categories (
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
           PARENT FILTER
        ------------------------------------------ */

        if (
            state.filterParentId !==
            "all"
        ) {

            query =
                query.eq(
                    "category_id",
                    state.filterParentId
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
                        ascending: true
                    }
                )

                .range(
                    from,
                    to
                );


        if (error) {

            throw error;

        }


        state.currentItems =
            data || [];


        state.totalItems =
            count || 0;


        updateStats();


        renderTable(
            state.currentItems
        );


        renderPagination();


    } catch (error) {

        console.error(
            "Lỗi tải nhóm hàng:",
            error
        );


        DOM.tableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
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


/* =========================================================
   LOADING
========================================================= */

function renderLoading() {

    DOM.tableBody.innerHTML = `

        <tr>

            <td
                colspan="5"
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


/* =========================================================
   UPDATE STATS
========================================================= */

function updateStats() {

    /*
       totalItems là tổng theo filter/search hiện tại.
       currentItems dùng để xác định các row đang có link.
    */

    const linked =
        state.currentItems.filter(
            item =>
                item.categories &&
                item.categories.id
        ).length;


    const broken =
        state.currentItems.filter(
            item =>
                !item.categories
        ).length;


    if (DOM.stats) {

        DOM.stats.textContent =
            `${state.totalItems} nhóm hàng`;

    }


    if (DOM.total) {

        DOM.total.textContent =
            state.totalItems;

    }


    if (DOM.linked) {

        DOM.linked.textContent =
            linked;

    }


    if (DOM.broken) {

        DOM.broken.textContent =
            broken;

    }

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderTable(
    items
) {

    if (!items.length) {

        DOM.tableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
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
                        Không tìm thấy nhóm hàng
                    </div>


                    <div
                        class="
                            text-xs
                            mt-1
                        "
                    >
                        Thử thay đổi từ khóa hoặc danh mục gốc.
                    </div>

                </td>

            </tr>

        `;


        return;

    }


    DOM.tableBody.innerHTML =
        items
            .map(
                item => {

                    const parent =
                        item.categories;


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
                                            d="M3 7.5A2.5 2.5 0 015.5 5h5L13 7.5h5.5A2.5 2.5 0 0121 10v7.5a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 17.5v-10z"
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


                                    <!-- EDIT -->

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


                                    <!-- DELETE -->

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

    if (!DOM.pagination) {

        return;

    }


    const totalPages =
        Math.ceil(
            state.totalItems /
            state.itemsPerPage
        );


    if (totalPages <= 1) {

        DOM.pagination.innerHTML = `

            <span
                class="
                    text-xs
                    text-gray-500
                "
            >
                ${state.totalItems} nhóm hàng
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


    let pages = [];


    /*
       Không render hàng trăm nút.
       Chỉ giữ vài page xung quanh page hiện tại.
    */

    pages.push(1);


    if (
        state.currentPage > 3
    ) {

        pages.push("...");

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

        pages.push(page);

    }


    if (
        state.currentPage <
        totalPages - 2
    ) {

        pages.push("...");

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

function openModal(
    item = null
) {

    if (!DOM.modal) {

        return;

    }


    if (item) {

        DOM.modalTitle.textContent =
            "Chỉnh sửa nhóm hàng";


        DOM.id.value =
            item.id;


        DOM.parentSelect.value =
            item.category_id || "";


        DOM.name.value =
            item.name || "";


        DOM.slug.value =
            item.slug || "";


        DOM.metaTitle.value =
            item.meta_title || "";


        DOM.metaDesc.value =
            item.meta_description || "";


    } else {

        DOM.form.reset();


        DOM.id.value =
            "";


        DOM.modalTitle.textContent =
            "Thêm nhóm hàng";


        DOM.parentSelect.value =
            "";


    }


    DOM.modal.classList.remove(
        "hidden"
    );

    DOM.modal.classList.add(
        "flex"
    );


    setTimeout(
        () => {

            DOM.parentSelect?.focus();

        },
        50
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    if (!DOM.modal) {

        return;

    }


    DOM.modal.classList.add(
        "hidden"
    );

    DOM.modal.classList.remove(
        "flex"
    );

}


/* =========================================================
   EDIT
========================================================= */

function editItem(
    id
) {

    const item =
        state.currentItems.find(
            current =>
                Number(
                    current.id
                ) ===
                Number(id)
        );


    if (!item) {

        showToast(
            "Không tìm thấy nhóm hàng.",
            "error"
        );

        return;

    }


    openModal(
        item
    );

}


/* =========================================================
   SAVE
========================================================= */

async function saveItem(
    event
) {

    event.preventDefault();


    const categoryId =
        DOM.parentSelect.value;


    const name =
        DOM.name.value.trim();


    const slug =
        DOM.slug.value.trim();


    if (!categoryId) {

        showToast(
            "Vui lòng chọn danh mục gốc.",
            "error"
        );

        DOM.parentSelect.focus();

        return;

    }


    if (!name) {

        showToast(
            "Vui lòng nhập tên nhóm hàng.",
            "error"
        );

        DOM.name.focus();

        return;

    }


    if (!slug) {

        showToast(
            "Vui lòng nhập slug.",
            "error"
        );

        DOM.slug.focus();

        return;

    }


    const payload = {

        category_id:
            categoryId,

        name,

        slug,

        meta_title:
            DOM.metaTitle.value.trim() ||
            null,

        meta_description:
            DOM.metaDesc.value.trim() ||
            null

    };


    const id =
        DOM.id.value;


    const originalText =
        DOM.submit.innerHTML;


    DOM.submit.disabled =
        true;


    DOM.submit.innerHTML =
        "Đang lưu...";


    try {

        if (id) {

            const {
                error
            } =
                await window.supabaseClient

                    .from(
                        "sub_categories"
                    )

                    .update(
                        payload
                    )

                    .eq(
                        "id",
                        id
                    );


            if (error) {

                throw error;

            }


            showToast(
                "Cập nhật nhóm hàng thành công.",
                "success"
            );

        } else {

            const {
                error
            } =
                await window.supabaseClient

                    .from(
                        "sub_categories"
                    )

                    .insert([
                        payload
                    ]);


            if (error) {

                throw error;

            }


            state.currentPage =
                1;


            showToast(
                "Thêm nhóm hàng thành công.",
                "success"
            );

        }


        closeModal();

        await loadData();


    } catch (error) {

        console.error(
            "Lỗi lưu nhóm hàng:",
            error
        );


        showToast(
            `Không thể lưu nhóm hàng: ${error.message}`,
            "error"
        );


    } finally {

        DOM.submit.disabled =
            false;


        DOM.submit.innerHTML =
            originalText;

    }

}


/* =========================================================
   CHECK DEPENDENCIES
========================================================= */

async function checkDependencies(
    subCategoryId
) {

    /*
       Theo hệ thống Catalog hiện tại,
       Family có thể phụ thuộc vào Subcategory.

       Kiểm tra cả products trực tiếp để tránh
       xóa một node đang được sử dụng.
    */

    const [
        familyResult,
        productResult
    ] = await Promise.all([

        window.supabaseClient

            .from(
                "families"
            )

            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )

            .eq(
                "sub_category_id",
                subCategoryId
            ),

        window.supabaseClient

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
                "sub_category_id",
                subCategoryId
            )

    ]);


    /*
       Nếu project hiện tại không có
       column sub_category_id trong products,
       query này có thể lỗi.

       Khi đó chỉ dùng dependency của families.
    */

    if (
        familyResult.error
    ) {

        throw familyResult.error;

    }


    return {

        families:
            familyResult.count || 0,

        products:
            productResult.error
                ? 0
                : (
                    productResult.count ||
                    0
                )

    };

}


/* =========================================================
   DELETE
========================================================= */

async function deleteItem(
    id
) {

    const item =
        state.currentItems.find(
            current =>
                Number(
                    current.id
                ) ===
                Number(id)
        );


    if (!item) {

        showToast(
            "Không tìm thấy nhóm hàng.",
            "error"
        );

        return;

    }


    try {

        const dependencies =
            await checkDependencies(
                id
            );


        if (
            dependencies.families > 0 ||
            dependencies.products > 0
        ) {

            const dependencyText = [];


            if (
                dependencies.families > 0
            ) {

                dependencyText.push(
                    `${dependencies.families} dòng sản phẩm`
                );

            }


            if (
                dependencies.products > 0
            ) {

                dependencyText.push(
                    `${dependencies.products} sản phẩm`
                );

            }


            showToast(
                `Không thể xóa "${item.name}" vì đang có ${dependencyText.join(" và ")} phụ thuộc. Hãy xử lý dữ liệu con trước.`,
                "error"
            );


            return;

        }


        const confirmed =
            window.confirm(
                `Bạn có chắc muốn xóa nhóm hàng "${item.name}"?\n\nNhóm hàng này chưa có dữ liệu phụ thuộc.`
            );


        if (!confirmed) {

            return;

        }


        const {
            error
        } =
            await window.supabaseClient

                .from(
                    "sub_categories"
                )

                .delete()

                .eq(
                    "id",
                    id
                );


        if (error) {

            if (
                error.code ===
                "23503"
            ) {

                showToast(
                    "Không thể xóa vì nhóm hàng đang được dữ liệu khác sử dụng.",
                    "error"
                );

                return;

            }


            throw error;

        }


        /*
           Nếu xóa phần tử cuối
           của page hiện tại thì lùi page.
        */

        if (
            state.currentItems.length === 1 &&
            state.currentPage > 1
        ) {

            state.currentPage--;

        }


        showToast(
            "Đã xóa nhóm hàng.",
            "success"
        );


        await loadData();


    } catch (error) {

        console.error(
            "Lỗi xóa nhóm hàng:",
            error
        );


        showToast(
            `Không thể xóa nhóm hàng: ${error.message}`,
            "error"
        );

    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    if (!DOM.toast) {

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

    DOM.add?.addEventListener(
        "click",
        () => {

            openModal();

        }
    );


    /* -----------------------------------------
       CLOSE
    ------------------------------------------ */

    DOM.close?.addEventListener(
        "click",
        closeModal
    );


    DOM.cancel?.addEventListener(
        "click",
        closeModal
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

                closeModal();

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

                closeModal();

            }

        }
    );


    /* -----------------------------------------
       SEARCH

       debounce để không bắn request
       Supabase mỗi ký tự.
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


                        loadData();

                    },
                    300
                );

        }
    );


    /* -----------------------------------------
       PARENT FILTER
    ------------------------------------------ */

    DOM.parentFilter?.addEventListener(
        "change",
        event => {

            state.filterParentId =
                event.target.value;


            state.currentPage =
                1;


            loadData();

        }
    );


    /* -----------------------------------------
       FORM
    ------------------------------------------ */

    DOM.form?.addEventListener(
        "submit",
        saveItem
    );


    /* -----------------------------------------
       AUTO SLUG
    ------------------------------------------ */

    DOM.name?.addEventListener(
        "input",
        event => {

            /*
               Khi edit thì không tự ghi đè slug.
            */

            if (
                DOM.id.value
            ) {

                return;

            }


            DOM.slug.value =
                generateSlug(
                    event.target.value
                );

        }
    );


    /* -----------------------------------------
       SLUG
    ------------------------------------------ */

    DOM.slug?.addEventListener(
        "blur",
        () => {

            DOM.slug.value =
                generateSlug(
                    DOM.slug.value
                );

        }
    );


    /* -----------------------------------------
       TABLE ACTIONS
    ------------------------------------------ */

    DOM.tableBody?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (!button) {

                return;

            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            if (
                action === "edit"
            ) {

                editItem(id);

            }


            if (
                action === "delete"
            ) {

                deleteItem(id);

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


            if (pageButton) {

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


                    loadData();

                }


                return;

            }


            const actionButton =
                event.target.closest(
                    "button[data-page-action]"
                );


            if (!actionButton) {

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

                loadData();

            }


            if (
                actionButton.dataset.pageAction ===
                "next" &&
                state.currentPage <
                    totalPages
            ) {

                state.currentPage++;

                loadData();

            }

        }
    );

}


/* =========================================================
   BACKWARD COMPATIBILITY
========================================================= */

window.openModal =
    openModal;


window.closeModal =
    closeModal;


window.editItem =
    editItem;


window.deleteItem =
    deleteItem;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        bindEvents();

        await loadParents();

        await loadData();

    }
);