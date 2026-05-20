document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const signupContainer = document.getElementById("signup-container");
  const messageDiv = document.getElementById("message");
  const authToggle = document.getElementById("auth-toggle");
  const authPanel = document.getElementById("auth-panel");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const teacherStatus = document.getElementById("teacher-status");

  let authToken = sessionStorage.getItem("teacherAuthToken") || null;
  let teacherUsername = sessionStorage.getItem("teacherUsername") || null;

  function showMessage(type, text) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function getAuthHeaders() {
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  }

  function setTeacherMode(isTeacher) {
    if (isTeacher) {
      teacherStatus.textContent = `Logged in as ${teacherUsername}`;
      signupContainer.classList.remove("readonly");
      loginForm.classList.add("hidden");
      logoutBtn.classList.remove("hidden");
    } else {
      teacherStatus.textContent = "Not logged in";
      signupContainer.classList.add("readonly");
      loginForm.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
    }

    // Toggle unregister controls based on teacher session.
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.classList.toggle("hidden", !isTeacher);
    });
  }

  function clearTeacherSession() {
    authToken = null;
    teacherUsername = null;
    sessionStorage.removeItem("teacherAuthToken");
    sessionStorage.removeItem("teacherUsername");
    setTeacherMode(false);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn ${authToken ? "" : "hidden"}" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      setTeacherMode(Boolean(authToken));
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    if (!authToken) {
      showMessage("error", "Only logged-in teachers can unregister students.");
      return;
    }

    const button = event.target;
    const activity = button.dataset.activity;
    const email = button.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage("success", result.message);

        // Refresh activities list to show updated participants
        fetchActivities();
      } else if (response.status === 401) {
        clearTeacherSession();
        showMessage("error", "Session expired. Please log in again.");
      } else {
        showMessage("error", result.detail || "An error occurred");
      }
    } catch (error) {
      showMessage("error", "Failed to unregister. Please try again.");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!authToken) {
      showMessage("error", "Only logged-in teachers can register students.");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage("success", result.message);
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else if (response.status === 401) {
        clearTeacherSession();
        showMessage("error", "Session expired. Please log in again.");
      } else {
        showMessage("error", result.detail || "An error occurred");
      }
    } catch (error) {
      showMessage("error", "Failed to sign up. Please try again.");
      console.error("Error signing up:", error);
    }
  });

  authToggle.addEventListener("click", () => {
    authPanel.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    if (!authPanel.contains(event.target) && !authToggle.contains(event.target)) {
      authPanel.classList.add("hidden");
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("teacher-username").value;
    const password = document.getElementById("teacher-password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      if (!response.ok) {
        showMessage("error", result.detail || "Login failed.");
        return;
      }

      authToken = result.token;
      teacherUsername = result.username;
      sessionStorage.setItem("teacherAuthToken", authToken);
      sessionStorage.setItem("teacherUsername", teacherUsername);
      loginForm.reset();
      authPanel.classList.add("hidden");
      setTeacherMode(true);
      showMessage("success", `Welcome, ${teacherUsername}.`);
      fetchActivities();
    } catch (error) {
      showMessage("error", "Login failed. Please try again.");
      console.error("Error logging in:", error);
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      if (authToken) {
        await fetch("/auth/logout", {
          method: "POST",
          headers: getAuthHeaders(),
        });
      }
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      clearTeacherSession();
      authPanel.classList.add("hidden");
      showMessage("info", "Logged out.");
      fetchActivities();
    }
  });

  // Initialize app
  setTeacherMode(Boolean(authToken));
  fetchActivities();
});
