// ========================================================
// FILE: assets/js/users/about.js
// TRANG GIỚI THIỆU MRO KHANG NAM
// Logic Supabase + SEO + Auth
// ========================================================

'use strict';


// ========================================================
// 1. LOAD ABOUT DATA
// ========================================================

window.addEventListener(
    'load',
    async () => {

        const loadingIndicator =
            document.getElementById(
                'loadingIndicator'
            );

        const contentWrapper =
            document.getElementById(
                'aboutContentWrapper'
            );


        try {

            // ------------------------------------------------
            // LOAD DATA
            // ------------------------------------------------

            const {
                data,
                error
            } = await window.supabaseClient
                .from('about')
                .select('*')
                .eq('id', 1)
                .maybeSingle();


            if (error) {

                throw error;
            }


            // ------------------------------------------------
            // DATA EXISTS
            // ------------------------------------------------

            if (data) {


                // ============================================
                // SEO
                // ============================================

                if (data.meta_title) {

                    const pageTitle =
                        document.getElementById(
                            'pageTitle'
                        );

                    if (pageTitle) {

                        pageTitle.textContent =
                            data.meta_title;
                    }

                    document.title =
                        data.meta_title;
                }


                if (data.meta_description) {

                    const pageDescription =
                        document.getElementById(
                            'pageDescription'
                        );

                    if (pageDescription) {

                        pageDescription.setAttribute(
                            'content',
                            data.meta_description
                        );
                    }
                }


                // ============================================
                // HERO
                // ============================================

                if (data.hero_heading) {

                    const heroHeading =
                        document.getElementById(
                            'heroHeading'
                        );

                    if (heroHeading) {

                        heroHeading.textContent =
                            data.hero_heading;
                    }
                }


                if (data.hero_description) {

                    const heroDescription =
                        document.getElementById(
                            'heroDescription'
                        );

                    if (heroDescription) {

                        heroDescription.textContent =
                            data.hero_description;
                    }
                }


                // ============================================
                // KPI YEARS
                // ============================================

                if (data.kpi_years) {

                    const element =
                        document.getElementById(
                            'kpiYears'
                        );

                    if (element) {

                        element.textContent =
                            data.kpi_years;
                    }
                }


                // ============================================
                // KPI BRANDS
                // ============================================

                if (data.kpi_brands) {

                    const element =
                        document.getElementById(
                            'kpiBrands'
                        );

                    if (element) {

                        element.textContent =
                            data.kpi_brands;
                    }
                }


                // ============================================
                // KPI SKUS
                // ============================================

                if (data.kpi_skus) {

                    const element =
                        document.getElementById(
                            'kpiSkus'
                        );

                    if (element) {

                        element.textContent =
                            Number(
                                data.kpi_skus
                            ).toLocaleString(
                                'vi-VN'
                            );
                    }
                }


                // ============================================
                // KPI CUSTOMERS
                // ============================================

                if (data.kpi_customers) {

                    const element =
                        document.getElementById(
                            'kpiCustomers'
                        );

                    if (element) {

                        element.textContent =
                            Number(
                                data.kpi_customers
                            ).toLocaleString(
                                'vi-VN'
                            );
                    }
                }


                // ============================================
                // VISION
                // Giữ lại hỗ trợ DB cũ
                // ============================================

                if (data.vision_text) {

                    const visionElement =
                        document.getElementById(
                            'visionText'
                        );

                    if (visionElement) {

                        visionElement.textContent =
                            data.vision_text;
                    }
                }


                // ============================================
                // MISSION
                // Giữ lại hỗ trợ DB cũ
                // ============================================

                if (data.mission_text) {

                    const missionElement =
                        document.getElementById(
                            'missionText'
                        );

                    if (missionElement) {

                        missionElement.textContent =
                            data.mission_text;
                    }
                }


                // ============================================
                // CKEDITOR HTML
                // ============================================

                const htmlContainer =
                    document.getElementById(
                        'dynamicHtmlContent'
                    );


                if (
                    htmlContainer &&
                    data.html_content
                ) {

                    htmlContainer.innerHTML =
                        data.html_content;

                } else if (htmlContainer) {

                    htmlContainer.innerHTML =
                        `
                            <p class="about-rich-empty">
                                Chưa có thông tin chi tiết.
                            </p>
                        `;
                }


                // ============================================
                // HIDE LOADING
                // ============================================

                if (loadingIndicator) {

                    loadingIndicator.classList.add(
                        'is-hidden'
                    );
                }


                if (contentWrapper) {

                    contentWrapper.classList.remove(
                        'is-hidden'
                    );
                }


            } else {

                // ============================================
                // NO DATA
                // ============================================

                if (loadingIndicator) {

                    loadingIndicator.innerHTML =
                        `
                            <p class="about-loading-error">
                                Không tìm thấy dữ liệu cấu hình
                                trang About.
                            </p>
                        `;
                }
            }


        } catch (error) {

            console.error(
                'Lỗi tải trang About:',
                error
            );


            if (loadingIndicator) {

                loadingIndicator.innerHTML =
                    `
                        <p class="about-loading-error">
                            Lỗi kết nối máy chủ.
                        </p>
                    `;
            }
        }


        // ====================================================
        // 2. AUTH UI
        // ====================================================

        await initAboutAuthUI();

    }
);


// ========================================================
// 3. AUTH UI
// ========================================================

async function initAboutAuthUI() {

    try {

        if (
            typeof window.checkCustomerAuth !==
            'function'
        ) {

            return;
        }


        const user =
            await window.checkCustomerAuth();


        if (!user) {

            return;
        }


        // ------------------------------------------------
        // GUEST LOGIN
        // ------------------------------------------------

        const guestBtn =
            document.getElementById(
                'btnGuestLogin'
            );


        if (guestBtn) {

            guestBtn.classList.add(
                'is-hidden'
            );
        }


        // ------------------------------------------------
        // USER PROFILE
        // ------------------------------------------------

        const userProfileBtn =
            document.getElementById(
                'btnUserProfile'
            );


        if (userProfileBtn) {

            userProfileBtn.classList.remove(
                'is-hidden'
            );

            userProfileBtn.classList.add(
                'is-flex'
            );
        }


    } catch (error) {

        console.error(
            'Lỗi xác thực:',
            error
        );
    }
}