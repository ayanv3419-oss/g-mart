// Flattens the mega-catalog workflow output into catalog.json (+ img/queries.json).
const fs = require('fs');
const OUT = 'C:/Users/DELL/AppData/Local/Temp/claude/C--Users-DELL-Desktop-MetricAi/b0ce9635-ce4a-48a0-9627-adafbb21abaf/tasks/w5inxdr0t.output';

const j = JSON.parse(fs.readFileSync(OUT, 'utf8').replace(/^﻿/, ''));
const cats = (j.result || j).categories || [];

let id = 0;
const products = [], queries = [], categories = [];
for (const c of cats) {
  categories.push(c.category);
  for (const p of (c.products || [])) {
    id++;
    products.push({
      id, name: p.name, brand: p.brand, cat: c.category, sub: p.subcategory || '',
      price: p.price, mrp: (p.mrp == null ? null : p.mrp), r: p.r, rv: p.rv,
      variantLabel: p.variantLabel || 'Variant', variants: p.variants || [],
      sizeLabel: p.sizeLabel || '', sizes: p.sizes || [],
      highlights: p.highlights || [], about: p.about || [], details: p.details || [],
      tagline: p.tagline || '', longDesc: p.longDesc || ''
    });
    queries.push({ id, q: p.imageQuery || p.name, produce: !!c.produce });
  }
}

fs.writeFileSync('C:/Users/DELL/Desktop/g-mart/img/queries.json', JSON.stringify(queries));
fs.writeFileSync('C:/Users/DELL/Desktop/g-mart/catalog.json', JSON.stringify({ products, categories }));
console.log('categories:', categories.length, '| products:', products.length);
console.log(categories.join(' · '));
