// ========================================================
// PROFILE LOGIC (ĐÃ TÁCH BIỆT FORM CẬP NHẬT & ĐỔI MẬT KHẨU)
// ========================================================
"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    let user = null;
    try {
        if (typeof Auth !== 'undefined' && typeof Auth.getCurrentUser === 'function') {
            user = await Auth.getCurrentUser();
        } else if (typeof checkCustomerAuth === 'function') {
            user = await checkCustomerAuth();
        } else if (window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getUser();
            user = data?.user;
        }
    } catch (err) {
        console.error("Lỗi xác thực Profile:", err);
    }

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    await loadUserProfile(user);
    bindAddressSyncLogic();

    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
        profileForm.addEventListener("submit", handleSaveProfile);
    }
});

// LOGIC ĐỒNG BỘ ĐỊA CHỈ
function bindAddressSyncLogic() {
    const chkSameAddress = document.getElementById('chkSameAddress');
    const profAddress = document.getElementById('profAddress');
    const profBillingAddress = document.getElementById('profBillingAddress');
    const billingAddressGroup = document.getElementById('billingAddressGroup');

    if (!chkSameAddress || !profAddress || !profBillingAddress) return;

    // Xử lý khi tick vào checkbox
    chkSameAddress.addEventListener('change', (e) => {
        if (e.target.checked) {
            billingAddressGroup.style.display = 'none';
            profBillingAddress.value = profAddress.value; // Copy data
        } else {
            billingAddressGroup.style.display = 'block';
        }
    });

    // Khi đang tick checkbox mà sửa địa chỉ giao hàng -> Sửa luôn địa chỉ hóa đơn
    profAddress.addEventListener('input', () => {
        if (chkSameAddress.checked) {
            profBillingAddress.value = profAddress.value;
        }
    });
}

async function loadUserProfile(user) {
    try {
        if (!window.supabaseClient) throw new Error("Chưa kết nối Supabase.");

        const { data, error } = await window.supabaseClient
            .from("profiles").select("*").eq("id", user.id).maybeSingle();

        if (error) throw error;

        const fallbackName = user.email ? user.email.split("@")[0] : "Khang Nam";
        const fullName = data?.full_name || fallbackName;

        setText("sidebarUserName", fullName);
        setText("sidebarUserEmail", user.email || "-");
        const avatarElement = document.getElementById("userAvatarInitials");
        if (avatarElement) avatarElement.textContent = getAvatarInitials(fullName);

        if (data) {
            setValue("profFullName", data.full_name);
            setValue("profPhone", data.phone);
            setValue("profEmail", user.email);
            setValue("profCompany", data.company_name);
            setValue("profTaxId", data.tax_id);
            setValue("profAddress", data.company_address);
            
            // Xử lý đổ dữ liệu Billing Address
            const billingAddress = data.billing_address || "";
            setValue("profBillingAddress", billingAddress);

            // Kiểm tra xem 2 địa chỉ có giống nhau không để tự động tick Checkbox
            const chkSameAddress = document.getElementById('chkSameAddress');
            const billingAddressGroup = document.getElementById('billingAddressGroup');
            if (chkSameAddress && data.company_address && billingAddress === data.company_address) {
                chkSameAddress.checked = true;
                if (billingAddressGroup) billingAddressGroup.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Lỗi tải profile:", error);
    }
}

// XỬ LÝ LƯU PROFILE (Đã gỡ bỏ logic đổi mật khẩu khỏi đây)
async function handleSaveProfile(event) {
    event.preventDefault();
    const saveButton = document.getElementById("btnSaveProfile");
    const buttonText = document.getElementById("saveButtonText");
    const originalText = buttonText ? buttonText.textContent : "Cập nhật thông tin";

    try {
        setSaveButtonLoading(saveButton, buttonText, true);

        const { data: userData, error: userError } = await window.supabaseClient.auth.getUser();
        if (userError) throw userError;
        const user = userData?.user;
        if (!user) throw new Error("Phiên đăng nhập hết hạn.");

        // CHỈ XỬ LÝ CẬP NHẬT THÔNG TIN PROFILE
        const updates = {
            id: user.id,
            email: user.email,
            full_name: getValue("profFullName"),
            phone: getValue("profPhone"),
            company_name: getValue("profCompany"),
            tax_id: getValue("profTaxId"),
            company_address: getValue("profAddress"),
            billing_address: getValue("profBillingAddress"), 
            updated_at: new Date().toISOString()
        };

        if (!updates.full_name || !updates.phone || !updates.company_name) {
            throw new Error("Vui lòng điền thông tin bắt buộc.");
        }

        const { error } = await window.supabaseClient.from("profiles").upsert(updates);
        if (error) throw error;

        showToast("Cập nhật thông tin tài khoản thành công!", "success");
        setText("sidebarUserName", updates.full_name);
        const avatarElement = document.getElementById("userAvatarInitials");
        if (avatarElement) avatarElement.textContent = getAvatarInitials(updates.full_name);

    } catch (error) {
        console.error("Lỗi lưu:", error);
        showToast("Lỗi: " + error.message, "error");
    } finally {
        setSaveButtonLoading(saveButton, buttonText, false, originalText);
    }
}

window.handleLogout = async function () {
    try {
        await window.supabaseClient.auth.signOut();
        localStorage.removeItem("kn_customer_session");
        showToast("Đã đăng xuất!", "success");
        setTimeout(() => { window.location.href = "login.html"; }, 1000);
    } catch (error) {
        showToast("Lỗi đăng xuất", "error");
    }
};

function getAvatarInitials(fullName) {
    if (!fullName || !String(fullName).trim()) return "KN";
    const names = String(fullName).trim().split(/\s+/).filter(Boolean);
    if (names.length >= 2) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    return String(fullName).substring(0, 2).toUpperCase();
}
if (window.utils) window.utils.getAvatarInitials = getAvatarInitials;

function setSaveButtonLoading(btn, txtEl, isLoading, origTxt = "Cập nhật thông tin") {
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true; btn.classList.add("is-loading");
        if (txtEl) txtEl.textContent = "Đang lưu...";
    } else {
        btn.disabled = false; btn.classList.remove("is-loading");
        if (txtEl) txtEl.textContent = origTxt;
    }
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val ?? ""; }
function setValue(id, val) { const el = document.getElementById(id); if (el) el.value = val ?? ""; }
function getValue(id) { const el = document.getElementById(id); return el ? el.value.trim() : ""; }
function showToast(msg, type) {
    if (window.utils && typeof window.utils.showToast === "function") window.utils.showToast(msg, type);
    else alert(msg);
}

// ========================================================
// LOGIC ĐỔI MẬT KHẨU (TÁCH BIỆT HOÀN TOÀN)
// ========================================================
window.openPasswordModal = function() {
    const modal = document.getElementById("passwordModal");
    if (modal) {
        modal.classList.remove("is-hidden");
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";
    }
}

window.closePasswordModal = function() {
    const modal = document.getElementById("passwordModal");
    if (modal) modal.classList.add("is-hidden");
}

document.getElementById("passwordForm")?.addEventListener("submit", async function(e) {
    e.preventDefault();
    const btn = document.getElementById("btnSavePassword");
    const newPwd = document.getElementById("newPassword").value;
    const confirmPwd = document.getElementById("confirmPassword").value;

    if (newPwd.length < 6) return showToast("Mật khẩu phải có ít nhất 6 ký tự", "error");
    if (newPwd !== confirmPwd) return showToast("Mật khẩu xác nhận không khớp", "error");

    try {
        btn.disabled = true;
        btn.textContent = "Đang xử lý...";

        const { error } = await window.supabaseClient.auth.updateUser({ password: newPwd });
        if (error) throw error;

        showToast("Đổi mật khẩu thành công!", "success");
        closePasswordModal();
    } catch (error) {
        showToast("Lỗi: " + error.message, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Xác nhận đổi";
    }
});