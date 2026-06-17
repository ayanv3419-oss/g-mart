/* G Mart Admin Console — demo data layer. 100% client-side (localStorage). DEMO ONLY:
   there is no real backend, auth, or database — data is seeded in the browser so the
   console looks and clicks like the real thing. */
window.Store = (function () {
  const K = { users: 'gm_admin_users', products: 'gm_admin_products', orders: 'gm_admin_orders' };
  const subs = {};
  const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (_) { return fb; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  function emit(evt) {
    (subs[evt] || []).forEach(f => { try { f(); } catch (_) {} });
    if (evt !== 'change') (subs.change || []).forEach(f => { try { f(); } catch (_) {} });
  }

  const CATEGORIES = ["Beverages", "Snacks & Munchies", "Staples & Packaged Food", "Dairy & Bakery",
    "Fruits & Vegetables", "Personal Care", "Home & Cleaning", "Computer Accessories",
    "Mobiles & Electronics", "Clothing & Fashion", "Footwear", "Watches",
    "Stationery & Office", "Home & Kitchen"];

  const rid = p => p + Math.random().toString(36).slice(2, 9);
  const fmtINR = n => '₹' + Number(n || 0).toLocaleString('en-IN');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function daysAgo(d) { const t = new Date(); t.setDate(t.getDate() - d); return t.toISOString(); }

  function seed() {
    if (!localStorage.getItem(K.users)) {
      const first = ["Aarav", "Vivaan", "Aditya", "Diya", "Saanvi", "Ananya", "Ishaan", "Kabir", "Myra", "Anaya",
        "Reyansh", "Aarohi", "Vihaan", "Sara", "Advik", "Riya", "Arjun", "Zara", "Kiaan", "Mira",
        "Rohan", "Neha", "Karan", "Pooja", "Dev", "Sneha", "Yash", "Tara", "Aryan", "Isha"];
      const last = ["Sharma", "Patel", "Verma", "Reddy", "Iyer", "Khan", "Mehta", "Nair", "Gupta", "Shah",
        "Das", "Rao", "Joshi", "Bose", "Kapoor", "Malhotra"];
      const users = [];
      for (let i = 0; i < 48; i++) {
        const f = first[i % first.length], l = last[(i * 3 + 1) % last.length];
        const name = f + ' ' + l;
        const email = (f + '.' + l).toLowerCase().replace(/[^a-z.]/g, '') + (i % 4 === 0 ? i : '') +
          '@' + ['gmail.com', 'yahoo.in', 'outlook.com', 'gmart.in'][i % 4];
        users.push({
          id: rid('u_'), name, email,
          phone: '+91 ' + (70000 + Math.floor(Math.random() * 29999)) + ' ' + (10000 + Math.floor(Math.random() * 89999)),
          joined: daysAgo(Math.floor(Math.random() * 540) + 1),
          orders: Math.floor(Math.random() * 22),
          status: Math.random() < 0.85 ? 'active' : 'inactive'
        });
      }
      write(K.users, users);
    }
    if (!localStorage.getItem(K.orders)) {
      const users = read(K.users, []), orders = [];
      const statuses = ['Delivered', 'Delivered', 'Delivered', 'Shipped', 'Processing', 'Cancelled'];
      for (let i = 0; i < 140; i++) {
        const u = users[Math.floor(Math.random() * users.length)] || { name: 'Guest', email: 'guest@gmart.in' };
        orders.push({
          id: 'GM' + (100000 + Math.floor(Math.random() * 899999)),
          user: u.name, email: u.email,
          total: 49 + Math.floor(Math.random() * 3500),
          items: 1 + Math.floor(Math.random() * 7),
          date: daysAgo(Math.floor(Math.random() * 120)),
          status: statuses[Math.floor(Math.random() * statuses.length)]
        });
      }
      write(K.orders, orders);
    }
    if (!localStorage.getItem(K.products)) {
      const sample = [
        { name: 'Aashirvaad Select Atta, 5 kg', brand: 'Aashirvaad', cat: 'Staples & Packaged Food', sub: 'Atta & Flours', price: 285, mrp: 330 },
        { name: 'boAt Rockerz 450 Headphones', brand: 'boAt', cat: 'Mobiles & Electronics', sub: 'Audio', price: 1499, mrp: 3990 },
        { name: 'Tata Salt, 1 kg', brand: 'Tata', cat: 'Staples & Packaged Food', sub: 'Salt & Sugar', price: 28, mrp: 30 }
      ].map((p, i) => ({ id: rid('p_'), img: '', createdAt: daysAgo(i), ...p }));
      write(K.products, sample);
    }
  }

  return {
    CATEGORIES, fmtINR, esc,
    seed,
    on(evt, cb) { (subs[evt] = subs[evt] || []).push(cb); },

    /* ---- users ---- */
    getUsers() { return read(K.users, []); },
    deleteUser(id) { write(K.users, read(K.users, []).filter(u => u.id !== id)); emit('users'); },
    addUser(u) {
      const users = read(K.users, []);
      const nu = { id: rid('u_'), name: 'New User', email: '', phone: '', joined: new Date().toISOString(), orders: 0, status: 'active', ...u };
      users.unshift(nu); write(K.users, users); emit('users'); return nu;
    },
    resetPassword(id) {
      const users = read(K.users, []); const u = users.find(x => x.id === id); if (!u) return null;
      const tmp = 'Gm' + Math.random().toString(36).slice(2, 8); u.tempPassword = tmp; u.status = 'active';
      write(K.users, users); emit('users'); return tmp;
    },
    findUserByEmail(email) { return read(K.users, []).find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase()); },

    /* ---- products ---- */
    getProducts() { return read(K.products, []); },
    addProduct(p) {
      const ps = read(K.products, []);
      const np = { id: rid('p_'), createdAt: new Date().toISOString(), img: '', ...p };
      ps.unshift(np); write(K.products, ps); emit('products'); return np;
    },
    deleteProduct(id) { write(K.products, read(K.products, []).filter(p => p.id !== id)); emit('products'); },

    /* ---- orders ---- */
    getOrders() { return read(K.orders, []); },

    /* ---- stats ---- */
    stats() {
      const u = read(K.users, []), p = read(K.products, []), o = read(K.orders, []);
      return { users: u.length, products: p.length, orders: o.length, revenue: o.reduce((s, x) => s + (x.total || 0), 0) };
    },

    resetAll() { Object.values(K).forEach(k => localStorage.removeItem(k)); seed(); emit('change'); }
  };
})();
