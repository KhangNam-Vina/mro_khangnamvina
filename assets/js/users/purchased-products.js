// ========================================================
// PURCHASED PRODUCTS LOGIC (CÓ PHÂN TRANG & FIX LỖI ẢNH)
// ========================================================
"use strict";

let allPurchasedProducts = [];
let currentFilteredProducts = []; // Danh sách đang hiển thị (sau khi tìm kiếm)
let currentPage = 1;
const itemsPerPage = 10; // Giới hạn 10 sản phẩm 1 trang

const PURCHASED_IMAGE_CDN_BASE = "https://mrokhangnam-image.khangnamvn.workers.dev";

// HÀM RÚT GỌN LẤY ẢNH (Bảo vệ JSON parse)
function buildPurchasedImageUrl(imagePath) {
    if (!imagePath) return "../assets/images/no-image.png";
    let cleanPath = String(imagePath).trim();
    if (!cleanPath) return "../assets/images/no-image.png";

    try {
        const parsed = JSON.parse(cleanPath);
        if (Array.isArray(parsed) && parsed.length > 0) {
            cleanPath = String(parsed[0]).trim();
        }
    } catch (e) {}

    if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
    return `${PURCHASED_IMAGE_CDN_BASE}/${cleanPath.replace(/^\/+/, "")}`;
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        let user = null;
        if (typeof Auth !== 'undefined' && typeof Auth.getCurrentUser === 'function') {
            user = await Auth.getCurrentUser();
        } else if (typeof checkCustomerAuth === 'function') {
            user = await checkCustomerAuth();
        } else if (window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getUser();
            user = data?.user;
        }

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        await loadSidebarProfile(user);
        await fetchPurchasedHistory(user.id);

        const searchInput = document.getElementById("searchPurchased");
        if (searchInput) searchInput.addEventListener("input", handlePurchasedSearch);

    } catch (error) {
        console.error("Lỗi khởi tạo:", error);
    }
});

function handlePurchasedSearch(event) {
    const keyword = String(event.target.value || "").toLowerCase().trim();
    currentPage = 1; // Reset về trang 1 khi tìm kiếm

    if (!keyword) { 
        currentFilteredProducts = [...allPurchasedProducts];
    } else {
        currentFilteredProducts = allPurchasedProducts.filter(p => 
            String(p.sku || "").toLowerCase().includes(keyword) || 
            String(p.name || "").toLowerCase().includes(keyword)
        );
    }
    
    renderProductPage();
}

async function fetchPurchasedHistory(userId) {
    const grid = document.getElementById("purchasedGrid");
    const emptyState = document.getElementById("emptyState");
    const countElement = document.getElementById("totalItemsCount");
    if (!grid) return;

    try {
        if (!window.supabaseClient) throw new Error("Chưa kết nối Supabase.");

        const { data: rfqs, error: rfqError } = await window.supabaseClient
            .from("rfqs").select("items").eq("user_id", userId);
        if (rfqError) throw rfqError;

        const skuList = [];
        (rfqs || []).forEach(order => {
            if (Array.isArray(order.items)) {
                order.items.forEach(item => { if (item?.sku) skuList.push(item.sku); });
            }
        });

        const uniqueSkus = [...new Set(skuList)];
        if (uniqueSkus.length === 0) {
            grid.innerHTML = "";
            emptyState?.classList.remove("is-hidden");
            if (countElement) countElement.textContent = "0";
            return;
        }

        const { data: products, error: productError } = await window.supabaseClient
            .from("products")
            .select("id, sku, name, price, discount_price, image_path, unit, brands(name)")
            .in("sku", uniqueSkus);
        if (productError) throw productError;

        allPurchasedProducts = Array.isArray(products) ? products : [];
        currentFilteredProducts = [...allPurchasedProducts];
        
        renderProductPage();

    } catch (error) {
        if (grid) grid.innerHTML = `<div class="purchased-message is-error">Lỗi tải dữ liệu. Vui lòng thử lại sau.</div>`;
    }
}

// LOGIC PHÂN TRANG
function renderProductPage() {
    const totalItems = currentFilteredProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Cập nhật số đếm
    const countElement = document.getElementById("totalItemsCount");
    if (countElement) countElement.textContent = totalItems;

    // Giữ vị trí trang hợp lệ
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = currentFilteredProducts.slice(startIndex, endIndex);

    renderProductGrid(pageItems);
    renderPaginationUI(totalItems, totalPages);
}

function renderProductGrid(products) {
    const grid = document.getElementById("purchasedGrid");
    const emptyState = document.getElementById("emptyState");
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `<div class="purchased-message">Không tìm thấy sản phẩm khớp với từ khóa.</div>`;
        emptyState?.classList.add("is-hidden");
        return;
    }

    emptyState?.classList.add("is-hidden");

    let html = "";
    products.forEach(item => {
        const brandName = item.brands?.name || "OEM";
        const hasDiscount = Number(item.discount_price) > 0 && Number(item.discount_price) < Number(item.price);
        const priceHTML = hasDiscount 
            ? `<span class="purchased-product-price is-sale">${formatCurrency(item.discount_price)}</span>`
            : `<span class="purchased-product-price">${item.price ? formatCurrency(item.price) : "Liên hệ"}</span>`;

        const productForCart = { id: item.id, sku: item.sku, name: item.name, brand: brandName, unit: item.unit || "Cái", qty: 1 };
        const productJSON = JSON.stringify(productForCart).replace(/'/g, "&#39;");
        const safeImage = escapeHTML(buildPurchasedImageUrl(item.image_path));
        const safeSku = escapeHTML(item.sku || "");
        const safeName = escapeHTML(item.name || "Sản phẩm");
        const safeBrand = escapeHTML(brandName);

        html += `
            <article class="purchased-product-card">
                <a href="product-detail.html?id=${encodeURIComponent(item.id)}" class="purchased-product-image">
                    <img src="${safeImage}" alt="${safeSku}" loading="lazy" onerror="this.src='../assets/images/no-image.png';">
                </a>
                <div class="purchased-product-body">
                    <div class="purchased-product-brand">${safeBrand}</div>
                    <a href="product-detail.html?id=${encodeURIComponent(item.id)}" class="purchased-product-name" title="${safeName}">${safeName}</a>
                    <div class="purchased-product-meta">
                        <span class="purchased-product-sku" title="${safeSku}">${safeSku}</span>
                        ${priceHTML}
                    </div>
                    <button type="button" class="purchased-reorder-button" onclick='reorderProduct(${productJSON})'>
                        <svg class="purchased-reorder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        Thêm vào RFQ
                    </button>
                </div>
            </article>
        `;
    });
    grid.innerHTML = html;
}

// VẼ NÚT PHÂN TRANG (Tương thích CSS tĩnh)
function renderPaginationUI(totalItems, totalPages) {
    const container = document.getElementById("purchasedPagination");
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    const baseBtnStyle = "padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s;";
    const activeBtnStyle = baseBtnStyle + " background: #00479b; color: #fff; border: 1px solid #00479b;";
    const inactiveBtnStyle = baseBtnStyle + " background: #fff; color: #4b5563; border: 1px solid #d1d5db;";
    const disabledBtnStyle = baseBtnStyle + " background: #f9fafb; color: #9ca3af; border: 1px solid #e5e7eb; cursor: not-allowed;";

    let html = "";

    // Nút "Trước"
    const prevStyle = currentPage === 1 ? disabledBtnStyle : inactiveBtnStyle;
    const prevDisabled = currentPage === 1 ? "disabled" : "";
    html += `<button type="button" onclick="goToPage(${currentPage - 1})" style="${prevStyle}" ${prevDisabled}>← Trước</button>`;

    // Các số trang
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let p = startPage; p <= endPage; p++) {
        const style = p === currentPage ? activeBtnStyle : inactiveBtnStyle;
        html += `<button type="button" onclick="goToPage(${p})" style="${style}">${p}</button>`;
    }

    // Nút "Sau"
    const nextStyle = currentPage === totalPages ? disabledBtnStyle : inactiveBtnStyle;
    const nextDisabled = currentPage === totalPages ? "disabled" : "";
    html += `<button type="button" onclick="goToPage(${currentPage + 1})" style="${nextStyle}" ${nextDisabled}>Sau →</button>`;

    container.innerHTML = html;
}

window.goToPage = function(page) {
    const totalPages = Math.ceil(currentFilteredProducts.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderProductPage();
        // Cuộn mượt mà lên đầu danh sách
        document.querySelector('.purchased-toolbar').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.reorderProduct = function (product) {
    if (!product || !product.sku) return;
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem("mro_rfq_cart")) || []; } catch (e) { cart = []; }

    const existingIndex = cart.findIndex(item => item.sku === product.sku);
    if (existingIndex > -1) cart[existingIndex].qty = (Number(cart[existingIndex].qty) || 0) + 1;
    else cart.push(product);

    localStorage.setItem("mro_rfq_cart", JSON.stringify(cart));
    if (window.utils?.showToast) window.utils.showToast("Đã thêm vào yêu cầu báo giá!", "success");
    else alert("Đã thêm vào yêu cầu báo giá!");
};

async function loadSidebarProfile(user) {
    try {
        const { data } = await window.supabaseClient.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
        const fbName = user.email ? user.email.split("@")[0] : "Khang Nam";
        const fName = data?.full_name || fbName;

        const nEl = document.getElementById("sidebarUserName");
        const eEl = document.getElementById("sidebarUserEmail");
        const aEl = document.getElementById("userAvatarInitials");

        if (nEl) nEl.textContent = fName;
        if (eEl) eEl.textContent = user.email || "-";
        if (aEl) aEl.textContent = getInitials(fName);
    } catch (e) {}
}

window.handleLogout = async function () {
    try {
        await window.supabaseClient.auth.signOut();
        localStorage.removeItem("kn_customer_session");
        window.location.href = "login.html";
    } catch (error) {}
};

function formatCurrency(v) { return new Intl.NumberFormat("vi-VN").format(Number(v) || 0) + " đ"; }
function getInitials(name) {
    const s = String(name || "").trim();
    if (!s) return "KN";
    const p = s.split(/\s+/).filter(Boolean);
    if (p.length === 1) return p[0].substring(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
function escapeHTML(v) {
    if (window.utils?.escapeHTML) return window.utils.escapeHTML(v ?? "");
    return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}