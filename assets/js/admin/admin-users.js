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
// - Không xóa Auth từ màn hình này.
// - Không xóa profiles trực tiếp từ màn hình này.
// - Cấp Admin = INSERT admins.
// - Thu hồi Admin = DELETE admins.
// - Không chỉnh sửa Admin để tránh phá liên kết id.
// - Admin list lấy thông tin người dùng từ profiles bằng admins.id.
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
            const button = event.target.closest("button[data-action]");

            if (!button) {
                return;
            }

            const action = button.dataset.action;
            const id = button.dataset.id;

            // Sự kiện Thu hồi quyền Admin (Tab Admin)
            if (action === "delete-admin") {
                deleteAdmin(id);
            }
            
            // 💡 SỰ KIỆN MỚI: Khóa / Mở khóa người dùng (Tab Người dùng)
            if (action === "toggle-status") {
                const status = button.dataset.status;
                toggleUserStatus(id, status);
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
    if (!DOM.thead) return;

    if (state.currentTab === "user") {
        DOM.thead.innerHTML = `
            <th class="px-4 py-3.5 w-14 text-center">#</th>
            <th class="px-4 py-3.5 w-16 text-center">Avatar</th>
            <th class="px-4 py-3.5 min-w-[220px]">Người dùng</th>
            <th class="px-4 py-3.5 min-w-[180px]">Liên hệ</th>
            <th class="px-4 py-3.5 w-32">Công ty</th>
            <th class="px-4 py-3.5 w-28 text-center">Trạng thái</th>
            <th class="px-4 py-3.5 w-32">Ngày đăng ký</th>
            <th class="px-4 py-3.5 w-24 text-right">Thao tác</th>
        `;
    } else {
        DOM.thead.innerHTML = `
            <th class="px-4 py-3.5 w-14 text-center">#</th>
            <th class="px-4 py-3.5 w-16 text-center">Avatar</th>
            <th class="px-4 py-3.5 min-w-[280px]">Quản trị viên</th>
            <th class="px-4 py-3.5 min-w-[180px]">Liên hệ</th>
            <th class="px-4 py-3.5 w-36">Quyền</th>
            <th class="px-4 py-3.5 w-40">Ngày cấp</th>
            <th class="px-4 py-3.5 w-28 text-right">Thao tác</th>
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

    if (DOM.tbody) {
        renderLoading();
    }

    try {

        if (state.currentTab === "user") {
            await fetchUsersData();
        } else {
            await fetchAdminsData();
        }

    } catch (error) {

        console.error(
            "Lỗi tải dữ liệu:",
            error
        );

        if (DOM.tbody) {

            DOM.tbody.innerHTML = `

                <tr>

                    <td
                        colspan="${
                            state.currentTab === "admin"
                                ? 7
                                : 6
                        }"
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
   FETCH USERS
======================================================== */

async function fetchUsersData() {

    const from =
        (state.currentPage - 1) *
        state.itemsPerPage;

    const to =
        from +
        state.itemsPerPage -
        1;

    let query =
        window.supabaseClient
            .from("profiles")
            .select(
                "*",
                {
                    count: "exact"
                }
            );

    if (state.searchQuery) {

        const keyword =
            state.searchQuery
                .replace(/[%_,]/g, "");

        if (keyword) {

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

        }

    }

    const {
        data,
        count,
        error
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

    if (error) {
        throw error;
    }

    state.users =
        data || [];

    state.totalItems =
        count || 0;

    renderUsers();
    renderPagination();
    updateStatisticsUI();

}


/* ========================================================
   FETCH ADMINS
======================================================== */

async function fetchAdminsData() {

    const from =
        (state.currentPage - 1) *
        state.itemsPerPage;

    const to =
        from +
        state.itemsPerPage -
        1;

    const keyword =
        state.searchQuery
            .replace(/[%_,]/g, "");

    let matchingProfileIds = [];


    /*
     * Search Admin theo:
     * email + tên + SĐT + công ty.
     * profiles.id chính là admins.id.
     */

    if (keyword) {

        const {
            data: profiles,
            error: profileSearchError
        } =
            await window.supabaseClient
                .from("profiles")
                .select("id")
                .or(
                    [
                        `email.ilike.%${keyword}%`,
                        `full_name.ilike.%${keyword}%`,
                        `phone.ilike.%${keyword}%`,
                        `company.ilike.%${keyword}%`,
                        `company_name.ilike.%${keyword}%`
                    ].join(",")
                );

        if (profileSearchError) {
            throw profileSearchError;
        }

        matchingProfileIds =
            (profiles || [])
                .map(
                    item => item.id
                )
                .filter(Boolean);

    }


    let query =
        window.supabaseClient
            .from("admins")
            .select(
                "*",
                {
                    count: "exact"
                }
            );


    if (keyword) {

        const safeIds =
            matchingProfileIds
                .map(
                    id =>
                        String(id)
                            .replace(
                                /[^a-zA-Z0-9_-]/g,
                                ""
                            )
                )
                .filter(Boolean);


        if (safeIds.length > 0) {

            query =
                query.or(
                    [
                        `email.ilike.%${keyword}%`,
                        `id.in.(${safeIds.join(",")})`
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


    const {
        data: admins,
        count,
        error
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

    if (error) {
        throw error;
    }


    const adminRows =
        admins || [];


    /*
     * Không cần FK.
     * Dùng admins.id -> profiles.id.
     */

    const profileIds =
        adminRows
            .map(
                item => item.id
            )
            .filter(Boolean);


    let profileMap =
        new Map();


    if (profileIds.length > 0) {

        const {
            data: profiles,
            error: profilesError
        } =
            await window.supabaseClient
                .from("profiles")
                .select(
                    "id,email,full_name,phone,company,company_name"
                )
                .in(
                    "id",
                    profileIds
                );

        if (profilesError) {
            throw profilesError;
        }

        profileMap =
            new Map(
                (profiles || []).map(
                    profile => [
                        String(profile.id),
                        profile
                    ]
                )
            );

    }


    state.users =
        adminRows.map(
            admin => ({
                ...admin,
                profile:
                    profileMap.get(
                        String(admin.id)
                    ) || null
            })
        );


    state.totalItems =
        count || 0;


    renderUsers();
    renderPagination();
    updateStatisticsUI();

}

/* ========================================================
   LOADING
======================================================== */

function renderLoading() {

    const colspan = 6;


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

        const colspan = 6;


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
function renderCustomers(from) {
    DOM.tbody.innerHTML = state.users.map((item, index) => {
        const email = utils.escapeHTML(item.email || "Chưa cập nhật");
        const name = utils.escapeHTML(item.full_name || "Chưa cập nhật");
        const phone = utils.escapeHTML(item.phone || "Chưa cập nhật");
        const company = utils.escapeHTML(item.company_name || item.company || "Cá nhân");
        const date = formatDate(item.created_at);
        const avatar = utils.getInitial(item.full_name || item.email);
        
        // Logic kiểm tra trạng thái
        const status = item.status || 'active';
        const isLocked = status === 'locked';
        
        const statusBadge = isLocked 
            ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Đã khóa</span>`
            : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 border border-green-100 text-green-600 text-[10px] font-black uppercase"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>Hoạt động</span>`;
        
        const actionIcon = isLocked 
            ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>` // Nút mở khóa
            : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>`; // Nút khóa

        const actionTitle = isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản";
        const actionColor = isLocked ? "text-green-600 hover:bg-green-50" : "text-amber-500 hover:bg-amber-50";

        return `
            <tr class="group hover:bg-blue-50/40 transition-colors ${isLocked ? 'bg-gray-50 opacity-75' : ''}">
                <td class="px-4 py-4 text-center text-xs font-mono font-bold text-gray-400">${from + index + 1}</td>
                <td class="px-4 py-4 text-center">
                    <div class="w-10 h-10 mx-auto rounded-full ${isLocked ? 'bg-gray-400' : 'bg-kn-blue'} text-white flex items-center justify-center font-black text-sm shadow-sm">
                        ${avatar}
                    </div>
                </td>
                <td class="px-4 py-4">
                    <div class="font-black ${isLocked ? 'text-gray-500 line-through' : 'text-gray-900'} leading-5">${name}</div>
                    <div class="mt-1 text-xs text-gray-500 break-all">${email}</div>
                </td>
                <td class="px-4 py-4">
                    <div class="text-xs font-bold text-gray-800">${phone}</div>
                    <div class="text-[11px] text-gray-400 mt-1">Tài khoản website</div>
                </td>
                <td class="px-4 py-4">
                    <span class="inline-flex max-w-full px-2.5 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold">${company}</span>
                </td>
                <td class="px-4 py-4 text-center">
                    ${statusBadge}
                </td>
                <td class="px-4 py-4 text-xs text-gray-500 font-medium whitespace-nowrap">${date}</td>
                <td class="px-4 py-4 text-right">
                    <button type="button" data-action="toggle-status" data-id="${utils.escapeHTML(item.id)}" data-status="${status}" class="p-2 rounded-lg ${actionColor} transition" title="${actionTitle}">
                        ${actionIcon}
                    </button>
                </td>
            </tr>
        `;
    }).join("");
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

                    const profile =
                        item.profile;


                    const email =
                        utils.escapeHTML(
                            profile?.email ||
                            item.email ||
                            "Chưa cập nhật"
                        );


                    const name =
                        utils.escapeHTML(
                            profile?.full_name ||
                            "Chưa cập nhật"
                        );


                    const phone =
                        utils.escapeHTML(
                            profile?.phone ||
                            "Chưa cập nhật"
                        );


                    const company =
                        utils.escapeHTML(
                            profile?.company_name ||
                            profile?.company ||
                            "Cá nhân"
                        );


                    const avatar =
                        utils.getInitial(
                            profile?.full_name ||
                            profile?.email ||
                            item.email
                        );


                    const date =
                        formatDate(
                            item.created_at
                        );


                    const profileStatus =
                        profile
                            ? ""
                            : `
                                <div
                                    class="
                                        mt-1
                                        text-[10px]
                                        text-red-500
                                        font-bold
                                    "
                                >
                                    Hồ sơ profiles không tồn tại
                                </div>
                            `;


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

                                <div class="font-black text-gray-900 leading-5">
                                    ${name}
                                </div>

                                <div class="mt-1 text-xs text-gray-500 break-all">
                                    ${email}
                                </div>

                                ${profileStatus}

                            </td>


                            <td class="px-4 py-4">

                                <div class="text-xs font-bold text-gray-800">
                                    ${phone}
                                </div>

                                <div class="text-[10px] text-gray-400 mt-1">
                                    ${company}
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
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16"
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

function openAdminModal() {

    if (
        !DOM.modal ||
        !DOM.form
    ) {

        return;

    }


    DOM.form.reset();

    DOM.inUserId.value = "";

    DOM.modalTitle.textContent =
        "Cấp quyền Admin";


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

    if (!DOM.modal) {
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

    if (event) {
        event.preventDefault();
    }


    const email =
        DOM.inUserEmail.value
            .trim()
            .toLowerCase();


    if (!email) {

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
        "Lưu Admin"
    );


    try {

        /*
         * Người dùng phải tồn tại trong profiles.
         */

        const {
            data: profile,
            error: profileError
        } =
            await window.supabaseClient
                .from("profiles")
                .select(
                    "id,email,full_name"
                )
                .eq(
                    "email",
                    email
                )
                .maybeSingle();


        if (profileError) {
            throw profileError;
        }


        if (!profile) {

            utils.showToast(
                "Không tìm thấy tài khoản với Email này. Người dùng phải đăng ký trên website trước.",
                "warning"
            );

            return;

        }


        if (!profile.id) {

            throw new Error(
                "Tài khoản tồn tại nhưng profiles.id đang bị thiếu."
            );

        }


        /*
         * Người này đã là Admin?
         */

        const {
            data: existingAdmin,
            error: existingAdminError
        } =
            await window.supabaseClient
                .from("admins")
                .select(
                    "id,email"
                )
                .eq(
                    "id",
                    profile.id
                )
                .maybeSingle();


        if (existingAdminError) {
            throw existingAdminError;
        }


        if (existingAdmin) {

            utils.showToast(
                "Tài khoản này đã là Admin.",
                "warning"
            );

            return;

        }


        /*
         * Bảo vệ thêm email trùng trong admins,
         * kể cả dữ liệu cũ đang bị lệch id.
         */

        const {
            data: duplicateEmail,
            error: duplicateEmailError
        } =
            await window.supabaseClient
                .from("admins")
                .select(
                    "id,email"
                )
                .eq(
                    "email",
                    profile.email || email
                );


        if (duplicateEmailError) {
            throw duplicateEmailError;
        }


        if (
            duplicateEmail &&
            duplicateEmail.length > 0
        ) {

            utils.showToast(
                "Email này đã có trong danh sách Admin.",
                "warning"
            );

            return;

        }


        /*
         * Cấp quyền:
         * admins.id = profiles.id
         */

        const {
            error: insertError
        } =
            await window.supabaseClient
                .from("admins")
                .insert([
                    {
                        id:
                            profile.id,

                        email:
                            profile.email ||
                            email,

                        role:
                            "admin"
                    }
                ]);


        if (insertError) {
            throw insertError;
        }


        utils.showToast(
            "Đã cấp quyền Admin thành công!",
            "success"
        );


        closeAdminModal();

        await loadStatistics();


        /*
         * Cấp xong chuyển sang tab Admin
         * để kiểm tra ngay.
         */

        state.currentTab =
            "admin";

        state.currentPage =
            1;

        state.searchQuery =
            "";


        if (DOM.searchInput) {
            DOM.searchInput.value = "";
        }


        updateTabUI();

        await fetchData();


    } catch (error) {

        console.error(
            "Lỗi cấp Admin:",
            error
        );


        utils.showToast(
            `Lỗi cấp Admin: ${error.message}`,
            "error"
        );

    } finally {

        utils.setButtonLoading(
            DOM.btnSave,
            false,
            "Lưu Admin"
        );

    }

}

/* ========================================================
   DELETE ADMIN (Đã thêm khiên bảo vệ Admin Gốc)
======================================================== */
async function deleteAdmin(id) {
    const admin = state.users.find(item => String(item.id) === String(id));
    const email = admin?.profile?.email || admin?.email || "";

    // BƯỚC BẢO VỆ 1: Không ai được đụng vào Admin Gốc
    if (email.toLowerCase() === 'admin@khangnam.com') {
        utils.showToast("Bạo chúa! Không thể thu hồi quyền của Admin Gốc!", "error");
        return;
    }

    // BƯỚC BẢO VỆ 2: Không cho tự sát
    const { data: authData } = await window.supabaseClient.auth.getUser();
    if (authData?.user?.id === String(id)) {
        utils.showToast("Khoan đã bro! Không thể tự thu hồi quyền Admin của chính mình.", "warning");
        return;
    }

    const confirmed = window.confirm(`Thu hồi toàn bộ quyền Admin của:\n${email || "tài khoản này"}?\n\nTài khoản đăng nhập không bị xóa khỏi Auth.`);
    if (!confirmed) return;

    try {
        const { error } = await window.supabaseClient.from("admins").delete().eq("id", id);
        if (error) throw error;

        if (state.users.length === 1 && state.currentPage > 1) state.currentPage--;

        utils.showToast("Đã thu hồi quyền Admin.", "success");
        await loadStatistics();
        await fetchData();

    } catch (error) {
        console.error("Lỗi thu hồi Admin:", error);
        utils.showToast(`Lỗi thu hồi: ${error.message}`, "error");
    }
}


/* ========================================================
   DELETE CUSTOMER PROFILE
======================================================== */



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


// Không expose deleteCustomer.
// profiles không bị xóa trực tiếp từ màn hình quản trị.


window.fetchData =
    fetchData;

/* ========================================================
   TOGGLE USER STATUS (LOCK/UNLOCK) - Bảo vệ Admin Gốc
======================================================== */
async function toggleUserStatus(id, currentStatus) {
    const user = state.users.find(item => String(item.id) === String(id));
    const email = user?.email || "";
    
    const newStatus = currentStatus === 'locked' ? 'active' : 'locked';
    const actionText = newStatus === 'locked' ? 'Khóa' : 'Mở khóa';

    // BƯỚC BẢO VỆ 1: Khóa Admin Gốc? Nằm mơ đi!
    if (email.toLowerCase() === 'admin@khangnam.com' && newStatus === 'locked') {
        utils.showToast("Toang! Ai lại đi khóa tài khoản của Sếp tổng bao giờ!", "error");
        return;
    }

    // BƯỚC BẢO VỆ 2: Không cho tự khóa mình
    const { data: authData } = await window.supabaseClient.auth.getUser();
    if (authData?.user?.id === String(id) && newStatus === 'locked') {
        utils.showToast("Khoan đã! Không thể tự khóa tài khoản của chính mình.", "warning");
        return;
    }

    const confirmed = window.confirm(`Bạn có chắc muốn ${actionText} hồ sơ của:\n${email || "tài khoản này"}?`);
    if (!confirmed) return;

    try {
        const { error } = await window.supabaseClient
            .from("profiles")
            .update({ status: newStatus })
            .eq("id", id);

        if (error) throw error;

        utils.showToast(`Đã ${actionText.toLowerCase()} tài khoản thành công.`, "success");
        await fetchData(); 

    } catch (error) {
        console.error(`Lỗi ${actionText.toLowerCase()} tài khoản:`, error);
        utils.showToast(`Lỗi thao tác: ${error.message}`, "error");
    }
}