let users = [];
let editIndex = null;

// Load from localStorage or default user
function loadData() {
  const storedData = localStorage.getItem("usersData");
  if (storedData) {
    users = JSON.parse(storedData);
  } else {
    users = [
      {
        id: "6d95fal7c7e40bea",
        username: "dpmods",
        password: "dpmods",
        expiresAt: "2025-12-31",
        allowOffline: true
      }
    ];
    saveData();
  }
}

// Save users array to localStorage
function saveData() {
  localStorage.setItem("usersData", JSON.stringify(users));
}

// Render users table and JSON textarea
function renderTable() {
  const tbody = document.querySelector("#userTable tbody");
  tbody.innerHTML = "";
  users.forEach((user, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.password}</td>
      <td>${user.expiresAt}</td>
      <td>${user.allowOffline}</td>
      <td>
        <button class="action-btn" onclick="editUser(${index})">Edit</button>
        <button class="action-btn" onclick="deleteUser(${index})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById("jsonOutput").value = JSON.stringify(users, null, 2);
}

// Toggle Add User form visibility
function toggleAddForm() {
  document.getElementById("addForm").classList.toggle("hidden");
}

// Clear Add User form fields
function clearAddForm() {
  document.getElementById("newId").value = "";
  document.getElementById("newUsername").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("newExpiresAt").value = "";
  document.getElementById("newAllowOffline").value = "true";
}

// Add new user after validation
function addUser() {
  const id = document.getElementById("newId").value.trim();
  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value.trim();
  const expiresAt = document.getElementById("newExpiresAt").value;
  const allowOffline = document.getElementById("newAllowOffline").value === "true";

  if (!id || !username || !password || !expiresAt) {
    alert("Please fill in all fields.");
    return;
  }

  if (users.some(u => u.id === id)) {
    alert("ID already exists!");
    return;
  }

  users.push({ id, username, password, expiresAt, allowOffline });
  saveData();
  renderTable();
  toggleAddForm();
  clearAddForm();
}

// Fill Edit form with selected user data
function editUser(index) {
  editIndex = index;
  const user = users[index];
  document.getElementById("editId").value = user.id;
  document.getElementById("editUsername").value = user.username;
  document.getElementById("editPassword").value = user.password;
  document.getElementById("editExpiresAt").value = user.expiresAt;
  document.getElementById("editAllowOffline").value = user.allowOffline.toString();
  document.getElementById("editForm").classList.remove("hidden");
}

// Save edited user after validation
function saveEdit() {
  if (editIndex === null) return;

  const newId = document.getElementById("editId").value.trim();
  const newUsername = document.getElementById("editUsername").value.trim();
  const newPassword = document.getElementById("editPassword").value.trim();
  const newExpiresAt = document.getElementById("editExpiresAt").value;
  const newAllowOffline = document.getElementById("editAllowOffline").value === "true";

  if (!newId || !newUsername || !newPassword || !newExpiresAt) {
    alert("Please fill in all fields.");
    return;
  }

  const duplicateId = users.some((u, i) => u.id === newId && i !== editIndex);
  if (duplicateId) {
    alert("ID already exists! Please use a unique ID.");
    return;
  }

  users[editIndex] = {
    id: newId,
    username: newUsername,
    password: newPassword,
    expiresAt: newExpiresAt,
    allowOffline: newAllowOffline
  };

  saveData();
  renderTable();
  document.getElementById("editForm").classList.add("hidden");
  editIndex = null;
}

// Delete user with confirmation
function deleteUser(index) {
  if (confirm("Are you sure to delete this user?")) {
    users.splice(index, 1);
    saveData();
    renderTable();
  }
}

// Copy JSON from textarea to clipboard
function copyJSON() {
  const json = document.getElementById("jsonOutput");
  json.select();
  document.execCommand("copy");
  alert("Copied JSON to clipboard!");
}

// Save JSON from textarea (merge with existing users)
function saveFromTextarea() {
  try {
    const newUsers = JSON.parse(document.getElementById("jsonOutput").value);

    if (!Array.isArray(newUsers)) {
      alert("Invalid JSON format. Must be an array.");
      return;
    }

    const existingUsers = [...users];

    newUsers.forEach(newUser => {
      const index = existingUsers.findIndex(u => u.id === newUser.id);
      if (index !== -1) {
        existingUsers[index] = newUser;
      } else {
        existingUsers.push(newUser);
      }
    });

    users = existingUsers;
    saveData();
    renderTable();
    alert("Users merged and saved!");
  } catch (e) {
    alert("Invalid JSON: " + e.message);
  }
}

// Send JSON data to Telegram bot
function sendToTelegram() {
  const botToken = "7726781915:AAG4AGAOP2-FNvQ3H7j0AIAruf6TsgmmX9c";
  const chatId = "7598462592";
  const jsonData = document.getElementById("jsonOutput").value;

  const now = new Date();
  const timestamp = now.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });

  const message = `📦 *User JSON Data:*\n🕒 *Sent at:* ${timestamp}\n\`\`\`\n${jsonData}\n\`\`\``;

  fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown"
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.ok) {
        alert("✅ JSON sent to Telegram successfully!");
      } else {
        alert("❌ Failed to send to Telegram: " + data.description);
      }
    })
    .catch(error => {
      alert("❌ Error: " + error.message);
    });
}

// Load JSON from GitHub using API (with cache bypass)
function refreshFromGitHub() {
  const token = "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";
  const repo = "Sammim1/Tempkey.json";
  const path = "Tempkey.json";
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json"
    }
  })
    .then(res => res.json())
    .then(data => {
      const decodedContent = atob(data.content);
      users = JSON.parse(decodedContent);
      saveData();
      renderTable();
      alert("✅ JSON loaded from GitHub (latest)!");
    })
    .catch(error => {
      alert("❌ Failed to load from GitHub: " + error.message);
    });
}

// Upload JSON to GitHub using API
function uploadToGitHub() {
  const token = "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";
  const repo = "Sammim1/Tempkey.json";
  const path = "Tempkey.json";
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  // First get the SHA of existing file
  fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json"
    }
  })
    .then(res => res.json())
    .then(data => {
      const sha = data.sha;
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(users, null, 2))));

      fetch(apiUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          message: `Update JSON via Web UI at ${new Date().toLocaleString()}`,
          content: content,
          sha: sha
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.content) {
            alert("✅ JSON uploaded to GitHub successfully!");
          } else {
            alert("❌ Failed to upload JSON to GitHub");
          }
        })
        .catch(error => {
          alert("❌ Upload error: " + error.message);
        });
    })
    .catch(error => {
      alert("❌ Could not get file SHA: " + error.message);
    });
}

window.onload = () => {
  loadData();
  renderTable();
};
