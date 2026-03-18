// ----------------------------
// Settings
// ----------------------------
const leagueId = "1311998228123643904";

// ----------------------------
// Helfer
// ----------------------------
const parseValue = str => {
  if (!str) return 0;
  const num = str.toString().replace(/[^0-9]/g, '');
  return parseInt(num) || 0;
};

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

  // Jahres-Spalten
  const yearCols = Array.from(new Set(sheetData.flatMap(p => Object.keys(p).filter(k => /^\d{4}$/.test(k))))).sort();
  const fixedCols = ["Player ID", "Name", "Position", "NFL Team", "Contract"];

  // Tabellen Header bauen
  ["active-roster","taxi-roster","ir-roster"].forEach(tableId => {
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
    return {...sheet, ...sleeper};
  }

  function renderTable(tableId, ids) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = "";
    ids.map(mapPlayer).forEach(p => {
      const tr = document.createElement("tr");
      const pos = p.position || "-";
      let html = `
        <td>${p.player_id || p["Player ID"] || "-"}</td>
        <td>${p.full_name || p["Name"] || "-"}</td>
        <td class="pos-${pos}">${pos}</td>
        <td>${p.team || "-"}</td>
        <td>${p.Contract || "-"}</td>
      `;
      yearCols.forEach(y => html += `<td>${p[y] || "-"}</td>`);
      tr.innerHTML = html;
      tbody.appendChild(tr);
    });
  }

  renderTable("active-roster", activeIds);
  renderTable("taxi-roster", taxiIds);
  renderTable("ir-roster", irIds);

  // Filter Name
  const nameFilter = document.getElementById("name-filter");
  nameFilter.oninput = () => {
    const filter = nameFilter.value.toLowerCase();
    ["active-roster","taxi-roster","ir-roster"].forEach(tableId => {
      const tbody = document.querySelector(`#${tableId} tbody`);
      Array.from(tbody.rows).forEach(r => r.style.display = r.cells[1].textContent.toLowerCase().includes(filter) ? "" : "none");
    });
  };

  // Positionsfilter
  const posSelect = document.getElementById("position-filter");
  const positionsSet = new Set();
  [...activeIds,...taxiIds,...irIds].forEach(id => {
    const sheet = sheetData.find(p => String(p["Player ID"]) === id);
    const sleeper = Object.values(sleeperData).find(p => String(p.player_id) === id);
    [sheet,sleeper].forEach(p => {
      const pos = (p?.Position || p?.position || '').toUpperCase().trim();
      if(pos) positionsSet.add(pos);
    });
  });
  posSelect.innerHTML = '<option value="">Alle Positionen</option>';
  Array.from(positionsSet).sort().forEach(p => {
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
        const pos = (r.cells[2].textContent || '').toUpperCase().trim();
        r.style.display = !val || pos === val ? "" : "none";
      });
    });
  };

  // Dead Cap Tabelle
  renderDeadCapTable(cutSheetData, rosterName);

  // Salary Cap Block
  renderSalaryCapBlock(sheetData, cutSheetData, rosterName, yearCols, activeIds, irIds);

  // Checkboxen Builder
  renderBuilderCheckboxes(sheetData, activeIds);
  setupRosterVisibilityToggles();
}

// ----------------------------
// Dead Cap Tabelle
// ----------------------------
function renderDeadCapTable(data, rosterName) {
  const header = document.getElementById("deadcap-header");
  const tbody = document.querySelector("#deadcap-table tbody");
  header.innerHTML = "";
  tbody.innerHTML = "";
  if(!data.length) return;

  const fixedCols = ["Name","Status"];
  const yearCols = Array.from(new Set(data.flatMap(r => Object.keys(r).filter(k => /^\d{4}$/.test(k))))).sort();
  const cols = [...fixedCols, ...yearCols];

  cols.forEach(c => {
    const th = document.createElement("th");
    th.textContent = c;
    header.appendChild(th);
  });

  data.filter(r => r.Owner === rosterName).forEach(row => {
    const tr = document.createElement("tr");
    cols.forEach(c => {
      const td = document.createElement("td");
      td.textContent = row[c] || "-";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// ----------------------------
// Salary Cap Block
// ----------------------------
function renderSalaryCapBlock(sheetData, cutSheetData, rosterName, yearCols, activeIds, irIds) {
  const teamCap = 160000000;
  const containerId = "salary-cap-block";

  let container = document.getElementById(containerId);
  if(!container){
    container = document.createElement("div");
    container.id = containerId;
    container.className = "filter-container";
    container.style.flexDirection = "column";
    container.style.marginBottom = "15px";
    const filters = document.querySelector(".filter-container");
    filters.parentNode.insertBefore(container, filters);
  }
  container.innerHTML = "";

  const activePlayers = activeIds.map(id => sheetData.find(p => String(p["Player ID"]) === id));
  const irPlayers = irIds.map(id => sheetData.find(p => String(p["Player ID"]) === id));
  const deadCapPlayers = cutSheetData.filter(p => p.Owner === rosterName);

  const table = document.createElement("table");
  table.style.width = "100%";

  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const headerTr = document.createElement("tr");
  const firstTh = document.createElement("th");
  firstTh.textContent = rosterName;
  headerTr.appendChild(firstTh);
  yearCols.forEach(y => {
    const th = document.createElement("th");
    th.textContent = y;
    headerTr.appendChild(th);
  });
  thead.appendChild(headerTr);

  const sumForYear = (players, year, excludedIds = []) => {
    return players.reduce((sum,p) => {
      if(excludedIds.includes(p["Player ID"])) return sum;
      return sum + parseValue(p[year]);
    },0);
  };

  const fixedRows = ["Team Salary Cap","Used Salary Cap","Injured Reserve","Dead Cap","Team Cap Space"];
  fixedRows.forEach(rowName => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = rowName;
    tr.appendChild(th);

    yearCols.forEach(y => {
      const td = document.createElement("td");
      let value = 0;
      switch(rowName){
        case "Team Salary Cap": value = teamCap; break;
        case "Used Salary Cap":
          value = sumForYear(activePlayers, y, getExcludedIds()); break;
        case "Injured Reserve": value = sumForYear(irPlayers, y); break;
        case "Dead Cap": value = deadCapPlayers.reduce((sum,p)=>sum+parseValue(p[y]),0); break;
        case "Team Cap Space":
          value = teamCap - sumForYear(activePlayers,y,getExcludedIds()) - deadCapPlayers.reduce((sum,p)=>sum+parseValue(p[y]),0);
          break;
      }
      td.textContent = `$${value.toLocaleString()}`;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
}

// ----------------------------
// Checkbox Builder
// ----------------------------
function renderBuilderCheckboxes(sheetData, activeIds){
  const container = document.getElementById("builder-checkboxes");
  container.innerHTML = "<strong>Roster Builder:</strong> ";

  activeIds.map(id => sheetData.find(p=>String(p["Player ID"])===id)).forEach(p=>{
    if(!p) return;
    const salary = parseValue(p["Contract"]);
    const label = document.createElement("label");
    label.style.marginRight = "10px";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "builder-check";
    cb.dataset.playerId = p["Player ID"];
    label.appendChild(cb);
    label.appendChild(document.createTextNode(` ${p["Name"] || p.full_name} ($${salary.toLocaleString()})`));
    container.appendChild(label);
  });
  setupBuilderCheckboxes();
}

function setupBuilderCheckboxes(){
  document.querySelectorAll(".builder-check").forEach(cb=>{
    cb.addEventListener("change",()=>{
      // Re-render Salary Cap Block
      document.getElementById("roster-select").dispatchEvent(new Event("change"));
    });
  });
}

function getExcludedIds(){
  return Array.from(document.querySelectorAll(".builder-check:checked")).map(cb=>cb.dataset.playerId);
}

// ----------------------------
// Active / Taxi / IR Sichtbarkeit
// ----------------------------
function setupRosterVisibilityToggles(){
  const toggleMap = [
    {checkbox:"toggle-active",section:"section-active"},
    {checkbox:"toggle-taxi",section:"section-taxi"},
    {checkbox:"toggle-ir",section:"section-ir"}
  ];

  toggleMap.forEach(({checkbox,section})=>{
    const cb = document.getElementById(checkbox);
    const sec = document.getElementById(section);
    if(!cb || !sec) return;

    const updateVisibility = () => { sec.style.display = cb.checked?"":"none"; };
    cb.removeEventListener("change",updateVisibility);
    cb.addEventListener("change",updateVisibility);
    updateVisibility();
  });
}

// ----------------------------
// Sortierung
// ----------------------------
function sortTable(tableId,colIndex){
  const table = document.getElementById(tableId);
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);
  const asc = !table.dataset.asc || table.dataset.asc==="false";

  rows.sort((a,b)=>{
    let aVal = a.cells[colIndex].textContent.replace(/\$|\./g,"");
    let bVal = b.cells[colIndex].textContent.replace(/\$|\./g,"");
    if(!isNaN(parseFloat(aVal)) && !isNaN(parseFloat(bVal))){
      return asc?aVal-bVal:bVal-aVal;
    }
    return asc?aVal.localeCompare(bVal):bVal.localeCompare(aVal);
  });

  rows.forEach(r=>tbody.appendChild(r));
  table.dataset.asc = asc;
}

// ----------------------------
// Roster Auswahl
// ----------------------------
document.getElementById("roster-select").addEventListener("change", e=>{
  loadRosterPage(e.target.value);
});

// Initial laden
loadRosterPage(document.getElementById("roster-select").value);
