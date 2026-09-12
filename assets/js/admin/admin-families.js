// ========================================================
// FILE: assets/js/admin/admin-families.js
// QUẢN LÝ DÒNG SẢN PHẨM (FAMILIES) - CHUẨN STORAGE PATH
// ========================================================

"use strict";

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
    DOM.tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-10 text-gray-400">Đang tải dữ liệu...</td></tr>`;

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
        DOM.tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-10 text-red-500">Lỗi: ${error.message}</td></tr>`;
    }
}

/* =========================================================
   RENDER TABLE
========================================================= */
function renderFamilies(from) {
    if (state.families.length === 0) {
        DOM.tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-10 text-gray-400 italic">Chưa có dòng sản phẩm nào.</td></tr>`;
        return;
    }

    DOM.tableBody.innerHTML = state.families.map((item, index) => {
        const name = window.utils.escapeHTML(item.name);
        const slug = window.utils.escapeHTML(item.slug || "");
        const subCatName = item.sub_categories ? window.utils.escapeHTML(item.sub_categories.name) : `<span class="text-red-500 font-bold">Thiếu liên kết</span>`;

        return `
            <tr class="hover:bg-blue-50/30 transition">
                <td class="p-4 text-center text-xs font-bold text-gray-400">${from + index + 1}</td>
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

    // ==========================================
    // THUẬT TOÁN TẠO SỐ TRANG (Tối đa 5 nút)
    // ==========================================
    let pagesHTML = '';
    const maxVisible = 5;
    let startPage = Math.max(1, state.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
        pagesHTML += `
            <button data-page="${page}" class="px-3 py-1.5 border rounded-lg text-xs font-bold transition ${page === state.currentPage ? 'bg-kn-blue text-white border-kn-blue' : 'bg-white text-gray-600 hover:bg-gray-50'}">
                ${page}
            </button>
        `;
    }

    // ==========================================
    // VẼ RA GIAO DIỆN
    // ==========================================
    DOM.pagination.innerHTML = `
        <div class="text-xs text-gray-500 mb-3 sm:mb-0">
            Trang <strong class="text-gray-900">${state.currentPage}</strong> / ${totalPages} (${state.totalItems} kết quả)
        </div>
        
        <div class="flex gap-1">
            <button data-page-action="prev" ${state.currentPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 border rounded-lg text-xs font-bold transition ${state.currentPage === 1 ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-600 hover:bg-gray-50'}">
                Trước
            </button>
            
            ${pagesHTML}
            
            <button data-page-action="next" ${state.currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 border rounded-lg text-xs font-bold transition ${state.currentPage === totalPages ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-600 hover:bg-gray-50'}">
                Sau
            </button>
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
   MODAL ACTIONS (ADD/EDIT/DELETE)
========================================================= */
function openModal(id = null) {
    state.editingId = id;
    DOM.form.reset();

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

        if (!name) {
            throw new Error("Vui lòng nhập tên dòng sản phẩm.");
        }

        if (!subCategoryId) {
            throw new Error("Vui lòng chọn Nhóm hàng.");
        }

        const payload = {
            name,
            slug,
            sub_category_id: subCategoryId
        };

        if (!state.editingId) {
            // =================================================
            // THÊM MỚI
            // =================================================
            btn.textContent = "Đang lưu DB...";

            const { error: insertError } = await window.supabaseClient
                .from("families")
                .insert([payload]);

            if (insertError) throw insertError;

            window.utils.showToast(
                "Thêm dòng sản phẩm thành công!",
                "success"
            );

        } else {
            // =================================================
            // CẬP NHẬT
            // =================================================
            const famId = state.editingId;

            btn.textContent = "Đang lưu thay đổi...";

            const { error: updateError } = await window.supabaseClient
                .from("families")
                .update(payload)
                .eq("id", famId);

            if (updateError) throw updateError;

            window.utils.showToast(
                "Đã lưu thay đổi!",
                "success"
            );
        }

        closeModal();

        await fetchFamilies();
        await loadStatistics();

    } catch (error) {
        console.error("Lỗi lưu Family:", error);

        window.utils.showToast(
            error.message.includes("unique")
                ? "Tên hoặc Slug đã tồn tại!"
                : error.message,
            "error"
        );

    } finally {
        btn.disabled = false;
        btn.textContent = originText;
    }
}

async function deleteFamily(id) {
    const item = state.families.find(f => String(f.id) === String(id));
    if (!item) return;

    if (!window.confirm(`Xóa dòng sản phẩm: ${item.name}?`)) return;

    try {
        const { error } = await window.supabaseClient
            .from("families")
            .delete()
            .eq("id", id);

        if (error) throw error;

        if (state.families.length === 1 && state.currentPage > 1) {
            state.currentPage--;
        }

        window.utils.showToast("Đã xóa dòng sản phẩm!", "success");

        await fetchFamilies();
        await loadStatistics();

    } catch (error) {
        console.error("Lỗi xóa Family:", error);
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