// ========================================================
// FILE: assets/js/admin/admin-rfq-detail.js 
// ĐÃ ĐỒNG BỘ MÀU TRẠNG THÁI CHUẨN
// ========================================================

const state = {
    rfqId: null,
    rfqData: null
};

const DOM = {
    emptyState: document.getElementById('emptyState'),
    rfqDetailContent: document.getElementById('rfqDetailContent'),
    lblRfqCode: document.getElementById('lblRfqCode'),
    lblDate: document.getElementById('lblDate'),
    lblStatus: document.getElementById('lblStatus'),
    lblCompany: document.getElementById('lblCompany'),
    lblName: document.getElementById('lblName'),
    lblPhone: document.getElementById('lblPhone'),
    lblEmail: document.getElementById('lblEmail'),
    lblNotes: document.getElementById('lblNotes'),
    itemList: document.getElementById('itemList'),
    searchInput: document.getElementById('searchInput'),
    btnSearch: document.getElementById('btnSearchRfq'),
    btnReject: document.getElementById('btnRejectRfq'),
    btnApprove: document.getElementById('btnApproveRfq')
};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    state.rfqId = urlParams.get('id');

    if (DOM.btnSearch && DOM.searchInput) {
        DOM.btnSearch.addEventListener('click', searchRFQ);
        DOM.searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchRFQ(); });
    }

    if (DOM.btnReject) DOM.btnReject.addEventListener('click', () => updateRfqStatus('Từ chối'));
    if (DOM.btnApprove) DOM.btnApprove.addEventListener('click', () => updateRfqStatus('Đã báo giá'));

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
    if(btnExport) btnExport.addEventListener("click", exportPDF);
});

async function fetchRfqDetail() {
    try {
        const { data, error } = await window.supabaseClient
            .from('rfqs').select('*').eq('id', state.rfqId).single();
        
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
    if (!confirm(`Xác nhận chuyển trạng thái RFQ thành: ${newStatus}?`)) return;

    let rejectionReason = null;
    if (newStatus === 'Từ chối') {
        rejectionReason = prompt('Nhập lý do từ chối RFQ:');
        if (rejectionReason === null) return;
        rejectionReason = rejectionReason.trim();
        if (!rejectionReason) { alert('Vui lòng nhập lý do từ chối.'); return; }
    }

    const updateData = { status: newStatus };
    if (newStatus === 'Từ chối') updateData.rejection_reason = rejectionReason;
    else updateData.rejection_reason = null;

    try {
        const { error } = await window.supabaseClient.from('rfqs').update(updateData).eq('id', state.rfqId);
        if (error) throw error;

        if (window.utils && window.utils.showToast) window.utils.showToast('Cập nhật trạng thái thành công!', 'success');
        else alert('Cập nhật trạng thái thành công!');

        state.rfqData.status = newStatus;
        state.rfqData.rejection_reason = rejectionReason;
        renderRfqInfo();
    } catch (error) {
        console.error('[admin-rfq-detail] Update status error:', error);
        if (window.utils && window.utils.showToast) window.utils.showToast('Lỗi cập nhật: ' + error.message, 'error');
        else alert('Lỗi cập nhật: ' + error.message);
    }
}

function searchRFQ() {
    if(!DOM.searchInput) return;
    const val = DOM.searchInput.value.trim();
    if (val) window.location.href = `dashboard.html?search=${encodeURIComponent(val)}`;
}

// ĐỒNG BỘ MÀU CHUNG
function getAdminRFQStatusMeta(status) {
    const s = String(status || "Chờ xử lý").trim().toLowerCase();
    if (s.includes("từ chối") || s.includes("hủy")) return { label: status, class: "bg-red-100 text-red-700 border-red-200" };
    if (s.includes("đã báo giá") || s.includes("thành công")) return { label: status, class: "bg-green-100 text-green-700 border-green-200" };
    if (s.includes("đang xử lý")) return { label: status, class: "bg-blue-100 text-blue-700 border-blue-200" };
    return { label: status || "Chờ xử lý", class: "bg-orange-100 text-orange-700 border-orange-200" };
}

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
    
    // GẮN CHUẨN MÀU TỪ HÀM GỘP
    if (DOM.lblStatus) {
        const meta = getAdminRFQStatusMeta(data.status);
        DOM.lblStatus.textContent = escapeHTML(meta.label);
        DOM.lblStatus.className = `px-4 py-1.5 rounded-full text-sm font-bold border ${meta.class}`;
    }

    const actionButtons = document.getElementById('actionButtons');
    if (actionButtons) {
        const currentStatus = data.status || 'Chờ xử lý';
        if (currentStatus !== 'Chờ xử lý') actionButtons.classList.add('hidden');
        else actionButtons.classList.remove('hidden');
    }
}

function renderProducts() {
    if (!DOM.itemList) return;
    const items = state.rfqData.items || [];
    
    if (items.length === 0) {
        DOM.itemList.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-500 italic">Không có vật tư nào được yêu cầu trong đơn này.</td></tr>`;
        return;
    }

    const safeEscape = (val) => {
        const str = String(val ?? "");
        if (window.utils && window.utils.escapeHTML) return window.utils.escapeHTML(str);
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

    DOM.itemList.innerHTML = items.map((item, index) => {
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

async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
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
    (data.items || []).forEach((item, index) => {
        rows.push([ String(index + 1), String(item.sku || ""), String(item.name || ""), String(item.size || "-"), String(item.qty ?? item.quantity ?? 1) ]);
    });

    pdf.autoTable({
        startY: 125,
        head: [["STT", "SKU", "Ten san pham", "Size", "SL"]],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [0, 71, 155] }
    });

    pdf.save(`${data.rfq_code || data.id}.pdf`);
}