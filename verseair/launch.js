#!/usr/bin/env node
/**
 * Launcher that ensures ELECTRON_RUN_AS_NODE is removed
 * before spawning Electron, so it runs as a proper app.
 */
const { spawn } = require('child_process');
const path = require('path');

const electronPath = require('electron');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ['.'], {
  cwd: __dirname,
  env,
  stdio: 'inherit'
});

child.on('close', (code) => process.exit(code));
