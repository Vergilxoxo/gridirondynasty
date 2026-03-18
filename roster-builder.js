const leagueId = "1311998228123643904"

async function fetchSheetPlayers() {

const res = await fetch("https://opensheet.elk.sh/1TmZedqXNrEZ-LtPxma7AemFsKOoHErFgZhjIOK3C0hc/Sheet1")
return await res.json()

}

async function fetchSleeperPlayers() {

const res = await fetch("https://api.sleeper.app/v1/players/nfl")
return await res.json()

}

async function loadRoster(rosterId){

const sheetData = await fetchSheetPlayers()
const sleeperData = await fetchSleeperPlayers()

const rosterRes = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`)
const rosters = await rosterRes.json()

const roster = rosters.find(r => r.roster_id == rosterId)

const tbody = document.querySelector("#builder-table tbody")
tbody.innerHTML=""

const playerIds = roster.players || []

playerIds.forEach(id => {

const sleeper = sleeperData[id] || {}
const sheet = sheetData.find(p => String(p["Player ID"]) === String(id)) || {}

const name = sleeper.full_name || "-"
const pos = sleeper.position || "-"
const team = sleeper.team || "-"
const contract = sheet.Contract || "$0"

const tr = document.createElement("tr")

tr.innerHTML=`

<td>
<input type="checkbox"
class="player-check"
data-salary="${contract}"
data-pos="${pos}">
</td>

<td>${name}</td>
<td>${pos}</td>
<td>${team}</td>
<td>${contract}</td>

`

tbody.appendChild(tr)

})

}

function parseMoney(str){

if(!str) return 0
return parseInt(str.replace(/[^0-9]/g,"")) || 0

}

function updateSummary(){

const checks = document.querySelectorAll(".player-check:checked")

let totalSalary = 0
let positions = {}

checks.forEach(cb=>{

const salary = parseMoney(cb.dataset.salary)
const pos = cb.dataset.pos

totalSalary += salary

positions[pos] = (positions[pos] || 0) + 1

})

document.getElementById("selected-count").textContent = checks.length

document.getElementById("selected-salary").textContent =
"$"+totalSalary.toLocaleString("de-DE")

const posText = Object.entries(positions)
.map(([p,c])=>`${p}: ${c}`)
.join(" | ")

document.getElementById("position-count").textContent = posText

}

document.addEventListener("change", e=>{

if(e.target.classList.contains("player-check")){
updateSummary()
}

})

document.getElementById("roster-select")
.addEventListener("change", e=>{

loadRoster(e.target.value)

})

loadRoster(document.getElementById("roster-select").value)
