/* ============================================================
 * NutriFit-Planner 极简 XLSX 生成器 / Minimal XLSX Writer
 * 零依赖：STORE 压缩 ZIP + 内联字符串(inlineStr)工作表
 * 支持：列宽、行高、合并单元格、加粗/填充/边框/自动换行样式
 * 输出标准 .xlsx，可被 Excel / WPS / Numbers / LibreOffice 打开。
 * ============================================================ */
var XLSX = (function () {

  /* ---------- CRC32 ---------- */
  var CRC_TABLE = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /* ---------- UTF-8 编码 ---------- */
  function utf8(s) {
    var out = [];
    for (var i = 0; i < s.length; i++) {
      var code = s.charCodeAt(i);
      if (code < 0x80) out.push(code);
      else if (code < 0x800) out.push(0xC0 | (code >> 6), 0x80 | (code & 63));
      else if (code >= 0xD800 && code <= 0xDBFF) {
        var lo = s.charCodeAt(++i);
        var cp = ((code - 0xD800) << 10) + (lo - 0xDC00) + 0x10000;
        out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
      } else out.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    }
    return new Uint8Array(out);
  }
  function w16(v) { return [v & 255, (v >> 8) & 255]; }
  function w32(v) { return [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]; }

  function concatBytes(chunks) {
    var total = 0, i;
    for (i = 0; i < chunks.length; i++) total += chunks[i].length;
    var out = new Uint8Array(total), pos = 0;
    for (i = 0; i < chunks.length; i++) { out.set(chunks[i], pos); pos += chunks[i].length; }
    return out;
  }

  /* ---------- STORE 模式 ZIP（无压缩，Excel 兼容） ---------- */
  function zipStore(entries) {
    var chunks = [], central = [], offset = 0;
    for (var i = 0; i < entries.length; i++) {
      var nameB = utf8(entries[i].name), dataB = utf8(entries[i].content);
      var crc = crc32(dataB);
      var local = [0x50, 0x4B, 0x03, 0x04]
        .concat(w16(20), w16(0x0800), w16(0), w16(0), w16(0),
          w32(crc), w32(dataB.length), w32(dataB.length), w16(nameB.length), w16(0));
      chunks.push(new Uint8Array(local), nameB, dataB);
      var cen = [0x50, 0x4B, 0x01, 0x02]
        .concat(w16(20), w16(20), w16(0x0800), w16(0), w16(0), w16(0),
          w32(crc), w32(dataB.length), w32(dataB.length), w16(nameB.length),
          w16(0), w16(0), w16(0), w16(0), w32(0), w32(offset));
      central.push(new Uint8Array(cen), nameB);
      offset += local.length + nameB.length + dataB.length;
    }
    var cd = concatBytes(central);
    var end = new Uint8Array([0x50, 0x4B, 0x05, 0x06].concat(
      w16(0), w16(0), w16(entries.length), w16(entries.length),
      w32(cd.length), w32(offset), w16(0)));
    chunks.push(cd, end);
    return concatBytes(chunks);
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function colName(i) { return String.fromCharCode(65 + i); }

  var STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="3">' +
  '<font><sz val="12"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="12"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="14"/><name val="Calibri"/></font>' +
  '</fonts>' +
  '<fills count="4">' +
  '<fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FF1F8A4C"/></patternFill></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFE6F4EC"/></patternFill></fill>' +
  '</fills>' +
  '<borders count="2">' +
  '<border><left/><right/><top/><bottom/><diagonal/></border>' +
  '<border><left style="thin"><color rgb="FF9BB8A5"/></left><right style="thin"><color rgb="FF9BB8A5"/></right>' +
  '<top style="thin"><color rgb="FF9BB8A5"/></top><bottom style="thin"><color rgb="FF9BB8A5"/></bottom><diagonal/></border>' +
  '</borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="6">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
  '<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
  '<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
  '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
  '</cellXfs>' +
  '</styleSheet>';

  /* cfg: { sheetName, cols:[{w}], rows:[{cells:[{t,s}], h}], merges:["A1:B1"] } */
  function build(cfg) {
    var lastRef = colName(cfg.cols.length - 1) + cfg.rows.length;
    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    xml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
    xml += '<dimension ref="A1:' + lastRef + '"/>';
    xml += '<sheetFormatPr defaultRowHeight="15"/>';
    xml += "<cols>";
    for (var i = 0; i < cfg.cols.length; i++) {
      xml += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + cfg.cols[i].w + '" customWidth="1"/>';
    }
    xml += "</cols><sheetData>";
    for (var r = 0; r < cfg.rows.length; r++) {
      var row = cfg.rows[r];
      xml += '<row r="' + (r + 1) + '"' + (row.h ? ' ht="' + row.h + '" customHeight="1"' : "") + ">";
      for (var c = 0; c < row.cells.length; c++) {
        var cell = row.cells[c];
        if (!cell || !cell.t) continue;
        xml += '<c r="' + colName(c) + (r + 1) + '"' + (cell.s ? ' s="' + cell.s + '"' : "") +
          ' t="inlineStr"><is><t xml:space="preserve">' + esc(cell.t) + "</t></is></c>";
      }
      xml += "</row>";
    }
    xml += "</sheetData>";
    if (cfg.merges && cfg.merges.length) {
      xml += '<mergeCells count="' + cfg.merges.length + '">';
      for (var m = 0; m < cfg.merges.length; m++) xml += '<mergeCell ref="' + cfg.merges[m] + '"/>';
      xml += "</mergeCells>";
    }
    xml += "</worksheet>";

    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      "</Relationships>";
    var wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      "</Relationships>";
    var wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="' + esc(cfg.sheetName) + '" sheetId="1" r:id="rId1"/></sheets>' +
      "</workbook>";
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      "</Types>";

    return zipStore([
      { name: "[Content_Types].xml", content: ct },
      { name: "_rels/.rels", content: rels },
      { name: "xl/workbook.xml", content: wb },
      { name: "xl/_rels/workbook.xml.rels", content: wbRels },
      { name: "xl/styles.xml", content: STYLES },
      { name: "xl/worksheets/sheet1.xml", content: xml }
    ]);
  }

  /* 解析 STORE 模式 ZIP 条目（测试/校验用） */
  function extract(bytes) {
    var entries = [], pos = 0;
    while (pos + 30 <= bytes.length && bytes[pos] === 0x50 && bytes[pos + 1] === 0x4B) {
      if (bytes[pos + 2] !== 0x03 || bytes[pos + 3] !== 0x04) break;
      var method = bytes[pos + 8] | (bytes[pos + 9] << 8);
      var nameLen = bytes[pos + 26] | (bytes[pos + 27] << 8);
      var extraLen = bytes[pos + 28] | (bytes[pos + 29] << 8);
      var csize = (bytes[pos + 18] | (bytes[pos + 19] << 8) | (bytes[pos + 20] << 16) | (bytes[pos + 21] << 24)) >>> 0;
      var nameB = bytes.subarray(pos + 30, pos + 30 + nameLen);
      var dataStart = pos + 30 + nameLen + extraLen;
      var name = new TextDecoder("utf-8").decode(nameB);
      if (method === 0) {
        entries.push({ name: name, content: new TextDecoder("utf-8").decode(bytes.subarray(dataStart, dataStart + csize)) });
      }
      pos = dataStart + csize;
    }
    return entries;
  }

  return { build: build, extract: extract };
})();
