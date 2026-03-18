const leagueId = "1311998228123643904"

let sheetData=[]
let sleeperData={}
let activePlayers=[]
let irPlayers=[]

async function fetchSheetPlayers(){

const res=await fetch("https://opensheet.elk.sh/1TmZedqXNrEZ-LtPxma7AemFsKOoHErFgZhjIOK3C0hc/Sheet1")
return await res.json()

}

async function fetchSleeperPlayers(){

const res=await fetch("https://api.sleeper.app/v1/players/nfl")
return await res.json()

}

async function loadRoster(rosterId){

sheetData=await fetchSheetPlayers()
sleeperData=await fetchSleeperPlayers()

const rosterRes=await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`)
const rosters=await rosterRes.json()

const roster=rosters.find(r=>r.roster_id==rosterId)

const taxiIds=(roster.taxi||[]).map(String)
const irIds=(roster.reserve||[]).map(String)
const allIds=(roster.players||[]).map(String)

const activeIds=allIds.filter(id=>!taxiIds.includes(id)&&!irIds.includes(id))

activePlayers=activeIds.map(mapPlayer)
irPlayers=irIds.map(mapPlayer)

renderTable("active-roster",activePlayers)
renderTable("taxi-roster",taxiIds.map(mapPlayer))
renderTable("ir-roster",irPlayers)

updateSalaryBlock()

}

function mapPlayer(id){

const sleeper=sleeperData[id]||{}
const sheet=sheetData.find(p=>String(p["Player ID"])===id)||{}

return{

id,
name:sleeper.full_name||"-",
pos:sleeper.position||"-",
team:sleeper.team||"-",
contract:sheet.Contract||"$0"

}

}

function renderTable(tableId,players){

const tbody=document.querySelector(`#${tableId} tbody`)
tbody.innerHTML=""

players.forEach(p=>{

const tr=document.createElement("tr")

tr.innerHTML=`

<td>
<input type="checkbox"
class="builder-check"
data-salary="${p.contract}">
</td>

<td>${p.name}</td>
<td>${p.pos}</td>
<td>${p.team}</td>
<td>${p.contract}</td>

`

tbody.appendChild(tr)

})

}

function parseMoney(str){

return parseInt(str.replace(/[^0-9]/g,""))||0

}

function updateSalaryBlock(){

const teamCap=160000000

let used=0

activePlayers.forEach(p=>{

const salary=parseMoney(p.contract)

const check=document.querySelector(`input[data-salary="${p.contract}"]`)

if(!check||!check.checked){

used+=salary

}

})

const space=teamCap-used

document.getElementById("salary-cap-block").innerHTML=`

<table>

<tr>
<th>Team Salary Cap</th>
<td>$${teamCap.toLocaleString("de-DE")}</td>
</tr>

<tr>
<th>Used Cap</th>
<td>$${used.toLocaleString("de-DE")}</td>
</tr>

<tr>
<th>Cap Space</th>
<td>$${space.toLocaleString("de-DE")}</td>
</tr>

</table>

`

}

document.addEventListener("change",e=>{

if(e.target.classList.contains("builder-check")){

updateSalaryBlock()

}

})

document.getElementById("roster-select")
.addEventListener("change",e=>{

loadRoster(e.target.value)

})

loadRoster(document.getElementById("roster-select").value)
