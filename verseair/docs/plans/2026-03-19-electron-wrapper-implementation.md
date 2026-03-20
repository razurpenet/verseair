# VerseAir Electron Wrapper + Hot Update — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wrap VerseAir in Electron to produce an installable Windows desktop app with background hot-update support for pushing HTML updates remotely via GitHub.

**Architecture:** Electron main process (`main.js`) creates a BrowserWindow loading the existing `bible-verse-projector_6.html` untouched. A preload script (`preload.js`) exposes native features securely via `contextBridge`. A background hot-update checker fetches a `version.json` from GitHub, downloads updated HTML if the hash differs, and notifies the user to restart.

**Tech Stack:** Electron 35+, electron-builder, Node.js crypto (SHA256), Electron `screen` module, `Tray`, `Menu`, `dialog`, `contextBridge`/`ipcMain`/`ipcRenderer`

---

### Task 1: Initialize npm Project + Install Electron

**Files:**
- Create: `package.json`
- Create: `.gitignore`

**Step 1: Initialize package.json**

Run:
```bash
cd c:/Users/rashy/Desktop/verseair
npm init -y
```

**Step 2: Edit package.json with correct metadata and scripts**

Replace the generated `package.json` with:

```json
{
  "name": "verseair",
  "version": "1.0.0",
  "description": "VerseAir — AI-powered Bible verse projection for churches",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build:win": "electron-builder --win",
    "update-hash": "node update-hash.js"
  },
  "author": "VerseAir",
  "license": "MIT",
  "devDependencies": {}
}
```

**Step 3: Install Electron and electron-builder**

Run:
```bash
npm install --save-dev electron electron-builder
```

Expected: `node_modules/` created, `electron` and `electron-builder` in devDependencies.

**Step 4: Create .gitignore**

```
node_modules/
dist/
*.exe
```

**Step 5: Verify Electron installed**

Run:
```bash
npx electron --version
```

Expected: Prints Electron version (e.g., `v35.x.x`)

**Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "feat: initialize npm project with Electron and electron-builder"
```

---

### Task 2: Create Minimal main.js — BrowserWindow + Load HTML

**Files:**
- Create: `main.js`

**Step 1: Create main.js with BrowserWindow**

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function getHtmlPath() {
  // Check for hot-updated copy first
  const updateDir = path.join(app.getPath('userData'), 'update');
  const updatedHtml = path.join(updateDir, 'bible-verse-projector_6.html');
  if (fs.existsSync(updatedHtml)) {
    return updatedHtml;
  }
  // Fall back to bundled copy
  return path.join(__dirname, 'bible-verse-projector_6.html');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0b0c0f',
    icon: path.join(__dirname, 'assets', 'verseair_icon_transparent.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(getHtmlPath());
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
```

**Step 2: Create a minimal preload.js placeholder**

```javascript
// Preload script — secure bridge between main and renderer
// Will be expanded in later tasks
```

**Step 3: Test the app launches**

Run:
```bash
cd c:/Users/rashy/Desktop/verseair
npm start
```

Expected: VerseAir opens in an Electron window (1200x800) with the full app visible. Close the window to exit.

**Step 4: Commit**

```bash
git add main.js preload.js
git commit -m "feat: create Electron main process — loads bible-verse-projector_6.html"
```

---

### Task 3: Auto-Grant Microphone Permissions

**Files:**
- Modify: `main.js`

**Step 1: Add permission handler after BrowserWindow creation**

In `createWindow()`, after `mainWindow.loadFile(getHtmlPath());`, add:

```javascript
  // Auto-grant microphone permission — no browser dialog
  mainWindow.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      const allowed = ['media', 'microphone', 'audioCapture'];
      callback(allowed.includes(permission));
    }
  );
```

**Step 2: Test microphone works**

Run:
```bash
npm start
```

Expected: Click "Start Listening" in the app. Speech recognition should activate without any permission dialog. Speak a verse reference — it should be detected.

**Step 3: Commit**

```bash
git add main.js
git commit -m "feat: auto-grant microphone permissions — no browser dialogs"
```

---

### Task 4: Custom Menu Bar

**Files:**
- Modify: `main.js`

**Step 1: Add Menu import and build menu**

At the top of `main.js`, update the require:

```javascript
const { app, BrowserWindow, Menu } = require('electron');
```

Add a `createMenu()` function before `createWindow()`:

```javascript
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit', accelerator: 'CmdOrCtrl+Q' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Fullscreen', accelerator: 'F11', click: () => {
          if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }},
        { role: 'reload', accelerator: 'CmdOrCtrl+R' },
        { type: 'separator' },
        { role: 'toggleDevTools', accelerator: 'CmdOrCtrl+Shift+I' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About VerseAir', click: () => {
          const { dialog } = require('electron');
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About VerseAir',
            message: 'VerseAir',
            detail: 'AI-powered Bible verse projection for churches.\n\nVersion 1.0.0'
          });
        }}
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
```

Call `createMenu()` inside `createWindow()`, before `mainWindow.loadFile(...)`:

```javascript
  createMenu();
```

**Step 2: Test menu bar**

Run:
```bash
npm start
```

Expected: Menu bar shows File, View, Help. F11 toggles fullscreen. Ctrl+Q quits. Help > About shows dialog.

**Step 3: Commit**

```bash
git add main.js
git commit -m "feat: add custom menu bar — File, View, Help"
```

---

### Task 5: System Tray + Close-to-Tray

**Files:**
- Modify: `main.js`

**Step 1: Add Tray import**

Update the require at the top:

```javascript
const { app, BrowserWindow, Menu, Tray, nativeImage } = require('electron');
```

Add a `let tray = null;` after `let mainWindow = null;`.

**Step 2: Add tray creation function**

Add after `createMenu()`:

```javascript
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'verseair_icon_transparent.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 32, height: 32 });
  tray = new Tray(trayIcon);
  tray.setToolTip('VerseAir');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show/Hide', click: () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => {
      app.isQuitting = true;
      app.quit();
    }}
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}
```

**Step 3: Add close-to-tray behavior**

In `createWindow()`, after `mainWindow.loadFile(...)` and the permission handler, add:

```javascript
  // Close to tray instead of quitting
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      tray.displayBalloon({
        title: 'VerseAir',
        content: 'VerseAir is still running in the system tray.',
        iconType: 'info'
      });
    }
  });
```

Call `createTray()` inside `app.whenReady().then(...)`, after `createWindow()`:

```javascript
app.whenReady().then(() => {
  createWindow();
  createTray();
});
```

Update `app.on('window-all-closed')` — remove the existing handler and replace with:

```javascript
app.on('window-all-closed', (e) => {
  // Don't quit — tray keeps the app alive
});
```

Also add:

```javascript
app.on('before-quit', () => {
  app.isQuitting = true;
});
```

**Step 4: Test tray behavior**

Run:
```bash
npm start
```

Expected:
- VerseAir icon appears in system tray
- Clicking X hides window, shows balloon "VerseAir is still running"
- Right-click tray → Show/Hide toggles window
- Right-click tray → Quit exits the app
- Double-click tray icon shows window

**Step 5: Commit**

```bash
git add main.js
git commit -m "feat: add system tray — close minimizes to tray, quit from tray menu"
```

---

### Task 6: Multi-Monitor Detection

**Files:**
- Modify: `main.js`

**Step 1: Add screen and dialog imports**

Update the require at the top (add `screen` and `dialog` if not already there):

```javascript
const { app, BrowserWindow, Menu, Tray, nativeImage, screen, dialog } = require('electron');
```

**Step 2: Add multi-monitor detection function**

Add after `createTray()`:

```javascript
function checkForProjector() {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  if (displays.length <= 1) return; // Single monitor, nothing to do

  const externalDisplay = displays.find(d => d.id !== primaryDisplay.id);
  if (!externalDisplay) return;

  dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: 'Projector Detected',
    message: 'External display detected — open fullscreen on projector?',
    detail: `Display: ${externalDisplay.bounds.width}x${externalDisplay.bounds.height}`,
    buttons: ['Yes', 'No'],
    defaultId: 0
  }).then(({ response }) => {
    if (response === 0) {
      const projectorWindow = new BrowserWindow({
        x: externalDisplay.bounds.x,
        y: externalDisplay.bounds.y,
        fullscreen: true,
        backgroundColor: '#0b0c0f',
        icon: path.join(__dirname, 'assets', 'verseair_icon_transparent.png'),
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      projectorWindow.loadFile(getHtmlPath());

      // Auto-grant mic on projector window too
      projectorWindow.webContents.session.setPermissionRequestHandler(
        (webContents, permission, callback) => {
          const allowed = ['media', 'microphone', 'audioCapture'];
          callback(allowed.includes(permission));
        }
      );
    }
  });
}
```

**Step 3: Call checkForProjector after window loads**

In `app.whenReady().then(...)`, after `createTray()`:

```javascript
  mainWindow.webContents.on('did-finish-load', () => {
    checkForProjector();
  });
```

**Step 4: Test with single monitor**

Run:
```bash
npm start
```

Expected: App opens normally, no projector dialog (single monitor). If you have a second monitor connected, the dialog should appear.

**Step 5: Commit**

```bash
git add main.js
git commit -m "feat: detect external display — offer fullscreen projector window"
```

---

### Task 7: version.json + update-hash.js Utility

**Files:**
- Create: `version.json`
- Create: `update-hash.js`

**Step 1: Create initial version.json**

Run this to compute the SHA256 of the current HTML and create `version.json`:

```bash
cd c:/Users/rashy/Desktop/verseair
node -e "
const crypto = require('crypto');
const fs = require('fs');
const html = fs.readFileSync('bible-verse-projector_6.html');
const hash = crypto.createHash('sha256').update(html).digest('hex').slice(0, 12);
const ver = { version: '1.0.0', hash, updated: new Date().toISOString().split('T')[0] };
fs.writeFileSync('version.json', JSON.stringify(ver, null, 2) + '\n');
console.log('Created version.json:', ver);
"
```

Expected: `version.json` created with current hash.

**Step 2: Create update-hash.js utility**

```javascript
#!/usr/bin/env node
/**
 * update-hash.js — Run after editing bible-verse-projector_6.html
 * Updates version.json with the new SHA256 hash.
 * Usage: node update-hash.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'bible-verse-projector_6.html');
const versionPath = path.join(__dirname, 'version.json');

if (!fs.existsSync(htmlPath)) {
  console.error('ERROR: bible-verse-projector_6.html not found');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath);
const hash = crypto.createHash('sha256').update(html).digest('hex').slice(0, 12);

let versionData = { version: '1.0.0', hash: '', updated: '' };
if (fs.existsSync(versionPath)) {
  try {
    versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  } catch (e) {
    // Use defaults if parse fails
  }
}

const oldHash = versionData.hash;
versionData.hash = hash;
versionData.updated = new Date().toISOString().split('T')[0];

fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2) + '\n');

if (oldHash === hash) {
  console.log(`Hash unchanged: ${hash}`);
} else {
  console.log(`Hash updated: ${oldHash || '(none)'} → ${hash}`);
}
console.log(`version.json updated: v${versionData.version} | ${versionData.updated}`);
```

**Step 3: Test update-hash.js**

Run:
```bash
node update-hash.js
```

Expected: Prints hash and confirms version.json updated. Run again — should print "Hash unchanged".

**Step 4: Commit**

```bash
git add version.json update-hash.js
git commit -m "feat: add version.json and update-hash.js utility for hot updates"
```

---

### Task 8: Hot Update Checker in main.js

**Files:**
- Modify: `main.js`

**Step 1: Add hot update constants and imports**

At the top of `main.js`, after the existing requires, add:

```javascript
const https = require('https');
const http = require('http');
const crypto = require('crypto');

// ── HOT UPDATE CONFIG ──
// IMPORTANT: Update these after creating your GitHub repo
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/YOUR_USERNAME/verseair/main';
const VERSION_URL = `${GITHUB_RAW_BASE}/version.json`;
const HTML_URL = `${GITHUB_RAW_BASE}/bible-verse-projector_6.html`;
const UPDATE_CHECK_DELAY = 3000; // 3 seconds after window loads
```

**Step 2: Add the hot update functions**

Add after the `checkForProjector()` function:

```javascript
// ── HOT UPDATE ──

function getUpdateDir() {
  const dir = path.join(app.getPath('userData'), 'update');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getMetaPath() {
  return path.join(app.getPath('userData'), 'update-meta.json');
}

function getLocalHash() {
  const metaPath = getMetaPath();
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8')).hash;
  } catch {
    return null;
  }
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject)
      .on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
}

async function checkForUpdates() {
  try {
    // 1. Fetch remote version.json
    const remoteVersionText = await fetchText(VERSION_URL);
    const remoteVersion = JSON.parse(remoteVersionText);
    if (!remoteVersion.hash) return;

    // 2. Compare with local hash
    const localHash = getLocalHash();
    if (localHash === remoteVersion.hash) return; // Up to date

    // 3. Also check against the bundled file hash
    const bundledPath = path.join(__dirname, 'bible-verse-projector_6.html');
    const bundledContent = fs.readFileSync(bundledPath);
    const bundledHash = crypto.createHash('sha256').update(bundledContent).digest('hex').slice(0, 12);
    if (bundledHash === remoteVersion.hash) {
      // Bundled copy is already current — clear any old update
      const updateDir = getUpdateDir();
      const updatedHtml = path.join(updateDir, 'bible-verse-projector_6.html');
      if (fs.existsSync(updatedHtml)) fs.unlinkSync(updatedHtml);
      fs.writeFileSync(getMetaPath(), JSON.stringify({ hash: bundledHash }));
      return;
    }

    // 4. Download new HTML
    const htmlContent = await fetchText(HTML_URL);

    // 5. Validate — must be non-empty and look like HTML
    if (!htmlContent || htmlContent.length < 100 || !htmlContent.includes('<html')) {
      console.error('Hot update: downloaded HTML looks invalid, skipping');
      return;
    }

    // 6. Verify hash matches what version.json said
    const downloadedHash = crypto.createHash('sha256')
      .update(Buffer.from(htmlContent, 'utf8'))
      .digest('hex').slice(0, 12);
    if (downloadedHash !== remoteVersion.hash) {
      console.error('Hot update: hash mismatch, skipping');
      return;
    }

    // 7. Save to update directory
    const updateDir = getUpdateDir();
    fs.writeFileSync(path.join(updateDir, 'bible-verse-projector_6.html'), htmlContent, 'utf8');
    fs.writeFileSync(getMetaPath(), JSON.stringify({ hash: remoteVersion.hash }));

    // 8. Notify renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-available', remoteVersion.version);
    }

    console.log(`Hot update: v${remoteVersion.version} downloaded (hash: ${remoteVersion.hash})`);
  } catch (err) {
    // Silent fail — app continues with current version
    console.log('Hot update check skipped:', err.message);
  }
}
```

**Step 3: Add IPC handler for restart-to-update**

Add after `checkForUpdates()`:

```javascript
const { ipcMain } = require('electron');

ipcMain.handle('restart-to-update', () => {
  app.isQuitting = true;
  app.relaunch();
  app.quit();
});

ipcMain.handle('get-update-status', () => {
  const metaPath = getMetaPath();
  if (!fs.existsSync(metaPath)) return { available: false };
  const updateHtml = path.join(getUpdateDir(), 'bible-verse-projector_6.html');
  return { available: fs.existsSync(updateHtml) };
});
```

**Step 4: Trigger update check after window loads**

In the `app.whenReady().then(...)` block, inside the existing `did-finish-load` handler, add after `checkForProjector()`:

```javascript
    // Check for hot updates in background
    setTimeout(checkForUpdates, UPDATE_CHECK_DELAY);
```

**Step 5: Update the require at top of file**

Make sure `ipcMain` is in the require (add it if not there):

```javascript
const { app, BrowserWindow, Menu, Tray, nativeImage, screen, dialog, ipcMain } = require('electron');
```

And remove the separate `const { ipcMain } = require('electron');` line from Step 3 — it should be in the main require.

**Step 6: Commit**

```bash
git add main.js
git commit -m "feat: add background hot-update checker — downloads new HTML from GitHub"
```

---

### Task 9: Preload Script + Renderer Update Notification

**Files:**
- Modify: `preload.js`
- Modify: `bible-verse-projector_6.html` (minimal — add update notification handler)

**Step 1: Write the preload script**

Replace the placeholder `preload.js` with:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('verseairAPI', {
  // Listen for update-available notification from main process
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, version) => callback(version));
  },

  // Restart app to apply the downloaded update
  restartToUpdate: () => ipcRenderer.invoke('restart-to-update'),

  // Check if an update has been downloaded
  getUpdateStatus: () => ipcRenderer.invoke('get-update-status')
});
```

**Step 2: Add update notification UI to the HTML file**

Find the closing `</body>` tag in `bible-verse-projector_6.html`. Just before it, add this small script block:

```html
<!-- Electron hot-update notification -->
<script>
if (window.verseairAPI) {
  window.verseairAPI.onUpdateAvailable((version) => {
    const bar = document.createElement('div');
    bar.id = 'updateBar';
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#1a1a2e;border-top:1px solid #c9a84c;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;z-index:9999;font-family:EB Garamond,serif;color:#e8e6e3;font-size:0.9rem;';
    bar.innerHTML = `
      <span>Update available (v${version}) — restart to apply</span>
      <span>
        <button onclick="window.verseairAPI.restartToUpdate()" style="background:#c9a84c;color:#0b0c0f;border:none;padding:6px 16px;border-radius:5px;cursor:pointer;font-family:Cinzel,serif;font-size:0.75rem;letter-spacing:0.06em;margin-right:8px;">Restart Now</button>
        <button onclick="this.closest('#updateBar').remove()" style="background:none;border:1px solid #555;color:#888;padding:6px 12px;border-radius:5px;cursor:pointer;font-family:Cinzel,serif;font-size:0.75rem;">Later</button>
      </span>
    `;
    document.body.appendChild(bar);
  });
}
</script>
```

This block is harmless in a regular browser (the `if (window.verseairAPI)` guard means it does nothing outside Electron).

**Step 3: Test the update notification**

For testing, temporarily change `UPDATE_CHECK_DELAY` to `1000` in `main.js` and add a line after `console.log('Hot update:...')`:

You can test the notification UI by temporarily adding this after the `setTimeout(checkForUpdates, ...)` line:
```javascript
    // TEMP: test update notification UI
    // setTimeout(() => mainWindow.webContents.send('update-available', '1.0.1'), 2000);
```

Uncomment it, run `npm start`, and verify the gold notification bar appears at the bottom. Then remove/comment it.

**Step 4: Commit**

```bash
git add preload.js bible-verse-projector_6.html
git commit -m "feat: add preload bridge + update notification bar in renderer"
```

---

### Task 10: electron-builder Configuration

**Files:**
- Modify: `package.json`

**Step 1: Add electron-builder config to package.json**

Add a `"build"` key to `package.json`:

```json
{
  "name": "verseair",
  "version": "1.0.0",
  "description": "VerseAir — AI-powered Bible verse projection for churches",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build:win": "electron-builder --win",
    "update-hash": "node update-hash.js"
  },
  "build": {
    "appId": "com.verseair.app",
    "productName": "VerseAir",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "preload.js",
      "bible-verse-projector_6.html",
      "version.json",
      "assets/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/verseair_icon_transparent.png"
    },
    "nsis": {
      "oneClick": true,
      "perMachine": false,
      "allowToChangeInstallationDirectory": false,
      "installerIcon": "assets/verseair_icon_transparent.png",
      "uninstallerIcon": "assets/verseair_icon_transparent.png"
    }
  },
  "author": "VerseAir",
  "license": "MIT",
  "devDependencies": {}
}
```

Note: `electron-builder` will auto-convert the PNG to `.ico` for Windows if you don't provide one. The 4000x4000 PNG is large enough for all icon sizes.

**Step 2: Test the build**

Run:
```bash
npm run build:win
```

Expected: Build completes. Output in `dist/` folder — should contain `VerseAir Setup 1.0.0.exe` (or similar).

**Step 3: Test the built installer**

Run the `.exe` installer from `dist/`. It should install VerseAir and launch it. Verify:
- App opens with the VerseAir interface
- System tray icon appears
- Menu bar works (File, View, Help)
- No microphone permission dialogs when starting speech recognition

**Step 4: Commit**

```bash
git add package.json
git commit -m "feat: add electron-builder config — produces Windows .exe installer"
```

---

### Task 11: Create GitHub Repository

**Files:**
- No file changes — git/GitHub operations only

**Step 1: Create the GitHub repository**

Run:
```bash
cd c:/Users/rashy/Desktop/verseair
gh repo create verseair --public --source=. --push
```

If `gh` CLI is not installed, create the repo manually on github.com and then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/verseair.git
git push -u origin master
```

**Step 2: Update the GitHub raw URL in main.js**

After the repo is created, update the `GITHUB_RAW_BASE` constant in `main.js` with your actual GitHub username:

```javascript
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/YOUR_USERNAME/verseair/master';
```

Replace `YOUR_USERNAME` with your actual GitHub username and `master` with whichever branch you use (master or main).

**Step 3: Commit and push the URL update**

```bash
git add main.js
git commit -m "fix: set GitHub raw URL for hot updates"
git push
```

**Step 4: Verify hot update URL works**

Open in browser: `https://raw.githubusercontent.com/YOUR_USERNAME/verseair/master/version.json`

Expected: Shows the version.json content.

---

### Task 12: End-to-End Hot Update Test

**Files:**
- No new files — testing only

**Step 1: Verify current state works**

Run:
```bash
npm start
```

Expected: App opens, loads current HTML, no update notification (local hash matches).

**Step 2: Simulate an update**

1. Make a trivial edit to `bible-verse-projector_6.html` (e.g., add a comment at the end)
2. Run `node update-hash.js` — should show hash changed
3. Commit and push:
   ```bash
   git add bible-verse-projector_6.html version.json
   git commit -m "test: trigger hot update"
   git push
   ```
4. Wait ~30 seconds for GitHub CDN to update
5. Run `npm start` — app loads the OLD local copy immediately
6. After 3 seconds, the gold "Update available" bar should appear at the bottom
7. Click "Restart Now" — app restarts and loads the NEW version

**Step 3: Verify update persists**

Close and reopen the app (`npm start`). It should load the updated copy from `%APPDATA%/VerseAir/update/` without showing the update bar again.

**Step 4: Revert the test change**

```bash
git revert HEAD
git push
```

---

### Task 13: Final Cleanup + Production Build

**Files:**
- Modify: `main.js` (remove any test code)

**Step 1: Remove any temporary test code**

Ensure any uncommented test lines (like the temporary update notification trigger) are removed from `main.js`.

**Step 2: Run update-hash.js one final time**

```bash
node update-hash.js
```

**Step 3: Final production build**

```bash
npm run build:win
```

Expected: Clean build in `dist/` folder.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: VerseAir Electron desktop app v1.0.0 — complete with hot update"
git push
```

---

## Summary of All Created/Modified Files

| File | Action | Purpose |
|---|---|---|
| `package.json` | Create | npm config, scripts, electron-builder config |
| `.gitignore` | Create | Ignore node_modules, dist |
| `main.js` | Create | Electron main process — window, tray, menu, permissions, hot update |
| `preload.js` | Create | Secure bridge — exposes update API to renderer |
| `version.json` | Create | Version hash for hot update comparison |
| `update-hash.js` | Create | Developer utility — recomputes SHA256 after HTML edits |
| `bible-verse-projector_6.html` | Modify | Add update notification script (~15 lines before `</body>`) |
