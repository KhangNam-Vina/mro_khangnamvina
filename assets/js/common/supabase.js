// ========================================================
// FILE: assets/js/common/supabase.js
// NHIỆM VỤ: Khởi tạo kết nối Supabase toàn cục (Đã chia tách Session)
// ========================================================
const SUPABASE_URL = 'https://wnhrkziiujbswnrfnlly.supabase.co';
const SUPABASE_KEY = 'sb_publishable_mCpQQA5h6TQHP7ueyYv1qg_vxnTQIRk'; 

// 1. Nhận diện khu vực dựa vào đường dẫn (URL)
// Nếu trên thanh địa chỉ có chứa chữ '/admin/' thì xác định là luồng Quản trị
const isAdminArea = window.location.pathname.includes('/admin/');

// 2. Tạo tên chìa khóa lưu trữ (Storage Key) ĐỘC LẬP
const customStorageKey = isAdminArea ? 'kn-admin-session' : 'kn-user-session';

// 3. Khởi tạo Supabase Client với cấu hình Auth riêng biệt
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        storageKey: customStorageKey // Ép Supabase lưu Token theo 2 ngăn kéo khác nhau
    }
});