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
