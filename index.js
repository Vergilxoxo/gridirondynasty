// ----------------------------
// Owner Map (Roster ID → Owner Name)
const ownerMap = {
  "1": "Ralf",
  "2": "TitleTownPat",
  "3": "MrNilsson",
  "4": "kleinerlouis",
  "5": "Ulle",
  "6": "TST1860",
  "7": "brab97",
  "8": "Himp84",
  "9": "TobiWalonso",
  "10": "49erflo",
  "11": "Heesy",
  "12": "CrazyGringo"
};

// ----------------------------
// Helper: Werte parsen
const parseValue = str => {
  if (!str) return 0;
  const num = str.toString().replace(/[^0-9]/g, '');
  return parseInt(num) || 0;
};

// ----------------------------
// Helper: Formatieren als $10.000.000
const formatMoney = value => {
  return "$" + Math.abs(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// ----------------------------
// Daten laden
async function fetchSheetPlayers() {
  const res = await fetch("https://opensheet.elk.sh/1TmZedqXNrEZ-LtPxma7AemFsKOoHErFgZhjIOK3C0hc/Sheet1");
  return await res.json();
}

async function fetchCutSheet() {
  const res = await fetch("https://opensheet.elk.sh/1TmZedqXNrEZ-LtPxma7AemFsKOoHErFgZhjIOK3C0hc/CutSheet");
  return await res.json();
}

async function fetchRosters() {
  const res = await fetch("https://api.sleeper.app/v1/league/1207768406841892864/rosters");
  return await res.json();
}

// ----------------------------
// Team Cap Block rendern
async function renderTeamCapBlock() {
  const sheetData = await fetchSheetPlayers();
  const cutSheetData = await fetchCutSheet();
  const rosters = await fetchRosters();
  const teamCap = 160000000;

  const allYears = sheetData.flatMap(p => Object.keys(p).filter(k => /^\d{4}$/.test(k)));
  const yearCols = [...new Set(allYears)].sort();
  const year = yearCols[0] || "2025";

  let container = document.getElementById("team-cap-block");
  if (!container) {
    container = document.createElement("div");
    container.id = "team-cap-block";
    container.style.width = "100%";
    container.style.backgroundColor = "#1b2a3a";
    container.style.padding = "15px";
    container.style.borderRadius = "8px";
    container.style.marginBottom = "20px";
    container.style.boxShadow = "0 4px 10px rgba(0,0,0,0.4)";
    container.style.border = "1px solid #162332";
    container.style.color = "#ffffff";
    container.style.fontFamily = '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif';
    container.style.fontSize = "14px";
    container.style.lineHeight = "1.4";
    container.style.overflowX = "hidden"; // <- Scroll verhindern
    container.style.boxSizing = "border-box"; // <- padding innerhalb der Breite

    const dashboard = document.querySelector("h1");
    if (dashboard) {
      dashboard.parentNode.insertBefore(container, dashboard.nextSibling);
    } else {
      document.body.insertBefore(container, document.body.firstChild);
    }
  }
  container.innerHTML = "";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.fontWeight = "600";
  header.style.backgroundColor = "#162332";
  header.style.padding = "6px 12px";
  header.style.borderRadius = "6px";
  header.style.marginBottom = "8px";
  header.style.fontSize = "14px";
  header.style.gap = "8px";
  header.style.minWidth = "0"; // <- wichtig
  header.innerHTML = `
    <span style="flex:1.5; min-width:0;">Owner</span>
    <span style="flex:1; text-align:right; min-width:0;">Team Cap Space</span>
    <span style="flex:1; text-align:right; min-width:0;">FAAB</span>
  `;
  container.appendChild(header);

  rosters.forEach((roster, index) => {
    const owner = ownerMap[String(roster.roster_id)] || "Unknown";
    const allIds = (roster.players || []).map(String);
    const taxiIds = (roster.taxi || []).map(String);
    const irIds = (roster.reserve || []).map(String);
    const activeIds = allIds.filter(id => !taxiIds.includes(id) && !irIds.includes(id));
    const activePlayers = activeIds.map(id => sheetData.find(p => String(p["Player ID"]) === id)).filter(Boolean);
    const deadCapPlayers = cutSheetData.filter(p => p.Owner === owner);

    const sumForYear = players => players.reduce((sum, p) => sum + parseValue(p[year]), 0);
    const usedCap = sumForYear(activePlayers);
    const deadCap = sumForYear(deadCapPlayers);
    const capSpace = teamCap - usedCap - deadCap;
    const faab = Math.floor(capSpace / 10000);

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.padding = "6px 12px";
    row.style.borderTop = "1px solid #223348";
    row.style.borderRadius = "6px";
    row.style.transition = "background-color 0.2s";
    row.style.cursor = "default";
    row.style.minWidth = "0"; // <- wichtig
    if (index % 2 === 0) row.style.backgroundColor = "#1f2b3d";

    row.addEventListener("mouseover", () => row.style.backgroundColor = "#223348");
    row.addEventListener("mouseout", () => row.style.backgroundColor = index % 2 === 0 ? "#1f2b3d" : "#1b2a3a");

    const ownerSpan = document.createElement("span");
    ownerSpan.textContent = owner;
    ownerSpan.style.flex = "1.5";
    ownerSpan.style.minWidth = "0";

    const capSpan = document.createElement("span");
    capSpan.textContent = formatMoney(capSpace);
    capSpan.style.color = capSpace < 0 ? "#ff4d4d" : "#ffffff";
    capSpan.style.flex = "1";
    capSpan.style.minWidth = "0";
    capSpan.style.textAlign = "right";

    const faabSpan = document.createElement("span");
    faabSpan.textContent = faab;
    faabSpan.style.color = faab < 0 ? "#ff4d4d" : "#ffffff";
    faabSpan.style.flex = "1";
    faabSpan.style.minWidth = "0";
    faabSpan.style.textAlign = "right";

    row.appendChild(ownerSpan);
    row.appendChild(capSpan);
    row.appendChild(faabSpan);

    container.appendChild(row);
  });
}

// ----------------------------
// Veteran Taxi Block rendern
async function renderVeteranTaxiBlock() {
  const sheetData = await fetchSheetPlayers();
  const rosters = await fetchRosters();
  const taxiPlayers = [];

  if (!sheetData.length || !rosters.length) return;

  rosters.forEach(roster => {
    const owner = ownerMap[String(roster.roster_id)] || "Unknown";
    const taxiIds = (roster.taxi || []).map(String);

    taxiIds.forEach(id => {
      const player = sheetData.find(p => String(p["Player ID"]) === id);
      if (player && player.Contract && player.Contract.toLowerCase() === "veteran") {
        taxiPlayers.push({ ...player, owner });
      }
    });
  });

  let container = document.getElementById("veteran-taxi-block");
  if (!container) {
    container = document.createElement("div");
    container.id = "veteran-taxi-block";
    container.style.width = "100%";
    container.style.backgroundColor = "#1b2a3a";
    container.style.padding = "15px";
    container.style.borderRadius = "8px";
    container.style.marginBottom = "20px";
    container.style.boxShadow = "0 4px 10px rgba(0,0,0,0.4)";
    container.style.border = "1px solid #162332";
    container.style.color = "#ffffff";
    container.style.fontFamily = '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif';
    container.style.fontSize = "14px";
    container.style.lineHeight = "1.4";
    container.style.overflowX = "hidden"; // <- Scroll verhindern
    container.style.boxSizing = "border-box"; // <- padding innerhalb der Breite

    const capBlock = document.getElementById("team-cap-block");
    if (capBlock) {
      capBlock.parentNode.insertBefore(container, capBlock.nextSibling);
    } else {
      document.body.appendChild(container);
    }
  }
  container.innerHTML = "";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.fontWeight = "600";
  header.style.backgroundColor = "#162332";
  header.style.padding = "6px 12px";
  header.style.borderRadius = "6px";
  header.style.marginBottom = "8px";
  header.style.fontSize = "14px";
  header.style.gap = "8px";
  header.style.minWidth = "0"; // <- wichtig
  header.innerHTML = `
    <span style="flex:2; min-width:0;">Player</span>
    <span style="flex:1; min-width:0;">Position</span>
    <span style="flex:1; min-width:0;">Owner</span>
    <span style="flex:1; min-width:0;">Contract</span>
  `;
  container.appendChild(header);

  if (!taxiPlayers.length) {
    const emptyRow = document.createElement("div");
    emptyRow.style.padding = "6px 12px";
    emptyRow.style.color = "#bbbbbb";
    emptyRow.textContent = "Keine Veteran-Taxi-Spieler vorhanden.";
    container.appendChild(emptyRow);
    return;
  }

  taxiPlayers.forEach((p, index) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.padding = "6px 12px";
    row.style.borderTop = "1px solid #223348";
    row.style.borderRadius = "6px";
    row.style.transition = "background-color 0.2s";
    row.style.cursor = "default";
    row.style.minWidth = "0"; // <- wichtig
    if (index % 2 === 0) row.style.backgroundColor = "#1f2b3d";

    row.addEventListener("mouseover", () => row.style.backgroundColor = "#223348");
    row.addEventListener("mouseout", () => row.style.backgroundColor = index % 2 === 0 ? "#1f2b3d" : "#1b2a3a");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = p.Name || "-";
    nameSpan.style.flex = "2";
    nameSpan.style.minWidth = "0";

    const posSpan = document.createElement("span");
    posSpan.textContent = p.Position || "-";
    posSpan.style.flex = "1";
    posSpan.style.minWidth = "0";

    const ownerSpan = document.createElement("span");
    ownerSpan.textContent = p.owner || "-";
    ownerSpan.style.flex = "1";
    ownerSpan.style.minWidth = "0";

    const contractSpan = document.createElement("span");
    contractSpan.textContent = p.Contract || "-";
    contractSpan.style.flex = "1";
    contractSpan.style.minWidth = "0";

    row.appendChild(nameSpan);
    row.appendChild(posSpan);
    row.appendChild(ownerSpan);
    row.appendChild(contractSpan);

    container.appendChild(row);
  });
}

// ----------------------------
// Laden
document.addEventListener("DOMContentLoaded", () => {
  renderTeamCapBlock();
  renderVeteranTaxiBlock();
});
