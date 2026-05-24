// ─── Windowed Container Workspaces – background.js ───────────────────────────

// ─── LZ-string compression (inline, no external dependencies) ───────────────
// Inline implementation of the LZ-based compression algorithm (originally by pieroxy,
// MIT license, https://github.com/pieroxy/lz-string) used to compress workspace data
// to fit within Firefox's storage.sync 8 KB per-key limit. No external requests are made.
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

// ─── Storage constants ────────────────────────────────────────────────────────
// Per-device snapshot keys in storage.sync: wcw_snap_{deviceId}_{encodedWsName}
// windowId is never persisted — it lives only in storage.local keyed by wsName.

const SNAP_PREFIX       = "wcw_snap_";       // sync key prefix
const LOCAL_WINS        = "wcw_wins";        // local: { wsName → windowId }
const LOCAL_DEVICE_ID   = "wcw_device_id";   // local: stable device identifier
const LOCAL_DEVICE_NAME = "wcw_device_name"; // local: human-readable device label
const LOCAL_ORDER       = "wcw_order";       // local: [wsName, ...] user-defined sort order

const DEFAULT_WORKSPACE_ID = "ws_default"; // virtual default (no container) workspace
const DEFAULT_ICON         = "circle";      // Firefox container icon used as fallback

// ─── Device identity ──────────────────────────────────────────────────────────

function snapKey(deviceId, wsName) {
  return SNAP_PREFIX + deviceId + "_" + encodeURIComponent(wsName);
}

let _cachedDeviceId = null;

async function getOrCreateDeviceId() {
  const local = await browser.storage.local.get(LOCAL_DEVICE_ID);
  if (local[LOCAL_DEVICE_ID]) return local[LOCAL_DEVICE_ID];
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await browser.storage.local.set({ [LOCAL_DEVICE_ID]: id });
  return id;
}

async function myDeviceId() {
  if (!_cachedDeviceId) _cachedDeviceId = await getOrCreateDeviceId();
  return _cachedDeviceId;
}

async function getOrCreateDeviceName(deviceId) {
  const local = await browser.storage.local.get(LOCAL_DEVICE_NAME);
  if (local[LOCAL_DEVICE_NAME]) return local[LOCAL_DEVICE_NAME];
  const name = "Device " + deviceId;
  await browser.storage.local.set({ [LOCAL_DEVICE_NAME]: name });
  return name;
}

// ─── Compression helpers ──────────────────────────────────────────────────────

function compressWs(wsData) {
  // Workspace data is compressed with LZString before storing to stay within Firefox
  // sync's 8 KB per-key limit. Compression typically reduces payload size by 60–70%.
  return LZString.compress(JSON.stringify(wsData));
}

function decompressWs(compressed) {
  try {
    return JSON.parse(LZString.decompress(compressed));
  } catch (e) {
    console.error("Workspace decompression error:", e);
    return null;
  }
}

// ─── Storage layer ────────────────────────────────────────────────────────────

async function loadWorkspaces() {
  const deviceId = await myDeviceId();
  const prefix = snapKey(deviceId, ""); // "wcw_snap_{deviceId}_"

  let result = {};
  try {
    const allSync = await browser.storage.sync.get(null);
    for (const [key, val] of Object.entries(allSync)) {
      if (key.startsWith(prefix)) {
        const ws = decompressWs(val);
        if (ws && ws.wsName) result[ws.wsName] = ws;
      }
    }
  } catch (e) {
    console.warn("storage.sync unavailable, using local fallback:", e.message);
    const local = await browser.storage.local.get("workspaces");
    result = local.workspaces || {};
  }

  // Attach device-local windowId (never stored in sync)
  const localWins = await browser.storage.local.get(LOCAL_WINS);
  const wins = localWins[LOCAL_WINS] || {};
  for (const ws of Object.values(result)) {
    ws.windowId = wins[ws.wsName] || null;
  }

  return result;
}

async function saveWorkspace(ws) {
  const deviceId = await myDeviceId();
  const wsData = { ...ws };
  delete wsData.windowId; // never persist runtime window reference
  wsData.updatedAt = Date.now();
  wsData.deviceName = await getOrCreateDeviceName(deviceId);

  try {
    await browser.storage.sync.set({
      [snapKey(deviceId, ws.wsName)]: compressWs(wsData)
    });
  } catch (e) {
    console.warn("storage.sync write failed:", e.message);
  }
}

async function saveWindowId(wsName, windowId) {
  const localWins = await browser.storage.local.get(LOCAL_WINS);
  const wins = localWins[LOCAL_WINS] || {};
  if (windowId === null) {
    delete wins[wsName];
  } else {
    wins[wsName] = windowId;
  }
  await browser.storage.local.set({ [LOCAL_WINS]: wins });
}

async function deleteWorkspaceFromSync(wsName) {
  const deviceId = await myDeviceId();
  try {
    await browser.storage.sync.remove(snapKey(deviceId, wsName));
  } catch (e) {
    console.warn("storage.sync delete failed:", e.message);
  }
  await saveWindowId(wsName, null);
}

// ─── Migration from legacy format ─────────────────────────────────────────────
// Reads old wcw_ws_* keys, converts them to per-device wcw_snap_* format, then
// removes the old keys. Runs once on startup; no-op when no legacy keys exist.

async function migrateFromLegacy() {
  const LEGACY_PREFIX = "wcw_ws_";
  let allSync;
  try {
    allSync = await browser.storage.sync.get(null);
  } catch (e) {
    return;
  }
  const legacyKeys = Object.keys(allSync).filter(k => k.startsWith(LEGACY_PREFIX));
  if (legacyKeys.length === 0) return;

  const deviceId = await myDeviceId();
  console.log("Migrating", legacyKeys.length, "legacy workspace(s) to per-device format.");

  for (const key of legacyKeys) {
    try {
      const old = decompressWs(allSync[key]);
      if (!old || !old.name) continue;
      // NOTE: groupInfo.title is intentionally preserved as-is from the legacy format.
      // In v1.5.3, tab group titles were never correctly persisted to storage (always saved
      // as empty string ""). This is a known limitation — group names from pre-1.6.0 data
      // cannot be recovered during migration.
      // Explicitly map tabs to guarantee groupInfo.title survives the format change
      const tabs = (old.tabs || []).map(t => ({
        url:       t.url,
        title:     t.title || t.url,
        pinned:    !!t.pinned,
        groupId:   t.groupId != null ? t.groupId : null,
        groupInfo: t.groupInfo ? {
          title:     t.groupInfo.title != null ? t.groupInfo.title : "",
          color:     t.groupInfo.color     || "blue",
          collapsed: !!t.groupInfo.collapsed
        } : null
      }));
      const newWs = {
        wsName:    old.name,
        color:     old.color || "blue",
        icon:      old.icon  || DEFAULT_ICON,
        deviceId,
        updatedAt: old.createdAt || Date.now(),
        tabs
      };
      await browser.storage.sync.set({ [snapKey(deviceId, old.name)]: compressWs(newWs) });
      await browser.storage.sync.remove(key);
      console.log("Migrated workspace:", old.name);
    } catch (e) {
      console.error("Migration failed for key:", key, e.message);
    }
  }

  // Remove stale UUID-format keys from wcw_wins (old format: ws_<timestamp>)
  const localWinsData = await browser.storage.local.get(LOCAL_WINS);
  const wins = localWinsData[LOCAL_WINS] || {};
  const staleKeys = Object.keys(wins).filter(k => /^ws_\d+$/.test(k));
  if (staleKeys.length > 0) {
    for (const k of staleKeys) delete wins[k];
    await browser.storage.local.set({ [LOCAL_WINS]: wins });
    console.log("Removed", staleKeys.length, "stale wcw_wins key(s):", staleKeys);
  }
}

// ─── Snapshot debounce ────────────────────────────────────────────────────────
// Tab events fire very frequently during active browsing. To avoid flooding
// storage.sync, snapshot writes triggered by tab listeners are debounced by 60 s.
// Explicit user actions (open, hibernate, rename, delete) always write immediately.

const snapshotTimers   = new Map(); // wsName → timeoutId
const pendingSnapshots = new Map(); // wsName → ws (latest in-memory state, not yet persisted)

function scheduleSnapshot(ws) {
  pendingSnapshots.set(ws.wsName, ws);
  const prev = snapshotTimers.get(ws.wsName);
  if (prev) clearTimeout(prev);
  const timer = setTimeout(async () => {
    snapshotTimers.delete(ws.wsName);
    pendingSnapshots.delete(ws.wsName);
    await saveWorkspace(ws).catch(e => console.error("Deferred snapshot save failed:", e));
  }, 60000);
  snapshotTimers.set(ws.wsName, timer);
}

// ─── Container helpers ────────────────────────────────────────────────────────

async function findOrCreateContainer(name, color, icon) {
  // Always resolve by name, not by cookieStoreId: IDs are assigned locally by Firefox
  // and differ between devices even when synced through Firefox Sync.
  const existing = await browser.contextualIdentities.query({ name });
  if (existing && existing.length > 0) {
    console.log("Found existing container:", name, existing[0].cookieStoreId);
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

async function openWorkspaceWindow(workspace, cookieStoreId) {
  const win = await browser.windows.create({});
  console.log("Window created:", win.id);

  const defaultTabs = await browser.tabs.query({ windowId: win.id });

  // Each entry pairs the created Firefox tab with its saved metadata.
  // Tabs that fail to open (e.g. file:// URLs in containers) are skipped
  // so one bad URL cannot abort the rest of the workspace restore.
  // Determine which saved tab should be active. Fall back to the first tab if none
  // has active:true (e.g. older snapshots that predate this field).
  const hasActive = workspace.tabs.some(t => t.active);
  const pairedTabs = [];
  for (const saved of workspace.tabs) {
    const isActive = hasActive ? !!saved.active : workspace.tabs.indexOf(saved) === 0;
    const isLazy = !isActive && (saved.url.startsWith("http://") || saved.url.startsWith("https://"));
    let tab;
    try {
      tab = await browser.tabs.create({
        windowId: win.id,
        url: saved.url,
        cookieStoreId,
        active: isActive,
        ...(isLazy ? { discarded: true, title: saved.title || "" } : {})
      });
      console.log("Tab created:", tab.id, "cookieStoreId:", tab.cookieStoreId, isLazy ? "(discarded)" : "(active)");
    } catch (e) {
      console.warn("Could not open tab, skipping:", saved.url, e.message);
      continue;
    }
    pairedTabs.push({ created: tab, saved });
  }

  // Restore pinned state
  for (const { created, saved } of pairedTabs) {
    if (saved.pinned) {
      await browser.tabs.update(created.id, { pinned: true });
    }
  }

  // Restore tab groups
  try {
    const groupsToCreate = {};
    for (const { created, saved } of pairedTabs) {
      if (saved.groupId !== null && saved.groupInfo) {
        if (!groupsToCreate[saved.groupId]) groupsToCreate[saved.groupId] = { tabIds: [], info: saved.groupInfo };
        groupsToCreate[saved.groupId].tabIds.push(created.id);
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
      console.log("Group restored:", info.title, "tabs:", tabIds.length);
    }
  } catch (e) {
    console.warn("Group restore failed:", e.message);
  }

  // Close the default blank tab opened automatically by browser.windows.create,
  // unless no workspace tabs were successfully opened (keep it so the window stays open).
  if (defaultTabs.length > 0 && pairedTabs.length > 0) {
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
      url: t.url, title: t.title, pinned: t.pinned, active: t.active,
      groupId: (t.groupId != null && t.groupId !== -1) ? t.groupId : null,
      groupInfo: (t.groupId != null && t.groupId !== -1) ? (groupMap[t.groupId] || null) : null
    }));
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleCreateWorkspace({ name, color, icon }) {
  const workspaces = await loadWorkspaces();
  const duplicate = Object.values(workspaces).find(w => w.wsName.toLowerCase() === name.toLowerCase());
  if (duplicate) throw new Error("A workspace with this name already exists.");

  const deviceId = await myDeviceId();
  // cookieStoreId is never stored — resolved by name on each device at runtime.
  await findOrCreateContainer(name, color || "blue", icon || DEFAULT_ICON);

  const ws = {
    wsName:    name,
    color:     color || "blue",
    icon:      icon  || DEFAULT_ICON,
    deviceId,
    updatedAt: Date.now(),
    tabs:      []
  };

  await saveWorkspace(ws);
  console.log("Workspace created:", name);
  return ws;
}

async function handleOpenWorkspace({ name }) {
  if (name === DEFAULT_WORKSPACE_ID) {
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
  const ws = workspaces[name];
  if (!ws) throw new Error("Workspace not found: " + name);

  console.log("Opening workspace:", ws.wsName);

  // Container resolved by name — cookieStoreId differs between devices
  const container = await findOrCreateContainer(ws.wsName, ws.color, ws.icon || DEFAULT_ICON);

  if (ws.windowId !== null) {
    try {
      await browser.windows.update(ws.windowId, { focused: true });
      return { windowId: ws.windowId };
    } catch (e) {
      console.log("Window gone, opening new");
    }
  }

  const windowId = await openWorkspaceWindow(ws, container.cookieStoreId);

  // Snapshot immediately after the window is built — group titles are fully applied
  // here because openWorkspaceWindow awaits tabGroups.update(). Taking the snapshot
  // before saveWindowId prevents any concurrent tab events from interfering.
  const openSnap = await snapshotWindow(windowId).catch(() => null);
  ws.windowId = windowId;
  ws.tabs = openSnap && openSnap.length > 0 ? openSnap : [];
  await saveWorkspace(ws);
  await saveWindowId(ws.wsName, windowId);
  await refreshAllBadges();
  return { windowId };
}

async function handleHibernateWorkspace({ name }) {
  if (name === DEFAULT_WORKSPACE_ID) {
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
  const ws = workspaces[name];
  if (!ws) throw new Error("Workspace not found: " + name);

  if (ws.windowId !== null) {
    const windowId = ws.windowId;
    const snapshot = await snapshotWindow(windowId);
    ws.tabs = snapshot.length > 0 ? snapshot : ws.tabs;
    ws.windowId = null;
    await saveWorkspace(ws);
    await saveWindowId(ws.wsName, null);

    try {
      await browser.windows.remove(windowId);
    } catch (e) {
      console.warn("Window already closed:", e);
    }
    await refreshAllBadges();
  }

  return ws;
}

async function handleDeleteWorkspace({ name }) {
  const workspaces = await loadWorkspaces();
  const ws = workspaces[name];
  if (!ws) throw new Error("Workspace not found: " + name);

  if (ws.windowId !== null) {
    try { await browser.windows.remove(ws.windowId); } catch (e) {}
  }

  const existing = await browser.contextualIdentities.query({ name: ws.wsName });
  if (existing && existing.length > 0) {
    await deleteContainer(existing[0].cookieStoreId);
  }

  await deleteWorkspaceFromSync(ws.wsName);

  const localOrderData = await browser.storage.local.get(LOCAL_ORDER);
  const order = (localOrderData[LOCAL_ORDER] || []).filter(n => n !== name);
  await browser.storage.local.set({ [LOCAL_ORDER]: order });

  console.log("Workspace deleted:", name);
  return { ok: true };
}

async function handleRenameWorkspace({ oldName, newName, icon, color }) {
  const workspaces = await loadWorkspaces();
  const ws = workspaces[oldName];
  if (!ws) throw new Error("Workspace not found: " + oldName);

  const nameChanged = newName !== oldName;

  if (nameChanged) {
    const duplicate = Object.values(workspaces).find(
      w => w.wsName !== oldName && w.wsName.toLowerCase() === newName.toLowerCase()
    );
    if (duplicate) throw new Error("A workspace with this name already exists.");
  }

  // Update the Firefox container (name, icon, color as applicable)
  const existing = await browser.contextualIdentities.query({ name: oldName });
  if (existing && existing.length > 0) {
    const update = {};
    if (nameChanged)           update.name  = newName;
    if (icon && icon !== ws.icon)   update.icon  = icon;
    if (color && color !== ws.color) update.color = color;
    if (Object.keys(update).length > 0) {
      await browser.contextualIdentities.update(existing[0].cookieStoreId, update);
    }
  }

  const newWs = {
    ...ws,
    wsName: newName,
    icon:   icon  || ws.icon,
    color:  color || ws.color,
  };
  await saveWorkspace(newWs);

  // Only remove the old key when the name actually changed — if name is unchanged,
  // the old and new keys are identical and removing it would delete the snapshot.
  if (nameChanged) {
    const deviceId = await myDeviceId();
    await browser.storage.sync.remove(snapKey(deviceId, oldName));

    const localWins = await browser.storage.local.get(LOCAL_WINS);
    const wins = localWins[LOCAL_WINS] || {};
    if (wins[oldName] !== undefined) {
      wins[newName] = wins[oldName];
      delete wins[oldName];
      await browser.storage.local.set({ [LOCAL_WINS]: wins });
    }

    const localOrderData = await browser.storage.local.get(LOCAL_ORDER);
    const order = (localOrderData[LOCAL_ORDER] || []).map(n => n === oldName ? newName : n);
    await browser.storage.local.set({ [LOCAL_ORDER]: order });
  }

  return newWs;
}

async function handleExportWorkspaces() {
  const deviceId = await myDeviceId();
  const prefix = snapKey(deviceId, "");
  const allSync = await browser.storage.sync.get(null);
  const workspaces = [];
  for (const [key, val] of Object.entries(allSync)) {
    if (key.startsWith(prefix)) {
      const ws = decompressWs(val);
      if (ws) workspaces.push(ws);
    }
  }
  const localOrderData = await browser.storage.local.get(LOCAL_ORDER);
  const order = localOrderData[LOCAL_ORDER] || [];
  return { version: "2.0", exported_at: new Date().toISOString(), workspaces, order };
}

// Returns the backup data structured for the review UI. No comparison with local state.
async function handleAnalyzeImport({ data }) {
  if (!data || !Array.isArray(data.workspaces)) throw new Error("Invalid backup format");
  return { workspaces: data.workspaces };
}

// Finds an existing groupId in the snapshot whose groupInfo.title matches, or allocates
// the next integer above the current maximum. Tabs sharing a group name stay together.
function resolveGroupIdForSnapshot(existingTabs, groupInfo) {
  if (!groupInfo || !groupInfo.title) return null;
  for (const t of existingTabs) {
    if (t.groupInfo && t.groupInfo.title === groupInfo.title) return t.groupId;
  }
  const used = existingTabs.map(t => t.groupId).filter(id => id != null);
  return (used.length > 0 ? Math.max(...used) : 0) + 1;
}

// Adds a single tab live into an open workspace window, assigning it to a tab group
// by name (reuses an existing group if one with the same title exists, else creates one).
async function addTabLive(windowId, cookieStoreId, tab) {
  const newTab = await browser.tabs.create({ windowId, url: tab.url, cookieStoreId, active: false });
  if (!tab.groupInfo || !tab.groupInfo.title) return;
  let groups = [];
  try { groups = await browser.tabGroups.query({ windowId }); } catch (e) {}
  const existing = groups.find(g => g.title === tab.groupInfo.title);
  if (existing) {
    await browser.tabs.group({ tabIds: [newTab.id], groupId: existing.id });
  } else {
    const gid = await browser.tabs.group({ tabIds: [newTab.id], createProperties: { windowId } });
    await browser.tabGroups.update(gid, {
      title: tab.groupInfo.title || "",
      color: tab.groupInfo.color || "blue",
      collapsed: tab.groupInfo.collapsed || false
    });
  }
}

async function handleSelectiveImport({ create, addTabs }) {
  let createdCount = 0;
  let tabsAdded = 0;
  const hibernatedNames = [];

  // Phase 1: create explicitly listed workspace shells (usually empty in current UI)
  for (const ws of (create || [])) {
    try {
      await handleCreateWorkspace({ name: ws.wsName || ws.name, color: ws.color || "blue" });
      createdCount++;
    } catch (e) {
      console.warn("Could not pre-create workspace:", ws.wsName || ws.name, e.message);
    }
  }

  // Phase 2: add tabs — find workspace by name, auto-creating if absent
  let workspaces = await loadWorkspaces();
  const findByName = name => Object.values(workspaces).find(w => w.wsName.toLowerCase() === name.toLowerCase());

  for (const entry of (addTabs || [])) {
    const { wsName, wsColor, wsIcon, tabs } = entry;
    if (!tabs || tabs.length === 0) continue;

    let ws = findByName(wsName);

    if (!ws) {
      try {
        await handleCreateWorkspace({ name: wsName, color: wsColor || "blue", icon: wsIcon || DEFAULT_ICON });
        createdCount++;
        workspaces = await loadWorkspaces();
        ws = findByName(wsName);
      } catch (e) {
        console.error("Failed to create workspace for import:", wsName, e.message);
        continue;
      }
    }
    if (!ws) continue;

    const container = await findOrCreateContainer(ws.wsName, ws.color, ws.icon || DEFAULT_ICON);

    if (ws.windowId !== null) {
      // Window is open: add tabs live with group handling
      for (const tab of tabs) {
        await addTabLive(ws.windowId, container.cookieStoreId, tab).catch(e => {
          console.error("addTabLive failed:", tab.url, e.message);
        });
        tabsAdded++;
      }
    } else {
      // Hibernated: append to snapshot, preserving group structure
      for (const tab of tabs) {
        const groupId = resolveGroupIdForSnapshot(ws.tabs, tab.groupInfo || null);
        ws.tabs.push({
          url: tab.url,
          title: tab.title || tab.url,
          pinned: tab.pinned || false,
          groupId,
          groupInfo: tab.groupInfo || null
        });
        tabsAdded++;
      }
      await saveWorkspace(ws);
      if (!hibernatedNames.includes(ws.wsName)) hibernatedNames.push(ws.wsName);
    }
  }

  return { created: createdCount, tabsAdded, hibernatedWorkspaces: hibernatedNames };
}

async function handleGetWsSize({ name }) {
  const deviceId = await myDeviceId();
  const bytes = await browser.storage.sync.getBytesInUse(snapKey(deviceId, name));
  return { bytes };
}

async function handleGetState() {
  const workspaces = await loadWorkspaces();
  const wins = await browser.windows.getAll({ populate: true });
  const openIds = new Set(wins.map(w => w.id));

  // Collect windowIds that are already correctly associated (valid and claimed)
  const claimedWindowIds = new Set(
    Object.values(workspaces)
      .filter(ws => ws.windowId !== null && openIds.has(ws.windowId))
      .map(ws => ws.windowId)
  );

  for (const ws of Object.values(workspaces)) {
    if (ws.wsName === DEFAULT_WORKSPACE_ID) continue;
    if (ws.windowId === null || openIds.has(ws.windowId)) continue;

    // Stale windowId (e.g. after crash + FF session restore): try to adopt an orphaned
    // window by matching its tabs' container to this workspace's container.
    let adopted = null;
    try {
      const containers = await browser.contextualIdentities.query({ name: ws.wsName });
      if (containers && containers.length > 0) {
        const cookieStoreId = containers[0].cookieStoreId;
        const orphan = wins.find(w =>
          !claimedWindowIds.has(w.id) &&
          (w.tabs || []).some(t => t.cookieStoreId === cookieStoreId)
        );
        if (orphan) adopted = orphan.id;
      }
    } catch (e) {
      console.warn("Window adoption lookup failed for:", ws.wsName, e.message);
    }

    if (adopted !== null) {
      // Re-adopt the restored window and snapshot it immediately so the saved tab
      // list reflects the actual open tabs (not a potentially stale pre-crash snapshot).
      ws.windowId = adopted;
      claimedWindowIds.add(adopted);
      await saveWindowId(ws.wsName, adopted);
      const snap = await snapshotWindow(adopted).catch(() => null);
      if (snap && snap.length > 0) {
        ws.tabs = snap;
        await saveWorkspace(ws);
      }
      console.log("Adopted orphaned window", adopted, "for workspace:", ws.wsName);
    } else {
      ws.windowId = null;
      await saveWindowId(ws.wsName, null);
    }
  }

  // Inject virtual default workspace (no container, no sync key)
  const localWins = await browser.storage.local.get(LOCAL_WINS);
  const winsMap = localWins[LOCAL_WINS] || {};
  let defaultWindowId = winsMap[DEFAULT_WORKSPACE_ID] || null;
  if (defaultWindowId !== null && !openIds.has(defaultWindowId)) {
    defaultWindowId = null;
    await saveWindowId(DEFAULT_WORKSPACE_ID, null);
  }
  workspaces[DEFAULT_WORKSPACE_ID] = {
    wsName:    DEFAULT_WORKSPACE_ID,
    color:     "gray",
    windowId:  defaultWindowId,
    tabs:      []
  };

  const localOrderData = await browser.storage.local.get(LOCAL_ORDER);
  const order = (localOrderData[LOCAL_ORDER] || [])
    .filter(name => name !== DEFAULT_WORKSPACE_ID && workspaces[name]);

  return { workspaces, order };
}

async function handleGetDevices() {
  const deviceId = await myDeviceId();
  const deviceName = await getOrCreateDeviceName(deviceId);
  const allSync = await browser.storage.sync.get(null);

  const devices = {};
  for (const [key, val] of Object.entries(allSync)) {
    if (!key.startsWith(SNAP_PREFIX)) continue;
    // Key format: wcw_snap_{deviceId}_{encodedWsName}
    const rest = key.slice(SNAP_PREFIX.length);
    const underIdx = rest.indexOf("_");
    if (underIdx === -1) continue;
    const dId = rest.slice(0, underIdx);
    if (dId === deviceId) continue; // skip own keys
    if (!devices[dId]) devices[dId] = { deviceId: dId, deviceName: "Device " + dId, workspaces: [] };
    const ws = decompressWs(val);
    if (ws) {
      if (ws.deviceName) devices[dId].deviceName = ws.deviceName;
      devices[dId].workspaces.push(ws);
    }
  }

  return {
    self:   { deviceId, deviceName },
    others: Object.values(devices)
  };
}

async function handleSetDeviceName({ name }) {
  await browser.storage.local.set({ [LOCAL_DEVICE_NAME]: name });
  // Re-save all workspaces so the new deviceName propagates to sync immediately.
  // Without this, other devices would only see the updated name after the next
  // organic workspace save (tab event, window close, etc.).
  const workspaces = await loadWorkspaces();
  for (const ws of Object.values(workspaces)) {
    await saveWorkspace(ws);
  }
  return { ok: true };
}

async function handleSetOrder({ order }) {
  await browser.storage.local.set({ [LOCAL_ORDER]: order });
  return { ok: true };
}

// ─── Message router ───────────────────────────────────────────────────────────

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Message received:", msg.type);

  let handler;
  switch (msg.type) {
    case "GET_STATE":           handler = handleGetState; break;
    case "GET_WS_SIZE":         handler = () => handleGetWsSize(msg.payload); break;
    case "CREATE_WORKSPACE":    handler = () => handleCreateWorkspace(msg.payload); break;
    case "OPEN_WORKSPACE":      handler = () => handleOpenWorkspace(msg.payload); break;
    case "HIBERNATE_WORKSPACE": handler = () => handleHibernateWorkspace(msg.payload); break;
    case "DELETE_WORKSPACE":    handler = () => handleDeleteWorkspace(msg.payload); break;
    case "RENAME_WORKSPACE":    handler = () => handleRenameWorkspace(msg.payload); break;
    case "EXPORT_WORKSPACES":   handler = handleExportWorkspaces; break;
    case "ANALYZE_IMPORT":      handler = () => handleAnalyzeImport(msg.payload); break;
    case "SELECTIVE_IMPORT":    handler = () => handleSelectiveImport(msg.payload); break;
    case "GET_DEVICES":         handler = handleGetDevices; break;
    case "SET_DEVICE_NAME":     handler = () => handleSetDeviceName(msg.payload); break;
    case "SET_ORDER":           handler = () => handleSetOrder(msg.payload); break;
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

// ─── Auto-snapshot on window close ───────────────────────────────────────────

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
      // Cancel any pending debounced snapshot — we're about to take a definitive one.
      const pending = pendingSnapshots.get(ws.wsName);
      if (pending) {
        clearTimeout(snapshotTimers.get(ws.wsName));
        snapshotTimers.delete(ws.wsName);
        pendingSnapshots.delete(ws.wsName);
      }
      // Always attempt a fresh snapshot: tab.url reflects the navigation target even
      // for tabs still loading (e.g. server unavailable), so this captures URLs that
      // the debounced snapshot would have missed. Fall back to the pending snapshot
      // only if the window is already gone by the time we query.
      const snap = await snapshotWindow(windowId).catch(() => null);
      if (snap && snap.length > 0) {
        ws.tabs = snap;
      } else if (pending) {
        ws.tabs = pending.tabs;
      }
      ws.windowId = null;
      await saveWorkspace(ws);
      await saveWindowId(ws.wsName, null);
      console.log("Window closed, workspace hibernated:", ws.wsName);
      break;
    }
  }
});

// ─── Badge on window focus change ─────────────────────────────────────────────

browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === browser.windows.WINDOW_ID_NONE) return;
  await updateBadge(windowId).catch(() => {});
});

// ─── Automatic container assignment on new tab creation + snapshot ───────────

// tabId → { windowId, cookieStoreId, timeoutId }
// Tabs parked here are awaiting URL resolution before being reassigned to a container.
// Also used as a guard to prevent re-triggering listeners on the replacement tab.
const pendingTabs = new Map();

function removePending(tabId) {
  const entry = pendingTabs.get(tabId);
  if (entry) {
    clearTimeout(entry.timeoutId);
    pendingTabs.delete(tabId);
  }
}

async function doReassign(tabId, windowId, cookieStoreId, url) {
  // Mark as being reassigned so onCreated ignores the new tab
  pendingTabs.set(tabId, { windowId, cookieStoreId, timeoutId: null });
  try {
    await browser.tabs.remove(tabId);
    await browser.tabs.create({ windowId, url, cookieStoreId, active: true });
  } catch (e) {
    console.error("Error moving tab to container:", e.message);
  } finally {
    pendingTabs.delete(tabId);
  }
}


async function resolveContainerForWindow(windowId) {
  const localWins = await browser.storage.local.get(LOCAL_WINS);
  const winsMap = localWins[LOCAL_WINS] || {};
  if (winsMap[DEFAULT_WORKSPACE_ID] === windowId) return null;

  const workspaces = await loadWorkspaces();
  const ws = Object.values(workspaces).find(w => w.windowId === windowId);
  if (!ws) return null;

  // Always resolve by name — no cookieStoreId stored in workspace
  return await findOrCreateContainer(ws.wsName, ws.color, ws.icon || DEFAULT_ICON);
}

// We intercept tab creation to ensure all tabs opened in a workspace window are assigned
// to the correct Firefox Container (contextual identity), maintaining isolation between
// workspaces. Tabs opened in non-workspace windows are not affected.
browser.tabs.onCreated.addListener(async (tab) => {
  // Ignore replacement tabs we created ourselves
  if (pendingTabs.has(tab.id)) return;

  if (!tab.cookieStoreId || tab.cookieStoreId === "firefox-default") {
    const container = await resolveContainerForWindow(tab.windowId);
    if (!container) return;

    // about: pages cannot run in containers — leave the tab as-is so Firefox can display it.
    // about:blank and about:newtab pass through: they are new-tab placeholders that will be
    // reassigned to the correct container once the URL is confirmed (50ms poll or onUpdated).
    if (tab.url && tab.url.startsWith("about:") && tab.url !== "about:blank" && tab.url !== "about:newtab") {
      return;
    }

    // If URL is already a real URL (unlikely but possible), reassign immediately
    if (tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
      console.log("New tab with URL in workspace window, moving to:", container.cookieStoreId, tab.url);
      await doReassign(tab.id, tab.windowId, container.cookieStoreId, tab.url);
      return;
    }

    // Defer reassignment by 50ms: Firefox creates tabs with about:blank initially and
    // sets the real URL shortly after (e.g. when an external application opens a URL in
    // Firefox). Polling with tabs.get() lets us distinguish a plain new tab (still
    // about:blank) from an externally-opened URL without waiting a full 2 seconds.
    // The onUpdated listener below is kept as a fallback for slower systems.
    console.log("Parking tab, waiting for URL:", tab.id);
    const timeoutId = setTimeout(async () => {
      if (!pendingTabs.has(tab.id)) return;
      let url = "about:blank";
      try {
        const current = await browser.tabs.get(tab.id);
        if (current.url && (current.url.startsWith("http://") || current.url.startsWith("https://"))) {
          url = current.url;
        } else if (current.url === "about:newtab") {
          // New tab page confirmed — reassign immediately to blank in the correct container
          removePending(tab.id);
          await doReassign(tab.id, tab.windowId, container.cookieStoreId, "about:blank").catch(() => {});
          return;
        } else if (current.url && current.url.startsWith("about:") && current.url !== "about:blank") {
          removePending(tab.id);
          return;
        }
      } catch (e) {}
      console.log("Poll result for tab:", tab.id, "->", url);

      if (url !== "about:blank") {
        removePending(tab.id);
        await doReassign(tab.id, tab.windowId, container.cookieStoreId, url).catch(() => {});
        return;
      }

      // Still about:blank at 50ms — the real URL from an external app may arrive shortly
      // via onUpdated. Keep the tab in pendingTabs so that listener can handle it (real URL
      // or blank-complete signal). Swap to a 2s safety timeout in case onUpdated never fires
      // (e.g. tab closed before loading).
      console.log("Tab still blank at 50ms, deferring to onUpdated:", tab.id);
      const entry = pendingTabs.get(tab.id);
      if (!entry) return;
      entry.timeoutId = setTimeout(async () => {
        if (!pendingTabs.has(tab.id)) return;
        console.log("Safety timeout: no URL for tab", tab.id, "— reassigning blank");
        removePending(tab.id);
        await doReassign(tab.id, tab.windowId, container.cookieStoreId, "about:blank").catch(() => {});
      }, 2000);
    }, 50);

    pendingTabs.set(tab.id, {
      windowId: tab.windowId,
      cookieStoreId: container.cookieStoreId,
      timeoutId
    });
    return;
  }

  // Snapshot if this tab belongs to a workspace window (debounced)
  const workspaces = await loadWorkspaces();
  const ws = Object.values(workspaces).find(w => w.windowId === tab.windowId);
  if (ws) {
    const snap = await snapshotWindow(tab.windowId).catch(() => null);
    if (snap && snap.length > 0) {
      ws.tabs = snap;
      scheduleSnapshot(ws);
    }
  }
});

// ─── Aggressive snapshotting on tab changes ──────────────────────────────────

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Fallback for the 50ms poll in onCreated: catches URLs that arrive later via the
  // onUpdated event on slower systems where 50ms was not enough.
  if (pendingTabs.has(tabId)) {
    const { windowId, cookieStoreId } = pendingTabs.get(tabId);

    if (changeInfo.url && (changeInfo.url.startsWith("http://") || changeInfo.url.startsWith("https://"))) {
      // Real URL arrived — reassign with it
      console.log("URL arrived for parked tab:", tabId, changeInfo.url);
      removePending(tabId);
      await doReassign(tabId, windowId, cookieStoreId, changeInfo.url).catch(() => {});
      return;
    }

    if (changeInfo.url === "about:newtab") {
      // New tab page — reassign immediately to a blank tab in the correct container
      removePending(tabId);
      await doReassign(tabId, windowId, cookieStoreId, "about:blank").catch(() => {});
      return;
    }

    if (changeInfo.url && changeInfo.url.startsWith("about:") && changeInfo.url !== "about:blank") {
      // about: page — leave the tab as-is so Firefox can display it
      removePending(tabId);
      return;
    }

    if (changeInfo.status === "complete") {
      // Tab finished loading as about:blank — plain new tab, reassign with about:blank
      console.log("Tab completed as about:blank:", tabId);
      removePending(tabId);
      await doReassign(tabId, windowId, cookieStoreId, "about:blank").catch(() => {});
      return;
    }

    // Still waiting — do not fall through to snapshot logic
    return;
  }

  // Snapshot on page load complete, group change, OR http/https navigation start.
  // The navigation-start case captures the URL for tabs that never finish loading
  // (e.g. server unavailable) — tab.url is already set to the target URL at this point.
  const isNavStart = changeInfo.url &&
    (changeInfo.url.startsWith("http://") || changeInfo.url.startsWith("https://"));
  if (!isNavStart && changeInfo.status !== "complete" && changeInfo.groupId === undefined) return;
  const workspaces = await loadWorkspaces();
  const ws = Object.values(workspaces).find(w => w.windowId === tab.windowId);
  if (!ws) return;
  const snap = await snapshotWindow(tab.windowId).catch(() => null);
  if (snap && snap.length > 0) {
    ws.tabs = snap;
    scheduleSnapshot(ws);
  }
});

browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // Clean up pendingTabs to prevent memory leaks if the user closes a tab before
  // the 50ms poll fires (tab is gone, no reassignment needed).
  removePending(tabId);

  await new Promise(r => setTimeout(r, 200));
  const workspaces = await loadWorkspaces();
  const ws = Object.values(workspaces).find(w => w.windowId === removeInfo.windowId);
  if (!ws) return;
  const snap = await snapshotWindow(removeInfo.windowId).catch(() => null);
  if (snap && snap.length > 0) {
    ws.tabs = snap;
    scheduleSnapshot(ws);
  }
});

// ─── Badge ────────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  blue: "#37adff", turquoise: "#00c79a", green: "#51cd00", yellow: "#ffcb00",
  orange: "#ff9f00", red: "#ff613d", pink: "#ff4bda", purple: "#af51f5",
};

async function updateBadge(windowId) {
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
    const badge = ws.wsName.substring(0, 3).toUpperCase();
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

// ─── Startup ──────────────────────────────────────────────────────────────────

migrateFromLegacy()
  .then(() => getOrCreateDeviceId())
  .catch(e => console.error("Startup error:", e));

console.log("Windowed Container Workspaces background script loaded.");
