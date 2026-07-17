// ========================================================
// FILE: assets/js/services/productService.js
// SERVICE LAYER - CHUYÊN TRÁCH GỌI DATABASE CHO SẢN PHẨM
// ========================================================

window.ProductService = {
    // 1. Lấy danh sách sản phẩm (Có phân trang & Tìm kiếm)
    async getList({ page = 1, limit = 10, search = '' }) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabaseClient
            .from('products')
            .select('*, categories(name), brands(name)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (search) {
            query = query.or(`sku.ilike.%${search}%,name.ilike.%${search}%`);
        }

        return await query; // Trả về { data, count, error }
    },

    // 2. Kiểm tra mã SKU có bị trùng không
    async checkSkuExist(sku, ignoreId = null) {
        let query = supabaseClient.from('products').select('id').eq('sku', sku);
        if (ignoreId) {
            query = query.neq('id', ignoreId);
        }
        return await query.maybeSingle(); 
    },

    // 3. Thêm mới sản phẩm
    async create(payload) {
        return await supabaseClient.from('products').insert([payload]);
    },

    // 4. Cập nhật sản phẩm
    async update(id, payload) {
        return await supabaseClient.from('products').update(payload).eq('id', id);
    },

    // 5. Xóa sản phẩm
    async delete(id) {
        return await supabaseClient.from('products').delete().eq('id', id);
    }
};