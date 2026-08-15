// ========================================================
// FILE: assets/js/users/reset-password.js
// ĐẶT LẠI MẬT KHẨU
// ========================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        // ====================================================
        // 1. KIỂM TRA SESSION
        // ====================================================

        try {

            const session =
                await Auth.getSession();


            if (!session) {

                alert(
                    'Đường dẫn này đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại link mới!'
                );

                window.location.replace(
                    'forgot-password.html'
                );

                return;
            }

        } catch (error) {

            console.error(
                'Lỗi kiểm tra session:',
                error
            );

            alert(
                'Không thể xác thực phiên đặt lại mật khẩu.'
            );

            window.location.replace(
                'forgot-password.html'
            );

            return;
        }


        // ====================================================
        // 2. FORM
        // ====================================================

        const form =
            document.getElementById(
                'resetPasswordForm'
            );

        if (!form) return;


        form.addEventListener(
            'submit',
            async (event) => {

                event.preventDefault();


                const password =
                    document.getElementById(
                        'newPassword'
                    )?.value ||
                    document.getElementById(
                        'password'
                    )?.value;


                const confirmPassword =
                    document.getElementById(
                        'confirmPassword'
                    )?.value;


                // ==================================================
                // VALIDATION
                // ==================================================

                if (
                    !password ||
                    !confirmPassword
                ) {

                    alert(
                        'Vui lòng nhập đầy đủ thông tin.'
                    );

                    return;
                }


                if (
                    password !==
                    confirmPassword
                ) {

                    alert(
                        'Hai mật khẩu không khớp nhau, gõ lại từ từ thôi nhé!'
                    );

                    return;
                }


                if (
                    password.length < 6
                ) {

                    alert(
                        'Mật khẩu phải có ít nhất 6 ký tự.'
                    );

                    return;
                }


                const btn =
                    document.getElementById(
                        'submitBtn'
                    ) ||
                    form.querySelector(
                        'button[type="submit"]'
                    );


                const originalText =
                    btn?.innerHTML ||
                    'Cập nhật mật khẩu';


                // ==================================================
                // UPDATE PASSWORD
                // ==================================================

                try {

                    if (btn) {

                        btn.disabled = true;

                        btn.innerHTML =
                            'ĐANG CẬP NHẬT...';

                        btn.classList.add(
                            'is-loading'
                        );

                    }


                    await Auth.updatePassword(
                        password
                    );


                    alert(
                        'Đổi mật khẩu thành công.'
                    );


                    // Ép đăng xuất sau khi đổi password
                    await Auth.logout();


                    window.location.replace(
                        'login.html'
                    );


                } catch (error) {

                    console.error(
                        'Lỗi đổi mật khẩu:',
                        error
                    );


                    alert(
                        'Không thể đổi mật khẩu: ' +
                        error.message
                    );


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

    }
);