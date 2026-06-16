// Injects the catalog into the template — ONLY products that have a real local photo.
const fs = require('fs');
const CAT  = 'C:/Users/DELL/Desktop/g-mart/catalog.json';
const MAN  = 'C:/Users/DELL/Desktop/g-mart/img/manifest.json';
const TPL  = 'C:/Users/DELL/Desktop/g-mart/template.html';
const DEST = 'C:/Users/DELL/Desktop/g-mart/index.html';

const cat = JSON.parse(fs.readFileSync(CAT, 'utf8').replace(/^﻿/, ''));
let man = {};
if (fs.existsSync(MAN)) man = JSON.parse(fs.readFileSync(MAN, 'utf8').replace(/^﻿/, ''));

const photoOf = (id) => { const a = man[id] || man[String(id)] || []; return a[0] || ''; };

// keep only products with a real photo
const products = cat.products.filter(p => photoOf(p.id));
const images = {};
for (const p of products) images[p.id] = { main: photoOf(p.id) };
// keep category order, drop any category left empty
const categories = cat.categories.filter(c => products.some(p => p.cat === c));

const payload = JSON.stringify({ products, categories, images });
let html = fs.readFileSync(TPL, 'utf8');
if (!html.includes('__GMART_DATA__')) throw new Error('placeholder not found');
html = html.replace('__GMART_DATA__', () => payload);
fs.writeFileSync(DEST, html);

console.log('OK -> index.html', html.length, 'bytes | products(with photo):', products.length,
  'of', cat.products.length, '| categories:', categories.length);
