// ========================================================
// FILE: assets/js/users/category.js
// QUẢN LÝ DANH MỤC GỐC
// TỐI ƯU HÓA CSS RESPONSIVE CHO MOBILE (CHIA 2 CỘT) + FIX LỖI SKELETON
// ========================================================

async function loadCategories() {
    const skeleton = document.getElementById('skeletonLoading');
    const grid = document.getElementById('categoryGrid');
    const emptyState = document.getElementById('emptyState');
    const categoryCounter = document.getElementById('totalCategoriesCount');
    const productCounter = document.getElementById('totalProductsCount');

    if (!grid || !skeleton) return;

    try {
        const { data: categories, error: categoryError } = await window.supabaseClient
            .from('categories')
            .select('id, name, slug') 
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (categoryError) throw categoryError;

        const { data: products, error: productError } = await window.supabaseClient
            .from('products')
            .select('category_id');

        if (productError) throw productError;

        const productCountByCategory = new Map();
        let totalProducts = 0;

        if (Array.isArray(products)) {
            totalProducts = products.length;
            products.forEach((product) => {
                const categoryId = product?.category_id;
                if (categoryId === null || categoryId === undefined) return;
                
                const currentCount = productCountByCategory.get(categoryId) || 0;
                productCountByCategory.set(categoryId, currentCount + 1);
            });
        }

        if (categoryCounter) categoryCounter.textContent = Array.isArray(categories) ? categories.length : 0;
        if (productCounter) productCounter.textContent = totalProducts;

        // ẨN SKELETON (Mượt mà, không bị hiện bóng ma nữa)
        skeleton.classList.add('is-hidden');

        if (!Array.isArray(categories) || categories.length === 0) {
            grid.classList.add('is-hidden');
            emptyState?.classList.remove('is-hidden');
            return;
        }

        emptyState?.classList.add('is-hidden');
        grid.classList.remove('is-hidden');

        let html = '';

        categories.forEach((category) => {
            const categoryName = category?.name ? String(category.name).trim() : 'Danh mục';
            const safeName = escapeCategoryHTML(categoryName);

            const categorySlug = category?.slug
                ? String(category.slug).trim()
                : '';

            const isLocal =
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname === 'localhost';

            const targetUrl = categorySlug
                ? (
                    isLocal
                        ? `/pages/subcategory.html?slug=${encodeURIComponent(categorySlug)}`
                        : `/${encodeURIComponent(categorySlug)}.html`
                )
                : '#';

            const categoryProductCount = productCountByCategory.get(category.id) || 0;
            const productCountText = categoryProductCount > 0 ? `${categoryProductCount} sản phẩm` : 'Chưa có sản phẩm';

            html += `
                <a href="${targetUrl}" class="catalog-category-card" aria-label="Xem danh mục ${safeName}">
                    <h2 class="catalog-category-title">${safeName}</h2>
                    <span class="catalog-category-count ${categoryProductCount === 0 ? 'is-empty' : ''}">
                        ${escapeCategoryHTML(productCountText)}
                    </span>
                </a>
            `;
        });

        grid.innerHTML = html;

    } catch (error) {
        console.error('Lỗi tải danh mục gốc:', error);
        skeleton.classList.add('is-hidden');
        grid.classList.remove('is-hidden');
        grid.innerHTML = `
            <div class="catalog-error">
                <strong>Không thể tải danh mục</strong><br>
                ${escapeCategoryHTML(error?.message || 'Lỗi kết nối máy chủ.')}
            </div>
        `;
    }
}

function escapeCategoryHTML(value) {
    if (value === null || value === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
}

async function initCategoryAuthUI() {
    if (typeof window.checkCustomerAuth !== 'function') return;
    try {
        const user = await window.checkCustomerAuth();
        if (!user) return;

        const guestLogin = document.getElementById('btnGuestLogin');
        guestLogin?.classList.add('is-hidden');

        const userProfile = document.getElementById('btnUserProfile');
        userProfile?.classList.remove('is-hidden');
    } catch (error) {
        console.error('Lỗi xác thực:', error);
    }
}

function updateCategorySEO() {
    const canonical = new URL(
        '/pages/category.html',
        window.location.origin
    ).href;

    const canonicalUrl = document.getElementById('canonicalUrl');

    if (canonicalUrl) {
        canonicalUrl.href = canonical;
    }

    const ogUrl = document.querySelector('meta[property="og:url"]');

    if (ogUrl) {
        ogUrl.setAttribute('content', canonical);
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Danh mục vật tư công nghiệp | MRO Khang Nam",
        "description": "MRO Khang Nam cung cấp danh mục vật tư công nghiệp, linh kiện thay thế và thiết bị bảo trì chính hãng cho doanh nghiệp.",
        "url": canonical,
        "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Trang chủ",
                    "item": new URL(
                        '/',
                        window.location.origin
                    ).href
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Danh mục vật tư công nghiệp",
                    "item": canonical
                }
            ]
        }
    };

    let jsonLdScript = document.getElementById('categoryJsonLd');

    if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'categoryJsonLd';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
    }

    jsonLdScript.textContent = JSON.stringify(jsonLd);
}

document.addEventListener('DOMContentLoaded', async () => {
    updateCategorySEO();

    await loadCategories();
    await initCategoryAuthUI();
});