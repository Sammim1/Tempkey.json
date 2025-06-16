const jsonData = [
  {
    "id": "6d95fal7c7e40bea",
    "username": "dpmods",
    "password": "dpmods",
    "expiresAt": "2025-12-31",
    "allowOffline": true
  },
  {
    "id": "android_device_id_2",
    "username": "user2",
    "password": "pass2",
    "expiresAt": "2025-11-30",
    "allowOffline": false
  }
];

function loadTable(data) {
  const tbody = document.querySelector('#dataTable tbody');
  tbody.innerHTML = '';

  data.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" value="${item.id}" /></td>
      <td><input type="text" value="${item.username}" /></td>
      <td><input type="text" value="${item.password}" /></td>
      <td><input type="date" value="${item.expiresAt}" /></td>
      <td><input type="checkbox" ${item.allowOffline ? 'checked' : ''} /></td>
      <td><button class="btn-delete" onclick="deleteRow(this)">🗑️</button></td>
    `;
    tbody.appendChild(row);
  });

  updateJSON();
}

function addRow() {
  const tbody = document.querySelector('#dataTable tbody');
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="text" value="" /></td>
    <td><input type="text" value="" /></td>
    <td><input type="text" value="" /></td>
    <td><input type="date" value="" /></td>
    <td><input type="checkbox" /></td>
    <td><button class="btn-delete" onclick="deleteRow(this)">🗑️</button></td>
  `;
  tbody.appendChild(row);
  updateJSON();
}

function deleteRow(button) {
  const row = button.closest('tr');
  row.remove();
  updateJSON();
}

function updateJSON() {
  const rows = document.querySelectorAll('#dataTable tbody tr');
  const data = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll('input');
    data.push({
      id: cells[0].value,
      username: cells[1].value,
      password: cells[2].value,
      expiresAt: cells[3].value,
      allowOffline: cells[4].checked
    });
  });

  document.getElementById('outputJSON').value = JSON.stringify(data, null, 2);
}

document.querySelector('#dataTable').addEventListener('input', updateJSON);

function copyJSON() {
  const textarea = document.getElementById("outputJSON");
  textarea.select();
  document.execCommand("copy");
  alert("✅ JSON copied to clipboard!");
}

loadTable(jsonData);
