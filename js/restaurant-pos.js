// POS — Wakedonalds (menu, cart, checkout)
(function () {
  const userData = localStorage.getItem("wakedonald_user");
  if (!userData) {
    window.location.href = "index.html";
    return;
  }
  const user = JSON.parse(userData);

  document.getElementById("nav-user").textContent = "👋 " + user.name;
  function normalizeRole(r) {
    const s = (r || "").toLowerCase();
    return s === "admin" ? "admin" : "customer";
  }
  user.role = normalizeRole(user.role);
  if (user.email === "admin@wakedonalds.com" && user.role === "customer") user.role = "admin";
  const canAccessAdmin = user.role === "admin";
  if (canAccessAdmin) {
    const btn = document.getElementById("nav-admin-btn");
    if (btn) btn.style.display = "inline-block";
  }
  const isGuest = user.role === "guest" || user.name === "Guest";
  const orderHistoryLink = document.getElementById("nav-order-history");
  if (orderHistoryLink && !isGuest) orderHistoryLink.style.display = "inline-block";
  if (!isGuest) {
    const nameInput = document.getElementById("customer-name");
    if (nameInput) nameInput.placeholder = user.name;
  }

  function logout() {
    localStorage.removeItem("wakedonald_user");
    window.location.href = "index.html";
  }
  window.logout = logout;

  const DEFAULT_MENU = [
    { id: 1, name: "Fries", cat: "Starters", price: 5, desc: "Crispy golden fries", emoji: "🍟", tag: "popular", active: true },
    { id: 2, name: "Crunchwrap Supreme", cat: "Mains", price: 9, desc: "Flour tortilla, seasoned beef, nacho cheese, lettuce, tomato", emoji: "🌯", tag: "popular", active: true },
    { id: 3, name: "Tonkotsu Ramen", cat: "Mains", price: 14, desc: "Rich pork broth, noodles, chashu pork, soft-boiled egg", emoji: "🍜", tag: "", active: true },
    { id: 4, name: "Chicken Filet Sandwich", cat: "Mains", price: 10, desc: "Crispy chicken filet, lettuce, pickles, brioche bun", emoji: "🥪", tag: "popular", active: true },
    { id: 5, name: "Burger", cat: "Mains", price: 11, desc: "Beef patty, cheese, lettuce, tomato, special sauce", emoji: "🍔", tag: "", active: true },
    { id: 6, name: "Hot Dog", cat: "Mains", price: 7, desc: "All-beef frank, mustard, ketchup, relish", emoji: "🌭", tag: "", active: true },
    { id: 7, name: "Spicy Pasta", cat: "Pasta & Risotto", price: 12, desc: "Rigatoni, spicy tomato sauce, parmigiano", emoji: "🍝", tag: "spicy", active: true },
    { id: 8, name: "Mac & Cheese", cat: "Pasta & Risotto", price: 10, desc: "Creamy cheddar sauce, elbow pasta, breadcrumb topping", emoji: "🧀", tag: "popular", active: true },
    { id: 9, name: "Ice Cream", cat: "Desserts", price: 4, desc: "Vanilla soft serve, cone or cup", emoji: "🍦", tag: "popular", active: true },
    { id: 10, name: "Chocolate Brownie", cat: "Desserts", price: 5, desc: "Warm fudge brownie, powdered sugar", emoji: "🍫", tag: "", active: true },
    { id: 11, name: "Apple Pie", cat: "Desserts", price: 4, desc: "Flaky crust, cinnamon apple filling", emoji: "🥧", tag: "", active: true },
    { id: 12, name: "Water", cat: "Drinks", price: 1, desc: "Cold bottled water", emoji: "💧", tag: "", active: true },
    { id: 13, name: "Soda", cat: "Drinks", price: 3, desc: "Coke, Sprite, or Dr. Pepper", emoji: "🥤", tag: "popular", active: true },
    { id: 14, name: "Milkshake", cat: "Drinks", price: 6, desc: "Vanilla, chocolate, or strawberry", emoji: "🥛", tag: "", active: true },
  ];
  const STORAGE_MENU = "wakedonald_menu",
    STORAGE_CART = "wakedonald_cart",
    STORAGE_ORDERS = "wakedonald_orders";

  function loadMenu() {
    try {
      const raw = localStorage.getItem(STORAGE_MENU);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return JSON.parse(JSON.stringify(DEFAULT_MENU));
  }
  function saveMenu() {
    localStorage.setItem(STORAGE_MENU, JSON.stringify(menuItems));
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_CART);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  }
  function saveCart() {
    localStorage.setItem(STORAGE_CART, JSON.stringify(cart));
  }

  function loadOrders() {
    try {
      const raw = localStorage.getItem(STORAGE_ORDERS);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  }
  function saveOrders() {
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
  }

  let menuItems = loadMenu();
  let cart = loadCart();
  let orders = loadOrders();
  let nextId = Math.max(0, ...menuItems.map((i) => i.id)) + 1;
  let activeCategory = "All";
  let menuSearchQuery = "";
  const TAX = 0.08;
  const API = window.location.origin;

  function matchesMenuSearch(item, q) {
    if (!q || !q.trim()) return true;
    const s = q.trim().toLowerCase();
    const name = (item.name || "").toLowerCase();
    const desc = (window.getMenuDesc ? window.getMenuDesc(item) : item.desc) || "";
    const descLower = desc.toLowerCase();
    const cat = (item.cat || "").toLowerCase();
    return name.indexOf(s) !== -1 || descLower.indexOf(s) !== -1 || cat.indexOf(s) !== -1;
  }

  function getFilteredMenuItems() {
    let list = menuItems.filter((i) => i.active);
    if (menuSearchQuery.trim()) list = list.filter((i) => matchesMenuSearch(i, menuSearchQuery));
    if (activeCategory !== "All") list = list.filter((i) => i.cat === activeCategory);
    return list;
  }

  async function loadMenuFromApi() {
    try {
      const r = await fetch(API + "/api/menu");
      const data = await r.json();
      if (Array.isArray(data) && data.length >= 5) {
        menuItems = data;
        nextId = Math.max(0, ...menuItems.map((i) => i.id)) + 1;
        saveMenu();
        return true;
      }
    } catch (_) {}
    return false;
  }

  function showView(name) {
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    document.getElementById("view-" + name).classList.add("active");
    if (name === "menu") {
      renderMenu();
      loadLiveFeed();
    }
    if (name === "cart") {
      renderCart();
    }
  }
  window.showView = showView;

  let liveFeedInterval = null;
  let lastOrderIds = [];
  
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  
  async function loadLiveFeed() {
    const feedBody = document.getElementById("live-feed-body");
    const feedPanel = document.querySelector(".live-feed-panel");
    if (!feedBody) return;
    if (isGuest) {
      if (feedPanel) feedPanel.style.display = "none";
      return;
    }
    if (feedPanel) feedPanel.style.display = "";
    try {
      const customerName = (user && user.name) ? encodeURIComponent(user.name) : "";
      if (!customerName) return;
      const r = await fetch(API + "/api/orders/my?customer=" + customerName);
      if (r.ok) {
        const orders = await r.json();
        const activeOrders = (orders || []).filter(function(o) {
          return o.status !== "Picked Up";
        });
        const recentOrders = activeOrders.slice(0, 10).reverse();
        const currentOrderIds = recentOrders.map(o => String(o.id || o.num || "")).join(",");
        
        if (recentOrders.length === 0) {
          if (feedBody.innerHTML.indexOf("empty-feed") === -1) {
            feedBody.innerHTML = '<div class="empty-feed">' + (window.t ? window.t("cart_no_orders") : "No orders yet") + '</div>';
          }
        } else {
          const newHtml = recentOrders.map(function (o) {
            const statusClass = o.status === "Ready for Pickup" ? "status-ready" : "status-in-progress";
            const statusText = o.status || "In Progress";
            const itemsText = (o.items || []).slice(0, 3).map(function (i) {
              return escapeHtml(i.name) + " ×" + (i.qty || 1);
            }).join(", ") + ((o.items || []).length > 3 ? " +" + ((o.items || []).length - 3) + " more" : "");
            const timeStr = o.time ? new Date(o.time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true }) : "";
            return (
              '<div class="live-order-card" data-order-id="' + escapeHtml(String(o.id || o.num || "")) + '">' +
              '<div class="live-order-header">' +
              '<div class="live-order-num">Order #' + escapeHtml(String(o.num || "")) + '</div>' +
              '<span class="live-order-status ' + statusClass + '">● ' + escapeHtml(statusText) + '</span>' +
              '</div>' +
              '<div class="live-order-info">' + escapeHtml(o.phone || "—") + '</div>' +
              '<div class="live-order-items">' + itemsText + '</div>' +
              '<div class="live-order-time">' + escapeHtml(timeStr) + '</div>' +
              '</div>'
            );
          }).join("");
          
          if (currentOrderIds !== lastOrderIds) {
            const wasEmpty = feedBody.innerHTML.indexOf("empty-feed") !== -1;
            feedBody.innerHTML = newHtml;
            if (wasEmpty) {
              const cards = feedBody.querySelectorAll(".live-order-card");
              cards.forEach((card, idx) => {
                card.style.animationDelay = (idx * 0.05) + "s";
              });
            }
            lastOrderIds = currentOrderIds;
          } else {
            recentOrders.forEach(function (o) {
              const card = feedBody.querySelector('[data-order-id="' + String(o.id || o.num || "") + '"]');
              if (card) {
                const statusEl = card.querySelector(".live-order-status");
                const statusClass = o.status === "Ready for Pickup" ? "status-ready" : "status-in-progress";
                const statusText = o.status || "In Progress";
                if (statusEl) {
                  statusEl.className = "live-order-status " + statusClass;
                  statusEl.innerHTML = "● " + escapeHtml(statusText);
                }
              }
            });
          }
        }
      }
    } catch (_) {
      if (feedBody.innerHTML.indexOf("Unable to load") === -1) {
        feedBody.innerHTML = '<div class="empty-feed">Unable to load orders</div>';
      }
    }
  }

  function startLiveFeedPolling() {
    if (liveFeedInterval) clearInterval(liveFeedInterval);
    liveFeedInterval = setInterval(function () {
      const menuView = document.getElementById("view-menu");
      if (menuView && menuView.classList.contains("active")) {
        loadLiveFeed();
      }
    }, 5000);
  }

  function renderMenu() {
    const baseForCats = menuItems.filter((i) => i.active).filter((i) => matchesMenuSearch(i, menuSearchQuery));
    const cats = ["All", ...new Set(baseForCats.map((i) => i.cat))];
    document.getElementById("category-bar").innerHTML = cats
      .map((c) => `<button class="cat-tab ${c === activeCategory ? "active" : ""}" onclick="setCategory('${c}')">${c}</button>`)
      .join("");
    renderMenuItems();
  }

  function setCategory(cat) {
    activeCategory = cat;
    renderMenu();
  }
  window.setCategory = setCategory;

  function renderMenuItems() {
    const filtered = getFilteredMenuItems();
    const byCategory = {};
    filtered.forEach((item) => {
      if (!byCategory[item.cat]) byCategory[item.cat] = [];
      byCategory[item.cat].push(item);
    });
    document.getElementById("menu-body").innerHTML = Object.entries(byCategory)
      .map(
        ([cat, items], ci) => `
        <div>
            <div class="section-title">${cat}</div>
            <div class="section-sub">${items.length} ${items.length !== 1 ? (window.t ? window.t("items") : "items") : (window.t ? window.t("item") : "item")}</div>
            <div class="menu-grid">
                ${items
                  .map(
                    (item, i) => `
                    <div class="menu-card" style="animation-delay:${(ci * 4 + i) * 0.05}s">
                        <div class="menu-card-img">${item.emoji || "🍽️"}</div>
                        <div class="menu-card-body">
                            <div class="menu-card-top">
                                <div class="menu-card-name">${item.name}</div>
                                <div class="menu-card-price">$${Number(item.price).toFixed(2)}</div>
                            </div>
                            <div class="menu-card-desc">${window.getMenuDesc ? window.getMenuDesc(item) : (item.desc || "")}</div>
                            ${item.tag === "popular" ? '<span class="tag tag-popular">⭐ ' + (window.t ? window.t("tag_popular") : "Popular") + "</span>" : ""}
                            ${item.tag === "veg" ? '<span class="tag tag-veg">🌿 ' + (window.t ? window.t("tag_veg") : "Veg") + "</span>" : ""}
                            ${item.tag === "spicy" ? '<span class="tag tag-spicy">🌶️ ' + (window.t ? window.t("tag_spicy") : "Spicy") + "</span>" : ""}
                            <button class="add-btn" data-id="${item.id}" onclick="addToCart(this)">${window.t ? window.t("add_to_order") : "+ Add to Order"}</button>
                        </div>
                    </div>`
                  )
                  .join("")}
            </div>
        </div>`
      )
      .join("");
    updateCartBadge();
  }

  function addToCart(btnOrId) {
    const id = typeof btnOrId === "object" && btnOrId && btnOrId.getAttribute ? btnOrId.getAttribute("data-id") : btnOrId;
    if (id === undefined || id === null) return;
    const numId = Number(id);
    const item = menuItems.find((i) => Number(i.id) === numId || i.id === id);
    if (!item) return;
    const existing = cart.find((c) => Number(c.id) === numId || c.id === id);
    if (existing) existing.qty++;
    else cart.push({ ...item, qty: 1 });
    saveCart();
    updateCartBadge();
    showToast(`${item.emoji || "🍽️"} ${item.name} added to order`);
  }
  window.addToCart = addToCart;

  function updateCartBadge() {
    document.getElementById("cart-count").textContent = cart.reduce((s, i) => s + i.qty, 0);
  }

  function renderCart() {
    const list = document.getElementById("cart-items-list");
    if (cart.length === 0) {
      var empty1 = window.t ? window.t("cart_empty") : "Your order is empty.";
      var empty2 = window.t ? window.t("cart_empty_sub") : "Head back to the menu to add items.";
      list.innerHTML = `<div class="empty-cart"><div class="icon">🍽️</div><p>${empty1}<br>${empty2}</p></div>`;
    } else {
      list.innerHTML = cart
        .map(
          (item) => `
            <div class="cart-item">
                <div class="cart-item-emoji">${item.emoji || "🍽️"}</div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-unit">$${Number(item.price).toFixed(2)} each</div>
                </div>
                <div class="qty-control">
                    <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
                </div>
                <div class="cart-item-total">$${(Number(item.price) * item.qty).toFixed(2)}</div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">✕</button>
            </div>`
        )
        .join("");
    }
    renderSummary();
  }

  function changeQty(id, delta) {
    const item = cart.find((c) => c.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter((c) => c.id !== id);
    saveCart();
    updateCartBadge();
    renderCart();
  }
  window.changeQty = changeQty;

  function removeFromCart(id) {
    cart = cart.filter((c) => c.id !== id);
    saveCart();
    updateCartBadge();
    renderCart();
  }
  window.removeFromCart = removeFromCart;

  function renderSummary() {
    const subtotal = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
    const tax = subtotal * TAX;
    const total = subtotal + tax;
    document.getElementById("summary-rows").innerHTML = `
        <div class="summary-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
        <div class="summary-row"><span>Tax (${(TAX * 100).toFixed(0)}%)</span><span>$${tax.toFixed(2)}</span></div>
        <div class="summary-row total"><span>Total</span><span class="val">$${total.toFixed(2)}</span></div>`;
  }

  function formatPhoneInput(input) {
    let digits = input.value.replace(/\D/g, "");
    if (digits.length > 10) digits = digits.slice(0, 10);
    if (digits.length <= 3) input.value = digits ? "(" + digits : digits;
    else if (digits.length <= 6) input.value = "(" + digits.slice(0, 3) + ") " + digits.slice(3);
    else input.value = "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6);
    const hint = document.getElementById("phone-hint");
    if (hint) hint.style.display = digits.length > 0 && digits.length !== 10 ? "block" : "none";
  }
  window.formatPhoneInput = formatPhoneInput;

  function formatPhoneDisplay(phoneStr) {
    const digits = (phoneStr || "").replace(/\D/g, "");
    if (digits.length !== 10) return phoneStr || "—";
    return "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6);
  }
  function getPhoneDigits(phoneStr) {
    return (phoneStr || "").replace(/\D/g, "");
  }

  var placeOrderSubmitting = false;
  async function placeOrder() {
    if (placeOrderSubmitting) {
      showToast("Please wait, order is being placed…");
      return;
    }
    if (cart.length === 0) {
      showToast("Your cart is empty!");
      return;
    }
    placeOrderSubmitting = true;
    var btn = document.querySelector("#view-cart .checkout-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Placing order…"; }
    try {
      const nameEl = document.getElementById("customer-name");
      const phoneEl = document.getElementById("phone-num");
      const notesEl = document.getElementById("special-notes");
      const nameInput = (nameEl && nameEl.value || "").trim() || user.name;
      const phoneRaw = (phoneEl && phoneEl.value || "").trim();
      const phoneDigits = getPhoneDigits(phoneRaw);
      if (phoneDigits.length !== 10) {
        showToast("Please enter a valid 10-digit phone number");
        if (phoneEl) phoneEl.focus();
        return;
      }
      const phone = formatPhoneDisplay(phoneRaw);
      const notes = (notesEl && notesEl.value || "").trim();
      const subtotal = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
      const tax = subtotal * TAX;
      const total = subtotal + tax;
      let orderNum = String(orders.length + 1001);
      const customerForApi = isGuest ? nameInput || "Guest" : user.name;

      try {
        const r = await fetch(API + "/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: customerForApi,
            phone: phone,
            notes: notes || null,
            items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, emoji: i.emoji })),
            subtotal,
            tax,
            total,
          }),
        });
        if (r.ok) {
          const data = await r.json();
          orderNum = data.orderNum || orderNum;
        } else throw new Error("API failed");
      } catch (_) {
        orders.push({
          num: orderNum,
          customer: nameInput,
          phone,
          notes,
          items: [...cart],
          subtotal,
          tax,
          total,
          status: "In Progress",
          time: new Date().toLocaleTimeString(),
        });
        saveOrders();
      }

      const successDetails = document.getElementById("success-details");
      const successOverlay = document.getElementById("success-overlay");
      if (successDetails) {
        successDetails.innerHTML = `
        <div class="order-label">Order number</div>
        <div class="order-value">#${orderNum}</div>
        <div class="order-label">Customer</div>
        <div class="order-value">${nameInput}</div>
        <div class="order-label">Phone</div>
        <div class="order-value">${phone}</div>
        <div class="order-items">
            <div class="order-label">Items</div>
            ${cart
              .map(
                (i) =>
                  `<div class="order-item"><span class="order-item-name">${i.name}<span class="order-item-qty">× ${i.qty}</span></span><span>$${(Number(i.price) * i.qty).toFixed(2)}</span></div>`
              )
              .join("")}
            <div class="order-total-row"><span>Total</span><span>$${total.toFixed(2)}</span></div>
        </div>
        ${notes ? `<div class="order-notes">Note: ${notes}</div>` : ""}`;
      }
      if (successOverlay) successOverlay.classList.add("open");
      cart = [];
      saveCart();
      updateCartBadge();
      if (nameEl) nameEl.value = "";
      if (phoneEl) phoneEl.value = "";
      if (notesEl) notesEl.value = "";
      loadLiveFeed();
    } catch (err) {
      console.error("Place order error:", err);
      showToast("Something went wrong. Please try again.");
    } finally {
      placeOrderSubmitting = false;
      if (btn) { btn.disabled = false; btn.textContent = "Place Order →"; }
    }
  }
  window.placeOrder = placeOrder;

  function closeSuccess() {
    document.getElementById("success-overlay").classList.remove("open");
    showView("menu");
  }
  window.closeSuccess = closeSuccess;

  function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  (function () {
    var searchEl = document.getElementById("menu-search");
    if (searchEl) {
      searchEl.addEventListener("input", function () {
        menuSearchQuery = searchEl.value || "";
        renderMenu();
      });
    }
  })();

  (async function () {
    await loadMenuFromApi();
    if (menuItems.length < 5) {
      menuItems = JSON.parse(JSON.stringify(DEFAULT_MENU));
      nextId = Math.max(0, ...menuItems.map((i) => i.id)) + 1;
      saveMenu();
    }
    renderMenu();
    loadLiveFeed();
    startLiveFeedPolling();
  })();

  setInterval(async function () {
    var prevSig = menuItems.length + "_" + menuItems.map(function (i) { return i.id + ":" + (i.active ? 1 : 0) + ":" + i.price; }).join(",");
    var ok = await loadMenuFromApi();
    if (!ok) return;
    var nextSig = menuItems.length + "_" + menuItems.map(function (i) { return i.id + ":" + (i.active ? 1 : 0) + ":" + i.price; }).join(",");
    if (prevSig === nextSig) return;
    saveMenu();
    renderMenu();
  }, 10000);

  window.addEventListener("wakedonalds-lang-change", function () {
    renderMenu();
    renderCart();
  });
})();
