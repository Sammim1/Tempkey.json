let users = [];
let editIndex = null;

// Load data from localStorage or GitHub RAW JSON file
async function loadData() {
  const storedData = localStorage.getItem("usersData");

  if (storedData) {
    users = JSON.parse(storedData);
    renderTable();
  } else {
    try {
      const response = await fetch("https://raw.githubusercontent.com/Sammim1/Tempkey.json/main/Tempkey.json");
      if (!response.ok) throw new Error("Network response was not ok");
      users = await response.json();
      saveData();
      renderTable();
    } catch (error) {
      console.error("Failed to load JSON from GitHub:", error);
      alert("❌ GitHub থেকে ডেটা লোড করা যায়নি।");
      users = [];
    }
  }
}

// Save users array to localStorage
function saveData() {
  localStorage.setItem("usersData", JSON.stringify(users));
}

// Render the user table and JSON textarea
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

// Clear Add User form inputs
function clearAddForm() {
  document.getElementById("newId").value = "";
  document.getElementById("newUsername").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("newExpiresAt").value = "";
  document.getElementById("newAllowOffline").value = "true";
}

// Add new user to users array
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

// Load user data into Edit form
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

// Save edited user data
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

// Delete user
function deleteUser(index) {
  if (confirm("Are you sure to delete this user?")) {
    users.splice(index, 1);
    saveData();
    renderTable();
  }
}

// Copy JSON text to clipboard
function copyJSON() {
  const json = document.getElementById("jsonOutput");
  json.select();
  document.execCommand("copy");
  alert("Copied JSON to clipboard!");
}

// Save users from JSON textarea (merge)
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

// Refresh data directly from GitHub (discard local edits)
async function refreshFromGitHub() {
  if (!confirm("This will overwrite local changes with data from GitHub. Continue?")) return;
  try {
    const response = await fetch("https://raw.githubusercontent.com/Sammim1/Tempkey.json/main/Tempkey.json");
    if (!response.ok) throw new Error("Network response was not ok");
    users = await response.json();
    saveData();
    renderTable();
    alert("✅ GitHub থেকে নতুন ডেটা লোড হয়েছে!");
  } catch (error) {
    alert("❌ GitHub থেকে ডেটা লোড করা যায়নি: " + error.message);
  }
}

window.onload = () => {
  loadData();
};
