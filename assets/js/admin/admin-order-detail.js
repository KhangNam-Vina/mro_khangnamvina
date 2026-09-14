// ========================================================
// FILE: admin-order-detail.js
// CHI TIẾT + XỬ LÝ ĐƠN HÀNG ADMIN
// PHASE 3
// ========================================================


const orderDetailState = {

    orderId: null,

    order: null,

    items: [],

    profile: null,

    updatingStatus: false,

    cancellingOrder: false

};


const orderDetailDOM = {};



// ========================================================
// 1. STATUS WORKFLOW
// ========================================================


const ORDER_STATUS_FLOW = [

    "pending",

    "confirmed",

    "processing",

    "shipped",

    "delivered"

];


const ORDER_STATUS_META = {

    pending: {

        label: "Chờ xử lý",

        className:
            "bg-orange-100 text-orange-700 border-orange-200",

        description:
            "Đơn hàng mới được tạo và đang chờ xác nhận."

    },


    confirmed: {

        label: "Đã xác nhận",

        className:
            "bg-blue-100 text-blue-700 border-blue-200",

        description:
            "Đơn hàng đã được admin xác nhận."

    },


    processing: {

        label: "Đang xử lý",

        className:
            "bg-purple-100 text-purple-700 border-purple-200",

        description:
            "Đơn hàng đang được chuẩn bị."

    },


    shipped: {

        label: "Đang giao",

        className:
            "bg-indigo-100 text-indigo-700 border-indigo-200",

        description:
            "Đơn hàng đã được bàn giao cho đơn vị giao hàng."

    },


    delivered: {

        label: "Đã giao",

        className:
            "bg-green-100 text-green-700 border-green-200",

        description:
            "Đơn hàng đã giao thành công."

    },


    cancelled: {

        label: "Đã hủy",

        className:
            "bg-red-100 text-red-700 border-red-200",

        description:
            "Đơn hàng đã bị hủy."

    }

};



// ========================================================
// 2. CACHE DOM
// ========================================================


function cacheOrderDetailDOM() {


    orderDetailDOM.loading =
        document.getElementById(
            "orderDetailLoading"
        );


    orderDetailDOM.error =
        document.getElementById(
            "orderDetailError"
        );


    orderDetailDOM.errorText =
        document.getElementById(
            "orderDetailErrorText"
        );


    orderDetailDOM.content =
        document.getElementById(
            "orderDetailContent"
        );



    // ORDER HEADER


    orderDetailDOM.orderCode =
        document.getElementById(
            "orderCode"
        );


    orderDetailDOM.orderCreatedAt =
        document.getElementById(
            "orderCreatedAt"
        );


    orderDetailDOM.orderStatusBadge =
        document.getElementById(
            "orderStatusBadge"
        );


    orderDetailDOM.orderStatusSelect =
        document.getElementById(
            "orderStatusSelect"
        );


    orderDetailDOM.updateStatusButton =
        document.getElementById(
            "btnUpdateOrderStatus"
        );



    // STATUS WORKFLOW


    orderDetailDOM.statusProgress =
        document.getElementById(
            "orderStatusProgress"
        );


    orderDetailDOM.statusDescription =
        document.getElementById(
            "orderStatusDescription"
        );



    // CANCELLATION


    orderDetailDOM.cancellationSection =
        document.getElementById(
            "orderCancellationSection"
        );


    orderDetailDOM.cancellationReason =
        document.getElementById(
            "orderCancellationReason"
        );



    // CUSTOMER


    orderDetailDOM.customerName =
        document.getElementById(
            "customerName"
        );


    orderDetailDOM.customerPhone =
        document.getElementById(
            "customerPhone"
        );


    orderDetailDOM.customerEmail =
        document.getElementById(
            "customerEmail"
        );



    // SHIPPING


    orderDetailDOM.shippingName =
        document.getElementById(
            "shippingName"
        );


    orderDetailDOM.shippingPhone =
        document.getElementById(
            "shippingPhone"
        );


    orderDetailDOM.shippingAddress =
        document.getElementById(
            "shippingAddress"
        );



    // ITEMS


    orderDetailDOM.itemsBody =
        document.getElementById(
            "orderItemsBody"
        );



    // SUMMARY


    orderDetailDOM.orderSubtotal =
        document.getElementById(
            "orderSubtotal"
        );


    orderDetailDOM.orderShippingFee =
        document.getElementById(
            "orderShippingFee"
        );


    orderDetailDOM.orderTotal =
        document.getElementById(
            "orderTotal"
        );



    // NOTE


    orderDetailDOM.noteSection =
        document.getElementById(
            "orderNoteSection"
        );


    orderDetailDOM.note =
        document.getElementById(
            "orderNote"
        );



    // QUICK INFO


    orderDetailDOM.quickOrderCode =
        document.getElementById(
            "quickOrderCode"
        );


    orderDetailDOM.quickCreatedAt =
        document.getElementById(
            "quickCreatedAt"
        );


    orderDetailDOM.quickItemsCount =
        document.getElementById(
            "quickItemsCount"
        );



    // CANCEL MODAL


    orderDetailDOM.cancelModal =
        document.getElementById(
            "cancelOrderModal"
        );


    orderDetailDOM.cancelOverlay =
        document.getElementById(
            "cancelOrderOverlay"
        );


    orderDetailDOM.cancelOrderCode =
        document.getElementById(
            "cancelOrderCode"
        );


    orderDetailDOM.cancelReason =
        document.getElementById(
            "cancelOrderReason"
        );


    orderDetailDOM.cancelReasonError =
        document.getElementById(
            "cancelOrderReasonError"
        );


    orderDetailDOM.cancelReasonCount =
        document.getElementById(
            "cancelOrderReasonCount"
        );


    orderDetailDOM.closeCancelModal =
        document.getElementById(
            "btnCloseCancelModal"
        );


    orderDetailDOM.cancelModalButton =
        document.getElementById(
            "btnCancelOrderModal"
        );


    orderDetailDOM.confirmCancelButton =
        document.getElementById(
            "btnConfirmCancelOrder"
        );

}



// ========================================================
// 3. HELPERS
// ========================================================


function escapeOrderDetailHTML(value) {

    if (
        window.utils &&
        typeof window.utils.escapeHTML === "function"
    ) {

        return window.utils.escapeHTML(
            value ?? ""
        );

    }


    return String(value ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}



function formatOrderDetailMoney(value) {

    const number =
        Number(value);


    if (!Number.isFinite(number)) {

        return "0 ₫";

    }


    return (
        number.toLocaleString("vi-VN") +
        " ₫"
    );

}



function formatOrderDetailDate(value) {

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


    return (

        date.toLocaleDateString(
            "vi-VN"
        ) +

        " " +

        date.toLocaleTimeString(
            "vi-VN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        )

    );

}



// ========================================================
// 4. STATUS HELPERS
// ========================================================


function getOrderDetailStatusMeta(status) {

    const normalized =

        String(status || "")

            .trim()

            .toLowerCase();


    return (

        ORDER_STATUS_META[
            normalized
        ]

        ||

        {

            label: "Không xác định",

            className:
                "bg-gray-100 text-gray-600 border-gray-200",

            description:
                "Trạng thái đơn hàng không xác định."

        }

    );

}



function getStatusIndex(status) {

    return ORDER_STATUS_FLOW.indexOf(

        String(status || "")

            .trim()

            .toLowerCase()

    );

}



function canTransitionOrderStatus(
    oldStatus,
    newStatus
) {


    oldStatus =

        String(oldStatus || "")

            .trim()

            .toLowerCase();


    newStatus =

        String(newStatus || "")

            .trim()

            .toLowerCase();



    if (
        !oldStatus ||
        !newStatus
    ) {

        return false;

    }



    if (
        oldStatus === newStatus
    ) {

        return false;

    }



    // Delivered là trạng thái kết thúc


    if (
        oldStatus === "delivered"
    ) {

        return false;

    }



    // Cancelled là trạng thái kết thúc


    if (
        oldStatus === "cancelled"
    ) {

        return false;

    }



    // Chỉ được hủy trước khi bàn giao


    if (
        newStatus === "cancelled"
    ) {

        return [

            "pending",

            "confirmed",

            "processing"

        ].includes(
            oldStatus
        );

    }



    const oldIndex =
        getStatusIndex(
            oldStatus
        );


    const newIndex =
        getStatusIndex(
            newStatus
        );



    if (
        oldIndex === -1 ||
        newIndex === -1
    ) {

        return false;

    }



    // Chỉ được tiến một bước


    return (
        newIndex === oldIndex + 1
    );

}



function getAllowedNextStatuses(
    currentStatus
) {


    const normalized =

        String(currentStatus || "")

            .trim()

            .toLowerCase();



    if (

        normalized === "delivered" ||

        normalized === "cancelled"

    ) {

        return [];

    }



    const index =
        getStatusIndex(
            normalized
        );


    if (
        index === -1
    ) {

        return [];

    }



    const result = [];



    if (
        index <
        ORDER_STATUS_FLOW.length - 1
    ) {

        result.push(
            ORDER_STATUS_FLOW[
                index + 1
            ]
        );

    }



    // Có thể hủy từ 3 trạng thái đầu


    if (

        [
            "pending",
            "confirmed",
            "processing"

        ].includes(
            normalized
        )

    ) {

        result.push(
            "cancelled"
        );

    }



    return result;

}



// ========================================================
// 5. GET ORDER ID
// ========================================================


function getOrderIdFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        params.get("id");


    if (!id) {

        return null;

    }


    const numericId =
        Number(id);


    if (

        !Number.isInteger(
            numericId
        ) ||

        numericId <= 0

    ) {

        return null;

    }


    return numericId;

}



// ========================================================
// 6. LOAD ORDER
// ========================================================


async function loadOrderDetail() {

    if (!window.supabaseClient) {

        throw new Error(
            "Supabase chưa được khởi tạo."
        );

    }


    const {

        data: order,

        error

    } =

        await window.supabaseClient

            .from("orders")

            .select(`
                id,
                order_code,
                status,
                subtotal,
                shipping_fee,
                total,
                shipping_name,
                shipping_phone,
                shipping_address,
                note,
                cancellation_reason,
                created_at
            `)

            .eq(
                "id",
                orderDetailState.orderId
            )

            .single();



    if (error) {

        throw error;

    }



    if (!order) {

        throw new Error(
            "Không tìm thấy đơn hàng."
        );

    }



    orderDetailState.order =
        order;

}



// ========================================================
// 7. LOAD ORDER ITEMS
// ========================================================


async function loadOrderItems() {

    if (!window.supabaseClient) {

        return;

    }


    const {

        data: items,

        error

    } =

        await window.supabaseClient

            .from("order_items")

            .select(`
                id,
                order_id,
                product_id,
                product_name,
                sku,
                size,
                unit_price,
                quantity,
                subtotal
            `)

            .eq(
                "order_id",
                orderDetailState.orderId
            )

            .order(
                "id",
                {
                    ascending: true
                }
            );



    if (error) {

        throw error;

    }



    orderDetailState.items =
        items || [];

}



// ========================================================
// 8. LOAD CUSTOMER PROFILE
// ========================================================


async function loadCustomerProfile() {

    const order =
        orderDetailState.order;


    /*
     * user_id vẫn được dùng nội bộ để lấy profile.
     * Không hiển thị và không quản lý User ID ở UI.
     *
     * Tuy nhiên query order không còn select user_id.
     *
     * Nếu hệ thống cần profile thì có thể lấy từ
     * relation / backend khác.
     *
     * Để không phụ thuộc User ID trong admin detail,
     * customer sẽ ưu tiên thông tin shipping.
     */

    orderDetailState.profile = null;

}



// ========================================================
// 9. RENDER ORDER HEADER
// ========================================================


function renderOrderHeader() {

    const order =
        orderDetailState.order;


    if (!order) {

        return;

    }


    const status =
        getOrderDetailStatusMeta(
            order.status
        );



    orderDetailDOM.orderCode.textContent =
        order.order_code || "-";



    orderDetailDOM.orderCreatedAt.textContent =
        formatOrderDetailDate(
            order.created_at
        );



    orderDetailDOM.orderStatusBadge.className = `

        inline-flex

        px-3

        py-1.5

        rounded-full

        border

        text-xs

        font-black

        ${status.className}

    `;



    orderDetailDOM.orderStatusBadge.textContent =
        status.label;



    renderStatusSelect();

    renderStatusProgress();

    renderCancellationReason();



    orderDetailDOM.quickOrderCode.textContent =
        order.order_code || "-";



    orderDetailDOM.quickCreatedAt.textContent =
        formatOrderDetailDate(
            order.created_at
        );

}



// ========================================================
// 10. RENDER STATUS SELECT
// ========================================================


function renderStatusSelect() {

    const select =
        orderDetailDOM.orderStatusSelect;


    const order =
        orderDetailState.order;


    if (
        !select ||
        !order
    ) {

        return;

    }



    const currentStatus =

        String(order.status || "")

            .trim()

            .toLowerCase();



    const allowedStatuses =
        getAllowedNextStatuses(
            currentStatus
        );



    select.innerHTML = "";



    // CURRENT STATUS


    const currentOption =
        document.createElement(
            "option"
        );


    currentOption.value =
        currentStatus;


    currentOption.textContent =

        getOrderDetailStatusMeta(
            currentStatus
        ).label +

        " (hiện tại)";


    select.appendChild(
        currentOption
    );



    // NEXT STATUSES


    allowedStatuses.forEach(
        status => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                status;


            option.textContent =
                getOrderDetailStatusMeta(
                    status
                ).label;


            select.appendChild(
                option
            );

        }
    );



    select.value =
        currentStatus;



    const isLocked =

        currentStatus === "delivered" ||

        currentStatus === "cancelled";



    select.disabled =

        isLocked ||

        orderDetailState.updatingStatus;



    if (
        orderDetailDOM.updateStatusButton
    ) {

        orderDetailDOM.updateStatusButton.disabled =

            isLocked ||

            orderDetailState.updatingStatus ||

            allowedStatuses.length === 0;

    }



    updateStatusButtonLabel();

}



// ========================================================
// 11. UPDATE STATUS BUTTON LABEL
// ========================================================


function updateStatusButtonLabel() {

    const button =
        orderDetailDOM.updateStatusButton;


    const select =
        orderDetailDOM.orderStatusSelect;


    if (
        !button ||
        !select
    ) {

        return;

    }



    if (
        orderDetailState.updatingStatus
    ) {

        button.textContent =
            "Đang cập nhật...";

        return;

    }



    const currentStatus =
        orderDetailState.order?.status;


    const selectedStatus =
        select.value;



    if (

        !currentStatus ||

        currentStatus === selectedStatus

    ) {

        button.textContent =
            "Cập nhật trạng thái";

        return;

    }



    if (
        selectedStatus === "cancelled"
    ) {

        button.textContent =
            "Xác nhận hủy đơn";

        return;

    }



    button.textContent =
        "Cập nhật trạng thái";

}



// ========================================================
// 12. RENDER STATUS PROGRESS
// ========================================================


function renderStatusProgress() {

    const container =
        orderDetailDOM.statusProgress;


    const description =
        orderDetailDOM.statusDescription;


    const order =
        orderDetailState.order;



    if (
        !container ||
        !order
    ) {

        return;

    }



    const currentStatus =

        String(order.status || "")

            .trim()

            .toLowerCase();



    const currentIndex =
        getStatusIndex(
            currentStatus
        );



    container.innerHTML = "";



    ORDER_STATUS_FLOW.forEach(

        (
            status,
            index
        ) => {


            const meta =
                getOrderDetailStatusMeta(
                    status
                );


            const isCompleted =

                currentIndex !== -1 &&

                index < currentIndex;


            const isCurrent =
                status === currentStatus;


            const isFuture =

                currentIndex !== -1 &&

                index > currentIndex;



            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "flex-1 min-w-[110px]";



            wrapper.innerHTML = `

                <div class="
                    flex
                    items-center
                ">

                    <div class="
                        w-8
                        h-8
                        shrink-0
                        rounded-full
                        border-2
                        flex
                        items-center
                        justify-center
                        text-xs
                        font-black

                        ${
                            isCurrent
                                ? "bg-kn-blue text-white border-kn-blue"
                                : isCompleted
                                    ? "bg-green-500 text-white border-green-500"
                                    : "bg-white text-gray-400 border-gray-300"
                        }
                    ">

                        ${
                            isCompleted
                                ? "✓"
                                : index + 1
                        }

                    </div>


                    ${
                        index <
                        ORDER_STATUS_FLOW.length - 1

                            ? `

                                <div class="
                                    h-0.5
                                    flex-1
                                    mx-2

                                    ${
                                        index < currentIndex
                                            ? "bg-green-500"
                                            : "bg-gray-200"
                                    }
                                "></div>

                            `

                            : ""
                    }

                </div>


                <p class="
                    text-xs
                    mt-2
                    font-black

                    ${
                        isCurrent
                            ? "text-kn-blue"
                            : isFuture
                                ? "text-gray-400"
                                : "text-gray-600"
                    }
                ">

                    ${escapeOrderDetailHTML(
                        meta.label
                    )}

                </p>

            `;



            container.appendChild(
                wrapper
            );

        }

    );



    // DESCRIPTION


    if (description) {


        if (
            currentStatus === "cancelled"
        ) {

            description.textContent =
                "Đơn hàng đã bị hủy và không thể tiếp tục xử lý.";


        } else if (
            currentStatus === "delivered"
        ) {

            description.textContent =
                "Đơn hàng đã hoàn tất.";


        } else {

            description.textContent =
                getOrderDetailStatusMeta(
                    currentStatus
                ).description;

        }

    }



    // CANCELLED MARKER


    if (
        currentStatus === "cancelled"
    ) {


        const cancelled =
            document.createElement(
                "div"
            );


        cancelled.className =
            "mt-4 pt-4 border-t border-gray-200";



        cancelled.innerHTML = `

            <div class="
                inline-flex
                items-center
                gap-2
                px-3
                py-2
                rounded-lg
                border
                border-red-200
                bg-red-50
                text-red-700
                text-xs
                font-black
            ">

                <span
                    class="
                        w-2
                        h-2
                        rounded-full
                        bg-red-500
                    "
                ></span>

                Đơn hàng đã hủy

            </div>

        `;



        container.appendChild(
            cancelled
        );

    }

}



// ========================================================
// 13. RENDER CANCELLATION REASON
// ========================================================


function renderCancellationReason() {

    const order =
        orderDetailState.order;


    const section =
        orderDetailDOM.cancellationSection;


    const reason =
        orderDetailDOM.cancellationReason;



    if (
        !section ||
        !reason ||
        !order
    ) {

        return;

    }



    const status =

        String(order.status || "")

            .trim()

            .toLowerCase();



    if (
        status !== "cancelled"
    ) {

        section.classList.add(
            "hidden"
        );

        reason.textContent =
            "";

        return;

    }



    const cancellationReason =

        String(
            order.cancellation_reason || ""
        ).trim();



    section.classList.remove(
        "hidden"
    );



    reason.textContent =

        cancellationReason ||

        "Không có lý do hủy được ghi nhận.";

}



// ========================================================
// 14. RENDER CUSTOMER
// ========================================================


function renderCustomer() {

    const order =
        orderDetailState.order;


    const profile =
        orderDetailState.profile;



    const name =

        profile?.full_name ||

        order?.shipping_name ||

        "Khách hàng";



    const phone =

        profile?.phone ||

        order?.shipping_phone ||

        "-";



    const email =

        profile?.email ||

        "-";



    orderDetailDOM.customerName.textContent =
        name;


    orderDetailDOM.customerPhone.textContent =
        phone;


    orderDetailDOM.customerEmail.textContent =
        email;

}



// ========================================================
// 15. RENDER SHIPPING
// ========================================================


function renderShipping() {

    const order =
        orderDetailState.order;



    if (!order) {

        return;

    }



    orderDetailDOM.shippingName.textContent =
        order.shipping_name || "-";


    orderDetailDOM.shippingPhone.textContent =
        order.shipping_phone || "-";


    orderDetailDOM.shippingAddress.textContent =
        order.shipping_address || "-";

}



// ========================================================
// 16. RENDER ITEMS
// ========================================================


function renderItems() {

    if (
        !orderDetailDOM.itemsBody
    ) {

        return;

    }



    const items =
        orderDetailState.items;



    if (
        orderDetailDOM.quickItemsCount
    ) {

        orderDetailDOM.quickItemsCount.textContent =

            items.reduce(

                (
                    total,
                    item
                ) =>

                    total +

                    Number(
                        item.quantity || 0
                    ),

                0

            );

    }



    if (!items.length) {

        orderDetailDOM.itemsBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="
                        p-10
                        text-center
                        text-gray-400
                    "
                >

                    Đơn hàng chưa có sản phẩm.

                </td>

            </tr>

        `;

        return;

    }



    orderDetailDOM.itemsBody.innerHTML =

        items

            .map(
                item => {


                    const size =

                        item.size !== undefined &&

                        item.size !== null

                            ? String(
                                item.size
                            ).trim()

                            : "";



                    return `

                        <tr>

                            <td class="p-4">

                                <p class="
                                    font-bold
                                    text-gray-800
                                ">

                                    ${escapeOrderDetailHTML(

                                        item.product_name ||

                                        "Sản phẩm"

                                    )}

                                </p>

                            </td>



                            <td class="
                                p-4
                                text-sm
                                text-gray-500
                            ">

                                ${escapeOrderDetailHTML(
                                    item.sku || "-"
                                )}

                            </td>



                            <td class="
                                p-4
                                text-center
                            ">

                                ${
                                    size

                                        ? `

                                            <span class="
                                                inline-flex
                                                items-center
                                                justify-center
                                                min-w-[32px]
                                                px-2
                                                py-1
                                                rounded
                                                border
                                                border-orange-200
                                                bg-orange-50
                                                text-orange-600
                                                text-xs
                                                font-black
                                            ">

                                                ${escapeOrderDetailHTML(
                                                    size
                                                )}

                                            </span>

                                        `

                                        : `

                                            <span class="text-gray-400">
                                                -
                                            </span>

                                        `
                                }

                            </td>



                            <td class="
                                p-4
                                text-right
                                font-bold
                                whitespace-nowrap
                            ">

                                ${escapeOrderDetailHTML(

                                    formatOrderDetailMoney(
                                        item.unit_price
                                    )

                                )}

                            </td>



                            <td class="
                                p-4
                                text-center
                                font-bold
                            ">

                                ${escapeOrderDetailHTML(
                                    item.quantity
                                )}

                            </td>



                            <td class="
                                p-4
                                text-right
                                font-black
                                whitespace-nowrap
                            ">

                                ${escapeOrderDetailHTML(

                                    formatOrderDetailMoney(
                                        item.subtotal
                                    )

                                )}

                            </td>

                        </tr>

                    `;

                }
            )

            .join("");

}



// ========================================================
// 17. RENDER SUMMARY
// ========================================================


function renderSummary() {

    const order =
        orderDetailState.order;



    if (!order) {

        return;

    }



    orderDetailDOM.orderSubtotal.textContent =

        formatOrderDetailMoney(
            order.subtotal
        );



    orderDetailDOM.orderShippingFee.textContent =

        formatOrderDetailMoney(
            order.shipping_fee
        );



    orderDetailDOM.orderTotal.textContent =

        formatOrderDetailMoney(
            order.total
        );

}



// ========================================================
// 18. RENDER NOTE
// ========================================================


function renderNote() {

    const order =
        orderDetailState.order;



    if (

        !order ||

        !order.note ||

        !String(
            order.note
        ).trim()

    ) {

        orderDetailDOM.noteSection.classList.add(
            "hidden"
        );

        return;

    }



    orderDetailDOM.noteSection.classList.remove(
        "hidden"
    );



    orderDetailDOM.note.textContent =
        order.note;

}



// ========================================================
// 19. RENDER EVERYTHING
// ========================================================


function renderOrderDetail() {

    renderOrderHeader();

    renderCustomer();

    renderShipping();

    renderItems();

    renderSummary();

    renderNote();

}



// ========================================================
// 20. OPEN CANCEL MODAL
// ========================================================


function openCancelOrderModal() {

    const order =
        orderDetailState.order;



    if (!order) {

        return;

    }



    const currentStatus =

        String(order.status || "")

            .trim()

            .toLowerCase();



    if (
        !["pending", "confirmed", "processing"]
            .includes(currentStatus)
    ) {

        alert(
            "Đơn hàng hiện tại không thể hủy."
        );

        return;

    }



    if (
        orderDetailState.updatingStatus ||
        orderDetailState.cancellingOrder
    ) {

        return;

    }



    if (
        orderDetailDOM.cancelModal
    ) {

        orderDetailDOM.cancelModal.classList.remove(
            "hidden"
        );

        orderDetailDOM.cancelModal.classList.add(
            "flex"
        );

    }



    if (
        orderDetailDOM.cancelOrderCode
    ) {

        orderDetailDOM.cancelOrderCode.textContent =

            `Mã đơn: ${
                order.order_code ||
                "#" + order.id
            }`;

    }



    if (
        orderDetailDOM.cancelReason
    ) {

        orderDetailDOM.cancelReason.value =
            "";

        updateCancelReasonCounter();

        clearCancelReasonError();

        setTimeout(
            () => {

                orderDetailDOM.cancelReason.focus();

            },
            50
        );

    }



    document.body.classList.add(
        "overflow-hidden"
    );

}



// ========================================================
// 21. CLOSE CANCEL MODAL
// ========================================================


function closeCancelOrderModal() {

    if (
        orderDetailState.cancellingOrder
    ) {

        return;

    }



    if (
        orderDetailDOM.cancelModal
    ) {

        orderDetailDOM.cancelModal.classList.add(
            "hidden"
        );

        orderDetailDOM.cancelModal.classList.remove(
            "flex"
        );

    }



    document.body.classList.remove(
        "overflow-hidden"
    );

}



// ========================================================
// 22. CANCEL REASON ERROR
// ========================================================


function clearCancelReasonError() {

    if (
        orderDetailDOM.cancelReasonError
    ) {

        orderDetailDOM.cancelReasonError.textContent =
            "";

    }



    if (
        orderDetailDOM.cancelReason
    ) {

        orderDetailDOM.cancelReason.classList.remove(
            "border-red-400",
            "ring-2",
            "ring-red-100"
        );

    }

}



// ========================================================
// 23. VALIDATE CANCEL REASON
// ========================================================


function validateCancelReason() {

    if (
        !orderDetailDOM.cancelReason
    ) {

        return null;

    }



    const reason =

        String(
            orderDetailDOM.cancelReason.value || ""
        ).trim();



    if (!reason) {

        if (
            orderDetailDOM.cancelReasonError
        ) {

            orderDetailDOM.cancelReasonError.textContent =
                "Vui lòng nhập lý do hủy đơn.";

        }



        orderDetailDOM.cancelReason.classList.add(
            "border-red-400",
            "ring-2",
            "ring-red-100"
        );



        orderDetailDOM.cancelReason.focus();



        return null;

    }



    if (
        reason.length < 3
    ) {

        if (
            orderDetailDOM.cancelReasonError
        ) {

            orderDetailDOM.cancelReasonError.textContent =
                "Lý do hủy phải có ít nhất 3 ký tự.";

        }



        orderDetailDOM.cancelReason.classList.add(
            "border-red-400",
            "ring-2",
            "ring-red-100"
        );



        orderDetailDOM.cancelReason.focus();



        return null;

    }



    clearCancelReasonError();



    return reason;

}



// ========================================================
// 24. CANCEL REASON COUNTER
// ========================================================


function updateCancelReasonCounter() {

    if (
        !orderDetailDOM.cancelReason ||
        !orderDetailDOM.cancelReasonCount
    ) {

        return;

    }



    const length =
        orderDetailDOM.cancelReason.value.length;



    orderDetailDOM.cancelReasonCount.textContent =

        `${length}/500`;

}



// ========================================================
// 25. UPDATE STATUS
// ========================================================


async function updateOrderStatus() {

    if (

        !orderDetailState.order ||

        orderDetailState.updatingStatus ||

        orderDetailState.cancellingOrder

    ) {

        return;

    }



    const oldStatus =

        String(
            orderDetailState.order.status || ""
        )

            .trim()

            .toLowerCase();



    const newStatus =

        String(
            orderDetailDOM.orderStatusSelect.value || ""
        )

            .trim()

            .toLowerCase();



    if (
        oldStatus === newStatus
    ) {

        return;

    }



    if (

        !canTransitionOrderStatus(
            oldStatus,
            newStatus
        )

    ) {

        alert(
            "Không thể chuyển sang trạng thái này."
        );


        renderStatusSelect();


        return;

    }



    // ====================================================
    // CANCEL
    // ====================================================


    if (
        newStatus === "cancelled"
    ) {

        openCancelOrderModal();

        return;

    }



    // ====================================================
    // NORMAL STATUS UPDATE
    // ====================================================


    const oldMeta =
        getOrderDetailStatusMeta(
            oldStatus
        );


    const newMeta =
        getOrderDetailStatusMeta(
            newStatus
        );


    const orderCode =

        orderDetailState.order.order_code ||

        `#${orderDetailState.orderId}`;



    const confirmed =
        window.confirm(

            `Cập nhật trạng thái đơn hàng ${orderCode}?\n\n` +

            `${oldMeta.label} → ${newMeta.label}`

        );



    if (!confirmed) {

        renderStatusSelect();

        return;

    }



    orderDetailState.updatingStatus =
        true;



    renderStatusSelect();



    try {


        const {

            data,

            error

        } =

            await window.supabaseClient

                .from("orders")

                .update({

                    status: newStatus

                })

                .eq(
                    "id",
                    orderDetailState.orderId
                )

                .select(`
                    id,
                    order_code,
                    status,
                    subtotal,
                    shipping_fee,
                    total,
                    shipping_name,
                    shipping_phone,
                    shipping_address,
                    note,
                    cancellation_reason,
                    created_at
                `)

                .single();



        if (error) {

            throw error;

        }



        if (!data) {

            throw new Error(
                "Không nhận được dữ liệu đơn hàng sau khi cập nhật."
            );

        }



        orderDetailState.order =
            data;



        orderDetailState.updatingStatus =
            false;



        renderOrderDetail();



        alert(
            "Đã cập nhật trạng thái đơn hàng."
        );


    } catch (error) {


        console.error(
            "Lỗi cập nhật trạng thái:",
            error
        );


        orderDetailState.updatingStatus =
            false;



        renderOrderDetail();



        alert(

            "Không thể cập nhật trạng thái:\n" +

            (
                error.message ||
                "Lỗi không xác định."
            )

        );

    }

}



// ========================================================
// 26. CONFIRM CANCEL ORDER
// ========================================================


async function confirmCancelOrder() {

    if (

        !orderDetailState.order ||

        orderDetailState.cancellingOrder ||

        orderDetailState.updatingStatus

    ) {

        return;

    }



    const reason =
        validateCancelReason();



    if (!reason) {

        return;

    }



    const orderCode =

        orderDetailState.order.order_code ||

        `#${orderDetailState.orderId}`;



    orderDetailState.cancellingOrder =
        true;



    if (
        orderDetailDOM.confirmCancelButton
    ) {

        orderDetailDOM.confirmCancelButton.disabled =
            true;


        orderDetailDOM.confirmCancelButton.textContent =
            "Đang hủy đơn...";

    }



    try {


        const {

            data,

            error

        } =

            await window.supabaseClient

                .from("orders")

                .update({

                    status: "cancelled",

                    cancellation_reason: reason

                })

                .eq(
                    "id",
                    orderDetailState.orderId
                )

                .select(`
                    id,
                    order_code,
                    status,
                    subtotal,
                    shipping_fee,
                    total,
                    shipping_name,
                    shipping_phone,
                    shipping_address,
                    note,
                    cancellation_reason,
                    created_at
                `)

                .single();



        if (error) {

            throw error;

        }



        if (!data) {

            throw new Error(
                "Không nhận được dữ liệu đơn hàng sau khi hủy."
            );

        }



        orderDetailState.order =
            data;



        orderDetailState.cancellingOrder =
            false;



        closeCancelOrderModal();



        renderOrderDetail();



        alert(
            `Đã hủy đơn hàng ${orderCode}.`
        );


    } catch (error) {


        console.error(
            "Lỗi hủy đơn hàng:",
            error
        );


        orderDetailState.cancellingOrder =
            false;



        if (
            orderDetailDOM.confirmCancelButton
        ) {

            orderDetailDOM.confirmCancelButton.disabled =
                false;


            orderDetailDOM.confirmCancelButton.textContent =
                "Xác nhận hủy đơn";

        }



        alert(

            "Không thể hủy đơn hàng:\n" +

            (
                error.message ||
                "Lỗi không xác định."
            )

        );

    }

}



// ========================================================
// 27. SHOW ERROR
// ========================================================


function showOrderDetailError(
    message
) {


    if (
        orderDetailDOM.loading
    ) {

        orderDetailDOM.loading.classList.add(
            "hidden"
        );

    }



    if (
        orderDetailDOM.content
    ) {

        orderDetailDOM.content.classList.add(
            "hidden"
        );

    }



    if (
        orderDetailDOM.error
    ) {

        orderDetailDOM.error.classList.remove(
            "hidden"
        );

    }



    if (
        orderDetailDOM.errorText
    ) {

        orderDetailDOM.errorText.textContent =
            message;

    }

}



// ========================================================
// 28. SHOW CONTENT
// ========================================================


function showOrderDetailContent() {


    if (
        orderDetailDOM.loading
    ) {

        orderDetailDOM.loading.classList.add(
            "hidden"
        );

    }



    if (
        orderDetailDOM.error
    ) {

        orderDetailDOM.error.classList.add(
            "hidden"
        );

    }



    if (
        orderDetailDOM.content
    ) {

        orderDetailDOM.content.classList.remove(
            "hidden"
        );

    }

}



// ========================================================
// 29. EVENTS
// ========================================================


function bindOrderDetailEvents() {


    // UPDATE STATUS


    if (
        orderDetailDOM.updateStatusButton
    ) {

        orderDetailDOM.updateStatusButton.addEventListener(

            "click",

            updateOrderStatus

        );

    }



    // STATUS SELECT


    if (
        orderDetailDOM.orderStatusSelect
    ) {

        orderDetailDOM.orderStatusSelect.addEventListener(

            "change",

            () => {

                updateStatusButtonLabel();

            }

        );

    }



    // CLOSE MODAL


    if (
        orderDetailDOM.closeCancelModal
    ) {

        orderDetailDOM.closeCancelModal.addEventListener(

            "click",

            closeCancelOrderModal

        );

    }



    if (
        orderDetailDOM.cancelModalButton
    ) {

        orderDetailDOM.cancelModalButton.addEventListener(

            "click",

            closeCancelOrderModal

        );

    }



    if (
        orderDetailDOM.cancelOverlay
    ) {

        orderDetailDOM.cancelOverlay.addEventListener(

            "click",

            closeCancelOrderModal

        );

    }



    // CONFIRM CANCEL


    if (
        orderDetailDOM.confirmCancelButton
    ) {

        orderDetailDOM.confirmCancelButton.addEventListener(

            "click",

            confirmCancelOrder

        );

    }



    // REASON INPUT


    if (
        orderDetailDOM.cancelReason
    ) {

        orderDetailDOM.cancelReason.addEventListener(

            "input",

            () => {

                updateCancelReasonCounter();

                clearCancelReasonError();

            }

        );


        orderDetailDOM.cancelReason.addEventListener(

            "keydown",

            event => {

                if (
                    event.key === "Enter" &&
                    event.ctrlKey
                ) {

                    event.preventDefault();

                    confirmCancelOrder();

                }

            }

        );

    }



    // ESC


    document.addEventListener(

        "keydown",

        event => {

            if (
                event.key === "Escape" &&

                orderDetailDOM.cancelModal &&

                !orderDetailDOM.cancelModal.classList.contains(
                    "hidden"
                )

            ) {

                closeCancelOrderModal();

            }

        }

    );

}



// ========================================================
// 30. INIT
// ========================================================


document.addEventListener(

    "DOMContentLoaded",

    async () => {


        cacheOrderDetailDOM();



        orderDetailState.orderId =
            getOrderIdFromURL();



        if (
            !orderDetailState.orderId
        ) {

            showOrderDetailError(

                "URL không có mã đơn hàng hợp lệ. Hãy mở trang từ danh sách đơn hàng."

            );

            return;

        }



        bindOrderDetailEvents();



        try {


            await loadOrderDetail();


            await loadOrderItems();


            await loadCustomerProfile();



            renderOrderDetail();



            showOrderDetailContent();


        } catch (error) {


            console.error(

                "Lỗi khởi tạo chi tiết đơn hàng:",

                error

            );



            showOrderDetailError(

                error.message ||

                "Có lỗi xảy ra khi tải đơn hàng."

            );

        }

    }

);