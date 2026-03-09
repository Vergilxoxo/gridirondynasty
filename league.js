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

let rosters = [];
let matchups = [];

// Roster laden
async function loadRosters() {
  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
  rosters = await res.json();
}

// Matchups laden
async function loadMatchups() {
  const season = new Date().getFullYear();
  const allMatchups = [];
  for (let week = 1; week <= 18; week++) {
    try {
      const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`);
      const data = await res.json();
      if (data && data.length > 0) allMatchups.push(...data);
    } catch (err) {
      console.error("Fehler bei Woche", week, err);
    }
  }
  matchups = allMatchups;
}

// League Stats Cards rendern
function renderLeagueStats() {
  const container = document.getElementById("league-stats");
  if (!container) return;
  container.innerHTML = "";

  if (!rosters || rosters.length === 0) return;

  // Beste Offense & Defense
  let bestOffense = rosters[0];
  let bestDefense = rosters[0];
  let topScoreRoster = rosters[0];
  let maxWeekScore = 0;

  rosters.forEach(r => {
    if ((r.settings.fpts ?? 0) > (bestOffense.settings.fpts ?? 0)) bestOffense = r;
    if ((r.settings.fpts_against ?? 0) < (bestDefense.settings.fpts_against ?? 1000)) bestDefense = r;
  });

  rosters.forEach(r => {
    if (r.settings.weekly_scores && r.settings.weekly_scores.length) {
      const highest = Math.max(...r.settings.weekly_scores);
      if (highest > maxWeekScore) {
        maxWeekScore = highest;
        topScoreRoster = r;
      }
    }
  });

  const cards = [
    { title: "Beste Offense", value: `${ownerMap[bestOffense.owner_id] || "-"} (${bestOffense.settings.fpts})` },
    { title: "Beste Defense", value: `${ownerMap[bestDefense.owner_id] || "-"} (${bestDefense.settings.fpts_against})` },
    { title: "Top Score Woche", value: `${ownerMap[topScoreRoster.owner_id] || "-"} (${maxWeekScore})` },
  ];

  cards.forEach(c => {
    const card = document.createElement("div");
    card.classList.add("stats-card");
    card.innerHTML = `<strong>${c.title}</strong><span>${c.value}</span>`;
    container.appendChild(card);
  });
}

// Matchups rendern
function renderMatchups() {
  const container = document.getElementById("matchups-list");
  if (!container) return;
  container.innerHTML = "";

  matchups.forEach(m => {
    const homeOwner = ownerMap[m.home.owner_id] || "-";
    const awayOwner = ownerMap[m.away.owner_id] || "-";
    const homeScore = m.home_points?.toFixed(1) ?? "-";
    const awayScore = m.away_points?.toFixed(1) ?? "-";

    const div = document.createElement("div");
    div.classList.add("matchup-row");
    div.innerHTML = `
      <span>${homeOwner} (${homeScore})</span>
      <span>vs</span>
      <span>${awayOwner} (${awayScore})</span>
    `;
    container.appendChild(div);
  });
}

// League Ranking rendern
function renderLeagueRanking() {
  const container = document.getElementById("league-ranking");
  if (!container) return;
  container.innerHTML = "";

  if (!rosters || rosters.length === 0) return;

  const sorted = [...rosters].sort((a, b) => (b.settings.fpts ?? 0) - (a.settings.fpts ?? 0));

  sorted.forEach((r, i) => {
    const div = document.createElement("div");
    div.classList.add("ranking-row");
    div.innerHTML = `<strong>${i + 1}. ${ownerMap[r.owner_id] || "-"}</strong> - ${r.settings.fpts ?? 0} Punkte`;
    container.appendChild(div);
  });
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
  await loadRosters();
  await loadMatchups();

  renderLeagueStats();
  renderMatchups();
  renderLeagueRanking();
});
