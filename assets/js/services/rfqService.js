// ========================================================
// FILE: assets/js/services/rfqService.js
// ========================================================

window.RfqService = {
    // 1. Lấy chi tiết 1 đơn RFQ (Bao gồm cả thông tin khách & danh sách sản phẩm)
    async getById(id) {
        // Giả sử bảng của bro tên là 'rfqs' và có bảng trung gian 'rfq_items' nối với 'products'
        return await window.supabaseClient
            .from('rfqs')
            .select(`
                *,
                rfq_items (
                    id, quantity, note,
                    products ( id, name, sku, image_url, price )
                )
            `)
            .eq('id', id)
            .single();
    },

    // 2. Cập nhật trạng thái báo giá (VD: 'pending', 'processing', 'completed')
    async updateStatus(id, newStatus) {
        return await window.supabaseClient
            .from('rfqs')
            .update({ status: newStatus })
            .eq('id', id);
    },

    // 3. Xóa đơn yêu cầu (Nếu cần)
    async delete(id) {
        return await window.supabaseClient
            .from('rfqs')
            .delete()
            .eq('id', id);
    }
};