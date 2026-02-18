function getPoints() {
  return Number(localStorage.getItem("points")) || 0;
}

function updatePoints() {
  document.getElementById("pointsDisplay").innerText =
    `⭐ Points: ${getPoints()}`;
}

function earnPoints(amount) {
  localStorage.setItem("points", getPoints() + amount);
  updatePoints();
}

updatePoints();
