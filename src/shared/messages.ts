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

/** Discriminated union of every message the UI can send to the plugin. */
export type PluginMessage =
  | GetSettingsMessage
  | SaveSettingsMessage
  | GetSelectionMessage
  | GetPagesMessage
  | InsertEquationMessage
  | UpdateEquationMessage
  | DeleteEquationMessage
  | ApplyEquationNumberingMessage
  | ClearEquationNumberingMessage
  | SetTemplateMessage
  | UpdateTemplateConfigMessage
  | ApplyToAllMessage
  | SyncAllMessage
  | RemoveTemplateInstancesMessage
  | GetTemplatesMessage
  | DeleteTemplateMessage
  | CheckVariableCandidateMessage
  | SaveVariablesMessage;

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

/** Discriminated union of every message the plugin can send to the UI. */
export type PluginResponse =
  | ErrorResponse
  | SelectionResponse
  | PagesResponse
  | EquationInsertedResponse
  | EquationUpdatedResponse
  | EquationDeletedResponse
  | EquationNumberingAppliedResponse
  | EquationNumberingClearedResponse
  | TemplateSavedResponse
  | ConfigSavedResponse
  | ProgressResponse
  | ApplyCompleteResponse
  | SyncCompleteResponse
  | RemoveCompleteResponse
  | TemplatesResponse
  | SettingsResponse
  | SettingsSavedResponse
  | VariableCandidateResponse
  | VariablesSavedResponse;
