// ---------------------------------------------------------------------------
// Export to LaTeX/Beamer — generate a compilable .tex file from the deck
// ---------------------------------------------------------------------------

import { postError } from "./errors";
import { getPluginData } from "./storage";
import { walkScene, isTextNode, loadTargetIfNeeded } from "./nodes";
import { getAllTargets, ensureAllPagesLoaded } from "./slides";
import type { ReferenceEntry } from "./references";

const REF_STORAGE_KEY = "academic-references";

// ── LaTeX escape ─────────────────────────────────────────────────────────

const LATEX_SPECIAL = /[&%$#_{}~^\\]/g;
const LATEX_ESCAPE_MAP: Record<string, string> = {
  "&": "\\&", "%": "\\%", "$": "\\$", "#": "\\#",
  "_": "\\_", "{": "\\{", "}": "\\}", "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}", "\\": "\\textbackslash{}",
};

export function escapeLatex(str: string): string {
  return str.replace(LATEX_SPECIAL, (ch) => LATEX_ESCAPE_MAP[ch] || ch);
}

// ── Theorem type → LaTeX environment mapping ─────────────────────────────

const THEOREM_ENV: Record<string, string> = {
  theorem: "theorem",
  lemma: "lemma",
  definition: "definition",
  proof: "proof",
  corollary: "corollary",
  proposition: "proposition",
  remark: "remark",
  example: "example",
};

// ── Crossref kind → label prefix ─────────────────────────────────────────

const REF_PREFIX: Record<string, string> = {
  equation: "eq",
  figure: "fig",
  table: "tab",
  theorem: "thm",
};

// ── BibTeX generation ────────────────────────────────────────────────────

export function generateBibContent(refs: ReferenceEntry[]): string {
  const lines: string[] = [];
  for (const ref of refs) {
    if (ref.raw) {
      // Use the original BibTeX entry if available
      lines.push(ref.raw);
      lines.push("");
    } else {
      // Construct a minimal BibTeX entry
      const type = ref.type || "article";
      lines.push(`@${type}{${ref.key},`);
      if (ref.authors) lines.push(`  author = {${ref.authors}},`);
      if (ref.title) lines.push(`  title = {${ref.title}},`);
      if (ref.year) lines.push(`  year = {${ref.year}},`);
      if (ref.venue) lines.push(`  journal = {${ref.venue}},`);
      if (ref.doi) lines.push(`  doi = {${ref.doi}},`);
      if (ref.url) lines.push(`  url = {${ref.url}},`);
      lines.push("}");
      lines.push("");
    }
  }
  return lines.join("\n");
}

// ── Node → LaTeX rendering ───────────────────────────────────────────────

function renderNode(node: any, depth: number = 0): string {
  if (!node || depth > 32) return "";

  const kind = getPluginData(node, "academicNodeKind");

  // ── Academic nodes ──
  if (kind === "equation") {
    const latex = getPluginData(node, "equationLatex");
    if (!latex) return "";
    const mode = getPluginData(node, "equationDisplayMode");
    if (mode === "display") {
      const label = getPluginData(node, "equationNumberLabelId") ? `\\label{eq:${node.id}}` : "";
      return `\\begin{equation}${label}\n  ${latex}\n\\end{equation}`;
    }
    return `$${latex}$`;
  }

  if (kind === "figure") {
    const caption = getPluginData(node, "figureCaption") || "";
    const lines: string[] = [];
    lines.push("\\begin{figure}[htbp]");
    lines.push("  \\centering");
    // Extract subfigures or placeholder image
    const subfigs = collectSubfigureChildren(node);
    if (subfigs.length > 0) {
      for (const sf of subfigs) {
        const sfCaption = getPluginData(sf, "subfigureCaption") || "";
        lines.push(`  \\begin{subfigure}{0.45\\textwidth}`);
        lines.push(`    \\centering`);
        lines.push(`    \\includegraphics[width=\\linewidth]{figure-${sf.id}.png}`);
        if (sfCaption) lines.push(`    \\caption{${escapeLatex(sfCaption)}}`);
        lines.push(`  \\end{subfigure}`);
      }
    } else {
      lines.push(`  \\includegraphics[width=0.8\\textwidth]{figure-${node.id}.png}`);
    }
    if (caption) lines.push(`  \\caption{${escapeLatex(caption)}}`);
    lines.push(`  \\label{fig:${node.id}}`);
    lines.push("\\end{figure}");
    return lines.join("\n");
  }

  if (kind === "subfigure") {
    // Subfigures are handled inside their parent figure
    return "";
  }

  if (kind === "theorem") {
    const type = getPluginData(node, "theoremType") || "theorem";
    const caption = getPluginData(node, "theoremCaption") || "";
    const env = THEOREM_ENV[type] || "theorem";
    const title = getPluginData(node, "theoremTitle");
    const titleOpt = title ? `[${escapeLatex(title)}]` : "";
    const lines: string[] = [];
    lines.push(`\\begin{${env}}${titleOpt}`);
    if (caption) {
      lines.push(`  ${escapeLatex(caption)}`);
    } else {
      // Try to extract body text from children
      const bodyText = extractTextContent(node);
      if (bodyText) lines.push(`  ${escapeLatex(bodyText)}`);
    }
    lines.push(`\\end{${env}}`);
    return lines.join("\n");
  }

  if (kind === "table") {
    const caption = getPluginData(node, "tableCaption") || "";
    const rows = extractTableRows(node);
    const lines: string[] = [];
    lines.push("\\begin{table}[htbp]");
    lines.push("  \\centering");
    if (caption) lines.push(`  \\caption{${escapeLatex(caption)}}`);
    lines.push(`  \\label{tab:${node.id}}`);
    if (rows.length > 0) {
      const cols = rows[0].length;
      lines.push(`  \\begin{tabular}{${"l".repeat(cols)}}`);
      lines.push("    \\toprule");
      for (let ri = 0; ri < rows.length; ri++) {
        const cells = rows[ri].map((c: string) => escapeLatex(c));
        lines.push(`    ${cells.join(" & ")} \\\\`);
        if (ri === 0 && rows.length > 1) lines.push("    \\midrule");
      }
      lines.push("    \\bottomrule");
      lines.push("  \\end{tabular}");
    }
    lines.push("\\end{table}");
    return lines.join("\n");
  }

  if (kind === "citation") {
    const citKeys = getPluginData(node, "citationKeys");
    if (citKeys) return `\\cite{${citKeys}}`;
    return "";
  }

  if (kind === "crossref") {
    const targetKind = getPluginData(node, "crossrefTargetKind") || "figure";
    const prefix = REF_PREFIX[targetKind] || "ref";
    const targetId = getPluginData(node, "crossrefTargetId");
    if (targetId) return `\\ref{${prefix}:${targetId}}`;
    return "";
  }

  if (kind === "appendix" || kind === "appendix-link" || kind === "slide-template" || kind === "chart") {
    // Skip non-text academic nodes
    return "";
  }

  // ── Plain text node ──
  if (isTextNode(node)) {
    const text = (node as any).characters || "";
    if (!text.trim()) return "";
    return escapeLatex(text);
  }

  // ── Container: recurse into children ──
  if ("children" in node) {
    const parts: string[] = [];
    for (const child of (node as any).children) {
      const rendered = renderNode(child, depth + 1);
      if (rendered) parts.push(rendered);
    }
    return parts.join("\n");
  }

  return "";
}

// ── Helpers ──────────────────────────────────────────────────────────────

function collectSubfigureChildren(figureNode: any): any[] {
  const subs: any[] = [];
  if (!("children" in figureNode)) return subs;
  for (const child of (figureNode as any).children) {
    if (getPluginData(child, "academicNodeKind") === "subfigure") {
      subs.push(child);
    }
    // Also check one level deeper (subfigures may be in a grid frame)
    if ("children" in child) {
      for (const gc of (child as any).children) {
        if (getPluginData(gc, "academicNodeKind") === "subfigure") {
          subs.push(gc);
        }
      }
    }
  }
  return subs;
}

function extractTextContent(node: any): string {
  const parts: string[] = [];
  walkScene(node, (n: any) => {
    if (isTextNode(n)) {
      const text = (n as any).characters || "";
      if (text.trim()) parts.push(text.trim());
    }
  });
  return parts.join(" ");
}

function extractTableRows(tableNode: any): string[][] {
  const rows: string[][] = [];
  if (!("children" in tableNode)) return rows;

  for (const child of (tableNode as any).children) {
    // Skip caption nodes
    if (child.name === "Caption" || getPluginData(child, "academicNodeKind")) continue;

    if ("children" in child) {
      const row: string[] = [];
      for (const cell of (child as any).children) {
        const text = extractTextContent(cell);
        row.push(text);
      }
      if (row.length > 0) rows.push(row);
    }
  }
  return rows;
}

function getFrameTitle(slideNode: any): string {
  // Try to find a title-like text node (first large text or named "Title")
  let title = "";
  if ("children" in slideNode) {
    for (const child of (slideNode as any).children) {
      if (child.name === "Title" && isTextNode(child)) {
        title = (child as any).characters || "";
        break;
      }
      // First text node with fontSize >= 24 is likely a title
      if (isTextNode(child)) {
        const fs = (child as any).fontSize;
        if (typeof fs === "number" && fs >= 24 && !title) {
          title = (child as any).characters || "";
        }
      }
    }
  }
  return title;
}

// ── Slide renderer ───────────────────────────────────────────────────────

function renderSlide(target: any, index: number): string {
  const title = getFrameTitle(target);
  const escapedTitle = title ? escapeLatex(title) : "";

  const lines: string[] = [];
  lines.push(`% --- Slide ${index + 1} ---`);

  if (index === 0 && !title) {
    // First slide without title → title page
    lines.push("\\begin{frame}");
    lines.push("  \\titlepage");
    lines.push("\\end{frame}");
    return lines.join("\n");
  }

  lines.push(`\\begin{frame}{${escapedTitle}}`);

  // Render children (skip the title node itself to avoid duplication)
  if ("children" in target) {
    for (const child of (target as any).children) {
      // Skip if this is the title node we already extracted
      if (isTextNode(child) && (child as any).characters === title && title) continue;

      const rendered = renderNode(child);
      if (rendered) lines.push(rendered);
    }
  }

  lines.push("\\end{frame}");
  return lines.join("\n");
}

// ── Beamer document generation ───────────────────────────────────────────

function generateBeamerSource(targets: any[], hasRefs: boolean): string {
  const preamble = [
    "\\documentclass{beamer}",
    "\\usetheme{default}",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage{amsmath,amssymb,amsthm}",
    "\\usepackage{graphicx}",
    "\\usepackage{subcaption}",
    "\\usepackage{booktabs}",
    "\\usepackage{hyperref}",
    "",
    "% Theorem environments",
    "\\newtheorem{lemma}{Lemma}",
    "\\newtheorem{definition}{Definition}",
    "\\newtheorem{corollary}{Corollary}",
    "\\newtheorem{proposition}{Proposition}",
    "\\newtheorem{remark}{Remark}",
    "\\newtheorem{example2}{Example}",
    "",
    "\\title{Presentation}",
    "\\author{}",
    "\\date{\\today}",
    "",
    "\\begin{document}",
    "",
  ];

  const slides: string[] = [];
  let appendixStarted = false;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];

    // Check for appendix divider
    let hasAppendixDivider = false;
    walkScene(target, (n: any) => {
      if (getPluginData(n, "academicNodeKind") === "appendix" && getPluginData(n, "appendixRoot") === "true") {
        hasAppendixDivider = true;
      }
    });

    if (hasAppendixDivider && !appendixStarted) {
      slides.push("");
      slides.push("\\appendix");
      appendixStarted = true;
    }

    slides.push(renderSlide(target, i));
    slides.push("");
  }

  // Bibliography frame
  if (hasRefs) {
    slides.push("\\begin{frame}[allowframebreaks]{References}");
    slides.push("  \\bibliographystyle{plain}");
    slides.push("  \\bibliography{references}");
    slides.push("\\end{frame}");
    slides.push("");
  }

  const ending = ["\\end{document}", ""];

  return [...preamble, ...slides, ...ending].join("\n");
}

// ── Main handler ─────────────────────────────────────────────────────────

export async function handleExportBeamer(_message: any): Promise<void> {
  try {
    await ensureAllPagesLoaded();
    const targets = getAllTargets();

    // Load all targets in parallel
    await Promise.all(targets.map((t) => loadTargetIfNeeded(t)));

    // Load references
    const refs: ReferenceEntry[] = (await figma.clientStorage.getAsync(REF_STORAGE_KEY)) || [];
    const hasRefs = refs.length > 0;

    // Generate .tex content
    const tex = generateBeamerSource(targets, hasRefs);

    // Generate .bib content
    const bib = hasRefs ? generateBibContent(refs) : "";

    figma.ui.postMessage({
      type: "export-complete",
      tex,
      bib,
      slideCount: targets.length,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    postError(err.message || "Export failed", "errorExportFailed");
  }
}
