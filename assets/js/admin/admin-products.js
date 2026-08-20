/* =========================================================
   FILE: assets/js/admin/admin-products.js

   QUẢN LÝ SẢN PHẨM
   ---------------------------------------------------------
   MEDIA VERSION:
   - Supabase Storage upload
   - Main image: thêm / đổi / xóa
   - Gallery: thêm / xóa từng ảnh
   - Hỗ trợ sản phẩm cũ dùng URL ngoài
   - Không xóa URL ngoài Supabase
   - Đồng bộ products.image_url / products.images
   - Rollback upload nếu database update thất bại

   STORAGE:

   product-images/
   └── products/
       └── PRODUCT_ID/
           ├── main/
           └── gallery/

   DATABASE:

   image_url
   images

   SIZE:
   available_sizes = nguồn chính
   size = fallback dữ liệu cũ
========================================================= */


/* =========================================================
   CONSTANTS
========================================================= */

const STORAGE_BUCKET =
    "product-images";


const STORAGE_PRODUCT_PREFIX =
    "products";


const MAX_IMAGE_SIZE =
    10 * 1024 * 1024;


const ALLOWED_IMAGE_TYPES = [

    "image/jpeg",

    "image/png",

    "image/webp",

    "image/gif"

];


/* =========================================================
   STATE
========================================================= */

const state = {

    products: [],

    categories: [],

    subCategories: [],

    families: [],

    industries: [],

    brands: [],

    editingId: null,

    currentPage: 1,

    itemsPerPage: 10,

    totalItems: 0,

    searchQuery: "",

    filterCategoryId: "all",

    filterIndustryId: "all",

    filterStock: "all",


    /* -----------------------------------------
       MEDIA DRAFT
    ------------------------------------------ */

    mediaDraft: {

        mainUrl: null,

        mainRemoved: false,

        existingGallery: [],

        removedGallery: [],

        pendingMainFile: null,

        pendingExtraFiles: []

    }

};


/* =========================================================
   DOM
========================================================= */

const DOM = {

    listView:
        document.getElementById(
            "productListView"
        ),

    formView:
        document.getElementById(
            "productFormView"
        ),

    form:
        document.getElementById(
            "productForm"
        ),

    tableBody:
        document.getElementById(
            "productTableBody"
        ),

    pagination:
        document.getElementById(
            "paginationContainer"
        ),

    search:
        document.getElementById(
            "searchInput"
        ),

    btnAdd:
        document.getElementById(
            "btnAddProduct"
        ),

    btnBack:
        document.getElementById(
            "btnBackToProducts"
        ),

    btnCancel:
        document.getElementById(
            "btnCancelForm"
        ),

    btnSubmit:
        document.getElementById(
            "btnSubmit"
        ),

    formTitle:
        document.getElementById(
            "formTitle"
        ),

    category:
        document.getElementById(
            "category_id"
        ),

    subCategory:
        document.getElementById(
            "sub_category_id"
        ),

    family:
        document.getElementById(
            "family_id"
        ),

    industry:
        document.getElementById(
            "industrySelect"
        ),

    filterCategory:
        document.getElementById(
            "filterCategorySelect"
        ),

    filterIndustry:
        document.getElementById(
            "filterIndustrySelect"
        ),

    filterStock:
        document.getElementById(
            "filterStockSelect"
        ),

    total:
        document.getElementById(
            "productTotal"
        ),

    inStock:
        document.getElementById(
            "productInStock"
        ),

    outOfStock:
        document.getElementById(
            "productOutOfStock"
        ),

    onSale:
        document.getElementById(
            "productOnSale"
        ),

    toast:
        document.getElementById(
            "toastContainer"
        ),


    /* -----------------------------------------
       MEDIA
    ------------------------------------------ */

    mainImageFile:
        document.getElementById(
            "image_file"
        ),

    mainImagePreview:
        document.getElementById(
            "mainImagePreview"
        ),

    extraImageFiles:
        document.getElementById(
            "extra_image_files"
        ),

    extraImagesPreview:
        document.getElementById(
            "extraImagesPreview"
        )

};


/* =========================================================
   BASIC HELPERS
========================================================= */

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(
        value
    ).replace(
        /[&<>'"]/g,
        character => ({

            "&":
                "&amp;",

            "<":
                "&lt;",

            ">":
                "&gt;",

            "'":
                "&#39;",

            '"':
                "&quot;"

        })[character]
    );

}


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


function formatCurrency(
    value
) {

    const number =
        Number(
            value
        );


    if (
        !number
    ) {

        return "Liên hệ";

    }


    return new Intl.NumberFormat(
        "vi-VN"
    ).format(
        number
    ) + " đ";

}


/* =========================================================
   SIZE
========================================================= */

function normalizeProductSizes(
    product
) {

    if (
        !product
    ) {

        return [];

    }


    let sizes =
        product.available_sizes;


    if (
        Array.isArray(
            sizes
        )
    ) {

        sizes =
            sizes
                .map(
                    size =>
                        String(
                            size
                        ).trim()
                )
                .filter(
                    Boolean
                );

    }

    else if (
        typeof sizes ===
        "string"
    ) {

        sizes =
            sizes
                .split(",")
                .map(
                    size =>
                        size.trim()
                )
                .filter(
                    Boolean
                );

    }

    else {

        sizes = [];

    }


    if (
        sizes.length === 0 &&
        product.size !== null &&
        product.size !== undefined &&
        String(
            product.size
        ).trim()
    ) {

        sizes =
            String(
                product.size
            )
                .split(",")
                .map(
                    size =>
                        size.trim()
                )
                .filter(
                    Boolean
                );

    }


    return [
        ...new Set(
            sizes
        )
    ];

}


function renderProductSizes(
    product
) {

    const sizes =
        normalizeProductSizes(
            product
        );


    if (
        sizes.length === 0
    ) {

        return `
            <span
                class="
                    text-xs
                    text-gray-400
                    italic
                "
            >
                —
            </span>
        `;

    }


    return `

        <div
            class="
                flex
                flex-wrap
                items-center
                gap-1
                max-w-[180px]
            "
        >

            ${
                sizes
                    .map(
                        size => `

                            <span
                                class="
                                    inline-flex
                                    items-center
                                    px-2
                                    py-1
                                    rounded-md
                                    bg-blue-50
                                    border
                                    border-blue-100
                                    text-kn-blue
                                    text-[10px]
                                    font-black
                                    leading-none
                                "
                            >
                                ${escapeHTML(
                                    size
                                )}
                            </span>

                        `
                    )
                    .join("")
            }

        </div>

    `;

}


/* =========================================================
   IMAGE DATA NORMALIZATION
========================================================= */

function normalizeImageList(
    value
) {

    if (
        !value
    ) {

        return [];

    }


    if (
        Array.isArray(
            value
        )
    ) {

        return value
            .map(
                item =>
                    String(
                        item
                    ).trim()
            )
            .filter(
                Boolean
            );

    }


    if (
        typeof value ===
        "string"
    ) {

        const text =
            value.trim();


        if (
            !text
        ) {

            return [];

        }


        try {

            const parsed =
                JSON.parse(
                    text
                );


            if (
                Array.isArray(
                    parsed
                )
            ) {

                return parsed
                    .map(
                        item =>
                            String(
                                item
                            ).trim()
                    )
                    .filter(
                        Boolean
                    );

            }

        } catch (
            error
        ) {

            /* Không phải JSON */

        }


        return text
            .split(
                /[\n,]+/
            )
            .map(
                item =>
                    item.trim()
            )
            .filter(
                Boolean
            );

    }


    return [];

}


/* =========================================================
   STORAGE URL DETECTION
========================================================= */

function isSupabaseStorageUrl(
    url
) {

    if (
        !url ||
        typeof url !==
        "string"
    ) {

        return false;

    }


    return (

        url.includes(
            `/storage/v1/object/public/${STORAGE_BUCKET}/`
        )

        ||

        url.includes(
            `/storage/v1/object/sign/${STORAGE_BUCKET}/`
        )

        ||

        url.includes(
            `/storage/v1/object/authenticated/${STORAGE_BUCKET}/`
        )

    );

}


/* =========================================================
   EXTRACT STORAGE PATH
========================================================= */

function getStoragePathFromUrl(
    url
) {

    if (
        !isSupabaseStorageUrl(
            url
        )
    ) {

        return null;

    }


    try {

        const parsed =
            new URL(
                url
            );


        const publicMarker =
            `/storage/v1/object/public/${STORAGE_BUCKET}/`;


        const signMarker =
            `/storage/v1/object/sign/${STORAGE_BUCKET}/`;


        const authenticatedMarker =
            `/storage/v1/object/authenticated/${STORAGE_BUCKET}/`;


        let path =
            null;


        if (
            parsed.pathname.includes(
                publicMarker
            )
        ) {

            path =
                parsed.pathname.split(
                    publicMarker
                )[1];

        }

        else if (
            parsed.pathname.includes(
                signMarker
            )
        ) {

            path =
                parsed.pathname.split(
                    signMarker
                )[1];

        }

        else if (
            parsed.pathname.includes(
                authenticatedMarker
            )
        ) {

            path =
                parsed.pathname.split(
                    authenticatedMarker
                )[1];

        }


        if (
            !path
        ) {

            return null;

        }


        return decodeURIComponent(
            path
        );

    } catch (
        error
    ) {

        console.warn(
            "Không thể phân tích Storage URL:",
            url,
            error
        );


        return null;

    }

}


/* =========================================================
   ONLY DELETE OWN PRODUCT STORAGE
========================================================= */

function isOwnProductStorageUrl(
    url,
    productId
) {

    const path =
        getStoragePathFromUrl(
            url
        );


    if (
        !path ||
        !productId
    ) {

        return false;

    }


    const prefix =
        `${STORAGE_PRODUCT_PREFIX}/${productId}/`;


    return path.startsWith(
        prefix
    );

}


/* =========================================================
   FILE VALIDATION
========================================================= */

function validateImageFile(
    file
) {

    if (
        !file
    ) {

        throw new Error(
            "Không tìm thấy file ảnh."
        );

    }


    if (
        !ALLOWED_IMAGE_TYPES.includes(
            file.type
        )
    ) {

        throw new Error(
            `File "${file.name}" không phải định dạng ảnh được hỗ trợ.`
        );

    }


    if (
        file.size >
        MAX_IMAGE_SIZE
    ) {

        throw new Error(
            `File "${file.name}" vượt quá 10MB.`
        );

    }


    return true;

}


/* =========================================================
   FILE EXTENSION
========================================================= */

function getFileExtension(
    file
) {

    const originalName =
        String(
            file.name ||
            ""
        );


    const extension =
        originalName
            .split(".")
            .pop()
            .toLowerCase();


    const allowed = [

        "jpg",

        "jpeg",

        "png",

        "webp",

        "gif"

    ];


    if (
        allowed.includes(
            extension
        )
    ) {

        return extension ===
            "jpeg"

            ? "jpg"

            : extension;

    }


    const mimeMap = {

        "image/jpeg":
            "jpg",

        "image/png":
            "png",

        "image/webp":
            "webp",

        "image/gif":
            "gif"

    };


    return (
        mimeMap[
            file.type
        ] ||
        "webp"
    );

}


/* =========================================================
   STORAGE FILE NAME
========================================================= */

function createStorageFileName(
    file,
    prefix
) {

    const extension =
        getFileExtension(
            file
        );


    const random =
        Math.random()
            .toString(
                36
            )
            .slice(
                2,
                10
            );


    return (

        `${prefix}-${Date.now()}-${random}.${extension}`

    );

}


/* =========================================================
   GET PUBLIC URL
========================================================= */

function getStoragePublicUrl(
    path
) {

    const {
        data
    } =
        window.supabaseClient
            .storage
            .from(
                STORAGE_BUCKET
            )
            .getPublicUrl(
                path
            );


    if (
        !data ||
        !data.publicUrl
    ) {

        throw new Error(
            "Không thể lấy Public URL của ảnh."
        );

    }


    return data.publicUrl;

}


/* =========================================================
   UPLOAD IMAGE
========================================================= */

async function uploadProductImage(
    file,
    productId,
    folder
) {

    validateImageFile(
        file
    );


    const prefix =
        folder === "main"
            ? "main"
            : "gallery";


    const fileName =
        createStorageFileName(
            file,
            prefix
        );


    const storagePath =
        [
            STORAGE_PRODUCT_PREFIX,
            productId,
            folder,
            fileName
        ].join(
            "/"
        );


    const {
        error
    } =
        await window.supabaseClient
            .storage
            .from(
                STORAGE_BUCKET
            )
            .upload(
                storagePath,
                file,
                {

                    cacheControl:
                        "31536000",

                    upsert:
                        false,

                    contentType:
                        file.type

                }
            );


    if (
        error
    ) {

        throw new Error(
            `Upload ảnh "${file.name}" thất bại: ${error.message}`
        );

    }


    return {

        path:
            storagePath,

        url:
            getStoragePublicUrl(
                storagePath
            )

    };

}


/* =========================================================
   REMOVE STORAGE FILES
========================================================= */

async function removeStoragePaths(
    paths
) {

    const cleanPaths =
        [
            ...new Set(
                (paths || [])
                    .filter(
                        Boolean
                    )
            )
        ];


    if (
        cleanPaths.length === 0
    ) {

        return;

    }


    const {
        error
    } =
        await window.supabaseClient
            .storage
            .from(
                STORAGE_BUCKET
            )
            .remove(
                cleanPaths
            );


    if (
        error
    ) {

        throw error;

    }

}


/* =========================================================
   REMOVE UPLOADED FILES
   ---------------------------------------------------------
   Dùng rollback.
========================================================= */

async function removeUploadedFiles(
    uploadedFiles
) {

    if (
        !uploadedFiles ||
        uploadedFiles.length === 0
    ) {

        return;

    }


    const paths =
        uploadedFiles
            .map(
                item =>
                    item.path
            )
            .filter(
                Boolean
            );


    if (
        paths.length === 0
    ) {

        return;

    }


    try {

        await removeStoragePaths(
            paths
        );

    } catch (
        error
    ) {

        console.warn(
            "Rollback Storage thất bại:",
            error
        );

    }

}


/* =========================================================
   MEDIA DRAFT RESET
========================================================= */

function resetMediaDraft() {

    state.mediaDraft = {

        mainUrl:
            null,

        mainRemoved:
            false,

        existingGallery:
            [],

        removedGallery:
            [],

        pendingMainFile:
            null,

        pendingExtraFiles:
            []

    };

}


/* =========================================================
   RENDER MAIN IMAGE
========================================================= */

function renderMainImagePreview(
    url
) {

    if (
        !DOM.mainImagePreview
    ) {

        return;

    }


    if (
        !url
    ) {

        DOM.mainImagePreview.innerHTML = `

            <div
                class="
                    text-center
                    px-3
                "
            >

                <div
                    class="
                        text-[11px]
                        text-gray-400
                    "
                >
                    Chưa có ảnh
                </div>

            </div>

        `;

        return;

    }


    DOM.mainImagePreview.innerHTML = `

        <div
            class="
                relative
                w-full
                h-full
                group
            "
        >

            <img
                src="${escapeAttribute(
                    url
                )}"
                alt="Ảnh đại diện"
                class="
                    w-full
                    h-full
                    object-contain
                    bg-white
                "
                onerror="
                    this.onerror=null;
                    this.parentElement.innerHTML='<div class=&quot;w-full h-full flex items-center justify-center text-[10px] text-gray-400&quot;>Ảnh lỗi</div>';
                "
            >


            <button
                type="button"
                data-media-action="remove-main"
                class="
                    absolute
                    top-1
                    right-1
                    w-7
                    h-7
                    rounded-full
                    bg-red-500
                    text-white
                    flex
                    items-center
                    justify-center
                    text-sm
                    font-black
                    shadow-md
                    opacity-0
                    group-hover:opacity-100
                    transition
                    hover:bg-red-600
                "
                title="Xóa ảnh đại diện"
            >
                ×
            </button>


            <span
                class="
                    absolute
                    left-1
                    bottom-1
                    px-1.5
                    py-0.5
                    rounded
                    bg-black/60
                    text-white
                    text-[9px]
                    font-bold
                "
            >
                Ảnh đại diện
            </span>

        </div>

    `;

}


/* =========================================================
   RENDER EXTRA IMAGES
========================================================= */

function renderExtraImagesPreview(
    urls = []
) {

    if (
        !DOM.extraImagesPreview
    ) {

        return;

    }


    const normalized =
        normalizeImageList(
            urls
        );


    DOM.extraImagesPreview.innerHTML =
        "";


    if (
        normalized.length === 0
    ) {

        return;

    }


    normalized.forEach(
        (
            url,
            index
        ) => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className = `

                relative
                aspect-square
                rounded-lg
                border
                border-gray-200
                bg-gray-50
                overflow-hidden
                group

            `;


            wrapper.dataset.galleryUrl =
                url;


            wrapper.innerHTML = `

                <img
                    src="${escapeAttribute(
                        url
                    )}"
                    alt="Ảnh phụ ${index + 1}"
                    class="
                        w-full
                        h-full
                        object-contain
                        bg-white
                    "
                    onerror="
                        this.onerror=null;
                        this.parentElement.innerHTML='<div class=&quot;w-full h-full flex items-center justify-center text-[10px] text-gray-400&quot;>Ảnh lỗi</div>';
                    "
                >


                <button
                    type="button"
                    data-media-action="remove-gallery"
                    data-url="${escapeAttribute(
                        url
                    )}"
                    class="
                        absolute
                        top-1
                        right-1
                        w-7
                        h-7
                        rounded-full
                        bg-red-500
                        text-white
                        flex
                        items-center
                        justify-center
                        text-sm
                        font-black
                        shadow-md
                        opacity-0
                        group-hover:opacity-100
                        transition
                        hover:bg-red-600
                    "
                    title="Xóa ảnh"
                >
                    ×
                </button>


                <span
                    class="
                        absolute
                        left-1
                        bottom-1
                        px-1.5
                        py-0.5
                        rounded
                        bg-black/60
                        text-white
                        text-[9px]
                        font-bold
                    "
                >
                    ${index + 1}
                </span>

            `;


            DOM.extraImagesPreview.appendChild(
                wrapper
            );

        }
    );

}


/* =========================================================
   RENDER PENDING EXTRA FILES
========================================================= */

function renderPendingExtraFiles() {

    if (
        !DOM.extraImagesPreview
    ) {

        return;

    }


    state.mediaDraft.pendingExtraFiles
        .forEach(
            (
                file,
                index
            ) => {

                const objectUrl =
                    file.__previewUrl ||
                    URL.createObjectURL(
                        file
                    );


                file.__previewUrl =
                    objectUrl;


                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.className = `

                    relative
                    aspect-square
                    rounded-lg
                    border
                    border-blue-200
                    bg-blue-50
                    overflow-hidden
                    group

                `;


                wrapper.dataset.pendingIndex =
                    String(
                        index
                    );


                wrapper.innerHTML = `

                    <img
                        src="${escapeAttribute(
                            objectUrl
                        )}"
                        alt="Ảnh mới"
                        class="
                            w-full
                            h-full
                            object-contain
                            bg-white
                        "
                    >


                    <button
                        type="button"
                        data-media-action="remove-pending-gallery"
                        data-index="${index}"
                        class="
                            absolute
                            top-1
                            right-1
                            w-7
                            h-7
                            rounded-full
                            bg-red-500
                            text-white
                            flex
                            items-center
                            justify-center
                            text-sm
                            font-black
                            shadow-md
                            opacity-0
                            group-hover:opacity-100
                            transition
                            hover:bg-red-600
                        "
                        title="Bỏ ảnh đã chọn"
                    >
                        ×
                    </button>


                    <span
                        class="
                            absolute
                            left-1
                            bottom-1
                            px-1.5
                            py-0.5
                            rounded
                            bg-kn-blue
                            text-white
                            text-[9px]
                            font-bold
                        "
                    >
                        Mới
                    </span>

                `;


                DOM.extraImagesPreview.appendChild(
                    wrapper
                );

            }
        );

}


/* =========================================================
   RENDER COMPLETE GALLERY
========================================================= */

function renderCompleteGalleryPreview() {

    if (
        !DOM.extraImagesPreview
    ) {

        return;

    }


    DOM.extraImagesPreview.innerHTML =
        "";


    state.mediaDraft
        .existingGallery
        .forEach(
            (
                url,
                index
            ) => {

                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.className = `

                    relative
                    aspect-square
                    rounded-lg
                    border
                    border-gray-200
                    bg-gray-50
                    overflow-hidden
                    group

                `;


                wrapper.dataset.galleryUrl =
                    url;


                wrapper.innerHTML = `

                    <img
                        src="${escapeAttribute(
                            url
                        )}"
                        alt="Ảnh phụ ${index + 1}"
                        class="
                            w-full
                            h-full
                            object-contain
                            bg-white
                        "
                        onerror="
                            this.onerror=null;
                            this.parentElement.innerHTML='<div class=&quot;w-full h-full flex items-center justify-center text-[10px] text-gray-400&quot;>Ảnh lỗi</div>';
                        "
                    >


                    <button
                        type="button"
                        data-media-action="remove-gallery"
                        data-url="${escapeAttribute(
                            url
                        )}"
                        class="
                            absolute
                            top-1
                            right-1
                            w-7
                            h-7
                            rounded-full
                            bg-red-500
                            text-white
                            flex
                            items-center
                            justify-center
                            text-sm
                            font-black
                            shadow-md
                            opacity-0
                            group-hover:opacity-100
                            transition
                            hover:bg-red-600
                        "
                        title="Xóa ảnh"
                    >
                        ×
                    </button>


                    <span
                        class="
                            absolute
                            left-1
                            bottom-1
                            px-1.5
                            py-0.5
                            rounded
                            bg-black/60
                            text-white
                            text-[9px]
                            font-bold
                        "
                    >
                        ${index + 1}
                    </span>

                `;


                DOM.extraImagesPreview.appendChild(
                    wrapper
                );

            }
        );


    renderPendingExtraFiles();

}


/* =========================================================
   LOAD EXISTING MEDIA
========================================================= */

function loadExistingMedia(
    item
) {

    resetMediaDraft();


    state.mediaDraft.mainUrl =
        item?.image_url ||
        null;


    state.mediaDraft.existingGallery =
        normalizeImageList(
            item?.images
        );


    renderMainImagePreview(
        state.mediaDraft.mainUrl
    );


    renderCompleteGalleryPreview();

}


/* =========================================================
   RESET MEDIA INPUTS
========================================================= */

function resetMediaInputs() {

    resetMediaDraft();


    if (
        DOM.mainImageFile
    ) {

        DOM.mainImageFile.value =
            "";

    }


    if (
        DOM.extraImageFiles
    ) {

        DOM.extraImageFiles.value =
            "";

    }


    renderMainImagePreview(
        ""
    );


    if (
        DOM.extraImagesPreview
    ) {

        DOM.extraImagesPreview.innerHTML =
            "";

    }

}


/* =========================================================
   MAIN IMAGE REMOVE
========================================================= */

function markMainImageRemoved() {

    if (
        !state.editingId
    ) {

        state.mediaDraft.mainUrl =
            null;

        state.mediaDraft.mainRemoved =
            true;

        renderMainImagePreview(
            ""
        );

        return;

    }


    if (
        !state.mediaDraft.mainUrl
    ) {

        return;

    }


    const confirmed =
        window.confirm(
            "Xóa ảnh đại diện hiện tại?\n\nẢnh sẽ được xóa khỏi Storage nếu ảnh thuộc bucket product-images."
        );


    if (
        !confirmed
    ) {

        return;

    }


    state.mediaDraft.mainRemoved =
        true;


    state.mediaDraft.mainUrl =
        null;


    renderMainImagePreview(
        ""
    );

}


/* =========================================================
   REMOVE EXISTING GALLERY IMAGE
========================================================= */

function markGalleryImageRemoved(
    url
) {

    if (
        !url
    ) {

        return;

    }


    const confirmed =
        window.confirm(
            "Xóa ảnh này khỏi gallery sản phẩm?"
        );


    if (
        !confirmed
    ) {

        return;

    }


    state.mediaDraft.existingGallery =
        state.mediaDraft
            .existingGallery
            .filter(
                item =>
                    item !==
                    url
            );


    if (
        !state.mediaDraft
            .removedGallery
            .includes(
                url
            )
    ) {

        state.mediaDraft
            .removedGallery
            .push(
                url
            );

    }


    renderCompleteGalleryPreview();

}


/* =========================================================
   REMOVE PENDING GALLERY FILE
========================================================= */

function removePendingGalleryFile(
    index
) {

    const numericIndex =
        Number(
            index
        );


    if (
        Number.isNaN(
            numericIndex
        )
    ) {

        return;

    }


    const file =
        state.mediaDraft
            .pendingExtraFiles[
                numericIndex
            ];


    if (
        file?.__previewUrl
    ) {

        try {

            URL.revokeObjectURL(
                file.__previewUrl
            );

        } catch (
            error
        ) {

            /* ignore */

        }

    }


    state.mediaDraft
        .pendingExtraFiles
        .splice(
            numericIndex,
            1
        );


    renderCompleteGalleryPreview();

}


/* =========================================================
   MAIN IMAGE FILE SELECT
========================================================= */

function handleMainImageSelected(
    file
) {

    if (
        !file
    ) {

        return;

    }


    try {

        validateImageFile(
            file
        );

    } catch (
        error
    ) {

        showToast(
            error.message,
            "error"
        );


        if (
            DOM.mainImageFile
        ) {

            DOM.mainImageFile.value =
                "";

        }


        return;

    }


    state.mediaDraft
        .pendingMainFile =
        file;


    state.mediaDraft
        .mainRemoved =
        false;


    const objectUrl =
        URL.createObjectURL(
            file
        );


    renderMainImagePreview(
        objectUrl
    );

}


/* =========================================================
   EXTRA FILES SELECT
========================================================= */

function handleExtraImagesSelected(
    files
) {

    const selected =
        Array.from(
            files || []
        );


    if (
        selected.length === 0
    ) {

        return;

    }


    const validFiles =
        [];


    for (
        const file of selected
    ) {

        try {

            validateImageFile(
                file
            );


            validFiles.push(
                file
            );

        } catch (
            error
        ) {

            showToast(
                error.message,
                "error"
            );

        }

    }


    state.mediaDraft
        .pendingExtraFiles
        .push(
            ...validFiles
        );


    if (
        DOM.extraImageFiles
    ) {

        DOM.extraImageFiles.value =
            "";

    }


    renderCompleteGalleryPreview();

}


/* =========================================================
   MEDIA CLICK EVENTS
========================================================= */

function bindMediaPreviewEvents() {

    DOM.mainImageFile?.addEventListener(
        "change",
        event => {

            const file =
                event.target.files?.[0];


            handleMainImageSelected(
                file
            );

        }
    );


    DOM.extraImageFiles?.addEventListener(
        "change",
        event => {

            handleExtraImagesSelected(
                event.target.files
            );

        }
    );


    DOM.mainImagePreview?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-media-action]"
                );


            if (
                !button
            ) {

                return;

            }


            if (
                button.dataset.mediaAction ===
                "remove-main"
            ) {

                markMainImageRemoved();

            }

        }
    );


    DOM.extraImagesPreview?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-media-action]"
                );


            if (
                !button
            ) {

                return;

            }


            const action =
                button.dataset.mediaAction;


            if (
                action ===
                "remove-gallery"
            ) {

                markGalleryImageRemoved(
                    button.dataset.url
                );

            }


            if (
                action ===
                "remove-pending-gallery"
            ) {

                removePendingGalleryFile(
                    button.dataset.index
                );

            }

        }
    );

}


/* =========================================================
   UPLOAD MAIN
========================================================= */

async function uploadPendingMain(
    productId
) {

    const file =
        state.mediaDraft
            .pendingMainFile;


    if (
        !file
    ) {

        return null;

    }


    return await uploadProductImage(
        file,
        productId,
        "main"
    );

}


/* =========================================================
   UPLOAD GALLERY
========================================================= */

async function uploadPendingGallery(
    productId
) {

    const files =
        state.mediaDraft
            .pendingExtraFiles;


    if (
        !files ||
        files.length === 0
    ) {

        return [];

    }


    const uploaded =
        [];


    for (
        const file of files
    ) {

        const result =
            await uploadProductImage(
                file,
                productId,
                "gallery"
            );


        uploaded.push(
            result
        );

    }


    return uploaded;

}


/* =========================================================
   LOAD DROPDOWNS
========================================================= */

async function loadAllDropdowns() {

    try {

        const [

            categoryResult,

            subCategoryResult,

            familyResult,

            industryResult,

            brandResult

        ] =
            await Promise.all([

                window.supabaseClient
                    .from(
                        "categories"
                    )
                    .select(
                        "id, name"
                    )
                    .order(
                        "name",
                        {
                            ascending:
                                true
                        }
                    ),

                window.supabaseClient
                    .from(
                        "sub_categories"
                    )
                    .select(
                        "id, name, category_id"
                    )
                    .order(
                        "name",
                        {
                            ascending:
                                true
                        }
                    ),

                window.supabaseClient
                    .from(
                        "families"
                    )
                    .select(
                        "id, name, sub_category_id"
                    )
                    .order(
                        "name",
                        {
                            ascending:
                                true
                        }
                    ),

                window.supabaseClient
                    .from(
                        "industries"
                    )
                    .select(
                        "id, name"
                    )
                    .order(
                        "name",
                        {
                            ascending:
                                true
                        }
                    ),

                window.supabaseClient
                    .from(
                        "brands"
                    )
                    .select(
                        "id, name"
                    )
                    .order(
                        "name",
                        {
                            ascending:
                                true
                        }
                    )

            ]);


        if (
            categoryResult.error
        ) {

            throw categoryResult.error;

        }


        if (
            subCategoryResult.error
        ) {

            throw subCategoryResult.error;

        }


        if (
            familyResult.error
        ) {

            throw familyResult.error;

        }


        if (
            industryResult.error
        ) {

            throw industryResult.error;

        }


        if (
            brandResult.error
        ) {

            throw brandResult.error;

        }


        state.categories =
            categoryResult.data ||
            [];


        state.subCategories =
            subCategoryResult.data ||
            [];


        state.families =
            familyResult.data ||
            [];


        state.industries =
            industryResult.data ||
            [];


        state.brands =
            brandResult.data ||
            [];


        populateSelect(
            DOM.category,
            state.categories,
            "-- Chọn danh mục gốc --"
        );


        populateSelect(
            DOM.industry,
            state.industries,
            "-- Chọn ngành hàng --"
        );


        populateSelect(
            DOM.filterCategory,
            state.categories,
            "Tất cả danh mục"
        );


        populateSelect(
            DOM.filterIndustry,
            state.industries,
            "Tất cả ngành hàng"
        );


        resetCatalogDropdowns();

        refreshBrandDatalist();


    } catch (
        error
    ) {

        console.error(
            "Lỗi tải Dropdowns:",
            error
        );


        showToast(
            "Không thể tải dữ liệu danh mục.",
            "error"
        );

    }

}


/* =========================================================
   SELECT
========================================================= */

function populateSelect(
    element,
    data,
    placeholder
) {

    if (
        !element
    ) {

        return;

    }


    element.innerHTML = `

        <option value="">
            ${escapeHTML(
                placeholder
            )}
        </option>

        ${
            (data || [])
                .map(
                    item => `

                        <option
                            value="${escapeAttribute(
                                item.id
                            )}"
                        >
                            ${escapeHTML(
                                item.name
                            )}
                        </option>

                    `
                )
                .join("")
        }

    `;

}


/* =========================================================
   BRAND
========================================================= */

function refreshBrandDatalist() {

    const brandList =
        document.getElementById(
            "brandList"
        );


    if (
        !brandList
    ) {

        return;

    }


    brandList.innerHTML =
        state.brands
            .map(
                brand => `

                    <option
                        value="${escapeAttribute(
                            brand.name
                        )}"
                    ></option>

                `
            )
            .join("");

}


/* =========================================================
   CATALOG CASCADE
========================================================= */

function resetCatalogDropdowns() {

    populateSelect(
        DOM.subCategory,
        [],
        "-- Chọn nhóm hàng --"
    );


    populateSelect(
        DOM.family,
        [],
        "-- Chọn dòng sản phẩm --"
    );

}


function updateSubCategories(
    categoryId
) {

    const filtered =
        categoryId

            ? state.subCategories.filter(
                item =>
                    String(
                        item.category_id
                    ) ===
                    String(
                        categoryId
                    )
            )

            : [];


    populateSelect(
        DOM.subCategory,
        filtered,
        "-- Chọn nhóm hàng --"
    );


    populateSelect(
        DOM.family,
        [],
        "-- Chọn dòng sản phẩm --"
    );

}


function updateFamilies(
    subCategoryId
) {

    const filtered =
        subCategoryId

            ? state.families.filter(
                item =>
                    String(
                        item.sub_category_id
                    ) ===
                    String(
                        subCategoryId
                    )
            )

            : [];


    populateSelect(
        DOM.family,
        filtered,
        "-- Chọn dòng sản phẩm --"
    );

}


/* =========================================================
   FETCH PRODUCTS
========================================================= */

async function fetchProducts() {

    if (
        !DOM.tableBody
    ) {

        return;

    }


    renderTableLoading();


    try {

        const from =
            (
                state.currentPage -
                1
            ) *
            state.itemsPerPage;


        const to =
            from +
            state.itemsPerPage -
            1;


        let query =
            window.supabaseClient

                .from(
                    "products"
                )

                .select(
                    "*, brands(name)",
                    {
                        count:
                            "exact"
                    }
                );


        if (
            state.searchQuery
        ) {

            const keyword =
                state.searchQuery
                    .replace(
                        /[%_,]/g,
                        ""
                    );


            if (
                keyword
            ) {

                query =
                    query.or(
                        `sku.ilike.%${keyword}%,name.ilike.%${keyword}%`
                    );

            }

        }


        if (
            state.filterCategoryId !==
            "all"
        ) {

            query =
                query.eq(
                    "category_id",
                    state.filterCategoryId
                );

        }


        if (
            state.filterIndustryId !==
            "all"
        ) {

            query =
                query.eq(
                    "industry_id",
                    state.filterIndustryId
                );

        }


        if (
            state.filterStock ===
            "in_stock"
        ) {

            query =
                query.gt(
                    "stock_quantity",
                    0
                );

        }


        if (
            state.filterStock ===
            "out_of_stock"
        ) {

            query =
                query.lte(
                    "stock_quantity",
                    0
                );

        }


        const {
            data,
            count,
            error
        } =
            await query

                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                )

                .range(
                    from,
                    to
                );


        if (
            error
        ) {

            throw error;

        }


        state.products =
            data ||
            [];


        state.totalItems =
            count ||
            0;


        updateStatistics();

        renderProducts();

        renderPagination();


    } catch (
        error
    ) {

        console.error(
            "Lỗi tải sản phẩm:",
            error
        );


        DOM.tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="
                        text-center
                        py-12
                        text-red-500
                        font-bold
                    "
                >

                    Không thể tải danh sách sản phẩm.

                    <div
                        class="
                            text-xs
                            font-normal
                            mt-1
                            text-red-400
                        "
                    >
                        ${escapeHTML(
                            error.message
                        )}
                    </div>

                </td>

            </tr>

        `;

    }

}


/* =========================================================
   TABLE LOADING
========================================================= */

function renderTableLoading() {

    if (
        !DOM.tableBody
    ) {

        return;

    }


    DOM.tableBody.innerHTML = `

        <tr>

            <td
                colspan="9"
                class="
                    text-center
                    py-12
                    text-gray-400
                "
            >

                <div
                    class="
                        inline-block
                        w-6
                        h-6
                        border-2
                        border-kn-blue
                        border-t-transparent
                        rounded-full
                        animate-spin
                    "
                ></div>

                <div
                    class="
                        mt-2
                    "
                >
                    Đang tải sản phẩm...
                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    if (
        DOM.total
    ) {

        DOM.total.textContent =
            state.totalItems;

    }


    const inStock =
        state.products.filter(
            product =>
                Number(
                    product.stock_quantity
                ) > 0
        ).length;


    const outOfStock =
        state.products.filter(
            product =>
                Number(
                    product.stock_quantity
                ) <= 0
        ).length;


    const onSale =
        state.products.filter(
            product => {

                const price =
                    Number(
                        product.price
                    );


                const discount =
                    Number(
                        product.discount_price
                    );


                return (
                    discount > 0 &&
                    price > 0 &&
                    discount < price
                );

            }
        ).length;


    if (
        DOM.inStock
    ) {

        DOM.inStock.textContent =
            inStock;

    }


    if (
        DOM.outOfStock
    ) {

        DOM.outOfStock.textContent =
            outOfStock;

    }


    if (
        DOM.onSale
    ) {

        DOM.onSale.textContent =
            onSale;

    }

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts() {

    if (
        !DOM.tableBody
    ) {

        return;

    }


    if (
        state.products.length ===
        0
    ) {

        DOM.tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="
                        text-center
                        py-14
                        text-gray-400
                    "
                >
                    Không tìm thấy sản phẩm.
                </td>

            </tr>

        `;

        return;

    }


    const from =
        (
            state.currentPage -
            1
        ) *
        state.itemsPerPage;


    DOM.tableBody.innerHTML =
        state.products
            .map(
                (
                    item,
                    index
                ) => {

                    const brandName =
                        item.brands?.name ||
                        "OEM";


                    const imageUrl =
                        item.image_url ||
                        "";


                    const imageHTML =
                        imageUrl

                            ? `

                                <img
                                    src="${escapeAttribute(
                                        imageUrl
                                    )}"
                                    alt="${escapeAttribute(
                                        item.name
                                    )}"
                                    class="
                                        w-10
                                        h-10
                                        object-contain
                                        mx-auto
                                        border
                                        border-gray-200
                                        rounded-lg
                                        bg-white
                                    "
                                    loading="lazy"
                                    onerror="
                                        this.onerror=null;
                                        this.src='../assets/images/world mark.png';
                                    "
                                >

                            `

                            : `

                                <div
                                    class="
                                        w-10
                                        h-10
                                        bg-gray-100
                                        border
                                        border-gray-200
                                        rounded-lg
                                        flex
                                        items-center
                                        justify-center
                                        text-[9px]
                                        text-gray-400
                                        mx-auto
                                    "
                                >
                                    No Img
                                </div>

                            `;


                    return `

                        <tr
                            class="
                                border-b
                                border-gray-100
                                hover:bg-blue-50/30
                                transition
                            "
                        >

                            <td
                                class="
                                    px-4
                                    py-3
                                    text-center
                                    font-bold
                                    text-gray-400
                                    text-xs
                                "
                            >
                                ${
                                    from +
                                    index +
                                    1
                                }
                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                    text-center
                                "
                            >
                                ${imageHTML}
                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                    font-mono
                                    font-bold
                                    text-kn-blue
                                    text-xs
                                    whitespace-nowrap
                                "
                            >
                                ${escapeHTML(
                                    item.sku
                                )}
                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                    font-bold
                                    text-gray-800
                                    text-sm
                                "
                            >
                                ${escapeHTML(
                                    item.name
                                )}
                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                    text-gray-600
                                    text-xs
                                    font-bold
                                "
                            >
                                ${escapeHTML(
                                    brandName
                                )}
                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                "
                            >
                                ${renderProductSizes(
                                    item
                                )}
                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                    text-gray-800
                                    font-bold
                                    text-sm
                                    whitespace-nowrap
                                "
                            >
                                ${formatCurrency(
                                    item.price
                                )}
                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                    text-center
                                "
                            >

                                <span
                                    class="
                                        inline-flex
                                        items-center
                                        px-2
                                        py-1
                                        rounded-md
                                        text-xs
                                        font-bold
                                        ${
                                            Number(
                                                item.stock_quantity
                                            ) > 0

                                                ? `
                                                    bg-green-50
                                                    text-green-700
                                                    border
                                                    border-green-100
                                                `

                                                : `
                                                    bg-red-50
                                                    text-red-600
                                                    border
                                                    border-red-100
                                                `
                                        }
                                    "
                                >

                                    ${
                                        Number(
                                            item.stock_quantity
                                        ) > 0

                                            ? Number(
                                                item.stock_quantity
                                            )

                                            : "Hết hàng"
                                    }

                                </span>

                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                    text-center
                                    whitespace-nowrap
                                "
                            >

                                <button
                                    type="button"
                                    data-action="edit"
                                    data-id="${escapeAttribute(
                                        item.id
                                    )}"
                                    class="
                                        p-1.5
                                        text-blue-600
                                        hover:bg-blue-100
                                        rounded-lg
                                        transition
                                        font-bold
                                        text-xs
                                        uppercase
                                    "
                                >
                                    Sửa
                                </button>


                                <button
                                    type="button"
                                    data-action="delete"
                                    data-id="${escapeAttribute(
                                        item.id
                                    )}"
                                    class="
                                        p-1.5
                                        text-red-500
                                        hover:bg-red-50
                                        rounded-lg
                                        transition
                                        font-bold
                                        text-xs
                                        uppercase
                                    "
                                >
                                    Xóa
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   PAGINATION
========================================================= */

function renderPagination() {

    if (
        !DOM.pagination
    ) {

        return;

    }


    const totalPages =
        Math.ceil(
            state.totalItems /
            state.itemsPerPage
        );


    if (
        totalPages <= 1
    ) {

        DOM.pagination.innerHTML =
            "";

        return;

    }


    const pages =
        [];


    const maxVisible =
        5;


    let startPage =
        Math.max(
            1,
            state.currentPage -
            2
        );


    let endPage =
        Math.min(
            totalPages,
            startPage +
            maxVisible -
            1
        );


    if (
        endPage -
        startPage +
        1 <
        maxVisible
    ) {

        startPage =
            Math.max(
                1,
                endPage -
                maxVisible +
                1
            );

    }


    for (
        let page =
            startPage;
        page <=
        endPage;
        page++
    ) {

        pages.push(
            page
        );

    }


    DOM.pagination.innerHTML = `

        <div
            class="
                text-xs
                text-gray-500
                font-medium
            "
        >
            Trang
            <strong>
                ${state.currentPage}
            </strong>
            /
            ${totalPages}
        </div>


        <div
            class="
                flex
                items-center
                gap-1.5
            "
        >

            <button
                type="button"
                data-page-action="prev"
                ${
                    state.currentPage === 1
                        ? "disabled"
                        : ""
                }
                class="
                    px-3
                    py-1.5
                    rounded-lg
                    text-xs
                    font-bold
                    border
                    ${
                        state.currentPage === 1

                            ? `
                                text-gray-300
                                border-gray-100
                                cursor-not-allowed
                            `

                            : `
                                text-gray-600
                                border-gray-200
                                hover:bg-gray-50
                            `
                    }
                "
            >
                ← Trước
            </button>


            ${
                pages
                    .map(
                        page => `

                            <button
                                type="button"
                                data-page="${page}"
                                class="
                                    px-3
                                    py-1.5
                                    rounded-lg
                                    text-xs
                                    font-bold
                                    border
                                    ${
                                        page ===
                                        state.currentPage

                                            ? `
                                                bg-kn-blue
                                                text-white
                                                border-kn-blue
                                            `

                                            : `
                                                text-gray-600
                                                border-gray-200
                                                hover:bg-gray-50
                                            `
                                    }
                                "
                            >
                                ${page}
                            </button>

                        `
                    )
                    .join("")
            }


            <button
                type="button"
                data-page-action="next"
                ${
                    state.currentPage ===
                    totalPages
                        ? "disabled"
                        : ""
                }
                class="
                    px-3
                    py-1.5
                    rounded-lg
                    text-xs
                    font-bold
                    border
                    ${
                        state.currentPage ===
                        totalPages

                            ? `
                                text-gray-300
                                border-gray-100
                                cursor-not-allowed
                            `

                            : `
                                text-gray-600
                                border-gray-200
                                hover:bg-gray-50
                            `
                    }
                "
            >
                Sau →
            </button>

        </div>

    `;

}


/* =========================================================
   SHOW ADD FORM
========================================================= */

function showAddForm() {

    state.editingId =
        null;


    if (
        DOM.form
    ) {

        DOM.form.reset();

    }


    resetCatalogDropdowns();

    resetMediaInputs();


    if (
        typeof CKEDITOR !==
            "undefined" &&
        CKEDITOR.instances
            .description
    ) {

        CKEDITOR.instances
            .description
            .setData(
                ""
            );

    }


    if (
        DOM.formTitle
    ) {

        DOM.formTitle.textContent =
            "Nhập Sản Phẩm Mới";

    }


    if (
        DOM.btnSubmit
    ) {

        DOM.btnSubmit.textContent =
            "Nhập kho sản phẩm";

    }


    DOM.listView?.classList.add(
        "hidden"
    );


    DOM.formView?.classList.remove(
        "hidden"
    );


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


/* =========================================================
   CANCEL FORM
========================================================= */

function cancelForm() {

    state.editingId =
        null;


    resetMediaInputs();


    DOM.formView?.classList.add(
        "hidden"
    );


    DOM.listView?.classList.remove(
        "hidden"
    );


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


/* =========================================================
   EDIT PRODUCT
========================================================= */

function editProduct(
    id
) {

    const item =
        state.products.find(
            product =>
                String(
                    product.id
                ) ===
                String(id)
        );


    if (
        !item
    ) {

        showToast(
            "Không tìm thấy sản phẩm.",
            "error"
        );

        return;

    }


    state.editingId =
        item.id;


    /* -----------------------------------------
       BASIC
    ------------------------------------------ */

    const sku =
        document.getElementById(
            "sku"
        );


    const name =
        document.getElementById(
            "name"
        );


    const origin =
        document.getElementById(
            "origin"
        );


    if (
        sku
    ) {

        sku.value =
            item.sku ||
            "";

    }


    if (
        name
    ) {

        name.value =
            item.name ||
            "";

    }


    if (
        origin
    ) {

        origin.value =
            item.origin ||
            "";

    }


    /* -----------------------------------------
       PRICE
    ------------------------------------------ */

    const price =
        document.getElementById(
            "price"
        );


    const discountPrice =
        document.getElementById(
            "discount_price"
        );


    const unit =
        document.getElementById(
            "unit"
        );


    const stock =
        document.getElementById(
            "stock_quantity"
        );


    const minOrder =
        document.getElementById(
            "min_order_quantity"
        );


    const badge =
        document.getElementById(
            "badge"
        );


    if (
        price
    ) {

        price.value =
            item.price ??
            "";

    }


    if (
        discountPrice
    ) {

        discountPrice.value =
            item.discount_price ??
            "";

    }


    if (
        unit
    ) {

        unit.value =
            item.unit ||
            "Cái";

    }


    if (
        stock
    ) {

        stock.value =
            item.stock_quantity ??
            0;

    }


    if (
        minOrder
    ) {

        minOrder.value =
            item.min_order_quantity ??
            1;

    }


    if (
        badge
    ) {

        badge.value =
            item.badge ||
            "";

    }


    /* -----------------------------------------
       SIZE
    ------------------------------------------ */

    const sizeInput =
        document.getElementById(
            "available_sizes"
        );


    if (
        sizeInput
    ) {

        sizeInput.value =
            normalizeProductSizes(
                item
            ).join(
                ", "
            );

    }


    /* -----------------------------------------
       DATASHEET
    ------------------------------------------ */

    const datasheet =
        document.getElementById(
            "inDatasheet"
        );


    if (
        datasheet
    ) {

        datasheet.value =
            item.datasheet_url ||
            "";

    }


    /* -----------------------------------------
       CONTENT
    ------------------------------------------ */

    const shortDescription =
        document.getElementById(
            "short_description"
        );


    const specifications =
        document.getElementById(
            "specifications"
        );


    if (
        shortDescription
    ) {

        shortDescription.value =
            item.short_description ||
            "";

    }


    if (
        specifications
    ) {

        specifications.value =
            item.specifications ||
            "";

    }


    if (
        typeof CKEDITOR !==
            "undefined" &&
        CKEDITOR.instances
            .description
    ) {

        CKEDITOR.instances
            .description
            .setData(
                item.description ||
                ""
            );

    }


    /* -----------------------------------------
       CATEGORY
    ------------------------------------------ */

    if (
        DOM.category
    ) {

        DOM.category.value =
            item.category_id ||
            "";

    }


    updateSubCategories(
        item.category_id
    );


    if (
        DOM.subCategory
    ) {

        DOM.subCategory.value =
            item.sub_category_id ||
            "";

    }


    updateFamilies(
        item.sub_category_id
    );


    if (
        DOM.family
    ) {

        DOM.family.value =
            item.family_id ||
            "";

    }


    if (
        DOM.industry
    ) {

        DOM.industry.value =
            item.industry_id ||
            "";

    }


    /* -----------------------------------------
       BRAND
    ------------------------------------------ */

    const brandInput =
        document.getElementById(
            "brand_input"
        );


    if (
        brandInput
    ) {

        const foundBrand =
            state.brands.find(
                brand =>
                    String(
                        brand.id
                    ) ===
                    String(
                        item.brand_id
                    )
            );


        brandInput.value =
            foundBrand?.name ||
            "";

    }


    /* -----------------------------------------
       MEDIA
    ------------------------------------------ */

    loadExistingMedia(
        item
    );


    /* -----------------------------------------
       FORM UI
    ------------------------------------------ */

    if (
        DOM.formTitle
    ) {

        DOM.formTitle.textContent =
            `Sửa Sản Phẩm: ${item.sku}`;

    }


    if (
        DOM.btnSubmit
    ) {

        DOM.btnSubmit.textContent =
            "Cập nhật sản phẩm";

    }


    DOM.listView?.classList.add(
        "hidden"
    );


    DOM.formView?.classList.remove(
        "hidden"
    );


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


/* =========================================================
   DESCRIPTION
========================================================= */

function getDescriptionValue() {

    if (
        typeof CKEDITOR !==
            "undefined" &&
        CKEDITOR.instances
            .description
    ) {

        return CKEDITOR.instances
            .description
            .getData();

    }


    const description =
        document.getElementById(
            "description"
        );


    return description
        ? description.value
        : "";

}


/* =========================================================
   BRAND
========================================================= */

async function resolveBrandId() {

    const brandInput =
        document.getElementById(
            "brand_input"
        );


    const name =
        brandInput
            ? brandInput.value.trim()
            : "";


    if (
        !name
    ) {

        return null;

    }


    const found =
        state.brands.find(
            brand =>
                brand.name
                    .toLowerCase() ===
                name.toLowerCase()
        );


    if (
        found
    ) {

        return found.id;

    }


    const {
        data,
        error
    } =
        await window.supabaseClient

            .from(
                "brands"
            )

            .insert([
                {
                    name
                }
            ])

            .select(
                "id, name"
            )

            .single();


    if (
        error
    ) {

        throw new Error(
            "Lỗi khi tạo thương hiệu mới: " +
            error.message
        );

    }


    state.brands.push(
        data
    );


    refreshBrandDatalist();


    return data.id;

}


/* =========================================================
   SIZE ARRAY
========================================================= */

function getAvailableSizes() {

    const input =
        document.getElementById(
            "available_sizes"
        );


    const text =
        input
            ? input.value.trim()
            : "";


    if (
        !text
    ) {

        return null;

    }


    const sizes =
        [
            ...new Set(
                text
                    .split(",")
                    .map(
                        size =>
                            size.trim()
                    )
                    .filter(
                        Boolean
                    )
            )
        ];


    return sizes.length
        ? sizes
        : null;

}


/* =========================================================
   PRODUCT PAYLOAD
========================================================= */

function buildProductPayload(
    brandId
) {

    return {

        sku:
            document
                .getElementById(
                    "sku"
                )
                .value
                .trim(),


        name:
            document
                .getElementById(
                    "name"
                )
                .value
                .trim(),


        available_sizes:
            getAvailableSizes(),


        category_id:
            document
                .getElementById(
                    "category_id"
                )
                .value ||
            null,


        sub_category_id:
            document
                .getElementById(
                    "sub_category_id"
                )
                .value ||
            null,


        family_id:
            document
                .getElementById(
                    "family_id"
                )
                .value ||
            null,


        industry_id:
            document
                .getElementById(
                    "industrySelect"
                )
                .value ||
            null,


        brand_id:
            brandId,


        origin:
            document
                .getElementById(
                    "origin"
                )
                .value
                .trim() ||
            null,


        price:
            document
                .getElementById(
                    "price"
                )
                .value ||
            null,


        discount_price:
            document
                .getElementById(
                    "discount_price"
                )
                .value ||
            null,


        unit:
            document
                .getElementById(
                    "unit"
                )
                .value ||
            "Cái",


        stock_quantity:
            document
                .getElementById(
                    "stock_quantity"
                )
                .value ||
            0,


        min_order_quantity:
            document
                .getElementById(
                    "min_order_quantity"
                )
                .value ||
            1,


        badge:
            document
                .getElementById(
                    "badge"
                )
                .value ||
            null,


        datasheet_url:
            document
                .getElementById(
                    "inDatasheet"
                )
                .value
                .trim() ||
            null,


        short_description:
            document
                .getElementById(
                    "short_description"
                )
                .value
                .trim() ||
            null,


        specifications:
            document
                .getElementById(
                    "specifications"
                )
                .value
                .trim() ||
            null,


        description:
            getDescriptionValue() ||
            null

    };

}


/* =========================================================
   BUILD FINAL MEDIA
========================================================= */

function buildFinalGalleryUrls(
    newExtraUploads
) {

    const uploadedUrls =
        (newExtraUploads || [])
            .map(
                item =>
                    item.url
            )
            .filter(
                Boolean
            );


    return [
        ...new Set(
            [
                ...state.mediaDraft
                    .existingGallery,

                ...uploadedUrls
            ]
        )
    ];

}


/* =========================================================
   DELETE OLD MEDIA AFTER DB SUCCESS
========================================================= */

async function cleanupRemovedMedia(
    productId,
    oldMainUrl,
    oldGalleryUrls,
    finalMainUrl,
    finalGalleryUrls
) {

    const pathsToDelete =
        [];


    /* -----------------------------------------
       MAIN
    ------------------------------------------ */

    if (
        oldMainUrl &&
        oldMainUrl !==
        finalMainUrl &&
        isOwnProductStorageUrl(
            oldMainUrl,
            productId
        )
    ) {

        const path =
            getStoragePathFromUrl(
                oldMainUrl
            );


        if (
            path
        ) {

            pathsToDelete.push(
                path
            );

        }

    }


    /* -----------------------------------------
       GALLERY
    ------------------------------------------ */

    const finalSet =
        new Set(
            finalGalleryUrls
        );


    for (
        const oldUrl of
        oldGalleryUrls
    ) {

        if (
            finalSet.has(
                oldUrl
            )
        ) {

            continue;

        }


        if (
            !isOwnProductStorageUrl(
                oldUrl,
                productId
            )
        ) {

            continue;

        }


        const path =
            getStoragePathFromUrl(
                oldUrl
            );


        if (
            path
        ) {

            pathsToDelete.push(
                path
            );

        }

    }


    if (
        pathsToDelete.length ===
        0
    ) {

        return;

    }


    try {

        await removeStoragePaths(
            pathsToDelete
        );

    } catch (
        error
    ) {

        /*
           Database đã đúng.

           Nếu Storage cleanup lỗi,
           không rollback DB vì sẽ phức tạp
           và có nguy cơ làm mất dữ liệu mới.

           Chỉ báo warning.
        */

        console.warn(
            "DB đã cập nhật nhưng không thể dọn một số ảnh Storage:",
            error
        );


        showToast(
            "Đã lưu sản phẩm nhưng một số ảnh cũ chưa được dọn khỏi Storage.",
            "error"
        );

    }

}


/* =========================================================
   SAVE PRODUCT
========================================================= */

async function saveProduct(
    event
) {

    if (
        event
    ) {

        event.preventDefault();

    }


    const btn =
        DOM.btnSubmit;


    if (
        !btn
    ) {

        return;

    }


    const originalText =
        btn.textContent;


    btn.disabled =
        true;


    let insertedProductId =
        null;


    const uploadedFiles =
        [];


    try {

        if (
            !window.supabaseClient
        ) {

            throw new Error(
                "Chưa kết nối Supabase."
            );

        }


        /* -----------------------------------------
           VALIDATE BASIC
        ------------------------------------------ */

        const sku =
            document
                .getElementById(
                    "sku"
                )
                .value
                .trim();


        const name =
            document
                .getElementById(
                    "name"
                )
                .value
                .trim();


        if (
            !sku
        ) {

            throw new Error(
                "Mã SKU là bắt buộc!"
            );

        }


        if (
            !name
        ) {

            throw new Error(
                "Tên sản phẩm là bắt buộc!"
            );

        }


        /* -----------------------------------------
           VALIDATE PENDING FILES
        ------------------------------------------ */

        if (
            state.mediaDraft
                .pendingMainFile
        ) {

            validateImageFile(
                state.mediaDraft
                    .pendingMainFile
            );

        }


        for (
            const file of
            state.mediaDraft
                .pendingExtraFiles
        ) {

            validateImageFile(
                file
            );

        }


        /* -----------------------------------------
           BRAND
        ------------------------------------------ */

        btn.textContent =
            "Đang kiểm tra thương hiệu...";


        const brandId =
            await resolveBrandId();


        /* -----------------------------------------
           PRODUCT PAYLOAD
        ------------------------------------------ */

        const payload =
            buildProductPayload(
                brandId
            );


        /* =================================================
           CREATE PRODUCT
        ================================================= */

        if (
            !state.editingId
        ) {

            btn.textContent =
                "Đang tạo sản phẩm...";


            const {
                data: newProduct,
                error
            } =
                await window.supabaseClient

                    .from(
                        "products"
                    )

                    .insert([
                        payload
                    ])

                    .select(
                        "id"
                    )

                    .single();


            if (
                error
            ) {

                throw error;

            }


            if (
                !newProduct?.id
            ) {

                throw new Error(
                    "Không lấy được ID sản phẩm vừa tạo."
                );

            }


            insertedProductId =
                newProduct.id;


            /* -----------------------------------------
               MAIN UPLOAD
            ------------------------------------------ */

            let mainUpload =
                null;


            if (
                state.mediaDraft
                    .pendingMainFile
            ) {

                btn.textContent =
                    "Đang tải ảnh đại diện...";


                mainUpload =
                    await uploadPendingMain(
                        insertedProductId
                    );


                if (
                    mainUpload
                ) {

                    uploadedFiles.push(
                        mainUpload
                    );

                }

            }


            /* -----------------------------------------
               GALLERY UPLOAD
            ------------------------------------------ */

            btn.textContent =
                "Đang tải ảnh phụ...";


            const extraUploads =
                await uploadPendingGallery(
                    insertedProductId
                );


            uploadedFiles.push(
                ...extraUploads
            );


            /* -----------------------------------------
               MEDIA DATABASE
            ------------------------------------------ */

            const mediaPayload = {

                image_url:
                    mainUpload?.url ||
                    null,

                images:
                    extraUploads.length > 0

                        ? JSON.stringify(
                            extraUploads.map(
                                item =>
                                    item.url
                            )
                        )

                        : null

            };


            if (
                mediaPayload.image_url ||
                mediaPayload.images
            ) {

                btn.textContent =
                    "Đang lưu ảnh...";


                const {
                    error:
                        mediaError
                } =
                    await window.supabaseClient

                        .from(
                            "products"
                        )

                        .update(
                            mediaPayload
                        )

                        .eq(
                            "id",
                            insertedProductId
                        );


                if (
                    mediaError
                ) {

                    throw mediaError;

                }

            }


            state.currentPage =
                1;


            showToast(
                "Thêm sản phẩm thành công!",
                "success"
            );

        }


        /* =================================================
           UPDATE PRODUCT
        ================================================= */

        else {

            const productId =
                state.editingId;


            const currentItem =
                state.products.find(
                    product =>
                        String(
                            product.id
                        ) ===
                        String(
                            productId
                        )
                );


            if (
                !currentItem
            ) {

                throw new Error(
                    "Không tìm thấy dữ liệu sản phẩm hiện tại."
                );

            }


            const oldMainUrl =
                currentItem.image_url ||
                null;


            const oldGalleryUrls =
                normalizeImageList(
                    currentItem.images
                );


            /* -----------------------------------------
               UPLOAD NEW MAIN
            ------------------------------------------ */

            let newMainUpload =
                null;


            if (
                state.mediaDraft
                    .pendingMainFile
            ) {

                btn.textContent =
                    "Đang tải ảnh đại diện mới...";


                newMainUpload =
                    await uploadPendingMain(
                        productId
                    );


                if (
                    newMainUpload
                ) {

                    uploadedFiles.push(
                        newMainUpload
                    );

                }

            }


            /* -----------------------------------------
               UPLOAD NEW GALLERY
            ------------------------------------------ */

            btn.textContent =
                "Đang tải ảnh phụ mới...";


            const newExtraUploads =
                await uploadPendingGallery(
                    productId
                );


            uploadedFiles.push(
                ...newExtraUploads
            );


            /* -----------------------------------------
               FINAL MAIN
            ------------------------------------------ */

            let finalMainUrl =
                state.mediaDraft
                    .mainUrl;


            if (
                newMainUpload
            ) {

                finalMainUrl =
                    newMainUpload.url;

            }


            if (
                state.mediaDraft
                    .mainRemoved &&
                !newMainUpload
            ) {

                finalMainUrl =
                    null;

            }


            /* -----------------------------------------
               FINAL GALLERY
            ------------------------------------------ */

            const finalGalleryUrls =
                buildFinalGalleryUrls(
                    newExtraUploads
                );


            /* -----------------------------------------
               PAYLOAD
            ------------------------------------------ */

            payload.image_url =
                finalMainUrl ||
                null;


            payload.images =
                finalGalleryUrls.length > 0

                    ? JSON.stringify(
                        finalGalleryUrls
                    )

                    : null;


            /* -----------------------------------------
               UPDATE DATABASE FIRST
            ------------------------------------------ */

            btn.textContent =
                "Đang cập nhật sản phẩm...";


            const {
                error
            } =
                await window.supabaseClient

                    .from(
                        "products"
                    )

                    .update(
                        payload
                    )

                    .eq(
                        "id",
                        productId
                    );


            if (
                error
            ) {

                throw error;

            }


            /* -----------------------------------------
               CLEANUP OLD STORAGE
            ------------------------------------------ */

            btn.textContent =
                "Đang dọn ảnh cũ...";


            await cleanupRemovedMedia(

                productId,

                oldMainUrl,

                oldGalleryUrls,

                finalMainUrl,

                finalGalleryUrls

            );


            showToast(
                "Đã cập nhật sản phẩm!",
                "success"
            );

        }


        cancelForm();


        await fetchProducts();


    } catch (
        error
    ) {

        console.error(
            "Lỗi lưu sản phẩm:",
            error
        );


        /* -----------------------------------------
           ROLLBACK NEW UPLOADS
        ------------------------------------------ */

        if (
            uploadedFiles.length > 0
        ) {

            await removeUploadedFiles(
                uploadedFiles
            );

        }


        /* -----------------------------------------
           ROLLBACK NEW PRODUCT
        ------------------------------------------ */

        if (
            insertedProductId
        ) {

            try {

                await window.supabaseClient

                    .from(
                        "products"
                    )

                    .delete()

                    .eq(
                        "id",
                        insertedProductId
                    );

            } catch (
                rollbackError
            ) {

                console.error(
                    "Rollback product thất bại:",
                    rollbackError
                );

            }

        }


        let message =
            error.message ||
            "Không thể lưu sản phẩm.";


        if (
            message.includes(
                "duplicate key"
            ) ||
            message.includes(
                "products_sku_key"
            )
        ) {

            message =
                "Mã SKU này đã tồn tại. Vui lòng sử dụng SKU khác.";

        }


        showToast(
            "Lỗi khi lưu: " +
            message,
            "error"
        );


    } finally {

        btn.disabled =
            false;


        btn.textContent =
            originalText;

    }

}


/* =========================================================
   DELETE PRODUCT
   ---------------------------------------------------------
   CHƯA XÓA STORAGE Ở BƯỚC NÀY.
========================================================= */

async function deleteProduct(
    id
) {

    const item =
        state.products.find(
            product =>
                String(
                    product.id
                ) ===
                String(id)
        );


    if (
        !item
    ) {

        showToast(
            "Không tìm thấy sản phẩm.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Xóa vĩnh viễn sản phẩm "${item.name}"?\n\nSKU: ${item.sku}`
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        const {
            error
        } =
            await window.supabaseClient

                .from(
                    "products"
                )

                .delete()

                .eq(
                    "id",
                    id
                );


        if (
            error
        ) {

            throw error;

        }


        /*
           Chưa xóa Storage.

           Lý do:
           - Có sản phẩm cũ dùng URL ngoài.
           - Không muốn xóa nhầm ảnh.
           - Cleanup product folder sẽ làm
             thành một bước riêng sau.
        */


        if (
            state.products.length ===
                1 &&
            state.currentPage >
                1
        ) {

            state.currentPage--;

        }


        showToast(
            "Đã xóa sản phẩm.",
            "success"
        );


        await fetchProducts();


    } catch (
        error
    ) {

        console.error(
            "Lỗi xóa sản phẩm:",
            error
        );


        showToast(
            "Lỗi xóa: " +
            error.message,
            "error"
        );

    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    if (
        !DOM.toast
    ) {

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    const bgColor =
        type === "success"

            ? "bg-green-500"

            : "bg-red-500";


    toast.className = `

        ${bgColor}

        text-white

        px-4
        py-2

        rounded-lg

        shadow-lg

        transform
        transition-all
        duration-300

        translate-y-0
        opacity-100

        mb-2

        font-bold
        text-sm

        flex
        items-center
        gap-2

        z-50

    `;


    toast.innerHTML = `

        <span>
            ${
                type === "success"
                    ? "✔"
                    : "⚠"
            }
        </span>

        <span>
            ${escapeHTML(
                message
            )}
        </span>

    `;


    DOM.toast.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.classList.add(
                "opacity-0",
                "translate-y-2"
            );


            setTimeout(
                () => {

                    toast.remove();

                },
                300
            );

        },
        3000
    );

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

    /* -----------------------------------------
       ADD
    ------------------------------------------ */

    DOM.btnAdd?.addEventListener(
        "click",
        showAddForm
    );


    /* -----------------------------------------
       BACK
    ------------------------------------------ */

    DOM.btnBack?.addEventListener(
        "click",
        cancelForm
    );


    /* -----------------------------------------
       CANCEL
    ------------------------------------------ */

    DOM.btnCancel?.addEventListener(
        "click",
        cancelForm
    );


    /* -----------------------------------------
       FORM
    ------------------------------------------ */

    DOM.form?.addEventListener(
        "submit",
        saveProduct
    );


    /* -----------------------------------------
       CATEGORY
    ------------------------------------------ */

    DOM.category?.addEventListener(
        "change",
        event => {

            updateSubCategories(
                event.target.value
            );

        }
    );


    /* -----------------------------------------
       SUBCATEGORY
    ------------------------------------------ */

    DOM.subCategory?.addEventListener(
        "change",
        event => {

            updateFamilies(
                event.target.value
            );

        }
    );


    /* -----------------------------------------
       SEARCH
    ------------------------------------------ */

    let searchTimer;


    DOM.search?.addEventListener(
        "input",
        event => {

            clearTimeout(
                searchTimer
            );


            searchTimer =
                setTimeout(
                    () => {

                        state.searchQuery =
                            event.target.value
                                .trim();


                        state.currentPage =
                            1;


                        fetchProducts();

                    },
                    300
                );

        }
    );


    /* -----------------------------------------
       CATEGORY FILTER
    ------------------------------------------ */

    DOM.filterCategory?.addEventListener(
        "change",
        event => {

            state.filterCategoryId =
                event.target.value;


            state.currentPage =
                1;


            fetchProducts();

        }
    );


    /* -----------------------------------------
       INDUSTRY FILTER
    ------------------------------------------ */

    DOM.filterIndustry?.addEventListener(
        "change",
        event => {

            state.filterIndustryId =
                event.target.value;


            state.currentPage =
                1;


            fetchProducts();

        }
    );


    /* -----------------------------------------
       STOCK FILTER
    ------------------------------------------ */

    DOM.filterStock?.addEventListener(
        "change",
        event => {

            state.filterStock =
                event.target.value;


            state.currentPage =
                1;


            fetchProducts();

        }
    );


    /* -----------------------------------------
       TABLE ACTION
    ------------------------------------------ */

    DOM.tableBody?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (
                !button
            ) {

                return;

            }


            const id =
                button.dataset.id;


            const action =
                button.dataset.action;


            if (
                action ===
                "edit"
            ) {

                editProduct(
                    id
                );

            }


            if (
                action ===
                "delete"
            ) {

                deleteProduct(
                    id
                );

            }

        }
    );


    /* -----------------------------------------
       PAGINATION
    ------------------------------------------ */

    DOM.pagination?.addEventListener(
        "click",
        event => {

            const pageButton =
                event.target.closest(
                    "button[data-page]"
                );


            if (
                pageButton
            ) {

                const page =
                    Number(
                        pageButton.dataset.page
                    );


                if (
                    page &&
                    page !==
                    state.currentPage
                ) {

                    state.currentPage =
                        page;


                    fetchProducts();

                }


                return;

            }


            const actionButton =
                event.target.closest(
                    "button[data-page-action]"
                );


            if (
                !actionButton
            ) {

                return;

            }


            const totalPages =
                Math.ceil(
                    state.totalItems /
                    state.itemsPerPage
                );


            if (
                actionButton.dataset.pageAction ===
                    "prev" &&
                state.currentPage >
                    1
            ) {

                state.currentPage--;

                fetchProducts();

            }


            if (
                actionButton.dataset.pageAction ===
                    "next" &&
                state.currentPage <
                    totalPages
            ) {

                state.currentPage++;

                fetchProducts();

            }

        }
    );

}


/* =========================================================
   CKEDITOR
========================================================= */

function initCKEditor() {

    if (
        typeof CKEDITOR ===
        "undefined"
    ) {

        return;

    }


    const description =
        document.getElementById(
            "description"
        );


    if (
        !description
    ) {

        return;

    }


    if (
        !CKEDITOR.instances
            .description
    ) {

        CKEDITOR.replace(
            "description",
            {
                height:
                    250
            }
        );

    }

}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initCKEditor();

        bindEvents();

        bindMediaPreviewEvents();

        await loadAllDropdowns();

        await fetchProducts();

    }
);


/* =========================================================
   GLOBAL COMPATIBILITY
========================================================= */

window.showAddForm =
    showAddForm;


window.cancelForm =
    cancelForm;


window.saveProduct =
    saveProduct;


window.editProduct =
    editProduct;


window.deleteProduct =
    deleteProduct;


window.fetchProducts =
    fetchProducts;