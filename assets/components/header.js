// ========================================================
// FILE: assets/components/header.js
// COMPONENT HEADER & MENU DÙNG CHUNG TOÀN BỘ WEBSITE
// ĐÃ TỐI ƯU HÓA SIÊU GỌN GÀNG CHO GIAO DIỆN MOBILE (2 DÒNG)
// ========================================================

const renderHeader = () => {

    const currentPath = window.location.pathname;

    // ====================================================
    // XÁC ĐỊNH ROOT / PAGES
    // ====================================================
    const isRoot = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.indexOf('/pages/') === -1;
    const rootPath = isRoot ? './' : '../';
    const pagesPath = isRoot ? 'pages/' : '';

    // ====================================================
    // HEADER HTML & CSS
    // ====================================================
    const headerHTML = `
        <style>
            /* ====== TỐI ƯU TRẢI NGHIỆM MOBILE HEADER (LAYOUT 2 DÒNG) ====== */
            .mobile-user-icon { display: none; }
            .search-icon-mobile { display: none; }

            @media (max-width: 991px) {
                .header-top {
                    padding: 10px 15px !important;
                    background: #fff;
                    border-bottom: 1px solid #f3f4f6;
                }
                .header-container {
                    display: grid !important;
                    grid-template-columns: 40px 1fr 40px !important; 
                    row-gap: 12px;
                    column-gap: 10px;
                    align-items: center;
                }

                /* --- HÀNG 1: LOGO (GIỮA) & ĐĂNG NHẬP (PHẢI) --- */
                .header-logo {
                    grid-column: 2 / 3;
                    grid-row: 1 / 2;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .header-logo img { 
                    max-height: 48px !important; /* PHÓNG BỰ LOGO */
                    width: auto !important;
                    object-fit: contain;
                }
                
                .header-account-wrapper {
                    grid-column: 3 / 4;
                    grid-row: 1 / 2;
                    margin: 0 !important;
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                }
                
                /* Đổi Nút Đăng nhập thành Icon Người */
                .btn-guest-login {
                    padding: 0 !important;
                    border: none !important;
                    background: transparent !important;
                    color: #00479b !important;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .mobile-user-icon { 
                    display: block !important; 
                    width: 28px; 
                    height: 28px; 
                }
                .desktop-text { display: none !important; }
                
                .btn-user-profile { margin: 0 !important; }
                .user-avatar { 
                    width: 32px !important; 
                    height: 32px !important; 
                    font-size: 11px !important; 
                }
                .user-text { display: none !important; } 

                /* --- HÀNG 2: MENU (TRÁI) - TÌM KIẾM (GIỮA) - GIỎ HÀNG (PHẢI) --- */
                .mobile-toggle-btn {
                    grid-column: 1 / 2;
                    grid-row: 2 / 3;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    color: #00479b;
                    background: transparent;
                    border: none;
                    padding: 0;
                    cursor: pointer;
                }
                .mobile-toggle-btn svg { width: 32px; height: 32px; }

                /* Ô Tìm kiếm style mới (Xám nhạt, viền mỏng, có icon kính lúp) */
                .header-search-wrapper {
                    grid-column: 2 / 3;
                    grid-row: 2 / 3;
                    width: 100%;
                    margin: 0;
                }
                .header-search-box {
                    height: 40px !important;
                    background: #f3f4f6 !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 8px !important;
                    display: flex;
                    align-items: center;
                    padding: 0 12px !important;
                }
                .search-icon-mobile {
                    display: block !important;
                    width: 20px; 
                    height: 20px;
                    color: #6b7280;
                    flex-shrink: 0;
                }
                .search-input {
                    flex: 1;
                    font-size: 14px !important;
                    padding: 0 10px !important;
                    border: none !important;
                    background: transparent !important;
                    outline: none !important;
                    width: 100%;
                }
                .search-btn {
                    display: none !important; /* Ẩn nút Xanh trên mobile */
                }

                .nav-mobile-cart {
                    grid-column: 3 / 4;
                    grid-row: 2 / 3;
                    position: relative;
                    color: #00479b;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    padding: 0;
                    text-decoration: none;
                }
                .nav-mobile-cart svg { width: 30px; height: 30px; }
                .nav-mobile-cart .cart-badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: #ff5e00;
                    color: #fff;
                    font-size: 10px;
                    padding: 2px 5px;
                    border-radius: 10px;
                    font-weight: 900;
                    line-height: 1;
                }
            }
            
            @media (min-width: 992px) {
                .mobile-toggle-btn, .nav-mobile-cart { display: none !important; }
            }
        </style>

        <div class="site-header-wrapper">

            <!-- ==================================================
                 TOP HEADER
            =================================================== -->
            <header class="header-top">
                <div class="header-container">

                    <!-- [MOBILE] HAMBURGER MENU -->
                    <button id="mobileMenuToggle" type="button" aria-label="Mở menu" class="mobile-toggle-btn" aria-expanded="false">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>

                    <!-- LOGO -->
                    <a href="${rootPath}index.html" class="header-logo" aria-label="MRO Khang Nam - Trang chủ">
                        <img id="mainSiteLogo" src="${rootPath}assets/images/world mark.png" alt="MRO Khang Nam Logo">
                    </a>

                    <!-- SEARCH -->
                    <div class="header-search-wrapper">
                        <div class="header-search-box">
                            <svg class="search-icon-mobile" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input id="productSearchInput" type="search" aria-label="Tìm kiếm sản phẩm" placeholder="Tìm kiếm mã SKU, tên sản phẩm..." class="search-input">
                            <button id="btnSearchSubmit" type="button" aria-label="Tìm kiếm sản phẩm" class="search-btn">Tìm Kiếm</button>
                        </div>
                    </div>

                    <!-- ACCOUNT & LOGIN -->
                    <div class="header-account-wrapper">
                        <a id="btnGuestLogin" href="${pagesPath}login.html" class="btn-guest-login d-none" title="Đăng nhập">
                            <svg class="mobile-user-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            <span class="desktop-text">Đăng nhập</span>
                        </a>
                        <a id="btnUserProfile" href="${pagesPath}profile.html" class="btn-user-profile d-none">
                            <div class="user-avatar">TK</div>
                            <span class="user-text">Tài khoản</span>
                        </a>
                    </div>

                    <!-- [MOBILE] GIỎ HÀNG -->
                    <a href="${pagesPath}cart.html" aria-label="Giỏ hàng" class="nav-mobile-cart">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        <span id="shoppingCartCountMobile" class="cart-badge d-none">0</span>
                    </a>

                </div>
            </header>

            <!-- ==================================================
                 MAIN NAVIGATION
            =================================================== -->
            <nav class="header-nav" aria-label="Điều hướng chính">
                <div class="nav-container">

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

                        <!-- RIGHT ACTIONS (DESKTOP) -->
                        <div class="nav-actions-right">
                            <!-- BÁO GIÁ -->
                            <a href="${pagesPath}rfq.html" class="nav-action-item cart-action" aria-label="Trung tâm báo giá">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                <span class="action-text">Báo Giá</span>
                                <span id="rfqCountDesktop" class="cart-badge d-none">0</span>
                            </a>

                            <!-- GIỎ HÀNG -->
                            <a href="${pagesPath}cart.html" class="nav-action-item cart-action" aria-label="Giỏ hàng">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                <span class="action-text">Giỏ Hàng</span>
                                <span id="shoppingCartCountDesktop" class="cart-badge d-none">0</span>
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

    // ====================================================
    // RENDER
    // ====================================================
    const headerContainer = document.getElementById('app-header');
    if (!headerContainer) return;
    
    headerContainer.innerHTML = headerHTML;
    headerContainer.classList.remove('site-header-placeholder');

    applyDynamicHeaderSettings();

    // ====================================================
    // SEARCH
    // ====================================================
    const searchInput = document.getElementById('productSearchInput');
    const btnSearch = document.getElementById('btnSearchSubmit');

    if (searchInput) {
        searchInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                window.executeSearch();
            }
        });
    }

    if (btnSearch) {
        btnSearch.addEventListener('click', window.executeSearch);
    }

    // ====================================================
    // MOBILE MENU LOGIC
    // ====================================================
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileNavDropdown');

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('is-open');
            const isOpen = mobileMenu.classList.contains('is-open');
            mobileToggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    // ====================================================
    // CẬP NHẬT COUNT CHO GIỎ HÀNG VÀ BÁO GIÁ
    // ====================================================
    if (typeof window.updateHeaderCartCount === 'function') window.updateHeaderCartCount();
    if (typeof window.updateHeaderRFQCount === 'function') window.updateHeaderRFQCount();
};

// ========================================================
// HÀM LẤY LOGO TỪ DATABASE VÀ CẬP NHẬT
// ========================================================
async function applyDynamicHeaderSettings() {
    if (!window.supabaseClient) return;
    try {
        const { data, error } = await window.supabaseClient
            .from('website_settings')
            .select('logo_url')
            .eq('id', 1)
            .maybeSingle();

        if (data && data.logo_url && data.logo_url.trim() !== "") {
            const mainLogo = document.getElementById('mainSiteLogo');
            if (mainLogo) {
                mainLogo.src = data.logo_url;
            }
            
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = data.logo_url;
        }
    } catch (error) {
        console.error('Lỗi tải logo từ cấu hình:', error);
    }
}

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
            countElDesktop.classList.remove('d-none');
            countElDesktop.classList.add('animate-header-bounce');
            setTimeout(() => countElDesktop.classList.remove('animate-header-bounce'), 1000);
        } else {
            countElDesktop.classList.add('d-none');
        }
    }

    if (countElMobile) {
        countElMobile.innerText = totalItems;
        if (totalItems > 0) {
            countElMobile.classList.remove('d-none');
            countElMobile.classList.add('animate-header-bounce');
            setTimeout(() => countElMobile.classList.remove('animate-header-bounce'), 1000);
        } else {
            countElMobile.classList.add('d-none');
        }
    }
};

// ========================================================
// UPDATE RFQ COUNT
// ========================================================
window.updateHeaderRFQCount = function () {
    const rfqCart = JSON.parse(localStorage.getItem('mro_rfq_cart')) || [];
    const totalItems = rfqCart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    const countElDesktop = document.getElementById('rfqCountDesktop');

    if (countElDesktop) {
        countElDesktop.innerText = totalItems;
        if (totalItems > 0) {
            countElDesktop.classList.remove('d-none');
            countElDesktop.classList.add('animate-header-bounce');
            setTimeout(() => countElDesktop.classList.remove('animate-header-bounce'), 1000);
        } else {
            countElDesktop.classList.add('d-none');
        }
    }
};

// ========================================================
// CHẠY HEADER
// ========================================================
renderHeader();

// ========================================================
// AUTH HEADER
// Chỉ kiểm tra đăng nhập 1 lần duy nhất.
// ========================================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        let isUserLoggedIn = false;

        if (typeof window.checkCustomerAuth === 'function') {
            isUserLoggedIn = !!(await window.checkCustomerAuth());
        } else if (typeof Auth !== 'undefined' && typeof Auth.getCurrentUser === 'function') {
            isUserLoggedIn = !!(await Auth.getCurrentUser());
        } else if (window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getSession();
            isUserLoggedIn = !!data?.session;
        }

        const guestBtn = document.getElementById('btnGuestLogin');
        const userProfileBtn = document.getElementById('btnUserProfile');

        if (isUserLoggedIn) {
            if (userProfileBtn) userProfileBtn.classList.remove('d-none');
            if (guestBtn) guestBtn.classList.add('d-none');
        } else {
            if (guestBtn) guestBtn.classList.remove('d-none');
            if (userProfileBtn) userProfileBtn.classList.add('d-none');
        }
    } catch (err) {
        console.error('Lỗi đồng bộ Header:', err);
        const guestBtn = document.getElementById('btnGuestLogin');
        const userProfileBtn = document.getElementById('btnUserProfile');

        if (guestBtn) guestBtn.classList.remove('d-none');
        if (userProfileBtn) userProfileBtn.classList.add('d-none');
    }
});