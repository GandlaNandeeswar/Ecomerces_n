document.addEventListener("DOMContentLoaded", () => {
  const navLogin = document.getElementById("navLogin");
  const navLogout = document.getElementById("navLogout");
  const navProfile = document.getElementById("navProfile");

  if (!navLogin || !navLogout || !navProfile) return;

  if (isLoggedIn()) {
    navLogin.style.display = "none";
    navLogout.style.display = "";
    navProfile.style.display = "";
  }

  navLogout.addEventListener("click", (e) => {
    e.preventDefault();
    clearAuthTokens();
    window.location.href = "/auth/login/";
  });
});
