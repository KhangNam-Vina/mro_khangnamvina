// ========================================================
// FILE: assets/js/admin-dashboard.js
// XỬ LÝ SỐ LIỆU TỔNG QUAN (DASHBOARD) - CHUẨN SENIOR
// ========================================================

const DOM = {
    // KPI Cards
    kpiRfq: document.getElementById('kpiRfq'),
    kpiContact: document.getElementById('kpiContact'),
    kpiProduct: document.getElementById('kpiProduct'),
    kpiBlog: document.getElementById('kpiBlog'),
    
    // Activity Feed
    activityFeed: document.getElementById('activityFeed'),
    activitySkeleton: document.getElementById('activitySkeleton'),
    
    // Chart
    chartCtx: document.getElementById('monthlyChart')
};

const utils = {
    escapeHTML: (str) => {
        if (!str) return '';
        return str.toString().replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    },
    
    // Hàm biến đổi thời gian thành dạng "5 phút trước", "2 giờ trước"
    timeAgo: (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return "Vừa xong";
    }
};

// ==========================================
// KHỞI TẠO TẤT CẢ KHI TẢI TRANG
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Nếu có file common.js quản lý Auth thì có thể checkAuth() ở đây
    
    // Dùng Promise.all để tải song song 3 luồng data cùng lúc => Tăng tốc độ load cực xịn
    await Promise.all([
        loadKPIs(),
        loadRecentActivity(),
        loadChartData()
    ]);
});

// ==========================================
// 1. TẢI CHỈ SỐ KPI THỰC CHIẾN
// ==========================================
async function loadKPIs() {
    try {
        // Lấy số RFQ Đang chờ xử lý (Sát sườn thực tế nhất)
        const pRfq = supabaseClient.from('rfqs').select('*', { count: 'exact', head: true }).eq('status', 'Chờ xử lý');
        
        // Lấy tổng Liên hệ
        const pContact = supabaseClient.from('contacts').select('*', { count: 'exact', head: true });
        
        // Lấy tổng Sản phẩm
        const pProduct = supabaseClient.from('products').select('*', { count: 'exact', head: true });
        
        // Lấy tổng Bài viết Blog
        const pBlog = supabaseClient.from('blogs').select('*', { count: 'exact', head: true });

        // Hứng kết quả
        const [resRfq, resContact, resProduct, resBlog] = await Promise.all([pRfq, pContact, pProduct, pBlog]);

        // Đổ số liệu ra UI (Kèm hiệu ứng đếm số nếu thích múa thêm CSS)
        if (DOM.kpiRfq) DOM.kpiRfq.innerText = resRfq.count || 0;
        if (DOM.kpiContact) DOM.kpiContact.innerText = resContact.count || 0;
        if (DOM.kpiProduct) DOM.kpiProduct.innerText = resProduct.count || 0;
        if (DOM.kpiBlog) DOM.kpiBlog.innerText = resBlog.count || 0;

    } catch (error) {
        console.error("Lỗi kéo data KPI:", error);
    }
}

// ==========================================
// 2. TẢI HOẠT ĐỘNG GẦN ĐÂY (RECENT ACTIVITY)
// ==========================================
async function loadRecentActivity() {
    try {
        // Lấy 5 RFQ mới nhất
        const pRfq = supabaseClient.from('rfqs')
            .select('id, company_name, created_at, status')
            .order('created_at', { ascending: false })
            .limit(5);

        // Lấy 5 Contact mới nhất
        const pContact = supabaseClient.from('contacts')
            .select('id, name, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        const [{ data: rfqs }, { data: contacts }] = await Promise.all([pRfq, pContact]);

        let activities = [];

        // Đóng gói RFQ vào mảng chung
        if (rfqs) {
            rfqs.forEach(r => {
                activities.push({
                    type: 'rfq',
                    title: `Có Yêu cầu Báo giá mới từ <strong class="text-gray-800">${utils.escapeHTML(r.company_name || 'Khách hàng')}</strong>`,
                    time: new Date(r.created_at),
                    link: `rfq-detail.html?id=${r.id}`,
                    color: 'bg-orange-500' // Màu cam cho RFQ
                });
            });
        }

        // Đóng gói Contact vào mảng chung
        if (contacts) {
            contacts.forEach(c => {
                activities.push({
                    type: 'contact',
                    title: `<strong class="text-gray-800">${utils.escapeHTML(c.name)}</strong> vừa gửi một liên hệ cần hỗ trợ`,
                    time: new Date(c.created_at),
                    link: `manage-contacts.html`,
                    color: 'bg-red-500' // Màu đỏ cho Contact
                });
            });
        }

        // Sắp xếp trộn lẫn giảm dần theo thời gian (Mới nhất nằm trên)
        activities.sort((a, b) => b.time - a.time);
        
        // Cắt lấy đúng 6 tin mới nhất
        activities = activities.slice(0, 6);

        renderActivityFeed(activities);

    } catch (error) {
        console.error("Lỗi kéo data Hoạt động:", error);
        if (DOM.activitySkeleton) DOM.activitySkeleton.innerHTML = `<p class="text-red-500 text-sm">Lỗi tải dữ liệu!</p>`;
    }
}

function renderActivityFeed(activities) {
    if (!DOM.activitySkeleton || !DOM.activityFeed) return;

    // Giấu xương (Skeleton), Hiện thịt (Feed)
    DOM.activitySkeleton.classList.add('hidden');
    DOM.activityFeed.classList.remove('hidden');

    if (activities.length === 0) {
        DOM.activityFeed.innerHTML = `<li class="text-gray-500 text-sm text-center py-4">Chưa có hoạt động nào được ghi nhận.</li>`;
        return;
    }

    DOM.activityFeed.innerHTML = activities.map(item => `
        <li class="relative pl-6">
            <div class="absolute left-[-5px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${item.color} shadow-sm z-10"></div>
            <div class="bg-white p-3 rounded-md border border-gray-100 hover:border-gray-200 hover:shadow-sm transition group">
                <p class="text-sm text-gray-600 leading-relaxed">${item.title}</p>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-xs text-gray-400 font-medium flex items-center">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        ${utils.timeAgo(item.time)}
                    </span>
                    <a href="${item.link}" class="text-xs text-kn-blue font-bold opacity-0 group-hover:opacity-100 transition duration-300 hover:underline">Chi tiết &rarr;</a>
                </div>
            </div>
        </li>
    `).join('');
}

// ==========================================
// 3. TẢI BIỂU ĐỒ (CHART.JS)
// ==========================================
async function loadChartData() {
    if (!DOM.chartCtx) return;

    try {
        // Kéo toàn bộ data RFQ (hoặc giới hạn 12 tháng gần nhất nếu DB quá lớn)
        const { data: rfqs, error } = await supabaseClient
            .from('rfqs')
            .select('created_at, status');

        if (error) throw error;
        if (!rfqs || rfqs.length === 0) return;

        const monthlyCounts = {};

        // Gom nhóm theo tháng (Format: YYYY-MM)
        rfqs.forEach(rfq => {
            const date = new Date(rfq.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
        });

        // Sắp xếp các tháng theo thứ tự thời gian tăng dần
        const sortedMonths = Object.keys(monthlyCounts).sort();
        const dataValues = sortedMonths.map(k => monthlyCounts[k]);
        
        // Format nhãn trục X: "2026-07" -> "T07/2026"
        const labels = sortedMonths.map(key => {
            const [y, m] = key.split('-');
            return `T${m}/${y}`;
        });

        // Xóa chart cũ trước khi vẽ (Chống lỗi hover chớp nháy)
        if (window.dashboardChart) window.dashboardChart.destroy();

        // Vẽ Chart Line đẹp mắt
        window.dashboardChart = new Chart(DOM.chartCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số đơn Báo giá',
                    data: dataValues,
                    borderColor: '#00479b',
                    backgroundColor: 'rgba(0, 71, 155, 0.1)',
                    borderWidth: 2,
                    tension: 0.3, // Độ cong của đường
                    fill: true,
                    pointBackgroundColor: '#ff5e00',
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        padding: 10,
                        titleFont: { size: 13 },
                        bodyFont: { size: 13, weight: 'bold' }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        grid: { borderDash: [4, 4] }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Lỗi vẽ biểu đồ Dashboard:", error);
    }
}

// ==========================================
// LOGOUT
// ==========================================
window.handleAdminLogout = async function() {
    if (confirm("Đăng xuất khỏi hệ thống?")) {
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
    }
};