// ========================================================
// FILE: assets/js/admin/admin-users.js
//
// QUẢN LÝ NGƯỜI DÙNG
//
// 2 CẤP DUY NHẤT:
// 1. Người dùng  -> profiles
// 2. Admin       -> admins
//
// DATABASE CONTRACT GIỮ NGUYÊN
//
// profiles:
// - id
// - email
// - full_name
// - phone
// - company
// - company_name
// - created_at
//
// admins:
// - id
// - email
// - role
// - created_at
//
// QUAN TRỌNG:
// - admins.id = profiles.id
// - Không tạo ID mới.
// - Không đổi schema.
// - Không xóa Auth.
// - Không migration.
// ========================================================


/* ========================================================
   STATE
======================================================== */

const state = {

    currentTab: "user",

    users: [],

    currentPage: 1,

    itemsPerPage: 10,

    totalItems: 0,

    searchQuery: "",

    totalUsers: 0,

    totalAdmins: 0

};


/* ========================================================
   DOM
======================================================== */

const DOM = {

    thead:
        document.getElementById(
            "tableHeader"
        ),

    tbody:
        document.getElementById(
            "userTableBody"
        ),

    pagination:
        document.getElementById(
            "paginationContainer"
        ),

    searchInput:
        document.getElementById(
            "searchInput"
        ),

    btnTabUser:
        document.getElementById(
            "btnTabUser"
        ),

    btnTabAdmin:
        document.getElementById(
            "btnTabAdmin"
        ),

    btnAddAdmin:
        document.getElementById(
            "btnAddAdmin"
        ),

    modal:
        document.getElementById(
            "userModal"
        ),

    modalTitle:
        document.getElementById(
            "modalTitle"
        ),

    form:
        document.getElementById(
            "userForm"
        ),

    inUserId:
        document.getElementById(
            "inUserId"
        ),

    inUserEmail:
        document.getElementById(
            "inUserEmail"
        ),

    btnSave:
        document.getElementById(
            "btnSaveUser"
        ),

    btnCloseModal:
        document.getElementById(
            "btnCloseModal"
        ),

    btnCancelModal:
        document.getElementById(
            "btnCancelModal"
        ),

    toastContainer:
        document.getElementById(
            "toastContainer"
        ),

    pageTitle:
        document.getElementById(
            "pageTitle"
        ),

    pageDescription:
        document.getElementById(
            "pageDescription"
        ),

    userTotal:
        document.getElementById(
            "userTotal"
        ),

    adminTotal:
        document.getElementById(
            "adminTotal"
        ),

    currentListCount:
        document.getElementById(
            "currentListCount"
        ),

    currentPageStat:
        document.getElementById(
            "currentPageStat"
        ),

    userTabCount:
        document.getElementById(
            "userTabCount"
        ),

    adminTabCount:
        document.getElementById(
            "adminTabCount"
        )

};


/* ========================================================
   UTILS
======================================================== */

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


    setButtonLoading(
        button,
        loading,
        normalText
    ) {

        if (
            !button
        ) {

            return;

        }


        button.disabled =
            loading;


        if (
            loading
        ) {

            button.innerHTML = `

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

                Đang xử lý...

            `;

        } else {

            button.textContent =
                normalText;

        }

    },


    getInitial(
        value
    ) {

        const text =
            String(
                value || "?"
            ).trim();


        if (
            !text
        ) {

            return "?";

        }


        return text
            .charAt(0)
            .toUpperCase();

    }

};


/* ========================================================
   INIT
======================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (
            typeof window.checkAdminAuth ===
            "function"
        ) {

            const user =
                await window.checkAdminAuth();


            if (
                !user
            ) {

                return;

            }

        }


        bindEvents();

        await loadStatistics();

        switchTab(
            "user"
        );

    }
);


/* ========================================================
   EVENTS
======================================================== */

function bindEvents() {


    DOM.btnTabUser?.addEventListener(
        "click",
        () => {

            switchTab(
                "user"
            );

        }
    );


    DOM.btnTabAdmin?.addEventListener(
        "click",
        () => {

            switchTab(
                "admin"
            );

        }
    );


    DOM.btnAddAdmin?.addEventListener(
        "click",
        () => {

            openAdminModal();

        }
    );


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


                        fetchData();

                    },
                    250
                );

        }
    );


    DOM.form?.addEventListener(
        "submit",
        saveAdmin
    );


    DOM.btnCloseModal?.addEventListener(
        "click",
        closeAdminModal
    );


    DOM.btnCancelModal?.addEventListener(
        "click",
        closeAdminModal
    );


    DOM.modal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                DOM.modal
            ) {

                closeAdminModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape" &&
                DOM.modal &&
                !DOM.modal.classList.contains(
                    "hidden"
                )
            ) {

                closeAdminModal();

            }

        }
    );


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


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            if (
                action === "edit-admin"
            ) {

                openAdminModal(
                    id
                );

            }


            if (
                action === "delete-admin"
            ) {

                deleteAdmin(
                    id
                );

            }


            if (
                action === "delete-user"
            ) {

                deleteCustomer(
                    id
                );

            }

        }
    );


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


                    fetchData();

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

                fetchData();

            }


            if (
                actionButton.dataset.pageAction ===
                    "next" &&
                state.currentPage <
                    totalPages
            ) {

                state.currentPage++;

                fetchData();

            }

        }
    );

}


/* ========================================================
   TAB
======================================================== */

function switchTab(
    tab
) {

    if (
        tab !== "user" &&
        tab !== "admin"
    ) {

        tab =
            "user";

    }


    state.currentTab =
        tab;


    state.currentPage =
        1;


    state.searchQuery =
        "";


    if (
        DOM.searchInput
    ) {

        DOM.searchInput.value =
            "";

    }


    updateTabUI();

    fetchData();

}


/* ========================================================
   TAB UI
======================================================== */

function updateTabUI() {

    const userActive =
        state.currentTab ===
        "user";


    const adminActive =
        state.currentTab ===
        "admin";


    if (
        DOM.btnTabUser
    ) {

        DOM.btnTabUser.className =
            userActive

                ? `
                    relative
                    pb-3
                    px-1
                    text-sm
                    font-black
                    text-kn-blue
                `

                : `
                    relative
                    pb-3
                    px-1
                    text-sm
                    font-bold
                    text-gray-500
                    hover:text-gray-800
                `;

    }


    if (
        DOM.btnTabAdmin
    ) {

        DOM.btnTabAdmin.className =
            adminActive

                ? `
                    relative
                    pb-3
                    px-1
                    text-sm
                    font-black
                    text-kn-orange
                `

                : `
                    relative
                    pb-3
                    px-1
                    text-sm
                    font-bold
                    text-gray-500
                    hover:text-gray-800
                `;

    }


    if (
        DOM.btnAddAdmin
    ) {

        if (
            adminActive
        ) {

            DOM.btnAddAdmin.classList.remove(
                "hidden"
            );

        } else {

            DOM.btnAddAdmin.classList.add(
                "hidden"
            );

        }

    }


    if (
        DOM.pageTitle
    ) {

        DOM.pageTitle.textContent =
            userActive
                ? "Quản lý Người dùng"
                : "Quản lý Admin";

    }


    if (
        DOM.pageDescription
    ) {

        DOM.pageDescription.textContent =
            userActive

                ? "Quản lý tài khoản khách hàng và hồ sơ người dùng"

                : "Quản lý tài khoản có quyền quản trị hệ thống";

    }


    renderTableHeader();

}


/* ========================================================
   TABLE HEADER
======================================================== */

function renderTableHeader() {

    if (
        !DOM.thead
    ) {

        return;

    }


    if (
        state.currentTab ===
        "user"
    ) {

        DOM.thead.innerHTML = `

            <th class="px-4 py-3.5 w-14 text-center">
                #
            </th>

            <th class="px-4 py-3.5 w-16 text-center">
                Avatar
            </th>

            <th class="px-4 py-3.5 min-w-[280px]">
                Người dùng
            </th>

            <th class="px-4 py-3.5 min-w-[220px]">
                Liên hệ
            </th>

            <th class="px-4 py-3.5 w-40">
                Công ty
            </th>

            <th class="px-4 py-3.5 w-36">
                Ngày đăng ký
            </th>

            <th class="px-4 py-3.5 w-24 text-right">
                Thao tác
            </th>

        `;

    } else {

        DOM.thead.innerHTML = `

            <th class="px-4 py-3.5 w-14 text-center">
                #
            </th>

            <th class="px-4 py-3.5 w-16 text-center">
                Avatar
            </th>

            <th class="px-4 py-3.5 min-w-[350px]">
                Tài khoản Admin
            </th>

            <th class="px-4 py-3.5 w-36">
                Quyền
            </th>

            <th class="px-4 py-3.5 w-40">
                Ngày cấp
            </th>

            <th class="px-4 py-3.5 w-28 text-right">
                Thao tác
            </th>

        `;

    }

}


/* ========================================================
   STATISTICS
======================================================== */

async function loadStatistics() {

    try {

        const [
            usersResult,
            adminsResult
        ] =
            await Promise.all([

                window.supabaseClient
                    .from("profiles")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    ),

                window.supabaseClient
                    .from("admins")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    )

            ]);


        if (
            usersResult.error
        ) {

            throw usersResult.error;

        }


        if (
            adminsResult.error
        ) {

            throw adminsResult.error;

        }


        state.totalUsers =
            usersResult.count ||
            0;


        state.totalAdmins =
            adminsResult.count ||
            0;


        updateStatisticsUI();

    } catch (
        error
    ) {

        console.error(
            "Lỗi tải thống kê người dùng:",
            error
        );

    }

}


/* ========================================================
   UPDATE STATISTICS UI
======================================================== */

function updateStatisticsUI() {

    if (
        DOM.userTotal
    ) {

        DOM.userTotal.textContent =
            state.totalUsers;

    }


    if (
        DOM.adminTotal
    ) {

        DOM.adminTotal.textContent =
            state.totalAdmins;

    }


    if (
        DOM.userTabCount
    ) {

        DOM.userTabCount.textContent =
            state.totalUsers;

    }


    if (
        DOM.adminTabCount
    ) {

        DOM.adminTabCount.textContent =
            state.totalAdmins;

    }


    if (
        DOM.currentListCount
    ) {

        DOM.currentListCount.textContent =
            state.totalItems;

    }


    if (
        DOM.currentPageStat
    ) {

        DOM.currentPageStat.textContent =
            state.currentPage;

    }

}


/* ========================================================
   FETCH DATA
======================================================== */

async function fetchData() {

    if (
        DOM.tbody
    ) {

        renderLoading();

    }


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


    const table =
        state.currentTab ===
        "user"

            ? "profiles"

            : "admins";


    try {

        let query =
            window.supabaseClient

                .from(
                    table
                )

                .select(
                    "*",
                    {
                        count: "exact"
                    }
                );


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

                if (
                    state.currentTab ===
                    "user"
                ) {

                    query =
                        query.or(
                            [
                                `email.ilike.%${keyword}%`,
                                `full_name.ilike.%${keyword}%`,
                                `phone.ilike.%${keyword}%`,
                                `company.ilike.%${keyword}%`,
                                `company_name.ilike.%${keyword}%`
                            ].join(",")
                        );

                } else {

                    query =
                        query.ilike(
                            "email",
                            `%${keyword}%`
                        );

                }

            }

        }


        query =
            query
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


        state.users =
            data || [];


        state.totalItems =
            count || 0;


        renderUsers();

        renderPagination();

        updateStatisticsUI();


    } catch (
        error
    ) {

        console.error(
            "Lỗi tải dữ liệu:",
            error
        );


        if (
            DOM.tbody
        ) {

            DOM.tbody.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="text-center py-12 text-red-500 font-bold"
                    >

                        Không thể tải dữ liệu.

                        <div
                            class="text-xs font-normal mt-1 text-red-400"
                        >
                            ${utils.escapeHTML(
                                error.message
                            )}
                        </div>

                    </td>

                </tr>

            `;

        }


        utils.showToast(
            `Lỗi tải dữ liệu: ${error.message}`,
            "error"
        );

    }

}


/* ========================================================
   LOADING
======================================================== */

function renderLoading() {

    const colspan =
        state.currentTab ===
        "user"
            ? 7
            : 6;


    DOM.tbody.innerHTML = `

        <tr>

            <td
                colspan="${colspan}"
                class="text-center py-14 text-gray-400"
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

                <div class="mt-2 text-xs">
                    Đang tải dữ liệu...
                </div>

            </td>

        </tr>

    `;

}


/* ========================================================
   RENDER USERS
======================================================== */

function renderUsers() {

    if (
        !DOM.tbody
    ) {

        return;

    }


    if (
        state.users.length === 0
    ) {

        const colspan =
            state.currentTab ===
            "user"
                ? 7
                : 6;


        DOM.tbody.innerHTML = `

            <tr>

                <td
                    colspan="${colspan}"
                    class="text-center py-14 text-gray-400"
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


                    <div class="font-bold text-gray-500">
                        Không tìm thấy dữ liệu
                    </div>


                    <div class="text-xs mt-1">
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


    if (
        state.currentTab ===
        "user"
    ) {

        renderCustomers(
            from
        );

    } else {

        renderAdmins(
            from
        );

    }

}


/* ========================================================
   RENDER CUSTOMERS
======================================================== */

function renderCustomers(
    from
) {

    DOM.tbody.innerHTML =
        state.users
            .map(
                (
                    item,
                    index
                ) => {

                    const email =
                        utils.escapeHTML(
                            item.email ||
                            "Chưa cập nhật"
                        );


                    const name =
                        utils.escapeHTML(
                            item.full_name ||
                            "Chưa cập nhật"
                        );


                    const phone =
                        utils.escapeHTML(
                            item.phone ||
                            "Chưa cập nhật"
                        );


                    const company =
                        utils.escapeHTML(
                            item.company_name ||
                            item.company ||
                            "Cá nhân"
                        );


                    const date =
                        formatDate(
                            item.created_at
                        );


                    const avatar =
                        utils.getInitial(
                            item.full_name ||
                            item.email
                        );


                    return `

                        <tr class="group hover:bg-blue-50/40 transition-colors">

                            <td class="px-4 py-4 text-center text-xs font-mono font-bold text-gray-400">
                                ${from + index + 1}
                            </td>


                            <td class="px-4 py-4 text-center">

                                <div
                                    class="
                                        w-10
                                        h-10
                                        mx-auto
                                        rounded-full
                                        bg-kn-blue
                                        text-white
                                        flex
                                        items-center
                                        justify-center
                                        font-black
                                        text-sm
                                        shadow-sm
                                    "
                                >
                                    ${avatar}
                                </div>

                            </td>


                            <td class="px-4 py-4">

                                <div class="font-black text-gray-900 leading-5">
                                    ${name}
                                </div>

                                <div class="mt-1 text-xs text-gray-500 break-all">
                                    ${email}
                                </div>

                            </td>


                            <td class="px-4 py-4">

                                <div class="text-xs font-bold text-gray-800">
                                    ${phone}
                                </div>

                                <div class="text-[11px] text-gray-400 mt-1">
                                    Tài khoản website
                                </div>

                            </td>


                            <td class="px-4 py-4">

                                <span
                                    class="
                                        inline-flex
                                        max-w-full
                                        px-2.5
                                        py-1.5
                                        rounded-lg
                                        bg-gray-100
                                        border
                                        border-gray-200
                                        text-gray-600
                                        text-[10px]
                                        font-bold
                                    "
                                >
                                    ${company}
                                </span>

                            </td>


                            <td class="px-4 py-4 text-xs text-gray-500 font-medium whitespace-nowrap">
                                ${date}
                            </td>


                            <td class="px-4 py-4 text-right">

                                <button
                                    type="button"
                                    data-action="delete-user"
                                    data-id="${utils.escapeHTML(
                                        item.id
                                    )}"
                                    class="
                                        p-2
                                        rounded-lg
                                        text-gray-400
                                        hover:text-red-500
                                        hover:bg-red-50
                                        transition
                                    "
                                    title="Xóa hồ sơ"
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

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* ========================================================
   RENDER ADMINS
======================================================== */

function renderAdmins(
    from
) {

    DOM.tbody.innerHTML =
        state.users
            .map(
                (
                    item,
                    index
                ) => {

                    const email =
                        utils.escapeHTML(
                            item.email ||
                            "Chưa cập nhật"
                        );


                    const avatar =
                        utils.getInitial(
                            item.email
                        );


                    const date =
                        formatDate(
                            item.created_at
                        );


                    return `

                        <tr class="group hover:bg-orange-50/30 transition-colors">

                            <td class="px-4 py-4 text-center text-xs font-mono font-bold text-gray-400">
                                ${from + index + 1}
                            </td>


                            <td class="px-4 py-4 text-center">

                                <div
                                    class="
                                        w-10
                                        h-10
                                        mx-auto
                                        rounded-full
                                        bg-gray-900
                                        text-white
                                        flex
                                        items-center
                                        justify-center
                                        font-black
                                        text-sm
                                        shadow-sm
                                    "
                                >
                                    ${avatar}
                                </div>

                            </td>


                            <td class="px-4 py-4">

                                <div class="font-black text-gray-900 break-all">
                                    ${email}
                                </div>


                                <div class="text-[10px] text-gray-400 mt-1 font-mono">
                                    ID #${utils.escapeHTML(
                                        item.id
                                    )}
                                </div>

                            </td>


                            <td class="px-4 py-4">

                                <span
                                    class="
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        px-2.5
                                        py-1.5
                                        rounded-lg
                                        bg-orange-50
                                        border
                                        border-orange-100
                                        text-orange-700
                                        text-[10px]
                                        font-black
                                        uppercase
                                    "
                                >

                                    <span
                                        class="
                                            w-1.5
                                            h-1.5
                                            rounded-full
                                            bg-kn-orange
                                        "
                                    ></span>

                                    ADMIN

                                </span>

                            </td>


                            <td class="px-4 py-4 text-xs text-gray-500 font-medium whitespace-nowrap">
                                ${date}
                            </td>


                            <td class="px-4 py-4 text-right">

                                <div class="flex justify-end items-center gap-1">

                                    <button
                                        type="button"
                                        data-action="edit-admin"
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
                                        title="Chỉnh sửa Admin"
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
                                        data-action="delete-admin"
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
                                        title="Thu hồi Admin"
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 0 1-1 1v3M4 7h16"
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


/* ========================================================
   DATE
======================================================== */

function formatDate(
    value
) {

    if (
        !value
    ) {

        return "—";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "vi-VN"
    );

}


/* ========================================================
   PAGINATION
======================================================== */

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


    const startItem =
        state.totalItems > 0

            ? (
                (
                    state.currentPage -
                    1
                ) *
                state.itemsPerPage
            ) + 1

            : 0;


    const endItem =
        Math.min(
            state.currentPage *
                state.itemsPerPage,
            state.totalItems
        );


    if (
        totalPages <= 1
    ) {

        DOM.pagination.innerHTML = `

            <div class="text-xs text-gray-500">

                Hiển thị

                <strong class="text-gray-700">
                    ${startItem}-${endItem}
                </strong>

                /

                <strong class="text-gray-700">
                    ${state.totalItems}
                </strong>

            </div>

        `;

        return;

    }


    const pages =
        buildPageList(
            state.currentPage,
            totalPages
        );


    DOM.pagination.innerHTML = `

        <div class="text-xs text-gray-500">

            Hiển thị

            <strong class="text-gray-700">
                ${startItem}-${endItem}
            </strong>

            /

            <strong class="text-gray-700">
                ${state.totalItems}
            </strong>

        </div>


        <div class="flex items-center gap-1">

            <button
                type="button"
                data-page-action="prev"
                ${
                    state.currentPage === 1
                        ? "disabled"
                        : ""
                }
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

                                    <span class="px-2 text-gray-400 text-xs">
                                        ...
                                    </span>

                                `;

                            }


                            const active =
                                page ===
                                state.currentPage;


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
                                            active

                                                ? state.currentTab ===
                                                    "admin"

                                                    ? "bg-kn-orange text-white border-kn-orange"

                                                    : "bg-kn-blue text-white border-kn-blue"

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
                ${
                    state.currentPage ===
                    totalPages
                        ? "disabled"
                        : ""
                }
                class="
                    px-3
                    py-1.5
                    rounded-lg
                    text-xs
                    font-bold
                    border
                    ${
                        state.currentPage ===
                        totalPages

                            ? "text-gray-300 border-gray-100 cursor-not-allowed"

                            : "text-gray-600 border-gray-200 hover:bg-gray-50"
                    }
                "
            >
                Sau →
            </button>

        </div>

    `;


    if (
        DOM.currentPageStat
    ) {

        DOM.currentPageStat.textContent =
            state.currentPage;

    }

}


/* ========================================================
   PAGE LIST
======================================================== */

function buildPageList(
    current,
    total
) {

    if (
        total <= 7
    ) {

        return Array.from(
            {
                length: total
            },
            (
                _,
                index
            ) =>
                index + 1
        );

    }


    const pages = [
        1
    ];


    if (
        current > 3
    ) {

        pages.push(
            "..."
        );

    }


    const start =
        Math.max(
            2,
            current - 1
        );


    const end =
        Math.min(
            total - 1,
            current + 1
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
        current <
        total - 2
    ) {

        pages.push(
            "..."
        );

    }


    pages.push(
        total
    );


    return pages;

}


/* ========================================================
   ADMIN MODAL
======================================================== */

function openAdminModal(
    id = null
) {

    if (
        !DOM.modal ||
        !DOM.form
    ) {

        return;

    }


    DOM.form.reset();


    DOM.inUserId.value =
        "";


    if (
        id
    ) {

        const admin =
            state.users.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(id)
            );


        if (
            !admin
        ) {

            utils.showToast(
                "Không tìm thấy Admin.",
                "error"
            );

            return;

        }


        DOM.inUserId.value =
            admin.id;


        DOM.inUserEmail.value =
            admin.email ||
            "";


        DOM.modalTitle.textContent =
            "Chỉnh sửa Admin";

    } else {

        DOM.modalTitle.textContent =
            "Cấp quyền Admin";

    }


    DOM.modal.classList.remove(
        "hidden"
    );


    DOM.modal.classList.add(
        "flex"
    );


    setTimeout(
        () => {

            DOM.inUserEmail?.focus();

        },
        50
    );

}


/* ========================================================
   CLOSE MODAL
======================================================== */

function closeAdminModal() {

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


    DOM.form?.reset();

}


/* ========================================================
   SAVE ADMIN
======================================================== */

async function saveAdmin(
    event
) {

    if (
        event
    ) {

        event.preventDefault();

    }


    const email =
        DOM.inUserEmail.value
            .trim()
            .toLowerCase();


    const editId =
        DOM.inUserId.value;


    if (
        !email
    ) {

        utils.showToast(
            "Vui lòng nhập Email!",
            "warning"
        );

        DOM.inUserEmail.focus();

        return;

    }


    utils.setButtonLoading(
        DOM.btnSave,
        true,
        editId
            ? "Cập nhật Admin"
            : "Lưu Admin"
    );


    try {

        /* =================================================
           1. KIỂM TRA ADMIN TRÙNG EMAIL
        ================================================= */

        let duplicateQuery =
            window.supabaseClient

                .from(
                    "admins"
                )

                .select(
                    "id,email"
                )

                .eq(
                    "email",
                    email
                );


        if (
            editId
        ) {

            duplicateQuery =
                duplicateQuery.neq(
                    "id",
                    editId
                );

        }


        const {
            data: existing,
            error: duplicateError
        } =
            await duplicateQuery;


        if (
            duplicateError
        ) {

            throw duplicateError;

        }


        if (
            existing &&
            existing.length > 0
        ) {

            utils.showToast(
                "Email này đã là Admin.",
                "warning"
            );

            return;

        }


        /* =================================================
           2. TÌM PROFILE THEO EMAIL
           
           Đây là phần QUAN TRỌNG nhất.
           
           admins.id phải dùng đúng profiles.id.
           
           Không tự generate UUID.
           Không dùng email làm id.
           Không insert id = null.
        ================================================= */

        const {
            data: profile,
            error: profileError
        } =
            await window.supabaseClient

                .from(
                    "profiles"
                )

                .select(
                    "id,email"
                )

                .eq(
                    "email",
                    email
                )

                .maybeSingle();


        if (
            profileError
        ) {

            throw profileError;

        }


        /* -----------------------------------------------
           Không tìm thấy tài khoản
        ------------------------------------------------ */

        if (
            !profile
        ) {

            utils.showToast(
                "Không tìm thấy tài khoản với Email này. Người dùng phải đăng ký trên website trước.",
                "warning"
            );

            return;

        }


        /* =================================================
           3. KIỂM TRA ID PROFILE
        ================================================= */

        if (
            !profile.id
        ) {

            throw new Error(
                "Tài khoản tồn tại nhưng profiles.id đang bị thiếu."
            );

        }


        /* =================================================
           4. UPDATE ADMIN
        ================================================= */

        if (
            editId
        ) {

            /*
             * Khi chỉnh sửa Admin, vẫn giữ nguyên
             * admins.id hiện tại.
             *
             * Chỉ cập nhật email.
             */

            const {
                error
            } =
                await window.supabaseClient

                    .from(
                        "admins"
                    )

                    .update({

                        email: profile.email || email,

                        role: "admin"

                    })

                    .eq(
                        "id",
                        editId
                    );


            if (
                error
            ) {

                throw error;

            }


            utils.showToast(
                "Cập nhật Admin thành công!",
                "success"
            );

        }


        /* =================================================
           5. INSERT ADMIN
           
           admins.id = profiles.id
        ================================================= */

        else {

            const payload = {

                id: profile.id,

                email: profile.email || email,

                role: "admin"

            };


            const {
                error
            } =
                await window.supabaseClient

                    .from(
                        "admins"
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
                "Đã cấp quyền Admin thành công!",
                "success"
            );

        }


        /* =================================================
           6. REFRESH
        ================================================= */

        closeAdminModal();


        await loadStatistics();


        await fetchData();


    } catch (
        error
    ) {

        console.error(
            "Lỗi lưu Admin:",
            error
        );


        utils.showToast(
            `Lỗi: ${error.message}`,
            "error"
        );

    } finally {

        utils.setButtonLoading(
            DOM.btnSave,
            false,
            editId
                ? "Cập nhật Admin"
                : "Lưu Admin"
        );

    }

}


/* ========================================================
   DELETE ADMIN
======================================================== */

async function deleteAdmin(
    id
) {

    const admin =
        state.users.find(
            item =>
                String(
                    item.id
                ) ===
                String(id)
        );


    const email =
        admin?.email ||
        "tài khoản này";


    const confirmed =
        window.confirm(
            `Thu hồi toàn bộ quyền Admin của:\n${email}?\n\nTài khoản đăng nhập không bị xóa khỏi Auth.`
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
                    "admins"
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
            state.users.length === 1 &&
            state.currentPage > 1
        ) {

            state.currentPage--;

        }


        utils.showToast(
            "Đã thu hồi quyền Admin.",
            "success"
        );


        await loadStatistics();


        await fetchData();


    } catch (
        error
    ) {

        console.error(
            "Lỗi thu hồi Admin:",
            error
        );


        utils.showToast(
            `Lỗi thu hồi: ${error.message}`,
            "error"
        );

    }

}


/* ========================================================
   DELETE CUSTOMER PROFILE
======================================================== */

async function deleteCustomer(
    id
) {

    const customer =
        state.users.find(
            item =>
                String(
                    item.id
                ) ===
                String(id)
        );


    const email =
        customer?.email ||
        "tài khoản này";


    const confirmed =
        window.confirm(
            `Xóa hồ sơ người dùng:\n${email}?\n\nLưu ý: thao tác này chỉ xóa record trong profiles. Tài khoản gốc trong Supabase Auth không bị xóa.`
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
                    "profiles"
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
            state.users.length === 1 &&
            state.currentPage > 1
        ) {

            state.currentPage--;

        }


        utils.showToast(
            "Đã xóa hồ sơ người dùng.",
            "success"
        );


        await loadStatistics();


        await fetchData();


    } catch (
        error
    ) {

        console.error(
            "Lỗi xóa người dùng:",
            error
        );


        utils.showToast(
            `Lỗi xóa: ${error.message}`,
            "error"
        );

    }

}


/* ========================================================
   BACKWARD COMPATIBILITY
======================================================== */

window.switchTab =
    switchTab;


window.showUserModal =
    openAdminModal;


window.closeUserModal =
    closeAdminModal;


window.saveUser =
    saveAdmin;


window.deleteStaff =
    deleteAdmin;


window.deleteCustomer =
    deleteCustomer;


window.fetchData =
    fetchData;