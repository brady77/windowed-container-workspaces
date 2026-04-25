# Windowed Container Workspaces

A Firefox extension that lets you organize your browsing into isolated workspaces — each workspace runs in its own dedicated window with a dedicated Firefox Container, keeping cookies, sessions, and identities completely separate.

## Features

- **One workspace = one window = one container** — full isolation between projects, clients, or identities
- **Persistent tabs** — tabs are saved automatically and restored when you reopen a workspace
- **Tab groups preserved** — tab groups (including names and colors) are saved and restored with the workspace
- **Hibernation** — close a workspace window and reopen it later with all tabs intact
- **Sync across devices** — workspaces sync via Firefox Sync to all your signed-in Firefox instances
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

## Sync behavior

Workspaces are synced via `storage.sync` (Firefox Sync). Each workspace is stored as a separate key, so adding or removing a workspace on one device propagates cleanly to others without overwriting unrelated workspaces.

**What syncs:** workspace name, color, icon, saved tab URLs, tab groups  
**What doesn't sync:** which window is currently open (this is local per device)

**On a new device:** when you open a workspace for the first time, the extension looks for an existing container with the same name. If none is found, a new container is created automatically.

> Sync requires a signed extension and a Firefox account with Sync enabled.

## Permissions

| Permission | Reason |
|---|---|
| `tabs` | Read and manage tabs within workspace windows |
| `storage` | Save workspace data locally and sync it across devices |
| `contextualIdentities` | Create and manage Firefox Containers for each workspace |
| `cookies` | Required by Firefox when working with containers |
| `tabGroups` | Save and restore tab groups within workspaces |

## Contributing

Issues and pull requests are welcome. Please open an issue before submitting large changes.

## Credits

Developed in collaboration with [Claude](https://claude.ai) (Anthropic's AI assistant), which helped with architecture, implementation, debugging, and documentation.

## License

MIT
