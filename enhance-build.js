// Reads the premium-polish workflow output and writes enhance.css + enhance.js.
// Each JS module is sandboxed in its own try{ (function(){...})() }catch so one bad module can't break the rest.
const fs = require('fs');
const OUT = process.argv[2] || 'C:/Users/DELL/AppData/Local/Temp/claude/C--Users-DELL-Desktop-MetricAi/e5c30456-5f3d-4239-afa8-afc713c8ec69/tasks/wsw15byai.output';
const DIR = 'C:/Users/DELL/Desktop/g-mart/';

const j = JSON.parse(fs.readFileSync(OUT, 'utf8').replace(/^﻿/, ''));
const mods = ((j.result || j).modules) || [];

let css = '/* G Mart — premium enhancements (generated) */\n';
let js  = '/* G Mart — premium enhancements (generated) */\n';
let nc = 0, nj = 0;
for (let i = 0; i < mods.length; i++) {
  const m = mods[i], name = m.label || ('module ' + i);
  if (m.css && m.css.trim()) { css += `\n/* ===== ${name} ===== */\n` + m.css.trim() + '\n'; nc++; }
  if (m.js && m.js.trim())  { js += `\n/* ===== ${name} ===== */\ntry{ (function(){\n` + m.js.trim() + `\n})(); }catch(e){ console.warn('[enhance:${name}] skipped:', e); }\n`; nj++; }
}
fs.writeFileSync(DIR + 'enhance.css', css);
fs.writeFileSync(DIR + 'enhance.js', js);
console.log(`modules: ${mods.length} | css blocks: ${nc} | js blocks: ${nj} | enhance.css ${css.length}b, enhance.js ${js.length}b`);
