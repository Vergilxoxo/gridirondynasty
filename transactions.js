const leagueId = "1311998228123643904";

const ownerMap = {
  "465132695723175936": "Wombat Warriors",
  "499688619552796672": "Outlaws",
  "700775678882189312": "TobiWalonso",
  "461229417725685760": "TitleTownPat",
  "514886190662844416": "Eilbek Elephants",
  "731126368611491840": "DakStreet Boys",
  "374575842090569728": "Alles oder Penix",
  "587198224066977792": "Mordor's Dark Empire",
  "427153756321226752": "Calmont Gladiators",
  "593242356480790528": "Captain Bierccuneer",
  "463018762526781440": "Eastfrisian Ducks",
  "589565582072918016": "Muenster CardiNils"
};

let playerMap = {};
let rosterOwnerMap = {}; // roster_id -> owner_id

// -------------- Spieler laden ----------------
async function loadPlayers() {
  const res = await fetch("https://api.sleeper.app/v1/players/nfl");
  const players = await res.json();
  Object.values(players).forEach(p => {
    playerMap[p.player_id] = p.full_name;
  });
}

// -------------- Roster laden ----------------
async function loadRosters() {
  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
  const rosters = await res.json();
  rosters.forEach(r => {
    rosterOwnerMap[r.roster_id] = r.owner_id;
  });
}

// -------------- Typ lesbarer darstellen ----------------
function formatType(type) {
  switch(type) {
    case "add":
    case "free_agent": return { label: "Aufgenommen", class: "add" };
    case "drop": return { label: "Verlassen", class: "drop" };
    case "waiver": return { label: "Waiver", class: "waiver" };
    case "trade": return { label: "Trade", class: "trade" };
    case "commissioner": return { label: "Commissioner Move", class: "commissioner" };
    default: return { label: type, class: "" };
  }
}

// -------------- Einzelne Zeile erstellen ----------------
function addRow(tbody, date, type, playerId, fromRoster, toRoster) {
  const tr = document.createElement("tr");

  const { label: typeLabel, class: typeClass } = formatType(type);

  const playerName = playerMap[playerId] || playerId;
  const playerImg = `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`;

  const fromTeam = ownerMap[rosterOwnerMap[fromRoster]] || "-";
  const toTeam = ownerMap[rosterOwnerMap[toRoster]] || "-";

  tr.innerHTML = `
    <td>${date}</td>
    <td class="${typeClass}">${typeLabel}</td>
    <td class="player-cell">
      <img src="${playerImg}" 
           onerror="this.src='https://sleepercdn.com/images/nfl/nfl_player_placeholder.png'">
      ${playerName}
    </td>
    <td>${fromTeam}</td>
    <td>${toTeam}</td>
  `;

  tbody.appendChild(tr);
}

// -------------- Transactions laden ----------------
async function loadTransactions() {
  let allTransactions = [];

  for (let week = 1; week <= 18; week++) {
    try {
      const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/transactions/${week}`);
      const data = await res.json();
      if (data && data.length > 0) allTransactions = allTransactions.concat(data);
    } catch (err) {
      console.error("Fehler bei Woche", week, err);
    }
  }

  renderTransactions(allTransactions);
}

// -------------- Tabelle rendern ----------------
function renderTransactions(transactions) {
  const tbody = document.querySelector("#transactions-table tbody");
  tbody.innerHTML = "";

  transactions.forEach(t => {
    const date = new Date(t.created).toLocaleDateString("de-DE");

    // Adds
    if (t.adds) {
      Object.entries(t.adds).forEach(([pid, roster]) => {
        addRow(tbody, date, t.type, pid, null, roster);
      });
    }

    // Drops
    if (t.drops) {
      Object.entries(t.drops).forEach(([pid, roster]) => {
        addRow(tbody, date, t.type, pid, roster, null);
      });
    }
  });
}

// -------------- Suche / Filter ----------------
function setupFilter() {
  const input = document.getElementById("search-input");
  input.addEventListener("input", () => {
    const filter = input.value.toLowerCase();
    document.querySelectorAll("#transactions-table tbody tr").forEach(row => {
      const player = row.children[2].textContent.toLowerCase();
      row.style.display = player.includes(filter) ? "" : "none";
    });
  });
}

// -------------- Init ----------------
document.addEventListener("DOMContentLoaded", async () => {
  await loadPlayers();
  await loadRosters();
  await loadTransactions();
  setupFilter();
});
