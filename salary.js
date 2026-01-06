const sheetUrl = "https://opensheet.elk.sh/1TmZedqXNrEZ-LtPxma7AemFsKOoHErFgZhjIOK3C0hc/QBSalary";

async function loadQBSalary() {
  const res = await fetch(sheetUrl);
  const data = await res.json();

  const tbody = document.querySelector("#qb-salary-table tbody");
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
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");

  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    document.querySelectorAll("#qb-salary-table tbody tr").forEach(row => {
      const playerName = row.firstElementChild.textContent.toLowerCase();
      row.style.display = playerName.includes(filter) ? "" : "none";
    });
  });

  loadQBSalary();
});
