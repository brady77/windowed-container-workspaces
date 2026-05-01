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

// ─── Device section ───────────────────────────────────────────────────────────

async function loadDeviceSection() {
  let result;
  try {
    result = await send("GET_DEVICES");
  } catch (e) {
    return;
  }

  const { self, others } = result;
  const input = document.getElementById("input-device-name");
  if (self && self.deviceName) input.value = self.deviceName;

  if (others && others.length > 0) {
    renderDeviceList(others);
    document.getElementById("other-devices-section").classList.remove("hidden");
  }
}

function renderDeviceList(devices) {
  const list = document.getElementById("device-list");
  list.innerHTML = "";

  devices.forEach((device, idx) => {
    const item = document.createElement("div");
    item.className = "device-item";

    const info = document.createElement("div");
    info.className = "device-item-info";

    const name = document.createElement("span");
    name.className = "device-item-name";
    name.textContent = device.deviceName || ("Device " + device.deviceId.slice(0, 6));

    const meta = document.createElement("span");
    meta.className = "device-item-meta";
    const n = (device.workspaces || []).length;
    meta.textContent = `${n} workspace${n !== 1 ? "s" : ""}`;

    info.appendChild(name);
    info.appendChild(meta);

    const pullBtn = document.createElement("button");
    pullBtn.className = "btn-pull";
    pullBtn.textContent = "Pull…";
    pullBtn.addEventListener("click", () => startDevicePull(device));

    item.appendChild(info);
    item.appendChild(pullBtn);
    list.appendChild(item);
  });
}

function startDevicePull(device) {
  const workspaces = device.workspaces || [];
  if (workspaces.length === 0) return;

  backupWorkspaces = workspaces;
  const label = device.deviceName || ("Device " + device.deviceId.slice(0, 6));
  document.getElementById("panel-review-title").textContent = "Pull from " + label;
  renderReviewPanel(backupWorkspaces);
  showPanel("panel-review");
}

document.getElementById("btn-save-device-name").addEventListener("click", async () => {
  const name = document.getElementById("input-device-name").value.trim();
  if (!name) return;
  await send("SET_DEVICE_NAME", { name });
  const btn = document.getElementById("btn-save-device-name");
  btn.style.color = "var(--success)";
  setTimeout(() => { btn.style.color = ""; }, 1200);
});

document.getElementById("input-device-name").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btn-save-device-name").click();
});

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

  document.getElementById("panel-review-title").textContent = "Restore from backup";
  renderReviewPanel(backupWorkspaces);
  showPanel("panel-review");
});

// ─── Review panel rendering ───────────────────────────────────────────────────

function renderReviewPanel(workspaces) {
  const list = document.getElementById("review-list");
  list.innerHTML = "";

  workspaces.forEach((ws, wsIdx) => {
    const tabs = ws.tabs || [];
    // Support both new format (ws.wsName) and old backup format (ws.name)
    const displayName = ws.wsName || ws.name || "(unnamed)";

    // ── Workspace block ──────────────────────────────────────────────────────
    const block = document.createElement("div");
    block.className = "review-ws";

    // Header: name + select-all
    const header = document.createElement("div");
    header.className = "review-ws-header";

    const nameEl = document.createElement("span");
    nameEl.className = "review-ws-name";
    nameEl.textContent = displayName;

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
// wsName / wsColor are passed so the background can create a container if the workspace
// doesn't exist locally. Works identically for file import and device pull.
function buildPayload() {
  const list = document.getElementById("review-list");
  const addTabs = [];

  backupWorkspaces.forEach((ws, wsIdx) => {
    const checked = [...list.querySelectorAll(`.cb-tab[data-ws-idx="${wsIdx}"]:checked`)];
    if (checked.length === 0) return;
    addTabs.push({
      wsName:  ws.wsName  || ws.name  || "",
      wsColor: ws.color   || "blue",
      wsIcon:  ws.icon    || "circle",
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

// ─── Live refresh of other-devices list ──────────────────────────────────────

async function refreshOtherDevicesList() {
  let result;
  try { result = await send("GET_DEVICES"); } catch (e) { return; }
  const { others } = result;
  const section = document.getElementById("other-devices-section");
  if (others && others.length > 0) {
    renderDeviceList(others);
    section.classList.remove("hidden");
  } else {
    section.classList.add("hidden");
  }
}

let _deviceRefreshTimer = null;
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (!Object.keys(changes).some(k => k.startsWith("wcw_snap_"))) return;
  if (_deviceRefreshTimer) clearTimeout(_deviceRefreshTimer);
  _deviceRefreshTimer = setTimeout(() => {
    _deviceRefreshTimer = null;
    refreshOtherDevicesList();
  }, 500);
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

loadDeviceSection();
