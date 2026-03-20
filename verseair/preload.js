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
