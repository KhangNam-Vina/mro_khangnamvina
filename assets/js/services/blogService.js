// ========================================================
// FILE: assets/js/services/blogService.js
// QUẢN LÝ DATABASE CHO BLOG
// ========================================================

window.BlogService = {
    // 1. Lấy danh sách Blog (Hỗ trợ phân trang)
    async getList({ page = 1, limit = 10, search = '' }) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabaseClient
            .from('blogs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (search) {
            query = query.ilike('title', `%${search}%`);
        }
        return await query;
    },

    // 2. Kiểm tra Slug trùng (Chống lỗi đường dẫn)
    async checkSlugExist(slug, ignoreId = null) {
        let query = supabaseClient.from('blogs').select('id').eq('slug', slug);
        if (ignoreId) query = query.neq('id', ignoreId);
        return await query.maybeSingle();
    },

    // 3. CRUD cơ bản
    async create(payload) {
        return await supabaseClient.from('blogs').insert([payload]);
    },
    async update(id, payload) {
        return await supabaseClient.from('blogs').update(payload).eq('id', id);
    },
    async delete(id) {
        return await supabaseClient.from('blogs').delete().eq('id', id);
    }
};