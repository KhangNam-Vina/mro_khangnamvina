// ========================================================
// FILE: assets/js/common/auth.js
// AUTH SERVICE - KHÁCH HÀNG (CORE)
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