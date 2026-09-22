// ========================================================
// FILE: assets/js/admin/admin-settings.js
// QUẢN LÝ CẤU HÌNH WEBSITE - TÍCH HỢP UPLOAD LOGO & SEO COUNTER
// ========================================================

const state = {
    recordId: 1,
    isLoading: false,
    isSaving: false
};

const DOM = {
    btnSave: document.getElementById("btnSaveSettings"),
    form: document.getElementById("settingsForm"),
    inCompanyName: document.getElementById("inCompanyName"),
    inLogoUrl: document.getElementById("inLogoUrl"),
    inLogoFile: document.getElementById("inLogoFile"),     
    logoPreview: document.getElementById("logoPreview"),   
    inHotline: document.getElementById("inHotline"),
    inEmail: document.getElementById("inEmail"),
    inZalo: document.getElementById("inZalo"),
    inWorkingHours: document.getElementById("inWorkingHours"),
    inAddress: document.getElementById("inAddress"),
    inFacebook: document.getElementById("inFacebook"),
    inYoutube: document.getElementById("inYoutube"),
    inMetaTitle: document.getElementById("inMetaTitle"),
    inMetaDesc: document.getElementById("inMetaDesc"),
    metaTitleCount: document.getElementById("metaTitleCount"), // <--- MỚI
    metaDescCount: document.getElementById("metaDescCount"),   // <--- MỚI
    toastContainer: document.getElementById("toastContainer"),
    sidebar: document.getElementById("adminSidebar"),
    sidebarBackdrop: document.getElementById("sidebarBackdrop")
};

const utils = {
    escapeHTML(value) {
        if (value === null || value === undefined) return "";
        return String(value).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]);
    },
    showToast(message, type = "success") {
        if (!DOM.toastContainer) return;
        const config = {
            success: { background: "bg-green-600", icon: "✓" },
            warning: { background: "bg-kn-orange", icon: "!" },
            error: { background: "bg-red-600", icon: "×" }
        };
        const style = config[type] || config.success;
        const toast = document.createElement("div");
        toast.className = `pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-bold text-white ${style.background} opacity-0 translate-y-2 transition-all duration-300 z-50 mb-2`;
        toast.innerHTML = `<span class="font-black text-base">${style.icon}</span><span>${utils.escapeHTML(message)}</span>`;
        DOM.toastContainer.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove("opacity-0", "translate-y-2"));
        setTimeout(() => {
            toast.classList.add("opacity-0", "translate-y-2");
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },
    setSaveLoading(loading) {
        if (!DOM.btnSave) return;
        DOM.btnSave.disabled = loading;
        DOM.btnSave.classList.toggle("opacity-70", loading);
        DOM.btnSave.classList.toggle("cursor-not-allowed", loading);
        DOM.btnSave.innerHTML = loading
            ? `<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang xử lý...`
            : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Lưu toàn bộ cấu hình`;
    }
};

window.toggleSidebar = function () {
    const sidebar = DOM.sidebar;
    const backdrop = DOM.sidebarBackdrop;
    if (!sidebar || !backdrop) return;
    const closed = sidebar.classList.contains("-translate-x-full");
    sidebar.classList.toggle("-translate-x-full", !closed);
    backdrop.classList.toggle("hidden", !closed);
};

// ========================================================
// HÀM ĐẾM KÝ TỰ SEO
// ========================================================
function updateMetaCounts() {
    // Đếm Title
    if (DOM.inMetaTitle && DOM.metaTitleCount) {
        const tLen = DOM.inMetaTitle.value.length;
        DOM.metaTitleCount.textContent = `${tLen} / 60`;
        if (tLen > 60) {
            DOM.metaTitleCount.classList.add("text-red-500");
            DOM.metaTitleCount.classList.remove("text-gray-400");
        } else {
            DOM.metaTitleCount.classList.remove("text-red-500");
            DOM.metaTitleCount.classList.add("text-gray-400");
        }
    }
    
    // Đếm Description
    if (DOM.inMetaDesc && DOM.metaDescCount) {
        const dLen = DOM.inMetaDesc.value.length;
        DOM.metaDescCount.textContent = `${dLen} / 160`;
        if (dLen > 160) {
            DOM.metaDescCount.classList.add("text-red-500");
            DOM.metaDescCount.classList.remove("text-gray-400");
        } else {
            DOM.metaDescCount.classList.remove("text-red-500");
            DOM.metaDescCount.classList.add("text-gray-400");
        }
    }
}

if (DOM.inMetaTitle) DOM.inMetaTitle.addEventListener("input", updateMetaCounts);
if (DOM.inMetaDesc) DOM.inMetaDesc.addEventListener("input", updateMetaCounts);

// ========================================================
// HIỆN ẢNH XEM TRƯỚC KHI KHÁCH CHỌN FILE
// ========================================================
if (DOM.inLogoFile) {
    DOM.inLogoFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (DOM.logoPreview) DOM.logoPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// ========================================================
// LOAD SETTINGS TỪ DATABASE
// ========================================================
async function loadSettings() {
    state.isLoading = true;
    try {
        if (!window.supabaseClient) throw new Error("Supabase Client chưa được khởi tạo.");
        const { data, error } = await window.supabaseClient.from("website_settings").select("*").eq("id", state.recordId).maybeSingle();
        if (error) throw error;
        if (!data) { utils.showToast("Chưa có cấu hình website.", "warning"); return; }

        if (DOM.inCompanyName) DOM.inCompanyName.value = data.company_name || "";
        
        if (DOM.inLogoUrl) DOM.inLogoUrl.value = data.logo_url || "";
        if (DOM.logoPreview && data.logo_url) DOM.logoPreview.src = data.logo_url;

        if (DOM.inHotline) DOM.inHotline.value = data.hotline || "";
        if (DOM.inEmail) DOM.inEmail.value = data.email || "";
        if (DOM.inZalo) DOM.inZalo.value = data.zalo || "";
        if (DOM.inWorkingHours) DOM.inWorkingHours.value = data.working_hours || "";
        if (DOM.inAddress) DOM.inAddress.value = data.address || "";
        if (DOM.inFacebook) DOM.inFacebook.value = data.facebook_url || "";
        if (DOM.inYoutube) DOM.inYoutube.value = data.youtube_url || "";
        
        // Dữ liệu SEO
        if (DOM.inMetaTitle) DOM.inMetaTitle.value = data.meta_title || "";
        if (DOM.inMetaDesc) DOM.inMetaDesc.value = data.meta_description || "";
        
        updateMetaCounts(); // Cập nhật bộ đếm ngay khi load dữ liệu xong

    } catch (error) {
        console.error("Lỗi tải cấu hình:", error);
        utils.showToast(`Không thể tải cấu hình: ${error.message}`, "error");
    } finally {
        state.isLoading = false;
    }
}

function buildPayload() {
    return {
        id: state.recordId,
        company_name: DOM.inCompanyName?.value.trim() || "",
        logo_url: DOM.inLogoUrl?.value.trim() || "",
        hotline: DOM.inHotline?.value.trim() || "",
        email: DOM.inEmail?.value.trim() || "",
        zalo: DOM.inZalo?.value.trim() || "",
        working_hours: DOM.inWorkingHours?.value.trim() || "",
        address: DOM.inAddress?.value.trim() || "",
        facebook_url: DOM.inFacebook?.value.trim() || "",
        youtube_url: DOM.inYoutube?.value.trim() || "",
        meta_title: DOM.inMetaTitle?.value.trim() || "",
        meta_description: DOM.inMetaDesc?.value.trim() || "",
        updated_at: new Date().toISOString()
    };
}

// ========================================================
// HÀM LƯU TỔNG: GỒM UPLOAD ẢNH (NẾU CÓ) VÀ LƯU DATABASE
// ========================================================
window.saveSettings = async function () {
    if (state.isSaving) return;
    if (!window.supabaseClient) { utils.showToast("Supabase Client chưa được khởi tạo.", "error"); return; }

    state.isSaving = true;
    utils.setSaveLoading(true);

    try {
        const fileInput = DOM.inLogoFile;
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `logo_${Date.now()}.${fileExt}`;
            const filePath = `logos/${fileName}`;
            
            const { error: uploadError } = await window.supabaseClient.storage
                .from('product-images') 
                .upload(filePath, file, { cacheControl: '3600', upsert: true });
                
            if (uploadError) throw new Error("Lỗi upload ảnh Logo: " + uploadError.message);
            
            const { data: publicUrlData } = window.supabaseClient.storage
                .from('product-images')
                .getPublicUrl(filePath);
                
            DOM.inLogoUrl.value = publicUrlData.publicUrl;
        }

        const payload = buildPayload();

        if (payload.company_name.length === 0) throw new Error("Vui lòng nhập tên công ty / thương hiệu.");
        if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) throw new Error("Email hỗ trợ không hợp lệ.");
        
        // Báo lỗi cứng nếu SEO vượt ngưỡng cho phép
        if (payload.meta_title.length > 60) throw new Error("Meta Title không được vượt quá 60 ký tự theo chuẩn Google.");
        if (payload.meta_description.length > 160) throw new Error("Meta Description không được vượt quá 160 ký tự.");

        const { error } = await window.supabaseClient.from("website_settings").upsert(payload, { onConflict: "id" });
        if (error) throw error;

        utils.showToast("Đã lưu cấu hình website thành công!", "success");

        if (DOM.inLogoFile) DOM.inLogoFile.value = "";

    } catch (error) {
        console.error("Lỗi lưu cấu hình:", error);
        utils.showToast(`Lỗi: ${error.message}`, "error");
    } finally {
        state.isSaving = false;
        utils.setSaveLoading(false);
    }
};

DOM.form?.addEventListener("submit", event => {
    event.preventDefault();
    window.saveSettings();
});

document.addEventListener("DOMContentLoaded", async () => {
    try {
        if (typeof window.checkAdminAuth === "function") {
            const user = await window.checkAdminAuth();
            if (!user) return;
        }
        await loadSettings();
    } catch (error) {
        console.error("Lỗi khởi tạo Settings:", error);
        utils.showToast(`Không thể khởi tạo trang: ${error.message}`, "error");
    }
});