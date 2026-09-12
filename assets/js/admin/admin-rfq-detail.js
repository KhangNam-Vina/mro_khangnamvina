// ========================================================
// FILE: assets/js/admin/admin-rfq-detail.js 
// ========================================================

const state = {
    rfqId: null,
    rfqData: null
};

const DOM = {
    emptyState: document.getElementById('emptyState'),
    rfqDetailContent: document.getElementById('rfqDetailContent'),
    
    // Thông tin cơ bản
    lblRfqCode: document.getElementById('lblRfqCode'),
    lblDate: document.getElementById('lblDate'),
    lblStatus: document.getElementById('lblStatus'),
    lblCompany: document.getElementById('lblCompany'),
    lblName: document.getElementById('lblName'),
    lblPhone: document.getElementById('lblPhone'),
    lblEmail: document.getElementById('lblEmail'),
    lblNotes: document.getElementById('lblNotes'),
    
    // Bảng vật tư & Ô tìm kiếm
    itemList: document.getElementById('itemList'),
    searchInput: document.getElementById('searchInput'),
    btnSearch: document.getElementById('btnSearchRfq'),

    // Nút thao tác
    btnReject: document.getElementById('btnRejectRfq'),
    btnApprove: document.getElementById('btnApproveRfq')
};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    state.rfqId = urlParams.get('id');

    // Sự kiện tìm kiếm
    if (DOM.btnSearch && DOM.searchInput) {
        DOM.btnSearch.addEventListener('click', searchRFQ);
        DOM.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchRFQ();
        });
    }

    // Sự kiện cập nhật trạng thái
    if (DOM.btnReject) {
    DOM.btnReject.addEventListener(
        'click',
        () => updateRfqStatus('Từ chối')
    );
}
    if (DOM.btnApprove) {
        DOM.btnApprove.addEventListener('click', () => updateRfqStatus('Đã báo giá'));
    }

    // Sự kiện Logout
    const btnLogout = document.getElementById('btnAdminLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await window.supabaseClient.auth.signOut();
            window.location.replace("login.html");
        });
    }

    if (!state.rfqId) {
        if (DOM.emptyState) DOM.emptyState.classList.remove('hidden');
        if (DOM.rfqDetailContent) DOM.rfqDetailContent.classList.add('hidden');
        return;
    }

    if (DOM.emptyState) DOM.emptyState.classList.add('hidden');
    if (DOM.rfqDetailContent) DOM.rfqDetailContent.classList.remove('hidden');

    fetchRfqDetail();

    const btnExport = document.getElementById("btnExportPdf");
    if(btnExport){
        btnExport.addEventListener("click", exportPDF);
    }
});

// --------------------------------------------------------
// GỌI API & ĐỔ DỮ LIỆU
// --------------------------------------------------------
async function fetchRfqDetail() {
    try {
        const { data, error } = await window.supabaseClient
        .from('rfqs')
        .select('*') 
        .eq('id', state.rfqId)
        .single();
        
        if (error) throw error;
        if (!data) throw new Error("Không tìm thấy dữ liệu yêu cầu.");

        state.rfqData = data;
        renderRfqInfo();
        renderProducts();

    } catch (error) {
        console.error(error);
        if (DOM.emptyState) DOM.emptyState.classList.remove('hidden');
        if (DOM.rfqDetailContent) DOM.rfqDetailContent.classList.add('hidden');
    }
}

async function updateRfqStatus(newStatus) {

    // ====================================================
    // 1. XÁC NHẬN THAO TÁC
    // ====================================================

    if (
        !confirm(
            `Xác nhận chuyển trạng thái RFQ thành: ${newStatus}?`
        )
    ) {
        return;
    }


    // ====================================================
    // 2. NẾU TỪ CHỐI → BẮT BUỘC NHẬP LÝ DO
    // ====================================================

    let rejectionReason = null;


    if (newStatus === 'Từ chối') {

        rejectionReason = prompt(
            'Nhập lý do từ chối RFQ:'
        );


        // Admin bấm Cancel
        if (rejectionReason === null) {
            return;
        }


        // Xóa khoảng trắng đầu/cuối
        rejectionReason =
            rejectionReason.trim();


        // Không cho lý do rỗng
        if (!rejectionReason) {

            alert(
                'Vui lòng nhập lý do từ chối.'
            );

            return;
        }

    }


    // ====================================================
    // 3. CHUẨN BỊ DATA UPDATE
    // ====================================================

    const updateData = {
        status: newStatus
    };


    // Nếu từ chối → lưu lý do
    if (newStatus === 'Từ chối') {

        updateData.rejection_reason =
            rejectionReason;

    } else {

        // Nếu chuyển sang trạng thái khác
        // → xóa lý do từ chối cũ

        updateData.rejection_reason = null;

    }


    // ====================================================
    // 4. UPDATE SUPABASE
    // ====================================================

    try {

        const { error } =
            await window.supabaseClient

                .from('rfqs')

                .update(updateData)

                .eq(
                    'id',
                    state.rfqId
                );


        if (error) {
            throw error;
        }


        // ====================================================
        // 5. THÔNG BÁO THÀNH CÔNG
        // ====================================================

        if (
            window.utils &&
            window.utils.showToast
        ) {

            window.utils.showToast(
                'Cập nhật trạng thái thành công!',
                'success'
            );

        } else {

            alert(
                'Cập nhật trạng thái thành công!'
            );

        }


        // ====================================================
        // 6. CẬP NHẬT STATE
        // ====================================================

        state.rfqData.status =
            newStatus;

        state.rfqData.rejection_reason =
            rejectionReason;


        // ====================================================
        // 7. RENDER LẠI GIAO DIỆN
        // ====================================================

        renderRfqInfo();


    } catch (error) {

        console.error(
            '[admin-rfq-detail] Update status error:',
            error
        );


        if (
            window.utils &&
            window.utils.showToast
        ) {

            window.utils.showToast(
                'Lỗi cập nhật: ' +
                error.message,
                'error'
            );

        } else {

            alert(
                'Lỗi cập nhật: ' +
                error.message
            );

        }

    }

}

// --------------------------------------------------------
// TÌM KIẾM DỘI NGƯỢC VỀ DASHBOARD
// --------------------------------------------------------
function searchRFQ() {
    if(!DOM.searchInput) return;
    const val = DOM.searchInput.value.trim();
    if (val) {
        window.location.href = `dashboard.html?search=${encodeURIComponent(val)}`;
    }
}

// --------------------------------------------------------
// XỬ LÝ GIAO DIỆN (UI)
// --------------------------------------------------------
function renderRfqInfo() {
    const data = state.rfqData;
    if (!data) return;

    const escapeHTML = window.utils && window.utils.escapeHTML ? window.utils.escapeHTML : (str) => String(str).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);

    if (DOM.lblRfqCode) DOM.lblRfqCode.textContent = escapeHTML(data.rfq_code || `RFQ-${data.id}`);
    
    if (DOM.lblDate) {
        const dateObj = new Date(data.created_at);
        DOM.lblDate.textContent = isNaN(dateObj) ? '-' : dateObj.toLocaleString('vi-VN');
    }
    
    if (DOM.lblCompany) DOM.lblCompany.textContent = escapeHTML(data.company_name) || 'Khách vãng lai';
    if (DOM.lblName) DOM.lblName.textContent = escapeHTML(data.contact_person || data.name) || '-';
    if (DOM.lblPhone) DOM.lblPhone.textContent = escapeHTML(data.phone) || '-';
    if (DOM.lblEmail) DOM.lblEmail.textContent = escapeHTML(data.email) || '-';
    if (DOM.lblNotes) DOM.lblNotes.textContent = escapeHTML(data.notes || data.note) || 'Không có ghi chú';
    
    if (DOM.lblStatus) {
        const status = escapeHTML(data.status) || 'Chờ xử lý';
        DOM.lblStatus.textContent = status;
        DOM.lblStatus.className = "px-4 py-1.5 rounded-full text-sm font-bold border ";
        
        if (status === 'Chờ xử lý') DOM.lblStatus.className += "bg-orange-100 text-orange-600 border-orange-200";
        else if (status === 'Đã báo giá') DOM.lblStatus.className += "bg-blue-100 text-blue-700 border-blue-200";
        else if (status === 'Từ chối') DOM.lblStatus.className += "bg-red-100 text-red-600 border-red-200";
        else DOM.lblStatus.className += "bg-gray-100 text-gray-600 border-gray-200";
    }

    const actionButtons = document.getElementById('actionButtons');
    if (actionButtons) {
        const currentStatus = data.status || 'Chờ xử lý';
        if (currentStatus !== 'Chờ xử lý') {
            actionButtons.classList.add('hidden');
        } else {
            actionButtons.classList.remove('hidden');
        }
    }
}

function renderProducts() {
    if (!DOM.itemList) return;
    
    const items = state.rfqData.items || [];
    
    if (items.length === 0) {
        DOM.itemList.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-500 italic">Không có vật tư nào được yêu cầu trong đơn này.</td></tr>`;
        return;
    }

    // Hàm bọc escape an toàn
    const safeEscape = (val) => {
        const str = String(val ?? "");
        if (window.utils && window.utils.escapeHTML) return window.utils.escapeHTML(str);
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

    DOM.itemList.innerHTML = items.map((item, index) => {
        // Đã FIX chống lỗi crash bằng String()
        const safeName = safeEscape(String(item.name ?? "Sản phẩm không xác định"));
        const sku = safeEscape(String(item.sku ?? "-"));
        const size = safeEscape(String(item.size ?? "-"));
        const qty = safeEscape(String(item.qty ?? item.quantity ?? 1));
        
        return `
            <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                <td class="px-6 py-4 text-center text-gray-500">${index + 1}</td>
                <td class="px-6 py-4 font-bold text-kn-blue">${sku}</td>
                <td class="px-6 py-4 font-medium text-gray-800">${safeName}</td>
                <td class="px-6 py-4 text-center font-bold text-gray-700">${size}</td>
                <td class="px-6 py-4 text-center font-black text-kn-orange text-lg">${qty}</td>
            </tr>
        `;
    }).join('');
}

// --------------------------------------------------------
// XUẤT FILE PDF
// --------------------------------------------------------
async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const data = state.rfqData;

    pdf.setFontSize(20);
    pdf.text("KHANG NAM VINA", 105, 15, { align: "center" });
    pdf.setFontSize(15);
    pdf.text("YEU CAU BAO GIA (RFQ)", 105, 25, { align: "center" });

    pdf.setFontSize(11);
    pdf.text(`Ma RFQ: ${data.rfq_code || data.id}`, 15, 40);
    pdf.text(`Ngay tao: ${new Date(data.created_at).toLocaleString("vi-VN")}`, 15, 48);
    pdf.text(`Cong ty: ${data.company_name || ""}`, 15, 60);
    pdf.text(`Nguoi lien he: ${data.contact_person || data.name || ""}`, 15, 68);
    pdf.text(`Dien thoai: ${data.phone || ""}`, 15, 76);
    pdf.text(`Email: ${data.email || ""}`, 15, 84);
    pdf.text(`Trang thai: ${data.status}`, 15, 92);
    pdf.text("Ghi chu:", 15, 104);
    pdf.text(data.notes || "Khong co", 15, 112);

    const rows = [];

    // Cập nhật PDF thêm cột SIZE
    (data.items || []).forEach((item, index) => {
        rows.push([
            String(index + 1),
            String(item.sku || ""),
            String(item.name || ""),
            String(item.size || "-"),
            String(item.qty ?? item.quantity ?? 1)
        ]);
    });

    pdf.autoTable({
        startY: 125,
        head: [["STT", "SKU", "Ten san pham", "Size", "SL"]],
        body: rows,
        theme: "grid",
        headStyles: {
            fillColor: [0, 71, 155]
        }
    });

    pdf.save(`${data.rfq_code || data.id}.pdf`);
}