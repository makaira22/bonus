/* JADWAL — aplikasi bersama untuk semua cabang. Cukup ubah file ini sekali, semua cabang ikut terbarui. */
document.body.insertAdjacentHTML('afterbegin', `

<header class="top">
  <div class="wrap">
    <span class="logo" data-logo></span>
    <div class="ttl"><h1>JADWAL</h1><small id="branchName"></small></div>
    <div class="acts">
      <button class="icon-btn" id="hdrInstall" data-install aria-label="Pasang aplikasi" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/></svg></button>
      <button class="icon-btn" id="clBtn" aria-label="Daftar cleaner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/></svg></button>
      <button class="icon-btn" id="refreshBtn" aria-label="Muat ulang">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg></button>
    </div>
  </div>
</header>

<main class="wrap">
  <div class="blocked" id="blocked" hidden>
    <span class="logo" data-logo></span>
    <b id="blockedTitle">Link tidak dikenal</b>
    <p id="blockedMsg">Buka aplikasi ini lewat link cabang yang diberikan admin.</p>
    <button class="btn ghost" id="blockedRetry">Coba lagi</button>
  </div>
  <div id="mainContent">
  <div class="warn" id="cfgWarn" hidden>Alamat Apps Script belum diisi. Isi <b>API_URL</b> di app.js.</div>
  <div class="omzet">
    <small id="omLbl">Omzet hari ini</small>
    <b class="num big" id="omTotal">Rp 0</b>
    <div class="om-row">
      <div><small>Jadwal</small><b class="num" id="omCount">0</b></div>
      <div><small>Cash</small><b class="num" id="omCash">Rp 0</b></div>
      <div><small>Transfer</small><b class="num" id="omTf">Rp 0</b></div>
    </div>
  </div>
  <div class="install-card" id="installCard" hidden>
    <span class="logo" data-logo></span>
    <div class="txt"><b>Pasang JADWAL di HP</b><small>Buka langsung dari layar utama seperti aplikasi biasa.</small></div>
    <button class="btn-mini" data-install>Pasang</button>
    <button class="x-btn sm" id="installHide" aria-label="Tutup"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
  </div>
  <label class="search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    <input id="q" type="search" placeholder="Cari customer, alamat, cleaner, pesanan" autocomplete="off">
  </label>
  <div class="chips" id="chips"></div>
  <div class="chips months" id="months"></div>
  <div class="offline" id="offline" hidden></div>
  <div id="list"></div>
  </div>
</main>

<button class="fab" id="addBtn">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Jadwal baru
</button>

<!-- FORM -->
<div class="sheet-wrap" id="formSheet" hidden>
  <div class="backdrop" data-close></div>
  <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="formTitle">
    <div class="sheet-bar"><div class="grab"></div><button class="x-btn" data-close aria-label="Tutup"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
    <h2 id="formTitle">Jadwal baru</h2>

    <div class="sec">Waktu</div>
    <div class="grid2">
      <label class="field"><span>Tanggal pengerjaan <em class="req">*</em></span><input class="inp" type="date" id="fTanggal"></label>
      <label class="field"><span>Jam</span><input class="inp" type="time" id="fJam" step="900"></label>
    </div>

    <div class="sec">Nama cleaner <button type="button" id="fClManage">Atur daftar</button></div>
    <div class="pick" id="fCleaners"></div>

    <div class="sec">Customer</div>
    <label class="field"><span>Nama customer <em class="req">*</em></span><input class="inp" id="fCust" autocomplete="off" placeholder="Contoh: Bu Rina"></label>
    <label class="field"><span>No. telp</span><input class="inp num" id="fTelp" type="tel" inputmode="tel" autocomplete="off" placeholder="08xxxxxxxxxx"></label>
    <label class="field"><span>Alamat</span><textarea class="inp" id="fAlamat" rows="2" placeholder="Jalan, nomor rumah, patokan"></textarea></label>
    <div class="grid2">
      <label class="field"><span>KM</span><div class="suffix"><input class="inp num" id="fKm" inputmode="decimal" placeholder="0" autocomplete="off"><i>km</i></div></label>
      <label class="field"><span>Lembur</span><div class="suffix"><input class="inp num" id="fLembur" inputmode="decimal" placeholder="0" autocomplete="off"><i>jam</i></div></label>
    </div>

    <div class="sec">Pesanan</div>
    <label class="field"><span>Pesanan</span><input class="inp" id="fPesanan" list="pesananList" autocomplete="off" placeholder="Contoh: General 3 Jam 2 Cleaner"></label>
    <datalist id="pesananList"></datalist>
    <div class="field"><span>ADS</span>
      <div class="seg" id="fAds"><button type="button" data-v="Ads">Ads</button><button type="button" data-v="Org">Organik</button></div>
    </div>

    <div class="sec">Pembayaran</div>
    <div class="seg" id="fBayar"><button type="button" data-v="cash">Pem. Cash</button><button type="button" data-v="transfer">Pem. Transfer</button></div>
    <label class="field"><span><span id="fNominalLbl">Nominal cash</span> <em class="req">*</em></span><div class="prefix"><i>Rp</i><input class="inp num" id="fNominal" inputmode="numeric" placeholder="0" autocomplete="off"></div></label>
    <div class="field" id="fPayWrap"><span>Jenis payment</span>
      <div class="seg" id="fPay"><button type="button" data-v="BCA">BCA</button><button type="button" data-v="Mandiri">Mandiri</button></div>
    </div>

    <button class="btn primary" id="saveBtn">Simpan</button>
  </section>
</div>

<!-- DETAIL -->
<div class="sheet-wrap" id="detailSheet" hidden>
  <div class="backdrop" data-close></div>
  <section class="sheet" role="dialog" aria-modal="true">
    <div class="sheet-bar"><div class="grab"></div><button class="x-btn" data-close aria-label="Tutup"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
    <div id="detailBody"></div>
    <div class="row-btns">
      <button class="btn danger" id="delBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>Hapus</button>
      <button class="btn ghost" id="editBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>Edit</button>
    </div>
  </section>
</div>

<!-- CLEANER MANAGER -->
<div class="sheet-wrap" id="clSheet" hidden>
  <div class="backdrop" data-close></div>
  <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="clTitle">
    <div class="sheet-bar"><div class="grab"></div><button class="x-btn" data-close aria-label="Tutup"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
    <h2 id="clTitle">Daftar cleaner</h2>
    <p style="margin:0 0 14px;color:var(--muted)">Ubah, tambah, atau hapus nama. Daftar ini dipakai saat memilih cleaner di jadwal.</p>
    <div id="clList"></div>
    <div class="cl-row">
      <input class="inp" id="clNew" placeholder="Nama cleaner baru" autocomplete="off" enterkeyhint="done">
      <button class="btn ghost" id="clAdd" style="height:46px">Tambah</button>
    </div>
    <button class="btn primary" id="clSave">Simpan daftar</button>
  </section>
</div>

<!-- RENTANG TANGGAL -->
<div class="sheet-wrap" id="rangeSheet" hidden>
  <div class="backdrop" data-close></div>
  <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="rgTitle">
    <div class="sheet-bar"><div class="grab"></div><button class="x-btn" data-close aria-label="Tutup"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
    <h2 id="rgTitle">Pilih rentang tanggal</h2>
    <p style="margin:0 0 14px;color:var(--muted)">Jadwal dan omzet dihitung dari tanggal pengerjaan.</p>
    <div class="grid2">
      <label class="field"><span>Dari</span><input class="inp" type="date" id="rgFrom"></label>
      <label class="field"><span>Sampai</span><input class="inp" type="date" id="rgTo"></label>
    </div>
    <div class="pick" id="rgQuick">
      <button type="button" data-q="7">7 hari terakhir</button>
      <button type="button" data-q="30">30 hari terakhir</button>
      <button type="button" data-q="lastmonth">Bulan lalu</button>
      <button type="button" data-q="year">Tahun ini</button>
    </div>
    <button class="btn primary" id="rgApply">Tampilkan</button>
  </section>
</div>

<!-- INSTALL GUIDE -->
<div class="sheet-wrap" id="installSheet" hidden>
  <div class="backdrop" data-close></div>
  <section class="sheet" role="dialog" aria-modal="true">
    <div class="sheet-bar"><div class="grab"></div><button class="x-btn" data-close aria-label="Tutup"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
    <div class="inst-hero"><span class="logo" data-logo></span><div><b>Pasang JADWAL</b><small>Ikon akan muncul di layar utama HP.</small></div></div>
    <p id="instIntro" style="margin:0 0 6px;color:var(--muted)"></p>
    <ol class="steps" id="instSteps"></ol>
    <button class="btn primary" data-close>Mengerti</button>
  </section>
</div>

<div class="toast" id="toast" role="status"></div>

`);

/* =========================================================
   PENGATURAN
   ========================================================= */
const API_URL = 'https://script.google.com/macros/s/AKfycbxVe5aeL-OwA1xfBjCTzmQ_GLRKnOTO9GEe3TKyc8Wjqrkmilfd6DabOOARCCQd_PYQ5g/exec';   // URL /exec Apps Script JADWAL (satu untuk semua cabang)
const API_KEY = 'KUNCITERBATASKLINKLIN2525';            // sama dengan SECRET di Code.gs

/* ========================================================= */
const $ = s => document.querySelector(s);
// Kode cabang diambil dari nama folder di link, mis. .../jadwal/sbyw33/  ->  sbyw33
const CABANG = window.CABANG_KODE || (() => {
  const parts = location.pathname.split('/').filter(Boolean).filter(p => !/\.html?$/i.test(p));
  const last = parts[parts.length-1] || '';
  return last.toLowerCase() === 'jadwal' ? '' : decodeURIComponent(last);
})();
const CACHE_KEY = 'jadwal_cache_' + CABANG;
const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const state = { rows:[], cleaners:[], view:'today', range:{ from:'', to:'' }, q:'', loading:false, editing:null, current:null,
  form:{ cleaners:[], ads:'Org', bayar:'cash', payment:'BCA' }, clDraft:[] };
const X_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>';

/* ---------- utils ---------- */
const pad = n => String(n).padStart(2,'0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const toDate = s => { const [y,m,d] = String(s).split('-').map(Number); return new Date(y,(m||1)-1,d||1); };
const addDays = (s,n) => { const d = toDate(s); d.setDate(d.getDate()+n); return ymd(d); };
const today = () => ymd(new Date());
const rp = n => 'Rp ' + Math.round(Number(n)||0).toLocaleString('id-ID');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parseNum = s => Number(String(s||'').replace(/\./g,'').replace(',','.')) || 0;
const fmtNum = n => Number(n||0).toLocaleString('id-ID',{maximumFractionDigits:2});
const jamToInput = j => String(j||'').replace('.',':');
const menit = j => { const [h,m] = String(j||'').split('.').map(Number); return (h||0)*60+(m||0); };
const fmtDate = s => toDate(s).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
function dayLabel(s){
  const t = today();
  const base = `${HARI[toDate(s).getDay()]}, ${fmtDate(s)}`;
  if (s === t) return 'Hari ini · ' + base;
  if (s === addDays(t,1)) return 'Besok · ' + base;
  return base;
}
function waNumber(t){ let d = String(t||'').replace(/\D/g,''); if (d.startsWith('0')) d = '62'+d.slice(1); return d; }

let toastT;
function toast(msg, err){ const t=$('#toast'); t.textContent=msg; t.className='toast show'+(err?' err':''); clearTimeout(toastT); toastT=setTimeout(()=>t.className='toast'+(err?' err':''),2800); }
const configured = () => /^https:\/\/script\.google\.com\//.test(API_URL);

async function api(action, extra={}){
  if (!configured()) throw new Error('API_URL belum diisi di app.js');
  const res = await fetch(API_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify({ action, key:API_KEY, cabang:CABANG, ...extra }) });
  if (!res.ok) throw new Error('Server tidak merespons ('+res.status+')');
  const j = await res.json();
  if (!j.ok) { if (j.code === 'cabang') blockApp(j.error.replace(/^CABANG:\s*/,'')); throw new Error(j.error || 'Terjadi kesalahan'); }
  return j.data;
}
function setBranch(n){ if (!n) return; $('#branchName').textContent = n; document.title = 'JADWAL ' + n; }
function blockApp(msg){
  state.blocked = true;
  $('#blocked').hidden = false; $('#mainContent').hidden = true; $('#addBtn').hidden = true;
  $('#blockedMsg').textContent = msg;
  try { localStorage.removeItem(CACHE_KEY); } catch(_) {}
}
function apply(d){ state.blocked = false; $('#blocked').hidden = true; $('#mainContent').hidden = false; $('#addBtn').hidden = false;
  setBranch(d.cabang); state.rows = d.rows || []; state.cleaners = d.cleaners || []; try{ localStorage.setItem(CACHE_KEY, JSON.stringify(d)); }catch(_){} render(); }

/* ---------- load ---------- */
async function load(){
  if (state.loading) return;
  state.loading = true; $('#refreshBtn').classList.add('spin');
  try { apply(await api('list')); $('#offline').hidden = true; }
  catch(e){
    if (state.blocked) return;
    $('#offline').hidden = false;
    $('#offline').textContent = !navigator.onLine ? 'Sedang offline. Menampilkan data terakhir yang tersimpan di HP.' : 'Gagal memuat: ' + e.message;
    render();
  } finally { state.loading = false; $('#refreshBtn').classList.remove('spin'); }
}
$('#refreshBtn').addEventListener('click', load);
$('#blockedRetry').addEventListener('click', () => location.reload());
document.addEventListener('visibilitychange', () => { if (!document.hidden && CABANG && !state.blocked) load(); });
window.addEventListener('online', () => { if (CABANG && !state.blocked) load(); });

/* ---------- render ---------- */
const VIEWS = [
  ['today','Hari ini',      r => r.tanggal === today()],
  ['tomorrow','Besok',      r => r.tanggal === addDays(today(),1)],
  ['range','Rentang',       r => r.tanggal >= state.range.from && r.tanggal <= state.range.to],
  ['all','Semua',           () => true]
];
const monthKey = s => s.slice(0,7);
const monthName = (k, opt={month:'long', year:'numeric'}) => { const [y,m] = k.split('-').map(Number); return new Date(y,m-1,1).toLocaleDateString('id-ID',opt); };
const shortDate = s => toDate(s).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
function viewFilter(){
  if (state.view.startsWith('m:')) { const k = state.view.slice(2); return r => monthKey(r.tanggal) === k; }
  return (VIEWS.find(v => v[0]===state.view) || VIEWS[0])[2];
}
function periodLabel(){
  const v = state.view;
  if (v.startsWith('m:')) return 'bulan ' + monthName(v.slice(2));
  if (v === 'range') return state.range.from === state.range.to ? shortDate(state.range.from) : `${shortDate(state.range.from)} – ${shortDate(state.range.to)}`;
  return ({today:'hari ini', tomorrow:'besok', week:'7 hari ke depan', upcoming:'jadwal mendatang', all:'semua waktu'})[v] || '';
}
function filtered(){
  const q = state.q.trim().toLowerCase();
  let rows = state.rows.filter(viewFilter()).filter(r => !q ||
    [r.customer,r.alamat,r.pesanan,r.telp,r.cleaners.join(' ')].join(' ').toLowerCase().includes(q));
  rows.sort((a,b) => a.tanggal.localeCompare(b.tanggal) || menit(a.jam)-menit(b.jam));
  if (state.view === 'all') rows.reverse();
  return rows;
}
function render(skeleton){
  const rows = filtered();
  const cash = rows.reduce((a,r)=>a+(r.cash||0),0), tf = rows.reduce((a,r)=>a+(r.transfer||0),0);
  $('#omLbl').textContent = 'Omzet ' + periodLabel() + (state.q.trim() ? ` (pencarian “${state.q.trim()}”)` : '');
  $('#omTotal').textContent = rp(cash + tf);
  $('#omCount').textContent = rows.length;
  $('#omCash').textContent = rp(cash);
  $('#omTf').textContent = rp(tf);

  $('#chips').innerHTML = VIEWS.map(([k,l,f]) => {
    if (k === 'range') {
      const on = state.view === 'range';
      return `<button class="chip" data-v="range" aria-pressed="${on}">${on ? esc(periodLabel()) : 'Pilih rentang…'}</button>`;
    }
    return `<button class="chip" data-v="${k}" aria-pressed="${state.view===k}">${l}<span class="n">${state.rows.filter(f).length}</span></button>`;
  }).join('');

  const months = [...new Set([monthKey(today()), ...state.rows.map(r=>monthKey(r.tanggal)).filter(Boolean)])].sort().reverse();
  $('#months').innerHTML = '<span class="lbl">Bulan</span>' + months.map(k =>
    `<button class="chip" data-v="m:${k}" aria-pressed="${state.view==='m:'+k}">${esc(monthName(k,{month:'short',year:'numeric'}))}<span class="n">${state.rows.filter(r=>monthKey(r.tanggal)===k).length}</span></button>`).join('');

  const list = $('#list');
  if (skeleton) { list.innerHTML = '<div class="day">'+'<div class="sk"></div>'.repeat(4)+'</div>'; return; }
  if (!rows.length) {
    list.innerHTML = state.rows.length
      ? `<div class="empty"><b>Tidak ada jadwal ${esc(periodLabel())}</b>Coba pilih waktu lain atau ubah pencarian.</div>`
      : `<div class="empty"><b>Belum ada jadwal</b>Ketuk “Jadwal baru” untuk membuat jadwal pertama.</div>`;
    return;
  }
  let html = '', cur = null, no = 0;
  for (const r of rows) {
    if (r.tanggal !== cur) {
      if (cur) html += '</div>';
      cur = r.tanggal; no = 0;
      const n = rows.filter(x=>x.tanggal===cur).length;
      html += `<div class="day"><div class="day-h"><b>${esc(dayLabel(cur))}</b><span>${n} jadwal</span></div>`;
    }
    no++;
    const nominal = r.transfer || r.cash;
    const payTxt = r.transfer ? `Transfer ${esc(r.payment)}` : (r.cash ? 'Cash' : '');
    html += `<button class="job" data-id="${esc(r.id)}">
      <span class="time"><b class="num">${esc(r.jam||'--.--')}</b><small>No. ${no}</small></span>
      <span class="mid">
        <span class="cust" style="display:block">${esc(r.customer||'(tanpa nama)')}</span>
        ${r.pesanan?`<span class="ord" style="display:block">${esc(r.pesanan)}</span>`:''}
        ${r.alamat?`<span class="addr" style="display:block">${esc(r.alamat)}${r.km?`, ${fmtNum(r.km)} km`:''}</span>`:''}
        ${nominal?`<span class="paytxt num" style="display:block">${rp(nominal)} <small>${payTxt}</small></span>`:''}
        <span class="tags">
          ${r.cleaners.length ? r.cleaners.map(c=>`<span class="tag cl">${esc(c)}</span>`).join('') : '<span class="tag none">Belum ada cleaner</span>'}
          <span class="tag ${r.ads==='Ads'?'ads':'org'}">${r.ads==='Ads'?'Ads':'Organik'}</span>
          ${r.lembur?`<span class="tag">Lembur ${fmtNum(r.lembur)} jam</span>`:''}
        </span>
      </span>
    </button>`;
  }
  list.innerHTML = html + '</div>';
}
function pickView(e){
  const b = e.target.closest('.chip'); if (!b) return;
  if (b.dataset.v === 'range') return openRange();
  state.view = b.dataset.v; render();
}
$('#chips').addEventListener('click', pickView);
$('#months').addEventListener('click', pickView);

/* ---------- rentang tanggal ---------- */
function openRange(){
  const t = today();
  $('#rgFrom').value = state.range.from || t.slice(0,8) + '01';
  $('#rgTo').value = state.range.to || t;
  openLayer('#rangeSheet');
}
$('#rgQuick').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const t = today(), d = new Date();
  let f, to = t;
  if (b.dataset.q === '7') f = addDays(t,-6);
  else if (b.dataset.q === '30') f = addDays(t,-29);
  else if (b.dataset.q === 'year') { f = `${d.getFullYear()}-01-01`; to = `${d.getFullYear()}-12-31`; }
  else { const a = new Date(d.getFullYear(), d.getMonth()-1, 1), z = new Date(d.getFullYear(), d.getMonth(), 0); f = ymd(a); to = ymd(z); }
  $('#rgFrom').value = f; $('#rgTo').value = to;
});
$('#rgApply').addEventListener('click', () => {
  let f = $('#rgFrom').value, t = $('#rgTo').value;
  if (!f || !t) return toast('Pilih tanggal dari dan sampai', true);
  if (f > t) [f, t] = [t, f];
  state.range = { from:f, to:t }; state.view = 'range';
  closeLayer(); render();
});
$('#q').addEventListener('input', e => { state.q = e.target.value; render(); });
$('#list').addEventListener('click', e => { const b=e.target.closest('.job'); if(b) openDetail(b.dataset.id); });

/* ---------- sheets (tombol back HP ikut menutup) ---------- */
const stack = [];
function show(id){ const el=$(id); el.hidden=false; requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('open'))); }
function hide(id){ const el=$(id); el.classList.remove('open'); setTimeout(()=>{ if(!el.classList.contains('open')) el.hidden=true; },280); }
function openLayer(id){ show(id); stack.push(id); history.pushState({layer:id},''); }
function swapLayer(id){ const prev=stack.pop(); if(prev) hide(prev); show(id); stack.push(id); history.replaceState({layer:id},''); }
function closeLayer(){ if (stack.length) history.back(); }
window.addEventListener('popstate', () => { const id = stack.pop(); if (id) hide(id); });
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeLayer));

function confirmBox(title, msg, ok){
  return new Promise(res => {
    const el = document.createElement('div'); el.className='confirm';
    el.innerHTML = `<div role="alertdialog"><button class="x-btn" data-a="0" aria-label="Tutup">${X_SVG}</button><h3>${esc(title)}</h3><p>${esc(msg)}</p>
      <div class="row-btns" style="margin:0"><button class="btn ghost" data-a="0">Batal</button><button class="btn danger" data-a="1">${esc(ok)}</button></div></div>`;
    el.addEventListener('click', e => { const b=e.target.closest('[data-a]'); if(!b && e.target!==el) return; el.remove(); res(b?.dataset.a==='1'); });
    document.body.appendChild(el);
  });
}

/* ---------- detail ---------- */
function openDetail(id){
  const r = state.rows.find(x=>x.id===id); if(!r) return;
  state.current = r;
  const tel = String(r.telp||'').replace(/[^\d+]/g,'');
  const maps = r.alamat ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(r.alamat) : '';
  const nominal = r.transfer || r.cash;
  $('#detailBody').innerHTML = `
    <div style="color:var(--muted);font-size:13.5px;font-weight:600">${esc(HARI[toDate(r.tanggal).getDay()])}, ${esc(fmtDate(r.tanggal))}</div>
    <h2 style="margin:6px 0 4px"><span class="d-time num">${esc(r.jam||'--.--')}</span> ${esc(r.customer||'(tanpa nama)')}</h2>
    <div class="contact">
      <a class="${tel?'':'off'}" href="tel:${esc(tel)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>Telepon</a>
      <a class="${tel?'':'off'}" href="https://wa.me/${waNumber(r.telp)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3z"/></svg>WhatsApp</a>
      <a class="${maps?'':'off'}" href="${maps}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>Peta</a>
    </div>
    <dl class="dl">
      <div><dt>Nama cleaner</dt><dd>${r.cleaners.length?esc(r.cleaners.join(', ')):'—'}</dd></div>
      <div><dt>No. telp</dt><dd class="num">${esc(r.telp||'—')}</dd></div>
      <div><dt>Pesanan</dt><dd>${esc(r.pesanan||'—')}</dd></div>
      <div><dt>Lembur</dt><dd>${r.lembur?fmtNum(r.lembur)+' jam':'—'}</dd></div>
      <div><dt>ADS</dt><dd>${r.ads==='Ads'?'Ads':'Organik'}</dd></div>
      <div><dt>Alamat</dt><dd>${esc(r.alamat||'—')}</dd></div>
      <div><dt>KM</dt><dd>${r.km?fmtNum(r.km)+' km':'—'}</dd></div>
      <div><dt>Pembayaran</dt><dd class="num">${nominal ? (r.transfer?`Transfer ${esc(r.payment)}, `:'Cash, ')+rp(nominal) : '—'}</dd></div>
    </dl>`;
  openLayer('#detailSheet');
}
$('#editBtn').addEventListener('click', () => openForm(state.current, true));
$('#delBtn').addEventListener('click', async () => {
  const r = state.current;
  if (!await confirmBox('Hapus jadwal ini?', `Jadwal ${r.customer||''} pada ${fmtDate(r.tanggal)} jam ${r.jam} akan dihapus dari spreadsheet.`, 'Hapus')) return;
  const btn = $('#delBtn'); btn.disabled = true;
  try { apply(await api('delete', { id:r.id })); closeLayer(); toast('Jadwal dihapus'); }
  catch(e){ toast(e.message, true); } finally { btn.disabled = false; }
});

/* ---------- form ---------- */
function setSeg(id, v){ document.querySelectorAll(id+' button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v===v)); }
function renderPick(){
  const all = [...new Set([...state.cleaners, ...state.form.cleaners])];
  $('#fCleaners').innerHTML = all.map(n =>
    `<button type="button" data-n="${esc(n)}" aria-pressed="${state.form.cleaners.includes(n)}">${CHECK}${esc(n)}</button>`).join('')
    + `<button type="button" class="add" id="fClAdd">+ Tambah nama</button>`;
}
$('#fCleaners').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'fClAdd') return openCleaners();
  const n = b.dataset.n, sel = state.form.cleaners;
  state.form.cleaners = sel.includes(n) ? sel.filter(x=>x!==n) : [...sel, n];
  b.setAttribute('aria-pressed', state.form.cleaners.includes(n));
});
function updateBayar(){
  const t = state.form.bayar === 'transfer';
  setSeg('#fBayar', state.form.bayar);
  $('#fNominalLbl').textContent = t ? 'Nominal transfer' : 'Nominal cash';
  $('#fPayWrap').hidden = !t;
  setSeg('#fPay', state.form.payment);
}
$('#fAds').addEventListener('click', e => { const b=e.target.closest('button'); if(!b) return; state.form.ads=b.dataset.v; setSeg('#fAds', b.dataset.v); });
$('#fBayar').addEventListener('click', e => { const b=e.target.closest('button'); if(!b) return; state.form.bayar=b.dataset.v; updateBayar(); });
$('#fPay').addEventListener('click', e => { const b=e.target.closest('button'); if(!b) return; state.form.payment=b.dataset.v; setSeg('#fPay', b.dataset.v); });
$('#fNominal').addEventListener('input', e => { const d=e.target.value.replace(/\D/g,''); e.target.value = d ? Number(d).toLocaleString('id-ID') : ''; });
['#fKm','#fLembur'].forEach(id => $(id).addEventListener('input', e => { e.target.value = e.target.value.replace(/[^\d.,]/g,''); }));

function openForm(r, fromDetail){
  state.editing = r || null;
  $('#formTitle').textContent = r ? 'Edit jadwal' : 'Jadwal baru';
  $('#fTanggal').value = r ? r.tanggal : today();
  $('#fJam').value = r ? jamToInput(r.jam) : '08:00';
  $('#fCust').value = r ? r.customer : '';
  $('#fTelp').value = r ? r.telp : '';
  $('#fAlamat').value = r ? r.alamat : '';
  $('#fKm').value = r && r.km ? fmtNum(r.km) : '';
  $('#fLembur').value = r && r.lembur ? fmtNum(r.lembur) : '';
  $('#fPesanan').value = r ? r.pesanan : '';
  const nominal = r ? (r.transfer || r.cash) : 0;
  $('#fNominal').value = nominal ? Math.round(nominal).toLocaleString('id-ID') : '';
  state.form = {
    cleaners: r ? [...r.cleaners] : [],
    ads: r ? (r.ads==='Ads'?'Ads':'Org') : 'Org',
    bayar: r && r.transfer ? 'transfer' : 'cash',
    payment: r && r.payment==='Mandiri' ? 'Mandiri' : 'BCA'
  };
  setSeg('#fAds', state.form.ads); updateBayar(); renderPick();
  $('#pesananList').innerHTML = [...new Set(state.rows.map(x=>x.pesanan).filter(Boolean))].slice(0,30).map(p=>`<option value="${esc(p)}">`).join('');
  $('#saveBtn').textContent = r ? 'Simpan perubahan' : 'Simpan jadwal';
  fromDetail ? swapLayer('#formSheet') : openLayer('#formSheet');
}
$('#addBtn').addEventListener('click', () => openForm(null));
$('#fClManage').addEventListener('click', openCleaners);

$('#saveBtn').addEventListener('click', async () => {
  if (!$('#fTanggal').value) { $('#fTanggal').focus(); return toast('Tanggal pengerjaan wajib diisi', true); }
  if (!$('#fCust').value.trim()) { $('#fCust').focus(); return toast('Nama customer wajib diisi', true); }
  if (!(parseNum($('#fNominal').value) > 0)) { $('#fNominal').focus(); return toast('Nominal pembayaran wajib diisi', true); }
  const data = {
    tanggal: $('#fTanggal').value,
    jam: $('#fJam').value.replace(':','.'),
    cleaners: state.form.cleaners,
    telp: $('#fTelp').value.trim(),
    lembur: parseNum($('#fLembur').value),
    pesanan: $('#fPesanan').value.trim(),
    ads: state.form.ads,
    customer: $('#fCust').value.trim(),
    alamat: $('#fAlamat').value.trim(),
    km: parseNum($('#fKm').value),
    bayar: state.form.bayar,
    nominal: parseNum($('#fNominal').value),
    payment: state.form.payment
  };
  const btn = $('#saveBtn'), label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Menyimpan…';
  try {
    const e = state.editing;
    apply(e ? await api('update', { id:e.id, data }) : await api('add', { data }));
    closeLayer(); toast(e ? 'Perubahan disimpan' : 'Jadwal tersimpan');
  } catch(err){ toast(navigator.onLine ? err.message : 'Tidak ada internet. Coba lagi saat online.', true); }
  finally { btn.disabled = false; btn.textContent = label; }
});

/* ---------- cleaner manager ---------- */
function openCleaners(){
  state.clDraft = [...state.cleaners];
  renderClList();
  $('#clNew').value = '';
  openLayer('#clSheet');
}
function renderClList(){
  $('#clList').innerHTML = state.clDraft.length
    ? state.clDraft.map((n,i) => `<div class="cl-row"><input class="inp" data-i="${i}" value="${esc(n)}" autocomplete="off"><button class="x-btn" data-del="${i}" aria-label="Hapus ${esc(n)}">${X_SVG}</button></div>`).join('')
    : '<div class="hint" style="margin-bottom:10px">Belum ada nama cleaner. Tambahkan di bawah.</div>';
}
$('#clList').addEventListener('input', e => { const i=e.target.dataset.i; if(i!=null) state.clDraft[i] = e.target.value; });
$('#clList').addEventListener('click', e => { const b=e.target.closest('[data-del]'); if(!b) return; state.clDraft.splice(Number(b.dataset.del),1); renderClList(); });
function addCl(){ const v=$('#clNew').value.trim(); if(!v) return; state.clDraft.push(v); $('#clNew').value=''; renderClList(); $('#clNew').focus(); }
$('#clAdd').addEventListener('click', addCl);
$('#clNew').addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); addCl(); } });
$('#clSave').addEventListener('click', async () => {
  const pending = $('#clNew').value.trim(); if (pending) state.clDraft.push(pending);
  const names = state.clDraft.map(s=>s.trim()).filter(Boolean);
  const btn = $('#clSave'); btn.disabled = true; btn.textContent = 'Menyimpan…';
  try {
    const old = state.cleaners;
    apply(await api('setCleaners', { names }));
    // ikut ganti nama yang sedang dipilih di form kalau namanya diubah
    state.form.cleaners = state.form.cleaners.map(n => { const i = old.indexOf(n); return i>-1 && names[i] && !names.includes(n) ? names[i] : n; });
    renderPick(); closeLayer(); toast('Daftar cleaner disimpan');
  } catch(e){ toast(e.message, true); }
  finally { btn.disabled = false; btn.textContent = 'Simpan daftar'; }
});
$('#clBtn').addEventListener('click', openCleaners);

/* ---------- logo ---------- */
let logoN = 0;
function logoSVG(){
  const i = ++logoN;
  return `<svg viewBox="0 0 512 512" aria-hidden="true"><defs>
    <linearGradient id="jb${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E6F6EC"/></linearGradient>
    <linearGradient id="jk${i}" gradientUnits="userSpaceOnUse" x1="140" y1="100" x2="380" y2="420"><stop offset="0" stop-color="#2BC46A"/><stop offset="1" stop-color="#0A6B34"/></linearGradient></defs>
    <rect width="512" height="512" fill="url(#jb${i})"/>
    <g fill="none" stroke="url(#jk${i})" stroke-width="74" stroke-linecap="round" stroke-linejoin="round"><path d="M170 128V384"/><path d="M338 128 190 268"/><path d="M238 222 346 384"/></g>
    <path d="M392 92q6 34 40 40q-34 6-40 40q-6-34-40-40q34-6 40-40z" fill="#F5C518"/></svg>`;
}
document.querySelectorAll('[data-logo]').forEach(el => el.innerHTML = logoSVG());

/* ---------- install (klik = langsung terpasang di Android/Chrome) ---------- */
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const inAppBrowser = /FBAN|FBAV|Instagram|Line\/|WhatsApp|; wv\)|TikTok/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const hideKey = 'jadwal_install_hide';
function installDismissed(){ try{ return Date.now() - Number(localStorage.getItem(hideKey)||0) < 3*864e5; }catch(_){ return false; } }
function updateInstallUI(){
  const show = !isStandalone();
  $('#hdrInstall').hidden = !show;
  $('#installCard').hidden = !show || installDismissed() || !(window.__bip || isIOS);
}
document.addEventListener('bip-ready', updateInstallUI);
function waitForPrompt(ms){
  if (window.__bip) return Promise.resolve(window.__bip);
  return new Promise(res => { const t = setTimeout(() => res(window.__bip), ms);
    document.addEventListener('bip-ready', () => { clearTimeout(t); res(window.__bip); }, { once:true }); });
}
async function doInstall(e){
  const btn = e && e.currentTarget;
  if (isStandalone()) return toast('JADWAL sudah terpasang');
  if (isIOS) return showGuide('ios');
  let bip = window.__bip;
  if (!bip) { btn && btn.classList.add('spin'); bip = await waitForPrompt(2500); btn && btn.classList.remove('spin'); }
  if (bip) {
    window.__bip = null; bip.prompt();
    const { outcome } = await bip.userChoice;
    toast(outcome === 'accepted' ? 'Memasang JADWAL…' : 'Pemasangan dibatalkan');
    updateInstallUI(); return;
  }
  showGuide('android');
}
async function diagnose(){
  const res = [];
  if (inAppBrowser) res.push('Halaman dibuka di dalam aplikasi lain (WhatsApp/Instagram/dll). Buka link ini di <b>Google Chrome</b>.');
  if (!/Chrome|CriOS|SamsungBrowser|Edg/i.test(navigator.userAgent) || /Firefox|FxiOS|OPR|Opera Mini/i.test(navigator.userAgent))
    res.push('Browser ini tidak mendukung pasang otomatis. Gunakan <b>Google Chrome</b>.');
  try { if (!(await navigator.serviceWorker?.getRegistration())) res.push('File <b>sw.js</b> tidak ditemukan di folder jadwal di GitHub.'); } catch(_) {}
  try {
    const r = await fetch('manifest.json', { cache:'no-store' }); if (!r.ok) throw 0;
    for (const ic of (await r.json()).icons || []) {
      if (!(await fetch(ic.src, { cache:'no-store' })).ok) res.push(`Ikon <b>${esc(ic.src)}</b> tidak ditemukan di folder jadwal di GitHub.`);
    }
  } catch(_) { res.push('File <b>manifest.json</b> tidak ditemukan di folder cabang ini di GitHub.'); }
  return res;
}
async function showGuide(kind){
  const share = '<svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:-3px" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3m0 0L8 7m4-4 4 4M6 11H5v10h14V11h-1"/></svg>';
  let intro, steps;
  if (kind === 'ios') {
    intro = 'iPhone tidak mengizinkan aplikasi web memasang dirinya otomatis. Ini aturan Apple, jadi caranya lewat Safari:';
    steps = ['Pastikan halaman ini dibuka di <b>Safari</b>.', `Ketuk tombol <b>Bagikan</b> ${share} di bawah layar.`, 'Pilih <b>Tambah ke Layar Utama</b>, lalu ketuk <b>Tambah</b>.'];
  } else {
    const issues = await diagnose();
    intro = issues.length ? 'Chrome belum bisa memasang otomatis karena:'
      : 'Chrome belum memberi izin pasang otomatis. Biasanya karena JADWAL cabang ini <b>sudah pernah terpasang</b> (cek layar utama), atau jendela pasang baru saja ditolak. Muat ulang halaman lalu ketuk Pasang lagi, atau pasang manual:';
    steps = issues.length ? issues.concat(['Setelah diperbaiki, muat ulang halaman lalu ketuk <b>Pasang</b> lagi.'])
      : ['Ketuk menu <b>⋮</b> di pojok kanan atas Chrome.', 'Pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.'];
  }
  $('#instIntro').innerHTML = intro;
  $('#instSteps').innerHTML = steps.map(t => `<li><span>${t}</span></li>`).join('');
  openLayer('#installSheet');
}
document.querySelectorAll('[data-install]').forEach(b => b.addEventListener('click', doInstall));
$('#installHide').addEventListener('click', () => { try{ localStorage.setItem(hideKey, Date.now()); }catch(_){} $('#installCard').hidden = true; });
window.addEventListener('appinstalled', () => { window.__bip = null; updateInstallUI(); toast('JADWAL terpasang di HP'); });

/* ---------- start ---------- */
$('#cfgWarn').hidden = configured();
updateInstallUI();
(() => {
  let c = null; try { c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch(_) {}
  if (!CABANG) { blockApp('Buka aplikasi ini lewat link cabang yang diberikan admin.'); return; }
  if (c) { setBranch(c.cabang); state.rows = c.rows || []; state.cleaners = c.cleaners || []; render(); } else render(true);
  load();
})();
