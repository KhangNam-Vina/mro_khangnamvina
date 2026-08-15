// ========================================================
// FILE: assets/js/users/forgot-password.js
// QUÊN MẬT KHẨU
// ========================================================

document.addEventListener('DOMContentLoaded', () => {

    const form =
        document.getElementById(
            'forgotPasswordForm'
        );

    if (!form) return;


    form.addEventListener('submit', async (event) => {

        event.preventDefault();


        const email =
            document.getElementById('email')
                ?.value.trim();


        // ====================================================
        // VALIDATION
        // ====================================================

        if (!email) {

            alert(
                'Vui lòng nhập Email.'
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
            'Gửi Link Khôi Phục';


        // ====================================================
        // SEND RESET EMAIL
        // ====================================================

        try {

            if (btn) {

                btn.disabled = true;

                btn.innerHTML =
                    'ĐANG GỬI...';

                btn.classList.add(
                    'is-loading'
                );

            }


            await Auth.sendResetPasswordEmail(
                email
            );


            alert(
                'Ngon lành! Supabase đã bắn một link khôi phục vào email của bạn. Nhớ check cả hộp thư rác (Spam) nhé!'
            );


            form.reset();


        } catch (error) {

            console.error(
                'Lỗi gửi Email reset:',
                error
            );


            alert(
                'Không thể gửi Email khôi phục: ' +
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