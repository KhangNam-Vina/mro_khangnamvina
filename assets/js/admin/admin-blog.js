// ========================================================
// FILE: assets/js/admin-blog.js
// QUẢN LÝ BLOG - CẤU TRÚC CHUẨN SENIOR (REFACTORED)
// ========================================================

// --------------------------------------------------------
// 1. STATE & DOM CACHE (Quản lý trạng thái tập trung)
// --------------------------------------------------------
const state = {
    blogs: [],
    editingId: null,
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
};

const DOM = {
    form: document.getElementById('blogForm'),
    title: document.getElementById('inTitle'),
    slug: document.getElementById('inSlug'),
    thumbnail: document.getElementById('inThumbnail'),
    preview: document.getElementById('thumbnailPreview'),
    btnSave: document.getElementById('btnSaveBlog'),
    btnCancel: document.getElementById('btnCancelEdit'),
    tbody: document.getElementById('blogTableBody'),
    pagination: document.getElementById('paginationContainer')
};

// --------------------------------------------------------
// 2. INIT (Khởi tạo sự kiện 1 lần duy nhất)
// --------------------------------------------------------
window.addEventListener('load', function() {
    // Tự tạo slug khi gõ Tiêu đề (chỉ khi thêm mới)
    if (DOM.title) {
        DOM.title.addEventListener('input', (e) => {
            if (!state.editingId) {
                DOM.slug.value = utils.generateSlug(e.target.value);
            }
        });
    }

    // Preview Thumbnail
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

    // Tải dữ liệu lần đầu
    loadBlogs(state.currentPage);
});

// --------------------------------------------------------
// 3. CORE FUNCTIONS (Logic chính)
// --------------------------------------------------------

async function loadBlogs(page = 1) {
    state.currentPage = page;
    
    // Skeleton Loading
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
        console.error("Lỗi tải Blog:", error);
        utils.showToast(`Lỗi tải danh sách: ${error.message}`, 'error');
        if (DOM.tbody) DOM.tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500 font-bold">Lỗi: ${error.message}</td></tr>`;
    }
}

async function saveBlog(event) {
    event.preventDefault();
    
    // Khóa nút & đổi text Loading
    utils.toggleButtonLoading(DOM.btnSave, true, "Đang lưu...");

    const title = DOM.title.value.trim();
    const slug = DOM.slug.value.trim();
    const thumbnail = DOM.thumbnail.value.trim();
    let content = '';

    // Kiểm tra an toàn CKEditor
    if (CKEDITOR && CKEDITOR.instances && CKEDITOR.instances.inContent) {
        content = CKEDITOR.instances.inContent.getData();
    }

    if (!title || !slug || !content) {
        utils.showToast("Vui lòng nhập đủ Tiêu đề, Slug và Nội dung!", 'error');
        utils.toggleButtonLoading(DOM.btnSave, false, state.editingId ? 'Cập Nhật' : 'Lưu Bài Viết');
        return;
    }

    try {
        // Kiểm tra Slug trùng (Validate)
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

        const payload = { title, slug, thumbnail, content };
        // (Nếu Database có cột summary, thêm summary vào payload tại đây)

        if (state.editingId) {
            const { error } = await supabaseClient.from('blogs').update(payload).eq('id', state.editingId);
            if (error) throw error;
            utils.showToast("Cập nhật bài viết thành công!", 'success');
        } else {
            const { error } = await supabaseClient.from('blogs').insert([payload]);
            if (error) throw error;
            utils.showToast("Thêm bài viết mới thành công!", 'success');
        }
        
        cancelEdit();
        loadBlogs(state.currentPage); 

    } catch (error) {
        console.error("Lỗi lưu Blog:", error);
        utils.showToast(`Lỗi: ${error.message}`, 'error');
    } finally {
        utils.toggleButtonLoading(DOM.btnSave, false, state.editingId ? 'Cập Nhật' : 'Lưu Bài Viết');
    }
}

async function editBlog(id) {
    // Lấy bài viết từ DB (Thay vì lấy từ List tạm theo chuẩn Senior)
    try {
        const { data: item, error } = await supabaseClient.from('blogs').select('*').eq('id', id).single();
        if (error || !item) throw new Error("Không tìm thấy dữ liệu bài viết.");
        
        state.editingId = item.id;
        
        // Đổ data lên DOM
        DOM.title.value = item.title;
        DOM.slug.value = item.slug;
        DOM.thumbnail.value = item.thumbnail;
        
        if (item.thumbnail) {
            DOM.preview.src = item.thumbnail;
            DOM.preview.classList.remove('hidden');
        }

        if (CKEDITOR && CKEDITOR.instances && CKEDITOR.instances.inContent) {
            CKEDITOR.instances.inContent.setData(item.content || '');
        }
        
        // Đổi UI Nút
        DOM.btnSave.innerHTML = "Cập Nhật";
        DOM.btnSave.classList.replace('bg-kn-blue', 'bg-green-600');
        DOM.btnSave.classList.replace('hover:bg-blue-800', 'hover:bg-green-700');
        DOM.btnCancel.classList.remove('hidden');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        utils.showToast(error.message, 'error');
    }
}

function cancelEdit() {
    state.editingId = null;
    DOM.form.reset();
    
    if (CKEDITOR && CKEDITOR.instances && CKEDITOR.instances.inContent) {
        CKEDITOR.instances.inContent.setData('');
    }
    
    DOM.preview.src = "";
    DOM.preview.classList.add('hidden');
    
    DOM.btnSave.innerHTML = "Lưu Bài Viết";
    DOM.btnSave.classList.replace('bg-green-600', 'bg-kn-blue');
    DOM.btnSave.classList.replace('hover:bg-green-700', 'hover:bg-blue-800');
    DOM.btnCancel.classList.add('hidden');
    
    DOM.title.focus();
}

async function deleteBlog(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này vĩnh viễn?")) return;
    
    try {
        const { error } = await supabaseClient.from('blogs').delete().eq('id', id);
        if (error) throw error; 
        
        utils.showToast("Đã xóa bài viết!", 'success');
        
        // Logic: Nếu xóa bài cuối cùng của trang, lùi về trang trước
        if (state.blogs.length === 1 && state.currentPage > 1) {
            state.currentPage--;
        }
        loadBlogs(state.currentPage);

    } catch (error) {
        utils.showToast(`Lỗi xóa: ${error.message}`, 'error');
    }
}

// --------------------------------------------------------
// 4. RENDER UI (Vẽ giao diện)
// --------------------------------------------------------
function renderTable() {
    if (!DOM.tbody) return;

    if (state.totalItems === 0) {
        DOM.tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500">Chưa có bài viết nào!</td></tr>`;
        return;
    }

    let html = '';
    const from = (state.currentPage - 1) * state.itemsPerPage;

    state.blogs.forEach((item, index) => {
        const dateStr = new Date(item.created_at).toLocaleDateString('vi-VN');
        html += `
            <tr class="hover:bg-gray-50 border-b border-gray-100 transition">
                <td class="p-4 text-center font-bold text-gray-500">${from + index + 1}</td>
                <td class="p-4">
                    <img src="${item.thumbnail}" onerror="this.src='https://placehold.co/100x60?text=No+Image'" class="w-16 h-10 object-cover rounded shadow-sm border border-gray-200">
                </td>
                <td class="p-4">
                    <p class="font-bold text-gray-800 line-clamp-1">${item.title}</p>
                    <p class="text-xs text-gray-400">/${item.slug}</p>
                </td>
                <td class="p-4 text-sm text-gray-600">${dateStr}</td>
                <td class="p-4 text-right space-x-2">
                    <button onclick="editBlog('${item.id}')" class="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded font-bold hover:bg-blue-200 transition">Sửa</button>
                    <button onclick="deleteBlog('${item.id}')" class="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded font-bold hover:bg-red-200 transition">Xóa</button>
                </td>
            </tr>
        `;
    });
    
    // Tối ưu DOM: Gán innerHTML 1 lần duy nhất ngoài vòng lặp
    DOM.tbody.innerHTML = html;
}

function renderPagination() {
    if (!DOM.pagination) return;
    DOM.pagination.innerHTML = '';
    
    const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);
    if (totalPages <= 1) return;

    let html = '';
    
    if (state.currentPage > 1) {
        html += `<button onclick="loadBlogs(${state.currentPage - 1})" class="px-3 py-1 bg-white border rounded text-sm text-gray-600 hover:bg-gray-50">&laquo;</button>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === state.currentPage) {
            html += `<button class="px-3 py-1 bg-kn-orange text-white border border-kn-orange rounded text-sm font-bold">${i}</button>`;
        } else {
            html += `<button onclick="loadBlogs(${i})" class="px-3 py-1 bg-white border rounded text-sm text-kn-blue hover:bg-blue-50">${i}</button>`;
        }
    }
    
    if (state.currentPage < totalPages) {
        html += `<button onclick="loadBlogs(${state.currentPage + 1})" class="px-3 py-1 bg-white border rounded text-sm text-gray-600 hover:bg-gray-50">&raquo;</button>`;
    }

    DOM.pagination.innerHTML = html;
}

// --------------------------------------------------------
// 5. UTILITIES (Công cụ hỗ trợ)
// --------------------------------------------------------
const utils = {
    generateSlug: (text) => {
        return text.toString().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D")
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '').replace(/-+$/, '');
    },
    
    showToast: (message, type = 'info') => {
        // Tạm thời dùng alert, có thể nâng cấp thư viện Toastify.js sau
        if (type === 'error') console.error(message);
        alert(message);
    },

    toggleButtonLoading: (btn, isLoading, text) => {
        if (!btn) return;
        btn.disabled = isLoading;
        if (isLoading) {
            btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> ${text}`;
        } else {
            btn.innerHTML = text;
        }
    }
};