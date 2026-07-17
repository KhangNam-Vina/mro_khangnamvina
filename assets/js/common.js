// ========================================================
// FILE: assets/js/common.js
// TRÁI TIM CỦA HỆ THỐNG - KHỞI TẠO SUPABASE & UTILITIES
// ========================================================

// 1. KHỞI TẠO SUPABASE (Chỉ khai báo 1 lần duy nhất ở đây)
const SUPABASE_URL = 'https://wnhrkziiujbswnrfnlly.supabase.co';
const SUPABASE_KEY = 'sb_publishable_mCpQQA5h6TQHP7ueyYv1qg_vxnTQIRk'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. BỘ CÔNG CỤ DÙNG CHUNG TOÀN HỆ THỐNG (Gắn vào window để file nào cũng xài được)
window.utils = {
    // Chống hack XSS
    escapeHTML: (str) => {
        if (!str) return '';
        return str.toString().replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    },

    // Format Tiền tệ VNĐ
    formatCurrency: (val) => {
        if (!val) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
    },

    // Format Thời gian (Ví dụ: 5 phút trước)
    timeAgo: (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
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
    },

    // Hiển thị thông báo (Toast)
    showToast: (message, type = 'success') => {
        const container = document.getElementById('toastContainer');
        if (!container) {
            console.warn("Lỗi: Không tìm thấy div#toastContainer trên file HTML này!");
            return;
        }
        
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-orange-500' : 'bg-red-500';
        const toast = document.createElement('div');
        toast.className = `${bgColor} text-white px-4 py-3 rounded shadow-lg transform transition-all duration-300 translate-y-0 opacity-100 mb-2 font-bold text-sm flex items-center`;
        
        // Gắn thêm icon cho chuyên nghiệp
        const icon = type === 'success' ? '✔ ' : '⚠ ';
        toast.innerHTML = `<span class="mr-2 text-lg leading-none">${icon}</span> ${message}`;
        
        container.appendChild(toast);
        
        // Tự động biến mất sau 3 giây
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Vô hiệu hóa nút và hiện vòng xoay Loading
    toggleBtn: (btn, isLoading, text) => {
        if (!btn) return;
        btn.disabled = isLoading;
        if (isLoading) {
            btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> ${text}`;
            btn.classList.add('opacity-80', 'cursor-not-allowed');
        } else {
            btn.innerHTML = text;
            btn.classList.remove('opacity-80', 'cursor-not-allowed');
        }
    }
};

// 3. LÍNH GÁC BẢO MẬT (Dùng chung cho mọi trang Admin)
window.checkAdminAuth = async function() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session || session.user.user_metadata?.role !== 'admin') {
        alert("Khu vực quản trị nội bộ! Vui lòng đăng nhập bằng tài khoản Admin.");
        window.location.href = "login.html"; 
        return false;
    }
    return true;
};

// Đảm bảo mọi trang có nhúng common.js đều tự động kiểm tra bảo mật
document.addEventListener('DOMContentLoaded', async () => {
    // Loại trừ trang login ra khỏi vòng kiểm tra để tránh lặp vô hạn
    if (!window.location.href.includes('login.html')) {
        await window.checkAdminAuth();
    }
});