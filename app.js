// =====================================================
// QUẢN LÝ RỬA XE - APP OFFLINE
// =====================================================

const STORAGE_KEY = "quanLyRuaXeOrders";
const MAX_HISTORY_DAYS = 60;

// =====================================================
// QUY TẮC THANH TOÁN NHÂN VIÊN
// =====================================================

const EMPLOYEE_WASH_START_CAR = 9;
const EMPLOYEE_WASH_PAYMENT = 10000;
const EMPLOYEE_OIL_PAYMENT = 10000;

// =====================================================
// DỮ LIỆU
// =====================================================

let orders = [];
let selectedServices = [];
let currentPayment = "cash";

// =====================================================
// DỊCH VỤ
// =====================================================

const SERVICES = {
    "Rửa xe máy": 30000,
    "Rửa xe máy điện": 25000,

    "Thay nhớt xe số Xám": 120000,
    "Thay nhớt xe ga Xám": 130000,
    "Thay nhớt xe số vàng": 140000,
    "Thay nhớt xe ga vàng": 150000,

    "Tuýp số": 50000
};

// =====================================================
// ĐỌC DỮ LIỆU
// =====================================================

function loadOrders() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            orders = [];
            return;
        }

        const data =
            JSON.parse(saved);

        if (Array.isArray(data)) {

            orders = data;

            migrateVehicleNumbers();

        } else {

            orders = [];

        }

    } catch (error) {

        console.error(
            "Không đọc được dữ liệu:",
            error
        );

        orders = [];
    }
}

// =====================================================
// BỔ SUNG STT CHO DỮ LIỆU CŨ
// =====================================================

function migrateVehicleNumbers() {

    const groups = {};

    orders.forEach(order => {

        if (!order.date) {
            return;
        }

        if (!groups[order.date]) {
            groups[order.date] = [];
        }

        groups[order.date].push(order);
    });

    let changed = false;

    Object.keys(groups).forEach(date => {

        const dayOrders =
            groups[date];

        dayOrders.sort((a, b) => {

            const timeA =
                new Date(
                    a.createdAt ||
                    `${a.date}T00:00:00`
                ).getTime();

            const timeB =
                new Date(
                    b.createdAt ||
                    `${b.date}T00:00:00`
                ).getTime();

            return timeA - timeB;
        });

        let nextNumber = 1;

        dayOrders.forEach(order => {

            const oldNumber =
                Number(order.vehicleNumber);

            if (
                !Number.isInteger(oldNumber) ||
                oldNumber <= 0
            ) {

                order.vehicleNumber =
                    nextNumber;

                changed = true;

            }

            nextNumber =
                Math.max(
                    nextNumber,
                    Number(order.vehicleNumber) + 1
                );
        });
    });

    if (changed) {
        saveOrders();
    }
}

// =====================================================
// LƯU DỮ LIỆU
// =====================================================

function saveOrders() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(orders)
        );

        return true;

    } catch (error) {

        console.error(
            "Không lưu được dữ liệu:",
            error
        );

        alert(
            "Không thể lưu dữ liệu trên máy."
        );

        return false;
    }
}

// =====================================================
// NGÀY
// =====================================================

function getDateKey(date = new Date()) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// =====================================================
// ĐỊNH DẠNG NGÀY
// =====================================================

function formatDate(dateKey) {

    if (!dateKey) {
        return "";
    }

    const parts =
        dateKey.split("-");

    if (parts.length !== 3) {
        return dateKey;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// =====================================================
// ĐỊNH DẠNG TIỀN
// =====================================================

function formatMoney(value) {

    return Number(value || 0)
        .toLocaleString("vi-VN") + "₫";
}

// =====================================================
// NGÀY HIỆN TẠI
// =====================================================

function showCurrentDate() {

    const element =
        document.getElementById(
            "currentDate"
        );

    if (!element) {
        return;
    }

    element.textContent =
        new Date().toLocaleDateString(
            "vi-VN",
            {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );
}

// =====================================================
// CHỌN DỊCH VỤ
// =====================================================

function selectService(button) {

    if (!button) {
        return;
    }

    const name =
        button.dataset.name;

    const price =
        Number(button.dataset.price);

    if (!name || !price) {
        return;
    }

    const existingIndex =
        selectedServices.findIndex(
            service =>
                service.name === name
        );

    if (existingIndex === -1) {

        selectedServices.push({
            name: name,
            price: price
        });

        button.classList.add("selected");

    } else {

        selectedServices.splice(
            existingIndex,
            1
        );

        button.classList.remove("selected");
    }

    renderSelectedServices();
}

// =====================================================
// HIỂN THỊ DỊCH VỤ ĐÃ CHỌN
// =====================================================

function renderSelectedServices() {

    const box =
        document.getElementById(
            "selectedServices"
        );

    const totalBox =
        document.getElementById(
            "orderTotal"
        );

    if (!box || !totalBox) {
        return;
    }

    if (
        selectedServices.length === 0
    ) {

        box.innerHTML =
            "Chưa chọn dịch vụ";

        totalBox.textContent =
            "0₫";

        return;
    }

    let total = 0;

    box.innerHTML =
        selectedServices
            .map(
                (service, index) => {

                    total +=
                        Number(service.price);

                    return `
                        <div class="selected-service">

                            <span>
                                ${escapeHTML(service.name)}
                                -
                                ${formatMoney(service.price)}
                            </span>

                            <button
                                type="button"
                                class="remove-service"
                                data-index="${index}"
                            >
                                X
                            </button>

                        </div>
                    `;
                }
            )
            .join("");

    totalBox.textContent =
        formatMoney(total);

    document
        .querySelectorAll(
            ".remove-service"
        )
        .forEach(button => {

            button.onclick =
                function(event) {

                    event.preventDefault();
                    event.stopPropagation();

                    removeSelectedService(
                        Number(
                            this.dataset.index
                        )
                    );
                };
        });
}

// =====================================================
// BỎ DỊCH VỤ
// =====================================================

function removeSelectedService(index) {

    if (
        index < 0 ||
        index >= selectedServices.length
    ) {
        return;
    }

    const removed =
        selectedServices[index];

    selectedServices.splice(
        index,
        1
    );

    document
        .querySelectorAll(
            ".service-button"
        )
        .forEach(button => {

            if (
                button.dataset.name ===
                removed.name
            ) {

                button.classList.remove(
                    "selected"
                );
            }
        });

    renderSelectedServices();
}

// =====================================================
// THANH TOÁN
// =====================================================

function setPayment(type) {

    if (
        type !== "cash" &&
        type !== "transfer"
    ) {
        return;
    }

    currentPayment =
        type;

    const cash =
        document.getElementById(
            "cashButton"
        );

    const transfer =
        document.getElementById(
            "transferButton"
        );

    cash?.classList.remove("active");
    transfer?.classList.remove("active");

    if (type === "cash") {

        cash?.classList.add("active");

    } else {

        transfer?.classList.add("active");
    }
}

// =====================================================
// TẠO ID
// =====================================================

function createOrderId() {

    return (
        Date.now().toString() +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}

// =====================================================
// LẤY STT XE TIẾP THEO
// =====================================================

function getNextVehicleNumber(dateKey) {

    const dayOrders =
        orders.filter(
            order =>
                order.date === dateKey
        );

    if (dayOrders.length === 0) {
        return 1;
    }

    const numbers =
        dayOrders
            .map(order =>
                Number(
                    order.vehicleNumber || 0
                )
            )
            .filter(
                number =>
                    Number.isFinite(number) &&
                    number > 0
            );

    if (numbers.length === 0) {
        return dayOrders.length + 1;
    }

    return Math.max(...numbers) + 1;
}

// =====================================================
// KIỂM TRA RỬA XE
// =====================================================

function hasWashService(order) {

    if (
        !Array.isArray(order.services)
    ) {
        return false;
    }

    return order.services.some(
        service =>
            service.name === "Rửa xe máy" ||
            service.name === "Rửa xe máy điện"
    );
}

// =====================================================
// KIỂM TRA THAY NHỚT
// =====================================================

function hasOilService(order) {

    if (
        !Array.isArray(order.services)
    ) {
        return false;
    }

    return order.services.some(
        service =>
            service.name ===
                "Thay nhớt xe số Xám" ||
            service.name ===
                "Thay nhớt xe ga Xám" ||
            service.name ===
                "Thay nhớt xe số vàng" ||
            service.name ===
                "Thay nhớt xe ga vàng"
    );
}

// =====================================================
// TÍNH TIỀN NHÂN VIÊN
// =====================================================

function getEmployeePayment(order) {

    const vehicleNumber =
        Number(
            order.vehicleNumber || 0
        );

    let payment = 0;

    // ---------------------------------------------
    // RỬA XE
    // Xe #9 trở đi = 10.000đ
    // Xe máy điện cũng tính chung
    // ---------------------------------------------

    if (
        hasWashService(order) &&
        vehicleNumber >=
            EMPLOYEE_WASH_START_CAR
    ) {

        payment +=
            EMPLOYEE_WASH_PAYMENT;
    }

    // ---------------------------------------------
    // THAY NHỚT
    // Mỗi đơn thay nhớt = 10.000đ
    // ---------------------------------------------

    if (
        hasOilService(order)
    ) {

        payment +=
            EMPLOYEE_OIL_PAYMENT;
    }

    // ---------------------------------------------
    // TUÝP SỐ
    // Không tính
    // ---------------------------------------------

    return payment;
}

// =====================================================
// TỔNG TIỀN ĐƠN
// =====================================================

function getOrderTotal(order) {

    return Number(
        order.total ||
        order.price ||
        0
    );
}

// =====================================================
// DOANH THU SAU KHI TRẢ NHÂN VIÊN
// =====================================================

function getNetRevenue(order) {

    const total =
        getOrderTotal(order);

    const employee =
        getEmployeePayment(order);

    return Math.max(
        0,
        total - employee
    );
}

// =====================================================
// TẠO ĐƠN
// =====================================================

function addOrder() {

    const plateInput =
        document.getElementById(
            "plate"
        );

    if (!plateInput) {
        return;
    }

    const plate =
        plateInput.value
            .trim()
            .toUpperCase();

    if (!plate) {

        alert(
            "Vui lòng nhập biển số xe."
        );

        plateInput.focus();

        return;
    }

    if (
        selectedServices.length === 0
    ) {

        alert(
            "Vui lòng chọn ít nhất một dịch vụ."
        );

        return;
    }

    const now =
        new Date();

    const dateKey =
        getDateKey(now);

    const vehicleNumber =
        getNextVehicleNumber(
            dateKey
        );

    const services =
        selectedServices.map(
            service => ({
                name:
                    service.name,

                price:
                    Number(
                        service.price
                    )
            })
        );

    const total =
        services.reduce(
            (sum, service) =>
                sum +
                Number(service.price),
            0
        );

    const order = {

        id:
            createOrderId(),

        vehicleNumber:
            vehicleNumber,

        plate:
            plate,

        services:
            services,

        total:
            total,

        payment:
            currentPayment,

        date:
            dateKey,

        time:
            now.toLocaleTimeString(
                "vi-VN",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ),

        createdAt:
            now.toISOString()
    };

    orders.push(order);

    if (!saveOrders()) {
        return;
    }

    // Xóa form

    plateInput.value = "";

    selectedServices = [];

    document
        .querySelectorAll(
            ".service-button"
        )
        .forEach(button => {

            button.classList.remove(
                "selected"
            );
        });

    setPayment("cash");

    renderSelectedServices();

    showOrders();

    showHistory();
}

// =====================================================
// ĐỔI THANH TOÁN
// =====================================================

function changePayment(id) {

    const order =
        orders.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!order) {
        return;
    }

    order.payment =
        order.payment === "cash"
            ? "transfer"
            : "cash";

    saveOrders();

    showOrders();

    showHistory();
}

// =====================================================
// XÓA ĐƠN
// =====================================================

function deleteOrder(id) {

    const index =
        orders.findIndex(
            item =>
                String(item.id) ===
                String(id)
        );

    if (index === -1) {
        return;
    }

    const order =
        orders[index];

    const ok =
        confirm(
            `Xóa đơn ${order.plate} - ${formatMoney(getOrderTotal(order))}?`
        );

    if (!ok) {
        return;
    }

    orders.splice(
        index,
        1
    );

    saveOrders();

    showOrders();

    showHistory();
}

// =====================================================
// ĐƠN HÔM NAY
// =====================================================

function getTodayOrders() {

    const today =
        getDateKey();

    return orders.filter(
        order =>
            order.date === today
    );
}

// =====================================================
// LỊCH SỬ 60 NGÀY
// =====================================================

function getRecentOrders() {

    const today =
        new Date();

    const limit =
        new Date(today);

    limit.setHours(
        0,
        0,
        0,
        0
    );

    limit.setDate(
        limit.getDate() -
        (MAX_HISTORY_DAYS - 1)
    );

    const limitKey =
        getDateKey(limit);

    return orders.filter(
        order =>
            order.date >= limitKey
    );
}

// =====================================================
// THỐNG KÊ CHÍNH
// =====================================================

function updateSummary() {

    const todayOrders =
        getTodayOrders();

    let grossRevenue = 0;
    let employeePayment = 0;
    let netRevenue = 0;

    let cash = 0;
    let transfer = 0;

    todayOrders.forEach(order => {

        const total =
            getOrderTotal(order);

        const employee =
            getEmployeePayment(order);

        const net =
            getNetRevenue(order);

        grossRevenue +=
            total;

        employeePayment +=
            employee;

        netRevenue +=
            net;

        // -----------------------------------------
        // TIỀN MẶT / CHUYỂN KHOẢN
        // Đây là tiền khách thực trả
        // -----------------------------------------

        if (
            order.payment === "cash"
        ) {

            cash += total;
        }

        if (
            order.payment === "transfer"
        ) {

            transfer += total;
        }
    });

    // ---------------------------------------------
    // SỐ XE
    // ---------------------------------------------

    const totalCars =
        document.getElementById(
            "totalCars"
        );

    if (totalCars) {

        totalCars.textContent =
            todayOrders.length;
    }

    // ---------------------------------------------
    // DOANH THU SAU KHI TRỪ NHÂN VIÊN
    // ---------------------------------------------

    const totalRevenue =
        document.getElementById(
            "totalRevenue"
        );

    if (totalRevenue) {

        totalRevenue.textContent =
            formatMoney(
                netRevenue
            );
    }

    // ---------------------------------------------
    // TIỀN MẶT
    // ---------------------------------------------

    const totalCash =
        document.getElementById(
            "totalCash"
        );

    if (totalCash) {

        totalCash.textContent =
            formatMoney(
                cash
            );
    }

    // ---------------------------------------------
    // CHUYỂN KHOẢN
    // ---------------------------------------------

    const totalTransfer =
        document.getElementById(
            "totalTransfer"
        );

    if (totalTransfer) {

        totalTransfer.textContent =
            formatMoney(
                transfer
            );
    }

    // ---------------------------------------------
    // THANH TOÁN NHÂN VIÊN
    // ---------------------------------------------

    const totalEmployeePayment =
        document.getElementById(
            "totalEmployeePayment"
        );

    if (totalEmployeePayment) {

        totalEmployeePayment.textContent =
            formatMoney(
                employeePayment
            );
    }
}

// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =====================================================
// DỊCH VỤ TRONG ĐƠN
// =====================================================

function servicesHTML(order) {

    if (
        Array.isArray(
            order.services
        )
    ) {

        return order.services
            .map(
                service => `
                    <div>
                        • ${escapeHTML(
                            service.name
                        )}
                        -
                        ${formatMoney(
                            service.price
                        )}
                    </div>
                `
            )
            .join("");
    }

    // Hỗ trợ dữ liệu cũ

    if (order.service) {

        return `
            <div>
                • ${escapeHTML(
                    order.service
                )}
                -
                ${formatMoney(
                    order.price
                )}
            </div>
        `;
    }

    return "";
}

// =====================================================
// HTML ĐƠN
// =====================================================

function createOrderHTML(order) {

    const paymentText =
        order.payment === "cash"
            ? "💵 Tiền mặt"
            : "🏦 Chuyển khoản";

    const changeText =
        order.payment === "cash"
            ? "🔄 Đổi sang CK"
            : "🔄 Đổi sang tiền mặt";

    const total =
        getOrderTotal(order);

    const employee =
        getEmployeePayment(order);

    const net =
        getNetRevenue(order);

    return `

        <div class="order">

            <div class="order-top">

                <div class="order-plate">

                    <span>
                        🚗 Xe #${Number(
                            order.vehicleNumber || 0
                        )}
                    </span>

                    <br>

                    <strong>
                        ${escapeHTML(
                            order.plate
                        )}
                    </strong>

                </div>

                <div class="order-price">
                    ${formatMoney(total)}
                </div>

            </div>

            <div class="order-service">
                ${servicesHTML(order)}
            </div>

            <div class="order-payment">
                ${paymentText}
            </div>

            <div class="order-employee">

                👨‍🔧 Thanh toán NV:
                <strong>
                    ${formatMoney(employee)}
                </strong>

            </div>

            <div class="order-revenue">

                💰 Doanh thu thực nhận:
                <strong>
                    ${formatMoney(net)}
                </strong>

            </div>

            <div class="order-time">

                🕐 ${escapeHTML(
                    order.time
                )}

            </div>

            <div class="order-buttons">

                <button
                    type="button"
                    class="change-payment"
                    data-id="${order.id}"
                >
                    ${changeText}
                </button>

                <button
                    type="button"
                    class="delete-order"
                    data-id="${order.id}"
                >
                    🗑 Xóa
                </button>

            </div>

        </div>
    `;
}

// =====================================================
// HIỂN THỊ ĐƠN HÔM NAY
// =====================================================

function showOrders() {

    const box =
        document.getElementById(
            "orders"
        );

    if (!box) {
        return;
    }

    updateSummary();

    const todayOrders =
        getTodayOrders();

    if (
        todayOrders.length === 0
    ) {

        box.innerHTML = `
            <div class="empty">
                Chưa có đơn hôm nay
            </div>
        `;

        return;
    }

    const sorted =
        [...todayOrders]
            .sort(
                (a, b) =>
                    Number(
                        b.vehicleNumber || 0
                    ) -
                    Number(
                        a.vehicleNumber || 0
                    )
            );

    box.innerHTML =
        sorted
            .map(
                order =>
                    createOrderHTML(
                        order
                    )
            )
            .join("");

    attachOrderButtons();
}

// =====================================================
// GẮN NÚT ĐƠN
// =====================================================

function attachOrderButtons() {

    document
        .querySelectorAll(
            "#orders .change-payment"
        )
        .forEach(button => {

            button.onclick =
                function() {

                    changePayment(
                        this.dataset.id
                    );
                };
        });

    document
        .querySelectorAll(
            "#orders .delete-order"
        )
        .forEach(button => {

            button.onclick =
                function() {

                    deleteOrder(
                        this.dataset.id
                    );
                };
        });
}

// =====================================================
// HTML LỊCH SỬ ĐƠN
// =====================================================

function createHistoryOrderHTML(order) {

    const paymentText =
        order.payment === "cash"
            ? "💵 Tiền mặt"
            : "🏦 Chuyển khoản";

    const total =
        getOrderTotal(order);

    const employee =
        getEmployeePayment(order);

    const net =
        getNetRevenue(order);

    return `

        <div class="history-order">

            <div class="history-order-top">

                <strong>

                    Xe #${Number(
                        order.vehicleNumber || 0
                    )}

                    -
                    ${escapeHTML(
                        order.time
                    )}

                    -
                    ${escapeHTML(
                        order.plate
                    )}

                </strong>

                <b>
                    ${formatMoney(total)}
                </b>

            </div>

            <div class="order-service">
                ${servicesHTML(order)}
            </div>

            <div class="order-payment">
                ${paymentText}
            </div>

            <div class="order-employee">

                👨‍🔧 Thanh toán NV:
                <strong>
                    ${formatMoney(employee)}
                </strong>

            </div>

            <div class="order-revenue">

                💰 Doanh thu thực nhận:
                <strong>
                    ${formatMoney(net)}
                </strong>

            </div>

            <div class="order-buttons">

                <button
                    type="button"
                    class="change-payment"
                    data-id="${order.id}"
                >
                    🔄 Đổi thanh toán
                </button>

                <button
                    type="button"
                    class="delete-order"
                    data-id="${order.id}"
                >
                    🗑 Xóa
                </button>

            </div>

        </div>
    `;
}

// =====================================================
// HIỂN THỊ LỊCH SỬ
// =====================================================

function showHistory() {

    const box =
        document.getElementById(
            "history"
        );

    if (!box) {
        return;
    }

    let recentOrders =
        getRecentOrders();

    if (
        recentOrders.length === 0
    ) {

        box.innerHTML = `
            <div class="empty">
                Chưa có lịch sử
            </div>
        `;

        return;
    }

    recentOrders.sort((a, b) => {

        if (
            a.date !== b.date
        ) {

            return b.date.localeCompare(
                a.date
            );
        }

        return Number(
            b.vehicleNumber || 0
        ) -
        Number(
            a.vehicleNumber || 0
        );
    });

    const groups = {};

    recentOrders.forEach(order => {

        if (!groups[order.date]) {

            groups[order.date] = [];
        }

        groups[order.date].push(
            order
        );
    });

    box.innerHTML = "";

    Object.keys(groups)
        .sort()
        .reverse()
        .forEach(date => {

            const dayOrders =
                groups[date];

            let grossRevenue = 0;
            let employeePayment = 0;

            dayOrders.forEach(
                order => {

                    grossRevenue +=
                        getOrderTotal(
                            order
                        );

                    employeePayment +=
                        getEmployeePayment(
                            order
                        );
                }
            );

            const netRevenue =
                Math.max(
                    0,
                    grossRevenue -
                    employeePayment
                );

            const day =
                document.createElement(
                    "div"
                );

            day.className =
                "history-day";

            day.innerHTML = `

                <div
                    class="history-day-header"
                >

                    <div>

                        <strong>
                            📅 ${formatDate(date)}
                        </strong>

                        <br>

                        <span>

                            ${dayOrders.length}
                            xe

                            • Doanh thu:
                            ${formatMoney(
                                netRevenue
                            )}

                            • NV:
                            ${formatMoney(
                                employeePayment
                            )}

                        </span>

                    </div>

                    <div class="history-arrow">
                        ▼
                    </div>

                </div>

                <div class="history-day-content">

                    ${dayOrders
                        .map(
                            order =>
                                createHistoryOrderHTML(
                                    order
                                )
                        )
                        .join("")}

                </div>
            `;

            box.appendChild(day);
        });

    document
        .querySelectorAll(
            ".history-day-header"
        )
        .forEach(header => {

            header.onclick =
                function() {

                    this.parentElement
                        .classList.toggle(
                            "open"
                        );
                };
        });

    attachHistoryButtons();
}

// =====================================================
// NÚT LỊCH SỬ
// =====================================================

function attachHistoryButtons() {

    document
        .querySelectorAll(
            "#history .change-payment"
        )
        .forEach(button => {

            button.onclick =
                function(event) {

                    event.preventDefault();
                    event.stopPropagation();

                    changePayment(
                        this.dataset.id
                    );
                };
        });

    document
        .querySelectorAll(
            "#history .delete-order"
        )
        .forEach(button => {

            button.onclick =
                function(event) {

                    event.preventDefault();
                    event.stopPropagation();

                    deleteOrder(
                        this.dataset.id
                    );
                };
        });
}

// =====================================================
// GÁN SỰ KIỆN
// =====================================================

function setupEvents() {

    // Dịch vụ

    document
        .querySelectorAll(
            ".service-button"
        )
        .forEach(button => {

            button.onclick =
                function(event) {

                    event.preventDefault();

                    selectService(this);
                };
        });

    // Tiền mặt

    document.getElementById(
        "cashButton"
    )?.addEventListener(
        "click",
        () =>
            setPayment("cash")
    );

    // Chuyển khoản

    document.getElementById(
        "transferButton"
    )?.addEventListener(
        "click",
        () =>
            setPayment("transfer")
    );

    // Thêm đơn

    document.getElementById(
        "addOrderButton"
    )?.addEventListener(
        "click",
        addOrder
    );

    // Xem lịch sử

    document.getElementById(
        "historyButton"
    )?.addEventListener(
        "click",
        showHistory
    );
}

// =====================================================
// KHỞI ĐỘNG
// =====================================================

function initApp() {

    loadOrders();

    showCurrentDate();

    setupEvents();

    setPayment("cash");

    renderSelectedServices();

    showOrders();
}

// =====================================================
// CHẠY APP
// =====================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initApp
    );

} else {

    initApp();
}