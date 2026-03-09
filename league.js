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

let rosterOwnerMap = {};

// --------------------
// Roster laden
// --------------------

async function loadRosters() {

  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
  const rosters = await res.json();

  rosters.forEach(r => {
    rosterOwnerMap[r.roster_id] = r.owner_id;
  });

  return rosters;
}


// --------------------
// Standings anzeigen
// --------------------

function renderStandings(rosters) {

  const tbody = document.querySelector("#standings-table tbody");

  tbody.innerHTML = "";

  rosters.sort((a,b) => b.settings.wins - a.settings.wins);

  rosters.forEach((r, index) => {

    const tr = document.createElement("tr");

    const teamName = ownerMap[r.owner_id] || "Unknown";

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${teamName}</td>
      <td>${r.settings.wins}</td>
      <td>${r.settings.losses}</td>
      <td>${r.settings.fpts.toFixed(2)}</td>
      <td>${r.settings.fpts_against.toFixed(2)}</td>
    `;

    tbody.appendChild(tr);

  });

}


// --------------------
// Week Selector
// --------------------

function initWeekSelector() {

  const select = document.getElementById("week-select");

  for (let i = 1; i <= 18; i++) {

    const option = document.createElement("option");

    option.value = i;
    option.textContent = `Week ${i}`;

    select.appendChild(option);

  }

  select.addEventListener("change", () => {
    loadMatchups(select.value);
  });

}


// --------------------
// Matchups laden
// --------------------

async function loadMatchups(week) {

  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`);
  const matchups = await res.json();

  renderMatchups(matchups);

}


// --------------------
// Matchups anzeigen
// --------------------

function renderMatchups(matchups) {

  const container = document.getElementById("matchups");

  container.innerHTML = "";

  const grouped = {};

  matchups.forEach(m => {

    if (!grouped[m.matchup_id]) {
      grouped[m.matchup_id] = [];
    }

    grouped[m.matchup_id].push(m);

  });


  Object.values(grouped).forEach(game => {

    if (game.length < 2) return;

    const team1 = game[0];
    const team2 = game[1];

    const team1Name = ownerMap[rosterOwnerMap[team1.roster_id]];
    const team2Name = ownerMap[rosterOwnerMap[team2.roster_id]];

    const div = document.createElement("div");

    div.classList.add("matchup");

    div.innerHTML = `
      <strong>${team1Name}</strong>
      ${team1.points.toFixed(2)}
      vs
      ${team2.points.toFixed(2)}
      <strong>${team2Name}</strong>
    `;

    container.appendChild(div);

  });

}


// --------------------
// Init
// --------------------

document.addEventListener("DOMContentLoaded", async () => {

  const rosters = await loadRosters();

  renderStandings(rosters);

  initWeekSelector();

  loadMatchups(1);

});
