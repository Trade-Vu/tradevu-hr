/**
 * @file fileExporter.js
 * @description Zero-dependency CSV and OpenXML (.xlsx) serialization engine.
 * Supports cross-environment (Node.js and modern browsers).
 */

/**
 * Escapes a cell value according to RFC 4180 rules for CSV.
 *
 * @param {any} val - Value to escape
 * @returns {string} Escaped string
 */
export function escapeCsvCell(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serializes tabular data to CSV format with UTF-8 BOM prefix for Excel compatibility.
 *
 * @param {Object} options
 * @param {string[]} [options.headers]
 * @param {any[][]} [options.rows]
 * @param {string} [options.title]
 * @param {Array<{ title?: string, headers: string[], rows: any[][] }>} [options.sections]
 * @returns {string} CSV string with UTF-8 BOM
 */
export function serializeToCsv({ headers = [], rows = [], title, sections } = {}) {
  const lines = [];

  // UTF-8 BOM for Microsoft Excel character encoding compatibility
  const BOM = '\uFEFF';

  if (sections && Array.isArray(sections) && sections.length > 0) {
    sections.forEach((sec, idx) => {
      if (idx > 0) lines.push(''); // Empty separator line between sections
      if (sec.title) lines.push(escapeCsvCell(sec.title));
      if (sec.headers && sec.headers.length > 0) {
        lines.push(sec.headers.map(escapeCsvCell).join(','));
      }
      if (sec.rows && sec.rows.length > 0) {
        sec.rows.forEach(r => {
          lines.push(r.map(escapeCsvCell).join(','));
        });
      }
    });
  } else {
    if (title) lines.push(escapeCsvCell(title));
    if (headers && headers.length > 0) {
      lines.push(headers.map(escapeCsvCell).join(','));
    }
    if (rows && rows.length > 0) {
      rows.forEach(r => {
        lines.push(r.map(escapeCsvCell).join(','));
      });
    }
  }

  return BOM + lines.join('\r\n');
}

/**
 * Escapes special XML characters for OpenXML.
 *
 * @param {any} val
 * @returns {string}
 */
export function escapeXml(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts 0-indexed column number to Excel column name (0 -> A, 27 -> AB).
 *
 * @param {number} index
 * @returns {string}
 */
export function colName(index) {
  let col = '';
  let temp = index + 1;
  while (temp > 0) {
    const rem = (temp - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    temp = Math.floor((temp - 1) / 26);
  }
  return col;
}

// Precomputed CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

/**
 * Calculates standard CRC32 checksum for a Uint8Array / Buffer.
 *
 * @param {Uint8Array} buf
 * @returns {number}
 */
export function calcCrc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Creates a standard PKZip archive (STORE method / uncompressed).
 * Guaranteed to be valid across all zip unpackers, Excel, LibreOffice, and Google Sheets.
 *
 * @param {Array<{ name: string, content: string|Uint8Array }>} files
 * @returns {Uint8Array}
 */
export function createZipArchive(files) {
  const isNode = typeof Buffer !== 'undefined';
  const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

  const toBytes = (data) => {
    if (typeof data === 'string') {
      return encoder ? encoder.encode(data) : Buffer.from(data, 'utf8');
    }
    return data;
  };

  const fileEntries = [];
  let offset = 0;

  for (const file of files) {
    const data = toBytes(file.content);
    const nameBytes = toBytes(file.name);
    const crc = calcCrc32(data);

    // Local file header (30 bytes + name length)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer, localHeader.byteOffset, localHeader.byteLength);

    view.setUint32(0, 0x04034b50, true); // signature
    view.setUint16(4, 20, true);         // version needed: 2.0
    view.setUint16(6, 0, true);          // flags: 0
    view.setUint16(8, 0, true);          // compression method: 0 (STORE)
    view.setUint16(10, 0, true);         // mod time
    view.setUint16(12, 0, true);         // mod date
    view.setUint32(14, crc, true);       // crc32
    view.setUint32(18, data.length, true); // compressed size
    view.setUint32(22, data.length, true); // uncompressed size
    view.setUint16(26, nameBytes.length, true); // filename length
    view.setUint16(28, 0, true);         // extra field length

    localHeader.set(nameBytes, 30);

    fileEntries.push({
      nameBytes,
      data,
      localHeader,
      crc,
      uncompressedSize: data.length,
      compressedSize: data.length,
      offset
    });

    offset += localHeader.length + data.length;
  }

  // Central directory headers
  const cdEntries = [];
  let cdSize = 0;

  for (const entry of fileEntries) {
    const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
    const view = new DataView(cdHeader.buffer, cdHeader.byteOffset, cdHeader.byteLength);

    view.setUint32(0, 0x02014b50, true); // signature
    view.setUint16(4, 20, true);         // version made by
    view.setUint16(6, 20, true);         // version needed
    view.setUint16(8, 0, true);          // flags
    view.setUint16(10, 0, true);         // method: 0 (STORE)
    view.setUint16(12, 0, true);         // mod time
    view.setUint16(14, 0, true);         // mod date
    view.setUint32(16, entry.crc, true); // crc32
    view.setUint32(20, entry.compressedSize, true); // compressed size
    view.setUint32(24, entry.uncompressedSize, true); // uncompressed size
    view.setUint16(28, entry.nameBytes.length, true); // filename length
    view.setUint16(30, 0, true);         // extra field length
    view.setUint16(32, 0, true);         // comment length
    view.setUint16(34, 0, true);         // disk start
    view.setUint16(36, 0, true);         // internal attrs
    view.setUint32(38, 0, true);         // external attrs
    view.setUint32(42, entry.offset, true); // relative offset of local header

    cdHeader.set(entry.nameBytes, 46);
    cdEntries.push(cdHeader);
    cdSize += cdHeader.length;
  }

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer, eocd.byteOffset, eocd.byteLength);
  eocdView.setUint32(0, 0x06054b50, true); // signature
  eocdView.setUint16(4, 0, true);          // disk number
  eocdView.setUint16(6, 0, true);          // start disk
  eocdView.setUint16(8, fileEntries.length, true);  // entries on disk
  eocdView.setUint16(10, fileEntries.length, true); // total entries
  eocdView.setUint32(12, cdSize, true);    // size of central directory
  eocdView.setUint32(16, offset, true);    // offset of central directory
  eocdView.setUint16(20, 0, true);         // comment length

  // Concatenate all parts
  let totalSize = offset + cdSize + 22;
  const result = new Uint8Array(totalSize);
  let pos = 0;

  for (const entry of fileEntries) {
    result.set(entry.localHeader, pos);
    pos += entry.localHeader.length;
    result.set(entry.data, pos);
    pos += entry.data.length;
  }

  for (const cd of cdEntries) {
    result.set(cd, pos);
    pos += cd.length;
  }

  result.set(eocd, pos);

  if (isNode && typeof Buffer.from === 'function') {
    return Buffer.from(result.buffer, result.byteOffset, result.byteLength);
  }

  return result;
}

/**
 * Builds a standard OpenXML (.xlsx) spreadsheet with multiple sheets, styled headers, and auto-sized columns.
 *
 * @param {Object} options
 * @param {Array<{ name: string, headers: string[], rows: any[][] }>} options.sheets
 * @returns {Uint8Array|Buffer}
 */
export function serializeToXlsx({ sheets = [] } = {}) {
  const safeSheets = sheets.length > 0 ? sheets : [
    { name: 'Sheet1', headers: ['No Data'], rows: [] }
  ];

  let typesOverrides = '';
  let relsEntries = '';
  let sheetsEntries = '';
  const zipFiles = [];

  safeSheets.forEach((sheet, idx) => {
    const sheetNum = idx + 1;
    const relId = 'rId' + (sheetNum + 1);
    const cleanSheetName = (sheet.name || `Sheet${sheetNum}`).slice(0, 31).replace(/[:\\\/\?\*\[\]]/g, '_');

    typesOverrides += `<Override PartName="/xl/worksheets/sheet${sheetNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
    relsEntries += `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheetNum}.xml"/>`;
    sheetsEntries += `<sheet name="${escapeXml(cleanSheetName)}" sheetId="${sheetNum}" r:id="${relId}"/>`;

    // Calculate approximate column widths
    const colWidths = (sheet.headers || []).map((h, colI) => {
      let maxLen = String(h || '').length;
      (sheet.rows || []).forEach(r => {
        const valLen = String(r[colI] ?? '').length;
        if (valLen > maxLen) maxLen = valLen;
      });
      return Math.min(50, Math.max(12, maxLen + 3));
    });

    let colsXml = '';
    if (colWidths.length > 0) {
      colsXml = '<cols>' + colWidths.map((w, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`
      ).join('') + '</cols>';
    }

    let rowsXml = '';
    let rowIdx = 1;

    // Header row with style 1 (Bold + light gray fill + bottom border)
    if (sheet.headers && sheet.headers.length > 0) {
      rowsXml += `<row r="${rowIdx}">`;
      sheet.headers.forEach((h, colIdx) => {
        const cRef = colName(colIdx) + rowIdx;
        rowsXml += `<c r="${cRef}" t="inlineStr" s="1"><is><t>${escapeXml(h)}</t></is></c>`;
      });
      rowsXml += '</row>';
    }

    // Data rows
    (sheet.rows || []).forEach(row => {
      rowIdx++;
      rowsXml += `<row r="${rowIdx}">`;
      row.forEach((cell, colIdx) => {
        const cRef = colName(colIdx) + rowIdx;
        if (cell === null || cell === undefined) {
          // Empty cell
        } else if (typeof cell === 'number' && !isNaN(cell)) {
          rowsXml += `<c r="${cRef}" t="n"><v>${cell}</v></c>`;
        } else if (typeof cell === 'boolean') {
          rowsXml += `<c r="${cRef}" t="b"><v>${cell ? 1 : 0}</v></c>`;
        } else {
          rowsXml += `<c r="${cRef}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
        }
      });
      rowsXml += '</row>';
    });

    const sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      colsXml +
      '<sheetData>' + rowsXml + '</sheetData>' +
      '</worksheet>';

    zipFiles.push({ name: `xl/worksheets/sheet${sheetNum}.xml`, content: sheetXml });
  });

  // Stylesheet with header styling
  const stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2">' +
    '<font><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font>' +
    '</fonts>' +
    '<fills count="3">' +
    '<fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>' +
    '</fills>' +
    '<borders count="2">' +
    '<border><left/><right/><top/><bottom/></border>' +
    '<border><left/><right/><top/><bottom style="medium"><color rgb="FFCBD5E1"/></bottom></border>' +
    '</borders>' +
    '<cellStyleXfs count="1">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>' +
    '</cellStyleXfs>' +
    '<cellXfs count="2">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
    '</cellXfs>' +
    '</styleSheet>';

  zipFiles.push({ name: 'xl/styles.xml', content: stylesXml });

  // [Content_Types].xml
  zipFiles.push({
    name: '[Content_Types].xml',
    content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      typesOverrides +
      '</Types>'
  });

  // _rels/.rels
  zipFiles.push({
    name: '_rels/.rels',
    content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>'
  });

  // xl/_rels/workbook.xml.rels
  zipFiles.push({
    name: 'xl/_rels/workbook.xml.rels',
    content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      relsEntries +
      '</Relationships>'
  });

  // xl/workbook.xml
  zipFiles.push({
    name: 'xl/workbook.xml',
    content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets>' + sheetsEntries + '</sheets>' +
      '</workbook>'
  });

  return createZipArchive(zipFiles);
}

/**
 * Generates standard, descriptive and timestamped filenames according to Tradevu conventions.
 *
 * e.g.,
 * Tradevu_Leave_Report_Department-Engineering_2026-11-18.xlsx
 * Tradevu_Leave_Planning_TeamWide_Q4-2026.csv
 *
 * @param {Object} options
 * @param {'summary'|'planning'} options.reportType
 * @param {'team'|'department'|'individual'} options.scope
 * @param {string} [options.scopeName]
 * @param {string} [options.dateLabel]
 * @param {'csv'|'xlsx'} [options.format='xlsx']
 * @returns {string} Formatted filename
 */
export function generateExportFilename({
  reportType = 'summary',
  scope = 'team',
  scopeName = '',
  dateLabel = '',
  format = 'xlsx'
} = {}) {
  const prefix = 'Tradevu';
  const typePart = reportType === 'planning' ? 'Leave_Planning' : 'Leave_Report';

  let scopePart = 'TeamWide';
  if (scope === 'department') {
    scopePart = scopeName ? `Department-${scopeName.replace(/\s+/g, '-')}` : 'DepartmentWide';
  } else if (scope === 'individual') {
    scopePart = scopeName ? `Individual-${scopeName.replace(/\s+/g, '-')}` : 'Individual';
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const timePart = dateLabel ? dateLabel.replace(/\s+/g, '-') : todayStr;

  const ext = format.toLowerCase() === 'csv' ? 'csv' : 'xlsx';
  return `${prefix}_${typePart}_${scopePart}_${timePart}.${ext}`;
}

/**
 * Triggers a client-side download for a generated Blob / Uint8Array.
 *
 * @param {Blob|Uint8Array|string} data
 * @param {string} filename
 * @param {'csv'|'xlsx'} format
 */
export function downloadFileBlob(data, filename, format = 'xlsx') {
  if (typeof window === 'undefined' || !window.document) return;

  const mimeType = format === 'csv'
    ? 'text/csv;charset=utf-8;'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
