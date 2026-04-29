async function loadProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = "Loading...";
  const products = await apiFetch("/api/products/", { method: "GET" });
  grid.innerHTML = "";

  const term = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
  const filtered = products.filter((p) => (p.name || "").toLowerCase().includes(term));

  filtered.slice(0, 10).forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img
        src="${p.image_url}"
        alt="${p.name}"
        onerror="this.onerror=null;this.src=FALLBACK_IMAGE_URL;"
      />
      <div class="p-body">
        <div class="p-name">${p.name}</div>
        <div class="p-price">${formatINR(p.price_in_inr)}</div>
        <div class="p-actions">
          <input class="qty" type="number" min="1" value="1" id="qty_${p.id}" />
          <button class="btn primary" type="button" id="add_${p.id}">Add to Cart</button>
        </div>
        <div class="muted" style="margin-top:8px;font-size:12px;">${p.description ? p.description.slice(0, 55) : ""}</div>
      </div>
    `;

    card.querySelector(`#add_${p.id}`).addEventListener("click", () => {
      const qtyInput = card.querySelector(`#qty_${p.id}`);
      const qty = Number(qtyInput.value || 1);
      addToCart(p.id, qty);
      showToast("Added to cart!");
    });

    grid.appendChild(card);
  });
}

async function initIndexPage() {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");

  if (searchBtn) {
    searchBtn.addEventListener("click", () => loadProducts());
  }
  if (searchInput) {
    searchInput.addEventListener("input", () => loadProducts());
  }

  await loadProducts();
}

document.addEventListener("DOMContentLoaded", initIndexPage);

