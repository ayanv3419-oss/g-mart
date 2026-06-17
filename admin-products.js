/* G Mart Admin Console — Products & Uploads panel.
   Lets mart staff upload a new product + item image, processed to a WHITE background
   entirely client-side (canvas). 100% local demo — no backend. */
window.AdminProducts = (function () {

  /* ---------- inline icon helpers ---------- */
  const I = {
    upload: '<svg class="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></svg>',
    plus: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    download: '<svg class="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',
    trash: '<svg class="ic" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>',
    box: '<svg class="ic" viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
    sheet: '<svg class="ic" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/></svg>',
    check: '<svg class="ic" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>'
  };

  /* ---------- background-to-white processor (lightweight canvas) ---------- */
  function whitenBg(dataURL) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const MAX = 600, scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          const data = ctx.getImageData(0, 0, w, h);
          const px = data.data;
          // average RGB of the 4 corner pixels = assumed background colour
          const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
          let br = 0, bg = 0, bb = 0;
          corners.forEach(o => { br += px[o]; bg += px[o + 1]; bb += px[o + 2]; });
          br /= 4; bg /= 4; bb /= 4;

          const TOL = 45;
          for (let i = 0; i < px.length; i += 4) {
            const r = px[i], g = px[i + 1], b = px[i + 2];
            const dist = Math.sqrt((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2);
            const bright = (r + g + b) / 3;
            if (dist < TOL || bright > 238) {
              px[i] = px[i + 1] = px[i + 2] = 255; px[i + 3] = 255;
            }
          }
          ctx.putImageData(data, 0, 0);
          resolve(c.toDataURL('image/jpeg', 0.9));
        } catch (err) { reject(err); }
      };
      img.onerror = reject;
      img.src = dataURL;
    });
  }

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch (_) { return '—'; }
  }

  function mount(containerEl) {
    let processedImg = '';      // processed (white-bg) dataURL to save
    let originalImg = '';       // raw original dataURL for the before preview

    containerEl.innerHTML = `
      <div class="section-head">
        <h3>Products &amp; Uploads</h3>
        <div class="grow"></div>
        <button class="gm-btn ghost sm" id="apExport">${I.download}Download catalog JSON</button>
      </div>

      <div class="gm-card" style="margin-bottom:22px">
        <h3>Upload your product data</h3>
        <div class="card-sub">Upload your whole product list as a <b>CSV</b> or <b>JSON</b> file and we'll import every item at once. Working in Excel? Just choose <b>Save As → CSV</b>.</div>

        <div class="dropzone" id="apDataDrop">
          ${I.sheet}
          <div class="dz-t">Click to upload, or drop your data file here</div>
          <div class="dz-s">.csv or .json &middot; columns: name, brand, category, subcategory, price, mrp</div>
        </div>
        <input type="file" accept=".csv,.json,text/csv,application/json" id="apDataFile" class="hidden" />

        <div class="row" style="margin-top:12px">
          <button class="gm-btn ghost sm" id="apTemplate">${I.download}Download CSV template</button>
        </div>

        <div id="apDataPreview"></div>
      </div>

      <div class="gm-card" style="margin-bottom:22px">
        <h3>Or add a single product manually</h3>
        <div class="card-sub">Upload an item photo — we clean its background to pure white for a tidy catalog — then fill in the details.</div>

        <div class="dropzone" id="apDrop">
          ${I.upload}
          <div class="dz-t">Click to upload, or drop an image here</div>
          <div class="dz-s">PNG or JPG · background auto-whitened in your browser</div>
        </div>
        <input type="file" accept="image/*" id="apFile" class="hidden" />

        <div id="apPreview"></div>

        <div class="grid2" style="margin-top:16px">
          <div class="gm-field">
            <label class="gm-label">Product name *</label>
            <input class="gm-input" id="apName" placeholder="e.g. Amul Gold Milk, 1 L" />
          </div>
          <div class="gm-field">
            <label class="gm-label">Brand</label>
            <input class="gm-input" id="apBrand" placeholder="e.g. Amul" />
          </div>
          <div class="gm-field">
            <label class="gm-label">Category *</label>
            <select class="gm-input" id="apCat">
              <option value="">Select a category</option>
              ${Store.CATEGORIES.map(c => `<option value="${Store.esc(c)}">${Store.esc(c)}</option>`).join('')}
            </select>
          </div>
          <div class="gm-field">
            <label class="gm-label">Subcategory</label>
            <input class="gm-input" id="apSub" placeholder="e.g. Milk" />
          </div>
          <div class="gm-field">
            <label class="gm-label">Price ₹</label>
            <input class="gm-input" id="apPrice" type="number" min="0" step="1" placeholder="0" />
          </div>
          <div class="gm-field">
            <label class="gm-label">MRP ₹</label>
            <input class="gm-input" id="apMrp" type="number" min="0" step="1" placeholder="0" />
          </div>
        </div>

        <div class="row" style="margin-top:4px">
          <button class="gm-btn" id="apAdd">${I.plus}Add product</button>
        </div>
      </div>

      <div class="section-head"><h3>Uploaded products</h3></div>
      <div class="gm-table-wrap"><table class="gm-table">
        <thead><tr>
          <th style="width:64px">Item</th><th>Name</th><th>Category</th><th>Price</th><th>Added</th><th style="width:56px"></th>
        </tr></thead>
        <tbody id="apBody"></tbody>
      </table></div>
    `;

    const $ = sel => containerEl.querySelector(sel);
    const drop = $('#apDrop'), file = $('#apFile'), preview = $('#apPreview');
    const fName = $('#apName'), fBrand = $('#apBrand'), fCat = $('#apCat'),
      fSub = $('#apSub'), fPrice = $('#apPrice'), fMrp = $('#apMrp');

    /* ---------- image handling ---------- */
    function showProcessing() {
      preview.innerHTML = `<div class="empty-state" style="padding:24px">${I.box}Processing image…</div>`;
    }
    function renderPreview() {
      preview.innerHTML = `
        <div class="preview-pair">
          <div class="preview-box">
            <div class="pv-lab">Original</div>
            <img src="${originalImg}" alt="Original" />
          </div>
          <div class="preview-box white">
            <div class="pv-lab">White background</div>
            <img src="${processedImg}" alt="Processed" />
          </div>
        </div>`;
    }
    function clearPreview() { processedImg = ''; originalImg = ''; preview.innerHTML = ''; }

    function handleFile(f) {
      if (!f || !/^image\//.test(f.type)) { toast('Please choose an image file'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        originalImg = reader.result;
        showProcessing();
        whitenBg(originalImg)
          .then(out => { processedImg = out; renderPreview(); })
          .catch(() => { processedImg = originalImg; renderPreview(); toast('Could not process — using original'); });
      };
      reader.readAsDataURL(f);
    }

    drop.addEventListener('click', () => file.click());
    file.addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); file.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
    ['dragleave', 'dragend', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
    drop.addEventListener('drop', e => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) handleFile(f); });

    /* ---------- bulk data upload (CSV / JSON) ---------- */
    const dataDrop = $('#apDataDrop'), dataFile = $('#apDataFile'), dataPreview = $('#apDataPreview');
    let pendingRows = [];

    const COLS = {
      name: ['name', 'product', 'product name', 'title', 'item', 'item name'],
      brand: ['brand', 'make', 'company', 'manufacturer'],
      cat: ['cat', 'category'],
      sub: ['sub', 'subcategory', 'sub category', 'sub-category'],
      price: ['price', 'selling price', 'sp', 'rate', 'our price', 'mop'],
      mrp: ['mrp', 'list price', 'market price', 'max retail price']
    };
    const idxOf = (header, keys) => {
      const low = header.map(h => String(h).trim().toLowerCase());
      for (const k of keys) { const i = low.indexOf(k); if (i >= 0) return i; }
      return -1;
    };
    const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : Math.round(n); };
    const norm = o => ({
      name: String(o.name || '').trim(), brand: String(o.brand || '').trim(),
      cat: String(o.cat || '').trim(), sub: String(o.sub || '').trim(),
      price: num(o.price), mrp: num(o.mrp)
    });

    function parseCSV(text) {
      const rows = []; let field = '', row = [], inQ = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQ) {
          if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
          else field += ch;
        } else if (ch === '"') inQ = true;
        else if (ch === ',') { row.push(field); field = ''; }
        else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (ch !== '\r') field += ch;
      }
      if (field.length || row.length) { row.push(field); rows.push(row); }
      return rows.filter(r => r.some(c => String(c).trim() !== ''));
    }
    function rowsFromCSV(text) {
      const rows = parseCSV(text); if (rows.length < 2) return [];
      const header = rows[0], map = {};
      Object.keys(COLS).forEach(k => map[k] = idxOf(header, COLS[k]));
      if (map.name < 0) return null;
      return rows.slice(1).map(r => norm({
        name: r[map.name], brand: map.brand >= 0 ? r[map.brand] : '',
        cat: map.cat >= 0 ? r[map.cat] : '', sub: map.sub >= 0 ? r[map.sub] : '',
        price: map.price >= 0 ? r[map.price] : 0, mrp: map.mrp >= 0 ? r[map.mrp] : 0
      }));
    }
    function rowsFromJSON(text) {
      let j; try { j = JSON.parse(text); } catch (_) { return null; }
      const arr = Array.isArray(j) ? j : (j.products || j.items || j.data);
      if (!Array.isArray(arr)) return null;
      return arr.map(o => norm({
        name: o.name || o.product || o.title, brand: o.brand,
        cat: o.cat || o.category, sub: o.sub || o.subcategory, price: o.price, mrp: o.mrp
      }));
    }

    function handleDataFile(f) {
      if (!f) return;
      const isJSON = /\.json$/i.test(f.name) || /json/.test(f.type);
      const reader = new FileReader();
      reader.onload = () => {
        let rows = isJSON ? rowsFromJSON(reader.result) : rowsFromCSV(reader.result);
        if (rows === null) { toast('Couldn’t read that file — make sure it has a "name" column/field'); return; }
        rows = rows.filter(r => r.name);
        if (!rows.length) { toast('No products found in that file'); return; }
        pendingRows = rows; renderDataPreview();
      };
      reader.readAsText(f);
    }

    function renderDataPreview() {
      const n = pendingRows.length, show = pendingRows.slice(0, 8);
      dataPreview.innerHTML = `
        <div class="row" style="margin:16px 0 10px;justify-content:space-between">
          <div class="t-strong" style="color:var(--ink)">${n} product${n !== 1 ? 's' : ''} ready to import</div>
          <div class="row">
            <button class="gm-btn ghost sm" id="apDataCancel">Cancel</button>
            <button class="gm-btn sm" id="apDataImport">${I.check} Import ${n} product${n !== 1 ? 's' : ''}</button>
          </div>
        </div>
        <div class="gm-table-wrap"><table class="gm-table">
          <thead><tr><th>Name</th><th>Brand</th><th>Category</th><th>Price</th><th>MRP</th></tr></thead>
          <tbody>${show.map(r => `<tr>
            <td class="t-strong">${Store.esc(r.name)}</td>
            <td>${Store.esc(r.brand) || '—'}</td>
            <td>${r.cat ? `<span class="gm-badge">${Store.esc(r.cat)}</span>` : '—'}</td>
            <td>${r.price ? Store.fmtINR(r.price) : '—'}</td>
            <td>${r.mrp ? Store.fmtINR(r.mrp) : '—'}</td>
          </tr>`).join('')}</tbody>
        </table></div>
        ${n > show.length ? `<div class="card-sub" style="margin-top:8px">…and ${n - show.length} more</div>` : ''}`;
      dataPreview.querySelector('#apDataCancel').addEventListener('click', () => { pendingRows = []; dataPreview.innerHTML = ''; });
      dataPreview.querySelector('#apDataImport').addEventListener('click', () => {
        const count = pendingRows.length;
        pendingRows.forEach(r => Store.addProduct(r));
        toast('Imported ' + count + ' product' + (count !== 1 ? 's' : ''));
        pendingRows = []; dataPreview.innerHTML = '';
      });
    }

    dataDrop.addEventListener('click', () => dataFile.click());
    dataFile.addEventListener('change', e => { if (e.target.files[0]) handleDataFile(e.target.files[0]); dataFile.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => dataDrop.addEventListener(ev, e => { e.preventDefault(); dataDrop.classList.add('drag'); }));
    ['dragleave', 'dragend', 'drop'].forEach(ev => dataDrop.addEventListener(ev, e => { e.preventDefault(); dataDrop.classList.remove('drag'); }));
    dataDrop.addEventListener('drop', e => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) handleDataFile(f); });

    $('#apTemplate').addEventListener('click', () => {
      const csv = 'name,brand,category,subcategory,price,mrp\n'
        + 'Amul Gold Milk 1 L,Amul,Dairy & Bakery,Milk,72,75\n'
        + 'Tata Salt 1 kg,Tata,Staples & Packaged Food,Salt & Sugar,28,30\n';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'gmart-product-template.csv';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast('Template downloaded');
    });

    /* ---------- add product ---------- */
    $('#apAdd').addEventListener('click', () => {
      const name = fName.value.trim(), cat = fCat.value;
      if (!name) { toast('Product name is required'); fName.focus(); return; }
      if (!cat) { toast('Please pick a category'); fCat.focus(); return; }
      Store.addProduct({
        name, brand: fBrand.value.trim(), cat, sub: fSub.value.trim(),
        price: Number(fPrice.value) || 0, mrp: Number(fMrp.value) || 0,
        img: processedImg || ''
      });
      toast('Product added');
      [fName, fBrand, fSub, fPrice, fMrp].forEach(el => el.value = '');
      fCat.value = '';
      clearPreview();
      fName.focus();
    });

    /* ---------- export catalog JSON ---------- */
    $('#apExport').addEventListener('click', () => {
      const out = Store.getProducts().map(({ id, name, brand, cat, sub, price, mrp }) =>
        ({ id, name, brand, cat, sub, price, mrp }));
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'gmart-new-products.json';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast('Catalog downloaded');
    });

    /* ---------- table render ---------- */
    const body = $('#apBody');
    function rerenderTable() {
      const ps = Store.getProducts();
      if (!ps.length) {
        body.innerHTML = `<tr><td colspan="6"><div class="empty-state">${I.box}No products yet. Upload your first item above.</div></td></tr>`;
        return;
      }
      body.innerHTML = ps.map(p => {
        const thumb = p.img
          ? `<img class="thumb-sm" src="${p.img}" alt="${Store.esc(p.name)}" />`
          : `<span class="thumb-sm" style="display:grid;place-items:center">${I.box}</span>`;
        const mrp = (p.mrp > p.price) ? ` <s style="color:var(--muted);font-weight:400">${Store.fmtINR(p.mrp)}</s>` : '';
        return `<tr>
          <td>${thumb}</td>
          <td>
            <div class="t-strong">${Store.esc(p.name)}</div>
            ${p.brand ? `<div style="font-size:12px;color:var(--muted)">${Store.esc(p.brand)}</div>` : ''}
          </td>
          <td><span class="gm-badge">${Store.esc(p.cat)}</span></td>
          <td class="t-strong">${Store.fmtINR(p.price)}${mrp}</td>
          <td>${fmtDate(p.createdAt)}</td>
          <td><button class="icon-btn danger" data-del="${Store.esc(p.id)}" title="Delete">${I.trash}</button></td>
        </tr>`;
      }).join('');
    }

    body.addEventListener('click', e => {
      const btn = e.target.closest('[data-del]');
      if (!btn) return;
      const id = btn.getAttribute('data-del');
      const p = Store.getProducts().find(x => x.id === id);
      if (confirm(`Delete "${p ? p.name : 'this product'}"? This cannot be undone.`)) {
        Store.deleteProduct(id);
        toast('Product deleted');
      }
    });

    Store.on('products', rerenderTable);
    rerenderTable();
  }

  return { mount };
})();
