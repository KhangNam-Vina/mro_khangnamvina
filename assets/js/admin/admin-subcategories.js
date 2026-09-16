/* =========================================================
   ADMIN SUBCATEGORIES
   QUẢN LÝ NHÓM HÀNG (CÓ STT + CÔNG TẮC ẨN/HIỆN)
========================================================= */

const state = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    searchQuery: "",
    filterParentId: "all",
    currentItems: [],
    allParents: []
};

const DOM = {
    tableBody: document.getElementById("tableBody"),
    pagination: document.getElementById("paginationContainer"),
    search: document.getElementById("searchInput"),
    parentFilter: document.getElementById("filterParentSelect"),
    parentSelect: document.getElementById("parentCategory"),
    modal: document.getElementById("formModal"),
    modalTitle: document.getElementById("modalTitle"),
    form: document.getElementById("dataForm"),
    id: document.getElementById("subId"),
    name: document.getElementById("subName"),
    slug: document.getElementById("subSlug"),
    isActive: document.getElementById("subIsActive"), // Thêm trạng thái trong modal nếu có
    metaTitle: document.getElementById("subMetaTitle"),
    metaDesc: document.getElementById("subMetaDesc"),
    submit: document.getElementById("btnSubmit"),
    add: document.getElementById("btnAddSubcategory"),
    close: document.getElementById("btnCloseModal"),
    cancel: document.getElementById("btnCancelModal"),
    total: document.getElementById("subcatTotal"),
    linked: document.getElementById("subcatLinked"),
    broken: document.getElementById("subcatBroken"),
    toast: document.getElementById("toastContainer")
};

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[&<>'"]/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);
}

function generateSlug(text) {
    return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

async function loadParents() {
    try {
        const { data, error } = await window.supabaseClient.from("categories").select("id, name").order("name", { ascending: true });
        if (error) throw error;
        state.allParents = data || [];
        renderParentDropdowns();
    } catch (error) {
        console.error("Lỗi tải danh mục gốc:", error);
        showToast("Không thể tải danh mục gốc.", "error");
    }
}

function renderParentDropdowns() {
    const options = state.allParents.map(parent => `<option value="${escapeHTML(parent.id)}">${escapeHTML(parent.name)}</option>`).join("");
    if (DOM.parentSelect) DOM.parentSelect.innerHTML = `<option value="">-- Chọn danh mục gốc --</option>${options}`;
    if (DOM.parentFilter) DOM.parentFilter.innerHTML = `<option value="all">Tất cả danh mục gốc</option>${options}`;
}

async function loadData() {
    if (!DOM.tableBody) return;
    renderLoading();

    try {
        const from = (state.currentPage - 1) * state.itemsPerPage;
        const to = from + state.itemsPerPage - 1;

        let query = window.supabaseClient.from("sub_categories").select(`*, categories ( id, name )`, { count: "exact" });

        if (state.searchQuery) {
            const keyword = state.searchQuery.replace(/[%_,]/g, "");
            if (keyword) query = query.or(`name.ilike.%${keyword}%,slug.ilike.%${keyword}%`);
        }

        if (state.filterParentId !== "all") query = query.eq("category_id", state.filterParentId);

        const { data, count, error } = await query.order("id", { ascending: true }).range(from, to);
        if (error) throw error;

        state.currentItems = data || [];
        state.totalItems = count || 0;

        updateStats();
        renderTable(state.currentItems);
        renderPagination();

    } catch (error) {
        console.error("Lỗi tải nhóm hàng:", error);
        DOM.tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-12 text-red-500 font-bold">Không thể tải dữ liệu: ${escapeHTML(error.message)}</td></tr>`;
    }
}

function renderLoading() {
    DOM.tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-12 text-gray-400"><div class="inline-block w-6 h-6 border-2 border-kn-blue border-t-transparent rounded-full animate-spin"></div><div class="mt-2">Đang tải dữ liệu...</div></td></tr>`;
}

function updateStats() {
    const linked = state.currentItems.filter(item => item.categories && item.categories.id).length;
    const broken = state.currentItems.filter(item => !item.categories).length;

    if (DOM.total) DOM.total.textContent = state.totalItems;
    if (DOM.linked) DOM.linked.textContent = linked;
    if (DOM.broken) DOM.broken.textContent = broken;
}

function renderTable(items) {
    if (!items.length) {
        DOM.tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-14 text-gray-400"><div class="font-bold text-gray-500">Không tìm thấy nhóm hàng</div></td></tr>`;
        return;
    }

    DOM.tableBody.innerHTML = items.map((item, index) => {
        const stt = (state.currentPage - 1) * state.itemsPerPage + index + 1;
        const parent = item.categories;
        const isChecked = item.is_active !== false ? "checked" : "";

        const parentHTML = parent 
            ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs">${escapeHTML(parent.name)}</span>`
            : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-100 text-red-600 font-bold text-xs">Mất liên kết</span>`;

        return `
            <tr class="group hover:bg-blue-50/40 transition-colors">
                <td class="px-4 py-4 text-center text-xs font-bold text-gray-600 w-16 border-r border-gray-50">${stt}</td>
                <td class="px-4 py-4 text-center text-xs font-mono font-bold text-gray-400 w-20">#${item.id}</td>
                <td class="px-4 py-4 w-[25%]" ><div class="font-bold text-gray-900">${escapeHTML(item.name)}</div></td>
                <td class="px-4 py-4 w-[22%]">${parentHTML}</td>
                <td class="px-4 py-4 w-[22%]"><span class="inline-block px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-xs font-mono text-gray-500">${escapeHTML(item.slug || "--")}</span></td>
                
                <!-- CÔNG TẮC GẠT TRẠNG THÁI -->
                <td class="px-4 py-4 text-center w-32">
                    <label class="relative inline-flex items-center cursor-pointer" title="${item.is_active !== false ? 'Đang hiển thị' : 'Đang ẩn'}">
                        <input type="checkbox" onchange="toggleSubCategoryStatus(${item.id}, ${item.is_active})" class="sr-only peer" ${isChecked}>
                        <div class="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                    </label>
                </td>

                <td class="px-4 py-4 text-right w-36">
                    <div class="flex justify-end items-center gap-1">
                        <button type="button" data-action="edit" data-id="${item.id}" class="px-3 py-2 rounded-lg text-xs font-bold text-kn-blue hover:bg-blue-50 transition">Sửa</button>
                        <button type="button" data-action="delete" data-id="${item.id}" class="px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition">Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// HÀM XỬ LÝ GẠT CÔNG TẮC NGOÀI BẢNG
window.toggleSubCategoryStatus = async function (id, currentStatus) {
    const newStatus = !currentStatus;
    try {
        const { error } = await window.supabaseClient.from("sub_categories").update({ is_active: newStatus }).eq("id", id);
        if (error) throw error;

        const idx = state.currentItems.findIndex(i => Number(i.id) === Number(id));
        if (idx !== -1) state.currentItems[idx].is_active = newStatus;

        showToast(newStatus ? "Đã BẬT nhóm hàng" : "Đã ẨN nhóm hàng", "success");
        renderTable(state.currentItems);
    } catch (error) {
        showToast("Lỗi cập nhật trạng thái", "error");
        renderTable(state.currentItems);
    }
};

function renderPagination() {
    if (!DOM.pagination) return;
    const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
    if (totalPages <= 1) {
        DOM.pagination.innerHTML = `<span class="text-xs text-gray-500 font-bold">${state.totalItems} nhóm hàng</span>`;
        return;
    }
    const startItem = ((state.currentPage - 1) * state.itemsPerPage) + 1;
    const endItem = Math.min(state.currentPage * state.itemsPerPage, state.totalItems);

    DOM.pagination.innerHTML = `
        <div class="text-xs text-gray-500 font-bold">Hiển thị <strong class="text-gray-700">${startItem}-${endItem}</strong> / <strong class="text-gray-700">${state.totalItems}</strong></div>
        <div class="flex items-center gap-1">
            <button type="button" data-page-action="prev" ${state.currentPage === 1 ? "disabled" : ""} class="px-3 py-1.5 rounded-lg text-xs font-bold border ${state.currentPage === 1 ? "text-gray-300 border-gray-100 cursor-not-allowed" : "text-gray-600 border-gray-200 hover:bg-gray-50"}">← Trước</button>
            <button type="button" data-page-action="next" ${state.currentPage === totalPages ? "disabled" : ""} class="px-3 py-1.5 rounded-lg text-xs font-bold border ${state.currentPage === totalPages ? "text-gray-300 border-gray-100 cursor-not-allowed" : "text-gray-600 border-gray-200 hover:bg-gray-50"}">Sau →</button>
        </div>
    `;
}

function openModal(item = null) {
    if (!DOM.modal) return;
    if (item) {
        DOM.modalTitle.textContent = "Chỉnh sửa nhóm hàng";
        DOM.id.value = item.id;
        DOM.parentSelect.value = item.category_id || "";
        DOM.name.value = item.name || "";
        DOM.slug.value = item.slug || "";
        if(DOM.isActive) DOM.isActive.checked = item.is_active !== false;
        DOM.metaTitle.value = item.meta_title || "";
        DOM.metaDesc.value = item.meta_description || "";
    } else {
        DOM.form.reset();
        DOM.id.value = "";
        DOM.modalTitle.textContent = "Thêm nhóm hàng";
        DOM.parentSelect.value = "";
        if(DOM.isActive) DOM.isActive.checked = true;
    }
    DOM.modal.classList.remove("hidden");
    DOM.modal.classList.add("flex");
}

function closeModal() {
    if (!DOM.modal) return;
    DOM.modal.classList.add("hidden");
    DOM.modal.classList.remove("flex");
}

function editItem(id) {
    const item = state.currentItems.find(current => Number(current.id) === Number(id));
    if (!item) { showToast("Không tìm thấy nhóm hàng.", "error"); return; }
    openModal(item);
}

async function saveItem(event) {
    event.preventDefault();
    const categoryId = DOM.parentSelect.value;
    const name = DOM.name.value.trim();
    const slug = DOM.slug.value.trim();

    if (!categoryId) { showToast("Vui lòng chọn danh mục gốc.", "error"); DOM.parentSelect.focus(); return; }
    if (!name) { showToast("Vui lòng nhập tên nhóm hàng.", "error"); DOM.name.focus(); return; }
    if (!slug) { showToast("Vui lòng nhập slug.", "error"); DOM.slug.focus(); return; }

    const payload = {
        category_id: categoryId,
        name,
        slug,
        is_active: DOM.isActive ? DOM.isActive.checked : true,
        meta_title: DOM.metaTitle.value.trim() || null,
        meta_description: DOM.metaDesc.value.trim() || null
    };

    const id = DOM.id.value;
    const originalText = DOM.submit.innerHTML;
    DOM.submit.disabled = true; DOM.submit.innerHTML = "Đang lưu...";

    try {
        if (id) {
            const { error } = await window.supabaseClient.from("sub_categories").update(payload).eq("id", id);
            if (error) throw error;
            showToast("Cập nhật nhóm hàng thành công.", "success");
        } else {
            const { error } = await window.supabaseClient.from("sub_categories").insert([payload]);
            if (error) throw error;
            state.currentPage = 1;
            showToast("Thêm nhóm hàng thành công.", "success");
        }
        closeModal();   
        await loadData();
    } catch (error) {
        showToast(`Không thể lưu nhóm hàng: ${error.message}`, "error");
    } finally {
        DOM.submit.disabled = false;
        DOM.submit.innerHTML = originalText;
    }
}

async function checkDependencies(subCategoryId) {
    const [familyResult, productResult] = await Promise.all([
        window.supabaseClient.from("families").select("id", { count: "exact", head: true }).eq("sub_category_id", subCategoryId),
        window.supabaseClient.from("products").select("id", { count: "exact", head: true }).eq("sub_category_id", subCategoryId)
    ]);
    if (familyResult.error) throw familyResult.error;
    return { families: familyResult.count || 0, products: productResult.error ? 0 : (productResult.count || 0) };
}

async function deleteItem(id) {
    const item = state.currentItems.find(current => Number(current.id) === Number(id));
    if (!item) { showToast("Không tìm thấy nhóm hàng.", "error"); return; }

    try {
        const dependencies = await checkDependencies(id);
        if (dependencies.families > 0 || dependencies.products > 0) {
            showToast(`Không thể xóa "${item.name}" vì đang có dữ liệu phụ thuộc.`, "error");
            return;
        }

        if (!window.confirm(`Bạn có chắc muốn xóa nhóm hàng "${item.name}"?`)) return;

        const { error } = await window.supabaseClient.from("sub_categories").delete().eq("id", id);
        if (error) {
            if (error.code === "23503") { showToast("Không thể xóa vì nhóm hàng đang được dữ liệu khác sử dụng.", "error"); return; }
            throw error;
        }

        if (state.currentItems.length === 1 && state.currentPage > 1) state.currentPage--;
        showToast("Đã xóa nhóm hàng.", "success");
        await loadData();
    } catch (error) {
        showToast(`Không thể xóa nhóm hàng: ${error.message}`, "error");
    }
}

function showToast(message, type = "success") {
    if (!DOM.toast) return;
    const toast = document.createElement("div");
    const success = type === "success";
    toast.className = `pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-bold text-white ${success ? "bg-gray-900" : "bg-red-600"} opacity-0 translate-y-2 transition-all duration-300`;
    toast.innerHTML = `<span>${escapeHTML(message)}</span>`;
    DOM.toast.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove("opacity-0", "translate-y-2"));
    setTimeout(() => { toast.classList.add("opacity-0", "translate-y-2"); setTimeout(() => toast.remove(), 300); }, 3500);
}

function bindEvents() {
    DOM.add?.addEventListener("click", () => openModal());
    DOM.close?.addEventListener("click", e => { e.preventDefault(); closeModal(); });
    DOM.cancel?.addEventListener("click", e => { e.preventDefault(); closeModal(); });
    
    let searchTimer;
    DOM.search?.addEventListener("input", e => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => { state.searchQuery = e.target.value.trim(); state.currentPage = 1; loadData(); }, 300);
    });

    DOM.parentFilter?.addEventListener("change", e => { state.filterParentId = e.target.value; state.currentPage = 1; loadData(); });
    DOM.form?.addEventListener("submit", saveItem);
    
    DOM.name?.addEventListener("input", e => { if (!DOM.id.value) DOM.slug.value = generateSlug(e.target.value); });
    DOM.slug?.addEventListener("blur", () => { DOM.slug.value = generateSlug(DOM.slug.value); });

    DOM.tableBody?.addEventListener("click", e => {
        const button = e.target.closest("button[data-action]");
        if (!button) return;
        if (button.dataset.action === "edit") editItem(button.dataset.id);
        if (button.dataset.action === "delete") deleteItem(button.dataset.id);
    });

    DOM.pagination?.addEventListener("click", e => {
        const pageButton = e.target.closest("button[data-page]");
        if (pageButton) {
            const page = Number(pageButton.dataset.page);
            if (page && page !== state.currentPage) { state.currentPage = page; loadData(); }
            return;
        }
        const actionButton = e.target.closest("button[data-page-action]");
        if (!actionButton) return;
        const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
        if (actionButton.dataset.pageAction === "prev" && state.currentPage > 1) { state.currentPage--; loadData(); }
        if (actionButton.dataset.pageAction === "next" && state.currentPage < totalPages) { state.currentPage++; loadData(); }
    });
}

window.openModal = openModal;
window.closeModal = closeModal;
window.editItem = editItem;
window.deleteItem = deleteItem;

document.addEventListener("DOMContentLoaded", async () => {
    bindEvents();
    await loadParents();
    await loadData();
});