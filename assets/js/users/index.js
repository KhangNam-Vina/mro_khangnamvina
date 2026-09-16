// ========================================================
// FILE: assets/js/users/index.js
// TRANG CHỦ MRO KHANG NAM
// ========================================================

let HOMEPAGE_SETTINGS = {};

// ========================================================
// 1. TẢI CẤU HÌNH HOMEPAGE TỪ SUPABASE
// ========================================================
async function loadHomepageSettings() {
    try {
        const { data, error } = await window.supabaseClient.from('homepage_settings').select('*').order('display_order', { ascending: true });
        if (error) throw error;
        HOMEPAGE_SETTINGS = {};
        (data || []).forEach(setting => { HOMEPAGE_SETTINGS[setting.section_key] = setting; });
        return HOMEPAGE_SETTINGS;
    } catch (error) {
        console.error('[HOMEPAGE SETTINGS] Lỗi:', error);
        HOMEPAGE_SETTINGS = {};
        return HOMEPAGE_SETTINGS;
    }
}

function getHomepageSetting(sectionKey) { return HOMEPAGE_SETTINGS[sectionKey] || null; }
function isHomepageSectionActive(sectionKey) { const setting = getHomepageSetting(sectionKey); return setting ? setting.is_active !== false : true; }
function getHomepageItemLimit(sectionKey, fallback = 20) { const setting = getHomepageSetting(sectionKey); return (setting && Number(setting.item_limit) > 0) ? Number(setting.item_limit) : fallback; }

function applySectionUI(sectionKey, sectionId, titleId, descId) {
    const sectionEl = document.getElementById(sectionId);
    if (!sectionEl) return false;
    if (!isHomepageSectionActive(sectionKey)) { sectionEl.style.display = 'none'; return false; }
    
    sectionEl.style.display = '';
    const setting = getHomepageSetting(sectionKey);
    if (setting) {
        if (titleId) { const titleEl = document.getElementById(titleId); if (titleEl && setting.title) titleEl.textContent = setting.title; }
        if (descId) { const descEl = document.getElementById(descId); if (descEl && setting.description) descEl.textContent = setting.description; }
    }
    return true;
}

// ========================================================
// 2. HERO BANNER
// ========================================================
function applyHeroSettings() {
    const section = document.getElementById('heroSection');
    if (!section) return;
    if (!isHomepageSectionActive('hero')) { section.style.display = 'none'; return; }
    section.style.display = '';

    const setting = getHomepageSetting('hero');
    const config = setting?.config || {};

    const badgeEl = document.getElementById('heroBadge'); if (badgeEl) badgeEl.textContent = config.badge || 'ĐỐI TÁC CUNG ỨNG MRO';
    const titleEl = document.getElementById('heroTitleText'); if (titleEl) titleEl.textContent = setting?.title || 'Một nhà cung cấp';
    const highlightEl = document.getElementById('heroHighlight'); if (highlightEl) highlightEl.textContent = config.highlight || 'Mọi thứ bạn cần';
    const descEl = document.getElementById('heroDesc'); if (descEl) descEl.textContent = setting?.description || '';
    const imgEl = document.getElementById('heroImage'); if (imgEl && config.image_path) imgEl.src = buildIndexImageUrl(config.image_path);

    const uspsEl = document.getElementById('heroUsps');
    if (uspsEl && Array.isArray(config.usps)) {
        uspsEl.innerHTML = config.usps.filter(usp => usp.title).map(usp => `<div class="home-hero-usp"><strong>${escapeIndexHTML(usp.title)}</strong><span>${escapeIndexHTML(usp.description || '')}</span></div>`).join('');
    }
}

// ========================================================
// 3. MAIN CATEGORIES (Đã ráp Logic Tick Chọn)
// ========================================================
async function loadMainCategories() {
    if (!applySectionUI('categories', 'categoriesSection', 'categoriesTitleText', null)) return;
    const grid = document.getElementById("categoryGrid");
    try {
        const setting = getHomepageSetting('categories');
        const selectedIds = setting?.config?.selected_items || [];
        const itemLimit = getHomepageItemLimit('categories', 20);
        
        let query = window.supabaseClient.from('categories').select('*, sub_categories(*)').eq('is_active', true);
        if (selectedIds.length > 0) { query = query.in('id', selectedIds); } 
        else { query = query.limit(itemLimit); }
        query = query.order('name', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;
        
        const subCategoryLimit = Number(setting?.config?.sub_category_limit) > 0 ? Number(setting.config.sub_category_limit) : 4;
        let html = '';
        (data || []).forEach(cat => {
            const sortedSub = Array.isArray(cat.sub_categories) ? [...cat.sub_categories].sort((a,b) => a.name.localeCompare(b.name)) : [];
            let subHTML = sortedSub.slice(0, subCategoryLimit).map(sub => `<li class="category-item"><span class="category-dot"></span><a href="pages/family.html?slug=${encodeURIComponent(sub.slug)}" class="category-link">${escapeIndexHTML(sub.name)}</a></li>`).join('');
            const initials = String(cat.name||'').trim().split(/\s+/).slice(0, 3).map(w => w[0]).join('').toUpperCase();
            html += `<div class="category-card"><div class="category-watermark">${escapeIndexHTML(initials)}</div><div class="category-header"><h3 class="category-title"><a href="pages/subcategory.html?slug=${encodeURIComponent(cat.slug)}" class="category-title-link">${escapeIndexHTML(cat.name)}</a></h3><div class="category-divider"></div></div><ul class="category-list">${subHTML}</ul></div>`;
        });
        grid.innerHTML = html;
    } catch (error) { console.error("Lỗi tải Category:", error); }
}

// ========================================================
// 4. BRANDS (Đã ráp Logic Tick Chọn)
// ========================================================
async function loadBrandsToMarquee() {
    if (!applySectionUI('brands', 'brandsSection', 'brandsTitleText', null)) return;
    const container = document.getElementById('brandScrollContainer');
    try {
        const setting = getHomepageSetting('brands');
        const selectedIds = setting?.config?.selected_items || [];
        const itemLimit = getHomepageItemLimit('brands', 50);

        let query = window.supabaseClient.from('brands').select('*');
        if (selectedIds.length > 0) { query = query.in('id', selectedIds); } 
        else { query = query.limit(itemLimit); }
        query = query.order('name', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;
        
        let html = (data || []).map(b => `<a href="pages/products.html?brand_id=${b.id}" class="brand-link">${escapeIndexHTML(b.name)}</a>`).join('');
        container.innerHTML = `<div class="brand-track-group">${html}</div><div class="brand-track-group" aria-hidden="true">${html}</div>`;
        initDragAndScroll('brandScrollContainer', 1.5);
    } catch (error) { console.error("Lỗi Brand:", error); }
}

const INDEX_IMAGE_CDN_BASE = "https://mrokhangnam-image.khangnamvn.workers.dev";
function buildIndexImageUrl(imagePath) {
    if (!imagePath) return "assets/images/world mark.png";
    const p = String(imagePath).trim();
    if (!p) return "assets/images/world mark.png";
    if (/^https?:\/\//i.test(p)) return p;
    if (p.startsWith('assets/')) return p;
    return `${INDEX_IMAGE_CDN_BASE}/${p.replace(/^\/+/, "")}`;
}

const INDEX_PRODUCT_LIMIT = 20;

async function fetchProductsByCategory(categoryId = null, limit = INDEX_PRODUCT_LIMIT) {
    let q = window.supabaseClient.from('products').select(`id, sku, name, slug, image_path, unit, category_id, stock_quantity, price, discount_price, badge, created_at, brands(name)`).order('created_at', { ascending: false }).limit(limit);
    if (categoryId) q = q.eq('category_id', categoryId);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
}

function renderIndexProductCard(item) {
    const brandName = item.brands ? item.brands.name : 'OEM';
    let leftBadgeHTML = item.badge ? `<span class="product-badge product-badge-custom">${escapeIndexHTML(item.badge)}</span>` : '';
    let rightBadgeHTML = (item.discount_price && item.price && item.discount_price < item.price) ? 
        `<span class="product-badge product-badge-sale">GIẢM ${Math.round(((item.price - item.discount_price)/item.price)*100)}%</span>` : 
        (item.stock_quantity <= 0 ? `<span class="product-badge product-badge-preorder">Pre-order</span>` : `<span class="product-badge product-badge-stock">Có sẵn</span>`);

    return `
        <div class="product-card" data-product-slug="${escapeIndexHTML(item.slug || '')}">
            <div class="product-image-link">
                ${leftBadgeHTML}${rightBadgeHTML}
                <img src="${escapeIndexHTML(buildIndexImageUrl(item.image_path))}" alt="${escapeIndexHTML(item.name)}" class="product-img" loading="lazy" onerror="this.src='assets/images/world mark.png';">
            </div>
            <div class="product-info">
                <div class="product-brand">${escapeIndexHTML(brandName)}</div>
                <div class="product-name" title="${escapeIndexHTML(item.name)}">${escapeIndexHTML(item.name)}</div>
                <div class="product-meta"><div class="product-sku">SKU: ${escapeIndexHTML(item.sku)}</div><div class="product-unit">${escapeIndexHTML(item.unit || 'Cái')}</div></div>
            </div>
        </div>
    `;
}

function renderProductSlider(containerId, products) {
    const c = document.getElementById(containerId);
    if (!c) return;
    if (!products || products.length === 0) { c.innerHTML = '<p class="empty-msg">Chưa có sản phẩm.</p>'; return; }
    const html = products.map(renderIndexProductCard).join('');
    c.innerHTML = `<div class="product-slider-track">${html}</div><div class="product-slider-track" aria-hidden="true">${html}</div>`;
    if (typeof initDragAndScroll === 'function') initDragAndScroll(containerId, 1.5);
}

function bindProductSliderClick(containerId) {
    const slider = document.getElementById(containerId);
    if (!slider || slider.dataset.clickBound) return;
    slider.dataset.clickBound = 'true';
    slider.addEventListener('click', function(e) {
        if (slider.isDraggingActive || e.target.closest('a') || e.target.closest('button')) return;
        const card = e.target.closest('.product-card');
        if (card && card.dataset.productSlug) {
            window.location.href = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                ? `pages/product-detail.html?slug=${encodeURIComponent(card.dataset.productSlug)}` 
                : `/${encodeURIComponent(card.dataset.productSlug)}.html`;
        }
    });
}

// ========================================================
// 5. LOAD BEST SELLER
// ========================================================
async function loadBestSellers() {
    if (!applySectionUI('best_selling', 'bestSellingSection', 'bestSellingTitleText', 'bestSellingDescText')) return;
    try {
        const limit = getHomepageItemLimit('best_selling', INDEX_PRODUCT_LIMIT);
        const { data: salesData } = await window.supabaseClient.from('product_sales_stats').select('product_id').order('sales_quantity', { ascending: false }).limit(limit);
        
        let products = [];
        if (salesData && salesData.length > 0) {
            const pIds = salesData.map(s => s.product_id);
            const { data } = await window.supabaseClient.from('products').select(`id, sku, name, slug, image_path, unit, category_id, stock_quantity, price, discount_price, badge, created_at, brands(name)`).in('id', pIds);
            products = data || [];
        }

        const setting = getHomepageSetting('best_selling');
        if (products.length === 0 && setting?.config?.fallback_enabled !== false) {
            const { data } = await window.supabaseClient.from('products').select(`id, sku, name, slug, image_path, unit, category_id, stock_quantity, price, discount_price, badge, created_at, brands(name)`).gt('stock_quantity', 0).order('created_at', { ascending: false }).limit(limit);
            products = data || [];
        }

        renderProductSlider('bestSellingGrid', products);
        bindProductSliderClick('bestSellingGrid');
    } catch (error) { console.error('Lỗi tải Best Seller:', error); }
}

// ========================================================
// 6. LOAD SHOWCASE 1 & 2
// ========================================================
async function loadCategoryShowcase(sectionNumber) {
    const settingKey = `category_showcase_${sectionNumber}`;
    const sectionId = `topCategorySection${sectionNumber}`;
    const titleId = `topCategoryTitle${sectionNumber}`;
    const descId = `topCategoryDesc${sectionNumber}`;
    
    const sectionEl = document.getElementById(sectionId);
    if (!isHomepageSectionActive(settingKey)) { if(sectionEl) sectionEl.style.display = 'none'; return; }
    if(sectionEl) sectionEl.style.display = '';

    const setting = getHomepageSetting(settingKey);
    let targetCatId = setting?.source_id;
    let targetCatName = "Danh Mục Nổi Bật";
    let targetCatSlug = "";

    try {
        if (targetCatId) {
            const { data } = await window.supabaseClient.from('categories').select('*').eq('id', targetCatId).single();
            if (data) { targetCatName = data.name; targetCatSlug = data.slug; }
        } else {
            const { data } = await window.supabaseClient.from('categories').select(`id, name, slug, products(id)`);
            if (data && data.length > 0) {
                const sorted = data.sort((a,b) => (b.products?.length || 0) - (a.products?.length || 0));
                const target = sorted[sectionNumber - 1] || sorted[0];
                targetCatId = target.id; targetCatName = target.name; targetCatSlug = target.slug;
            }
        }

        const titleEl = document.getElementById(titleId); if (titleEl) titleEl.textContent = setting?.title || targetCatName;
        const descEl = document.getElementById(descId); if (descEl) descEl.textContent = setting?.description || `Khám phá các sản phẩm nổi bật trong danh mục ${targetCatName}.`;
        const catUrl = `pages/subcategory.html?slug=${encodeURIComponent(targetCatSlug)}`;
        document.getElementById(`topCategoryLink${sectionNumber}`)?.setAttribute('href', catUrl);
        document.getElementById(`topCategoryMobileLink${sectionNumber}`)?.setAttribute('href', catUrl);

        const gridId = `topCategoryGrid${sectionNumber}`;
        const limit = getHomepageItemLimit(settingKey, INDEX_PRODUCT_LIMIT);
        const products = await fetchProductsByCategory(targetCatId, limit);
        renderProductSlider(gridId, products);
        bindProductSliderClick(gridId);

    } catch (error) { console.error(`Lỗi tải Showcase ${sectionNumber}:`, error); }
}

// ========================================================
// 7. INDUSTRIES (Đã ráp Logic Tick Chọn)
// ========================================================
async function loadIndustries() {
    if (!applySectionUI('industries', 'industriesSection', 'industriesTitleText', null)) return;
    const container = document.getElementById('industriesGrid');
    try {
        const setting = getHomepageSetting('industries');
        const selectedIds = setting?.config?.selected_items || [];
        const limit = getHomepageItemLimit('industries', 6);

        let query = window.supabaseClient.from('industries').select('*').neq('is_active', false);
        if (selectedIds.length > 0) { query = query.in('id', selectedIds); } 
        else { query = query.limit(limit); }
        query = query.order('id', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;

        const defaultIcons = ['🏭','🍜','⚡','🏗️','🚗','🧪','⛏️','🏥','⚙️','🔧','📦','💻'];
        let html = (data || []).map((item, index) => {
            const iconHtml = item.icon_url ? `<img src="${escapeIndexHTML(item.icon_url)}" class="industry-icon-img">` : `<div class="industry-icon-fallback">${defaultIcons[index % defaultIcons.length]}</div>`;
            return `<a href="pages/products.html?industry_id=${item.id}" class="industry-card"><div class="industry-icon-wrapper">${iconHtml}</div><h3 class="industry-name">${escapeIndexHTML(item.name)}</h3></a>`;
        }).join('');
        container.innerHTML = html;
    } catch (error) { console.error("Lỗi tải Industries:", error); }
}

// ========================================================
// 8. BLOG (Đã ráp Logic Tick Chọn)
// ========================================================
async function loadHomeBlogs() {
    if (!applySectionUI('blog', 'blogSection', 'blogTitleText', null)) return;
    const container = document.getElementById('homeBlogGrid');
    try {
        const setting = getHomepageSetting('blog');
        const selectedIds = setting?.config?.selected_items || [];
        const limit = getHomepageItemLimit('blog', 3);

        let query = window.supabaseClient.from('blogs').select(`id, title, slug, thumbnail`).eq('is_active', true);
        if (selectedIds.length > 0) { query = query.in('id', selectedIds); } 
        else { query = query.limit(limit); }
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        
        container.innerHTML = (data || []).map(post => `
            <article class="blog-card">
                <a href="pages/blog-detail.html?slug=${encodeURIComponent(post.slug)}" class="blog-img-link"><img src="${escapeIndexHTML(post.thumbnail || 'https://via.placeholder.com/600x400')}" class="blog-img"></a>
                <div class="blog-content"><div class="blog-tag">Tin Tức MRO</div><a href="pages/blog-detail.html?slug=${encodeURIComponent(post.slug)}" class="blog-title">${escapeIndexHTML(post.title)}</a><a href="pages/blog-detail.html?slug=${encodeURIComponent(post.slug)}" class="blog-read-more">Xem chi tiết <span>→</span></a></div>
            </article>
        `).join('');
    } catch (error) { console.error("Lỗi tải blog:", error); }
}

function escapeIndexHTML(value) {
    if (value === null || value === undefined) return '';
    const div = document.createElement('div'); div.textContent = String(value); return div.innerHTML;
}

window.scrollProductSection = function(sliderId, amount) {
    const slider = document.getElementById(sliderId); if (!slider) return;
    slider.style.scrollBehavior = 'smooth'; slider.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(() => { slider.style.scrollBehavior = 'auto'; }, 400);
};

function initDragAndScroll(sliderId, speed = 1) {
    const slider = document.getElementById(sliderId); if (!slider) return;
    if (slider._cancelSlider) slider._cancelSlider(); slider.style.scrollBehavior = 'auto';
    let animationFrame = null, resizeObserver = null, isPointerDown = false, isDragging = false, isHovering = false, startX = 0, startScrollLeft = 0, loopWidth = 0;
    const DRAG_THRESHOLD = 8, DRAG_SPEED = 1.5; slider.isDraggingActive = false;
    const calculateLoopWidth = () => { const tracks = slider.querySelectorAll('.product-slider-track, .brand-track-group'); if (tracks.length < 2) { loopWidth = 0; return; } loopWidth = tracks[1].offsetLeft - tracks[0].offsetLeft; if (loopWidth <= 0) loopWidth = tracks[0].scrollWidth; };
    const normalizeScroll = () => { if (!loopWidth || loopWidth <= 0) return; if (slider.scrollLeft >= loopWidth) slider.scrollLeft -= loopWidth; else if (slider.scrollLeft <= 0) slider.scrollLeft += loopWidth; };
    const animate = () => { if (!isPointerDown && !isHovering && loopWidth > 0) { slider.scrollLeft += speed; normalizeScroll(); } animationFrame = requestAnimationFrame(animate); };
    const onPointerDown = e => { if (e.pointerType === 'mouse' && e.button !== 0) return; isPointerDown = true; isDragging = false; slider.isDraggingActive = false; startX = e.clientX; startScrollLeft = slider.scrollLeft; slider.style.cursor = 'grabbing'; slider.style.scrollBehavior = 'auto'; };
    const onPointerMove = e => { if (!isPointerDown) return; const distance = e.clientX - startX; if (!isDragging) { if (Math.abs(distance) < DRAG_THRESHOLD) return; isDragging = true; slider.isDraggingActive = true; slider.setPointerCapture?.(e.pointerId); } e.preventDefault(); slider.scrollLeft = startScrollLeft - (distance * DRAG_SPEED); normalizeScroll(); };
    const stopDragging = e => { if (!isPointerDown) return; isPointerDown = false; const wasDragging = isDragging; isDragging = false; slider.style.cursor = 'grab'; if (wasDragging) { slider.isDraggingActive = true; try { slider.releasePointerCapture?.(e?.pointerId); } catch(err){} setTimeout(() => { slider.isDraggingActive = false; }, 150); } else { slider.isDraggingActive = false; } };
    const onPointerCancel = e => { isPointerDown = false; isDragging = false; slider.isDraggingActive = false; slider.style.cursor = 'grab'; try { slider.releasePointerCapture?.(e?.pointerId); } catch(err){} };
    slider.addEventListener('pointerdown', onPointerDown); slider.addEventListener('pointermove', onPointerMove, { passive: false }); slider.addEventListener('pointerup', stopDragging); slider.addEventListener('pointercancel', onPointerCancel); slider.addEventListener('mouseenter', () => isHovering = true); slider.addEventListener('mouseleave', () => isHovering = false);
    slider.querySelectorAll('img').forEach(el => { el.setAttribute('draggable', 'false'); el.addEventListener('dragstart', e => e.preventDefault()); });
    calculateLoopWidth(); animationFrame = requestAnimationFrame(animate); slider.style.cursor = 'grab'; slider.style.userSelect = 'none';
    resizeObserver = new ResizeObserver(() => { calculateLoopWidth(); normalizeScroll(); }); resizeObserver.observe(slider);
    slider._cancelSlider = () => { if (animationFrame) cancelAnimationFrame(animationFrame); if (resizeObserver) resizeObserver.disconnect(); slider.removeEventListener('pointerdown', onPointerDown); slider.removeEventListener('pointermove', onPointerMove); slider.removeEventListener('pointerup', stopDragging); slider.removeEventListener('pointercancel', onPointerCancel); slider.removeEventListener('mouseenter', () => isHovering = true); slider.removeEventListener('mouseleave', () => isHovering = false); };
}

window.onload = async function() {
    await loadHomepageSettings();
    applyHeroSettings();
    await Promise.all([ loadMainCategories(), loadBrandsToMarquee(), loadBestSellers(), loadCategoryShowcase(1), loadCategoryShowcase(2), loadHomeBlogs(), loadIndustries() ]);
    if (typeof checkCustomerAuth === "function") {
        try { const user = await checkCustomerAuth(); if (user) { document.getElementById("btnGuestLogin")?.classList.add("d-none"); document.getElementById("btnUserProfile")?.classList.remove("d-none"); } } 
        catch (error) { console.error("Lỗi xác thực:", error); }
    }
};