const SHEET_URL = "https://opensheet.elk.sh/1TmZedqXNrEZ-LtPxma7AemFsKOoHErFgZhjIOK3C0hc/Sheet1";
const LEAGUE_ID = "DEINE_SLEEPER_LEAGUE_ID"; // <-- eintragen

// Alle Spieler aus Sheet & Sleeper zusammenführen
async function fetchPlayers() {
  const sheetRes = await fetch(SHEET_URL);
  const sheetData = await sheetRes.json();

  const sleeperRes = await fetch("https://api.sleeper.app/v1/players/nfl");
  const sleeperData = await sleeperRes.json();

  return sheetData.map(p => {
    const id = p["Player ID"] ?? p["Player_ID"] ?? p["PlayerID"];
    const sleeper = sleeperData[id] || {};

    return {
      player_id: id,
      full_name: p["full_name"] ?? sleeper.full_name ?? "Unknown",
      position: sleeper.position ?? p.position ?? "-",
      team: sleeper.team ?? p.team ?? "-",
      contract: p["Contract"] ?? "-",
      years: Object.keys(p)
        .filter(k => /^\d{4}$/.test(k) && p[k])
        .reduce((acc, year) => { acc[year] = p[year]; return acc; }, {})
    };
  });
}

// Spieler-Seite laden
async function loadPlayerPage(playerId) {
  const players = await fetchPlayers();
  const player = players.find(p => p.player_id === playerId);

  if (!player) {
    document.getElementById("player").innerText = "Spieler nicht gefunden";
    return;
  }

  renderPlayerInfo(player);
  renderContract(player);
  loadSleeperTeam(playerId);
}

// Spieler-Info rendern
function renderPlayerInfo(player) {
  document.getElementById("player").innerHTML = `
    <h1>${player.full_name}</h1>
    <p><strong>Position:</strong> ${player.position}</p>
    <p><strong>NFL Team:</strong> ${player.team}</p>
    <p><strong>Contract:</strong> ${player.contract} Jahre</p>
    <p id="sleeper-team"><strong>Dynasty Team:</strong> Lädt…</p>
  `;
}

// Vertragsjahre rendern
function renderContract(player) {
  const tbody = document.querySelector("#contract-table tbody");
  tbody.innerHTML = "";

  Object.entries(player.years)
    .sort((a,b) => a[0]-b[0])
    .forEach(([year, salary]) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${year}</td><td>${salary}</td>`;
      tbody.appendChild(row);
    });
}

// Sleeper-Team abrufen
async function loadSleeperTeam(playerId) {
  const rosters = await fetch(
    `https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`
  ).then(res => res.json());

  const roster = rosters.find(r => r.players?.includes(playerId));

  document.getElementById("sleeper-team").innerHTML =
    roster
      ? `<strong>Dynasty Team:</strong> Team ${roster.roster_id}`
      : "<strong>Dynasty Team:</strong> Free Agent";
}

function renderPlayerInfo(player) {
  document.getElementById("player").innerHTML = `
    <h1>${player.full_name}</h1>
    <p><strong>Position:</strong> ${player.position}</p>
    <p><strong>NFL Team:</strong> ${player.team}</p>
    <p><strong>Contract:</strong> ${player.contract}</p>
    <p id="sleeper-team"><strong>Dynasty Team:</strong> Lädt…</p>
  `;
}
