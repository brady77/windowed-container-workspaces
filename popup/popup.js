// ─── Workspace Manager – popup.js ────────────────────────────────────────────

const CONTAINER_COLORS = [
  { id: "blue",      hex: "#37adff" },
  { id: "turquoise", hex: "#00c79a" },
  { id: "green",     hex: "#51cd00" },
  { id: "yellow",    hex: "#ffcb00" },
  { id: "orange",    hex: "#ff9f00" },
  { id: "red",       hex: "#ff613d" },
  { id: "pink",      hex: "#ff4bda" },
  { id: "purple",    hex: "#af51f5" },
];

const CONTAINER_ICON_IDS = [
  "fingerprint", "briefcase", "dollar", "cart", "vacation",
  "gift", "food", "fruit", "pet", "tree", "chill", "circle", "fence",
];

function iconUrl(id) {
  return id ? `resource://usercontext-content/${id}.svg` : null;
}

const COLOR_HEX   = Object.fromEntries(CONTAINER_COLORS.map(c => [c.id, c.hex]));
COLOR_HEX["gray"] = "#6b7280";

const DEFAULT_WORKSPACE_ID = "ws_default";

// ─── State ────────────────────────────────────────────────────────────────────

let workspaces   = {};
let wsOrder      = []; // user-defined sort order (wsNames, excluding default)
let editingId    = null; // wsName of workspace being edited, or null for new
let selColor     = CONTAINER_COLORS[0].id;
let selIcon      = "circle";
let searchFilter = "";

// ─── Messaging ────────────────────────────────────────────────────────────────

function send(type, payload = {}) {
  return browser.runtime.sendMessage({ type, payload });
}

// ─── Render ───────────────────────────────────────────────────────────────────

function wsDisplayName(ws) {
  return ws.wsName === DEFAULT_WORKSPACE_ID ? "Default (no container)" : ws.wsName;
}

function render() {
  const list     = document.getElementById("workspace-list");
  const emptyEl  = document.getElementById("empty-state");
  const searchBar = document.getElementById("search-bar");

  const nonDefaultSorted = getFullOrder().map(name => workspaces[name]).filter(Boolean);
  const allSorted = [
    ...(workspaces[DEFAULT_WORKSPACE_ID] ? [workspaces[DEFAULT_WORKSPACE_ID]] : []),
    ...nonDefaultSorted,
  ];

  searchBar.classList.toggle("hidden", nonDefaultSorted.length < 5);

  const cards = searchFilter
    ? allSorted.filter(w =>
        w.wsName === DEFAULT_WORKSPACE_ID ||
        w.wsName.toLowerCase().includes(searchFilter.toLowerCase()))
    : allSorted;

  list.querySelectorAll(".ws-card").forEach(el => el.remove());

  if (cards.length === 0) {
    emptyEl.style.display = "";
    return;
  }
  emptyEl.style.display = "none";

  cards.forEach((ws, idx) => {
    const card = document.createElement("div");
    card.className = "ws-card" + (ws.windowId !== null ? " active" : "");
    card.dataset.id = ws.wsName;
    card.style.animationDelay = `${idx * 30}ms`;

    const colorHex = COLOR_HEX[ws.color] || "#4f8ef7";
    const tabCount = ws.tabs.length;
    const isLive   = ws.windowId !== null;

    // Color is set via JS after inserting HTML (CSP blocks inline style attributes)
    // Dot
    const dot = document.createElement("div");
    dot.className = "ws-dot";
    dot.style.setProperty("background-color", colorHex);

    // Icon
    const icon = document.createElement("div");
    icon.className = "ws-icon";
    const url = iconUrl(ws.icon);
    if (url) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = ws.icon || "";
      icon.appendChild(img);
    }

    // Info
    const info = document.createElement("div");
    info.className = "ws-info";
    const nameEl = document.createElement("div");
    nameEl.className = "ws-name";
    nameEl.textContent = wsDisplayName(ws);
    const metaEl = document.createElement("div");
    metaEl.className = "ws-meta";
    metaEl.textContent = `${tabCount} ${tabCount === 1 ? "tab" : "tabs"}`;
    info.appendChild(nameEl);
    info.appendChild(metaEl);

    // Actions
    const actions = document.createElement("div");
    actions.className = "ws-actions";

    if (isLive) {
      const hibBtn = document.createElement("button");
      hibBtn.className = "ws-btn";
      hibBtn.dataset.action = "hibernate";
      hibBtn.title = "Hibernate";
      hibBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      actions.appendChild(hibBtn);
    } else {
      const openBtn = document.createElement("button");
      openBtn.className = "ws-btn";
      openBtn.dataset.action = "open";
      openBtn.title = "Open";
      openBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      actions.appendChild(openBtn);
    }

    if (ws.wsName !== DEFAULT_WORKSPACE_ID) {
      const nonDefIdx = nonDefaultSorted.indexOf(ws);

      if (!searchFilter) {
        const upBtn = document.createElement("button");
        upBtn.className = "ws-btn";
        upBtn.dataset.action = "move-up";
        upBtn.title = "Move up";
        upBtn.disabled = nonDefIdx === 0;
        upBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>`;
        actions.appendChild(upBtn);

        const downBtn = document.createElement("button");
        downBtn.className = "ws-btn";
        downBtn.dataset.action = "move-down";
        downBtn.title = "Move down";
        downBtn.disabled = nonDefIdx === nonDefaultSorted.length - 1;
        downBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;
        actions.appendChild(downBtn);
      }

      const renameBtn = document.createElement("button");
      renameBtn.className = "ws-btn";
      renameBtn.dataset.action = "rename";
      renameBtn.title = "Edit";
      renameBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      actions.appendChild(renameBtn);

      const delBtn = document.createElement("button");
      delBtn.className = "ws-btn danger";
      delBtn.dataset.action = "delete";
      delBtn.title = "Delete";
      delBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
      actions.appendChild(delBtn);
    }

    card.appendChild(dot);
    card.appendChild(icon);
    card.appendChild(info);
    card.appendChild(actions);

    card.addEventListener("click", (e) => {
      if (e.target.closest(".ws-btn")) return;
      handleOpen(ws.wsName);
    });

    card.querySelectorAll(".ws-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === "open")      handleOpen(ws.wsName);
        if (action === "hibernate") handleHibernate(ws.wsName);
        if (action === "rename")    showModal(ws.wsName);
        if (action === "delete")    showConfirm(ws.wsName);
        if (action === "move-up")   handleMove(ws.wsName, "up");
        if (action === "move-down") handleMove(ws.wsName, "down");
      });
    });

    list.appendChild(card);

    if (ws.wsName !== DEFAULT_WORKSPACE_ID) {
      send("GET_WS_SIZE", { name: ws.wsName }).then(({ bytes }) => {
        const kb = bytes / 1024;
        const sizeStr = kb < 1 ? `${bytes} B` : `${kb.toFixed(1)} KB`;
        const cls = bytes > 7168 ? "size-danger" : bytes > 6144 ? "size-warning" : "";
        const sizeSpan = document.createElement("span");
        if (cls) sizeSpan.className = cls;
        sizeSpan.textContent = ` · ${sizeStr} / 8 KB`;
        metaEl.appendChild(sizeSpan);
      }).catch(() => {});
    }
  });
}

// ─── Actions ─────────────────────────────────────────────────────────────────

async function refresh() {
  const state = await send("GET_STATE");
  workspaces = state.workspaces || state;
  wsOrder    = state.order      || [];
  render();
}

function getFullOrder() {
  // Start from the stored order, then append any unordered workspaces alphabetically
  const ordered = wsOrder.filter(name => workspaces[name]);
  Object.keys(workspaces)
    .filter(name => name !== DEFAULT_WORKSPACE_ID && !ordered.includes(name))
    .sort((a, b) => a.localeCompare(b))
    .forEach(name => ordered.push(name));
  return ordered;
}

async function handleOpen(name) {
  send("OPEN_WORKSPACE", { name }); // fire and forget
  window.close();
}

function handleMove(wsName, direction) {
  const order = getFullOrder();
  const idx = order.indexOf(wsName);
  if (direction === "up"   && idx > 0)                  [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
  else if (direction === "down" && idx < order.length - 1) [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
  else return;
  wsOrder = order;
  render();
  send("SET_ORDER", { order }).catch(e => console.error("SET_ORDER failed:", e));
}

async function handleHibernate(name) {
  await send("HIBERNATE_WORKSPACE", { name });
  await refresh();
}

async function handleDelete(name) {
  await send("DELETE_WORKSPACE", { name });
  await refresh();
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

let pendingDeleteId = null;

function showConfirm(wsName) {
  const ws = workspaces[wsName];
  if (!ws) return;
  pendingDeleteId = wsName;
  document.getElementById("confirm-text").textContent = `Delete workspace "${ws.wsName}"?`;
  document.getElementById("confirm-overlay").classList.remove("hidden");
}

function hideConfirm() {
  pendingDeleteId = null;
  document.getElementById("confirm-overlay").classList.add("hidden");
}

document.getElementById("confirm-cancel").addEventListener("click", hideConfirm);
document.getElementById("confirm-ok").addEventListener("click", async () => {
  if (pendingDeleteId) await handleDelete(pendingDeleteId);
  hideConfirm();
});
document.getElementById("confirm-overlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("confirm-overlay")) hideConfirm();
});

// ─── Create/Edit Modal ────────────────────────────────────────────────────────

function showModal(wsName = null) {
  editingId = wsName; // wsName is the stable identity in the new design
  const ws  = wsName ? workspaces[wsName] : null;

  document.getElementById("modal-title").textContent   = ws ? "Edit workspace" : "New workspace";
  document.getElementById("btn-save").textContent      = ws ? "Save" : "Create";
  document.getElementById("input-name").value          = ws ? ws.wsName : "";

  selColor = ws ? (ws.color || CONTAINER_COLORS[0].id) : CONTAINER_COLORS[0].id;
  selIcon  = ws ? (ws.icon  || "circle") : "circle";

  renderColorPicker();
  renderIconPicker();

  document.body.style.minHeight = "430px";
  document.getElementById("modal-overlay").classList.remove("hidden");
  setTimeout(() => document.getElementById("input-name").focus(), 50);
}

function hideModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  document.body.style.minHeight = "";
  editingId = null;
}

function renderColorPicker() {
  const el = document.getElementById("color-picker");
  el.innerHTML = "";
  CONTAINER_COLORS.forEach(c => {
    const sw = document.createElement("div");
    sw.className = "color-swatch" + (c.id === selColor ? " selected" : "");
    sw.style.background = c.hex;
    sw.title = c.id;
    sw.addEventListener("click", () => { selColor = c.id; renderColorPicker(); });
    el.appendChild(sw);
  });
}

function renderIconPicker() {
  const el = document.getElementById("icon-picker");
  el.innerHTML = "";
  CONTAINER_ICON_IDS.forEach(id => {
    const btn = document.createElement("button");
    btn.className = "icon-btn" + (id === selIcon ? " selected" : "");
    btn.title = id;
    const img = document.createElement("img");
    img.src = iconUrl(id);
    img.alt = id;
    btn.appendChild(img);
    btn.addEventListener("click", () => { selIcon = id; renderIconPicker(); });
    el.appendChild(btn);
  });
}

async function handleSave() {
  const name = document.getElementById("input-name").value.trim();
  if (!name) { document.getElementById("input-name").focus(); return; }

  const result = editingId
    ? await send("RENAME_WORKSPACE", { oldName: editingId, newName: name, icon: selIcon, color: selColor })
    : await send("CREATE_WORKSPACE", { name, color: selColor, icon: selIcon });

  if (result && result.error) {
    showInputError(result.error);
    return;
  }

  hideModal();
  await refresh();
}

function showInputError(msg) {
  let err = document.getElementById("input-error");
  if (!err) {
    err = document.createElement("div");
    err.id = "input-error";
    err.className = "input-error";
    document.getElementById("input-name").after(err);
  }
  err.textContent = msg;
}

document.getElementById("btn-new").addEventListener("click", () => showModal());
document.getElementById("btn-modal-close").addEventListener("click", hideModal);
document.getElementById("btn-cancel").addEventListener("click", hideModal);
document.getElementById("btn-save").addEventListener("click", handleSave);
document.getElementById("modal-overlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("modal-overlay")) hideModal();
});
document.getElementById("input-name").addEventListener("keydown", (e) => {
  if (e.key === "Enter")  handleSave();
  if (e.key === "Escape") hideModal();
});

// ─── Export / Import ──────────────────────────────────────────────────────────

function openImportExportPage() {
  browser.windows.create({
    type: "popup",
    url: browser.runtime.getURL("popup/import-export.html"),
    width: 460,
    height: 480
  });
  window.close();
}

document.getElementById("btn-backup").addEventListener("click", openImportExportPage);

// ─── Utility ─────────────────────────────────────────────────────────────────

function showToast(msg) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.getElementById("app").appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = "toast show";
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => { toast.className = "toast"; }, 2500);
}

function escHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ─── Search ───────────────────────────────────────────────────────────────────

document.getElementById("input-search").addEventListener("input", (e) => {
  searchFilter = e.target.value;
  render();
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

refresh();
