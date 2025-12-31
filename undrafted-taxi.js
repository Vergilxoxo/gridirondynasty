// ------------------------------------
// undrafted-taxi.js
// ------------------------------------

let allPlayers = [];

// Sheet laden
async function fetchSheetPlayers() {
  const res = await fetch("https://opensheet.elk.sh/1TmZedqXNrEZ-LtPxma7AemFsKOoHErFgZhjIOK3C0hc/Sheet1");
  return await res.json();
}

// Sleeper API
async function fetchSleeperPlayers() {
  const res = await fetch("https://api.sleeper.app/v1/players/nfl");
  return await res.json();
}

// Prüft, ob Spieler in irgendeinem Taxi Squad ist
function getTaxiSquads(player) {
  return Object.keys(player)
    .filter(k => k.toLowerCase().includes("taxi"))
    .filter(k => player[k] && player[k].trim() !== "")
    .map(k => player[k]);
}

// Tabelle bauen
function buildTable(players) {
  const tbody = document.querySelector("#undrafted-table tbody");
  tbody.innerHTML = "";

  players.forEach(p => {
    const taxiSquads = getTaxiSquads(p);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p["Player ID"]}</td>
      <td>
        <a href="player.html?id=${p["Player ID"]}" class="player-link">
          ${p.full_name}
        </a>
      </td>
      <td>${p.position}</td>
      <td>${p.team}</td>
      <td>${taxiSquads.join(", ")}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Init
async function init() {
  const sheetData = await fetchSheetPlayers();
  const sleeperData = await fetchSleeperPlayers();

  allPlayers = sheetData.map(p => {
    const sleeperPlayer = Object.values(sleeperData)
      .find(sp => sp.player_id === p["Player ID"]);

    return {
      ...p,
      full_name: sleeperPlayer?.full_name || "Unbekannt",
      position: sleeperPlayer?.position || "-",
      team: sleeperPlayer?.team || "-"
    };
  });

  // 🔥 FILTER: Undrafted + mindestens ein Taxi Squad
  const undraftedTaxiPlayers = allPlayers.filter(p => {
    const isUndrafted = p["Contract"] === "Undrafted";
    const taxiSquads = getTaxiSquads(p);
    return isUndrafted && taxiSquads.length > 0;
  });

  buildTable(undraftedTaxiPlayers);
}

init();
