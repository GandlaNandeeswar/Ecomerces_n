async function renderCart() {
  const itemsRoot = document.getElementById("cartItems");
  const summaryRoot = document.getElementById("cartSummary");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (!itemsRoot || !summaryRoot) return;

  itemsRoot.innerHTML = "";
  summaryRoot.innerHTML = "Loading...";

  const cart = loadCart();
  const cartEntries = Object.entries(cart);
  if (cartEntries.length === 0) {
    itemsRoot.innerHTML = `<div class="muted">Your cart is empty.</div>`;
    summaryRoot.innerHTML = "";
    if (checkoutBtn) checkoutBtn.removeAttribute("href");
    return;
  }

  const items = cartToItems(cart);
  const products = await Promise.all(
    items.map((it) => apiFetch(`/api/products/${it.product_id}/`, { method: "GET" }))
  );

  const total = products.reduce((sum, p, idx) => {
    const qty = items[idx].quantity;
    return sum + Number(p.price_in_inr) * qty;
  }, 0);

  itemsRoot.innerHTML = "";

  items.forEach((it, idx) => {
    const p = products[idx];
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div style="display:flex; gap:12px; align-items:center;">
        <img
          class="cart-img"
          src="${p.image_url}"
          alt="${p.name}"
          onerror="this.onerror=null;this.src=FALLBACK_IMAGE_URL;"
        />
        <div>
          <div class="row-title">${p.name}</div>
          <div class="muted" style="font-size:12px;">${formatINR(p.price_in_inr)} each</div>
        </div>
      </div>

      <div>
        <label class="muted" style="font-size:12px; font-weight:700;">Qty</label>
        <div style="margin-top:6px;">
          <input class="qty" type="number" min="1" value="${it.quantity}" data-product-id="${p.id}" style="width:90px;" />
        </div>
      </div>

      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
        <div style="font-weight:900;">${formatINR(Number(p.price_in_inr) * it.quantity)}</div>
        <button type="button" class="btn secondary" style="padding:8px 10px;" data-remove="${p.id}">Remove</button>
      </div>
    `;

    row.querySelector(`input.qty[data-product-id="${p.id}"]`).addEventListener("change", (e) => {
      const q = Number(e.target.value || 1);
      updateCartQty(p.id, q);
      renderCart();
    });

    row.querySelector(`[data-remove="${p.id}"]`).addEventListener("click", () => {
      removeFromCart(p.id);
      renderCart();
    });

    itemsRoot.appendChild(row);
  });

  summaryRoot.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div class="muted">Total Amount</div>
        <div style="font-weight:900;font-size:18px;">${formatINR(total)}</div>
      </div>
      <div class="muted" style="font-size:12px; max-width:340px; text-align:right;">
        Shipping is handled in demo; tracking will start right after placing order.
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", renderCart);

