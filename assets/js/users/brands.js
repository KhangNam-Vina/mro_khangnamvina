

async function loadFeaturedBrands() {
            const grid = document.getElementById('brandGrid');
            
            try {
                // Phóng lên bảng brands, lấy về đúng 12 hãng
                const { data, error } = await supabaseClient
                    .from('brands')
                    .select('*')
                    .limit(12);

                if (error) throw error;
                
                grid.innerHTML = ''; // Xóa icon loading

                if (data.length === 0) {
                    grid.innerHTML = '<p class="col-span-full text-center text-gray-500 font-bold py-10">Chưa có thương hiệu nào.</p>';
                    return;
                }

                // Vòng lặp đẻ ra Card thương hiệu theo y xì đúc thiết kế của ông
                data.forEach(brand => {
                    grid.innerHTML += `
                        <a href="products.html?brand_id=${brand.id}" class="bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center hover:shadow-lg hover:border-kn-orange transition-all group h-40 relative">
                            
                            <h3 class="text-xl md:text-2xl font-black text-gray-400 group-hover:text-kn-blue transition-colors uppercase tracking-widest text-center w-full line-clamp-1" title="${brand.name}">
                                ${brand.name}
                            </h3>
                            
                            <span class="text-xs text-gray-400 mt-3 group-hover:text-kn-orange">Thương hiệu Chính hãng</span>
                            
                            <div class="absolute inset-0 bg-kn-blue bg-opacity-90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                <span class="text-white text-sm font-bold border border-white px-4 py-1.5 rounded">Xem Tất Cả SP</span>
                            </div>
                        </a>
                    `;
                });

            } catch (err) {
                console.error("Lỗi tải thương hiệu:", err);
                grid.innerHTML = `<p class="col-span-full text-center text-red-500 py-10">Lỗi kết nối: ${err.message}</p>`;
            }
        }
        // Gom các lệnh khởi chạy lúc mở trang vào chung 1 hàm window.onload
        window.onload = function() {
            checkCustomerAuth(); // Kiểm tra đăng nhập (Lấy từ common.js)
            loadFeaturedBrands();         // Tải danh sách 
        };