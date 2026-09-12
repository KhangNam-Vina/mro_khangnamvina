// ========================================================
// FILE: assets/js/admin/admin-about.js
// QUẢN LÝ TRANG GIỚI THIỆU
// ========================================================

const state = {
    editor: null,
    recordId: 1,
    isLoading: false,
    isSaving: false
};

const DOM = {
    loadingIndicator: document.getElementById("loadingIndicator"),
    editorWrapper: document.getElementById("editorWrapper"),
    btnSave: document.getElementById("btnSave"),
    metaTitle: document.getElementById("metaTitle"),
    metaDesc: document.getElementById("metaDesc"),
    titleCount: document.getElementById("metaTitleCount"),
    descCount: document.getElementById("metaDescCount"),
    heroHeading: document.getElementById("heroHeading"),
    heroDesc: document.getElementById("heroDesc"),
    kpiYears: document.getElementById("kpiYears"),
    kpiBrands: document.getElementById("kpiBrands"),
    kpiSkus: document.getElementById("kpiSkus"),
    kpiCustomers: document.getElementById("kpiCustomers"),
    editorContainer: document.getElementById("ckEditorContainer"),
    sidebar: document.getElementById("adminSidebar"),
    sidebarBackdrop: document.getElementById("sidebarBackdrop")
};

/* ========================================================
   HELPERS & UI STATES
======================================================== */
function setPageLoading(loading) {
    state.isLoading = loading;
    DOM.loadingIndicator?.classList.toggle("hidden", !loading);
    DOM.editorWrapper?.classList.toggle("hidden", loading);
}

function setSaveLoading(loading) {
    if (!DOM.btnSave) return;
    DOM.btnSave.disabled = loading;
    DOM.btnSave.classList.toggle("opacity-70", loading);
    DOM.btnSave.classList.toggle("cursor-not-allowed", loading);
    DOM.btnSave.innerHTML = loading
        ? `<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang lưu...`
        : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Lưu thay đổi`;
}

function getNumber(element) {
    if (!element) return 0;
    const value = Number.parseInt(element.value, 10);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
}

// Tận dụng utils chung của toàn hệ thống
function showToast(msg, type = "success") {
    if (window.utils && typeof window.utils.showToast === 'function') {
        window.utils.showToast(msg, type);
    } else {
        alert(msg);
    }
}

/* ========================================================
   MOBILE SIDEBAR
======================================================== */
window.toggleSidebar = function () {
    if (!DOM.sidebar || !DOM.sidebarBackdrop) return;
    const closed = DOM.sidebar.classList.contains("-translate-x-full");
    DOM.sidebar.classList.toggle("-translate-x-full", !closed);
    DOM.sidebarBackdrop.classList.toggle("hidden", !closed);
};

/* ========================================================
   SEO COUNTERS
======================================================== */
function initSeoCounters() {
    function update(input, counter, max) {
        if (!input || !counter) return;
        const length = input.value.length;
        counter.textContent = `${length} / ${max}`;
        counter.classList.remove("text-gray-500", "text-orange-500", "text-red-500");
        if (length >= max) counter.classList.add("text-red-500");
        else if (length >= max * 0.9) counter.classList.add("text-orange-500");
        else counter.classList.add("text-gray-500");
    }

    if (DOM.metaTitle && DOM.titleCount) {
        const handler = () => update(DOM.metaTitle, DOM.titleCount, 60);
        DOM.metaTitle.addEventListener("input", handler);
        handler();
    }

    if (DOM.metaDesc && DOM.descCount) {
        const handler = () => update(DOM.metaDesc, DOM.descCount, 160);
        DOM.metaDesc.addEventListener("input", handler);
        handler();
    }
}

/* ========================================================
   CKEDITOR 5
======================================================== */
async function initEditor() {
    if (!DOM.editorContainer) throw new Error("Không tìm thấy CKEditor container.");
    if (typeof CKEDITOR === "undefined") throw new Error("CKEditor chưa được tải.");

    state.editor = await CKEDITOR.ClassicEditor.create(DOM.editorContainer, {
        toolbar: {
            items: [
                "sourceEditing", "|", "heading", "|", "bold", "italic", "underline", "strikethrough", "removeFormat", "|",
                "alignment", "|", "bulletedList", "numberedList", "|", "outdent", "indent", "|",
                "link", "insertImage", "insertTable", "blockQuote", "horizontalLine", "|", "undo", "redo"
            ],
            shouldNotGroupWhenFull: true
        },
        htmlSupport: {
            allow: [{ name: /.*/, attributes: true, classes: true, styles: true }]
        },
        removePlugins: [
            "CKBox", "CKFinder", "EasyImage", "RealTimeCollaborativeComments", "RealTimeCollaborativeTrackChanges",
            "RealTimeCollaborativeRevisionHistory", "PresenceList", "Comments", "TrackChanges", "TrackChangesData",
            "RevisionHistory", "Pagination", "WProofreader", "MathType", "DocumentOutline", "FormatPainter",
            "TableOfContents", "SlashCommand", "Template", "ExportPdf", "ExportWord", "PasteFromOfficeEnhanced", "CaseChange"
        ]
    });
}

/* ========================================================
   LOAD DATA
======================================================== */
async function loadAboutData() {
    setPageLoading(true);
    try {
        if (!window.supabaseClient) throw new Error("Supabase Client chưa sẵn sàng.");

        const { data, error } = await window.supabaseClient.from("about").select("*").eq("id", state.recordId).maybeSingle();
        if (error) throw error;
        if (!data) {
            showToast("Chưa có dữ liệu trang Giới thiệu.", "warning");
            return;
        }

        // Điền data vào Form
        if (DOM.metaTitle) { DOM.metaTitle.value = data.meta_title || ""; DOM.metaTitle.dispatchEvent(new Event("input")); }
        if (DOM.metaDesc) { DOM.metaDesc.value = data.meta_description || ""; DOM.metaDesc.dispatchEvent(new Event("input")); }
        if (DOM.heroHeading) DOM.heroHeading.value = data.hero_heading || "";
        if (DOM.heroDesc) DOM.heroDesc.value = data.hero_description || "";
        if (DOM.kpiYears) DOM.kpiYears.value = data.kpi_years ?? 0;
        if (DOM.kpiBrands) DOM.kpiBrands.value = data.kpi_brands ?? 0;
        if (DOM.kpiSkus) DOM.kpiSkus.value = data.kpi_skus ?? 0;
        if (DOM.kpiCustomers) DOM.kpiCustomers.value = data.kpi_customers ?? 0;
        if (state.editor) state.editor.setData(data.html_content || "");

    } catch (error) {
        console.error("Lỗi tải About:", error);
        showToast(`Không thể tải dữ liệu: ${error.message}`, "error");
    } finally {
        setPageLoading(false);
    }
}

/* ========================================================
   SAVE DATA
======================================================== */
function buildPayload() {
    return {
        id: state.recordId,
        meta_title: DOM.metaTitle?.value.trim() || "",
        meta_description: DOM.metaDesc?.value.trim() || "",
        hero_heading: DOM.heroHeading?.value.trim() || "",
        hero_description: DOM.heroDesc?.value.trim() || "",
        kpi_years: getNumber(DOM.kpiYears),
        kpi_brands: getNumber(DOM.kpiBrands),
        kpi_skus: getNumber(DOM.kpiSkus),
        kpi_customers: getNumber(DOM.kpiCustomers),
        html_content: state.editor ? state.editor.getData() : "",
        updated_at: new Date().toISOString()
    };
}

window.saveContent = async function () {
    if (state.isSaving) return;

    const payload = buildPayload();
    
    // Validate nhanh
    if (payload.meta_title.length > 60) return showToast("Meta Title không được vượt quá 60 ký tự.", "warning");
    if (payload.meta_description.length > 160) return showToast("Meta Description không được vượt quá 160 ký tự.", "warning");
    if (!payload.hero_heading) return showToast("Vui lòng nhập tiêu đề Hero.", "warning");

    state.isSaving = true;
    setSaveLoading(true);

    try {
        const { error } = await window.supabaseClient.from("about").upsert(payload);
        if (error) throw error;
        showToast("Lưu nội dung thành công!", "success");
    } catch (error) {
        console.error("Lỗi lưu About:", error);
        showToast(`Lỗi khi lưu: ${error.message}`, "error");
    } finally {
        state.isSaving = false;
        setSaveLoading(false);
    }
};

/* ========================================================
   INIT
======================================================== */
document.addEventListener("DOMContentLoaded", async () => {
    initSeoCounters();
    try {
        await initEditor();
        await loadAboutData();
    } catch (error) {
        console.error("Lỗi khởi tạo trang About:", error);
        showToast(`Không thể khởi tạo trang: ${error.message}`, "error");
    }
});