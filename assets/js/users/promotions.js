// ========================================================
// FILE: assets/js/promotions.js
// XỬ LÝ LOGIC RIÊNG CHO TRANG KHUYẾN MÃI (PROMOTIONS)
// ========================================================

const ITEMS_PER_PAGE = 24; 

// --- 1. HÀM TẢI SẢN PHẨM KHUYẾN MÃI ---
async function fetchFilteredProducts() {
    const container = document.getElementById('productGrid'); 
    const paginationContainer = document.getElementById('paginationContainer');
    const title = document.getElementById('pageTitle');
    
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category_id');
    const subCategoryId = urlParams.get('sub_category_id');
    const brandId = urlParams.get('brand_id');
    const searchQuery = urlParams.get('search'); 
    const familyId = urlParams.get('family_id');

    let currentPage = 1;
    if (urlParams.has('page')) {
        currentPage = parseInt(urlParams.get('page'));
    }

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
        // QUAN TRỌNG: Lọc hàng giảm giá
        let query = supabaseClient
            .from('products')
            .select('*, brands(name)', { count: 'exact' })
            .gt('discount_price', 0) // CHÌA KHÓA CỦA TRANG NÀY
            .order('created_at', { ascending: false })
            .range(from, to);

        if (searchQuery) {
            query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
            title.innerText = `Kết quả tìm kiếm khuyến mãi: "${searchQuery}"`;
        } else if (categoryId) {
            query = query.eq('category_id', categoryId);
            title.innerText = "Sản phẩm khuyến mãi theo Danh mục";
        } else if (subCategoryId) {
            if (subCategoryId.includes(',')) {
                const idList = subCategoryId.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                query = query.in('sub_category_id', idList);
            } else {
                query = query.eq('sub_category_id', subCategoryId);
            }
            title.innerText = "Sản phẩm khuyến mãi cùng phân loại";
        } else if (brandId) {
            query = query.eq('brand_id', brandId);
            title.innerText = "Khuyến mãi theo Thương hiệu";
        } else if (familyId) {
            query = query.eq('family_id', familyId);
            title.innerText = "Khuyến mãi cùng Dòng (Family)";
        } else {
            title.innerText = "Tất cả sản phẩm đang Khuyến mãi";
        }
        
        const { data, error, count } = await query;
        if (error) throw error;

        container.innerHTML = '';
        paginationContainer.innerHTML = '';
        
        if (count === 0 || data.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10 font-bold">Hiện chưa có sản phẩm khuyến mãi nào phù hợp!</div>';
            return;
        }

        // ĐỔ DỮ LIỆU SẢN PHẨM 
        data.forEach(item => {
            const brandName = item.brands ? item.brands.name : 'OEM';
            const formatCurrency = (val) => new Intl.NumberFormat('vi-VN').format(val) + ' đ';
            
            let priceHtml = '';
            let badgeHtml = '<span class="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded z-10">Có sẵn</span>';

            if (item.discount_price && item.discount_price > 0 && item.discount_price < item.price) {
                const percent = Math.round(((item.price - item.discount_price) / item.price) * 100);
                badgeHtml = `<span class="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded z-10">GIẢM ${percent}%</span>`;
                
                priceHtml = `
                    <div class="flex flex-col items-end">
                        <span class="text-gray-400 line-through text-[10px]">${formatCurrency(item.price)}</span>
                        <span class="text-red-500 font-black text-sm">${formatCurrency(item.discount_price)}</span>
                    </div>
                `;
            }

            container.innerHTML += `
                <div class="bg-white rounded border border-gray-200 overflow-hidden hover:shadow-lg transition flex flex-col group h-full relative">
                    <a href="product-detail.html?id=${item.id}" class="h-48 flex justify-center items-center p-2 border-b bg-white relative hover:opacity-90">
                        ${badgeHtml}
                        <img src="${item.image_url}" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300">
                    </a>
                    <div class="p-4 flex-1 flex flex-col">
                        <div class="flex justify-between items-center text-[10px] font-bold mb-2">
                            <span class="text-kn-blue bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase">${item.sku}</span>
                            <span class="text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase">${brandName}</span>
                        </div>
                        <a href="product-detail.html?id=${item.id}" class="block">
                            <h3 class="text-sm font-bold text-gray-800 line-clamp-2 hover:text-kn-orange transition-colors">${item.name}</h3>
                        </a>
                        <div class="mt-auto pt-3 flex justify-between items-center text-xs border-t border-gray-100 mt-3">
                            <span class="text-gray-500">ĐVT: <strong class="text-gray-700">${item.unit}</strong></span>
                            ${priceHtml}
                        </div>
                    </div>
                </div>
            `;
        });

        // VẼ THANH PHÂN TRANG
        const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
        if (totalPages > 1) {
            const buildUrl = (page) => {
                const newParams = new URLSearchParams(window.location.search);
                newParams.set('page', page);
                return window.location.pathname + '?' + newParams.toString();
            };

            if (currentPage > 1) paginationContainer.innerHTML += `<a href="${buildUrl(currentPage - 1)}" class="px-3 py-2 bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-md text-sm font-medium transition">&laquo;</a>`;
            for (let i = 1; i <= totalPages; i++) {
                if (i === currentPage) {
                    paginationContainer.innerHTML += `<span class="px-4 py-2 bg-kn-orange text-white border border-kn-orange rounded-md text-sm font-bold">${i}</span>`;
                } else {
                    paginationContainer.innerHTML += `<a href="${buildUrl(i)}" class="px-4 py-2 bg-white border border-gray-300 text-kn-blue hover:bg-blue-50 rounded-md text-sm font-medium transition">${i}</a>`;
                }
            }
            if (currentPage < totalPages) paginationContainer.innerHTML += `<a href="${buildUrl(currentPage + 1)}" class="px-3 py-2 bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-md text-sm font-medium transition">&raquo;</a>`;
        }

    } catch (error) {
        container.innerHTML = `<p class="col-span-full text-center text-red-500 font-bold py-10">Lỗi: ${error.message}</p>`;
    }
}

// --- 2. TẢI SIDEBAR ---
async function loadSidebar() {
    const container = document.getElementById('sidebarCategoryList');
    if(!container) return; 
    
    const urlParams = new URLSearchParams(window.location.search);
    const currentSubIds = urlParams.get('sub_category_id') ? urlParams.get('sub_category_id').split(',') : [];
    
    try {
        const { data, error } = await supabaseClient.from('sub_categories').select('id, name').order('name', { ascending: true });
        if (error) throw error;
        
        let html = '';
        if (data.length > 0) {
            data.forEach(item => {
                const isChecked = currentSubIds.includes(item.id.toString()) ? 'checked' : '';
                html += `
                    <label class="flex items-center cursor-pointer hover:text-kn-orange group">
                        <input type="checkbox" value="${item.id}" onchange="applySidebarFilter()" class="sidebar-filter-cb mr-3 w-4 h-4 text-kn-blue border-gray-300 rounded focus:ring-kn-orange cursor-pointer" ${isChecked}>
                        <span class="group-hover:translate-x-1 transition-transform duration-200">${item.name}</span>
                    </label>
                `;
            });
        } else {
            html = '<p class="text-gray-400 italic">Chưa có loại sản phẩm nào.</p>';
        }
        container.innerHTML = html;
    } catch (error) {
        console.error("Lỗi tải sidebar:", error);
        container.innerHTML = '<span class="text-red-500">Lỗi kết nối...</span>';
    }
}

// --- 3. BỘ LỌC ---
function applySidebarFilter() {
    const checkboxes = document.querySelectorAll('.sidebar-filter-cb:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);
    const urlParams = new URLSearchParams(window.location.search);
    
    if (selectedIds.length > 0) {
        urlParams.set('sub_category_id', selectedIds.join(',')); 
        urlParams.delete('page'); 
    } else {
        urlParams.delete('sub_category_id'); 
    }
    window.location.search = urlParams.toString();
}

// GỌI HÀM KHI TRANG TẢI XONG
window.addEventListener('load', function() {
    checkCustomerAuth(); 
    setTimeout(() => {
        loadSidebar(); 
        fetchFilteredProducts();
    }, 100);
});