// ========================================================
// FILE: assets/components/footer.js
// COMPONENT FOOTER & NÚT LIÊN HỆ DÙNG CHUNG TOÀN WEBSITE
// ========================================================

const renderFooter = () => {
    const currentPath = window.location.pathname;
    
    // Nhận diện xem trang hiện tại có nằm trong thư mục con hay không
    const isRoot = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.indexOf('/pages/') === -1;
    
    // Setup đường dẫn tương đối cho hình ảnh và link
    const rootPath = isRoot ? './' : '../';

    const footerHTML = `
    <!-- FOOTER CHÍNH -->
    <footer class="relative text-white pt-16 pb-8 border-t-4 border-kn-orange mt-auto overflow-hidden">
        <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="MRO Factory Background" class="absolute inset-0 w-full h-full object-cover z-0">
        <div class="absolute inset-0 bg-kn-blue/90 z-0"></div>
        <div class="container mx-auto px-4 relative z-10">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
                <div>
                    <div class="bg-white p-2 rounded inline-block mb-6 shadow-sm">
                        <a href="${rootPath}index.html">
                            <img src="${rootPath}assets/world mark.png" alt="MRO Khang Nam Logo" class="h-8 w-auto">
                        </a>
                    </div>
                    <p class="text-gray-300 text-sm leading-relaxed">
                        <strong class="text-white block mb-1">Công ty TNHH TM-DV Khang Nam Vi Na</strong>
                        Thành lập từ 2005, tự hào là đơn vị phân phối vật tư công nghiệp chính hãng.
                    </p>
                </div>
            </div>
            <div class="border-t border-white/20 pt-8 text-sm text-gray-400 text-center">
                <p>&copy; 2026 Khang Nam Vi Na. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- CỤM NÚT LIÊN HỆ NỔI (FLOATING CONTACT BUTTONS) -->
    <div class="fixed bottom-8 right-6 z-[9999] flex flex-col space-y-3 items-center">
        <!-- 1. Nút Bản đồ -->
        <a href="https://www.google.com/maps/place/KhangNam+Vina/@10.8532605,106.7953513,21z/data=!4m6!3m5!1s0x3175278028f44c09:0x20ed5669a03b4b58!8m2!3d10.8533265!4d106.7953369!16s%2Fg%2F11s1_yj8l4?entry=ttu&g_ep=EgoyMDI2MDcwOC4wIKXMDSoASAFQAw%3D%3D" target="_blank" title="Xem bản đồ" class="w-11 h-11 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md hover:scale-110 hover:-translate-y-1 transition-all duration-300">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </a>

        <!-- 2. Nút Zalo -->
        <a href="https://zalo.me/0775426786" target="_blank" title="Chat Zalo Kinh Doanh" class="w-11 h-11 bg-[#0068ff] rounded-full flex items-center justify-center text-white shadow-md hover:scale-110 hover:-translate-y-1 transition-all duration-300">
            <span class="font-black text-[11px] tracking-wide">Zalo</span>
        </a>

        <!-- 3. Nút Gọi Điện -->
        <div class="relative w-12 h-12 mt-2 group">
            <div class="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
            <a href="tel:0775426786" title="Gọi Hotline" class="relative w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            </a>
        </div>
    </div>
    `;

    // Nhét cục HTML trên vào thẻ div có id="app-footer"
    const footerContainer = document.getElementById('app-footer');
    if (footerContainer) {
        footerContainer.innerHTML = footerHTML;
    }
};

// Gọi hàm
renderFooter();