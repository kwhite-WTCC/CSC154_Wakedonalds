let orders = JSON.parse(localStorage.getItem("orders")) || [];

document.getElementById("orders").innerHTML = orders.map(o => `
  <div>
    <h4>Order ${o.id}</h4>
    <p>${o.items.join(", ")}</p>
    <button onclick="update(${o.id}, 'Preparing')">Preparing</button>
    <button onclick="update(${o.id}, 'Ready')">Ready</button>
    <button onclick="update(${o.id}, 'Completed')">Complete</button>
  </div>
`).join("");

function update(id, status) {
  orders = orders.map(o => o.id === id ? { ...o, status } : o);
  localStorage.setItem("orders", JSON.stringify(orders));
  location.reload();
}
