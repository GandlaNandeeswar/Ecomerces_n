function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderTable(title, rows) {
  if (!rows || !rows.length) {
    return `<section class="db-table-block"><h3>${escapeHtml(title)} (0)</h3><p class="muted">No rows.</p></section>`;
  }

  const columns = Object.keys(rows[0]);
  const head = columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
  const body = rows
    .map((row) => {
      const cells = columns
        .map((c) => `<td>${escapeHtml(typeof row[c] === "object" ? JSON.stringify(row[c]) : row[c])}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `
    <section class="db-table-block">
      <h3>${escapeHtml(title)} (${rows.length})</h3>
      <div class="data-table-wrap">
        <table class="data-table data-table-compact">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const summaryEl = document.getElementById("dbSummary");
  const tablesEl = document.getElementById("dbTables");

  try {
    await requireAdmin();
    const data = await apiFetch("/api/admin/database/");

    const counts = data.counts || {};
    summaryEl.innerHTML = `
      <p><strong>Database file:</strong> ${escapeHtml(data.database_file)}</p>
      <p>
        Users: ${counts.users || 0} ·
        Profiles: ${counts.user_profiles || 0} ·
        Products: ${counts.products || 0} ·
        Orders: ${counts.orders || 0} ·
        Order items: ${counts.order_items || 0}
      </p>`;

    const tables = data.tables || {};
    tablesEl.innerHTML = [
      renderTable("Users", tables.users),
      renderTable("User profiles", tables.user_profiles),
      renderTable("Products", tables.products),
      renderTable("Orders", tables.orders),
      renderTable("Order items", tables.order_items),
    ].join("");
  } catch (_err) {
    summaryEl.textContent = "Unable to load database.";
  }
});
