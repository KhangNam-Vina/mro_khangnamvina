// ============================================================
// FILE: assets/js/admin/admin-dashboard.js
// DASHBOARD TỔNG QUAN - MRO KHANG NAM
// ============================================================

"use strict";


const DASHBOARD = {

    orders: [],
    rfqs: [],
    contacts: [],

    chart: null

};


// ============================================================
// DOM
// ============================================================

const DOM = {

    // KPI
    kpiOrders:
        document.getElementById("kpiOrders"),

    kpiOrdersPending:
        document.getElementById("kpiOrdersPending"),

    kpiRfq:
        document.getElementById("kpiRfq"),

    kpiRfqPending:
        document.getElementById("kpiRfqPending"),

    kpiContact:
        document.getElementById("kpiContact"),

    kpiUsers:
        document.getElementById("kpiUsers"),

    kpiProduct:
        document.getElementById("kpiProduct"),

    kpiBlog:
        document.getElementById("kpiBlog"),


    // Chart
    activityChart:
        document.getElementById("activityChart"),

    chartMonthFilter:
        document.getElementById("chartMonthFilter"),


    // Tables
    ordersBody:
        document.getElementById("dashboardOrdersBody"),

    rfqBody:
        document.getElementById("dashboardRfqBody"),

    contactsBody:
        document.getElementById("dashboardContactsBody"),


    // Summary
    orderStatusSummary:
        document.getElementById("orderStatusSummary"),

    rfqStatusSummary:
        document.getElementById("rfqStatusSummary"),

    orderPendingBar:
        document.getElementById("orderPendingBar"),

    rfqPendingBar:
        document.getElementById("rfqPendingBar"),


    // Buttons
    btnRefresh:
        document.getElementById("btnRefreshDashboard")

};


// ============================================================
// INIT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initDashboard
);


async function initDashboard() {

    setupEvents();

    setDefaultMonth();

    await loadDashboard();

}


// ============================================================
// EVENTS
// ============================================================

function setupEvents() {


    if (DOM.btnRefresh) {

        DOM.btnRefresh.addEventListener(
            "click",
            async () => {

                DOM.btnRefresh.disabled = true;

                DOM.btnRefresh.textContent =
                    "Đang tải...";

                await loadDashboard();

                DOM.btnRefresh.disabled = false;

                DOM.btnRefresh.textContent =
                    "↻ Làm mới";

            }
        );

    }


    if (DOM.chartMonthFilter) {

        DOM.chartMonthFilter.addEventListener(
            "change",
            () => {

                loadActivityChart();

            }
        );

    }

}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    if (!window.supabaseClient) {

        console.error(
            "Không tìm thấy supabaseClient."
        );

        return;

    }


    await Promise.all([

        loadOrders(),

        loadRfqs(),

        loadContacts(),

        loadCatalogStats(),

        loadUserStats()

    ]);


    updateSummary();

    await loadActivityChart();

}


// ============================================================
// ORDERS
// ============================================================

async function loadOrders() {

    try {

        const {
            data,
            error
        } = await window.supabaseClient

            .from("orders")

            .select(`
                id,
                order_code,
                status,
                total,
                shipping_name,
                shipping_phone,
                created_at
            `)

            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            
            .limit(100);


        if (error) {

            throw error;

        }


        DASHBOARD.orders =
            data || [];


        // Tổng đơn

        setText(
            DOM.kpiOrders,
            DASHBOARD.orders.length
        );


        // Chờ xử lý

        const pending =
            DASHBOARD.orders.filter(
                order =>
                    isPendingOrder(
                        order.status
                    )
            ).length;


        setText(
            DOM.kpiOrdersPending,
            pending
        );


        renderOrders();


    } catch (error) {

        console.error(
            "Lỗi tải orders:",
            error
        );


        DASHBOARD.orders = [];

        setText(
            DOM.kpiOrders,
            "--"
        );

        setText(
            DOM.kpiOrdersPending,
            "--"
        );

        renderError(
            DOM.ordersBody,
            5,
            "Không thể tải dữ liệu đơn hàng."
        );

    }

}


// ============================================================
// RFQ
// ============================================================

async function loadRfqs() {

    try {

        const {
            data,
            error
        } = await window.supabaseClient

            .from("rfqs")

            .select(`
                id,
                rfq_code,
                company_name,
                contact_person,
                phone,
                email,
                status,
                created_at,
                items
            `)

            .order(
                "created_at",
                {
                    ascending: false
                }
            )

            .limit(100);


        if (error) {

            throw error;

        }


        DASHBOARD.rfqs =
            data || [];


        setText(
            DOM.kpiRfq,
            DASHBOARD.rfqs.length
        );


        const pending =
            DASHBOARD.rfqs.filter(
                rfq =>
                    normalizeStatus(
                        rfq.status
                    ) === "chờ xử lý"
            ).length;


        setText(
            DOM.kpiRfqPending,
            pending
        );


        renderRfqs();


    } catch (error) {

        console.error(
            "Lỗi tải rfqs:",
            error
        );


        DASHBOARD.rfqs = [];


        setText(
            DOM.kpiRfq,
            "--"
        );


        setText(
            DOM.kpiRfqPending,
            "--"
        );


        renderError(
            DOM.rfqBody,
            5,
            "Không thể tải dữ liệu RFQ."
        );

    }

}


// ============================================================
// CONTACTS
// ============================================================

async function loadContacts() {

    try {

        const {
            data,
            error
        } = await window.supabaseClient

            .from("contacts")

            .select("*")

            .order(
                "created_at",
                {
                    ascending: false
                }
            )

            .limit(20);


        if (error) {

            throw error;

        }


        DASHBOARD.contacts =
            data || [];


        const pending =
            DASHBOARD.contacts.filter(
                contact =>
                    normalizeStatus(
                        contact.status
                    ) === "pending"
            ).length;


        /*
         * Vì bảng contacts chỉ lấy 20 record gần nhất
         * nên KPI pending ở đây chỉ chính xác trong
         * tập 20 record này.
         *
         * Nếu bảng contacts lớn, nên tạo count query
         * riêng cho KPI.
         */

        setText(
            DOM.kpiContact,
            pending
        );


        renderContacts();


    } catch (error) {

        console.error(
            "Lỗi tải contacts:",
            error
        );


        DASHBOARD.contacts = [];


        setText(
            DOM.kpiContact,
            "--"
        );


        renderError(
            DOM.contactsBody,
            5,
            "Không thể tải dữ liệu liên hệ."
        );

    }

}


// ============================================================
// CATALOG
// ============================================================

async function loadCatalogStats() {

    const [
        products,
        blogs
    ] = await Promise.all([

        countRows(
            "products"
        ),

        countRows(
            "blogs"
        )

    ]);


    setText(
        DOM.kpiProduct,
        products
    );


    setText(
        DOM.kpiBlog,
        blogs
    );

}


// ============================================================
// USERS
// ============================================================

async function loadUserStats() {

    /*
     * Dùng profiles vì project của bro
     * đang có bảng profiles.
     */

    const count =
        await countRows(
            "profiles"
        );


    setText(
        DOM.kpiUsers,
        count
    );

}


// ============================================================
// GENERIC COUNT
// ============================================================

async function countRows(
    table,
    filterColumn = null,
    filterValue = null
) {

    try {

        let query =
            window.supabaseClient

                .from(table)

                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                );


        if (
            filterColumn !== null
        ) {

            query =
                query.eq(
                    filterColumn,
                    filterValue
                );

        }


        const {
            count,
            error
        } = await query;


        if (error) {

            console.error(
                `Count ${table}:`,
                error
            );

            return 0;

        }


        return count || 0;


    } catch (error) {

        console.error(
            `Count ${table}:`,
            error
        );

        return 0;

    }

}


// ============================================================
// SUMMARY
// ============================================================

function updateSummary() {


    // ORDERS

    const totalOrders =
        DASHBOARD.orders.length;


    const pendingOrders =
        DASHBOARD.orders.filter(
            order =>
                isPendingOrder(
                    order.status
                )
        ).length;


    const orderPercent =
        totalOrders > 0
            ? Math.round(
                pendingOrders /
                totalOrders *
                100
            )
            : 0;


    setText(
        DOM.orderStatusSummary,
        `${pendingOrders} chờ xử lý / ${totalOrders}`
    );


    if (DOM.orderPendingBar) {

        DOM.orderPendingBar.style.width =
            `${Math.min(
                orderPercent,
                100
            )}%`;

    }



    // RFQ

    const totalRfq =
        DASHBOARD.rfqs.length;


    const pendingRfq =
        DASHBOARD.rfqs.filter(
            rfq =>
                normalizeStatus(
                    rfq.status
                ) === "chờ xử lý"
        ).length;


    const rfqPercent =
        totalRfq > 0
            ? Math.round(
                pendingRfq /
                totalRfq *
                100
            )
            : 0;


    setText(
        DOM.rfqStatusSummary,
        `${pendingRfq} chờ xử lý / ${totalRfq}`
    );


    if (DOM.rfqPendingBar) {

        DOM.rfqPendingBar.style.width =
            `${Math.min(
                rfqPercent,
                100
            )}%`;

    }

}


// ============================================================
// ORDERS TABLE
// ============================================================

function renderOrders() {

    if (!DOM.ordersBody) {
        return;
    }


    if (
        DASHBOARD.orders.length === 0
    ) {

        renderEmpty(
            DOM.ordersBody,
            5,
            "Chưa có đơn hàng."
        );

        return;

    }


    const orders =
        DASHBOARD.orders
            .slice(0, 5);


    DOM.ordersBody.innerHTML =
        orders
            .map(
                order => {

                    const code =
                        escapeHTML(
                            order.order_code ||
                            `ORD-${order.id}`
                        );


                    const customer =
                        escapeHTML(
                            order.shipping_name ||
                            "Khách hàng"
                        );


                    const date =
                        formatDate(
                            order.created_at
                        );


                    return `

                        <tr class="hover:bg-gray-50 transition">

                            <td class="px-5 py-4">

                                <span
                                    class="
                                        font-black
                                        text-kn-blue
                                        text-xs
                                    "
                                >
                                    ${code}
                                </span>

                            </td>


                            <td class="px-5 py-4">

                                <div class="font-bold text-gray-800">
                                    ${customer}
                                </div>

                                ${
                                    order.shipping_phone
                                    ? `
                                        <div class="text-xs text-gray-400 mt-1">
                                            ${escapeHTML(
                                                order.shipping_phone
                                            )}
                                        </div>
                                    `
                                    : ""
                                }

                            </td>


                            <td class="px-5 py-4">

                                <span class="text-xs text-gray-500">
                                    ${date}
                                </span>

                            </td>


                            <td class="px-5 py-4 text-center">

                                ${renderOrderStatus(
                                    order.status
                                )}

                            </td>


                            <td class="px-5 py-4 text-right">

                                <a
                                    href="manage-order-detail.html?id=${encodeURIComponent(order.id)}"
                                    class="
                                        text-xs
                                        font-bold
                                        text-kn-blue
                                        hover:underline
                                    "
                                >
                                    Xem
                                </a>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


// ============================================================
// RFQ TABLE
// ============================================================

function renderRfqs() {

    if (!DOM.rfqBody) {
        return;
    }


    if (
        DASHBOARD.rfqs.length === 0
    ) {

        renderEmpty(
            DOM.rfqBody,
            5,
            "Chưa có yêu cầu báo giá."
        );

        return;

    }


    const rfqs =
        DASHBOARD.rfqs
            .slice(0, 5);


    DOM.rfqBody.innerHTML =
        rfqs
            .map(
                rfq => {

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


                    const date =
                        formatDate(
                            rfq.created_at
                        );


                    return `

                        <tr class="hover:bg-gray-50 transition">

                            <td class="px-5 py-4">

                                <span
                                    class="
                                        font-black
                                        text-kn-blue
                                        text-xs
                                    "
                                >
                                    ${code}
                                </span>

                            </td>


                            <td class="px-5 py-4">

                                <div class="font-bold text-gray-800">
                                    ${company}
                                </div>

                            </td>


                            <td class="px-5 py-4">

                                <span class="text-xs text-gray-500">
                                    ${date}
                                </span>

                            </td>


                            <td class="px-5 py-4 text-center">

                                ${renderRfqStatus(
                                    rfq.status
                                )}

                            </td>


                            <td class="px-5 py-4 text-right">

                                <a
                                    href="manage-rfq-detail.html?id=${encodeURIComponent(rfq.id)}"
                                    class="
                                        text-xs
                                        font-bold
                                        text-kn-blue
                                        hover:underline
                                    "
                                >
                                    Xem
                                </a>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


// ============================================================
// CONTACT TABLE
// ============================================================

function renderContacts() {

    if (!DOM.contactsBody) {
        return;
    }


    if (
        DASHBOARD.contacts.length === 0
    ) {

        renderEmpty(
            DOM.contactsBody,
            5,
            "Chưa có liên hệ."
        );

        return;

    }


    const contacts =
        DASHBOARD.contacts
            .slice(0, 5);


    DOM.contactsBody.innerHTML =
        contacts
            .map(
                contact => {

                    const name =
                        escapeHTML(
                            contact.name ||
                            contact.full_name ||
                            contact.contact_name ||
                            "Khách hàng"
                        );


                    const email =
                        escapeHTML(
                            contact.email ||
                            "-"
                        );


                    const phone =
                        escapeHTML(
                            contact.phone ||
                            "-"
                        );


                    const date =
                        formatDate(
                            contact.created_at
                        );


                    return `

                        <tr class="hover:bg-gray-50 transition">

                            <td class="px-6 py-4">

                                <span class="font-bold text-gray-800">
                                    ${name}
                                </span>

                            </td>


                            <td class="px-6 py-4">

                                <span class="text-sm text-gray-600">
                                    ${email}
                                </span>

                            </td>


                            <td class="px-6 py-4">

                                <span class="text-sm text-gray-600">
                                    ${phone}
                                </span>

                            </td>


                            <td class="px-6 py-4">

                                <span class="text-xs text-gray-500">
                                    ${date}
                                </span>

                            </td>


                            <td class="px-6 py-4 text-center">

                                ${renderContactStatus(
                                    contact.status
                                )}

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


// ============================================================
// ACTIVITY CHART
// ============================================================

async function loadActivityChart() {

    if (!DOM.activityChart) {
        return;
    }


    try {

        const selected =
            DOM.chartMonthFilter?.value;


        let selectedDate =
            selected
                ? new Date(
                    `${selected}-01T00:00:00`
                )
                : new Date();


        const months = [];


        for (
            let i = 5;
            i >= 0;
            i--
        ) {

            const date =
                new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() - i,
                    1
                );


            months.push({
                year:
                    date.getFullYear(),

                month:
                    date.getMonth() + 1,

                key:
                    `${date.getFullYear()}-${String(
                        date.getMonth() + 1
                    ).padStart(2, "0")}`,

                label:
                    `T${String(
                        date.getMonth() + 1
                    ).padStart(2, "0")}/${date.getFullYear()}`
            });

        }


        const startDate =
            new Date(
                months[0].year,
                months[0].month - 1,
                1
            );


        const endDate =
            new Date(
                months[months.length - 1].year,
                months[months.length - 1].month,
                0,
                23,
                59,
                59,
                999
            );


        const [
            orderResult,
            rfqResult
        ] = await Promise.all([

            window.supabaseClient
                .from("orders")
                .select("created_at")
                .gte(
                    "created_at",
                    startDate.toISOString()
                )
                .lte(
                    "created_at",
                    endDate.toISOString()
                ),

            window.supabaseClient
                .from("rfqs")
                .select("created_at")
                .gte(
                    "created_at",
                    startDate.toISOString()
                )
                .lte(
                    "created_at",
                    endDate.toISOString()
                )

        ]);


        if (orderResult.error) {
            throw orderResult.error;
        }


        if (rfqResult.error) {
            throw rfqResult.error;
        }


        const orderCounts = {};

        const rfqCounts = {};


        months.forEach(
            month => {

                orderCounts[
                    month.key
                ] = 0;

                rfqCounts[
                    month.key
                ] = 0;

            }
        );


        (
            orderResult.data || []
        ).forEach(
            row => {

                const date =
                    new Date(
                        row.created_at
                    );


                const key =
                    `${date.getFullYear()}-${String(
                        date.getMonth() + 1
                    ).padStart(2, "0")}`;


                if (
                    key in orderCounts
                ) {

                    orderCounts[key]++;

                }

            }
        );


        (
            rfqResult.data || []
        ).forEach(
            row => {

                const date =
                    new Date(
                        row.created_at
                    );


                const key =
                    `${date.getFullYear()}-${String(
                        date.getMonth() + 1
                    ).padStart(2, "0")}`;


                if (
                    key in rfqCounts
                ) {

                    rfqCounts[key]++;

                }

            }
        );


        const labels =
            months.map(
                month =>
                    month.label
            );


        const orderData =
            months.map(
                month =>
                    orderCounts[
                        month.key
                    ]
            );


        const rfqData =
            months.map(
                month =>
                    rfqCounts[
                        month.key
                    ]
            );


        if (DASHBOARD.chart) {

            DASHBOARD.chart.destroy();

        }


        DASHBOARD.chart =
            new Chart(
                DOM.activityChart.getContext("2d"),
                {

                    type: "bar",

                    data: {

                        labels,

                        datasets: [

                            {
                                label:
                                    "Đơn hàng",

                                data:
                                    orderData,

                                backgroundColor:
                                    "#00479b",

                                borderRadius:
                                    5
                            },

                            {
                                label:
                                    "RFQ",

                                data:
                                    rfqData,

                                backgroundColor:
                                    "#ff5e00",

                                borderRadius:
                                    5
                            }

                        ]

                    },


                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {

                                position:
                                    "bottom",

                                labels: {

                                    usePointStyle:
                                        true,

                                    padding:
                                        20

                                }

                            }

                        },


                        scales: {

                            y: {

                                beginAtZero:
                                    true,

                                ticks: {

                                    precision:
                                        0

                                },

                                grid: {

                                    color:
                                        "#f3f4f6"

                                }

                            },


                            x: {

                                grid: {

                                    display:
                                        false

                                }

                            }

                        }

                    }

                }
            );


    } catch (error) {

        console.error(
            "Lỗi biểu đồ dashboard:",
            error
        );

    }

}


// ============================================================
// STATUS UI
// ============================================================

function renderOrderStatus(status) {

    const normalized =
        normalizeStatus(
            status
        );


    if (
        [
            "completed",
            "hoàn tất",
            "đã giao",
            "delivered"
        ].includes(
            normalized
        )
    ) {

        return badge(
            "Hoàn tất",
            "green"
        );

    }


    if (
        [
            "cancelled",
            "canceled",
            "đã hủy",
            "hủy"
        ].includes(
            normalized
        )
    ) {

        return badge(
            "Đã hủy",
            "red"
        );

    }


    if (
        [
            "processing",
            "đang xử lý",
            "confirmed",
            "đã xác nhận"
        ].includes(
            normalized
        )
    ) {

        return badge(
            "Đang xử lý",
            "blue"
        );

    }


    return badge(
        "Chờ xử lý",
        "orange"
    );

}


function renderRfqStatus(status) {

    const normalized =
        normalizeStatus(
            status
        );


    if (
        normalized ===
        "đã báo giá"
    ) {

        return badge(
            "Đã báo giá",
            "green"
        );

    }


    if (
        normalized ===
        "từ chối"
    ) {

        return badge(
            "Từ chối",
            "red"
        );

    }


    return badge(
        "Chờ xử lý",
        "orange"
    );

}


function renderContactStatus(status) {

    if (
        normalizeStatus(
            status
        ) === "pending"
    ) {

        return badge(
            "Chờ duyệt",
            "orange"
        );

    }


    return badge(
        status || "Đã xử lý",
        "green"
    );

}


function badge(
    text,
    type
) {

    const classes = {

        green:
            "bg-green-50 text-green-700 border-green-200",

        red:
            "bg-red-50 text-red-700 border-red-200",

        blue:
            "bg-blue-50 text-blue-700 border-blue-200",

        orange:
            "bg-orange-50 text-orange-700 border-orange-200"

    };


    return `

        <span
            class="
                inline-flex
                px-3
                py-1
                rounded-full
                border
                text-[11px]
                font-bold
                ${classes[type] || classes.blue}
            "
        >
            ${escapeHTML(text)}
        </span>

    `;

}


// ============================================================
// HELPERS
// ============================================================

function isPendingOrder(status) {

    const normalized =
        normalizeStatus(
            status
        );


    return [
        "pending",
        "chờ xử lý",
        "chờ xác nhận",
        "new"
    ].includes(
        normalized
    );

}


function normalizeStatus(value) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();

}


function setText(
    element,
    value
) {

    if (element) {

        element.textContent =
            value;

    }

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


    return String(
        value ?? ""
    )
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


function renderEmpty(
    element,
    colspan,
    message
) {

    if (!element) {
        return;
    }


    element.innerHTML = `

        <tr>

            <td
                colspan="${colspan}"
                class="
                    text-center
                    py-8
                    text-gray-400
                    italic
                "
            >
                ${escapeHTML(message)}
            </td>

        </tr>

    `;

}


function renderError(
    element,
    colspan,
    message
) {

    if (!element) {
        return;
    }


    element.innerHTML = `

        <tr>

            <td
                colspan="${colspan}"
                class="
                    text-center
                    py-8
                    text-red-500
                    font-bold
                "
            >
                ${escapeHTML(message)}
            </td>

        </tr>

    `;

}


function setDefaultMonth() {

    if (!DOM.chartMonthFilter) {
        return;
    }

    const today = new Date();

    DOM.chartMonthFilter.value =
        `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, "0")}`;

}