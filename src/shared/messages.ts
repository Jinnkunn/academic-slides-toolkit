// ---------------------------------------------------------------------------
// Plugin  ←→  UI  message types
// ---------------------------------------------------------------------------

// ── Messages sent FROM the UI TO the plugin (figma.ui.onmessage) ──────────

export type GetSettingsMessage = { type: "get-settings" };

export type SaveSettingsMessage = {
  type: "save-settings";
  settings?: { language?: string };
};

export type GetSelectionMessage = { type: "get-selection" };

export type GetPagesMessage = {
  type: "get-pages";
  templateId?: string;
};

export type InsertEquationMessage = {
  type: "insert-equation";
  latex?: string;
  svgMarkup?: string;
  displayMode?: "inline" | "display";
  fontSize?: number;
  color?: string;
};

export type UpdateEquationMessage = {
  type: "update-equation";
  nodeId?: string;
  latex?: string;
  svgMarkup?: string;
  displayMode?: "inline" | "display";
  fontSize?: number;
  color?: string;
};

export type DeleteEquationMessage = {
  type: "delete-equation";
  nodeId?: string;
};

export type ApplyEquationNumberingMessage = {
  type: "apply-equation-numbering";
  scope?: "current" | "all";
  style?: string;
};

export type ClearEquationNumberingMessage = {
  type: "clear-equation-numbering";
  scope?: "current" | "all";
};

export type SetTemplateMessage = {
  type: "set-template";
  nodeId: string;
  templateId?: string;
  templateKind?: string;
  name?: string;
  pageIndicatorId?: string;
  totalMode?: "auto" | "custom";
  customTotal?: number | null;
  pageFormat?: string;
  layoutArea?: string;
  safeArea?: { top?: number; right?: number; bottom?: number; left?: number };
  placementMode?: string;
};

export type UpdateTemplateConfigMessage = {
  type: "update-template-config";
  templateId: string;
  excludedPageIds?: string[];
  pageNumberStart?: number;
};

export type ApplyToAllMessage = {
  type: "apply-to-all";
  templateId: string;
  overwrite?: boolean;
  pageNumberStart?: number;
};

export type SyncAllMessage = {
  type: "sync-all";
  templateId: string;
  pageNumberStart?: number;
};

export type RemoveTemplateInstancesMessage = {
  type: "remove-template-instances";
  templateId: string;
};

export type GetTemplatesMessage = { type: "get-templates" };

export type DeleteTemplateMessage = {
  type: "delete-template";
  templateId: string;
};

export type CheckVariableCandidateMessage = {
  type: "check-variable-candidate";
  templateId: string;
};

export type SaveVariablesMessage = {
  type: "save-variables";
  templateId: string;
  variables: any[];
};

// ── Figure messages ──────────────────────────────────────────────────────
export type InsertFigureMessage = { type: "insert-figure"; imageBytes?: Uint8Array; caption?: string; labelPrefix?: string; width?: number; height?: number };
export type UpdateFigureCaptionMessage = { type: "update-figure-caption"; nodeId?: string; caption?: string; labelPrefix?: string };
export type DeleteFigureMessage = { type: "delete-figure"; nodeId?: string };
export type ApplyFigureNumberingMessage = { type: "apply-figure-numbering"; scope?: string };

// ── Theorem messages ─────────────────────────────────────────────────────
export type InsertTheoremMessage = { type: "insert-theorem"; theoremType?: string; caption?: string; labelPrefix?: string };
export type UpdateTheoremMessage = { type: "update-theorem"; nodeId?: string; theoremType?: string; caption?: string; labelPrefix?: string };
export type DeleteTheoremMessage = { type: "delete-theorem"; nodeId?: string };
export type ApplyTheoremNumberingMessage = { type: "apply-theorem-numbering"; scope?: string };

// ── Table messages ───────────────────────────────────────────────────────
export type InsertTableMessage = { type: "insert-table"; rows?: number; cols?: number; data?: string[][]; caption?: string; labelPrefix?: string };
export type UpdateTableCaptionMessage = { type: "update-table-caption"; nodeId?: string; caption?: string; labelPrefix?: string };
export type DeleteTableMessage = { type: "delete-table"; nodeId?: string };
export type ApplyTableNumberingMessage = { type: "apply-table-numbering"; scope?: string };

// ── Cross-reference messages ─────────────────────────────────────────────
export type InsertCrossrefMessage = { type: "insert-crossref"; targetKind?: string; targetIndex?: number };
export type UpdateAllCrossrefsMessage = { type: "update-all-crossrefs"; scope?: string };

// ── Consistency messages ─────────────────────────────────────────────────
export type RunConsistencyCheckMessage = { type: "run-consistency-check"; scope?: string };
export type AutoFixIssueMessage = { type: "auto-fix-issue"; issue?: any };
export type AutoFixAllMessage = { type: "auto-fix-all"; issues?: any[] };
export type FocusNodeMessage = { type: "focus-node"; nodeId?: string };

// ── Reference & Citation messages ────────────────────────────────────────
export type GetReferencesMessage = { type: "get-references" };
export type AddReferenceMessage = { type: "add-reference"; reference?: any };
export type ImportBibtexMessage = { type: "import-bibtex"; bibtex?: string };
export type DeleteReferenceMessage = { type: "delete-reference"; referenceId?: string };
export type InsertCitationMessage = { type: "insert-citation"; referenceIds?: string[] };
export type UpdateAllCitationsMessage = { type: "update-all-citations"; scope?: string };
export type GenerateBibSlideMessage = { type: "generate-bib-slide"; style?: string };

// ── Chart messages ───────────────────────────────────────────────────────
export type InsertChartMessage = { type: "insert-chart"; svgMarkup?: string; chartType?: string };
export type DeleteChartMessage = { type: "delete-chart"; nodeId?: string };

// ── Subfigure messages ───────────────────────────────────────────────────
export type InsertSubfigureMessage = { type: "insert-subfigure"; imageBytes?: Uint8Array; parentNodeId?: string; caption?: string };
export type UpdateSubfigureMessage = { type: "update-subfigure"; nodeId?: string; caption?: string };
export type DeleteSubfigureMessage = { type: "delete-subfigure"; nodeId?: string };
export type ApplySubfigureNumberingMessage = { type: "apply-subfigure-numbering"; scope?: string };

// ── Slide Template messages ──────────────────────────────────────────────
export type InsertSlideTemplateMessage = { type: "insert-slide-template"; templateName?: string; layoutData?: any };

// ── Speaker Cue messages ─────────────────────────────────────────────────
export type GetSpeakerCuesMessage = { type: "get-speaker-cues" };
export type SetSpeakerCueMessage = { type: "set-speaker-cue"; slideId?: string; cue?: string; duration?: number };
export type ClearAllCuesMessage = { type: "clear-all-cues" };
export type AutoEstimateAllMessage = { type: "auto-estimate-all" };
export type GenerateTimeBudgetSlideMessage = { type: "generate-time-budget-slide" };

// ── Appendix messages ────────────────────────────────────────────────────
export type InsertAppendixDividerMessage = { type: "insert-appendix-divider" };
export type InsertBackupLinkMessage = { type: "insert-backup-link"; targetPageId?: string };
export type InsertBackToMainLinkMessage = { type: "insert-back-to-main-link" };
export type GetAppendixInfoMessage = { type: "get-appendix-info" };
export type ReorderAppendixMessage = { type: "reorder-appendix"; order?: string[] };
export type UpdateAllAppendixLinksMessage = { type: "update-all-appendix-links" };

// ── Export messages ──────────────────────────────────────────────────────
export type ExportBeamerMessage = { type: "export-beamer"; scope?: "all" | "current" };

/** Discriminated union of every message the UI can send to the plugin. */
export type PluginMessage =
  | GetSettingsMessage
  | SaveSettingsMessage
  | GetSelectionMessage
  | GetPagesMessage
  // Equations
  | InsertEquationMessage
  | UpdateEquationMessage
  | DeleteEquationMessage
  | ApplyEquationNumberingMessage
  | ClearEquationNumberingMessage
  // Templates
  | SetTemplateMessage
  | UpdateTemplateConfigMessage
  | ApplyToAllMessage
  | SyncAllMessage
  | RemoveTemplateInstancesMessage
  | GetTemplatesMessage
  | DeleteTemplateMessage
  | CheckVariableCandidateMessage
  | SaveVariablesMessage
  // Figures
  | InsertFigureMessage
  | UpdateFigureCaptionMessage
  | DeleteFigureMessage
  | ApplyFigureNumberingMessage
  // Theorems
  | InsertTheoremMessage
  | UpdateTheoremMessage
  | DeleteTheoremMessage
  | ApplyTheoremNumberingMessage
  // Tables
  | InsertTableMessage
  | UpdateTableCaptionMessage
  | DeleteTableMessage
  | ApplyTableNumberingMessage
  // Cross-references
  | InsertCrossrefMessage
  | UpdateAllCrossrefsMessage
  // Consistency
  | RunConsistencyCheckMessage
  | AutoFixIssueMessage
  | AutoFixAllMessage
  | FocusNodeMessage
  // References & Citations
  | GetReferencesMessage
  | AddReferenceMessage
  | ImportBibtexMessage
  | DeleteReferenceMessage
  | InsertCitationMessage
  | UpdateAllCitationsMessage
  | GenerateBibSlideMessage
  // Charts
  | InsertChartMessage
  | DeleteChartMessage
  // Subfigures
  | InsertSubfigureMessage
  | UpdateSubfigureMessage
  | DeleteSubfigureMessage
  | ApplySubfigureNumberingMessage
  // Slide Templates
  | InsertSlideTemplateMessage
  // Speaker Cues
  | GetSpeakerCuesMessage
  | SetSpeakerCueMessage
  | ClearAllCuesMessage
  | AutoEstimateAllMessage
  | GenerateTimeBudgetSlideMessage
  // Appendix
  | InsertAppendixDividerMessage
  | InsertBackupLinkMessage
  | InsertBackToMainLinkMessage
  | GetAppendixInfoMessage
  | ReorderAppendixMessage
  | UpdateAllAppendixLinksMessage
  // Export
  | ExportBeamerMessage;

// ── Messages sent FROM the plugin TO the UI (figma.ui.postMessage) ────────

export type ErrorResponse = {
  type: "error";
  message: string;
  errorKey: string;
  errorVars: Record<string, any>;
};

export type SelectionResponse = {
  type: "selection";
  node: any | null;
  equation: any | null;
};

export type PagesResponse = {
  type: "pages";
  templateId: string | null;
  sourcePageId: string | null;
  pages: { id: string; name: string; index: number }[];
};

export type EquationInsertedResponse = {
  type: "equation-inserted";
  equation: any;
};

export type EquationUpdatedResponse = {
  type: "equation-updated";
  equation: any;
};

export type EquationDeletedResponse = {
  type: "equation-deleted";
};

export type EquationNumberingAppliedResponse = {
  type: "equation-numbering-applied";
  count: number;
  scope: string;
};

export type EquationNumberingClearedResponse = {
  type: "equation-numbering-cleared";
  count: number;
  scope: string;
};

export type TemplateSavedResponse = {
  type: "template-saved";
  templateId: string;
  mode: "created" | "updated";
};

export type ConfigSavedResponse = {
  type: "config-saved";
  templateId: string;
};

export type ProgressResponse = {
  type: "progress";
  current: number;
  total: number;
  operation: string;
};

export type ApplyCompleteResponse = {
  type: "apply-complete";
  applied: number;
  skipped: number;
  total: number;
  conflicts: number;
  missingSources: number;
};

export type SyncCompleteResponse = {
  type: "sync-complete";
  synced: number;
  removed: number;
  conflicts: number;
  missingSources: number;
};

export type RemoveCompleteResponse = {
  type: "remove-complete";
  templateId: string;
  removed: number;
};

export type TemplatesResponse = {
  type: "templates";
  templates: any[];
};

export type SettingsResponse = {
  type: "settings";
  settings: { language: string };
};

export type SettingsSavedResponse = {
  type: "settings-saved";
  settings: { language: string };
};

export type VariableCandidateResponse =
  | {
      type: "variable-candidate";
      isValid: false;
      reason: string;
      reasonKey: string;
    }
  | {
      type: "variable-candidate";
      isValid: true;
      path: number[];
      nodeId: string;
      nodeName: string;
      nodeType: string;
    };

export type VariablesSavedResponse = {
  type: "variables-saved";
  templateId: string;
};

// ── Additional response types ────────────────────────────────────────────
export type FigureInsertedResponse = { type: "figure-inserted"; figure: any };
export type FigureUpdatedResponse = { type: "figure-updated"; figure: any };
export type FigureDeletedResponse = { type: "figure-deleted" };
export type FigureNumberingAppliedResponse = { type: "figure-numbering-applied"; count: number };

export type TheoremInsertedResponse = { type: "theorem-inserted"; theorem: any };
export type TheoremUpdatedResponse = { type: "theorem-updated"; theorem: any };
export type TheoremDeletedResponse = { type: "theorem-deleted" };
export type TheoremNumberingAppliedResponse = { type: "theorem-numbering-applied"; count: number };

export type TableInsertedResponse = { type: "table-inserted"; table: any };
export type TableUpdatedResponse = { type: "table-updated"; table: any };
export type TableDeletedResponse = { type: "table-deleted" };
export type TableNumberingAppliedResponse = { type: "table-numbering-applied"; count: number };

export type CrossrefInsertedResponse = { type: "crossref-inserted"; crossref: any };
export type CrossrefsUpdatedResponse = { type: "crossrefs-updated"; count: number };

export type ConsistencyResultsResponse = { type: "consistency-results"; issues: any[]; summary: { errors: number; warnings: number; infos: number } };
export type IssueFixedResponse = { type: "issue-fixed"; nodeId: string; category: string };
export type AllFixedResponse = { type: "all-fixed"; fixedCount: number };
export type FocusNodeDoneResponse = { type: "focus-node-done"; nodeId: string };

export type ReferencesLoadedResponse = { type: "references-loaded"; references: any[] };
export type ReferenceAddedResponse = { type: "reference-added"; reference: any };
export type BibtexImportedResponse = { type: "bibtex-imported"; count: number };
export type ReferenceDeletedResponse = { type: "reference-deleted"; referenceId: string };
export type CitationInsertedResponse = { type: "citation-inserted"; citation: any };
export type CitationsUpdatedResponse = { type: "citations-updated"; count: number };
export type BibSlideGeneratedResponse = { type: "bib-slide-generated" };

export type ChartInsertedResponse = { type: "chart-inserted"; chart: any };
export type ChartDeletedResponse = { type: "chart-deleted" };

export type SubfigureInsertedResponse = { type: "subfigure-inserted"; subfigure: any };
export type SubfigureUpdatedResponse = { type: "subfigure-updated"; subfigure: any };
export type SubfigureDeletedResponse = { type: "subfigure-deleted" };
export type SubfigureNumberingAppliedResponse = { type: "subfigure-numbering-applied"; count: number };

export type SlideTemplateInsertedResponse = { type: "slide-template-inserted"; slideTemplate: any };

export type SpeakerCuesLoadedResponse = { type: "speaker-cues-loaded"; cues: any[] };
export type SpeakerCueSavedResponse = { type: "speaker-cue-saved"; slideId: string };
export type AutoEstimateCompleteResponse = { type: "auto-estimate-complete"; count: number };
export type CuesClearedResponse = { type: "speaker-cues-cleared" };
export type TimeBudgetGeneratedResponse = { type: "time-budget-slide-generated" };

export type AppendixInfoResponse = { type: "appendix-info"; info: any };
export type AppendixDividerInsertedResponse = { type: "appendix-divider-inserted" };
export type BackupLinkInsertedResponse = { type: "backup-link-inserted" };
export type BackLinkInsertedResponse = { type: "back-link-inserted" };
export type AppendixLinksUpdatedResponse = { type: "appendix-links-updated"; count: number };
export type AppendixReorderedResponse = { type: "appendix-reordered" };

export type ExportCompleteResponse = { type: "export-complete"; tex: string; bib: string; slideCount: number };

/** Discriminated union of every message the plugin can send to the UI. */
export type PluginResponse =
  | ErrorResponse
  | ProgressResponse
  | SelectionResponse
  | PagesResponse
  // Settings
  | SettingsResponse
  | SettingsSavedResponse
  // Equations
  | EquationInsertedResponse
  | EquationUpdatedResponse
  | EquationDeletedResponse
  | EquationNumberingAppliedResponse
  | EquationNumberingClearedResponse
  // Templates
  | TemplateSavedResponse
  | ConfigSavedResponse
  | ApplyCompleteResponse
  | SyncCompleteResponse
  | RemoveCompleteResponse
  | TemplatesResponse
  | VariableCandidateResponse
  | VariablesSavedResponse
  // Figures
  | FigureInsertedResponse
  | FigureUpdatedResponse
  | FigureDeletedResponse
  | FigureNumberingAppliedResponse
  // Theorems
  | TheoremInsertedResponse
  | TheoremUpdatedResponse
  | TheoremDeletedResponse
  | TheoremNumberingAppliedResponse
  // Tables
  | TableInsertedResponse
  | TableUpdatedResponse
  | TableDeletedResponse
  | TableNumberingAppliedResponse
  // Cross-references
  | CrossrefInsertedResponse
  | CrossrefsUpdatedResponse
  // Consistency
  | ConsistencyResultsResponse
  | IssueFixedResponse
  | AllFixedResponse
  | FocusNodeDoneResponse
  // References
  | ReferencesLoadedResponse
  | ReferenceAddedResponse
  | BibtexImportedResponse
  | ReferenceDeletedResponse
  | CitationInsertedResponse
  | CitationsUpdatedResponse
  | BibSlideGeneratedResponse
  // Charts
  | ChartInsertedResponse
  | ChartDeletedResponse
  // Subfigures
  | SubfigureInsertedResponse
  | SubfigureUpdatedResponse
  | SubfigureDeletedResponse
  | SubfigureNumberingAppliedResponse
  // Slide Templates
  | SlideTemplateInsertedResponse
  // Speaker Cues
  | SpeakerCuesLoadedResponse
  | SpeakerCueSavedResponse
  | AutoEstimateCompleteResponse
  | CuesClearedResponse
  | TimeBudgetGeneratedResponse
  // Appendix
  | AppendixInfoResponse
  | AppendixDividerInsertedResponse
  | BackupLinkInsertedResponse
  | BackLinkInsertedResponse
  | AppendixLinksUpdatedResponse
  | AppendixReorderedResponse
  // Export
  | ExportCompleteResponse;
