// ========================================================
// FILE: assets/js/users/product-detail.js
// XỬ LÝ LOGIC TRANG CHI TIẾT SẢN PHẨM & RFQ B2B
// TÍCH HỢP TỰ ĐỘNG TÍNH GIÁ SỈ & CHỌN THUỘC TÍNH (SUB-OPTIONS)
// ========================================================

const PD_IMAGE_CDN_BASE = "https://mrokhangnam-image.khangnamvn.workers.dev";
let currentMOQ = 1;
let currentStock = 0;
let productVariants = [];
let currentSelectedVariant = null;
let currentSelectedSize = null; 
let currentSelectedAttributes = {}; 
let editItemQty = null; 

// ========================================================
// 1. HELPERS (FORMAT & URL)
// ========================================================
const pdStripHTML = (value) => {
    if (!value) return "";
    const temp = document.createElement("div");
    temp.innerHTML = String(value);
    return (temp.textContent || temp.innerText || "").replace(/\s+/g, " ").trim();
};

const pdEscapeHTML = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const pdFormatCurrency = (value) => {
    if (!value || Number(value) <= 0) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN").format(value) + " đ";
};

const pdBuildImageUrl = (imagePath) => {
    if (!imagePath) return "../assets/images/world mark.png";
    let cleanPath = imagePath.replace(/['"\[\]\n\r]/g, "").trim();
    if (!cleanPath || cleanPath.includes("via.placeholder.com")) return "../assets/images/world mark.png";
    if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
    return `${PD_IMAGE_CDN_BASE}/${cleanPath.replace(/^\/+/, "")}`;
};

const pdGetSlugFromPath = () => {
    const pathname = window.location.pathname || "";
    const filename = pathname.split("/").pop() || "";
    if (!filename.endsWith(".html")) return "";
    const slug = filename.slice(0, -5).trim();
    if (!slug || slug === "product-detail") return "";
    return decodeURIComponent(slug);
};

const pdBuildProductDetailUrl = (item) => {
    if (!item) return "#";
    if (item.slug) {
        const slug = encodeURIComponent(String(item.slug).trim());
        if (!window.location.pathname.includes("/pages/")) return `/${slug}.html`;
        return `product-detail.html?slug=${slug}`;
    }
    if (item.id) return `product-detail.html?id=${encodeURIComponent(item.id)}`;
    return "#";
};

// ========================================================
// 2. FETCH DATA TỪ SUPABASE
// ========================================================
async function loadProductVariants(productId) {
    if (!productId) return;
    const { data, error } = await window.supabaseClient
        .from("product_variants")
        .select(`id, product_id, sku, variant_name, attributes, price, discount_price, stock_quantity, min_order_quantity, unit, is_active`)
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    if (error) throw error;
    productVariants = data || [];
    
    if (productVariants.length > 0) {
        const variantIds = productVariants.map(v => v.id);
        const { data: tiers } = await window.supabaseClient
            .from("product_variant_prices")
            .select("*")
            .in("variant_id", variantIds)
            .order("min_quantity", { ascending: true });
            
        productVariants = productVariants.map(variant => ({
            ...variant,
            tiers: (tiers || []).filter(t => t.variant_id === variant.id)
        }));
    }
}

async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    const productSlug = urlParams.get("slug") || pdGetSlugFromPath();

    if (!productId && !productSlug) {
        document.getElementById("loadingScreen")?.classList.add("is-hidden");
        document.getElementById("errorScreen")?.classList.remove("is-hidden");
        return;
    }

    try {
        let query = window.supabaseClient.from("products").select(`*, categories(id, name, slug), sub_categories(id, name, slug), families(id, name, slug), brands(id, name)`);
        if (productSlug) query = query.eq("slug", productSlug);
        else query = query.eq("id", productId);

        const { data: item, error } = await query.single();
        if (error) throw error;
        window.currentProductData = item;

        await loadProductVariants(item.id);

        const editCartKey = urlParams.get("edit_cart_key");
        if (editCartKey) {
            try {
                let shoppingCart = JSON.parse(localStorage.getItem("mro_shopping_cart")) || [];
                let editItem = shoppingCart.find(c => c.cartKey === decodeURIComponent(editCartKey));
                
                if (!editItem) {
                    shoppingCart = JSON.parse(localStorage.getItem("mro_rfq_cart")) || [];
                    editItem = shoppingCart.find(c => c.cartKey === decodeURIComponent(editCartKey));
                }

                if (editItem) {
                    editItemQty = editItem.qty; 
                    
                    if (productVariants.length > 0) {
                        currentSelectedVariant = productVariants.find(v => v.id === editItem.variant_id) || productVariants[0];
                        if (editItem.attributes) currentSelectedAttributes = editItem.attributes;
                    } else if (editItem.size) {
                        currentSelectedSize = editItem.size;
                    }
                }
            } catch(e){}
        } else {
            if (productVariants.length > 0) {
                currentSelectedVariant = productVariants[0];
            } else {
                const oldSizes = Array.isArray(item.available_sizes) ? item.available_sizes.filter(Boolean) : [];
                if (oldSizes.length > 0) currentSelectedSize = oldSizes[0];
            }
        }

        renderVariantSection();
        
        if (currentSelectedVariant) {
            window.selectProductVariant(currentSelectedVariant.id, true); 
        } else {
            currentMOQ = Number(item.min_order_quantity) || 1;
            currentStock = Number(item.stock_quantity) || 0;
            updateVariantPrice();
            updateDOMFallback(item);
        }

        renderStaticInfo(item);
        renderGallery(item);
        renderActionButtons(item); 
        loadRelatedProducts(item);
        loadSaleProductsSidebar(item.id);

        document.getElementById("loadingScreen")?.classList.add("is-hidden");
        document.getElementById("mainContent")?.classList.remove("is-hidden");

        const qtyInput = document.getElementById("buyQty");
        if (qtyInput) {
            qtyInput.addEventListener("input", window.handleManualQtyInput);
            qtyInput.addEventListener("blur", window.normalizeQuantity);
        }

    } catch (err) {
        document.getElementById("loadingScreen")?.classList.add("is-hidden");
        document.getElementById("errorScreen")?.classList.remove("is-hidden");
        console.error("Lỗi trang chi tiết: ", err);
    }
}

// ========================================================
// 3. XỬ LÝ TIER PRICING VÀ VARIANT ENGINE
// ========================================================

function getActiveTier(variant, quantity) {
    if (!variant || !variant.tiers || variant.tiers.length === 0) return null;
    const sortedTiers = [...variant.tiers].sort((a, b) => Number(b.min_quantity) - Number(a.min_quantity));
    return sortedTiers.find(tier => {
        const min = Number(tier.min_quantity);
        const maxRaw = tier.max_quantity;
        const max = (maxRaw === null || maxRaw === "" || Number(maxRaw) <= 0) ? Infinity : Number(maxRaw);
        return quantity >= min && quantity <= max;
    }) || null;
}

function getVariantPrice(variant, quantity = 1) {
    if (!variant) return null;
    const activeTier = getActiveTier(variant, quantity);
    if (activeTier) return Number(activeTier.unit_price);
    if (variant.discount_price !== null && variant.discount_price !== undefined) return Number(variant.discount_price);
    return Number(variant.price);
}

function renderVariantCard(variant) {
    const isSelected = currentSelectedVariant && currentSelectedVariant.id === variant.id;
    const qty = Number(document.getElementById("buyQty")?.value || variant.min_order_quantity || 1);
    const price = getVariantPrice(variant, qty);
    
    return `
        <button type="button"
            onclick="selectProductVariant('${pdEscapeHTML(variant.id)}')"
            class="product-variant-card ${isSelected ? 'is-active' : ''}"
            ${variant.is_active === false ? 'disabled' : ''}>

            <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start;">
                <div class="product-variant-name">${pdEscapeHTML(variant.variant_name)}</div>
                ${isSelected ? '<span class="product-variant-badge">ĐANG CHỌN</span>' : ''}
            </div>

            <!-- Đã gỡ bỏ dòng .product-variant-unit lặp chữ ở đây -->

            <div class="product-variant-price-row">
                <div class="product-variant-price">
                    ${pdFormatCurrency(price)} <span style="font-size: 10px; font-weight: normal; color: #6b7280;">/ ${pdEscapeHTML(variant.unit || '')}</span>
                </div>
            </div>
        </button>
    `;
}

function renderVariantAttributes() {
    let container = document.getElementById("variantAttributesContainer");
    if (!container) {
        const variantSection = document.getElementById("variantSection");
        if (variantSection) {
            container = document.createElement("div");
            container.id = "variantAttributesContainer";
            container.className = "product-attr-section"; 
            variantSection.appendChild(container);
        }
    }

    if (!currentSelectedVariant || !currentSelectedVariant.attributes || Object.keys(currentSelectedVariant.attributes).length === 0) {
        if (container) container.innerHTML = "";
        return;
    }

    let html = "";
    Object.entries(currentSelectedVariant.attributes).forEach(([attrName, attrValueStr]) => {
        const options = attrValueStr.split(",").map(s => s.trim()).filter(Boolean);
        if (options.length === 0) return;

        html += `<div class="product-attr-group">
            <label class="product-attr-label">
                ${pdEscapeHTML(attrName)}: 
                <span>${pdEscapeHTML(currentSelectedAttributes[attrName] || 'Chưa chọn')}</span>
            </label>
            <div class="product-attr-list">`;
        
        options.forEach(opt => {
            const isSel = currentSelectedAttributes[attrName] === opt;
            const btnClass = isSel ? 'product-attr-btn is-active' : 'product-attr-btn';
            
            html += `<button type="button" 
                onclick="selectVariantAttribute('${pdEscapeHTML(attrName)}', '${pdEscapeHTML(opt)}')" 
                class="${btnClass}">
                ${pdEscapeHTML(opt)}
            </button>`;
        });
        
        html += `</div></div>`;
    });

    if (container) container.innerHTML = html;
}

window.selectVariantAttribute = function(attrName, attrValue) {
    currentSelectedAttributes[attrName] = attrValue;
    renderVariantAttributes(); 
};

function renderVariantSection() {
    const section = document.getElementById("variantSection");
    const list = document.getElementById("variantList");
    const hint = document.getElementById("variantSelectionHint");
    
    const item = window.currentProductData;
    const oldSizes = Array.isArray(item?.available_sizes) ? item.available_sizes.filter(Boolean) : [];

    let attrContainer = document.getElementById("variantAttributesContainer");

    if (productVariants && productVariants.length > 0) {
        if(section) {
            section.classList.remove("is-hidden");
            section.style.background = "#f9fafb"; 
            section.style.border = "1px solid #e5e7eb";
            section.style.padding = "16px";
            section.style.marginBottom = "20px";
        }
        const header = section.querySelector(".product-variant-header");
        if (header) header.style.display = "flex";

        if(list) {
            list.style.display = "grid";
            list.innerHTML = productVariants.map(renderVariantCard).join("");
        }
        if(hint) hint.innerText = `${productVariants.length} quy cách`;

        renderVariantAttributes();
    } 
    else if (oldSizes.length > 0) {
        if(section) {
            section.classList.remove("is-hidden");
            section.style.background = "transparent";
            section.style.border = "none";
            section.style.padding = "0";
            section.style.marginBottom = "16px";
        }
        
        const header = section.querySelector(".product-variant-header");
        if (header) header.style.display = "none";

        if (attrContainer) attrContainer.remove();

        if(list) {
            list.style.display = "block";
            let html = `
                <div class="product-attr-section" style="border-top: none; margin-top: 0; padding-top: 0;">
                    <div class="product-attr-group">
                        <label class="product-attr-label">
                            KÍCH THƯỚC / TÙY CHỌN: 
                            <span>${pdEscapeHTML(currentSelectedSize || 'Chưa chọn')}</span>
                        </label>
                        <div class="product-attr-list">
            `;
            oldSizes.forEach(size => {
                const isSel = currentSelectedSize === size;
                const btnClass = isSel ? 'product-attr-btn is-active' : 'product-attr-btn';
                html += `<button type="button" 
                    onclick="selectOldSize('${pdEscapeHTML(size)}')" 
                    class="${btnClass}">
                    ${pdEscapeHTML(size)}
                </button>`;
            });
            html += `</div></div></div>`;
            list.innerHTML = html;
        }
    } 
    else {
        if(section) section.classList.add("is-hidden");
    }
}

window.selectOldSize = function(size) {
    currentSelectedSize = size;
    renderVariantSection();
};

window.selectProductVariant = function (variantId, isRestore = false) {
    const variant = productVariants.find(item => item.id === variantId);
    if (!variant) return;

    currentSelectedVariant = variant;
    currentMOQ = Number(variant.min_order_quantity) || 1;
    currentStock = Number(variant.stock_quantity) || 0;
    
    if (!isRestore) {
        currentSelectedAttributes = {};
        if (variant.attributes) {
            Object.entries(variant.attributes).forEach(([name, valStr]) => {
                const opts = valStr.split(",").map(s => s.trim()).filter(Boolean);
                if (opts.length === 1) currentSelectedAttributes[name] = opts[0];
            });
        }
    }
    
    const qtyInput = document.getElementById("buyQty");
    if (qtyInput) {
        qtyInput.min = currentMOQ;
        if (isRestore && editItemQty !== null) {
            qtyInput.value = Math.max(currentMOQ, Number(editItemQty));
        } else {
            qtyInput.value = Math.max(currentMOQ, Number(qtyInput.value));
        }
    }
    
    renderVariantSection();
    renderVariantAttributes(); 
    updateVariantPrice();
    updateDOMFallback(window.currentProductData, variant);
};

function updateVariantPrice() {
    const quantity = Number(document.getElementById("buyQty")?.value || 1);
    const item = window.currentProductData;
    const priceEl = document.getElementById("detailPrice");
    const noteEl = document.getElementById("detailPriceNote");
    
    if (currentSelectedVariant) {
        const finalPrice = getVariantPrice(currentSelectedVariant, quantity);
        const activeTier = getActiveTier(currentSelectedVariant, quantity);
        
        if (priceEl) priceEl.innerText = pdFormatCurrency(finalPrice);
        if (noteEl) {
            if (activeTier) noteEl.innerText = `/${currentSelectedVariant.unit || 'đơn vị'} • Giá sỉ theo số lượng`;
            else noteEl.innerText = `/${currentSelectedVariant.unit || 'đơn vị'} • Giá niêm yết`;
        }
    } else {
        const finalPrice = (item?.discount_price > 0 && item?.discount_price < item?.price) ? item.discount_price : item?.price;
        if (priceEl) priceEl.innerText = pdFormatCurrency(finalPrice);
        if (noteEl) noteEl.innerText = `/${item?.unit || 'đơn vị'}`;
    }
}

function updateDOMFallback(item, variant = null) {
    document.getElementById("detailSku").innerText = variant?.sku || item?.sku || "—";
    document.getElementById("detailUnit").innerText = variant?.unit || item?.unit || "Cái";
    
    const moqNote = document.getElementById("moqNote");
    const moqVal = document.getElementById("moqVal");
    if (currentMOQ > 1) {
        if (moqVal) moqVal.innerText = `${currentMOQ} ${variant?.unit || item?.unit || "Cái"}`;
        moqNote?.classList.remove("is-hidden");
    } else {
        moqNote?.classList.add("is-hidden");
    }

    const stockEl = document.getElementById("detailStock");
    if (stockEl) {
        if (currentStock > 0) {
            stockEl.className = "product-stock-value stock-ready";
            stockEl.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Sẵn sàng giao hàng`;
        } else {
            stockEl.className = "product-stock-value stock-preorder";
            stockEl.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Liên hệ đặt hàng`;
        }
    }
}

// ========================================================
// 4. ACTION CART & SỐ LƯỢNG 
// ========================================================
function renderActionButtons(item) {
    const salesMode = item.sales_mode || "BOTH";
    const actionContainer = document.getElementById("productActionButtons");
    if (!actionContainer) return;
    
    let actionHtml = "";
    const urlParams = new URLSearchParams(window.location.search);
    const isEditingCart = !!urlParams.get("edit_cart_key");

    // 1. TÍNH TOÁN GIÁ CHUẨN XÁC CHO CẢ V1 VÀ V2
    let currentPrice = 0;
    if (currentSelectedVariant) {
        // Dành cho V2 (Sản phẩm có biến thể)
        currentPrice = getVariantPrice(currentSelectedVariant, 1) || 0;
    } else {
        // Dành cho V1 (Sản phẩm gốc, lấy giá khuyến mãi nếu có)
        const basePrice = Number(item.price) || 0;
        const discountPrice = Number(item.discount_price) || 0;
        
        if (discountPrice > 0 && discountPrice < basePrice) {
            currentPrice = discountPrice;
        } else if (discountPrice > 0 && basePrice === 0) {
            currentPrice = discountPrice; // Xử lý khi Admin chỉ nhập giá KM mà quên Giá gốc
        } else {
            currentPrice = basePrice;
        }
    }

    // 2. ĐIỀU KIỆN CHỐT SALE: Có tồn kho > 0 VÀ Giá > 0
    const isReadyToBuy = currentStock > 0 && currentPrice > 0;

    if (isReadyToBuy) {
        // TRƯỜNG HỢP 1: ĐỦ HÀNG ĐỦ GIÁ -> CHỈ HIỆN NÚT MUA NGAY TO BỰ
        if (salesMode === "BOTH" || salesMode === "BUY") {
            actionHtml += `
                <button type="button" onclick="addToShoppingCart()" class="product-action-button action-buy" style="display:flex; align-items:center; justify-content:center; gap:6px;">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    ${isEditingCart ? "Cập nhật Giỏ" : "Mua Ngay"}
                </button>
            `;
        }
    } else {
        // TRƯỜNG HỢP 2: HẾT HÀNG HOẶC CHƯA CÓ GIÁ (0đ) -> HIỆN NÚT BÁO GIÁ
        if (salesMode === "BOTH" || salesMode === "RFQ") {
            actionHtml += `
                <button type="button" onclick="addToRFQCart()" class="product-action-button action-rfq" style="display:flex; align-items:center; justify-content:center; gap:6px;">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    ${isEditingCart ? "Cập nhật Yêu Cầu" : "Thêm Yêu Cầu Báo Giá"}
                </button>
            `;
        }

        // Nếu HẾT HÀNG nhưng VẪN CÓ GIÁ -> Cho phép khách hàng "ĐẶT TRƯỚC"
        if ((salesMode === "BOTH" || salesMode === "BUY") && currentPrice > 0) {
            actionHtml += `
                <button type="button" onclick="addToShoppingCart()" class="product-action-button action-buy" style="display:flex; align-items:center; justify-content:center; gap:6px;">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    ${isEditingCart ? "Cập nhật Giỏ" : "Đặt Trước"}
                </button>
            `;
        }
    }

    actionContainer.innerHTML = actionHtml;
}

window.changeQty = function(step) {
    const qtyInput = document.getElementById("buyQty");
    if (!qtyInput) return;
    let newVal = (parseInt(qtyInput.value) || currentMOQ) + step;
    if (newVal < currentMOQ) newVal = currentMOQ;
    qtyInput.value = newVal;
    
    updateVariantPrice();
    if(productVariants.length > 0) renderVariantSection();
};

window.handleManualQtyInput = function() {
    updateVariantPrice();
    if (productVariants.length > 0) renderVariantSection();
};

window.normalizeQuantity = function() {
    const qtyInput = document.getElementById("buyQty");
    if (!qtyInput) return;
    let val = parseInt(qtyInput.value, 10);
    if (isNaN(val) || val < currentMOQ) val = currentMOQ;
    qtyInput.value = val;
    
    updateVariantPrice();
    if(productVariants.length > 0) renderVariantSection();
};

function validateAttributesSelection() {
    if (!currentSelectedVariant || !currentSelectedVariant.attributes) return true;
    
    const missingAttrs = [];
    Object.entries(currentSelectedVariant.attributes).forEach(([name, valStr]) => {
        const opts = valStr.split(",").map(s => s.trim()).filter(Boolean);
        if (opts.length > 0 && !currentSelectedAttributes[name]) {
            missingAttrs.push(name);
        }
    });

    if (missingAttrs.length > 0) {
        alert(`❌ Vui lòng chọn: ${missingAttrs.join(", ")} trước khi thực hiện.`);
        return false;
    }
    return true;
}

// CORE FUNCTION: XỬ LÝ CHUNG CHO CẢ MUA HÀNG VÀ RFQ KÈM EDIT MODE
function handleAddToCartLogic(cartType) {
    const qtyInput = document.getElementById("buyQty");
    if (!qtyInput) return;
    const qtyToAdd = parseInt(qtyInput.value, 10) || 0;

    if (qtyToAdd < currentMOQ) {
        alert(`❌ Số lượng đặt mua tối thiểu (MOQ) là: ${currentMOQ}.`);
        qtyInput.value = currentMOQ;
        return;
    }

    const product = window.currentProductData;
    if (!product) return;

    const oldSizes = Array.isArray(product.available_sizes) ? product.available_sizes.filter(Boolean) : [];

    if (productVariants.length > 0 && !currentSelectedVariant) {
        alert("❌ Vui lòng chọn quy cách bán trước khi thêm.");
        return;
    }
    if (productVariants.length === 0 && oldSizes.length > 0 && !currentSelectedSize) {
        alert("❌ Vui lòng chọn Size trước khi thêm.");
        return;
    }

    if (!validateAttributesSelection()) return;

    const storageKey = cartType === 'SHOPPING' ? "mro_shopping_cart" : "mro_rfq_cart";
    let cart = JSON.parse(localStorage.getItem(storageKey)) || [];
    
    const urlParams = new URLSearchParams(window.location.search);
    const editCartKeyRaw = urlParams.get("edit_cart_key");
    const editCartKey = editCartKeyRaw ? decodeURIComponent(editCartKeyRaw) : null;

    const brand = document.getElementById("detailBrand")?.innerText || "OEM";
    let unit = product.unit || "Cái";
    let cartKey = `product:${product.id}`;
    let itemName = product.name;
    let sku = product.sku || "";
    let unitPrice = (product.discount_price > 0 && product.discount_price < product.price) ? product.discount_price : product.price;

    if (currentSelectedVariant) {
        unit = currentSelectedVariant.unit || unit;
        sku = currentSelectedVariant.sku || sku;
        unitPrice = getVariantPrice(currentSelectedVariant, qtyToAdd);
        
        let attrSuffix = "";
        let attrKeySuffix = "";
        if (Object.keys(currentSelectedAttributes).length > 0) {
            const attrParts = Object.entries(currentSelectedAttributes).map(([k, v]) => `${k}: ${v}`);
            attrSuffix = ` (${attrParts.join(" - ")})`;
            attrKeySuffix = `|ATTR:` + Object.entries(currentSelectedAttributes).map(([k, v]) => `${k}=${v}`).join("|");
        }
        
        cartKey = `variant:${currentSelectedVariant.id}${attrKeySuffix}`;
        itemName = `${product.name} - ${currentSelectedVariant.variant_name}${attrSuffix}`;
        
    } else if (currentSelectedSize) {
        cartKey = `${product.id}__SIZE__${currentSelectedSize}`;
        itemName = `${product.name} (Size: ${currentSelectedSize})`;
    }

    if (cartType === 'SHOPPING' && (!unitPrice || unitPrice <= 0)) {
        alert("❌ Sản phẩm này cần liên hệ để có giá chính xác. Vui lòng sử dụng nút [Thêm Yêu Cầu Báo Giá].");
        return;
    }

    const currentItem = {
        cartKey: cartKey,
        product_id: product.id,
        variant_id: currentSelectedVariant?.id || null,
        variant_name: currentSelectedVariant?.variant_name || null,
        attributes: currentSelectedAttributes,
        size: currentSelectedSize || null,
        sku: sku,
        name: itemName,
        brand: brand,
        unit: unit,
        min_order_quantity: currentMOQ,
        stock_quantity: currentStock,
        qty: qtyToAdd,
        unit_price: unitPrice,
        image: product.image_path || null
    };

    if (editCartKey) {
        const oldIndex = cart.findIndex(item => item.cartKey === editCartKey);
        
        if (oldIndex !== -1) {
            if (currentItem.cartKey === editCartKey) {
                cart[oldIndex] = currentItem;
            } else {
                const existingNewIndex = cart.findIndex(item => item.cartKey === currentItem.cartKey && item !== cart[oldIndex]);
                if (existingNewIndex !== -1) {
                    cart[existingNewIndex].qty += currentItem.qty;
                    cart.splice(oldIndex, 1);
                } else {
                    cart[oldIndex] = currentItem;
                }
            }
        } else {
            cart.push(currentItem);
        }
    } else {
        const existingItem = cart.find(item => item.cartKey === currentItem.cartKey);
        if (existingItem) {
            existingItem.qty += qtyToAdd; 
        } else {
            cart.push(currentItem); 
        }
    }

    localStorage.setItem(storageKey, JSON.stringify(cart));
    window.location.href = cartType === 'SHOPPING' ? "cart.html" : "rfq.html";
}

window.addToShoppingCart = function() {
    handleAddToCartLogic('SHOPPING');
};

window.addToRFQCart = function() {
    handleAddToCartLogic('RFQ');
};

// ========================================================
// 5. STATIC RENDERERS
// ========================================================
function renderStaticInfo(item) {
    const brandName = item.brands?.name || "OEM";

    // 1. Cập nhật Tên và Link cho Cấp Danh mục
    const elCategory = document.getElementById("bcCategory");
    if (item.categories) {
        elCategory.innerText = item.categories.name;
        // Gắn link trỏ về trang Sản phẩm + truyền tham số lọc theo category
        elCategory.href = `products.html?category=${item.categories.slug || item.categories.id}`;
    }

    // 2. Cập nhật Tên và Link cho Cấp Nhóm hàng (Sub-category)
    const elSubCat = document.getElementById("bcSubcategory");
    if (item.sub_categories) {
        elSubCat.innerText = item.sub_categories.name;
        // Gắn link trỏ về trang Sản phẩm + truyền tham số lọc theo sub_category
        elSubCat.href = `products.html?sub_category=${item.sub_categories.slug || item.sub_categories.id}`;
    }

    // 3. Cập nhật Tên và Link cho Cấp Dòng sản phẩm (Family)
    const elFamily = document.getElementById("bcFamily");
    if (item.families) {
        elFamily.innerText = item.families.name;
        // Gắn link trỏ về trang Sản phẩm + truyền tham số lọc theo family
        elFamily.href = `products.html?family=${item.families.slug || item.families.id}`;
    }

    // Cập nhật các thông tin Text khác như cũ
    document.getElementById("bcCurrentProduct").innerText = item.name;
    document.getElementById("brandLabel").innerText = brandName;
    document.getElementById("productName").innerText = item.name;
    document.getElementById("detailBrand").innerText = brandName;
    document.getElementById("shortDescription").innerHTML = item.short_description || "Cung cấp vật tư chính hãng.";
    document.getElementById("tabDescContent").innerHTML = item.description || "Đang cập nhật.";
    document.getElementById("techDetails").innerHTML = item.specifications || "Chưa có thông số.";

    if (item.origin && item.origin.toUpperCase() === "JAPAN") {
        document.getElementById("badgeOrigin")?.classList.remove("is-hidden");
    }
}

function renderGallery(item) {
    const domMainImg = document.getElementById("mainImage");
    const domThumbList = document.getElementById("thumbnailList");
    
    let paths = [];
    if (item.image_path) paths.push(item.image_path);
    if (item.images) {
        try {
            const parsed = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
            paths.push(...parsed);
        } catch(e) {
            paths.push(...item.images.split(','));
        }
    }
    
    const validUrls = [...new Set(paths)].map(pdBuildImageUrl);

    if (validUrls.length > 0) {
        domMainImg.src = validUrls[0];
        domThumbList.innerHTML = validUrls.map((url, i) => `
            <div class="thumbnail-item ${i===0 ? 'is-active':''}" onclick="window.changeMainImage('${url}', this)">
                <img src="${url}">
            </div>
        `).join("");
    } else {
        domMainImg.src = "../assets/images/world mark.png";
    }
}

window.changeMainImage = function(src, el) {
    document.getElementById("mainImage").src = src;
    document.querySelectorAll(".thumbnail-item").forEach(i => i.classList.remove("is-active"));
    el.classList.add("is-active");
};

window.switchTab = function(tab) {
    ["desc", "tech", "docs"].forEach(t => {
        const Suffix = t.charAt(0).toUpperCase() + t.slice(1);
        document.getElementById(`tab${Suffix}Btn`)?.classList.toggle("is-active", t === tab);
        document.getElementById(`tab${Suffix}Content`)?.classList.toggle("is-hidden", t !== tab);
    });
};

async function loadRelatedProducts(currentItem) {
    const grid = document.getElementById("relatedProductsGrid");
    if (!grid) return;

    let queryColumn = "family_id";
    let queryValue = currentItem.family_id;

    if (!queryValue) {
        queryColumn = "sub_category_id";
        queryValue = currentItem.sub_category_id;
    }

    if (!queryValue) {
        grid.innerHTML = `<p class="related-product-message">Không có sản phẩm cùng dòng.</p>`;
        return;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from("products")
            .select(`*, brands(id, name)`)
            .eq(queryColumn, queryValue)
            .neq("id", currentItem.id)
            .limit(4);

        if (error) throw error;
        if (!data || data.length === 0) {
            grid.innerHTML = `<p class="related-product-message">Chưa có sản phẩm liên quan.</p>`;
            return;
        }

        grid.innerHTML = "";
        data.forEach((item) => {
            const brandName = item.brands?.name || "OEM";
            const img = pdBuildImageUrl(item.image_path);
            const stockQty = Number(item.stock_quantity) || 0;
            const stockText = stockQty > 0 ? "IN STOCK" : "LIÊN HỆ";
            const stockColor = stockQty > 0 ? "#16a34a" : "#ef4444";

            grid.innerHTML += `
                <div class="related-product-card">
                    <a href="${pdBuildProductDetailUrl(item)}" class="related-product-image-link">
                        <img src="${img}" alt="${pdEscapeHTML(item.name || "")}" class="related-product-image">
                    </a>
                    <div class="related-product-body">
                        <div class="related-product-brand">${pdEscapeHTML(brandName)}</div>
                        <a href="${pdBuildProductDetailUrl(item)}"><h4 class="related-product-name">${pdEscapeHTML(item.name || "")}</h4></a>
                        <div class="related-product-footer">
                            <div class="related-product-sku">SKU: ${pdEscapeHTML(item.sku || "")}</div>
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
            .select(`*, brands(id, name)`)
            .not("discount_price", "is", null)
            .neq("id", currentProductId)
            .limit(20);

        if (error) throw error;
        
        const validData = (data || []).filter(item => Number(item.discount_price) > 0 && Number(item.discount_price) < Number(item.price));

        if (validData.length === 0) {
            container.innerHTML = `<p class="product-sale-empty">Hiện tại đang không có chương trình khuyến mãi.</p>`;
            return;
        }

        const shuffledData = validData.sort(() => 0.5 - Math.random());
        const randomPicks = shuffledData.slice(0, 10);

        let html = "";
        randomPicks.forEach((item) => {
            const brandName = item.brands?.name || "OEM";
            const img = pdBuildImageUrl(item.image_path);
            const originalPrice = item.price ? pdFormatCurrency(item.price) : "";
            const discountPrice = item.discount_price ? pdFormatCurrency(item.discount_price) : "Liên hệ";

            html += `
                <a href="${pdBuildProductDetailUrl(item)}" class="product-sale-item">
                    <div class="product-sale-image"><img src="${img}" alt="${pdEscapeHTML(item.name || "")}"></div>
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

// ========================================================
// 6. INIT LÚC LOAD TRANG
// ========================================================
window.addEventListener("load", () => {
    loadProductDetail();
    
    // Zoom Kính lúp
    const wrapper = document.querySelector('.product-main-image-wrapper');
    const img = document.getElementById('mainImage');
    if (wrapper && img) {
        wrapper.addEventListener('mousemove', e => {
            const rect = wrapper.getBoundingClientRect();
            img.style.transformOrigin = `${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`;
            img.style.transform = 'scale(2.2)'; 
        });
        wrapper.addEventListener('mouseleave', () => {
            img.style.transformOrigin = 'center center';
            img.style.transform = 'scale(1)'; 
        });
    }
});