let users = [];
let editIndex = null;

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

function saveData() {
  localStorage.setItem("usersData", JSON.stringify(users));
}

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

function toggleAddForm() {
  document.getElementById("addForm").classList.toggle("hidden");
}

function clearAddForm() {
  document.getElementById("newId").value = "";
  document.getElementById("newUsername").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("newExpiresAt").value = "";
  document.getElementById("newAllowOffline").value = "true";
}

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

function deleteUser(index) {
  if (confirm("Are you sure to delete this user?")) {
    users.splice(index, 1);
    saveData();
    renderTable();
  }
}

function copyJSON() {
  const json = document.getElementById("jsonOutput");
  json.select();
  document.execCommand("copy");
  alert("Copied JSON to clipboard!");
}

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

window.onload = () => {
  loadData();
  renderTable();
};