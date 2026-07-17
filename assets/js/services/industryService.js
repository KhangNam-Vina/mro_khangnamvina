window.IndustryService = {
    async getList({ page = 1, limit = 10, search = '' }) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        let query = supabaseClient.from('industries').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
        if (search) query = query.ilike('name', `%${search}%`);
        return await query;
    },
    async checkExist(name, ignoreId = null) {
        let query = supabaseClient.from('industries').select('id').eq('name', name);
        if (ignoreId) query = query.neq('id', ignoreId);
        return await query.maybeSingle();
    },
    async create(payload) { 
        return await supabaseClient.from('industries').insert([payload]); 
    },
    async update(id, payload) { 
        return await supabaseClient.from('industries').update(payload).eq('id', id); 
    },
    async delete(id) { 
        return await supabaseClient.from('industries').delete().eq('id', id); 
    }
};