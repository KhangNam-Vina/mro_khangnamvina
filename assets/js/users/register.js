// ========================================================
// FILE: assets/js/users/register.js
// TRANG ĐĂNG KÝ
// ========================================================

document.addEventListener('DOMContentLoaded', () => {

    const form =
        document.getElementById('registerForm');

    if (!form) return;


    form.addEventListener('submit', async (event) => {

        event.preventDefault();


        const email =
            document.getElementById('email')
                ?.value.trim();

        const password =
            document.getElementById('password')
                ?.value;

        const confirmPassword =
            document.getElementById('confirmPassword')
                ?.value;


        const btn =
            document.getElementById('registerBtn') ||
            form.querySelector(
                'button[type="submit"]'
            );


        // ====================================================
        // VALIDATION
        // ====================================================

        if (
            !email ||
            !password ||
            !confirmPassword
        ) {

            alert(
                'Vui lòng nhập đầy đủ thông tin.'
            );

            return;
        }


        if (
            password !== confirmPassword
        ) {

            alert(
                'Mật khẩu xác nhận không khớp.'
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


        const originalText =
            btn?.innerHTML ||
            'Tạo Tài Khoản';


        // ====================================================
        // REGISTER
        // ====================================================

        try {

            if (btn) {

                btn.disabled = true;
                btn.innerHTML =
                    'ĐANG XỬ LÝ...';

                btn.classList.add(
                    'is-loading'
                );

            }


            const data =
                await Auth.register(
                    email,
                    password
                );


            // ==================================================
            // SUPABASE TRẢ SESSION
            // ==================================================

            if (data.session) {

                alert(
                    'Đăng ký thành công.'
                );

                window.location.replace(
                    '../index.html'
                );

            }


            // ==================================================
            // SUPABASE YÊU CẦU XÁC THỰC EMAIL
            // ==================================================

            else {

                alert(
                    'Đăng ký thành công. Vui lòng kiểm tra Email để xác thực tài khoản trước khi đăng nhập.'
                );

                window.location.replace(
                    'login.html'
                );

            }


        } catch (error) {

            console.error(
                'Lỗi đăng ký:',
                error
            );

            alert(
                'Đăng ký thất bại: ' +
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

    });

});