
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

    const categoryCounter =
        document.getElementById('totalCategoriesCount');

    const productCounter =
        document.getElementById('totalProductsCount');


    // Không có grid thì dừng
    if (!grid || !skeleton) {
        return;
    }


    try {

        // ==================================================
        // LẤY DANH MỤC GỐC
        // ==================================================

        const {
            data: categories,
            error: categoryError
        } = await window.supabaseClient
            .from('categories')
            .select('id, name')
            .order('name', {
                ascending: true
            });


        if (categoryError) {
            throw categoryError;
        }


        // ==================================================
        // LẤY PRODUCT CATEGORY ID
        //
        // Chỉ lấy category_id để:
        // - tính tổng sản phẩm
        // - đếm sản phẩm theo từng Category
        // ==================================================

        const {
            data: products,
            error: productError
        } = await window.supabaseClient
            .from('products')
            .select('category_id');


        if (productError) {
            throw productError;
        }


        // ==================================================
        // TÍNH SỐ PRODUCT THEO CATEGORY
        // ==================================================

        const productCountByCategory =
            new Map();

        let totalProducts = 0;


        if (Array.isArray(products)) {

            totalProducts =
                products.length;


            products.forEach(
                (product) => {

                    const categoryId =
                        product?.category_id;


                    if (
                        categoryId === null ||
                        categoryId === undefined
                    ) {
                        return;
                    }


                    const currentCount =
                        productCountByCategory.get(
                            categoryId
                        ) || 0;


                    productCountByCategory.set(
                        categoryId,
                        currentCount + 1
                    );

                }
            );

        }


        // ==================================================
        // CẬP NHẬT TỔNG SỐ
        // ==================================================

        if (categoryCounter) {

            categoryCounter.textContent =
                Array.isArray(categories)
                    ? categories.length
                    : 0;

        }


        if (productCounter) {

            productCounter.textContent =
                totalProducts;

        }


        // ==================================================
        // ẨN SKELETON
        // ==================================================

        skeleton.classList.add(
            'is-hidden'
        );


        // ==================================================
        // KHÔNG CÓ CATEGORY
        // ==================================================

        if (
            !Array.isArray(categories) ||
            categories.length === 0
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
        // CÓ CATEGORY
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


        categories.forEach(
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
                // SỐ PRODUCT CỦA CATEGORY
                // ------------------------------------------

                const categoryProductCount =
                    productCountByCategory.get(
                        category.id
                    ) || 0;


                const productCountText =
                    categoryProductCount > 0
                        ? `${categoryProductCount} sản phẩm`
                        : 'Chưa có sản phẩm';


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
                            class="catalog-category-count ${
                                categoryProductCount === 0
                                    ? 'is-empty'
                                    : ''
                            }"
                        >
                            ${escapeCategoryHTML(
                                productCountText
                            )}
                        </span>


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

        grid.innerHTML =
            html;


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

        // 1. Load danh mục + số sản phẩm
        await loadCategories();


        // 2. Kiểm tra đăng nhập
        await initCategoryAuthUI();

    }
);