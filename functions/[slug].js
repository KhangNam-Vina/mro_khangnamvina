export async function onRequestGet(context) {
    const { request, env, params } = context;

    const rawSlug = String(params.slug || "").trim();
    const slug = rawSlug.replace(/\.html$/i, "").trim();

    if (!slug) {
        return new Response("Not found", { status: 404 });
    }

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY.");
        return new Response("Server configuration error", { status: 500 });
    }

    async function findBySlug(table, select) {
        const url = new URL(`${supabaseUrl}/rest/v1/${table}`);

        url.searchParams.set("select", select);
        url.searchParams.set("slug", `eq.${slug}`);
        url.searchParams.set("limit", "1");

        const response = await fetch(url.toString(), {
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`
            }
        });

        if (!response.ok) {
            console.error(`Supabase ${table} error:`, response.status);
            return null;
        }

        const rows = await response.json();
        return rows?.[0] || null;
    }

    function buildTargetUrl(path, targetSlug) {
    const targetUrl = new URL(path, request.url);

    targetUrl.searchParams.set("slug", targetSlug);

    return targetUrl;
    }

    try {
        // 1. CATEGORY
        const category = await findBySlug("categories", "id,slug");

        if (category) {
            const targetUrl = buildTargetUrl(
                "/pages/subcategory.html",
                category.slug
            );

            return Response.redirect(targetUrl.toString(), 302);
        }

        // 2. SUBCATEGORY
        const subCategory = await findBySlug(
            "sub_categories",
            "id,slug"
        );

        if (subCategory) {
            const targetUrl = buildTargetUrl(
                "/pages/family.html",
                subCategory.slug
            );

            return Response.redirect(targetUrl.toString(), 302);
        }

        // 3. FAMILY
        const family = await findBySlug(
            "families",
            "id,slug"
        );

        if (family) {
            const targetUrl = buildTargetUrl(
                "/pages/products.html",
                family.slug
            );

            return Response.redirect(targetUrl.toString(), 302);
        }

        // 4. PRODUCT
        const product = await findBySlug(
            "products",
            "id,slug"
        );

       if (product) {
            const targetUrl = buildTargetUrl(
                "/pages/product-detail.html",
                product.slug
            );

            return Response.redirect(targetUrl.toString(), 302);
        }

        // Không tìm thấy slug
        return env.ASSETS.fetch(
            new URL("/404.html", request.url)
        );

    } catch (error) {
        console.error("Slug routing error:", error);

        return new Response("Internal Server Error", {
            status: 500
        });
    }
}