const leagueId = "1207768406841892864";

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

// Sleeper Player Daten
async function loadPlayers() {
  const res = await fetch("https://api.sleeper.app/v1/players/nfl");
  const players = await res.json();

  Object.values(players).forEach(p => {
    playerMap[p.player_id] = p.full_name;
  });
}

// Transactions laden
async function loadTransactions() {

  const season = new Date().getFullYear();
  let allTransactions = [];

  // Sleeper hat max ~18 Wochen
  for (let week = 0; week <= 18; week++) {

    const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/transactions/${season}/${week}`);
    const weekTransactions = await res.json();

    if (weekTransactions && weekTransactions.length > 0) {
      allTransactions = allTransactions.concat(weekTransactions);
    }

  }

  renderTransactions(allTransactions);
}

// Tabelle anzeigen
function renderTransactions(transactions) {

  const tbody = document.querySelector("#transactions-table tbody");
  tbody.innerHTML = "";

  transactions.forEach(t => {

    let type = t.type;
    let players = [];

    if (t.adds) {
      players = Object.keys(t.adds);
    }

    if (t.drops) {
      players = players.concat(Object.keys(t.drops));
    }

    players.forEach(pid => {

      const tr = document.createElement("tr");

      const playerName = playerMap[pid] || pid;

      const fromTeam = ownerMap[t.drops?.[pid]] || "-";
      const toTeam = ownerMap[t.adds?.[pid]] || "-";

      const date = new Date(t.created).toLocaleDateString("de-DE");

      tr.innerHTML = `
        <td>${date}</td>
        <td>${type}</td>
        <td>${playerName}</td>
        <td>${fromTeam}</td>
        <td>${toTeam}</td>
      `;

      tbody.appendChild(tr);

    });

  });

}

// Suche
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

// Init
document.addEventListener("DOMContentLoaded", async () => {

  await loadPlayers();
  await loadTransactions();

  setupFilter();

});
