// ========================================================
// FILE: assets/js/admin/admin-brand.js
// QUẢN LÝ THƯƠNG HIỆU (ĐÃ TÍCH HỢP PHÂN TRANG & MÀU CHỮ ĐEN)
// ========================================================

/* ========================================================
   STATE
======================================================== */
const state = {
    brands: [],
    filteredBrands: [],
    editingId: null,
    isLoading: false,
    isSaving: false,
    // Thêm State cho phân trang
    currentPage: 1,
    currentSort: "newest",
    itemsPerPage: 15
};

/* ========================================================
   DOM
======================================================== */
const DOM = {
    toastContainer: document.getElementById("toastContainer"),
    sidebar: document.getElementById("adminSidebar"),
    sidebarBackdrop: document.getElementById("sidebarBackdrop"),
    search: document.getElementById("searchBrand"),
    tableWrapper: document.getElementById("tableWrapper"),
    tableBody: document.getElementById("brandTableBody"),
    pagination: document.getElementById("paginationContainer"), // Thêm DOM Phân trang
    loadingState: document.getElementById("loadingState"),
    emptyState: document.getElementById("emptyState"),
    emptyMessage: document.getElementById("emptyMessage"),
    brandCount: document.getElementById("brandCount"),
    modal: document.getElementById("brandModal"),
    modalTitle: document.getElementById("modalTitle"),
    form: document.getElementById("brandForm"),
    brandId: document.getElementById("brandId"),
    brandName: document.getElementById("brandName"),
    sort: document.getElementById("sortBrand"),
    btnSave: document.getElementById("btnSaveBrand")
};

/* ========================================================
   UTILS
======================================================== */
const utils = {
    escapeHTML(value) {
        if (value === null || value === undefined) return "";
        return String(value).replace(/[&<>'"]/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
        })[character]);
    },

    showToast(message, type = "success") {
        if (!DOM.toastContainer) return;
        const config = {
            success: { bg: "bg-green-600", icon: "✓" },
            warning: { bg: "bg-kn-orange", icon: "!" },
            error: { bg: "bg-red-600", icon: "×" }
        };
        const style = config[type] || config.success;
        const toast = document.createElement("div");
        
        toast.className = `pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-bold text-white ${style.bg} opacity-0 translate-y-2 transition-all duration-300 z-[100]`;
        toast.innerHTML = `<span class="font-black text-base">${style.icon}</span><span>${utils.escapeHTML(message)}</span>`;
        
        DOM.toastContainer.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove("opacity-0", "translate-y-2"));
        
        setTimeout(() => {
            toast.classList.add("opacity-0", "translate-y-2");
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    setLoading(loading) {
        state.isLoading = loading;
        DOM.loadingState?.classList.toggle("hidden", !loading);
        if (loading) {
            DOM.tableWrapper?.classList.add("hidden");
            DOM.pagination?.classList.add("hidden");
            DOM.emptyState?.classList.add("hidden");
        }
    },

    setSaveLoading(loading) {
        if (!DOM.btnSave) return;
        DOM.btnSave.disabled = loading;
        DOM.btnSave.classList.toggle("opacity-70", loading);
        DOM.btnSave.classList.toggle("cursor-not-allowed", loading);
        DOM.btnSave.textContent = loading ? "Đang lưu..." : "Lưu thương hiệu";
    }
};

/* ========================================================
   MOBILE SIDEBAR
======================================================== */
window.toggleSidebar = function () {
    if (!DOM.sidebar || !DOM.sidebarBackdrop) return;
    const closed = DOM.sidebar.classList.contains("-translate-x-full");
    DOM.sidebar.classList.toggle("-translate-x-full", !closed);
    DOM.sidebarBackdrop.classList.toggle("hidden", !closed);
};

/* ========================================================
   LOAD BRANDS
======================================================== */
async function loadBrands() {
    utils.setLoading(true);
    try {
        if (!window.supabaseClient) throw new Error("Supabase Client chưa được khởi tạo.");

        const { data, error } = await window.supabaseClient
            .from("brands")
            .select("id, name")
            .order("id", { ascending: false }); // Xếp mới nhất lên đầu

        if (error) throw error;

        state.brands = data || [];
        applySearch();

    } catch (error) {
        console.error("Lỗi tải brands:", error);
        utils.showToast(`Không thể tải thương hiệu: ${error.message}`, "error");
        state.brands = [];
        state.filteredBrands = [];
        renderTable();
    } finally {
        utils.setLoading(false);
    }
}

/* ========================================================
   SEARCH & SORT (ĐÃ NÂNG CẤP)
======================================================== */
function applySearch() {
    const keyword = DOM.search?.value.trim().toLowerCase() || "";
    let result = [...state.brands];

    // 1. Lọc theo từ khóa
    if (keyword) {
        result = result.filter(brand => brand.name.toLowerCase().includes(keyword));
    }

    // 2. Sắp xếp
    if (state.currentSort === "az") {
        result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (state.currentSort === "za") {
        result.sort((a, b) => b.name.localeCompare(a.name));
    } else {
        // Mới nhất (Sắp xếp theo ID giảm dần)
        result.sort((a, b) => b.id - a.id);
    }
    
    state.filteredBrands = result;
    state.currentPage = 1; // Reset về trang 1
    renderTable();
}

/* ========================================================
   RENDER BẢNG & PHÂN TRANG
======================================================== */
function renderTable() {
    if (!DOM.tableBody) return;
    DOM.tableBody.innerHTML = "";

    const total = state.filteredBrands.length;
    if (DOM.brandCount) DOM.brandCount.textContent = `${state.brands.length} thương hiệu`;

    if (total === 0) {
        DOM.tableWrapper?.classList.add("hidden");
        DOM.pagination?.classList.add("hidden");
        DOM.emptyState?.classList.remove("hidden");
        if (DOM.emptyMessage) {
            DOM.emptyMessage.textContent = state.brands.length === 0 
                ? "Hãy thêm thương hiệu đầu tiên." 
                : "Không tìm thấy thương hiệu phù hợp.";
        }
        return;
    }

    DOM.emptyState?.classList.add("hidden");
    DOM.tableWrapper?.classList.remove("hidden");
    DOM.pagination?.classList.remove("hidden");

    // Lọc dữ liệu theo trang hiện tại
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const paginatedData = state.filteredBrands.slice(startIndex, endIndex);

    let html = '';
    paginatedData.forEach(brand => {
        html += `
            <tr class="hover:bg-gray-50 transition">
                <!-- CỘT ID -->
                <td class="px-5 py-4 text-sm font-mono text-gray-400 w-24">
                    #${brand.id}
                </td>
                
                <!-- CỘT TÊN (Tự động bung rộng) -->
                <td class="px-5 py-4">
                    <span class="font-black text-black text-base">
                        ${utils.escapeHTML(brand.name)}
                    </span>
                </td>

                <!-- CỘT THAO TÁC (Nằm sát lề phải) -->
                <td class="px-5 py-4 text-right w-40">
                    <!-- Trả lại justify-end để 2 nút bấm nằm sát góc phải -->
                    <div class="flex justify-end items-center gap-2">
                        <button type="button" onclick="editBrand(${brand.id})" class="px-3 py-2 rounded-lg text-xs font-bold text-kn-blue hover:bg-blue-50 transition">Sửa</button>
                        <button type="button" onclick="deleteBrand(${brand.id})" class="px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition">Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    });

    DOM.tableBody.innerHTML = html;
    
    // Gọi hàm tạo nút phân trang
    renderPagination(total);
}

function renderPagination(totalItems) {
    if (!DOM.pagination) return;
    
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    
    if (totalPages <= 1) {
        DOM.pagination.innerHTML = "";
        return;
    }

    let pagesHTML = '';
    const maxVisible = 5;
    let startPage = Math.max(1, state.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
        pagesHTML += `
            <button type="button" onclick="changePage(${page})" class="px-3 py-1.5 rounded-lg text-xs font-bold border ${page === state.currentPage ? 'bg-kn-blue text-white border-kn-blue' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}">
                ${page}
            </button>
        `;
    }

    DOM.pagination.innerHTML = `
        <div class="text-xs text-gray-500 font-medium">
            Trang <strong>${state.currentPage}</strong> / ${totalPages}
        </div>
        <div class="flex items-center gap-1.5">
            <button type="button" onclick="changePage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg text-xs font-bold border ${state.currentPage === 1 ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}">
                ← Trước
            </button>
            ${pagesHTML}
            <button type="button" onclick="changePage(${state.currentPage + 1})" ${state.currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg text-xs font-bold border ${state.currentPage === totalPages ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}">
                Sau →
            </button>
        </div>
    `;
}

window.changePage = function(page) {
    const totalPages = Math.ceil(state.filteredBrands.length / state.itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        state.currentPage = page;
        renderTable();
        // Cuộn lên đầu bảng mượt mà
        document.querySelector('.admin-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

/* ========================================================
   OPEN/CLOSE MODAL
======================================================== */
window.openBrandModal = function () {
    state.editingId = null;
    if (DOM.modalTitle) DOM.modalTitle.textContent = "Thêm thương hiệu";
    if (DOM.brandId) DOM.brandId.value = "";
    if (DOM.brandName) DOM.brandName.value = "";
    
    DOM.modal?.classList.remove("hidden");
    DOM.modal?.classList.add("flex");
    setTimeout(() => DOM.brandName?.focus(), 100);
};

window.closeBrandModal = function () {
    DOM.modal?.classList.add("hidden");
    DOM.modal?.classList.remove("flex");
    state.editingId = null;
    if (DOM.form) DOM.form.reset();
};

/* ========================================================
   EDIT & SAVE
======================================================== */
window.editBrand = function (id) {
    const brand = state.brands.find(item => Number(item.id) === Number(id));
    if (!brand) {
        utils.showToast("Không tìm thấy thương hiệu.", "error");
        return;
    }

    state.editingId = brand.id;
    if (DOM.modalTitle) DOM.modalTitle.textContent = "Chỉnh sửa thương hiệu";
    if (DOM.brandId) DOM.brandId.value = brand.id;
    if (DOM.brandName) DOM.brandName.value = brand.name;

    DOM.modal?.classList.remove("hidden");
    DOM.modal?.classList.add("flex");
    setTimeout(() => { DOM.brandName?.focus(); DOM.brandName?.select(); }, 100);
};

async function saveBrand() {
    if (state.isSaving) return;

    const name = DOM.brandName?.value.trim() || "";
    if (!name) {
        utils.showToast("Vui lòng nhập tên thương hiệu.", "warning");
        DOM.brandName?.focus();
        return;
    }

    if (name.length > 100) {
        utils.showToast("Tên thương hiệu không vượt quá 100 ký tự.", "warning");
        return;
    }

    state.isSaving = true;
    utils.setSaveLoading(true);

    try {
        if (!window.supabaseClient) throw new Error("Supabase Client chưa được khởi tạo.");

        if (state.editingId) {
            const { error } = await window.supabaseClient
                .from("brands")
                .update({ name: name })
                .eq("id", state.editingId);

            if (error) throw error;
            utils.showToast("Cập nhật thương hiệu thành công!", "success");
        } else {
            const { error } = await window.supabaseClient
                .from("brands")
                .insert({ name: name });

            if (error) throw error;
            utils.showToast("Thêm thương hiệu thành công!", "success");
        }

        closeBrandModal();
        await loadBrands();

    } catch (error) {
        console.error("Lỗi lưu brand:", error);
        if (error.code === "23505") {
            utils.showToast("Tên thương hiệu đã tồn tại.", "warning");
        } else {
            utils.showToast(`Lỗi: ${error.message}`, "error");
        }
    } finally {
        state.isSaving = false;
        utils.setSaveLoading(false);
    }
}

/* ========================================================
   DELETE BRAND
======================================================== */
window.deleteBrand = async function (id) {
    const brand = state.brands.find(item => Number(item.id) === Number(id));
    if (!brand) return;

    const confirmed = window.confirm(`Bạn có chắc muốn xóa thương hiệu "${brand.name}" không?`);
    if (!confirmed) return;

    try {
        const { error } = await window.supabaseClient.from("brands").delete().eq("id", id);
        if (error) throw error;
        
        utils.showToast("Đã xóa thương hiệu.", "success");
        
        // Nếu xóa phần tử cuối cùng của trang, lùi lại 1 trang
        const totalPages = Math.ceil((state.filteredBrands.length - 1) / state.itemsPerPage);
        if (state.currentPage > totalPages && totalPages > 0) {
            state.currentPage = totalPages;
        }

        await loadBrands();

    } catch (error) {
        console.error("Lỗi xóa brand:", error);
        if (error.code === "23503") {
            utils.showToast("Không thể xóa vì đang được sản phẩm sử dụng.", "warning");
        } else {
            utils.showToast(`Lỗi: ${error.message}`, "error");
        }
    }
};

/* ========================================================
   EVENTS & INIT
======================================================== */
DOM.form?.addEventListener("submit", event => {
    event.preventDefault();
    saveBrand();
});

let searchTimer;
DOM.search?.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { applySearch(); }, 300); // Thêm delay chống giật lag
});

DOM.sort?.addEventListener("change", (e) => {
    state.currentSort = e.target.value;
    applySearch();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !DOM.modal?.classList.contains("hidden")) {
        closeBrandModal();
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadBrands();
    } catch (error) {
        console.error("Lỗi khởi tạo Brand:", error);
    }
});