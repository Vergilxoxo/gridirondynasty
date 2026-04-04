// Dummy-Daten – später aus euren echten Fantasy-Daten ersetzen
let recordsData = {
  singleWeekHigh: { owner: "Ralf", points: 178, img: "placeholder1.jpg" },
  singleWeekLow: { owner: "TitleTownPat", points: 32, img: "placeholder2.jpg" },
  narrowestWin: { owner: "MrNilsson", points: 101, img: "placeholder3.jpg" },
  largestBlowout: { owner: "Ulle", points: 198, img: "placeholder4.jpg" }
};

// Funktion, um die Records anzuzeigen
function renderRecords(data) {
  document.getElementById("swh-points").textContent = data.singleWeekHigh.points;
  document.getElementById("swh-owner").textContent = data.singleWeekHigh.owner;
  document.getElementById("swh-img").src = data.singleWeekHigh.img;

  document.getElementById("swl-points").textContent = data.singleWeekLow.points;
  document.getElementById("swl-owner").textContent = data.singleWeekLow.owner;
  document.getElementById("swl-img").src = data.singleWeekLow.img;

  document.getElementById("nw-points").textContent = data.narrowestWin.points;
  document.getElementById("nw-owner").textContent = data.narrowestWin.owner;
  document.getElementById("nw-img").src = data.narrowestWin.img;

  document.getElementById("lb-points").textContent = data.largestBlowout.points;
  document.getElementById("lb-owner").textContent = data.largestBlowout.owner;
  document.getElementById("lb-img").src = data.largestBlowout.img;
}

// Initiales Rendering
renderRecords(recordsData);

// Filter nach Manager
document.getElementById("roster-select-records").addEventListener("change", (e) => {
  const selected = e.target.value;

  if (selected === "ALL") {
    renderRecords(recordsData);
  } else {
    const filtered = {};
    for (const key in recordsData) {
      const record = recordsData[key];
      filtered[key] = (record.owner === selected)
        ? record
        : { owner: "--", points: "--", img: "placeholder.jpg" };
    }
    renderRecords(filtered);
  }
});
