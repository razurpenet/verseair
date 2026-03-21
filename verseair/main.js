const { app, BrowserWindow, Menu, Tray, nativeImage, screen, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

// ── HOT UPDATE CONFIG ──
// IMPORTANT: Update these after creating your GitHub repo
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/razurpenet/verseair/master/verseair';
const VERSION_URL = `${GITHUB_RAW_BASE}/version.json`;
const HTML_URL = `${GITHUB_RAW_BASE}/bible-verse-projector_6.html`;
const UPDATE_CHECK_DELAY = 3000; // 3 seconds after window loads

// ── SPEECH RECOGNITION ──
// Azure Cognitive Services Speech SDK provides real-time streaming
// speech recognition. API key stored securely in app userData.
app.commandLine.appendSwitch('enable-speech-input');
app.commandLine.appendSwitch('enable-features', 'WebSpeechAPI');

let mainWindow = null;
let projectorWindow = null;
let tray = null;

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
          const aboutIcon = nativeImage.createFromPath(
            path.join(__dirname, 'assets', 'verseair_icon_transparent.png')
          ).resize({ width: 64, height: 64 });
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            icon: aboutIcon,
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

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'verseair_icon_transparent.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 48, height: 48 });
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

function openProjectorWindow(externalDisplay) {
  // Close existing projector window if open
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.focus();
    return;
  }

  const opts = {
    backgroundColor: '#0b0c0f',
    icon: path.join(__dirname, 'assets', 'verseair_icon_transparent.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  };

  if (externalDisplay) {
    // Open fullscreen on external display
    opts.x = externalDisplay.bounds.x;
    opts.y = externalDisplay.bounds.y;
    opts.fullscreen = true;
  } else {
    // No external display — open as a draggable window
    opts.width = 1280;
    opts.height = 720;
    opts.title = 'VerseAir — Projector';
  }

  projectorWindow = new BrowserWindow(opts);
  projectorWindow.loadURL(`http://127.0.0.1:${localServerPort}/projector.html`);

  projectorWindow.on('closed', () => {
    projectorWindow = null;
  });
}

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
      openProjectorWindow(externalDisplay);
    }
  });
}

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

// ── IPC HANDLERS ──

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

// ── AZURE SPEECH KEY MANAGEMENT ──

function getSpeechConfigPath() {
  return path.join(app.getPath('userData'), 'speech-config.json');
}

ipcMain.handle('get-speech-config', () => {
  const configPath = getSpeechConfigPath();
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return null;
  }
});

ipcMain.handle('set-speech-config', (event, key, region) => {
  const configPath = getSpeechConfigPath();
  fs.writeFileSync(configPath, JSON.stringify({ key, region }), 'utf8');
  return true;
});

ipcMain.handle('has-speech-config', () => {
  return fs.existsSync(getSpeechConfigPath());
});

// ── PROJECTOR WINDOW ──

ipcMain.handle('open-projector', () => {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  const externalDisplay = displays.find(d => d.id !== primaryDisplay.id);
  openProjectorWindow(externalDisplay || null);
  return true;
});

// ── LOCAL SERVER ──
// Serve HTML via localhost so Web Speech API gets a proper origin
let localServerPort = 0;

function startLocalServer() {
  return new Promise((resolve) => {
    const mime = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.ico': 'image/x-icon',
      '.svg': 'image/svg+xml',
      '.json': 'application/json',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.wasm': 'application/wasm'
    };

    const server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath;

      if (reqPath === '/' || reqPath === '/index.html') {
        // Serve HTML with Azure Speech polyfill injected
        const htmlContent = fs.readFileSync(getHtmlPath(), 'utf8');
        const azureScripts = `
<!-- Azure Speech SDK (real-time streaming speech recognition) -->
<script src="/azure-speech-sdk.js"><\/script>
<script src="/azure-speech-polyfill.js"><\/script>`;
        // Inject polyfill right after <head> so it loads before app code
        const injected = htmlContent.replace(/<head([^>]*)>/i, `<head$1>${azureScripts}`);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(injected);
        return;
      } else if (reqPath === '/azure-speech-sdk.js') {
        // Serve Azure Speech SDK browser bundle from node_modules
        filePath = path.join(__dirname, 'node_modules', 'microsoft-cognitiveservices-speech-sdk',
          'distrib', 'browser', 'microsoft.cognitiveservices.speech.sdk.bundle-min.js');
      } else {
        filePath = path.join(__dirname, reqPath);
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mime[ext] || 'application/octet-stream';

      // Stream large files (models) instead of loading into memory
      const stat = fs.statSync(filePath);
      if (stat.size > 10 * 1024 * 1024) {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': stat.size,
          'Cache-Control': 'public, max-age=86400'
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });

    // Listen on random available port on localhost only
    server.listen(0, '127.0.0.1', () => {
      localServerPort = server.address().port;
      console.log(`Local server running on http://127.0.0.1:${localServerPort}`);
      resolve(localServerPort);
    });
  });
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

  createMenu();

  // Load via localhost so Web Speech API gets a proper origin
  mainWindow.loadURL(`http://127.0.0.1:${localServerPort}/`);

  // Auto-grant microphone permission — no browser dialog
  mainWindow.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      const allowed = ['media', 'microphone', 'audioCapture'];
      callback(allowed.includes(permission));
    }
  );

  // Auto-approve permission checks (navigator.permissions.query) so Chromium
  // never reports 'prompt' or 'denied' for mic — prevents browser-style dialogs
  mainWindow.webContents.session.setPermissionCheckHandler(
    (webContents, permission) => {
      const allowed = ['media', 'microphone', 'audioCapture'];
      return allowed.includes(permission);
    }
  );

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
}

// Spoof Chrome user agent so Google Speech API accepts requests from Electron
// Must strip BOTH "Electron/x.x.x" AND the app name "VerseAir/x.x.x"
app.on('ready', () => {
  const ses = require('electron').session.defaultSession;
  const electronUA = ses.getUserAgent();
  const chromeUA = electronUA
    .replace(/\s*Electron\/\S+/, '')
    .replace(/\s*VerseAir\/\S+/, '');
  ses.setUserAgent(chromeUA);
});

app.whenReady().then(async () => {
  await startLocalServer();
  createWindow();
  createTray();

  mainWindow.webContents.on('did-finish-load', () => {
    checkForProjector();
    // Check for hot updates in background
    setTimeout(checkForUpdates, UPDATE_CHECK_DELAY);
  });
});

app.on('window-all-closed', (e) => {
  // Don't quit — tray keeps the app alive
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
