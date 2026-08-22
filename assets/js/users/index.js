// ========================================================
// FILE: assets/js/users/index.js
// XỬ LÝ LOGIC TRANG CHỦ - STATIC CSS
// ========================================================



// ----------------------------------------------------
// 1. TẢI DANH MỤC GỐC & DANH MỤC CON
// ----------------------------------------------------
async function loadMainCategories() {
    const grid = document.getElementById("categoryGrid");
    if (!grid) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('categories')
            .select('*, sub_categories(*)')
            .order('id', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) {
            grid.innerHTML = '<p class="cat-empty" style="grid-column: 1/-1; text-align: center;">Chưa có danh mục nào trong kho!</p>';
            return;
        }

        let html = '';
        data.forEach((cat) => {
            let subCatListHTML = '';
            
            if (cat.sub_categories && cat.sub_categories.length > 0) {
                const limitSubs = cat.sub_categories.slice(0, 4);
                
                limitSubs.forEach(sub => {
                    subCatListHTML += `
                        <li class="category-item">
                            <span class="category-dot"></span>
                            <a href="pages/products.html?sub_category_id=${sub.id}" class="category-link" title="${sub.name}">
                                ${sub.name}
                            </a>
                        </li>
                    `;
                });
                
                if (cat.sub_categories.length > 4) {
                    subCatListHTML += `
                        <li class="category-item" style="margin-top: 16px;">
                            <a href="pages/products.html?category_id=${cat.id}" class="category-view-all">
                                + Xem tất cả (${cat.sub_categories.length})
                            </a>
                        </li>
                    `;
                }
            } else {
                subCatListHTML = '<li class="cat-empty">Đang cập nhật...</li>';
            }

            const initials = cat.name.trim().split(/\s+/).slice(0, 3).map(w => w[0]).join('').toUpperCase();

            html += `
                <div class="category-card" onclick="window.location.href='pages/products.html?category_id=${cat.id}'">
                    <div class="category-watermark">${initials}</div>
                    <div class="category-header">
                        <h3 class="category-title">${cat.name}</h3>
                        <div class="category-divider"></div>
                    </div>
                    <ul class="category-list">
                        ${subCatListHTML}
                    </ul>
                </div>
            `;
        });
        
        grid.innerHTML = html;
    } catch (error) {
        grid.innerHTML = `<p class="cat-empty" style="grid-column: 1/-1; text-align: center; color: red;">Lỗi mạng: ${error.message}</p>`;
    }
}

// ----------------------------------------------------
// 2. KÉO THƯƠNG HIỆU CUỘN
// ----------------------------------------------------
async function loadBrandsToMarquee() {
    const container = document.getElementById('brandScrollContainer');
    try {
        const { data, error } = await supabaseClient.from('brands').select('*');
        if (error) throw error;
        if (data.length === 0) {
            container.innerHTML = '<span class="brand-marquee-loading">Chưa có thương hiệu nào.</span>';
            return;
        }

        let brandItemsHTML = '';
        data.forEach(brand => {
            brandItemsHTML += `
                <a href="pages/products.html?brand_id=${brand.id}" class="brand-link">
                    ${brand.name}
                </a>
            `;
        });

        container.innerHTML = `
            <div class="brand-track-group">${brandItemsHTML}</div>
            <div class="brand-track-group" aria-hidden="true">${brandItemsHTML}</div>
        `;
        initDragAndScroll('brandScrollContainer', 1.5);
    } catch (error) {
        container.innerHTML = `<span class="brand-marquee-loading" style="color:#fca5a5;">Lỗi tải dữ liệu: ${error.message}</span>`;
    }
}

/* ----------------------------------------------------
   PRODUCT IMAGE CDN
---------------------------------------------------- */

const INDEX_IMAGE_CDN_BASE =
    "https://mrokhangnam-image.khangnamvn.workers.dev";

function buildIndexImageUrl(imagePath) {

    if (!imagePath) {
        return "../assets/images/world mark.png";
    }

    const cleanPath =
        String(imagePath).trim();

    if (!cleanPath) {
        return "../assets/images/world mark.png";
    }

    // Nếu dữ liệu cũ còn URL đầy đủ thì giữ nguyên,
    // tránh làm hỏng ảnh trong giai đoạn chuyển đổi.
    if (/^https?:\/\//i.test(cleanPath)) {
        return cleanPath;
    }

    return `${INDEX_IMAGE_CDN_BASE}/${cleanPath.replace(/^\/+/, "")}`;
}

// ----------------------------------------------------
// 3. KÉO SẢN PHẨM BÁN CHẠY
// ----------------------------------------------------
async function loadBestSellers(filterKeyword = 'ALL') {
    const container = document.getElementById('bestSellingGrid');
    
    container.innerHTML = `
        <div class="product-slider-track">
            <div class="product-skeleton"><div class="skel-img"></div><div class="skel-line w-1-3 mb-2"></div><div class="skel-line w-full mb-2"></div><div class="skel-line w-2-3 mb-auto"></div><div class="skel-btn"></div></div>
            <div class="product-skeleton"><div class="skel-img"></div><div class="skel-line w-1-3 mb-2"></div><div class="skel-line w-full mb-2"></div><div class="skel-line w-2-3 mb-auto"></div><div class="skel-btn"></div></div>
            <div class="product-skeleton hidden-mobile"><div class="skel-img"></div><div class="skel-line w-1-3 mb-2"></div><div class="skel-line w-full mb-2"></div><div class="skel-line w-2-3 mb-auto"></div><div class="skel-btn"></div></div>
            <div class="product-skeleton hidden-tablet"><div class="skel-img"></div><div class="skel-line w-1-3 mb-2"></div><div class="skel-line w-full mb-2"></div><div class="skel-line w-2-3 mb-auto"></div><div class="skel-btn"></div></div>
        </div>
    `;

    try {
        let query = window.supabaseClient
            .from('products')
            .select('id, sku, name, image_path, unit, category_id, brands(name)')
            .order('created_at', { ascending: false });

        // ĐÃ FIX: Lọc chính xác theo category_id thay vì tìm trong tên sản phẩm
        if (filterKeyword !== 'ALL') {
            query = query.eq('category_id', filterKeyword);
        }

        const { data, error } = await query.limit(8);

        if (error) throw error;
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="empty-msg">Chưa có sản phẩm nào cho danh mục này.</p>';
            return;
        }

        let productItemsHTML = '';
        
       data.forEach(item => {

    const brandName =
        item.brands
            ? item.brands.name
            : 'OEM';

    const safeSku =
        item.sku
            ? item.sku.replace(/'/g, "\\'").replace(/"/g, '&quot;')
            : 'NO-SKU';

    const safeName =
        item.name
            ? item.name.replace(/'/g, "\\'").replace(/"/g, '&quot;')
            : 'Sản phẩm';

    const safeBrand =
        brandName
            .replace(/'/g, "\\'")
            .replace(/"/g, '&quot;');

    const safeUnit =
        item.unit
            ? item.unit.replace(/'/g, "\\'").replace(/"/g, '&quot;')
            : 'Cái';

    const productImage =
        buildIndexImageUrl(item.image_path);

    productItemsHTML += `
        <div class="product-card">

            <a
                href="pages/product-detail.html?id=${item.id}"
                class="product-image-link"
            >
                <span class="product-badge-stock">
                    In Stock
                </span>

                <img
                    src="${productImage}"
                    alt="${item.name}"
                    class="product-img"
                    loading="lazy"
                >
            </a>

            <div class="product-info">

                <div class="product-brand">
                    ${brandName}
                </div>

                <a
                    href="pages/product-detail.html?id=${item.id}"
                    class="product-name"
                    title="${item.name}"
                >
                    ${item.name}
                </a>

                <div class="product-meta">

                    <div class="product-sku">
                        SKU: ${item.sku}
                    </div>

                    <br>

                    <div class="product-unit">
                        ${item.unit || 'Cái'}
                    </div>

                </div>

            </div>

            <button
                onclick="addToRFQCartFromIndex(
                    '${safeSku}',
                    '${safeName}',
                    '${safeBrand}',
                    '${safeUnit}'
                )"
                class="product-btn-add"
            >
                Thêm vào Yêu cầu
            </button>

        </div>
    `;
});

        container.innerHTML = `
            <div class="product-slider-track">${productItemsHTML}</div>
            <div class="product-slider-track" aria-hidden="true">${productItemsHTML}</div>
        `;
        initDragAndScroll('bestSellingGrid', 2);
    } catch (error) {
        container.innerHTML = `<p class="empty-msg" style="color:red;">Lỗi lấy dữ liệu: ${error.message}</p>`;
    }
}

// ----------------------------------------------------
// 4. TẠO TABS ĐỘNG
// ----------------------------------------------------
async function initBestSellerTabs() {
    const tabsContainer = document.getElementById('bestSellerTabs');
    if (!tabsContainer) return;

    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('id, name, products(id)');

        if (error) throw error;

        const topCategories = data
            .map(cat => ({
                id: cat.id,
                name: cat.name,
                count: cat.products ? cat.products.length : 0
            }))
            .filter(cat => cat.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);

        let html = `<button type="button" data-filter="ALL" class="home-tab-btn is-active">ALL</button>`;

        topCategories.forEach(cat => {
            html += `<button type="button" data-filter="${cat.id}" class="home-tab-btn">${cat.name}</button>`;
        });

        tabsContainer.innerHTML = html;

        const tabs = tabsContainer.querySelectorAll('.home-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('is-active'));
                
                const clickedBtn = e.currentTarget;
                clickedBtn.classList.add('is-active');

                const filterValue = clickedBtn.getAttribute('data-filter');
                if (typeof loadBestSellers === 'function') {
                    loadBestSellers(filterValue);
                }
            });
        });

        const btnAll = tabsContainer.querySelector('[data-filter="ALL"]');
        if (btnAll && typeof loadBestSellers === 'function') {
            loadBestSellers('ALL');
        }

    } catch (error) {
        console.error("Lỗi tải Tabs Best Seller:", error);
        tabsContainer.innerHTML = '<span style="font-size:12px; color:red;">Lỗi tải bộ lọc</span>';
    }
}

// ----------------------------------------------------
// 5. THÊM VÀO GIỎ TỪ TRANG CHỦ
// ----------------------------------------------------
function addToRFQCartFromIndex(sku, name, brand, unit) {
    try {
        let cart = JSON.parse(localStorage.getItem('mro_rfq_cart')) || [];
        if (!Array.isArray(cart)) cart = [];

        let existingItem = cart.find(item => item.sku === sku);
        
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({ sku: sku, name: name, brand: brand, unit: unit, qty: 1 });
        }

        localStorage.setItem('mro_rfq_cart', JSON.stringify(cart));
        window.location.href = 'pages/rfq.html';
        
    } catch (err) {
        console.error("Lỗi giỏ hàng:", err);
        alert("Có lỗi xảy ra khi thêm vào giỏ. Vui lòng xóa lịch sử web và thử lại.");
    }
}

// ----------------------------------------------------
// 6. XỬ LÝ KÉO VÀ CUỘN
// ----------------------------------------------------
function initDragAndScroll(containerId, speed = 0.8) {
    const slider = document.getElementById(containerId);
    if (!slider) return;

    if (slider.scrollInterval) {
        clearInterval(slider.scrollInterval);
    }

    slider.querySelectorAll('img, a, button').forEach(el => {
        el.ondragstart = (e) => e.preventDefault();
    });

    const startAutoScroll = () => {
        if (slider.scrollInterval) clearInterval(slider.scrollInterval);
        slider.scrollInterval = setInterval(() => {
            slider.scrollLeft += speed;
            if (slider.children[0] && slider.scrollLeft >= slider.children[0].offsetWidth) {
                slider.scrollLeft = 0;
            }
        }, 30);
    };

    const stopAutoScroll = () => {
        if (slider.scrollInterval) clearInterval(slider.scrollInterval);
    };

    startAutoScroll();

    if (slider.dataset.hasDragEvents === 'true') {
        return; 
    }
    slider.dataset.hasDragEvents = 'true';

    let isDown = false;
    let isDragging = false; 
    let startX;
    let scrollLeft;

    slider.addEventListener('click', (e) => {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
        }
    });

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        isDragging = false; 
        stopAutoScroll(); 
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        if (isDown) {
            isDown = false;
        }
        startAutoScroll();
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        startAutoScroll(); 
        setTimeout(() => { isDragging = false; }, 50);
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        isDragging = true; 

        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX); 
        
        let targetScroll = scrollLeft - walk;
        
        if (slider.children[0]) {
            const halfWidth = slider.children[0].offsetWidth;
            
            if (targetScroll <= 0) {
                targetScroll += halfWidth;
                scrollLeft += halfWidth; 
            } else if (targetScroll >= halfWidth) {
                targetScroll -= halfWidth;
                scrollLeft -= halfWidth; 
            }
        }
        
        slider.scrollLeft = targetScroll;
    });

    slider.addEventListener('mouseenter', () => {
        if (!isDown) stopAutoScroll();
    });

    slider.addEventListener('touchstart', stopAutoScroll, { passive: true });
    slider.addEventListener('touchend', startAutoScroll);
}

// ----------------------------------------------------
// 7. KÉO DỮ LIỆU BLOG
// ----------------------------------------------------
async function loadHomeBlogs() {
    const container = document.getElementById('homeBlogGrid');
    if (!container) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('blogs')
            .select('title, slug, thumbnail')
            .order('created_at', { ascending: false })
            .limit(3); 

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="cat-empty" style="grid-column: 1/-1; text-align: center;">Chưa có bài viết nào.</p>';
            return;
        }

        let html = '';
        data.forEach(post => {
            const imgUrl = post.thumbnail || 'https://via.placeholder.com/600x400?text=Tin+Tuc+MRO';
            
            html += `
            <article class="blog-card">
                <a href="pages/blog-detail.html?slug=${post.slug}" class="blog-img-link">
                    <img src="${imgUrl}" alt="${post.title}" class="blog-img">
                </a>
                <div class="blog-content">
                    <div class="blog-tag">Tin Tức MRO</div>
                    <a href="pages/blog-detail.html?slug=${post.slug}" class="blog-title" title="${post.title}">
                        ${post.title}
                    </a>
                    <a href="pages/blog-detail.html?slug=${post.slug}" class="blog-read-more">
                        Read more <span>→</span>
                    </a>
                </div>
            </article>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error("Lỗi tải blog trang chủ:", error);
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red; font-weight: bold;">Không thể tải tin tức.</p>`;
    }
}

// ----------------------------------------------------
// 8. KÉO DỮ LIỆU INDUSTRIES
// ----------------------------------------------------
async function loadIndustries() {
    const container = document.getElementById('industriesGrid');
    if (!container) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('industries')
            .select('*')
            .neq('is_active', false)
            .order('id', { ascending: true })
            .limit(6);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="cat-empty" style="grid-column: 1/-1; text-align: center;">Chưa có dữ liệu ngành nghề.</p>';
            return;
        }

        const defaultIcons = ['🏭', '🍜', '⚡', '🏗️', '🚗', '🧪', '⛏️', '🏥', '⚙️', '🔧', '📦', '💻'];

        let html = '';
        data.forEach((item, index) => {
            const fallbackIcon = defaultIcons[index % defaultIcons.length];
            const iconHtml = item.icon_url 
                ? `<img src="${item.icon_url}" alt="${item.name}" class="industry-icon-img">` 
                : `<div class="industry-icon-fallback">${fallbackIcon}</div>`;

            html += `
                <a href="pages/products.html?industry_id=${item.id}" class="industry-card">
                    <div class="industry-icon-wrapper">
                        ${iconHtml}
                    </div>
                    <h3 class="industry-name">${item.name}</h3>
                </a>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error("Lỗi tải Industries:", error);
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red; font-weight: bold;">Không thể tải danh sách ngành nghề.</p>`;
    }
}

// ----------------------------------------------------
// 9. INIT
// ----------------------------------------------------
window.onload = async function() {
    initBestSellerTabs();
    loadBestSellers();
    loadMainCategories();
    loadBrandsToMarquee();
    loadHomeBlogs();
    loadIndustries();
    
    if (typeof checkCustomerAuth === "function") {
        const user = await checkCustomerAuth();
        if (user) {
            document.getElementById("btnGuestLogin")?.classList.add("d-none");
            const userProfileBtn = document.getElementById("btnUserProfile");
            if (userProfileBtn) {
                userProfileBtn.classList.remove("d-none");
            }
        }
    }
};

window.scrollBestSellers = function(amount) {
    const slider = document.getElementById('bestSellingGrid');
    if (slider) {
        // 1. Tạm tắt auto-scroll ngay lập tức để không bị "đánh lộn"
        if (slider.scrollInterval) clearInterval(slider.scrollInterval);
        
        // 2. Chống lỗi bấm liên tục (Spam click)
        if (slider.resumeTimeout) clearTimeout(slider.resumeTimeout);

        // 3. Cuộn mượt mà sang trái/phải
        slider.scrollBy({
            left: amount,
            behavior: 'smooth'
        });

        // 4. Kích hoạt lại Auto-scroll sau 600ms (khi đã cuộn xong)
        slider.resumeTimeout = setTimeout(() => {
            slider.dispatchEvent(new Event('mouseleave'));
        }, 600);
    }
};