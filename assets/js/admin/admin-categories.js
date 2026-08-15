// ========================================================
// FILE: assets/js/admin/manage-categories.js
// QUẢN LÝ DANH MỤC - ADMIN LOGIC (CRUD, AUTO SLUG, TOAST)
// ========================================================

let allCategories = [];

// 1. TẢI DANH SÁCH DANH MỤC TỪ SUPABASE
async function loadCategories() {
    const tbody = document.getElementById('categoryTableBody');
    const stats = document.getElementById('categoryStats');
    if (!tbody) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('categories')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        allCategories = data || [];

        if (stats) stats.innerText = `${allCategories.length} danh mục`;

        renderCategoryTable(allCategories);

    } catch (err) {
        console.error("Lỗi tải danh mục:", err);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-red-500 font-bold">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    }
}

// 2. RENDER BẢNG DỮ LIỆU HỖ TRỢ XSS PROTECTION & SEARCH
function renderCategoryTable(categories) {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;

    if (categories.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-gray-400 font-bold">Không tìm thấy danh mục nào phù hợp.</td></tr>`;
        return;
    }

    let html = '';
    categories.forEach(cat => {
        const iconDisplay = cat.icon_url 
            ? (cat.icon_url.startsWith('http') 
                ? `<img src="${cat.icon_url}" class="w-8 h-8 object-contain mx-auto">` 
                : `<span class="text-xl">${cat.icon_url}</span>`)
            : `<span class="text-gray-300 font-mono text-xs">--</span>`;

        const isActive = cat.is_active !== false;
        const statusBadge = isActive 
            ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">Hiển thị</span>`
            : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Đang ẩn</span>`;

        html += `
            <tr class="hover:bg-blue-50/40 transition-colors">
                <td class="py-3 px-4 text-center font-bold text-gray-500 font-mono text-xs">#${cat.id}</td>
                <td class="py-3 px-4 text-center">${iconDisplay}</td>
                <td class="py-3 px-4 font-bold text-gray-800">${escapeHTML(cat.name)}</td>
                <td class="py-3 px-4 text-xs font-mono text-kn-blue">${escapeHTML(cat.slug || '')}</td>
                <td class="py-3 px-4 text-center">${statusBadge}</td>
                <td class="py-3 px-4 text-right space-x-1">
                    <button onclick="editCategory(${cat.id})" class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition" title="Sửa">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button onclick="deleteCategory(${cat.id}, '${escapeHTML(cat.name)}')" class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition" title="Xóa">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 3. TỰ ĐỘNG BẢO VỆ CHỐNG LỖI XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

// 4. MỞ MODAL VÀ RESET/FILL DỮ LIỆU
window.openModal = function(cat = null) {
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('modalTitle');
    
    if (cat) {
        title.innerText = "Chỉnh Sửa Danh Mục";
        document.getElementById('categoryId').value = cat.id;
        document.getElementById('categoryName').value = cat.name || '';
        document.getElementById('categorySlug').value = cat.slug || '';
        document.getElementById('categoryIcon').value = cat.icon_url || '';
        document.getElementById('categoryDescription').value = cat.description || '';
        document.getElementById('categoryMetaTitle').value = cat.meta_title || '';
        document.getElementById('categoryMetaDescription').value = cat.meta_description || '';
        document.getElementById('categoryIsActive').checked = cat.is_active !== false;
    } else {
        title.innerText = "Thêm Danh Mục Mới";
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryId').value = '';
        document.getElementById('categoryIsActive').checked = true;
    }

    modal.classList.remove('hidden');
};

window.closeModal = function() {
    document.getElementById('categoryModal')?.classList.add('hidden');
};

window.editCategory = function(id) {
    const cat = allCategories.find(c => c.id === id);
    if (cat) openModal(cat);
};

// 5. TỰ ĐỘNG TẠO SLUG CHUẨN SEO
document.getElementById('categoryName')?.addEventListener('input', function(e) {
    const slugInput = document.getElementById('categorySlug');
    // Chỉ tự tạo slug khi là Thêm Mới (chưa có ID)
    if (slugInput && !document.getElementById('categoryId').value) {
        slugInput.value = generateSlug(e.target.value);
    }
});

function generateSlug(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

// 6. XỬ LÝ SUBMIT LƯU DANH MỤC (INSERT / UPDATE)
document.getElementById('categoryForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value.trim();
    const slug = document.getElementById('categorySlug').value.trim();
    const icon_url = document.getElementById('categoryIcon').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();
    const meta_title = document.getElementById('categoryMetaTitle').value.trim();
    const meta_description = document.getElementById('categoryMetaDescription').value.trim();
    const is_active = document.getElementById('categoryIsActive').checked;

    const btn = document.getElementById('btnSubmitForm');
    if (btn) btn.disabled = true;

    const payload = {
        name,
        slug,
        icon_url: icon_url || null,
        description: description || null,
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        is_active
    };

    try {
        if (id) {
            // Cập nhật
            const { error } = await window.supabaseClient
                .from('categories')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            showToast("Cập nhật danh mục thành công!", "success");
        } else {
            // Thêm mới
            const { error } = await window.supabaseClient
                .from('categories')
                .insert([payload]);

            if (error) throw error;
            showToast("Thêm danh mục mới thành công!", "success");
        }

        closeModal();
        await loadCategories();

    } catch (error) {
        console.error("Lỗi lưu danh mục:", error);
        showToast("Lỗi: " + error.message, "error");
    } finally {
        if (btn) btn.disabled = false;
    }
});

// 7. XÓA DANH MỤC
window.deleteCategory = async function(id, name) {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}" không?\nLưu ý: Hành động này không thể hoàn tác!`)) {
        return;
    }

    try {
        const { error } = await window.supabaseClient
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast(`Đã xóa danh mục "${name}" thành công!`, "success");
        await loadCategories();

    } catch (error) {
        console.error("Lỗi xóa danh mục:", error);
        showToast("Lỗi khi xóa: " + error.message, "error");
    }
};

// 8. TÌM KIẾM VÀ LỌC TRẠNG THÁI REALTIME
function handleFilter() {
    const keyword = document.getElementById('searchCategoryInput')?.value.toLowerCase().trim() || '';
    const status = document.getElementById('filterStatusSelect')?.value || 'all';

    const filtered = allCategories.filter(cat => {
        const matchKeyword = !keyword || 
            cat.name.toLowerCase().includes(keyword) || 
            (cat.slug && cat.slug.toLowerCase().includes(keyword));

        const isActive = cat.is_active !== false;
        const matchStatus = (status === 'all') || 
            (status === 'active' && isActive) || 
            (status === 'hidden' && !isActive);

        return matchKeyword && matchStatus;
    });

    renderCategoryTable(filtered);
}

document.getElementById('searchCategoryInput')?.addEventListener('input', handleFilter);
document.getElementById('filterStatusSelect')?.addEventListener('change', handleFilter);

// 9. THÔNG BÁO TOAST
function showToast(msg, type = "success") {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColor = type === "success" ? "bg-gray-900 text-white" : "bg-red-600 text-white";
    
    toast.className = `${bgColor} px-4 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 pointer-events-auto transition-all duration-300 opacity-0 transform translate-y-2`;
    toast.innerHTML = type === "success" 
        ? `<svg class="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> ${msg}`
        : `<svg class="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> ${msg}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// KHỞI CHẠY LÚC TẢI TRANG
document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
});