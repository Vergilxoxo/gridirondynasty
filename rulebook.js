async function loadRulebook() {
  const res = await fetch(
    "https://opensheet.elk.sh/1TmZedqXNrEZ-LtPxma7AemFsKOoHErFgZhjIOK3C0hc/Regelwerk"
  );
  const rows = await res.json();

  const container = document.getElementById("docs-content");

  rows
    .sort((a, b) => Number(a.order) - Number(b.order))
    .forEach(row => {
      let el;

      switch (row.type) {
        case "h1":
          el = document.createElement("h1");
          el.className = "docs-h1";
          el.textContent = row.content;
          break;

        case "h2":
          el = document.createElement("h2");
          el.className = "docs-h2";
          el.textContent = row.content;
          break;

        case "h3":
          el = document.createElement("h3");
          el.className = "docs-h3";
          el.textContent = row.content;
          break;

        case "p":
          el = document.createElement("p");
          el.className = "docs-p";
          el.textContent = row.content;
          break;

        case "link":
          el = document.createElement("a");
          el.className = "docs-link";
          el.href = row.content;
          el.target = "_blank";
          el.rel = "noopener noreferrer";
          el.textContent = row.content;
          break;

        case "ul":
          el = document.createElement("ul");
          el.className = "docs-ul";
          el.innerHTML = row.content
            .split("|")
            .map(i => `<li>${i.trim()}</li>`)
            .join("");
          container.appendChild(el);
        return;

        case "ol":
          el = document.createElement("ol");
          el.className = "docs-ol";
          el.innerHTML = row.content
            .split("|")
            .map(i => `<li>${i.trim()}</li>`)
            .join("");
          container.appendChild(el);
        return;
          
        default:
          return;
      }

      container.appendChild(el);
    });
}

document.addEventListener("DOMContentLoaded", loadRulebook);
