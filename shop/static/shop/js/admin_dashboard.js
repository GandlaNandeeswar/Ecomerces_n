function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderProductsTable(products) {
  const container = document.getElementById("adminProductsTable");
  if (!products.length) {
    container.innerHTML = "<p class='muted'>No products yet.</p>";
    return;
  }

  const rows = products
    .map(
      (p) => `
      <tr data-id="${p.id}">
        <td><input class="table-input" data-field="name" type="text" value="${escapeHtml(p.name)}" /></td>
        <td><input class="table-input" data-field="price_in_inr" type="number" min="0" step="0.01" value="${escapeHtml(p.price_in_inr)}" /></td>
        <td><input class="table-input table-input-sm" data-field="stock_quantity" type="number" min="0" value="${escapeHtml(p.stock_quantity)}" /></td>
        <td><input class="table-input" data-field="image_url" type="url" value="${escapeHtml(p.image_url)}" /></td>
        <td><textarea class="table-input" data-field="description" rows="2">${escapeHtml(p.description || "")}</textarea></td>
        <td><input type="checkbox" data-field="is_active" ${p.is_active ? "checked" : ""} /></td>
        <td class="table-actions">
          <button class="btn secondary btn-sm" data-action="save">Save</button>
          <button class="btn secondary btn-sm" data-action="delete">Delete</button>
        </td>
      </tr>`
    )
    .join("");

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Image URL</th>
          <th>Description</th>
          <th>Active</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  container.querySelectorAll("tbody tr").forEach((row) => {
    const id = row.getAttribute("data-id");
    row.querySelector('[data-action="save"]').addEventListener("click", () => saveProductRow(id, row));
    row.querySelector('[data-action="delete"]').addEventListener("click", () => deleteProduct(id));
  });
}

async function saveProductRow(id, row) {
  const payload = {
    name: row.querySelector('[data-field="name"]').value.trim(),
    price_in_inr: row.querySelector('[data-field="price_in_inr"]').value,
    stock_quantity: Number(row.querySelector('[data-field="stock_quantity"]').value || 0),
    image_url: row.querySelector('[data-field="image_url"]').value.trim(),
    description: row.querySelector('[data-field="description"]').value.trim(),
    is_active: row.querySelector('[data-field="is_active"]').checked,
  };

  try {
    await apiFetch(`/api/products/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    showToast("Product updated.", "success");
  } catch (err) {
    showToast(err.message || "Update failed.", "error");
  }
}

async function deleteProduct(id) {
  if (!window.confirm("Delete this product?")) return;
  try {
    await apiFetch(`/api/products/${id}/`, { method: "DELETE" });
    showToast("Product deleted.", "success");
    await loadProducts();
  } catch (err) {
    showToast(err.message || "Delete failed.", "error");
  }
}

async function loadProducts() {
  const products = await apiFetch("/api/products/");
  renderProductsTable(products);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await requireAdmin();
    await loadProducts();
  } catch (_err) {
    return;
  }

  const addForm = document.getElementById("addProductForm");
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("newName").value.trim(),
      price_in_inr: document.getElementById("newPrice").value,
      stock_quantity: Number(document.getElementById("newStock").value || 0),
      image_url: document.getElementById("newImage").value.trim(),
      description: document.getElementById("newDescription").value.trim(),
      is_active: document.getElementById("newActive").checked,
    };

    try {
      await apiFetch("/api/products/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Product added.", "success");
      addForm.reset();
      document.getElementById("newStock").value = "50";
      document.getElementById("newActive").checked = true;
      await loadProducts();
    } catch (err) {
      showToast(err.message || "Could not add product.", "error");
    }
  });
});
