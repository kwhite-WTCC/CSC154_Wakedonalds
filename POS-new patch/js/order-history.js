// Order History — Wakedonalds
(function () {
  const API = window.location.origin;
  const userData = localStorage.getItem("wakedonald_user");
  if (!userData) {
    window.location.href = "index.html";
    return;
  }
  const user = JSON.parse(userData);

  document.getElementById("nav-user").textContent = "👋 " + user.name;

  function logout() {
    localStorage.removeItem("wakedonald_user");
    window.location.href = "index.html";
  }
  window.logout = logout;

  if (user.role === "guest" || user.name === "Guest") {
    document.getElementById("loading").style.display = "none";
    document.getElementById("guest-block").style.display = "block";
    var t = window.t || function (k) { return k; };
    document.getElementById("guest-block").innerHTML = `
            <div class="guest-prompt">
                <div class="icon">📋</div>
                <h2>${t("oh_sign_in_to_see")}</h2>
                <p>${t("oh_sign_in_desc")}</p>
                <a href="index.html" class="btn-primary">${t("oh_sign_in")}</a>
            </div>
        `;
    return;
  }

  let allOrders = [];

  function orderDateStr(o) {
    var t = o.time;
    if (!t) return "";
    var s = String(t);
    if (s.indexOf("T") !== -1) return s.slice(0, 10);
    if (s.indexOf(" ") !== -1) return s.slice(0, 10);
    return s.slice(0, 10);
  }

  function applyDateFilter() {
    var picker = document.getElementById("order-date-picker");
    var dateVal = (picker && picker.value) ? picker.value.trim() : "";
    var ordersToShow = allOrders;
    if (dateVal) ordersToShow = allOrders.filter(function (o) { return orderDateStr(o) === dateVal; });
    renderOrderList(ordersToShow);
  }

  function renderOrderList(ordersToShow) {
    var listEl = document.getElementById("list");
    var emptyEl = document.getElementById("empty");
    var dateWrap = document.getElementById("date-filter-wrap");
    if (!ordersToShow || ordersToShow.length === 0) {
      listEl.style.display = "none";
      if (dateWrap) dateWrap.style.display = "none";
      emptyEl.style.display = "block";
      document.getElementById("page-sub").textContent = "No orders for selected date";
      var t = window.t || function (k) { return k; };
      emptyEl.innerHTML = "<div class=\"empty-state\"><div class=\"icon\">📭</div><h2>" + t("oh_no_orders_day") + "</h2><p>Try another date or click Show all to see every order.</p><button type=\"button\" class=\"btn-primary\" id=\"btn-show-all-from-empty\">" + t("oh_show_all") + "</button></div>";
      var btn = document.getElementById("btn-show-all-from-empty");
      if (btn) btn.onclick = function () { var p = document.getElementById("order-date-picker"); if (p) p.value = ""; applyDateFilter(); };
      return;
    }
    emptyEl.style.display = "none";
    if (dateWrap) dateWrap.style.display = "block";
    document.getElementById("page-sub").textContent = ordersToShow.length + " order" + (ordersToShow.length !== 1 ? "s" : "") + " found";
    listEl.style.display = "block";
    listEl.innerHTML = ordersToShow
      .map(function (o) {
        var statusClass = (o.status || "").toLowerCase().includes("complete") || (o.status || "").toLowerCase().includes("done") ? "done" : "active";
        var itemsHtml = (o.items || [])
          .map(function (i) {
            return "<li><span class=\"item-name\">" + escapeHtml(i.name) + "<span class=\"item-qty\">× " + (i.qty || 1) + "</span></span><span>$" + (Number(i.price) * (i.qty || 1)).toFixed(2) + "</span></li>";
          })
          .join("");
        var notesHtml = (o.notes && o.notes.trim()) ? "<div class=\"order-notes\">Note: " + escapeHtml(o.notes) + "</div>" : "";
        return (
          "<div class=\"order-card\">" +
          "<div class=\"order-card-head\">" +
          "<span class=\"order-num\">#" + escapeHtml(String(o.num)) + "</span>" +
          "<span class=\"order-date\">" + escapeHtml(formatTime(o.time)) + "</span>" +
          "<span class=\"status-badge " + statusClass + "\">● " + escapeHtml(o.status || "In Progress") + "</span>" +
          "</div>" +
          "<div class=\"order-card-body\">" +
          "<ul class=\"order-items-list\">" + itemsHtml + "</ul>" +
          "<div class=\"order-total-row\"><span>Total</span><span class=\"val\">$" + Number(o.total).toFixed(2) + "</span></div>" +
          notesHtml +
          "</div></div>"
        );
      })
      .join("");
  }

  async function fetchMyOrders() {
    try {
      const r = await fetch(API + "/api/orders/my?customer=" + encodeURIComponent(user.name));
      const orders = await r.json();
      return Array.isArray(orders) ? orders : [];
    } catch (_) {
      return [];
    }
  }

  async function loadMyOrders() {
    try {
      const orders = await fetchMyOrders();
      document.getElementById("loading").style.display = "none";
      if (!orders.length) {
        document.getElementById("empty").style.display = "block";
        var t = window.t || function (k) { return k; };
        document.getElementById("empty").innerHTML = `
                    <div class="empty-state">
                        <div class="icon">🧾</div>
                        <h2>${t("oh_no_orders")}</h2>
                        <p>When you place orders while signed in as <strong>${escapeHtml(user.name)}</strong>, they'll show up here.</p>
                        <a href="restaurant-pos.html" class="btn-primary">${t("oh_browse_menu")}</a>
                    </div>
                `;
        return;
      }
      allOrders = orders;
      applyDateFilter();
    } catch (e) {
      document.getElementById("loading").innerHTML = "Could not load orders. <a href=\"order-history.html\">Try again</a>.";
    }
  }

  async function refreshOrders() {
    var orders = await fetchMyOrders();
    if (!Array.isArray(orders)) return;
    var prevSig = allOrders.length + "_" + allOrders.map(function (o) { return o.num || o.id; }).join(",");
    var nextSig = orders.length + "_" + orders.map(function (o) { return o.num || o.id; }).join(",");
    if (prevSig === nextSig) return;
    allOrders = orders;
    applyDateFilter();
  }

  function escapeHtml(s) {
    if (s == null) return "";
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }
  function formatTime(t) {
    if (!t) return "—";
    return String(t).replace("T", " ").slice(0, 16);
  }

  var picker = document.getElementById("order-date-picker");
  var btnClear = document.getElementById("btn-clear-date");
  if (picker) picker.addEventListener("change", applyDateFilter);
  if (btnClear) btnClear.addEventListener("click", function () { var p = document.getElementById("order-date-picker"); if (p) p.value = ""; applyDateFilter(); });

  loadMyOrders();
  setInterval(refreshOrders, 10000);

  window.addEventListener("wakedonalds-lang-change", function () {
    if (user.role === "guest" || user.name === "Guest") {
      var guestEl = document.getElementById("guest-block");
      if (guestEl && guestEl.style.display !== "none") {
        var t = window.t || function (k) { return k; };
        guestEl.innerHTML = "<div class=\"guest-prompt\"><div class=\"icon\">📋</div><h2>" + t("oh_sign_in_to_see") + "</h2><p>" + t("oh_sign_in_desc") + "</p><a href=\"index.html\" class=\"btn-primary\">" + t("oh_sign_in") + "</a></div>";
      }
    } else {
      applyDateFilter();
    }
  });
})();
