const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
document.getElementById("list").innerHTML =
  favorites.map(f => `<p>${f}</p>`).join("");
