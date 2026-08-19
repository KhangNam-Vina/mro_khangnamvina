// ========================================================
// FILE: assets/js/admin/admin-brand.js
//
// QUẢN LÝ THƯƠNG HIỆU
//
// DATABASE:
//
// brands
// ├── id   serial PRIMARY KEY
// └── name varchar(100) UNIQUE NOT NULL
//
// KHÔNG THAY ĐỔI SCHEMA
// KHÔNG THÊM CỘT
// ========================================================


/* ========================================================
   STATE
======================================================== */

const state = {

    brands: [],

    filteredBrands: [],

    editingId: null,

    isLoading: false,

    isSaving: false

};


/* ========================================================
   DOM
======================================================== */

const DOM = {

    toastContainer:
        document.getElementById(
            "toastContainer"
        ),

    sidebar:
        document.getElementById(
            "adminSidebar"
        ),

    sidebarBackdrop:
        document.getElementById(
            "sidebarBackdrop"
        ),

    search:
        document.getElementById(
            "searchBrand"
        ),

    tableWrapper:
        document.getElementById(
            "tableWrapper"
        ),

    tableBody:
        document.getElementById(
            "brandTableBody"
        ),

    loadingState:
        document.getElementById(
            "loadingState"
        ),

    emptyState:
        document.getElementById(
            "emptyState"
        ),

    emptyMessage:
        document.getElementById(
            "emptyMessage"
        ),

    brandCount:
        document.getElementById(
            "brandCount"
        ),

    modal:
        document.getElementById(
            "brandModal"
        ),

    modalTitle:
        document.getElementById(
            "modalTitle"
        ),

    form:
        document.getElementById(
            "brandForm"
        ),

    brandId:
        document.getElementById(
            "brandId"
        ),

    brandName:
        document.getElementById(
            "brandName"
        ),

    btnSave:
        document.getElementById(
            "btnSaveBrand"
        )

};


/* ========================================================
   UTILS
======================================================== */

const utils = {


    escapeHTML(value) {

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


        const config = {

            success: {

                bg: "bg-green-600",

                icon: "✓"

            },

            warning: {

                bg: "bg-kn-orange",

                icon: "!"

            },

            error: {

                bg: "bg-red-600",

                icon: "×"

            }

        };


        const style =
            config[type] ||
            config.success;


        const toast =
            document.createElement(
                "div"
            );


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

            ${style.bg}

            opacity-0
            translate-y-2

            transition-all
            duration-300

        `;


        toast.innerHTML = `

            <span
                class="font-black text-base"
            >
                ${style.icon}
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
                    () => toast.remove(),
                    300
                );

            },
            3500
        );

    },


    setLoading(
        loading
    ) {

        state.isLoading =
            loading;


        DOM.loadingState
            ?.classList.toggle(
                "hidden",
                !loading
            );


        if (
            loading
        ) {

            DOM.tableWrapper
                ?.classList.add(
                    "hidden"
                );

            DOM.emptyState
                ?.classList.add(
                    "hidden"
                );

        }

    },


    setSaveLoading(
        loading
    ) {

        if (
            !DOM.btnSave
        ) {

            return;

        }


        DOM.btnSave.disabled =
            loading;


        DOM.btnSave.classList.toggle(
            "opacity-70",
            loading
        );


        DOM.btnSave.classList.toggle(
            "cursor-not-allowed",
            loading
        );


        DOM.btnSave.textContent =
            loading
                ? "Đang lưu..."
                : "Lưu thương hiệu";

    }

};


/* ========================================================
   MOBILE SIDEBAR
======================================================== */

window.toggleSidebar =
    function () {

        if (
            !DOM.sidebar ||
            !DOM.sidebarBackdrop
        ) {

            return;

        }


        const closed =
            DOM.sidebar.classList.contains(
                "-translate-x-full"
            );


        DOM.sidebar.classList.toggle(
            "-translate-x-full",
            !closed
        );


        DOM.sidebarBackdrop.classList.toggle(
            "hidden",
            !closed
        );

    };


/* ========================================================
   LOAD BRANDS
======================================================== */

async function loadBrands() {

    utils.setLoading(
        true
    );


    try {

        if (
            !window.supabaseClient
        ) {

            throw new Error(
                "Supabase Client chưa được khởi tạo."
            );

        }


        const {
            data,
            error
        } =
            await window.supabaseClient

                .from(
                    "brands"
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


        if (
            error
        ) {

            throw error;

        }


        state.brands =
            data || [];


        applySearch();


    } catch (
        error
    ) {

        console.error(
            "Lỗi tải brands:",
            error
        );


        utils.showToast(
            `Không thể tải thương hiệu: ${error.message}`,
            "error"
        );


        state.brands =
            [];

        state.filteredBrands =
            [];


        renderTable();

    } finally {

        utils.setLoading(
            false
        );

    }

}


/* ========================================================
   SEARCH
======================================================== */

function applySearch() {

    const keyword =
        DOM.search?.value
            .trim()
            .toLowerCase() ||
        "";


    if (
        !keyword
    ) {

        state.filteredBrands =
            [...state.brands];

    } else {

        state.filteredBrands =
            state.brands.filter(
                brand =>
                    brand.name
                        .toLowerCase()
                        .includes(
                            keyword
                        )
            );

    }


    renderTable();

}


/* ========================================================
   RENDER
======================================================== */

function renderTable() {

    if (
        !DOM.tableBody
    ) {

        return;

    }


    DOM.tableBody.innerHTML =
        "";


    const total =
        state.brands.length;


    if (
        DOM.brandCount
    ) {

        DOM.brandCount.textContent =
            `${total} thương hiệu`;

    }


    if (
        state.filteredBrands.length === 0
    ) {

        DOM.tableWrapper
            ?.classList.add(
                "hidden"
            );


        DOM.emptyState
            ?.classList.remove(
                "hidden"
            );


        if (
            DOM.emptyMessage
        ) {

            DOM.emptyMessage.textContent =
                total === 0

                    ? "Hãy thêm thương hiệu đầu tiên."

                    : "Không tìm thấy thương hiệu phù hợp.";

        }


        return;

    }


    DOM.emptyState
        ?.classList.add(
            "hidden"
        );


    DOM.tableWrapper
        ?.classList.remove(
            "hidden"
        );


    const fragment =
        document.createDocumentFragment();


    state.filteredBrands.forEach(
        brand => {

            const row =
                document.createElement(
                    "tr"
                );


            row.className =
                "hover:bg-gray-50 transition";


            row.innerHTML = `

                <td
                    class="
                        px-5
                        py-4
                        text-sm
                        font-mono
                        text-gray-400
                    "
                >
                    #${brand.id}
                </td>


                <td
                    class="
                        px-5
                        py-4
                    "
                >

                    <div
                        class="
                            flex
                            items-center
                            gap-3
                        "
                    >

                        <div
                            class="
                                w-9
                                h-9
                                rounded-xl
                                bg-blue-50
                                text-kn-blue
                                flex
                                items-center
                                justify-center
                                font-black
                                text-sm
                                shrink-0
                            "
                        >
                            ${utils.escapeHTML(
                                brand.name
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>


                        <span
                            class="
                                font-bold
                                text-gray-800
                            "
                        >
                            ${utils.escapeHTML(
                                brand.name
                            )}
                        </span>

                    </div>

                </td>


                <td
                    class="
                        px-5
                        py-4
                    "
                >

                    <div
                        class="
                            flex
                            justify-end
                            items-center
                            gap-2
                        "
                    >

                        <button
                            type="button"
                            onclick="editBrand(${brand.id})"
                            class="
                                px-3
                                py-2
                                rounded-lg
                                text-xs
                                font-bold
                                text-kn-blue
                                hover:bg-blue-50
                                transition
                            "
                        >
                            Sửa
                        </button>


                        <button
                            type="button"
                            onclick="deleteBrand(${brand.id})"
                            class="
                                px-3
                                py-2
                                rounded-lg
                                text-xs
                                font-bold
                                text-red-600
                                hover:bg-red-50
                                transition
                            "
                        >
                            Xóa
                        </button>

                    </div>

                </td>

            `;


            fragment.appendChild(
                row
            );

        }
    );


    DOM.tableBody.appendChild(
        fragment
    );

}


/* ========================================================
   OPEN ADD MODAL
======================================================== */

window.openBrandModal =
    function () {

        state.editingId =
            null;


        if (
            DOM.modalTitle
        ) {

            DOM.modalTitle.textContent =
                "Thêm thương hiệu";

        }


        if (
            DOM.brandId
        ) {

            DOM.brandId.value =
                "";

        }


        if (
            DOM.brandName
        ) {

            DOM.brandName.value =
                "";

        }


        DOM.modal
            ?.classList.remove(
                "hidden"
            );


        DOM.modal
            ?.classList.add(
                "flex"
            );


        setTimeout(
            () => {

                DOM.brandName?.focus();

            },
            100
        );

    };


/* ========================================================
   CLOSE MODAL
======================================================== */

window.closeBrandModal =
    function () {

        DOM.modal
            ?.classList.add(
                "hidden"
            );


        DOM.modal
            ?.classList.remove(
                "flex"
            );


        state.editingId =
            null;


        if (
            DOM.form
        ) {

            DOM.form.reset();

        }

    };


/* ========================================================
   EDIT BRAND
======================================================== */

window.editBrand =
    function (
        id
    ) {

        const brand =
            state.brands.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (
            !brand
        ) {

            utils.showToast(
                "Không tìm thấy thương hiệu.",
                "error"
            );

            return;

        }


        state.editingId =
            brand.id;


        if (
            DOM.modalTitle
        ) {

            DOM.modalTitle.textContent =
                "Chỉnh sửa thương hiệu";

        }


        if (
            DOM.brandId
        ) {

            DOM.brandId.value =
                brand.id;

        }


        if (
            DOM.brandName
        ) {

            DOM.brandName.value =
                brand.name;

        }


        DOM.modal
            ?.classList.remove(
                "hidden"
            );


        DOM.modal
            ?.classList.add(
                "flex"
            );


        setTimeout(
            () => {

                DOM.brandName?.focus();

                DOM.brandName?.select();

            },
            100
        );

    };


/* ========================================================
   SAVE BRAND
======================================================== */

async function saveBrand() {

    if (
        state.isSaving
    ) {

        return;

    }


    const name =
        DOM.brandName?.value
            .trim() ||
        "";


    if (
        !name
    ) {

        utils.showToast(
            "Vui lòng nhập tên thương hiệu.",
            "warning"
        );

        DOM.brandName?.focus();

        return;

    }


    if (
        name.length > 100
    ) {

        utils.showToast(
            "Tên thương hiệu không được vượt quá 100 ký tự.",
            "warning"
        );

        return;

    }


    state.isSaving =
        true;


    utils.setSaveLoading(
        true
    );


    try {

        if (
            !window.supabaseClient
        ) {

            throw new Error(
                "Supabase Client chưa được khởi tạo."
            );

        }


        /* ================================================
           UPDATE
        ================================================= */

        if (
            state.editingId
        ) {

            const {
                error
            } =
                await window.supabaseClient

                    .from(
                        "brands"
                    )

                    .update({
                        name: name
                    })

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
                "Cập nhật thương hiệu thành công!",
                "success"
            );

        }


        /* ================================================
           INSERT
        ================================================= */

        else {

            const {
                error
            } =
                await window.supabaseClient

                    .from(
                        "brands"
                    )

                    .insert({
                        name: name
                    });


            if (
                error
            ) {

                throw error;

            }


            utils.showToast(
                "Thêm thương hiệu thành công!",
                "success"
            );

        }


        closeBrandModal();

        await loadBrands();


    } catch (
        error
    ) {

        console.error(
            "Lỗi lưu brand:",
            error
        );


        if (
            error.code ===
            "23505"
        ) {

            utils.showToast(
                "Tên thương hiệu đã tồn tại.",
                "warning"
            );

        } else {

            utils.showToast(
                `Không thể lưu thương hiệu: ${error.message}`,
                "error"
            );

        }

    } finally {

        state.isSaving =
            false;


        utils.setSaveLoading(
            false
        );

    }

}


/* ========================================================
   DELETE BRAND
======================================================== */

window.deleteBrand =
    async function (
        id
    ) {

        const brand =
            state.brands.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (
            !brand
        ) {

            utils.showToast(
                "Không tìm thấy thương hiệu.",
                "error"
            );

            return;

        }


        const confirmed =
            window.confirm(
                `Bạn có chắc muốn xóa thương hiệu "${brand.name}" không?`
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
                        "brands"
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


            utils.showToast(
                "Đã xóa thương hiệu.",
                "success"
            );


            await loadBrands();


        } catch (
            error
        ) {

            console.error(
                "Lỗi xóa brand:",
                error
            );


            if (
                error.code ===
                "23503"
            ) {

                utils.showToast(
                    "Không thể xóa thương hiệu vì đang được sản phẩm sử dụng.",
                    "warning"
                );

            } else {

                utils.showToast(
                    `Không thể xóa thương hiệu: ${error.message}`,
                    "error"
                );

            }

        }

    };


/* ========================================================
   FORM SUBMIT
======================================================== */

DOM.form?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        saveBrand();

    }
);


/* ========================================================
   SEARCH EVENT
======================================================== */

DOM.search?.addEventListener(
    "input",
    () => {

        applySearch();

    }
);


/* ========================================================
   ESC CLOSE MODAL
======================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            !DOM.modal?.classList.contains(
                "hidden"
            )
        ) {

            closeBrandModal();

        }

    }
);


/* ========================================================
   INIT
======================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await loadBrands();

        } catch (
            error
        ) {

            console.error(
                "Lỗi khởi tạo Brand:",
                error
            );

        }

    }
);