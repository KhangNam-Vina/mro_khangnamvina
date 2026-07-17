

async function submitContact() {
            // 1. Lấy dữ liệu từ các ô nhập
            const name = document.getElementById('inContactName').value.trim();
            const company = document.getElementById('inContactCompany').value.trim();
            const phone = document.getElementById('inContactPhone').value.trim();
            const email = document.getElementById('inContactEmail').value.trim();
            const subject = document.getElementById('inContactSubject').value;
            const message = document.getElementById('inContactMessage').value.trim();

            // 2. Rào lỗi bỏ trống
            if (!name || !company || !phone || !email || !message) {
                alert("Bro vui lòng điền đầy đủ các thông tin bắt buộc (*) nhé!");
                return;
            }

            try {
                // 3. Bắn dữ liệu lên bảng 'contacts' của Supabase
                const { error } = await supabaseClient
                    .from('contacts')
                    .insert([{ 
                        name: name, 
                        company: company, 
                        phone: phone, 
                        email: email, 
                        subject: subject, 
                        message: message 
                    }]);

                if (error) throw error;

                // 4. Báo thành công và dọn sạch form
                alert("Gửi yêu cầu thành công! Khang Nam sẽ liên hệ với bro sớm nhất.");
                document.getElementById('contactForm').reset();

            } catch (error) {
                console.error("Lỗi gửi liên hệ:", error);
                alert("Có lỗi xảy ra: " + error.message);
            }
        }
    
        window.onload = function() {
            checkCustomerAuth(); // Kiểm tra đăng nhập (Lấy từ common.js)
        };