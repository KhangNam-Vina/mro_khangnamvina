// ========================================================
// FILE: assets/js/admin/admin-blog.js
// QUẢN LÝ BLOG - CẤU TRÚC CHUẨN SENIOR (REFACTORED)
// ========================================================

const state = {
    blogs: [],
    editingId: null,
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
};

const DOM = {
    listView: document.getElementById('blogListView'),
    formView: document.getElementById('blogFormView'),
    form: document.getElementById('blogForm'),
    formTitle: document.getElementById('formTitle'),
    title: document.getElementById('inTitle'),
    slug: document.getElementById('inSlug'),
    // BỔ SUNG BIẾN DOM
    summary: document.getElementById('inSummary'),
    category: document.getElementById('inCategory'),
    isActive: document.getElementById('inActive'),
    
    thumbnail: document.getElementById('inThumbnail'),
    preview: document.getElementById('thumbnailPreview'),
    btnSave: document.getElementById('btnSaveBlog'),
    tbody: document.getElementById('blogTableBody'),
    pagination: document.getElementById('paginationContainer'),
    toastContainer: document.getElementById('toastContainer')
};

const utils = {
    escapeHTML: (str) => {
        if (!str) return '';
        return str.toString().replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    },
    generateSlug: (text) => {
        return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
    },
    showToast: (message, type = 'success') => {
        if (!DOM.toastContainer) return;
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const toast = document.createElement('div');
        toast.className = `${bgColor} text-white px-4 py-2 rounded shadow-lg transform transition-all duration-300 mb-2 font-bold text-sm`;
        toast.innerHTML = type === 'success' ? `✔ ${message}` : `⚠ ${message}`;
        DOM.toastContainer.appendChild(toast);
        setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-2'); setTimeout(() => toast.remove(), 300); }, 3000);
    },
    toggleButtonLoading: (btn, isLoading, text) => {
        if (!btn) return;
        btn.disabled = isLoading;
        btn.innerHTML = isLoading ? `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> ${text}` : text;
    }
};

window.addEventListener('load', function() {
    if (DOM.title) {
        DOM.title.addEventListener('input', (e) => {
            if (!state.editingId) DOM.slug.value = utils.generateSlug(e.target.value);
        });
    }

    if (DOM.thumbnail) {
        DOM.thumbnail.addEventListener('input', (e) => {
            const url = e.target.value;
            if (url) {
                DOM.preview.src = url;
                DOM.preview.classList.remove('hidden');
            } else {
                DOM.preview.classList.add('hidden');
            }
        });
    }

    window.loadBlogs(state.currentPage);
});

window.showCreateBlogForm = function() {
    state.editingId = null;
    DOM.form.reset();
    DOM.slug.value = '';
    DOM.preview.src = '';
    DOM.preview.classList.add('hidden');
    
    // RESET DỮ LIỆU BỔ SUNG
    if(DOM.summary) DOM.summary.value = '';
    if(DOM.category) DOM.category.value = 'ALL';
    if(DOM.isActive) DOM.isActive.checked = true;
    
    if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances.inContent) {
        CKEDITOR.instances.inContent.setData('');
    }
    
    DOM.formTitle.innerText = "Viết Bài Mới";
    DOM.btnSave.innerHTML = "Lưu Bài Viết";
    DOM.listView.classList.add('hidden');
    DOM.formView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.cancelEdit = function() {
    state.editingId = null;
    DOM.form.reset();
    DOM.slug.value = '';
    DOM.preview.src = "";
    DOM.preview.classList.add('hidden');
    
    if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances.inContent) {
        CKEDITOR.instances.inContent.setData('');
    }
    
    DOM.formView.classList.add('hidden');
    DOM.listView.classList.remove('hidden');
};

window.loadBlogs = async function(page = 1) {
    state.currentPage = page;
    
    if (DOM.tbody) {
        DOM.tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10"><div class="w-8 h-8 border-4 border-kn-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div><span class="text-gray-500 font-bold">Đang tải danh sách bài viết...</span></td></tr>`;
    }

    const from = (state.currentPage - 1) * state.itemsPerPage;
    const to = from + state.itemsPerPage - 1;

    try {
        const { data, error, count } = await supabaseClient
            .from('blogs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        
        state.blogs = data || [];
        state.totalItems = count || 0;
        
        renderTable();
        renderPagination();

    } catch (error) {
        utils.showToast(`Lỗi tải danh sách: ${error.message}`, 'error');
        if (DOM.tbody) DOM.tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500 font-bold">Lỗi: ${error.message}</td></tr>`;
    }
};

window.saveBlog = async function(event) {
    if(event) event.preventDefault();
    utils.toggleButtonLoading(DOM.btnSave, true, "Đang lưu...");

    const title = DOM.title.value.trim();
    const slug = DOM.slug.value.trim();
    const thumbnail = DOM.thumbnail.value.trim();
    
    // LẤY DỮ LIỆU MỚI
    const summary = DOM.summary ? DOM.summary.value.trim() : '';
    const category = DOM.category ? DOM.category.value : 'ALL';
    const is_active = DOM.isActive ? DOM.isActive.checked : true;

    let content = '';
    if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances.inContent) {
        content = CKEDITOR.instances.inContent.getData();
    }

    if (!title || !slug || !content || !summary) {
        utils.showToast("Vui lòng nhập đủ Tiêu đề, Tóm tắt, Slug và Nội dung!", 'error');
        utils.toggleButtonLoading(DOM.btnSave, false, state.editingId ? 'Cập Nhật' : 'Lưu Bài Viết');
        return;
    }

    try {
        let checkQuery = supabaseClient.from('blogs').select('id').eq('slug', slug);
        if (state.editingId) checkQuery = checkQuery.neq('id', state.editingId);
        
        const { data: existing, error: checkErr } = await checkQuery;
        if (checkErr) throw checkErr;
        
        if (existing && existing.length > 0) {
            utils.showToast("Đường dẫn (Slug) đã tồn tại!", 'error');
            DOM.slug.focus();
            utils.toggleButtonLoading(DOM.btnSave, false, state.editingId ? 'Cập Nhật' : 'Lưu Bài Viết');
            return;
        }

        // BƠM PAYLOAD MỚI
        const payload = { title, slug, thumbnail, summary, category, is_active, content };

        if (state.editingId) {
            const { error } = await supabaseClient.from('blogs').update(payload).eq('id', state.editingId);
            if (error) throw error;
            utils.showToast("Cập nhật bài viết thành công!", 'success');
        } else {
            const { error } = await supabaseClient.from('blogs').insert([payload]);
            if (error) throw error;
            utils.showToast("Thêm bài viết mới thành công!", 'success');
        }
        
        window.cancelEdit();
        window.loadBlogs(state.currentPage); 

    } catch (error) {
        utils.showToast(`Lỗi: ${error.message}`, 'error');
    } finally {
        utils.toggleButtonLoading(DOM.btnSave, false, state.editingId ? 'Cập Nhật Bài Viết' : 'Lưu Bài Viết');
    }
};

window.editBlog = async function(id) {
    try {
        const { data: item, error } = await supabaseClient.from('blogs').select('*').eq('id', id).single();
        if (error || !item) throw new Error("Không tìm thấy dữ liệu bài viết.");
        
        state.editingId = item.id;
        
        DOM.title.value = item.title;
        DOM.slug.value = item.slug;
        DOM.thumbnail.value = item.thumbnail;
        
        // ĐỔ DỮ LIỆU CŨ LÊN FORM
        if(DOM.summary) DOM.summary.value = item.summary || '';
        if(DOM.category) DOM.category.value = item.category || 'ALL';
        if(DOM.isActive) DOM.isActive.checked = item.is_active !== false;
        
        if (item.thumbnail) {
            DOM.preview.src = item.thumbnail;
            DOM.preview.classList.remove('hidden');
        }

        if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances.inContent) {
            CKEDITOR.instances.inContent.setData(item.content || '');
        }
        
        DOM.formTitle.innerText = "Sửa Bài Viết";
        DOM.btnSave.innerHTML = "Cập Nhật Bài Viết";
        DOM.listView.classList.add('hidden');
        DOM.formView.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        utils.showToast(error.message, 'error');
    }
};

window.deleteBlog = async function(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này vĩnh viễn?")) return;
    try {
        const { error } = await supabaseClient.from('blogs').delete().eq('id', id);
        if (error) throw error; 
        
        utils.showToast("Đã xóa bài viết!", 'success');
        if (state.blogs.length === 1 && state.currentPage > 1) {
            state.currentPage--;
        }
        window.loadBlogs(state.currentPage);
    } catch (error) {
        utils.showToast(`Lỗi xóa: ${error.message}`, 'error');
    }
};

function renderTable() {
    if (!DOM.tbody) return;
    if (state.totalItems === 0) {
        DOM.tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-400">Chưa có bài viết nào!</td></tr>`;
        return;
    }

    let html = '';
    const from = (state.currentPage - 1) * state.itemsPerPage;

    state.blogs.forEach((item, index) => {
        const dateStr = new Date(item.created_at).toLocaleDateString('vi-VN');
        const catName = item.category && item.category !== 'ALL' ? item.category : 'Chung';
        
        // NÚT TRẠNG THÁI ẨN/HIỆN
        const statusBadge = item.is_active !== false 
            ? '<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold border border-green-200 inline-block whitespace-nowrap">Đang hiện</span>' 
            : '<span class="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold border border-gray-200 inline-block whitespace-nowrap">Đang ẩn</span>';

        html += `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition group">
                <td class="p-4 text-center font-bold text-gray-400 text-xs">${from + index + 1}</td>
                <td class="p-4">
                    <img src="${utils.escapeHTML(item.thumbnail)}" onerror="this.src='https://placehold.co/100x60?text=No+Image'" class="w-16 h-10 object-cover rounded-md shadow-sm border border-gray-200">
                </td>
                <td class="p-4">
                    <p class="font-bold text-gray-900 line-clamp-1">${utils.escapeHTML(item.title)}</p>
                    <div class="flex gap-2 items-center mt-1">
                        <span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold uppercase">${utils.escapeHTML(catName)}</span>
                        <span class="text-xs text-gray-400 font-mono">/${utils.escapeHTML(item.slug)}</span>
                    </div>
                </td>
                <td class="p-4 text-center">${statusBadge}</td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center space-x-1">
                        <button onclick="window.editBlog('${item.id}')" class="p-1.5 text-gray-400 hover:text-kn-blue hover:bg-blue-50 rounded-lg transition" title="Sửa">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button onclick="window.deleteBlog('${item.id}')" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Xóa">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    DOM.tbody.innerHTML = html;
}

function renderPagination() {
    if (!DOM.pagination) return;
    DOM.pagination.innerHTML = '';
    const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
    if (totalPages <= 1) return;

    let html = `<button onclick="window.loadBlogs(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled class="px-3 py-1.5 rounded-lg text-gray-400 bg-transparent"' : 'class="px-3 py-1.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm font-bold"'}>&laquo; Prev</button><div class="flex space-x-1">`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button onclick="window.loadBlogs(${i})" class="px-3 py-1.5 rounded-lg font-bold shadow-sm transition ${i === state.currentPage ? 'bg-gray-900 text-white border border-gray-900' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}">${i}</button>`;
    }
    html += `</div><button onclick="window.loadBlogs(${state.currentPage + 1})" ${state.currentPage === totalPages ? 'disabled class="px-3 py-1.5 rounded-lg text-gray-400 bg-transparent"' : 'class="px-3 py-1.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm font-bold"'}>Next &raquo;</button>`;
    DOM.pagination.innerHTML = html;
}