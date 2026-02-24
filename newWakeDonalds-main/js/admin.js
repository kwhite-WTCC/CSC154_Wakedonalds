// Admin panel — Wakedonalds
(function () {
  const API = window.location.origin;
  const userData = localStorage.getItem("wakedonald_user");
  if (!userData) {
    window.location.href = "index.html";
    return;
  }
  const user = JSON.parse(userData);
  function normalizeRole(r) {
    var s = (r || "").toLowerCase();
    return s === "admin" ? "admin" : "customer";
  }
  user.role = normalizeRole(user.role);
  if (user.email === "admin@wakedonalds.com" && user.role === "customer") user.role = "admin";
  var canAccessAdmin = user.role === "admin";
  if (!canAccessAdmin) {
    window.location.href = "restaurant-pos.html";
    return;
  }

  document.getElementById("nav-user").textContent = "👋 " + user.name;

  function logout() {
    localStorage.removeItem("wakedonald_user");
    window.location.href = "index.html";
  }

  var menuItems = [];
  var orderList = [];
  var userList = [];
  var editingId = null;

  function escapeHtml(s) {
    if (s == null) return "";
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function formatDateTime(t) {
    if (!t) return "—";
    var s = String(t).trim();
    if (!s) return "—";
    var d = new Date(s);
    if (isNaN(d.getTime())) return s.replace("T", " ").slice(0, 19);
    var datePart = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    var timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
    return datePart + " " + timePart;
  }

  function getOrderDate(o) {
    if (!o || !o.time) return "";
    var d = new Date(String(o.time).trim());
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  function showToast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(function () {
      t.classList.remove("show");
    }, 2200);
  }

  function switchTab(name, el) {
    document.querySelectorAll(".admin-section").forEach(function (s) {
      s.classList.remove("active");
    });
    document.getElementById("section-" + name).classList.add("active");
    document.querySelectorAll(".sidebar-link").forEach(function (l) {
      l.classList.remove("active");
    });
    el.classList.add("active");
    if (name === "users") {
      loadUsers().then(function () {
        renderUsersTable();
      });
    }
  }
  window.switchTab = switchTab;

  async function loadMenu() {
    try {
      var r = await fetch(API + "/api/menu?all=1");
      if (r.ok) {
        var data = await r.json();
        if (Array.isArray(data) && data.length) menuItems = data;
      }
    } catch (_) {}
    if (menuItems.length === 0) {
      try {
        var raw = localStorage.getItem("wakedonald_menu");
        if (raw) menuItems = JSON.parse(raw);
      } catch (_) {}
    }
  }

  async function loadOrders() {
    try {
      var r = await fetch(API + "/api/orders");
      if (r.ok) {
        var data = await r.json();
        if (Array.isArray(data)) orderList = data;
      }
    } catch (_) {}
  }

  async function loadUsers() {
    try {
      var r = await fetch(API + "/api/auth/users");
      if (r.ok) {
        var data = await r.json();
        if (Array.isArray(data)) userList = data;
      }
    } catch (_) {
      userList = [];
    }
  }

  function getFilteredUsers() {
    var searchEl = document.getElementById("users-search");
    var q = (searchEl && searchEl.value || "").trim().toLowerCase();
    if (!q) return userList.slice();
    return userList.filter(function (u) {
      var name = String(u.name || "").toLowerCase();
      var email = String(u.email || "").toLowerCase();
      return name.indexOf(q) !== -1 || email.indexOf(q) !== -1;
    });
  }

  function renderUsersTable() {
    var list = getFilteredUsers();
    var currentUserEmail = user.email;
    var emptyRow = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:30px">No users found</td></tr>';
    document.getElementById("users-body").innerHTML = !list.length
      ? emptyRow
      : list
          .map(function (u) {
            var isSelf = u.email === currentUserEmail;
            var roleOptions =
              "<select class=\"form-input\" style=\"width:auto;padding:6px 10px;margin:0;min-width:100px;\" onchange=\"updateUserRole(" +
              u.id +
              ", this.value)\"" +
              (isSelf ? " disabled title=\"You cannot change your own role\"" : "") +
              "><option value=\"customer\"" +
              (u.role === "customer" ? " selected" : "") +
              ">Customer</option><option value=\"admin\"" +
              (u.role === "admin" ? " selected" : "") +
              ">Admin</option></select>";
            var actionBtns = isSelf
              ? "<span style=\"color:var(--muted);font-size:12px;\">(you)</span>"
              : "";
            return (
              "<tr><td>" +
              escapeHtml(u.name) +
              "</td><td>" +
              escapeHtml(u.email) +
              "</td><td>" +
              roleOptions +
              "</td><td><div class=\"action-btns\">" +
              actionBtns +
              "</div></td></tr>"
            );
          })
          .join("");
  }

  async function updateUserRole(userId, newRole) {
    if (newRole !== "admin" && newRole !== "customer") return;
    try {
      var r = await fetch(API + "/api/auth/users/" + userId + "/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      var data = r.ok ? await r.json().catch(function () { return {}; }) : {};
      if (r.ok) {
        var u = userList.find(function (x) { return x.id === userId; });
        if (u) u.role = data.role || newRole;
        showToast(newRole === "admin" ? "Role updated to Admin. They must log out and log in to see the Admin panel." : "Role updated to Customer.");
        renderUsersTable();
      } else {
        showToast(data.message || "Failed to update role");
      }
    } catch (_) {
      showToast("Failed to update role");
    }
  }
  window.updateUserRole = updateUserRole;

  async function renderAdmin() {
    var prevOrderSig = orderList.length + "_" + orderList.map(function (o) { return (o.id || o.num) + ":" + (o.total || ""); }).join(",");
    var prevMenuSig = menuItems.length + "_" + menuItems.map(function (i) { return i.id + ":" + (i.active ? 1 : 0); }).join(",");
    await loadOrders();
    await loadMenu();
    var nextOrderSig = orderList.length + "_" + orderList.map(function (o) { return (o.id || o.num) + ":" + (o.total || ""); }).join(",");
    var nextMenuSig = menuItems.length + "_" + menuItems.map(function (i) { return i.id + ":" + (i.active ? 1 : 0); }).join(",");
    if (prevOrderSig === nextOrderSig && prevMenuSig === nextMenuSig) return;

    var totalRev = orderList.reduce(function (s, o) {
      return s + Number(o.total);
    }, 0);
    var avgOrder = orderList.length ? totalRev / orderList.length : 0;
    document.getElementById("stat-revenue").textContent = "$" + totalRev.toFixed(2);
    document.getElementById("stat-rev-sub").textContent = orderList.length + " orders";
    document.getElementById("stat-orders").textContent = orderList.length;
    document.getElementById("stat-items").textContent = menuItems.filter(function (i) {
      return i.active;
    }).length;
    document.getElementById("stat-avg").textContent = "$" + avgOrder.toFixed(2);

    var emptyRow = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">No orders yet</td></tr>';
    var recent = orderList.slice(-5).reverse();
    document.getElementById("recent-orders-body").innerHTML = !recent.length
      ? emptyRow
      : recent
          .map(function (o) {
            var items = (o.items || []).map(function (i) {
              return i.name + " ×" + (i.qty || 1);
            }).join(", ");
            return (
              "<tr><td><strong>#" +
              escapeHtml(String(o.num)) +
              "</strong></td><td class=\"datetime-cell\">" +
              escapeHtml(formatDateTime(o.time)) +
              "</td><td>" +
              escapeHtml(o.customer) +
              "</td><td>" +
              escapeHtml(o.phone || "—") +
              "</td><td class=\"items-cell\">" +
              escapeHtml(items) +
              "</td><td><strong>$" +
              Number(o.total).toFixed(2) +
              "</strong></td><td><span class=\"status-badge badge-active\">● " +
              escapeHtml(o.status || "In Progress") +
              "</span></td></tr>"
            );
          })
          .join("");

    renderAllOrdersTable(getFilteredOrders());
    renderMenuTable();
  }

  function getFilteredOrders() {
    var searchEl = document.getElementById("orders-search");
    var dateEl = document.getElementById("orders-date");
    var q = (searchEl && searchEl.value || "").trim().toLowerCase();
    var dateVal = (dateEl && dateEl.value || "").trim();
    var list = orderList.slice().reverse();
    if (dateVal) {
      list = list.filter(function (o) {
        return getOrderDate(o) === dateVal;
      });
    }
    if (q) {
      list = list.filter(function (o) {
        var num = String(o.num || "").toLowerCase();
        var customer = String(o.customer || "").toLowerCase();
        var phone = String(o.phone || "").replace(/\D/g, "");
        var qDigits = q.replace(/\D/g, "");
        var itemsStr = (o.items || []).map(function (i) {
          return (i.name || "") + " " + (i.qty || 1);
        }).join(" ").toLowerCase();
        var notes = String(o.notes || "").toLowerCase();
        return num.indexOf(q) !== -1 ||
          customer.indexOf(q) !== -1 ||
          (qDigits.length && phone.indexOf(qDigits) !== -1) ||
          (q.length >= 2 && itemsStr.indexOf(q) !== -1) ||
          notes.indexOf(q) !== -1;
      });
    }
    return list;
  }

  function renderAllOrdersTable(ordersToShow) {
    var emptyOrders = '<tr><td colspan="11" style="text-align:center;color:var(--muted);padding:30px">No orders found</td></tr>';
    document.getElementById("all-orders-body").innerHTML = !ordersToShow.length
      ? emptyOrders
      : ordersToShow
          .map(function (o) {
            var items = (o.items || []).map(function (i) {
              return i.name + " ×" + (i.qty || 1);
            }).join(", ");
            var notes = (o.notes && String(o.notes).trim()) ? escapeHtml(String(o.notes).trim()) : "—";
            var currentStatus = o.status || "In Progress";
            var statusClass = currentStatus === "Ready for Pickup" ? "badge-ready" : (currentStatus === "Picked Up" ? "badge-picked" : "badge-active");
            var statusBtn = "";
            var orderId = o.id || o.num || null;
            if (!orderId) {
              statusBtn = '<span style="color:var(--muted);font-size:11px;">No ID</span>';
            } else if (currentStatus === "Ready for Pickup") {
              statusBtn = '<button class="icon-btn" onclick="updateOrderStatus(' + orderId + ', \'In Progress\')" title="Mark as In Progress">⏳ In Progress</button> ' +
                          '<button class="icon-btn" style="background:var(--muted);color:white;border-color:var(--muted);" onclick="updateOrderStatus(' + orderId + ', \'Picked Up\')" title="Mark as Picked Up">✓ Picked Up</button>';
            } else if (currentStatus === "In Progress") {
              statusBtn = '<button class="icon-btn" style="background:var(--green);color:white;border-color:var(--green);" onclick="updateOrderStatus(' + orderId + ', \'Ready for Pickup\')" title="Mark as Ready for Pickup">✅ Ready</button> ' +
                          '<button class="icon-btn" style="background:var(--muted);color:white;border-color:var(--muted);" onclick="updateOrderStatus(' + orderId + ', \'Picked Up\')" title="Mark as Picked Up">✓ Picked Up</button>';
            }
            return (
              "<tr><td><strong>#" +
              escapeHtml(String(o.num)) +
              "</strong></td><td class=\"datetime-cell\">" +
              escapeHtml(formatDateTime(o.time)) +
              "</td><td>" +
              escapeHtml(o.customer) +
              "</td><td>" +
              escapeHtml(o.phone || "—") +
              "</td><td class=\"items-cell\">" +
              escapeHtml(items) +
              "</td><td>$" +
              Number(o.subtotal || 0).toFixed(2) +
              "</td><td>$" +
              Number(o.tax || 0).toFixed(2) +
              "</td><td><strong>$" +
              Number(o.total).toFixed(2) +
              "</strong></td><td class=\"note-cell\">" +
              notes +
              "</td><td><span class=\"status-badge " + statusClass + "\">● " +
              escapeHtml(currentStatus) +
              "</span></td><td><div class=\"action-btns\">" +
              statusBtn +
              "</div></td></tr>"
            );
          })
          .join("");

    renderMenuTable();
  }

  function renderMenuTable() {
    document.getElementById("admin-menu-body").innerHTML = menuItems
      .map(function (item) {
        return (
          "<tr><td>" +
          (item.emoji || "🍽️") +
          " <strong>" +
          escapeHtml(item.name) +
          "</strong></td><td>" +
          escapeHtml(item.cat) +
          "</td><td>$" +
          Number(item.price).toFixed(2) +
          "</td><td><span class=\"status-badge " +
          (item.active ? "badge-active" : "badge-off") +
          "\">● " +
          (item.active ? "Active" : "Off Menu") +
          "</span></td><td><div class=\"action-btns\"><button class=\"icon-btn\" onclick=\"openEditModal(" +
          item.id +
          ")\">✏ Edit</button><button class=\"icon-btn\" onclick=\"toggleItem(" +
          item.id +
          ")\">" +
          (item.active ? "🚫 Disable" : "✅ Enable") +
          "</button><button class=\"icon-btn danger\" onclick=\"deleteItem(" +
          item.id +
          ")\">🗑</button></div></td></tr>"
        );
      })
      .join("");
    document.getElementById("stat-items").textContent = menuItems.filter(function (i) {
      return i.active;
    }).length;
  }

  async function toggleItem(id) {
    var item = menuItems.find(function (i) {
      return i.id === id;
    });
    if (!item) return;
    item.active = !item.active;
    try {
      var r = await fetch(API + "/api/menu/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          cat: item.cat,
          price: item.price,
          description: item.desc,
          description_es: item.desc_es || "",
          emoji: item.emoji,
          tag: item.tag,
          active: item.active,
        }),
      });
      if (!r.ok) throw new Error();
    } catch (_) {}
    try {
      localStorage.setItem("wakedonald_menu", JSON.stringify(menuItems));
    } catch (_) {}
    renderMenuTable();
    showToast(item.name + " " + (item.active ? "enabled" : "disabled"));
  }
  window.toggleItem = toggleItem;

  async function deleteItem(id) {
    var item = menuItems.find(function (i) {
      return i.id === id;
    });
    if (!item || !confirm('Delete "' + item.name + '"?')) return;
    try {
      var r = await fetch(API + "/api/menu/" + id, { method: "DELETE" });
      if (!r.ok) throw new Error();
    } catch (_) {}
    menuItems = menuItems.filter(function (i) {
      return i.id !== id;
    });
    try {
      localStorage.setItem("wakedonald_menu", JSON.stringify(menuItems));
    } catch (_) {}
    renderMenuTable();
    showToast("Item deleted");
  }
  window.deleteItem = deleteItem;

  function openAddModal() {
    editingId = null;
    document.getElementById("modal-title").textContent = "Add Menu Item";
    document.getElementById("mi-name").value = "";
    document.getElementById("mi-desc").value = "";
    var descEsEl = document.getElementById("mi-desc-es");
    if (descEsEl) descEsEl.value = "";
    document.getElementById("mi-price").value = "";
    document.getElementById("mi-emoji").value = "🍔";
    document.getElementById("mi-tag").value = "";
    document.getElementById("mi-category").value = "Mains";
    document.getElementById("item-modal").classList.add("open");
  }
  window.openAddModal = openAddModal;

  function openEditModal(id) {
    var item = menuItems.find(function (i) {
      return i.id === id;
    });
    if (!item) return;
    editingId = id;
    document.getElementById("modal-title").textContent = "Edit Menu Item";
    document.getElementById("mi-name").value = item.name;
    document.getElementById("mi-desc").value = item.desc || "";
    var descEsEl = document.getElementById("mi-desc-es");
    if (descEsEl) descEsEl.value = item.desc_es || "";
    document.getElementById("mi-price").value = item.price;
    document.getElementById("mi-emoji").value = item.emoji || "🍔";
    document.getElementById("mi-tag").value = item.tag || "";
    document.getElementById("mi-category").value = item.cat || "Mains";
    document.getElementById("item-modal").classList.add("open");
  }
  window.openEditModal = openEditModal;

  function closeModal() {
    document.getElementById("item-modal").classList.remove("open");
  }
  window.closeModal = closeModal;

  async function saveItem() {
    var name = document.getElementById("mi-name").value.trim();
    var price = parseFloat(document.getElementById("mi-price").value);
    if (!name || isNaN(price)) {
      showToast("Please fill name and price");
      return;
    }
    var descEsEl = document.getElementById("mi-desc-es");
    var data = {
      name: name,
      price: price,
      cat: document.getElementById("mi-category").value,
      description: document.getElementById("mi-desc").value,
      description_es: descEsEl ? descEsEl.value.trim() : "",
      emoji: document.getElementById("mi-emoji").value || "🍔",
      tag: document.getElementById("mi-tag").value,
      active: true,
    };
    if (editingId) {
      try {
        var r = await fetch(API + "/api/menu/" + editingId, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!r.ok) throw new Error();
      } catch (_) {}
      var existing = menuItems.find(function (i) {
        return i.id === editingId;
      });
      if (existing) {
        existing.name = data.name;
        existing.price = data.price;
        existing.cat = data.cat;
        existing.desc = data.description;
        existing.desc_es = data.description_es || "";
        existing.emoji = data.emoji;
        existing.tag = data.tag;
      }
      showToast("Item updated");
    } else {
      try {
        var r = await fetch(API + "/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (r.ok) {
          var d = await r.json();
          var newId = d.id != null ? Number(d.id) : Math.max(0, ...menuItems.map(function (i) {
            return Number(i.id) || 0;
          })) + 1;
          menuItems.push({
            id: newId,
            name: data.name,
            price: data.price,
            cat: data.cat,
            desc: data.description,
            desc_es: data.description_es || "",
            emoji: data.emoji,
            tag: data.tag,
            active: true,
          });
        } else throw new Error();
      } catch (_) {
        var newId = Math.max(0, ...menuItems.map(function (i) {
          return Number(i.id) || 0;
        })) + 1;
        menuItems.push({
          id: newId,
          name: data.name,
          price: data.price,
          cat: data.cat,
          desc: data.description,
          desc_es: data.description_es || "",
          emoji: data.emoji,
          tag: data.tag,
          active: true,
        });
      }
      showToast("Item added");
    }
    try {
      localStorage.setItem("wakedonald_menu", JSON.stringify(menuItems));
    } catch (_) {}
    closeModal();
    renderMenuTable();
  }
  window.saveItem = saveItem;

  function setupOrdersFilters() {
    var searchEl = document.getElementById("orders-search");
    var dateEl = document.getElementById("orders-date");
    var clearBtn = document.getElementById("orders-clear-filters");
    function applyFilters() {
      renderAllOrdersTable(getFilteredOrders());
    }
    if (searchEl) {
      searchEl.addEventListener("input", applyFilters);
      searchEl.addEventListener("keyup", applyFilters);
    }
    if (dateEl) dateEl.addEventListener("change", applyFilters);
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (searchEl) searchEl.value = "";
        if (dateEl) dateEl.value = "";
        applyFilters();
      });
    }
  }

  function setupUsersSearch() {
    var searchEl = document.getElementById("users-search");
    if (searchEl) {
      searchEl.addEventListener("input", renderUsersTable);
      searchEl.addEventListener("keyup", renderUsersTable);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    if (newStatus !== "In Progress" && newStatus !== "Ready for Pickup" && newStatus !== "Picked Up") return;
    if (!orderId || orderId === "null" || orderId === "undefined") {
      showToast("Invalid order ID");
      return;
    }
    try {
      var r = await fetch(API + "/api/orders/" + orderId + "/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      var data = {};
      if (r.ok) {
        try {
          data = await r.json();
        } catch (_) {
          data = { status: newStatus };
        }
      } else {
        try {
          data = await r.json();
        } catch (_) {
          data = { message: "Server error" };
        }
      }
      if (r.ok) {
        var o = orderList.find(function (x) { return x.id === orderId || x.id === Number(orderId); });
        if (o) o.status = data.status || newStatus;
        showToast("Order status updated to " + newStatus);
        renderAllOrdersTable(getFilteredOrders());
      } else {
        showToast(data.message || "Failed to update status: " + r.status);
      }
    } catch (err) {
      console.error("Update status error:", err);
      showToast("Failed to update status");
    }
  }
  window.updateOrderStatus = updateOrderStatus;

  renderAdmin();
  setupOrdersFilters();
  setupUsersSearch();

  setInterval(function () {
    renderAdmin();
  }, 10000);
})();
