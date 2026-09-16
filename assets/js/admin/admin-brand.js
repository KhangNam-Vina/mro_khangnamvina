// ========================================================
// FILE: assets/js/admin/admin-brand.js
// QUẢN LÝ THƯƠNG HIỆU (ĐÃ TÍCH HỢP ẨN/HIỆN + PHÂN TRANG)
// ========================================================

const state = {
    brands: [],
    filteredBrands: [],
    editingId: null,
    isLoading: false,
    isSaving: false,
    currentPage: 1,
    currentSort: "oldest", 
    itemsPerPage: 15
};

const DOM = {
    toastContainer: document.getElementById("toastContainer"),
    sidebar: document.getElementById("adminSidebar"),
    sidebarBackdrop: document.getElementById("sidebarBackdrop"),
    search: document.getElementById("searchBrand"),
    tableWrapper: document.getElementById("tableWrapper"),
    tableBody: document.getElementById("brandTableBody"),
    pagination: document.getElementById("paginationContainer"),
    loadingState: document.getElementById("loadingState"),
    emptyState: document.getElementById("emptyState"),
    emptyMessage: document.getElementById("emptyMessage"),
    brandCount: document.getElementById("brandCount"),
    modal: document.getElementById("brandModal"),
    modalTitle: document.getElementById("modalTitle"),
    form: document.getElementById("brandForm"),
    brandId: document.getElementById("brandId"),
    brandName: document.getElementById("brandName"),
    brandStatus: document.getElementById("brandStatus"), // Thêm field trạng thái
    sort: document.getElementById("sortBrand"),
    btnSave: document.getElementById("btnSaveBrand")
};

const utils = {
    escapeHTML(value) {
        if (value === null || value === undefined) return "";
        return String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
    },
    showToast(message, type = "success") {
        if (!DOM.toastContainer) return;
        const config = { success: { bg: "bg-green-600", icon: "✓" }, warning: { bg: "bg-kn-orange", icon: "!" }, error: { bg: "bg-red-600", icon: "×" } };
        const style = config[type] || config.success;
        const toast = document.createElement("div");
        toast.className = `pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-bold text-white ${style.bg} opacity-0 translate-y-2 transition-all duration-300 z-[100]`;
        toast.innerHTML = `<span class="font-black text-base">${style.icon}</span><span>${utils.escapeHTML(message)}</span>`;
        DOM.toastContainer.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove("opacity-0", "translate-y-2"));
        setTimeout(() => { toast.classList.add("opacity-0", "translate-y-2"); setTimeout(() => toast.remove(), 300); }, 3500);
    },
    setLoading(loading) {
        state.isLoading = loading;
        DOM.loadingState?.classList.toggle("hidden", !loading);
        if (loading) { DOM.tableWrapper?.classList.add("hidden"); DOM.pagination?.classList.add("hidden"); DOM.emptyState?.classList.add("hidden"); }
    },
    setSaveLoading(loading) {
        if (!DOM.btnSave) return;
        DOM.btnSave.disabled = loading; DOM.btnSave.classList.toggle("opacity-70", loading); DOM.btnSave.classList.toggle("cursor-not-allowed", loading);
        DOM.btnSave.textContent = loading ? "Đang lưu..." : "Lưu thương hiệu";
    }
};

window.toggleSidebar = function () {
    if (!DOM.sidebar || !DOM.sidebarBackdrop) return;
    const closed = DOM.sidebar.classList.contains("-translate-x-full");
    DOM.sidebar.classList.toggle("-translate-x-full", !closed);
    DOM.sidebarBackdrop.classList.toggle("hidden", !closed);
};

// LOAD BRANDS TỪ SUPABASE
async function loadBrands() {
    utils.setLoading(true);
    try {
        if (!window.supabaseClient) throw new Error("Supabase Client chưa được khởi tạo.");

        // Lấy thêm cột is_active
        const { data, error } = await window.supabaseClient
            .from("brands")
            .select("id, name, is_active")
            .order("id", { ascending: true });

        if (error) throw error;
        state.brands = data || [];
        applySearch();
    } catch (error) {
        utils.showToast(`Lỗi: ${error.message}`, "error");
        state.brands = []; state.filteredBrands = []; renderTable();
    } finally {
        utils.setLoading(false);
    }
}

function applySearch() {
    const keyword = DOM.search?.value.trim().toLowerCase() || "";
    let result = [...state.brands];

    if (keyword) result = result.filter(brand => brand.name.toLowerCase().includes(keyword));

    if (state.currentSort === "az") result.sort((a, b) => a.name.localeCompare(b.name));
    else if (state.currentSort === "za") result.sort((a, b) => b.name.localeCompare(a.name));
    else if (state.currentSort === "newest") result.sort((a, b) => b.id - a.id);
    else result.sort((a, b) => a.id - b.id);
    
    state.filteredBrands = result; state.currentPage = 1; renderTable();
}

function renderTable() {
    if (!DOM.tableBody) return;
    DOM.tableBody.innerHTML = "";

    const total = state.filteredBrands.length;
    if (DOM.brandCount) DOM.brandCount.textContent = `${state.brands.length} thương hiệu`;

    if (total === 0) {
        DOM.tableWrapper?.classList.add("hidden"); DOM.pagination?.classList.add("hidden"); DOM.emptyState?.classList.remove("hidden");
        if (DOM.emptyMessage) DOM.emptyMessage.textContent = state.brands.length === 0 ? "Hãy thêm thương hiệu đầu tiên." : "Không tìm thấy thương hiệu.";
        return;
    }

    DOM.emptyState?.classList.add("hidden"); DOM.tableWrapper?.classList.remove("hidden"); DOM.pagination?.classList.remove("hidden");

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const paginatedData = state.filteredBrands.slice(startIndex, endIndex);

    let html = '';
    paginatedData.forEach((brand, index) => {
        const stt = startIndex + index + 1;
        const isChecked = brand.is_active !== false ? "checked" : "";

        html += `
            <tr class="hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
                <td class="px-5 py-4 text-sm font-bold text-gray-600 text-center">${stt}</td>
                <td class="px-5 py-4 text-sm font-mono text-gray-400 text-center">#${brand.id}</td>
                <td class="px-5 py-4 text-left"><span class="font-black text-gray-900 text-base">${utils.escapeHTML(brand.name)}</span></td>
                
                <!-- CỘT TRẠNG THÁI -->
                <td class="px-5 py-4 text-center">
                    <label class="relative inline-flex items-center cursor-pointer" title="${brand.is_active !== false ? 'Đang hiển thị' : 'Đang ẩn'}">
                        <input type="checkbox" onchange="toggleBrandStatus(${brand.id}, ${brand.is_active})" class="sr-only peer" ${isChecked}>
                        <div class="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                    </label>
                </td>

                <td class="px-5 py-4 text-right">
                    <div class="flex justify-end items-center gap-1">
                        <button type="button" onclick="editBrand(${brand.id})" class="px-3 py-2 rounded-lg text-xs font-bold text-kn-blue hover:bg-blue-50 transition">Sửa</button>
                        <button type="button" onclick="deleteBrand(${brand.id})" class="px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition">Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    });

    DOM.tableBody.innerHTML = html;
    renderPagination(total);
}

// BẤM GẠT CÔNG TẮC BÊN NGOÀI BẢNG
window.toggleBrandStatus = async function (id, currentStatus) {
    const newStatus = !currentStatus; // Đảo ngược trạng thái
    try {
        const { error } = await window.supabaseClient.from("brands").update({ is_active: newStatus }).eq("id", id);
        if (error) throw error;
        
        // Cập nhật state dưới local để khỏi phải load lại db
        const brandIndex = state.brands.findIndex(b => b.id === id);
        if (brandIndex !== -1) {
            state.brands[brandIndex].is_active = newStatus;
        }
        utils.showToast(newStatus ? "Đã BẬT thương hiệu" : "Đã ẨN thương hiệu", "success");
        applySearch(); // render lại bảng để gán lại event
    } catch (error) {
        utils.showToast("Lỗi cập nhật trạng thái", "error");
        applySearch(); // Trả lại cái nút như cũ
    }
};

function renderPagination(totalItems) {
    if (!DOM.pagination) return;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    if (totalPages <= 1) { DOM.pagination.innerHTML = ""; return; }

    let pagesHTML = ''; const maxVisible = 5;
    let startPage = Math.max(1, state.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);

    for (let page = startPage; page <= endPage; page++) {
        pagesHTML += `<button type="button" onclick="changePage(${page})" class="px-3 py-1.5 rounded-lg text-xs font-bold border ${page === state.currentPage ? 'bg-kn-blue text-white border-kn-blue' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}">${page}</button>`;
    }

    DOM.pagination.innerHTML = `
        <div class="text-xs text-gray-500 font-medium">Trang <strong>${state.currentPage}</strong> / ${totalPages}</div>
        <div class="flex items-center gap-1.5">
            <button type="button" onclick="changePage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg text-xs font-bold border ${state.currentPage === 1 ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}">← Trước</button>
            ${pagesHTML}
            <button type="button" onclick="changePage(${state.currentPage + 1})" ${state.currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg text-xs font-bold border ${state.currentPage === totalPages ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}">Sau →</button>
        </div>
    `;
}

window.changePage = function(page) {
    const totalPages = Math.ceil(state.filteredBrands.length / state.itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        state.currentPage = page; renderTable();
        document.querySelector('.admin-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.openBrandModal = function () {
    state.editingId = null;
    if (DOM.modalTitle) DOM.modalTitle.textContent = "Thêm thương hiệu";
    if (DOM.brandId) DOM.brandId.value = "";
    if (DOM.brandName) DOM.brandName.value = "";
    if (DOM.brandStatus) DOM.brandStatus.checked = true; // Mặc định là bật khi tạo mới
    
    DOM.modal?.classList.remove("hidden"); DOM.modal?.classList.add("flex");
    setTimeout(() => DOM.brandName?.focus(), 100);
};

window.closeBrandModal = function () {
    DOM.modal?.classList.add("hidden"); DOM.modal?.classList.remove("flex");
    state.editingId = null; if (DOM.form) DOM.form.reset();
};

window.editBrand = function (id) {
    const brand = state.brands.find(item => Number(item.id) === Number(id));
    if (!brand) { utils.showToast("Không tìm thấy thương hiệu.", "error"); return; }

    state.editingId = brand.id;
    if (DOM.modalTitle) DOM.modalTitle.textContent = "Chỉnh sửa thương hiệu";
    if (DOM.brandId) DOM.brandId.value = brand.id;
    if (DOM.brandName) DOM.brandName.value = brand.name;
    if (DOM.brandStatus) DOM.brandStatus.checked = brand.is_active !== false;

    DOM.modal?.classList.remove("hidden"); DOM.modal?.classList.add("flex");
    setTimeout(() => { DOM.brandName?.focus(); DOM.brandName?.select(); }, 100);
};

async function saveBrand() {
    if (state.isSaving) return;
    const name = DOM.brandName?.value.trim() || "";
    const isActive = DOM.brandStatus ? DOM.brandStatus.checked : true;

    if (!name) { utils.showToast("Vui lòng nhập tên thương hiệu.", "warning"); DOM.brandName?.focus(); return; }
    if (name.length > 100) { utils.showToast("Tên thương hiệu không vượt quá 100 ký tự.", "warning"); return; }

    state.isSaving = true; utils.setSaveLoading(true);

    try {
        if (!window.supabaseClient) throw new Error("Supabase Client chưa được khởi tạo.");

        if (state.editingId) {
            const { error } = await window.supabaseClient.from("brands").update({ name: name, is_active: isActive }).eq("id", state.editingId);
            if (error) throw error;
            utils.showToast("Cập nhật thương hiệu thành công!", "success");
        } else {
            const { error } = await window.supabaseClient.from("brands").insert({ name: name, is_active: isActive });
            if (error) throw error;
            utils.showToast("Thêm thương hiệu thành công!", "success");
        }

        closeBrandModal();
        await loadBrands();

    } catch (error) {
        if (error.code === "23505") utils.showToast("Tên thương hiệu đã tồn tại.", "warning");
        else utils.showToast(`Lỗi: ${error.message}`, "error");
    } finally {
        state.isSaving = false; utils.setSaveLoading(false);
    }
}

window.deleteBrand = async function (id) {
    const brand = state.brands.find(item => Number(item.id) === Number(id));
    if (!brand) return;
    if (!window.confirm(`Bạn có chắc muốn xóa thương hiệu "${brand.name}" không?`)) return;

    try {
        const { error } = await window.supabaseClient.from("brands").delete().eq("id", id);
        if (error) throw error;
        utils.showToast("Đã xóa thương hiệu.", "success");
        
        const totalPages = Math.ceil((state.filteredBrands.length - 1) / state.itemsPerPage);
        if (state.currentPage > totalPages && totalPages > 0) state.currentPage = totalPages;
        await loadBrands();

    } catch (error) {
        if (error.code === "23503") utils.showToast("Không thể xóa vì đang được sản phẩm sử dụng.", "warning");
        else utils.showToast(`Lỗi: ${error.message}`, "error");
    }
};

DOM.form?.addEventListener("submit", event => { event.preventDefault(); saveBrand(); });
let searchTimer;
DOM.search?.addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { applySearch(); }, 300); });
DOM.sort?.addEventListener("change", (e) => { state.currentSort = e.target.value; applySearch(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !DOM.modal?.classList.contains("hidden")) closeBrandModal(); });

document.addEventListener("DOMContentLoaded", async () => {
    try { await loadBrands(); } catch (error) { console.error("Lỗi khởi tạo Brand:", error); }
});