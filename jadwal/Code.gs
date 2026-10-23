/**
 * JADWAL — Backend Google Apps Script
 * Tempel di: Spreadsheet jadwal > Extensions > Apps Script > Code.gs
 *
 * Sheet "JADWAL"  : A Nomor | B DATE | C JAM | D NAMA CLEANER | E NO. TELP | F LEMBUR | G PESANAN |
 *                   H ADS | I NAMA CUSTOMER | J ALAMAT | K KM | L PEM. CASH | M PEM. TRANSFER |
 *                   N JENIS PAYMENT | O ID (disembunyikan, jangan dihapus)
 * Sheet "CLEANER" : daftar nama cleaner (kolom A)
 *
 * Jadwal otomatis diurutkan per tanggal & jam, diberi baris pemisah hari (merah),
 * dan Nomor dihitung ulang per hari.
 */

// ⚠️ Harus SAMA PERSIS dengan API_KEY di jadwal.html
const SECRET = 'KUNCITERBATASKLINKLIN2525';

const SHEET = 'JADWAL';
const CLEANER_SHEET = 'CLEANER';
const HEADERS = ['Nomor', 'DATE', 'JAM', 'NAMA CLEANER', 'NO. TELP', 'LEMBUR', 'PESANAN', 'ADS',
  'NAMA CUSTOMER', 'ALAMAT', 'KM', 'PEM. CASH', 'PEM. TRANSFER', 'JENIS PAYMENT', 'ID'];
const NCOL = 15;
const FIRST = 2;                     // baris data pertama (baris 1 = judul kolom)
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const RP = '"Rp"#,##0';

/* ============================ ENDPOINT ============================ */

function doGet() {
  return json_({ ok: true, message: 'API JADWAL aktif. Gunakan POST dari aplikasi.' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.key !== SECRET) throw new Error('Kunci API tidak cocok. Samakan SECRET di Code.gs dengan API_KEY di jadwal.html.');
    const sh = getSheet_();
    if (req.action !== 'list') lock.waitLock(25000);

    let rows;
    switch (req.action) {
      case 'list':
        break;
      case 'add':
        rows = readAll_(sh);
        rows.push(clean_(req.data, Utilities.getUuid()));
        writeAll_(sh, rows);
        break;
      case 'update': {
        rows = readAll_(sh);
        const i = rows.findIndex(function (r) { return r.id === req.id; });
        if (i < 0) throw new Error('Jadwal tidak ditemukan. Muat ulang data.');
        rows[i] = clean_(req.data, req.id);
        writeAll_(sh, rows);
        break;
      }
      case 'delete':
        rows = readAll_(sh);
        if (!rows.some(function (r) { return r.id === req.id; })) throw new Error('Jadwal tidak ditemukan. Muat ulang data.');
        writeAll_(sh, rows.filter(function (r) { return r.id !== req.id; }));
        break;
      case 'setCleaners':
        setCleaners_(req.names || []);
        break;
      default:
        throw new Error('Aksi tidak dikenal: ' + req.action);
    }
    return json_({ ok: true, data: { rows: readAll_(sh), cleaners: getCleaners_() } });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/* ============================ JADWAL ============================ */

function readAll_(sh) {
  const last = sh.getLastRow();
  if (last < FIRST) return [];
  const vals = sh.getRange(FIRST, 1, last - FIRST + 1, NCOL).getValues();
  const tz = Session.getScriptTimeZone();
  const out = [];
  vals.forEach(function (r) {
    if (!r[14]) return;                                   // baris pemisah hari / kosong
    out.push({
      id: String(r[14]),
      tanggal: r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : String(r[1] || ''),
      jam: r[2] instanceof Date ? Utilities.formatDate(r[2], tz, 'HH.mm') : normJam_(r[2]),
      cleaners: String(r[3] || '').split(',').map(function (s) { return s.trim(); }).filter(String),
      telp: String(r[4] || ''),
      lembur: Number(r[5]) || 0,
      pesanan: String(r[6] || ''),
      ads: String(r[7] || ''),
      customer: String(r[8] || ''),
      alamat: String(r[9] || ''),
      km: Number(r[10]) || 0,
      cash: Number(r[11]) || 0,
      transfer: Number(r[12]) || 0,
      payment: String(r[13] || '')
    });
  });
  return out;
}

function clean_(d, id) {
  if (!d || !d.tanggal) throw new Error('Tanggal wajib diisi.');
  const bayar = d.bayar === 'transfer' ? 'transfer' : 'cash';
  const nominal = Math.round(Number(d.nominal) || 0);
  return {
    id: id,
    tanggal: String(d.tanggal),
    jam: normJam_(d.jam),
    cleaners: (d.cleaners || []).map(String).map(function (s) { return s.trim(); }).filter(String),
    telp: String(d.telp || '').trim(),
    lembur: Number(d.lembur) || 0,
    pesanan: String(d.pesanan || '').trim(),
    ads: d.ads === 'Ads' ? 'Ads' : 'Org',
    customer: String(d.customer || '').trim(),
    alamat: String(d.alamat || '').trim(),
    km: Number(d.km) || 0,
    cash: bayar === 'cash' ? nominal : 0,
    transfer: bayar === 'transfer' ? nominal : 0,
    payment: bayar === 'transfer' ? (d.payment === 'Mandiri' ? 'Mandiri' : 'BCA') : ''
  };
}

/** Tulis ulang seluruh jadwal: urut tanggal+jam, baris pemisah hari, nomor per hari */
function writeAll_(sh, rows) {
  rows.sort(function (a, b) {
    return a.tanggal.localeCompare(b.tanggal) || menit_(a.jam) - menit_(b.jam);
  });

  const vals = [], bgs = [], colors = [], weights = [], fmts = [];
  const textFmt = Array(NCOL).fill('@');
  const dataFmt = ['0', 'd mmmm yyyy', '@', '@', '@', '0 "jam"', '@', '@', '@', '@', '0.##', RP, RP, '@', '@'];
  let curDay = null, no = 0;

  rows.forEach(function (r) {
    if (r.tanggal !== curDay) {
      curDay = r.tanggal; no = 0;
      const sep = Array(NCOL).fill('');
      sep[1] = HARI[parseDate_(r.tanggal).getDay()];
      vals.push(sep); fmts.push(textFmt);
      bgs.push(Array(NCOL).fill('#990000'));
      colors.push(Array(NCOL).fill('#ffffff'));
      weights.push(Array(NCOL).fill('normal'));
    }
    no++;
    vals.push([
      no, parseDate_(r.tanggal), r.jam, r.cleaners.join(', '), r.telp,
      r.lembur || '', r.pesanan, r.ads, r.customer, r.alamat, r.km || '',
      r.cash || '', r.transfer || '', r.payment, r.id
    ]);
    fmts.push(dataFmt);
    bgs.push(Array(NCOL).fill(null));
    colors.push(Array(NCOL).fill('#000000'));
    weights.push(Array(NCOL).fill('normal'));
  });

  const oldLast = sh.getLastRow();
  if (oldLast >= FIRST) sh.getRange(FIRST, 1, oldLast - FIRST + 1, NCOL).clear();
  if (!vals.length) return;

  const rg = sh.getRange(FIRST, 1, vals.length, NCOL);
  rg.setNumberFormats(fmts);
  rg.setValues(vals);
  rg.setBackgrounds(bgs).setFontColors(colors).setFontWeights(weights)
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true)
    .setBorder(true, true, true, true, true, true);
  sh.getRange(FIRST, 2, vals.length, 1).setHorizontalAlignment('center');
  SpreadsheetApp.flush();
}

/* ============================ CLEANER ============================ */

function getCleaners_() {
  const sh = getCleanerSheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 1).getValues()
    .map(function (r) { return String(r[0]).trim(); }).filter(String);
}

function setCleaners_(names) {
  const seen = {};
  const list = names.map(function (s) { return String(s).trim(); })
    .filter(function (s) { if (!s || seen[s.toLowerCase()]) return false; seen[s.toLowerCase()] = 1; return true; });
  const sh = getCleanerSheet_();
  const last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, 1, last - 1, 1).clearContent();
  if (list.length) sh.getRange(2, 1, list.length, 1).setValues(list.map(function (s) { return [s]; }));
}

/* ============================ HELPERS ============================ */

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(SHEET);
  sh.getRange(1, 1, 1, NCOL).setValues([HEADERS]);
  sh.getRange(1, 1, 1, 14)
    .setBackground('#ffff00').setFontWeight('bold').setWrap(true)
    .setHorizontalAlignment('center').setVerticalAlignment('bottom')
    .setBorder(true, true, true, true, true, true);
  sh.setRowHeight(1, 48);
  sh.setFrozenRows(1);
  [70, 140, 70, 110, 120, 60, 170, 70, 130, 150, 50, 110, 110, 100].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.hideColumns(15);
  return sh;
}

function getCleanerSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CLEANER_SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(CLEANER_SHEET);
  sh.getRange('A1').setValue('NAMA CLEANER').setFontWeight('bold').setBackground('#ffff00');
  sh.setColumnWidth(1, 200);
  return sh;
}

function normJam_(v) {
  if (typeof v === 'number') {                      // 10 / 10.5 / pecahan hari
    if (v < 1) { const m = Math.round(v * 1440); return pad_(Math.floor(m / 60)) + '.' + pad_(m % 60); }
    const h = Math.floor(v), mm = Math.round((v - h) * 100);
    return pad_(h) + '.' + pad_(mm);
  }
  const m = String(v || '').match(/(\d{1,2})\D?(\d{2})?/);
  if (!m) return '';
  return pad_(Number(m[1])) + '.' + pad_(Number(m[2] || 0));
}
function menit_(j) { const p = String(j || '').split('.'); return (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0); }
function pad_(n) { return (n < 10 ? '0' : '') + n; }
function parseDate_(s) { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Jalankan SEKALI dari editor untuk memberi izin & membuat sheet JADWAL + CLEANER */
function setup() {
  getSheet_();
  getCleanerSheet_();
  Logger.log('Siap! Sheet JADWAL dan CLEANER sudah dibuat.');
}
