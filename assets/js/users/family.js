

async function fetchFamilies() {
            const container = document.getElementById('familyContainer');
            const title = document.getElementById('pageTitle');
            
            // Bắt cái ID Danh mục con từ thanh địa chỉ (VD: family.html?sub_category_id=5)
            const urlParams = new URLSearchParams(window.location.search);
            const subCatId = urlParams.get('sub_category_id');

            if (!subCatId) {
                title.innerText = "Tất cả Dòng Sản Phẩm";
                container.innerHTML = '<div class="col-span-full text-center text-red-500 py-10 font-bold">Lỗi: Không tìm thấy ID Danh mục con.</div>';
                return;
            }

            try {
                // Đổi Title thành tên Danh mục con cho chuyên nghiệp
                const { data: subCatInfo } = await supabaseClient.from('sub_categories').select('name').eq('id', subCatId).single();
                if(subCatInfo) title.innerText = "Dòng sản phẩm: " + subCatInfo.name;

                // Kéo danh sách Family thuộc cái Danh mục con này
                const { data: families, error } = await supabaseClient
                    .from('families')
                    .select('*')
                    .eq('sub_category_id', subCatId)
                    .order('name', { ascending: true });

                if (error) throw error;
                container.innerHTML = '';

                if (families.length === 0) {
                    container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10 font-bold">Chưa có dòng sản phẩm nào trong danh mục này!</div>';
                    return;
                }

                // Vẽ các ô Dòng sản phẩm (Family) ra màn hình
                families.forEach(family => {
                    // KHI KHÁCH BẤM VÀO, NÓ SẼ BAY SANG TRANG PRODUCTS.HTML KÈM THEO FAMILY_ID
                    container.innerHTML += `
                        <a href="products.html?family_id=${family.id}" class="bg-white rounded border border-gray-200 overflow-hidden hover:shadow-lg hover:border-kn-orange transition-all flex flex-col group p-6 text-center h-40 justify-center">
                            <h3 class="text-lg font-black text-gray-700 group-hover:text-kn-blue uppercase tracking-wide line-clamp-2">${family.name}</h3>
                            <span class="text-sm font-bold text-gray-400 mt-3 group-hover:text-kn-orange transition-colors">Xem mã hàng &rarr;</span>
                        </a>
                    `;
                });

            } catch (error) {
                container.innerHTML = `<p class="col-span-full text-center text-red-500 font-bold py-10">Lỗi kết nối: ${error.message}</p>`;
            }
        }

        window.onload = function() {
            checkCustomerAuth(); // Kiểm tra đăng nhập (Lấy từ common.js)
            fetchFamilies();
        };