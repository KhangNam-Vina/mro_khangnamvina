// ========================================================
// FILE: assets/js/products.js
// XỬ LÝ LOGIC RIÊNG
// ========================================================

// 1. KÉO DỮ LIỆU SUBCATEGORY
        async function fetchSubCategories() {
            const container = document.getElementById('subCategoryContainer');
            const title = document.getElementById('pageTitle');
            const bcCategory = document.getElementById('bcCategory');
            
            const urlParams = new URLSearchParams(window.location.search);
            const catId = urlParams.get('category_id');

            if (!catId) {
                bcCategory.innerText = "Lỗi đường dẫn";
                container.innerHTML = '<div class="col-span-full text-center text-red-500 py-10 font-bold">Lỗi: Không tìm thấy ID Danh mục gốc.</div>';
                return;
            }

            try {
                const { data: catInfo } = await supabaseClient.from('categories').select('name').eq('id', catId).single();
                if(catInfo) {
                    title.innerText = catInfo.name;
                    bcCategory.innerText = catInfo.name;
                }

                const { data: subcats, error } = await supabaseClient
                    .from('sub_categories')
                    .select('*')
                    .eq('category_id', catId)
                    .order('id', { ascending: true });

                if (error) throw error;
                container.innerHTML = '';

                if (subcats.length === 0) {
                    container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10 font-bold">Chưa có danh mục con nào trong phần này!</div>';
                    return;
                }

                subcats.forEach(sub => {
                    container.innerHTML += `
                        <a href="family.html?sub_category_id=${sub.id}" class="group flex flex-col items-center justify-center bg-white border border-gray-200 p-8 hover:border-kn-orange hover:shadow-lg transition-all duration-300 rounded-lg h-48 relative overflow-hidden">
                            <div class="absolute inset-0 bg-kn-blue opacity-0 group-hover:opacity-5 transition-opacity"></div>
                            <h3 class="text-xl font-bold text-gray-800 group-hover:text-kn-blue text-center uppercase tracking-wide mb-2 relative z-10">${sub.name}</h3>
                            <span class="text-sm font-medium text-gray-400 group-hover:text-kn-orange transition-colors relative z-10">Khám phá dòng SP &rarr;</span>
                        </a>
                    `;
                });

            } catch (error) {
                container.innerHTML = `<p class="col-span-full text-center text-red-500 font-bold py-10">Lỗi kết nối: ${error.message}</p>`;
            }
        }

        window.onload = function() {
            checkCustomerAuth(); // Kiểm tra đăng nhập (Lấy từ common.js)
            fetchSubCategories();
        };