const PRODUCTS = [
  {id:1,name:'Jaket Menyala',cat:'Fashion',price:1000,old:249000,img:'hoodie',tag:'best seller'},
  {id:2,name:'Tas Anti Maling “Overthinking”',cat:'Fashion',price:1000,img:'tote'},
  {id:3,name:'Sepatu Super',cat:'Fashion',price:1000,old:399000,img:'sneakers',tag:'limited'},
  {id:4,name:'Headset Jedag Jedug',cat:'Gadget',price:1000,img:'earbuds',tag:'baru'},
  {id:5,name:'Lampu Cahaya Ilahi',cat:'Gadget',price:1000,old:119000,img:'lamp'},
  {id:6,name:'Kipas Tornado',cat:'Gadget',price:1000,img:'fan'},
  {id:7,name:'Stiker Gen Z',cat:'Merch',price:1000,img:'stickers',tag:'murah!'},
  {id:8,name:'Kardus Teh Gelas',cat:'Merch',price:1000,img:'box'},
  {id:9,name:'Botol Minum We',cat:'Merch',price:1000,old:129000,img:'tumbler',tag:'best seller'},
  {id:10,name:'Kacamata Ala Bodyguard',cat:'Fashion',price:1000,img:'shades'}
];
const EMOJI = {hoodie:'🧥',tote:'👜',sneakers:'👟',earbuds:'🎧',lamp:'💡',fan:'🌀',stickers:'🏷️',box:'📦',tumbler:'🥤',shades:'🕶️'};
const CATS = ['Semua','Favorit','Fashion','Gadget','Merch'];
const FREE_SHIP = 3000; // minimal belanja gratis ongkir (ubah sesuai harga asli)
const MAX_QTY = 99;
const rp = n => 'Rp' + n.toLocaleString('id-ID');
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = {
  get:(k,d)=>{ try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch(e){ return d; } },
  set:(k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const byId = id => PRODUCTS.find(p => p.id == id);

/* Bersihkan keranjang tersimpan: hanya produk valid dengan jumlah 1–99 */
const savedCart = store.get('jajanin-cart', {}), cart = {};
for (const [id,q] of Object.entries(savedCart)) if (byId(id) && Number.isInteger(q) && q > 0) cart[id] = Math.min(q, MAX_QTY);
const state = { cat:'Semua', q:'', cart, wish:new Set((store.get('jajanin-wish', [])).filter(Number.isInteger)), promo:store.get('jajanin-promo', false) === true };

/* Gambar produk: pakai file di assets/ kalau ada, kalau tidak tampil emoji */
const imgTag = (key, alt, cls='') =>
  `<img ${cls?`class="${cls}" `:''}src="assets/products/${key}.svg" data-e="${EMOJI[key]||'🛍️'}" alt="${esc(alt)}" loading="lazy">`;
document.addEventListener('error', e => {
  const i = e.target;
  if (i.tagName !== 'IMG' || !i.dataset.e || i.dataset.fb) return;
  i.dataset.fb = 1;
  i.src = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text x='50' y='50' font-size='72' text-anchor='middle' dominant-baseline='central'>${i.dataset.e}</text></svg>`);
}, true);

function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}

function renderChips(){
  $('#chips').innerHTML = CATS.map(c =>
    `<button class="chip" aria-pressed="${c===state.cat}" data-cat="${c}">${c==='Favorit' ? `💖 Favorit (${state.wish.size})` : c}</button>`).join('');
}

function renderGrid(){
  const q = state.q.trim().toLowerCase();
  const list = PRODUCTS.filter(p =>
    (state.cat==='Semua' || (state.cat==='Favorit' ? state.wish.has(p.id) : p.cat===state.cat)) &&
    p.name.toLowerCase().includes(q));
  const empty = $('#empty');
  empty.hidden = list.length > 0;
  empty.textContent = state.cat==='Favorit' && !state.wish.size && !q
    ? 'Belum ada favorit. Tap 🤍 di produk buat nyimpen.'
    : 'Yah, barangnya belum ada 😭 coba kata kunci lain.';
  $('#grid').innerHTML = list.map(p => {
    const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0, on = state.wish.has(p.id);
    return `<article class="card">
      <div class="thumb">
        ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}
        <button class="wish" data-wish="${p.id}" aria-pressed="${on}" aria-label="${on?'Hapus dari':'Simpan ke'} favorit: ${esc(p.name)}">${on?'💖':'🤍'}</button>
        ${imgTag(p.img, p.name)}
      </div>
      <div class="info">
        <h3>${esc(p.name)}</h3>
        <div class="price">${rp(p.price)}${p.old?`<s>${rp(p.old)}</s><em>-${off}%</em>`:''}</div>
        <button class="btn btn-lime" data-add="${p.id}" aria-label="Tambah ${esc(p.name)} ke keranjang">+ Keranjang</button>
      </div>
    </article>`;
  }).join('');
}

function totals(){
  const sub = Object.entries(state.cart).reduce((s,[id,q]) => s + byId(id).price * q, 0);
  const disc = state.promo ? Math.round(sub * 0.15) : 0;
  return {sub, disc, total: sub - disc};
}

function renderCart(){
  const ids = Object.keys(state.cart);
  $('#cartCount').textContent = ids.reduce((n,id) => n + state.cart[id], 0);
  $('#cartItems').innerHTML = ids.length ? ids.map(id => {
    const p = byId(id), q = state.cart[id];
    return `<div class="item">${imgTag(p.img,'','ico')}
      <div><b>${esc(p.name)}</b><small>${rp(p.price)}</small></div>
      <div class="qty"><button data-dec="${id}" aria-label="Kurangi ${esc(p.name)}">−</button><b>${q}</b><button data-inc="${id}" aria-label="Tambah ${esc(p.name)}">+</button></div></div>`;
  }).join('') : `<div class="cart-empty"><div style="font-size:3rem">🫥</div><p>Keranjangmu masih kosong.<br>Yuk isi dulu!</p></div>`;
  if (!ids.length) state.promo = false;
  const t = totals();
  $('#subtotal').textContent = rp(t.sub);
  $('#discRow').hidden = !state.promo;
  $('#disc').textContent = '-' + rp(t.disc);
  $('#total').textContent = rp(t.total);
  const left = FREE_SHIP - t.total;
  $('#shipText').textContent = left > 0 ? `Belanja ${rp(left)} lagi, ongkir gratis 🚚` : 'Yey, ongkir kamu gratis! 🚚';
  $('#shipBar').classList.toggle('full', left <= 0);
  $('#shipBar i').style.width = Math.min(100, t.total / FREE_SHIP * 100) + '%';
  store.set('jajanin-cart', state.cart); store.set('jajanin-promo', state.promo);
}

function openCart(open){
  const d = $('#drawer');
  if (d.classList.contains('open') === open) return;
  d.classList.toggle('open', open);
  d.inert = !open;
  $('#overlay').hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
  (open ? $('#closeCart') : $('#cartBtn')).focus();
}

document.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  const d = t.dataset;
  if (d.cat) { state.cat = d.cat; renderChips(); renderGrid(); }
  if (d.add) { state.cart[d.add] = Math.min(MAX_QTY, (state.cart[d.add]||0) + 1); renderCart(); toast('Masuk keranjang! 🛒'); }
  if (d.inc) { state.cart[d.inc] = Math.min(MAX_QTY, state.cart[d.inc] + 1); renderCart(); }
  if (d.dec) { if (--state.cart[d.dec] <= 0) delete state.cart[d.dec]; renderCart(); }
  if (d.wish) {
    const id = +d.wish; state.wish.has(id) ? state.wish.delete(id) : state.wish.add(id);
    store.set('jajanin-wish', [...state.wish]);
    renderChips(); renderGrid();
    document.querySelector(`[data-wish="${id}"]`)?.focus();
  }
});

$('#search').addEventListener('input', e => { state.q = e.target.value; renderGrid(); });
$('#cartBtn').onclick = () => openCart(true);
$('#closeCart').onclick = $('#overlay').onclick = () => openCart(false);
document.addEventListener('keydown', e => { if (e.key === 'Escape') openCart(false); });

$('#applyPromo').onclick = () => {
  if ($('#promo').value.trim().toUpperCase() === 'GANIGANTENG') { state.promo = true; toast('Kode GANIGANTENG aktif, diskon 15%! 🎉'); }
  else { state.promo = false; toast('Kode tidak valid. Coba GANIGANTENG'); }
  renderCart();
};

$('#checkout').onclick = () => {
  if (!Object.keys(state.cart).length) return toast('Keranjang masih kosong, isi dulu ya');
  if (!user) { pendingCheckout = true; openCart(false); return openAuth('login'); }
  const {total} = totals();
  state.cart = {}; state.promo = false; $('#promo').value = ''; renderCart(); openCart(false);
  toast(`Pesanan ${rp(total)} berhasil! Makasih ya 💖`);
};

/* Efek emoji muncul saat klik (dilewati kalau pengguna minta animasi dikurangi) */
const HEARTS = ['💖','✨','🐾','💕'], calm = matchMedia('(prefers-reduced-motion: reduce)');
document.addEventListener('click', e => {
  if (calm.matches || !e.clientX && !e.clientY) return;
  const h = document.createElement('span');
  h.className = 'pop-heart';
  h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
  h.style.left = e.clientX + 'px'; h.style.top = e.clientY + 'px';
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 800);
});

/* ===== Login (DEMO: data hanya di browser ini, bukan autentikasi sungguhan) ===== */
const sha = async (salt, pw) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pw));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
};
const DEMO_USERS = {
  'admin@gmail.com': { name:'Admin', salt:'demo-admin-1', hash:'0c1857723390c5469a445ea7760b66deb11e236b5c65e08a6dbf29f2973c920e' }
};
let user = store.get('jajanin-session', null), tab = 'login', pendingCheckout = false;
if (user && (typeof user.name !== 'string' || !user.name || typeof user.email !== 'string')) user = null;
const dlg = $('#authDialog'), first = n => n.split(' ')[0];

function renderAuth(){
  const btn = $('#authBtn'); btn.textContent = '';
  if (user) {
    const a = document.createElement('span'); a.className = 'avatar'; a.textContent = user.name[0].toUpperCase();
    btn.append(a, first(user.name));
  } else btn.textContent = 'Masuk';
  $('#authForm').hidden = $('#authTabs').hidden = !!user;
  $('#authAccount').hidden = !user;
  if (user) $('#authAccount').dataset.i = user.name[0].toUpperCase();
  const sub = $('#authSub');
  if (user) { $('#authTitle').textContent = 'Halo, ' + first(user.name) + '!'; sub.textContent = user.email; }
  else {
    const reg = tab === 'register';
    $('#authTitle').textContent = reg ? 'Bikin akun' : 'Masuk';
    sub.textContent = pendingCheckout ? 'Masuk dulu ya buat lanjut checkout.' : '';
    $('#nameRow').hidden = !reg;
    $('#authSubmit').textContent = reg ? 'Daftar sekarang' : 'Masuk';
    $('#aPass').autocomplete = reg ? 'new-password' : 'current-password';
    document.querySelectorAll('#authTabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
  }
  sub.hidden = !sub.textContent;
}
function openAuth(t){
  tab = t || 'login'; $('#authErr').textContent = ''; renderAuth();
  if (!dlg.open) dlg.showModal();
  (user ? $('#logout') : tab === 'register' ? $('#aName') : $('#aEmail')).focus();
}
$('#authBtn').onclick = () => openAuth();
$('#authClose').onclick = () => dlg.close();
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
dlg.addEventListener('close', () => { if (!user) { pendingCheckout = false; renderAuth(); } });
$('#authTabs').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  tab = b.dataset.tab; $('#authErr').textContent = ''; renderAuth();
};
$('#aShow').onclick = () => {
  const p = $('#aPass'), show = p.type === 'password';
  p.type = show ? 'text' : 'password';
  $('#aShow').setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
};
$('#logout').onclick = () => {
  user = null; store.set('jajanin-session', null); renderAuth(); dlg.close(); toast('Sampai jumpa! 👋');
};
$('#authForm').addEventListener('submit', async e => {
  e.preventDefault();
  const reg = tab === 'register', name = $('#aName').value.trim(),
        email = $('#aEmail').value.trim().toLowerCase(), pw = $('#aPass').value,
        err = m => { $('#authErr').textContent = m; };
  if (reg && name.length < 2) return err('Nama minimal 2 huruf.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Format email belum benar.');
  if (pw.length < 6) return err('Kata sandi minimal 6 karakter.');
  if (!window.crypto?.subtle) return err('Login butuh https atau localhost. Buka lewat server lokal ya.');
  const btn = $('#authSubmit'); btn.disabled = true;
  try {
    const saved = store.get('jajanin-users', {}), users = { ...saved, ...DEMO_USERS };
    if (reg) {
      if (users[email]) return err('Email sudah terdaftar. Coba masuk.');
      const salt = crypto.getRandomValues(new Uint32Array(4)).join('-');
      saved[email] = { name, salt, hash: await sha(salt, pw) };
      store.set('jajanin-users', saved);
    } else {
      const u = users[email];
      if (!u) return err('Email belum terdaftar. Coba daftar dulu.');
      if (await sha(u.salt, pw) !== u.hash) return err('Kata sandi salah.');
    }
    user = { name: reg ? name : users[email].name, email };
    store.set('jajanin-session', user);
    $('#authForm').reset(); $('#authErr').textContent = '';
    renderAuth(); dlg.close();
    toast(`${reg ? 'Akun jadi' : 'Selamat datang'}, ${first(user.name)}! 🎉`);
    if (pendingCheckout) { pendingCheckout = false; openCart(true); }
  } finally { btn.disabled = false; }
});
renderAuth();

/* Hitung mundur sampai tengah malam */
function tick(){
  const now = new Date(), end = new Date(now); end.setHours(24,0,0,0);
  const s = Math.floor((end - now) / 1000), pad = n => String(n).padStart(2,'0');
  $('#countdown').textContent = `${pad(Math.floor(s/3600))}:${pad(Math.floor(s%3600/60))}:${pad(s%60)}`;
}
tick(); setInterval(tick, 1000);

/* Mode terang / gelap */
const themeBtn = $('#themeBtn'), themeMeta = document.querySelector('meta[name=theme-color]');
function applyTheme(t, save){
  document.documentElement.dataset.theme = t;
  themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
  themeBtn.setAttribute('aria-label', t === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
  themeMeta.content = t === 'dark' ? '#150d27' : '#241640';
  if (save) store.set('jajanin-theme', t);
}
themeBtn.onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true);
applyTheme(document.documentElement.dataset.theme);

renderChips(); renderGrid(); renderCart();