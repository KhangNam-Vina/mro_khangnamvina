// ========================================================
// PROFILE LOGIC
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

    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
        profileForm.addEventListener("submit", handleSaveProfile);
    }
});

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
            setValue("profCompany", data.company_name);
            setValue("profTaxId", data.tax_id);
            setValue("profAddress", data.company_address);
        }
    } catch (error) {
        console.error("Lỗi tải profile:", error);
    }
}

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

        const updates = {
            id: user.id,
            email: user.email,
            full_name: getValue("profFullName"),
            phone: getValue("profPhone"),
            company_name: getValue("profCompany"),
            tax_id: getValue("profTaxId"),
            company_address: getValue("profAddress"),
            updated_at: new Date().toISOString()
        };

        if (!updates.full_name || !updates.phone || !updates.company_name) {
            throw new Error("Vui lòng điền thông tin bắt buộc.");
        }

        const { error } = await window.supabaseClient.from("profiles").upsert(updates);
        if (error) throw error;

        showToast("Cập nhật thành công!", "success");
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