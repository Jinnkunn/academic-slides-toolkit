// ---------------------------------------------------------------------------
// Global UI state – single mutable object to avoid ES module immutability issues
// ---------------------------------------------------------------------------

export const state = {
  selectedNodeId: null as string | null,
  selectedNodeData: null as any,
  selectedIndicId: null as string | null,

  allTemplates: [] as any[],
  pagesCache: null as any[] | null,

  activeTemplateId: null as string | null,
  editingSources: [] as any[],
  editingSourcesDirty: false,
  syncDraftStartNumber: null as number | null,
  pendingSource: null as any,
  lastSourceCandidateError: "",
  currentLanguage: "zh-CN",
  currentModule: "deck",
  selectedEquation: null as any,
  equationInsertSvg: "",
  equationSelectedSvg: "",
  activeOverlay: null as { moduleId: string; pageId: string } | null,
};

export const defaultModulePages: Record<string, string> = {
  deck: "overview",
  equations: "overview",
  components: "library",
  assets: "references",
  settings: "language",
};
