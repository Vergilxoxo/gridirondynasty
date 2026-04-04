const seasonWeeks = 18;

const leagueIds = {
  "2026":"1311998228123643904",
  "2025":"1207768406841892864",
  "2024":"1042445037713334272"
};

let leagueId;
let playersData = null;
let leaderboardData = [];
let playerRoster = {};

// Hilfsfunktion Position normalisieren
function normalizePosition(pos){
  if(pos==="DE"||pos==="DT") return "DL";
  if(pos==="CB"||pos==="S"||pos==="SS") return "DB";
  return pos;
}

// Spieler laden
async function loadPlayers(){
  if(playersData) return;
  playersData = await fetch("https://api.sleeper.app/v1/players/nfl").then(r => r.json());
}

// Saison wechseln
function changeSeason(){
  const season = document.getElementById("season-select").value;
  leagueId = leagueIds[season];
  leaderboardData = [];
  playerRoster = {};
  document.getElementById("records-content").innerHTML = "Lade Daten für "+season+"...";
  loadLeaders();
}

// Leaderboard & Records laden
async function loadLeaders(){
  await loadPlayers();

  const allWeeks = await Promise.all(
    Array.from({length: seasonWeeks}, (_, i) =>
      fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${i+1}`)
        .then(r=>r.json()).catch(()=>null)
    )
  );

  const playerMaxGame = {};
  const managerTotals = {};
  const positionMax = {};
  let narrowestWin = {diff: Infinity};
  let largestBlowout = {diff: -Infinity};

  allWeeks.forEach((matchups, weekIdx) => {
    if(!matchups) return;

    matchups.forEach(team => {
      const points = team.players_points || {};
      let teamTotal = 0;

      for(const playerId in points){
        const pts = points[playerId];
        teamTotal += pts;

        // Best game
        if(!playerMaxGame[playerId] || pts > playerMaxGame[playerId].points){
          playerMaxGame[playerId] = {points: pts, week: weekIdx+1, playerId};
        }

        const pos = normalizePosition(playersData[playerId]?.position);
        if(pos){
          if(!positionMax[pos] || pts > positionMax[pos].points){
            positionMax[pos] = {playerId, points: pts, week: weekIdx+1};
          }
        }

        if(!managerTotals[team.roster_id]) managerTotals[team.roster_id] = 0;
        managerTotals[team.roster_id] += pts;

        playerRoster[playerId] = team.roster_id;
      }

      // Narrowest & blowout
      const opponent = matchups.find(m=>m.roster_id!==team.roster_id);
      if(opponent){
        const diff = Math.abs(teamTotal - Object.values(opponent.players_points||{}).reduce((a,b)=>a+b,0));
        if(diff < narrowestWin.diff){ narrowestWin = {diff, week: weekIdx+1, team: team.roster_id, opponent: opponent.roster_id}; }
        if(diff > largestBlowout.diff){ largestBlowout = {diff, week: weekIdx+1, team: team.roster_id, opponent: opponent.roster_id}; }
      }
    });
  });

  renderRecords({playerMaxGame, managerTotals, positionMax, narrowestWin, largestBlowout});
  renderTable();
}

// Records rendern
function renderRecords({playerMaxGame, managerTotals, positionMax, narrowestWin, largestBlowout}){
  const recordsDiv = document.getElementById("records-content");

  const topPlayers = Object.values(playerMaxGame).sort((a,b)=>b.points-a.points).slice(0,3);
  const topManagers = Object.entries(managerTotals)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3)
    .map(([rosterId, points])=>({rosterId, points, name: document.querySelector(`#roster-select option[value="${rosterId}"]`)?.text || `Roster ${rosterId}`}));

  const positionOrder = ["QB","RB","WR","TE","DL","LB","DB"];

  let html = `<div style="display:flex;gap:16px;flex-wrap:wrap;">`;

  // Best Game
  html += `<div class="records-card" style="flex:1;min-width:260px;">
    <div class="title">🥇 Best Game</div>
    <div style="display:flex;justify-content:space-around;margin-top:10px;">
      ${topPlayers.map(p=>{
        const pdata = playersData[p.playerId];
        return `<div style="text-align:center;">
          <img src="https://sleepercdn.com/content/nfl/players/thumb/${p.playerId}.jpg" 
               alt="${pdata.full_name}" style="width:55px;height:55px;border-radius:50%;margin-bottom:4px;">
          <div>${pdata.full_name}</div>
          <div class="points">${p.points.toFixed(2)} pts</div>
          <div style="font-size:12px;">Week ${p.week}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // Top Manager
  html += `<div class="records-card" style="flex:1;min-width:260px;">
    <div class="title">🏆 Top Manager</div>
    <div style="margin-top:10px;">
      ${topManagers.map((m,idx)=>`<div style="display:flex;justify-content:space-between;padding:4px 8px;">
        <div>${["🥇","🥈","🥉"][idx]} ${m.name}</div>
        <div>${m.points.toFixed(2)} pts</div>
      </div>`).join('')}
    </div>
  </div>`;

  // Position Cards
  html += `<div style="flex-basis:100%;display:flex;gap:12px;flex-wrap:wrap;">`;
  positionOrder.forEach(pos=>{
    const rec = positionMax[pos];
    if(rec){
      const pdata = playersData[rec.playerId];
      html += `<div class="records-card" style="flex:1;min-width:140px;text-align:center;">
        <div class="title">${pos}</div>
        <img src="https://sleepercdn.com/content/nfl/players/thumb/${rec.playerId}.jpg"
             alt="${pdata.full_name}" style="width:40px;height:40px;border-radius:50%;margin:5px 0;">
        <div>${pdata.full_name}</div>
        <div class="points">${rec.points.toFixed(2)} pts</div>
        <div style="font-size:12px;">Week ${rec.week}</div>
      </div>`;
    }
  });
  html += `</div></div>`;

  recordsDiv.innerHTML = html;
}

// Tabelle rendern
function renderTable(){
  const rosterFilter = document.getElementById("roster-select").value;
  const table = document.getElementById("tableBody");

  let players = Object.entries(playerRoster).map(([playerId, rosterId])=>{
    const pdata = playersData[playerId];
    if(!pdata) return null;
    const points = leaderboardData[playerId] || 0;
    return {playerId, name: pdata.full_name, team: pdata.team || "-", position: normalizePosition(pdata.position), points, roster: rosterId};
  }).filter(p=>p);

  if(rosterFilter !== "ALL") players = players.filter(p=>String(p.roster) === rosterFilter);

  let html = "";
  players.slice(0,200).forEach((p,i)=>{
    html += `<tr>
      <td data-label="Rank">${i+1}</td>
      <td data-label="Player"><a href="player.html?id=${p.playerId}" target="_blank">${p.name}</a></td>
      <td data-label="Team">${p.team}</td>
      <td data-label="Pos">${p.position}</td>
      <td data-label="Points">${p.points.toFixed(2)}</td>
    </tr>`;
  });

  table.innerHTML = html;
}

// Init
window.onload = () => {
  leagueId = leagueIds[document.getElementById("season-select").value];
  loadLeaders();
};
