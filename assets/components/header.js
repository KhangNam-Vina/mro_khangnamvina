// ========================================================
// FILE: assets/components/header.js
// COMPONENT HEADER & MENU DÙNG CHUNG CHO TOÀN BỘ WEBSITE
// ========================================================

const renderHeader = () => {
    const currentPath = window.location.pathname;
    
    // Nhận diện xem trang hiện tại có nằm trong thư mục con hay không
    const isRoot = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.indexOf('/pages/') === -1;
    
    // Setup đường dẫn tương đối cho hình ảnh và link
    const rootPath = isRoot ? './' : '../';
    const pagesPath = isRoot ? 'pages/' : '';

    const headerHTML = `
    <!-- 1. TOP HEADER -->
    <header class="bg-white py-4 border-b border-gray-200">
        <div class="container mx-auto flex flex-col xl:flex-row justify-between items-center px-4 gap-4">
            <a href="${rootPath}index.html" class="block shrink-0">
                <img src="${rootPath}assets/world mark.png" alt="MRO Khang Nam Logo" class="h-10 md:h-12 w-auto object-contain">
            </a>
            
            <div class="flex-1 w-full max-w-3xl xl:mx-8">
                <div class="relative flex w-full h-12 shadow-sm">
                    <input id="searchInput" type="text" onkeypress="handleEnterKey(event)" placeholder="Tìm kiếm theo mã SKU, tên sản phẩm..." class="w-full border-2 border-kn-blue rounded-l-md px-4 focus:outline-none focus:border-kn-orange text-sm">
                    <button onclick="executeSearch()" class="bg-kn-blue text-white px-8 rounded-r-md hover:bg-kn-dark transition-colors font-bold whitespace-nowrap">
                        SEARCH
                    </button>
                </div>
            </div>

            <div class="flex items-center space-x-6 text-sm text-gray-600 shrink-0 mt-4 xl:mt-0">
                <div class="hidden md:block text-right border-l border-gray-300 pl-6">
                    <span class="block text-xs text-gray-500 font-medium">Hotline / Zalo</span>
                    <a href="tel:0919699942" class="text-kn-orange text-lg font-bold hover:underline">0919 699 942</a>
                </div>
                
                <!-- NÚT LỊCH SỬ MUA HÀNG -->
                <a id="btnMyOrders" href="${pagesPath}my-rfq.html" class="hidden items-center text-gray-700 font-bold hover:text-kn-orange transition">
                    <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    Lịch sử báo giá
                </a>

                <a id="btnGuestLogin" href="${pagesPath}login.html" class="text-kn-blue font-bold border-2 border-kn-blue px-4 py-2 rounded-md hover:bg-kn-blue hover:text-white transition">Đăng nhập</a>
                
                <button id="btnCustomerLogout" onclick="handleCustomerLogout()" class="hidden text-red-600 font-bold border-2 border-red-500 px-4 py-2 rounded-md hover:bg-red-500 hover:text-white transition">
                    Đăng xuất
                </button>
            </div>
        </div>
    </header>
 
    <!-- 2. MAIN NAVIGATION -->
    <nav class="bg-kn-blue text-white shadow-md relative z-50">
        <div class="container mx-auto px-4">
            <ul class="flex flex-wrap space-x-8 text-sm font-bold uppercase py-3 items-center">
                <li><a href="${rootPath}index.html" class="hover:text-kn-orange transition-colors py-1 block">Home</a></li>
                <li><a href="${pagesPath}products.html" class="hover:text-kn-orange transition-colors py-1 block">Products</a></li>
                <li><a href="${pagesPath}promotions.html" class="hover:text-kn-orange transition-colors py-1 block">Promotions</a></li>               
                <li><a href="${pagesPath}brands.html" class="hover:text-kn-orange transition-colors py-1 block">Brands</a></li>
                <li><a href="${pagesPath}industries.html" class="hover:text-kn-orange transition-colors py-1 block">Industries</a></li>
                <li><a href="${pagesPath}rfq.html" class="hover:text-kn-orange transition-colors py-1 block">RFQ Center</a></li>
                <li><a href="${pagesPath}blog.html" class="hover:text-kn-orange transition-colors py-1 block">Blog</a></li>
                <li><a href="${pagesPath}about.html" class="hover:text-kn-orange transition-colors py-1 block">About</a></li>
                <li><a href="${pagesPath}contact.html" class="hover:text-kn-orange transition-colors py-1 block">Contact</a></li>
            </ul>
        </div>
    </nav>
    `;

    // Nhét cục HTML trên vào thẻ div có id="app-header"
    const headerContainer = document.getElementById('app-header');
    if(headerContainer) {
        headerContainer.innerHTML = headerHTML;
    }
};

// Gọi hàm ngay lập tức khi file script này được tải
renderHeader();