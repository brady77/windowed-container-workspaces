// ─── Workspace Manager – popup.js ────────────────────────────────────────────

const CONTAINER_COLORS = [
  { id: "blue",      hex: "#3b82f6" },
  { id: "turquoise", hex: "#0ea5e9" },
  { id: "green",     hex: "#22c55e" },
  { id: "yellow",    hex: "#eab308" },
  { id: "orange",    hex: "#f97316" },
  { id: "red",       hex: "#ef4444" },
  { id: "pink",      hex: "#ec4899" },
  { id: "purple",    hex: "#a855f7" },
];

const CONTAINER_ICONS = [
  { id: "fingerprint", emoji: "🔑" },
  { id: "briefcase",   emoji: "💼" },
  { id: "cart",        emoji: "🛒" },
  { id: "circle",      emoji: "⚙️"  },
  { id: "dollar",      emoji: "💰" },
  { id: "fence",       emoji: "🏠" },
  { id: "food",        emoji: "🍕" },
  { id: "fruit",       emoji: "🍎" },
  { id: "gift",        emoji: "🎁" },
  { id: "pet",         emoji: "🐾" },
  { id: "tree",        emoji: "🌲" },
  { id: "vacation",    emoji: "✈️"  },
];

const ICON_EMOJI  = Object.fromEntries(CONTAINER_ICONS.map(i => [i.id, i.emoji]));
const COLOR_HEX   = Object.fromEntries(CONTAINER_COLORS.map(c => [c.id, c.hex]));
COLOR_HEX["gray"] = "#6b7280";

const DEFAULT_WORKSPACE_ID = "ws_default";

// ─── State ────────────────────────────────────────────────────────────────────

let workspaces = {};
let editingId  = null;
let selColor   = CONTAINER_COLORS[0].id;
let selIcon    = CONTAINER_ICONS[0].id;

// ─── Messaging ────────────────────────────────────────────────────────────────

function send(type, payload = {}) {
  return browser.runtime.sendMessage({ type, payload });
}

// ─── Render ───────────────────────────────────────────────────────────────────

function render() {
  const list    = document.getElementById("workspace-list");
  const emptyEl = document.getElementById("empty-state");
  const cards   = Object.values(workspaces).sort((a, b) => {
    if (a.id === DEFAULT_WORKSPACE_ID) return -1;
    if (b.id === DEFAULT_WORKSPACE_ID) return 1;
    return a.createdAt - b.createdAt;
  });

  list.querySelectorAll(".ws-card").forEach(el => el.remove());

  if (cards.length === 0) {
    emptyEl.style.display = "";
    return;
  }
  emptyEl.style.display = "none";

  cards.forEach((ws, idx) => {
    const card = document.createElement("div");
    card.className = "ws-card" + (ws.windowId !== null ? " active" : "");
    card.dataset.id = ws.id;
    card.style.animationDelay = `${idx * 30}ms`;

    const colorHex  = COLOR_HEX[ws.color]  || "#4f8ef7";
    const iconEmoji = ICON_EMOJI[ws.icon]  || "📁";
    const tabCount  = ws.tabs.length;
    const isLive    = ws.windowId !== null;

    // Color is set via JS after inserting HTML (CSP blocks inline style attributes)
    // Dot
    const dot = document.createElement("div");
    dot.className = "ws-dot";
    dot.style.setProperty("background-color", colorHex);

    // Icon
    const icon = document.createElement("div");
    icon.className = "ws-icon";
    icon.textContent = iconEmoji;

    // Info
    const info = document.createElement("div");
    info.className = "ws-info";
    const nameEl = document.createElement("div");
    nameEl.className = "ws-name";
    nameEl.textContent = ws.name;
    const metaEl = document.createElement("div");
    metaEl.className = "ws-meta";
    metaEl.textContent = `${tabCount} ${tabCount === 1 ? "tab" : "tabs"}`;
    info.appendChild(nameEl);
    info.appendChild(metaEl);

    // Status
    const status = document.createElement("span");
    status.className = `ws-status ${isLive ? "live" : "sleep"}`;
    status.textContent = isLive ? "active" : "sleeping";

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

    if (ws.id !== DEFAULT_WORKSPACE_ID) {
      const renameBtn = document.createElement("button");
      renameBtn.className = "ws-btn";
      renameBtn.dataset.action = "rename";
      renameBtn.title = "Rename";
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
    card.appendChild(status);
    card.appendChild(actions);

    card.addEventListener("click", (e) => {
      if (e.target.closest(".ws-btn")) return;
      handleOpen(ws.id);
    });

    card.querySelectorAll(".ws-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === "open")      handleOpen(ws.id);
        if (action === "hibernate") handleHibernate(ws.id);
        if (action === "rename")    showModal(ws.id);
        if (action === "delete")    showConfirm(ws.id);
      });
    });

    list.appendChild(card);

    if (ws.id !== DEFAULT_WORKSPACE_ID) {
      send("GET_WS_SIZE", { id: ws.id }).then(({ bytes }) => {
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
  workspaces = await send("GET_STATE");
  render();
}

async function handleOpen(id) {
  send("OPEN_WORKSPACE", { id }); // fire and forget
  window.close();
}

async function handleHibernate(id) {
  await send("HIBERNATE_WORKSPACE", { id });
  await refresh();
}

async function handleDelete(id) {
  await send("DELETE_WORKSPACE", { id });
  await refresh();
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

let pendingDeleteId = null;

function showConfirm(id) {
  const ws = workspaces[id];
  if (!ws) return;
  pendingDeleteId = id;
  document.getElementById("confirm-text").textContent = `Delete workspace "${ws.name}"?`;
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

function showModal(wsId = null) {
  editingId = wsId;
  const ws  = wsId ? workspaces[wsId] : null;

  document.getElementById("modal-title").textContent   = ws ? "Rename workspace" : "New workspace";
  document.getElementById("btn-save").textContent      = ws ? "Save" : "Create";
  document.getElementById("input-name").value          = ws ? ws.name : "";

  selColor = ws ? ws.color : CONTAINER_COLORS[0].id;
  selIcon  = ws ? ws.icon  : CONTAINER_ICONS[0].id;

  // Hide color/icon picker when renaming (not applicable, only used when creating)
  document.getElementById("color-icon-section").style.display = ws ? "none" : "";

  renderColorPicker();
  renderIconPicker();

  document.getElementById("modal-overlay").classList.remove("hidden");
  setTimeout(() => document.getElementById("input-name").focus(), 50);
}

function hideModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
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
  CONTAINER_ICONS.forEach(ic => {
    const btn = document.createElement("button");
    btn.className = "icon-btn" + (ic.id === selIcon ? " selected" : "");
    btn.textContent = ic.emoji;
    btn.title = ic.id;
    btn.addEventListener("click", () => { selIcon = ic.id; renderIconPicker(); });
    el.appendChild(btn);
  });
}

async function handleSave() {
  const name = document.getElementById("input-name").value.trim();
  if (!name) { document.getElementById("input-name").focus(); return; }

  const result = editingId
    ? await send("RENAME_WORKSPACE", { id: editingId, name })
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
    width: 420,
    height: 320
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

// ─── Boot ─────────────────────────────────────────────────────────────────────

refresh();
