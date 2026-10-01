// ========================================================
// FILE: assets/js/users/contact.js
// TRANG LIÊN HỆ KHANG NAM
// - Đã đồng bộ Hotline & Email từ website_settings toàn cục
// ========================================================

"use strict";

// ========================================================
// 1. LOAD CONFIG
// ========================================================

async function loadContactConfig() {
    try {
        if (!window.supabaseClient) {
            throw new Error("Chưa kết nối được hệ thống.");
        }

        // ------------------------------------------------
        // 1. ĐỒNG BỘ HOTLINE, EMAIL TỪ BẢNG WEBSITE_SETTINGS 
        // (Để đổi 1 lần trong Admin là toàn web tự đổi)
        // ------------------------------------------------
        const { data: globalData } = await window.supabaseClient
            .from("website_settings")
            .select("hotline, email, address")
            .eq("id", 1)
            .maybeSingle();

        if (globalData) {
            if (globalData.hotline) {
                const hotline = document.getElementById("txtHotline");
                const hotlineCTA = document.getElementById("txtHotlineCTA");
                const hotlineLink = document.getElementById("linkHotlineCTA");

                if (hotline) hotline.textContent = globalData.hotline;
                if (hotlineCTA) hotlineCTA.textContent = globalData.hotline;
                if (hotlineLink) hotlineLink.href = `tel:${globalData.hotline.replace(/\s+/g, "")}`;
            }

            if (globalData.email) {
                const email = document.getElementById("txtEmail");
                if (email) email.textContent = globalData.email;
            }

            if (globalData.address) {
                const address = document.getElementById("txtAddress");
                if (address) address.textContent = globalData.address;
            }
        }

        // ------------------------------------------------
        // 2. LẤY BẢN ĐỒ & SOCIAL PROOF TỪ CONTACT_PAGE
        // ------------------------------------------------
        const { data: contactData, error } = await window.supabaseClient
            .from("contact_page")
            .select("*")
            .eq("id", 1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (contactData) {
            // Support Time
            if (contactData.support_time) {
                const supportTime = document.getElementById("txtSupportTime");
                if (supportTime) supportTime.textContent = contactData.support_time;
            }

            // Map
            if (contactData.map_iframe_url) {
                const map = document.getElementById("mapIframe");
                if (map) map.src = contactData.map_iframe_url;
            }

            // Social Proof
            const proofList = document.getElementById("contactProofList");

            if (proofList) {
                proofList.innerHTML = "";
                const proofs = Array.isArray(contactData.proofs) ? contactData.proofs : [];

                proofs
                    .filter(proof => typeof proof === "string" && proof.trim())
                    .forEach(proof => {
                        const li = document.createElement("li");
                        li.className = "contact-proof-item";

                        li.innerHTML = `
                            <svg class="contact-proof-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span></span>
                        `;

                        li.querySelector("span").textContent = proof;
                        proofList.appendChild(li);
                    });
            }
        }
        
    } catch (error) {
        console.error("Lỗi tải cấu hình trang liên hệ:", error);
    }
}


// ========================================================
// 2. SUBMIT CONTACT
// ========================================================

window.submitContact = async function () {

    const btnSubmit = document.getElementById("btnSubmitContact");
    const nameInput = document.getElementById("inContactName");
    const companyInput = document.getElementById("inContactCompany");
    const phoneInput = document.getElementById("inContactPhone");
    const emailInput = document.getElementById("inContactEmail");
    const subjectInput = document.getElementById("inContactSubject");
    const messageInput = document.getElementById("inContactMessage");

    if (
        !btnSubmit || !nameInput || !companyInput ||
        !phoneInput || !emailInput || !subjectInput || !messageInput
    ) {
        console.error("Không tìm thấy đầy đủ thành phần form liên hệ.");
        return;
    }

    const name = nameInput.value.trim();
    const company = companyInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();
    const subject = subjectInput.value;
    const message = messageInput.value.trim();

    if (!name || !company || !phone || !email || !message) {
        alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*) trước khi gửi!");
        return;
    }

    const originalHTML = btnSubmit.innerHTML;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `
        <span class="contact-spinner" aria-hidden="true"></span>
        <span>Đang xử lý...</span>
    `;

    try {
        if (!window.supabaseClient) {
            throw new Error("Chưa kết nối được hệ thống máy chủ.");
        }

        const { error } = await window.supabaseClient
            .from("contacts")
            .insert([{ name, company, phone, email, subject, message }]);

        if (error) throw error;

        const dateObj = new Date();
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const randomNum = Math.floor(100 + Math.random() * 900);
        const ticketId = `#CN-${year}${month}${day}-${randomNum}`;

        const formContainer = document.getElementById("formContainer");
        const successMessage = document.getElementById("successMessage");
        const ticketDisplay = document.getElementById("ticketIdDisplay");

        if (formContainer) formContainer.classList.add("is-hidden");
        if (successMessage) successMessage.classList.remove("is-hidden");
        if (ticketDisplay) ticketDisplay.textContent = ticketId;

    } catch (error) {
        console.error("Lỗi gửi liên hệ:", error);
        alert("Có lỗi xảy ra trong quá trình gửi: " + error.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalHTML;
    }
};


// ========================================================
// 3. RESET CONTACT FORM
// ========================================================

window.resetContactForm = function () {
    const form = document.getElementById("contactForm");
    const successMessage = document.getElementById("successMessage");
    const formContainer = document.getElementById("formContainer");
    const companyInput = document.getElementById("inContactCompany");

    if (form) form.reset();
    if (successMessage) successMessage.classList.add("is-hidden");
    if (formContainer) formContainer.classList.remove("is-hidden");
    if (companyInput) companyInput.focus();
};

// ========================================================
// 4. INIT
// ========================================================

document.addEventListener("DOMContentLoaded", async () => {
    await loadContactConfig();
});