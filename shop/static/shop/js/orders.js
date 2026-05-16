function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch (_) {
    return value;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("ordersList");
  if (!root) return;

  root.innerHTML = "Loading...";
  try {
    const orders = await apiFetch("/api/orders/", { method: "GET" });

    if (!orders || orders.length === 0) {
      root.innerHTML = `<div class="muted">No orders yet.</div>`;
      return;
    }

    root.innerHTML = orders
      .map(
        (o) => `
        <div class="cart-summary" style="margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
            <div>
              <div style="font-weight:900;">Order #${o.order_number}</div>
              <div class="muted" style="font-size:12px;">Placed: ${formatDate(o.placed_at)}</div>
              <div class="muted" style="margin-top:6px;">
                Payment: ${o.payment_method} • <strong>${o.payment_status}</strong>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:900; font-size:16px;">${formatINR(o.total_in_inr)}</div>
              <a class="btn primary" style="margin-top:10px;" href="/track/${o.id}/">Track</a>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    root.innerHTML = err.message || "Failed to load orders.";
  }
});

