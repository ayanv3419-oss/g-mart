/* G Mart Admin Console — Dashboard panel. Analytics overview for mart staff.
   100% client-side; reads from window.Store and re-renders live on data changes. */
window.AdminDashboard = (function () {
  const esc = s => Store.esc(s);
  const inr = n => Store.fmtINR(n);

  /* ---- inline icons (match admin.css .ic convention) ---- */
  const ICONS = {
    people: '<path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3.2"/><path d="M22 19v-2a4 4 0 0 0-3-3.8"/><path d="M16 3.2A4 4 0 0 1 16 11"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    bag: '<path d="M6 2L3 6v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    rupee: '<path d="M6 4h12M6 8h12M16 4c0 4-3 5-6 5H6l7 7"/>'
  };
  const svg = key => `<svg class="ic" viewBox="0 0 24 24">${ICONS[key]}</svg>`;

  /* ---- date helpers ---- */
  const DAYNAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayKey = d => { const x = new Date(d); return x.getFullYear() + '-' + x.getMonth() + '-' + x.getDate(); };
  function relJoined(iso) {
    const then = new Date(iso), now = new Date();
    const days = Math.floor((now - then) / 86400000);
    if (isNaN(days)) return '';
    if (days <= 0) return 'joined today';
    if (days === 1) return 'joined 1d ago';
    if (days < 30) return 'joined ' + days + 'd ago';
    return 'joined ' + then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const initial = name => esc((String(name || '?').trim()[0] || '?').toUpperCase());

  /* ---- stat row ---- */
  function statRow() {
    const s = Store.stats();
    const cards = [
      { ic: 'people', bg: 'var(--brand-50)', fg: 'var(--brand)', val: s.users.toLocaleString('en-IN'), lab: 'Total Users', trend: '▲ 12% this month' },
      { ic: 'box', bg: '#e9f9ef', fg: '#15a34a', val: s.products.toLocaleString('en-IN'), lab: 'Products Listed', trend: '▲ 6 added this week' },
      { ic: 'bag', bg: '#e6f6fd', fg: '#0ea5e9', val: s.orders.toLocaleString('en-IN'), lab: 'Total Orders', trend: '▲ 9% this month' },
      { ic: 'rupee', bg: '#f1ebfd', fg: '#7c3aed', val: inr(s.revenue), lab: 'Revenue', trend: '▲ 14% this month' }
    ];
    return `<div class="stat-grid">${cards.map(c => `
      <div class="stat">
        <div class="s-ic" style="background:${c.bg};color:${c.fg}">${svg(c.ic)}</div>
        <div class="s-val">${esc(c.val)}</div>
        <div class="s-lab">${esc(c.lab)}</div>
        <div class="s-trend">${esc(c.trend)}</div>
      </div>`).join('')}</div>`;
  }

  /* ---- bar chart: orders in last 7 calendar days ---- */
  function chartCard() {
    const orders = Store.getOrders();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const buckets = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      buckets.push({ key: dayKey(d), label: DAYNAMES[d.getDay()], count: 0 });
    }
    const idx = {}; buckets.forEach((b, i) => idx[b.key] = i);
    orders.forEach(o => { const k = dayKey(o.date); if (k in idx) buckets[idx[k]].count++; });

    const max = Math.max(1, ...buckets.map(b => b.count));
    const W = 560, H = 220, padB = 34, padT = 26, n = buckets.length;
    const slot = W / n, barW = Math.min(46, slot * 0.5);
    const plotH = H - padB - padT;

    const bars = buckets.map((b, i) => {
      const cx = slot * i + slot / 2;
      const h = b.count > 0 ? Math.max(6, (b.count / max) * plotH) : 4;
      const y = H - padB - h;
      const stub = b.count === 0;
      return `
        <rect x="${(cx - barW / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${h.toFixed(1)}" rx="6"
          fill="${stub ? '#f0d3d6' : 'var(--brand)'}"></rect>
        <text x="${cx.toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle"
          font-size="13" font-weight="800" fill="${stub ? '#94a3b8' : 'var(--ink)'}">${b.count}</text>
        <text x="${cx.toFixed(1)}" y="${(H - 12).toFixed(1)}" text-anchor="middle"
          font-size="12" font-weight="700" fill="var(--muted)">${esc(b.label)}</text>`;
    }).join('');

    const total = buckets.reduce((s, b) => s + b.count, 0);
    return `
      <div class="gm-card" style="margin-bottom:22px">
        <div class="section-head" style="margin-bottom:6px">
          <div class="grow">
            <h3>Orders — last 7 days</h3>
            <div class="card-sub" style="margin-bottom:0">${total} order${total === 1 ? '' : 's'} placed across the past week.</div>
          </div>
          <span class="gm-badge ok">Live</span>
        </div>
        <svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;overflow:visible;margin-top:8px"
          preserveAspectRatio="xMidYMid meet" role="img" aria-label="Orders per day, last 7 days">
          <line x1="0" y1="${H - padB}" x2="${W}" y2="${H - padB}" stroke="var(--line)" stroke-width="1"></line>
          ${bars}
        </svg>
      </div>`;
  }

  /* ---- recent signups ---- */
  function signupsCard() {
    const users = Store.getUsers()
      .slice().sort((a, b) => new Date(b.joined) - new Date(a.joined)).slice(0, 5);
    const body = users.length ? users.map(u => `
      <div class="row" style="gap:11px;padding:11px 0;border-bottom:1px solid var(--line)">
        <div class="avatar-sm">${initial(u.name)}</div>
        <div style="min-width:0;flex:1">
          <div class="t-strong" style="color:var(--ink);font-weight:700;font-size:14px">${esc(u.name)}</div>
          <div style="color:var(--muted);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(u.email)}</div>
        </div>
        <div style="color:var(--muted);font-size:12px;font-weight:600;white-space:nowrap">${esc(relJoined(u.joined))}</div>
      </div>`).join('') : emptyState('No signups yet', 'people');
    return panelCard('Recent signups', 'Latest customers to create an account.', body, users.length);
  }

  /* ---- recent orders ---- */
  function ordersCard() {
    const orders = Store.getOrders()
      .slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const badge = st => {
      if (st === 'Delivered') return 'ok';
      if (st === 'Cancelled') return 'off';
      return 'warn'; // Processing / Shipped
    };
    const body = orders.length ? orders.map(o => `
      <div class="row" style="gap:11px;padding:11px 0;border-bottom:1px solid var(--line)">
        <div style="min-width:0;flex:1">
          <div class="t-strong" style="color:var(--ink);font-weight:700;font-size:13.5px">#${esc(o.id)}</div>
          <div style="color:var(--muted);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(o.user)}</div>
        </div>
        <div style="color:var(--ink);font-weight:800;font-size:13.5px;white-space:nowrap">${esc(inr(o.total))}</div>
        <span class="gm-badge ${badge(o.status)}" style="flex-shrink:0">${esc(o.status)}</span>
      </div>`).join('') : emptyState('No orders yet', 'bag');
    return panelCard('Recent orders', 'Most recent transactions across the store.', body, orders.length);
  }

  function panelCard(title, sub, body, hasItems) {
    const inner = hasItems
      ? `<div style="margin-top:-2px">${body}</div>
         <style>.gm-card .row:last-child{border-bottom:none !important}</style>`
      : body;
    return `
      <div class="gm-card">
        <h3>${esc(title)}</h3>
        <div class="card-sub">${esc(sub)}</div>
        ${inner}
      </div>`;
  }

  function emptyState(msg, ic) {
    return `<div class="empty-state">${svg(ic)}<div>${esc(msg)}</div></div>`;
  }

  /* ---- render ---- */
  function render(el) {
    el.innerHTML = `
      <div class="section-head">
        <div class="grow">
          <h3>Store overview</h3>
        </div>
        <span class="gm-badge">${esc(new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }))}</span>
      </div>
      ${statRow()}
      ${chartCard()}
      <div class="grid2">
        ${signupsCard()}
        ${ordersCard()}
      </div>`;
  }

  return {
    mount(containerEl) {
      if (!containerEl) return;
      const rerender = () => render(containerEl);
      rerender();
      Store.on('change', rerender);
    }
  };
})();
