// ========================================================
// FILE: assets/js/admin/admin-settings.js
//
// QUẢN LÝ CẤU HÌNH WEBSITE TẬP TRUNG
//
// DATABASE CONTRACT GIỮ NGUYÊN
//
// website_settings:
// - id
// - company_name
// - logo_url
// - hotline
// - email
// - zalo
// - working_hours
// - address
// - facebook_url
// - youtube_url
// - meta_title
// - meta_description
// - updated_at
//
// KHÔNG ĐỔI SCHEMA
// KHÔNG ĐỔI CÁCH LƯU DATABASE
// ========================================================


/* ========================================================
   STATE
======================================================== */

const state = {

    recordId: 1,

    isLoading: false,

    isSaving: false

};


/* ========================================================
   DOM
======================================================== */

const DOM = {

    btnSave:
        document.getElementById(
            "btnSaveSettings"
        ),

    form:
        document.getElementById(
            "settingsForm"
        ),

    inCompanyName:
        document.getElementById(
            "inCompanyName"
        ),

    inLogoUrl:
        document.getElementById(
            "inLogoUrl"
        ),

    inHotline:
        document.getElementById(
            "inHotline"
        ),

    inEmail:
        document.getElementById(
            "inEmail"
        ),

    inZalo:
        document.getElementById(
            "inZalo"
        ),

    inWorkingHours:
        document.getElementById(
            "inWorkingHours"
        ),

    inAddress:
        document.getElementById(
            "inAddress"
        ),

    inFacebook:
        document.getElementById(
            "inFacebook"
        ),

    inYoutube:
        document.getElementById(
            "inYoutube"
        ),

    inMetaTitle:
        document.getElementById(
            "inMetaTitle"
        ),

    inMetaDesc:
        document.getElementById(
            "inMetaDesc"
        ),

    toastContainer:
        document.getElementById(
            "toastContainer"
        ),

    sidebar:
        document.getElementById(
            "adminSidebar"
        ),

    sidebarBackdrop:
        document.getElementById(
            "sidebarBackdrop"
        )

};


/* ========================================================
   UTILS
======================================================== */

const utils = {


    escapeHTML(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(
            value
        ).replace(
            /[&<>'"]/g,
            character => ({

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                "'": "&#39;",

                '"': "&quot;"

            })[character]
        );

    },


    showToast(
        message,
        type = "success"
    ) {

        if (
            !DOM.toastContainer
        ) {

            return;

        }


        const config = {

            success: {

                background:
                    "bg-green-600",

                icon:
                    "✓"

            },

            warning: {

                background:
                    "bg-kn-orange",

                icon:
                    "!"

            },

            error: {

                background:
                    "bg-red-600",

                icon:
                    "×"

            }

        };


        const style =
            config[type] ||
            config.success;


        const toast =
            document.createElement(
                "div"
            );


        toast.className = `

            pointer-events-auto

            flex
            items-center
            gap-2

            px-4
            py-3

            rounded-xl

            shadow-xl

            text-sm
            font-bold
            text-white

            ${style.background}

            opacity-0
            translate-y-2

            transition-all
            duration-300

        `;


        toast.innerHTML = `

            <span
                class="font-black text-base"
            >
                ${style.icon}
            </span>

            <span>
                ${utils.escapeHTML(
                    message
                )}
            </span>

        `;


        DOM.toastContainer.appendChild(
            toast
        );


        requestAnimationFrame(
            () => {

                toast.classList.remove(
                    "opacity-0",
                    "translate-y-2"
                );

            }
        );


        setTimeout(
            () => {

                toast.classList.add(
                    "opacity-0",
                    "translate-y-2"
                );


                setTimeout(
                    () => {

                        toast.remove();

                    },
                    300
                );

            },
            3500
        );

    },


    setSaveLoading(
        loading
    ) {

        if (
            !DOM.btnSave
        ) {

            return;

        }


        DOM.btnSave.disabled =
            loading;


        DOM.btnSave.classList.toggle(
            "opacity-70",
            loading
        );


        DOM.btnSave.classList.toggle(
            "cursor-not-allowed",
            loading
        );


        DOM.btnSave.innerHTML =
            loading

                ? `

                    <span
                        class="
                            inline-block
                            w-4
                            h-4
                            border-2
                            border-white
                            border-t-transparent
                            rounded-full
                            animate-spin
                        "
                    ></span>

                    Đang lưu...

                `

                : `

                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >

                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                        />

                    </svg>

                    Lưu cấu hình

                `;

    }

};


/* ========================================================
   MOBILE SIDEBAR
======================================================== */

window.toggleSidebar =
    function () {

        const sidebar =
            DOM.sidebar;

        const backdrop =
            DOM.sidebarBackdrop;


        if (
            !sidebar ||
            !backdrop
        ) {

            return;

        }


        const closed =
            sidebar.classList.contains(
                "-translate-x-full"
            );


        sidebar.classList.toggle(
            "-translate-x-full",
            !closed
        );


        backdrop.classList.toggle(
            "hidden",
            !closed
        );

    };


/* ========================================================
   LOAD SETTINGS
======================================================== */

async function loadSettings() {

    state.isLoading =
        true;


    try {

        if (
            !window.supabaseClient
        ) {

            throw new Error(
                "Supabase Client chưa được khởi tạo."
            );

        }


        const {
            data,
            error
        } =
            await window.supabaseClient

                .from(
                    "website_settings"
                )

                .select(
                    "*"
                )

                .eq(
                    "id",
                    state.recordId
                )

                .maybeSingle();


        if (
            error
        ) {

            throw error;

        }


        if (
            !data
        ) {

            utils.showToast(
                "Chưa có cấu hình website.",
                "warning"
            );

            return;

        }


        /* =================================================
           COMPANY
        ================================================= */

        if (
            DOM.inCompanyName
        ) {

            DOM.inCompanyName.value =
                data.company_name ||
                "";

        }


        if (
            DOM.inLogoUrl
        ) {

            DOM.inLogoUrl.value =
                data.logo_url ||
                "";

        }


        /* =================================================
           CONTACT
        ================================================= */

        if (
            DOM.inHotline
        ) {

            DOM.inHotline.value =
                data.hotline ||
                "";

        }


        if (
            DOM.inEmail
        ) {

            DOM.inEmail.value =
                data.email ||
                "";

        }


        if (
            DOM.inZalo
        ) {

            DOM.inZalo.value =
                data.zalo ||
                "";

        }


        if (
            DOM.inWorkingHours
        ) {

            DOM.inWorkingHours.value =
                data.working_hours ||
                "";

        }


        if (
            DOM.inAddress
        ) {

            DOM.inAddress.value =
                data.address ||
                "";

        }


        /* =================================================
           SOCIAL
        ================================================= */

        if (
            DOM.inFacebook
        ) {

            DOM.inFacebook.value =
                data.facebook_url ||
                "";

        }


        if (
            DOM.inYoutube
        ) {

            DOM.inYoutube.value =
                data.youtube_url ||
                "";

        }


        /* =================================================
           SEO
        ================================================= */

        if (
            DOM.inMetaTitle
        ) {

            DOM.inMetaTitle.value =
                data.meta_title ||
                "";

        }


        if (
            DOM.inMetaDesc
        ) {

            DOM.inMetaDesc.value =
                data.meta_description ||
                "";

        }


    } catch (
        error
    ) {

        console.error(
            "Lỗi tải cấu hình:",
            error
        );


        utils.showToast(
            `Không thể tải cấu hình: ${error.message}`,
            "error"
        );

    } finally {

        state.isLoading =
            false;

    }

}


/* ========================================================
   BUILD PAYLOAD
======================================================== */

function buildPayload() {

    return {

        id:
            state.recordId,

        company_name:
            DOM.inCompanyName?.value
                .trim() ||
            "",

        logo_url:
            DOM.inLogoUrl?.value
                .trim() ||
            "",

        hotline:
            DOM.inHotline?.value
                .trim() ||
            "",

        email:
            DOM.inEmail?.value
                .trim() ||
            "",

        zalo:
            DOM.inZalo?.value
                .trim() ||
            "",

        working_hours:
            DOM.inWorkingHours?.value
                .trim() ||
            "",

        address:
            DOM.inAddress?.value
                .trim() ||
            "",

        facebook_url:
            DOM.inFacebook?.value
                .trim() ||
            "",

        youtube_url:
            DOM.inYoutube?.value
                .trim() ||
            "",

        meta_title:
            DOM.inMetaTitle?.value
                .trim() ||
            "",

        meta_description:
            DOM.inMetaDesc?.value
                .trim() ||
            "",

        updated_at:
            new Date()
                .toISOString()

    };

}


/* ========================================================
   VALIDATE
======================================================== */

function validatePayload(
    payload
) {

    if (
        payload.company_name.length === 0
    ) {

        return "Vui lòng nhập tên công ty / thương hiệu.";

    }


    if (
        payload.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(
                payload.email
            )
    ) {

        return "Email hỗ trợ không hợp lệ.";

    }


    if (
        payload.meta_title.length >
        60
    ) {

        return "Meta Title không được vượt quá 60 ký tự.";

    }


    if (
        payload.meta_description.length >
        160
    ) {

        return "Meta Description không được vượt quá 160 ký tự.";

    }


    return null;

}


/* ========================================================
   SAVE SETTINGS
======================================================== */

window.saveSettings =
    async function () {

        if (
            state.isSaving
        ) {

            return;

        }


        if (
            !window.supabaseClient
        ) {

            utils.showToast(
                "Supabase Client chưa được khởi tạo.",
                "error"
            );

            return;

        }


        const payload =
            buildPayload();


        const validationError =
            validatePayload(
                payload
            );


        if (
            validationError
        ) {

            utils.showToast(
                validationError,
                "warning"
            );

            return;

        }


        state.isSaving =
            true;


        utils.setSaveLoading(
            true
        );


        try {

            const {
                error
            } =
                await window.supabaseClient

                    .from(
                        "website_settings"
                    )

                    .upsert(
                        payload,
                        {
                            onConflict: "id"
                        }
                    );


            if (
                error
            ) {

                throw error;

            }


            utils.showToast(
                "Đã lưu cấu hình website thành công!",
                "success"
            );


        } catch (
            error
        ) {

            console.error(
                "Lỗi lưu cấu hình:",
                error
            );


            utils.showToast(
                `Lỗi lưu dữ liệu: ${error.message}`,
                "error"
            );

        } finally {

            state.isSaving =
                false;


            utils.setSaveLoading(
                false
            );

        }

    };


/* ========================================================
   FORM EVENT
======================================================== */

DOM.form?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        window.saveSettings();

    }
);


/* ========================================================
   INIT
======================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            /* ---------------------------------------------
               ADMIN GUARD
            --------------------------------------------- */

            if (
                typeof window.checkAdminAuth ===
                "function"
            ) {

                const user =
                    await window.checkAdminAuth();


                if (
                    !user
                ) {

                    return;

                }

            }


            /* ---------------------------------------------
               LOAD DATA
            --------------------------------------------- */

            await loadSettings();

        } catch (
            error
        ) {

            console.error(
                "Lỗi khởi tạo Settings:",
                error
            );


            utils.showToast(
                `Không thể khởi tạo trang: ${error.message}`,
                "error"
            );

        }

    }
);