let cart = [];

function toggleFavorite(id) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites.includes(id)
    ? favorites = favorites.filter(f => f !== id)
    : favorites.push(id);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateStars();
}

function updateStars() {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  document.querySelectorAll("button").forEach(btn => {
    if (btn.innerText === "☆" || btn.innerText === "⭐") {
      const id = btn.getAttribute("onclick")?.match(/'(.*?)'/)?.[1];
      if (id) btn.innerText = favorites.includes(id) ? "⭐" : "☆";
    }
  });
}

function addToCart(name, price) {
  cart.push({ name, price });
  alert(`${name} added`);
}

window.onload = updateStars;