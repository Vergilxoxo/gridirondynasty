// Sheet URLs
const sheets = {
  QB: "https://opensheet.elk.sh/1TmZedqXNrEZ-LtPxma7AemFsKOoHErFgZhjIOK3C0hc/QBSalary",
  WR: "https://opensheet.elk.sh/1TmZedqXNrEZ-LtPxma7AemFsKOoHErFgZhjIOK3C0hc/WR Salary"
};

let currentData = []; // aktuell geladene Tabelle

// Daten laden
async function loadSalary(position) {
  const res = await fetch(sheets[position]);
  const data = await res.json();
  currentData = data;
  renderTable(data);
}

// Tabelle rendern
function renderTable(data) {
  const tbody = document.querySelector("#salary-table tbody");
  tbody.innerHTML = "";

  data.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p["Player"] || "-"}</td>
      <td>${p["Salary"] || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Filter Input
function setupFilter() {
  const searchInput = document.getElementById("search-input");

  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();

    document.querySelectorAll("#salary-table tbody tr").forEach((row, index) => {
      const playerName = currentData[index]["Player"].toLowerCase();
      row.style.display = playerName.includes(filter) ? "" : "none";
    });
  });
}

// Dropdown wechseln
function setupDropdown() {
  const select = document.getElementById("position-select");
  select.addEventListener("change", () => {
    loadSalary(select.value);
    document.getElementById("search-input").value = "";
  });
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  setupFilter();
  setupDropdown();
  loadSalary("QB"); // Standard: QB
});
