// ========================================================
// FILE: assets/js/services/contactService.js
// QUẢN LÝ DATABASE CHO LIÊN HỆ / YÊU CẦU
// ========================================================

window.ContactService = {
    // Lấy danh sách liên hệ (Có Search Multi-field & Filter Ngày)
    async getList({ page = 1, limit = 10, search = '', dateFilter = 'all' }) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabaseClient
            .from('contacts')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        // Tìm kiếm đa luồng: Tên, Email, SĐT, Công ty
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`);
        }

        // Lọc theo thời gian
        if (dateFilter !== 'all') {
            const now = new Date();
            let pastDate = new Date();
            if (dateFilter === 'today') pastDate.setHours(0,0,0,0);
            else if (dateFilter === '7days') pastDate.setDate(now.getDate() - 7);
            else if (dateFilter === '30days') pastDate.setDate(now.getDate() - 30);
            
            query = query.gte('created_at', pastDate.toISOString());
        }

        return await query;
    },

    // Xóa liên hệ
    async delete(id) {
        return await supabaseClient.from('contacts').delete().eq('id', id);
    }
};