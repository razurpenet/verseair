const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('verseairAPI', {
  // Listen for update-available notification from main process
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, version) => callback(version));
  },

  // Restart app to apply the downloaded update
  restartToUpdate: () => ipcRenderer.invoke('restart-to-update'),

  // Check if an update has been downloaded
  getUpdateStatus: () => ipcRenderer.invoke('get-update-status'),

  // ── Azure Speech Key Management ──
  // Get stored speech credentials (returns { key, region } or null)
  getSpeechConfig: () => ipcRenderer.invoke('get-speech-config'),

  // Store speech credentials securely in app data
  setSpeechConfig: (key, region) => ipcRenderer.invoke('set-speech-config', key, region),

  // Check if speech credentials exist
  hasSpeechConfig: () => ipcRenderer.invoke('has-speech-config'),

  // ── Projector Window ──
  openProjector: () => ipcRenderer.invoke('open-projector')
});
