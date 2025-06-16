const token = "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";
const repo = "Sammim1/Tempkey.json";
const filePath = "data.json";

async function loadJSON() {
    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
        headers: {
            Authorization: `token ${token}`
        }
    });
    const data = await response.json();
    const content = JSON.parse(atob(data.content));
    renderTable(content, data.sha);
}

function renderTable(json, sha) {
    const table = document.getElementById("data-table");
    table.innerHTML = "";
    const headers = Object.keys(json[0]);
    let headerRow = "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";
    table.innerHTML += headerRow;

    json.forEach((row, i) => {
        let rowHtml = "<tr>" + headers.map(h => `<td contenteditable='true' data-row='${i}' data-col='${h}'>${row[h]}</td>`).join("") + "</tr>";
        table.innerHTML += rowHtml;
    });

    table.dataset.sha = sha;
    table.dataset.json = JSON.stringify(json);
}

function saveToGitHub() {
    const table = document.getElementById("data-table");
    const rows = table.querySelectorAll("tr");
    const headers = Array.from(rows[0].children).map(th => th.textContent);
    const jsonData = [];

    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].children;
        const rowData = {};
        for (let j = 0; j < cells.length; j++) {
            rowData[headers[j]] = cells[j].textContent;
        }
        jsonData.push(rowData);
    }

    const content = btoa(JSON.stringify(jsonData, null, 2));
    const sha = table.dataset.sha;

    fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
        method: "PUT",
        headers: {
            Authorization: `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: "Update data.json from admin panel",
            content: content,
            sha: sha
        })
    })
    .then(res => res.json())
    .then(data => alert("Updated Successfully!"))
    .catch(err => alert("Update Failed!"));
}

loadJSON();