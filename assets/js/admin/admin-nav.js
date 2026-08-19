// ============================================================
// ADMIN NAVIGATION - MASTER SIDEBAR
// Dùng chung cho toàn bộ trang /admin
// ============================================================

(function () {
    "use strict";


    // ========================================================
    // 1. MENU CONFIG
    // ========================================================

    const NAV_ITEMS = [

        {
            type: "single",
            label: "Tổng quan",
            href: "dashboard.html",
            key: "dashboard",
            icon: "dashboard"
        },


        {
            type: "section",
            label: "ĐƠN HÀNG & BÁO GIÁ"
        },

        {
            type: "single",
            label: "Quản lý Đơn hàng",
            href: "manage-orders.html",
            key: "manage-orders",
            icon: "orders"
        },

        {
            type: "single",
            label: "Quản lý Báo giá",
            href: "manage-rfq.html",
            key: "manage-rfq",
            icon: "rfq"
        },

        {
            type: "single",
            label: "Quản lý Liên hệ",
            href: "manage-contacts.html",
            key: "manage-contacts",
            icon: "contacts"
        },


        {
            type: "section",
            label: "CATALOG"
        },

        {
            type: "single",
            label: "Quản lý Danh mục",
            href: "manage-categories.html",
            key: "manage-categories",
            icon: "categories"
        },

        {
            type: "single",
            label: "Quản lý Nhóm hàng",
            href: "manage-subcategories.html",
            key: "manage-subcategories",
            icon: "subcategories"
        },

        {
            type: "single",
            label: "Quản lý Dòng sản phẩm",
            href: "manage-families.html",
            key: "manage-families",
            icon: "families"
        },

        {
            type: "single",
            label: "Quản lý Sản phẩm",
            href: "manage-products.html",
            key: "manage-products",
            icon: "products"
        },

        {
            type: "single",
            label: "Quản lý Ngành hàng",
            href: "manage-industries.html",
            key: "manage-industries",
            icon: "industries"
        },

        {
            type: "single",
            label: "Quản lý Thương hiệu",
            href: "manage-brand.html",
            key: "manage-brand",
            icon: "brand"
        },


        {
            type: "section",
            label: "NỘI DUNG & HỆ THỐNG"
        },

        {
            type: "single",
            label: "Quản lý Bài viết",
            href: "manage-blog.html",
            key: "manage-blog",
            icon: "blog"
        },

        {
            type: "single",
            label: "Quản lý Giới thiệu",
            href: "manage-about.html",
            key: "manage-about",
            icon: "about"
        },

        {
            type: "single",
            label: "Quản lý Người dùng",
            href: "manage-users.html",
            key: "manage-users",
            icon: "users"
        },

        {
            type: "single",
            label: "Quản lý Cấu hình",
            href: "manage-settings.html",
            key: "manage-settings",
            icon: "settings"
        }

    ];


    // ========================================================
    // 2. ICONS
    // ========================================================

    const ICONS = {

        dashboard: `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
            </svg>
        `,


        orders: `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M9 11h6"></path>
                <path d="M9 15h6"></path>
                <path d="M9 7h6"></path>
                <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"></path>
            </svg>
        `,


        rfq: `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path>
                <path d="M14 2v6h6"></path>
                <path d="M8 13h8"></path>
                <path d="M8 17h6"></path>
            </svg>
        `,


        contacts: `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"></path>
            </svg>
        `,


        categories: `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M4 5h16"></path>
                <path d="M4 12h16"></path>
                <path d="M4 19h16"></path>
            </svg>
        `,


        subcategories: `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M4 5h16"></path>
                <path d="M8 12h12"></path>
                <path d="M8 19h12"></path>
                <path d="M4 12h.01"></path>
                <path d="M4 19h.01"></path>
            </svg>
        `,


        families: `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <path d="M3 9h18"></path>
                <path d="M9 21V9"></path>
            </svg>
        `,


        products: `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="m21 8-9-5-9 5 9 5 9-5Z"></path>
                <path d="m3 8 9 5 9-5"></path>
                <path d="M3 12l9 5 9-5"></path>
                <path d="M3 16l9 5 9-5"></path>
            </svg>
        `,


        industries: `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M3 21h18"></path>
                <path d="M5 21V7l7-4 7 4v14"></path>
                <path d="M9 21v-5h6v5"></path>
                <path d="M9 10h.01"></path>
                <path d="M15 10h.01"></path>
            </svg>
        `,

        brand: `
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M12 2 3 6v6c0 5.25 3.84 9.74 9 11 5.16-1.26 9-5.75 9-11V6l-9-4Z"></path>
                    <path d="m9 12 2 2 4-4"></path>
                </svg>
            `,


        blog: `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M4 4h16v16H4z"></path>
                <path d="M8 8h8"></path>
                <path d="M8 12h8"></path>
                <path d="M8 16h5"></path>
            </svg>
        `,


        about: `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 11v5"></path>
                <path d="M12 8h.01"></path>
            </svg>
        `,


        users: `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
        `,


        settings: `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-2v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.42-1.42.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.03H7v-2h.84A1.7 1.7 0 0 0 9.4 10a1.7 1.7 0 0 0-.34-1.88L9 8.06l1.42-1.42.06.06A1.7 1.7 0 0 0 12.36 7.04 1.7 1.7 0 0 0 13.39 5.48V5h2v.48A1.7 1.7 0 0 0 16.42 7.04a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.42 1.42-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03H21v2h-.04A1.7 1.7 0 0 0 19.4 15Z"></path>
            </svg>
        `
    };


    // ========================================================
    // 3. ESCAPE HTML
    // ========================================================

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // ========================================================
    // 4. CURRENT PAGE
    // ========================================================

    function getCurrentPage() {

        const path =
            window.location.pathname
                .split("/")
                .pop();

        return path || "dashboard.html";
    }


    // ========================================================
    // 5. RENDER SIDEBAR
    // ========================================================

    function renderAdminSidebar() {

        const sidebar =
            document.getElementById(
                "adminSidebar"
            );


        if (!sidebar) {

            console.warn(
                "[admin-nav] Không tìm thấy #adminSidebar"
            );

            return;
        }


        const currentPage =
            getCurrentPage();


        let html = `

            <div
                class="
                    h-16
                    flex
                    items-center
                    px-6
                    bg-gray-950
                    border-b
                    border-gray-800
                    shrink-0
                "
            >

                <span
                    class="
                        text-xl
                        font-black
                        tracking-wider
                    "
                >
                    Khangnam

                    <span class="text-orange-500">
                        ADMIN
                    </span>

                </span>

            </div>


            <div
                class="
                    flex-1
                    overflow-y-auto
                    py-4
                "
            >

                <nav class="space-y-1 px-3">
        `;


        NAV_ITEMS.forEach(
            (item) => {

                if (
                    item.type ===
                    "section"
                ) {

                    html += `

                        <div
                            class="
                                pt-5
                                pb-2
                                px-3
                                text-[10px]
                                uppercase
                                tracking-widest
                                text-gray-500
                                font-black
                            "
                        >
                            ${escapeHTML(
                                item.label
                            )}
                        </div>

                    `;

                    return;
                }


                const isActive =
                    currentPage ===
                    item.href;


                html += `

                    <a
                        href="${escapeHTML(
                            item.href
                        )}"
                        data-admin-nav-key="${escapeHTML(
                            item.key
                        )}"
                        class="
                            flex
                            items-center
                            gap-3
                            px-3
                            py-2.5
                            rounded-md
                            text-sm
                            transition-colors
                            duration-150

                            ${
                                isActive
                                    ? "bg-blue-700 text-white font-bold"
                                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }
                        "
                    >

                        <span
                            class="
                                w-5
                                h-5
                                shrink-0
                                flex
                                items-center
                                justify-center
                            "
                        >
                            ${
                                ICONS[
                                    item.icon
                                ] || ""
                            }
                        </span>


                        <span>
                            ${escapeHTML(
                                item.label
                            )}
                        </span>

                    </a>

                `;
            }
        );


        html += `

                </nav>

            </div>


            <div
                class="
                    p-4
                    border-t
                    border-gray-800
                    shrink-0
                "
            >

                <button
                    id="adminLogoutButton"
                    type="button"
                    class="
                        w-full
                        text-left
                        px-2
                        py-2
                        text-sm
                        text-gray-400
                        hover:text-white
                        transition-colors
                    "
                >
                    Đăng xuất
                </button>

            </div>

        `;


        sidebar.innerHTML =
            html;


        bindLogoutButton();
    }


    // ========================================================
    // 6. LOGOUT
    // ========================================================

    function bindLogoutButton() {

        const button =
            document.getElementById(
                "adminLogoutButton"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            async () => {

                if (
                    typeof window.handleAdminLogout ===
                    "function"
                ) {

                    await window.handleAdminLogout();

                    return;
                }


                if (
                    window.supabaseClient
                ) {

                    try {

                        await window.supabaseClient
                            .auth
                            .signOut();

                    } catch (error) {

                        console.error(
                            "[admin-nav] Logout error:",
                            error
                        );
                    }
                }


                window.location.href =
                    "login.html";
            }
        );
    }


    // ========================================================
    // 7. INIT
    // ========================================================

    function initAdminNav() {

        renderAdminSidebar();
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initAdminNav
        );

    } else {

        initAdminNav();
    }


    // Expose nếu sau này cần
    window.AdminNav = {
        render: renderAdminSidebar
    };

})();