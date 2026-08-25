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
   - Đồng bộ products.image_path / products.images
   - Rollback upload nếu database update thất bại

   STORAGE:

   product-images/
   └── products/
       └── PRODUCT_ID/
           ├── main/
           └── gallery/

   DATABASE:

   image_path
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


const PRODUCT_IMAGE_CDN_BASE =
    "https://mrokhangnam-image.khangnamvn.workers.dev";


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

    itemsPerPage: 20,

    totalItems: 0,

    searchQuery: "",

    filterCategoryId: "all",

    filterIndustryId: "all",

    filterStock: "all",


    /* -----------------------------------------
       MEDIA DRAFT
    ------------------------------------------ */

    mediaDraft: {

        mainPath: null,

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

    mainImageFile:
        document.getElementById(
            "mainImageFile"
        ),

    extraImageFiles:
        document.getElementById(
            "extraImageFiles"
        ),

    mainImagePreview:
        document.getElementById(
            "mainImagePreview"
        ),

    extraImagesPreview:
        document.getElementById(
            "extraImagesPreview"
        ),

    removeMainImage:
        document.getElementById(
            "removeMainImage"
        )

};


/* =========================================================
   MEDIA HELPERS
========================================================= */

function resetMediaDraft() {

    state.mediaDraft = {

        mainPath: null,

        mainUrl: null,

        mainRemoved: false,

        existingGallery: [],

        removedGallery: [],

        pendingMainFile: null,

        pendingExtraFiles: []

    };

}


/* =========================================================
   NORMALIZE IMAGE LIST
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
            .filter(
                item =>
                    typeof item ===
                    "string"
            )
            .map(
                item =>
                    item.trim()
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
                    .filter(
                        item =>
                            typeof item ===
                            "string"
                    )
                    .map(
                        item =>
                            item.trim()
                    )
                    .filter(
                        Boolean
                    );

            }

        } catch (
            error
        ) {

            /* không phải JSON */

        }


        return text
            .split(",")
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
   GET STORAGE PATH FROM URL
========================================================= */

function getStoragePathFromUrl(
    value
) {

    if (
        !value ||
        typeof value !==
        "string"
    ) {

        return null;

    }


    const text =
        value.trim();


    if (
        !text
    ) {

        return null;

    }


    /*
       Nếu DB đã lưu path Storage
       thì giữ nguyên.
    */

    if (
        !/^https?:\/\//i.test(
            text
        )
    ) {

        return text
            .replace(
                /^\/+/,
                ""
            );

    }


    try {

        const parsed =
            new URL(
                text
            );


        const marker =
            `/storage/v1/object/public/${STORAGE_BUCKET}/`;


        const markerIndex =
            parsed.pathname.indexOf(
                marker
            );


        if (
            markerIndex !==
            -1
        ) {

            return decodeURIComponent(
                parsed.pathname.slice(
                    markerIndex +
                    marker.length
                )
            );

        }


        const cdnPrefix =
            `${PRODUCT_IMAGE_CDN_BASE}/`;


        if (
            text.startsWith(
                cdnPrefix
            )
        ) {

            return decodeURIComponent(
                text.slice(
                    cdnPrefix.length
                )
            );

        }

    } catch (
        error
    ) {

        return null;

    }


    return null;

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
   BUILD PRODUCT IMAGE URL
   ---------------------------------------------------------
   Database lưu image_path.
   UI cần URL để render ảnh.
========================================================= */

function buildProductImageUrl(
    imagePath
) {

    if (
        !imagePath ||
        typeof imagePath !==
        "string"
    ) {

        return "";

    }


    const cleanPath =
        imagePath.trim();


    if (
        !cleanPath
    ) {

        return "";

    }


    if (
        /^https?:\/\//i.test(
            cleanPath
        )
    ) {

        return cleanPath;

    }


    return (
        `${PRODUCT_IMAGE_CDN_BASE}/${cleanPath.replace(/^\/+/, "")}`
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
   REMOVE STORAGE PATHS
========================================================= */

async function removeStoragePaths(
    paths
) {

    const cleanPaths =
        [
            ...new Set(
                (paths || [])
                    .filter(
                        path =>
                            typeof path ===
                            "string"
                    )
                    .map(
                        path =>
                            path.trim()
                    )
                    .filter(
                        Boolean
                    )
            )
        ];


    if (
        cleanPaths.length ===
        0
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

        mainPath:
            null,

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
                data-action="remove-main-image"
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

        </div>

    `;

}


/* =========================================================
   PREVIEW SELECTED MAIN IMAGE
========================================================= */

function previewSelectedMainImage(
    file
) {

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


    if (
        state.mediaDraft
            .mainUrl
    ) {

        state.mediaDraft.mainRemoved =
            false;

    }


    state.mediaDraft.pendingMainFile =
        file;


    const previewUrl =
        URL.createObjectURL(
            file
        );


    renderMainImagePreview(
        previewUrl
    );

}


/* =========================================================
   PREVIEW EXTRA IMAGES
========================================================= */

function previewSelectedExtraImages(
    fileList
) {

    const files =
        Array.from(
            fileList || []
        );


    if (
        files.length === 0
    ) {

        return;

    }


    const validFiles =
        [];


    for (
        const file of files
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


    validFiles.forEach(
        file => {

            state.mediaDraft
                .pendingExtraFiles
                .push(
                    file
                );

        }
    );


    renderCompleteGalleryPreview();


    if (
        DOM.extraImageFiles
    ) {

        DOM.extraImageFiles.value =
            "";

    }

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


    const existing =
        state.mediaDraft
            .existingGallery ||
        [];


    existing.forEach(
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
                w-24
                h-24
                rounded-lg
                border
                border-gray-200
                overflow-hidden
                bg-white
                group
            `;


            wrapper.innerHTML = `

                <img
                    src="${escapeAttribute(
                        buildProductImageUrl(
                            url
                        )
                    )}"
                    alt="Gallery ${index + 1}"
                    class="
                        w-full
                        h-full
                        object-contain
                    "
                    onerror="
                        this.onerror=null;
                        this.parentElement.innerHTML='<div class=&quot;w-full h-full flex items-center justify-center text-[10px] text-gray-400&quot;>Ảnh lỗi</div>';
                    "
                >


                <button
                    type="button"
                    data-action="remove-gallery-image"
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
   RENDER PENDING GALLERY FILES
========================================================= */

function renderPendingExtraFiles() {

    if (
        !DOM.extraImagesPreview
    ) {

        return;

    }


    const files =
        state.mediaDraft
            .pendingExtraFiles ||
        [];


    files.forEach(
        (
            file,
            index
        ) => {

            if (
                !file.__previewUrl
            ) {

                file.__previewUrl =
                    URL.createObjectURL(
                        file
                    );

            }


            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className = `
                relative
                w-24
                h-24
                rounded-lg
                border
                border-blue-200
                overflow-hidden
                bg-white
                group
            `;


            wrapper.innerHTML = `

                <img
                    src="${escapeAttribute(
                        file.__previewUrl
                    )}"
                    alt="${escapeAttribute(
                        file.name
                    )}"
                    class="
                        w-full
                        h-full
                        object-contain
                    "
                >


                <button
                    type="button"
                    data-action="remove-pending-gallery"
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
                    title="Bỏ ảnh"
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
   PREVIEW EVENTS
========================================================= */

function bindMediaPreviewEvents() {

    DOM.mainImageFile?.addEventListener(
        "change",
        event => {

            const file =
                event.target.files?.[0];


            if (
                !file
            ) {

                return;

            }


            previewSelectedMainImage(
                file
            );

        }
    );


    DOM.extraImageFiles?.addEventListener(
        "change",
        event => {

            const files =
                event.target.files;


            previewSelectedExtraImages(
                files
            );

        }
    );


    DOM.mainImagePreview?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    '[data-action="remove-main-image"]'
                );


            if (
                !button
            ) {

                return;

            }


            event.preventDefault();

            event.stopPropagation();


            markMainImageRemoved();

        }
    );


    DOM.extraImagesPreview?.addEventListener(
        "click",
        event => {

            const galleryButton =
                event.target.closest(
                    '[data-action="remove-gallery-image"]'
                );


            if (
                galleryButton
            ) {

                event.preventDefault();

                event.stopPropagation();


                markGalleryImageRemoved(
                    galleryButton.dataset.url
                );

                return;

            }


            const pendingButton =
                event.target.closest(
                    '[data-action="remove-pending-gallery"]'
                );


            if (
                pendingButton
            ) {

                event.preventDefault();

                event.stopPropagation();


                removePendingGalleryFile(
                    pendingButton.dataset.index
                );

            }

        }
    );

}


/* =========================================================
   LOAD EXISTING MEDIA
========================================================= */

function loadExistingMedia(
    item
) {

    resetMediaDraft();


    const mainPathRaw =
        item?.image_path ||
        null;


    state.mediaDraft.mainPath =
        getStoragePathFromUrl(
            mainPathRaw
        ) ||
        mainPathRaw;


    state.mediaDraft.mainUrl =
        buildProductImageUrl(
            state.mediaDraft.mainPath
        );


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
        state.mediaDraft
            .pendingMainFile
    ) {

        state.mediaDraft
            .pendingMainFile =
            null;


        if (
            DOM.mainImageFile
        ) {

            DOM.mainImageFile.value =
                "";

        }

    }


    if (
        !state.editingId
    ) {

        state.mediaDraft.mainPath =
            null;

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
        !state.mediaDraft.mainUrl &&
        !state.mediaDraft.mainPath
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


    state.mediaDraft.mainPath =
        null;


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
        !file
    ) {

        return;

    }


    if (
        file.__previewUrl
    ) {

        try {

            URL.revokeObjectURL(
                file.__previewUrl
            );

        } catch (
            error
        ) {

            console.warn(
                "Không thể revoke preview URL:",
                error
            );

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
    placeholder,
    placeholderValue = ""
) {

    if (
        !element
    ) {

        return;

    }


    element.innerHTML = `

        <option value="${escapeAttribute(
            placeholderValue
        )}">
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
   BUILD FINAL MEDIA
========================================================= */

function buildFinalGalleryPaths(
    newExtraUploads
) {

    /*
     * DB luôn ưu tiên lưu Storage PATH
     * cho ảnh mới.
     *
     * Ví dụ:
     *
     * products/PRODUCT_ID/gallery/gallery-xxx.webp
     *
     * Ảnh cũ dùng URL ngoài/Supabase URL
     * vẫn được giữ nguyên để không làm hỏng
     * dữ liệu legacy.
     */

    const uploadedPaths =
        (newExtraUploads || [])
            .map(
                item =>
                    item.path
            )
            .filter(
                Boolean
            );


    return [

        ...new Set(

            [

                ...state.mediaDraft
                    .existingGallery,

                ...uploadedPaths

            ]

        )

    ];

}


/* =========================================================
   DELETE OLD MEDIA AFTER DB SUCCESS
========================================================= */

async function cleanupRemovedMedia(
    productId,
    oldMainPath,
    oldGalleryPaths,
    finalMainPath,
    finalGalleryPaths
) {

    const pathsToDelete =
        [];


    /* -----------------------------------------
       MAIN
       -----------------------------------------
       image_path đã là Storage path.
    ------------------------------------------ */

    if (
        oldMainPath &&
        oldMainPath !==
        finalMainPath &&
        oldMainPath.startsWith(
            `${STORAGE_PRODUCT_PREFIX}/${productId}/`
        )
    ) {

        pathsToDelete.push(
            oldMainPath
        );

    }


    /* -----------------------------------------
       GALLERY
    ----------------------------------------- */

    const finalSet =
        new Set(
            finalGalleryPaths
        );


    for (
        const oldGalleryItem of
        oldGalleryPaths
    ) {

        if (
            finalSet.has(
                oldGalleryItem
            )
        ) {

            continue;

        }


        /*
         * Gallery mới chuẩn là Storage PATH.
         *
         * Gallery cũ có thể vẫn là
         * Supabase URL.
         *
         * Hỗ trợ cả hai để cleanup
         * an toàn.
         */

        const path =
            getStoragePathFromUrl(
                oldGalleryItem
            ) ||
            oldGalleryItem;


        if (
            !path ||
            !path.startsWith(
                `${STORAGE_PRODUCT_PREFIX}/${productId}/`
            )
        ) {

            continue;

        }


        pathsToDelete.push(
            path
        );

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
         * Database đã đúng.
         *
         * Nếu Storage cleanup lỗi,
         * không rollback DB vì có nguy cơ
         * làm mất dữ liệu mới.
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

                image_path:
                    mainUpload?.path ||
                    null,

                images:
                    extraUploads.length > 0

                        ? JSON.stringify(
                            extraUploads.map(
                                item =>
                                    item.path
                            )
                        )

                        : null

            };


            if (
                mediaPayload.image_path ||
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


            const oldMainPathRaw =
                currentItem.image_path ||
                null;


            const oldMainPath =
                getStoragePathFromUrl(
                    oldMainPathRaw
                ) ||
                oldMainPathRaw;


            const oldGalleryPaths =
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

            let finalMainPath =
                state.mediaDraft
                    .mainPath;


            if (
                newMainUpload
            ) {

                finalMainPath =
                    newMainUpload.path;

            }


            if (
                state.mediaDraft
                    .mainRemoved &&
                !newMainUpload
            ) {

                finalMainPath =
                    null;

            }


            const finalMainUrl =
                buildProductImageUrl(
                    finalMainPath
                );


            /* -----------------------------------------
               FINAL GALLERY
            ------------------------------------------ */

            const finalGalleryPaths =
                buildFinalGalleryPaths(
                    newExtraUploads
                );


            /* -----------------------------------------
               PAYLOAD
            ------------------------------------------ */

            payload.image_path =
                finalMainPath ||
                null;


            payload.images =
                finalGalleryPaths.length > 0

                    ? JSON.stringify(
                        finalGalleryPaths
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

                oldMainPath,

                oldGalleryPaths,

                finalMainPath,

                finalGalleryPaths

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
========================================================= */

async function deleteProduct(
    id
) {

    const product =
        state.products.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );


    if (
        !product
    ) {

        showToast(
            "Không tìm thấy sản phẩm.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Bạn có chắc muốn xóa sản phẩm "${product.name}"?\n\nToàn bộ ảnh của sản phẩm trong Storage cũng sẽ được xóa.`
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        /*
         * -----------------------------------------
         * LẤY TOÀN BỘ STORAGE PATH CỦA PRODUCT
         * -----------------------------------------
         */

        const pathsToDelete =
            [];


        const mainPath =
            getStoragePathFromUrl(
                product.image_path
            ) ||
            product.image_path;


        if (
            mainPath &&
            mainPath.startsWith(
                `${STORAGE_PRODUCT_PREFIX}/${id}/`
            )
        ) {

            pathsToDelete.push(
                mainPath
            );

        }


        const galleryPaths =
            normalizeImageList(
                product.images
            );


        galleryPaths.forEach(
            item => {

                const path =
                    getStoragePathFromUrl(
                        item
                    ) ||
                    item;


                if (
                    path &&
                    path.startsWith(
                        `${STORAGE_PRODUCT_PREFIX}/${id}/`
                    )
                ) {

                    pathsToDelete.push(
                        path
                    );

                }

            }
        );


        /*
         * -----------------------------------------
         * XÓA DATABASE TRƯỚC
         * -----------------------------------------
         */

        const {
            error:
                deleteError
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
            deleteError
        ) {

            throw deleteError;

        }


        /*
         * -----------------------------------------
         * XÓA STORAGE SAU KHI DB THÀNH CÔNG
         * -----------------------------------------
         */

        if (
            pathsToDelete.length > 0
        ) {

            try {

                await removeStoragePaths(
                    [
                        ...new Set(
                            pathsToDelete
                        )
                    ]
                );

            } catch (
                storageError
            ) {

                console.warn(
                    "Đã xóa product khỏi DB nhưng cleanup Storage thất bại:",
                    storageError
                );


                showToast(
                    "Đã xóa sản phẩm nhưng một số ảnh chưa được xóa khỏi Storage.",
                    "error"
                );


                await fetchProducts();

                return;

            }

        }


        showToast(
            "Đã xóa sản phẩm thành công.",
            "success"
        );


        /*
         * Nếu trang hiện tại chỉ còn
         * 1 sản phẩm thì quay về trang trước.
         */

        if (
            state.products.length ===
                1 &&
            state.currentPage >
                1
        ) {

            state.currentPage--;

        }


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
            (
                error.message ||
                "Không xác định"
            ),
            "error"
        );

    }

}


/* =========================================================
   EDIT PRODUCT
========================================================= */

async function editProduct(
    id
) {

    const product =
        state.products.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );


    if (
        !product
    ) {

        showToast(
            "Không tìm thấy sản phẩm.",
            "error"
        );

        return;

    }


    state.editingId =
        product.id;


    DOM.formTitle.textContent =
        "Chỉnh sửa sản phẩm";


    DOM.btnSubmit.textContent =
        "Cập nhật sản phẩm";


    /*
     * -----------------------------------------
     * BASIC FIELDS
     * -----------------------------------------
     */

    setInputValue(
        "sku",
        product.sku
    );


    setInputValue(
        "name",
        product.name
    );


    setInputValue(
        "slug",
        product.slug
    );


    setInputValue(
        "brand",
        product.brand
    );


    setInputValue(
        "unit",
        product.unit
    );


    setInputValue(
        "price",
        product.price
    );


    setInputValue(
        "stock",
        product.stock
    );


    setInputValue(
        "description",
        product.description
    );


    /*
     * -----------------------------------------
     * CATEGORY
     * -----------------------------------------
     */

    if (
        DOM.category
    ) {

        DOM.category.value =
            product.category_id ||
            "";

    }


    updateSubCategories(
        product.category_id
    );


    if (
        DOM.subCategory
    ) {

        DOM.subCategory.value =
            product.sub_category_id ||
            "";

    }


    updateFamilies(
        product.sub_category_id
    );


    if (
        DOM.family
    ) {

        DOM.family.value =
            product.family_id ||
            "";

    }


    if (
        DOM.industry
    ) {

        DOM.industry.value =
            product.industry_id ||
            "";

    }


    /*
     * -----------------------------------------
     * MEDIA
     * -----------------------------------------
     */

    loadExistingMedia(
        product
    );


    /*
     * -----------------------------------------
     * SHOW FORM
     * -----------------------------------------
     */

    showFormView();

}


/* =========================================================
   ADD PRODUCT
========================================================= */

function openAddProductForm() {

    state.editingId =
        null;


    DOM.formTitle.textContent =
        "Thêm sản phẩm";


    DOM.btnSubmit.textContent =
        "Thêm sản phẩm";


    DOM.form?.reset();


    resetCatalogDropdowns();


    resetMediaInputs();


    showFormView();

}


/* =========================================================
   SHOW LIST
========================================================= */

function showListView() {

    if (
        DOM.formView
    ) {

        DOM.formView.classList.add(
            "hidden"
        );

    }


    if (
        DOM.listView
    ) {

        DOM.listView.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   SHOW FORM
========================================================= */

function showFormView() {

    if (
        DOM.listView
    ) {

        DOM.listView.classList.add(
            "hidden"
        );

    }


    if (
        DOM.formView
    ) {

        DOM.formView.classList.remove(
            "hidden"
        );

    }


    window.scrollTo(
        {
            top:
                0,

            behavior:
                "smooth"
        }
    );

}


/* =========================================================
   CANCEL FORM
========================================================= */

function cancelForm() {

    state.editingId =
        null;


    if (
        DOM.form
    ) {

        DOM.form.reset();

    }


    resetCatalogDropdowns();


    resetMediaInputs();


    showListView();

}


/* =========================================================
   FETCH PRODUCTS
========================================================= */

async function fetchProducts() {

    try {

        let query =
            window.supabaseClient

                .from(
                    "products"
                )

                .select(
                    `
                        *,
                        categories (
                            id,
                            name
                        ),
                        sub_categories (
                            id,
                            name
                        ),
                        families (
                            id,
                            name
                        ),
                        industries (
                            id,
                            name
                        )
                    `,
                    {
                        count:
                            "exact"
                    }
                );


        /*
         * -----------------------------------------
         * SEARCH
         * -----------------------------------------
         */

        if (
            state.searchQuery
        ) {

            const search =
                state.searchQuery
                    .trim()
                    .replace(
                        /,/g,
                        ""
                    );


            if (
                search
            ) {

                query =
                    query.or(
                        [
                            `name.ilike.%${search}%`,

                            `sku.ilike.%${search}%`,

                            `brand.ilike.%${search}%`

                        ].join(
                            ","
                        )
                    );

            }

        }


        /*
         * -----------------------------------------
         * CATEGORY FILTER
         * -----------------------------------------
         */

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


        /*
         * -----------------------------------------
         * INDUSTRY FILTER
         * -----------------------------------------
         */

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


        /*
         * -----------------------------------------
         * STOCK FILTER
         * -----------------------------------------
         */

        if (
            state.filterStock !==
            "all"
        ) {

            if (
                state.filterStock ===
                "in"
            ) {

                query =
                    query.gt(
                        "stock",
                        0
                    );

            }


            if (
                state.filterStock ===
                "out"
            ) {

                query =
                    query.lte(
                        "stock",
                        0
                    );

            }

        }


        /*
         * -----------------------------------------
         * PAGINATION
         * -----------------------------------------
         */

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


        query =
            query
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


        const {
            data,
            error,
            count
        } =
            await query;


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


        renderProducts();

        renderPagination();

        updateStatistics();


    } catch (
        error
    ) {

        console.error(
            "Lỗi tải products:",
            error
        );


        showToast(
            "Không thể tải danh sách sản phẩm.",
            "error"
        );

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
                    colspan="8"
                    class="
                        px-4
                        py-10
                        text-center
                        text-gray-400
                    "
                >
                    Không có sản phẩm nào.
                </td>

            </tr>

        `;

        return;

    }


    DOM.tableBody.innerHTML =
        state.products
            .map(
                product => {

                    const imagePath =
                        product.image_path ||
                        null;


                    const imageUrl =
                        buildProductImageUrl(
                            imagePath
                        );


                    const stock =
                        Number(
                            product.stock
                        ) ||
                        0;


                    const stockClass =
                        stock > 0

                            ? "text-green-600"

                            : "text-red-500";


                    return `

                        <tr
                            class="
                                border-b
                                border-gray-100
                                hover:bg-gray-50
                            "
                        >

                            <td
                                class="
                                    px-4
                                    py-3
                                "
                            >

                                ${
                                    imageUrl

                                        ? `

                                            <img
                                                src="${escapeAttribute(
                                                    imageUrl
                                                )}"
                                                alt="${escapeAttribute(
                                                    product.name
                                                )}"
                                                class="
                                                    w-14
                                                    h-14
                                                    rounded-lg
                                                    object-contain
                                                    border
                                                    border-gray-200
                                                    bg-white
                                                "
                                                loading="lazy"
                                            >

                                        `

                                        : `

                                            <div
                                                class="
                                                    w-14
                                                    h-14
                                                    rounded-lg
                                                    border
                                                    border-gray-200
                                                    flex
                                                    items-center
                                                    justify-center
                                                    text-[10px]
                                                    text-gray-400
                                                "
                                            >
                                                No Image
                                            </div>

                                        `
                                }

                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                "
                            >

                                <div
                                    class="
                                        font-semibold
                                        text-gray-800
                                    "
                                >
                                    ${escapeHTML(
                                        product.name ||
                                        "-"
                                    )}
                                </div>


                                <div
                                    class="
                                        text-xs
                                        text-gray-400
                                        mt-1
                                    "
                                >
                                    ${escapeHTML(
                                        product.sku ||
                                        "-"
                                    )}
                                </div>

                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                    text-sm
                                    text-gray-600
                                "
                            >
                                ${escapeHTML(
                                    product.categories?.name ||
                                    "-"
                                )}
                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                    text-sm
                                    text-gray-600
                                "
                            >
                                ${escapeHTML(
                                    product.sub_categories?.name ||
                                    "-"
                                )}
                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                    text-sm
                                    text-gray-600
                                "
                            >
                                ${escapeHTML(
                                    product.families?.name ||
                                    "-"
                                )}
                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                    text-right
                                "
                            >

                                <span
                                    class="
                                        font-semibold
                                        ${stockClass}
                                    "
                                >
                                    ${formatNumber(
                                        stock
                                    )}
                                </span>

                            </td>


                            <td
                                class="
                                    px-4
                                    py-3
                                "
                            >

                                <div
                                    class="
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                    "
                                >

                                    <button
                                        type="button"
                                        data-action="edit"
                                        data-id="${escapeAttribute(
                                            product.id
                                        )}"
                                        class="
                                            px-3
                                            py-1.5
                                            rounded-lg
                                            bg-blue-50
                                            text-blue-600
                                            text-xs
                                            font-semibold
                                            hover:bg-blue-100
                                        "
                                    >
                                        Sửa
                                    </button>


                                    <button
                                        type="button"
                                        data-action="delete"
                                        data-id="${escapeAttribute(
                                            product.id
                                        )}"
                                        class="
                                            px-3
                                            py-1.5
                                            rounded-lg
                                            bg-red-50
                                            text-red-600
                                            text-xs
                                            font-semibold
                                            hover:bg-red-100
                                        "
                                    >
                                        Xóa
                                    </button>

                                </div>

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
        totalPages <=
        1
    ) {

        DOM.pagination.innerHTML =
            "";

        return;

    }


    let html =
        "";


    html += `

        <button
            type="button"
            data-page="${Math.max(
                1,
                state.currentPage - 1
            )}"
            class="
                px-3
                py-2
                rounded-lg
                border
                border-gray-200
                text-sm
                ${
                    state.currentPage ===
                    1
                        ? "opacity-40 pointer-events-none"
                        : "hover:bg-gray-50"
                }
            "
        >
            ‹
        </button>

    `;


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        if (
            totalPages > 7 &&
            page > 3 &&
            page < totalPages - 2 &&
            Math.abs(
                page -
                state.currentPage
            ) > 1
        ) {

            if (
                page === 4
            ) {

                html += `

                    <span
                        class="
                            px-2
                            py-2
                            text-gray-400
                        "
                    >
                        ...
                    </span>

                `;

            }

            continue;

        }


        html += `

            <button
                type="button"
                data-page="${page}"
                class="
                    min-w-[38px]
                    px-3
                    py-2
                    rounded-lg
                    text-sm
                    font-semibold
                    ${
                        page ===
                        state.currentPage

                            ? "bg-blue-600 text-white"

                            : "border border-gray-200 hover:bg-gray-50"
                    }
                "
            >
                ${page}
            </button>

        `;

    }


    html += `

        <button
            type="button"
            data-page="${Math.min(
                totalPages,
                state.currentPage + 1
            )}"
            class="
                px-3
                py-2
                rounded-lg
                border
                border-gray-200
                text-sm
                ${
                    state.currentPage ===
                    totalPages
                        ? "opacity-40 pointer-events-none"
                        : "hover:bg-gray-50"
                }
            "
        >
            ›
        </button>

    `;


    DOM.pagination.innerHTML =
        html;

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    const total =
        state.totalItems;


    const inStock =
        state.products.filter(
            product =>
                Number(
                    product.stock
                ) > 0
        ).length;


    const outOfStock =
        state.products.filter(
            product =>
                Number(
                    product.stock
                ) <= 0
        ).length;


    if (
        DOM.total
    ) {

        DOM.total.textContent =
            formatNumber(
                total
            );

    }


    if (
        DOM.inStock
    ) {

        DOM.inStock.textContent =
            formatNumber(
                inStock
            );

    }


    if (
        DOM.outOfStock
    ) {

        DOM.outOfStock.textContent =
            formatNumber(
                outOfStock
            );

    }

}


/* =========================================================
   EVENT BINDING
========================================================= */

function bindEvents() {

    /*
     * -----------------------------------------
     * ADD
     * -----------------------------------------
     */

    DOM.btnAdd?.addEventListener(
        "click",
        openAddProductForm
    );


    /*
     * -----------------------------------------
     * BACK
     * -----------------------------------------
     */

    DOM.btnBack?.addEventListener(
        "click",
        cancelForm
    );


    DOM.btnCancel?.addEventListener(
        "click",
        cancelForm
    );


    /*
     * -----------------------------------------
     * FORM
     * -----------------------------------------
     */

    DOM.form?.addEventListener(
        "submit",
        saveProduct
    );


    /*
     * -----------------------------------------
     * CATEGORY CASCADE
     * -----------------------------------------
     */

    DOM.category?.addEventListener(
        "change",
        event => {

            updateSubCategories(
                event.target.value
            );

        }
    );


    DOM.subCategory?.addEventListener(
        "change",
        event => {

            updateFamilies(
                event.target.value
            );

        }
    );


    /*
     * -----------------------------------------
     * SEARCH
     * -----------------------------------------
     */

    let searchTimer =
        null;


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
                    350
                );

        }
    );


    /*
     * -----------------------------------------
     * FILTERS
     * -----------------------------------------
     */

    DOM.filterCategory?.addEventListener(
        "change",
        event => {

            state.filterCategoryId =
                event.target.value ||
                "all";


            state.currentPage =
                1;


            fetchProducts();

        }
    );


    DOM.filterIndustry?.addEventListener(
        "change",
        event => {

            state.filterIndustryId =
                event.target.value ||
                "all";


            state.currentPage =
                1;


            fetchProducts();

        }
    );


    DOM.filterStock?.addEventListener(
        "change",
        event => {

            state.filterStock =
                event.target.value ||
                "all";


            state.currentPage =
                1;


            fetchProducts();

        }
    );


    /*
     * -----------------------------------------
     * PRODUCT TABLE ACTIONS
     * -----------------------------------------
     */

    DOM.tableBody?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (
                !button
            ) {

                return;

            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            if (
                action ===
                "edit"
            ) {

                editProduct(
                    id
                );

                return;

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


    /*
     * -----------------------------------------
     * PAGINATION
     * -----------------------------------------
     */

    DOM.pagination?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-page]"
                );


            if (
                !button
            ) {

                return;

            }


            const page =
                Number(
                    button.dataset.page
                );


            if (
                !page ||
                page ===
                state.currentPage
            ) {

                return;

            }


            state.currentPage =
                page;


            fetchProducts();


            window.scrollTo(
                {
                    top:
                        0,

                    behavior:
                        "smooth"
                }
            );

        }
    );


    /*
     * -----------------------------------------
     * MEDIA
     * -----------------------------------------
     */

    bindMediaPreviewEvents();

}


/* =========================================================
   INIT
========================================================= */

async function init() {

    try {

        bindEvents();


        showListView();


        await loadAllDropdowns();


        await fetchProducts();


    } catch (
        error
    ) {

        console.error(
            "Lỗi khởi tạo trang products:",
            error
        );


        showToast(
            "Không thể khởi tạo trang quản lý sản phẩm.",
            "error"
        );

    }

}


/* =========================================================
   GLOBAL
========================================================= */

window.openAddProductForm =
    openAddProductForm;


window.editProduct =
    editProduct;


window.deleteProduct =
    deleteProduct;


window.cancelForm =
    cancelForm;


window.saveProduct =
    saveProduct;


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();

}