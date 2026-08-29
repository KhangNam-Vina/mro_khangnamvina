/* =========================================================
   FILE: assets/js/admin/admin-products.js
   QUẢN LÝ SẢN PHẨM & BỘ LỌC NÂNG CAO ĐA NĂNG
========================================================= */

/* =========================================================
   CONSTANTS
========================================================= */
const STORAGE_BUCKET = "product-images";
const STORAGE_PRODUCT_PREFIX = "products";
const PRODUCT_IMAGE_CDN_BASE = "https://mrokhangnam-image.khangnamvn.workers.dev";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const ORIGIN_OPTIONS = [
    "Việt Nam", "Nhật Bản", "Đức", "Mỹ", "Trung Quốc", "Hàn Quốc",
    "Đài Loan", "Thái Lan", "Malaysia", "Singapore", "Indonesia",
    "Ấn Độ", "Pháp", "Ý", "Anh", "Tây Ban Nha"
];

/* =========================================================
   STATE & CẤU TRÚC BỘ LỌC
========================================================= */
const state = {
    products: [],
    categories: [],
    subCategories: [],
    families: [],
    industries: [],
    brands: [],
    editingId: null,
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    
    // ĐỘNG CƠ BỘ LỌC CHÍNH
    filters: {
        search: "",
        category: "all",
        industry: "all",
        stock: "all",
        sort: "newest",
        subCategory: "all",
        family: "all",
        brands: [], 
        origin: "all",
        priceMin: "",
        priceMax: "",
        moqMin: "", moqMax: "", hasImage: "all", hasDatasheet: "all"
        
    },

    mediaDraft: {
        mainPath: null,
        mainUrl: null,
        mainRemoved: false,
        existingGallery: [],
        removedGallery: [],
        pendingMainFile: null,
        pendingExtraFiles: []
    }
};



/* =========================================================
   DOM ELEMENTS
========================================================= */
const DOM = {
    listView: document.getElementById("productListView"),
    formView: document.getElementById("productFormView"),
    form: document.getElementById("productForm"),
    tableBody: document.getElementById("productTableBody"),
    pagination: document.getElementById("paginationContainer"),
    
    // Quick Filters
    search: document.getElementById("searchInput"),
    filterCategory: document.getElementById("filterCategorySelect"),
    filterIndustry: document.getElementById("filterIndustrySelect"),
    filterStock: document.getElementById("filterStockSelect"),
    filterSort: document.getElementById("filterSortSelect"),
    
    // Advanced Filters Panel
    btnToggleAdvanced: document.getElementById("btnToggleAdvancedFilter"),
    advancedPanel: document.getElementById("advancedFilterPanel"),
    filterSubCategory: document.getElementById("filterSubCategorySelect"),
    filterFamily: document.getElementById("filterFamilySelect"),
    filterOrigin: document.getElementById("filterOriginSelect"),
    filterPriceMin: document.getElementById("filterPriceMin"),
    filterPriceMax: document.getElementById("filterPriceMax"),
    filterBrandSearch: document.getElementById("filterBrandSearch"),
    filterBrandList: document.getElementById("filterBrandList"),
    
    // UI Trạng Thái Lọc
    filteredCountDisplay: document.getElementById("filteredCountDisplay"),
    activeFiltersContainer: document.getElementById("activeFiltersContainer"),
    btnClearAllFilters: document.getElementById("btnClearAllFilters"),
    btnApplyAdvanced: document.getElementById("btnApplyAdvancedFilter"),
    btnCancelAdvanced: document.getElementById("btnCancelAdvancedFilter"),

    // Form inputs
    btnAdd: document.getElementById("btnAddProduct"),
    btnBack: document.getElementById("btnBackToProducts"),
    btnCancel: document.getElementById("btnCancelForm"),
    btnSubmit: document.getElementById("btnSubmit"),
    formTitle: document.getElementById("formTitle"),
    category: document.getElementById("category_id"),
    subCategory: document.getElementById("sub_category_id"),
    family: document.getElementById("family_id"),
    industry: document.getElementById("industrySelect"),
    total: document.getElementById("productTotal"),
    inStock: document.getElementById("productInStock"),
    outOfStock: document.getElementById("productOutOfStock"),
    onSale: document.getElementById("productOnSale"),
    toast: document.getElementById("toastContainer"),

    // Media
    mainImageFile: document.getElementById("image_file"),
    mainImagePreview: document.getElementById("mainImagePreview"),
    extraImageFiles: document.getElementById("extra_image_files"),
    extraImagesPreview: document.getElementById("extraImagesPreview"),
    filterMoqMin: document.getElementById("filterMoqMin"),
    filterMoqMax: document.getElementById("filterMoqMax"),
    filterHasImage: document.getElementById("filterHasImage"),
    filterHasDatasheet: document.getElementById("filterHasDatasheet"),
    filterHasInfo: document.getElementById("filterHasInfo"),
};

/* =========================================================
   BASIC HELPERS
========================================================= */
function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]);
}

function escapeAttribute(value) { return escapeHTML(value); }

function formatCurrency(value) {
    const number = Number(value);
    if (!number) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN").format(number) + " đ";
}

/* =========================================================
   SIZE & IMAGE HELPERS (Giữ nguyên gốc)
========================================================= */
function normalizeProductSizes(product) {
    if (!product) return [];
    let sizes = product.available_sizes;
    if (Array.isArray(sizes)) {
        sizes = sizes.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof sizes === "string") {
        sizes = sizes.split(",").map(s => s.trim()).filter(Boolean);
    } else { sizes = []; }
    
    if (sizes.length === 0 && product.size !== null && product.size !== undefined && String(product.size).trim()) {
        sizes = String(product.size).split(",").map(s => s.trim()).filter(Boolean);
    }
    return [...new Set(sizes)];
}

function renderProductSizes(product) {
    const sizes = normalizeProductSizes(product);
    if (sizes.length === 0) return `<span class="text-xs text-gray-400 italic">—</span>`;
    return `<div class="flex flex-wrap items-center gap-1 max-w-[180px]">
        ${sizes.map(s => `<span class="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 border border-blue-100 text-kn-blue text-[10px] font-black leading-none">${escapeHTML(s)}</span>`).join("")}
    </div>`;
}

function normalizeImageList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(i => String(i).trim()).filter(Boolean);
    if (typeof value === "string") {
        const text = value.trim();
        if (!text) return [];
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) return parsed.map(i => String(i).trim()).filter(Boolean);
        } catch (e) {}
        return text.split(/[\n,]+/).map(i => i.trim()).filter(Boolean);
    }
    return [];
}

function isSupabaseStorageUrl(url) {
    if (!url || typeof url !== "string") return false;
    return url.includes(`/storage/v1/object/public/${STORAGE_BUCKET}/`) || url.includes(`/storage/v1/object/sign/${STORAGE_BUCKET}/`) || url.includes(`/storage/v1/object/authenticated/${STORAGE_BUCKET}/`);
}

function getStoragePathFromUrl(url) {
    if (!isSupabaseStorageUrl(url)) return null;
    try {
        const parsed = new URL(url);
        const markers = [`/storage/v1/object/public/${STORAGE_BUCKET}/`, `/storage/v1/object/sign/${STORAGE_BUCKET}/`, `/storage/v1/object/authenticated/${STORAGE_BUCKET}/`];
        for (const marker of markers) {
            if (parsed.pathname.includes(marker)) return decodeURIComponent(parsed.pathname.split(marker)[1]);
        }
        return null;
    } catch (e) { return null; }
}

function isOwnProductStorageUrl(url, productId) {
    const path = getStoragePathFromUrl(url);
    if (!path || !productId) return false;
    return path.startsWith(`${STORAGE_PRODUCT_PREFIX}/${productId}/`);
}

function validateImageFile(file) {
    if (!file) throw new Error("Không tìm thấy file ảnh.");
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error(`File "${file.name}" không hợp lệ.`);
    if (file.size > MAX_IMAGE_SIZE) throw new Error(`File "${file.name}" vượt quá 10MB.`);
    return true;
}

function getFileExtension(file) {
    const ext = String(file.name || "").split(".").pop().toLowerCase();
    const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
    if (allowed.includes(ext)) return ext === "jpeg" ? "jpg" : ext;
    const mimeMap = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
    return mimeMap[file.type] || "webp";
}

function createStorageFileName(file, prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${getFileExtension(file)}`;
}

function buildProductImageUrl(imagePath) {
    if (!imagePath || typeof imagePath !== "string") return "";
    const cleanPath = imagePath.trim();
    if (!cleanPath) return "";
    if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
    return `${PRODUCT_IMAGE_CDN_BASE}/${cleanPath.replace(/^\/+/, "")}`;
}

function getStoragePublicUrl(path) {
    const { data } = window.supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    if (!data || !data.publicUrl) throw new Error("Không thể lấy Public URL của ảnh.");
    return data.publicUrl;
}

async function uploadProductImage(file, productId, folder) {
    validateImageFile(file);
    const prefix = folder === "main" ? "main" : "gallery";
    const fileName = createStorageFileName(file, prefix);
    const storagePath = [STORAGE_PRODUCT_PREFIX, productId, folder, fileName].join("/");
    
    const { error } = await window.supabaseClient.storage.from(STORAGE_BUCKET).upload(storagePath, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
    if (error) throw new Error(`Upload ảnh "${file.name}" thất bại: ${error.message}`);
    
    return { path: storagePath, url: getStoragePublicUrl(storagePath) };
}

async function removeStoragePaths(paths) {
    const cleanPaths = [...new Set((paths || []).filter(Boolean))];
    if (cleanPaths.length === 0) return;
    const { error } = await window.supabaseClient.storage.from(STORAGE_BUCKET).remove(cleanPaths);
    if (error) throw error;
}

async function removeUploadedFiles(uploadedFiles) {
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    const paths = uploadedFiles.map(i => i.path).filter(Boolean);
    if (paths.length === 0) return;
    try { await removeStoragePaths(paths); } catch (e) {}
}

/* =========================================================
   MEDIA UI
========================================================= */
function resetMediaDraft() {
    state.mediaDraft = { mainPath: null, mainUrl: null, mainRemoved: false, existingGallery: [], removedGallery: [], pendingMainFile: null, pendingExtraFiles: [] };
}

function renderMainImagePreview(url) {
    if (!DOM.mainImagePreview) return;
    if (!url) {
        DOM.mainImagePreview.innerHTML = `<div class="text-center px-3"><div class="text-[11px] text-gray-400">Chưa có ảnh</div></div>`;
        return;
    }
    DOM.mainImagePreview.innerHTML = `
        <div class="relative w-full h-full group">
            <img src="${escapeAttribute(url)}" alt="Ảnh" class="w-full h-full object-contain bg-white" onerror="this.onerror=null;this.style.display='none';">
            <button type="button" data-media-action="remove-main" class="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-black opacity-0 group-hover:opacity-100 transition hover:bg-red-600">×</button>
            <span class="absolute left-1 bottom-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">Ảnh đại diện</span>
        </div>`;
}

function renderExtraImagesPreview(urls = []) {
    // Basic legacy func
}

function renderPendingExtraFiles() {
    if (!DOM.extraImagesPreview) return;
    state.mediaDraft.pendingExtraFiles.forEach((file, index) => {
        const objectUrl = file.__previewUrl || URL.createObjectURL(file);
        file.__previewUrl = objectUrl;
        
        const wrapper = document.createElement("div");
        wrapper.className = `relative aspect-square rounded-lg border border-blue-200 bg-blue-50 overflow-hidden group`;
        wrapper.dataset.pendingIndex = String(index);
        wrapper.innerHTML = `
            <img src="${escapeAttribute(objectUrl)}" class="w-full h-full object-contain bg-white">
            <button type="button" data-media-action="remove-pending-gallery" data-index="${index}" class="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-black transition hover:bg-red-600">×</button>
            <span class="absolute left-1 bottom-1 px-1.5 py-0.5 rounded bg-kn-blue text-white text-[9px] font-bold">Mới</span>`;
        DOM.extraImagesPreview.appendChild(wrapper);
    });
}

function renderCompleteGalleryPreview() {
    if (!DOM.extraImagesPreview) return;
    DOM.extraImagesPreview.innerHTML = "";
    
    state.mediaDraft.existingGallery.forEach((url, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = `relative aspect-square rounded-lg border border-gray-200 bg-gray-50 overflow-hidden group`;
        wrapper.dataset.galleryUrl = url;
        const galleryImageUrl = buildProductImageUrl(url);
        
        wrapper.innerHTML = `
            <img src="${escapeAttribute(galleryImageUrl)}" class="w-full h-full object-contain bg-white">
            <button type="button" data-media-action="remove-gallery" data-url="${escapeAttribute(url)}" class="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-black opacity-0 group-hover:opacity-100 transition hover:bg-red-600">×</button>
            <span class="absolute left-1 bottom-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">${index + 1}</span>`;
        DOM.extraImagesPreview.appendChild(wrapper);
    });
    renderPendingExtraFiles();
}

function loadExistingMedia(item) {
    resetMediaDraft();
    const mainPathRaw = item?.image_path || null;
    state.mediaDraft.mainPath = getStoragePathFromUrl(mainPathRaw) || mainPathRaw;
    state.mediaDraft.mainUrl = buildProductImageUrl(state.mediaDraft.mainPath);
    state.mediaDraft.existingGallery = normalizeImageList(item?.images);
    
    renderMainImagePreview(state.mediaDraft.mainUrl);
    renderCompleteGalleryPreview();
}

function resetMediaInputs() {
    resetMediaDraft();
    if (DOM.mainImageFile) DOM.mainImageFile.value = "";
    if (DOM.extraImageFiles) DOM.extraImageFiles.value = "";
    renderMainImagePreview("");
    if (DOM.extraImagesPreview) DOM.extraImagesPreview.innerHTML = "";
}

function markMainImageRemoved() {
    if (!state.editingId) {
        state.mediaDraft.mainPath = null;
        state.mediaDraft.mainUrl = null;
        state.mediaDraft.mainRemoved = true;
        renderMainImagePreview("");
        return;
    }
    if (!state.mediaDraft.mainUrl) return;
    if (!window.confirm("Xóa ảnh đại diện hiện tại?")) return;
    state.mediaDraft.mainRemoved = true;
    state.mediaDraft.mainPath = null;
    state.mediaDraft.mainUrl = null;
    renderMainImagePreview("");
}

function markGalleryImageRemoved(url) {
    if (!url) return;
    if (!window.confirm("Xóa ảnh này khỏi gallery?")) return;
    state.mediaDraft.existingGallery = state.mediaDraft.existingGallery.filter(i => i !== url);
    if (!state.mediaDraft.removedGallery.includes(url)) state.mediaDraft.removedGallery.push(url);
    renderCompleteGalleryPreview();
}

function removePendingGalleryFile(index) {
    const numIdx = Number(index);
    if (Number.isNaN(numIdx)) return;
    const file = state.mediaDraft.pendingExtraFiles[numIdx];
    if (file?.__previewUrl) { try { URL.revokeObjectURL(file.__previewUrl); } catch(e){} }
    state.mediaDraft.pendingExtraFiles.splice(numIdx, 1);
    renderCompleteGalleryPreview();
}

function handleMainImageSelected(file) {
    if (!file) return;
    try { validateImageFile(file); } catch (e) {
        showToast(e.message, "error");
        if (DOM.mainImageFile) DOM.mainImageFile.value = "";
        return;
    }
    state.mediaDraft.pendingMainFile = file;
    state.mediaDraft.mainRemoved = false;
    renderMainImagePreview(URL.createObjectURL(file));
}

function handleExtraImagesSelected(files) {
    const selected = Array.from(files || []);
    if (selected.length === 0) return;
    const validFiles = [];
    for (const file of selected) {
        try { validateImageFile(file); validFiles.push(file); } 
        catch (e) { showToast(e.message, "error"); }
    }
    state.mediaDraft.pendingExtraFiles.push(...validFiles);
    if (DOM.extraImageFiles) DOM.extraImageFiles.value = "";
    renderCompleteGalleryPreview();
}

function bindMediaPreviewEvents() {
    DOM.mainImageFile?.addEventListener("change", e => handleMainImageSelected(e.target.files?.[0]));
    DOM.extraImageFiles?.addEventListener("change", e => handleExtraImagesSelected(e.target.files));
    DOM.mainImagePreview?.addEventListener("click", e => {
        const btn = e.target.closest("[data-media-action='remove-main']");
        if (btn) markMainImageRemoved();
    });
    DOM.extraImagesPreview?.addEventListener("click", e => {
        const btn = e.target.closest("[data-media-action]");
        if (!btn) return;
        if (btn.dataset.mediaAction === "remove-gallery") markGalleryImageRemoved(btn.dataset.url);
        if (btn.dataset.mediaAction === "remove-pending-gallery") removePendingGalleryFile(btn.dataset.index);
    });
}

async function uploadPendingMain(productId) {
    const file = state.mediaDraft.pendingMainFile;
    if (!file) return null;
    return await uploadProductImage(file, productId, "main");
}

async function uploadPendingGallery(productId) {
    const files = state.mediaDraft.pendingExtraFiles;
    if (!files || files.length === 0) return [];
    const uploaded = [];
    for (const file of files) {
        uploaded.push(await uploadProductImage(file, productId, "gallery"));
    }
    return uploaded;
}

/* =========================================================
   UI HELPERS - SELECTS & DROPDOWNS
========================================================= */
function populateSelect(element, data, placeholder, placeholderValue = "") {
    if (!element) return;
    element.innerHTML = `
        <option value="${escapeAttribute(placeholderValue)}">${escapeHTML(placeholder)}</option>
        ${(data || []).map(item => `<option value="${escapeAttribute(item.id)}">${escapeHTML(item.name)}</option>`).join("")}
    `;
}

function escapeDropdownHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;","<": "&lt;",">": "&gt;",'"': "&quot;","'": "&#039;"})[c]);
}

/* =========================================================
   BỘ LỌC ĐA NĂNG (ADVANCED FILTERS)
========================================================= */

// Cập nhật Cấp 2 (SubCategory) dựa vào Cấp 1
function updateFilterSubCategories(categoryId) {
    if (!DOM.filterSubCategory || !DOM.filterFamily) return;
    
    if (categoryId && categoryId !== "all") {
        const filtered = state.subCategories.filter(item => String(item.category_id) === String(categoryId));
        populateSelect(DOM.filterSubCategory, filtered, "-- Tất cả nhóm hàng --", "all");
        DOM.filterSubCategory.disabled = false;
    } else {
        populateSelect(DOM.filterSubCategory, [], "-- Chọn danh mục gốc trước --", "all");
        DOM.filterSubCategory.disabled = true;
    }
    
    // Khóa luôn cấp 3
    populateSelect(DOM.filterFamily, [], "-- Chọn nhóm hàng trước --", "all");
    DOM.filterFamily.disabled = true;
    state.filters.subCategory = "all";
    state.filters.family = "all";
}

// Cập nhật Cấp 3 (Family) dựa vào Cấp 2
function updateFilterFamilies(subCategoryId) {
    if (!DOM.filterFamily) return;
    
    if (subCategoryId && subCategoryId !== "all") {
        const filtered = state.families.filter(item => String(item.sub_category_id) === String(subCategoryId));
        populateSelect(DOM.filterFamily, filtered, "-- Tất cả dòng sản phẩm --", "all");
        DOM.filterFamily.disabled = false;
    } else {
        populateSelect(DOM.filterFamily, [], "-- Chọn nhóm hàng trước --", "all");
        DOM.filterFamily.disabled = true;
    }
    state.filters.family = "all";
}

/* =========================================================
   RENDER CHECKBOX BRAND (REFACTORED UX)
========================================================= */
function renderBrandsForFilter(keyword = "") {
    const listContainer = document.getElementById("filterBrandList");
    const selectAllContainer = document.getElementById("selectAllBrandContainer");
    
    if (!listContainer || !selectAllContainer) return;

    const search = keyword.trim().toLowerCase();
    
    // 1. Sắp xếp toàn bộ Brand A-Z
    let sortedBrands = [...state.brands].sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
    
    // 2. Lọc realtime theo từ khóa gõ vào
    let filtered = sortedBrands.filter(b => String(b.name).toLowerCase().includes(search));

    // 3. Xử lý UI nếu không tìm thấy Brand
    if (filtered.length === 0) {
        selectAllContainer.innerHTML = '';
        listContainer.innerHTML = `<div class="p-4 text-sm text-gray-500 text-center">Không tìm thấy thương hiệu</div>`;
        return;
    }

    // 4. Logic "Chọn tất cả" & Trạng thái Indeterminate (Bán phần)
    // Đếm số brand TRONG KẾT QUẢ TÌM KIẾM đang được tick
    const visibleSelectedCount = filtered.filter(b => state.filters.brands.includes(String(b.id))).length;
    const totalVisible = filtered.length;
    
    let isAllChecked = false;
    let isIndeterminate = false;

    if (visibleSelectedCount === 0) {
        isAllChecked = false;
    } else if (visibleSelectedCount === totalVisible) {
        isAllChecked = true;
    } else {
        isAllChecked = false;
        isIndeterminate = true;
    }

    // Wording cho Label
    let selectAllLabel = `Chọn tất cả (${totalVisible})`;
    if (visibleSelectedCount > 0 && visibleSelectedCount < totalVisible) {
        selectAllLabel = `Chọn tất cả (${visibleSelectedCount}/${totalVisible})`;
    }

    selectAllContainer.innerHTML = `
        <label class="flex items-center gap-2 text-sm text-gray-900 font-bold cursor-pointer group">
            <input type="checkbox" id="cbSelectAllBrands" class="w-4 h-4 rounded border-gray-300 text-kn-blue focus:ring-kn-blue cursor-pointer" ${isAllChecked ? 'checked' : ''}>
            <span class="group-hover:text-kn-blue transition-colors">${selectAllLabel}</span>
        </label>
    `;

    // Thiết lập trạng thái Indeterminate cho DOM
    const cbSelectAll = document.getElementById("cbSelectAllBrands");
    if (cbSelectAll) {
        cbSelectAll.indeterminate = isIndeterminate;
    }

    // 5. Render Danh sách Checkbox (Khoảng cách space-y-3 = 12px)
    listContainer.innerHTML = filtered.map(brand => {
        const isSelected = state.filters.brands.includes(String(brand.id));
        return `
            <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer group w-full">
                <input type="checkbox" value="${escapeAttribute(brand.id)}" 
                    class="filter-brand-cb w-4 h-4 rounded border-gray-300 text-kn-blue focus:ring-kn-blue cursor-pointer shrink-0"
                    ${isSelected ? 'checked' : ''}>
                <span class="truncate ${isSelected ? 'font-bold text-kn-blue' : 'group-hover:text-kn-blue transition-colors'}">
                    ${escapeHTML(brand.name)}
                </span>
            </label>
        `;
    }).join("");

    // ==========================================
    // BIND EVENT
    // ==========================================
    
    if (cbSelectAll) {
        cbSelectAll.addEventListener("change", (e) => {
            const isChecked = e.target.checked;
            filtered.forEach(b => {
                const bId = String(b.id);
                if (isChecked) {
                    if (!state.filters.brands.includes(bId)) state.filters.brands.push(bId);
                } else {
                    state.filters.brands = state.filters.brands.filter(id => id !== bId);
                }
            });
            renderBrandsForFilter(keyword); 
        });
    }

    const brandCbs = listContainer.querySelectorAll(".filter-brand-cb");
    brandCbs.forEach(cb => {
        cb.addEventListener("change", (e) => {
            const val = e.target.value;
            if (e.target.checked) {
                if (!state.filters.brands.includes(val)) state.filters.brands.push(val);
            } else {
                state.filters.brands = state.filters.brands.filter(id => id !== val);
            }
            renderBrandsForFilter(keyword); 
        });
    });
}

// Cập nhật State từ DOM (dùng khi Clear Filter)
function syncFiltersToDOM() {
    if(DOM.search) DOM.search.value = state.filters.search;
    if(DOM.filterCategory) DOM.filterCategory.value = state.filters.category;
    if(DOM.filterIndustry) DOM.filterIndustry.value = state.filters.industry;
    if(DOM.filterStock) DOM.filterStock.value = state.filters.stock;
    if(DOM.filterSort) DOM.filterSort.value = state.filters.sort;
    if(DOM.filterOrigin) DOM.filterOrigin.value = state.filters.origin;
    if(DOM.filterPriceMin) DOM.filterPriceMin.value = state.filters.priceMin;
    if(DOM.filterPriceMax) DOM.filterPriceMax.value = state.filters.priceMax;
    if(DOM.filterMoqMin) DOM.filterMoqMin.value = state.filters.moqMin;
    if(DOM.filterMoqMax) DOM.filterMoqMax.value = state.filters.moqMax;
    if(DOM.filterHasImage) DOM.filterHasImage.value = state.filters.hasImage;
    if(DOM.filterHasDatasheet) DOM.filterHasDatasheet.value = state.filters.hasDatasheet;
    if(DOM.filterHasInfo) DOM.filterHasInfo.value = state.filters.hasInfo || "all";
    
    updateFilterSubCategories(state.filters.category);
    if(DOM.filterSubCategory) DOM.filterSubCategory.value = state.filters.subCategory;
    
    updateFilterFamilies(state.filters.subCategory);
    if(DOM.filterFamily) DOM.filterFamily.value = state.filters.family;
    
    renderBrandsForFilter(DOM.filterBrandSearch?.value || "");
}

// Render chuỗi TAG cho những thuộc tính đang được Lọc
function renderActiveFilters() {
    if (!DOM.activeFiltersContainer) return;
    
    const tags = [];
    
    if (state.filters.search) tags.push({ key: 'search', label: `Từ khóa: ${state.filters.search}` });
    if (state.filters.category !== 'all') {
        const cat = state.categories.find(c => String(c.id) === String(state.filters.category));
        if(cat) tags.push({ key: 'category', label: `Danh mục: ${cat.name}` });
    }
    if (state.filters.industry !== 'all') {
        const ind = state.industries.find(i => String(i.id) === String(state.filters.industry));
        if(ind) tags.push({ key: 'industry', label: `Ngành: ${ind.name}` });
    }
    if (state.filters.stock !== 'all') {
        const stockLabels = { 'in_stock': 'Còn hàng', 'out_of_stock': 'Hết hàng' };
        tags.push({ key: 'stock', label: `Tồn kho: ${stockLabels[state.filters.stock]}` });
    }
    if (state.filters.subCategory !== 'all') {
        const sub = state.subCategories.find(s => String(s.id) === String(state.filters.subCategory));
        if(sub) tags.push({ key: 'subCategory', label: `Nhóm: ${sub.name}` });
    }

    if (state.filters.moqMin || state.filters.moqMax) {
        const min = state.filters.moqMin || '1';
        const max = state.filters.moqMax ? `đến ${state.filters.moqMax}` : 'trở lên';
        tags.push({ key: 'moq', label: `MOQ: ${min} ${max}` });
    }
   // Kiểm tra dữ liệu (Đã fix logic, rào chắn giá trị rỗng/undefined)
    if (state.filters.hasImage === 'yes') tags.push({ key: 'hasImage', label: 'Có ảnh' });
    else if (state.filters.hasImage === 'no') tags.push({ key: 'hasImage', label: 'Thiếu ảnh' });

    if (state.filters.hasDatasheet === 'yes') tags.push({ key: 'hasDatasheet', label: 'Có Datasheet' });
    else if (state.filters.hasDatasheet === 'no') tags.push({ key: 'hasDatasheet', label: 'Thiếu Datasheet' });

    if (state.filters.hasInfo === 'yes') tags.push({ key: 'hasInfo', label: 'Đủ thông tin' });
    else if (state.filters.hasInfo === 'no') tags.push({ key: 'hasInfo', label: 'Thiếu thông tin' });

    if (state.filters.family !== 'all') {
        const fam = state.families.find(f => String(f.id) === String(state.filters.family));
        if(fam) tags.push({ key: 'family', label: `Dòng SP: ${fam.name}` });
    }
    if (state.filters.origin !== 'all') tags.push({ key: 'origin', label: `Xuất xứ: ${state.filters.origin}` });
    if (state.filters.priceMin || state.filters.priceMax) {
        const min = state.filters.priceMin ? formatCurrency(state.filters.priceMin) : '0đ';
        const max = state.filters.priceMax ? formatCurrency(state.filters.priceMax) : 'Trở lên';
        tags.push({ key: 'price', label: `Giá: ${min} - ${max}` });
    }
    
    state.filters.brands.forEach(bId => {
        const b = state.brands.find(br => String(br.id) === String(bId));
        if(b) tags.push({ key: 'brand', value: bId, label: `Brand: ${b.name}` });
    });

    if (tags.length === 0) {
        DOM.activeFiltersContainer.innerHTML = `<span class="text-gray-400 italic text-xs">Chưa có bộ lọc</span>`;
        DOM.btnClearAllFilters?.classList.add('hidden');
    } else {
        DOM.activeFiltersContainer.innerHTML = tags.map(t => `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold shadow-sm">
                ${escapeHTML(t.label)}
                <button type="button" class="hover:text-blue-900 focus:outline-none hover:bg-blue-200 rounded-full p-0.5 transition" onclick="removeFilter('${t.key}', '${t.value || ''}')">
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </span>
        `).join('');
        DOM.btnClearAllFilters?.classList.remove('hidden');
    }
}

// Xóa 1 Filter Tag cụ thể hoặc Xóa Tất Cả
window.removeFilter = function(key, value) {
    if (key === 'all') {
        // Reset ĐỒNG BỘ NGUỒN STATE DUY NHẤT
        state.filters = { 
            search: "", category: "all", industry: "all", stock: "all", sort: "newest", 
            subCategory: "all", family: "all", brands: [], origin: "all", 
            priceMin: "", priceMax: "", moqMin: "", moqMax: "", 
            hasImage: "all", hasDatasheet: "all", hasInfo: "all" 
        };
    } else if (key === 'brand') {
        state.filters.brands = state.filters.brands.filter(b => String(b) !== String(value));
    } else if (key === 'price') {
        state.filters.priceMin = ""; state.filters.priceMax = "";
    } else if (key === 'moq') {
        state.filters.moqMin = ""; state.filters.moqMax = "";
    } else if (['hasImage', 'hasDatasheet', 'hasInfo'].includes(key)) {
        state.filters[key] = "all";
    } else {
        state.filters[key] = (key === 'search') ? "" : "all";
    }
    
    syncFiltersToDOM();
    state.currentPage = 1;
    renderActiveFilters();
    fetchProducts();
}


/* =========================================================
   INITIAL DATA LOAD (Dropdowns, Catalogs)
========================================================= */
async function loadAllDropdowns() {
    try {
        const [catRes, subCatRes, famRes, indRes, brandRes] = await Promise.all([
            window.supabaseClient.from("categories").select("id, name").order("name", { ascending: true }),
            window.supabaseClient.from("sub_categories").select("id, name, category_id").order("name", { ascending: true }),
            window.supabaseClient.from("families").select("id, name, sub_category_id").order("name", { ascending: true }),
            window.supabaseClient.from("industries").select("id, name").order("name", { ascending: true }),
            window.supabaseClient.from("brands").select("id, name").order("name", { ascending: true })
        ]);

        if (catRes.error) throw catRes.error;
        if (subCatRes.error) throw subCatRes.error;
        if (famRes.error) throw famRes.error;
        if (indRes.error) throw indRes.error;
        if (brandRes.error) throw brandRes.error;

        state.categories = catRes.data || [];
        state.subCategories = subCatRes.data || [];
        state.families = famRes.data || [];
        state.industries = indRes.data || [];
        state.brands = brandRes.data || [];

        // Cho Form Tạo/Sửa
        populateSelect(DOM.category, state.categories, "-- Chọn danh mục gốc --");
        populateSelect(DOM.industry, state.industries, "-- Chọn ngành hàng --");
        
        // Cho Bộ Lọc
        populateSelect(DOM.filterCategory, state.categories, "Tất cả danh mục", "all");
        populateSelect(DOM.filterIndustry, state.industries, "Tất cả ngành hàng", "all");
        
        if (DOM.filterOrigin) {
            DOM.filterOrigin.innerHTML = `
                <option value="all">Tất cả xuất xứ</option>
                ${ORIGIN_OPTIONS.map(o => `<option value="${escapeAttribute(o)}">${escapeHTML(o)}</option>`).join('')}
            `;
        }

        resetCatalogDropdowns();
        refreshBrandDatalist();
        renderBrandsForFilter(); // Render checkbox brand

    } catch (error) {
        console.error("Lỗi tải Dropdowns:", error);
        showToast("Không thể tải dữ liệu hệ thống.", "error");
    }
}

// Logic cũ của Form nhập sản phẩm
function resetCatalogDropdowns() {
    populateSelect(DOM.subCategory, [], "-- Chọn nhóm hàng --");
    populateSelect(DOM.family, [], "-- Chọn dòng sản phẩm --");
}

function updateSubCategories(categoryId) {
    const filtered = categoryId ? state.subCategories.filter(item => String(item.category_id) === String(categoryId)) : [];
    populateSelect(DOM.subCategory, filtered, "-- Chọn nhóm hàng --");
    populateSelect(DOM.family, [], "-- Chọn dòng sản phẩm --");
}

function updateFamilies(subCategoryId) {
    const filtered = subCategoryId ? state.families.filter(item => String(item.sub_category_id) === String(subCategoryId)) : [];
    populateSelect(DOM.family, filtered, "-- Chọn dòng sản phẩm --");
}


/* =========================================================
   FORM DROPDOWNS: BRAND & ORIGIN TÌM KIẾM
========================================================= */
function refreshBrandDatalist() {
    const brandInput = document.getElementById("brand_input");
    if (brandInput) renderBrandOptions(brandInput.value);
}

function renderBrandOptions(keyword = "") {
    const container = document.getElementById("brandOptions");
    if (!container) return;
    const search = keyword.trim().toLowerCase();
    const brands = state.brands.filter(brand => String(brand.name).toLowerCase().includes(search));

    if (!brands.length) {
        container.innerHTML = `<div class="px-3 py-2.5 text-sm text-gray-400">Không tìm thấy thương hiệu</div>`;
        return;
    }

    container.innerHTML = brands.map(brand => `
        <button type="button" class="block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100" 
            data-brand-id="${escapeDropdownHTML(brand.id)}" data-brand-name="${escapeDropdownHTML(brand.name)}">
            ${escapeDropdownHTML(brand.name)}
        </button>`).join("");

    container.querySelectorAll("[data-brand-id]").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = document.getElementById("brand_input");
            if (input) input.value = btn.dataset.brandName;
            closeBrandDropdown();
        });
    });
}

function renderOriginOptions(keyword = "") {
    const container = document.getElementById("originOptions");
    if (!container) return;
    const search = keyword.trim().toLowerCase();
    const origins = ORIGIN_OPTIONS.filter(origin => origin.toLowerCase().includes(search));

    if (!origins.length) {
        container.innerHTML = `
            <div class="px-3 py-2 border-b text-sm text-gray-500">Không có sẵn.</div>
            <button type="button" class="w-full text-left px-3 py-2 text-sm font-bold text-kn-blue hover:bg-blue-50 transition" onclick="useCustomOrigin('${escapeDropdownHTML(keyword)}')">
                + Thêm mới: "${escapeDropdownHTML(keyword)}"
            </button>`;
        return;
    }

    container.innerHTML = origins.map(origin => `
        <button type="button" class="block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100" data-origin="${escapeDropdownHTML(origin)}">
            ${escapeDropdownHTML(origin)}
        </button>`).join("");

    container.querySelectorAll("[data-origin]").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = document.getElementById("origin_input");
            if (input) input.value = btn.dataset.origin;
            closeOriginDropdown();
        });
    });
}

window.useCustomOrigin = function(val) {
    const input = document.getElementById("origin_input");
    if (input) input.value = val;
    closeOriginDropdown();
}

function openBrandDropdown() {
    const dropdown = document.getElementById("brandDropdown");
    if (!dropdown) return;
    dropdown.classList.remove("hidden");
    renderBrandOptions(document.getElementById("brand_input")?.value || "");
}
function closeBrandDropdown() { document.getElementById("brandDropdown")?.classList.add("hidden"); }
function openOriginDropdown() {
    const dropdown = document.getElementById("originDropdown");
    if (!dropdown) return;
    dropdown.classList.remove("hidden");
    renderOriginOptions(document.getElementById("origin_input")?.value || "");
}
function closeOriginDropdown() { document.getElementById("originDropdown")?.classList.add("hidden"); }

function initBrandOriginDropdowns() {
    const brandInput = document.getElementById("brand_input");
    const originInput = document.getElementById("origin_input");
    if (brandInput) {
        brandInput.addEventListener("focus", openBrandDropdown);
        brandInput.addEventListener("click", openBrandDropdown);
        brandInput.addEventListener("input", () => { openBrandDropdown(); renderBrandOptions(brandInput.value); });
    }
    if (originInput) {
        originInput.addEventListener("focus", openOriginDropdown);
        originInput.addEventListener("click", openOriginDropdown);
        originInput.addEventListener("input", () => { openOriginDropdown(); renderOriginOptions(originInput.value); });
    }
    document.addEventListener("click", e => {
        if (!e.target.closest("#brandSelect")) closeBrandDropdown();
        if (!e.target.closest("#originSelect")) closeOriginDropdown();
    });
}


/* =========================================================
   FETCH & RENDER PRODUCTS BẰNG FILTER MỚI
========================================================= */
async function fetchProducts() {
    if (!DOM.tableBody) return;
    renderTableLoading();

    try {
        const from = (state.currentPage - 1) * state.itemsPerPage;
        const to = from + state.itemsPerPage - 1;

        let query = window.supabaseClient.from("products").select("*, brands(name)", { count: "exact" });

        // 1. Keyword search (OR logic cho tên và SKU)
        if (state.filters.search) {
            const keyword = state.filters.search.replace(/[%_,]/g, "");
            if (keyword) {
                query = query.or(`sku.ilike.%${keyword}%,name.ilike.%${keyword}%`);
            }
        }

        // 2. Quick Filters
        if (state.filters.category !== "all") query = query.eq("category_id", state.filters.category);
        if (state.filters.industry !== "all") query = query.eq("industry_id", state.filters.industry);
        if (state.filters.stock === "in_stock") query = query.gt("stock_quantity", 0);
        if (state.filters.stock === "out_of_stock") query = query.lte("stock_quantity", 0);

        // 3. Advanced Filters
        if (state.filters.subCategory !== "all") query = query.eq("sub_category_id", state.filters.subCategory);
        if (state.filters.family !== "all") query = query.eq("family_id", state.filters.family);
        if (state.filters.origin !== "all") query = query.eq("origin", state.filters.origin);
        if (state.filters.priceMin) query = query.gte("price", state.filters.priceMin);
        if (state.filters.priceMax) query = query.lte("price", state.filters.priceMax);
        if (state.filters.brands.length > 0) query = query.in("brand_id", state.filters.brands);

        if (state.filters.moqMin) query = query.gte("min_order_quantity", state.filters.moqMin);
        if (state.filters.moqMax) query = query.lte("min_order_quantity", state.filters.moqMax);
        
        // Check Ảnh
        if (state.filters.hasImage === 'yes') {
            query = query.not('image_path', 'is', null).neq('image_path', '');
        } else if (state.filters.hasImage === 'no') {
            query = query.or('image_path.is.null,image_path.eq.""');
        }
        
        // Check Datasheet
        if (state.filters.hasDatasheet === 'yes') {
            query = query.not('datasheet_url', 'is', null).neq('datasheet_url', '');
        } else if (state.filters.hasDatasheet === 'no') {
            query = query.or('datasheet_url.is.null,datasheet_url.eq.""');
        }
        
        // 4. Sort
        switch(state.filters.sort) {
            case 'newest': query = query.order('created_at', { ascending: false }); break;
            case 'oldest': query = query.order('created_at', { ascending: true }); break;
            case 'name_asc': query = query.order('name', { ascending: true }); break;
            case 'name_desc': query = query.order('name', { ascending: false }); break;
            case 'price_asc': query = query.order('price', { ascending: true }); break;
            case 'price_desc': query = query.order('price', { ascending: false }); break;
            case 'stock_asc': query = query.order('stock_quantity', { ascending: true }); break;
            case 'stock_desc': query = query.order('stock_quantity', { ascending: false }); break;
            default: query = query.order('created_at', { ascending: false }); break;
        }

        const { data, count, error } = await query.range(from, to);
        if (error) throw error;

        state.products = data || [];
        state.totalItems = count || 0;
        
        // Cập nhật Count ngay trên UI Lọc
        if (DOM.filteredCountDisplay) DOM.filteredCountDisplay.textContent = state.totalItems;

        updateStatistics();
        renderProducts();
        renderPagination();

    } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
        DOM.tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-12 text-red-500 font-bold">
                    Không thể tải danh sách sản phẩm.
                    <div class="text-xs font-normal mt-1 text-red-400">${escapeHTML(error.message)}</div>
                </td>
            </tr>`;
    }
}

function renderTableLoading() {
    if (!DOM.tableBody) return;
    DOM.tableBody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center py-12 text-gray-400">
                <div class="inline-block w-6 h-6 border-2 border-kn-blue border-t-transparent rounded-full animate-spin"></div>
                <div class="mt-2 text-sm font-medium">Đang tải cấu hình...</div>
            </td>
        </tr>`;
}


/* =========================================================
   STATISTICS (Thống kê toàn cục)
========================================================= */
async function updateStatistics() {
    try {
        const { count: totalCount } = await window.supabaseClient.from("products").select("id", { count: "exact", head: true });
        const { count: inStockCount } = await window.supabaseClient.from("products").select("id", { count: "exact", head: true }).gt("stock_quantity", 0);
        const { count: outOfStockCount } = await window.supabaseClient.from("products").select("id", { count: "exact", head: true }).lte("stock_quantity", 0);
        const { data: saleProducts } = await window.supabaseClient.from("products").select("price, discount_price");
        
        const onSaleCount = (saleProducts || []).filter(p => Number(p.price) > 0 && Number(p.discount_price) > 0 && Number(p.discount_price) < Number(p.price)).length;

        if (DOM.total) DOM.total.textContent = totalCount || 0;
        if (DOM.inStock) DOM.inStock.textContent = inStockCount || 0;
        if (DOM.outOfStock) DOM.outOfStock.textContent = outOfStockCount || 0;
        if (DOM.onSale) DOM.onSale.textContent = onSaleCount || 0;
    } catch (error) {
        if (DOM.total) DOM.total.textContent = "—";
        if (DOM.inStock) DOM.inStock.textContent = "—";
        if (DOM.outOfStock) DOM.outOfStock.textContent = "—";
        if (DOM.onSale) DOM.onSale.textContent = "—";
    }
}


/* =========================================================
   RENDER PRODUCTS
========================================================= */
function renderProducts() {
    if (!DOM.tableBody) return;
    if (state.products.length === 0) {
        DOM.tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-14 text-gray-400 italic">Không tìm thấy sản phẩm phù hợp.</td></tr>`;
        return;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;
    DOM.tableBody.innerHTML = state.products.map((item, index) => {
        const brandName = item.brands?.name || "OEM";
        const imageUrl = buildProductImageUrl(item.image_path);
        
        const imageHTML = imageUrl
            ? `<img src="${escapeAttribute(imageUrl)}" class="w-10 h-10 object-contain mx-auto border border-gray-200 rounded-lg bg-white" loading="lazy" onerror="this.onerror=null;this.src='../assets/images/world mark.png';">`
            : `<div class="w-10 h-10 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-[9px] text-gray-400 mx-auto">No Img</div>`;

        return `
            <tr class="border-b border-gray-100 hover:bg-blue-50/30 transition">
                <td class="px-4 py-3 text-center font-bold text-gray-400 text-xs">${from + index + 1}</td>
                <td class="px-4 py-3 text-center">${imageHTML}</td>
                <td class="px-4 py-3 font-mono font-bold text-kn-blue text-xs whitespace-nowrap">${escapeHTML(item.sku)}</td>
                <td class="px-4 py-3 font-bold text-gray-800 text-sm line-clamp-2" title="${escapeHTML(item.name)}">${escapeHTML(item.name)}</td>
                <td class="px-4 py-3 text-gray-600 text-xs font-bold">${escapeHTML(brandName)}</td>
                <td class="px-4 py-3">${renderProductSizes(item)}</td>
                <td class="px-4 py-3 text-gray-800 font-bold text-sm whitespace-nowrap">${formatCurrency(item.price)}</td>
                <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${Number(item.stock_quantity) > 0 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}">
                        ${Number(item.stock_quantity) > 0 ? Number(item.stock_quantity) : "Hết hàng"}
                    </span>
                </td>
                <td class="px-4 py-3 text-center whitespace-nowrap">
                    <button type="button" data-action="edit" data-id="${escapeAttribute(item.id)}" class="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition font-bold text-xs uppercase">Sửa</button>
                    <button type="button" data-action="delete" data-id="${escapeAttribute(item.id)}" class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition font-bold text-xs uppercase">Xóa</button>
                </td>
            </tr>`;
    }).join("");
}

/* =========================================================
   PAGINATION
========================================================= */
function renderPagination() {
    if (!DOM.pagination) return;
    const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
    if (totalPages <= 1) { DOM.pagination.innerHTML = ""; return; }

    let startPage = Math.max(1, state.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage + 1 < 5) startPage = Math.max(1, endPage - 4);

    const pages = [];
    for (let p = startPage; p <= endPage; p++) pages.push(p);

    DOM.pagination.innerHTML = `
        <div class="text-xs text-gray-500 font-medium">Trang <strong>${state.currentPage}</strong> / ${totalPages}</div>
        <div class="flex items-center gap-1.5">
            <button type="button" data-page-action="prev" ${state.currentPage === 1 ? "disabled" : ""} class="px-3 py-1.5 rounded-lg text-xs font-bold border ${state.currentPage === 1 ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}">← Trước</button>
            ${pages.map(p => `<button type="button" data-page="${p}" class="px-3 py-1.5 rounded-lg text-xs font-bold border ${p === state.currentPage ? 'bg-kn-blue text-white border-kn-blue' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}">${p}</button>`).join("")}
            <button type="button" data-page-action="next" ${state.currentPage === totalPages ? "disabled" : ""} class="px-3 py-1.5 rounded-lg text-xs font-bold border ${state.currentPage === totalPages ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}">Sau →</button>
        </div>`;
}

/* =========================================================
   FORM ACTIONS (Add/Edit/Cancel)
========================================================= */
function showAddForm() {
    state.editingId = null;
    if (DOM.form) DOM.form.reset();
    resetCatalogDropdowns();
    resetMediaInputs();
    if (typeof CKEDITOR !== "undefined" && CKEDITOR.instances.description) CKEDITOR.instances.description.setData("");
    if (DOM.formTitle) DOM.formTitle.textContent = "Nhập Sản Phẩm Mới";
    if (DOM.btnSubmit) DOM.btnSubmit.textContent = "Nhập kho sản phẩm";
    
    DOM.listView?.classList.add("hidden");
    DOM.formView?.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelForm() {
    state.editingId = null;
    resetMediaInputs();
    DOM.formView?.classList.add("hidden");
    DOM.listView?.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function editProduct(id) {
    const item = state.products.find(p => String(p.id) === String(id));
    if (!item) { showToast("Không tìm thấy sản phẩm.", "error"); return; }
    
    state.editingId = item.id;
    
    document.getElementById("sku").value = item.sku || "";
    document.getElementById("name").value = item.name || "";
    document.getElementById("origin_input").value = item.origin || "";
    document.getElementById("price").value = item.price ?? "";
    document.getElementById("discount_price").value = item.discount_price ?? "";
    document.getElementById("unit").value = item.unit || "Cái";
    document.getElementById("stock_quantity").value = item.stock_quantity ?? 0;
    document.getElementById("min_order_quantity").value = item.min_order_quantity ?? 1;
    document.getElementById("badge").value = item.badge || "";
    document.getElementById("available_sizes").value = normalizeProductSizes(item).join(", ");
    document.getElementById("inDatasheet").value = item.datasheet_url || "";
    document.getElementById("short_description").value = item.short_description || "";
    document.getElementById("specifications").value = item.specifications || "";
    
    if (typeof CKEDITOR !== "undefined" && CKEDITOR.instances.description) {
        CKEDITOR.instances.description.setData(item.description || "");
    }
    
    if (DOM.category) DOM.category.value = item.category_id || "";
    updateSubCategories(item.category_id);
    if (DOM.subCategory) DOM.subCategory.value = item.sub_category_id || "";
    updateFamilies(item.sub_category_id);
    if (DOM.family) DOM.family.value = item.family_id || "";
    if (DOM.industry) DOM.industry.value = item.industry_id || "";
    
    const brandInput = document.getElementById("brand_input");
    if (brandInput) {
        const foundBrand = state.brands.find(b => String(b.id) === String(item.brand_id));
        brandInput.value = foundBrand?.name || "";
    }
    
    loadExistingMedia(item);
    
    if (DOM.formTitle) DOM.formTitle.textContent = `Sửa Sản Phẩm: ${item.sku}`;
    if (DOM.btnSubmit) DOM.btnSubmit.textContent = "Cập nhật sản phẩm";
    
    DOM.listView?.classList.add("hidden");
    DOM.formView?.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================================
   GATHER DATA FOR SAVING
========================================================= */
function getDescriptionValue() {
    if (typeof CKEDITOR !== "undefined" && CKEDITOR.instances.description) return CKEDITOR.instances.description.getData();
    return document.getElementById("description")?.value || "";
}

async function resolveBrandId() {
    const brandInput = document.getElementById("brand_input");
    const name = brandInput ? brandInput.value.trim() : "";
    if (!name) return null;
    
    const found = state.brands.find(b => b.name.toLowerCase() === name.toLowerCase());
    if (found) return found.id;
    
    const { data, error } = await window.supabaseClient.from("brands").insert([{ name }]).select("id, name").single();
    if (error) throw new Error("Lỗi khi tạo thương hiệu mới: " + error.message);
    
    state.brands.push(data);
    refreshBrandDatalist();
    return data.id;
}

function getAvailableSizes() {
    const input = document.getElementById("available_sizes");
    const text = input ? input.value.trim() : "";
    if (!text) return null;
    const sizes = [...new Set(text.split(",").map(s => s.trim()).filter(Boolean))];
    return sizes.length ? sizes : null;
}

function buildProductPayload(brandId) {
    return {
        sku: document.getElementById("sku").value.trim(),
        name: document.getElementById("name").value.trim(),
        available_sizes: getAvailableSizes(),
        category_id: document.getElementById("category_id").value || null,
        sub_category_id: document.getElementById("sub_category_id").value || null,
        family_id: document.getElementById("family_id").value || null,
        industry_id: document.getElementById("industrySelect").value || null,
        brand_id: brandId,
        origin: document.getElementById("origin_input").value.trim() || null,
        price: document.getElementById("price").value || null,
        discount_price: document.getElementById("discount_price").value || null,
        unit: document.getElementById("unit").value || "Cái",
        stock_quantity: document.getElementById("stock_quantity").value || 0,
        min_order_quantity: document.getElementById("min_order_quantity").value || 1,
        badge: document.getElementById("badge").value || null,
        datasheet_url: document.getElementById("inDatasheet").value.trim() || null,
        short_description: document.getElementById("short_description").value.trim() || null,
        specifications: document.getElementById("specifications").value.trim() || null,
        description: getDescriptionValue() || null
    };
}

function buildFinalGalleryPaths(newExtraUploads) {
    const uploadedPaths = (newExtraUploads || []).map(i => i.path).filter(Boolean);
    return [...new Set([...state.mediaDraft.existingGallery, ...uploadedPaths])];
}

async function cleanupRemovedMedia(productId, oldMainPath, oldGalleryPaths, finalMainPath, finalGalleryPaths) {
    const pathsToDelete = [];
    if (oldMainPath && oldMainPath !== finalMainPath && oldMainPath.startsWith(`${STORAGE_PRODUCT_PREFIX}/${productId}/`)) {
        pathsToDelete.push(oldMainPath);
    }
    const finalSet = new Set(finalGalleryPaths);
    for (const oldGalleryItem of oldGalleryPaths) {
        if (finalSet.has(oldGalleryItem)) continue;
        const path = getStoragePathFromUrl(oldGalleryItem) || oldGalleryItem;
        if (!path || !path.startsWith(`${STORAGE_PRODUCT_PREFIX}/${productId}/`)) continue;
        pathsToDelete.push(path);
    }
    if (pathsToDelete.length === 0) return;
    try { await removeStoragePaths(pathsToDelete); } catch (error) {
        console.warn("Lỗi dọn ảnh cũ:", error);
    }
}

/* =========================================================
   SAVE PRODUCT (Main Logic)
========================================================= */
async function saveProduct(event) {
    if (event) event.preventDefault();
    const btn = DOM.btnSubmit;
    if (!btn) return;

    const originalText = btn.textContent;
    btn.disabled = true;
    let insertedProductId = null;
    const uploadedFiles = [];

    try {
        if (!window.supabaseClient) throw new Error("Chưa kết nối Supabase.");
        
        const sku = document.getElementById("sku").value.trim();
        const name = document.getElementById("name").value.trim();
        if (!sku) throw new Error("Mã SKU là bắt buộc!");
        if (!name) throw new Error("Tên sản phẩm là bắt buộc!");

        if (state.mediaDraft.pendingMainFile) validateImageFile(state.mediaDraft.pendingMainFile);
        for (const file of state.mediaDraft.pendingExtraFiles) validateImageFile(file);

        btn.textContent = "Đang kiểm tra thương hiệu...";
        const brandId = await resolveBrandId();
        const payload = buildProductPayload(brandId);

        // CREATE NEW
        if (!state.editingId) {
            btn.textContent = "Đang tạo sản phẩm...";
            const { data: newProduct, error } = await window.supabaseClient.from("products").insert([payload]).select("id").maybeSingle();
            if (error) throw error;
            if (!newProduct?.id) throw new Error("Không lấy được ID sản phẩm vừa tạo.");
            
            insertedProductId = newProduct.id;
            
            let mainUpload = null;
            if (state.mediaDraft.pendingMainFile) {
                btn.textContent = "Đang tải ảnh đại diện...";
                mainUpload = await uploadPendingMain(insertedProductId);
                if (mainUpload) uploadedFiles.push(mainUpload);
            }
            
            btn.textContent = "Đang tải ảnh phụ...";
            const extraUploads = await uploadPendingGallery(insertedProductId);
            uploadedFiles.push(...extraUploads);
            
            const mediaPayload = {
                image_path: mainUpload?.path || null,
                images: extraUploads.length > 0 ? JSON.stringify(extraUploads.map(i => i.path)) : null
            };

            if (mediaPayload.image_path || mediaPayload.images) {
                btn.textContent = "Đang lưu ảnh...";
                const { error: mediaError } = await window.supabaseClient.from("products").update(mediaPayload).eq("id", insertedProductId);
                if (mediaError) throw mediaError;
            }

            state.currentPage = 1;
            showToast("Thêm sản phẩm thành công!", "success");
        } 
        // UPDATE EXISTING
        else {
            const productId = state.editingId;
            const currentItem = state.products.find(p => String(p.id) === String(productId));
            if (!currentItem) throw new Error("Không tìm thấy dữ liệu sản phẩm.");

            const oldMainPathRaw = currentItem.image_path || null;
            const oldMainPath = getStoragePathFromUrl(oldMainPathRaw) || oldMainPathRaw;
            const oldGalleryPaths = normalizeImageList(currentItem.images);

            let newMainUpload = null;
            if (state.mediaDraft.pendingMainFile) {
                btn.textContent = "Đang tải ảnh đại diện mới...";
                newMainUpload = await uploadPendingMain(productId);
                if (newMainUpload) uploadedFiles.push(newMainUpload);
            }

            btn.textContent = "Đang tải ảnh phụ mới...";
            const newExtraUploads = await uploadPendingGallery(productId);
            uploadedFiles.push(...newExtraUploads);

            let finalMainPath = state.mediaDraft.mainPath;
            if (newMainUpload) finalMainPath = newMainUpload.path;
            if (state.mediaDraft.mainRemoved && !newMainUpload) finalMainPath = null;
            
            const finalGalleryPaths = buildFinalGalleryPaths(newExtraUploads);

            payload.image_path = finalMainPath || null;
            payload.images = finalGalleryPaths.length > 0 ? JSON.stringify(finalGalleryPaths) : null;

            btn.textContent = "Đang cập nhật sản phẩm...";
            const { error } = await window.supabaseClient.from("products").update(payload).eq("id", productId);
            if (error) throw error;

            btn.textContent = "Đang dọn ảnh cũ...";
            await cleanupRemovedMedia(productId, oldMainPath, oldGalleryPaths, finalMainPath, finalGalleryPaths);

            showToast("Đã cập nhật sản phẩm!", "success");
        }

        cancelForm();
        await fetchProducts();

    } catch (error) {
        console.error("Lỗi lưu sản phẩm:", error);
        if (uploadedFiles.length > 0) await removeUploadedFiles(uploadedFiles);
        if (insertedProductId) {
            try { await window.supabaseClient.from("products").delete().eq("id", insertedProductId); } catch (e) {}
        }
        let message = error.message || "Không thể lưu sản phẩm.";
        if (message.includes("duplicate key") || message.includes("products_sku_key")) {
            message = "Mã SKU này đã tồn tại. Vui lòng sử dụng SKU khác.";
        }
        showToast("Lỗi khi lưu: " + message, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

/* =========================================================
   DELETE PRODUCT
========================================================= */
async function deleteProduct(id) {
    const item = state.products.find(p => String(p.id) === String(id));
    if (!item) { showToast("Không tìm thấy sản phẩm.", "error"); return; }
    if (!window.confirm(`Xóa vĩnh viễn sản phẩm "${item.name}"?\n\nSKU: ${item.sku}\nToàn bộ ảnh sẽ bị xóa.`)) return;

    try {
        const productFolder = `products/${id}`;
        const storagePaths = [];

        async function collectStorageFiles(folder) {
            const { data, error } = await window.supabaseClient.storage.from("product-images").list(folder, { limit: 1000, offset: 0 });
            if (error) throw error;
            (data || []).forEach(file => { if (file && file.name && file.id) storagePaths.push(`${folder}/${file.name}`); });
        }

        await collectStorageFiles(`${productFolder}/main`);
        await collectStorageFiles(`${productFolder}/gallery`);

        if (storagePaths.length > 0) {
            const { error: storageError } = await window.supabaseClient.storage.from("product-images").remove(storagePaths);
            if (storageError) throw storageError;
        }

        const { error: deleteError } = await window.supabaseClient.from("products").delete().eq("id", id);
        if (deleteError) throw deleteError;

        if (state.products.length === 1 && state.currentPage > 1) state.currentPage--;
        showToast(`Đã xóa sản phẩm và ${storagePaths.length} ảnh.`, "success");
        await fetchProducts();

    } catch (error) {
        console.error("Lỗi xóa sản phẩm:", error);
        showToast("Lỗi xóa: " + error.message, "error");
    }
}

/* =========================================================
   TOAST NOTIFICATION
========================================================= */
function showToast(message, type = "success") {
    if (!DOM.toast) return;
    const toast = document.createElement("div");
    const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
    toast.className = `${bgColor} text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 translate-y-0 opacity-100 mb-2 font-bold text-sm flex items-center gap-2 z-50`;
    toast.innerHTML = `<span>${type === "success" ? "✔" : "⚠"}</span><span>${escapeHTML(message)}</span>`;
    DOM.toast.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


/* =========================================================
   EVENTS BINDING
========================================================= */
function bindEvents() {

    // Gắn sự kiện Xóa chọn Brand
    document.getElementById("btnClearBrands")?.addEventListener("click", () => {
        state.filters.brands = [];
        renderBrandsForFilter(DOM.filterBrandSearch?.value || "");
    });

    // FORM TOGGLE
    DOM.btnAdd?.addEventListener("click", showAddForm);
    DOM.btnBack?.addEventListener("click", cancelForm);
    DOM.btnCancel?.addEventListener("click", cancelForm);
    DOM.form?.addEventListener("submit", saveProduct);

    // FORM CATEGORY CASCADE
    DOM.category?.addEventListener("change", e => updateSubCategories(e.target.value));
    DOM.subCategory?.addEventListener("change", e => updateFamilies(e.target.value));

    // ADVANCED FILTER TOGGLE
    DOM.btnToggleAdvanced?.addEventListener("click", () => {
        DOM.advancedPanel?.classList.toggle("hidden");
        renderBrandsForFilter(DOM.filterBrandSearch?.value || "");
    });
    DOM.btnCancelAdvanced?.addEventListener("click", () => DOM.advancedPanel?.classList.add("hidden"));

    // QUICK FILTERS
    let searchTimer;
    DOM.search?.addEventListener("input", event => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.filters.search = event.target.value.trim();
            state.currentPage = 1;
            renderActiveFilters();
            fetchProducts();
        }, 500);
    });

    ['filterCategory', 'filterIndustry', 'filterStock', 'filterSort'].forEach(key => {
        DOM[key]?.addEventListener("change", event => {
            const val = event.target.value;
            if (key === 'filterCategory') {
                state.filters.category = val;
                updateFilterSubCategories(val);
            } else if (key === 'filterIndustry') {
                state.filters.industry = val;
            } else if (key === 'filterStock') {
                state.filters.stock = val;
            } else if (key === 'filterSort') {
                state.filters.sort = val;
            }
            state.currentPage = 1;
            renderActiveFilters();
            fetchProducts();
        });
    });

    // ADVANCED FILTER LOGIC
    DOM.filterSubCategory?.addEventListener("change", event => updateFilterFamilies(event.target.value));
    DOM.filterBrandSearch?.addEventListener("input", event => renderBrandsForFilter(event.target.value));
    
    DOM.btnApplyAdvanced?.addEventListener("click", () => {
        state.filters.subCategory = DOM.filterSubCategory?.value || "all";
        state.filters.family = DOM.filterFamily?.value || "all";
        state.filters.origin = DOM.filterOrigin?.value || "all";
        state.filters.priceMin = DOM.filterPriceMin?.value || "";
        state.filters.priceMax = DOM.filterPriceMax?.value || "";
        state.filters.moqMin = DOM.filterMoqMin?.value || "";
        state.filters.moqMax = DOM.filterMoqMax?.value || "";
        state.filters.hasImage = DOM.filterHasImage?.value || "all";
        state.filters.hasDatasheet = DOM.filterHasDatasheet?.value || "all";
        state.filters.hasInfo = DOM.filterHasInfo?.value || "all";
        
        state.filters.brands = Array.from(document.querySelectorAll('.filter-brand-cb:checked')).map(cb => cb.value);

        DOM.advancedPanel?.classList.add("hidden");
        state.currentPage = 1;
        renderActiveFilters();
        fetchProducts();
    });

    DOM.btnClearAllFilters?.addEventListener("click", () => window.removeFilter('all'));

    // TABLE ACTIONS
    DOM.tableBody?.addEventListener("click", event => {
        const btn = event.target.closest("button[data-action]");
        if (!btn) return;
        if (btn.dataset.action === "edit") editProduct(btn.dataset.id);
        if (btn.dataset.action === "delete") deleteProduct(btn.dataset.id);
    });

    // PAGINATION
    DOM.pagination?.addEventListener("click", event => {
        const pageBtn = event.target.closest("button[data-page]");
        if (pageBtn) {
            const page = Number(pageBtn.dataset.page);
            if (page && page !== state.currentPage) { state.currentPage = page; fetchProducts(); }
            return;
        }
        const actionBtn = event.target.closest("button[data-page-action]");
        if (!actionBtn) return;
        const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
        if (actionBtn.dataset.pageAction === "prev" && state.currentPage > 1) { state.currentPage--; fetchProducts(); }
        if (actionBtn.dataset.pageAction === "next" && state.currentPage < totalPages) { state.currentPage++; fetchProducts(); }
    });
}

function initCKEditor() {
    if (typeof CKEDITOR === "undefined") return;
    const desc = document.getElementById("description");
    if (!desc) return;
    if (!CKEDITOR.instances.description) CKEDITOR.replace("description", { height: 250 });
}

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
    initCKEditor();
    initBrandOriginDropdowns();
    bindEvents();
    bindMediaPreviewEvents();
    
    await loadAllDropdowns();
    await fetchProducts();
});

/* GLOBAL EXPORTS */
window.showAddForm = showAddForm;
window.cancelForm = cancelForm;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.fetchProducts = fetchProducts;