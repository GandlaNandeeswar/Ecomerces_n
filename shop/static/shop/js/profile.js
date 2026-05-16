document.addEventListener("DOMContentLoaded", async () => {
  try {
    await requireLogin("/auth/login/?next=/profile/");
    const profile = await apiFetch("/api/profile/me/");

    document.getElementById("profileUsername").value = profile.username || "";
    document.getElementById("profileEmail").value = profile.email || "";
    document.getElementById("profileFullName").value = profile.full_name || "";
    document.getElementById("profilePhone").value = profile.phone || "";
    document.getElementById("profileAddress1").value = profile.address_line1 || "";
    document.getElementById("profileAddress2").value = profile.address_line2 || "";
    document.getElementById("profileCity").value = profile.city || "";
    document.getElementById("profileState").value = profile.state || "";
    document.getElementById("profilePostal").value = profile.postal_code || "";
  } catch (_err) {
    return;
  }

  const form = document.getElementById("profileForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      email: document.getElementById("profileEmail").value.trim(),
      full_name: document.getElementById("profileFullName").value.trim(),
      phone: document.getElementById("profilePhone").value.trim(),
      address_line1: document.getElementById("profileAddress1").value.trim(),
      address_line2: document.getElementById("profileAddress2").value.trim(),
      city: document.getElementById("profileCity").value.trim(),
      state: document.getElementById("profileState").value.trim(),
      postal_code: document.getElementById("profilePostal").value.trim(),
    };

    try {
      await apiFetch("/api/profile/me/", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      showToast("Profile saved.", "success");
    } catch (err) {
      showToast(err.message || "Could not save profile.", "error");
    }
  });
});
