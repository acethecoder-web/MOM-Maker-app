const fileInput = document.getElementById("file");
const drop = document.getElementById("drop");
const fileName = document.getElementById("file-name");
const fileMeta = document.getElementById("file-meta");
const goBtn = document.getElementById("go");
const goLabel = document.getElementById("go-label");
const clearBtn = document.getElementById("clear");
const result = document.getElementById("result");
const out = document.getElementById("output");

let lastMinutes = null;

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function show(text, isError) {
  lastMinutes = null;
  result.classList.add("show");
  out.className = isError ? "error" : "status";
  out.textContent = text;
}


function showFile() {
  const f = fileInput.files[0];
  if (f) {
    fileName.textContent = f.name;
    fileMeta.textContent =
      (f.size / 1024).toFixed(0) + " KB. Select again to replace.";
    drop.classList.add("has-file");
  } else {
    fileName.textContent = "Choose a file or drop it here";
    fileMeta.textContent = "Word documents only (.docx)";
    drop.classList.remove("has-file");
  }
}

fileInput.addEventListener("change", showFile);

["dragenter", "dragover"].forEach((ev) =>
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add("is-over");
  }),
);
["dragleave", "drop"].forEach((ev) =>
  drop.addEventListener(ev, () => drop.classList.remove("is-over")),
);


function listSection(title, items) {
  const wrap = el("div");
  wrap.appendChild(el("h3", title));
  if (!items || items.length === 0) {
    wrap.appendChild(el("p", "None mentioned.", "muted"));
    return wrap;
  }
  const ul = el("ul");
  items.forEach((t) => ul.appendChild(el("li", t)));
  wrap.appendChild(ul);
  return wrap;
}

function actionTable(items) {
  const wrap = el("div");
  wrap.appendChild(el("h3", "Action items"));

  if (!items || items.length === 0) {
    wrap.appendChild(el("p", "None mentioned.", "muted"));
    return wrap;
  }

  const scroll = el("div", undefined, "table-wrap");
  const table = el("table");

  const headRow = el("tr");
  ["Task", "Responsible", "Due date"].forEach((h) =>
    headRow.appendChild(el("th", h)),
  );
  const thead = el("thead");
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = el("tbody");
  items.forEach((a) => {
    const row = el("tr");
    row.appendChild(el("td", a.task || "-"));
    row.appendChild(el("td", a.owner ?? "Unassigned"));
    row.appendChild(el("td", a.due ?? "Not set"));
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  scroll.appendChild(table);
  wrap.appendChild(scroll);
  return wrap;
}

function renderMinutes(data) {
  lastMinutes = data;
  result.classList.add("show");
  out.className = "";
  out.textContent = "";

  const box = el("div", undefined, "minutes");

  const summary = el("div");
  summary.appendChild(el("h3", "Summary"));
  summary.appendChild(el("p", data.summary || "No summary."));
  box.appendChild(summary);

  box.appendChild(listSection("Discussion points", data.discussion_points));
  box.appendChild(listSection("Decisions", data.decisions));
  box.appendChild(actionTable(data.action_items));

  out.appendChild(box);
}

function toPlainText(d) {
  const bullets = (arr) =>
    arr && arr.length ? arr.map((x) => "- " + x).join("\n") : "None mentioned.";
  const actions =
    d.action_items && d.action_items.length
      ? d.action_items
          .map(
            (a) =>
              `- ${a.task} (Responsible: ${a.owner ?? "Unassigned"}, Due: ${a.due ?? "Not set"})`,
          )
          .join("\n")
      : "None mentioned.";
  return [
    "Summary\n" + (d.summary || "No summary."),
    "Discussion points\n" + bullets(d.discussion_points),
    "Decisions\n" + bullets(d.decisions),
    "Action items\n" + actions,
  ].join("\n\n");
}


document.getElementById("copy").addEventListener("click", async (e) => {
  if (!lastMinutes) return;
  try {
    await navigator.clipboard.writeText(toPlainText(lastMinutes));
    e.target.textContent = "Copied";
    setTimeout(() => (e.target.textContent = "Copy"), 1500);
  } catch {
    e.target.textContent = "Copy failed";
  }
});

clearBtn.addEventListener("click", () => {
  fileInput.value = "";
  document.getElementById("transcript").value = "";
  showFile();
  result.classList.remove("show");
  out.className = "";
  out.textContent = "";
  lastMinutes = null;
});

goBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  const transcript = document.getElementById("transcript").value.trim();

  if (!file && !transcript) {
    show("Add a .docx file or paste a transcript first.", true);
    return;
  }

  goBtn.disabled = true;
  clearBtn.disabled = true;
  goBtn.classList.add("loading");
  goLabel.textContent = "Generating";
  show("Generating...");

  try {
    let res;
    if (file) {
      const form = new FormData();
      form.append("file", file);
      res = await fetch("/minutes-file", { method: "POST", body: form });
    } else {
      res = await fetch("/minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
    }

    const data = await res.json();
    if (!res.ok) {
      show(data.error || "Something went wrong.", true);
      return;
    }
    renderMinutes(data);
  } catch (e) {
    show("Error: " + e.message, true);
  } finally {
    goBtn.disabled = false;
    clearBtn.disabled = false;
    goBtn.classList.remove("loading");
    goLabel.textContent = "Generate minutes";
  }
});