/* =========================================================
   QUẢN LÝ RỬA XE MÁY
   BẢN HOÀN CHỈNH
   ========================================================= */

const STORAGE_KEY = "quanLyRuaXeOrders";
const MONTHLY_EXPENSE_KEY = "quanLyRuaXeMonthlyExpenses";
// DỮ LIỆU CHẤM CÔNG
const ATTENDANCE_KEY = "quanLyRuaXeAttendance";

let attendanceData = {};
let selectedAttendanceMonth = "";
const MAX_HISTORY_DAYS = 365;

/* =========================
   CẤU HÌNH NHÂN VIÊN
   ========================= */

const EMPLOYEE_WASH_START_CAR = 9;
const EMPLOYEE_WASH_PAYMENT = 10000;
const EMPLOYEE_OIL_PAYMENT = 10000;

/* =========================
   BIẾN
   ========================= */

let orders = [];
let monthlyExpenses = [];

let selectedServices = [];
let currentPayment = "cash";

let currentReportPeriod = "today";

let selectedReportDate = "";
let selectedReportMonth = "";

/* =========================
   HÀM DOM
   ========================= */

const $ = id => document.getElementById(id);

/* =========================================================
   LƯU / ĐỌC ĐƠN HÀNG
   ========================================================= */

function loadOrders() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);

    orders = s ? JSON.parse(s) : [];

    if (!Array.isArray(orders)) {
      orders = [];
    }

    migrateVehicleNumbers();

  } catch (e) {
    console.error(e);
    orders = [];
  }
}

function saveOrders() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(orders)
    );

    return true;

  } catch (e) {
    console.error(e);
    alert("Không thể lưu dữ liệu trên máy.");
    return false;
  }
}

/* =========================================================
   CHI PHÍ THEO THÁNG
   ========================================================= */

function loadMonthlyExpenses() {
  try {
    const s = localStorage.getItem(
      MONTHLY_EXPENSE_KEY
    );

    monthlyExpenses = s ? JSON.parse(s) : [];

    if (!Array.isArray(monthlyExpenses)) {
      monthlyExpenses = [];
    }

  } catch (e) {
    console.error(e);
    monthlyExpenses = [];
  }
}

function saveMonthlyExpenses() {
  try {
    localStorage.setItem(
      MONTHLY_EXPENSE_KEY,
      JSON.stringify(monthlyExpenses)
    );

    return true;

  } catch (e) {
    console.error(e);
    alert("Không thể lưu dữ liệu chi phí.");
    return false;
  }
}

/* =========================================================
   NGÀY / THÁNG
   ========================================================= */

function getDateKey(d = new Date()) {
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, "0")}-` +
    `${String(d.getDate()).padStart(2, "0")}`
  );
}

function getMonthKey(d = new Date()) {
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, "0")}`
  );
}

function formatDate(k) {
  const p = String(k || "").split("-");

  if (p.length === 3) {
    return `${p[2]}/${p[1]}/${p[0]}`;
  }

  return k || "";
}

function formatMonth(k) {
  if (!k) return "";

  const p = String(k).split("-");

  if (p.length === 2) {
    return `Tháng ${Number(p[1])}/${p[0]}`;
  }

  return k;
}

/* =========================================================
   TIỀN
   ========================================================= */

function formatMoney(v) {
  return (
    Number(v || 0).toLocaleString("vi-VN") +
    "₫"
  );
}

function parseMoney(v) {
  return Number(
    String(v || "")
      .replace(/\D/g, "")
  ) || 0;
}

function escapeHTML(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   NGÀY HIỆN TẠI
   ========================================================= */

function showCurrentDate() {

  if (!$("currentDate")) return;

  $("currentDate").textContent =
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

/* =========================================================
   MIGRATE STT XE
   ========================================================= */

function migrateVehicleNumbers() {

  const groups = {};

  orders.forEach(o => {

    if (!o.date) return;

    (groups[o.date] ??= []).push(o);

  });

  let changed = false;

  Object.values(groups).forEach(list => {

    list.sort(
      (a, b) =>
        new Date(
          a.createdAt ||
          `${a.date}T00:00:00`
        ) -
        new Date(
          b.createdAt ||
          `${b.date}T00:00:00`
        )
    );

    let n = 1;

    list.forEach(o => {

      if (
        !Number.isInteger(
          Number(o.vehicleNumber)
        )
      ) {

        o.vehicleNumber = n;

        changed = true;
      }

      n = Math.max(
        n,
        Number(o.vehicleNumber) + 1
      );

    });

  });

  if (changed) {
    saveOrders();
  }
}

/* =========================================================
   DỊCH VỤ
   ========================================================= */

function selectService(btn) {

  const name = btn?.dataset.name;
  const price = Number(
    btn?.dataset.price
  );

  if (!name || !price) return;

  const i =
    selectedServices.findIndex(
      s => s.name === name
    );

  if (i < 0) {

    selectedServices.push({
      name,
      price
    });

    btn.classList.add("selected");

  } else {

    selectedServices.splice(i, 1);

    btn.classList.remove("selected");
  }

  renderSelectedServices();
}

function renderSelectedServices() {

  const box = $("selectedServices");
  const totalBox = $("orderTotal");

  if (!box || !totalBox) return;

  if (!selectedServices.length) {

    box.textContent =
      "Chưa chọn dịch vụ";

    totalBox.textContent = "0₫";

    return;
  }

  let total = 0;

  box.innerHTML =
    selectedServices
      .map((s, i) => {

        total += Number(s.price);

        return `
          <div class="selected-service">

            <span>
              ${escapeHTML(s.name)}
              <b>${formatMoney(s.price)}</b>
            </span>

            <button
              type="button"
              class="remove-service"
              data-index="${i}">
              ×
            </button>

          </div>
        `;
      })
      .join("");

  totalBox.textContent =
    formatMoney(total);

  box
    .querySelectorAll(".remove-service")
    .forEach(b => {

      b.onclick = e => {

        e.stopPropagation();

        removeSelectedService(
          Number(b.dataset.index)
        );

      };

    });
}

function removeSelectedService(i) {

  if (
    i < 0 ||
    i >= selectedServices.length
  ) {
    return;
  }

  const removed =
    selectedServices[i];

  selectedServices.splice(i, 1);

  document
    .querySelectorAll(".service-button")
    .forEach(b => {

      if (
        b.dataset.name ===
        removed.name
      ) {
        b.classList.remove(
          "selected"
        );
      }

    });

  renderSelectedServices();
}

/* =========================================================
   THANH TOÁN
   ========================================================= */

function setPayment(type) {

  if (
    !["cash", "transfer"]
      .includes(type)
  ) {
    return;
  }

  currentPayment = type;

  $("cashButton")
    ?.classList.toggle(
      "active",
      type === "cash"
    );

  $("transferButton")
    ?.classList.toggle(
      "active",
      type === "transfer"
    );
}

/* =========================================================
   STT XE
   ========================================================= */

function getNextVehicleNumber(date) {

  const nums =
    orders
      .filter(o => o.date === date)
      .map(
        o =>
          Number(
            o.vehicleNumber || 0
          )
      )
      .filter(
        n =>
          Number.isFinite(n) &&
          n > 0
      );

  return nums.length
    ? Math.max(...nums) + 1
    : 1;
}

/* =========================================================
   PHÂN LOẠI DỊCH VỤ
   ========================================================= */

function hasWashService(o) {

  return (
    Array.isArray(o.services) &&
    o.services.some(
      s =>
        s.name === "Rửa xe máy" ||
        s.name ===
          "Rửa xe máy điện"
    )
  );
}

function hasOilService(o) {

  return (
    Array.isArray(o.services) &&
    o.services.some(
      s =>
        s.name.startsWith(
          "Thay nhớt"
        ) ||
        s.name ===
          "Nhớt xe số vàng 1L"
    )
  );
}

/* =========================================================
   TÍNH TIỀN NHÂN VIÊN
   ========================================================= */

function getEmployeePayment(o) {

  let payment = 0;

  const n =
    Number(
      o.vehicleNumber || 0
    );

  /*
     Rửa xe:
     Xe số 9 trở đi +10.000
  */

  if (
    hasWashService(o) &&
    n >= EMPLOYEE_WASH_START_CAR
  ) {

    payment +=
      EMPLOYEE_WASH_PAYMENT;
  }

  /*
     Có dịch vụ nhớt:
     +10.000
  */

  if (hasOilService(o)) {

    payment +=
      EMPLOYEE_OIL_PAYMENT;
  }

  /*
     Tuýp số không nằm trong
     hasOilService nên không tính.
  */

  return payment;
}

/* =========================================================
   DOANH THU
   ========================================================= */

function getGross(o) {

  return Number(
    o.total ||
    o.price ||
    0
  );
}

function getNetRevenue(o) {

  return Math.max(
    0,
    getGross(o) -
      getEmployeePayment(o)
  );
}

/* =========================================================
   ĐƠN HÔM NAY
   ========================================================= */

function getTodayOrders() {

  return orders.filter(
    o =>
      o.date ===
      getDateKey()
  );
}

/* =========================================================
   LỊCH SỬ 365 NGÀY
   ========================================================= */

function getRecentOrders() {

  const d = new Date();

  d.setHours(
    0,
    0,
    0,
    0
  );

  d.setDate(
    d.getDate() -
      (MAX_HISTORY_DAYS - 1)
  );

  const start =
    getDateKey(d);

  return orders.filter(
    o =>
      o.date >= start
  );
}

/* =========================================================
   TẠO ID
   ========================================================= */

function createOrderId() {

  return (
    Date.now().toString() +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
}

/* =========================================================
   TẠO ĐƠN
   ========================================================= */

function addOrder() {

  const input = $("plate");

  if (!input) return;

  const plate =
    input.value
      .trim()
      .toUpperCase();

  if (!plate) {

    alert(
      "Vui lòng nhập biển số xe."
    );

    return;
  }

  if (!selectedServices.length) {

    alert(
      "Vui lòng chọn ít nhất một dịch vụ."
    );

    return;
  }

  const now = new Date();

  const date =
    getDateKey(now);

  const services =
    selectedServices.map(s => ({
      name: s.name,
      price: Number(s.price)
    }));

  const total =
    services.reduce(
      (a, s) =>
        a + s.price,
      0
    );

  orders.push({

    id: createOrderId(),

    vehicleNumber:
      getNextVehicleNumber(
        date
      ),

    plate,

    services,

    total,

    payment:
      currentPayment,

    date,

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

  });

  if (!saveOrders()) {
    return;
  }

  input.value = "";

  selectedServices = [];

  document
    .querySelectorAll(
      ".service-button"
    )
    .forEach(b =>
      b.classList.remove(
        "selected"
      )
    );

  setPayment("cash");

  renderSelectedServices();

  showOrders();

  showHistory();

  renderReport();

  updateNextVehicleNumber();
}

/* =========================================================
   ĐỔI THANH TOÁN
   ========================================================= */

function changePayment(id) {

  const o =
    orders.find(
      x =>
        String(x.id) ===
        String(id)
    );

  if (!o) return;

  o.payment =
    o.payment === "cash"
      ? "transfer"
      : "cash";

  saveOrders();

  showOrders();

  showHistory();

  renderReport();
}

/* =========================================================
   XÓA ĐƠN
   ========================================================= */

function deleteOrder(id) {

  const i =
    orders.findIndex(
      x =>
        String(x.id) ===
        String(id)
    );

  if (i < 0) return;

  const o = orders[i];

  if (
    !confirm(
      `Xóa đơn xe #${o.vehicleNumber} - ` +
      `${o.plate} - ` +
      `${formatMoney(o.total)}?`
    )
  ) {
    return;
  }

  orders.splice(i, 1);

  saveOrders();

  showOrders();

  showHistory();

  renderReport();

  updateNextVehicleNumber();
}

/* =========================================================
   TỔNG QUAN
   ========================================================= */

function updateSummary() {

  const today =
    getTodayOrders();

  let revenue = 0;
  let cash = 0;
  let transfer = 0;
  let employee = 0;

  today.forEach(o => {

    const e =
      getEmployeePayment(o);

    const net =
      getNetRevenue(o);

    employee += e;

    revenue += net;

    if (
      o.payment === "cash"
    ) {

      cash += net;

    } else {

      transfer += net;
    }

  });

  if ($("totalCars"))
    $("totalCars")
      .textContent =
      today.length;

  if ($("totalRevenue"))
    $("totalRevenue")
      .textContent =
      formatMoney(revenue);

  if ($("totalCash"))
    $("totalCash")
      .textContent =
      formatMoney(cash);

  if ($("totalTransfer"))
    $("totalTransfer")
      .textContent =
      formatMoney(transfer);

  if ($("totalEmployeePayment"))
    $("totalEmployeePayment")
      .textContent =
      formatMoney(employee);
}

/* =========================================================
   STT TIẾP THEO
   ========================================================= */

function updateNextVehicleNumber() {

  if (!$("nextVehicleNumber"))
    return;

  $("nextVehicleNumber")
    .textContent =
    getNextVehicleNumber(
      getDateKey()
    );
}

/* =========================================================
   HTML DỊCH VỤ TRONG ĐƠN
   ========================================================= */

function servicesHTML(o) {

  return Array.isArray(o.services)
    ? o.services
        .map(
          s =>
            `<div>
              • ${escapeHTML(s.name)}
              <span>
                ${formatMoney(s.price)}
              </span>
            </div>`
        )
        .join("")
    : "";
}

/* =========================================================
   HTML ĐƠN HÀNG
   ========================================================= */

function orderHTML(
  o,
  history = false
) {

  const total =
    getGross(o);

  const emp =
    getEmployeePayment(o);

  const net =
    getNetRevenue(o);

  const pay =
    o.payment === "cash"
      ? "💵 Tiền mặt"
      : "🏦 Chuyển khoản";

  const change =
    o.payment === "cash"
      ? "🔄 Đổi sang CK"
      : "🔄 Đổi sang tiền mặt";

  return `

    <article
      class="${
        history
          ? "history-order"
          : "order"
      }">

      <div
        class="${
          history
            ? "history-order-top"
            : "order-top"
        }">

        <div>

          <strong>
            Xe #${Number(
              o.vehicleNumber || 0
            )}
          </strong>

          <span class="plate">
            ${escapeHTML(o.plate)}
          </span>

        </div>

        <b>
          ${formatMoney(total)}
        </b>

      </div>

      <div class="order-service">
        ${servicesHTML(o)}
      </div>

      <div class="order-meta">

        <span>
          ${pay}
        </span>

        <span>
          🕐 ${escapeHTML(o.time)}
        </span>

      </div>

      <div class="order-finance">

        <span>
          NV
          <b>
            ${formatMoney(emp)}
          </b>
        </span>

        <span>
          Thực nhận
          <b>
            ${formatMoney(net)}
          </b>
        </span>

      </div>

      <div class="order-buttons">

        <button
          type="button"
          class="change-payment"
          data-id="${o.id}">
          ${
            history
              ? "🔄 Đổi thanh toán"
              : change
          }
        </button>

        <button
          type="button"
          class="delete-order"
          data-id="${o.id}">
          🗑 Xóa
        </button>

      </div>

    </article>
  `;
}

/* =========================================================
   GẮN NÚT ĐƠN
   ========================================================= */

function bindOrderButtons(root) {

  document
    .querySelectorAll(
      `${root} .change-payment`
    )
    .forEach(b => {

      b.onclick = () =>
        changePayment(
          b.dataset.id
        );

    });

  document
    .querySelectorAll(
      `${root} .delete-order`
    )
    .forEach(b => {

      b.onclick = () =>
        deleteOrder(
          b.dataset.id
        );

    });
}

/* =========================================================
   HIỂN THỊ ĐƠN HÔM NAY
   ========================================================= */

function showOrders() {

  updateSummary();

  updateNextVehicleNumber();

  const list =
    getTodayOrders()
      .sort(
        (a, b) =>
          String(b.id)
            .localeCompare(
              String(a.id)
            )
      );

  if (!$("orders")) return;

  $("orders").innerHTML =
    list.length
      ? list
          .map(o =>
            orderHTML(o)
          )
          .join("")
      : `
        <div class="empty">
          Chưa có đơn hôm nay
        </div>
      `;

  bindOrderButtons(
    "#orders"
  );
}

/* =========================================================
   LỊCH SỬ
   ========================================================= */

function getHistoryFiltered() {

  const q =
    (
      $("historySearch")
        ?.value || ""
    )
      .trim()
      .toUpperCase();

  return getRecentOrders()
    .filter(
      o =>
        !q ||
        String(o.plate || "")
          .toUpperCase()
          .includes(q)
    );
}

function showHistory() {

  const list =
    getHistoryFiltered();

  let gross = 0;
  let employee = 0;
  let net = 0;

  list.forEach(o => {

    gross +=
      getGross(o);

    employee +=
      getEmployeePayment(o);

    net +=
      getNetRevenue(o);

  });

  if ($("historyCars"))
    $("historyCars")
      .textContent =
      list.length;

  if ($("historyGross"))
    $("historyGross")
      .textContent =
      formatMoney(gross);

  if ($("historyEmployee"))
    $("historyEmployee")
      .textContent =
      formatMoney(employee);

  if ($("historyNet"))
    $("historyNet")
      .textContent =
      formatMoney(net);

  if (!$("history"))
    return;

  if (!list.length) {

    $("history").innerHTML =
      `
        <div class="empty">
          Không tìm thấy dữ liệu phù hợp
        </div>
      `;

    return;
  }

  const groups = {};

  list
    .sort(
      (a, b) =>
        b.date.localeCompare(
          a.date
        ) ||
        String(b.id)
          .localeCompare(
            String(a.id)
          )
    )
    .forEach(
      o =>
        (
          groups[o.date] ??=
            []
        ).push(o)
    );

  $("history").innerHTML =
    Object.keys(groups)
      .sort()
      .reverse()
      .map(date => {

        const ds =
          groups[date];

        const g =
          ds.reduce(
            (a, o) =>
              a + getGross(o),
            0
          );

        const e =
          ds.reduce(
            (a, o) =>
              a +
              getEmployeePayment(
                o
              ),
            0
          );

        return `

          <div class="history-day">

            <button
              class="history-day-header"
              type="button">

              <div>

                <strong>
                  📅 ${formatDate(date)}
                </strong>

                <span>
                  ${ds.length} xe
                </span>

                <small>
                  Thực nhận:
                  ${formatMoney(
                    Math.max(
                      0,
                      g - e
                    )
                  )}
                  • NV:
                  ${formatMoney(e)}
                </small>

              </div>

              <span class="history-arrow">
                ⌄
              </span>

            </button>

            <div class="history-day-content">

              ${ds
                .map(
                  o =>
                    orderHTML(
                      o,
                      true
                    )
                )
                .join("")}

            </div>

          </div>
        `;

      })
      .join("");

  document
    .querySelectorAll(
      ".history-day-header"
    )
    .forEach(h => {

      h.onclick = () =>
        h.parentElement
          .classList.toggle(
            "open"
          );

    });

  bindOrderButtons(
    "#history"
  );
}

/* =========================================================
   CHUYỂN TAB
   ========================================================= */

function switchTab(id) {

  document
    .querySelectorAll(".tab")
    .forEach(t =>
      t.classList.toggle(
        "active",
        t.dataset.tab === id
      )
    );

  document
    .querySelectorAll(
      ".tab-panel"
    )
    .forEach(p =>
      p.classList.toggle(
        "active",
        p.id === id
      )
    );

  if (
    id === "historyTab"
  ) {
    showHistory();
  }

  if (
    id === "reportTab"
  ) {
    renderReport();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================================================
   BÁO CÁO
   ========================================================= */

function getReportOrders(
  period
) {

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  let start =
    new Date(today);

  if (period === "7") {

    start.setDate(
      start.getDate() - 6
    );

  } else if (period === "30") {

    start.setDate(
      start.getDate() - 29
    );

  } else if (
    period === "month"
  ) {

    /*
       Dùng tháng được chọn
       thay vì luôn lấy tháng hiện tại.
    */

    if (
      selectedReportMonth
    ) {

      return orders.filter(
        o =>
          String(o.date || "")
            .slice(0, 7) ===
          selectedReportMonth
      );

    }

    start =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
  }

  const startKey =
    getDateKey(start);

  const endKey =
    getDateKey(today);

  return orders.filter(
    o =>
      o.date >= startKey &&
      o.date <= endKey
  );
}

function getSelectedDateOrders() {

  if (!selectedReportDate)
    return [];

  return orders.filter(
    o =>
      o.date ===
      selectedReportDate
  );
}

function getSelectedMonthOrders() {

  if (!selectedReportMonth)
    return [];

  return orders.filter(
    o =>
      String(o.date || "")
        .slice(0, 7) ===
      selectedReportMonth
  );
}

/* =========================================================
   TÊN KỲ BÁO CÁO
   ========================================================= */

function reportPeriodLabel(
  period
) {

  const t =
    new Date();

  if (
    period === "today"
  ) {

    return (
      `Hôm nay • ` +
      formatDate(
        getDateKey(t)
      )
    );
  }

  if (period === "7") {

    return "7 ngày gần nhất";
  }

  if (period === "30") {

    return "30 ngày gần nhất";
  }

  if (
    period === "month"
  ) {

    return selectedReportMonth
      ? formatMonth(
          selectedReportMonth
        )
      : `Tháng ${
          t.getMonth() + 1
        }/${t.getFullYear()}`;
  }

  if (
    period === "date"
  ) {

    return selectedReportDate
      ? `Ngày ${
          formatDate(
            selectedReportDate
          )
        }`
      : "Chọn ngày";
  }

  return "";
}

/* =========================================================
   LẤY CHI PHÍ THÁNG
   ========================================================= */

function getMonthlyExpense(
  month
) {

  if (!month) {

    return {
      salary: 0,
      tools: 0,
      other: 0,
      total: 0
    };
  }

  const e =
    monthlyExpenses.find(
      x =>
        x.month === month
    );

  if (!e) {

    return {
      salary: 0,
      tools: 0,
      other: 0,
      total: 0
    };
  }

  const salary =
    Number(e.salary || 0);

  const tools =
    Number(e.tools || 0);

  const other =
    Number(e.other || 0);

  return {

    salary,

    tools,

    other,

    total:
      salary +
      tools +
      other

  };
}

/* =========================================================
   TÍNH BÁO CÁO
   ========================================================= */

function calculateReport(
  list,
  month = null
) {

  let gross = 0;
  let employee = 0;
  let net = 0;
  let cash = 0;
  let transfer = 0;

  list.forEach(o => {

    const g =
      getGross(o);

    const e =
      getEmployeePayment(o);

    const n =
      getNetRevenue(o);

    gross += g;

    employee += e;

    net += n;

    if (
      o.payment === "cash"
    ) {

      cash += n;

    } else {

      transfer += n;
    }

  });

  /*
     Chỉ trừ chi phí tháng
     khi đang xem báo cáo tháng.
  */

  const expense =
    month
      ? getMonthlyExpense(
          month
        )
      : {
          salary: 0,
          tools: 0,
          other: 0,
          total: 0
        };

  const profit =
    net -
    expense.total;

  return {

    gross,

    employee,

    net,

    cash,

    transfer,

    salary:
      expense.salary,

    tools:
      expense.tools,

    other:
      expense.other,

    totalExpense:
      expense.total,

    profit

  };
}

/* =========================================================
   NHẬP CHI PHÍ THÁNG
   ========================================================= */

function saveMonthlyExpense() {

  const month =
    $("reportMonth")?.value;

  if (!month) {

    alert(
      "Vui lòng chọn tháng."
    );

    return;
  }

  const salary =
    parseMoney(
      $("expenseSalary")
        ?.value
    );

  const tools =
    parseMoney(
      $("expenseTools")
        ?.value
    );

  const other =
    parseMoney(
      $("expenseOther")
        ?.value
    );

  const data = {

    month,

    salary,

    tools,

    other

  };

  const index =
    monthlyExpenses.findIndex(
      x =>
        x.month === month
    );

  if (index >= 0) {

    monthlyExpenses[index] =
      data;

  } else {

    monthlyExpenses.push(
      data
    );
  }

  if (
    !saveMonthlyExpenses()
  ) {
    return;
  }

  selectedReportMonth =
    month;

  currentReportPeriod =
    "month";

  renderReport();

  alert(
    "Đã lưu chi phí " +
    formatMonth(month)
  );
}

/* =========================================================
   XÓA CHI PHÍ THÁNG
   ========================================================= */

function deleteMonthlyExpense() {

  const month =
    $("reportMonth")?.value;

  if (!month) return;

  const index =
    monthlyExpenses.findIndex(
      x =>
        x.month === month
    );

  if (index < 0) {

    alert(
      "Tháng này chưa có chi phí."
    );

    return;
  }

  if (
    !confirm(
      `Xóa toàn bộ chi phí ${formatMonth(
        month
      )}?`
    )
  ) {
    return;
  }

  monthlyExpenses.splice(
    index,
    1
  );

  saveMonthlyExpenses();

  renderReport();
}

/* =========================================================
   LOAD CHI PHÍ VÀO FORM
   ========================================================= */

function loadMonthlyExpenseInputs(
  month
) {

  const e =
    getMonthlyExpense(
      month
    );

  if ($("expenseSalary")) {

    $("expenseSalary")
      .value =
      e.salary
        ? e.salary.toLocaleString(
            "vi-VN"
          )
        : "";
  }

  if ($("expenseTools")) {

    $("expenseTools")
      .value =
      e.tools
        ? e.tools.toLocaleString(
            "vi-VN"
          )
        : "";
  }

  if ($("expenseOther")) {

    $("expenseOther")
      .value =
      e.other
        ? e.other.toLocaleString(
            "vi-VN"
          )
        : "";
  }
}

/* =========================================================
   RENDER BÁO CÁO
   ========================================================= */

function renderReport() {

  document
    .querySelectorAll(
      ".report-preset"
    )
    .forEach(b =>
      b.classList.toggle(
        "active",
        b.dataset.period ===
          currentReportPeriod
      )
    );

  if (
    $("reportPeriodText")
  ) {

    $("reportPeriodText")
      .textContent =
      reportPeriodLabel(
        currentReportPeriod
      );
  }

  let list = [];

  let expenseMonth =
    null;

  /* =========================
     NGÀY
     ========================= */

  if (
    currentReportPeriod ===
    "date"
  ) {

    list =
      getSelectedDateOrders();

  }

  /* =========================
     THÁNG
     ========================= */

  else if (
    currentReportPeriod ===
    "month"
  ) {

    list =
      getSelectedMonthOrders();

    expenseMonth =
      selectedReportMonth;

  }

  /* =========================
     CÁC KỲ KHÁC
     ========================= */

  else {

    list =
      getReportOrders(
        currentReportPeriod
      );
  }

  const r =
    calculateReport(
      list,
      expenseMonth
    );

  /* =========================
     HIỂN THỊ
     ========================= */

  if ($("reportGross"))
    $("reportGross")
      .textContent =
      formatMoney(
        r.gross
      );

  if ($("reportEmployee"))
    $("reportEmployee")
      .textContent =
      formatMoney(
        r.employee
      );

  if ($("reportNet"))
    $("reportNet")
      .textContent =
      formatMoney(
        r.net
      );

  if ($("reportCars"))
    $("reportCars")
      .textContent =
      list.length;

  if ($("reportCash"))
    $("reportCash")
      .textContent =
      formatMoney(
        r.cash
      );

  if ($("reportTransfer"))
    $("reportTransfer")
      .textContent =
      formatMoney(
        r.transfer
      );

  if ($("reportSalary"))
    $("reportSalary")
      .textContent =
      formatMoney(
        r.salary
      );

  if ($("reportTools"))
    $("reportTools")
      .textContent =
      formatMoney(
        r.tools
      );

  if ($("reportOther"))
    $("reportOther")
      .textContent =
      formatMoney(
        r.other
      );

  if ($("reportExpense"))
    $("reportExpense")
      .textContent =
      formatMoney(
        r.totalExpense
      );

  if ($("reportProfit"))
    $("reportProfit")
      .textContent =
      formatMoney(
        r.profit
      );

  /* =========================
     FORM CHI PHÍ
     ========================= */

  if (
    currentReportPeriod ===
    "month"
  ) {

    if ($("reportMonth")) {

      $("reportMonth")
        .value =
        selectedReportMonth;
    }

    loadMonthlyExpenseInputs(
      selectedReportMonth
    );

  }

  /* =========================
     CHI TIẾT
     ========================= */

  renderDailyReport(list);

  renderServiceReport(list);
}

/* =========================================================
   BÁO CÁO THEO NGÀY
   ========================================================= */

function renderDailyReport(
  list
) {

  if (!$("dailyReport"))
    return;

  const groups = {};

  list.forEach(o => {

    (
      groups[o.date] ??=
      []
    ).push(o);

  });

  const rows =
    Object.keys(groups)
      .sort()
      .reverse();

  if (!rows.length) {

    $("dailyReport")
      .innerHTML =
      `
        <div class="empty">
          Chưa có dữ liệu
        </div>
      `;

    return;
  }

  const max =
    Math.max(
      1,
      ...rows.map(
        d =>
          groups[d]
            .reduce(
              (a, o) =>
                a +
                getNetRevenue(o),
              0
            )
      )
    );

  $("dailyReport")
    .innerHTML =
    rows
      .map(d => {

        const ds =
          groups[d];

        const n =
          ds.reduce(
            (a, o) =>
              a +
              getNetRevenue(o),
            0
          );

        const g =
          ds.reduce(
            (a, o) =>
              a +
              getGross(o),
            0
          );

        const e =
          ds.reduce(
            (a, o) =>
              a +
              getEmployeePayment(o),
            0
          );

        return `

          <div class="daily-row">

            <div class="daily-label">

              <b>
                ${formatDate(d)}
              </b>

              <span>
                ${ds.length} xe
              </span>

            </div>

            <div class="bar-track">

              <div
                class="bar"
                style="
                  width:${Math.max(
                    4,
                    (n / max) *
                      100
                  )}%
                ">
              </div>

            </div>

            <div class="daily-value">

              <b>
                ${formatMoney(n)}
              </b>

              <small>
                Gộp
                ${formatMoney(g)}
                • NV
                ${formatMoney(e)}
              </small>

            </div>

          </div>
        `;

      })
      .join("");
}

/* =========================================================
   BÁO CÁO DỊCH VỤ
   ========================================================= */

function renderServiceReport(
  list
) {

  if (!$("serviceReport"))
    return;

  const map = {};

  list.forEach(o => {

    o.services?.forEach(
      s => {

        if (!map[s.name]) {

          map[s.name] = {

            count: 0,

            revenue: 0

          };
        }

        map[s.name]
          .count++;

        map[s.name]
          .revenue +=
          Number(
            s.price || 0
          );
      }
    );

  });

  const rows =
    Object.entries(map)
      .sort(
        (a, b) =>
          b[1].revenue -
          a[1].revenue
      );

  if (!rows.length) {

    $("serviceReport")
      .innerHTML =
      `
        <div class="empty">
          Chưa có dữ liệu
        </div>
      `;

    return;
  }

  const max =
    Math.max(
      1,
      ...rows.map(
        x =>
          x[1].revenue
      )
    );

  $("serviceReport")
    .innerHTML =
    rows
      .map(
        ([name, v]) => `

          <div class="service-row">

            <div
              class="service-row-top">

              <b>
                ${escapeHTML(
                  name
                )}
              </b>

              <span>
                ${v.count} lượt
              </span>

            </div>

            <div
              class="service-progress">

              <i
                style="
                  width:${Math.max(
                    5,
                    (v.revenue /
                      max) *
                      100
                  )}%
                ">
              </i>

            </div>

            <strong>
              ${formatMoney(
                v.revenue
              )}
            </strong>

          </div>
        `
      )
      .join("");
}
/* =====================================
   QUẢN LÝ CHẤM CÔNG VÀ TÍNH LƯƠNG
===================================== */

// Ngày hiện tại theo múi giờ của thiết bị
function getCurrentMonthKey() {
  const now = new Date();

  return (
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0")
  );
}

// Lưu dữ liệu chấm công
function saveAttendanceData() {
  try {
    localStorage.setItem(
      ATTENDANCE_KEY,
      JSON.stringify(attendanceData)
    );

    return true;
  } catch (error) {
    console.error(error);
    alert("Không thể lưu dữ liệu chấm công.");
    return false;
  }
}

// Đọc dữ liệu chấm công
function loadAttendanceData() {
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);

    attendanceData = raw ? JSON.parse(raw) : {};

    if (
      !attendanceData ||
      typeof attendanceData !== "object" ||
      Array.isArray(attendanceData)
    ) {
      attendanceData = {};
    }
  } catch (error) {
    console.error(error);
    attendanceData = {};
  }
}

// Lấy dữ liệu tháng đang chọn
function getAttendanceMonthData() {
  if (!selectedAttendanceMonth) {
    return null;
  }

  if (!attendanceData[selectedAttendanceMonth]) {
    attendanceData[selectedAttendanceMonth] = {
      salary: 0,
      days: {}
    };
  }

  const data = attendanceData[selectedAttendanceMonth];

  if (!data.days || typeof data.days !== "object") {
    data.days = {};
  }

  return data;
}

// Tổng số ngày trong tháng
function getDaysInMonth(monthKey) {
  if (!monthKey) return 30;

  const parts = monthKey.split("-").map(Number);

  return new Date(
    parts[0],
    parts[1],
    0
  ).getDate();
}

// Định dạng tiền Việt Nam
function formatAttendanceMoney(amount) {
  return Math.round(Number(amount) || 0)
    .toLocaleString("vi-VN") + "₫";
}

// Đọc số tiền nhập vào
function parseAttendanceMoney(value) {
  return Number(
    String(value || "").replace(/\D/g, "")
  ) || 0;
}

// Tính số ngày công
function getAttendanceWorkDays(data) {
  if (!data || !data.days) return 0;

  return Object.values(data.days).filter(
    value => value === true
  ).length;
}

// Tính lương
function calculateAttendanceSalary(data) {
  if (!data) {
    return {
      baseSalary: 0,
      dailySalary: 0,
      workDays: 0,
      totalSalary: 0
    };
  }

  const baseSalary = Number(data.salary) || 0;

  // Luôn lấy lương tháng chia cho 30 ngày
  const dailySalary = baseSalary / 30;

  const workDays = getAttendanceWorkDays(data);

  // Tháng 31 ngày có thể được tính 31 ngày công
  const totalSalary = dailySalary * workDays;

  return {
    baseSalary,
    dailySalary,
    workDays,
    totalSalary
  };
}

// Lưu mức lương tháng
function saveAttendanceSalary() {
  const data = getAttendanceMonthData();

  if (!data) return;

  const salary = parseAttendanceMoney(
    $("monthlySalary").value
  );

  if (salary <= 0) {
    alert("Vui lòng nhập mức lương tháng hợp lệ.");
    return;
  }

  data.salary = salary;

  if (!saveAttendanceData()) return;

  renderAttendance();

  alert(
    "Đã lưu lương tháng " +
    selectedAttendanceMonth +
    ": " +
    formatAttendanceMoney(salary)
  );
}

// Chuyển trạng thái đi làm/nghỉ
function toggleAttendanceDay(day) {
  const data = getAttendanceMonthData();

  if (!data) return;

  const dayKey = String(day);

  data.days[dayKey] = !data.days[dayKey];

  // Không lưu các ngày chưa chấm công
  if (!data.days[dayKey]) {
    delete data.days[dayKey];
  }

  if (!saveAttendanceData()) return;

  renderAttendance();
}

// Hiển thị lịch chấm công
function renderAttendanceCalendar(data) {
  const calendar = $("attendanceCalendar");

  if (!calendar) return;

  const totalDays = getDaysInMonth(
    selectedAttendanceMonth
  );

  const [year, month] = selectedAttendanceMonth
    .split("-")
    .map(Number);

  // Thứ trong tuần của ngày đầu tháng:
  // 0 = Chủ nhật, 1 = Thứ hai, ...
  const firstDay = new Date(
    year,
    month - 1,
    1
  ).getDay();

  const weekDays = [
    "CN", "T2", "T3", "T4", "T5", "T6", "T7"
  ];

  let html = weekDays.map(day => `
    <div class="attendance-weekday">${day}</div>
  `).join("");

  // Ô trống trước ngày đầu tháng
  for (let i = 0; i < firstDay; i++) {
    html += `
      <div class="attendance-empty-day"></div>
    `;
  }

  // Các ngày trong tháng
  for (let day = 1; day <= totalDays; day++) {
    const checked = data.days[String(day)] === true;

    html += `
      <button
        type="button"
        class="attendance-day ${checked ? "checked" : ""}"
        data-attendance-day="${day}"
        aria-pressed="${checked}"
        title="${checked ? "Đã đi làm" : "Chưa chấm công"}">

        <span>${day}</span>

        <small>
          ${checked ? "✓ Công" : "Chấm"}
        </small>

      </button>
    `;
  }

  calendar.innerHTML = html;

  calendar
    .querySelectorAll("[data-attendance-day]")
    .forEach(button => {
      button.addEventListener("click", () => {
        toggleAttendanceDay(
          Number(button.dataset.attendanceDay)
        );
      });
    });
}

// Hiển thị toàn bộ sheet
function renderAttendance() {
  const monthInput = $("attendanceMonth");

  if (!monthInput) return;

  const data = getAttendanceMonthData();

  if (!data) return;

  const salaryInput = $("monthlySalary");

  // Hiển thị mức lương tháng
  if (
    document.activeElement !== salaryInput
  ) {
    salaryInput.value = data.salary
      ? Number(data.salary).toLocaleString("vi-VN")
      : "";
  }

  const result = calculateAttendanceSalary(data);

  $("attendanceBaseSalary").textContent =
    formatAttendanceMoney(result.baseSalary);

  $("attendanceDailySalary").textContent =
    formatAttendanceMoney(result.dailySalary);

  $("attendanceWorkDays").textContent =
    result.workDays +
    " / " +
    getDaysInMonth(selectedAttendanceMonth);

  $("attendanceTotalSalary").textContent =
    formatAttendanceMoney(result.totalSalary);

  $("attendanceMonthLabel").textContent =
    "Tháng " +
    selectedAttendanceMonth.split("-")[1] +
    "/" +
    selectedAttendanceMonth.split("-")[0];

  renderAttendanceCalendar(data);
}

// Chọn tháng cần chấm công
function changeAttendanceMonth(monthKey) {
  if (!monthKey) return;

  selectedAttendanceMonth = monthKey;

  renderAttendance();
}

// Khởi tạo chấm công
function initAttendance() {
  loadAttendanceData();

  selectedAttendanceMonth = getCurrentMonthKey();

  if ($("attendanceMonth")) {
    $("attendanceMonth").value =
      selectedAttendanceMonth;
  }

  renderAttendance();
}

/* =========================================================
   SỰ KIỆN
   ========================================================= */

function setupEvents() {

  /* DỊCH VỤ */

  document
    .querySelectorAll(
      ".service-button"
    )
    .forEach(b => {

      b.onclick = e => {

        e.preventDefault();

        selectService(b);

      };

    });

  /* THANH TOÁN */

  $("cashButton")?.addEventListener(
    "click",
    () =>
      setPayment("cash")
  );

  $("transferButton")
    ?.addEventListener(
      "click",
      () =>
        setPayment(
          "transfer"
        )
    );

  /* TẠO ĐƠN */

  $("addOrderButton")
    ?.addEventListener(
      "click",
      addOrder
    );

  $("plate")
    ?.addEventListener(
      "keydown",
      e => {

        if (
          e.key === "Enter"
        ) {

          e.preventDefault();

          addOrder();
        }

      }
    );

  /* TAB */

  document
    .querySelectorAll(".tab")
    .forEach(b => {

      b.onclick = () =>
        switchTab(
          b.dataset.tab
        );

    });

  /* TÌM KIẾM LỊCH SỬ */

  $("historySearch")
    ?.addEventListener(
      "input",
      showHistory
    );

  $("historyClear")
    ?.addEventListener(
      "click",
      () => {

        if ($("historySearch"))
          $("historySearch")
            .value = "";

        showHistory();

      }
    );

  /* BÁO CÁO NHANH */

  document
    .querySelectorAll(
      ".report-preset"
    )
    .forEach(b => {

      b.onclick = () => {

        currentReportPeriod =
          b.dataset.period;

        renderReport();

      };

    });

  /* CHỌN NGÀY */

  $("reportDate")
    ?.addEventListener(
      "change",
      e => {

        selectedReportDate =
          e.target.value;

        if (
          !selectedReportDate
        ) {
          return;
        }

        currentReportPeriod =
          "date";

        renderReport();

      }
    );

  /* CHỌN THÁNG */

  $("reportMonth")
    ?.addEventListener(
      "change",
      e => {

        selectedReportMonth =
          e.target.value;

        if (
          !selectedReportMonth
        ) {
          return;
        }

        currentReportPeriod =
          "month";

        renderReport();

      }
    );

  /* LƯU CHI PHÍ */

  $("saveExpenseButton")
    ?.addEventListener(
      "click",
      saveMonthlyExpense
    );

  /* XÓA CHI PHÍ */

  $("deleteExpenseButton")
    ?.addEventListener(
      "click",
      deleteMonthlyExpense
    );

  /* FORMAT SỐ TIỀN */

  [
    "expenseSalary",
    "expenseTools",
    "expenseOther"
  ]
    .forEach(id => {

      $(id)?.addEventListener(
        "input",
        e => {

          const n =
            parseMoney(
              e.target.value
            );

          e.target.value =
            n
              ? n.toLocaleString(
                  "vi-VN"
                )
              : "";

        }
      );

    });
}

/* =========================================================
   KHỞI ĐỘNG
   ========================================================= */

function initApp() {

  loadOrders();

  loadMonthlyExpenses();

  showCurrentDate();

  setupEvents();

  setPayment("cash");

  renderSelectedServices();

  showOrders();

  showHistory();

  /* Ngày */

  if ($("reportDate")) {

    $("reportDate")
      .value =
      getDateKey();

    selectedReportDate =
      getDateKey();
  }

  /* Tháng */

  if ($("reportMonth")) {

    $("reportMonth")
      .value =
      getMonthKey();

    selectedReportMonth =
      getMonthKey();
  }

  renderReport();
}

/* =========================================================
   CHẠY APP
   ========================================================= */

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
 initAttendance();
}