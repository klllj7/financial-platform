const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = require("docx");

const buildTable = (columns, rows) => {
  const headerRow = new TableRow({
    children: columns.map(
      (col) =>
        new TableCell({
          width: { size: col.width ?? 100 / columns.length, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: col.header, bold: true })] })],
        })
    ),
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: columns.map(
          (col) =>
            new TableCell({
              children: [new Paragraph(String(row[col.key] ?? ""))],
            })
        ),
      })
  );

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] });
};

/**
 * sections: [{ heading, paragraphs?: string[], table?: { columns, rows } }]
 * narrative 텍스트는 줄바꿈 기준으로 문단을 나눠 넣는다. Buffer로 반환한다.
 */
const generateDocx = async (title, sections) => {
  const children = [new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 })];

  sections.forEach((section) => {
    if (section.heading) {
      children.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_2 }));
    }
    (section.paragraphs ?? []).forEach((line) => {
      children.push(new Paragraph(line));
    });
    if (section.table) {
      children.push(buildTable(section.table.columns, section.table.rows));
      children.push(new Paragraph(""));
    }
  });

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
};

module.exports = { generateDocx };
