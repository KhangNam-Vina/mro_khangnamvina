// ========================================================
// FILE: assets/js/users/login.js
// TRANG ĐĂNG NHẬP & QUẢN LÝ TRẠNG THÁI HEADER
// CSS TĨNH - KHÔNG PHỤ THUỘC TAILWIND
// ========================================================


// ========================================================
// 1. XỬ LÝ SỰ KIỆN FORM ĐĂNG NHẬP
// ========================================================

document.addEventListener('DOMContentLoaded', () => {

    const form =
        document.getElementById('userLoginForm') ||
        document.getElementById('loginForm');

    if (!form) {
        return;
    }


    const btn =
        document.getElementById('btnLoginSubmit') ||
        form.querySelector('button[type="submit"]');


    form.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();


            const email =
                (
                    document.getElementById('emailInput') ||
                    document.getElementById('email')
                )?.value.trim();


            const password =
                (
                    document.getElementById('passwordInput') ||
                    document.getElementById('password')
                )?.value;


            // ====================================================
            // VALIDATION
            // ====================================================

            if (!email || !password) {

                if (
                    window.utils &&
                    typeof window.utils.showToast === 'function'
                ) {

                    window.utils.showToast(
                        'Vui lòng nhập đủ Email và Mật khẩu',
                        'error'
                    );

                } else {

                    alert(
                        'Vui lòng nhập đầy đủ Email và Mật khẩu.'
                    );

                }

                return;
            }


            const originalText =
                btn?.innerHTML ||
                'Đăng Nhập';


            // ====================================================
            // LOGIN
            // ====================================================

            try {

                if (btn) {

                    btn.disabled = true;

                    btn.innerHTML =
                        'ĐANG XÁC THỰC...';

                    btn.classList.add(
                        'is-loading'
                    );
                }


                await Auth.login(
                    email,
                    password
                );


                // Đăng nhập thành công
                // -> Đẩy về trang chủ khách hàng

                window.location.replace(
                    '../index.html'
                );


            } catch (error) {

                console.error(
                    'Lỗi đăng nhập:',
                    error
                );


                let message =
                    'Đăng nhập thất bại. Vui lòng thử lại sau.';


                if (
                    error.message?.includes(
                        'Invalid login credentials'
                    )
                ) {

                    message =
                        'Sai Email hoặc Mật khẩu. Vui lòng kiểm tra lại!';

                } else if (
                    error.message?.includes(
                        'Email not confirmed'
                    )
                ) {

                    message =
                        'Vui lòng xác thực email trước khi đăng nhập.';

                }


                if (
                    window.utils &&
                    typeof window.utils.showToast === 'function'
                ) {

                    window.utils.showToast(
                        message,
                        'error'
                    );

                } else {

                    alert(
                        message
                    );

                }


            } finally {

                if (btn) {

                    btn.disabled = false;

                    btn.innerHTML =
                        originalText;

                    btn.classList.remove(
                        'is-loading'
                    );

                }

            }

        }
    );

});


// ========================================================
// 2. GOOGLE LOGIN
// ========================================================

window.handleGoogleLogin =
async function () {

    try {

        await Auth.loginWithGoogle();

    } catch (error) {

        console.error(
            'Lỗi Google Login:',
            error
        );

        alert(
            'Lỗi: ' +
            error.message
        );

    }

};


// ========================================================
// 3. TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI HEADER
//    CSS TĨNH - KHÔNG PHỤ THUỘC TAILWIND
// ========================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        try {

            let isUserLoggedIn = false;


            // ==================================================
            // KIỂM TRA AUTH
            // ==================================================

            if (
                typeof window.checkCustomerAuth ===
                'function'
            ) {

                isUserLoggedIn =
                    !!(
                        await window.checkCustomerAuth()
                    );

            } else if (
                typeof Auth !== 'undefined' &&
                typeof Auth.getCurrentUser ===
                'function'
            ) {

                isUserLoggedIn =
                    !!(
                        await Auth.getCurrentUser()
                    );

            } else if (
                window.supabaseClient
            ) {

                const {
                    data
                } =
                    await window.supabaseClient
                        .auth
                        .getSession();


                isUserLoggedIn =
                    !!data?.session;
            }


            // ==================================================
            // CẬP NHẬT HEADER
            // ==================================================

            if (isUserLoggedIn) {

                const guestBtn =
                    document.getElementById(
                        'btnGuestLogin'
                    );


                if (guestBtn) {

                    guestBtn.classList.add(
                        'is-hidden'
                    );

                }


                const userProfileBtn =
                    document.getElementById(
                        'btnUserProfile'
                    );


                if (userProfileBtn) {

                    userProfileBtn.classList.remove(
                        'is-hidden'
                    );

                }

            }

        } catch (err) {

            console.error(
                'Lỗi đồng bộ Header:',
                err
            );

        }

    }
);