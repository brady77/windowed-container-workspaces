// ─── Backup & Restore page ────────────────────────────────────────────────────

function send(type, payload = {}) {
  return browser.runtime.sendMessage({ type, payload });
}

function showStatus(msg, type) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = `status ${type}`;
}

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

document.getElementById("btn-import").addEventListener("click", () => {
  document.getElementById("import-file").click();
});

document.getElementById("import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    showStatus("Invalid JSON file.", "error");
    return;
  }
  const result = await send("IMPORT_WORKSPACES", { data });
  if (result && result.error) {
    showStatus("Import failed: " + result.error, "error");
  } else {
    const n = result.imported;
    showStatus(`Successfully imported ${n} workspace${n !== 1 ? "s" : ""}.`, "success");
  }
  e.target.value = "";
});

document.getElementById("btn-close").addEventListener("click", () => window.close());
