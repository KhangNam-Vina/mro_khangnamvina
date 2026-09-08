// ========================================================
// FILE: assets/js/users/product-detail.js
// XỬ LÝ LOGIC TRANG CHI TIẾT SẢN PHẨM & RFQ (CÓ CHỌN SIZE)
// ========================================================

let currentMOQ = 1;
let currentStock = 0;
let currentSelectedSize = null; // Biến lưu trạng thái Size đang chọn

/* ========================================================
   HELPER
======================================================== */

const pdStripHTML = (value) => {
    if (!value) return "";

    const temp = document.createElement("div");
    temp.innerHTML = String(value);

    return (temp.textContent || temp.innerText || "")
        .replace(/\s+/g, " ")
        .trim();
};

const pdEscapeHTML = (value) => {
    if (typeof utils !== "undefined" && typeof utils.escapeHTML === "function") {
        return utils.escapeHTML(value ?? "");
    }
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const pdCleanUrl = (url) => {
    if (!url) return "";
    return url.replace(/['"\[\]\n\r]/g, "").trim();
};

const pdFormatCurrency = (value) => {
    if (!value || Number(value) <= 0) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN").format(value) + " đ";
};

const PD_IMAGE_CDN_BASE = "https://mrokhangnam-image.khangnamvn.workers.dev";

const pdBuildImageUrl = (imagePath) => {
    let cleanPath = pdCleanUrl(imagePath);

    if (!cleanPath) {
        return "../assets/images/world mark.png";
    }

    if (cleanPath.startsWith(PD_IMAGE_CDN_BASE)) {
        return cleanPath;
    }

    const supabasePrefix = "https://wnhrkziiujbswnrfnlly.supabase.co/storage/v1/object/public/product-images/";
    if (cleanPath.startsWith(supabasePrefix)) {
        cleanPath = cleanPath.slice(supabasePrefix.length);
    }

    cleanPath = cleanPath.replace(/^\/+/, "");
    return `${PD_IMAGE_CDN_BASE}/${cleanPath}`;
};

const pdGetSlugFromPath = () => {
    const pathname = window.location.pathname || "";
    const filename = pathname.split("/").pop() || "";

    if (!filename.endsWith(".html")) return "";

    const slug = filename.slice(0, -5).trim();

    // Không coi product-detail.html là slug
    if (!slug || slug === "product-detail") return "";

    return decodeURIComponent(slug);
};


const pdBuildProductDetailUrl = (item) => {
    if (!item) return "#";

    if (item.slug) {
        const slug = encodeURIComponent(String(item.slug).trim());

        // Production: /ten-san-pham.html
        if (!window.location.pathname.includes("/pages/")) {
            return `/${slug}.html`;
        }

        // Local / development
        return `product-detail.html?slug=${slug}`;
    }

    if (item.id) {
        return `product-detail.html?id=${encodeURIComponent(item.id)}`;
    }

    return "#";
};

const pdBuildCategoryUrl = (item) => {
    if (!item?.slug) return "#";

    const slug = encodeURIComponent(String(item.slug).trim());

    if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    ) {
        return `subcategory.html?slug=${slug}`;
    }

    return `/pages/subcategory.html?slug=${slug}`;
};


const pdBuildSubcategoryUrl = (item) => {
    if (!item?.slug) return "#";

    const slug = encodeURIComponent(String(item.slug).trim());

    if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    ) {
        return `family.html?slug=${slug}`;
    }

   return `/pages/family.html?slug=${slug}`;
};


const pdBuildFamilyUrl = (item) => {
    if (!item?.slug) return "#";

    const slug = encodeURIComponent(String(item.slug).trim());

    if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    ) {
        return `products.html?slug=${slug}`;
    }

   return `/pages/products.html?slug=${slug}`;
};

/* ========================================================
   1. LOAD PRODUCT DETAIL
======================================================== */

async function loadProductDetail() {

    const urlParams = new URLSearchParams(window.location.search);

    const productId = urlParams.get("id");
    const querySlug = urlParams.get("slug");
    const pathSlug = pdGetSlugFromPath();

    const productSlug = querySlug || pathSlug;
    const mainContent = document.getElementById("mainContent");
    const loadingScreen = document.getElementById("loadingScreen");
    const errorScreen = document.getElementById("errorScreen");
    const errorText = document.getElementById("errorText");
    const previousPage = document.referrer.toLowerCase();
   const bcCategory = document.getElementById("bcCategory");
    const bcSubcategory = document.getElementById("bcSubcategory");
    const bcFamily = document.getElementById("bcFamily");

    const bcCategorySeparator =
        document.getElementById("bcCategorySeparator");

    const bcSubcategorySeparator =
        document.getElementById("bcSubcategorySeparator");

    const bcFamilySeparator =
        document.getElementById("bcFamilySeparator");

    const bcCurrentProduct =
        document.getElementById("bcCurrentProduct");

    const bcHome =
        document.getElementById("bcHome");

    if (!productId && !productSlug) {
    loadingScreen?.classList.add("is-hidden");
    errorScreen?.classList.remove("is-hidden");

    if (errorText) {
        errorText.innerText =
            "Đường dẫn không hợp lệ. Thiếu mã sản phẩm hoặc slug.";
    }

    return;
}

    if (bcHome) {
    const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

    bcHome.href = isLocal
        ? "../index.html"
        : "/";
}

    try {
        let productQuery = window.supabaseClient
    .from("products")
    .select(`
        *,
        categories(id, name, slug),
        sub_categories(id, name, slug),
        families(id, name, slug),
        brands(id, name)
    `);

if (productSlug) {
    productQuery = productQuery.eq("slug", productSlug);
} else {
    productQuery = productQuery.eq("id", productId);
}

const { data: item, error } = await productQuery.single();

        if (error) throw error;
        if (!item) throw new Error("Sản phẩm không tồn tại");

        window.currentProductData = item;
        currentMOQ = Number(item.min_order_quantity) || 1;
        currentStock = Number(item.stock_quantity) || 0;

        const brandName = item.brands?.name || "OEM";
        const priceFormat = pdFormatCurrency(item.price);

        /* SEO */
const seoTitle =
    item.meta_title?.trim() ||
    `${item.name} - MRO Khang Nam`;

const seoDescription =
    item.meta_description?.trim() ||
    item.short_description?.trim() ||
    pdStripHTML(item.description) ||
    `${item.name} - Sản phẩm vật tư công nghiệp chính hãng tại MRO Khang Nam.`;

document.title = seoTitle;

const metaDescription = document.querySelector('meta[name="description"]');

if (metaDescription) {
    metaDescription.setAttribute("content", seoDescription);
}

        const pdSetMeta = (name, content) => {
            if (!content) return;
            let meta = document.querySelector(`meta[name="${name}"]`);
            if (!meta) {
                meta = document.createElement("meta");
                meta.name = name;
                document.head.appendChild(meta);
            }
            meta.setAttribute("content", content);
        };

        pdSetMeta("description", seoDescription);


        const pdSetProperty = (property, content) => {
    if (!content) return;

    let meta = document.querySelector(
        `meta[property="${property}"]`
    );

    if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
    }

    meta.setAttribute("content", content);
};

        const seoImage =
            pdBuildImageUrl(item.image_path);

        const seoUrl = item.slug
            ? new URL(
                `/${encodeURIComponent(String(item.slug).trim())}.html`,
                window.location.origin
            ).href
            : window.location.href;

        pdSetProperty("og:type", "product");
        pdSetProperty("og:title", seoTitle);
        pdSetProperty("og:description", seoDescription);
        pdSetProperty("og:url", seoUrl);
        pdSetProperty("og:image", seoImage);
        pdSetProperty("og:site_name", "MRO Khang Nam");

        /* PRODUCT JSON-LD */

        const pdSetJsonLd = (data) => {
            let script = document.getElementById("productJsonLd");

            if (!script) {
                script = document.createElement("script");
                script.id = "productJsonLd";
                script.type = "application/ld+json";
                document.head.appendChild(script);
            }

            script.textContent = JSON.stringify(data);
        };


        const productJsonLd = {
            "@context": "https://schema.org",
            "@type": "Product",

            "name": item.name || "",

            "description":
                seoDescription,

            "sku":
                item.sku || "",

            "image":
                seoImage
                ? [seoImage]
                : [],

            "brand": {
                "@type": "Brand",
                "name": brandName
            },

            "url":
                seoUrl
        };


        if (Number(item.price) > 0) {

            const finalPrice =
                Number(item.discount_price) > 0 &&
                Number(item.discount_price) < Number(item.price)
                    ? Number(item.discount_price)
                    : Number(item.price);

            productJsonLd.offers = {
                "@type": "Offer",

                "url":
                    seoUrl,

                "priceCurrency":
                    "VND",

                "price":
                    finalPrice,

                "availability":
                    Number(item.stock_quantity) > 0
                        ? "https://schema.org/InStock"
                        : "https://schema.org/PreOrder",

                "itemCondition":
                    "https://schema.org/NewCondition"
            };
        }


pdSetJsonLd(productJsonLd);

        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement("link");
            canonical.rel = "canonical";
            document.head.appendChild(canonical);
        }

        if (item.slug) {
    canonical.href = new URL(
        `/${encodeURIComponent(String(item.slug).trim())}.html`,
        window.location.origin
    ).href;
}

        /* BREADCRUMB */

            const category = item.categories;
            const subcategory = item.sub_categories;
            const family = item.families;

            const setBreadcrumbItem = (
                link,
                separator,
                data,
                buildUrl
            ) => {
                if (data?.name && data?.slug) {
                    link.innerText = data.name;
                    link.href = buildUrl(data);

                    link.style.display = "";
                    separator.style.display = "";
                } else {
                    link.style.display = "none";
                    separator.style.display = "none";
                }
            };


            if (bcCategory && bcCategorySeparator) {
                setBreadcrumbItem(
                    bcCategory,
                    bcCategorySeparator,
                    category,
                    pdBuildCategoryUrl
                );
            }


            if (bcSubcategory && bcSubcategorySeparator) {
                setBreadcrumbItem(
                    bcSubcategory,
                    bcSubcategorySeparator,
                    subcategory,
                    pdBuildSubcategoryUrl
                );
            }


            if (bcFamily && bcFamilySeparator) {
                setBreadcrumbItem(
                    bcFamily,
                    bcFamilySeparator,
                    family,
                    pdBuildFamilyUrl
                );
            }


            if (bcCurrentProduct) {
                bcCurrentProduct.innerText =
                    item.name || "Chi tiết sản phẩm";

                bcCurrentProduct.classList.remove(
                    "is-loading"
                );
            }

        /* PRODUCT BASIC INFO */
        const brandLabel = document.getElementById("brandLabel");
        if (brandLabel) brandLabel.innerText = brandName;

        const productName = document.getElementById("productName");
        if (productName) productName.innerText = item.name;

        const shortDescription = document.getElementById("shortDescription");
        if (shortDescription) {
            shortDescription.innerText = item.short_description || "Sản phẩm vật tư chuyên dụng chính hãng. Vui lòng xem thông số chi tiết bên dưới.";
        }

        const detailSku = document.getElementById("detailSku");
        if (detailSku) detailSku.innerText = item.sku || "";

        const detailBrand = document.getElementById("detailBrand");
        if (detailBrand) detailBrand.innerText = brandName;

        const detailUnit = document.getElementById("detailUnit");
        if (detailUnit) detailUnit.innerText = item.unit || "Cái";

        const detailOrigin = document.getElementById("detailOrigin");
        if (detailOrigin) detailOrigin.innerText = item.origin || "Đang cập nhật";

       /* PRICE */
        const detailPrice = document.getElementById("detailPrice");
        if (detailPrice) {
            if (item.discount_price && Number(item.discount_price) > 0 && Number(item.discount_price) < Number(item.price)) {
                const oldPrice = pdFormatCurrency(item.price);
                const newPrice = pdFormatCurrency(item.discount_price);
                detailPrice.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: flex-start;">
                        <span style="font-size: 14px; color: #9ca3af; text-decoration: line-through; font-weight: 600; line-height: 1;">${oldPrice}</span>
                        <span>${newPrice}</span>
                    </div>
                `;
            } else {
                detailPrice.innerHTML = priceFormat;
            }
        }

        /* ========================================================
           SIZES / KÍCH THƯỚC (CẬP NHẬT LOGIC KHÔI PHỤC KHI EDIT)
        ======================================================== */
        const sizeWrapper = document.getElementById("productSizeWrapper");
        const sizeList = document.getElementById("productSizeList");
        const selectedSizeText = document.getElementById("selectedSizeText");

        // Đọc Key xem có đang chỉnh sửa không?
        const editCartKey = urlParams.get("edit_cart_key");
        let editCartItem = null;

        if (editCartKey) {
            try {
                const decodedEditCartKey = decodeURIComponent(editCartKey);
                const shoppingCart = JSON.parse(localStorage.getItem("mro_shopping_cart")) || [];
                
                editCartItem = shoppingCart.find(cartItem => {
                    // Ưu tiên cartKey, fallback tự gen lại ID + SIZE giống logic của cart.js
                    const itemKey = cartItem.cartKey || `${cartItem.id}__SIZE__${String(cartItem.size || "").trim().replace(/\s+/g, " ").toUpperCase()}`;
                    return itemKey === decodedEditCartKey;
                });
            } catch (error) {
                console.error("Lỗi đọc item đang chỉnh sửa:", error);
            }
        }

        currentSelectedSize = null;

        if (sizeWrapper && sizeList) {
            const sizes = Array.isArray(item.available_sizes)
                ? item.available_sizes.map(size => String(size).trim()).filter(Boolean)
                : [];

            if (sizes.length > 0) {
                sizeWrapper.classList.remove("is-hidden");

                // Ưu tiên lấy Size đang edit -> Nếu không thì lấy Size đầu tiên
                const editSize = editCartItem?.size ? String(editCartItem.size).trim() : "";
                const matchedEditSize = editSize
                    ? sizes.find(size => String(size).trim().toUpperCase() === editSize.toUpperCase())
                    : null;

                currentSelectedSize = matchedEditSize || sizes[0];

                if (selectedSizeText) {
                    selectedSizeText.innerText = currentSelectedSize;
                }

                // Render Nút Size
                sizeList.innerHTML = sizes.map(size => {
                    const isActive = String(size).trim().replace(/\s+/g, " ").toUpperCase() === String(currentSelectedSize).trim().replace(/\s+/g, " ").toUpperCase();
                    return `
                        <button
                            type="button"
                            class="product-size-btn ${isActive ? "is-active" : ""}"
                            data-size="${pdEscapeHTML(size)}"
                        >
                            ${pdEscapeHTML(size)}
                        </button>
                    `;
                }).join("");

                // Bắt sự kiện chọn Size
                sizeList.onclick = function (event) {
                    const button = event.target.closest(".product-size-btn");
                    if (!button) return;
                    const selectedSize = button.dataset.size || "";
                    selectProductSize(selectedSize, button);
                };

            } else {
                sizeWrapper.classList.add("is-hidden");
                sizeList.innerHTML = "";
                currentSelectedSize = null;
                if (selectedSizeText) selectedSizeText.innerText = "Không áp dụng";
            }
        }

        /* BADGES & STOCK */
        const badgeOrigin = document.getElementById("badgeOrigin");
        if (badgeOrigin && item.origin && item.origin.toUpperCase() === "JAPAN") {
            badgeOrigin.classList.remove("is-hidden");
        }

        if (item.badge && item.badge.trim() !== "") {
            const badgeEl = document.getElementById("badgeStatus");
            if (badgeEl) {
                const badgeVal = item.badge.trim().toUpperCase();
                let badgeClass = "badge-default";

                if (badgeVal === "NEW") badgeClass = "badge-new";
                else if (badgeVal === "HOT") badgeClass = "badge-hot";
                else if (badgeVal === "SALE") badgeClass = "badge-sale";
                else if (badgeVal === "BEST SELLER") badgeClass = "badge-best";
                else if (badgeVal === "CLEARANCE") badgeClass = "badge-clearance";

                badgeEl.className = `product-badge ${badgeClass}`;
                badgeEl.innerText = badgeVal;
                badgeEl.classList.remove("is-hidden");
            }
        }

        const stockEl = document.getElementById("detailStock");
        if (stockEl) {
            if (currentStock > 0) {
                stockEl.className = "product-stock-value stock-ready";
                stockEl.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Tình trạng: Sẵn sàng giao hàng`;
            } else {
                stockEl.className = "product-stock-value stock-preorder";
                stockEl.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Tình trạng: Pre-order (Liên hệ)`;
            }
        }

        /* KHÔI PHỤC SỐ LƯỢNG (QTY) VÀ MOQ */
        const qtyInput = document.getElementById("buyQty");
        if (qtyInput) {
            qtyInput.min = currentMOQ;
            
            // Nếu có data Edit thì nhồi số lượng cũ vào, tối thiểu là MOQ
            let editQty = currentMOQ;
            if (editCartItem && editCartItem.qty) {
                editQty = Math.max(currentMOQ, Number(editCartItem.qty));
            }
            qtyInput.value = editQty;
        }

        if (currentMOQ > 1) {
            const moqNote = document.getElementById("moqNote");
            const moqVal = document.getElementById("moqVal");
            if (moqVal) moqVal.innerText = `${currentMOQ} ${item.unit || "Cái"}`;
            if (moqNote) moqNote.classList.remove("is-hidden");
        }

        /* IMAGE GALLERY - CDN */
        let allImagePaths = [];
        const mainImagePath = pdCleanUrl(item.image_path);
        if (mainImagePath) allImagePaths.push(mainImagePath);

        if (item.images) {
            let rawExtraImages = [];
            if (Array.isArray(item.images)) {
                rawExtraImages = item.images;
            } else if (typeof item.images === "string") {
                try {
                    const parsedImages = JSON.parse(item.images);
                    if (Array.isArray(parsedImages)) {
                        rawExtraImages = parsedImages;
                    } else {
                        rawExtraImages = item.images.split(/[\n,]+/);
                    }
                } catch {
                    rawExtraImages = item.images.split(/[\n,]+/);
                }
            }
            rawExtraImages.forEach((rawPath) => {
                const cleanPath = pdCleanUrl(rawPath);
                if (cleanPath && !allImagePaths.includes(cleanPath)) {
                    allImagePaths.push(cleanPath);
                }
            });
        }

        const allValidImages = allImagePaths.map(pdBuildImageUrl);
        const domMainImg = document.getElementById("mainImage");
        const domThumbList = document.getElementById("thumbnailList");

        if (allValidImages.length > 0) {
            if (domMainImg) {
                domMainImg.src = allValidImages[0];
                domMainImg.onerror = function () {
                    this.onerror = null;
                    this.src = "../assets/images/world mark.png";
                };
            }
            if (domThumbList) {
                domThumbList.innerHTML = "";
                allValidImages.forEach((url, index) => {
                    const activeClass = index === 0 ? "is-active" : "";
                    domThumbList.innerHTML += `
                        <div class="thumbnail-item ${activeClass}" onclick="changeMainImage('${pdEscapeHTML(url)}', this)">
                            <img src="${pdEscapeHTML(url)}" alt="Ảnh sản phẩm" loading="lazy">
                        </div>
                    `;
                });
            }
        } else {
            if (domMainImg) domMainImg.src = "../assets/images/world mark.png";
            if (domThumbList) domThumbList.innerHTML = "";
        }

        /* TABS CONTENT */
        const descText = item.description || "Đang cập nhật mô tả chi tiết.";
        const tabDescContent = document.getElementById("tabDescContent");
        if (tabDescContent) tabDescContent.innerHTML = descText;

        const techDetails = document.getElementById("techDetails");
        if (techDetails) {
            techDetails.textContent = item.specifications || "Chưa có dữ liệu.";
        }

        const tabDocsContent = document.getElementById("tabDocsContent");
        if (tabDocsContent) {
            if (item.datasheet_url) {
                tabDocsContent.innerHTML = `
                    <div class="product-document-card">
                        <div class="product-document-info">
                            <div class="product-document-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                            </div>
                            <div class="product-document-text">
                                <div class="product-document-title">Tài liệu kỹ thuật</div>
                                <div class="product-document-type">PDF Document</div>
                            </div>
                        </div>
                        <a href="${pdEscapeHTML(item.datasheet_url)}" target="_blank" rel="noopener noreferrer" class="product-document-button">Tải về</a>
                    </div>
                `;
            } else {
                tabDocsContent.innerHTML = `<p class="product-docs-empty">Chưa có tài liệu tải về bổ sung cho sản phẩm này.</p>`;
            }
        }

        /* ACTION BUTTONS (UPDATE DYNAMIC TEXT) */
        const salesMode = item.sales_mode || "BOTH";
        const actionContainer = document.getElementById("productActionButtons");
        let actionHtml = "";
        
        // Kiểm tra xem có đang ở chế độ Edit không
        const isEditingCart = !!editCartKey;

        if (salesMode === "BOTH" || salesMode === "RFQ") {
            actionHtml += `
                <button type="button" onclick="addToRFQCart()" class="product-action-button action-rfq">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Thêm Yêu Cầu Báo Giá
                </button>
            `;
        }

        if ((salesMode === "BOTH" || salesMode === "BUY") && Number(item.price) > 0) {
            actionHtml += `
                <button type="button" onclick="addToShoppingCart()" class="product-action-button action-buy">
                    <span aria-hidden="true">🛒</span> ${isEditingCart ? "Cập nhật Giỏ hàng" : "Mua Ngay"}
                </button>
            `;
        }

        if (actionContainer) actionContainer.innerHTML = actionHtml;

        /* SHOW MAIN */
        loadingScreen?.classList.add("is-hidden");
        mainContent?.classList.remove("is-hidden");

        await Promise.all([
            loadRelatedProducts(item),
            loadSaleProductsSidebar(item.id)
        ]);

    } catch (err) {
        console.error("Lỗi tải chi tiết:", err);
        loadingScreen?.classList.add("is-hidden");
        errorScreen?.classList.remove("is-hidden");
        if (errorText) errorText.innerText = err.message || "Không thể tải dữ liệu sản phẩm.";
    }
}


/* ========================================================
   XỬ LÝ CHỌN SIZE SẢN PHẨM
======================================================== */

window.selectProductSize = function (size, btnElement) {

    currentSelectedSize =
        typeof size === "string"
            ? size.trim()
            : null;

    const sizeText =
        document.getElementById("selectedSizeText");

    if (sizeText) {
        sizeText.innerText =
            currentSelectedSize || "Chưa chọn";
    }

    document
        .querySelectorAll(".product-size-btn")
        .forEach(btn => {
            btn.classList.remove("is-active");
        });

    if (btnElement) {
        btnElement.classList.add("is-active");
    }
};


/* ========================================================
   CÁC HÀM UI KHÁC (ZOOM, TABS, QTY)
======================================================== */

function changeMainImage(src, element) {
    const mainImage = document.getElementById("mainImage");
    if (mainImage) mainImage.src = src;
    document.querySelectorAll(".thumbnail-item").forEach(el => el.classList.remove("is-active"));
    if (element) element.classList.add("is-active");
}

function switchTab(tabName) {
    const tabs = ["desc", "tech", "docs"];
    tabs.forEach((tab) => {
        const suffix = tab.charAt(0).toUpperCase() + tab.slice(1);
        const btn = document.getElementById(`tab${suffix}Btn`);
        const content = document.getElementById(`tab${suffix}Content`);
        if (!btn || !content) return;

        if (tab === tabName) {
            btn.classList.add("is-active");
            content.classList.remove("is-hidden");
        } else {
            btn.classList.remove("is-active");
            content.classList.add("is-hidden");
        }
    });
}

function changeQty(step) {
    const qtyInput = document.getElementById("buyQty");
    if (!qtyInput) return;
    const currentVal = parseInt(qtyInput.value) || currentMOQ;
    let newVal = currentVal + step;
    if (newVal < currentMOQ) newVal = currentMOQ;
    qtyInput.value = newVal;
}


/* ========================================================
   ADD TO RFQ CART
   SIZE ĐƯỢC LƯU RIÊNG, KHÔNG GHÉP VÀO SKU
======================================================== */

function addToRFQCart() {
    const qtyInput = document.getElementById("buyQty");
    if (!qtyInput) return;

    const qtyToAdd = parseInt(qtyInput.value, 10) || 0;

    /* CHECK MOQ */
    if (qtyToAdd < currentMOQ) {
        alert(
            `❌ Sản phẩm này yêu cầu số lượng đặt mua tối thiểu (MOQ) là: ${currentMOQ}.\n\n` +
            `Vui lòng nhập số lượng hợp lệ để tiếp tục!`
        );
        qtyInput.value = currentMOQ;
        return;
    }

    /* CHECK SIZE */
    const product = window.currentProductData;
    if (!product) {
        alert("❌ Không xác định được sản phẩm.");
        return;
    }

    const availableSizes = Array.isArray(product.available_sizes) ? product.available_sizes : [];

    if (availableSizes.length > 0 && !currentSelectedSize) {
        alert("❌ Vui lòng chọn kích thước / Size trước khi thêm vào yêu cầu báo giá.");
        return;
    }

    let cart = JSON.parse(localStorage.getItem("mro_rfq_cart")) || [];

    const baseSku = product.sku || "";
    const baseName = product.name || "";
    const brand = document.getElementById("detailBrand")?.innerText || "";
    const unit = document.getElementById("detailUnit")?.innerText || "";

    const currentItem = {
        product_id: product.id || null,
        sku: baseSku,
        name: baseName,
        size: currentSelectedSize || null,
        brand: brand,
        unit: unit,
        qty: qtyToAdd
    };

    const existingItem = cart.find(item =>
        item.product_id === currentItem.product_id &&
        (item.size || null) === (currentItem.size || null)
    );

    if (existingItem) {
        existingItem.qty += qtyToAdd;
    } else {
        cart.push(currentItem);
    }

    localStorage.setItem("mro_rfq_cart", JSON.stringify(cart));
    window.location.href = "rfq.html";
}


/* ========================================================
   RELATED PRODUCTS & SALE SIDEBAR
======================================================== */

async function loadRelatedProducts(currentItem) {
    const grid = document.getElementById("relatedProductsGrid");
    const introText = document.getElementById("relatedIntro");
    const viewAllBtn = document.getElementById("viewAllRelated");

    if (!grid) return;
    if (currentItem.sub_category_id && viewAllBtn) {
        viewAllBtn.href = `products.html?sub_category_id=${currentItem.sub_category_id}`;
    }

    let queryColumn = null;
    let queryValue = null;

    if (currentItem.family_id) {
        queryColumn = "family_id";
        queryValue = currentItem.family_id;
        if (currentItem.brands && introText) introText.innerText = `Các sản phẩm cùng thương hiệu ${currentItem.brands.name} bạn có thể quan tâm.`;
    } else if (currentItem.sub_category_id) {
        queryColumn = "sub_category_id";
        queryValue = currentItem.sub_category_id;
        if (currentItem.sub_categories && introText) introText.innerText = `Các thiết bị thuộc nhóm ${currentItem.sub_categories.name} bạn có thể quan tâm.`;
    }

    if (!queryValue) {
        grid.innerHTML = `<p class="related-product-message">Không có sản phẩm cùng dòng.</p>`;
        introText?.classList.add("is-hidden");
        return;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from("products")
            .select(`*, brands(name)`)
            .eq(queryColumn, queryValue)
            .neq("id", currentItem.id)
            .limit(4);

        if (error) throw error;

        if (!data || data.length === 0) {
            grid.innerHTML = `<p class="related-product-message">Chưa có sản phẩm liên quan.</p>`;
            introText?.classList.add("is-hidden");
            return;
        }

        grid.innerHTML = "";
        data.forEach((item) => {
            const brandName = item.brands?.name || "OEM";
            const img = pdBuildImageUrl(item.image_path);
            
            // LẤY DỮ LIỆU TỒN KHO TỪ DATABASE ĐỂ RENDER
            const stockQty = Number(item.stock_quantity) || 0;
            const stockText = stockQty > 0 ? "IN STOCK" : "LIÊN HỆ";
            const stockColor = stockQty > 0 ? "#16a34a" : "#ef4444"; // Xanh cho còn hàng, Đỏ cho hết hàng

            grid.innerHTML += `
                <div class="related-product-card">
                    <a href="${pdEscapeHTML(pdBuildProductDetailUrl(item))}" class="related-product-image-link">
                        <img src="${pdEscapeHTML(img)}" alt="${pdEscapeHTML(item.name || "")}" class="related-product-image">
                    </a>
                    <div class="related-product-body">
                        <div class="related-product-brand">${pdEscapeHTML(brandName)}</div>
                        <a href="${pdEscapeHTML(pdBuildProductDetailUrl(item))}"><h4 class="related-product-name">${pdEscapeHTML(item.name || "")}</h4></a>
                        <div class="related-product-footer">
                            <div class="related-product-sku">SKU: ${pdEscapeHTML(item.sku || "")}</div>
                            <!-- FIX: Hiển thị tự động màu và chữ theo trạng thái Kho -->
                            <div class="related-product-stock" style="color: ${stockColor}; font-weight: 800;">${stockText}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        grid.innerHTML = `<p class="related-product-error">Lỗi tải dữ liệu sản phẩm cùng dòng.</p>`;
    }
}

async function loadSaleProductsSidebar(currentProductId) {
    const container = document.getElementById("saleProductsSidebar");
    if (!container) return;

    try {
        const { data, error } = await window.supabaseClient
            .from("products")
            .select(`*, brands(name)`)
            .gt("discount_price", 0)
            .neq("id", currentProductId)
            .limit(20);

        if (error) throw error;
        if (!data || data.length === 0) {
            container.innerHTML = `<p class="product-sale-empty">Hiện tại đang không có chương trình khuyến mãi.</p>`;
            return;
        }

        const shuffledData = data.sort(() => 0.5 - Math.random());
        const randomPicks = shuffledData.slice(0, 4);

        let html = "";
        randomPicks.forEach((item) => {
            const brandName = item.brands?.name || "OEM";
            const img = pdBuildImageUrl(item.image_path);
            const originalPrice = item.price ? pdFormatCurrency(item.price) : "";
            const discountPrice = item.discount_price ? pdFormatCurrency(item.discount_price) : "Liên hệ";

            html += `
                <a href="${pdEscapeHTML(pdBuildProductDetailUrl(item))}" class="product-sale-item">
                    <div class="product-sale-image"><img src="${pdEscapeHTML(img)}" alt="${pdEscapeHTML(item.name || "")}"></div>
                    <div class="product-sale-info">
                        <div class="product-sale-brand">${pdEscapeHTML(brandName)}</div>
                        <h4 class="product-sale-name">${pdEscapeHTML(item.name || "")}</h4>
                        <div class="product-sale-prices">
                            <span class="product-sale-old-price">${originalPrice}</span>
                            <span class="product-sale-new-price">${discountPrice}</span>
                        </div>
                    </div>
                </a>
            `;
        });

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p class="product-sale-empty">Lỗi tải dữ liệu.</p>`;
    }
}


/* ========================================================
   LOAD RFQ CART
======================================================== */

function loadCartFromStorage() {

    const cartList = document.getElementById("cartList");
    if (!cartList) return;

    const cartItems = JSON.parse(localStorage.getItem("mro_rfq_cart")) || [];

    if (cartItems.length === 0) {
        cartList.innerHTML = `
            <tr>
                <td colspan="6" class="rfq-cart-empty">
                    Giỏ yêu cầu của bạn đang trống.
                </td>
            </tr>
        `;
        return;
    }

    cartList.innerHTML = "";

    cartItems.forEach((item, index) => {
        const sizeHtml = item.size
            ? `
                <div class="rfq-cart-size">
                    Size: <strong>${pdEscapeHTML(item.size)}</strong>
                </div>
              `
            : "";

        cartList.innerHTML += `
            <tr class="rfq-cart-row" data-index="${index}">
                <td class="rfq-cart-sku">${pdEscapeHTML(item.sku || "")}</td>
                <td class="rfq-cart-name">
                    <div>${pdEscapeHTML(item.name || "")}</div>
                    ${sizeHtml}
                </td>
                <td class="rfq-cart-brand">${pdEscapeHTML(item.brand || "")}</td>
                <td class="rfq-cart-qty-cell">
                    <div class="rfq-cart-qty">
                        <button type="button" onclick="updateQtyByIndex(${index}, -1)">-</button>
                        <input type="number" value="${Number(item.qty) || 1}" readonly>
                        <button type="button" onclick="updateQtyByIndex(${index}, 1)">+</button>
                    </div>
                </td>
                <td class="rfq-cart-remove-cell">
                    <button type="button" onclick="removeItemByIndex(${index})" class="rfq-cart-remove">Xóa</button>
                </td>
            </tr>
        `;
    });
}

function updateQtyByIndex(index, change) {
    let cartItems = JSON.parse(localStorage.getItem("mro_rfq_cart")) || [];
    const item = cartItems[index];
    if (!item) return;

    item.qty = (Number(item.qty) || 1) + change;
    if (item.qty < 1) item.qty = 1;

    localStorage.setItem("mro_rfq_cart", JSON.stringify(cartItems));
    loadCartFromStorage();
}

function removeItemByIndex(index) {
    let cartItems = JSON.parse(localStorage.getItem("mro_rfq_cart")) || [];
    if (index < 0 || index >= cartItems.length) return;

    cartItems.splice(index, 1);
    localStorage.setItem("mro_rfq_cart", JSON.stringify(cartItems));
    loadCartFromStorage();
}

function shareProduct() {
    const productUrl = window.location.href;
    const productTitle = document.getElementById("productName")?.innerText || document.title;
    if (navigator.share) {
        navigator.share({ title: productTitle, text: "Tham khảo vật tư này trên MRO Khang Nam:", url: productUrl }).catch(err => console.error("Lỗi chia sẻ:", err));
    } else {
        navigator.clipboard.writeText(productUrl).then(() => { alert("✅ Đã copy link sản phẩm! Bạn có thể dán (Ctrl+V) để chia sẻ."); }).catch(err => { console.error("Không thể copy link:", err); });
    }
}

function printProduct() { window.print(); }


/* ========================================================
   ZOOM KÍNH LÚP & INIT
======================================================== */
function initMagnifierZoom() {
    const wrapper = document.querySelector('.product-main-image-wrapper');
    const img = document.getElementById('mainImage');
    if (!wrapper || !img) return;

    wrapper.addEventListener('mousemove', function(e) {
        const rect = wrapper.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transition = 'none';
        img.style.transformOrigin = `${x}% ${y}%`;
        img.style.transform = 'scale(2.2)'; 
    });

    wrapper.addEventListener('mouseleave', function() {
        img.style.transition = 'transform 0.4s ease';
        img.style.transformOrigin = 'center center';
        img.style.transform = 'scale(1)'; 
    });

    wrapper.addEventListener('mouseenter', function() {
        img.style.transition = 'transform 0.4s ease';
    });
}

window.addEventListener("load", async () => {
    const urlParams = new URLSearchParams(window.location.search);

    const hasId = !!urlParams.get("id");
    const hasSlug = !!urlParams.get("slug");
    const hasPathSlug = !!pdGetSlugFromPath();

    if (hasId || hasSlug || hasPathSlug) {
        await loadProductDetail();
    }

    if (document.getElementById("cartList")) {
        loadCartFromStorage();
    }

    initMagnifierZoom();
    try {
        let isUserLoggedIn = false;
        if (typeof checkCustomerAuth === 'function') isUserLoggedIn = !!(await checkCustomerAuth());
        else if (typeof window.checkCustomerAuth === 'function') isUserLoggedIn = !!(await window.checkCustomerAuth());
        else if (typeof Auth !== 'undefined' && typeof Auth.getCurrentUser === 'function') isUserLoggedIn = !!(await Auth.getCurrentUser());
        else if (window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getSession();
            isUserLoggedIn = !!data?.session;
        }

        if (isUserLoggedIn) {
            const guestBtn = document.getElementById("btnGuestLogin");
            if (guestBtn) guestBtn.classList.add("d-none");
            const userProfileBtn = document.getElementById("btnUserProfile");
            if (userProfileBtn) userProfileBtn.classList.remove("d-none", "hidden", "is-hidden");
        }
    } catch (err) {
        console.error("Lỗi xác thực:", err);
    }
});