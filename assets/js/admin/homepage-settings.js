// ============================================================
// FILE: assets/js/admin/homepage-settings.js
// QUẢN LÝ HOMEPAGE - MRO KHANG NAM (TÍCH HỢP UPLOAD ẢNH)
// ============================================================

"use strict";

const HOMEPAGE_TABLE = "homepage_settings";

let homepageSettings = [];
let isSaving = false;

const SECTION_KEYS = {
    HERO: "hero",
    CATEGORIES: "categories",
    BEST_SELLING: "best_selling",
    CATEGORY_SHOWCASE_1: "category_showcase_1",
    CATEGORY_SHOWCASE_2: "category_showcase_2",
    INDUSTRIES: "industries",
    BRANDS: "brands",
    BLOG: "blog"
};

const DEFAULT_SETTINGS = [
    {
        section_key: SECTION_KEYS.HERO,
        is_active: true, title: "Một nhà cung cấp", description: "Vật tư và giải pháp bảo trì...",
        display_order: 1, item_limit: null, source_type: null, source_id: null,
        config: {
            badge: "ĐỐI TÁC CUNG ỨNG MRO", highlight: "Mọi thứ bạn cần", image_path: "assets/images/anh.png",
            usps: [
                { title: "Hàng chính hãng", description: "Thương hiệu uy tín" },
                { title: "CO/CQ đầy đủ", description: "Chứng từ theo yêu cầu" },
                { title: "Báo giá nhanh", description: "Hỗ trợ doanh nghiệp" },
                { title: "MRO đa ngành", description: "Nhiều giải pháp" }
            ]
        }
    },
    {
        section_key: SECTION_KEYS.CATEGORIES,
        is_active: true, title: "Tất Cả Danh Mục", description: null,
        display_order: 2, item_limit: 20, source_type: "categories", source_id: null,
        config: { sub_category_limit: 4, selected_items: [] }
    },
    {
        section_key: SECTION_KEYS.BEST_SELLING,
        is_active: true, title: "Sản Phẩm Bán Chạy", description: "Khám phá những sản phẩm...",
        display_order: 3, item_limit: 20, source_type: "product_sales_stats", source_id: null,
        config: { fallback_enabled: true, fallback_order: "created_at" }
    },
    {
        section_key: SECTION_KEYS.CATEGORY_SHOWCASE_1,
        is_active: true, title: null, description: null,
        display_order: 4, item_limit: 20, source_type: "top_category", source_id: null,
        config: { selection_mode: "product_count", rank: 1 }
    },
    {
        section_key: SECTION_KEYS.CATEGORY_SHOWCASE_2,
        is_active: true, title: null, description: null,
        display_order: 5, item_limit: 20, source_type: "top_category", source_id: null,
        config: { selection_mode: "product_count", rank: 2 }
    },
    {
        section_key: SECTION_KEYS.INDUSTRIES,
        is_active: true, title: "Ngành Hàng Phục Vụ", description: null,
        display_order: 6, item_limit: 6, source_type: "industries", source_id: null,
        config: { selected_items: [] }
    },
    {
        section_key: SECTION_KEYS.BRANDS,
        is_active: true, title: "Thương hiệu Nổi bật", description: null,
        display_order: 7, item_limit: 50, source_type: "brands", source_id: null,
        config: { selected_items: [] }
    },
    {
        section_key: SECTION_KEYS.BLOG,
        is_active: true, title: "Tin Tức & Công Nghệ", description: null,
        display_order: 8, item_limit: 3, source_type: "blogs", source_id: null,
        config: { selected_items: [] }
    }
];

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await waitForSupabase();
        await loadAllSelectableData(); 
        await loadHomepageSettings();
        bindEvents();
    } catch (error) {
        showToast("Lỗi khởi tạo.", "error");
    }
});

function waitForSupabase(timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startedAt = Date.now();
        function check() {
            if (window.supabaseClient && typeof window.supabaseClient.from === "function") { resolve(); return; }
            if (Date.now() - startedAt >= timeout) { reject(new Error("Timeout")); return; }
            setTimeout(check, 100);
        }
        check();
    });
}

// LẤY DỮ LIỆU ĐỔ VÀO CHECKBOX/DROPDOWN TỪ 4 BẢNG
async function loadAllSelectableData() {
    try {
        const labelClass = "flex items-center gap-3 cursor-pointer p-3 bg-white border border-gray-200 hover:border-kn-blue hover:bg-blue-50 rounded-lg transition shadow-sm";
        const checkboxClass = "w-5 h-5 rounded text-kn-blue focus:ring-kn-blue cursor-pointer";

        // 1. Categories
        const { data: cats } = await window.supabaseClient.from("categories").select("id, name").eq("is_active", true).order("name", { ascending: true });
        const showcase1 = document.getElementById("categoryShowcase1");
        const showcase2 = document.getElementById("categoryShowcase2");
        const catContainer = document.getElementById("categoriesCheckboxContainer");
        
        [showcase1, showcase2].forEach(select => {
            if(!select) return;
            select.innerHTML = `<option value="">-- Tự động chọn --</option>`;
            (cats || []).forEach(c => select.appendChild(new Option(c.name, c.id)));
        });

        if (catContainer) {
            catContainer.innerHTML = "";
            (cats || []).forEach(c => {
                catContainer.insertAdjacentHTML('beforeend', `<label class="${labelClass}"><input type="checkbox" value="${c.id}" class="cat-select-checkbox ${checkboxClass}"><span class="text-sm text-gray-800 font-bold">${c.name}</span></label>`);
            });
        }

        // 2. Industries 
        const { data: inds } = await window.supabaseClient.from("industries").select("id, name").eq("is_active", true).order("id", { ascending: true });
        const indContainer = document.getElementById("industriesCheckboxContainer");
        if (indContainer) {
            indContainer.innerHTML = "";
            (inds || []).forEach(i => {
                indContainer.insertAdjacentHTML('beforeend', `<label class="${labelClass}"><input type="checkbox" value="${i.id}" class="ind-select-checkbox ${checkboxClass}"><span class="text-sm text-gray-800 font-bold">${i.name}</span></label>`);
            });
        }

        // 3. Brands 
        const { data: brands } = await window.supabaseClient.from("brands").select("id, name").eq("is_active", true).order("name", { ascending: true });
        const brandContainer = document.getElementById("brandsCheckboxContainer");
        if (brandContainer) {
            brandContainer.innerHTML = "";
            (brands || []).forEach(b => {
                brandContainer.insertAdjacentHTML('beforeend', `<label class="${labelClass}"><input type="checkbox" value="${b.id}" class="brand-select-checkbox ${checkboxClass}"><span class="text-sm text-gray-800 font-bold">${b.name}</span></label>`);
            });
        }

        // 4. Blogs
        const { data: blogs } = await window.supabaseClient.from("blogs").select("id, title").eq("is_active", true).order("created_at", { ascending: false });
        const blogContainer = document.getElementById("blogsCheckboxContainer");
        if (blogContainer) {
            blogContainer.innerHTML = "";
            (blogs || []).forEach(b => {
                blogContainer.insertAdjacentHTML('beforeend', `<label class="${labelClass}"><input type="checkbox" value="${b.id}" class="blog-select-checkbox ${checkboxClass}"><span class="text-sm text-gray-800 font-bold line-clamp-1" title="${b.title}">${b.title}</span></label>`);
            });
        }

        document.querySelectorAll('.cat-select-checkbox, .ind-select-checkbox, .brand-select-checkbox, .blog-select-checkbox').forEach(cb => {
            cb.addEventListener('change', markDirty);
        });

    } catch (error) {
        console.error("Lỗi lấy data Dropdown/Checkbox:", error);
    }
}

async function loadHomepageSettings() {
    setLoading(true);
    try {
        const { data, error } = await window.supabaseClient.from(HOMEPAGE_TABLE).select('*').order("display_order", { ascending: true });
        if (error) throw error;

        if (!data || data.length === 0) {
            homepageSettings = structuredClone(DEFAULT_SETTINGS);
            fillForm(homepageSettings);
            return;
        }

        homepageSettings = mergeWithDefaults(data);
        fillForm(homepageSettings);
    } catch (error) {
        showToast("Không thể tải cấu hình.", "error");
    } finally {
        setLoading(false);
    }
}

function mergeWithDefaults(data) {
    const dbMap = new Map(data.map(item => [item.section_key, item]));
    return DEFAULT_SETTINGS.map(defaultItem => {
        const dbItem = dbMap.get(defaultItem.section_key);
        if (!dbItem) return structuredClone(defaultItem);
        return {
            ...structuredClone(defaultItem), ...dbItem,
            config: { ...structuredClone(defaultItem.config || {}), ...(dbItem.config || {}) }
        };
    });
}

// BƠM DATA TỪ DB VÀO FORM 
function fillForm(settings) {
    const getSection = key => settings.find(item => item.section_key === key);

    const hero = getSection(SECTION_KEYS.HERO);
    if (hero) {
        setCheckbox("heroEnabled", hero.is_active); setValue("heroBadge", hero.config?.badge); setValue("heroTitle", hero.title);
        setValue("heroHighlight", hero.config?.highlight); setValue("heroDescription", hero.description); setValue("heroImagePath", hero.config?.image_path);
        updateHeroImagePreview();
        (hero.config?.usps || []).forEach((usp, index) => {
            setValue(`usp${index+1}Title`, usp?.title); setValue(`usp${index+1}Description`, usp?.description);
        });
    }

    const categories = getSection(SECTION_KEYS.CATEGORIES);
    if (categories) {
        setCheckbox("categoriesEnabled", categories.is_active); setValue("categoriesTitle", categories.title); setValue("subcategoryLimit", categories.config?.sub_category_limit);
        const selected = categories.config?.selected_items || [];
        document.querySelectorAll('.cat-select-checkbox').forEach(cb => cb.checked = selected.includes(Number(cb.value)));
    }

    const bestSelling = getSection(SECTION_KEYS.BEST_SELLING);
    if (bestSelling) {
        setCheckbox("bestSellingEnabled", bestSelling.is_active); setValue("bestSellingTitle", bestSelling.title);
        setValue("bestSellingDescription", bestSelling.description); setValue("bestSellingLimit", bestSelling.item_limit);
        setCheckbox("bestSellingFallback", bestSelling.config?.fallback_enabled);
    }

    const sc1 = getSection(SECTION_KEYS.CATEGORY_SHOWCASE_1);
    if (sc1) {
        setCheckbox("categoryShowcase1Enabled", sc1.is_active); setSelectValue("categoryShowcase1", sc1.source_id);
        setValue("categoryShowcase1Title", sc1.title); setValue("categoryShowcase1Description", sc1.description);
        setValue("categoryShowcase1Limit", sc1.item_limit); setValue("categoryShowcase1Rank", sc1.config?.rank);
    }

    const sc2 = getSection(SECTION_KEYS.CATEGORY_SHOWCASE_2);
    if (sc2) {
        setCheckbox("categoryShowcase2Enabled", sc2.is_active); setSelectValue("categoryShowcase2", sc2.source_id);
        setValue("categoryShowcase2Title", sc2.title); setValue("categoryShowcase2Description", sc2.description);
        setValue("categoryShowcase2Limit", sc2.item_limit); setValue("categoryShowcase2Rank", sc2.config?.rank);
    }

    const inds = getSection(SECTION_KEYS.INDUSTRIES);
    if (inds) {
        setCheckbox("industriesEnabled", inds.is_active); setValue("industriesTitle", inds.title);
        const selected = inds.config?.selected_items || [];
        document.querySelectorAll('.ind-select-checkbox').forEach(cb => cb.checked = selected.includes(Number(cb.value)));
    }

    const brands = getSection(SECTION_KEYS.BRANDS);
    if (brands) {
        setCheckbox("brandsEnabled", brands.is_active); setValue("brandsTitle", brands.title);
        const selected = brands.config?.selected_items || [];
        document.querySelectorAll('.brand-select-checkbox').forEach(cb => cb.checked = selected.includes(Number(cb.value)));
    }

    const blog = getSection(SECTION_KEYS.BLOG);
    if (blog) {
        setCheckbox("blogEnabled", blog.is_active); setValue("blogTitle", blog.title);
        const selected = blog.config?.selected_items || [];
        document.querySelectorAll('.blog-select-checkbox').forEach(cb => cb.checked = selected.includes(Number(cb.value)));
    }

    updateSectionVisibility();
}

// THU THẬP DATA TỪ FORM ĐỂ LƯU XUỐNG DB
function collectForm() {
    const current = new Map(homepageSettings.map(item => [item.section_key, item]));
    const settings = [];

    settings.push({
        ...getExisting(current, SECTION_KEYS.HERO), section_key: SECTION_KEYS.HERO, is_active: getCheckbox("heroEnabled"),
        title: getValue("heroTitle"), description: getValue("heroDescription"),
        config: {
            badge: getValue("heroBadge"), highlight: getValue("heroHighlight"), image_path: getValue("heroImagePath"),
            usps: [1,2,3,4].map(n => ({ title: getValue(`usp${n}Title`), description: getValue(`usp${n}Description`) }))
        }
    });

    const catIds = Array.from(document.querySelectorAll('.cat-select-checkbox:checked')).map(cb => Number(cb.value));
    settings.push({
        ...getExisting(current, SECTION_KEYS.CATEGORIES), section_key: SECTION_KEYS.CATEGORIES, is_active: getCheckbox("categoriesEnabled"),
        title: getValue("categoriesTitle"), item_limit: catIds.length > 0 ? catIds.length : 20,
        config: { sub_category_limit: getNumber("subcategoryLimit", 4), selected_items: catIds }
    });

    settings.push({
        ...getExisting(current, SECTION_KEYS.BEST_SELLING), section_key: SECTION_KEYS.BEST_SELLING, is_active: getCheckbox("bestSellingEnabled"),
        title: getValue("bestSellingTitle"), description: getValue("bestSellingDescription"), item_limit: getNumber("bestSellingLimit", 20),
        config: { fallback_enabled: getCheckbox("bestSellingFallback"), fallback_order: "created_at" }
    });

    settings.push({
        ...getExisting(current, SECTION_KEYS.CATEGORY_SHOWCASE_1), section_key: SECTION_KEYS.CATEGORY_SHOWCASE_1, is_active: getCheckbox("categoryShowcase1Enabled"),
        title: getNullableValue("categoryShowcase1Title"), description: getNullableValue("categoryShowcase1Description"), item_limit: getNumber("categoryShowcase1Limit", 20),
        source_type: getValue("categoryShowcase1") ? "category" : "top_category", source_id: getNullableNumber("categoryShowcase1"),
        config: { selection_mode: getValue("categoryShowcase1") ? "manual" : "product_count", rank: getNumber("categoryShowcase1Rank", 1) }
    });

    settings.push({
        ...getExisting(current, SECTION_KEYS.CATEGORY_SHOWCASE_2), section_key: SECTION_KEYS.CATEGORY_SHOWCASE_2, is_active: getCheckbox("categoryShowcase2Enabled"),
        title: getNullableValue("categoryShowcase2Title"), description: getNullableValue("categoryShowcase2Description"), item_limit: getNumber("categoryShowcase2Limit", 20),
        source_type: getValue("categoryShowcase2") ? "category" : "top_category", source_id: getNullableNumber("categoryShowcase2"),
        config: { selection_mode: getValue("categoryShowcase2") ? "manual" : "product_count", rank: getNumber("categoryShowcase2Rank", 2) }
    });

    const indIds = Array.from(document.querySelectorAll('.ind-select-checkbox:checked')).map(cb => Number(cb.value));
    settings.push({
        ...getExisting(current, SECTION_KEYS.INDUSTRIES), section_key: SECTION_KEYS.INDUSTRIES, is_active: getCheckbox("industriesEnabled"),
        title: getValue("industriesTitle"), item_limit: indIds.length > 0 ? indIds.length : 6, source_type: "industries", source_id: null,
        config: { selected_items: indIds }
    });

    const brandIds = Array.from(document.querySelectorAll('.brand-select-checkbox:checked')).map(cb => Number(cb.value));
    settings.push({
        ...getExisting(current, SECTION_KEYS.BRANDS), section_key: SECTION_KEYS.BRANDS, is_active: getCheckbox("brandsEnabled"),
        title: getValue("brandsTitle"), item_limit: brandIds.length > 0 ? brandIds.length : 50, source_type: "brands", source_id: null,
        config: { selected_items: brandIds }
    });

    const blogIds = Array.from(document.querySelectorAll('.blog-select-checkbox:checked')).map(cb => Number(cb.value));
    settings.push({
        ...getExisting(current, SECTION_KEYS.BLOG), section_key: SECTION_KEYS.BLOG, is_active: getCheckbox("blogEnabled"),
        title: getValue("blogTitle"), item_limit: blogIds.length > 0 ? blogIds.length : 3, source_type: "blogs", source_id: null,
        config: { selected_items: blogIds }
    });

    return settings;
}

function getExisting(map, key) {
    const existing = map.get(key);
    if (!existing) { const fallback = DEFAULT_SETTINGS.find(item => item.section_key === key); return structuredClone(fallback || {}); }
    return { id: existing.id, display_order: existing.display_order, created_at: existing.created_at };
}

async function saveHomepageSettings() {
    if (isSaving) return;
    isSaving = true; setSavingState(true);
    try {
        const settings = collectForm();
        const payload = settings.map(item => {
            const record = {
                section_key: item.section_key, is_active: item.is_active, title: item.title ?? null, description: item.description ?? null,
                display_order: item.display_order ?? 0, item_limit: item.item_limit ?? null, source_type: item.source_type ?? null,
                source_id: item.source_id ?? null, config: item.config || {}, updated_at: new Date().toISOString()
            };
            if (item.id) record.id = item.id;
            return record;
        });

        const { data, error } = await window.supabaseClient.from(HOMEPAGE_TABLE).upsert(payload, { onConflict: "section_key" }).select("*");
        if (error) throw error;

        homepageSettings = mergeWithDefaults(data || payload);
        showToast("Đã lưu cấu hình homepage thành công.", "success");
        formDirty = false; updateDirtyIndicator(); updateSectionVisibility();
    } catch (error) {
        showToast("Lỗi lưu cấu hình: " + error.message, "error");
    } finally {
        isSaving = false; setSavingState(false);
    }
}

function resetHomepageSettings() {
    if (!window.confirm("Khôi phục toàn bộ cấu hình homepage về mặc định?")) return;
    homepageSettings = structuredClone(DEFAULT_SETTINGS); fillForm(homepageSettings);
    formDirty = true; updateDirtyIndicator(); showToast("Đã khôi phục. Bấm Lưu để áp dụng.", "info");
}

function bindEvents() {
    document.querySelectorAll("[data-action='save-homepage']").forEach(btn => btn.addEventListener("click", saveHomepageSettings));
    document.querySelectorAll("[data-action='reset-homepage']").forEach(btn => btn.addEventListener("click", resetHomepageSettings));
    document.querySelectorAll("[data-action='preview-homepage']").forEach(btn => btn.addEventListener("click", previewHomepage));
    document.querySelectorAll("[data-homepage-section-toggle]").forEach(cb => cb.addEventListener("change", () => { updateSectionVisibility(); markDirty(); })); 
    
    updateHeroImagePreview();
    
    document.querySelectorAll("#homepageSettingsForm input[type='text'], #homepageSettingsForm input[type='number'], #homepageSettingsForm textarea, #homepageSettingsForm select").forEach(element => {
        element.addEventListener("input", markDirty); element.addEventListener("change", markDirty);
    });

    // Bắt sự kiện thay đổi cho input Upload Ảnh
    const heroUpload = document.getElementById("heroImageUpload");
    if(heroUpload) heroUpload.addEventListener("change", handleHeroImageUpload);
}

// ========================================================
// HÀM XỬ LÝ UPLOAD ẢNH LÊN SUPABASE
// ========================================================
async function handleHeroImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showToast("Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WEBP...).", "error");
        return;
    }

    const uploadBtnLabel = document.getElementById("btnUploadHeroLabel");
    const originalHtml = uploadBtnLabel.innerHTML;

    try {
        // Đổi giao diện nút thành Đang tải...
        uploadBtnLabel.innerHTML = `<svg class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Đang xử lý...`;
        uploadBtnLabel.classList.add("opacity-70", "cursor-not-allowed");

        // Đặt tên file và đường dẫn (Lưu vào thư mục 'homepage' trong bucket 'product-images')
        const fileExt = file.name.split('.').pop().toLowerCase();
        const fileName = `hero-banner-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `homepage/${fileName}`; 

        // Upload lên Supabase Storage
        const { error } = await window.supabaseClient.storage
            .from('product-images')
            .upload(filePath, file, { cacheControl: "31536000", upsert: true });

        if (error) throw error;

        // Lấy Public URL của tấm ảnh vừa up
        const { data } = window.supabaseClient.storage
            .from('product-images')
            .getPublicUrl(filePath);

        // Bơm URL vào ô input và kích hoạt preview
        const pathInput = document.getElementById("heroImagePath");
        if (pathInput) {
            pathInput.value = data.publicUrl;
            pathInput.dispatchEvent(new Event('input')); // Tự động kích hoạt hàm updateHeroImagePreview
            markDirty();
        }

        showToast("Tải ảnh lên thành công!", "success");

    } catch (error) {
        console.error("Lỗi upload ảnh:", error);
        showToast("Lỗi khi tải ảnh: " + error.message, "error");
    } finally {
        // Phục hồi lại nút Upload
        uploadBtnLabel.innerHTML = originalHtml;
        uploadBtnLabel.classList.remove("opacity-70", "cursor-not-allowed");
        event.target.value = ""; // Reset để có thể chọn lại cùng 1 file nếu cần
    }
}

// CẬP NHẬT TRẠNG THÁI ẨN/HIỆN SECTION 
function updateSectionVisibility() {
    const mappings = [
        ["heroEnabled", "heroSettingsSection"], 
        ["categoriesEnabled", "categoriesSettingsSection"], 
        ["bestSellingEnabled", "bestSellingSettingsSection"], 
        ["categoryShowcase1Enabled", "categoryShowcase1SettingsSection"], 
        ["categoryShowcase2Enabled", "categoryShowcase2SettingsSection"], 
        ["industriesEnabled", "industriesSettingsSection"], 
        ["brandsEnabled", "brandsSettingsSection"], 
        ["blogEnabled", "blogSettingsSection"]
    ];
    
    mappings.forEach(([checkboxId, sectionId]) => { 
        const cb = document.getElementById(checkboxId); 
        const sec = document.getElementById(sectionId); 
        
        if (cb && sec) {
            const isOff = !cb.checked;
            
            sec.classList.remove("is-disabled"); 
            
            if (isOff) {
                sec.classList.add("opacity-50", "grayscale");
            } else {
                sec.classList.remove("opacity-50", "grayscale");
            }

            const formElements = sec.querySelectorAll("input, select, textarea, button");
            formElements.forEach(el => {
                if (el.id !== checkboxId) {
                    el.disabled = isOff;
                    if (isOff) el.classList.add("cursor-not-allowed");
                    else el.classList.remove("cursor-not-allowed");
                }
            });
        }
    });
}

function previewHomepage() {
    try { localStorage.setItem("mro_homepage_preview", JSON.stringify(collectForm())); } catch(e){}
    window.open((window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "../index.html?preview=1" : "/?preview=1", "_blank");
}

let formDirty = false;
function markDirty() { formDirty = true; updateDirtyIndicator(); }
function updateDirtyIndicator() { const ind = document.getElementById("homepageDirtyIndicator"); if(ind) ind.classList.toggle("hidden", !formDirty); }
function setLoading(loading) { document.body.classList.toggle("homepage-settings-loading", loading); }
function setSavingState(saving) {
    document.querySelectorAll("[data-action='save-homepage']").forEach(btn => {
        btn.disabled = saving;
        if(saving) { if(!btn.dataset.originalText) btn.dataset.originalText = btn.textContent.trim(); btn.innerHTML = "Đang lưu..."; }
        else btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Lưu Cấu Hình`;
    });
}

function getValue(id) { const el = document.getElementById(id); return el ? String(el.value ?? "").trim() : ""; }
function getNullableValue(id) { const v = getValue(id); return v === "" ? null : v; }
function setValue(id, value) { const el = document.getElementById(id); if (el) el.value = value ?? ""; }
function getCheckbox(id) { const el = document.getElementById(id); return el ? Boolean(el.checked) : false; }
function setCheckbox(id, value) { const el = document.getElementById(id); if (el) el.checked = value !== false; }
function getNumber(id, fallback = 0) { const v = Number(getValue(id)); return Number.isFinite(v) ? v : fallback; }
function getNullableNumber(id) { const v = getValue(id); if (!v) return null; const n = Number(v); return Number.isFinite(n) ? n : null; }
function setSelectValue(id, value) { const el = document.getElementById(id); if (el) el.value = (value === null || value === undefined) ? "" : String(value); }

function showToast(message, type = "info") {
    let container = document.getElementById("homepageToastContainer");
    if (!container) { container = document.createElement("div"); container.id = "homepageToastContainer"; container.className = "homepage-toast-container"; document.body.appendChild(container); }
    const toast = document.createElement("div"); toast.className = `homepage-toast homepage-toast-${type}`; toast.textContent = message; container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 300); }, 3500);
}

window.HomepageSettings = { load: loadHomepageSettings, save: saveHomepageSettings, reset: resetHomepageSettings, collect: collectForm, preview: previewHomepage, getSettings: () => homepageSettings };

function updateHeroImagePreview() {
    const url = getValue("heroImagePath");
    const previewEl = document.getElementById("heroImagePreview");
    const placeholderEl = document.getElementById("heroImagePlaceholder");
    
    if (url) {
        let finalUrl = url;
        // Xử lý link nội bộ an toàn
        if (!/^https?:\/\//i.test(url) && url.startsWith('assets/')) {
            finalUrl = '../' + url;
        }
        
        previewEl.src = finalUrl;
        previewEl.classList.remove("hidden");
        if (placeholderEl) placeholderEl.classList.add("hidden");
    } else {
        previewEl.src = "";
        previewEl.classList.add("hidden");
        if (placeholderEl) placeholderEl.classList.remove("hidden");
    }
}