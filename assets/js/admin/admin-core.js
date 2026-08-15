// ========================================================
// FILE: assets/js/admin/admin-core.js
// NHIỆM VỤ: Bảo vệ Route Admin & Logic giao diện dùng chung
// ========================================================

window.checkAdminAuth = async function() {
    try {
        // 1. Lấy thông tin user hiện tại
        const { data: { user }, error: authError } = await window.supabaseClient.auth.getUser();
        
        // Nếu không có user (Chưa đăng nhập hoặc session đã bay màu)
        if (!user || authError) {
            window.location.replace("login.html");
            return false;
        }

        // 2. ĐÃ FIX: Dùng maybeSingle() để không văng lỗi khi User thường cố truy cập
        const { data: adminData, error: dbError } = await window.supabaseClient
            .from('admins')
            .select('role')
            .eq('id', user.id)
            .maybeSingle(); 

        // 3. Nếu không có data trong bảng admins hoặc không phải admin -> Sút ra ngoài
        if (!adminData || adminData.role !== 'admin') {
            if (window.utils) window.utils.showToast("Vui lòng đăng nhập tài khoản Admin!", "error");
            
            // Quét dọn session rác
            await window.supabaseClient.auth.signOut(); 
            setTimeout(() => { window.location.replace("login.html"); }, 1500);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Lỗi kiểm tra Auth Guard:", error);
        window.location.replace("login.html");
        return false;
    }
};

// ĐÃ FIX: BỔ SUNG HÀM ĐĂNG XUẤT CHO SIDEBAR
window.handleAdminLogout = function() {
    // Chuyển hướng sang trang logout.html để nó xử lý xóa session và hiệu ứng
    window.location.href = "logout.html";
};

// Dùng eventListener chuẩn thay vì window.onload
document.addEventListener("DOMContentLoaded", async () => {
    let currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
    
    // ĐÃ FIX: Bỏ qua kiểm tra auth nếu đang ở trang login HOẶC logout để tránh loop vô hạn
    if (currentPath !== 'login.html' && currentPath !== 'logout.html') {
        const isAuthorized = await window.checkAdminAuth();
        if (!isAuthorized) return; // Chặn đứng tại đây nếu là fake admin
        
        // Cập nhật Sidebar Active State
        const navLinks = document.querySelectorAll('#adminSidebarNav .nav-link');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.remove('text-gray-300', 'hover:bg-gray-800', 'hover:text-white');
                link.classList.add('bg-kn-blue', 'text-white', 'shadow');
            } 
        });
    }
});