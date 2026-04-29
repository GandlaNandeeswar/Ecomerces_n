function setActionsVisibility(method) {
  const actions = document.getElementById("paymentActions");
  if (actions) actions.style.display = "block";

  const cardActions = document.getElementById("cardActions");
  const upiActions = document.getElementById("upiActions");
  const codActions = document.getElementById("codActions");

  if (cardActions) cardActions.style.display = method === "CARD" ? "block" : "none";
  if (upiActions) upiActions.style.display = method === "UPI" ? "block" : "none";
  if (codActions) codActions.style.display = method === "COD" ? "block" : "none";
}

function buildPhonePeLink({ upiId, merchantName, amountInr, orderNumber }) {
  // Demo deep link. PhonePe may require a compatible browser/app environment.
  const amount = Number(amountInr || 0);
  const tn = `Order ${orderNumber}`;
  const tr = orderNumber;

  // Using a common “phonepe://pay” style intent.
  const url =
    `phonepe://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(merchantName)}` +
    `&am=${encodeURIComponent(amount.toString())}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(tn)}` +
    `&tr=${encodeURIComponent(tr)}`;
  return url;
}

document.addEventListener("DOMContentLoaded", async () => {
  const orderId = getQueryParam("order_id");
  const paymentInfo = document.getElementById("paymentInfo");

  if (!orderId) {
    if (paymentInfo) paymentInfo.innerHTML = "Missing order_id.";
    return;
  }

  if (paymentInfo) paymentInfo.innerHTML = "Loading...";

  try {
    const track = await apiFetch(`/api/orders/${orderId}/track/`, { method: "GET" });
    const orderNumber = track.order_number;
    const total = track.total_in_inr;
    const paymentMethod = track.payment_method;
    const paymentStatus = track.payment_status;

    if (paymentInfo) {
      paymentInfo.innerHTML = `
        <div style="font-weight:900;font-size:18px;">Order #${orderNumber}</div>
        <div class="muted" style="margin-top:6px;">Total: ${formatINR(total)}</div>
        <div style="margin-top:10px;" class="muted">Payment method: <strong>${paymentMethod}</strong></div>
        <div style="margin-top:6px;" class="muted">Payment status: <strong>${paymentStatus}</strong></div>
      `;
    }

    setActionsVisibility(paymentMethod);

    const upiActions = document.getElementById("upiActions");
    if (upiActions) {
      const phonePeLink = document.getElementById("phonePeLink");
      const upiId = "merchant@upi";
      const merchantName = "urstyle";

      if (phonePeLink) {
        phonePeLink.href = buildPhonePeLink({
          upiId,
          merchantName,
          amountInr: total,
          orderNumber,
        });
      }
    }

    const cardPayBtn = document.getElementById("cardPayBtn");
    if (cardPayBtn) {
      cardPayBtn.addEventListener("click", async () => {
        try {
          await apiFetch(`/api/orders/${orderId}/mark-paid/`, {
            method: "POST",
            body: JSON.stringify({ demo: true }),
          });
          window.location.href = `/track/${orderId}/`;
        } catch (err) {
          showToast(err.message || "Payment failed.", "error");
        }
      });
    }

    const upiConfirmBtn = document.getElementById("upiConfirmBtn");
    if (upiConfirmBtn) {
      upiConfirmBtn.addEventListener("click", async () => {
        try {
          await apiFetch(`/api/orders/${orderId}/mark-paid/`, {
            method: "POST",
            body: JSON.stringify({ demo: true }),
          });
          window.location.href = `/track/${orderId}/`;
        } catch (err) {
          showToast(err.message || "UPI confirm failed.", "error");
        }
      });
    }

    const codConfirmBtn = document.getElementById("codConfirmBtn");
    if (codConfirmBtn) {
      codConfirmBtn.addEventListener("click", () => {
        window.location.href = `/track/${orderId}/`;
      });
    }
  } catch (err) {
    if (paymentInfo) paymentInfo.innerHTML = err.message || "Payment load failed.";
  }
});

