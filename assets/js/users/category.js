// ========================================================
// FILE: assets/js/index.js
// XỬ LÝ LOGIC 
// ========================================================

// Hàm 2: Phép thuật kéo danh mục
        async function loadCategoryHub() {
            const urlParams = new URLSearchParams(window.location.search);
            const catId = urlParams.get('category_id');
            const grid = document.getElementById('subCategoryGrid');
            const breadcrumbName = document.getElementById('breadcrumbCategoryName');

            if (!catId) {
                grid.innerHTML = '<p class="col-span-full text-center text-red-500 font-bold py-10">Không tìm thấy mã danh mục. Vui lòng thử lại!</p>';
                breadcrumbName.innerText = "Lỗi";
                return;
            }

            try {
                // Phóng lên Supabase kéo 1 Danh mục gốc và đống Danh mục con bên trong
                const { data, error } = await supabaseClient
                    .from('categories')
                    .select('name, sub_categories(id, name)')
                    .eq('id', catId)
                    .single();

                if (error) throw error;

                // Điền tên danh mục vào Breadcrumb cho đẹp
                breadcrumbName.innerText = data.name;
                document.title = data.name + " - MRO Khang Nam";

                // Xóa icon loading
                grid.innerHTML = '';

                if (!data.sub_categories || data.sub_categories.length === 0) {
                    grid.innerHTML = '<p class="col-span-full text-center text-gray-500 py-10 font-bold">Danh mục này hiện chưa có phân loại nhỏ hơn.</p>';
                    return;
                }

                // Vẽ các ô Danh mục con theo thiết kế của bro
                data.sub_categories.sort((a, b) => a.id - b.id).forEach(sub => {
                    
                    // Logic tự động lấy 2 chữ cái đầu làm icon
                    let initials = "MRO"; 
                    if (sub.name) {
                        const words = sub.name.trim().split(' ');
                        if (words.length >= 2) {
                            initials = (words[0][0] + words[1][0]).toUpperCase();
                        } else {
                            initials = sub.name.substring(0, 2).toUpperCase();
                        }
                    }
                    
                    grid.innerHTML += `
                        <a href="products.html?sub_category_id=${sub.id}" class="group bg-white p-6 rounded-lg border border-gray-200 text-center hover:border-kn-orange hover:shadow-lg transition-all block">
                            <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-50 transition-colors">
                                <span class="font-bold text-xl text-gray-400 group-hover:text-kn-orange">${initials}</span>
                            </div>
                            <h3 class="font-bold text-kn-blue uppercase group-hover:text-kn-orange">${sub.name}</h3>
                            <p class="text-xs text-gray-500 mt-2">Xem chi tiết các mã ${sub.name.toLowerCase()}...</p>
                        </a>
                    `;
                });

            } catch (err) {
                console.error("Lỗi:", err);
                grid.innerHTML = `<p class="col-span-full text-center text-red-500 py-10">Lỗi kết nối: ${err.message}</p>`;
            }
        }
        window.onload = function() {
            checkCustomerAuth(); // Kiểm tra đăng nhập (Lấy từ common.js)
            loadCategoryHub();         // Tải danh sách bài viết
        };