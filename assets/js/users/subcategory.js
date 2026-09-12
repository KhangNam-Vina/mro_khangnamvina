// ========================================================
// FILE: assets/js/users/subcategory.js
// ĐÃ XÓA ICON EMOJI ĐỂ GIAO DIỆN CHUẨN B2B MINIMALISM
// ========================================================

let allSubCats = [];
let productCounts = {};

// ========================================================
// 1. FETCH SUBCATEGORIES
// ========================================================
async function fetchSubCategories() {
    if (!window.supabaseClient) {
        throw new Error('Supabase chưa khởi tạo.');
    }

    const container = document.getElementById('subCategoryContainer');
    const skeleton = document.getElementById('skeletonLoading');
    const emptyState = document.getElementById('emptyState');
    const title = document.getElementById('pageTitle');
    const bcCategory = document.getElementById('bcCategory');

    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('slug');
    const categoryIdParam = urlParams.get('category_id');

    // KHÔNG CÓ CATEGORY ID HOẶC SLUG
    if (!categorySlug && !categoryIdParam) {
        skeleton?.classList.add('is-hidden');
        emptyState?.classList.remove('is-hidden');
        if (title) title.textContent = 'Lỗi đường dẫn';
        return;
    }

    try {
        // TÌM CATEGORY BẰNG SLUG HOẶC ID
        let categoryQuery = window.supabaseClient.from('categories').select('id, name, slug');
        if (categorySlug) {
            categoryQuery = categoryQuery.eq('slug', categorySlug);
        } else {
            categoryQuery = categoryQuery.eq('id', categoryIdParam);
        }

        const { data: catInfo, error: categoryError } = await categoryQuery.single();

        if (categoryError) throw categoryError;
        if (!catInfo) throw new Error('Không tìm thấy danh mục.');

        const categoryId = catInfo.id;
        loadRelatedCategories(categoryId);

        // LOAD SUBCATEGORY + PRODUCT
        const [subRes, prodRes] = await Promise.all([
            window.supabaseClient.from('sub_categories').select('*').eq('category_id', categoryId).order('id', { ascending: true }),
            window.supabaseClient.from('products').select('sub_category_id').eq('category_id', categoryId)
        ]);

        if (subRes.error) throw subRes.error;
        if (prodRes.error) throw prodRes.error;

        allSubCats = subRes.data || [];

        const subcategoryCount = document.getElementById('subcategoryCount');
        if (subcategoryCount) {
            subcategoryCount.textContent = allSubCats.length;
        }

        // RESET & ĐẾM PRODUCT
        productCounts = {};
        if (prodRes.data) {
            prodRes.data.forEach(product => {
                if (product.sub_category_id) {
                    productCounts[product.sub_category_id] = (productCounts[product.sub_category_id] || 0) + 1;
                }
            });
        }

        // DYNAMIC SEO
        if (catInfo) {
            const categoryName = catInfo.name;
            if (title) title.textContent = categoryName;
            if (bcCategory) bcCategory.textContent = categoryName;

            const dynamicTitle = `${categoryName} - Danh mục nhóm hàng | MRO Khang Nam`;
            const dynamicDesc = `Khám phá các nhóm sản phẩm thuộc danh mục ${categoryName} chính hãng. Cập nhật các dòng vật tư công nghiệp mới nhất tại MRO Khang Nam.`;
            const categoryCanonicalUrl = catInfo.slug ? new URL(`/${encodeURIComponent(String(catInfo.slug).trim())}.html`, window.location.origin).href : window.location.href.split('#')[0];
            const subcategoryCanonicalUrl = catInfo.slug ? new URL(`/${encodeURIComponent(String(catInfo.slug).trim())}.html`, window.location.origin).href : window.location.href.split('#')[0];

            document.title = dynamicTitle;
            document.querySelector('meta[name="description"]')?.setAttribute('content', dynamicDesc);
            document.getElementById('canonicalUrl')?.setAttribute('href', subcategoryCanonicalUrl);
            document.getElementById('ogUrl')?.setAttribute('content', subcategoryCanonicalUrl);
            document.getElementById('ogTitle')?.setAttribute('content', dynamicTitle);
            document.getElementById('ogDesc')?.setAttribute('content', dynamicDesc);

            // JSON-LD
            const schemaData = {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: window.location.origin },
                    { '@type': 'ListItem', position: 2, name: categoryName, item: categoryCanonicalUrl },
                    { '@type': 'ListItem', position: 3, name: 'Nhóm hàng', item: subcategoryCanonicalUrl }
                ]
            };
            const schemaElement = document.getElementById('breadcrumbSchema');
            if (schemaElement) schemaElement.textContent = JSON.stringify(schemaData);
        }

        // HIDE SKELETON
        skeleton?.classList.add('is-hidden');

        // EMPTY HOẶC RENDER
        if (allSubCats.length === 0) {
            emptyState?.classList.remove('is-hidden');
            return;
        }

        container?.classList.remove('is-hidden');
        renderSubCategories(allSubCats);

    } catch (error) {
        console.error('Lỗi fetchSubCategories:', error);
        skeleton?.classList.add('is-hidden');
        container?.classList.remove('is-hidden');
        if (container) {
            container.innerHTML = `<div class="subcategory-error">Lỗi kết nối: ${escapeHTML(error.message)}</div>`;
        }
    }
}

// ========================================================
// 2. RENDER SUBCATEGORY (SẠCH BÓNG ICON)
// ========================================================
function renderSubCategories(dataList) {
    const container = document.getElementById('subCategoryContainer');
    const emptyState = document.getElementById('emptyState');

    if (!container || !emptyState) return;

    if (dataList.length === 0) {
        container.innerHTML = '';
        container.classList.add('is-hidden');
        emptyState.classList.remove('is-hidden');
        return;
    }

    emptyState.classList.add('is-hidden');
    container.classList.remove('is-hidden');

    let html = '';
    const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

    dataList.forEach((sub) => {
        const pCount = productCounts[sub.id] || 0;
        const subSlug = sub?.slug ? String(sub.slug).trim() : '';

        html += `
            <a
                href="${subSlug ? (isLocal ? `/pages/family.html?slug=${encodeURIComponent(subSlug)}` : `/${encodeURIComponent(subSlug)}.html`) : '#'}"
                class="subcategory-card"
                aria-label="Xem nhóm hàng ${escapeHTML(sub.name)}"
            >
                <div class="subcategory-card-overlay"></div>
                
                <h2 class="subcategory-card-title text-center mt-2">
                    ${escapeHTML(sub.name)}
                </h2>

                <span class="subcategory-card-count text-center block mt-1">
                    ${pCount} sản phẩm
                </span>
            </a>
        `;
    });

    container.innerHTML = html;
}

// ========================================================
// 3. LIVE SEARCH
// ========================================================
const searchInput = document.getElementById('searchSubcat');
searchInput?.addEventListener('input', function (event) {
    const keyword = event.target.value.toLowerCase().trim();
    if (!keyword) {
        renderSubCategories(allSubCats);
        return;
    }
    const filtered = allSubCats.filter(sub => sub.name && sub.name.toLowerCase().includes(keyword));
    renderSubCategories(filtered);
});

// ========================================================
// 4. AUTH
// ========================================================
document.addEventListener('DOMContentLoaded', async () => {
    await fetchSubCategories();

    if (typeof checkCustomerAuth === 'function') {
        try {
            const user = await checkCustomerAuth();
            if (user) {
                document.getElementById('btnGuestLogin')?.classList.add('is-hidden');
                const userProfileBtn = document.getElementById('btnUserProfile');
                if (userProfileBtn) {
                    userProfileBtn.classList.remove('is-hidden');
                }
            }
        } catch (error) {
            console.error('Lỗi khi check auth:', error);
        }
    }
});

// ========================================================
// 5. RELATED CATEGORIES
// ========================================================
async function loadRelatedCategories(currentCatId) {
    const container = document.getElementById('relatedCategoriesContainer');
    if (!container) return;

    try {
        const { data, error } = await window.supabaseClient.from('categories').select('id, name, slug').neq('id', currentCatId).limit(6);
        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `<span class="subcategory-related-empty">Không có dữ liệu.</span>`;
            return;
        }

        let html = '';
        const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

        data.forEach(category => {
            const categorySlug = category?.slug ? String(category.slug).trim() : '';
            if (!categorySlug) return;
            html += `
                <a
                    href="${isLocal ? `/pages/subcategory.html?slug=${encodeURIComponent(categorySlug)}` : `/${encodeURIComponent(categorySlug)}.html`}"
                    class="subcategory-related-link"
                >
                    ${escapeHTML(category.name)}
                </a>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('Lỗi tải danh mục liên quan:', error);
        container.innerHTML = '';
    }
}

// ========================================================
// 6. ESCAPE HTML
// ========================================================
function escapeHTML(value) {
    if (value === null || value === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
}