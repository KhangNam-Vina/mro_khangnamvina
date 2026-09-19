/* =========================================================
   FILE: assets/js/admin/admin-blog.js
   QUẢN LÝ BLOG - ĐÃ ĐỒNG BỘ UI/UX VỚI SẢN PHẨM & ĐƠN HÀNG
========================================================= */

const state = {
    blogs: [],
    editingId: null,
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    searchQuery: "",
    categoryFilter: "",
    statusFilter: ""
};

const DOM = {
    listView: document.getElementById("blogListView"),
    formView: document.getElementById("blogFormView"),
    form: document.getElementById("blogForm"),
    formTitle: document.getElementById("formTitle"),
    title: document.getElementById("inTitle"),
    slug: document.getElementById("inSlug"),
    summary: document.getElementById("inSummary"),
    category: document.getElementById("inCategory"),
    thumbnail: document.getElementById("inThumbnail"),
    preview: document.getElementById("thumbnailPreview"),
    btnAdd: document.getElementById("btnAddBlog"),
    btnSave: document.getElementById("btnSaveBlog"),
    tbody: document.getElementById("blogTableBody"),
    pagination: document.getElementById("paginationContainer"),
    search: document.getElementById("searchBlogInput"),
    categoryFilter: document.getElementById("filterBlogCategory"),
    statusFilter: document.getElementById("filterBlogStatus"),
    toastContainer: document.getElementById("toastContainer")
};

/* =========================================================
   HELPERS
========================================================= */
const utils = {
    escapeHTML(value) {
        if (value === null || value === undefined) return "";
        return String(value).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]);
    },
    generateSlug(text) {
        return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
    },
    showToast(message, type = "success") {
        if (!DOM.toastContainer) return;
        const toast = document.createElement("div");
        const background = type === "success" ? "bg-green-500" : type === "warning" ? "bg-kn-orange" : "bg-red-600";
        const icon = type === "success" ? "✓" : type === "warning" ? "!" : "×";
        toast.className = `pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-bold text-white ${background} opacity-0 translate-y-2 transition-all duration-300`;
        toast.innerHTML = `<span>${icon}</span><span>${utils.escapeHTML(message)}</span>`;
        DOM.toastContainer.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove("opacity-0", "translate-y-2"));
        setTimeout(() => {
            toast.classList.add("opacity-0", "translate-y-2");
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },
    toggleButtonLoading(button, loading, text) {
        if (!button) return;
        button.disabled = loading;
        button.innerHTML = loading ? `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 align-middle"></span>${utils.escapeHTML(text)}` : utils.escapeHTML(text);
    }
};

/* =========================================================
   INIT & LOAD DATA
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    loadBlogs(1);
});

async function loadBlogs(page = 1) {
    state.currentPage = Math.max(1, page);
    renderLoading();

    const from = (state.currentPage - 1) * state.itemsPerPage;
    const to = from + state.itemsPerPage - 1;

    try {
        let query = window.supabaseClient.from("blogs").select("*", { count: "exact" });

        if (state.searchQuery) {
            const keyword = state.searchQuery.replace(/[%_,]/g, "");
            if (keyword) query = query.or(`title.ilike.%${keyword}%,slug.ilike.%${keyword}%,summary.ilike.%${keyword}%`);
        }

        if (state.categoryFilter) query = query.eq("category", state.categoryFilter);
        if (state.statusFilter === "active") query = query.eq("is_active", true);
        if (state.statusFilter === "inactive") query = query.eq("is_active", false);

        const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);

        if (error) throw error;

        state.blogs = data || [];
        state.totalItems = count || 0;

        renderTable();
        renderPagination();

    } catch (error) {
        console.error("Lỗi tải blog:", error);
        DOM.tbody.innerHTML = `<tr><td colspan="7" class="text-center py-12 text-red-500 font-bold">Không thể tải danh sách bài viết.<div class="text-xs font-normal mt-1">${utils.escapeHTML(error.message)}</div></td></tr>`;
    }
}

/* =========================================================
   RENDER
========================================================= */
function renderLoading() {
    if (!DOM.tbody) return;
    DOM.tbody.innerHTML = `<tr><td colspan="7" class="text-center py-14 text-gray-400"><div class="inline-block w-7 h-7 border-2 border-kn-blue border-t-transparent rounded-full animate-spin"></div><div class="mt-2 text-xs">Đang tải danh sách bài viết...</div></td></tr>`;
}

function renderTable() {
    if (!DOM.tbody) return;

    if (state.totalItems === 0 || state.blogs.length === 0) {
        DOM.tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-14 text-gray-400">
                    <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M9 13h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0Z"/></svg>
                    </div>
                    <div class="font-bold text-gray-500">Không tìm thấy bài viết</div>
                    <div class="text-xs mt-1">Thử thay đổi từ khóa hoặc bộ lọc.</div>
                </td>
            </tr>
        `;
        return;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;

    DOM.tbody.innerHTML = state.blogs.map((item, index) => {
        const active = item.is_active !== false;
        const isChecked = active ? "checked" : "";
        const category = item.category && item.category !== "ALL" ? item.category : "Chung";

        // Công tắc gạt trạng thái bên ngoài Bảng (Dùng this.checked)
        const statusHTML = `
            <label class="relative inline-flex items-center cursor-pointer" title="${active ? 'Đang hiển thị' : 'Đang ẩn'}">
                <input type="checkbox" onchange="toggleBlogStatus('${item.id}', this.checked)" class="sr-only peer" ${isChecked}>
                <div class="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
            </label>
        `;

        return `
            <tr class="group hover:bg-blue-50/40 transition-colors border-b border-gray-100">
                <td class="px-4 py-4 text-center text-xs font-mono font-bold text-gray-400 align-middle border-r border-gray-50 w-12">${from + index + 1}</td>
                <td class="px-4 py-4 align-middle w-24 text-center">
                    <div class="w-20 h-12 mx-auto rounded-lg border border-gray-200 bg-gray-100 overflow-hidden shadow-sm">
                        <img src="${utils.escapeHTML(item.thumbnail || "")}" alt="${utils.escapeHTML(item.title)}" class="w-full h-full object-cover" loading="lazy" data-thumbnail>
                    </div>
                </td>
                <td class="px-4 py-4 align-middle">
                    <div class="font-black text-gray-900 leading-5 line-clamp-1">${utils.escapeHTML(item.title)}</div>
                    <div class="mt-1 flex items-center gap-2 min-w-0">
                        <span class="text-[10px] bg-blue-50 text-kn-blue border border-blue-100 px-2 py-0.5 rounded font-black uppercase whitespace-nowrap">${utils.escapeHTML(category)}</span>
                        <span class="text-[10px] text-gray-400 font-mono truncate">/${utils.escapeHTML(item.slug)}</span>
                    </div>
                </td>
                <td class="px-4 py-4 text-center align-middle w-32">
                    ${statusHTML}
                </td>
                <td class="px-4 py-4 align-middle w-32 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button type="button" onclick="editBlog('${item.id}')" class="px-3 py-2 text-kn-blue hover:bg-blue-50 rounded-lg transition font-bold text-[11px] uppercase">Sửa</button>
                        <button type="button" onclick="deleteBlog('${item.id}')" class="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition font-bold text-[11px] uppercase">Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    bindThumbnailFallbacks();
}

window.toggleBlogStatus = async function (id, isChecked) {
    try {
        const { error } = await window.supabaseClient.from("blogs").update({ is_active: isChecked }).eq("id", id);
        if (error) throw error;

        const idx = state.blogs.findIndex(b => String(b.id) === String(id));
        if (idx !== -1) state.blogs[idx].is_active = isChecked;

        utils.showToast(isChecked ? "Đã BẬT bài viết" : "Đã ẨN bài viết", "success");
        renderTable();
    } catch (error) {
        utils.showToast("Lỗi cập nhật trạng thái", "error");
        renderTable(); 
    }
};

/* =========================================================
   THUMBNAIL FALLBACK
========================================================= */
function bindThumbnailFallbacks() {
    DOM.tbody?.querySelectorAll("img[data-thumbnail]").forEach(image => {
        image.addEventListener("error", () => { image.src = createFallbackImage(); }, { once: true });
    });
}

function createFallbackImage() {
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140" viewBox="0 0 240 140"><rect width="240" height="140" fill="#f3f4f6"/><text x="120" y="72" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#9ca3af">No Image</text></svg>`);
}

/* =========================================================
   PAGINATION
========================================================= */
function renderPagination() {
    if (!DOM.pagination) return;

    const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);

    if (totalPages <= 1) {
        DOM.pagination.innerHTML = `<span class="text-xs font-bold text-gray-500">Tổng cộng: ${state.totalItems} bài viết</span>`;
        return;
    }

    const startItem = (state.currentPage - 1) * state.itemsPerPage + 1;
    const endItem = Math.min(state.currentPage * state.itemsPerPage, state.totalItems);
    const pages = [];

    pages.push(1);
    if (state.currentPage > 3) pages.push("...");
    const start = Math.max(2, state.currentPage - 1);
    const end = Math.min(totalPages - 1, state.currentPage + 1);
    for (let page = start; page <= end; page++) pages.push(page);
    if (state.currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);

    DOM.pagination.innerHTML = `
        <div class="text-xs font-bold text-gray-500">Hiển thị <strong class="text-kn-blue">${startItem}-${endItem}</strong> / ${state.totalItems}</div>
        <div class="flex items-center gap-1">
            <button type="button" onclick="loadBlogs(${state.currentPage - 1})" ${state.currentPage === 1 ? "disabled" : ""} class="px-3 py-1.5 rounded-lg text-xs font-bold border ${state.currentPage === 1 ? "text-gray-300 border-gray-100 cursor-not-allowed" : "text-gray-600 border-gray-200 hover:bg-gray-50"}">← Trước</button>
            ${pages.map(page => page === "..." ? `<span class="px-2 text-gray-400 text-xs">...</span>` : `<button type="button" onclick="loadBlogs(${page})" class="min-w-8 px-2 py-1.5 rounded-lg text-xs font-bold border ${page === state.currentPage ? "bg-kn-blue text-white border-kn-blue" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}">${page}</button>`).join("")}
            <button type="button" onclick="loadBlogs(${state.currentPage + 1})" ${state.currentPage === totalPages ? "disabled" : ""} class="px-3 py-1.5 rounded-lg text-xs font-bold border ${state.currentPage === totalPages ? "text-gray-300 border-gray-100 cursor-not-allowed" : "text-gray-600 border-gray-200 hover:bg-gray-50"}">Sau →</button>
        </div>
    `;
}

/* =========================================================
   FORM ACTIONS
========================================================= */
window.showCreateBlogForm = function() {
    state.editingId = null;
    resetForm();
    DOM.formTitle.textContent = "Viết Bài Mới";
    DOM.btnSave.textContent = "Lưu Bài Viết";
    DOM.listView.classList.add("hidden");
    DOM.formView.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
    DOM.form?.reset();
    DOM.slug.value = "";
    DOM.category.value = "ALL";
    
    if (DOM.preview) {
        DOM.preview.src = "";
        DOM.preview.classList.add("hidden");
    }

    if (typeof CKEDITOR !== "undefined" && CKEDITOR.instances.inContent) {
        CKEDITOR.instances.inContent.setData("");
    }
}

window.cancelEdit = function() {
    state.editingId = null;
    resetForm();
    DOM.formView.classList.add("hidden");
    DOM.listView.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

window.saveBlog = async function(event) {
    if (event) event.preventDefault();

    const title = DOM.title.value.trim();
    const slug = DOM.slug.value.trim();
    const thumbnail = DOM.thumbnail.value.trim();
    const summary = DOM.summary.value.trim();
    const category = DOM.category.value;

    let content = "";
    if (typeof CKEDITOR !== "undefined" && CKEDITOR.instances.inContent) {
        content = CKEDITOR.instances.inContent.getData().trim();
    }

    if (!title || !slug || !thumbnail || !summary || !content) {
        utils.showToast("Vui lòng nhập đủ Tiêu đề, Tóm tắt, Slug, Thumbnail và Nội dung!", "warning");
        return;
    }

    utils.toggleButtonLoading(DOM.btnSave, true, "Đang lưu...");

    try {
        let checkQuery = window.supabaseClient.from("blogs").select("id").eq("slug", slug);
        if (state.editingId) checkQuery = checkQuery.neq("id", state.editingId);
        
        const { data: existing, error: checkError } = await checkQuery;
        if (checkError) throw checkError;
        if (existing && existing.length > 0) {
            utils.showToast("Đường dẫn (Slug) đã tồn tại!", "warning");
            DOM.slug.focus();
            return;
        }

        const payload = { title, slug, thumbnail, summary, category, content };

        if (state.editingId) {
            const { error } = await window.supabaseClient.from("blogs").update(payload).eq("id", state.editingId);
            if (error) throw error;
            utils.showToast("Cập nhật bài viết thành công!", "success");
        } else {
            payload.is_active = true; 
            const { error } = await window.supabaseClient.from("blogs").insert([payload]);
            if (error) throw error;
            utils.showToast("Thêm bài viết mới thành công!", "success");
        }

        const nextPage = state.currentPage;
        cancelEdit();
        await loadBlogs(nextPage);

    } catch (error) {
        console.error("Lỗi lưu blog:", error);
        utils.showToast(`Lỗi: ${error.message}`, "error");
    } finally {
        utils.toggleButtonLoading(DOM.btnSave, false, state.editingId ? "Cập Nhật Bài Viết" : "Lưu Bài Viết");
    }
}

window.editBlog = async function(id) {
    try {
        const { data: item, error } = await window.supabaseClient.from("blogs").select("*").eq("id", id).single();
        if (error || !item) throw new Error("Không tìm thấy dữ liệu bài viết.");

        state.editingId = item.id;
        DOM.title.value = item.title || "";
        DOM.slug.value = item.slug || "";
        DOM.thumbnail.value = item.thumbnail || "";
        DOM.summary.value = item.summary || "";
        DOM.category.value = item.category || "ALL";
        
        if (DOM.preview && item.thumbnail) {
            DOM.preview.src = item.thumbnail;
            DOM.preview.classList.remove("hidden");
        }

        if (typeof CKEDITOR !== "undefined" && CKEDITOR.instances.inContent) {
            CKEDITOR.instances.inContent.setData(item.content || "");
        }

        DOM.formTitle.textContent = "Sửa Bài Viết";
        DOM.btnSave.textContent = "Cập Nhật Bài Viết";
        DOM.listView.classList.add("hidden");
        DOM.formView.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (error) {
        console.error("Lỗi mở bài viết:", error);
        utils.showToast(error.message, "error");
    }
}

window.deleteBlog = async function(id) {
    const item = state.blogs.find(blog => String(blog.id) === String(id));
    const title = item?.title || "bài viết này";

    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${title}" vĩnh viễn?`)) return;

    try {
        const { error } = await window.supabaseClient.from("blogs").delete().eq("id", id);
        if (error) throw error;

        if (state.blogs.length === 1 && state.currentPage > 1) state.currentPage--;
        utils.showToast("Đã xóa bài viết!", "success");
        await loadBlogs(state.currentPage);

    } catch (error) {
        console.error("Lỗi xóa blog:", error);
        utils.showToast(`Lỗi xóa: ${error.message}`, "error");
    }
}

/* =========================================================
   EVENTS
========================================================= */
function bindEvents() {
    DOM.title?.addEventListener("input", event => {
        if (!state.editingId) DOM.slug.value = utils.generateSlug(event.target.value);
    });

    DOM.thumbnail?.addEventListener("input", event => {
        if (DOM.preview) {
            const url = event.target.value.trim();
            if(url) {
                DOM.preview.src = url;
                DOM.preview.classList.remove("hidden");
            } else {
                DOM.preview.src = "";
                DOM.preview.classList.add("hidden");
            }
        }
    });

    let searchTimer;
    DOM.search?.addEventListener("input", event => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.searchQuery = event.target.value.trim();
            state.currentPage = 1;
            loadBlogs(1);
        }, 300);
    });

    DOM.categoryFilter?.addEventListener("change", event => {
        state.categoryFilter = event.target.value;
        state.currentPage = 1;
        loadBlogs(1);
    });

    DOM.statusFilter?.addEventListener("change", event => {
        state.statusFilter = event.target.value;
        state.currentPage = 1;
        loadBlogs(1);
    });
}