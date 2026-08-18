/* =========================================================
   ADMIN CATEGORIES
   QUẢN LÝ DANH MỤC

   - Load
   - Search
   - Filter
   - Create
   - Update
   - Toggle Active
   - Delete protection
   - Auto slug
   - Toast
========================================================= */


let allCategories = [];


/* =========================================================
   DOM
========================================================= */

const DOM = {
    tableBody: document.getElementById("categoryTableBody"),

    searchInput:
        document.getElementById("searchCategoryInput"),

    filterStatus:
        document.getElementById("filterStatusSelect"),

    modal:
        document.getElementById("categoryModal"),

    modalTitle:
        document.getElementById("modalTitle"),

    form:
        document.getElementById("categoryForm"),

    id:
        document.getElementById("categoryId"),

    name:
        document.getElementById("categoryName"),

    slug:
        document.getElementById("categorySlug"),

    icon:
        document.getElementById("categoryIcon"),

    description:
        document.getElementById("categoryDescription"),

    metaTitle:
        document.getElementById("categoryMetaTitle"),

    metaDescription:
        document.getElementById("categoryMetaDescription"),

    isActive:
        document.getElementById("categoryIsActive"),

    submit:
        document.getElementById("btnSubmitForm"),

    add:
        document.getElementById("btnAddCategory"),

    close:
        document.getElementById("btnCloseModal"),

    cancel:
        document.getElementById("btnCancelModal"),

    total:
        document.getElementById("categoryTotal"),

    active:
        document.getElementById("categoryActive"),

    hidden:
        document.getElementById("categoryHidden"),

    resultInfo:
        document.getElementById("categoryResultInfo"),

    toast:
        document.getElementById("toastContainer")
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
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(value) {

    return escapeHTML(value)
        .replace(/`/g, "&#96;");
}


/* =========================================================
   SLUG
========================================================= */

function generateSlug(text) {

    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}


/* =========================================================
   LOAD CATEGORIES
========================================================= */

async function loadCategories() {

    if (!DOM.tableBody) {
        return;
    }

    DOM.tableBody.innerHTML = `
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
                        mb-2
                    "
                ></div>

                <div>
                    Đang tải danh mục...
                </div>
            </td>
        </tr>
    `;


    try {

        const {
            data,
            error
        } = await window.supabaseClient
            .from("categories")
            .select("*")
            .order("id", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        allCategories =
            Array.isArray(data)
                ? data
                : [];


        updateStatistics();

        applyFilters();


    } catch (error) {

        console.error(
            "Lỗi tải danh mục:",
            error
        );


        DOM.tableBody.innerHTML = `
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
                    Không thể tải danh mục.

                    <div
                        class="
                            text-xs
                            font-normal
                            text-red-400
                            mt-1
                        "
                    >
                        ${escapeHTML(error.message)}
                    </div>
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    const total =
        allCategories.length;


    const active =
        allCategories.filter(
            category =>
                category.is_active !== false
        ).length;


    const hidden =
        total - active;


    if (DOM.total) {

        DOM.total.textContent =
            total;

    }


    if (DOM.active) {

        DOM.active.textContent =
            active;

    }


    if (DOM.hidden) {

        DOM.hidden.textContent =
            hidden;

    }

}


/* =========================================================
   FILTER
========================================================= */

function applyFilters() {

    const keyword =
        DOM.searchInput
            ?.value
            ?.trim()
            ?.toLowerCase() || "";


    const status =
        DOM.filterStatus?.value || "all";


    const filtered =
        allCategories.filter(
            category => {

                const name =
                    String(
                        category.name || ""
                    ).toLowerCase();


                const slug =
                    String(
                        category.slug || ""
                    ).toLowerCase();


                const matchesKeyword =
                    !keyword ||
                    name.includes(keyword) ||
                    slug.includes(keyword);


                const isActive =
                    category.is_active !== false;


                const matchesStatus =
                    status === "all" ||
                    (
                        status === "active" &&
                        isActive
                    ) ||
                    (
                        status === "hidden" &&
                        !isActive
                    );


                return (
                    matchesKeyword &&
                    matchesStatus
                );

            }
        );


    renderCategoryTable(
        filtered
    );

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderCategoryTable(
    categories
) {

    if (!DOM.tableBody) {
        return;
    }


    if (!categories.length) {

        DOM.tableBody.innerHTML = `
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
                        Không tìm thấy danh mục
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


        updateResultInfo(
            0
        );


        return;
    }


    let html = "";


    categories.forEach(
        category => {

            const isActive =
                category.is_active !== false;


            const icon =
                renderIcon(
                    category.icon_url,
                    category.name
                );


            const status =
                isActive

                    ? `
                        <span
                            class="
                                inline-flex
                                items-center
                                gap-1.5
                                px-2.5
                                py-1
                                rounded-full
                                text-[11px]
                                font-bold
                                bg-green-50
                                text-green-700
                                border
                                border-green-100
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

                            Đang hiển thị
                        </span>
                    `

                    : `
                        <span
                            class="
                                inline-flex
                                items-center
                                gap-1.5
                                px-2.5
                                py-1
                                rounded-full
                                text-[11px]
                                font-bold
                                bg-gray-100
                                text-gray-500
                                border
                                border-gray-200
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

                            Đang ẩn
                        </span>
                    `;


            const toggleLabel =
                isActive
                    ? "Ẩn"
                    : "Hiện";


            const toggleIcon =
                isActive

                    ? `
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
                                d="M3 3l18 18M10.58 10.58A2 2 0 0013.4 13.4M9.88 5.09A9.94 9.94 0 0112 4c5 0 9.27 3.11 11 8a17.8 17.8 0 01-2.02 3.68M6.61 6.61C4.8 8.02 3.36 9.9 2.5 12c1.73 4.89 6 8 9.5 8 1.15 0 2.27-.2 3.3-.57"
                            />
                        </svg>
                    `

                    : `
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
                                d="M2.46 12C3.73 7.94 7.5 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.04 7-9.54 7s-8.27-2.94-9.54-7z"
                            />
                            <circle
                                cx="12"
                                cy="12"
                                r="3"
                            />
                        </svg>
                    `;


            html += `

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
                        #${category.id}
                    </td>


                    <!-- ICON -->

                    <td
                        class="
                            px-4
                            py-4
                            text-center
                        "
                    >
                        ${icon}
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
                            ${escapeHTML(category.name)}
                        </div>

                        ${
                            category.description
                                ? `
                                    <div
                                        class="
                                            text-xs
                                            text-gray-400
                                            mt-1
                                            max-w-md
                                            truncate
                                        "
                                    >
                                        ${escapeHTML(
                                            category.description
                                        )}
                                    </div>
                                `
                                : ""
                        }

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
                                category.slug || "--"
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

                            <!-- TOGGLE -->

                            <button
                                type="button"
                                data-action="toggle"
                                data-id="${category.id}"
                                class="
                                    p-2
                                    rounded-lg
                                    text-gray-500
                                    hover:text-kn-blue
                                    hover:bg-blue-50
                                    transition
                                "
                                title="${toggleLabel} danh mục"
                            >
                                ${toggleIcon}
                            </button>


                            <!-- EDIT -->

                            <button
                                type="button"
                                data-action="edit"
                                data-id="${category.id}"
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
                                data-id="${category.id}"
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
    );


    DOM.tableBody.innerHTML =
        html;


    updateResultInfo(
        categories.length
    );

}


/* =========================================================
   ICON
========================================================= */

function renderIcon(
    iconUrl,
    name
) {

    if (!iconUrl) {

        return `
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
                    text-gray-400
                "
            >

                <span class="text-sm font-black">
                    ${escapeHTML(
                        String(name || "?")
                            .trim()
                            .charAt(0)
                            .toUpperCase()
                    )}
                </span>

            </div>
        `;

    }


    if (
        typeof iconUrl === "string" &&
        /^https?:\/\//i.test(
            iconUrl
        )
    ) {

        return `
            <div
                class="
                    w-10
                    h-10
                    mx-auto
                    rounded-lg
                    bg-gray-50
                    border
                    border-gray-200
                    flex
                    items-center
                    justify-center
                    overflow-hidden
                "
            >

                <img
                    src="${escapeAttribute(iconUrl)}"
                    alt="${escapeAttribute(name || "Icon")}"
                    class="
                        w-8
                        h-8
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
                        text-gray-400
                        text-xs
                        font-bold
                    "
                >
                    IMG
                </span>

            </div>
        `;

    }


    return `
        <div
            class="
                w-10
                h-10
                mx-auto
                rounded-lg
                bg-blue-50
                border
                border-blue-100
                flex
                items-center
                justify-center
                text-lg
            "
        >
            ${escapeHTML(iconUrl)}
        </div>
    `;

}


/* =========================================================
   RESULT INFO
========================================================= */

function updateResultInfo(
    count
) {

    if (!DOM.resultInfo) {
        return;
    }


    DOM.resultInfo.textContent =
        `${count} danh mục được hiển thị`;

}


/* =========================================================
   OPEN MODAL
========================================================= */

function openCategoryModal(
    category = null
) {

    if (!DOM.modal) {
        return;
    }


    if (category) {

        DOM.modalTitle.textContent =
            "Chỉnh sửa danh mục";


        DOM.id.value =
            category.id;


        DOM.name.value =
            category.name || "";


        DOM.slug.value =
            category.slug || "";


        DOM.icon.value =
            category.icon_url || "";


        DOM.description.value =
            category.description || "";


        DOM.metaTitle.value =
            category.meta_title || "";


        DOM.metaDescription.value =
            category.meta_description || "";


        DOM.isActive.checked =
            category.is_active !== false;

    } else {

        DOM.modalTitle.textContent =
            "Thêm danh mục";


        DOM.form.reset();


        DOM.id.value =
            "";


        DOM.isActive.checked =
            true;

    }


    DOM.modal.classList.remove(
        "hidden"
    );

    DOM.modal.classList.add(
        "flex"
    );


    setTimeout(() => {

        DOM.name?.focus();

    }, 50);

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeCategoryModal() {

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

function editCategory(
    id
) {

    const category =
        allCategories.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!category) {

        showToast(
            "Không tìm thấy danh mục.",
            "error"
        );

        return;
    }


    openCategoryModal(
        category
    );

}


/* =========================================================
   SAVE
========================================================= */

async function saveCategory(
    event
) {

    event.preventDefault();


    const name =
        DOM.name.value.trim();


    const slug =
        DOM.slug.value.trim();


    if (!name) {

        showToast(
            "Vui lòng nhập tên danh mục.",
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


    const id =
        DOM.id.value.trim();


    const payload = {

        name,

        slug,

        icon_url:
            DOM.icon.value.trim() ||
            null,

        description:
            DOM.description.value.trim() ||
            null,

        meta_title:
            DOM.metaTitle.value.trim() ||
            null,

        meta_description:
            DOM.metaDescription.value.trim() ||
            null,

        is_active:
            DOM.isActive.checked

    };


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
                    .from("categories")
                    .update(payload)
                    .eq("id", id);


            if (error) {
                throw error;
            }


            showToast(
                "Cập nhật danh mục thành công.",
                "success"
            );

        } else {

            const {
                error
            } =
                await window.supabaseClient
                    .from("categories")
                    .insert([
                        payload
                    ]);


            if (error) {
                throw error;
            }


            showToast(
                "Thêm danh mục thành công.",
                "success"
            );

        }


        closeCategoryModal();

        await loadCategories();


    } catch (error) {

        console.error(
            "Lỗi lưu danh mục:",
            error
        );


        showToast(
            `Không thể lưu danh mục: ${error.message}`,
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
   TOGGLE ACTIVE
========================================================= */

async function toggleCategory(
    id
) {

    const category =
        allCategories.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!category) {
        return;
    }


    const newStatus =
        category.is_active === false;


    try {

        const {
            error
        } =
            await window.supabaseClient
                .from("categories")
                .update({
                    is_active:
                        newStatus
                })
                .eq("id", id);


        if (error) {
            throw error;
        }


        showToast(
            newStatus
                ? "Đã hiển thị danh mục."
                : "Đã ẩn danh mục.",
            "success"
        );


        await loadCategories();


    } catch (error) {

        console.error(
            "Lỗi đổi trạng thái:",
            error
        );


        showToast(
            `Không thể cập nhật trạng thái: ${error.message}`,
            "error"
        );

    }

}


/* =========================================================
   CHECK DEPENDENCIES
========================================================= */

async function checkCategoryDependencies(
    categoryId
) {

    const [
        subCategoryResult,
        productResult
    ] = await Promise.all([

        window.supabaseClient
            .from("sub_categories")
            .select("id", {
                count: "exact",
                head: true
            })
            .eq(
                "category_id",
                categoryId
            ),

        window.supabaseClient
            .from("products")
            .select("id", {
                count: "exact",
                head: true
            })
            .eq(
                "category_id",
                categoryId
            )

    ]);


    if (
        subCategoryResult.error
    ) {
        throw subCategoryResult.error;
    }


    if (
        productResult.error
    ) {
        throw productResult.error;
    }


    return {

        subCategories:
            subCategoryResult.count || 0,

        products:
            productResult.count || 0

    };

}


/* =========================================================
   DELETE
========================================================= */

async function deleteCategory(
    id
) {

    const category =
        allCategories.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!category) {
        return;
    }


    try {

        const dependencies =
            await checkCategoryDependencies(
                id
            );


        if (
            dependencies.subCategories > 0 ||
            dependencies.products > 0
        ) {

            const messages = [];


            if (
                dependencies.subCategories > 0
            ) {

                messages.push(
                    `${dependencies.subCategories} nhóm hàng`
                );

            }


            if (
                dependencies.products > 0
            ) {

                messages.push(
                    `${dependencies.products} sản phẩm`
                );

            }


            showToast(
                `Không thể xóa "${category.name}" vì đang có ${messages.join(" và ")} liên kết. Hãy ẩn danh mục thay vì xóa.`,
                "error"
            );


            return;

        }


        const confirmed =
            window.confirm(
                `Bạn có chắc muốn xóa danh mục "${category.name}"?\n\nDanh mục này chưa có dữ liệu liên kết và có thể xóa an toàn.`
            );


        if (!confirmed) {
            return;
        }


        const {
            error
        } =
            await window.supabaseClient
                .from("categories")
                .delete()
                .eq("id", id);


        if (error) {

            if (
                error.code === "23503"
            ) {

                showToast(
                    "Không thể xóa vì danh mục đang được dữ liệu khác sử dụng. Hãy ẩn danh mục thay vì xóa.",
                    "error"
                );

                return;

            }


            throw error;

        }


        showToast(
            "Đã xóa danh mục thành công.",
            "success"
        );


        await loadCategories();


    } catch (error) {

        console.error(
            "Lỗi xóa danh mục:",
            error
        );


        showToast(
            `Không thể xóa danh mục: ${error.message}`,
            "error"
        );

    }

}


/* =========================================================
   EVENT DELEGATION - TABLE
========================================================= */

function bindTableActions() {

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


            if (!id) {
                return;
            }


            if (
                action === "edit"
            ) {

                editCategory(
                    id
                );

            }


            if (
                action === "toggle"
            ) {

                toggleCategory(
                    id
                );

            }


            if (
                action === "delete"
            ) {

                deleteCategory(
                    id
                );

            }

        }
    );

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
        ${success
            ? "bg-gray-900"
            : "bg-red-600"
        }
        opacity-0
        translate-y-2
        transition-all
        duration-300
    `;


    toast.innerHTML = success

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

            <span>
                ${escapeHTML(message)}
            </span>
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

            openCategoryModal();

        }
    );


    /* -----------------------------------------
       CLOSE
    ------------------------------------------ */

    DOM.close?.addEventListener(
        "click",
        closeCategoryModal
    );


    DOM.cancel?.addEventListener(
        "click",
        closeCategoryModal
    );


    /* -----------------------------------------
       CLICK BACKDROP
    ------------------------------------------ */

    DOM.modal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                DOM.modal
            ) {

                closeCategoryModal();

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

                closeCategoryModal();

            }

        }
    );


    /* -----------------------------------------
       SEARCH
    ------------------------------------------ */

    DOM.searchInput?.addEventListener(
        "input",
        applyFilters
    );


    /* -----------------------------------------
       FILTER
    ------------------------------------------ */

    DOM.filterStatus?.addEventListener(
        "change",
        applyFilters
    );


    /* -----------------------------------------
       FORM
    ------------------------------------------ */

    DOM.form?.addEventListener(
        "submit",
        saveCategory
    );


    /* -----------------------------------------
       AUTO SLUG
    ------------------------------------------ */

    DOM.name?.addEventListener(
        "input",
        event => {

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
       SLUG NORMALIZE
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
       TABLE
    ------------------------------------------ */

    bindTableActions();

}


/* =========================================================
   BACKWARD COMPATIBILITY
   Nếu chỗ khác trong hệ thống còn gọi các hàm cũ
========================================================= */

window.openModal =
    openCategoryModal;


window.closeModal =
    closeCategoryModal;


window.editCategory =
    editCategory;


window.deleteCategory =
    deleteCategory;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        bindEvents();

        await loadCategories();

    }
);