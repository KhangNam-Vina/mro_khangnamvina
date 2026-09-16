// ========================================================
// FILE: assets/js/admin/admin-categories.js
// QUẢN LÝ DANH MỤC (PHÂN TRANG + ẨN/HIỆN STATUS)
// ========================================================

const state = {
    categories: [],
    filteredCategories: [],
    editingId: null,
    isSaving: false,
    currentPage: 1,
    itemsPerPage: 15,
    filterStatus: 'all' // 'all' | 'active' | 'hidden'
};

const DOM = {
    toastContainer: document.getElementById("toastContainer"),
    search: document.getElementById("searchCategoryInput"),
    filterStatus: document.getElementById("filterStatusSelect"),
    tableBody: document.getElementById("categoryTableBody"),
    categoryTotal: document.getElementById("categoryTotal"),
    categoryActive: document.getElementById("categoryActive"),
    categoryHidden: document.getElementById("categoryHidden"),
    resultInfo: document.getElementById("categoryResultInfo"),
    pagination: document.getElementById("paginationContainer"),
    modal: document.getElementById("categoryModal"),
    modalTitle: document.getElementById("modalTitle"),
    form: document.getElementById("categoryForm"),
    id: document.getElementById("categoryId"),
    name: document.getElementById("categoryName"),
    slug: document.getElementById("categorySlug"),
    description: document.getElementById("categoryDescription"),
    isActive: document.getElementById("categoryIsActive"),
    metaTitle: document.getElementById("categoryMetaTitle"),
    metaDescription: document.getElementById("categoryMetaDescription"),
    btnSave: document.getElementById("btnSubmitForm"),
    btnAdd: document.getElementById("btnAddCategory"),
    btnClose: document.getElementById("btnCloseModal"),
    btnCancel: document.getElementById("btnCancelModal")
};

const utils = {
    escapeHTML(val) {
        if (!val) return "";
        return String(val).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
    },
    showToast(message, type = "success") {
        if (!DOM.toastContainer) return;
        const config = { success: { bg: "bg-green-600", icon: "✓" }, error: { bg: "bg-red-600", icon: "×" }, warning: { bg: "bg-orange-500", icon: "!" } };
        const style = config[type] || config.success;
        const toast = document.createElement("div");
        toast.className = `flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-bold text-white ${style.bg} opacity-0 translate-y-2 transition-all duration-300`;
        toast.innerHTML = `<span class="font-black text-base">${style.icon}</span><span>${utils.escapeHTML(message)}</span>`;
        DOM.toastContainer.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove("opacity-0", "translate-y-2"));
        setTimeout(() => { toast.classList.add("opacity-0", "translate-y-2"); setTimeout(() => toast.remove(), 300); }, 3500);
    }
};

// ========================================================
// 1. TẢI DỮ LIỆU TỪ SUPABASE
// ========================================================
async function loadCategories() {
    try {
        const { data, error } = await window.supabaseClient.from("categories").select("*").order("id", { ascending: true });
        if (error) throw error;
        state.categories = data || [];
        renderSummary();
        applySearchAndFilter();
    } catch (error) {
        utils.showToast(`Lỗi tải danh mục: ${error.message}`, "error");
        DOM.tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-red-500 font-bold">Lỗi tải dữ liệu.</td></tr>`;
    }
}

// Cập nhật thẻ tóm tắt (Summary)
function renderSummary() {
    if (!DOM.categoryTotal) return;
    const total = state.categories.length;
    const active = state.categories.filter(c => c.is_active !== false).length;
    const hidden = total - active;
    
    DOM.categoryTotal.textContent = total;
    DOM.categoryActive.textContent = active;
    DOM.categoryHidden.textContent = hidden;
}

// ========================================================
// 2. LỌC & TÌM KIẾM
// ========================================================
function applySearchAndFilter() {
    const keyword = DOM.search?.value.trim().toLowerCase() || "";
    const status = state.filterStatus;

    let result = state.categories.filter(cat => {
        // Lọc theo keyword (Tên hoặc Slug)
        const matchKeyword = !keyword || (cat.name?.toLowerCase().includes(keyword) || cat.slug?.toLowerCase().includes(keyword));
        
        // Lọc theo trạng thái
        let matchStatus = true;
        if (status === "active") matchStatus = cat.is_active !== false;
        if (status === "hidden") matchStatus = cat.is_active === false;

        return matchKeyword && matchStatus;
    });

    state.filteredCategories = result;
    state.currentPage = 1; // Reset trang về 1 khi lọc
    renderTable();
}

// ========================================================
// 3. XUẤT BẢNG VÀ PHÂN TRANG
// ========================================================
function renderTable() {
    if (!DOM.tableBody) return;
    DOM.tableBody.innerHTML = "";

    const total = state.filteredCategories.length;
    if (DOM.resultInfo) DOM.resultInfo.innerHTML = `Hiển thị <strong>${total}</strong> danh mục phù hợp`;

    if (total === 0) {
        DOM.tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-16 text-gray-500 font-medium bg-gray-50/50">Không tìm thấy danh mục nào phù hợp.</td></tr>`;
        DOM.pagination.innerHTML = "";
        return;
    }

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const paginatedData = state.filteredCategories.slice(startIndex, endIndex);

    let html = '';
    paginatedData.forEach((cat, index) => {
        const stt = startIndex + index + 1;
        const isChecked = cat.is_active !== false ? "checked" : "";

        html += `
            <tr class="hover:bg-gray-50/80 transition border-b border-gray-100 last:border-0">
                <!-- STT -->
                <td class="px-4 py-3.5 text-center text-sm font-bold text-gray-600 border-r border-gray-50 w-16">${stt}</td>
                <!-- ID -->
                <td class="px-4 py-3.5 text-center text-sm font-mono text-gray-400 w-24">#${cat.id}</td>
                <!-- TÊN DANH MỤC -->
                <td class="px-4 py-3.5 text-left"><span class="font-black text-gray-900 text-base">${utils.escapeHTML(cat.name)}</span></td>
                <!-- SLUG -->
                <td class="px-4 py-3.5 text-left text-sm text-gray-500 font-mono">${utils.escapeHTML(cat.slug)}</td>
                
                <!-- TRẠNG THÁI GẠT -->
                <td class="px-4 py-3.5 text-center w-36">
                    <label class="relative inline-flex items-center cursor-pointer" title="${cat.is_active !== false ? 'Đang hiển thị' : 'Đang ẩn'}">
                        <input type="checkbox" onchange="toggleCategoryStatus(${cat.id}, ${cat.is_active})" class="sr-only peer" ${isChecked}>
                        <div class="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                    </label>
                </td>

                <!-- THAO TÁC -->
                <td class="px-4 py-3.5 text-right w-40">
                    <div class="flex justify-end items-center gap-1">
                        <button type="button" onclick="editCategory(${cat.id})" class="px-3 py-2 rounded-lg text-xs font-bold text-kn-blue hover:bg-blue-50 transition">Sửa</button>
                        <button type="button" onclick="deleteCategory(${cat.id})" class="px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition">Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    });
    DOM.tableBody.innerHTML = html;
    renderPagination(total);
}

function renderPagination(totalItems) {
    if (!DOM.pagination) return;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    if (totalPages <= 1) { DOM.pagination.innerHTML = ""; return; }

    let pagesHTML = ''; const maxVisible = 5;
    let startPage = Math.max(1, state.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);

    for (let page = startPage; page <= endPage; page++) {
        pagesHTML += `<button type="button" onclick="changePage(${page})" class="px-2.5 py-1.5 rounded-lg text-xs font-bold border ${page === state.currentPage ? 'bg-kn-blue text-white border-kn-blue' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}">${page}</button>`;
    }

    DOM.pagination.innerHTML = `
        <button type="button" onclick="changePage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''} class="px-2.5 py-1.5 rounded-lg text-xs font-bold border ${state.currentPage === 1 ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}">←</button>
        ${pagesHTML}
        <button type="button" onclick="changePage(${state.currentPage + 1})" ${state.currentPage === totalPages ? 'disabled' : ''} class="px-2.5 py-1.5 rounded-lg text-xs font-bold border ${state.currentPage === totalPages ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}">→</button>
    `;
}

window.changePage = function(page) {
    const totalPages = Math.ceil(state.filteredCategories.length / state.itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        state.currentPage = page; renderTable();
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// ========================================================
// 4. BẤM GẠT CÔNG TẮC BÊN NGOÀI BẢNG
// ========================================================
window.toggleCategoryStatus = async function (id, currentStatus) {
    const newStatus = !currentStatus;
    try {
        const { error } = await window.supabaseClient.from("categories").update({ is_active: newStatus }).eq("id", id);
        if (error) throw error;
        
        const catIndex = state.categories.findIndex(c => c.id === id);
        if (catIndex !== -1) state.categories[catIndex].is_active = newStatus;
        
        utils.showToast(newStatus ? "Đã BẬT danh mục" : "Đã ẨN danh mục", "success");
        renderSummary(); 
        applySearchAndFilter(); 
    } catch (error) {
        utils.showToast("Lỗi cập nhật trạng thái", "error");
        applySearchAndFilter(); // Đảo nút lại như cũ
    }
};

// ========================================================
// 5. THÊM, SỬA, XÓA DANH MỤC
// ========================================================
function openCategoryModal() {
    state.editingId = null;
    DOM.modalTitle.textContent = "Thêm danh mục mới";
    DOM.form.reset();
    DOM.id.value = "";
    DOM.isActive.checked = true; // Bật mặc định
    
    DOM.modal.classList.remove("hidden");
    DOM.modal.classList.add("flex");
    setTimeout(() => DOM.name.focus(), 100);
}

function closeCategoryModal() {
    DOM.modal.classList.add("hidden");
    DOM.modal.classList.remove("flex");
    DOM.form.reset();
    state.editingId = null;
}

window.editCategory = function(id) {
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;

    state.editingId = cat.id;
    DOM.modalTitle.textContent = "Sửa danh mục";
    DOM.id.value = cat.id;
    DOM.name.value = cat.name;
    DOM.slug.value = cat.slug;
    DOM.description.value = cat.description || "";
    DOM.isActive.checked = cat.is_active !== false;
    DOM.metaTitle.value = cat.meta_title || "";
    DOM.metaDescription.value = cat.meta_description || "";

    DOM.modal.classList.remove("hidden");
    DOM.modal.classList.add("flex");
    setTimeout(() => DOM.name.focus(), 100);
};

window.deleteCategory = async function(id) {
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;
    if (!confirm(`Bạn có chắc muốn XÓA danh mục "${cat.name}"? Dữ liệu không thể khôi phục.`)) return;

    try {
        const { error } = await window.supabaseClient.from("categories").delete().eq("id", id);
        if (error) throw error;
        
        utils.showToast("Đã xóa danh mục.", "success");
        
        // Lùi 1 trang nếu xóa bản ghi cuối cùng của trang
        const totalPages = Math.ceil((state.filteredCategories.length - 1) / state.itemsPerPage);
        if (state.currentPage > totalPages && totalPages > 0) state.currentPage = totalPages;
        
        await loadCategories();
    } catch (error) {
        if (error.code === "23503") utils.showToast("Không thể xóa do đang có chứa sản phẩm.", "warning");
        else utils.showToast(`Lỗi: ${error.message}`, "error");
    }
};

async function saveCategory() {
    if (state.isSaving) return;

    const name = DOM.name.value.trim();
    const slug = DOM.slug.value.trim();
    if (!name || !slug) { utils.showToast("Vui lòng điền đủ Tên và Slug.", "warning"); return; }

    state.isSaving = true;
    DOM.btnSave.disabled = true;
    DOM.btnSave.textContent = "Đang lưu...";

    const payload = {
        name: name,
        slug: slug,
        description: DOM.description.value.trim() || null,
        is_active: DOM.isActive.checked,
        meta_title: DOM.metaTitle.value.trim() || null,
        meta_description: DOM.metaDescription.value.trim() || null
    };

    try {
        if (state.editingId) {
            const { error } = await window.supabaseClient.from("categories").update(payload).eq("id", state.editingId);
            if (error) throw error;
            utils.showToast("Cập nhật thành công!", "success");
        } else {
            const { error } = await window.supabaseClient.from("categories").insert(payload);
            if (error) throw error;
            utils.showToast("Đã thêm danh mục mới!", "success");
        }
        closeCategoryModal();
        await loadCategories();
    } catch (error) {
        if (error.code === "23505") utils.showToast("Tên danh mục hoặc Slug đã bị trùng.", "error");
        else utils.showToast(`Lỗi lưu dữ liệu: ${error.message}`, "error");
    } finally {
        state.isSaving = false;
        DOM.btnSave.disabled = false;
        DOM.btnSave.textContent = "Lưu danh mục";
    }
}

// ========================================================
// 6. AUTO GENERATE SLUG
// ========================================================
function generateSlug(str) {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

DOM.name?.addEventListener("input", function() {
    if (!state.editingId) DOM.slug.value = generateSlug(this.value);
});

// ========================================================
// 7. SỰ KIỆN KÍCH HOẠT
// ========================================================
DOM.btnAdd?.addEventListener("click", openCategoryModal);
DOM.btnClose?.addEventListener("click", closeCategoryModal);
DOM.btnCancel?.addEventListener("click", closeCategoryModal);
DOM.form?.addEventListener("submit", e => { e.preventDefault(); saveCategory(); });

let searchTimer;
DOM.search?.addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(applySearchAndFilter, 300); });
DOM.filterStatus?.addEventListener("change", (e) => { state.filterStatus = e.target.value; applySearchAndFilter(); });

document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
});