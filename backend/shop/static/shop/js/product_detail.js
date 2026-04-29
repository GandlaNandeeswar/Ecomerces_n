async function loadProductDetail() {
  const root = document.getElementById("productDetail");
  if (!root) return;
  root.innerHTML = "Loading...";

  const productId = extractLastIntFromPath();
  if (!productId) {
    root.innerHTML = "Invalid product id.";
    return;
  }

  const product = await apiFetch(`/api/products/${productId}/`, { method: "GET" });

  root.innerHTML = `
    <div class="product-detail-grid">
      <div>
        <img
          class="detail-img"
          src="${product.image_url}"
          alt="${product.name}"
          onerror="this.onerror=null;this.src=FALLBACK_IMAGE_URL;"
        />
      </div>
      <div>
        <h2 style="margin-top:0;">${product.name}</h2>
        <div class="p-price" style="font-weight:900;font-size:18px;margin-bottom:10px;">
          ${formatINR(product.price_in_inr)}
        </div>
        <div class="muted">${product.description || ""}</div>

        <div style="margin-top:14px; display:flex; gap:10px; align-items:center;">
          <label style="font-weight:700;font-size:13px;">
            Quantity
            <input class="qty" type="number" min="1" value="1" id="detailQty" style="width:80px;" />
          </label>
          <button class="btn primary" id="detailAddBtn" type="button">Add to Cart</button>
        </div>
        <div style="margin-top:12px;">
          <a class="btn secondary" href="/cart/">Go to Cart</a>
        </div>
      </div>
    </div>
  `;

  const btn = document.getElementById("detailAddBtn");
  btn.addEventListener("click", () => {
    const qty = Number(document.getElementById("detailQty").value || 1);
    addToCart(productId, qty);
    showToast("Added to cart!");
  });
}

document.addEventListener("DOMContentLoaded", loadProductDetail);

