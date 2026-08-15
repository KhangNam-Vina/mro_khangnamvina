// ========================================================
// FILE: assets/js/users/auth-ui.js
// AUTH UI - QUẢN LÝ TRẠNG THÁI ĐĂNG NHẬP KHÁCH HÀNG
// ========================================================

(function () {
    'use strict';

    // ----------------------------------------------------
    // Cập nhật giao diện Header
    // ----------------------------------------------------
    async function updateAuthUI() {
        try {
            if (!window.Auth) {
                console.warn('[Auth UI] Auth chưa sẵn sàng.');
                return;
            }

            const user = await window.Auth.getCurrentUser();

            const btnLogin = document.getElementById('btnGuestLogin');
            const btnLogout = document.getElementById('btnCustomerLogout');
            const btnOrders = document.getElementById('btnMyOrders');

            if (!btnLogin && !btnLogout && !btnOrders) {
                console.warn('[Auth UI] Không tìm thấy các nút Auth trong Header.');
                return;
            }

           if (user) {

    // ================================================
    // ĐÃ ĐĂNG NHẬP
    // ================================================
    btnLogin?.classList.add('hidden');
    btnLogout?.classList.remove('hidden');
    btnOrders?.classList.remove('hidden');


    // ================================================
    // LẤY TÊN KHÁCH HÀNG TỪ BẢNG profiles
    // ================================================
    let fullName = user.email
        ? user.email.split('@')[0]
        : 'Tài khoản';

    try {

        if (window.supabaseClient) {

            const {
                data: profile,
                error: profileError
            } = await window.supabaseClient
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .maybeSingle();

            if (!profileError && profile?.full_name) {
                fullName = profile.full_name;
            }
        }

    } catch (profileError) {

        console.warn(
            '[Auth UI] Không lấy được profile:',
            profileError
        );
    }


    // ================================================
    // ĐỒNG BỘ TÊN LÊN HEADER
    // ================================================
    const headerName =
        document.getElementById('headerUserName');

    const headerAvatar =
        document.getElementById('headerAvatarInitials');


    if (headerName) {
        headerName.textContent = fullName;
    }


    if (headerAvatar) {

        const names =
            fullName
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        if (names.length >= 2) {

            headerAvatar.textContent =
                (
                    names[0][0] +
                    names[names.length - 1][0]
                ).toUpperCase();

        } else {

            headerAvatar.textContent =
                fullName
                    .substring(0, 2)
                    .toUpperCase();
        }
    }

} else {

    // ================================================
    // CHƯA ĐĂNG NHẬP
    // ================================================
    btnLogin?.classList.remove('hidden');
    btnLogout?.classList.add('hidden');
    btnOrders?.classList.add('hidden');


    // Trả Header về trạng thái mặc định
    const headerName =
        document.getElementById('headerUserName');

    const headerAvatar =
        document.getElementById('headerAvatarInitials');


    if (headerName) {
        headerName.textContent = 'Tài khoản';
    }

    if (headerAvatar) {
        headerAvatar.textContent = 'KN';
    }
}

        } catch (error) {
            console.error('[Auth UI] Lỗi cập nhật trạng thái:', error);
        }
    }


    // ----------------------------------------------------
    // Đăng xuất
    // ----------------------------------------------------
    async function handleLogout() {

        try {

            await window.Auth.logout();

            // Sau khi logout → reload trang hiện tại
            // để Header render lại đúng trạng thái.
            window.location.reload();

        } catch (error) {

            console.error('[Auth UI] Lỗi đăng xuất:', error);

            alert('Đăng xuất thất bại. Vui lòng thử lại.');
        }
    }


    // ----------------------------------------------------
    // Tương thích code cũ
    // ----------------------------------------------------

    window.checkCustomerAuth = async function () {

        if (!window.Auth) {
            return null;
        }

        return await window.Auth.getCurrentUser();
    };


    window.handleCustomerLogout = handleLogout;


    // ----------------------------------------------------
    // Chờ DOM + Header render xong
    // ----------------------------------------------------

    async function initAuthUI() {

        // Đợi DOM
        if (document.readyState === 'loading') {

            await new Promise(resolve => {
                document.addEventListener(
                    'DOMContentLoaded',
                    resolve,
                    { once: true }
                );
            });

        }

        // Chờ Auth tồn tại
        let retry = 0;

        while (!window.Auth && retry < 50) {

            await new Promise(resolve =>
                setTimeout(resolve, 100)
            );

            retry++;
        }

        if (!window.Auth) {

            console.error(
                '[Auth UI] Không tìm thấy window.Auth.'
            );

            return;
        }


        // ------------------------------------------------
        // Header được inject bằng JS nên đợi thêm một chút
        // ------------------------------------------------

        retry = 0;

        while (
            !document.getElementById('btnGuestLogin') &&
            !document.getElementById('btnCustomerLogout') &&
            retry < 50
        ) {

            await new Promise(resolve =>
                setTimeout(resolve, 100)
            );

            retry++;
        }


        // Cập nhật trạng thái lần đầu
        await updateAuthUI();


        // ------------------------------------------------
        // Theo dõi thay đổi Auth
        // ------------------------------------------------

        window.Auth.onAuthStateChange(
            async function (event, session) {

                console.log(
                    '[Auth UI] Auth event:',
                    event,
                    session ? 'LOGGED IN' : 'LOGGED OUT'
                );

                // Đợi Header nếu cần
                await new Promise(resolve =>
                    setTimeout(resolve, 50)
                );

                await updateAuthUI();
            }
        );

    }


    // Chạy hệ thống
    initAuthUI();

})();