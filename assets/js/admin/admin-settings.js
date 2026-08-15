// ========================================================
// FILE: assets/js/admin/admin-settings.js
// QUẢN LÝ CẤU HÌNH WEBSITE TẬP TRUNG (ĐÃ FIX LỖI)
// ========================================================

const DOM = {
    btnSave: document.getElementById('btnSaveSettings'),
    inCompanyName: document.getElementById('inCompanyName'),
    inLogoUrl: document.getElementById('inLogoUrl'),
    inHotline: document.getElementById('inHotline'),
    inEmail: document.getElementById('inEmail'),
    inZalo: document.getElementById('inZalo'),
    inWorkingHours: document.getElementById('inWorkingHours'),
    inAddress: document.getElementById('inAddress'),
    inFacebook: document.getElementById('inFacebook'),
    inYoutube: document.getElementById('inYoutube'),
    inMetaTitle: document.getElementById('inMetaTitle'),
    inMetaDesc: document.getElementById('inMetaDesc'),
    toastContainer: document.getElementById('toastContainer')
};

const utils = {
    showToast: (message, type = 'success') => {
        if (!DOM.toastContainer) return;
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const toast = document.createElement('div');
        toast.className = `${bgColor} text-white px-4 py-2 rounded shadow-lg transform transition-all duration-300 translate-y-0 opacity-100 mb-2 font-bold text-sm`;
        toast.innerHTML = type === 'success' ? `✔ ${message}` : `⚠ ${message}`;
        DOM.toastContainer.appendChild(toast);
        setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-2'); setTimeout(() => toast.remove(), 300); }, 3000);
    },
    toggleButtonLoading: (btn, isLoading, text) => {
        if (!btn) return;
        btn.disabled = isLoading;
        btn.innerHTML = isLoading ? `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Đang lưu...` : text;
    }
};

// ĐÃ FIX: CHÈN LÍNH GÁC BẢO MẬT VÀO LÚC LOAD TRANG
document.addEventListener('DOMContentLoaded', async () => {
    // Gọi lính gác kiểm tra quyền Admin
    if (typeof window.checkAdminAuth === 'function') {
        const user = await window.checkAdminAuth();
        if (!user) return; // Nếu không phải admin, ngưng load dữ liệu
    }
    loadSettings();
});

// TẢI DỮ LIỆU CẤU HÌNH
async function loadSettings() {
    try {
        // ĐÃ FIX: THÊM window. TRƯỚC supabaseClient
        const { data, error } = await window.supabaseClient
            .from('website_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; 

        if (data) {
            if (DOM.inCompanyName) DOM.inCompanyName.value = data.company_name || '';
            if (DOM.inLogoUrl) DOM.inLogoUrl.value = data.logo_url || '';
            if (DOM.inHotline) DOM.inHotline.value = data.hotline || '';
            if (DOM.inEmail) DOM.inEmail.value = data.email || '';
            if (DOM.inZalo) DOM.inZalo.value = data.zalo || '';
            if (DOM.inWorkingHours) DOM.inWorkingHours.value = data.working_hours || '';
            if (DOM.inAddress) DOM.inAddress.value = data.address || '';
            if (DOM.inFacebook) DOM.inFacebook.value = data.facebook_url || '';
            if (DOM.inYoutube) DOM.inYoutube.value = data.youtube_url || '';
            if (DOM.inMetaTitle) DOM.inMetaTitle.value = data.meta_title || '';
            if (DOM.inMetaDesc) DOM.inMetaDesc.value = data.meta_description || '';
        }
    } catch (error) {
        console.error("Lỗi tải cấu hình:", error);
        utils.showToast("Không thể tải cấu hình hiện tại!", "error");
    }
}

// LƯU DỮ LIỆU CẤU HÌNH
window.saveSettings = async function() {
    utils.toggleButtonLoading(DOM.btnSave, true, "Lưu cấu hình");

    const payload = {
        id: 1, 
        company_name: DOM.inCompanyName.value.trim(),
        logo_url: DOM.inLogoUrl.value.trim(),
        hotline: DOM.inHotline.value.trim(),
        email: DOM.inEmail.value.trim(),
        zalo: DOM.inZalo.value.trim(),
        working_hours: DOM.inWorkingHours.value.trim(),
        address: DOM.inAddress.value.trim(),
        facebook_url: DOM.inFacebook.value.trim(),
        youtube_url: DOM.inYoutube.value.trim(),
        meta_title: DOM.inMetaTitle.value.trim(),
        meta_description: DOM.inMetaDesc.value.trim(),
        updated_at: new Date().toISOString()
    };

    try {
        // ĐÃ FIX: THÊM window. TRƯỚC supabaseClient
        const { error } = await window.supabaseClient
            .from('website_settings')
            .upsert(payload, { onConflict: 'id' });

        if (error) throw error;
        
        utils.showToast("Đã lưu cấu hình website thành công!", "success");

    } catch (error) {
        console.error("Lỗi lưu cấu hình:", error);
        utils.showToast("Lỗi lưu dữ liệu: " + error.message, "error");
    } finally {
        utils.toggleButtonLoading(DOM.btnSave, false, "Lưu cấu hình");
    }
};