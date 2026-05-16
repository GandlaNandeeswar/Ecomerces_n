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
      const username = document.getElementById("signupUsername").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = signupPasswordInput.value;

      if (!username || !password) {
        showToast("Username and password are required.", "error");
        return;
      }

      try {
        const payload = {
          username,
          email,
          password,
        };
        const tokens = await apiFetch("/api/auth/register/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setLoggedIn(tokens);
        window.location.href = "/profile/";
      } catch (err) {
        showToast(err.message || "Signup failed.", "error");
      }
    });
  }

  // Login page behaviors
  const loginForm = document.getElementById("loginForm");
  const loginPasswordInput = document.getElementById("loginPassword");
  const toggleLoginPasswordBtn = document.getElementById("toggleLoginPasswordBtn");

  if (loginPasswordInput && toggleLoginPasswordBtn) {
    toggleLoginPasswordBtn.style.display = "none";

    loginPasswordInput.addEventListener("input", () => {
      toggleLoginPasswordBtn.style.display = loginPasswordInput.value.length > 0 ? "inline-flex" : "none";
    });

    let loginPasswordShown = false;
    toggleLoginPasswordBtn.addEventListener("click", () => {
      loginPasswordShown = !loginPasswordShown;
      loginPasswordInput.type = loginPasswordShown ? "text" : "password";
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("loginUsername").value.trim();
      const password = document.getElementById("loginPassword").value;

      if (!username || !password) {
        showToast("Enter username and password.", "error");
        return;
      }

      try {
        const payload = {
          username,
          password,
        };
        const tokens = await apiFetch("/api/token/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setLoggedIn(tokens);
        window.location.href = "/profile/";
      } catch (err) {
        showToast(err.message || "Invalid username or password.", "error");
      }
    });
  }
});

