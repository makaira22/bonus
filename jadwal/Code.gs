/**
 * JADWAL — Backend Google Apps Script (MULTI CABANG)
 * Tempel di: Spreadsheet JADWAL utama > Extensions > Apps Script > Code.gs
 *
 * Satu script ini melayani SEMUA cabang. Daftar cabang ada di sheet "CABANG" (di spreadsheet utama ini):
 *   A KODE (= nama folder di GitHub, mis. sbyw33) | B NAMA CABANG | C SPREADSHEET | D EMAIL CABANG
 *   Kolom C:  "ini"  = pakai spreadsheet utama ini
 *             kosong = otomatis dibuatkan spreadsheet baru saat cabang pertama kali membuka aplikasi
 *             atau tempel link / ID spreadsheet cabang yang sudah ada
 *   Kolom D:  email cabang (opsional). Spreadsheet yang dibuat otomatis langsung dibagikan ke email ini
 *             sebagai Editor. Isi belakangan? Jalankan bagikanSpreadsheetCabang().
 *
 * Di spreadsheet tiap cabang:
 * Sheet "JADWAL"  : A Nomor | B DATE | C JAM | D NAMA CLEANER | E NO. TELP | F LEMBUR | G PESANAN |
 *                   H ADS | I NAMA CUSTOMER | J ALAMAT | K KM | L PEM. CASH | M PEM. TRANSFER |
 *                   N JENIS PAYMENT | O ID (disembunyikan, jangan dihapus)
 * Sheet "CLEANER" : daftar nama cleaner (kolom A)
 *
 * Jadwal otomatis diurutkan per tanggal & jam, diberi baris pemisah hari (merah),
 * dan Nomor dihitung ulang per hari.
 */

// ⚠️ Harus SAMA PERSIS dengan API_KEY di app.js
const SECRET = 'KUNCITERBATASKLINKLIN2525';

const SHEET = 'JADWAL';
const CABANG_SHEET = 'CABANG';
// Daftar cabang. Dipakai saat sheet CABANG dibuat / diatur ulang (fungsi aturUlangCabang).
// [KODE di link, NAMA CABANG, SPREADSHEET ('ini' / kosong = otomatis dibuat / link), EMAIL CABANG (opsional)]
const DEFAULT_CABANG = [
  ['jadwal', 'Gianyar',    'ini', ''],      // link lama: .../jadwal/jadwal.html
  ['sbyw33', 'Surabaya',   'https://docs.google.com/spreadsheets/d/1aHM97cF7qPyXSPAZospf2AJp1viLRz3Ppm4dqUUD7Gc/edit', 'klinklin.surabaya@gmail.com'],
  ['mlghxa', 'Malang',     'https://docs.google.com/spreadsheets/d/1dueVfO7XUkq-vqal-J7qBh7z73jHGK7n3pEd7VggXFA/edit', 'klinklin.malang@gmail.com'],
  ['bjnggj', 'Bojonegoro', 'https://docs.google.com/spreadsheets/d/1waDfSuG05Q7WHpDdJiLyWQBjnhtJ1FXmNGacKnbLG98/edit', 'klinklin.bojonegoro@gmail.com'],
  ['grsv6y', 'Gresik',     'https://docs.google.com/spreadsheets/d/1OhA3rITaKBVXtMwDUARNnYBAMkJ7aoAaWVJA-NQApvQ/edit', 'klinklin.gresik@gmail.com'],
  ['mksxkc', 'Makassar',   'https://docs.google.com/spreadsheets/d/1RKltEVOMWQqIzcdshpNSqJSE0BfK-mPw91OIsAhYCeA/edit', 'klinklin.makassar@gmail.com'],
  ['dpscb3', 'Denpasar',   'https://docs.google.com/spreadsheets/d/1XVg0QCYnNxx1ZUAVrJwLWLqwVvq9QYedlaswP_dIWtg/edit', 'klinklin.bali@gmail.com'],
  ['tbnxsr', 'Tabanan',    'https://docs.google.com/spreadsheets/d/1XzFXZNM23vq8y2jfYb5ZLhmh8vZ8Zp4D5n_5IoK1LNM/edit', 'klinklin.tabanan@gmail.com'],
  ['smdavh', 'Samarinda',  'https://docs.google.com/spreadsheets/d/1GbBhFhhCseK0cuAtHnqpoxnOceyt7cUd9kp7tWXK7bA/edit', 'klinklin.samarinda@gmail.com'],
  ['bpp5nf', 'Balikpapan', 'https://docs.google.com/spreadsheets/d/1vufpOAUNTduaTI3TZbJJHGQSRjOFkSj1kZhMI4u_FjQ/edit', 'klinklin.balikpapan@gmail.com'],
  ['kdr3ca', 'Kediri',     'https://docs.google.com/spreadsheets/d/1cneC_ipiBmMe1pPJNnV3qAU7xjki_NcaGncrIdV3Bio/edit', 'klinklin.kediri@gmail.com']
];
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
    if (req.key !== SECRET) throw new Error('Kunci API tidak cocok. Samakan SECRET di Code.gs dengan API_KEY di app.js.');
    const cab = getCabang_(req.cabang);
    const ss = cab.ss;
    const sh = getSheet_(ss);
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
        setCleaners_(ss, req.names || []);
        break;
      default:
        throw new Error('Aksi tidak dikenal: ' + req.action);
    }
    return json_({ ok: true, data: { rows: readAll_(sh), cleaners: getCleaners_(ss), cabang: cab.nama } });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    return json_({ ok: false, error: msg, code: /^CABANG:/.test(msg) ? 'cabang' : '' });
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
  if (!d || !d.tanggal) throw new Error('Tanggal pengerjaan wajib diisi.');
  if (!String(d.customer || '').trim()) throw new Error('Nama customer wajib diisi.');
  if (!(Number(d.nominal) > 0)) throw new Error('Nominal pembayaran wajib diisi.');
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

function getCleaners_(ss) {
  const sh = getCleanerSheet_(ss);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 1).getValues()
    .map(function (r) { return String(r[0]).trim(); }).filter(String);
}

function setCleaners_(ss, names) {
  const seen = {};
  const list = names.map(function (s) { return String(s).trim(); })
    .filter(function (s) { if (!s || seen[s.toLowerCase()]) return false; seen[s.toLowerCase()] = 1; return true; });
  const sh = getCleanerSheet_(ss);
  const last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, 1, last - 1, 1).clearContent();
  if (list.length) sh.getRange(2, 1, list.length, 1).setValues(list.map(function (s) { return [s]; }));
}

/* ============================ CABANG ============================ */

function getCabangSheet_() {
  const master = SpreadsheetApp.getActiveSpreadsheet();
  let sh = master.getSheetByName(CABANG_SHEET);
  if (sh) return sh;
  sh = master.insertSheet(CABANG_SHEET);
  writeCabang_(sh, DEFAULT_CABANG);
  return sh;
}

function writeCabang_(sh, rows) {
  sh.clear();
  sh.getRange(1, 1, 1, 4).setValues([['KODE', 'NAMA CABANG', 'SPREADSHEET', 'EMAIL CABANG']])
    .setFontWeight('bold').setBackground('#ffff00');
  sh.getRange(2, 1, rows.length, 4).setNumberFormat('@').setValues(rows);
  sh.setColumnWidth(1, 110); sh.setColumnWidth(2, 140); sh.setColumnWidth(3, 420); sh.setColumnWidth(4, 220);
  sh.setFrozenRows(1);
}

/** Jalankan SEKALI: menulis ulang sheet CABANG sesuai DEFAULT_CABANG di atas,
 *  lalu menyiapkan sheet JADWAL & CLEANER di setiap spreadsheet cabang dan membagikannya ke email cabang. */
function aturUlangCabang() {
  const master = SpreadsheetApp.getActiveSpreadsheet();
  let sh = master.getSheetByName(CABANG_SHEET);
  const lama = {};
  if (sh && sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues().forEach(function (r) {
      lama[String(r[0]).trim().toLowerCase()] = { ss: String(r[2] || '').trim(), email: String(r[3] || '').trim() };
    });
  }
  if (!sh) sh = master.insertSheet(CABANG_SHEET);
  const rows = DEFAULT_CABANG.map(function (r) {
    const o = lama[r[0]] || {};
    return [r[0], r[1], r[2] || o.ss || '', r[3] || o.email || ''];
  });
  writeCabang_(sh, rows);
  const gagal = [];
  rows.forEach(function (r) {
    try {
      const cab = getCabang_(r[0]);
      getSheet_(cab.ss); getCleanerSheet_(cab.ss);
      if (String(r[2]).toLowerCase() !== 'ini') shareTo_(cab.ss, r[3], cab.nama);
    } catch (e) { gagal.push(r[1] + ': ' + e.message); }
  });
  Logger.log('Sheet CABANG berisi ' + rows.length + ' cabang.' + (gagal.length ? '\nBELUM BISA DIBUKA:\n' + gagal.join('\n') : '\nSemua spreadsheet cabang siap.'));
}

/** Bagikan setiap spreadsheet cabang ke email di kolom D (sebagai Editor). Aman dijalankan berulang. */
function bagikanSpreadsheetCabang() {
  const sh = getCabangSheet_();
  sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues().forEach(function (r) {
    if (!r[0] || !String(r[3]).trim() || String(r[2]).trim().toLowerCase() === 'ini') return;
    const cab = getCabang_(r[0]);
    shareTo_(cab.ss, r[3], cab.nama);
  });
}

function shareTo_(ss, emails, nama) {
  String(emails || '').split(/[,;\s]+/).filter(String).forEach(function (em) {
    try { ss.addEditor(em); } catch (e) { Logger.log('Gagal membagikan ' + nama + ' ke ' + em + ': ' + e.message); }
  });
}

/** Cari cabang dari kode di link. Kode salah = ditolak. */
function getCabang_(kode) {
  kode = String(kode || '').trim().toLowerCase();
  if (!kode) throw new Error('CABANG: Buka aplikasi lewat link cabang.');
  const sh = getCabangSheet_();
  const last = sh.getLastRow();
  const vals = last >= 2 ? sh.getRange(2, 1, last - 1, 4).getValues() : [];
  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim().toLowerCase() !== kode) continue;
    const nama = String(vals[i][1] || kode).trim();
    let ref = String(vals[i][2] || '').trim();
    let ss;
    if (ref.toLowerCase() === 'ini') {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } else if (ref) {
      const m = ref.match(/\/d\/([-\w]{25,})/);
      try { ss = SpreadsheetApp.openById(m ? m[1] : ref); }
      catch (e) { throw new Error('Spreadsheet cabang ' + nama + ' tidak bisa dibuka. Cek link/ID di sheet CABANG.'); }
    } else {
      ss = SpreadsheetApp.create('JADWAL - ' + nama);          // otomatis buat spreadsheet baru
      getSheet_(ss); getCleanerSheet_(ss);
      const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1');
      if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
      sh.getRange(i + 2, 3).setValue(ss.getUrl());
      shareTo_(ss, vals[i][3], nama);                          // bagikan ke email cabang (kalau diisi)
    }
    return { ss: ss, nama: nama };
  }
  throw new Error('CABANG: Link cabang tidak dikenal. Minta link yang benar ke admin.');
}

/** Jalankan dari editor kalau ingin langsung membuat semua spreadsheet cabang yang kolom C-nya masih kosong */
function buatSemuaSpreadsheetCabang() {
  const sh = getCabangSheet_();
  const vals = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 4).getValues();
  vals.forEach(function (r) { if (r[0] && !String(r[2]).trim()) getCabang_(r[0]); });
  Logger.log('Selesai. Link spreadsheet tiap cabang ada di sheet CABANG kolom C.');
}

/* ============================ HELPERS ============================ */

function getSheet_(ss) {
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

function getCleanerSheet_(ss) {
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

/** Jalankan SEKALI dari editor untuk memberi izin & membuat sheet CABANG, JADWAL, CLEANER */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  getCabangSheet_();
  getSheet_(ss);
  getCleanerSheet_(ss);
  Logger.log('Siap! Cek sheet CABANG untuk daftar kode & cabang.');
}
