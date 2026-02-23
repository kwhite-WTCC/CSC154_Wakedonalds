// Login & Register — Wakedonalds
(function () {
  const API = window.location.origin + "/api/auth";

  function switchTab(tab) {
    document.querySelectorAll(".tab").forEach((t, i) => {
      t.classList.toggle("active", (i === 0 && tab === "login") || (i === 1 && tab === "register"));
    });
    document.getElementById("loginPanel").classList.toggle("active", tab === "login");
    document.getElementById("registerPanel").classList.toggle("active", tab === "register");
  }

  function showMsg(id, type, text) {
    const el = document.getElementById(id);
    el.className = "message " + type;
    el.textContent = text;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
  }

  let redirectInterval = null;

  function startRedirecting(id, baseText) {
    let dots = 0;
    if (redirectInterval) {
      clearInterval(redirectInterval);
    }
    const el = document.getElementById(id);
    el.className = "message success";
    el.textContent = baseText + "...";
    redirectInterval = setInterval(() => {
      dots = (dots + 1) % 4;
      el.textContent = baseText + ".".repeat(dots);
    }, 300);
  }

  function stopRedirecting() {
    if (redirectInterval) {
      clearInterval(redirectInterval);
      redirectInterval = null;
    }
  }

  function continueAsGuest() {
    localStorage.setItem(
      "wakedonald_user",
      JSON.stringify({
        id: 0,
        name: "Guest",
        email: "guest@wakedonalds.com",
        role: "guest",
      })
    );
    window.location.href = "restaurant-pos.html";
  }

  async function handleLogin() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    if (!email || !password) return showMsg("loginMsg", "error", "Please fill in all fields.");
    if (!isValidEmail(email)) return showMsg("loginMsg", "error", "Please enter a valid email address (e.g. name@example.com).");
    try {
      const res = await fetch(API + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("wakedonald_user", JSON.stringify(data.user));
        startRedirecting("loginMsg", "Welcome back, " + data.user.name + "! Redirecting");
        setTimeout(() => {
          stopRedirecting();
          window.location.href = "restaurant-pos.html";
        }, 1200);
      } else {
        showMsg("loginMsg", "error", data.message);
      }
    } catch {
      showMsg("loginMsg", "error", "Cannot connect to server. Is it running?");
    }
  }

  async function handleRegister() {
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    if (!name || !email || !password) return showMsg("registerMsg", "error", "Please fill in all fields.");
    if (!isValidEmail(email)) return showMsg("registerMsg", "error", "Please enter a valid email address (e.g. name@example.com).");
    try {
      const res = await fetch(API + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg("registerMsg", "success", "Account created! Redirecting you to sign in...");
        startRedirecting("registerMsg", "Account created! Redirecting you to sign in");
        setTimeout(() => {
          stopRedirecting();
          switchTab("login");
          showMsg("loginMsg", "success", data.message + " Sign in below.");
        }, 1200);
      } else showMsg("registerMsg", "error", data.message);
    } catch {
      showMsg("registerMsg", "error", "Cannot connect to server. Is it running?");
    }
  }

  window.switchTab = switchTab;
  window.continueAsGuest = continueAsGuest;
  window.handleLogin = handleLogin;
  window.handleRegister = handleRegister;
})();
