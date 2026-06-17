/* G Mart Admin Console — Customer accounts panel. 100% client-side (demo).
   Lets mart staff search customers, issue temporary passwords (forgot-password
   recovery), delete accounts, and re-create accounts for customers who lost access. */
window.AdminUsers = (function () {
  let root = null;       // the panel <section>
  let search = '';       // current search text, preserved across re-renders

  const initial = name => (String(name || '?').trim()[0] || '?').toUpperCase();
  const fmtDate = iso => {
    const d = new Date(iso);
    return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  /* ---- icons ---- */
  const IC = {
    search: '<svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    add: '<svg class="ic" viewBox="0 0 24 24"><path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3.2"/><path d="M19 8v6M22 11h-6"/></svg>',
    key: '<svg class="ic" viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="3.5"/><path d="M10 13l9-9M16 4l3 3M14 6l2 2"/></svg>',
    trash: '<svg class="ic" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>',
    empty: '<svg class="ic" viewBox="0 0 24 24"><path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3.2"/><path d="M22 19v-2a4 4 0 0 0-3-3.8"/><path d="M16 3.2A4 4 0 0 1 16 11"/></svg>'
  };

  /* ---- one-time skeleton ---- */
  function build() {
    root.innerHTML = `
      <div class="section-head">
        <h3>Customer accounts</h3>
        <span class="gm-badge" id="uCount" style="margin-left:2px"></span>
        <div class="grow" style="min-width:200px;max-width:360px;position:relative">
          <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none">${IC.search}</span>
          <input class="gm-input" id="uSearch" type="search" placeholder="Search by name or email…" style="padding-left:40px" autocomplete="off" />
        </div>
        <button class="gm-btn" id="uAdd">${IC.add}Add / re-create account</button>
      </div>
      <div id="uTable"></div>

      <div class="gm-modal" id="uModal">
        <form class="gm-sheet" id="uForm" autocomplete="off">
          <h3>Add / re-create account</h3>
          <p>For customers who lost access to their account and need it set up again. Create a fresh account here, then issue them a temporary password from the list.</p>
          <div class="gm-field">
            <label class="gm-label">Full name</label>
            <input class="gm-input" id="uName" type="text" placeholder="e.g. Aarav Sharma" />
          </div>
          <div class="gm-field">
            <label class="gm-label">Email</label>
            <input class="gm-input" id="uEmail" type="email" placeholder="customer@example.com" />
          </div>
          <div class="gm-field" style="margin-bottom:8px">
            <label class="gm-label">Phone <span style="color:var(--muted);font-weight:500">(optional)</span></label>
            <input class="gm-input" id="uPhone" type="tel" placeholder="+91 98765 43210" />
          </div>
          <div class="login-err" id="uErr" style="margin-top:0"></div>
          <div class="actions">
            <button type="button" class="gm-btn ghost" id="uCancel">Cancel</button>
            <button type="submit" class="gm-btn">Create account</button>
          </div>
        </form>
      </div>`;

    const $ = id => root.querySelector(id);
    const searchEl = $('#uSearch');
    const modal = $('#uModal'), form = $('#uForm');
    const nameEl = $('#uName'), emailEl = $('#uEmail'), phoneEl = $('#uPhone'), errEl = $('#uErr');

    searchEl.addEventListener('input', () => { search = searchEl.value; renderTable(); });

    /* table row actions (event delegation) */
    $('#uTable').addEventListener('click', e => {
      const btn = e.target.closest('[data-act]'); if (!btn) return;
      const id = btn.dataset.id, name = btn.dataset.name || 'this customer';
      if (btn.dataset.act === 'reset') {
        const tmp = Store.resetPassword(id);
        if (tmp) toast('Temporary password for ' + name + ': ' + tmp);
      } else if (btn.dataset.act === 'delete') {
        if (window.confirm('Delete account for ' + name + '? This cannot be undone.')) {
          Store.deleteUser(id); toast('Account deleted');
        }
      }
    });

    /* modal open/close + create */
    const openModal = () => {
      errEl.textContent = ''; nameEl.value = ''; emailEl.value = ''; phoneEl.value = '';
      modal.classList.add('show'); setTimeout(() => nameEl.focus(), 30);
    };
    const closeModal = () => modal.classList.remove('show');

    $('#uAdd').addEventListener('click', openModal);
    $('#uCancel').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = nameEl.value.trim(), email = emailEl.value.trim(), phone = phoneEl.value.trim();
      if (!name) { errEl.textContent = 'Please enter the customer’s full name.'; nameEl.focus(); return; }
      if (!email) { errEl.textContent = 'Please enter an email address.'; emailEl.focus(); return; }
      if (Store.findUserByEmail(email)) {
        errEl.textContent = 'An account with this email already exists.'; emailEl.focus(); return;
      }
      Store.addUser({ name, email, phone });
      closeModal();
      toast('Account created for ' + name);
    });
  }

  /* ---- count summary + table (re-rendered on every change) ---- */
  function filtered() {
    const q = search.trim().toLowerCase();
    const users = Store.getUsers();
    if (!q) return users;
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }

  function renderCount() {
    const all = Store.getUsers();
    const active = all.filter(u => u.status === 'active').length;
    const el = root.querySelector('#uCount');
    if (el) el.textContent = all.length + ' total · ' + active + ' active';
  }

  function renderTable() {
    const wrap = root.querySelector('#uTable');
    const rows = filtered();

    if (!rows.length) {
      const msg = Store.getUsers().length ? 'No accounts match your search.' : 'No accounts yet.';
      wrap.innerHTML = `<div class="gm-table-wrap"><div class="empty-state">${IC.empty}${Store.esc(msg)}</div></div>`;
      return;
    }

    const body = rows.map(u => {
      const nm = Store.esc(u.name), em = Store.esc(u.email || '—'), ph = Store.esc(u.phone || '—');
      const ok = u.status === 'active';
      return `<tr>
        <td>
          <div class="cell-user">
            <div class="avatar-sm">${Store.esc(initial(u.name))}</div>
            <div>
              <div class="t-strong">${nm}</div>
              <div style="font-size:12px;color:var(--muted)">${em}</div>
            </div>
          </div>
        </td>
        <td>${ph}</td>
        <td>${Store.esc(fmtDate(u.joined))}</td>
        <td>${Number(u.orders || 0)}</td>
        <td><span class="gm-badge ${ok ? 'ok' : 'off'}">${ok ? 'Active' : 'Inactive'}</span></td>
        <td>
          <div class="row" style="gap:8px;flex-wrap:nowrap;justify-content:flex-end">
            <button class="gm-btn ghost sm" data-act="reset" data-id="${Store.esc(u.id)}" data-name="${nm}">${IC.key}Reset password</button>
            <button class="icon-btn danger" data-act="delete" data-id="${Store.esc(u.id)}" data-name="${nm}" title="Delete account" aria-label="Delete account">${IC.trash}</button>
          </div>
        </td>
      </tr>`;
    }).join('');

    wrap.innerHTML = `<div class="gm-table-wrap">
      <table class="gm-table">
        <thead><tr>
          <th>Customer</th><th>Phone</th><th>Joined</th><th>Orders</th><th>Status</th>
          <th style="text-align:right">Actions</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
  }

  function rerender() {
    if (!root) return;
    renderCount();
    renderTable();
    /* keep search box value in sync (e.g. after external changes) */
    const s = root.querySelector('#uSearch');
    if (s && s.value !== search) s.value = search;
  }

  return {
    mount(containerEl) {
      root = containerEl;
      build();
      rerender();
      Store.on('users', rerender);
    }
  };
})();
