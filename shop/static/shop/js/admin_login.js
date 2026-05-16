document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminLoginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value;

    try {
      const tokens = await apiFetch("/api/token/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setAccessToken(tokens.access);
      if (tokens.refresh) setRefreshToken(tokens.refresh);

      const me = await apiFetch("/api/auth/me/");
      if (!me.is_staff) {
        clearAuthTokens();
        showToast("This account is not an admin.", "error");
        return;
      }

      window.location.href = "/admin-portal/";
    } catch (err) {
      showToast(err.message || "Admin login failed.", "error");
    }
  });
});
