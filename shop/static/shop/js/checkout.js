async function loadCheckoutSummary() {
  const summary = document.getElementById("checkoutSummary");
  if (!summary) return;

  const cart = loadCart();
  const entries = Object.entries(cart);
  if (entries.length === 0) {
    summary.innerHTML = `<div class="muted">Your cart is empty. Add items first.</div>`;
    return;
  }

  summary.innerHTML = "Loading...";
  const items = cartToItems(cart);

  const products = await Promise.all(items.map((it) => apiFetch(`/api/products/${it.product_id}/`, { method: "GET" })));
  let total = 0;
  const lines = items.map((it, idx) => {
    const p = products[idx];
    const line = Number(p.price_in_inr) * it.quantity;
    total += line;
    return `<div style="display:flex; justify-content:space-between; gap:12px; margin:8px 0;">
      <div>${p.name} <span class="muted" style="font-size:12px;">x ${it.quantity}</span></div>
      <div style="font-weight:900;">${formatINR(line)}</div>
    </div>`;
  });

  summary.innerHTML = `
    <div class="summary-box">
      ${lines.join("")}
      <hr style="border:none; border-top:1px solid #e8e8ef; margin:12px 0;" />
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div class="muted">Total</div>
        <div style="font-weight:900;font-size:18px;">${formatINR(total)}</div>
      </div>
    </div>
  `;
}

function getPaymentMethod() {
  const checked = document.querySelector('input[name="payment_method"]:checked');
  return checked ? checked.value : "CARD";
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCheckoutSummary();

  const form = document.getElementById("checkoutForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cart = loadCart();
    const items = cartToItems(cart);
    if (items.length === 0) {
      showToast("Cart is empty.", "error");
      return;
    }

    const payload = {
      payment_method: getPaymentMethod(),
      shipping: {
        full_name: document.getElementById("full_name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address_line1: document.getElementById("address_line1").value.trim(),
        address_line2: document.getElementById("address_line2").value.trim(),
        city: document.getElementById("city").value.trim(),
        state: document.getElementById("state").value.trim(),
        postal_code: document.getElementById("postal_code").value.trim(),
      },
      items,
    };

    try {
      const order = await apiFetch("/api/orders/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("activeOrderId", String(order.id));
      window.location.href = `/payment/?order_id=${order.id}`;
    } catch (err) {
      showToast(err.message || "Checkout failed.", "error");
    }
  });
});

