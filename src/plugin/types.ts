// ---------------------------------------------------------------------------
// Core data-structure interfaces for the plugin layer
// ---------------------------------------------------------------------------

/** Language settings stored per-user. */
export interface PluginSettings {
  language: "zh-CN" | "en-US";
}

/** Root storage object persisted via figma.clientStorage. */
export interface PluginStorage {
  templates: Record<string, TemplateConfig>;
  templateInstanceMap: Record<string, string>;
  settings: PluginSettings;
}

/** Template kind discriminator. */
export type TemplateKind = "header" | "footer" | "custom";

/** Anchor-based placement modes. */
export type PlacementMode =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "custom";

/** Placement configuration for a template instance. */
export interface Placement {
  mode: PlacementMode;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
}

/** Which area the layout is relative to. */
export type LayoutArea = "safe-area" | "slide";

/** Margins defining the safe area insets. */
export interface SafeAreaMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Layout frame combining area type and safe-area margins. */
export interface LayoutFrame {
  area: LayoutArea;
  safeArea: SafeAreaMargins;
}

/** How page totals are determined. */
export type TotalMode = "auto" | "custom";

/** A single page-range entry for a template variable. */
export interface VariableRange {
  from: number;
  to: number;
  value: string;
  sourcePageId: string | null;
  sourcePageName: string;
}

/** A variable binding attached to a template. */
export interface TemplateVariable {
  id: string;
  name: string;
  path: number[] | null;
  nodeName: string;
  ranges: VariableRange[];
}

/** Full template configuration stored in PluginStorage.templates. */
export interface TemplateConfig {
  id: string;
  name: string;
  nodeId: string;
  pageId: string;
  templateKind: TemplateKind;
  position: { x: number; y: number };
  layoutFrame: LayoutFrame;
  placement: Placement;
  indicatorPath: number[] | null;
  pageFormat: string;
  totalMode: TotalMode;
  customTotal: number | null;
  pageNumberStart: number;
  excludedPageIds: string[];
  variables: TemplateVariable[];
  createdAt: number;
}

// ── Academic Node Kind Registry ──────────────────────────────────────────

/** All academic node kinds managed by this plugin — single source of truth. */
export const AcademicNodeKind = {
  Equation: "equation",
  Figure: "figure",
  Table: "table",
  Theorem: "theorem",
  Crossref: "crossref",
  Citation: "citation",
  Chart: "chart",
  Subfigure: "subfigure",
  Appendix: "appendix",
  AppendixLink: "appendix-link",
  SlideTemplate: "slide-template",
} as const;

export type AcademicNodeKindValue = typeof AcademicNodeKind[keyof typeof AcademicNodeKind];

/** Runtime set of all valid academic node kinds. */
export const ACADEMIC_NODE_KINDS = new Set<string>(Object.values(AcademicNodeKind));

/** Normalized equation insert/update payload. */
export interface EquationPayload {
  latex: string;
  svgMarkup: string;
  displayMode: "inline" | "display";
  fontSize: number;
  color: string;
}

/** Lightweight serialized representation of a Figma node. */
export interface SerializedNode {
  id: string;
  name: string;
  type: string;
  children?: SerializedNode[];
}
