// ========================================================
// FILE: assets/js/rfq.js
// XỬ LÝ LOGIC 
// ========================================================

let cartItems = []; // Biến giữ đồ trong giỏ

        // 1. ĐỌC GIỎ HÀNG TỪ LOCALSTORAGE
        function loadCartFromStorage() {
            const grid = document.getElementById('productGrid');
            const loading = document.getElementById('productLoading');
            const submitBtn = document.getElementById('submitRfqBtn');

            loading.classList.add('hidden');
            grid.classList.remove('hidden');

            // Mở kho lấy giỏ ra
            cartItems = JSON.parse(localStorage.getItem('mro_rfq_cart')) || [];

            if (cartItems.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-2 text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p class="text-gray-500 font-bold mb-3">Danh sách yêu cầu đang trống!</p>
                        <a href="products.html" class="bg-kn-blue text-white px-6 py-2 rounded shadow hover:bg-kn-orange transition">Đến Kho Hàng để chọn vật tư</a>
                    </div>`;
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                return;
            }

            grid.innerHTML = '';
            // Vẽ các món có trong giỏ ra lưới
            cartItems.forEach((item, index) => {
                grid.innerHTML += `
                    <div class="border border-gray-200 rounded-lg p-4 hover:border-kn-orange transition shadow-sm bg-white flex flex-col justify-between relative">
                        <button onclick="removeItem(${index})" class="absolute top-2 right-2 text-red-400 hover:text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded">XÓA</button>
                        
                        <div class="pr-10">
                            <div class="text-xs font-bold text-kn-orange uppercase tracking-wider mb-1">${item.brand}</div>
                            <h3 class="font-bold text-kn-blue text-sm line-clamp-2 h-10 mb-1">${item.name}</h3>
                            <div class="text-xs text-gray-500 mb-2">Mã SKU: <span class="font-bold text-gray-700 uppercase">${item.sku}</span></div>
                        </div>
                        
                        <div class="flex items-center justify-between border-t pt-3 mt-2">
                            <span class="text-xs text-gray-500">ĐVT: ${item.unit}</span>
                            <div class="flex items-center space-x-2">
                                <label class="text-xs font-bold text-gray-700">Số lượng:</label>
                                <input type="number" id="rfq-qty-${index}" min="1" value="${item.qty}" class="w-16 text-center border border-gray-300 rounded py-1 text-xs font-bold text-kn-blue focus:outline-none focus:border-kn-orange bg-gray-50" onchange="updateQty(${index}, this.value)">
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        // Cập nhật số lượng khi khách bấm tăng giảm
        function updateQty(index, newQty) {
            cartItems[index].qty = parseInt(newQty) || 1;
            localStorage.setItem('mro_rfq_cart', JSON.stringify(cartItems));
        }

        // Bỏ món hàng ra khỏi danh sách
        function removeItem(index) {
            cartItems.splice(index, 1);
            localStorage.setItem('mro_rfq_cart', JSON.stringify(cartItems));
            loadCartFromStorage(); // Tải lại lưới
        }

        // 2. GỬI ĐƠN LÊN SUPABASE
        async function submitRFQ() {
            const { data: { session } } = await supabaseClient.auth.getSession();
            const currentUserId = session ? session.user.id : null;

            if (!session) {
                alert("Ní phải đăng nhập tài khoản Khách hàng thì mới gửi được nha!");
                window.location.href = "login.html"; 
                return; 
            }

            // Validate form
            const company = document.getElementById('company').value.trim();
            const name = document.getElementById('name').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const email = document.getElementById('email').value.trim();
            const notes = document.getElementById('notes').value.trim();

            if(!company || !name || !phone || !email) {
                alert("Vui lòng điền đầy đủ các ô có dấu * ở phần Thông tin gửi đơn nhé!");
                return;
            }

            // Gom đồ trong giỏ
            const selectedItems = cartItems.filter(item => item.qty > 0);
            if (selectedItems.length === 0) {
                alert("Chưa có sản phẩm nào hợp lệ để gửi!");
                return;
            }

            const btn = document.getElementById('submitRfqBtn');
            btn.innerHTML = 'Hệ thống đang đẩy đơn...';
            btn.disabled = true;

            const randomCode = 'RFQ-' + Math.floor(1000 + Math.random() * 9000);

            try {
                // Đẩy lên mây
                const { error } = await supabaseClient
                    .from('rfqs')
                    .insert([{
                        rfq_code: randomCode,
                        company_name: company,
                        contact_person: name,
                        phone: phone,
                        email: email,
                        notes: notes,
                        status: 'Chờ xử lý',
                        items: selectedItems,
                        user_id: currentUserId
                    }]);

                if (error) throw error;
                
                alert(`Gửi yêu cầu thành công! Mã đơn: ${randomCode}`);
                
                // QUAN TRỌNG: Gửi xong thì dọn sạch giỏ hàng
                localStorage.removeItem('mro_rfq_cart');
                document.getElementById('rfqForm').reset();
                loadCartFromStorage(); // Load lại thì giỏ sẽ trống
                
            } catch (error) {
                alert("Lỗi nghẽn mạng: " + error.message);
            } finally {
                btn.innerHTML = '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>Gửi Yêu Cầu Báo Giá Real-time';
                btn.disabled = false;
            }
        }

        // Khởi chạy
        window.onload = async function() {
            // Tui đã chuyển logic bảo vệ (LÍNH GÁC) vào đây để gọn code
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) {
                alert("Kho hàng B2B chỉ dành cho đối tác. Ní vui lòng đăng nhập để tạo đơn RFQ nha!");
                window.location.href = "login.html";
                return;
            }

            checkCustomerAuth(); // Cập nhật Header từ common.js
            loadCartFromStorage(); // Đọc giỏ hàng thay vì load cả kho
        };