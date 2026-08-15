// ========================================================
// FILE: assets/js/admin/admin-dashboard.js
// BẢN FIX: TÍCH HỢP PHÂN TRANG VÀO BẢNG RFQ & ĐỒNG BỘ KPI LIÊN HỆ
// ========================================================

const DOM = {
    kpiRfq: document.getElementById('kpiRfq'),
    kpiContact: document.getElementById('kpiContact'),
    kpiProduct: document.getElementById('kpiProduct'),
    kpiBlog: document.getElementById('kpiBlog'),
    searchInput: document.getElementById('quickSearchInput'),
    chartCtx: document.getElementById('monthlyChart'),
    chartMonthFilter: document.getElementById('chartMonthFilter'),
    rfqTableBody: document.getElementById('rfqTableBody'),
    pagination: document.getElementById('dashboardContactPagination') 
};

// State quản lý Báo giá
let allRFQs = [];
let currentFilter = 'Chờ xử lý'; 
let rfqCurrentPage = 1;
const rfqItemsPerPage = 5; 

document.addEventListener('DOMContentLoaded', async () => {
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();
            handleSearch(keyword);
        });
    }

    const btnLogout = document.getElementById('btnAdminLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await window.supabaseClient.auth.signOut();
            window.location.replace("login.html");
        });
    }

    if (DOM.chartMonthFilter) {
        const today = new Date();
        // Set giá trị mặc định lúc mới mở web là tháng hiện tại (Format: YYYY-MM)
        DOM.chartMonthFilter.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        // Bắt sự kiện khi Admin chọn tháng khác
        DOM.chartMonthFilter.addEventListener('change', (e) => {
            if (e.target.value) {
                const [year, month] = e.target.value.split('-');
                // Chốt ngày là mùng 1 của tháng/năm Admin vừa chọn
                const selectedDate = new Date(year, month - 1, 1); 
                loadChartData(selectedDate); // Gọi lại hàm vẽ biểu đồ
            }
        });
    }

    await Promise.all([ loadKPIs(), loadChartData(), loadRFQList() ]);
}); 

// ==========================================
// 1. TẢI CHỈ SỐ KPI (Đã cập nhật đếm contact pending)
// ==========================================
async function loadKPIs() {
    try {
        const pRfq = window.supabaseClient.from('rfqs').select('id', { count: 'exact', head: true }).eq('status', 'Chờ xử lý');
        // Đã thêm điều kiện eq('status', 'pending') để đồng bộ với tính năng duyệt liên hệ
        const pContact = window.supabaseClient.from('contacts').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        const pProduct = window.supabaseClient.from('products').select('id', { count: 'exact', head: true });
        const pBlog = window.supabaseClient.from('blogs').select('id', { count: 'exact', head: true });

        const [resRfq, resContact, resProduct, resBlog] = await Promise.all([pRfq, pContact, pProduct, pBlog]);

        if (DOM.kpiRfq) DOM.kpiRfq.innerText = resRfq.count || 0;
        if (DOM.kpiContact) DOM.kpiContact.innerText = resContact.count || 0;
        if (DOM.kpiProduct) DOM.kpiProduct.innerText = resProduct.count || 0;
        if (DOM.kpiBlog) DOM.kpiBlog.innerText = resBlog.count || 0;
    } catch (error) {
        console.error("Lỗi kéo data KPI:", error);
    }
}

// ==========================================
// 2. TẢI BẢNG DANH SÁCH RFQ VÀ PHÂN TRANG
// ==========================================
async function loadRFQList() {
    try {
        const { data, error } = await window.supabaseClient
        .from('rfqs')
        .select('*') 
        .order('created_at', { ascending: false });

        if (error) throw error;
        allRFQs = data || [];
        renderTable(currentFilter);
        
    } catch (error) {
        if (DOM.rfqTableBody) {
            DOM.rfqTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500 font-bold">Lỗi tải dữ liệu đơn hàng.</td></tr>`;
        }
    }
}

// Hàm render Bảng có cắt trang
function renderTable(filterStatus) {
    if (!DOM.rfqTableBody) return;

    let filteredData = allRFQs;
    if (filterStatus !== 'Tất cả') {
        filteredData = allRFQs.filter(item => item.status === filterStatus);
    }

    if (filteredData.length === 0) {
        DOM.rfqTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400 italic bg-gray-50/50">Không có đơn yêu cầu nào ở trạng thái này.</td></tr>`;
        if (DOM.pagination) DOM.pagination.innerHTML = ''; 
        return;
    }

    // LOGIC CẮT PHÂN TRANG
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / rfqItemsPerPage);
    if (rfqCurrentPage > totalPages) rfqCurrentPage = totalPages;

    const startIndex = (rfqCurrentPage - 1) * rfqItemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + rfqItemsPerPage);

    const escapeHTML = window.utils && window.utils.escapeHTML ? window.utils.escapeHTML : (str) => str;

    DOM.rfqTableBody.innerHTML = paginatedData.map(rfq => {
        const rawName = rfq.company_name || rfq.customer_name || rfq.name || 'Khách vãng lai';
        const companyName = escapeHTML(rawName);
        const dateStr = new Date(rfq.created_at).toLocaleString('vi-VN');
        const status = escapeHTML(rfq.status || 'Chờ xử lý');
        
        let badgeClass = "bg-gray-100 text-gray-600 border-gray-200";
        if (status === 'Chờ xử lý') badgeClass = "bg-orange-50 text-orange-600 border-orange-200";
        if (status === 'Đã báo giá') badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
        if (status === 'Từ chối') badgeClass = "bg-red-50 text-red-600 border-red-200";

        return `
            <tr class="hover:bg-gray-50 transition border-b border-gray-100 group">
                <td class="px-6 py-4 font-bold text-gray-600 text-xs">#${escapeHTML(rfq.rfq_code || rfq.id)}</td>
                <td class="px-6 py-4 font-bold text-gray-900">${companyName}</td>
                <td class="px-6 py-4 text-gray-500 text-xs">${dateStr}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-md text-xs font-bold border ${badgeClass}">${status}</span>
                </td>
                <td class="px-6 py-4 text-center">
                    <a href="manage-rfq-detail.html?id=${escapeHTML(rfq.id)}" class="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-900 hover:text-white hover:border-gray-900 transition shadow-sm">
                        Xử lý đơn &rarr;
                    </a>
                </td>
            </tr>
        `;
    }).join('');

    renderPagination(totalItems, totalPages);
}

// Hàm vẽ nút Phân trang
function renderPagination(totalItems, totalPages) {
    if (!DOM.pagination) return;
    
    DOM.pagination.innerHTML = '';
    if (totalPages <= 1) return;

    let html = `<button onclick="window.changePage(${rfqCurrentPage - 1})" ${rfqCurrentPage === 1 ? 'disabled class="px-2.5 py-1.5 rounded-lg text-gray-400 bg-transparent"' : 'class="px-2.5 py-1.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm font-bold transition"'}>&laquo; Prev</button><div class="flex space-x-1">`;
    
    for (let i = 1; i <= totalPages; i++) {
        html += `<button onclick="window.changePage(${i})" class="px-3 py-1.5 rounded-lg font-bold shadow-sm transition ${i === rfqCurrentPage ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}">${i}</button>`;
    }
    
    html += `</div><button onclick="window.changePage(${rfqCurrentPage + 1})" ${rfqCurrentPage === totalPages ? 'disabled class="px-2.5 py-1.5 rounded-lg text-gray-400 bg-transparent"' : 'class="px-2.5 py-1.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm font-bold transition"'}>Next &raquo;</button>`;
    
    DOM.pagination.innerHTML = html;
}

// Bắt sự kiện chuyển trang
window.changePage = function(page) {
    rfqCurrentPage = page;
    renderTable(currentFilter);
};

// Xử lý Lọc Tab
window.filterRFQs = function(status) {
    currentFilter = status;
    rfqCurrentPage = 1; 
    
    const tabs = {
        'Chờ xử lý': document.getElementById('btnFilterPending'),
        'Đã báo giá': document.getElementById('btnFilterDone'),
        'Tất cả': document.getElementById('btnFilterAll')
    };

    Object.values(tabs).forEach(btn => {
        if(btn) btn.className = "px-3 py-1 font-bold text-xs rounded-md text-gray-600 hover:bg-gray-200 transition";
    });

    if (tabs[status]) {
        if (status === 'Chờ xử lý') tabs[status].className = "px-3 py-1 font-bold text-xs rounded-md bg-white text-kn-orange shadow-sm transition";
        else if (status === 'Đã báo giá') tabs[status].className = "px-3 py-1 font-bold text-xs rounded-md bg-white text-kn-blue shadow-sm transition";
        else tabs[status].className = "px-3 py-1 font-bold text-xs rounded-md bg-white text-gray-900 shadow-sm transition";
    }

    if(DOM.searchInput) DOM.searchInput.value = '';
    renderTable(status);
}

// Xử lý Tìm kiếm
function handleSearch(keyword) {
    rfqCurrentPage = 1; 
    
    if (!keyword) { renderTable(currentFilter); return; }

    const searchResult = allRFQs.filter(rfq => {
        const rawName = rfq.company_name || rfq.customer_name || rfq.name || '';
        const comp = rawName.toLowerCase();
        const id = String(rfq.id);
        const code = String(rfq.rfq_code).toLowerCase();
        return comp.includes(keyword) || id.includes(keyword) || code.includes(keyword);
    });
    
    if (searchResult.length === 0) {
        DOM.rfqTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-500">Không tìm thấy đơn hàng nào khớp với "${window.utils.escapeHTML(keyword)}"</td></tr>`;
        if (DOM.pagination) DOM.pagination.innerHTML = '';
        return;
    }
    
    const oldAllRFQs = allRFQs;
    allRFQs = searchResult;
    renderTable('Tất cả'); 
    allRFQs = oldAllRFQs; 
}

// ==========================================
// 3. TẢI BIỂU ĐỒ (CHART.JS) - ĐÃ FIX CHUẨN PERFORMANCE
// ==========================================
async function loadChartData(selectedDate = new Date()) {
    if (!DOM.chartCtx) return;
    try {
        const last6Months = []; 
        const labels = []; 
        const monthlyCounts = {};
        
        // 🔴 1. TÍNH TOÁN KHOẢNG THỜI GIAN (Dựa vào filter tháng)
        // Chốt ngày cuối cùng của tháng được chọn (Lúc 23:59:59)
        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);
        let startDate;

        for (let i = 5; i >= 0; i--) {
            // Lùi dần về 5 tháng trước đó
            const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - i, 1);
            
            // Lưu lại mốc tháng xa nhất làm điểm bắt đầu query
            if (i === 5) startDate = d; 
            
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            last6Months.push(key); 
            labels.push(`T${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
            monthlyCounts[key] = 0;
        }

        // 🟡 2. TRUY VẤN TỐI ƯU HIỆU NĂNG (Range Query)
        // Chỉ bốc đúng data nằm giữa startDate và endDate
        const { data: rfqs, error } = await window.supabaseClient
            .from('rfqs')
            .select('created_at')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (error) throw error;

        // Phân loại data vào đúng tháng
        if (rfqs) {
            rfqs.forEach(rfq => {
                const date = new Date(rfq.created_at);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyCounts[monthKey] !== undefined) {
                    monthlyCounts[monthKey]++;
                }
            });
        }

        // 3. XỬ LÝ CHART.JS
        const dataValues = last6Months.map(k => monthlyCounts[k]);
        
        if (window.dashboardChart) {
            window.dashboardChart.destroy();
        }
        
        window.dashboardChart = new Chart(DOM.chartCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Yêu cầu Báo giá',
                    data: dataValues,
                    backgroundColor: '#111827',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
                    x: { grid: { display: false } }
                }
            }
        });
    } catch (error) { 
        console.error("Lỗi vẽ biểu đồ:", error);
        // 🟡 3. HIỂN THỊ LỖI UX CHUẨN
        if (window.utils && window.utils.showToast) {
            window.utils.showToast("Không thể tải dữ liệu biểu đồ: " + error.message, "error");
        }
    }
}