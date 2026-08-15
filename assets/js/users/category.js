// ========================================================
// FILE: assets/js/users/category.js
// QUẢN LÝ DANH MỤC GỐC
// Luồng:
// Category -> Subcategory -> Family -> Products
// ========================================================

async function loadCategories() {

    const skeleton =
        document.getElementById(
            'skeletonLoading'
        );

    const grid =
        document.getElementById(
            'categoryGrid'
        );

    const emptyState =
        document.getElementById(
            'emptyState'
        );

    const counter =
        document.getElementById(
            'totalCategoriesCount'
        );


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
            .order(
                'name',
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        // ==================================================
        // CẬP NHẬT COUNTER
        // ==================================================

        if (counter) {

            counter.textContent =
                data
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
        // EMPTY STATE
        // ==================================================

        if (
            !data ||
            data.length === 0
        ) {

            emptyState?.classList.remove(
                'is-hidden'
            );

            return;
        }


        // ==================================================
        // HIỆN GRID
        // ==================================================

        grid.classList.remove(
            'is-hidden'
        );


        let html = '';


        const fallbackIcons = [
            '🔩',
            '⚙️',
            '🔧',
            '🧰',
            '📦',
            '🦺',
            '🔌',
            '🗜️'
        ];


        // ==================================================
        // RENDER CATEGORY
        // ==================================================

        data.forEach(
            (cat, index) => {

                const categoryName =
                    cat.name || '';


                const initials =
                    categoryName
                        .trim()
                        .split(/\s+/)
                        .slice(0, 3)
                        .map(
                            word =>
                                word[0]
                        )
                        .join('')
                        .toUpperCase();


                const icon =
                    fallbackIcons[
                        index %
                        fallbackIcons.length
                    ];


                // ==================================================
                // LUỒNG CATEGORY
                // Category -> Subcategory
                // ==================================================

                const targetUrl =
                    `subcategory.html?category_id=${encodeURIComponent(cat.id)}`;


                html += `
                    <a
                        href="${targetUrl}"
                        class="catalog-category-card"
                        aria-label="Xem danh mục ${escapeCategoryHTML(categoryName)}"
                    >

                        <div class="catalog-category-icon">

                            <span>
                                ${icon}
                            </span>

                        </div>


                        <h2 class="catalog-category-title">
                            ${escapeCategoryHTML(categoryName)}
                        </h2>


                        <div class="catalog-category-initials">
                            ${escapeCategoryHTML(initials)}
                        </div>

                    </a>
                `;
            }
        );


        grid.innerHTML =
            html;


    } catch (error) {

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
                Lỗi kết nối máy chủ:
                ${escapeCategoryHTML(
                    error.message
                )}
            </div>
        `;

    }
}


// ========================================================
// ESCAPE HTML
// ========================================================

function escapeCategoryHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {
        return '';
    }


    const div =
        document.createElement(
            'div'
        );


    div.textContent =
        String(value);


    return div.innerHTML;
}


// ========================================================
// INIT
// ========================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        // 1. Load category
        await loadCategories();


        // 2. Auth
        if (
            typeof window.checkCustomerAuth ===
            'function'
        ) {

            try {

                const user =
                    await window.checkCustomerAuth();


                if (user) {

                    // Ẩn Login
                    document
                        .getElementById(
                            'btnGuestLogin'
                        )
                        ?.classList.add(
                            'is-hidden'
                        );


                    // Hiện Profile
                    const userProfileBtn =
                        document.getElementById(
                            'btnUserProfile'
                        );


                    if (userProfileBtn) {

                        userProfileBtn.classList.remove(
                            'is-hidden'
                        );

                    }

                }

            } catch (error) {

                console.error(
                    'Lỗi xác thực:',
                    error
                );

            }

        }

    }
);