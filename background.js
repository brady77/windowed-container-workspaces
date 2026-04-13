// ─── Windowed Container Workspaces – background.js ───────────────────────────

// ─── LZ-string komprese (inline, bez závislostí) ──────────────────────────────
// Zjednodušená implementace LZ-based komprese pro storage.sync
const LZString = (() => {
  const keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const baseReverseDic = {};
  for (let i = 0; i < keyStrBase64.length; i++) baseReverseDic[keyStrBase64[i]] = i;

  function _compress(uncompressed, bitsPerChar, getCharFromInt) {
    if (uncompressed == null) return "";
    let i, value, context_dictionary = {}, context_dictionaryToCreate = {},
      context_c = "", context_wc = "", context_w = "",
      context_enlargeIn = 2, context_dictSize = 3, context_numBits = 2,
      context_data = [], context_data_val = 0, context_data_position = 0, ii;
    for (ii = 0; ii < uncompressed.length; ii++) {
      context_c = uncompressed[ii];
      if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }
      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
        context_w = context_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
          if (context_w.charCodeAt(0) < 256) {
            for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else context_data_position++; }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 8; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else context_data_position++; value = value >> 1; }
          } else {
            value = 1;
            for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1) | value; if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else context_data_position++; value = 0; }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 16; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else context_data_position++; value = value >> 1; }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++; }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else context_data_position++; value = value >> 1; }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++; }
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }
    if (context_w !== "") {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else context_data_position++; }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 8; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else context_data_position++; value = value >> 1; }
        } else {
          value = 1;
          for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1) | value; if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else context_data_position++; value = 0; }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 16; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else context_data_position++; value = value >> 1; }
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else context_data_position++; value = value >> 1; }
      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++; }
    }
    value = 2;
    for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else context_data_position++; value = value >> 1; }
    while (true) { context_data_val = (context_data_val << 1); if (context_data_position == bitsPerChar - 1) { context_data.push(getCharFromInt(context_data_val)); break; } else context_data_position++; }
    return context_data.join('');
  }

  function _decompress(length, resetValue, getNextValue) {
    let dictionary = [], next, enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = [],
      i, w, bits, resb, maxpower, power, c, data = { val: getNextValue(0), position: resetValue, index: 1 };
    for (i = 0; i < 3; i++) dictionary[i] = i;
    bits = 0; maxpower = Math.pow(2, 2); power = 1;
    while (power != maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; }
    switch (next = bits) {
      case 0: bits = 0; maxpower = Math.pow(2, 8); power = 1; while (power != maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; } c = String.fromCharCode(bits); break;
      case 1: bits = 0; maxpower = Math.pow(2, 16); power = 1; while (power != maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; } c = String.fromCharCode(bits); break;
      case 2: return "";
    }
    dictionary[3] = c; w = c; result.push(c);
    while (true) {
      if (data.index > length) return "";
      bits = 0; maxpower = Math.pow(2, numBits); power = 1;
      while (power != maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; }
      switch (c = bits) {
        case 0: bits = 0; maxpower = Math.pow(2, 8); power = 1; while (power != maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; } dictionary[dictSize++] = String.fromCharCode(bits); c = dictSize - 1; enlargeIn--; break;
        case 1: bits = 0; maxpower = Math.pow(2, 16); power = 1; while (power != maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; } dictionary[dictSize++] = String.fromCharCode(bits); c = dictSize - 1; enlargeIn--; break;
        case 2: return result.join('');
      }
      if (enlargeIn == 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
      if (dictionary[c]) entry = dictionary[c]; else { if (c === dictSize) entry = w + w[0]; else return null; }
      result.push(entry); dictionary[dictSize++] = w + entry[0]; enlargeIn--;
      if (enlargeIn == 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
      w = entry;
    }
  }

  return {
    compress: (s) => _compress(s, 6, (a) => keyStrBase64[a]),
    decompress: (s) => {
      if (!s) return "";
      return _decompress(s.length, 32, (i) => baseReverseDic[s[i]]);
    }
  };
})();

// ─── Storage vrstva se sync podporou ─────────────────────────────────────────
// Každý workspace je uložen jako samostatný klíč "ws_{id}" v storage.sync
// (pro merge support). windowId se ukládá pouze do storage.local (je lokální).

const SYNC_PREFIX = "wcw_ws_";   // prefix pro sync klíče
const LOCAL_WINS  = "wcw_wins";  // lokální mapa windowId: { wsId: windowId }

const DEFAULT_WORKSPACE_ID = "ws_default";

function compressWs(ws) {
  // Odstraň windowId před uložením do sync (je lokální)
  const { windowId, ...syncData } = ws;
  return LZString.compress(JSON.stringify(syncData));
}

function decompressWs(compressed) {
  try {
    return JSON.parse(LZString.decompress(compressed));
  } catch (e) {
    console.error("Chyba dekomprese workspace:", e);
    return null;
  }
}

async function loadWorkspaces() {
  // Načti všechny sync klíče s prefixem
  let syncData = {};
  try {
    const allSync = await browser.storage.sync.get(null);
    for (const [key, val] of Object.entries(allSync)) {
      if (key.startsWith(SYNC_PREFIX)) {
        const ws = decompressWs(val);
        if (ws) syncData[ws.id] = ws;
      }
    }
  } catch (e) {
    console.warn("storage.sync nedostupný, používám local:", e.message);
    const local = await browser.storage.local.get("workspaces");
    syncData = local.workspaces || {};
  }

  // Přidej lokální windowId
  const localWins = await browser.storage.local.get(LOCAL_WINS);
  const wins = localWins[LOCAL_WINS] || {};
  for (const ws of Object.values(syncData)) {
    ws.windowId = wins[ws.id] || null;
  }

  return syncData;
}

async function saveWorkspace(ws) {
  const { windowId, ...syncData } = ws;

  // Ulož do sync (bez windowId)
  try {
    await browser.storage.sync.set({
      [SYNC_PREFIX + ws.id]: compressWs(ws)
    });
  } catch (e) {
    console.warn("storage.sync zápis selhal, ukládám do local:", e.message);
    const local = await browser.storage.local.get("workspaces");
    const workspaces = local.workspaces || {};
    workspaces[ws.id] = ws;
    await browser.storage.local.set({ workspaces });
  }
}

async function saveWindowId(wsId, windowId) {
  const localWins = await browser.storage.local.get(LOCAL_WINS);
  const wins = localWins[LOCAL_WINS] || {};
  if (windowId === null) {
    delete wins[wsId];
  } else {
    wins[wsId] = windowId;
  }
  await browser.storage.local.set({ [LOCAL_WINS]: wins });
}

async function deleteWorkspaceFromSync(wsId) {
  try {
    await browser.storage.sync.remove(SYNC_PREFIX + wsId);
  } catch (e) {
    console.warn("storage.sync mazání selhalo:", e.message);
  }
  await saveWindowId(wsId, null);
  // Fallback: odstraň i z local pokud tam je
  const local = await browser.storage.local.get("workspaces");
  if (local.workspaces && local.workspaces[wsId]) {
    delete local.workspaces[wsId];
    await browser.storage.local.set({ workspaces: local.workspaces });
  }
}

async function saveWorkspaces(workspaces) {
  // Hromadné uložení – použijeme pro zpětnou kompatibilitu
  for (const ws of Object.values(workspaces)) {
    await saveWorkspace(ws);
  }
}

// ─── Container helpers ────────────────────────────────────────────────────────

async function findOrCreateContainer(name, color, icon) {
  // Nejdřív hledej kontejner se stejným názvem (pro sync mezi zařízeními)
  const existing = await browser.contextualIdentities.query({ name });
  if (existing && existing.length > 0) {
    console.log("Nalezen existující kontejner:", name, existing[0].cookieStoreId);
    return existing[0];
  }
  return await browser.contextualIdentities.create({ name, color, icon });
}

async function deleteContainer(cookieStoreId) {
  try {
    await browser.contextualIdentities.remove(cookieStoreId);
  } catch (e) {
    console.warn("Could not remove container:", e);
  }
}

// ─── Window helpers ───────────────────────────────────────────────────────────

async function openWorkspaceWindow(workspace) {
  const urls = workspace.tabs.length > 0
    ? workspace.tabs.map(t => t.url)
    : ["about:blank"];

  const win = await browser.windows.create({});
  console.log("Okno vytvoreno:", win.id);

  const defaultTabs = await browser.tabs.query({ windowId: win.id });

  const createdTabs = [];
  for (let i = 0; i < urls.length; i++) {
    const tab = await browser.tabs.create({
      windowId: win.id,
      url: urls[i],
      cookieStoreId: workspace.cookieStoreId,
      active: i === 0
    });
    console.log("Tab vytvoren:", tab.id, "cookieStoreId:", tab.cookieStoreId);
    createdTabs.push(tab);
  }

  // Obnov pinned stav
  for (let i = 0; i < createdTabs.length && i < workspace.tabs.length; i++) {
    if (workspace.tabs[i].pinned) {
      await browser.tabs.update(createdTabs[i].id, { pinned: true });
    }
  }

  // Obnov skupiny tabů
  try {
    const groupsToCreate = {};
    for (let i = 0; i < workspace.tabs.length && i < createdTabs.length; i++) {
      const saved = workspace.tabs[i];
      if (saved.groupId !== null && saved.groupInfo) {
        if (!groupsToCreate[saved.groupId]) groupsToCreate[saved.groupId] = { tabIds: [], info: saved.groupInfo };
        groupsToCreate[saved.groupId].tabIds.push(createdTabs[i].id);
      }
    }
    for (const key of Object.keys(groupsToCreate)) {
      const { tabIds, info } = groupsToCreate[key];
      const newGroupId = await browser.tabs.group({ tabIds, createProperties: { windowId: win.id } });
      await browser.tabGroups.update(newGroupId, {
        title: info.title || "",
        color: info.color || "blue",
        collapsed: info.collapsed || false
      });
      console.log("Skupina obnovena:", info.title, "tabů:", tabIds.length);
    }
  } catch (e) {
    console.warn("Obnova skupin selhala:", e.message);
  }

  // Zavři výchozí prázdný tab
  if (defaultTabs.length > 0) {
    await browser.tabs.remove(defaultTabs.map(t => t.id));
  }

  return win.id;
}

async function snapshotWindow(windowId) {
  const tabs = await browser.tabs.query({ windowId });
  let groups = [];
  try { groups = await browser.tabGroups.query({ windowId }); } catch (e) {}
  const groupMap = {};
  for (const g of groups) groupMap[g.id] = { title: g.title, color: g.color, collapsed: g.collapsed };
  return tabs
    .filter(t => t.url && (!t.url.startsWith("about:") || t.url === "about:blank"))
    .map(t => ({
      url: t.url, title: t.title, pinned: t.pinned,
      groupId: (t.groupId != null && t.groupId !== -1) ? t.groupId : null,
      groupInfo: (t.groupId != null && t.groupId !== -1) ? (groupMap[t.groupId] || null) : null
    }));
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleCreateWorkspace({ name, color, icon }) {
  // Kontrola unikátnosti názvu
  const workspaces = await loadWorkspaces();
  const duplicate = Object.values(workspaces).find(w => w.name.toLowerCase() === name.toLowerCase());
  if (duplicate) throw new Error("Workspace s tímto názvem již existuje.");

  const container = await findOrCreateContainer(name, color, icon);
  const id = `ws_${Date.now()}`;

  const ws = {
    id, name, color, icon,
    cookieStoreId: container.cookieStoreId,
    windowId: null,
    tabs: [],
    createdAt: Date.now()
  };

  await saveWorkspace(ws);
  console.log("Workspace vytvoren:", id, "cookieStoreId:", container.cookieStoreId);
  return ws;
}

async function handleOpenWorkspace({ id }) {
  if (id === DEFAULT_WORKSPACE_ID) {
    const localWins = await browser.storage.local.get(LOCAL_WINS);
    const winsMap = localWins[LOCAL_WINS] || {};
    let windowId = winsMap[DEFAULT_WORKSPACE_ID] || null;
    if (windowId !== null) {
      try {
        await browser.windows.update(windowId, { focused: true });
        return { windowId };
      } catch (e) {
        console.log("Default workspace window gone, opening new");
      }
    }
    // Focus an existing unassigned window if one exists
    const allWins = await browser.windows.getAll({ populate: false });
    const assignedIds = new Set(Object.values(winsMap));
    const unassigned = allWins.filter(w => !assignedIds.has(w.id));
    if (unassigned.length > 0) {
      windowId = unassigned[unassigned.length - 1].id;
      await browser.windows.update(windowId, { focused: true });
      await saveWindowId(DEFAULT_WORKSPACE_ID, windowId);
      await refreshAllBadges();
      return { windowId };
    }
    const win = await browser.windows.create({});
    windowId = win.id;
    await saveWindowId(DEFAULT_WORKSPACE_ID, windowId);
    await refreshAllBadges();
    return { windowId };
  }

  const workspaces = await loadWorkspaces();
  const ws = workspaces[id];
  if (!ws) throw new Error("Workspace not found: " + id);

  console.log("Oteviram workspace:", ws.name, "cookieStoreId:", ws.cookieStoreId);

  // Pokud je okno již otevřené, jen ho aktivuj
  if (ws.windowId !== null) {
    try {
      await browser.windows.update(ws.windowId, { focused: true });
      return { windowId: ws.windowId };
    } catch (e) {
      console.log("Okno neexistuje, otviram nove");
    }
  }

  // Vždy hledej kontejner podle názvu (cookieStoreId se liší mezi zařízeními)
  const container = await findOrCreateContainer(ws.name, ws.color, ws.icon);
  if (container.cookieStoreId !== ws.cookieStoreId) {
    console.log("cookieStoreId aktualizováno pro:", ws.name, "->", container.cookieStoreId);
    ws.cookieStoreId = container.cookieStoreId;
    await saveWorkspace(ws);
  }

  const windowId = await openWorkspaceWindow(ws);
  ws.windowId = windowId;
  ws.tabs = [];
  await saveWorkspace(ws);
  await saveWindowId(id, windowId);
  await refreshAllBadges();
  return { windowId };
}

async function handleHibernateWorkspace({ id }) {
  if (id === DEFAULT_WORKSPACE_ID) {
    const localWins = await browser.storage.local.get(LOCAL_WINS);
    const winsMap = localWins[LOCAL_WINS] || {};
    const windowId = winsMap[DEFAULT_WORKSPACE_ID] || null;
    if (windowId !== null) {
      await saveWindowId(DEFAULT_WORKSPACE_ID, null);
      try { await browser.windows.remove(windowId); } catch (e) {}
      await refreshAllBadges();
    }
    return { ok: true };
  }

  const workspaces = await loadWorkspaces();
  const ws = workspaces[id];
  if (!ws) throw new Error("Workspace not found: " + id);

  if (ws.windowId !== null) {
    const snapshot = await snapshotWindow(ws.windowId);
    ws.tabs = snapshot.length > 0 ? snapshot : ws.tabs;
    ws.windowId = null;
    await saveWorkspace(ws);
    await saveWindowId(id, null);

    try {
      await browser.windows.remove(ws.windowId);
    } catch (e) {
      console.warn("Okno uz bylo zavreno:", e);
    }
    await refreshAllBadges();
  }

  return ws;
}

async function handleDeleteWorkspace({ id }) {
  const workspaces = await loadWorkspaces();
  const ws = workspaces[id];
  if (!ws) throw new Error("Workspace not found: " + id);

  if (ws.windowId !== null) {
    try { await browser.windows.remove(ws.windowId); } catch (e) {}
  }

  await deleteContainer(ws.cookieStoreId);
  await deleteWorkspaceFromSync(id);
  console.log("Workspace smazan:", id);
  return { ok: true };
}

async function handleRenameWorkspace({ id, name }) {
  const workspaces = await loadWorkspaces();
  const ws = workspaces[id];
  if (!ws) throw new Error("Workspace not found: " + id);

  // Kontrola unikátnosti nového názvu
  const duplicate = Object.values(workspaces).find(w => w.id !== id && w.name.toLowerCase() === name.toLowerCase());
  if (duplicate) throw new Error("Workspace s tímto názvem již existuje.");

  ws.name = name;
  await browser.contextualIdentities.update(ws.cookieStoreId, { name });
  await saveWorkspace(ws);
  return ws;
}

async function handleGetState() {
  const workspaces = await loadWorkspaces();
  const wins = await browser.windows.getAll();
  const openIds = new Set(wins.map(w => w.id));

  for (const ws of Object.values(workspaces)) {
    if (ws.windowId !== null && !openIds.has(ws.windowId)) {
      ws.windowId = null;
      await saveWindowId(ws.id, null);
    }
  }

  // Inject virtual default workspace
  const localWins = await browser.storage.local.get(LOCAL_WINS);
  const winsMap = localWins[LOCAL_WINS] || {};
  let defaultWindowId = winsMap[DEFAULT_WORKSPACE_ID] || null;
  if (defaultWindowId !== null && !openIds.has(defaultWindowId)) {
    defaultWindowId = null;
    await saveWindowId(DEFAULT_WORKSPACE_ID, null);
  }
  workspaces[DEFAULT_WORKSPACE_ID] = {
    id: DEFAULT_WORKSPACE_ID,
    name: "Default (no container)",
    color: "gray",
    icon: "circle",
    cookieStoreId: "firefox-default",
    windowId: defaultWindowId,
    tabs: [],
    createdAt: 0
  };

  return workspaces;
}

// ─── Message router ───────────────────────────────────────────────────────────

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Prijata zprava:", msg.type);

  let handler;
  switch (msg.type) {
    case "GET_STATE":           handler = handleGetState; break;
    case "CREATE_WORKSPACE":    handler = () => handleCreateWorkspace(msg.payload); break;
    case "OPEN_WORKSPACE":      handler = () => handleOpenWorkspace(msg.payload); break;
    case "HIBERNATE_WORKSPACE": handler = () => handleHibernateWorkspace(msg.payload); break;
    case "DELETE_WORKSPACE":    handler = () => handleDeleteWorkspace(msg.payload); break;
    case "RENAME_WORKSPACE":    handler = () => handleRenameWorkspace(msg.payload); break;
    default:
      sendResponse({ error: "Unknown message type: " + msg.type });
      return false;
  }

  handler()
    .then(result => sendResponse(result))
    .catch(err => {
      console.error("Handler error:", err);
      sendResponse({ error: err.message });
    });

  return true;
});

// ─── Auto-snapshot při zavření okna ──────────────────────────────────────────

browser.windows.onRemoved.addListener(async (windowId) => {
  // Handle default workspace window close
  const localWins = await browser.storage.local.get(LOCAL_WINS);
  const winsMap = localWins[LOCAL_WINS] || {};
  if (winsMap[DEFAULT_WORKSPACE_ID] === windowId) {
    await saveWindowId(DEFAULT_WORKSPACE_ID, null);
    return;
  }

  const workspaces = await loadWorkspaces();
  for (const ws of Object.values(workspaces)) {
    if (ws.windowId === windowId) {
      ws.windowId = null;
      await saveWorkspace(ws);
      await saveWindowId(ws.id, null);
      console.log("Okno zavreno, workspace hibernovan:", ws.name);
      break;
    }
  }
});

// ─── Průběžný snapshot + badge při přepnutí okna ─────────────────────────────

browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === browser.windows.WINDOW_ID_NONE) return;
  const workspaces = await loadWorkspaces();
  for (const ws of Object.values(workspaces)) {
    if (ws.windowId !== null) {
      const snap = await snapshotWindow(ws.windowId).catch(() => null);
      if (snap && snap.length > 0) {
        ws.tabs = snap;
        await saveWorkspace(ws);
      }
    }
  }
  await updateBadge(windowId).catch(() => {});
});

// ─── Automatické přiřazení kontejneru při otevření nového tabu ───────────────

browser.tabs.onCreated.addListener(async (tab) => {
  if (tab.cookieStoreId && tab.cookieStoreId !== "firefox-default") return;

  // Don't reassign tabs in the default workspace window
  const localWins = await browser.storage.local.get(LOCAL_WINS);
  const winsMap = localWins[LOCAL_WINS] || {};
  if (winsMap[DEFAULT_WORKSPACE_ID] === tab.windowId) return;

  const workspaces = await loadWorkspaces();
  const ws = Object.values(workspaces).find(w => w.windowId === tab.windowId);
  if (!ws) return;

  console.log("Nový tab bez kontejneru v workspace okně, přesouvám do:", ws.cookieStoreId);

  await new Promise(r => setTimeout(r, 100));

  let url = tab.url;
  if (!url || url === "" || url.startsWith("about:")) {
    url = "about:blank";
  }

  try {
    await browser.tabs.remove(tab.id);
    await browser.tabs.create({
      windowId: tab.windowId,
      url,
      cookieStoreId: ws.cookieStoreId,
      active: true
    });
  } catch (e) {
    console.error("Chyba při přesunu tabu do kontejneru:", e.message);
  }
});

// ─── Badge ────────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  blue: "#3b82f6", turquoise: "#0ea5e9", green: "#22c55e", yellow: "#eab308",
  orange: "#f97316", red: "#ef4444", pink: "#ec4899", purple: "#a855f7",
};

async function updateBadge(windowId) {
  // Check default workspace first
  const localWins = await browser.storage.local.get(LOCAL_WINS);
  const winsMap = localWins[LOCAL_WINS] || {};
  if (winsMap[DEFAULT_WORKSPACE_ID] === windowId) {
    await browser.browserAction.setBadgeText({ text: "DEF", windowId });
    await browser.browserAction.setBadgeBackgroundColor({ color: "#6b7280", windowId });
    return;
  }

  const workspaces = await loadWorkspaces();
  const ws = Object.values(workspaces).find(w => w.windowId === windowId);
  if (ws) {
    const badge = ws.name.substring(0, 3).toUpperCase();
    const color = COLOR_MAP[ws.color] || "#4f8ef7";
    await browser.browserAction.setBadgeText({ text: badge, windowId });
    await browser.browserAction.setBadgeBackgroundColor({ color, windowId });
  } else {
    await browser.browserAction.setBadgeText({ text: "", windowId });
  }
}

async function refreshAllBadges() {
  const wins = await browser.windows.getAll();
  for (const win of wins) {
    await updateBadge(win.id).catch(() => {});
  }
}

console.log("Windowed Container Workspaces background script nacten.");
