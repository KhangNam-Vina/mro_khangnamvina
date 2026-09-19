// ========================================================
// FILE: assets/js/users/login.js
// TRANG ĐĂNG NHẬP & QUẢN LÝ TRẠNG THÁI HEADER
// ĐÃ TÍCH HỢP CHỐT CHẶN: HIỂN THỊ HỘP LỖI TRỰC QUAN
// ========================================================

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('userLoginForm') || document.getElementById('loginForm');
    if (!form) return;

    const btn = document.getElementById('btnLoginSubmit') || form.querySelector('button[type="submit"]');
    
    const errorBox = document.getElementById('loginErrorMessage');
    const errorText = document.getElementById('loginErrorText');

    // Hàm hiển thị hộp lỗi
    function showError(msg) {
        if (errorBox && errorText) {
            errorText.innerHTML = msg; // Dùng innerHTML để cho phép in đậm
            errorBox.classList.remove('is-hidden');
        } else {
            alert(msg);
        }
    }

    // Hàm ẩn hộp lỗi
    function hideError() {
        if (errorBox) {
            errorBox.classList.add('is-hidden');
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideError(); // Ẩn lỗi cũ khi bắt đầu submit lại

        const email = (document.getElementById('emailInput') || document.getElementById('email'))?.value.trim();
        const password = (document.getElementById('passwordInput') || document.getElementById('password'))?.value;

        if (!email || !password) {
            showError("Vui lòng nhập đầy đủ <strong>Email</strong> và <strong>Mật khẩu</strong>.");
            return;
        }

        const originalText = btn?.innerHTML || 'Đăng Nhập';

        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = 'ĐANG XÁC THỰC...';
                btn.classList.add('is-loading');
            }

            // 1. Đăng nhập Auth Supabase
            const loginData = await Auth.login(email, password);

            // ====================================================
            // LỚP BẢO VỆ 1: KIỂM TRA TRẠNG THÁI BỊ KHÓA
            // ====================================================
            if (loginData?.user) {
                const { data: profile } = await window.supabaseClient
                    .from("profiles")
                    .select("status")
                    .eq("id", loginData.user.id)
                    .maybeSingle();

                if (profile && profile.status === 'locked') {
                    await Auth.logout(); // Đá ra lập tức xóa session
                    
                    // Hiển thị thông báo cực gắt
                    showError("Tài khoản của bạn đã bị <strong>TẠM KHÓA</strong> do vi phạm chính sách hoặc theo yêu cầu. Vui lòng liên hệ Admin để được hỗ trợ.");
                    return; // Dừng lại ở đây, không redirect
                }
            }

            // Đăng nhập thành công, không bị khóa -> Đẩy về trang chủ
            window.location.replace('../index.html');

        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            let message = 'Đăng nhập thất bại. Vui lòng thử lại sau.';

            if (error.message?.includes('Invalid login credentials')) {
                message = '<strong>Sai Email hoặc Mật khẩu.</strong> Vui lòng kiểm tra lại!';
            } else if (error.message?.includes('Email not confirmed')) {
                message = 'Vui lòng xác thực email trong hòm thư trước khi đăng nhập.';
            }

            showError(message);
            
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
                btn.classList.remove('is-loading');
            }
        }
    });
});

// ========================================================
// 2. GOOGLE LOGIN
// ========================================================
window.handleGoogleLogin = async function () {
    try {
        await Auth.loginWithGoogle();
    } catch (error) {
        console.error('Lỗi Google Login:', error);
        alert('Lỗi: ' + error.message);
    }
};

// ========================================================
// 3. TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI HEADER
// ========================================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        let isUserLoggedIn = false;

        if (typeof window.checkCustomerAuth === 'function') {
            isUserLoggedIn = !!(await window.checkCustomerAuth());
        } else if (typeof Auth !== 'undefined' && typeof Auth.getCurrentUser === 'function') {
            isUserLoggedIn = !!(await Auth.getCurrentUser());
        } else if (window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getSession();
            isUserLoggedIn = !!data?.session;
        }

        if (isUserLoggedIn) {
            const guestBtn = document.getElementById('btnGuestLogin');
            if (guestBtn) guestBtn.classList.add('is-hidden');

            const userProfileBtn = document.getElementById('btnUserProfile');
            if (userProfileBtn) userProfileBtn.classList.remove('is-hidden');
        }
    } catch (err) {
        console.error('Lỗi đồng bộ Header:', err);
    }
});