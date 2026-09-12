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
let autoSlugTimer = null;
let autoSlugRequestId = 0;

const state = {
    products: [],
    categories: [],
    subCategories: [],
    families: [],
    industries: [],
    brands: [],
    editingId: null,
    editingSlugSource: "auto",
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
        moqMin: "",
        moqMax: "",
        hasImage: "all",
        hasDatasheet: "all",
        hasInfo: "all",
        hasBrand: "all",
        hasOrigin: "all", 
        hasDesc: "all", 
        hasSpecs: "all"
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
    dataQualityDashboard:
        document.getElementById("dataQualityDashboard"),

    dataQualityTotal:
        document.getElementById("dataQualityTotal"),

    dataQualityGrid:
        document.getElementById("dataQualityGrid"),

    // SEO
    slug: document.getElementById("slug"),
    slugSourceLabel: document.getElementById("slugSourceLabel"),
    metaTitle: document.getElementById("meta_title"),
    metaDescription: document.getElementById("meta_description"),
    seoPreview: document.getElementById("seoPreview"),
    seoPreviewTitle: document.getElementById("seoPreviewTitle"),
    seoPreviewUrl: document.getElementById("seoPreviewUrl"),
    seoPreviewDescription: document.getElementById("seoPreviewDescription"),
    isH1: document.getElementById("is_h1"),
    btnCopySlug: document.getElementById("btnCopySlug"),
    btnViewSlug: document.getElementById("btnViewSlug"),
    metaTitleCount: document.getElementById("metaTitleCount"),
    metaDescriptionCount: document.getElementById("metaDescriptionCount"),

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
   SEO SLUG HELPERS
========================================================= */
function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function getSlugSource() {
    return state.editingSlugSource === "manual" ? "manual" : "auto";
}

async function ensureUniqueSlug(baseSlug, productId = null) {
    const cleanSlug = slugify(baseSlug);
    if (!cleanSlug) return "";

    let candidate = cleanSlug;
    let suffix = 2;

    while (true) {
        let query = window.supabaseClient
            .from("products")
            .select("id")
            .eq("slug", candidate)
            .limit(1);

        if (productId) query = query.neq("id", productId);

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) return candidate;

        candidate = `${cleanSlug}-${suffix++}`;
    }
}

async function updateAutoSlug({ force = false } = {}) {
    if (!DOM.slug) return;

    const name = document.getElementById("name")?.value?.trim() || "";
    if (!name) {
        DOM.slug.value = "";
        updateSlugSourceUI();
        return;
    }

    if (!force && getSlugSource() !== "auto") return;

    const requestId = ++autoSlugRequestId;

    try {
        const slug = await ensureUniqueSlug(slugify(name), state.editingId);

        // Bỏ qua kết quả cũ nếu admin đã gõ/đổi tên tiếp trong lúc chờ DB.
        if (requestId !== autoSlugRequestId) return;
        if (!force && getSlugSource() !== "auto") return;

        DOM.slug.value = slug;
        state.editingSlugSource = "auto";
        updateSlugSourceUI();
    } catch (error) {
        console.error("Lỗi tạo slug:", error);
    }
}

function scheduleAutoSlug() {
    clearTimeout(autoSlugTimer);

    if (getSlugSource() !== "auto") return;

    autoSlugTimer = setTimeout(() => {
        updateAutoSlug();
    }, 350);
}

function updateSlugSourceUI() {
    if (!DOM.slugSourceLabel) return;
    DOM.slugSourceLabel.textContent =
        getSlugSource() === "manual" ? "Thủ công" : "Tự động";
}

function markSlugManual() {
    if (!DOM.slug) return;
    state.editingSlugSource = "manual";
    updateSlugSourceUI();
}

function handleSlugInput() {
    if (!DOM.slug) return;

    let value = DOM.slug.value;

    // Cho phép nhập slug tự nhiên:
    // - chữ cái a-z
    // - số 0-9
    // - dấu gạch ngang "-"
    value = value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");

    DOM.slug.value = value;

    // Có nội dung => người dùng đang chỉnh slug thủ công
    if (value) {
        state.editingSlugSource = "manual";
        ++autoSlugRequestId;
        clearTimeout(autoSlugTimer);
    } else {
        // Xóa hết slug => quay lại Auto
        state.editingSlugSource = "auto";
        scheduleAutoSlug();
    }

    updateSlugSourceUI();
}

async function copyCurrentSlug() {
    const slug = DOM.slug?.value?.trim() || "";
    if (!slug) {
        showToast("Chưa có slug để sao chép.", "error");
        return;
    }

    try {
        await navigator.clipboard.writeText(slug);
        showToast("Đã sao chép slug.", "success");
    } catch (error) {
        const temp = document.createElement("textarea");
        temp.value = slug;
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();

        try {
            document.execCommand("copy");
            showToast("Đã sao chép slug.", "success");
        } catch (copyError) {
            showToast("Không thể sao chép slug.", "error");
        } finally {
            temp.remove();
        }
    }
}

function getProductSlugUrl() {
    const slug = DOM.slug?.value?.trim() || "";
    if (!slug) return "";

    const productId = state.editingId;

    if (!productId) {
        showToast("Sản phẩm chưa được lưu nên chưa có trang để xem.", "error");
        return "";
    }

    return `${window.location.origin}/product-detail.html?id=${encodeURIComponent(productId)}`;
}

function viewCurrentSlug() {
    const url = getProductSlugUrl();

    if (!url) {
        showToast("Chưa có slug để xem.", "error");
        return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
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

/* =========================================================
   SIZE (Đã nới rộng và cấm bẻ chữ)
========================================================= */
function renderProductSizes(product) {
    const sizes = normalizeProductSizes(product);

    if (sizes.length === 0) {
        return `<span class="text-xs text-gray-400 italic">—</span>`;
    }

    return `
        <div class="flex flex-wrap items-center gap-1.5 min-w-[160px] max-w-[260px]">
            ${sizes.map(size => `
                <span class="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 border border-blue-100 text-kn-blue text-[10px] font-black leading-none whitespace-nowrap">
                    ${escapeHTML(size)}
                </span>
            `).join("")}
        </div>
    `;
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
function updateFilterSubCategories(categoryId, preserveSelection = false) {
    if (!DOM.filterSubCategory || !DOM.filterFamily) return;

    const previousSubCategory = preserveSelection
        ? state.filters.subCategory
        : "all";
    const previousFamily = preserveSelection
        ? state.filters.family
        : "all";

    if (categoryId && categoryId !== "all") {
        const filtered = state.subCategories.filter(
            item => String(item.category_id) === String(categoryId)
        );
        populateSelect(DOM.filterSubCategory, filtered, "-- Tất cả nhóm hàng --", "all");
        DOM.filterSubCategory.disabled = false;
    } else {
        populateSelect(DOM.filterSubCategory, [], "-- Chọn danh mục gốc trước --", "all");
        DOM.filterSubCategory.disabled = true;
    }

    const hasSubSelection =
        previousSubCategory !== "all" &&
        Array.from(DOM.filterSubCategory.options).some(
            option => String(option.value) === String(previousSubCategory)
        );

    if (hasSubSelection) {
        DOM.filterSubCategory.value = previousSubCategory;
        state.filters.subCategory = previousSubCategory;
        updateFilterFamilies(previousSubCategory, true);

        const hasFamilySelection =
            previousFamily !== "all" &&
            Array.from(DOM.filterFamily.options).some(
                option => String(option.value) === String(previousFamily)
            );

        if (hasFamilySelection) {
            DOM.filterFamily.value = previousFamily;
            state.filters.family = previousFamily;
        } else {
            state.filters.family = "all";
        }
    } else {
        populateSelect(DOM.filterFamily, [], "-- Chọn nhóm hàng trước --", "all");
        DOM.filterFamily.disabled = true;
        state.filters.subCategory = "all";
        state.filters.family = "all";
    }
}

// Cập nhật Cấp 3 (Family) dựa vào Cấp 2
function updateFilterFamilies(subCategoryId, preserveSelection = false) {
    if (!DOM.filterFamily) return;

    const previousFamily = preserveSelection
        ? state.filters.family
        : "all";

    if (subCategoryId && subCategoryId !== "all") {
        const filtered = state.families.filter(
            item => String(item.sub_category_id) === String(subCategoryId)
        );
        populateSelect(DOM.filterFamily, filtered, "-- Tất cả dòng sản phẩm --", "all");
        DOM.filterFamily.disabled = false;
    } else {
        populateSelect(DOM.filterFamily, [], "-- Chọn nhóm hàng trước --", "all");
        DOM.filterFamily.disabled = true;
    }

    const hasFamilySelection =
        preserveSelection &&
        previousFamily !== "all" &&
        Array.from(DOM.filterFamily.options).some(
            option => String(option.value) === String(previousFamily)
        );

    if (hasFamilySelection) {
        DOM.filterFamily.value = previousFamily;
        state.filters.family = previousFamily;
    } else {
        state.filters.family = "all";
    }
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
    if (DOM.search) DOM.search.value = state.filters.search;
    if (DOM.filterCategory) DOM.filterCategory.value = state.filters.category;
    if (DOM.filterIndustry) DOM.filterIndustry.value = state.filters.industry;
    if (DOM.filterStock) DOM.filterStock.value = state.filters.stock;
    if (DOM.filterSort) DOM.filterSort.value = state.filters.sort;
    if (DOM.filterOrigin) DOM.filterOrigin.value = state.filters.origin;
    if (DOM.filterPriceMin) DOM.filterPriceMin.value = state.filters.priceMin;
    if (DOM.filterPriceMax) DOM.filterPriceMax.value = state.filters.priceMax;
    if (DOM.filterMoqMin) DOM.filterMoqMin.value = state.filters.moqMin;
    if (DOM.filterMoqMax) DOM.filterMoqMax.value = state.filters.moqMax;
    if (DOM.filterHasImage) DOM.filterHasImage.value = state.filters.hasImage;
    if (DOM.filterHasDatasheet) DOM.filterHasDatasheet.value = state.filters.hasDatasheet;
    if (DOM.filterHasInfo) DOM.filterHasInfo.value = state.filters.hasInfo || "all";

    // Rebuild cascade nhưng giữ SubCategory/Family hiện tại nếu còn hợp lệ.
    updateFilterSubCategories(state.filters.category, true);

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

    // 7 TIÊU CHÍ DATA QUALITY
    if (state.filters.hasBrand === 'no') tags.push({ key: 'hasBrand', label: 'Thiếu Brand' });
    if (state.filters.hasOrigin === 'no') tags.push({ key: 'hasOrigin', label: 'Thiếu Xuất xứ' });
    if (state.filters.hasDesc === 'no') tags.push({ key: 'hasDesc', label: 'Thiếu Mô tả' });
    if (state.filters.hasSpecs === 'no') tags.push({ key: 'hasSpecs', label: 'Thiếu Thông số' });

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
        state.filters = { 
            search: "", category: "all", industry: "all", stock: "all", sort: "newest", 
            subCategory: "all", family: "all", brands: [], origin: "all", 
            priceMin: "", priceMax: "", moqMin: "", moqMax: "", 
            hasImage: "all", hasDatasheet: "all", hasInfo: "all",
            hasBrand: "all", hasOrigin: "all", hasDesc: "all", hasSpecs: "all"
        };
    } else if (key === 'brand') {
        state.filters.brands = state.filters.brands.filter(b => String(b) !== String(value));
    } else if (key === 'price') {
        state.filters.priceMin = ""; state.filters.priceMax = "";
    } else if (key === 'moq') {
        state.filters.moqMin = ""; state.filters.moqMax = "";
    } else if (['hasImage', 'hasDatasheet', 'hasInfo', 'hasBrand', 'hasOrigin', 'hasDesc', 'hasSpecs'].includes(key)) {
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
            <button
                type="button"
                class="w-full text-left px-3 py-2 text-sm font-bold text-kn-blue hover:bg-blue-50 transition"
                data-custom-origin="${escapeAttribute(keyword)}">
                + Thêm mới: "${escapeHTML(keyword)}"
            </button>`;

        container.querySelector("[data-custom-origin]")?.addEventListener("click", event => {
            useCustomOrigin(event.currentTarget.dataset.customOrigin || "");
        });
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
function addPostgrestLogicFilter(query, expression) {
    if (!expression) return query;

    /*
     * Supabase/PostgREST hỗ trợ logic tree:
     * and=(or(...),or(...))
     *
     * Dùng URL parameter `and` để giữ đúng:
     * Search AND Missing/Quality conditions.
     * Như vậy không còn hiện tượng .or() sau ghi đè .or() trước.
     */
    query.url.searchParams.set("and", expression);
    return query;
}

async function fetchProducts() {
    if (!DOM.tableBody) return;
    renderTableLoading();

    try {
        const from = (state.currentPage - 1) * state.itemsPerPage;
        const to = from + state.itemsPerPage - 1;

        let query = window.supabaseClient
            .from("products")
            .select("*, brands(name)", { count: "exact" });

        const logicGroups = [];

        // Keyword search: SKU OR Name
        if (state.filters.search) {
            // Lọc luôn cả ngoặc kép và dấu phẩy khách lỡ tay gõ vào để chống gãy chuỗi
            const keyword = state.filters.search
                .replace(/[%_",()]/g, "")
                .trim();

            if (keyword) {
                // FIX BẪY SỐ 2: Bọc thêm ngoặc kép vào "%...%" để an toàn tuyệt đối với khoảng trắng
                logicGroups.push(
                    `or(sku.ilike."%${keyword}%",name.ilike."%${keyword}%")`
                );
            }
        }

        // Missing image
        if (state.filters.hasImage === "no") {
            logicGroups.push(
                'or(image_path.is.null,image_path.eq."")'
            );
        }

        // Missing datasheet
        if (state.filters.hasDatasheet === "no") {
            logicGroups.push(
                'or(datasheet_url.is.null,datasheet_url.eq."")'
            );
        }

        // Missing brand
        if (state.filters.hasBrand === "no") {
            logicGroups.push("brand_id.is.null");
        }

        // Missing origin
        if (state.filters.hasOrigin === "no") {
            logicGroups.push('or(origin.is.null,origin.eq."")');
        }

        // Missing description
        if (state.filters.hasDesc === "no") {
            logicGroups.push('or(description.is.null,description.eq."")');
        }

        // Missing specifications
        if (state.filters.hasSpecs === "no") {
            logicGroups.push('or(specifications.is.null,specifications.eq."")');
        }

        // Missing information = thiếu ÍT NHẤT 1 field bắt buộc.
        if (state.filters.hasInfo === "no") {
            logicGroups.push(
                'or(' +
                    'name.is.null,name.eq."",' +
                    'sku.is.null,sku.eq."",' +
                    'brand_id.is.null,' +
                    'origin.is.null,origin.eq."",' +
                    'description.is.null,description.eq."",' +
                    'specifications.is.null,specifications.eq."",' +
                    'image_path.is.null,image_path.eq.""' +
                ')'
            );
        }

        // Bắt buộc phải luôn có ngoặc tròn bọc ngoài cùng dù chỉ có 1 điều kiện
        if (logicGroups.length > 0) {
            query = addPostgrestLogicFilter(
                query,
                `(${logicGroups.join(",")})`
            );
        }

        // hasImage=yes: điều kiện AND bình thường
        if (state.filters.hasImage === "yes") {
            query = query
                .not("image_path", "is", null)
                .neq("image_path", "");
        }

        // hasDatasheet=yes
        if (state.filters.hasDatasheet === "yes") {
            query = query
                .not("datasheet_url", "is", null)
                .neq("datasheet_url", "");
        }

        // hasInfo=yes: tất cả field bắt buộc phải có
        if (state.filters.hasInfo === "yes") {
            query = query
                .not("name", "is", null)
                .neq("name", "")
                .not("sku", "is", null)
                .neq("sku", "")
                .not("brand_id", "is", null)
                .not("origin", "is", null)
                .neq("origin", "")
                .not("description", "is", null)
                .neq("description", "")
                .not("specifications", "is", null)
                .neq("specifications", "")
                .not("image_path", "is", null)
                .neq("image_path", "");
        }

        // Quick Filters
        if (state.filters.category !== "all") {
            query = query.eq("category_id", state.filters.category);
        }

        if (state.filters.industry !== "all") {
            query = query.eq("industry_id", state.filters.industry);
        }

        if (state.filters.stock === "in_stock") {
            query = query.gt("stock_quantity", 0);
        }

        if (state.filters.stock === "out_of_stock") {
            query = query.lte("stock_quantity", 0);
        }

        // Advanced Filters
        if (state.filters.subCategory !== "all") {
            query = query.eq("sub_category_id", state.filters.subCategory);
        }

        if (state.filters.family !== "all") {
            query = query.eq("family_id", state.filters.family);
        }

        if (state.filters.origin !== "all") {
            query = query.eq("origin", state.filters.origin);
        }

        if (state.filters.priceMin) {
            query = query.gte("price", state.filters.priceMin);
        }

        if (state.filters.priceMax) {
            query = query.lte("price", state.filters.priceMax);
        }

        if (state.filters.brands.length > 0) {
            query = query.in("brand_id", state.filters.brands);
        }

        if (state.filters.moqMin) {
            query = query.gte(
                "min_order_quantity",
                state.filters.moqMin
            );
        }

        if (state.filters.moqMax) {
            query = query.lte(
                "min_order_quantity",
                state.filters.moqMax
            );
        }

        // Sort
        switch (state.filters.sort) {
            case "newest":
                query = query.order("created_at", { ascending: false });
                break;
            case "oldest":
                query = query.order("created_at", { ascending: true });
                break;
            case "name_asc":
                query = query.order("name", { ascending: true });
                break;
            case "name_desc":
                query = query.order("name", { ascending: false });
                break;
            case "price_asc":
                query = query.order("price", { ascending: true });
                break;
            case "price_desc":
                query = query.order("price", { ascending: false });
                break;
            case "stock_asc":
                query = query.order("stock_quantity", { ascending: true });
                break;
            case "stock_desc":
                query = query.order("stock_quantity", { ascending: false });
                break;
            default:
                query = query.order("created_at", { ascending: false });
                break;
        }

        const { data, count, error } = await query.range(from, to);

        if (error) throw error;

        state.products = data || [];
        state.totalItems = count || 0;

        if (DOM.filteredCountDisplay) {
            DOM.filteredCountDisplay.textContent = state.totalItems;
        }

        updateStatistics();
        renderProducts();
        renderPagination();

    } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);

        DOM.tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-12 text-red-500 font-bold">
                    Không thể tải danh sách sản phẩm.
                    <div class="text-xs font-normal mt-1 text-red-400">
                        ${escapeHTML(error.message)}
                    </div>
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
   PHASE 3.2 — DATA QUALITY DASHBOARD
========================================================= */

async function updateDataQuality() {

    if (!DOM.dataQualityGrid) return;

    DOM.dataQualityGrid.innerHTML = `
        <div class="col-span-full text-center py-6 text-gray-400">
            <i class="fas fa-spinner fa-spin mr-2"></i>
            Đang kiểm tra chất lượng dữ liệu...
        </div>
    `;

    try {

        /*
         * Lấy toàn bộ catalog.
         *
         * KHÔNG phụ thuộc:
         * - pagination
         * - search
         * - category
         * - stock filter
         * - advanced filter
         */

        const {
            data,
            error
        } = await window.supabaseClient
            .from("products")
            .select(`
                id,
                name,
                sku,
                brand_id,
                origin,
                description,
                specifications,
                image_path,
                datasheet_url
            `);

        if (error) {
            throw error;
        }

        const products = data || [];
        const total = products.length;

        /*
         * Helper kiểm tra field có dữ liệu hay không.
         */
        const hasValue = value => {

            if (
                value === null ||
                value === undefined
            ) {
                return false;
            }

            if (
                typeof value === "string"
            ) {
                return value.trim() !== "";
            }

            return true;
        };


        /*
         * 1. TÊN
         */
        const completeName =
            products.filter(
                product =>
                    hasValue(product.name)
            ).length;


        /*
         * 2. SKU
         */
        const completeSku =
            products.filter(
                product =>
                    hasValue(product.sku)
            ).length;


        /*
         * 3. BRAND
         */
        const completeBrand =
            products.filter(
                product =>
                    product.brand_id !== null &&
                    product.brand_id !== undefined
            ).length;


        /*
         * 4. ORIGIN
         */
        const completeOrigin =
            products.filter(
                product =>
                    hasValue(product.origin)
            ).length;


        /*
         * 5. DESCRIPTION
         */
        const completeDescription =
            products.filter(
                product =>
                    hasValue(product.description)
            ).length;


        /*
         * 6. SPECIFICATIONS
         */
        const completeSpecifications =
            products.filter(
                product =>
                    hasValue(product.specifications)
            ).length;


        /*
         * 7. IMAGE
         */
        const completeImage =
            products.filter(
                product =>
                    hasValue(product.image_path)
            ).length;


        /*
         * 8. DATASHEET
         *
         * Datasheet KHÔNG nằm trong rule
         * "Đủ thông tin", nhưng vẫn thống kê
         * riêng để Admin biết tình trạng catalog.
         */
        const completeDatasheet =
            products.filter(
                product =>
                    hasValue(product.datasheet_url)
            ).length;


        /*
         * RULE "ĐỦ THÔNG TIN"
         *
         * Bắt buộc:
         * - name
         * - sku
         * - brand
         * - origin
         * - description
         * - specifications
         * - image
         *
         * Không bắt buộc:
         * - datasheet
         * - short_description
         */

        const completeInformation =
    products.filter(product => {
        return (
            hasValue(product.name) &&
            hasValue(product.sku) &&
            product.brand_id !== null &&
            product.brand_id !== undefined &&
            hasValue(product.origin) &&
            hasValue(product.description) &&
            hasValue(product.specifications) &&
            hasValue(product.image_path)
        );
    }).length;

const missingInformation =
    total - completeInformation;


        /*
         * Render KPI
         */

        const metrics = [

    {
        key: "brand",
        label: "Thương hiệu",
        complete: completeBrand,
        missing: total - completeBrand,
        icon: "fa-copyright"
    },

    {
        key: "origin",
        label: "Xuất xứ",
        complete: completeOrigin,
        missing: total - completeOrigin,
        icon: "fa-globe-asia"
    },

    {
        key: "description",
        label: "Mô tả",
        complete: completeDescription,
        missing: total - completeDescription,
        icon: "fa-align-left"
    },

    {
        key: "specifications",
        label: "Thông số",
        complete: completeSpecifications,
        missing: total - completeSpecifications,
        icon: "fa-list-check"
    },

    {
        key: "image",
        label: "Hình ảnh",
        complete: completeImage,
        missing: total - completeImage,
        icon: "fa-image"
    },

    {
        key: "datasheet",
        label: "Datasheet",
        complete: completeDatasheet,
        missing: total - completeDatasheet,
        icon: "fa-file-pdf"
    },

    {
        key: "information",
        label: "Thông tin tổng thể",
        complete: completeInformation,
        missing: missingInformation,
        icon: "fa-clipboard-check"
    }

];


        DOM.dataQualityTotal.textContent =
            `${formatNumber(total)} sản phẩm`;


        DOM.dataQualityGrid.innerHTML =
            metrics.map(metric => {

                const percentage =
                    total > 0
                        ? Math.round(
                            (metric.complete / total) * 100
                        )
                        : 0;

                const isComplete =
                    metric.missing === 0;

                return `
                    <button
                        type="button"
                        class="
                            data-quality-card
                            text-left
                            border
                            rounded-lg
                            p-4
                            transition
                            hover:shadow-md
                            hover:border-kn-blue
                            bg-white
                        "
                        data-quality-key="${metric.key}"
                    >

                        <div class="flex items-center justify-between">

                            <div class="flex items-center gap-2">

                                <div
                                    class="
                                        w-8
                                        h-8
                                        rounded-lg
                                        flex
                                        items-center
                                        justify-center
                                        ${isComplete
                                            ? "bg-green-50 text-green-600"
                                            : "bg-orange-50 text-orange-500"}
                                    "
                                >
                                    <i class="fas ${metric.icon} text-sm"></i>
                                </div>

                                <span class="text-sm font-semibold text-gray-700">
                                    ${metric.label}
                                </span>

                            </div>

                            <span
                                class="
                                    text-xs
                                    font-bold
                                    ${isComplete
                                        ? "text-green-600"
                                        : "text-orange-500"}
                                "
                            >
                                ${percentage}%
                            </span>

                        </div>


                        <div class="mt-3 flex items-end justify-between">

                            <div>

                                <div class="text-xl font-bold text-gray-800">
                                    ${formatNumber(metric.complete)}
                                    <span class="text-xs font-normal text-gray-400">
                                        / ${formatNumber(total)}
                                    </span>
                                </div>

                                <div class="text-xs text-gray-500 mt-1">

                                    ${
                                        isComplete
                                            ? "Đầy đủ"
                                            : `Thiếu ${formatNumber(metric.missing)}`
                                    }

                                </div>

                            </div>

                            <i
                                class="
                                    fas
                                    fa-chevron-right
                                    text-xs
                                    text-gray-300
                                "
                            ></i>

                        </div>


                        <div class="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">

                            <div
                                class="
                                    h-full
                                    rounded-full
                                    ${isComplete
                                        ? "bg-green-500"
                                        : "bg-orange-400"}
                                "
                                style="width:${percentage}%"
                            ></div>

                        </div>

                    </button>
                `;

            }).join("");


        /*
         * Click KPI
         */
        DOM.dataQualityGrid
            .querySelectorAll(".data-quality-card")
            .forEach(card => {

                card.addEventListener(
                    "click",
                    () => {

                        handleDataQualityClick(
                            card.dataset.qualityKey
                        );

                    }
                );

            });


    } catch (error) {

        console.error(
            "Lỗi Data Quality:",
            error
        );

        DOM.dataQualityTotal.textContent =
            "Không thể tải dữ liệu";

        DOM.dataQualityGrid.innerHTML = `
            <div
                class="
                    col-span-full
                    text-center
                    py-6
                    text-red-500
                "
            >
                Không thể kiểm tra chất lượng dữ liệu.
            </div>
        `;
    }
}

/* =========================================================
   RENDER PRODUCTS (ĐÃ FIX LỆCH CỘT GIÁ)
========================================================= */
function renderProducts() {
    if (!DOM.tableBody) return;

    if (state.products.length === 0) {
        DOM.tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-14 text-gray-400">
                    Không tìm thấy sản phẩm.
                </td>
            </tr>
        `;
        return;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;

    DOM.tableBody.innerHTML = state.products.map((item, index) => {
        const brandName = item.brands?.name || "OEM";
        const imageUrl = buildProductImageUrl(item.image_path);

        const imageHTML = imageUrl
            ? `<img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(item.name)}" class="w-10 h-10 object-contain mx-auto border border-gray-200 rounded-lg bg-white" loading="lazy" onerror="this.onerror=null;this.src='../assets/images/world mark.png';">`
            : `<div class="w-10 h-10 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-[9px] text-gray-400 mx-auto">No Img</div>`;

        return `
            <tr class="border-b border-gray-100 hover:bg-blue-50/30 transition">
                <td class="px-4 py-3 text-center font-bold text-gray-400 text-xs align-middle">
                    ${from + index + 1}
                </td>
                <td class="px-4 py-3 text-center align-middle">
                    ${imageHTML}
                </td>
                <td class="px-4 py-3 font-mono font-bold text-kn-blue text-xs whitespace-nowrap align-middle">
                    ${escapeHTML(item.sku)}
                </td>
                <td class="px-4 py-3 font-bold text-gray-800 text-sm align-middle leading-snug">
                    ${escapeHTML(item.name)}
                </td>
                <td class="px-4 py-3 text-gray-600 text-xs font-bold uppercase align-middle">
                    ${escapeHTML(brandName)}
                </td>
                <td class="px-4 py-3 align-middle">
                    ${renderProductSizes(item)}
                </td>
                <td class="px-4 py-3 text-gray-800 font-bold text-sm whitespace-nowrap text-right align-middle">
                    ${formatCurrency(item.price)}
                </td>
                <td class="px-4 py-3 text-center align-middle">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${Number(item.stock_quantity) > 0 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}">
                        ${Number(item.stock_quantity) > 0 ? Number(item.stock_quantity) : "Hết hàng"}
                    </span>
                </td>
                <td class="px-4 py-3 text-center whitespace-nowrap align-middle">
                    <div class="flex items-center justify-center gap-1.5">
                        <button type="button" data-action="edit" data-id="${escapeAttribute(item.id)}" class="px-2 py-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition font-bold text-[10px] uppercase">
                            Sửa
                        </button>
                        <button type="button" data-action="delete" data-id="${escapeAttribute(item.id)}" class="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition font-bold text-[10px] uppercase">
                            Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `;
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
    clearTimeout(autoSlugTimer);
    ++autoSlugRequestId;
    state.editingId = null;
    state.editingSlugSource = "auto";
    if (DOM.form) DOM.form.reset();
    resetCatalogDropdowns();
    resetMediaInputs();
    if (typeof CKEDITOR !== "undefined" && CKEDITOR.instances.description) CKEDITOR.instances.description.setData("");
    if (DOM.formTitle) DOM.formTitle.textContent = "Nhập Sản Phẩm Mới";
    if (DOM.btnSubmit) DOM.btnSubmit.textContent = "Nhập kho sản phẩm";
        // Reset SEO
    if (DOM.slug) DOM.slug.value = "";
    if (DOM.metaTitle) DOM.metaTitle.value = "";
    if (DOM.metaDescription) DOM.metaDescription.value = "";
    if (DOM.isH1) DOM.isH1.checked = true;

    if (DOM.slugSourceLabel) {
        DOM.slugSourceLabel.textContent = "Tự động";
    }

    if (DOM.metaTitleCount) {
        DOM.metaTitleCount.textContent = "0 ký tự";
    }

    if (DOM.metaDescriptionCount) {
        DOM.metaDescriptionCount.textContent = "0 ký tự";
    }
    
    updateSeoPreview();

    DOM.listView?.classList.add("hidden");
    DOM.formView?.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelForm() {
    clearTimeout(autoSlugTimer);
    ++autoSlugRequestId;
    state.editingId = null;
    state.editingSlugSource = "auto";
    resetMediaInputs();

    DOM.formView?.classList.add("hidden");
    DOM.listView?.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function updateSeoCounters() {
    const META_TITLE_MAX = 60;
    const META_DESCRIPTION_MAX = 160;

    if (DOM.metaTitleCount) {
        const length = DOM.metaTitle?.value?.length || 0;

        DOM.metaTitleCount.textContent =
            `${length} / ${META_TITLE_MAX} ký tự`;

        DOM.metaTitleCount.classList.toggle(
            "is-warning",
            length > META_TITLE_MAX
        );
    }

    if (DOM.metaDescriptionCount) {
        const length = DOM.metaDescription?.value?.length || 0;

        DOM.metaDescriptionCount.textContent =
            `${length} / ${META_DESCRIPTION_MAX} ký tự`;

        DOM.metaDescriptionCount.classList.toggle(
            "is-warning",
            length > META_DESCRIPTION_MAX
        );
    }
}

function updateSeoPreview() {
    const name = DOM.name?.value?.trim() || "Tên sản phẩm";
    const slug = DOM.slug?.value?.trim() || slugify(name);

    const title =
        DOM.metaTitle?.value?.trim() ||
        `${name} - MRO Khang Nam`;

    const description =
        DOM.metaDescription?.value?.trim() ||
        "Mô tả SEO sẽ hiển thị tại đây...";

    if (DOM.seoPreviewTitle) {
        DOM.seoPreviewTitle.textContent = title;
    }

    if (DOM.seoPreviewUrl) {
        DOM.seoPreviewUrl.textContent =
            `mrokhangnam.vn › san-pham › ${slug}`;
    }

    if (DOM.seoPreviewDescription) {
        DOM.seoPreviewDescription.textContent = description;
    }
}

function editProduct(id) {
    const item = state.products.find(p => String(p.id) === String(id));
    if (!item) { showToast("Không tìm thấy sản phẩm.", "error"); return; }
    
    state.editingId = item.id;
    state.editingSlugSource = item.slug_source || "auto";
    
    document.getElementById("sku").value = item.sku || "";
    document.getElementById("name").value = item.name || "";
        // SEO
    if (DOM.slug) {
        DOM.slug.value = item.slug || "";
    }

    if (DOM.metaTitle) {
        DOM.metaTitle.value = item.meta_title || "";
    }

    if (DOM.metaDescription) {
        DOM.metaDescription.value = item.meta_description || "";
    }

    if (DOM.isH1) {
        DOM.isH1.checked = item.is_h1 !== false;
    }

    if (DOM.slugSourceLabel) {
        DOM.slugSourceLabel.textContent =
            item.slug_source === "manual"
                ? "Thủ công"
                : "Tự động";
    }

    updateSeoCounters();

    // Sản phẩm cũ chưa có slug nhưng vẫn đang ở chế độ auto
    if (getSlugSource() === "auto" && !DOM.slug?.value.trim()) {
        scheduleAutoSlug();
    }

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

    const brandInput =
        document.getElementById(
            "brand_input"
        );

    const name =
        brandInput
            ? brandInput.value.trim()
            : "";

    /*
       BRAND MẶC ĐỊNH:
       Nếu người dùng bỏ trống Brand
       → tự động dùng Brand "OEM"
    */
    const brandName =
        name || "OEM";


    const found =
        state.brands.find(
            brand =>
                brand.name
                    .trim()
                    .toLowerCase() ===
                brandName.toLowerCase()
        );


    /*
       Đã có OEM / brand người dùng nhập
       → dùng lại ID hiện tại
    */
    if (
        found
    ) {

        return found.id;

    }


    /*
       Nếu chưa có Brand trong database
       → tạo mới
       Trường hợp này chủ yếu dành cho OEM
       nếu database chưa có OEM.
    */
    const {
        data,
        error
    } =
        await window.supabaseClient

            .from(
                "brands"
            )

            .insert([
                {
                    name: brandName
                }
            ])

            .select(
                "id, name"
            )

            .single();


    if (
        error
    ) {

        throw new Error(
            "Lỗi khi tạo thương hiệu mới: " +
            error.message
        );

    }


    state.brands.push(
        data
    );


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
       description: getDescriptionValue() || null,

        // SEO
        slug: DOM.slug?.value.trim() || null,
        slug_source: state.editingSlugSource,
        meta_title: DOM.metaTitle?.value.trim() || null,
        meta_description: DOM.metaDescription?.value.trim() || null,
        is_h1: DOM.isH1?.checked !== false
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

        // SEO 2.3 — đảm bảo slug sạch + unique ngay trước khi lưu.
        if (DOM.slug) {
            const rawSlug = DOM.slug.value.trim();

            if (rawSlug) {
                DOM.slug.value = slugify(rawSlug);
                if (state.editingSlugSource === "auto") {
                    DOM.slug.value = await ensureUniqueSlug(
                        DOM.slug.value,
                        state.editingId
                    );
                } else {
                    // Slug thủ công vẫn phải unique.
                    const uniqueManualSlug = await ensureUniqueSlug(
                        DOM.slug.value,
                        state.editingId
                    );

                    if (uniqueManualSlug !== DOM.slug.value) {
                        throw new Error(
                            `Slug "${DOM.slug.value}" đã tồn tại. Vui lòng chọn slug khác.`
                        );
                    }
                }
            }
        }

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
        await updateDataQuality();

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
        await updateDataQuality();

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

    DOM.metaTitle?.addEventListener("input", updateSeoCounters);
    DOM.metaDescription?.addEventListener("input", updateSeoCounters);
    DOM.metaTitle?.addEventListener("input", updateSeoPreview);
    DOM.metaDescription?.addEventListener("input", updateSeoPreview);
    DOM.name?.addEventListener("input", updateSeoPreview);
    DOM.slug?.addEventListener("input", updateSeoPreview);

    // SEO 2.3 — Auto Slug / Manual Slug Detection
    document.getElementById("name")?.addEventListener("input", () => {
        if (getSlugSource() === "auto") scheduleAutoSlug();
    });

    DOM.slug?.addEventListener("input", handleSlugInput);
    DOM.btnCopySlug?.addEventListener("click", copyCurrentSlug);
    DOM.btnViewSlug?.addEventListener("click", viewCurrentSlug);

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
    await updateDataQuality();
});

/* GLOBAL EXPORTS */
window.showAddForm = showAddForm;
window.cancelForm = cancelForm;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.fetchProducts = fetchProducts;

/* =========================================================
   DATA QUALITY → KÍCH HOẠT BỘ LỌC ẨN
========================================================= */
function handleDataQualityClick(key) {
    state.currentPage = 1;

    switch (key) {
        case "image":
            state.filters.hasImage = "no";
            if (DOM.filterHasImage) DOM.filterHasImage.value = "no";
            break;
        case "datasheet":
            state.filters.hasDatasheet = "no";
            if (DOM.filterHasDatasheet) DOM.filterHasDatasheet.value = "no";
            break;
        case "information":
            state.filters.hasInfo = "no";
            if (DOM.filterHasInfo) DOM.filterHasInfo.value = "no";
            break;
        case "brand":
            state.filters.hasBrand = "no";
            break;
        case "origin":
            state.filters.hasOrigin = "no";
            break;
        case "description":
            state.filters.hasDesc = "no";
            break;
        case "specifications":
            state.filters.hasSpecs = "no";
            break;
        default:
            return;
    }

    if (DOM.advancedPanel && DOM.advancedPanel.classList.contains("hidden")) {
        DOM.advancedPanel.classList.remove("hidden");
    }

    renderActiveFilters(); // In Tag ra để Admin biết đang lọc cái gì
    fetchProducts(); // Kéo sản phẩm từ DB về
}

function formatNumber(value) {
    return new Intl.NumberFormat("vi-VN").format(
        Number(value || 0)
    );
}