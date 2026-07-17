

async function loadIndustries() {
            const grid = document.getElementById('industryGrid');
            if(!grid) return;

            try {
                const { data, error } = await supabaseClient
                    .from('industries')
                    .select('*')
                    .order('id', { ascending: true });

                if (error) throw error;

                if (!data || data.length === 0) {
                    grid.innerHTML = `
                        <div class="col-span-full text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                            <p class="text-gray-500 font-bold text-lg">Đang cập nhật danh sách ngành hàng...</p>
                        </div>
                    `;
                    return;
                }

                grid.innerHTML = '';

                data.forEach(item => {
                    grid.innerHTML += `
                        <div class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 group flex flex-col">
                            <div class="h-56 overflow-hidden relative">
                                <div class="absolute inset-0 bg-kn-blue/20 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                                <img src="${item.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                            </div>
                            <div class="p-6 flex-grow flex flex-col">
                                <h3 class="text-xl font-bold text-gray-800 mb-3 group-hover:text-kn-orange transition-colors uppercase">${item.name}</h3>
                                <p class="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                                    ${item.description || 'Giải pháp MRO toàn diện cung cấp thiết bị và vật tư chuyên dụng.'}
                                </p>
                                <div class="mt-auto">
                                    <a href="products.html?industry_id=${item.id}" class="inline-flex items-center text-kn-blue font-bold text-sm hover:text-kn-orange transition-colors">
                                        Xem Giải Pháp
                                        <svg class="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                });

            } catch (error) {
                console.error("Lỗi tải trang Ngành hàng:", error);
                grid.innerHTML = `<div class="col-span-full text-center text-red-500 font-bold py-10">Lỗi kết nối máy chủ: ${error.message}</div>`;
            }
        }
        window.onload = function() {
            checkCustomerAuth(); // Kiểm tra đăng nhập (Lấy từ common.js)
            loadIndustries();
        };