let data = [];

function fetchData() {
  fetch('data.json')
    .then(res => res.json())
    .then(json => {
      data = json;
      renderTable();
    });
}

function renderTable() {
  const container = document.getElementById("table-container");
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Username</th>
        <th>Password</th>
        <th>Expires At</th>
        <th>Allow Offline</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      ${data.map((item, index) => `
        <tr>
          <td><input type="text" value="${item.id}" onchange="updateValue(${index}, 'id', this.value)" /></td>
          <td><input type="text" value="${item.username}" onchange="updateValue(${index}, 'username', this.value)" /></td>
          <td><input type="text" value="${item.password}" onchange="updateValue(${index}, 'password', this.value)" /></td>
          <td><input type="date" value="${item.expiresAt}" onchange="updateValue(${index}, 'expiresAt', this.value)" /></td>
          <td>
            <input type="checkbox" ${item.allowOffline ? "checked" : ""} onchange="updateValue(${index}, 'allowOffline', this.checked)" />
          </td>
          <td><button onclick="deleteRow(${index})">🗑️ Delete</button></td>
        </tr>
      `).join("")}
    </tbody>
  `;
  container.innerHTML = "";
  container.appendChild(table);
  updateOutput();
}

function updateValue(index, field, value) {
  data[index][field] = field === 'allowOffline' ? Boolean(value) : value;
  updateOutput();
}

function deleteRow(index) {
  data.splice(index, 1);
  renderTable();
}

function addRow() {
  data.push({
    id: "",
    username: "",
    password: "",
    expiresAt: "",
    allowOffline: false
  });
  renderTable();
}

function updateOutput() {
  document.getElementById("outputJSON").value = JSON.stringify(data, null, 2);
}

function copyJSON() {
  navigator.clipboard.writeText(document.getElementById("outputJSON").value);
  alert("JSON copied to clipboard!");
}

window.onload = fetchData;