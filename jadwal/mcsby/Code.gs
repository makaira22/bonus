/**
 * MC — Jadwal Order Mesin Cuci SURABAYA
 * Tempel di: Spreadsheet "Jadwal KlinKlin Surabaya 2026" > Ekstensi > Apps Script > Code.gs
 * (Script ini terpisah dari script JADWAL di spreadsheet Gianyar.)
 *
 * Data masuk ke tab "MESIN CUCI APP" (dibuat otomatis). Tab lain, termasuk "Mesin Cuci", TIDAK disentuh.
 *   A No. Pemesanan | B Tanggal | C Waktu | D Nama | E No. WhatsApp | F Alamat | G Pesanan | H Merk |
 *   I Daya Listrik (Watt) | J Email | K Pembayaran | L Total | M Cleaner | N ID (disembunyikan, jangan dihapus)
 * Daftar cleaner MC (nama + No. WA) ada di tab "CLEANER MC". Tab "CLEANER" milik JADWAL tidak disentuh.
 */

// ⚠️ Harus SAMA PERSIS dengan API_KEY di mcsby/index.html
const SECRET = 'KUNCITERBATASKLINKLIN2525';
const CABANG = 'Surabaya';

const SHEET = 'MESIN CUCI APP';
const HEADERS = ['No. Pemesanan', 'Tanggal', 'Waktu', 'Nama', 'No. WhatsApp', 'Alamat', 'Pesanan', 'Merk',
  'Daya Listrik (Watt)', 'Email', 'Pembayaran', 'Total', 'Cleaner', 'ID'];
const NCOL = 14;
const CLEANER_SHEET = 'CLEANER MC';
const RP = '"Rp"#,##0';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function doGet() {
  return json_({ ok: true, message: 'API MC Surabaya aktif. Gunakan POST dari aplikasi.' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.key !== SECRET) throw new Error('Kunci API tidak cocok.');
    const sh = getSheet_();
    if (req.action !== 'list') lock.waitLock(25000);
    let rows, saved = null;
    switch (req.action) {
      case 'list': break;
      case 'add': {
        rows = readAll_(sh);
        saved = clean_(req.data, Utilities.getUuid(), '');
        saved.no = nextNo_(rows, saved.tanggal);
        rows.push(saved); writeAll_(sh, rows);
        break;
      }
      case 'update': {
        rows = readAll_(sh);
        const i = rows.findIndex(function (r) { return r.id === req.id; });
        if (i < 0) throw new Error('Order tidak ditemukan. Muat ulang data.');
        saved = clean_(req.data, req.id, rows[i].no);
        rows[i] = saved; writeAll_(sh, rows);
        break;
      }
      case 'setCleaners':
        setCleaners_(req.list || []);
        break;
      case 'delete':
        rows = readAll_(sh);
        if (!rows.some(function (r) { return r.id === req.id; })) throw new Error('Order tidak ditemukan. Muat ulang data.');
        writeAll_(sh, rows.filter(function (r) { return r.id !== req.id; }));
        break;
      default: throw new Error('Aksi tidak dikenal: ' + req.action);
    }
    return json_({ ok: true, data: { rows: readAll_(sh), cleaners: getCleaners_(), cabang: CABANG, savedId: saved ? saved.id : '' } });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function readAll_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  const tz = Session.getScriptTimeZone();
  return sh.getRange(2, 1, last - 1, NCOL).getValues()
    .filter(function (r) { return UUID.test(String(r[13]).trim()); })
    .map(function (r) {
      return {
        id: String(r[13]).trim(),
        cleaners: String(r[12] || '').split(',').map(function (x) { return x.trim(); }).filter(String),
        no: String(r[0] || ''),
        tanggal: r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : String(r[1] || ''),
        waktu: r[2] instanceof Date ? Utilities.formatDate(r[2], tz, 'HH.mm') : normJam_(r[2]),
        nama: String(r[3] || ''),
        wa: String(r[4] || ''),
        alamat: String(r[5] || ''),
        pesanan: String(r[6] || ''),
        merk: String(r[7] || ''),
        daya: Number(r[8]) || 0,
        email: String(r[9] || ''),
        bayar: String(r[10] || ''),
        total: Number(r[11]) || 0
      };
    });
}

function clean_(d, id, no) {
  if (!d || !d.tanggal) throw new Error('Tanggal wajib diisi.');
  if (!String(d.nama || '').trim()) throw new Error('Nama wajib diisi.');
  if (!(Number(d.total) > 0)) throw new Error('Total wajib diisi.');
  return {
    id: id, no: no,
    tanggal: String(d.tanggal), waktu: normJam_(d.waktu),
    nama: String(d.nama).trim(), wa: String(d.wa || '').trim(),
    alamat: String(d.alamat || '').trim(), pesanan: String(d.pesanan || '').trim(),
    merk: String(d.merk || '').trim(), daya: Number(d.daya) || 0,
    email: String(d.email || '').trim(), bayar: d.bayar === 'Cash' ? 'Cash' : 'Transfer',
    total: Math.round(Number(d.total) || 0),
    cleaners: (d.cleaners || []).map(String).map(function (x) { return x.trim(); }).filter(String)
  };
}

/** No. Pemesanan = tanggal (ddmmyyyy). Order kedua dst. di tanggal yang sama: ddmmyyyy-2, -3, ... */
function nextNo_(rows, tanggal) {
  const p = tanggal.split('-');
  const base = p[2] + p[1] + p[0];
  const used = rows.map(function (r) { return r.no; });
  if (used.indexOf(base) < 0) return base;
  let n = 2;
  while (used.indexOf(base + '-' + n) >= 0) n++;
  return base + '-' + n;
}

function writeAll_(sh, rows) {
  rows.sort(function (a, b) { return a.tanggal.localeCompare(b.tanggal) || menit_(a.waktu) - menit_(b.waktu); });
  const last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, 1, last - 1, NCOL).clear();
  if (!rows.length) return;
  const fmt = ['@', 'd mmmm yyyy', '@', '@', '@', '@', '@', '@', '0', '@', '@', RP, '@', '@'];
  const rg = sh.getRange(2, 1, rows.length, NCOL);
  rg.setNumberFormats(rows.map(function () { return fmt; }));
  rg.setValues(rows.map(function (r) {
    return [r.no, parseDate_(r.tanggal), r.waktu, r.nama, r.wa, r.alamat, r.pesanan, r.merk,
      r.daya || '', r.email, r.bayar, r.total, r.cleaners.join(', '), r.id];
  }));
  rg.setVerticalAlignment('middle').setWrap(true).setBorder(true, true, true, true, true, true);
  sh.getRange(2, 1, rows.length, 3).setHorizontalAlignment('center');
  SpreadsheetApp.flush();
}

function isAppSheet_(sh) {
  return String(sh.getRange(1, 1).getValue()).trim() === 'No. Pemesanan' && String(sh.getRange(1, 14).getValue()).trim() === 'ID';
}

/** Tab versi pertama (ID di kolom M, belum ada kolom Cleaner) -> sisipkan kolom Cleaner sebelum ID */
function upgradeSheet_(sh) {
  if (String(sh.getRange(1, 1).getValue()).trim() === 'No. Pemesanan' && String(sh.getRange(1, 13).getValue()).trim() === 'ID') {
    sh.insertColumnBefore(13);
    sh.getRange(1, 13).setValue('Cleaner').setBackground('#ffff00').setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true, true, true, true, true, true);
    sh.showColumns(13); sh.setColumnWidth(13, 150);
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (sh) {
    upgradeSheet_(sh);
    if (isAppSheet_(sh)) return sh;
    if (sh.getLastRow() > 0) throw new Error('Tab "' + SHEET + '" sudah berisi data lain. Ganti nama tab itu dulu.');
  } else {
    sh = ss.insertSheet(SHEET, 0);
  }
  sh.getRange(1, 1, 1, NCOL).setValues([HEADERS]);
  sh.getRange(1, 1, 1, 13).setBackground('#ffff00').setFontWeight('bold').setWrap(true)
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true, true, true, true, true, true);
  sh.setRowHeight(1, 40);
  sh.setFrozenRows(1);
  [110, 130, 60, 150, 120, 260, 220, 110, 90, 160, 90, 110, 150].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.hideColumns(14);
  return sh;
}

/* ---------- cleaner MC: A Nama | B No. WA ---------- */
function getCleanerSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CLEANER_SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(CLEANER_SHEET);
  sh.getRange(1, 1, 1, 2).setValues([['NAMA CLEANER', 'NO. WA']]).setFontWeight('bold').setBackground('#ffff00');
  sh.getRange('B:B').setNumberFormat('@');
  sh.setColumnWidth(1, 180); sh.setColumnWidth(2, 160); sh.setFrozenRows(1);
  return sh;
}
function getCleaners_() {
  const sh = getCleanerSheet_(), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 2).getValues()
    .map(function (r) { return { nama: String(r[0]).trim(), wa: String(r[1]).trim() }; })
    .filter(function (c) { return c.nama; });
}
function setCleaners_(list) {
  const seen = {};
  const rows = list.map(function (c) { return [String(c.nama || '').trim(), String(c.wa || '').trim()]; })
    .filter(function (r) { if (!r[0] || seen[r[0].toLowerCase()]) return false; seen[r[0].toLowerCase()] = 1; return true; });
  const sh = getCleanerSheet_(), last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, 1, last - 1, 2).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, 2).setNumberFormat('@').setValues(rows);
}

function normJam_(v) {
  if (typeof v === 'number') {
    if (v < 1) { const m = Math.round(v * 1440); return pad_(Math.floor(m / 60)) + '.' + pad_(m % 60); }
    const h = Math.floor(v); return pad_(h) + '.' + pad_(Math.round((v - h) * 100));
  }
  const m = String(v || '').match(/(\d{1,2})\D?(\d{2})?/);
  return m ? pad_(Number(m[1])) + '.' + pad_(Number(m[2] || 0)) : '';
}
function menit_(j) { const p = String(j || '').split('.'); return (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0); }
function pad_(n) { return (n < 10 ? '0' : '') + n; }
function parseDate_(s) { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Jalankan SEKALI dari editor untuk memberi izin & membuat tab MESIN CUCI APP */
function setup() {
  getSheet_();
  getCleanerSheet_();
  Logger.log('Siap! Tab "' + SHEET + '" sudah dibuat.');
}
