const ExcelJS = require("exceljs");

/**
 * sheets: [{ sheetName, columns: [{header, key, width}], rows: [{...}] }]
 * 여러 시트를 하나의 워크북으로 묶어 Buffer로 반환한다.
 */
const generateXlsx = async (sheets) => {
  const workbook = new ExcelJS.Workbook();

  sheets.forEach(({ sheetName, columns, rows }) => {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columns;
    sheet.getRow(1).font = { bold: true };
    rows.forEach((row) => sheet.addRow(row));
  });

  return workbook.xlsx.writeBuffer();
};

module.exports = { generateXlsx };
