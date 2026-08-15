// ========================================================
// FILE: assets/js/common/utils.js
// NHIỆM VỤ: Các hàm tiện ích dùng chung (Toast, Format...)
// ========================================================
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

    // Format Thời gian
    timeAgo: (date) => {
        if (!date) return '';
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
        if (!container) return; // Không quăng lỗi ra console nữa cho sạch
        
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-orange-500' : 'bg-red-500';
        const toast = document.createElement('div');
        toast.className = `${bgColor} text-white px-4 py-3 rounded shadow-lg transform transition-all duration-300 translate-y-0 opacity-100 mb-2 font-bold text-sm flex items-center`;
        
        const icon = type === 'success' ? '✔ ' : '⚠ ';
        toast.innerHTML = `<span class="mr-2 text-lg leading-none">${icon}</span> ${window.utils.escapeHTML(message)}`; // Chống XSS cả trong Toast
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Loading Button
    toggleBtn: (btn, isLoading, text) => {
        if (!btn) return;
        btn.disabled = isLoading;
        if (isLoading) {
            btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> ${window.utils.escapeHTML(text)}`;
            btn.classList.add('opacity-80', 'cursor-not-allowed');
        } else {
            btn.innerHTML = window.utils.escapeHTML(text);
            btn.classList.remove('opacity-80', 'cursor-not-allowed');
        }
    }
};  