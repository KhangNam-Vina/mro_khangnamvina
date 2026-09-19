// ========================================================
// FILE: assets/js/users/about.js
// TRANG GIỚI THIỆU MRO KHANG NAM
// ĐÃ TỐI ƯU HÓA: CHẠY SONG SONG DATA VÀ AUTH
// ========================================================

'use strict';

// ========================================================
// 1. TẢI DATA VÀ XÁC THỰC SONG SONG CÙNG LÚC
// ========================================================

window.addEventListener('load', async () => {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const contentWrapper = document.getElementById('aboutContentWrapper');

    try {
        // Kích hoạt chạy 2 luồng cùng lúc: Vừa kéo Data About, vừa kiểm tra User Auth
        const [aboutResult] = await Promise.all([
            window.supabaseClient.from('about').select('*').eq('id', 1).maybeSingle(),
            initAboutAuthUI()
        ]);

        const { data, error } = aboutResult;

        if (error) throw error;

        if (data) {
            // ============================================
            // SEO
            // ============================================
            if (data.meta_title) {
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) pageTitle.textContent = data.meta_title;
                document.title = data.meta_title;
            }

            if (data.meta_description) {
                const pageDescription = document.getElementById('pageDescription');
                if (pageDescription) pageDescription.setAttribute('content', data.meta_description);
            }

            // ============================================
            // HERO
            // ============================================
            if (data.hero_heading) {
                const heroHeading = document.getElementById('heroHeading');
                if (heroHeading) heroHeading.textContent = data.hero_heading;
            }

            if (data.hero_description) {
                const heroDescription = document.getElementById('heroDescription');
                if (heroDescription) heroDescription.textContent = data.hero_description;
            }

            // ============================================
            // KPI
            // ============================================
            if (data.kpi_years) {
                const el = document.getElementById('kpiYears');
                if (el) el.textContent = data.kpi_years;
            }

            if (data.kpi_brands) {
                const el = document.getElementById('kpiBrands');
                if (el) el.textContent = data.kpi_brands;
            }

            if (data.kpi_skus) {
                const el = document.getElementById('kpiSkus');
                if (el) el.textContent = Number(data.kpi_skus).toLocaleString('vi-VN');
            }

            if (data.kpi_customers) {
                const el = document.getElementById('kpiCustomers');
                if (el) el.textContent = Number(data.kpi_customers).toLocaleString('vi-VN');
            }

            // ============================================
            // VISION & MISSION (Dự phòng)
            // ============================================
            if (data.vision_text) {
                const el = document.getElementById('visionText');
                if (el) el.textContent = data.vision_text;
            }

            if (data.mission_text) {
                const el = document.getElementById('missionText');
                if (el) el.textContent = data.mission_text;
            }

            // ============================================
            // Nội dung HTML (Từ CKEditor)
            // ============================================
            const htmlContainer = document.getElementById('dynamicHtmlContent');
            if (htmlContainer && data.html_content) {
                htmlContainer.innerHTML = data.html_content;
            } else if (htmlContainer) {
                htmlContainer.innerHTML = `<p class="about-rich-empty">Chưa có thông tin chi tiết.</p>`;
            }

            // Hiển thị nội dung
            if (loadingIndicator) loadingIndicator.classList.add('is-hidden');
            if (contentWrapper) contentWrapper.classList.remove('is-hidden');

        } else {
            // TRƯỜNG HỢP KHÔNG CÓ DATA
            if (loadingIndicator) {
                loadingIndicator.innerHTML = `<p class="about-loading-error">Không tìm thấy dữ liệu cấu hình trang About.</p>`;
            }
        }

    } catch (error) {
        console.error('Lỗi tải trang About:', error);
        if (loadingIndicator) {
            loadingIndicator.innerHTML = `<p class="about-loading-error">Lỗi kết nối máy chủ.</p>`;
        }
    }
});

// ========================================================
// 2. AUTH UI (Kiểm tra đăng nhập để hiển thị nút User)
// ========================================================
async function initAboutAuthUI() {
    try {
        if (typeof window.checkCustomerAuth !== 'function') return;

        const user = await window.checkCustomerAuth();
        if (!user) return;

        // Đã đăng nhập: Ẩn nút Khách, Hiện nút User
        const guestBtn = document.getElementById('btnGuestLogin');
        if (guestBtn) guestBtn.classList.add('is-hidden');

        const userProfileBtn = document.getElementById('btnUserProfile');
        if (userProfileBtn) {
            userProfileBtn.classList.remove('is-hidden');
            userProfileBtn.classList.add('is-flex');
        }
    } catch (error) {
        console.error('Lỗi xác thực:', error);
    }
}