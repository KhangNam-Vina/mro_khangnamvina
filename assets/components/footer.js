// ========================================================
// FILE: assets/components/footer.js
// COMPONENT FOOTER & NÚT LIÊN HỆ DÙNG CHUNG TOÀN WEBSITE
// CSS TĨNH - KHÔNG PHỤ THUỘC TAILWIND
// ========================================================

const COMPANY_CONFIG = {
    hotline: "0919 699 942",
    hotlineDisplay: "0919 699 942",
    zalo: "0919 699 942",
    email: "khangnam2022@gmail.com",
    address: "Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh",
    map: "https://www.google.com/maps/place/KhangNam+Vina/@10.8532605,106.7953513,21z",
    name: "Công ty TNHH TM-DV Khang Nam Vi Na",
    established: "2005",

    socials: {
        facebook: "https://www.facebook.com/eshopvina.05",
        linkedin: "#",
        youtube: "#"
    }
};


// ========================================================
// 1. TẠO FOOTER
// ========================================================

const renderFooterContent = (rootPath) => {

    const currentYear = new Date().getFullYear();

    return `
        <footer class="site-footer">

            <!-- Background -->
            <div class="site-footer-background">
                <img
                    src="${rootPath}assets/images/world mark.png"
                    alt="Khang Nam Vina"
                    loading="lazy"
                    decoding="async"
                >

                <div class="site-footer-overlay"></div>
            </div>


            <div class="footer-container">

                <!-- ==========================================
                     FOOTER MAIN
                =========================================== -->

                <div class="footer-grid">


                    <!-- ==================================
                         COLUMN 1 - COMPANY
                    =================================== -->

                    <div class="footer-column footer-company">

                        <div class="footer-logo-box">

                            <a
                                href="${rootPath}index.html"
                                aria-label="Trang chủ Khang Nam"
                            >
                                <img
                                    src="${rootPath}assets/images/world mark.png"
                                    alt="MRO Khang Nam Logo"
                                    loading="lazy"
                                    decoding="async"
                                >
                            </a>

                        </div>


                        <p class="footer-company-description">

                            <strong class="footer-company-name">
                                ${COMPANY_CONFIG.name}
                            </strong>

                            Đối tác cung ứng vật tư công nghiệp (MRO)
                            toàn diện cho doanh nghiệp sản xuất tại Việt Nam.

                        </p>


                        <!-- SOCIALS -->

                        <div class="footer-socials">

                            <a
                                href="${COMPANY_CONFIG.socials.facebook}"
                                aria-label="Facebook Khang Nam"
                                class="footer-social-link"
                            >
                                <svg
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
                                </svg>
                            </a>


                            <a
                                href="${COMPANY_CONFIG.socials.linkedin}"
                                aria-label="LinkedIn Khang Nam"
                                class="footer-social-link"
                            >
                                <svg
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                                </svg>
                            </a>


                            <a
                                href="${COMPANY_CONFIG.socials.youtube}"
                                aria-label="Youtube Khang Nam"
                                class="footer-social-link"
                            >
                                <svg
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
                                </svg>
                            </a>

                        </div>

                    </div>


                    <!-- ==================================
                         COLUMN 2 - CATEGORIES
                    =================================== -->

                    <div class="footer-column">

                        <h3 class="footer-heading">
                            Danh Mục MRO
                        </h3>

                        <ul class="footer-link-list">

                            <li>
                                <a
                                    href="${rootPath}pages/category.html"
                                    class="footer-nav-link"
                                >
                                    Dụng cụ cầm tay (Hand Tools)
                                </a>
                            </li>

                            <li>
                                <a
                                    href="${rootPath}pages/category.html"
                                    class="footer-nav-link"
                                >
                                    Bảo hộ lao động (PPE)
                                </a>
                            </li>

                            <li>
                                <a
                                    href="${rootPath}pages/category.html"
                                    class="footer-nav-link"
                                >
                                    Khí nén & Thủy lực
                                </a>
                            </li>

                            <li>
                                <a
                                    href="${rootPath}pages/category.html"
                                    class="footer-nav-link"
                                >
                                    Vật tư tiêu hao nhà xưởng
                                </a>
                            </li>

                        </ul>

                    </div>


                    <!-- ==================================
                         COLUMN 3 - SUPPORT
                    =================================== -->

                    <div class="footer-column">

                        <h3 class="footer-heading">
                            Hỗ Trợ B2B
                        </h3>

                        <ul class="footer-link-list">

                            <li>
                                <a
                                    href="${rootPath}pages/rfq.html"
                                    class="footer-nav-link"
                                >
                                    Yêu Cầu Báo Giá (RFQ)
                                </a>
                            </li>

                            <li>
                                <a
                                    href="${rootPath}pages/quick-order.html"
                                    class="footer-nav-link"
                                >
                                    Đặt Hàng Nhanh (Excel)
                                </a>
                            </li>

                            <li>
                                <a
                                    href="${rootPath}pages/my-rfq.html"
                                    class="footer-nav-link"
                                >
                                    Theo dõi đơn hàng
                                </a>
                            </li>

                            <li>
                                <a
                                    href="${rootPath}pages/contact.html"
                                    class="footer-nav-link"
                                >
                                    Liên hệ Kỹ sư ứng dụng
                                </a>
                            </li>

                        </ul>

                    </div>


                    <!-- ==================================
                         COLUMN 4 - CONTACT
                    =================================== -->

                    <div class="footer-column">

                        <h3 class="footer-heading">
                            Thông Tin Liên Hệ
                        </h3>

                        <ul class="footer-contact-list">


                            <!-- HOTLINE -->

                            <li class="footer-contact-item">

                                <svg
                                    class="footer-contact-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    ></path>
                                </svg>

                                <a
                                    href="tel:${COMPANY_CONFIG.hotline}"
                                    class="footer-contact-link"
                                >
                                    ${COMPANY_CONFIG.hotlineDisplay}
                                </a>

                            </li>


                            <!-- EMAIL -->

                            <li class="footer-contact-item">

                                <svg
                                    class="footer-contact-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    ></path>
                                </svg>

                                <a
                                    href="mailto:${COMPANY_CONFIG.email}"
                                    class="footer-contact-link"
                                >
                                    ${COMPANY_CONFIG.email}
                                </a>

                            </li>


                            <!-- ADDRESS -->

                            <li class="footer-contact-item footer-contact-address">

                                <svg
                                    class="footer-contact-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    ></path>

                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    ></path>
                                </svg>

                                <span>
                                    ${COMPANY_CONFIG.address}
                                </span>

                            </li>

                        </ul>

                    </div>

                </div>


                <!-- ==========================================
                     COPYRIGHT
                =========================================== -->

                <div class="footer-bottom">

                    <p class="footer-copyright">
                        &copy; ${currentYear}
                        Khang Nam Vi Na.
                        All rights reserved.
                    </p>

                    <p class="footer-established">
                        Industrial Supply Partner Since
                        ${COMPANY_CONFIG.established}
                    </p>

                </div>

            </div>

        </footer>
    `;
};


// ========================================================
// 2. FLOATING BUTTONS
// ========================================================

const renderFloatingButtons = () => {

    return `
        <div
            id="floatingActions"
            class="floating-actions"
        >

            <!-- SCROLL TOP -->

            <button
                id="scrollToTopBtn"
                type="button"
                class="floating-action floating-scroll-top is-hidden"
                aria-label="Cuộn lên đầu trang"
                title="Lên đầu trang"
            >

                <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M5 15l7-7 7 7"
                    ></path>
                </svg>

                <span class="floating-tooltip">
                    Lên đầu trang
                </span>

            </button>


            <!-- MAP -->

            <div class="floating-wrapper">

                <a
                    href="${COMPANY_CONFIG.map}"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chỉ đường đến Khang Nam"
                    class="floating-action floating-map"
                >

                    <svg
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                    </svg>

                </a>

                <span class="floating-tooltip">
                    Chỉ đường
                </span>

            </div>


            <!-- ZALO -->

            <div class="floating-wrapper">

                <a
                    href="https://zalo.me/${COMPANY_CONFIG.zalo}"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat Zalo với Khang Nam"
                    class="floating-action floating-zalo"
                >
                    <span class="floating-zalo-text">
                        Z
                    </span>
                </a>

                <span class="floating-tooltip">
                    Chat Zalo
                </span>

            </div>


            <!-- HOTLINE -->

            <div class="floating-wrapper">

                <a
                    href="tel:${COMPANY_CONFIG.hotline}"
                    aria-label="Gọi Hotline Khang Nam"
                    class="floating-action floating-hotline"
                >

                    <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        stroke-width="2.5"
                        aria-hidden="true"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        ></path>
                    </svg>

                </a>

                <span class="floating-tooltip">
                    ${COMPANY_CONFIG.hotlineDisplay}
                </span>

            </div>

        </div>
    `;
};


// ========================================================
// 3. SCROLL HANDLER
// ========================================================

let footerScrollTicking = false;

const handleScroll = () => {

    if (footerScrollTicking) {
        return;
    }

    footerScrollTicking = true;

    window.requestAnimationFrame(() => {

        const scrollBtn =
            document.getElementById(
                'scrollToTopBtn'
            );

        if (scrollBtn) {

            if (window.scrollY > 300) {

                scrollBtn.classList.remove(
                    'is-hidden'
                );

                scrollBtn.classList.add(
                    'floating-visible'
                );

            } else {

                scrollBtn.classList.add(
                    'is-hidden'
                );

                scrollBtn.classList.remove(
                    'floating-visible'
                );

            }

        }

        footerScrollTicking = false;

    });
};


// ========================================================
// 4. RENDER FOOTER
// ========================================================

const renderFooter = () => {

    const currentPath =
        window.location.pathname;

    const isRoot =
        currentPath === '/' ||
        currentPath.endsWith('/index.html') ||
        !currentPath.includes('/pages/');

    const rootPath =
        isRoot ? './' : '../';


    const footerContainer =
        document.getElementById(
            'app-footer'
        );


    if (!footerContainer) {
        return;
    }


    // Render
    footerContainer.innerHTML =
        renderFooterContent(rootPath) +
        renderFloatingButtons();


    // Remove scroll handler cũ
    if (
        window._footerScrollHandler
    ) {

        window.removeEventListener(
            'scroll',
            window._footerScrollHandler
        );

    }


    // Đăng ký handler mới
    window._footerScrollHandler =
        handleScroll;

    window.addEventListener(
        'scroll',
        window._footerScrollHandler,
        {
            passive: true
        }
    );


    // Scroll to top
    const scrollBtn =
        document.getElementById(
            'scrollToTopBtn'
        );


    if (scrollBtn) {

        scrollBtn.addEventListener(
            'click',
            () => {

                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });

            }
        );

    }


    // Chạy lần đầu
    handleScroll();
};


// ========================================================
// 5. EXPORT
// ========================================================

window.renderFooter =
    renderFooter;


// ========================================================
// 6. INIT
// ========================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {
        renderFooter();
    }
);