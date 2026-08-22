// ========================================================
// FILE: assets/js/users/category.js
// QUẢN LÝ DANH MỤC GỐC
// Luồng:
// Category -> Subcategory -> Family -> Products
// ========================================================

async function loadCategories() {

    const skeleton =
        document.getElementById('skeletonLoading');

    const grid =
        document.getElementById('categoryGrid');

    const emptyState =
        document.getElementById('emptyState');

    const counter =
        document.getElementById('totalCategoriesCount');


    // Không có grid thì dừng
    if (!grid || !skeleton) {
        return;
    }


    try {

        // ==================================================
        // LẤY DANH MỤC GỐC
        // ==================================================

        const {
            data,
            error
        } = await window.supabaseClient
            .from('categories')
            .select('id, name')
            .order('name', {
                ascending: true
            });


        if (error) {
            throw error;
        }


        // ==================================================
        // CẬP NHẬT TỔNG SỐ DANH MỤC
        // ==================================================

        if (counter) {

            counter.textContent =
                Array.isArray(data)
                    ? data.length
                    : 0;

        }


        // ==================================================
        // ẨN SKELETON
        // ==================================================

        skeleton.classList.add(
            'is-hidden'
        );


        // ==================================================
        // KHÔNG CÓ DỮ LIỆU
        // ==================================================

        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            grid.classList.add(
                'is-hidden'
            );

            emptyState?.classList.remove(
                'is-hidden'
            );

            return;
        }


        // ==================================================
        // CÓ DỮ LIỆU
        // ==================================================

        emptyState?.classList.add(
            'is-hidden'
        );

        grid.classList.remove(
            'is-hidden'
        );


        // ==================================================
        // ICON THEO TÊN DANH MỤC
        // Không phụ thuộc thứ tự database
        // ==================================================

        const categoryIcons = {

            'an toàn lao động': '🦺',

            'công cụ': '⚙️',

            'đóng gói': '🔧',

            'đường ống & khí đốt': '🧰',

            'hàn': '📦',

            'hóa chất': '🧪',

            'kho lưu trữ & thiết bị': '🔩',

            'nguyên vật liệu': '🏗️',

            'nông nghiệp & làm vườn': '🌱',

            'phòng thí nghiệm & y tế': '🧪',

            'thiết bị điện': '🔌',

            'thực phẩm & cơ sở vật chất': '🧰',

            'văn phòng phẩm': '📦',

            'vật liệu mài mòn': '⚙️',

            'vật tư liên kết': '🔩',

            'vệ sinh & dọn dẹp': '🧹'

        };


        // ==================================================
        // FALLBACK ICON
        // ==================================================

        const fallbackIcons = [
            '🔩',
            '⚙️',
            '🔧',
            '🧰',
            '📦',
            '🔌',
            '🗜️',
            '🦺'
        ];


        // ==================================================
        // RENDER CATEGORY
        // ==================================================

        let html = '';


        data.forEach(
            (category, index) => {

                const categoryName =
                    category?.name
                        ? String(category.name).trim()
                        : 'Danh mục';


                // ------------------------------------------
                // Lấy icon theo tên
                // ------------------------------------------

                const normalizedName =
                    categoryName.toLowerCase();


                const icon =
                    categoryIcons[normalizedName] ||
                    fallbackIcons[
                        index %
                        fallbackIcons.length
                    ];


                // ------------------------------------------
                // URL sang SUBCATEGORY
                // ------------------------------------------

                const targetUrl =
                    `subcategory.html?category_id=${encodeURIComponent(
                        category.id
                    )}`;


                // ------------------------------------------
                // Escape HTML
                // ------------------------------------------

                const safeName =
                    escapeCategoryHTML(
                        categoryName
                    );


                // ------------------------------------------
                // CARD
                // ------------------------------------------

                html += `
                    <a
                        href="${targetUrl}"
                        class="catalog-category-card"
                        aria-label="Xem danh mục ${safeName}"
                    >

                        <div
                            class="catalog-category-icon"
                            aria-hidden="true"
                        >
                            <span>
                                ${icon}
                            </span>
                        </div>


                        <h2
                            class="catalog-category-title"
                        >
                            ${safeName}
                        </h2>


                        <span
                            class="catalog-category-link"
                        >
                            Xem danh mục
                            <span aria-hidden="true">
                                →
                            </span>
                        </span>

                    </a>
                `;
            }
        );


        // ==================================================
        // ĐƯA HTML RA GRID
        // ==================================================

        grid.innerHTML = html;


    } catch (error) {

        // ==================================================
        // ERROR
        // ==================================================

        console.error(
            'Lỗi tải danh mục gốc:',
            error
        );


        skeleton.classList.add(
            'is-hidden'
        );


        grid.classList.remove(
            'is-hidden'
        );


        grid.innerHTML = `
            <div class="catalog-error">

                <strong>
                    Không thể tải danh mục
                </strong>

                <br>

                ${escapeCategoryHTML(
                    error?.message ||
                    'Lỗi kết nối máy chủ.'
                )}

            </div>
        `;
    }
}


// ========================================================
// ESCAPE HTML
// ========================================================

function escapeCategoryHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return '';
    }


    const div =
        document.createElement('div');


    div.textContent =
        String(value);


    return div.innerHTML;
}


// ========================================================
// AUTH UI
// ========================================================

async function initCategoryAuthUI() {

    if (
        typeof window.checkCustomerAuth !==
        'function'
    ) {
        return;
    }


    try {

        const user =
            await window.checkCustomerAuth();


        if (!user) {
            return;
        }


        // ----------------------------------------------
        // Ẩn nút đăng nhập khách
        // ----------------------------------------------

        const guestLogin =
            document.getElementById(
                'btnGuestLogin'
            );


        guestLogin?.classList.add(
            'is-hidden'
        );


        // ----------------------------------------------
        // Hiện nút profile
        // ----------------------------------------------

        const userProfile =
            document.getElementById(
                'btnUserProfile'
            );


        userProfile?.classList.remove(
            'is-hidden'
        );


    } catch (error) {

        console.error(
            'Lỗi xác thực:',
            error
        );
    }
}


// ========================================================
// INIT
// ========================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        // 1. Load danh mục
        await loadCategories();


        // 2. Kiểm tra đăng nhập
        await initCategoryAuthUI();

    }
);