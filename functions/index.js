export async function onRequest(context) {
    const { request, env, next } = context;

    const url = new URL(request.url);

    // Chỉ xử lý homepage
    if (url.pathname !== "/" && url.pathname !== "/index.html") {
        return next();
    }

    let response;

    try {
        response = await next();

        const contentType =
            response.headers.get("content-type") || "";

        // Không phải HTML → trả nguyên response
        if (!contentType.includes("text/html")) {
            return response;
        }

        const html = await response.text();

        // ====================================================
        // SUPABASE ENV
        // ====================================================

        const supabaseUrl = env.SUPABASE_URL;
        const supabaseKey = env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return createHtmlResponse(
                html,
                response
            );
        }

        // ====================================================
        // LẤY WEBSITE SETTINGS
        // ====================================================

        const apiUrl =
            `${supabaseUrl}/rest/v1/website_settings` +
            `?id=eq.1&select=company_name,meta_title,meta_description`;

        const seoResponse = await fetch(apiUrl, {
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`
            }
        });

        if (!seoResponse.ok) {
            console.error(
                "Supabase SEO request failed:",
                seoResponse.status
            );

            return createHtmlResponse(
                html,
                response
            );
        }

        const rows = await seoResponse.json();
        const settings = rows?.[0];

        if (!settings) {
            return createHtmlResponse(
                html,
                response
            );
        }

        // ====================================================
        // SEO VALUES
        // ====================================================

        const fallbackTitle = settings.company_name
            ? `${settings.company_name} | Nhà cung cấp vật tư MRO`
            : "MRO Khang Nam | Nhà cung cấp vật tư MRO";

        const title =
            settings.meta_title?.trim() ||
            fallbackTitle;

        const description =
            settings.meta_description?.trim() ||
            "MRO Khang Nam - Nhà cung cấp vật tư công nghiệp, MRO và giải pháp cung ứng cho doanh nghiệp.";

        // ====================================================
        // INJECT SEO
        // ====================================================

        let updatedHtml = html;

        // TITLE
        updatedHtml = updatedHtml.replace(
            /<title>[\s\S]*?<\/title>/i,
            `<title>${escapeHtml(title)}</title>`
        );

        // META DESCRIPTION
        updatedHtml = replaceMeta(
            updatedHtml,
            "name",
            "description",
            description
        );

        // OG TITLE
        updatedHtml = replaceMeta(
            updatedHtml,
            "property",
            "og:title",
            title
        );

        // OG DESCRIPTION
        updatedHtml = replaceMeta(
            updatedHtml,
            "property",
            "og:description",
            description
        );

        // OG URL
        updatedHtml = replaceMeta(
            updatedHtml,
            "property",
            "og:url",
            url.origin + "/"
        );

        // OG TYPE
        updatedHtml = replaceMeta(
            updatedHtml,
            "property",
            "og:type",
            "website"
        );

        return createHtmlResponse(
            updatedHtml,
            response
        );

    } catch (error) {
        console.error(
            "Homepage SEO injection error:",
            error
        );

        // Nếu đã lấy được response thì trả response gốc
        if (response) {
            return response;
        }

        return next();
    }
}


// ========================================================
// CREATE HTML RESPONSE
// ========================================================

function createHtmlResponse(html, originalResponse) {
    const headers = new Headers(originalResponse.headers);

    // HTML đã thay đổi → các header này không còn đảm bảo đúng
    headers.delete("content-length");
    headers.delete("etag");
    headers.delete("content-encoding");

    return new Response(html, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers
    });
}


// ========================================================
// META HELPER
// ========================================================

function replaceMeta(
    html,
    attribute,
    key,
    content
) {
    const escapedContent =
        escapeHtml(content);

    const regex = new RegExp(
        `<meta\\s+[^>]*${attribute}=["']${escapeRegex(key)}["'][^>]*>`,
        "i"
    );

    const replacement =
        `<meta ${attribute}="${key}" content="${escapedContent}">`;

    if (regex.test(html)) {
        return html.replace(
            regex,
            replacement
        );
    }

    return html.replace(
        /<\/head>/i,
        `    ${replacement}\n</head>`
    );
}


// ========================================================
// HTML ESCAPE
// ========================================================

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ========================================================
// REGEX ESCAPE
// ========================================================

function escapeRegex(value) {
    return String(value).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}