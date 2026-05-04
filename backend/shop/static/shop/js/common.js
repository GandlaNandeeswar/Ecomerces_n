// Shared helpers for all pages (plain JS, no animations).

// Used when a product image URL fails to load.
const FALLBACK_IMAGE_URL = "https://via.placeholder.com/800x520.png?text=No+Image+Available";

function showToast(message, type = "success") {
  const containerId = "toastContainer";
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Auto-remove after a short time.
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    setTimeout(() => toast.remove(), 220);
  }, 2400);
}

function getAccessToken() {
  return localStorage.getItem("accessToken");
}

function setAccessToken(token) {
  localStorage.setItem("accessToken", token);
}

function setRefreshToken(token) {
  localStorage.setItem("refreshToken", token);
}

function formatINR(amount) {
  const num = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(num);
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function extractLastIntFromPath() {
  // Example: /track/12/ -> 12
  const parts = window.location.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  const val = parseInt(last, 10);
  return Number.isNaN(val) ? null : val;
}

async function apiFetch(path, options = {}) {
  const token = getAccessToken();
  const headers = Object.assign({}, options.headers || {});
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(path, Object.assign({}, options, { headers }));

  const isAuthEndpoint = path.startsWith("/api/token/") || path.startsWith("/api/auth/register/");
  if (res.status === 401 && !isAuthEndpoint) {
    window.location.href = "/auth/login/";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let err = null;
    let text = "";
    try {
      err = await res.json();
    } catch (_jsonError) {
      try {
        text = await res.text();
      } catch (_textError) {
        // ignore
      }
    }
    const msg =
      (err && (err.detail || err.message || (Array.isArray(err.non_field_errors) ? err.non_field_errors[0] : ""))) ||
      text ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  // If there's no content (204), return null.
  if (res.status === 204) return null;
  return res.json();
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "{}");
  } catch (_) {
    return {};
  }
}

function saveCart(cartObj) {
  localStorage.setItem("cart", JSON.stringify(cartObj));
}

function cartToItems(cartObj) {
  // cartObj: { [productId]: quantity }
  return Object.entries(cartObj)
    .map(([productId, quantity]) => ({
      product_id: parseInt(productId, 10),
      quantity: Number(quantity),
    }))
    .filter((x) => x.quantity > 0);
}

function getCartCount(cartObj) {
  return Object.values(cartObj).reduce((sum, q) => sum + Number(q || 0), 0);
}

function addToCart(productId, qty = 1) {
  const cart = loadCart();
  cart[productId] = (Number(cart[productId] || 0) + qty);
  saveCart(cart);
}

function updateCartQty(productId, qty) {
  const cart = loadCart();
  const q = Number(qty || 0);
  if (q <= 0) delete cart[productId];
  else cart[productId] = q;
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = loadCart();
  delete cart[productId];
  saveCart(cart);
}

