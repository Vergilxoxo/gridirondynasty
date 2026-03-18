const leagueId = "1311998228123643904";

let builderState = {};

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

  const yearCols = Array.from(
    new Set(sheetData.flatMap(p => Object.keys(p).filter(k => /^\d{4}$/.test(k))))
  ).sort();

  const fixedCols = ["Builder","Player ID","Name","Position","NFL Team","Contract"];

  ["active-roster","taxi-roster","ir-roster"].forEach(tableId => {

    const row = document.getElementById(`${tableId}-header`);
    row.innerHTML = "";

    fixedCols.forEach(c=>{
      const th = document.createElement("th");
      th.textContent = c;
      row.appendChild(th);
    });

    yearCols.forEach(y=>{
      const th = document.createElement("th");
      th.textContent = y;
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
      const playerId = p.player_id || p["Player ID"] || "-";

      let html = `
      <td>
      <input type="checkbox"
      class="builder-check"
      data-id="${playerId}"
      data-pos="${pos}"
      data-contract="${p.Contract || "0"}">
      </td>

      <td>${playerId}</td>
      <td>${p.full_name || "-"}</td>
      <td class="pos-${pos}">${pos}</td>
      <td>${p.team || "-"}</td>
      <td>${p.Contract || "-"}</td>
      `;

      yearCols.forEach(y => html += `<td>${p[y] || "-"}</td>`);

      tr.innerHTML = html;
      tbody.appendChild(tr);

    });

  }

  renderTable("active-roster",activeIds);
  renderTable("taxi-roster",taxiIds);
  renderTable("ir-roster",irIds);

  renderDeadCapTable(cutSheetData,rosterName);

  renderSalaryCapBlock(sheetData,cutSheetData,rosterName,yearCols,activeIds,irIds);

}

// ----------------------------
// Builder Summary
// ----------------------------

function updateBuilderSummary(){

  const players = Object.values(builderState);

  const count = players.length;

  let removedSalary = 0;
  const positions = {};

  players.forEach(p=>{

    removedSalary += parseValue(p.contract);

    const pos = p.pos || "-";
    positions[pos] = (positions[pos] || 0) + 1;

  });

  document.getElementById("builder-count").textContent = count;

  document.getElementById("builder-salary").textContent =
  "$"+removedSalary.toLocaleString("de-DE");

  const posText = Object.entries(positions)
  .map(([p,c])=>`${p}:${c}`)
  .join(" | ");

  document.getElementById("builder-positions").textContent =
  posText || "-";

}

// ----------------------------
// Salary neu berechnen
// ----------------------------

function recalcSalaryCap(){

  const removed = Object.values(builderState)
  .reduce((sum,p)=> sum + parseValue(p.contract),0);

  const rows = document.querySelectorAll("#salary-cap-block tbody tr");

  if(!rows.length) return;

  const usedRow = rows[1];
  const capSpaceRow = rows[4];

  const usedCells = usedRow.querySelectorAll("td");

  usedCells.forEach(cell=>{

    const base = parseValue(cell.textContent);
    const newVal = Math.max(0, base - removed);

    cell.textContent =
    "$"+newVal.toLocaleString("de-DE");

  });

}

// ----------------------------
// Dead Cap Tabelle
// ----------------------------

function renderDeadCapTable(data,rosterName){

  const header=document.getElementById("deadcap-header");
  const tbody=document.querySelector("#deadcap-table tbody");

  header.innerHTML="";
  tbody.innerHTML="";

  if(!data.length) return;

  const fixedCols=["Name","Status"];

  const yearCols=Array.from(
  new Set(data.flatMap(r=>Object.keys(r).filter(k=>/^\d{4}$/.test(k))))
  ).sort();

  const cols=[...fixedCols,...yearCols];

  cols.forEach(c=>{
    const th=document.createElement("th");
    th.textContent=c;
    header.appendChild(th);
  });

  const filtered=data.filter(r=>r.Owner===rosterName);

  filtered.forEach(row=>{

    const tr=document.createElement("tr");

    cols.forEach(c=>{
      const td=document.createElement("td");
      td.textContent=row[c] || "-";
      tr.appendChild(td);
    });

    tbody.appendChild(tr);

  });

}

// ----------------------------
// Helper
// ----------------------------

const parseValue=str=>{
  if(!str) return 0;
  const num=str.toString().replace(/[^0-9]/g,'');
  return parseInt(num) || 0;
};

// ----------------------------
// Builder Checkbox Listener
// ----------------------------

document.addEventListener("change",function(e){

  if(!e.target.classList.contains("builder-check")) return;

  const id=e.target.dataset.id;

  if(e.target.checked){
    builderState[id]=e.target.dataset;
  }else{
    delete builderState[id];
  }

  updateBuilderSummary();
  recalcSalaryCap();

});

// ----------------------------
// Roster Auswahl
// ----------------------------

document.getElementById("roster-select")
.addEventListener("change",e=>{

  builderState={};
  loadRosterPage(e.target.value);

});

loadRosterPage(document.getElementById("roster-select").value);
