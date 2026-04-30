// ─── Backup & Restore page ────────────────────────────────────────────────────

function send(type, payload = {}) {
  return browser.runtime.sendMessage({ type, payload });
}

// ─── Panel switching ──────────────────────────────────────────────────────────

let backupWorkspaces = null;

function showPanel(id) {
  document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function showStatus(msg, type) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = `status ${type}`;
}

// ─── Export ───────────────────────────────────────────────────────────────────

document.getElementById("btn-export").addEventListener("click", async () => {
  const data = await send("EXPORT_WORKSPACES");
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wcw-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showStatus(`Exported ${data.workspaces.length} workspace${data.workspaces.length !== 1 ? "s" : ""}.`, "success");
});

// ─── Import: file pick → analyze → review panel ───────────────────────────────

document.getElementById("btn-import").addEventListener("click", () => {
  document.getElementById("import-file").click();
});

document.getElementById("import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = "";

  let data;
  try { data = JSON.parse(await file.text()); }
  catch { showStatus("Invalid JSON file.", "error"); return; }

  const result = await send("ANALYZE_IMPORT", { data });
  if (result && result.error) { showStatus("Cannot read backup: " + result.error, "error"); return; }

  backupWorkspaces = result.workspaces;
  if (!backupWorkspaces || backupWorkspaces.length === 0) {
    showStatus("Backup contains no workspaces.", "error");
    return;
  }

  renderReviewPanel(backupWorkspaces);
  showPanel("panel-review");
});

// ─── Review panel rendering ───────────────────────────────────────────────────
// These functions are designed to be reusable for the future "Pull from device"
// feature (Feature 1) — they accept a generic workspaces array.

function renderReviewPanel(workspaces) {
  const list = document.getElementById("review-list");
  list.innerHTML = "";

  workspaces.forEach((ws, wsIdx) => {
    const tabs = ws.tabs || [];

    // ── Workspace block ──────────────────────────────────────────────────────
    const block = document.createElement("div");
    block.className = "review-ws";

    // Header: name + select-all
    const header = document.createElement("div");
    header.className = "review-ws-header";

    const nameEl = document.createElement("span");
    nameEl.className = "review-ws-name";
    nameEl.textContent = ws.name;

    const allLabel = document.createElement("label");
    allLabel.className = "select-all-label";
    const allCb = document.createElement("input");
    allCb.type = "checkbox";
    allCb.dataset.wsIdx = wsIdx;
    allCb.className = "cb-select-all";
    const allText = document.createTextNode(" select all");
    allLabel.appendChild(allCb);
    allLabel.appendChild(allText);

    header.appendChild(nameEl);
    header.appendChild(allLabel);
    block.appendChild(header);

    // Tab rows
    const tabList = document.createElement("div");
    tabList.className = "review-tab-list";

    tabs.forEach((tab, tabIdx) => {
      const row = buildTabRow(tab, wsIdx, tabIdx);
      tabList.appendChild(row);
    });

    block.appendChild(tabList);
    list.appendChild(block);
  });

  // Wire select-all: toggle all tab checkboxes in this workspace
  list.querySelectorAll(".cb-select-all").forEach(allCb => {
    allCb.addEventListener("change", () => {
      const idx = allCb.dataset.wsIdx;
      list.querySelectorAll(`.cb-tab[data-ws-idx="${idx}"]`).forEach(cb => { cb.checked = allCb.checked; });
      updateRestoreButton();
    });
  });

  // Wire individual tab checkboxes: sync select-all indeterminate state
  list.querySelectorAll(".cb-tab").forEach(cb => {
    cb.addEventListener("change", () => {
      syncSelectAll(list, cb.dataset.wsIdx);
      updateRestoreButton();
    });
  });

  updateRestoreButton();
}

function buildTabRow(tab, wsIdx, tabIdx) {
  const row = document.createElement("label");
  row.className = "review-tab-row";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "cb-tab";
  cb.dataset.wsIdx = wsIdx;
  cb.dataset.tabIdx = tabIdx;

  const urlEl = document.createElement("span");
  urlEl.className = "tab-url";
  try { urlEl.textContent = new URL(tab.url).hostname || tab.url; }
  catch { urlEl.textContent = tab.url; }

  row.appendChild(cb);
  row.appendChild(urlEl);

  if (tab.groupInfo && tab.groupInfo.title) {
    const badge = document.createElement("span");
    badge.className = "group-badge";
    badge.textContent = tab.groupInfo.title;
    row.appendChild(badge);
  }

  return row;
}

function syncSelectAll(list, wsIdx) {
  const tabs = [...list.querySelectorAll(`.cb-tab[data-ws-idx="${wsIdx}"]`)];
  const allCb = list.querySelector(`.cb-select-all[data-ws-idx="${wsIdx}"]`);
  if (!allCb || tabs.length === 0) return;
  const n = tabs.filter(c => c.checked).length;
  allCb.checked = n === tabs.length;
  allCb.indeterminate = n > 0 && n < tabs.length;
}

function updateRestoreButton() {
  const any = document.querySelector("#review-list .cb-tab:checked");
  document.getElementById("btn-restore").disabled = !any;
}

// ─── Review panel actions ─────────────────────────────────────────────────────

document.getElementById("btn-cancel-review").addEventListener("click", () => {
  showPanel("panel-main");
});

document.getElementById("btn-restore").addEventListener("click", async () => {
  const btn = document.getElementById("btn-restore");
  btn.disabled = true;
  btn.textContent = "Restoring…";

  const payload = buildPayload();
  const result = await send("SELECTIVE_IMPORT", payload);

  if (result && result.error) {
    btn.textContent = "Restore selected";
    btn.disabled = false;
    // Show error inline above footer
    let errEl = document.getElementById("review-error");
    if (!errEl) {
      errEl = document.createElement("div");
      errEl.id = "review-error";
      errEl.className = "status error";
      errEl.style.margin = "0 16px 8px";
      document.querySelector(".review-footer").before(errEl);
    }
    errEl.textContent = "Restore failed: " + result.error;
    errEl.style.display = "block";
    return;
  }

  showResultPanel(result);
});

// Collects checked tabs from the review list into a SELECTIVE_IMPORT payload.
// wsColor / wsIcon are passed so the backend can create a container if the workspace
// doesn't exist locally. Designed to be called the same way for device pull (Feature 1).
function buildPayload() {
  const list = document.getElementById("review-list");
  const addTabs = [];

  backupWorkspaces.forEach((ws, wsIdx) => {
    const checked = [...list.querySelectorAll(`.cb-tab[data-ws-idx="${wsIdx}"]:checked`)];
    if (checked.length === 0) return;
    addTabs.push({
      wsName:  ws.name,
      wsColor: ws.color  || "blue",
      wsIcon:  ws.icon   || "circle",
      tabs: checked.map(cb => (ws.tabs || [])[parseInt(cb.dataset.tabIdx)])
    });
  });

  return { create: [], addTabs };
}

// ─── Result panel ─────────────────────────────────────────────────────────────

function showResultPanel({ created, tabsAdded, hibernatedWorkspaces }) {
  const msgEl = document.getElementById("result-message");
  const parts = [];
  if (created > 0) parts.push(`Created ${created} workspace${created !== 1 ? "s" : ""}`);
  parts.push(`Added ${tabsAdded} tab${tabsAdded !== 1 ? "s" : ""}`);
  msgEl.textContent = parts.join(", ") + ".";

  const notesEl = document.getElementById("result-notes");
  notesEl.innerHTML = "";
  if (hibernatedWorkspaces && hibernatedWorkspaces.length > 0) {
    const note = document.createElement("p");
    note.className = "result-note";
    note.textContent =
      `Tabs will appear when you next open: ${hibernatedWorkspaces.join(", ")}.`;
    notesEl.appendChild(note);
  }

  showPanel("panel-result");
}

document.getElementById("btn-result-close").addEventListener("click", () => window.close());

// ─── Shared close button ──────────────────────────────────────────────────────

document.getElementById("btn-close").addEventListener("click", () => window.close());
