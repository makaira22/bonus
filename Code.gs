/**
 * KAS KITA — Backend Google Apps Script
 * Tempel seluruh isi file ini di: Spreadsheet > Extensions > Apps Script > Code.gs
 *
 * Kolom sheet:  A No. | B Tanggal | C Keterangan | D Tempat | E Qty | F Harga @ |
 *               G Debit | H Kredit | I Saldo | J–N NOTA
 *               NOTA = J–L foto pratinjau, M–N link "Buka nota" yang bisa diklik
 *
 * Sudah pernah pakai versi lama (muncul #ERROR!)? Jalankan fungsi perbaikiNota() sekali.
 */

// ⚠️ Harus SAMA PERSIS dengan API_KEY di kas.html
const SECRET = 'KUNCITERBATASKLINKLIN2525';

const USERS = ['Panglima', 'Janni'];
const HEADERS = ['No.', 'Tanggal', 'Keterangan', 'Tempat', 'Qty', 'Harga @', 'Debit', 'Kredit', 'Saldo', 'NOTA'];
const FOLDER_NAME = 'Nota KAS GIANYAR';
const RP_FORMAT = '"Rp" #,##0';

/* ============================ ENDPOINT ============================ */

function doGet() {
  return json_({ ok: true, message: 'API KAS GIANYAR aktif. Gunakan POST dari aplikasi.' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.key !== SECRET) throw new Error('Kunci API tidak cocok. Samakan SECRET di Code.gs dengan API_KEY di kas.html.');
    if (USERS.indexOf(req.user) === -1) throw new Error('Pengguna tidak dikenal.');

    const sh = getSheet_(req.user);
    if (req.action !== 'list') lock.waitLock(25000);

    switch (req.action) {
      case 'list':
        break;
      case 'add':
        writeRow_(sh, lastDataRow_(sh) + 1, req.data, req.user);
        break;
      case 'update':
        checkRow_(sh, req.row, req.no);
        writeRow_(sh, Number(req.row), req.data, req.user);
        break;
      case 'delete':
        checkRow_(sh, req.row, req.no);
        deleteRow_(sh, Number(req.row));
        break;
      default:
        throw new Error('Aksi tidak dikenal: ' + req.action);
    }
    if (req.action !== 'list') recalc_(sh);
    return json_({ ok: true, data: list_(sh) });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/* ============================ DATA ============================ */

function list_(sh) {
  const last = lastDataRow_(sh);
  if (last < 2) return { rows: [], saldo: 0 };
  const n = last - 1;
  const vals = sh.getRange(2, 1, n, 10).getValues();
  const forms = sh.getRange(2, 10, n, 1).getFormulas();
  const links = sh.getRange(2, 13, n, 1).getRichTextValues();
  const tz = Session.getScriptTimeZone();

  const rows = [];
  vals.forEach(function (r, i) {
    if (r[2] === '' && r[6] === '' && r[7] === '') return; // baris kosong
    const notaUrl = (links[i][0] && links[i][0].getLinkUrl()) || extractUrl_(forms[i][0], r[9]);
    rows.push({
      row: i + 2,
      no: Number(r[0]) || i + 1,
      tanggal: r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : String(r[1] || ''),
      keterangan: String(r[2] || ''),
      tempat: String(r[3] || ''),
      qty: Number(r[4]) || 0,
      harga: Number(r[5]) || 0,
      debit: Number(r[6]) || 0,
      kredit: Number(r[7]) || 0,
      saldo: Number(r[8]) || 0,
      notaUrl: notaUrl,
      notaId: notaUrl ? extractId_(notaUrl) : ''
    });
  });
  return { rows: rows, saldo: rows.length ? rows[rows.length - 1].saldo : 0 };
}

function writeRow_(sh, row, data, user) {
  if (!data) throw new Error('Data kosong.');
  const qty = Number(data.qty) || 0;
  const harga = Number(data.harga) || 0;
  const total = Math.round(qty * harga);
  const isMasuk = data.tipe === 'masuk';

  sh.getRange(row, 2, 1, 7).setValues([[
    parseDate_(data.tanggal),
    String(data.keterangan || '').trim(),
    String(data.tempat || '').trim(),
    qty,
    harga,
    isMasuk ? total : '',
    isMasuk ? '' : total
  ]]);

  // NOTA
  const nota = data.nota || { action: 'keep' };
  if (nota.action === 'replace' || nota.action === 'remove') {
    const oldUrl = getNotaUrl_(sh, row);
    if (oldUrl) trashFile_(extractId_(oldUrl));
    clearNota_(sh, row);
  }
  if (nota.action === 'replace' && nota.base64) {
    setNota_(sh, row, saveImage_(nota.base64, nota.type, user));
  } else if (!getNotaUrl_(sh, row)) {
    clearNota_(sh, row);
  }
}

/** Tulis nota: foto pratinjau di J–L, link yang bisa diklik di M–N */
function setNota_(sh, row, id) {
  const viewUrl = 'https://drive.google.com/file/d/' + id + '/view';
  const area = sh.getRange(row, 10, 1, 5);
  area.breakApart().clearContent();
  sh.getRange(row, 10, 1, 3).merge();
  sh.getRange(row, 10).setFormula('=IMAGE("https://lh3.googleusercontent.com/d/' + id + '")');
  sh.getRange(row, 13, 1, 2).merge();
  sh.getRange(row, 13).setRichTextValue(
    SpreadsheetApp.newRichTextValue().setText('Buka nota').setLinkUrl(viewUrl).build()
  );
  area.setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(row, 90);
}

function clearNota_(sh, row) {
  const area = sh.getRange(row, 10, 1, 5);
  area.breakApart().clearContent();
  area.merge();
  sh.setRowHeight(row, 21);
}

function getNotaUrl_(sh, row) {
  const rt = sh.getRange(row, 13).getRichTextValue();
  const link = rt && rt.getLinkUrl();
  if (link) return link;
  const j = sh.getRange(row, 10);
  const fromJ = extractUrl_(j.getFormula(), j.getValue());
  if (fromJ) return fromJ;
  const m = String(j.getFormula()).match(/googleusercontent\.com\/d\/([-\w]{20,})/);
  return m ? 'https://drive.google.com/file/d/' + m[1] + '/view' : '';
}

function deleteRow_(sh, row) {
  const url = getNotaUrl_(sh, row);
  if (url) trashFile_(extractId_(url));
  sh.deleteRow(row);
}

/** Nomor urut otomatis + rumus saldo berjalan: Saldo = saldo sebelumnya + Debit − Kredit */
function recalc_(sh) {
  const last = lastDataRow_(sh);
  if (last < 2) return;
  const n = last - 1;
  const nums = [], saldo = [];
  for (let i = 0; i < n; i++) {
    const r = i + 2;
    nums.push([i + 1]);
    saldo.push([r === 2 ? '=N(G2)-N(H2)' : '=I' + (r - 1) + '+N(G' + r + ')-N(H' + r + ')']);
  }
  sh.getRange(2, 1, n, 1).setValues(nums).setHorizontalAlignment('center');
  sh.getRange(2, 9, n, 1).setFormulas(saldo);
  sh.getRange(2, 2, n, 1).setNumberFormat('dd/MM/yyyy').setHorizontalAlignment('center');
  sh.getRange(2, 5, n, 1).setHorizontalAlignment('center');
  sh.getRange(2, 6, n, 4).setNumberFormat(RP_FORMAT);
  sh.getRange(2, 1, n, 14).setBorder(true, true, true, true, true, true);
  SpreadsheetApp.flush();
}

/* ============================ HELPERS ============================ */

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (sh) return sh;

  sh = ss.insertSheet(name);
  sh.getRange(1, 1, 1, 10).setValues([HEADERS]);
  sh.getRange(1, 10, 1, 5).merge();
  sh.getRange(1, 1, 1, 14)
    .setBackground('#00ff00').setFontWeight('bold').setFontSize(14)
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true);
  sh.setFrozenRows(1);
  [60, 110, 220, 120, 60, 110, 110, 110, 120].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  return sh;
}

/** Baris terakhir yang benar-benar berisi data (abaikan baris yang cuma diberi border) */
function lastDataRow_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return 1;
  const v = sh.getRange(2, 1, last - 1, 8).getValues();
  for (let i = v.length - 1; i >= 0; i--) {
    if (v[i][2] !== '' || v[i][6] !== '' || v[i][7] !== '') return i + 2;
  }
  return 1;
}

function checkRow_(sh, row, no) {
  row = Number(row);
  if (!row || row < 2 || row > lastDataRow_(sh)) throw new Error('Baris tidak ditemukan. Muat ulang data.');
  if (no != null && Number(sh.getRange(row, 1).getValue()) !== Number(no)) {
    throw new Error('Data sudah berubah di spreadsheet. Muat ulang lalu coba lagi.');
  }
}

function parseDate_(s) {
  if (!s) return new Date();
  const p = String(s).split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

function getFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (_) {} }
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

function saveImage_(base64, type, user) {
  const tz = Session.getScriptTimeZone();
  const name = user + '_' + Utilities.formatDate(new Date(), tz, 'yyyyMMdd_HHmmss') + '.jpg';
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), type || 'image/jpeg', name);
  const file = getFolder_().createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
  return file.getId();
}

function trashFile_(id) {
  if (!id) return;
  try { DriveApp.getFileById(id).setTrashed(true); } catch (_) {}
}

function extractUrl_(formula, value) {
  const m = String(formula || '').match(/HYPERLINK\(\s*"([^"]+)"/i);
  if (m) return m[1];
  const v = String(value || '');
  return /^https?:\/\//.test(v) ? v : '';
}

function extractId_(url) {
  const m = String(url).match(/\/d\/([-\w]{20,})/) || String(url).match(/[?&]id=([-\w]{20,})/);
  return m ? m[1] : '';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Perbaiki nota lama yang tampil #ERROR! menjadi foto pratinjau + link. Jalankan sekali. */
function perbaikiNota() {
  let total = 0;
  USERS.forEach(function (u) {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(u);
    if (!sh) return;
    for (let r = 2; r <= lastDataRow_(sh); r++) {
      const id = extractId_(getNotaUrl_(sh, r));
      if (id) {
        try { DriveApp.getFileById(id).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
        setNota_(sh, r, id); total++;
      }
    }
  });
  Logger.log('Selesai. ' + total + ' nota diperbaiki.');
}

/** Jalankan SEKALI secara manual dari editor untuk memberi izin & menyiapkan sheet + folder */
function setup() {
  USERS.forEach(getSheet_);
  getFolder_();
  Logger.log('Siap! Sheet: ' + USERS.join(', ') + ' | Folder nota: ' + FOLDER_NAME);
}
