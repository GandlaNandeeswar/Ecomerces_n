function setLoggedIn(tokens) {
  if (tokens.access) setAccessToken(tokens.access);
  if (tokens.refresh) setRefreshToken(tokens.refresh);
}

document.addEventListener("DOMContentLoaded", () => {
  // Signup page behaviors
  const signupForm = document.getElementById("signupForm");
  const togglePasswordBtn = document.getElementById("togglePasswordBtn");
  const signupPasswordInput = document.getElementById("signupPassword");

  if (signupForm && togglePasswordBtn && signupPasswordInput) {
    // Requirement: show the eye symbol only while user types password.
    togglePasswordBtn.style.display = "none";

    signupPasswordInput.addEventListener("input", () => {
      togglePasswordBtn.style.display = signupPasswordInput.value.length > 0 ? "inline-flex" : "none";
    });

    let shown = false;
    togglePasswordBtn.addEventListener("click", () => {
      shown = !shown;
      signupPasswordInput.type = shown ? "text" : "password";
    });

    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const payload = {
          username: document.getElementById("signupUsername").value.trim(),
          email: document.getElementById("signupEmail").value.trim(),
          password: signupPasswordInput.value,
        };
        const tokens = await apiFetch("/api/auth/register/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setLoggedIn(tokens);
        window.location.href = "/";
      } catch (err) {
        showToast(err.message || "Signup failed.", "error");
      }
    });
  }

  // Login page behaviors
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const payload = {
          username: document.getElementById("loginUsername").value.trim(),
          password: document.getElementById("loginPassword").value,
        };
        const tokens = await apiFetch("/api/token/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setLoggedIn(tokens);
        window.location.href = "/";
      } catch (err) {
        showToast(err.message || "Login failed.", "error");
      }
    });
  }
});

