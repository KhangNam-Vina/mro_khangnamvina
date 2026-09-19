// ========================================================
// FILE: assets/js/common/auth.js
// AUTH SERVICE - KHÁCH HÀNG (CORE)
// ĐÃ TÍCH HỢP BẢO MẬT: ĐÁ VĂNG TÀI KHOẢN BỊ KHÓA
// ========================================================

(function () {
    'use strict';

    function getClient() {
        if (!window.supabaseClient) {
            throw new Error('Supabase chưa được khởi tạo.');
        }
        return window.supabaseClient;
    }

    async function getSession() {
        const client = getClient();
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        return data.session;
    }

    async function getCurrentUser() {
        const session = await getSession();
        return session ? session.user : null;
    }

    async function login(email, password) {
        const client = getClient();
        if (!email || !password) throw new Error('Vui lòng nhập đầy đủ Email và Mật khẩu.');
        
        const { data, error } = await client.auth.signInWithPassword({
            email: email.trim(),
            password
        });
        if (error) throw error;
        return data;
    }

    // Đã mở khóa phòng hờ nếu khách bấm nhầm
    async function loginWithGoogle() {
        const client = getClient();
        const { data, error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/index.html'
            }
        });
        if (error) throw error;
        return data;
    }

    async function register(email, password, options = {}) {
        const client = getClient();
        if (!email || !password) throw new Error('Vui lòng nhập đầy đủ Email và Mật khẩu.');
        
        const { data, error } = await client.auth.signUp({
            email: email.trim(),
            password,
            options
        });
        if (error) throw error;
        return data;
    }

    async function logout() {
        const client = getClient();
        const { error } = await client.auth.signOut();
        if (error) throw error;
    }

    async function sendResetPasswordEmail(email) {
        const client = getClient();
        if (!email) throw new Error('Vui lòng nhập Email.');
        
        const redirectUrl = `${window.location.origin}/pages/reset-password.html`;
        const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: redirectUrl
        });
        if (error) throw error;
    }

    async function updatePassword(newPassword) {
        const client = getClient();
        if (!newPassword) throw new Error('Vui lòng nhập mật khẩu mới.');
        
        const { data, error } = await client.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
        return data;
    }

    async function updateUser(attributes) {
        const client = getClient();
        const { data, error } = await client.auth.updateUser(attributes);
        if (error) throw error;
        return data;
    }

    function onAuthStateChange(callback) {
        const client = getClient();
        return client.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }

    // ====================================================
    // LỚP BẢO VỆ 2: TUẦN TRA (CHẶN KHÁCH ĐANG LƯỚT WEB)
    // ====================================================
    window.checkCustomerAuth = async function () {
        if (!window.supabaseClient) return null;

        try {
            const { data, error } = await window.supabaseClient.auth.getSession();
            if (error || !data?.session) {
                localStorage.removeItem("kn_customer_session");
                return null;
            }

            const user = data.session.user;
            
            // Soát vé xem tài khoản có bị khóa không
            const { data: profile } = await window.supabaseClient
                .from("profiles")
                .select("status")
                .eq("id", user.id)
                .maybeSingle();
                
            // Nếu bị khóa -> Ép đăng xuất
            if (profile && profile.status === 'locked') {
                await window.supabaseClient.auth.signOut();
                localStorage.removeItem("kn_customer_session");
                
                // Nếu đang ở trang đòi hỏi bảo mật (Profile, Checkout...) thì đá văng ra login
                const restrictedPaths = ["my-", "profile", "checkout"];
                if (restrictedPaths.some(p => window.location.pathname.toLowerCase().includes(p))) {
                    alert("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.");
                    window.location.href = "login.html";
                }
                return null;
            }

            localStorage.setItem("kn_customer_session", JSON.stringify({
                access_token: data.session.access_token,
                expires_at: data.session.expires_at
            }));

            return user;
        } catch (err) {
            return null;
        }
    };

    window.Auth = {
        getSession,
        getCurrentUser,
        login,
        loginWithGoogle,
        register,
        logout,
        sendResetPasswordEmail,
        updatePassword,
        updateUser,
        onAuthStateChange
    };

})();