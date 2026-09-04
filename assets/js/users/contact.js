// ========================================================
// FILE: assets/js/users/contact.js
// TRANG LIÊN HỆ KHANG NAM
// - Load cấu hình contact_page
// - Submit form
// - Hiển thị trạng thái thành công
// - Không chứa Tailwind class
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

        const { data, error } =
            await window.supabaseClient
                .from("contact_page")
                .select("*")
                .eq("id", 1)
                .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return;
        }


        // ------------------------------------------------
        // HOTLINE
        // ------------------------------------------------

        if (data.hotline) {
            const hotline =
                document.getElementById("txtHotline");

            const hotlineCTA =
                document.getElementById("txtHotlineCTA");

            const hotlineLink =
                document.getElementById("linkHotlineCTA");

            if (hotline) {
                hotline.textContent =
                    data.hotline;
            }

            if (hotlineCTA) {
                hotlineCTA.textContent =
                    data.hotline;
            }

            if (hotlineLink) {
                hotlineLink.href =
                    `tel:${data.hotline.replace(/\s+/g, "")}`;
            }
        }


        // ------------------------------------------------
        // EMAIL
        // ------------------------------------------------

        if (data.email_sales) {
            const email =
                document.getElementById("txtEmail");

            if (email) {
                email.textContent =
                    data.email_sales;
            }
        }


        // ------------------------------------------------
        // ADDRESS
        // ------------------------------------------------

        if (data.address) {
            const address =
                document.getElementById("txtAddress");

            if (address) {
                address.textContent =
                    data.address;
            }
        }


        // ------------------------------------------------
        // SUPPORT TIME
        // ------------------------------------------------

        if (data.support_time) {
            const supportTime =
                document.getElementById("txtSupportTime");

            if (supportTime) {
                supportTime.textContent =
                    data.support_time;
            }
        }


        // ------------------------------------------------
        // MAP
        // ------------------------------------------------

        if (data.map_iframe_url) {
            const map =
                document.getElementById("mapIframe");

            if (map) {
                map.src =
                    data.map_iframe_url;
            }
        }


        // ------------------------------------------------
        // SOCIAL PROOF
        // ------------------------------------------------

        const proofList = document.getElementById("contactProofList");

if (proofList) {
    proofList.innerHTML = "";

    const proofs = Array.isArray(data.proofs)
        ? data.proofs
        : [];

    proofs
        .filter(proof => typeof proof === "string" && proof.trim())
        .forEach(proof => {
            const li = document.createElement("li");
            li.className = "contact-proof-item";

            li.innerHTML = `
                <svg
                    class="contact-proof-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                </svg>

                <span></span>
            `;

            li.querySelector("span").textContent = proof;
            proofList.appendChild(li);
        });
}

        Object.entries(proofMap).forEach(
            ([field, elementId]) => {

                if (!data[field]) {
                    return;
                }

                const element =
                    document.getElementById(elementId);

                if (element) {
                    element.textContent =
                        data[field];
                }
            }
        );

    } catch (error) {

        console.error(
            "Lỗi tải cấu hình trang liên hệ:",
            error
        );
    }
}


// ========================================================
// 2. SUBMIT CONTACT
// ========================================================

window.submitContact = async function () {

    const btnSubmit =
        document.getElementById(
            "btnSubmitContact"
        );

    const nameInput =
        document.getElementById(
            "inContactName"
        );

    const companyInput =
        document.getElementById(
            "inContactCompany"
        );

    const phoneInput =
        document.getElementById(
            "inContactPhone"
        );

    const emailInput =
        document.getElementById(
            "inContactEmail"
        );

    const subjectInput =
        document.getElementById(
            "inContactSubject"
        );

    const messageInput =
        document.getElementById(
            "inContactMessage"
        );


    if (
        !btnSubmit ||
        !nameInput ||
        !companyInput ||
        !phoneInput ||
        !emailInput ||
        !subjectInput ||
        !messageInput
    ) {
        console.error(
            "Không tìm thấy đầy đủ thành phần form liên hệ."
        );

        return;
    }


    // ------------------------------------------------
    // GET FORM DATA
    // ------------------------------------------------

    const name =
        nameInput.value.trim();

    const company =
        companyInput.value.trim();

    const phone =
        phoneInput.value.trim();

    const email =
        emailInput.value.trim();

    const subject =
        subjectInput.value;

    const message =
        messageInput.value.trim();


    // ------------------------------------------------
    // VALIDATE
    // ------------------------------------------------

    if (
        !name ||
        !company ||
        !phone ||
        !email ||
        !message
    ) {
        alert(
            "Vui lòng điền đầy đủ các thông tin bắt buộc (*) trước khi gửi!"
        );

        return;
    }


    // ------------------------------------------------
    // SAVE ORIGINAL BUTTON
    // ------------------------------------------------

    const originalHTML =
        btnSubmit.innerHTML;


    // ------------------------------------------------
    // LOADING STATE
    // ------------------------------------------------

    btnSubmit.disabled = true;

    btnSubmit.innerHTML = `
        <span
            class="contact-spinner"
            aria-hidden="true"
        ></span>

        <span>Đang xử lý...</span>
    `;


    try {

        if (!window.supabaseClient) {
            throw new Error(
                "Chưa kết nối được hệ thống máy chủ."
            );
        }


        // ------------------------------------------------
        // INSERT CONTACT
        // ------------------------------------------------

        const { error } =
            await window.supabaseClient
                .from("contacts")
                .insert([
                    {
                        name,
                        company,
                        phone,
                        email,
                        subject,
                        message
                    }
                ]);


        if (error) {
            throw error;
        }


        // ------------------------------------------------
        // GENERATE TICKET
        // ------------------------------------------------

        const dateObj =
            new Date();

        const year =
            dateObj.getFullYear();

        const month =
            String(
                dateObj.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                dateObj.getDate()
            ).padStart(2, "0");

        const randomNum =
            Math.floor(
                100 +
                Math.random() * 900
            );

        const ticketId =
            `#CN-${year}${month}${day}-${randomNum}`;


        // ------------------------------------------------
        // SHOW SUCCESS
        // ------------------------------------------------

        const formContainer =
            document.getElementById(
                "formContainer"
            );

        const successMessage =
            document.getElementById(
                "successMessage"
            );

        const ticketDisplay =
            document.getElementById(
                "ticketIdDisplay"
            );


        if (formContainer) {
            formContainer.classList.add(
                "is-hidden"
            );
        }

        if (successMessage) {
            successMessage.classList.remove(
                "is-hidden"
            );
        }

        if (ticketDisplay) {
            ticketDisplay.textContent =
                ticketId;
        }


    } catch (error) {

        console.error(
            "Lỗi gửi liên hệ:",
            error
        );

        alert(
            "Có lỗi xảy ra trong quá trình gửi: " +
            error.message
        );

    } finally {

        // ------------------------------------------------
        // RESTORE BUTTON
        // ------------------------------------------------

        btnSubmit.disabled = false;

        btnSubmit.innerHTML =
            originalHTML;
    }
};


// ========================================================
// 3. RESET CONTACT FORM
// ========================================================

window.resetContactForm = function () {

    const form =
        document.getElementById(
            "contactForm"
        );

    const successMessage =
        document.getElementById(
            "successMessage"
        );

    const formContainer =
        document.getElementById(
            "formContainer"
        );

    const companyInput =
        document.getElementById(
            "inContactCompany"
        );


    if (form) {
        form.reset();
    }

    if (successMessage) {
        successMessage.classList.add(
            "is-hidden"
        );
    }

    if (formContainer) {
        formContainer.classList.remove(
            "is-hidden"
        );
    }

    if (companyInput) {
        companyInput.focus();
    }
};


// ========================================================
// 4. INIT
// ========================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadContactConfig();

    }
);