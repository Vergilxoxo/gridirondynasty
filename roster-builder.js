//const leagueId = "1207768406841892864";
const leagueId = "1311998228123643904";

let builderRemovedSalary = 0;

// ----------------------------
// Daten laden
// ----------------------------
async function fetchSheetPlayers() {
  const res = await fetch("https://opensheet.elk.sh/1TmZedqXNrEZ-LtPxma7AemFsKOoHErFgZhjIOK3C0hc/Sheet1");
  return await res.json();
}

async function fetchCutSheet() {
  const res = await fetch("https://opensheet.elk.sh/1TmZedqXNrEZ-LtPxma7AemFsKOoHErFgZhjIOK3C0hc/CutSheet");
  return await res.json();
}

async function fetchSleeperPlayers() {
  const res = await fetch("https://api.sleeper.app/v1/players/nfl");
  return await res.json();
}

// ----------------------------
// Seite laden
// ----------------------------
async function loadRosterPage(rosterId) {

  builderRemovedSalary = 0;

  const sheetData = await fetchSheetPlayers();
  const sleeperData = await fetchSleeperPlayers();
  const cutSheetData = await fetchCutSheet();

  const rosterRes = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
  const rosters = await rosterRes.json();
  const roster = rosters.find(r => r.roster_id == rosterId);
  if (!roster) return;

  const rosterName = document.getElementById("roster-select").selectedOptions[0].textContent;

  const allIds = (roster.players || []).map(String);
  const taxiIds = (roster.taxi || []).map(String);
  const irIds = (roster.reserve || []).map(String);
  const activeIds = allIds.filter(id => !taxiIds.includes(id) && !irIds.includes(id));

  const yearCols = Array.from(
    new Set(sheetData.flatMap(p => Object.keys(p).filter(k => /^\d{4}$/.test(k))))
  ).sort();

  // Builder Spalte hinzugefügt
  const fixedCols = ["Builder","Player ID", "Name", "Position", "NFL Team", "Contract"];

  ["active-roster", "taxi-roster", "ir-roster"].forEach(tableId => {

    const row = document.getElementById(`${tableId}-header`);
    row.innerHTML = "";

    fixedCols.forEach(c => {
      const th = document.createElement("th");
      th.textContent = c;
      th.dataset.sort = c;
      th.style.cursor = "pointer";
      th.addEventListener("click", () => sortTable(tableId, th.cellIndex));
      row.appendChild(th);
    });

    yearCols.forEach(y => {
      const th = document.createElement("th");
      th.textContent = y;
      th.dataset.sort = y;
      th.style.cursor = "pointer";
      th.addEventListener("click", () => sortTable(tableId, th.cellIndex));
      row.appendChild(th);
    });

  });

  function mapPlayer(id) {
    const sleeper = Object.values(sleeperData).find(p => String(p.player_id) === id) || {};
    const sheet = sheetData.find(p => String(p["Player ID"]) === id) || {};
    return { ...sheet, ...sleeper };
  }

  function renderTable(tableId, ids) {

    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = "";

    ids.map(mapPlayer).forEach(p => {

      const tr = document.createElement("tr");
      const pos = p.position || "-";
      const contract = p.Contract || "0";

      let html = `
      <td>
        <input type="checkbox"
        class="builder-check"
        data-contract="${contract}">
      </td>

      <td>${p.player_id || p["Player ID"] || "-"}</td>
      <td>${p.full_name || "-"}</td>
      <td class="pos-${pos}">${pos}</td>
      <td>${p.team || "-"}</td>
      <td>${contract}</td>
      `;

      yearCols.forEach(y => html += `<td>${p[y] || "-"}</td>`);

      tr.innerHTML = html;
      tbody.appendChild(tr);

    });

  }

  renderTable("active-roster", activeIds);
  renderTable("taxi-roster", taxiIds);
  renderTable("ir-roster", irIds);

  // ----------------------------
  // Name Filter
  const nameFilter = document.getElementById("name-filter");
  nameFilter.oninput = () => {

    const filter = nameFilter.value.toLowerCase();

    ["active-roster","taxi-roster","ir-roster"].forEach(tableId => {

      const tbody = document.querySelector(`#${tableId} tbody`);

      Array.from(tbody.rows).forEach(r => {
        r.style.display =
        r.cells[2].textContent.toLowerCase().includes(filter) ? "" : "none";
      });

    });

  };

  // Positionsfilter
  const posSelect = document.getElementById("position-filter");
  const positionsSet = new Set();

  const rosterPlayerIds = [...activeIds, ...taxiIds, ...irIds];

  sheetData.forEach(p => {
    const id = String(p["Player ID"]);
    if (rosterPlayerIds.includes(id)) {
      const pos = (p.Position || '').toUpperCase().trim();
      if (pos) positionsSet.add(pos);
    }
  });

  Object.values(sleeperData).forEach(p => {
    const id = String(p.player_id);
    if (rosterPlayerIds.includes(id)) {
      const pos = (p.position || '').toUpperCase().trim();
      if (pos) positionsSet.add(pos);
    }
  });

  const positions = Array.from(positionsSet).sort();
  posSelect.innerHTML = '<option value="">Alle Positionen</option>';

  positions.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    posSelect.appendChild(option);
  });

  posSelect.onchange = () => {

    const val = posSelect.value.toUpperCase().trim();

    ["active-roster","taxi-roster","ir-roster"].forEach(tableId => {

      const tbody = document.querySelector(`#${tableId} tbody`);

      Array.from(tbody.rows).forEach(r => {

        const pos = (r.cells[3].textContent || '').toUpperCase().trim();
        r.style.display = !val || pos === val ? "" : "none";

      });

    });

  };

  renderDeadCapTable(cutSheetData, rosterName);
  renderSalaryCapBlock(sheetData, cutSheetData, rosterName, yearCols, activeIds, irIds);
  setupRosterVisibilityToggles();

}

// ----------------------------
// Checkbox Salary Simulation
// ----------------------------
document.addEventListener("change", function(e){

  if(!e.target.classList.contains("builder-check")) return;

  const contract = parseValue(e.target.dataset.contract);

  if(e.target.checked){
    builderRemovedSalary += contract;
  }else{
    builderRemovedSalary -= contract;
  }

  recalcSalaryBlock();

});

// ----------------------------
// Salary neu berechnen
// ----------------------------
function recalcSalaryBlock(){

  const table = document.querySelector("#salary-cap-block table");
  if(!table) return;

  const rows = table.querySelectorAll("tbody tr");

  const usedRow = rows[1];
  const spaceRow = rows[4];

  const usedCells = usedRow.querySelectorAll("td");
  const spaceCells = spaceRow.querySelectorAll("td");

  usedCells.forEach((cell,i)=>{

    const base = parseValue(cell.textContent);
    const newUsed = Math.max(0, base - builderRemovedSalary);

    cell.textContent =
    "$"+newUsed.toString().replace(/\B(?=(\d{3})+(?!\d))/g,".");

    const cap = 160000000;
    const newSpace = cap - newUsed;

    spaceCells[i].textContent =
    "$"+newSpace.toString().replace(/\B(?=(\d{3})+(?!\d))/g,".");

  });

}

// ----------------------------
// Helper
const parseValue = str => {
  if (!str) return 0;
  const num = str.toString().replace(/[^0-9]/g, '');
  return parseInt(num) || 0;
};

// ----------------------------
// Sortierung
function sortTable(tableId, colIndex) {
  const table = document.getElementById(tableId);
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);
  const asc = !table.dataset.asc || table.dataset.asc === "false";

  rows.sort((a,b) => {

    let aVal = a.cells[colIndex].textContent.replace(/\$|\./g,"");
    let bVal = b.cells[colIndex].textContent.replace(/\$|\./g,"");

    if(!isNaN(parseFloat(aVal)) && !isNaN(parseFloat(bVal))){
      return asc ? aVal-bVal : bVal-aVal;
    }

    return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);

  });

  rows.forEach(r => tbody.appendChild(r));
  table.dataset.asc = asc;
}

// ----------------------------
document.getElementById("roster-select").addEventListener("change", e => {
  loadRosterPage(e.target.value);
});

loadRosterPage(document.getElementById("roster-select").value);
