// ============================================================
// FILE: assets/js/admin/admin-rfq.js
// QUẢN LÝ DANH SÁCH RFQ
// ============================================================

"use strict";


// ============================================================
// STATE
// ============================================================

const rfqState = {

    allData: [],

    filteredData: [],

    page: 1,

    pageSize: 10

};


// ============================================================
// DOM
// ============================================================

const rfqDOM = {

    tableBody:
        document.getElementById("rfqTableBody"),

    emptyState:
        document.getElementById("emptyState"),

    searchInput:
        document.getElementById("searchInput"),

    statusFilter:
        document.getElementById("statusFilter"),

    btnRefresh:
        document.getElementById("btnRefresh"),

    btnPrev:
        document.getElementById("btnPrev"),

    btnNext:
        document.getElementById("btnNext"),

    pageInfo:
        document.getElementById("pageInfo"),

    resultInfo:
        document.getElementById("resultInfo"),

    statTotal:
        document.getElementById("statTotal"),

    statPending:
        document.getElementById("statPending"),

    statQuoted:
        document.getElementById("statQuoted"),

    statRejected:
        document.getElementById("statRejected")

};


// ============================================================
// INIT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initRfqPage
);


async function initRfqPage() {

    bindEvents();

    await loadRfqs();

}


// ============================================================
// EVENTS
// ============================================================

function bindEvents() {

    if (rfqDOM.searchInput) {

        rfqDOM.searchInput.addEventListener(
            "input",
            () => {

                rfqState.page = 1;

                applyFilters();

            }
        );

    }


    if (rfqDOM.statusFilter) {

        rfqDOM.statusFilter.addEventListener(
            "change",
            () => {

                rfqState.page = 1;

                applyFilters();

            }
        );

    }


    if (rfqDOM.btnRefresh) {

        rfqDOM.btnRefresh.addEventListener(
            "click",
            async () => {

                await loadRfqs();

            }
        );

    }


    if (rfqDOM.btnPrev) {

        rfqDOM.btnPrev.addEventListener(
            "click",
            () => {

                if (rfqState.page > 1) {

                    rfqState.page--;

                    renderTable();

                }

            }
        );

    }


    if (rfqDOM.btnNext) {

        rfqDOM.btnNext.addEventListener(
            "click",
            () => {

                const totalPages =
                    Math.max(
                        1,
                        Math.ceil(
                            rfqState.filteredData.length /
                            rfqState.pageSize
                        )
                    );


                if (
                    rfqState.page <
                    totalPages
                ) {

                    rfqState.page++;

                    renderTable();

                }

            }
        );

    }

}


// ============================================================
// LOAD DATA
// ============================================================

async function loadRfqs() {

    if (!window.supabaseClient) {

        console.error(
            "[admin-rfq] Không tìm thấy supabaseClient."
        );

        renderError(
            "Không thể kết nối Supabase."
        );

        return;
    }


    setLoading();


    try {

        const {
            data,
            error
        } = await window.supabaseClient

            .from("rfqs")

            .select(`
                id,
                created_at,
                rfq_code,
                company_name,
                contact_person,
                phone,
                email,
                notes,
                status,
                items,
                user_id,
                rejection_reason
            `)

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            throw error;

        }


        rfqState.allData =
            Array.isArray(data)
                ? data
                : [];


        updateStats();

        applyFilters();


    } catch (error) {

        console.error(
            "[admin-rfq] Load RFQ error:",
            error
        );


        renderError(
            "Không thể tải danh sách yêu cầu báo giá."
        );

    }

}


// ============================================================
// FILTER
// ============================================================

function applyFilters() {

    const keyword =
        (
            rfqDOM.searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const status =
        rfqDOM.statusFilter?.value ||
        "";


    rfqState.filteredData =
        rfqState.allData.filter(
            (rfq) => {

                const searchableText = [

                    rfq.rfq_code,

                    rfq.company_name,

                    rfq.contact_person,

                    rfq.phone,

                    rfq.email

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesKeyword =
                    !keyword ||
                    searchableText.includes(
                        keyword
                    );


                const matchesStatus =
                    !status ||
                    normalizeStatus(
                        rfq.status
                    ) ===
                    normalizeStatus(
                        status
                    );


                return (
                    matchesKeyword &&
                    matchesStatus
                );

            }
        );


    renderTable();

}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    const total =
        rfqState.allData.length;


    const pending =
        rfqState.allData.filter(
            (item) =>
                normalizeStatus(
                    item.status
                ) === "chờ xử lý"
        ).length;


    const quoted =
        rfqState.allData.filter(
            (item) =>
                normalizeStatus(
                    item.status
                ) === "đã báo giá"
        ).length;


    const rejected =
        rfqState.allData.filter(
            (item) =>
                normalizeStatus(
                    item.status
                ) === "từ chối"
        ).length;


    if (rfqDOM.statTotal) {

        rfqDOM.statTotal.textContent =
            total;

    }


    if (rfqDOM.statPending) {

        rfqDOM.statPending.textContent =
            pending;

    }


    if (rfqDOM.statQuoted) {

        rfqDOM.statQuoted.textContent =
            quoted;

    }


    if (rfqDOM.statRejected) {

        rfqDOM.statRejected.textContent =
            rejected;

    }

}


// ============================================================
// RENDER TABLE
// ============================================================

function renderTable() {

    if (!rfqDOM.tableBody) {
        return;
    }


    const total =
        rfqState.filteredData.length;


    if (total === 0) {

        rfqDOM.tableBody.innerHTML = "";

        showEmpty();

        updatePagination();

        return;

    }


    hideEmpty();


    const start =
        (
            rfqState.page - 1
        ) *
        rfqState.pageSize;


    const end =
        start +
        rfqState.pageSize;


    const pageItems =
        rfqState.filteredData.slice(
            start,
            end
        );


    rfqDOM.tableBody.innerHTML =
        pageItems
            .map(
                renderRow
            )
            .join("");


    updatePagination();

}


// ============================================================
// RENDER ROW
// ============================================================

function renderRow(rfq) {

    const code =
        escapeHTML(
            rfq.rfq_code ||
            `RFQ-${rfq.id}`
        );


    const company =
        escapeHTML(
            rfq.company_name ||
            "Khách vãng lai"
        );


    const contact =
        escapeHTML(
            rfq.contact_person ||
            "-"
        );


    const phone =
        escapeHTML(
            rfq.phone ||
            "-"
        );


    const status =
        rfq.status ||
        "Chờ xử lý";


    const statusBadge =
        renderStatusBadge(
            status
        );


    const itemCount =
        getItemCount(
            rfq.items
        );


    const date =
        formatDate(
            rfq.created_at
        );


    return `

        <tr
            class="
                hover:bg-gray-50
                transition
            "
        >

            <td class="px-5 py-4">

                <div
                    class="
                        font-black
                        text-kn-blue
                    "
                >
                    ${code}
                </div>

            </td>


            <td class="px-5 py-4">

                <div class="text-sm font-semibold text-gray-700">
                    ${date}
                </div>

            </td>


            <td class="px-5 py-4">

                <div class="font-bold text-gray-800">
                    ${company}
                </div>

            </td>


            <td class="px-5 py-4">

                <div class="font-semibold text-gray-700">
                    ${contact}
                </div>

            </td>


            <td class="px-5 py-4">

                <div class="text-gray-600">
                    ${phone}
                </div>

            </td>


            <td class="px-5 py-4 text-center">

                <span
                    class="
                        inline-flex
                        min-w-8
                        justify-center
                        px-2
                        py-1
                        rounded-md
                        bg-gray-100
                        text-gray-700
                        font-bold
                        text-xs
                    "
                >
                    ${itemCount}
                </span>

            </td>


            <td class="px-5 py-4 text-center">

                ${statusBadge}

            </td>


            <td class="px-5 py-4 text-right">

                <a
                    href="manage-rfq-detail.html?id=${encodeURIComponent(rfq.id)}"
                    class="
                        inline-flex
                        items-center
                        justify-center
                        px-3
                        py-2
                        rounded-lg
                        bg-blue-50
                        hover:bg-blue-100
                        text-kn-blue
                        font-bold
                        text-xs
                        transition
                    "
                >
                    Xem chi tiết
                </a>

            </td>

        </tr>

    `;

}


// ============================================================
// STATUS BADGE
// ============================================================

function renderStatusBadge(status) {

    const normalized =
        normalizeStatus(
            status
        );


    if (
        normalized ===
        "đã báo giá"
    ) {

        return `
            <span
                class="
                    inline-flex
                    items-center
                    px-3
                    py-1.5
                    rounded-full
                    bg-green-100
                    text-green-700
                    border
                    border-green-200
                    font-bold
                    text-xs
                "
            >
                ● Đã báo giá
            </span>
        `;

    }


    if (
        normalized ===
        "từ chối"
    ) {

        return `
            <span
                class="
                    inline-flex
                    items-center
                    px-3
                    py-1.5
                    rounded-full
                    bg-red-100
                    text-red-700
                    border
                    border-red-200
                    font-bold
                    text-xs
                "
            >
                ● Từ chối
            </span>
        `;

    }


    return `
        <span
            class="
                inline-flex
                items-center
                px-3
                py-1.5
                rounded-full
                bg-orange-100
                text-orange-700
                border
                border-orange-200
                font-bold
                text-xs
            "
        >
            ● Chờ xử lý
        </span>
    `;

}


// ============================================================
// ITEM COUNT
// ============================================================

function getItemCount(items) {

    if (
        !Array.isArray(items)
    ) {

        return 0;

    }


    return items.length;

}


// ============================================================
// PAGINATION
// ============================================================

function updatePagination() {

    const total =
        rfqState.filteredData.length;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                rfqState.pageSize
            )
        );


    if (
        rfqState.page >
        totalPages
    ) {

        rfqState.page =
            totalPages;

    }


    if (rfqDOM.pageInfo) {

        rfqDOM.pageInfo.textContent =
            `${rfqState.page} / ${totalPages}`;

    }


    if (rfqDOM.btnPrev) {

        rfqDOM.btnPrev.disabled =
            rfqState.page <= 1;

    }


    if (rfqDOM.btnNext) {

        rfqDOM.btnNext.disabled =
            rfqState.page >= totalPages;

    }


    if (rfqDOM.resultInfo) {

        if (total === 0) {

            rfqDOM.resultInfo.textContent =
                "0 yêu cầu";

        } else {

            const start =
                (
                    rfqState.page - 1
                ) *
                rfqState.pageSize +
                1;


            const end =
                Math.min(
                    rfqState.page *
                    rfqState.pageSize,
                    total
                );


            rfqDOM.resultInfo.textContent =
                `Hiển thị ${start}–${end} / ${total} yêu cầu`;

        }

    }

}


// ============================================================
// LOADING
// ============================================================

function setLoading() {

    hideEmpty();


    if (!rfqDOM.tableBody) {
        return;
    }


    rfqDOM.tableBody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="
                    px-5
                    py-12
                    text-center
                    text-gray-400
                "
            >
                <div
                    class="
                        inline-flex
                        items-center
                        gap-2
                    "
                >

                    <span
                        class="
                            w-4
                            h-4
                            border-2
                            border-gray-300
                            border-t-kn-blue
                            rounded-full
                            animate-spin
                        "
                    ></span>

                    Đang tải danh sách RFQ...

                </div>
            </td>

        </tr>

    `;

}


// ============================================================
// ERROR
// ============================================================

function renderError(message) {

    if (!rfqDOM.tableBody) {
        return;
    }


    rfqDOM.tableBody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="
                    px-5
                    py-12
                    text-center
                    text-red-500
                "
            >
                ${escapeHTML(message)}
            </td>

        </tr>

    `;

}


// ============================================================
// EMPTY
// ============================================================

function showEmpty() {

    if (rfqDOM.emptyState) {

        rfqDOM.emptyState.classList.remove(
            "hidden"
        );

    }

}


function hideEmpty() {

    if (rfqDOM.emptyState) {

        rfqDOM.emptyState.classList.add(
            "hidden"
        );

    }

}


// ============================================================
// HELPERS
// ============================================================

function normalizeStatus(value) {

    return String(
        value ||
        "Chờ xử lý"
    )
        .trim()
        .toLowerCase();

}


function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleString(
        "vi-VN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function escapeHTML(value) {

    if (
        window.utils &&
        typeof window.utils.escapeHTML ===
        "function"
    ) {

        return window.utils.escapeHTML(
            String(value ?? "")
        );

    }


    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}