// ---------------------------------------------------------------------------
// Slide Template Library — pre-built academic slide layouts
// ---------------------------------------------------------------------------

import { postError } from "./errors";

import { AcademicNodeKind } from "./types";
export const SLIDE_TEMPLATE_KIND = AcademicNodeKind.SlideTemplate;

const SLIDE_W = 1280;
const SLIDE_H = 720;

// ── Template catalog ────────────────────────────────────────────────────────

export const SLIDE_TEMPLATE_TYPES: { id: string; name: string; description: string }[] = [
  { id: "title",       name: "Title Slide",           description: "Large centered title, subtitle, author, and affiliation" },
  { id: "agenda",      name: "Agenda / Outline",      description: "Numbered list of agenda items with accent line" },
  { id: "section",     name: "Section Divider",        description: "Bold section number and title on dark background" },
  { id: "two-column",  name: "Two-Column Content",    description: "Side-by-side columns for comparison content" },
  { id: "result",      name: "Result Highlight",       description: "Three metric cards showcasing key results" },
  { id: "pipeline",    name: "Method Pipeline",        description: "Horizontal step-by-step process flow" },
  { id: "thankyou",    name: "Thank You / Q&A",        description: "Closing slide with contact information" },
  { id: "table",       name: "Comparison Table",       description: "Grid table with header row and highlighted best cell" },
];

// ── Shared helpers ──────────────────────────────────────────────────────────

async function loadFonts(): Promise<void> {
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
}

function solidFill(r: number, g: number, b: number, opacity?: number): SolidPaint {
  const paint: SolidPaint = { type: "SOLID", color: { r, g, b } };
  if (opacity != null) (paint as any).opacity = opacity;
  return paint;
}

function createSlideFrame(name: string): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(SLIDE_W, SLIDE_H);
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisAlignItems = "CENTER";
  frame.counterAxisAlignItems = "CENTER";
  frame.itemSpacing = 0;
  frame.paddingTop = 0;
  frame.paddingBottom = 0;
  frame.paddingLeft = 0;
  frame.paddingRight = 0;
  frame.fills = [solidFill(1, 1, 1)];
  frame.clipsContent = true;
  return frame;
}

function markSlideTemplate(node: FrameNode, templateType: string): void {
  node.setPluginData("managedByAcademicSlides", "true");
  node.setPluginData("academicNodeKind", SLIDE_TEMPLATE_KIND);
  node.setPluginData("slideTemplateType", templateType);
}

function makeText(
  chars: string,
  style: "Bold" | "Semi Bold" | "Regular",
  size: number,
  fill: SolidPaint,
): TextNode {
  const t = figma.createText();
  t.fontName = { family: "Inter", style };
  t.fontSize = size;
  t.fills = [fill];
  t.characters = chars;
  t.textAutoResize = "HEIGHT";
  return t;
}

// ── 1. Title Slide ──────────────────────────────────────────────────────────

async function buildTitleSlide(): Promise<FrameNode> {
  await loadFonts();
  const slide = createSlideFrame("Title Slide");
  slide.primaryAxisAlignItems = "CENTER";
  slide.counterAxisAlignItems = "CENTER";
  slide.itemSpacing = 16;
  slide.paddingTop = 120;
  slide.paddingBottom = 120;
  slide.paddingLeft = 120;
  slide.paddingRight = 120;

  const title = makeText("Presentation Title", "Bold", 48, solidFill(0.1, 0.1, 0.12));
  title.textAlignHorizontal = "CENTER";
  title.layoutAlign = "STRETCH";
  slide.appendChild(title);

  const subtitle = makeText("A Subtitle or Conference Name", "Regular", 24, solidFill(0.4, 0.42, 0.45));
  subtitle.textAlignHorizontal = "CENTER";
  subtitle.layoutAlign = "STRETCH";
  slide.appendChild(subtitle);

  // Spacer
  const spacer = figma.createFrame();
  spacer.name = "Spacer";
  spacer.resize(10, 32);
  spacer.fills = [];
  slide.appendChild(spacer);

  const author = makeText("Author Name", "Regular", 18, solidFill(0.25, 0.27, 0.3));
  author.textAlignHorizontal = "CENTER";
  author.layoutAlign = "STRETCH";
  slide.appendChild(author);

  const affiliation = makeText("University / Lab  |  March 2026", "Regular", 14, solidFill(0.55, 0.57, 0.6));
  affiliation.textAlignHorizontal = "CENTER";
  affiliation.layoutAlign = "STRETCH";
  slide.appendChild(affiliation);

  markSlideTemplate(slide, "title");
  return slide;
}

// ── 2. Agenda / Outline ─────────────────────────────────────────────────────

async function buildAgendaSlide(): Promise<FrameNode> {
  await loadFonts();
  const slide = createSlideFrame("Agenda Slide");
  slide.primaryAxisAlignItems = "MIN";
  slide.counterAxisAlignItems = "MIN";
  slide.itemSpacing = 32;
  slide.paddingTop = 64;
  slide.paddingBottom = 64;
  slide.paddingLeft = 96;
  slide.paddingRight = 96;

  const heading = makeText("Outline", "Bold", 32, solidFill(0.1, 0.1, 0.12));
  heading.layoutAlign = "STRETCH";
  slide.appendChild(heading);

  // Content row: accent line + list
  const row = figma.createFrame();
  row.name = "Content Row";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisAlignItems = "MIN";
  row.counterAxisAlignItems = "MIN";
  row.itemSpacing = 24;
  row.fills = [];
  row.layoutAlign = "STRETCH";
  row.layoutGrow = 1;
  slide.appendChild(row);

  // Left accent line
  const accent = figma.createRectangle();
  accent.name = "Accent Line";
  accent.resize(3, 320);
  accent.fills = [solidFill(0.231, 0.510, 0.965)];
  accent.layoutAlign = "STRETCH";
  row.appendChild(accent);

  // List container
  const list = figma.createFrame();
  list.name = "Agenda Items";
  list.layoutMode = "VERTICAL";
  list.primaryAxisAlignItems = "MIN";
  list.counterAxisAlignItems = "MIN";
  list.itemSpacing = 20;
  list.fills = [];
  list.layoutGrow = 1;
  list.layoutAlign = "STRETCH";
  row.appendChild(list);

  const items = [
    "Introduction & Motivation",
    "Related Work",
    "Proposed Method",
    "Experiments & Results",
    "Conclusion & Future Work",
  ];
  for (let i = 0; i < items.length; i++) {
    const item = makeText(`${i + 1}.  ${items[i]}`, "Regular", 20, solidFill(0.18, 0.2, 0.22));
    item.layoutAlign = "STRETCH";
    list.appendChild(item);
  }

  markSlideTemplate(slide, "agenda");
  return slide;
}

// ── 3. Section Divider ──────────────────────────────────────────────────────

async function buildSectionSlide(): Promise<FrameNode> {
  await loadFonts();
  const slide = createSlideFrame("Section Divider");
  slide.fills = [solidFill(0.118, 0.161, 0.231)]; // #1E293B
  slide.primaryAxisAlignItems = "CENTER";
  slide.counterAxisAlignItems = "CENTER";
  slide.itemSpacing = 24;
  slide.paddingTop = 80;
  slide.paddingBottom = 80;
  slide.paddingLeft = 120;
  slide.paddingRight = 120;

  const bigNum = makeText("01", "Bold", 72, solidFill(1, 1, 1));
  (bigNum.fills as SolidPaint[])[0] = { ...solidFill(1, 1, 1), opacity: 0.15 } as SolidPaint;
  bigNum.textAlignHorizontal = "CENTER";
  bigNum.layoutAlign = "STRETCH";
  slide.appendChild(bigNum);

  const sectionTitle = makeText("Section Title", "Bold", 36, solidFill(1, 1, 1));
  sectionTitle.textAlignHorizontal = "CENTER";
  sectionTitle.layoutAlign = "STRETCH";
  slide.appendChild(sectionTitle);

  // Horizontal rule
  const rule = figma.createRectangle();
  rule.name = "Divider";
  rule.resize(200, 2);
  rule.fills = [solidFill(1, 1, 1, 0.3)];
  slide.appendChild(rule);

  markSlideTemplate(slide, "section");
  return slide;
}

// ── 4. Two-Column Content ───────────────────────────────────────────────────

async function buildTwoColumnSlide(): Promise<FrameNode> {
  await loadFonts();
  const slide = createSlideFrame("Two-Column Content");
  slide.primaryAxisAlignItems = "MIN";
  slide.counterAxisAlignItems = "MIN";
  slide.itemSpacing = 32;
  slide.paddingTop = 56;
  slide.paddingBottom = 56;
  slide.paddingLeft = 72;
  slide.paddingRight = 72;

  const title = makeText("Slide Title", "Bold", 28, solidFill(0.1, 0.1, 0.12));
  title.layoutAlign = "STRETCH";
  slide.appendChild(title);

  // Columns container
  const cols = figma.createFrame();
  cols.name = "Columns";
  cols.layoutMode = "HORIZONTAL";
  cols.primaryAxisAlignItems = "MIN";
  cols.counterAxisAlignItems = "MIN";
  cols.itemSpacing = 32;
  cols.fills = [];
  cols.layoutAlign = "STRETCH";
  cols.layoutGrow = 1;
  slide.appendChild(cols);

  for (const label of ["Left Column", "Right Column"]) {
    const col = figma.createFrame();
    col.name = label;
    col.layoutMode = "VERTICAL";
    col.primaryAxisAlignItems = "MIN";
    col.counterAxisAlignItems = "MIN";
    col.itemSpacing = 12;
    col.fills = [];
    col.layoutGrow = 1;
    col.layoutAlign = "STRETCH";
    cols.appendChild(col);

    const sub = makeText(label, "Semi Bold", 18, solidFill(0.15, 0.16, 0.18));
    sub.layoutAlign = "STRETCH";
    col.appendChild(sub);

    const body = makeText(
      "Replace this placeholder with your content. Add bullet points, descriptions, or any supporting text here.",
      "Regular", 14, solidFill(0.3, 0.32, 0.35),
    );
    body.layoutAlign = "STRETCH";
    col.appendChild(body);
  }

  markSlideTemplate(slide, "two-column");
  return slide;
}

// ── 5. Result Highlight ─────────────────────────────────────────────────────

async function buildResultSlide(): Promise<FrameNode> {
  await loadFonts();
  const slide = createSlideFrame("Result Highlight");
  slide.primaryAxisAlignItems = "MIN";
  slide.counterAxisAlignItems = "CENTER";
  slide.itemSpacing = 48;
  slide.paddingTop = 64;
  slide.paddingBottom = 64;
  slide.paddingLeft = 72;
  slide.paddingRight = 72;

  const title = makeText("Key Results", "Bold", 28, solidFill(0.1, 0.1, 0.12));
  title.layoutAlign = "STRETCH";
  title.textAlignHorizontal = "CENTER";
  slide.appendChild(title);

  // Cards row
  const row = figma.createFrame();
  row.name = "Metric Cards";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisAlignItems = "CENTER";
  row.counterAxisAlignItems = "MIN";
  row.itemSpacing = 32;
  row.fills = [];
  row.layoutAlign = "STRETCH";
  slide.appendChild(row);

  const metrics = [
    { value: "94.2%", label: "Top-1 Accuracy" },
    { value: "2.3x", label: "Speedup" },
    { value: "12M", label: "Parameters" },
  ];

  for (const m of metrics) {
    const card = figma.createFrame();
    card.name = `Card: ${m.label}`;
    card.layoutMode = "VERTICAL";
    card.primaryAxisAlignItems = "CENTER";
    card.counterAxisAlignItems = "CENTER";
    card.itemSpacing = 12;
    card.paddingTop = 40;
    card.paddingBottom = 40;
    card.paddingLeft = 24;
    card.paddingRight = 24;
    card.cornerRadius = 12;
    card.fills = [solidFill(0.96, 0.97, 0.99)];
    card.strokes = [solidFill(0.9, 0.91, 0.93)];
    card.strokeWeight = 1;
    card.layoutGrow = 1;
    card.layoutAlign = "STRETCH";
    row.appendChild(card);

    const num = makeText(m.value, "Bold", 36, solidFill(0.231, 0.510, 0.965));
    num.textAlignHorizontal = "CENTER";
    card.appendChild(num);

    const lbl = makeText(m.label, "Regular", 14, solidFill(0.4, 0.42, 0.45));
    lbl.textAlignHorizontal = "CENTER";
    card.appendChild(lbl);
  }

  markSlideTemplate(slide, "result");
  return slide;
}

// ── 6. Method Pipeline ──────────────────────────────────────────────────────

async function buildPipelineSlide(): Promise<FrameNode> {
  await loadFonts();
  const slide = createSlideFrame("Method Pipeline");
  slide.primaryAxisAlignItems = "MIN";
  slide.counterAxisAlignItems = "CENTER";
  slide.itemSpacing = 48;
  slide.paddingTop = 64;
  slide.paddingBottom = 64;
  slide.paddingLeft = 64;
  slide.paddingRight = 64;

  const title = makeText("Method Overview", "Bold", 28, solidFill(0.1, 0.1, 0.12));
  title.layoutAlign = "STRETCH";
  title.textAlignHorizontal = "CENTER";
  slide.appendChild(title);

  // Pipeline row
  const pipeline = figma.createFrame();
  pipeline.name = "Pipeline";
  pipeline.layoutMode = "HORIZONTAL";
  pipeline.primaryAxisAlignItems = "CENTER";
  pipeline.counterAxisAlignItems = "CENTER";
  pipeline.itemSpacing = 0;
  pipeline.fills = [];
  pipeline.layoutAlign = "STRETCH";
  slide.appendChild(pipeline);

  const steps = ["Input Data", "Encoder", "Transformer", "Decoder"];

  for (let i = 0; i < steps.length; i++) {
    // Step box
    const box = figma.createFrame();
    box.name = `Step: ${steps[i]}`;
    box.layoutMode = "VERTICAL";
    box.primaryAxisAlignItems = "CENTER";
    box.counterAxisAlignItems = "CENTER";
    box.itemSpacing = 8;
    box.paddingTop = 24;
    box.paddingBottom = 24;
    box.paddingLeft = 20;
    box.paddingRight = 20;
    box.cornerRadius = 10;
    box.fills = [solidFill(0.231, 0.510, 0.965, 0.08)];
    box.strokes = [solidFill(0.231, 0.510, 0.965, 0.3)];
    box.strokeWeight = 1;
    box.layoutGrow = 1;
    pipeline.appendChild(box);

    // Icon placeholder circle
    const icon = figma.createEllipse();
    icon.name = "Icon";
    icon.resize(36, 36);
    icon.fills = [solidFill(0.231, 0.510, 0.965, 0.15)];
    box.appendChild(icon);

    const label = makeText(steps[i], "Semi Bold", 14, solidFill(0.15, 0.16, 0.18));
    label.textAlignHorizontal = "CENTER";
    box.appendChild(label);

    // Arrow between steps
    if (i < steps.length - 1) {
      const arrow = makeText("\u2192", "Bold", 24, solidFill(0.4, 0.42, 0.45));
      arrow.textAlignHorizontal = "CENTER";
      arrow.name = "Arrow";
      pipeline.appendChild(arrow);
    }
  }

  markSlideTemplate(slide, "pipeline");
  return slide;
}

// ── 7. Thank You / Q&A ─────────────────────────────────────────────────────

async function buildThankYouSlide(): Promise<FrameNode> {
  await loadFonts();
  const slide = createSlideFrame("Thank You Slide");
  slide.primaryAxisAlignItems = "CENTER";
  slide.counterAxisAlignItems = "CENTER";
  slide.itemSpacing = 24;
  slide.paddingTop = 120;
  slide.paddingBottom = 120;
  slide.paddingLeft = 120;
  slide.paddingRight = 120;

  const heading = makeText("Thank You!", "Bold", 48, solidFill(0.1, 0.1, 0.12));
  heading.textAlignHorizontal = "CENTER";
  heading.layoutAlign = "STRETCH";
  slide.appendChild(heading);

  const sub = makeText("Questions & Discussion", "Regular", 24, solidFill(0.4, 0.42, 0.45));
  sub.textAlignHorizontal = "CENTER";
  sub.layoutAlign = "STRETCH";
  slide.appendChild(sub);

  // Spacer
  const spacer = figma.createFrame();
  spacer.name = "Spacer";
  spacer.resize(10, 24);
  spacer.fills = [];
  slide.appendChild(spacer);

  const email = makeText("email@university.edu", "Regular", 16, solidFill(0.231, 0.510, 0.965));
  email.textAlignHorizontal = "CENTER";
  email.layoutAlign = "STRETCH";
  slide.appendChild(email);

  const aff = makeText("Department of Computer Science, University", "Regular", 14, solidFill(0.55, 0.57, 0.6));
  aff.textAlignHorizontal = "CENTER";
  aff.layoutAlign = "STRETCH";
  slide.appendChild(aff);

  markSlideTemplate(slide, "thankyou");
  return slide;
}

// ── 8. Comparison Table ─────────────────────────────────────────────────────

async function buildTableSlide(): Promise<FrameNode> {
  await loadFonts();
  const slide = createSlideFrame("Comparison Table");
  slide.primaryAxisAlignItems = "MIN";
  slide.counterAxisAlignItems = "CENTER";
  slide.itemSpacing = 32;
  slide.paddingTop = 56;
  slide.paddingBottom = 56;
  slide.paddingLeft = 72;
  slide.paddingRight = 72;

  const title = makeText("Ablation Study", "Bold", 28, solidFill(0.1, 0.1, 0.12));
  title.layoutAlign = "STRETCH";
  title.textAlignHorizontal = "CENTER";
  slide.appendChild(title);

  // Table container
  const table = figma.createFrame();
  table.name = "Table";
  table.layoutMode = "VERTICAL";
  table.primaryAxisAlignItems = "MIN";
  table.counterAxisAlignItems = "MIN";
  table.itemSpacing = 0;
  table.fills = [];
  table.strokes = [solidFill(0.85, 0.86, 0.88)];
  table.strokeWeight = 1;
  table.cornerRadius = 8;
  table.clipsContent = true;
  table.layoutAlign = "STRETCH";
  slide.appendChild(table);

  const headers = ["Method", "Accuracy", "F1-Score", "Latency (ms)"];
  const rows = [
    ["Baseline", "87.3%", "85.1%", "42"],
    ["+ Augmentation", "90.1%", "88.4%", "44"],
    ["+ Pre-training", "92.8%", "91.2%", "46"],
    ["Ours (full)", "94.2%", "93.0%", "38"],
  ];
  const bestRow = 3;
  const bestCol = 1; // "Accuracy" column in the best row

  // Header row
  const headerRow = figma.createFrame();
  headerRow.name = "Header Row";
  headerRow.layoutMode = "HORIZONTAL";
  headerRow.primaryAxisAlignItems = "CENTER";
  headerRow.counterAxisAlignItems = "CENTER";
  headerRow.itemSpacing = 0;
  headerRow.fills = [solidFill(0.94, 0.95, 0.96)];
  headerRow.layoutAlign = "STRETCH";
  headerRow.resize(SLIDE_W - 144, 48);
  table.appendChild(headerRow);

  for (const h of headers) {
    const cell = figma.createFrame();
    cell.name = `Header: ${h}`;
    cell.layoutMode = "HORIZONTAL";
    cell.primaryAxisAlignItems = "CENTER";
    cell.counterAxisAlignItems = "CENTER";
    cell.paddingLeft = 16;
    cell.paddingRight = 16;
    cell.paddingTop = 12;
    cell.paddingBottom = 12;
    cell.fills = [];
    cell.layoutGrow = 1;
    cell.layoutAlign = "STRETCH";
    headerRow.appendChild(cell);

    const txt = makeText(h, "Semi Bold", 14, solidFill(0.18, 0.2, 0.22));
    cell.appendChild(txt);
  }

  // Data rows
  for (let ri = 0; ri < rows.length; ri++) {
    const dataRow = figma.createFrame();
    dataRow.name = `Row ${ri + 1}`;
    dataRow.layoutMode = "HORIZONTAL";
    dataRow.primaryAxisAlignItems = "CENTER";
    dataRow.counterAxisAlignItems = "CENTER";
    dataRow.itemSpacing = 0;
    dataRow.fills = ri % 2 === 1 ? [solidFill(0.98, 0.98, 0.99)] : [];
    dataRow.layoutAlign = "STRETCH";
    dataRow.resize(SLIDE_W - 144, 44);
    table.appendChild(dataRow);

    for (let ci = 0; ci < rows[ri].length; ci++) {
      const cell = figma.createFrame();
      cell.name = `Cell ${ri}-${ci}`;
      cell.layoutMode = "HORIZONTAL";
      cell.primaryAxisAlignItems = "CENTER";
      cell.counterAxisAlignItems = "CENTER";
      cell.paddingLeft = 16;
      cell.paddingRight = 16;
      cell.paddingTop = 10;
      cell.paddingBottom = 10;
      cell.layoutGrow = 1;
      cell.layoutAlign = "STRETCH";

      // Highlight best cell
      if (ri === bestRow && ci === bestCol) {
        cell.fills = [solidFill(0.85, 0.96, 0.87)]; // light green
      } else {
        cell.fills = [];
      }

      dataRow.appendChild(cell);

      const isBestRow = ri === bestRow;
      const style = isBestRow ? "Semi Bold" as const : "Regular" as const;
      const txt = makeText(rows[ri][ci], style, 14, solidFill(0.22, 0.24, 0.27));
      cell.appendChild(txt);
    }
  }

  markSlideTemplate(slide, "table");
  return slide;
}

// ── Template builder map ────────────────────────────────────────────────────

const builders: Record<string, () => Promise<FrameNode>> = {
  "title": buildTitleSlide,
  "agenda": buildAgendaSlide,
  "section": buildSectionSlide,
  "two-column": buildTwoColumnSlide,
  "result": buildResultSlide,
  "pipeline": buildPipelineSlide,
  "thankyou": buildThankYouSlide,
  "table": buildTableSlide,
};

// ── Main handler ────────────────────────────────────────────────────────────

export async function handleInsertSlideTemplate(message: any): Promise<void> {
  const templateType = String(message.templateType || "").trim();
  const builder = builders[templateType];
  if (!builder) {
    postError(`Unknown template type: ${templateType}`, "errorUnknownTemplate");
    return;
  }

  const frame = await builder();

  // Place on current page at viewport center
  const center = figma.viewport.center;
  frame.x = Math.round(center.x - SLIDE_W / 2);
  frame.y = Math.round(center.y - SLIDE_H / 2);

  figma.currentPage.appendChild(frame);
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);

  figma.ui.postMessage({
    type: "slide-template-inserted",
    templateType,
    nodeId: frame.id,
    name: frame.name,
  });
}
