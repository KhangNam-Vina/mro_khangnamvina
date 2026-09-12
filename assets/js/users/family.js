// ========================================================
// FILE: assets/js/users/family.js
// MINIMAL UI - CHỈ CÒN TEXT VÀ ĐẾM SỐ LƯỢNG
// ========================================================

let allFamilies = [];
let productCounts = {};

async function fetchFamilies() {
    if (!window.supabaseClient) throw new Error('Supabase chưa khởi tạo.');

    const container = document.getElementById('familyContainer');
    const skeleton = document.getElementById('skeletonLoading');
    const emptyState = document.getElementById('emptyState');
    const title = document.getElementById('pageTitle');
    const bcSubCategory = document.getElementById('bcSubCategory');

    const urlParams = new URLSearchParams(window.location.search);
    const subCatSlug = urlParams.get('slug');
    const subCatIdParam = urlParams.get('sub_category_id');

    if (!subCatSlug && !subCatIdParam) {
        skeleton?.classList.add('is-hidden');
        emptyState?.classList.remove('is-hidden');
        if (title) title.textContent = 'Lỗi đường dẫn';
        return;
    }

    try {
        // TÌM NHÓM HÀNG BẰNG SLUG HOẶC ID
        let subCatQuery = window.supabaseClient.from('sub_categories').select('id, name, slug');
        if (subCatSlug) {
            subCatQuery = subCatQuery.eq('slug', subCatSlug);
        } else {
            subCatQuery = subCatQuery.eq('id', subCatIdParam);
        }

        const { data: subCatInfo, error: subCatError } = await subCatQuery.single();

        if (subCatError) throw subCatError;
        if (!subCatInfo) throw new Error('Không tìm thấy nhóm hàng.');

        const subCategoryId = subCatInfo.id;

        // LOAD FAMILY + ĐẾM PRODUCT
        // Lấy đúng những trường cần thiết, tối ưu payload
        const [famRes, prodRes] = await Promise.all([
            window.supabaseClient
                .from('families')
                .select('id, name, slug, sub_category_id')
                .eq('sub_category_id', subCategoryId)
                .order('name', { ascending: true }),
                
            window.supabaseClient
                .from('products')
                .select('family_id')
                .eq('sub_category_id', subCategoryId)
        ]);

        if (famRes.error) throw famRes.error;
        if (prodRes.error) throw prodRes.error;

        allFamilies = famRes.data || [];

        const familyCount = document.getElementById('familyCount');
        if (familyCount) familyCount.textContent = allFamilies.length;

        // ĐẾM PRODUCT
        productCounts = {};
        if (prodRes.data) {
            prodRes.data.forEach(product => {
                if (product.family_id) {
                    productCounts[product.family_id] = (productCounts[product.family_id] || 0) + 1;
                }
            });
        }

        // UPDATE SEO & BREADCRUMB
        if (subCatInfo) {
            const name = subCatInfo.name;
            if (title) title.textContent = name;
            if (bcSubCategory) bcSubCategory.textContent = name;
            document.title = `${name} - Dòng sản phẩm | MRO Khang Nam`;
        }

        skeleton?.classList.add('is-hidden');

        if (allFamilies.length === 0) {
            emptyState?.classList.remove('is-hidden');
            return;
        }

        container?.classList.remove('is-hidden');
        renderFamilies(allFamilies);

    } catch (error) {
        console.error('Lỗi fetchFamilies:', error);
        skeleton?.classList.add('is-hidden');
        container?.classList.remove('is-hidden');
        if (container) {
            container.innerHTML = `<div class="subcategory-error text-red-500 font-bold p-4 text-center">Lỗi kết nối: ${escapeHTML(error.message)}</div>`;
        }
    }
}

function renderFamilies(dataList) {
    const container = document.getElementById('familyContainer');
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

    dataList.forEach((fam) => {
        const pCount = productCounts[fam.id] || 0;
        const slug = fam?.slug ? String(fam.slug).trim() : '';
        const targetUrl = slug 
            ? (isLocal ? `/pages/products.html?slug=${encodeURIComponent(slug)}` : `/${encodeURIComponent(slug)}.html`) 
            : '#';

        html += `
            <a href="${targetUrl}" class="subcategory-card" aria-label="Xem dòng sản phẩm ${escapeHTML(fam.name)}">
                <div class="subcategory-card-overlay"></div>
                <h2 class="subcategory-card-title text-center mt-2">${escapeHTML(fam.name)}</h2>
                <span class="subcategory-card-count text-center block mt-1">${pCount} sản phẩm</span>
            </a>
        `;
    });

    container.innerHTML = html;
}

// LIVE SEARCH
const searchInput = document.getElementById('searchFamily');
searchInput?.addEventListener('input', function (event) {
    const keyword = event.target.value.toLowerCase().trim();
    if (!keyword) {
        renderFamilies(allFamilies);
        return;
    }
    const filtered = allFamilies.filter(f => f.name && f.name.toLowerCase().includes(keyword));
    renderFamilies(filtered);
});

function escapeHTML(value) {
    if (value === null || value === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', async () => {
    await fetchFamilies();
    if (typeof checkCustomerAuth === 'function') {
        try {
            const user = await checkCustomerAuth();
            if (user) {
                document.getElementById('btnGuestLogin')?.classList.add('is-hidden');
                document.getElementById('btnUserProfile')?.classList.remove('is-hidden');
            }
        } catch (error) {}
    }
});