// ========================================================
// FILE: assets/components/sidebar.js
// COMPONENT SIDEBAR LỌC DANH MỤC SẢN PHẨM
// ========================================================

const renderSidebar = () => {
    const sidebarHTML = `
        <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm sticky top-6">
            <h3 class="font-bold text-gray-800 mb-4 text-lg">Loại sản phẩm</h3>
            
            <!-- VÙNG DANH SÁCH CUỘN -->
            <div id="sidebarCategoryList" class="space-y-3 text-sm text-gray-600 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                <!-- Icon Loading trong lúc chờ kéo Data -->
                <div class="animate-pulse flex flex-col space-y-3">
                    <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        </div>
    `;

    const sidebarContainer = document.getElementById('app-sidebar');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = sidebarHTML;
    }
};

renderSidebar();