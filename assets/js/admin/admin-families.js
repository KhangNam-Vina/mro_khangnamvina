// ========================================================
// FILE: assets/js/admin/admin-families.js
// QUẢN LÝ DÒNG SẢN PHẨM (FAMILIES) - CHUẨN STORAGE PATH
// ========================================================

"use strict";

/* =========================================================
   CONSTANTS
========================================================= */
const STORAGE_BUCKET = "product-images";
const STORAGE_FAMILY_PREFIX = "families";
const IMAGE_CDN_BASE = "https://mrokhangnam-image.khangnamvn.workers.dev";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB cho thumbnail
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/* =========================================================
   STATE
========================================================= */
const state = {
    families: [],
    categories: [],
    subCategories: [],
    
    currentPage: 1,
    itemsPerPage: 15,
    totalItems: 0,
    searchQuery: "",
    filterSubCategoryId: "all",
    
    editingId: null,
    selectedCategoryId: null,

    mediaDraft: {
        thumbnailPath: null,
        thumbnailUrl: null,
        thumbnailRemoved: false,
        pendingFile: null
    }
};

/* =========================================================
   DOM ELEMENTS
========================================================= */
const DOM = {
    // Table & Stats
    tableBody: document.getElementById("familyTableBody"),
    pagination: document.getElementById("paginationContainer"),
    searchInput: document.getElementById("searchFamilyInput"),
    filterSubCategory: document.getElementById("filterSubCategorySelect"),
    
    statTotal: document.getElementById("familyTotal"),
    statLinked: document.getElementById("familyLinked"),
    statBroken: document.getElementById("familyBroken"),

    // Buttons
    btnAdd: document.getElementById("btnAddFamily"),
    
    // Modal
    modal: document.getElementById("familyModal"),
    modalTitle: document.getElementById("modalTitle"),
    form: document.getElementById("familyForm"),
    btnClose: document.getElementById("btnCloseModal"),
    btnCancel: document.getElementById("btnCancelEdit"),
    btnSave: document.getElementById("btnSaveFamily"),

    // Form Inputs
    inFamilyId: document.getElementById("familyId"),
    inName: document.getElementById("inName"),
    inSlug: document.getElementById("inSlug"),
    inSubCategory: document.getElementById("selSubCategory"),

    // Combobox Elements (Category)
    catCombobox: document.getElementById("categoryCombobox"),
    catTrigger: document.getElementById("categoryTrigger"),
    catSelectedText: document.getElementById("categorySelectedText"),
    catDropdown: document.getElementById("categoryDropdown"),
    catSearch: document.getElementById("categorySearch"),
    catOptions: document.getElementById("categoryOptions"),

    // Combobox Elements (SubCategory)
    subCombobox: document.getElementById("subCategoryCombobox"),
    subTrigger: document.getElementById("subCategoryTrigger"),
    subSelectedText: document.getElementById("subCategorySelectedText"),
    subDropdown: document.getElementById("subCategoryDropdown"),
    subSearch: document.getElementById("subCategorySearch"),
    subOptions: document.getElementById("subCategoryOptions"),

    // Thumbnail
    inThumbnailFile: document.getElementById("inThumbnailFile"),
    thumbnailFileName: document.getElementById("thumbnailFileName"),
    btnRemoveThumbnail: document.getElementById("btnRemoveThumbnail"),
    thumbnailPreview: document.getElementById("thumbnailPreview")
};

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
    if (typeof window.checkAdminAuth === "function") {
        const user = await window.checkAdminAuth();
        if (!user) return;
    }
    
    setupEvents();
    await loadMasterData();
    await fetchFamilies();
    await loadStatistics();
});

/* =========================================================
   EVENTS
========================================================= */
function setupEvents() {
    // Search & Filter
    let searchTimer;
    DOM.searchInput?.addEventListener("input", (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.searchQuery = e.target.value.trim();
            state.currentPage = 1;
            fetchFamilies();
        }, 300);
    });

    DOM.filterSubCategory?.addEventListener("change", (e) => {
        state.filterSubCategoryId = e.target.value;
        state.currentPage = 1;
        fetchFamilies();
    });

    // Auto-generate Slug
    DOM.inName?.addEventListener("input", (e) => {
        if (!state.editingId) {
            DOM.inSlug.value = generateSlug(e.target.value);
        }
    });

    // Modal
    DOM.btnAdd?.addEventListener("click", () => openModal());
    DOM.btnClose?.addEventListener("click", closeModal);
    DOM.btnCancel?.addEventListener("click", closeModal);
    DOM.form?.addEventListener("submit", saveFamily);
    
    // Đóng Modal khi bấm ra ngoài nền đen
    DOM.modal?.addEventListener("click", (e) => {
        if (e.target === DOM.modal) closeModal();
    });

    // Combobox Toggles
    DOM.catTrigger?.addEventListener("click", () => {
        DOM.catDropdown.classList.toggle("hidden");
        DOM.subDropdown.classList.add("hidden");
        DOM.catSearch.focus();
    });

    DOM.subTrigger?.addEventListener("click", () => {
        if(DOM.subTrigger.disabled) return;
        DOM.subDropdown.classList.toggle("hidden");
        DOM.catDropdown.classList.add("hidden");
        DOM.subSearch.focus();
    });

    // Đóng Combobox khi click ra ngoài
    document.addEventListener("click", (e) => {
        if (!e.target.closest("#categoryCombobox")) DOM.catDropdown?.classList.add("hidden");
        if (!e.target.closest("#subCategoryCombobox")) DOM.subDropdown?.classList.add("hidden");
    });

    // Combobox Search
    DOM.catSearch?.addEventListener("input", e => renderCategoryOptions(e.target.value));
    DOM.subSearch?.addEventListener("input", e => renderSubCategoryOptions(e.target.value));

    // Chọn Option
    DOM.catOptions?.addEventListener("click", handleCategorySelect);
    DOM.subOptions?.addEventListener("click", handleSubCategorySelect);

    // Thumbnail Events
    DOM.inThumbnailFile?.addEventListener("change", handleThumbnailSelect);
    DOM.btnRemoveThumbnail?.addEventListener("click", handleThumbnailRemove);

    // Bảng Data Click (Sửa / Xóa)
    DOM.tableBody?.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;
        
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === "edit") openModal(id);
        if (action === "delete") deleteFamily(id);
    });

    // Phân trang
    DOM.pagination?.addEventListener("click", (e) => {
        const pageBtn = e.target.closest("button[data-page]");
        const actionBtn = e.target.closest("button[data-page-action]");
        
        if (pageBtn) {
            state.currentPage = Number(pageBtn.dataset.page);
            fetchFamilies();
        } else if (actionBtn) {
            const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
            if (actionBtn.dataset.pageAction === "prev" && state.currentPage > 1) {
                state.currentPage--;
                fetchFamilies();
            }
            if (actionBtn.dataset.pageAction === "next" && state.currentPage < totalPages) {
                state.currentPage++;
                fetchFamilies();
            }
        }
    });
}

/* =========================================================
   LOAD DATA
========================================================= */
async function loadMasterData() {
    try {
        const [catsRes, subsRes] = await Promise.all([
            window.supabaseClient.from("categories").select("id, name").order("name"),
            window.supabaseClient.from("sub_categories").select("id, name, category_id").order("name")
        ]);

        if (catsRes.error) throw catsRes.error;
        if (subsRes.error) throw subsRes.error;

        state.categories = catsRes.data || [];
        state.subCategories = subsRes.data || [];

        // Đổ dữ liệu vào Filter dropdown
        if (DOM.filterSubCategory) {
            DOM.filterSubCategory.innerHTML = `
                <option value="all">Tất cả nhóm hàng</option>
                ${state.subCategories.map(s => `<option value="${s.id}">${window.utils.escapeHTML(s.name)}</option>`).join('')}
            `;
        }
        
        renderCategoryOptions();

    } catch (error) {
        console.error("Lỗi tải Master Data:", error);
        window.utils.showToast("Không thể tải danh mục gốc.", "error");
    }
}

async function loadStatistics() {
    try {
        const { count: total } = await window.supabaseClient.from("families").select("id", { count: "exact", head: true });
        const { count: linked } = await window.supabaseClient.from("families").select("id", { count: "exact", head: true }).not("sub_category_id", "is", null);
        const { count: broken } = await window.supabaseClient.from("families").select("id", { count: "exact", head: true }).is("sub_category_id", null);

        if(DOM.statTotal) DOM.statTotal.textContent = total || 0;
        if(DOM.statLinked) DOM.statLinked.textContent = linked || 0;
        if(DOM.statBroken) DOM.statBroken.textContent = broken || 0;
    } catch (error) {
        console.error("Lỗi đếm thống kê:", error);
    }
}

async function fetchFamilies() {
    if (!DOM.tableBody) return;
    DOM.tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-400">Đang tải dữ liệu...</td></tr>`;

    try {
        let query = window.supabaseClient
            .from("families")
            .select(`*, sub_categories(name)`, { count: "exact" });

        if (state.searchQuery) {
            query = query.or(`name.ilike.%${state.searchQuery}%,slug.ilike.%${state.searchQuery}%`);
        }

        if (state.filterSubCategoryId !== "all") {
            query = query.eq("sub_category_id", state.filterSubCategoryId);
        }

        const from = (state.currentPage - 1) * state.itemsPerPage;
        const to = from + state.itemsPerPage - 1;

        const { data, count, error } = await query
            .order("created_at", { ascending: false })
            .range(from, to);

        if (error) throw error;

        state.families = data || [];
        state.totalItems = count || 0;

        renderFamilies(from);
        renderPagination();

    } catch (error) {
        console.error("Lỗi tải Families:", error);
        DOM.tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500">Lỗi: ${error.message}</td></tr>`;
    }
}

/* =========================================================
   RENDER TABLE
========================================================= */
function renderFamilies(from) {
    if (state.families.length === 0) {
        DOM.tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-400 italic">Chưa có dòng sản phẩm nào.</td></tr>`;
        return;
    }

    DOM.tableBody.innerHTML = state.families.map((item, index) => {
        const name = window.utils.escapeHTML(item.name);
        const slug = window.utils.escapeHTML(item.slug || "");
        const subCatName = item.sub_categories ? window.utils.escapeHTML(item.sub_categories.name) : `<span class="text-red-500 font-bold">Thiếu liên kết</span>`;
        
        let thumbHtml = `<div class="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 border border-gray-200">Trống</div>`;
        if (item.thumbnail_url) {
            const url = buildImageUrl(item.thumbnail_url);
            thumbHtml = `<img src="${url}" class="w-12 h-12 rounded object-contain bg-white border border-gray-200" alt="Thumb" onerror="this.outerHTML='<div class=\\'w-12 h-12 rounded bg-red-50 flex items-center justify-center text-[10px] text-red-400 border border-red-100\\'>Lỗi</div>'">`;
        }

        return `
            <tr class="hover:bg-blue-50/30 transition">
                <td class="p-4 text-center text-xs font-bold text-gray-400">${from + index + 1}</td>
                <td class="p-4 text-center">${thumbHtml}</td>
                <td class="p-4">
                    <div class="font-bold text-gray-900">${name}</div>
                    <div class="text-[11px] text-gray-500 mt-1">${slug}</div>
                </td>
                <td class="p-4 text-sm">${subCatName}</td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button type="button" data-action="edit" data-id="${item.id}" class="p-2 text-kn-blue hover:bg-blue-50 rounded transition" title="Sửa">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button type="button" data-action="delete" data-id="${item.id}" class="p-2 text-red-500 hover:bg-red-50 rounded transition" title="Xóa">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPagination() {
    if (!DOM.pagination) return;
    const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
    if (totalPages <= 1) {
        DOM.pagination.innerHTML = `<div class="text-xs text-gray-500">Tổng cộng: <strong class="text-gray-900">${state.totalItems}</strong> dòng sản phẩm</div>`;
        return;
    }

    // Logic sinh nút phân trang... (Giữ nguyên logic của utils nếu có, hoặc tạo nút đơn giản)
    DOM.pagination.innerHTML = `
        <div class="text-xs text-gray-500 mb-3 sm:mb-0">Trang ${state.currentPage} / ${totalPages} (${state.totalItems} kết quả)</div>
        <div class="flex gap-1">
            <button data-page-action="prev" class="px-3 py-1.5 border rounded-lg text-xs font-bold ${state.currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'}">Trước</button>
            <button data-page-action="next" class="px-3 py-1.5 border rounded-lg text-xs font-bold ${state.currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'}">Sau</button>
        </div>
    `;
}

/* =========================================================
   COMBOBOX LOGIC
========================================================= */
function renderCategoryOptions(keyword = "") {
    const kw = keyword.toLowerCase().trim();
    const filtered = state.categories.filter(c => c.name.toLowerCase().includes(kw));
    
    if(filtered.length === 0) {
        DOM.catOptions.innerHTML = `<div class="p-3 text-xs text-gray-400 text-center">Không tìm thấy</div>`;
        return;
    }
    
    DOM.catOptions.innerHTML = filtered.map(c => `
        <div class="p-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-kn-blue cursor-pointer rounded-lg font-medium transition" data-id="${c.id}">${window.utils.escapeHTML(c.name)}</div>
    `).join('');
}

function renderSubCategoryOptions(keyword = "") {
    const kw = keyword.toLowerCase().trim();
    let filtered = state.subCategories;
    
    if (state.selectedCategoryId) {
        filtered = filtered.filter(s => String(s.category_id) === String(state.selectedCategoryId));
    }
    
    filtered = filtered.filter(s => s.name.toLowerCase().includes(kw));
    
    if(filtered.length === 0) {
        DOM.subOptions.innerHTML = `<div class="p-3 text-xs text-gray-400 text-center">Không tìm thấy</div>`;
        return;
    }
    
    DOM.subOptions.innerHTML = filtered.map(s => `
        <div class="p-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-kn-blue cursor-pointer rounded-lg font-medium transition" data-id="${s.id}">${window.utils.escapeHTML(s.name)}</div>
    `).join('');
}

function handleCategorySelect(e) {
    if (!e.target.dataset.id) return;
    const id = e.target.dataset.id;
    const name = e.target.textContent;

    state.selectedCategoryId = id;
    DOM.catSelectedText.textContent = name;
    DOM.catSelectedText.classList.replace("text-gray-500", "text-gray-900");
    DOM.catSelectedText.classList.add("font-bold");
    DOM.catDropdown.classList.add("hidden");

    // Mở khóa Subcategory
    DOM.inSubCategory.value = "";
    DOM.subSelectedText.textContent = "-- Chọn nhóm hàng --";
    DOM.subSelectedText.classList.remove("font-bold", "text-gray-900");
    DOM.subTrigger.disabled = false;
    DOM.subTrigger.classList.remove("bg-gray-50", "opacity-60");
    
    renderSubCategoryOptions();
}

function handleSubCategorySelect(e) {
    if (!e.target.dataset.id) return;
    const id = e.target.dataset.id;
    const name = e.target.textContent;

    DOM.inSubCategory.value = id;
    DOM.subSelectedText.textContent = name;
    DOM.subSelectedText.classList.replace("text-gray-400", "text-gray-900");
    DOM.subSelectedText.classList.add("font-bold");
    DOM.subDropdown.classList.add("hidden");
}

/* =========================================================
   THUMBNAIL LOGIC
========================================================= */
function buildImageUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${IMAGE_CDN_BASE}/${path.replace(/^\/+/, "")}`;
}

function handleThumbnailSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error("Chỉ hỗ trợ file JPG, PNG, WEBP, GIF.");
        if (file.size > MAX_IMAGE_SIZE) throw new Error("Kích thước file tối đa 5MB.");
        
        state.mediaDraft.pendingFile = file;
        state.mediaDraft.thumbnailRemoved = false;

        DOM.thumbnailFileName.textContent = file.name;
        DOM.btnRemoveThumbnail.classList.remove("hidden");
        
        const previewUrl = URL.createObjectURL(file);
        DOM.thumbnailPreview.classList.remove("hidden");
        DOM.thumbnailPreview.innerHTML = `
            <img src="${previewUrl}" class="w-32 h-32 object-contain rounded-lg border border-gray-200 bg-white p-1">
        `;
    } catch (error) {
        window.utils.showToast(error.message, "error");
        e.target.value = "";
    }
}

function handleThumbnailRemove() {
    state.mediaDraft.pendingFile = null;
    state.mediaDraft.thumbnailRemoved = true;
    
    DOM.inThumbnailFile.value = "";
    DOM.thumbnailFileName.textContent = "Chưa chọn ảnh";
    DOM.btnRemoveThumbnail.classList.add("hidden");
    DOM.thumbnailPreview.innerHTML = "";
    DOM.thumbnailPreview.classList.add("hidden");
}

/* =========================================================
   MODAL ACTIONS (ADD/EDIT/DELETE)
========================================================= */
function openModal(id = null) {
    state.editingId = id;
    DOM.form.reset();
    
    // Reset Media
    state.mediaDraft = { thumbnailPath: null, thumbnailUrl: null, thumbnailRemoved: false, pendingFile: null };
    DOM.thumbnailFileName.textContent = "Chưa chọn ảnh";
    DOM.btnRemoveThumbnail.classList.add("hidden");
    DOM.thumbnailPreview.classList.add("hidden");
    DOM.thumbnailPreview.innerHTML = "";

    // Reset Combobox
    state.selectedCategoryId = null;
    DOM.catSelectedText.textContent = "-- Chọn danh mục --";
    DOM.catSelectedText.classList.replace("text-gray-900", "text-gray-500");
    DOM.catSelectedText.classList.remove("font-bold");
    
    DOM.subSelectedText.textContent = "Chọn danh mục trước...";
    DOM.subSelectedText.classList.remove("font-bold", "text-gray-900");
    DOM.subTrigger.disabled = true;
    DOM.subTrigger.classList.add("bg-gray-50", "opacity-60");

    if (id) {
        DOM.modalTitle.textContent = "Chỉnh sửa Dòng sản phẩm";
        const item = state.families.find(f => String(f.id) === String(id));
        if (item) {
            DOM.inFamilyId.value = item.id;
            DOM.inName.value = item.name;
            DOM.inSlug.value = item.slug || "";
            
            // Phục hồi Combobox
            if (item.sub_category_id) {
                DOM.inSubCategory.value = item.sub_category_id;
                const sub = state.subCategories.find(s => String(s.id) === String(item.sub_category_id));
                if (sub) {
                    DOM.subSelectedText.textContent = sub.name;
                    DOM.subSelectedText.classList.add("text-gray-900", "font-bold");
                    DOM.subTrigger.disabled = false;
                    DOM.subTrigger.classList.remove("bg-gray-50", "opacity-60");
                    
                    state.selectedCategoryId = sub.category_id;
                    const cat = state.categories.find(c => String(c.id) === String(sub.category_id));
                    if(cat) {
                        DOM.catSelectedText.textContent = cat.name;
                        DOM.catSelectedText.classList.add("text-gray-900", "font-bold");
                        renderSubCategoryOptions();
                    }
                }
            }

            // Phục hồi Media
            if (item.thumbnail_url) {
                state.mediaDraft.thumbnailPath = item.thumbnail_url;
                DOM.thumbnailFileName.textContent = "Ảnh hiện tại";
                DOM.btnRemoveThumbnail.classList.remove("hidden");
                DOM.thumbnailPreview.classList.remove("hidden");
                DOM.thumbnailPreview.innerHTML = `
                    <img src="${buildImageUrl(item.thumbnail_url)}" class="w-32 h-32 object-contain rounded-lg border border-gray-200 bg-white p-1">
                `;
            }
        }
    } else {
        DOM.modalTitle.textContent = "Thêm Dòng sản phẩm";
        DOM.inFamilyId.value = "";
    }

    DOM.modal.classList.remove("hidden");
    DOM.modal.classList.add("flex");
}

function closeModal() {
    DOM.modal.classList.add("hidden");
    DOM.modal.classList.remove("flex");
}

async function saveFamily(e) {
    e.preventDefault();
    const btn = DOM.btnSave;
    const originText = btn.textContent;
    btn.disabled = true;

    try {
        const name = DOM.inName.value.trim();
        const slug = DOM.inSlug.value.trim() || generateSlug(name);
        const subCategoryId = DOM.inSubCategory.value || null;

        if (!name) throw new Error("Vui lòng nhập tên dòng sản phẩm.");
        if (!subCategoryId) throw new Error("Vui lòng chọn Nhóm hàng.");

        const payload = { name, slug, sub_category_id: subCategoryId };

        // Xử lý Upload Ảnh
        let newThumbPath = null;
        if (state.mediaDraft.pendingFile) {
            btn.textContent = "Đang tải ảnh lên...";
            const file = state.mediaDraft.pendingFile;
            const ext = file.name.split('.').pop().toLowerCase();
            const fileName = `thumbnail-${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
            // ID tạm nếu thêm mới thì mình lấy ID sau, nhưng Supabase cần path trước.
            // Để chuẩn kiến trúc: families/FAMILY_ID/thumbnail/xxx
            // Ta bắt buộc phải INSERT data trước để lấy ID, sau đó mới Upload và UPDATE lại.
        }

        if (!state.editingId) {
            // 1. THÊM MỚI
            btn.textContent = "Đang lưu DB...";
            const { data: newFam, error: insertError } = await window.supabaseClient
                .from("families")
                .insert([payload])
                .select("id")
                .single();

            if (insertError) throw insertError;
            
            // 2. Nếu có ảnh, upload ảnh và update lại
            if (state.mediaDraft.pendingFile) {
                btn.textContent = "Đang tải ảnh...";
                const file = state.mediaDraft.pendingFile;
                const ext = file.name.split('.').pop().toLowerCase();
                const path = `${STORAGE_FAMILY_PREFIX}/${newFam.id}/thumbnail/thumbnail-${Date.now()}.${ext}`;
                
                const { error: upErr } = await window.supabaseClient.storage.from(STORAGE_BUCKET).upload(path, file, { cacheControl: "31536000", upsert: false });
                if (!upErr) {
                    await window.supabaseClient.from("families").update({ thumbnail_url: path }).eq("id", newFam.id);
                }
            }
            window.utils.showToast("Thêm dòng sản phẩm thành công!", "success");

        } else {
            // 1. CẬP NHẬT
            const famId = state.editingId;
            let pathToDelete = null;

            if (state.mediaDraft.pendingFile) {
                btn.textContent = "Đang tải ảnh mới...";
                const file = state.mediaDraft.pendingFile;
                const ext = file.name.split('.').pop().toLowerCase();
                const newPath = `${STORAGE_FAMILY_PREFIX}/${famId}/thumbnail/thumbnail-${Date.now()}.${ext}`;
                
                const { error: upErr } = await window.supabaseClient.storage.from(STORAGE_BUCKET).upload(newPath, file, { cacheControl: "31536000", upsert: false });
                if (upErr) throw upErr;
                
                payload.thumbnail_url = newPath;
                if (state.mediaDraft.thumbnailPath) pathToDelete = state.mediaDraft.thumbnailPath; // Dọn ảnh cũ
            } else if (state.mediaDraft.thumbnailRemoved) {
                payload.thumbnail_url = null;
                if (state.mediaDraft.thumbnailPath) pathToDelete = state.mediaDraft.thumbnailPath;
            }

            btn.textContent = "Đang lưu thay đổi...";
            const { error: updateError } = await window.supabaseClient.from("families").update(payload).eq("id", famId);
            if (updateError) throw updateError;

            // Dọn rác Storage
            if (pathToDelete && !/^https?:\/\//i.test(pathToDelete)) {
                await window.supabaseClient.storage.from(STORAGE_BUCKET).remove([pathToDelete]);
            }

            window.utils.showToast("Đã lưu thay đổi!", "success");
        }

        closeModal();
        await fetchFamilies();
        await loadStatistics();

    } catch (error) {
        console.error("Lỗi lưu:", error);
        window.utils.showToast(error.message.includes("unique") ? "Tên hoặc Slug đã tồn tại!" : error.message, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = originText;
    }
}

async function deleteFamily(id) {
    const item = state.families.find(f => String(f.id) === String(id));
    if (!item) return;

    if (!window.confirm(`Xóa dòng sản phẩm: ${item.name}?\n\nChú ý: Hành động này sẽ xóa dòng sản phẩm và dọn dẹp ảnh trong Storage.`)) return;

    try {
        const { error } = await window.supabaseClient.from("families").delete().eq("id", id);
        if (error) throw error;

        // Cleanup Storage
        if (item.thumbnail_url && !/^https?:\/\//i.test(item.thumbnail_url)) {
            await window.supabaseClient.storage.from(STORAGE_BUCKET).remove([item.thumbnail_url]);
        }

        if (state.families.length === 1 && state.currentPage > 1) state.currentPage--;
        
        window.utils.showToast("Đã xóa dòng sản phẩm!", "success");
        await fetchFamilies();
        await loadStatistics();
    } catch (error) {
        window.utils.showToast(`Lỗi xóa: ${error.message}`, "error");
    }
}

/* =========================================================
   UTILS
========================================================= */
function generateSlug(text) {
    return text.toString().toLowerCase()
        .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
        .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
        .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
        .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
        .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
        .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
        .replace(/đ/gi, 'd')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}