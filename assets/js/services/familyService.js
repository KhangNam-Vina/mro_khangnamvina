// ========================================================
// FILE: assets/js/services/familyService.js
// ========================================================

window.FamilyService = {
    async getList({ page = 1, limit = 10, search = '' }) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabaseClient
            .from('families')
            .select('id, name, created_at, sub_category_id, sub_categories(name)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (search) query = query.ilike('name', `%${search}%`);
        return await query;
    },

    async checkExist(name, subCatId, ignoreId = null) {
        let query = supabaseClient.from('families').select('id').eq('name', name).eq('sub_category_id', subCatId);
        if (ignoreId) query = query.neq('id', ignoreId);
        return await query.maybeSingle();
    },

    async create(payload) {
        return await supabaseClient.from('families').insert([payload]);
    },

    async update(id, payload) {
        return await supabaseClient.from('families').update(payload).eq('id', id);
    },

    async delete(id) {
        return await supabaseClient.from('families').delete().eq('id', id);
    }
};