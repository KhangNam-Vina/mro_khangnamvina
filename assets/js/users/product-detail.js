// ========================================================
// FILE: assets/js/product-detail.js
// XỬ LÝ LOGIC RIÊNG CHO TRANG KHUYẾN MÃI (PROMOTIONS)
// ========================================================

// KÉO DỮ LIỆU TỪ DB LÊN GIAO DIỆN
        async function loadProductDetail() {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');

            const mainContent = document.getElementById('mainContent');
            const loadingScreen = document.getElementById('loadingScreen');
            const errorScreen = document.getElementById('errorScreen');
            const errorText = document.getElementById('errorText');

            if (!productId) {
                loadingScreen.classList.add('hidden');
                errorScreen.classList.remove('hidden');
                errorText.innerText = "Đường dẫn không hợp lệ. Thiếu mã ID sản phẩm.";
                return;
            }

            try {
                const { data: item, error } = await supabaseClient
                    .from('products')
                    .select(`
                        *,
                        categories(id, name),
                        sub_categories(id, name),
                        brands(id, name)
                    `)
                    .eq('id', productId)
                    .single();

                if (error) throw error;
                if (!item) throw new Error("Sản phẩm không tồn tại");

                // Đổ thông tin text
                const brandName = item.brands ? item.brands.name : 'OEM';
                const catName = item.categories ? item.categories.name : 'Chưa phân loại';
                const subCatName = item.sub_categories ? item.sub_categories.name : 'Chưa phân loại';
                const priceFormat = item.price ? new Intl.NumberFormat('vi-VN').format(item.price) + ' đ' : 'Liên hệ để có giá sỉ';

                document.title = item.name + " - MRO Khang Nam";
                document.getElementById('bcCat').innerText = catName;
                if(item.category_id) document.getElementById('bcCat').href = `category.html?category_id=${item.category_id}`;
                document.getElementById('bcSub').innerText = subCatName;
                if(item.sub_category_id) document.getElementById('bcSub').href = `products.html?sub_category_id=${item.sub_category_id}`;
                document.getElementById('bcSku').innerText = item.sku;
                document.getElementById('brandLabel').innerText = brandName;
                document.getElementById('productName').innerText = item.name;
                document.getElementById('detailSku').innerText = item.sku;
                document.getElementById('detailBrand').innerText = brandName;
                document.getElementById('detailUnit').innerText = item.unit;
                document.getElementById('detailPrice').innerText = priceFormat;

                const descText = item.description ? item.description.replace(/\n/g, '<br>') : 'Sản phẩm đang được cập nhật mô tả chi tiết.';
                document.getElementById('tabDescContent').innerHTML = descText;

                // XỬ LÝ DÀN ẢNH PHỤ (Đã nâng cấp chống lỗi kiểu dữ liệu)
                const mainImg = document.getElementById('mainImage');
                const thumbList = document.getElementById('thumbnailList');
                
                mainImg.src = item.image_url || 'https://via.placeholder.com/600x600?text=No+Image';
                thumbList.innerHTML = ''; 
                
                const allImages = [item.image_url]; 
                
                // Bắt đầu "xay" dữ liệu ảnh phụ
                if (item.images) {
                    let extraImgs = [];
                    if (Array.isArray(item.images)) {
                        extraImgs = item.images; // Nếu đúng là mảng
                    } else if (typeof item.images === 'string') {
                        try {
                            extraImgs = JSON.parse(item.images); // Nếu nó là chuỗi JSON
                        } catch(e) {
                            extraImgs = item.images.split(','); // Nếu nó là chuỗi thường cách nhau dấu phẩy
                        }
                    }
                    
                    // Gom chung vào allImages
                    extraImgs.forEach(link => {
                        const cleanLink = link.trim();
                        // Tránh việc ảnh phụ bị trùng với ảnh chính
                        if(cleanLink && cleanLink !== item.image_url) {
                            allImages.push(cleanLink);
                        }
                    });
                }

                // Đổ tất cả ảnh ra giao diện
                allImages.forEach((imgSrc) => {
                    if(!imgSrc) return;
                    thumbList.innerHTML += `
                        <div onclick="changeMainImage('${imgSrc}', this)" class="thumbnail-item w-20 h-20 shrink-0 border-2 rounded cursor-pointer overflow-hidden opacity-70 hover:opacity-100 transition border-gray-200">
                            <img src="${imgSrc}" class="w-full h-full object-cover bg-white">
                        </div>
                    `;
                });
                
                // Cài viền cam cho ảnh đầu tiên
                const firstThumb = thumbList.querySelector('.thumbnail-item');
                if(firstThumb) {
                    firstThumb.classList.remove('opacity-70', 'border-gray-200');
                    firstThumb.classList.add('border-kn-orange');
                }
                

                // XỬ LÝ DATASHEET
                const btnDatasheet = document.getElementById('btnDatasheet');
                const techDetails = document.getElementById('techDetails');
                
                if (item.datasheet_url) {
                    btnDatasheet.href = item.datasheet_url;
                    btnDatasheet.classList.remove('hidden'); 
                    techDetails.innerHTML = `
                        <p class="font-bold text-gray-800 mb-2">Tài liệu kỹ thuật khả dụng:</p>
                        <a href="${item.datasheet_url}" target="_blank" class="text-kn-blue font-bold hover:underline inline-flex items-center">
                            <svg class="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Tải file PDF Datasheet (Catalog)
                        </a>
                    `;
                } else {
                    techDetails.innerHTML = "Nhà sản xuất chưa cung cấp tài liệu kỹ thuật cho mã sản phẩm này.";
                }

                loadingScreen.classList.add('hidden');
                mainContent.classList.remove('hidden');
                await loadRelatedProducts(item);

            } catch (err) {
                console.error("Lỗi tải chi tiết:", err);
                loadingScreen.classList.add('hidden');
                errorScreen.classList.remove('hidden');
                errorText.innerText = err.message;
                 
            }
        }

                async function loadRelatedProducts(currentItem) {

            const grid = document.getElementById("relatedProductsGrid");

            grid.innerHTML = `
                <div class="col-span-full flex justify-center py-10">
                    <svg class="animate-spin h-8 w-8 text-kn-orange" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke-width="4"
                            class="opacity-25"
                            fill="none"
                            stroke="currentColor">
                        </circle>
                        <path class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0
                            C5.373 0 0 5.373 0 12h4
                            zm2 5.291A7.962 7.962 0 014 12H0
                            c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                </div>
            `;

            let queryColumn = null;
            let queryValue = null;

            if (currentItem.family_id) {
                queryColumn = "family_id";
                queryValue = currentItem.family_id;
            }
            else if (currentItem.sub_category_id) {
                queryColumn = "sub_category_id";
                queryValue = currentItem.sub_category_id;
            }

            if (!queryValue) {
                grid.innerHTML =
                    '<p class="col-span-full text-center text-gray-500 italic">Không có sản phẩm cùng dòng.</p>';
                return;
            }

            try {

                const { data, error } = await supabaseClient
                    .from("products")
                    .select(`
                        *,
                        brands(name)
                    `)
                    .eq(queryColumn, queryValue)
                    .neq("id", currentItem.id)
                    .limit(4);

                if (error) throw error;

                if (!data || data.length === 0) {
                    grid.innerHTML =
                        '<p class="col-span-full text-center text-gray-500 italic">Chưa có sản phẩm cùng dòng.</p>';
                    return;
                }

                grid.innerHTML = "";

                data.forEach(item => {

                    const brandName = item.brands?.name || "OEM";

                    const img =
                        item.image_url ||
                        "https://via.placeholder.com/300x300?text=No+Image";

                    grid.innerHTML += `
                        <div class="bg-white border rounded-lg hover:shadow-lg transition overflow-hidden">

                            <a href="product-detail.html?id=${item.id}">
                                <div class="h-48 flex items-center justify-center p-4">
                                    <img src="${img}"
                                        class="max-h-full object-contain hover:scale-105 transition">
                                </div>
                            </a>

                            <div class="p-4">

                                <div class="text-xs text-gray-500 uppercase mb-2">
                                    ${brandName}
                                </div>

                                <a href="product-detail.html?id=${item.id}">
                                    <h4 class="font-bold text-kn-blue hover:text-kn-orange line-clamp-2 min-h-[48px]">
                                        ${item.name}
                                    </h4>
                                </a>

                                <div class="mt-3 text-xs text-gray-500">
                                    SKU: ${item.sku}
                                </div>

                            </div>

                        </div>
                    `;

                });

            } catch (err) {

                console.error("Related Products:", err);

                grid.innerHTML =
                    `<p class="col-span-full text-center text-red-500">
                        Không thể tải sản phẩm cùng dòng.
                    </p>`;
            }

        }

        // HÀM CHUYỂN ẢNH KHI BẤM VÀO THUMBNAIL
        function changeMainImage(src, element) {
            document.getElementById('mainImage').src = src;
            document.querySelectorAll('.thumbnail-item').forEach(el => {
                el.classList.remove('border-kn-orange');
                el.classList.add('opacity-70', 'border-gray-200');
            });
            element.classList.remove('opacity-70', 'border-gray-200');
            element.classList.add('border-kn-orange');
        }

        // HÀM CHUYỂN TAB MÔ TẢ VÀ KỸ THUẬT
        function switchTab(tabName) {
            const btnDesc = document.getElementById('tabDescBtn');
            const btnTech = document.getElementById('tabTechBtn');
            const contentDesc = document.getElementById('tabDescContent');
            const contentTech = document.getElementById('tabTechContent');

            if(tabName === 'desc') {
                btnDesc.classList.replace('text-gray-500', 'text-kn-blue');
                btnDesc.classList.replace('border-transparent', 'border-kn-orange');
                btnDesc.classList.add('bg-gray-50');
                
                btnTech.classList.replace('text-kn-blue', 'text-gray-500');
                btnTech.classList.replace('border-kn-orange', 'border-transparent');
                btnTech.classList.remove('bg-gray-50');

                contentDesc.classList.remove('hidden');
                contentTech.classList.add('hidden');
            } else {
                btnTech.classList.replace('text-gray-500', 'text-kn-blue');
                btnTech.classList.replace('border-transparent', 'border-kn-orange');
                btnTech.classList.add('bg-gray-50');
                
                btnDesc.classList.replace('text-kn-blue', 'text-gray-500');
                btnDesc.classList.replace('border-kn-orange', 'border-transparent');
                btnDesc.classList.remove('bg-gray-50');

                contentTech.classList.remove('hidden');
                contentDesc.classList.add('hidden');
            }
        }
    
        // HÀM TĂNG GIẢM SỐ LƯỢNG MỚI
        function changeQty(step) {
            const qtyInput = document.getElementById('buyQty');
            let currentVal = parseInt(qtyInput.value) || 1;
            let newVal = currentVal + step;
            if (newVal < 1) newVal = 1; // Không cho tụt xuống số âm hoặc 0
            qtyInput.value = newVal;
        }

        // HÀM THÊM VÀO GIỎ HÀNG (ĐÃ UPDATE ĐỂ LẤY SỐ LƯỢNG TỪ Ô NHẬP)
        function addToRFQCart() {
            let cart = JSON.parse(localStorage.getItem('mro_rfq_cart')) || [];
            
            // Lấy số lượng từ ô input do khách gõ
            let qtyToAdd = parseInt(document.getElementById('buyQty').value) || 1; 

            let currentItem = {
                sku: document.getElementById('detailSku').innerText,
                name: document.getElementById('productName').innerText,
                brand: document.getElementById('detailBrand').innerText,
                unit: document.getElementById('detailUnit').innerText,
                qty: qtyToAdd // Nhét đúng số lượng khách chọn vào giỏ
            };
            
            let existingItem = cart.find(item => item.sku === currentItem.sku);
            
            if (existingItem) {
                existingItem.qty += qtyToAdd; // Cộng dồn nếu đã có trong giỏ
            } else {
                cart.push(currentItem); 
            }
            
            localStorage.setItem('mro_rfq_cart', JSON.stringify(cart));
            window.location.href = 'rfq.html'; 
        }
    
        function executeSearch() {
            const keyword = document.getElementById('searchInput').value.trim();
            if (keyword) {
                const currentPath = window.location.pathname;
                const isRoot = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.includes('index');
                const targetUrl = isRoot ? `pages/products.html?search=${encodeURIComponent(keyword)}` : `products.html?search=${encodeURIComponent(keyword)}`;
                window.location.href = targetUrl;
            }
        }

        function handleEnterKey(event) {
            if (event.key === 'Enter') {
                executeSearch();
            }
        }
    
    // 1. TẢI GIỎ HÀNG TỪ LOCALSTORAGE (Mục 2.1 & 2.2)
        function loadCartFromStorage() {
            const cartList = document.getElementById('cartList');
            let cartItems = JSON.parse(localStorage.getItem('mro_rfq_cart')) || [];
            
            if (cartItems.length === 0) {
                cartList.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-500">Giỏ yêu cầu của bạn đang trống.</td></tr>`;
                return;
            }

            cartList.innerHTML = '';
            cartItems.forEach((item, index) => {
                // Hiển thị bảng đẹp hơn với đầy đủ thông tin
                cartList.innerHTML += `
                    <tr class="border-b">
                        <td class="py-3 px-4">
                            <img src="${item.image || 'https://via.placeholder.com/50'}" class="w-12 h-12 object-cover rounded border">
                        </td>
                        <td class="py-3 px-4 font-bold text-kn-blue">${item.sku}</td>
                        <td class="py-3 px-4 font-medium">${item.name}</td>
                        <td class="py-3 px-4 text-xs text-gray-500 uppercase">${item.brand}</td>
                        <td class="py-3 px-4">
                            <div class="flex items-center border rounded w-24">
                                <button onclick="updateQty('${item.sku}', -1)" class="px-2 py-1 bg-gray-100 hover:bg-gray-200">-</button>
                                <input type="number" value="${item.qty}" readonly class="w-full text-center text-sm outline-none bg-transparent">
                                <button onclick="updateQty('${item.sku}', 1)" class="px-2 py-1 bg-gray-100 hover:bg-gray-200">+</button>
                            </div>
                        </td>
                        <td class="py-3 px-4 text-center">
                            <button onclick="removeItem('${item.sku}')" class="text-red-500 hover:text-red-700 font-bold">Xóa</button>
                        </td>
                    </tr>
                `;
            });
        }

        // Cập nhật số lượng (Không cho tụt dưới 1)
        function updateQty(sku, change) {
            let cartItems = JSON.parse(localSrage.getItem('mro_rfq_cart')) || [];
            let item = cartItems.find(i => i.sku === sku);
            if (item) {
                item.qty += change;
                if (item.qty < 1) item.qty = 1;
                localStorage.setItem('mro_rfq_cart', JSON.stringify(cartItems));
                loadCartFromStorage();
            }
        }

        // Xóa một sản phẩm
        function removeItem(sku) {
            let cartItems = JSON.parse(localStorage.getItem('mro_rfq_cart')) || [];
            cartItems = cartItems.filter(i => i.sku !== sku);
            localStorage.setItem('mro_rfq_cart', JSON.stringify(cartItems));
            loadCartFromStorage();
        }

        // Xóa toàn bộ
        function clearAllCart() {
            if(confirm("Bạn có chắc muốn xóa sạch giỏ yêu cầu báo giá?")) {
                localStorage.removeItem('mro_rfq_cart');
                loadCartFromStorage();
            }
        }
    
        // 2. GỬI YÊU CẦU BÁO GIÁ (Mục 2.3 & 2.4)
        async function submitRFQ(event) {
            event.preventDefault(); // Chặn tải lại trang

            let cartItems = JSON.parse(localStorage.getItem('mro_rfq_cart')) || [];
            if (cartItems.length === 0) {
                alert("Giỏ hàng đang trống, vui lòng thêm sản phẩm trước khi gửi!");
                return;
            }

            // Lấy thông tin khách hàng từ Form (2.3)
            const company = document.getElementById('inCompany').value;
            const name = document.getElementById('inFullName').value;
            const phone = document.getElementById('inPhone').value;
            const email = document.getElementById('inEmail').value;
            const address = document.getElementById('inAddress').value;
            const note = document.getElementById('inNote').value;

            // Tạo mã RFQ tự động (VD: RFQ-2026-12345)
            const date = new Date();
            const year = date.getFullYear();
            const randomCode = `RFQ-${year}-${Math.floor(10000 + Math.random() * 90000)}`;

            try {
                // Đổi text nút Submit để báo hiệu đang chạy
                const btnSubmit = document.getElementById('btnSubmitRFQ');
                btnSubmit.innerText = "Đang gửi yêu cầu...";
                btnSubmit.disabled = true;

                // Tùy theo cấu trúc Database của ông:
                // Nếu dùng 2 bảng rfq_orders và rfq_items như ông viết ở 2.4
                
                // BƯỚC 1: Insert vào bảng rfq_orders
                const { data: orderData, error: orderError } = await supabaseClient
                    .from('rfq_orders')
                    .insert([{
                        rfq_code: randomCode,
                        company_name: company,
                        full_name: name,
                        phone: phone,
                        email: email,
                        address: address,
                        note: note,
                        status: 'Chờ xử lý'
                    }])
                    .select('id')
                    .single();

                if (orderError) throw orderError;

                // BƯỚC 2: Insert chi tiết vào bảng rfq_items (có link với id của rfq_orders)
                const itemsToInsert = cartItems.map(item => ({
                    order_id: orderData.id,
                    sku: item.sku,
                    name: item.name,
                    brand: item.brand,
                    qty: item.qty
                }));

                const { error: itemsError } = await supabaseClient
                    .from('rfq_items')
                    .insert(itemsToInsert);

                if (itemsError) throw itemsError;

                // THÀNH CÔNG (Mục 2.5) -> Xóa giỏ và bật trang Success
                localStorage.removeItem('mro_rfq_cart');
                showSuccessPage(randomCode);

            } catch (error) {
                console.error("Lỗi gửi RFQ:", error);
                alert("Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại!");
                document.getElementById('btnSubmitRFQ').innerText = "Gửi Yêu Cầu Báo Giá";
                document.getElementById('btnSubmitRFQ').disabled = false;
            }
        }

        // Bật màn hình Success (2.5)
        function showSuccessPage(rfqCode) {
            // Giấu phần form và giỏ hàng đi
            document.getElementById('rfqMainSection').classList.add('hidden');
            
            // Hiện phần thông báo thành công lên
            const successDiv = document.getElementById('rfqSuccessSection');
            successDiv.classList.remove('hidden');
            
            // In mã RFQ ra
            document.getElementById('displayRfqCode').innerText = rfqCode;
        }

        window.onload = function() {
            checkCustomerAuth();
            loadProductDetail();
        };