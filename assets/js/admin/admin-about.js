// ========================================================
// FILE: assets/js/admin/admin-about.js
// NÂNG CẤP: Toast UI, SEO Counters, Mobile Menu
// ========================================================

let myEditor;

const DOM = {
    toastContainer: document.getElementById('toastContainer'),
    metaTitle: document.getElementById('metaTitle'),
    metaDesc: document.getElementById('metaDesc'),
    titleCount: document.getElementById('metaTitleCount'),
    descCount: document.getElementById('metaDescCount')
};

// --- TIỆN ÍCH UI ---
const utils = {
    showToast: (message, type = 'success') => {
        if (!DOM.toastContainer) return;
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const toast = document.createElement('div');
        toast.className = `${bgColor} text-white px-4 py-2 rounded shadow-lg transform transition-all duration-300 translate-y-0 opacity-100 font-bold text-sm flex items-center gap-2`;
        toast.innerHTML = type === 'success' ? `<span>✔</span> ${message}` : `<span>⚠</span> ${message}`;
        DOM.toastContainer.appendChild(toast);
        setTimeout(() => { 
            toast.classList.add('opacity-0', 'translate-y-2'); 
            setTimeout(() => toast.remove(), 300); 
        }, 3000);
    }
};

// --- LOGIC TOGGLE SIDEBAR MOBILE ---
window.toggleSidebar = function() {
    const sidebar = document.getElementById('adminSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
    }
};

// --- LOGIC BỘ ĐẾM SEO ---
function initSeoCounters() {
    const updateCount = (input, counter, max) => {
        const len = input.value.length;
        counter.innerText = `${len} / ${max}`;
        if (len >= max) counter.classList.replace('text-gray-500', 'text-red-500');
        else counter.classList.replace('text-red-500', 'text-gray-500');
    };

    if (DOM.metaTitle && DOM.titleCount) {
        DOM.metaTitle.addEventListener('input', () => updateCount(DOM.metaTitle, DOM.titleCount, 60));
    }
    if (DOM.metaDesc && DOM.descCount) {
        DOM.metaDesc.addEventListener('input', () => updateCount(DOM.metaDesc, DOM.descCount, 160));
    }
}

// --- KHỞI TẠO ---
document.addEventListener('DOMContentLoaded', async () => {
    initSeoCounters();

    try {
        myEditor = await CKEDITOR.ClassicEditor.create(document.querySelector('#ckEditorContainer'), {
            toolbar: {
                items: [
                    'sourceEditing', '|',
                    'heading', '|',
                    'bold', 'italic', 'underline', 'strikethrough', 'removeFormat', '|',
                    'alignment', '|',
                    'bulletedList', 'numberedList', '|',
                    'outdent', 'indent', '|',
                    'link', 'insertImage', 'insertTable', 'blockQuote', 'horizontalLine', '|',
                    'undo', 'redo'
                ],
                shouldNotGroupWhenFull: true
            },
            htmlSupport: {
                allow: [{ name: /.*/, attributes: true, classes: true, styles: true }]
            },
            removePlugins: [
                'CKBox', 'CKFinder', 'EasyImage', 'RealTimeCollaborativeComments', 
                'RealTimeCollaborativeTrackChanges', 'RealTimeCollaborativeRevisionHistory', 
                'PresenceList', 'Comments', 'TrackChanges', 'TrackChangesData', 
                'RevisionHistory', 'Pagination', 'WProofreader', 'MathType',
                'DocumentOutline', 'FormatPainter', 'TableOfContents', 'SlashCommand', 
                'Template', 'ExportPdf', 'ExportWord', 'PasteFromOfficeEnhanced', 'CaseChange'
            ]
        });

        await loadAboutData();
    } catch (error) {
        console.error("Lỗi khởi tạo CKEditor:", error);
    }
});

// --- TẢI DATA ---
async function loadAboutData() {
    const loading = document.getElementById('loadingIndicator');
    const wrapper = document.getElementById('editorWrapper');

    if (loading) loading.classList.remove('hidden');
    if (wrapper) wrapper.classList.add('hidden');

    try {
        const { data, error } = await window.supabaseClient
            .from('about')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            if (DOM.metaTitle) { DOM.metaTitle.value = data.meta_title || ''; DOM.metaTitle.dispatchEvent(new Event('input')); }
            if (DOM.metaDesc) { DOM.metaDesc.value = data.meta_description || ''; DOM.metaDesc.dispatchEvent(new Event('input')); }
            
            document.getElementById('heroHeading').value = data.hero_heading || '';
            document.getElementById('heroDesc').value = data.hero_description || '';
            document.getElementById('kpiYears').value = data.kpi_years || 0;
            document.getElementById('kpiBrands').value = data.kpi_brands || 0;
            document.getElementById('kpiSkus').value = data.kpi_skus || 0;
            document.getElementById('kpiCustomers').value = data.kpi_customers || 0;

            if (data.html_content) {
                myEditor.setData(data.html_content);
            }
        }
    } catch (error) {
        utils.showToast("Không thể tải dữ liệu trang!", "error");
    } finally {
        if (loading) loading.classList.add('hidden');
        if (wrapper) wrapper.classList.remove('hidden');
    }
}

// --- LƯU DATA ---
window.saveContent = async function() {
    const btn = document.getElementById('btnSave');
    btn.disabled = true;
    btn.innerHTML = "Đang lưu...";

    const payload = {
        id: 1,
        meta_title: DOM.metaTitle.value.trim(),
        meta_description: DOM.metaDesc.value.trim(),
        hero_heading: document.getElementById('heroHeading').value.trim(),
        hero_description: document.getElementById('heroDesc').value.trim(),
        kpi_years: parseInt(document.getElementById('kpiYears').value) || 0,
        kpi_brands: parseInt(document.getElementById('kpiBrands').value) || 0,
        kpi_skus: parseInt(document.getElementById('kpiSkus').value) || 0,
        kpi_customers: parseInt(document.getElementById('kpiCustomers').value) || 0,
        html_content: myEditor.getData(),
        updated_at: new Date().toISOString()
    };

    try {
        const { error } = await window.supabaseClient.from('about').upsert(payload);
        if (error) throw error;
        
        utils.showToast("Lưu nội dung thành công! Trang khách hàng đã được cập nhật.", "success");
    } catch (error) {
        utils.showToast("Lỗi khi lưu: " + error.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Lưu Thay Đổi";
    }
}