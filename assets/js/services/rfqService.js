// ========================================================
// FILE: assets/js/services/rfqService.js
// ========================================================

window.RfqService = {

    // 1. Lấy chi tiết 1 đơn RFQ
    // Bao gồm thông tin khách & danh sách sản phẩm
    async getById(id) {

        return await window.supabaseClient

            .from("rfqs")

            .select(`
                *,
                rfq_items (
                    id,
                    quantity,
                    note,
                    products (
                        id,
                        name,
                        sku,
                        image_path,
                        price
                    )
                )
            `)

            .eq(
                "id",
                id
            )

            .single();
    },


    // 2. Cập nhật trạng thái báo giá
    async updateStatus(
        id,
        newStatus
    ) {

        return await window.supabaseClient

            .from("rfqs")

            .update({
                status: newStatus
            })

            .eq(
                "id",
                id
            );
    },


    // 3. Xóa đơn yêu cầu
    async delete(
        id
    ) {

        return await window.supabaseClient

            .from("rfqs")

            .delete()

            .eq(
                "id",
                id
            );
    }

};