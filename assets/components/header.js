// ========================================================
// FILE: assets/components/header.js
// COMPONENT HEADER & MENU DÙNG CHUNG TOÀN BỘ WEBSITE
// CSS TĨNH - 100% KHÔNG TAILWIND
// ========================================================

const renderHeader = () => {

    const currentPath = window.location.pathname;

    // XÁC ĐỊNH ROOT / PAGES
    const isRoot = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.indexOf('/pages/') === -1;
    const rootPath = isRoot ? './' : '../';
    const pagesPath = isRoot ? 'pages/' : '';

    // ====================================================
    // HEADER HTML 
    // ====================================================
    const headerHTML = `
        <div class="site-header-wrapper">

            <!-- TOP HEADER -->
            <header class="header-top">
                <div class="header-container">
                    
                    <!-- LOGO -->
                    <a href="${rootPath}index.html" class="header-logo" aria-label="MRO Khang Nam - Trang chủ">
                        <img src="${rootPath}assets/images/world mark.png" alt="MRO Khang Nam Logo">
                    </a>

                    <!-- SEARCH -->
                    <div class="header-search-wrapper">
                        <div class="header-search-box">
                            <input id="productSearchInput" type="search" aria-label="Tìm kiếm sản phẩm" placeholder="Tìm kiếm theo mã SKU, tên sản phẩm..." class="search-input">
                            <button id="btnSearchSubmit" type="button" aria-label="Tìm kiếm sản phẩm" class="search-btn">Tìm Kiếm</button>
                        </div>
                    </div>

                    <!-- ACCOUNT & LOGIN -->
                    <div class="header-account-wrapper">
                        <!-- Nút Đăng nhập -->
                        <a id="btnGuestLogin" href="${pagesPath}login.html" class="btn-guest-login">Đăng nhập</a>
                        
                        <!-- Nút Tài khoản (Mặc định ẩn bằng class tĩnh d-none) -->
                        <a id="btnUserProfile" href="${pagesPath}profile.html" class="btn-user-profile d-none">
                            <div id="headerAvatarInitials" class="user-avatar">KN</div>
                            <span id="headerUserName" class="user-text">Tài khoản</span>
                        </a>
                    </div>

                </div>
            </header>

            <!-- MAIN NAVIGATION -->
            <nav class="header-nav" aria-label="Điều hướng chính">
                <div class="nav-container">

                    <!-- MOBILE NAV HEADER -->
                    <div class="nav-mobile-header">
                        <div class="nav-mobile-toggle-group">
                            <button id="mobileMenuToggle" type="button" aria-label="Mở menu" aria-expanded="false" class="mobile-toggle-btn">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                            </button>
                            <span class="nav-mobile-title">Danh Mục</span>
                        </div>

                        <!-- CART MOBILE -->
                        <a href="${pagesPath}cart.html" aria-label="Giỏ hàng" class="nav-mobile-cart">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            <span id="shoppingCartCountMobile" class="cart-badge">0</span>
                        </a>
                    </div>

                    <!-- DESKTOP NAV -->
                    <div class="nav-desktop-wrapper">
                        <ul id="mainNavMenu" class="nav-menu-list">
                            <li><a href="${rootPath}index.html" class="nav-link">Trang Chủ</a></li>
                            <li><a href="${pagesPath}products.html" class="nav-link">Sản Phẩm</a></li>
                            <li><a href="${pagesPath}promotions.html" class="nav-link">Giảm Giá</a></li>
                            <li><a href="${pagesPath}brands.html" class="nav-link">Thương Hiệu</a></li>
                            <li><a href="${pagesPath}industries.html" class="nav-link">Ngành Hàng</a></li>
                            <li><a href="${pagesPath}blog.html" class="nav-link">Bài Viết</a></li>
                            <li><a href="${pagesPath}about.html" class="nav-link">Giới Thiệu</a></li>
                            <li><a href="${pagesPath}contact.html" class="nav-link">Liên Hệ</a></li>
                        </ul>

                        <!-- RIGHT ACTIONS (RFQ & CART) -->
                        <div class="nav-actions-right">
                            <a href="${pagesPath}rfq.html" class="nav-action-item" aria-label="Trung tâm báo giá">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                <span class="action-text">Báo Giá</span>
                            </a>
                            <a href="${pagesPath}cart.html" class="nav-action-item cart-action" aria-label="Giỏ hàng">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                <span class="action-text">Giỏ Hàng</span>
                                <span id="shoppingCartCountDesktop" class="cart-badge">0</span>
                            </a>
                        </div>
                    </div>

                    <!-- MOBILE MENU DROPDOWN -->
                    <div id="mobileNavDropdown" class="nav-mobile-dropdown">
                        <div class="nav-mobile-dropdown-inner">
                            <a href="${rootPath}index.html" class="mobile-nav-link">Trang Chủ</a>
                            <a href="${pagesPath}products.html" class="mobile-nav-link">Sản Phẩm</a>
                            <a href="${pagesPath}promotions.html" class="mobile-nav-link">Giảm Giá</a>
                            <a href="${pagesPath}brands.html" class="mobile-nav-link">Thương Hiệu</a>
                            <a href="${pagesPath}industries.html" class="mobile-nav-link">Ngành Hàng</a>
                            <a href="${pagesPath}rfq.html" class="mobile-nav-link">Trung Tâm Báo Giá</a>
                            <a href="${pagesPath}blog.html" class="mobile-nav-link">Bài Viết</a>
                            <a href="${pagesPath}about.html" class="mobile-nav-link">Giới Thiệu</a>
                            <a href="${pagesPath}contact.html" class="mobile-nav-link">Liên Hệ</a>
                        </div>
                    </div>

                </div>
            </nav>
        </div>
    `;

    // RENDER
    const headerContainer = document.getElementById('app-header');
    if (!headerContainer) return;
    
    headerContainer.innerHTML = headerHTML;
    headerContainer.classList.remove('site-header-placeholder');

    // SEARCH
    const searchInput = document.getElementById('productSearchInput');
    const btnSearch = document.getElementById('btnSearchSubmit');

    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                window.executeSearch();
            }
        });
    }

    if (btnSearch) {
        btnSearch.addEventListener('click', window.executeSearch);
    }

    // MOBILE MENU LOGIC
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileNavDropdown');

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('is-open');
            const isOpen = mobileMenu.classList.contains('is-open');
            mobileToggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    // CART COUNT
    if (typeof window.updateHeaderCartCount === 'function') {
        window.updateHeaderCartCount();
    }
};

// ========================================================
// SEARCH
// ========================================================
window.executeSearch = function () {
    const searchInput = document.getElementById('productSearchInput');
    if (!searchInput) return;

    const keyword = searchInput.value.trim();
    if (!keyword) {
        if (window.utils && window.utils.showToast) {
            window.utils.showToast('Vui lòng nhập từ khóa tìm kiếm!', 'warning');
        } else {
            alert('Vui lòng nhập từ khóa tìm kiếm!');
        }
        return;
    }

    const currentPath = window.location.pathname;
    const isRoot = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.indexOf('/pages/') === -1;
    const pagesPath = isRoot ? 'pages/' : '';

    window.location.href = `${pagesPath}products.html?search=${encodeURIComponent(keyword)}`;
};

// ========================================================
// UPDATE CART COUNT
// ========================================================
window.updateHeaderCartCount = function () {
    const shoppingCart = JSON.parse(localStorage.getItem('mro_shopping_cart')) || [];
    const totalItems = shoppingCart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    const countElDesktop = document.getElementById('shoppingCartCountDesktop');
    const countElMobile = document.getElementById('shoppingCartCountMobile');

    if (countElDesktop) {
        countElDesktop.innerText = totalItems;
        if (totalItems > 0) {
            countElDesktop.classList.add('animate-header-bounce');
            setTimeout(() => { countElDesktop.classList.remove('animate-header-bounce'); }, 1000);
        }
    }

    if (countElMobile) {
        countElMobile.innerText = totalItems;
        if (totalItems > 0) {
            countElMobile.classList.add('animate-header-bounce');
            setTimeout(() => { countElMobile.classList.remove('animate-header-bounce'); }, 1000);
        }
    }
};

// ========================================================
// CHẠY HEADER
// ========================================================
renderHeader();
// ========================================================
// TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI HEADER (CSS TĨNH) TRÊN MỌI TRANG
// ========================================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        let isUserLoggedIn = false;

        // Quét 3 lớp để tìm trạng thái đăng nhập
        if (typeof window.checkCustomerAuth === 'function') {
            isUserLoggedIn = !!(await window.checkCustomerAuth());
        } else if (typeof Auth !== 'undefined' && typeof Auth.getCurrentUser === 'function') {
            isUserLoggedIn = !!(await Auth.getCurrentUser());
        } else if (window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getSession();
            isUserLoggedIn = !!data?.session;
        }

        // Bật/Tắt nút Header bằng CSS tĩnh
        if (isUserLoggedIn) {
            const guestBtn = document.getElementById("btnGuestLogin");
            if (guestBtn) {
                guestBtn.classList.add("d-none"); // Ẩn nút Đăng nhập
            }
            
            const userProfileBtn = document.getElementById("btnUserProfile");
            if (userProfileBtn) {
                userProfileBtn.classList.remove("d-none"); // Hiện nút Tài khoản
            }
        }
    } catch (err) {
        console.error("Lỗi đồng bộ Header:", err);
    }
});