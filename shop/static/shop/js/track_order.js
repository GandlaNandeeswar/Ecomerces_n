function renderTimeline(timeline) {
  const root = document.getElementById("timelineSteps");
  if (!root) return;

  if (!timeline || timeline.length === 0) {
    root.innerHTML = `<div class="muted">No timeline data yet.</div>`;
    return;
  }

  let currentIndex = timeline.findIndex((step) => !step.completed);
  if (currentIndex === -1) currentIndex = timeline.length - 1;

  root.innerHTML = `
    <div class="timeline-line-wrap">
      ${timeline
        .map((step, index) => {
          const done = step.completed ? "done" : "";
          const current = index === currentIndex ? "current" : "";
          return `
            <div class="timeline-step ${done} ${current}">
              <div class="timeline-label">${step.label}</div>
              <div class="dot"></div>
              <div class="timeline-status">${step.completed ? "Done" : "Pending"}</div>
              ${
                index === currentIndex
                  ? `<div class="timeline-truck" title="Current delivery step">
                      <svg viewBox="0 0 64 64" aria-hidden="true">
                        <rect x="5" y="24" width="30" height="15" rx="3" fill="#5A46FF"></rect>
                        <path d="M35 27H46L55 34V39H35V27Z" fill="#7A68FF"></path>
                        <rect x="40" y="29" width="8" height="4" rx="1" fill="#DBD7FF"></rect>
                        <circle cx="17" cy="42" r="5" fill="#1C1836"></circle>
                        <circle cx="46" cy="42" r="5" fill="#1C1836"></circle>
                        <circle cx="17" cy="42" r="2" fill="#F5F4FF"></circle>
                        <circle cx="46" cy="42" r="2" fill="#F5F4FF"></circle>
                        <polygon points="57,34 62,36 57,38" fill="#1C1836"></polygon>
                      </svg>
                    </div>`
                  : ""
              }
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const etaEl = document.getElementById("etaText");
  const currentStatusText = document.getElementById("currentStatusText");
  const orderedOnText = document.getElementById("orderedOnText");
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
      if (currentStatusText) currentStatusText.textContent = track.current_status;
      if (orderedOnText) {
        orderedOnText.textContent = new Date(track.placed_at).toLocaleString("en-IN");
      }
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

