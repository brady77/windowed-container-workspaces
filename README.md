# Windowed Container Workspaces

A Firefox extension that lets you organize your browsing into isolated workspaces — each workspace runs in its own dedicated window with a dedicated Firefox Container, keeping cookies, sessions, and identities completely separate.

## Features

- **One workspace = one window = one container** — full isolation between projects, clients, or identities
- **Persistent tabs** — tabs are saved automatically and restored when you reopen a workspace
- **Tab groups preserved** — tab groups (including names and colors) are saved and restored with the workspace
- **Hibernation** — close a workspace window and reopen it later with all tabs intact
- **Conflict-free sync across devices** — each device maintains its own workspace snapshots via Firefox Sync; devices never overwrite each other's data
- **Cross-device pull** — see workspaces from your other devices and selectively import tabs via the Backup & Restore page
- **Workspace badge** — the toolbar icon shows a 3-letter abbreviation of the active workspace so you always know where you are
- **New tabs stay in container** — any tab opened inside a workspace window is automatically assigned to the correct container
- **Default (no container) workspace** — a built-in workspace that opens a regular Firefox window without any container, ideal for general browsing or accessing Firefox settings
- **Per-workspace storage indicator** — shows how much of the 8 KB sync limit each workspace uses

## Why this extension?

Firefox has containers and tab groups, but no concept of a "workspace" that ties them together with a dedicated window. This extension bridges that gap — ideal for anyone working across multiple clients, projects, or online identities simultaneously.

## Installation

### Temporary (for development/testing)

1. Open Firefox and go to `about:debugging`
2. Click **This Firefox** in the left sidebar
3. Click **Load Temporary Add-on...**
4. Select `manifest.json` from the extension folder

> Note: Temporary add-ons are removed on Firefox restart and do not support Firefox Sync.

### Install from Firefox Add-ons

Install directly from [addons.mozilla.org](https://addons.mozilla.org/firefox/addon/windowed-container-workspaces/) — Firefox will handle updates automatically.

## Usage

### Create a workspace
1. Click the extension icon in the toolbar
2. Click **+** in the top right corner
3. Enter a name, choose a color and icon
4. Click **Create**

> Workspace names must be unique — they are also used to identify containers across devices.

### Open a workspace
Click the workspace card or the **▶** button — a new dedicated Firefox window opens with all saved tabs.

### Hibernate a workspace
Click the **🌙** button on an active workspace card — all tabs are saved and the window closes.

### Delete a workspace
Click the **🗑** button — the window closes, the Firefox container is removed (including all its cookies and session data), and the workspace is deleted from sync.

### Rename a workspace
Click the **✎** button — the workspace and its container are renamed simultaneously.

### Default (no container) workspace
Always visible at the top of the list. Opens a regular Firefox window without any container — tabs are not assigned to any container. Cannot be renamed or deleted.

## Backup & Restore

Click the **Backup & Restore** button in the popup footer to open the dedicated page.

### This device
Set a human-readable name for the current device (e.g. "Work Laptop"). The name is visible to your other devices.

### Export
Downloads all your workspaces as a JSON backup file.

### Import
Select a previously exported JSON file to review its contents and selectively restore workspaces and tabs.

### Other devices
If you use Firefox Sync across multiple devices, each device's workspaces appear here automatically. Click **Pull…** next to a device to open the review panel and selectively import workspaces and tabs from that device into your current one.

> The list updates live as changes arrive from your other devices — no restart required.

## Sync behavior

Each device stores its own workspace snapshots independently under a unique device ID. Devices never overwrite each other's data, even when using the same Firefox Sync account.

**What syncs:** workspace name, color, saved tab URLs, tab groups, device name  
**What doesn't sync:** which window is currently open on any given device; container icon (always set to the default on each device)

**Note on color:** when pulling a workspace from another device that doesn't yet exist locally, the remote workspace's color is applied to the newly created local workspace. If the workspace already exists locally, its color and icon are left unchanged.

**On a new device:** when you open a workspace for the first time, the extension looks for an existing Firefox Container with the same name. If none is found, a new container is created automatically.

> Sync requires a signed extension and a Firefox account with Sync enabled.

## Permissions

| Permission | Reason |
|---|---|
| `tabs` | Read and manage tabs within workspace windows |
| `storage` | Save workspace data locally and sync it across devices |
| `contextualIdentities` | Create and manage Firefox Containers for each workspace |
| `cookies` | Required by Firefox when working with containers |
| `tabGroups` | Save and restore tab groups within workspaces |

## Privacy & Data

Windowed Container Workspaces stores and processes the following data:

**Stored locally on your device (`storage.local`):**
- A randomly generated device ID
- Your device name (auto-generated or manually set by you)
- Mapping of open workspace windows

**Stored locally and optionally synced via Firefox Sync (`storage.sync`):**
- Workspace names, colors, and icons
- Tab group names, colors, and collapsed state
- Tab URLs and page titles
- Tab pinned state
- Device ID and device name

**No data is ever sent to the extension developer.**

If you use Firefox Sync with Add-ons sync enabled, all of the above
`storage.sync` data is end-to-end encrypted and synced to Mozilla's servers —
the same way Firefox syncs your bookmarks and passwords. The developer has no
access to this data. You can disable this in Firefox Sync settings
(about:preferences#sync) by turning off Add-ons sync.

The Export/Import backup feature saves data only to your local filesystem.
No network requests are made.

## Contributing

Issues and pull requests are welcome. Please open an issue before submitting large changes.

## Credits

Developed in collaboration with [Claude](https://claude.ai) (Anthropic's AI assistant), which helped with architecture, implementation, debugging, and documentation.

## License

MIT
