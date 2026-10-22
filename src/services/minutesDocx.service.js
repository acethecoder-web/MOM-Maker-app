import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";

const FONT = "Calibri";
const SIZE = 22; // half-points, so 22 = 11pt



function cleanString(value, max = 2000) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function cleanList(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 50).map((v) => cleanString(v)).filter(Boolean);
}

export function normalizeMinutes(raw) {
  const items = Array.isArray(raw.action_items) ? raw.action_items.slice(0, 50) : [];
  return {
    summary: cleanString(raw.summary, 4000),
    discussion_points: cleanList(raw.discussion_points),
    decisions: cleanList(raw.decisions),
    action_items: items.map((a) => ({
      task: cleanString(a?.task),
      owner: cleanString(a?.owner, 200) || null,
      due: cleanString(a?.due, 200) || null,
    })),
  };
}


function heading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, bold: true, font: FONT })],
  });
}

function body(text, extra = {}) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, font: FONT, size: SIZE, ...extra })],
  });
}

function bulletList(items) {
  if (!items.length) return [body("None mentioned.", { italics: true, color: "666666" })];
  return items.map(
    (text) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text, font: FONT, size: SIZE })],
      }),
  );
}

const COLUMN_WIDTHS = [4600, 2380, 2380]; // adds up to 9360 DXA (6.5 inches)

function cell(text, width, { header = false } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    shading: header
      ? { type: ShadingType.CLEAR, fill: "E6EAFF", color: "auto" }
      : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text, font: FONT, size: SIZE, bold: header })],
      }),
    ],
  });
}

function actionTable(items) {
  if (!items.length) return [body("None mentioned.", { italics: true, color: "666666" })];

  const headerRow = new TableRow({
    tableHeader: true,
    children: ["Task", "Responsible", "Due date"].map((t, i) =>
      cell(t, COLUMN_WIDTHS[i], { header: true }),
    ),
  });

  const rows = items.map(
    (a) =>
      new TableRow({
        children: [
          cell(a.task || "-", COLUMN_WIDTHS[0]),
          cell(a.owner ?? "Unassigned", COLUMN_WIDTHS[1]),
          cell(a.due ?? "Not set", COLUMN_WIDTHS[2]),
        ],
      }),
  );

  return [
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: COLUMN_WIDTHS,
      rows: [headerRow, ...rows],
    }),
  ];
}



export async function buildMinutesDocx(minutes) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const doc = new Document({
    creator: "MoM Generator",
    title: "Minutes of the Meeting",
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [new TextRun({ text: "Minutes of the Meeting", bold: true, font: FONT })],
          }),
          body(`Generated on ${date}`, { color: "666666" }),

          heading("Summary"),
          body(minutes.summary || "No summary."),

          heading("Discussion points"),
          ...bulletList(minutes.discussion_points),

          heading("Decisions"),
          ...bulletList(minutes.decisions),

          heading("Action items"),
          ...actionTable(minutes.action_items),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}