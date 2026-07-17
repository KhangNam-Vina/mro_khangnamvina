// ========================================================
// FILE: assets/js/index.js
// XỬ LÝ LOGIC 
// ========================================================

// --- 2. KÉO DỮ LIỆU DANH MỤC GỐC ---
        async function loadMainCategories() {
            const grid = document.getElementById('categoryGrid');
            try {
                const { data, error } = await supabaseClient
                    .from('categories')
                    .select('*')
                    .order('id', { ascending: true });

                if (error) throw error;
                grid.innerHTML = '';

                if (data.length === 0) {
                    grid.innerHTML = '<p class="col-span-full text-center text-red-500 font-bold">Chưa có danh mục nào trong kho!</p>';
                    return;
                }

                data.forEach((cat, index) => {
                    const num = (index + 1).toString().padStart(2, '0');
                    grid.innerHTML += `
                        <a href="pages/subcategory.html?category_id=${cat.id}" class="group flex flex-col items-center justify-center bg-white border border-gray-200 p-6 hover:border-kn-orange hover:shadow-md transition-all duration-200">
                            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-50 transition-colors">
                                <span class="font-bold text-xl text-gray-400 group-hover:text-kn-orange">${num}</span>
                            </div>
                            <span class="text-sm font-bold text-gray-800 group-hover:text-kn-orange text-center uppercase tracking-wide line-clamp-2">${cat.name}</span>
                        </a>
                    `;
                });
            } catch (error) {
                grid.innerHTML = `<p class="col-span-full text-center text-red-500 font-bold">Lỗi mạng: ${error.message}</p>`;
            }
        }

        // --- 3. KÉO THƯƠNG HIỆU CUỘN ---
        async function loadBrandsToMarquee() {
            const container = document.getElementById('brandScrollContainer');
            try {
                const { data, error } = await supabaseClient.from('brands').select('*');
                if (error) throw error;
                if (data.length === 0) {
                    container.innerHTML = '<span class="text-white">Chưa có thương hiệu nào.</span>';
                    return;
                }

                let brandItemsHTML = '';
                data.forEach(brand => {
                    brandItemsHTML += `
                        <a href="pages/products.html?brand_id=${brand.id}" class="text-xl font-bold text-white uppercase tracking-widest hover:text-kn-orange transition-all cursor-pointer px-8 whitespace-nowrap block">
                            ${brand.name}
                        </a>
                    `;
                });

                container.innerHTML = `
                    <div class="flex items-center justify-around min-w-full shrink-0">${brandItemsHTML}</div>
                    <div class="flex items-center justify-around min-w-full shrink-0" aria-hidden="true">${brandItemsHTML}</div>
                `;
                // Kích hoạt chức năng Kéo & Cuộn (Tốc độ 1)
                initDragAndScroll('brandScrollContainer', 1);
            } catch (error) {
                container.innerHTML = `<span class="text-red-400 font-bold">Lỗi tải dữ liệu: ${error.message}</span>`;
            }
        }

        // --- 4. KÉO SẢN PHẨM BÁN CHẠY (CUỘN) ---
        async function loadBestSellers() {
            const container = document.getElementById('bestSellingGrid');
            try {
                const { data, error } = await supabaseClient
                    .from('products')
                    .select('*, brands(name)')
                    .order('created_at', { ascending: false })
                    .limit(8);

                if (error) throw error;
                if (data.length === 0) {
                    container.innerHTML = '<p class="w-full text-center text-gray-500">Chưa có sản phẩm nào.</p>';
                    return;
                }

                let productItemsHTML = '';
                
                data.forEach(item => {
                    const brandName = item.brands ? item.brands.name : 'OEM';
                    
                    // CHỐNG LỖI CÚ PHÁP: Chuyển đổi nháy đơn (') và nháy kép (")
                    const safeSku = item.sku ? item.sku.replace(/'/g, "\\'").replace(/"/g, '&quot;') : 'NO-SKU';
                    const safeName = item.name ? item.name.replace(/'/g, "\\'").replace(/"/g, '&quot;') : 'Sản phẩm';
                    const safeBrand = brandName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    const safeUnit = item.unit ? item.unit.replace(/'/g, "\\'").replace(/"/g, '&quot;') : 'Cái';
                    
                    productItemsHTML += `
                        <div class="w-72 shrink-0 mx-3 bg-white border border-gray-200 p-4 hover:shadow-xl transition-shadow flex flex-col h-full relative overflow-hidden">
                            <a href="pages/product-detail.html?id=${item.id}" class="w-full h-48 bg-white flex items-center justify-center mb-4 relative overflow-hidden border-b border-gray-100 p-2 block hover:opacity-90">
                                <span class="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded z-10">In Stock</span>
                                <img src="${item.image_url}" alt="${item.name}" class="max-h-full max-w-full object-contain hover:scale-110 transition-transform duration-300">
                            </a>
                            
                            <div class="mb-4 flex-1 flex flex-col">
                                <div class="text-xs text-gray-500 mb-1 font-bold uppercase">${brandName}</div>
                                <a href="pages/product-detail.html?id=${item.id}" class="block">
                                    <h4 class="text-kn-blue font-bold text-sm leading-snug mb-2 hover:text-kn-orange transition-colors line-clamp-2" title="${item.name}">${item.name}</h4>
                                </a>
                                <div class="mt-auto">
                                    <div class="text-[10px] text-gray-600 bg-gray-100 inline-block px-2 py-1 rounded font-mono">SKU: ${item.sku}</div>
                                    <div class="text-[10px] text-gray-600 bg-gray-100 inline-block px-2 py-1 rounded mt-1">${item.unit || 'Cái'}</div>
                                </div>
                            </div>
                            
                            <!-- NÚT GỌI HÀM AN TOÀN -->
                            <button onclick="addToRFQCartFromIndex('${safeSku}', '${safeName}', '${safeBrand}', '${safeUnit}')" class="block text-center w-full border-2 border-kn-orange text-kn-orange font-bold py-2 hover:bg-kn-orange hover:text-white transition-colors text-sm uppercase mt-auto">
                                Thêm vào Yêu cầu
                            </button>
                        </div>
                    `;
                });

                container.innerHTML = `
                    <div class="flex items-stretch min-w-full shrink-0 py-2">${productItemsHTML}</div>
                    <div class="flex items-stretch min-w-full shrink-0 py-2" aria-hidden="true">${productItemsHTML}</div>
                `;
                // Kích hoạt chức năng Kéo & Cuộn (Tốc độ 1.5)
                initDragAndScroll('bestSellingGrid', 1.5);
            } catch (error) {
                container.innerHTML = `<p class="w-full text-center text-red-500 font-bold py-10">Lỗi lấy dữ liệu: ${error.message}</p>`;
            }
        }

        // --- 6. HÀM NHÉT GIỎ HÀNG TỪ TRANG CHỦ ---
        function addToRFQCartFromIndex(sku, name, brand, unit) {
            try {
                let cart = JSON.parse(localStorage.getItem('mro_rfq_cart')) || [];
                
                // Đảm bảo cart là mảng (phòng hờ dữ liệu cũ bị lỗi)
                if (!Array.isArray(cart)) cart = [];

                let existingItem = cart.find(item => item.sku === sku);
                
                if (existingItem) {
                    existingItem.qty += 1;
                } else {
                    cart.push({ sku: sku, name: name, brand: brand, unit: unit, qty: 1 });
                }

                localStorage.setItem('mro_rfq_cart', JSON.stringify(cart));
                // alert('Đã đưa hàng lên xe, thẳng tiến tới trang Yêu cầu báo giá!');
                window.location.href = 'pages/rfq.html';
                
            } catch (err) {
                console.error("Lỗi giỏ hàng:", err);
                alert("Có lỗi xảy ra khi thêm vào giỏ. Vui lòng xóa lịch sử web và thử lại.");
            }
        }
    
    // --- 7. HÀM XỬ LÝ KÉO VÀ CUỘN TỰ ĐỘNG ---
        function initDragAndScroll(containerId, speed = 1) {
            const slider = document.getElementById(containerId);
            if (!slider) return;

            let isDown = false;
            let startX;
            let scrollLeft;
            let scrollInterval;

            // 1. Logic tự động cuộn
            const startAutoScroll = () => {
                clearInterval(scrollInterval); // Dọn dẹp interval cũ
                scrollInterval = setInterval(() => {
                    slider.scrollLeft += speed;
                    
                    // Nếu cuộn qua hết khối nội dung đầu tiên thì giật về 0 để tạo cảm giác vô tận
                    if (slider.children[0] && slider.scrollLeft >= slider.children[0].offsetWidth) {
                        slider.scrollLeft = 0;
                    }
                }, 20); // 50 FPS cho mượt
            };

            const stopAutoScroll = () => {
                clearInterval(scrollInterval);
            };

            // Khởi động chạy ngay lập tức
            startAutoScroll();

            // 2. Logic Kéo Thả (Drag to Scroll)
            slider.addEventListener('mousedown', (e) => {
                isDown = true;
                slider.classList.add('cursor-grabbing');
                stopAutoScroll(); // Chặn cuộn khi đang nắm
                startX = e.pageX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft;
            });

            slider.addEventListener('mouseleave', () => {
                if(isDown) {
                    isDown = false;
                    slider.classList.remove('cursor-grabbing');
                    startAutoScroll(); // Rớt chuột ra ngoài thì cuộn tiếp
                }
            });

            slider.addEventListener('mouseup', () => {
                isDown = false;
                slider.classList.remove('cursor-grabbing');
                startAutoScroll(); // Buông chuột ra thì cuộn tiếp
            });

            slider.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - slider.offsetLeft;
                const walk = (x - startX) * 1.5; // Nhân 1.5 để kéo nhạy hơn
                
                let targetScroll = scrollLeft - walk;
                
                // Thuật toán: Tạo vòng lặp vô tận khi kéo qua lại 2 bên mép
                if (slider.children[0]) {
                    if (targetScroll <= 0) {
                        targetScroll += slider.children[0].offsetWidth;
                        startX = e.pageX - slider.offsetLeft;
                        scrollLeft = targetScroll;
                    } else if (targetScroll >= slider.children[0].offsetWidth) {
                        targetScroll -= slider.children[0].offsetWidth;
                        startX = e.pageX - slider.offsetLeft;
                        scrollLeft = targetScroll;
                    }
                }
                
                slider.scrollLeft = targetScroll;
            });

            // 3. Logic Hover Chuột (Chỉ dừng khi hover, không nhấn)
            slider.addEventListener('mouseenter', () => {
                if (!isDown) stopAutoScroll();
            });
            slider.addEventListener('mouseleave', () => {
                if (!isDown) startAutoScroll();
            });

            // 4. Hỗ trợ cho điện thoại (Vuốt chạm)
            slider.addEventListener('touchstart', stopAutoScroll, { passive: true });
            slider.addEventListener('touchend', startAutoScroll);
        }
    
        // Gom các lệnh khởi chạy lúc mở trang vào chung 1 hàm window.onload
        window.onload = function() {
            checkCustomerAuth(); // Kiểm tra đăng nhập (Lấy từ common.js)
            loadBestSellers();
            initDragAndScroll();
            loadMainCategories();
            loadBrandsToMarquee();
        };