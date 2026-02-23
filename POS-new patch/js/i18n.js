// Site-wide translations (English / Spanish)
(function () {
  var STORAGE_KEY = "wakedonalds_lang";

  window.TRANSLATIONS = {
    lang_en: { en: "English", es: "English" },
    lang_es: { en: "Spanish", es: "Español" },
    nav_order_history: { en: "Order History", es: "Historial de pedidos" },
    nav_admin: { en: "Admin", es: "Administrar" },
    nav_logout: { en: "Logout", es: "Cerrar sesión" },
    nav_view_order: { en: "View Order", es: "Ver pedido" },
    nav_back_menu: { en: "← Back to Menu", es: "← Volver al menú" },
    nav_search_food: { en: "Search food…", es: "Buscar comida…" },
    cart_your_order: { en: "Your Order", es: "Tu pedido" },
    cart_order_items: { en: "Order Items", es: "Artículos del pedido" },
    cart_order_summary: { en: "Order Summary", es: "Resumen del pedido" },
    cart_customer_name: { en: "Customer Name", es: "Nombre del cliente" },
    cart_phone: { en: "Phone Number", es: "Teléfono" },
    cart_special_notes: { en: "Special Notes", es: "Notas especiales" },
    cart_place_order: { en: "Place Order →", es: "Hacer pedido →" },
    cart_empty: { en: "Your order is empty.", es: "Tu pedido está vacío." },
    cart_empty_sub: { en: "Head back to the menu to add items.", es: "Vuelve al menú para agregar artículos." },
    cart_live_feed: { en: "Live Orders", es: "Pedidos en vivo" },
    cart_my_orders: { en: "Your Orders", es: "Tus pedidos" },
    cart_my_orders_sub: { en: "Status updates", es: "Estado de tus pedidos" },
    cart_no_orders: { en: "No orders yet", es: "Aún no hay pedidos" },
    success_title: { en: "Order Placed!", es: "¡Pedido realizado!" },
    success_sub: { en: "Your order has been sent to the kitchen.<br>We'll have it ready shortly.", es: "Tu pedido fue enviado a la cocina.<br>Lo tendremos listo en breve." },
    success_back: { en: "Back to Menu", es: "Volver al menú" },
    index_sign_in: { en: "Sign In", es: "Iniciar sesión" },
    index_sign_up: { en: "Sign Up", es: "Registrarse" },
    index_email: { en: "Email", es: "Correo electrónico" },
    index_password: { en: "Password", es: "Contraseña" },
    index_full_name: { en: "Full Name", es: "Nombre completo" },
    index_create_account: { en: "Create Account →", es: "Crear cuenta →" },
    index_sign_in_btn: { en: "Sign In →", es: "Iniciar sesión →" },
    index_continue_guest: { en: "Continue as Guest", es: "Continuar como invitado" },
    index_no_account: { en: "No account needed — browse & order instantly", es: "No necesitas cuenta — navega y pide al instante" },
    index_or: { en: "or", es: "o" },
    admin_title: { en: "Admin", es: "Administración" },
    admin_overview: { en: "Overview", es: "Resumen" },
    admin_menu_items: { en: "Menu Items", es: "Artículos del menú" },
    admin_all_orders: { en: "All Orders", es: "Todos los pedidos" },
    admin_dashboard: { en: "Dashboard", es: "Panel" },
    admin_add_item: { en: "Add Item", es: "Agregar artículo" },
    admin_recent_orders: { en: "Recent Orders", es: "Pedidos recientes" },
    admin_search_orders: { en: "Search orders", es: "Buscar pedidos" },
    admin_filter_date: { en: "Filter by date", es: "Filtrar por fecha" },
    admin_clear_filters: { en: "Clear filters", es: "Limpiar filtros" },
    admin_users: { en: "Users", es: "Usuarios" },
    admin_users_desc: { en: "Manage user accounts and roles.", es: "Gestionar cuentas y roles de usuarios." },
    admin_search_users: { en: "Search users", es: "Buscar usuarios" },
    admin_users_role_note: { en: "Role changes take effect after the user logs out and signs back in.", es: "Los cambios de rol se aplican cuando el usuario cierra sesión y vuelve a entrar." },
    admin_make_admin: { en: "Make admin", es: "Hacer admin" },
    admin_make_customer: { en: "Make customer", es: "Hacer cliente" },
    oh_title: { en: "Order History", es: "Historial de pedidos" },
    oh_show_orders_from: { en: "Show orders from", es: "Mostrar pedidos del" },
    oh_show_all: { en: "Show all", es: "Ver todos" },
    oh_no_orders: { en: "No orders yet", es: "Aún no hay pedidos" },
    oh_no_orders_day: { en: "No orders on this day", es: "No hay pedidos en este día" },
    oh_browse_menu: { en: "Browse Menu", es: "Ver menú" },
    oh_sign_in_to_see: { en: "Sign in to see your orders", es: "Inicia sesión para ver tus pedidos" },
    oh_sign_in_desc: { en: "Order history is available when you sign in.", es: "El historial está disponible cuando inicias sesión." },
    oh_sign_in: { en: "Sign In", es: "Iniciar sesión" },
    add_to_order: { en: "+ Add to Order", es: "+ Agregar al pedido" },
    tag_popular: { en: "Popular", es: "Popular" },
    tag_veg: { en: "Veg", es: "Veg" },
    tag_spicy: { en: "Spicy", es: "Picante" },
    items: { en: "items", es: "artículos" },
    item: { en: "item", es: "artículo" },
    menu_desc_1: { en: "Crispy golden fries", es: "Papas fritas doradas y crujientes" },
    menu_desc_2: { en: "Flour tortilla, seasoned beef, nacho cheese, lettuce, tomato", es: "Tortilla de harina, carne sazonada, queso nacho, lechuga, tomate" },
    menu_desc_3: { en: "Rich pork broth, noodles, chashu pork, soft-boiled egg", es: "Caldo de cerdo, fideos, cerdo chashu, huevo tibio" },
    menu_desc_4: { en: "Crispy chicken filet, lettuce, pickles, brioche bun", es: "Pollo crujiente, lechuga, pepinillos, pan brioche" },
    menu_desc_5: { en: "Beef patty, cheese, lettuce, tomato, special sauce", es: "Hamburguesa de res, queso, lechuga, tomate, salsa especial" },
    menu_desc_6: { en: "All-beef frank, mustard, ketchup, relish", es: "Salchicha de res, mostaza, kétchup, relish" },
    menu_desc_7: { en: "Rigatoni, spicy tomato sauce, parmigiano", es: "Rigatoni, salsa de tomate picante, parmesano" },
    menu_desc_8: { en: "Creamy cheddar sauce, elbow pasta, breadcrumb topping", es: "Salsa de cheddar cremosa, pasta coditos, crujiente de pan" },
    menu_desc_9: { en: "Vanilla soft serve, cone or cup", es: "Helado suave de vainilla, cono o copa" },
    menu_desc_10: { en: "Warm fudge brownie, powdered sugar", es: "Brownie de chocolate caliente, azúcar en polvo" },
    menu_desc_11: { en: "Flaky crust, cinnamon apple filling", es: "Masa hojaldrada, relleno de manzana y canela" },
    menu_desc_12: { en: "Cold bottled water", es: "Agua embotellada fría" },
    menu_desc_13: { en: "Coke, Sprite, or Dr. Pepper", es: "Coca-Cola, Sprite o Dr. Pepper" },
    menu_desc_14: { en: "Vanilla, chocolate, or strawberry", es: "Vainilla, chocolate o fresa" }
  };

  function getLang() {
    try {
      var L = localStorage.getItem(STORAGE_KEY);
      return L === "es" ? "es" : "en";
    } catch (_) {
      return "en";
    }
  }

  function setLang(lang) {
    var L = lang === "es" ? "es" : "en";
    try {
      localStorage.setItem(STORAGE_KEY, L);
    } catch (_) {}
    document.documentElement.lang = L === "es" ? "es" : "en";
    applyTranslations();
    try {
      window.dispatchEvent(new CustomEvent("wakedonalds-lang-change"));
    } catch (_) {}
  }

  function applyTranslations() {
    var lang = getLang();
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var t = window.TRANSLATIONS[key];
      if (t && t[lang]) el.textContent = t[lang];
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      var t = window.TRANSLATIONS[key];
      if (t && t[lang]) el.innerHTML = t[lang];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      var t = window.TRANSLATIONS[key];
      if (t && t[lang]) el.placeholder = t[lang];
    });
  }

  window.t = function (key) {
    var lang = getLang();
    var tr = window.TRANSLATIONS[key];
    return (tr && tr[lang]) ? tr[lang] : key;
  };
  window.getMenuDesc = function (item) {
    if (!item) return "";
    var lang = getLang();
    var key = "menu_desc_" + item.id;
    var tr = window.TRANSLATIONS[key];
    if (tr && tr[lang]) return tr[lang];
    if (lang === "es" && item.desc_es && String(item.desc_es).trim()) return String(item.desc_es).trim();
    return item.desc || "";
  };
  window.getLang = getLang;
  window.setLang = setLang;
  window.applyTranslations = applyTranslations;
  setLang(getLang());

  var sel = document.getElementById("lang-select");
  if (sel) {
    sel.value = getLang();
    sel.addEventListener("change", function () {
      setLang(sel.value);
    });
  }
})();
