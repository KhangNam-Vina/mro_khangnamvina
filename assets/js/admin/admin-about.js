// ========================================================
// FILE: assets/js/admin/admin-about.js
// QUẢN LÝ TRANG GIỚI THIỆU (AUTO UPLOAD + AUTO CLEANUP ẢNH)
// ========================================================

const state = {
    editor: null,
    recordId: 1,
    isLoading: false,
    isSaving: false,
    oldHtmlContent: "" // <-- Biến mới: Dùng để ghi nhớ nội dung cũ trước khi sửa
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
   BỘ NÃO 1: AUTO UPLOAD ẢNH LÊN SUPABASE
======================================================== */
class SupabaseUploadAdapter {
    constructor(loader) {
        this.loader = loader;
    }

    upload() {
        return this.loader.file.then(
            file =>
                new Promise(async (resolve, reject) => {
                    try {
                        if (!window.supabaseClient) throw new Error("Supabase chưa kết nối");

                        const fileExt = file.name.split('.').pop();
                        const fileName = `about_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                        const filePath = `uploads/${fileName}`; 

                        const { data, error } = await window.supabaseClient.storage
                            .from('product-images')
                            .upload(filePath, file, { cacheControl: '3600', upsert: false });

                        if (error) throw error;

                        const { data: publicUrlData } = window.supabaseClient.storage
                            .from('product-images')
                            .getPublicUrl(filePath);

                        if (!publicUrlData || !publicUrlData.publicUrl) {
                            throw new Error("Không lấy được URL ảnh");
                        }

                        resolve({ default: publicUrlData.publicUrl });
                    } catch (error) {
                        console.error("Lỗi upload ảnh CKEditor:", error);
                        reject(error.message || "Không thể upload ảnh");
                    }
                })
        );
    }
    abort() {}
}

function SupabaseUploadAdapterPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = loader => {
        return new SupabaseUploadAdapter(loader);
    };
}

/* ========================================================
   CKEDITOR 5 INIT
======================================================== */
async function initEditor() {
    if (!DOM.editorContainer) throw new Error("Không tìm thấy CKEditor container.");
    if (typeof CKEDITOR === "undefined") throw new Error("CKEditor chưa được tải.");

    state.editor = await CKEDITOR.ClassicEditor.create(DOM.editorContainer, {
        extraPlugins: [SupabaseUploadAdapterPlugin],
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

        if (DOM.metaTitle) { DOM.metaTitle.value = data.meta_title || ""; DOM.metaTitle.dispatchEvent(new Event("input")); }
        if (DOM.metaDesc) { DOM.metaDesc.value = data.meta_description || ""; DOM.metaDesc.dispatchEvent(new Event("input")); }
        if (DOM.heroHeading) DOM.heroHeading.value = data.hero_heading || "";
        if (DOM.heroDesc) DOM.heroDesc.value = data.hero_description || "";
        if (DOM.kpiYears) DOM.kpiYears.value = data.kpi_years ?? 0;
        if (DOM.kpiBrands) DOM.kpiBrands.value = data.kpi_brands ?? 0;
        if (DOM.kpiSkus) DOM.kpiSkus.value = data.kpi_skus ?? 0;
        if (DOM.kpiCustomers) DOM.kpiCustomers.value = data.kpi_customers ?? 0;
        
        // Lưu lại nội dung cũ để sau này đối chiếu dọn rác
        state.oldHtmlContent = data.html_content || "";
        if (state.editor) state.editor.setData(state.oldHtmlContent);

    } catch (error) {
        console.error("Lỗi tải About:", error);
        showToast(`Không thể tải dữ liệu: ${error.message}`, "error");
    } finally {
        setPageLoading(false);
    }
}

/* ========================================================
   BỘ NÃO 2: HÀM LỌC ĐƯỜNG DẪN ẢNH TỪ HTML
======================================================== */
function extractSupabaseImagePaths(htmlString) {
    const paths = [];
    // Regex tìm tất cả các thẻ <img> và bóc tách thuộc tính src
    const regex = /<img[^>]+src="([^">]+)"/g;
    let match;

    while ((match = regex.exec(htmlString)) !== null) {
        const url = match[1];
        // Chỉ bóc những ảnh thuộc bucket của mình (chứa /product-images/uploads/)
        if (url.includes('/storage/v1/object/public/product-images/uploads/')) {
            const parts = url.split('/product-images/');
            if (parts.length > 1) {
                paths.push(parts[1]); // Kết quả: "uploads/about_123456_abc.jpg"
            }
        }
    }
    return paths;
}


/* ========================================================
   SAVE DATA & AUTO CLEANUP
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
    
    if (payload.meta_title.length > 60) return showToast("Meta Title không được vượt quá 60 ký tự.", "warning");
    if (payload.meta_description.length > 160) return showToast("Meta Description không được vượt quá 160 ký tự.", "warning");
    if (!payload.hero_heading) return showToast("Vui lòng nhập tiêu đề Hero.", "warning");

    state.isSaving = true;
    setSaveLoading(true);

    try {
        // --- BƯỚC 1: DỌN RÁC (TÌM VÀ XÓA ẢNH ĐÃ BỊ LOẠI BỎ) ---
        const oldImagePaths = extractSupabaseImagePaths(state.oldHtmlContent);
        const newImagePaths = extractSupabaseImagePaths(payload.html_content);
        
        // Tìm những ảnh có ở nội dung cũ nhưng KHÔNG CÓ ở nội dung mới
        const pathsToDelete = oldImagePaths.filter(path => !newImagePaths.includes(path));

        if (pathsToDelete.length > 0) {
            console.log("Phát hiện ảnh rác, tiến hành dọn dẹp:", pathsToDelete);
            const { error: removeError } = await window.supabaseClient.storage
                .from('product-images')
                .remove(pathsToDelete);
            if (removeError) console.error("Lỗi khi xóa ảnh thừa:", removeError);
        }

        // --- BƯỚC 2: LƯU NỘI DUNG MỚI VÀO DATABASE ---
        const { error } = await window.supabaseClient.from("about").upsert(payload);
        if (error) throw error;
        
        // Cập nhật lại HTML cũ bằng HTML mới để chuẩn bị cho lần sửa tiếp theo
        state.oldHtmlContent = payload.html_content;

        showToast("Lưu nội dung thành công! Đã dọn dẹp hệ thống.", "success");
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