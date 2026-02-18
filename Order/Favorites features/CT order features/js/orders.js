function checkout() {
  const total = cart.reduce((s, i) => s + i.price, 0);
  earnPoints(total);

  let orders = JSON.parse(localStorage.getItem("orders")) || [];
  orders.push({
    id: Date.now(),
    items: cart.map(i => i.name),
    status: "Pending"
  });

  localStorage.setItem("orders", JSON.stringify(orders));
  cart = [];
  window.location.href = "orders.html";
}
