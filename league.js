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

let rosterMap = {}; // roster_id -> owner_id
let leagueMatchups = {}; // week -> array of matchups

// Spieler laden (optional für Stats Cards)
let playerMap = {};
async function loadPlayers() {
  const res = await fetch("https://api.sleeper.app/v1/players/nfl");
  const data = await res.json();
  Object.values(data).forEach(p => playerMap[p.player_id] = p.full_name);
}

// Roster laden
async function loadRosters() {
  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
  const rosters = await res.json();
  rosters.forEach(r => rosterMap[r.roster_id] = r.owner_id);
}

// Standings laden
async function loadStandings() {
  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/standings`);
  const standings = await res.json();
  renderStandings(standings);
}

// Standings rendern
function renderStandings(standings) {
  const tbody = document.querySelector("#standings-table tbody");
  tbody.innerHTML = "";

  standings.forEach((team, index) => {
    const tr = document.createElement("tr");
    const owner = ownerMap[team.owner_id] || "-";
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${owner}</td>
      <td>${team.settings?.wins ?? 0}</td>
      <td>${team.settings?.losses ?? 0}</td>
      <td>${team.settings?.fpts ?? 0}</td>
      <td>${team.settings?.fpts_against ?? 0}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Matchups laden
async function loadMatchups() {
  // Wir nehmen z.B. 18 Wochen
  for (let week = 1; week <= 18; week++) {
    try {
      const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`);
      const data = await res.json();
      if (data && data.length > 0) {
        leagueMatchups[week] = data;
      }
    } catch (err) {
      console.warn("Woche", week, "nicht verfügbar");
    }
  }

  populateWeekSelect();
}

// Woche Dropdown füllen
function populateWeekSelect() {
  const select = document.getElementById("week-select");
  select.innerHTML = "";
  Object.keys(leagueMatchups).forEach(week => {
    const opt = document.createElement("option");
    opt.value = week;
    opt.textContent = `Woche ${week}`;
    select.appendChild(opt);
  });

  // Standard: erste verfügbare Woche
  select.value = Object.keys(leagueMatchups)[0] || 1;
  renderMatchups(select.value);

  select.addEventListener("change", () => {
    renderMatchups(select.value);
  });
}

// Matchups rendern
function renderMatchups(week) {
  const container = document.getElementById("matchups");
  container.innerHTML = "";

  const matchups = leagueMatchups[week];
  if (!matchups) {
    container.innerHTML = "<p>Keine Matchups für diese Woche</p>";
    return;
  }

  matchups.forEach(m => {
    const homeOwner = ownerMap[m.home_team_id] || "-";
    const awayOwner = ownerMap[m.away_team_id] || "-";

    const homeScore = m.home_score ?? 0;
    const awayScore = m.away_score ?? 0;

    const card = document.createElement("div");
    card.classList.add("matchup-card");
    card.innerHTML = `
      <div class="matchup-team">${homeOwner}</div>
      <div class="matchup-score">${homeScore}</div>
      <div class="matchup-vs">vs</div>
      <div class="matchup-score">${awayScore}</div>
      <div class="matchup-team">${awayOwner}</div>
    `;
    container.appendChild(card);
  });
}

// League Stats Cards
async function renderLeagueStats() {
  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
  const rosters = await res.json();
  const container = document.getElementById("league-stats");
  container.innerHTML = "";

  if (!rosters || rosters.length === 0) return;

  // Beste Offense & Defense
  let bestOffense = rosters[0];
  let bestDefense = rosters[0];
  let topScore = rosters[0];

  rosters.forEach(r => {
    if ((r.settings.fpts ?? 0) > (bestOffense.settings.fpts ?? 0)) bestOffense = r;
    if ((r.settings.fpts_against ?? 0) < (bestDefense.settings.fpts_against ?? 1000)) bestDefense = r;
    if ((r.settings.fpts_week ?? 0) > (topScore.settings.fpts_week ?? 0)) topScore = r;
  });

  const cards = [
    { title: "Beste Offense", value: `${ownerMap[bestOffense.owner_id] || "-"} (${bestOffense.settings.fpts})` },
    { title: "Beste Defense", value: `${ownerMap[bestDefense.owner_id] || "-"} (${bestDefense.settings.fpts_against})` },
    { title: "Top Score Woche", value: `${ownerMap[topScore.owner_id] || "-"} (${topScore.settings.fpts_week ?? 0})` },
  ];

  cards.forEach(c => {
    const card = document.createElement("div");
    card.classList.add("stats-card");
    card.innerHTML = `<strong>${c.title}</strong><span>${c.value}</span>`;
    container.appendChild(card);
  });
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
  await loadPlayers();
  await loadRosters();
  await loadStandings();
  await loadMatchups();
  await renderLeagueStats();
});
