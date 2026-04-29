function renderTimeline(timeline) {
  const root = document.getElementById("timelineSteps");
  if (!root) return;

  if (!timeline || timeline.length === 0) {
    root.innerHTML = `<div class="muted">No timeline data yet.</div>`;
    return;
  }

  root.innerHTML = timeline
    .map((step) => {
      const done = step.completed ? "done" : "";
      return `
        <div class="timeline-step ${done}">
          <div class="dot"></div>
          <div style="font-weight:900;">${step.label}</div>
          <div class="muted" style="font-size:12px; margin-left:auto;">
            ${step.completed ? "Done" : "Pending"}
          </div>
        </div>
      `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const etaEl = document.getElementById("etaText");
  const paymentStatusBox = document.getElementById("paymentStatusBox");
  const orderId = extractLastIntFromPath();

  if (!orderId) {
    if (etaEl) etaEl.textContent = "Missing order id.";
    return;
  }

  let stop = false;

  async function refresh() {
    if (stop) return;
    try {
      const track = await apiFetch(`/api/orders/${orderId}/track/`, { method: "GET" });
      if (etaEl) etaEl.textContent = track.eta_text;
      if (paymentStatusBox) {
        paymentStatusBox.textContent = `Payment: ${track.payment_method} • ${track.payment_status}`;
      }
      renderTimeline(track.timeline);

      if (track.current_status === "Delivered") {
        stop = true;
      }
    } catch (err) {
      if (etaEl) etaEl.textContent = "Failed to load tracking.";
      // Keep trying if token expires; apiFetch will redirect on 401.
    }
  }

  await refresh();
  setInterval(refresh, 5000);
});

