// ---------------------------------------------------------------------------
// I18N dictionary & helper functions – extracted from ui.html (lines 1792-2569)
// ---------------------------------------------------------------------------

import { state } from "./state";

// ---------------------------------------------------------------------------
// Full I18N dictionary
// ---------------------------------------------------------------------------

export const I18N: Record<string, Record<string, string>> = {
  "zh-CN": {
    topSubtitle: "Academic Slides Toolkit",
    moduleDeck: "Deck",
    moduleEquations: "Equations",
    moduleComponents: "Components",
    moduleAssets: "Assets",
    moduleSettings: "Settings",
    deckNavOverview: "Overview",
    deckNavTemplate: "Template",
    deckNavSources: "Sources",
    deckNavSync: "Sync",
    equationsNavOverview: "Overview",
    equationsNavInsert: "Insert",
    equationsNavSelected: "Selected",
    equationsNavNumbering: "Numbering",
    componentsNavLibrary: "Library",
    componentsNavFigure: "Figure",
    componentsNavTheorem: "Theorem",
    assetsNavReferences: "References",
    assetsNavCharts: "Charts",
    assetsNavCaptions: "Captions",
    settingsNavLanguage: "Language",
    closePanel: "关闭",
    overviewTitle: "当前模板",
    overviewDesc: "围绕当前模板工作。",
    activeTemplateLabel: "模板",
    selectTemplate: "请选择模板",
    metaTemplate: "模板页",
    metaRules: "内容来源",
    metaTargets: "将更新",
    overviewEmpty: "未选择模板。",
    overviewActive: "{kind} 模板\u201c{name}\u201d \u00b7 {page} \u00b7 更新 {count}",
    templateTitle: "保存区域模板",
    templateDesc: "选中一个模板区域后保存。",
    selectionEmpty: "请先选中一个模板区域。",
    refreshSelection: "重新读取当前选区",
    indicatorTitle: "页码位置",
    indicatorDesc: "可选：指定页码文本。",
    indicatorIdle: "未启用自动页码",
    templateNameLabel: "模板名称",
    templateNamePlaceholder: "例如：顶部页眉 / 底部页脚 / 自定义区域",
    templateKindLabel: "模板类型",
    templateKindHeader: "页眉",
    templateKindFooter: "页脚",
    templateKindCustom: "自定义",
    placementLabel: "锚点布局",
    placementTopLeft: "顶部左对齐",
    placementTopCenter: "顶部居中",
    placementTopRight: "顶部右对齐",
    placementBottomLeft: "底部左对齐",
    placementBottomCenter: "底部居中",
    placementBottomRight: "底部右对齐",
    placementCustom: "自定义位置",
    layoutAreaLabel: "布局参照",
    layoutAreaSlide: "整页边界",
    layoutAreaSafeArea: "Safe Area",
    safeAreaTitle: "Safe Area 边距",
    safeAreaHint: "Header / Footer 会相对这个内容区进行对齐，而不是直接贴 slide 边缘。",
    safeAreaTop: "上",
    safeAreaRight: "右",
    safeAreaBottom: "下",
    safeAreaLeft: "左",
    pageFormatLabel: "页码格式",
    totalTitle: "总页数",
    totalHint: "仅 `%t` 会用到总页数。",
    totalModeAuto: "自动统计启用该模板的 slides",
    totalModeCustom: "手动指定总页数",
    templateSummaryDefault: "将保存为 {kind} 模板 \u00b7 {placement} \u00b7 {area}",
    templateSummaryWithNumber: "{kind} 模板 \u00b7 {placement} \u00b7 {area} \u00b7 页码节点：{name}",
    templateSummaryWithoutNumber: "{kind} 模板 \u00b7 {placement} \u00b7 {area} \u00b7 不生成自动页码",
    saveTemplate: "保存为模板",
    sourceTitle: "内容来源",
    sourceDesc: "绑定可同步文字。",
    sourceEmpty: "先选择模板。",
    sourceActive: "当前模板：{name}",
    bindNote: "回到模板页，选中一段文字后继续。",
    checkSource: "把当前文字设为可同步内容",
    sourceNameLabel: "内容名称",
    sourceNamePlaceholder: "例如：章节标题",
    confirmAdd: "确认添加",
    cancel: "取消",
    deleteSource: "删除",
    saveSources: "保存内容来源规则",
    discardUnsavedSourcesConfirm: "内容来源还有未保存修改，确定丢弃吗？",
    noSourceRules: "还没有来源规则。",
    templateNode: "模板节点：{name}",
    rulesCount: "{count} 条规则",
    sourceSyncPill: "来源 slide 同步",
    addRange: "新增一个页段规则",
    rangePreview: "第 {from}-{to} 页 -> 使用 {page}",
    loadingSlides: "正在读取 slides 列表...",
    sourceTag: "模板页",
    syncTitle: "同步设置",
    syncDesc: "设置排除页和起始页码。",
    syncEmpty: "先选择模板。",
    excludeTitle: "排除哪些 slides",
    syncStartLabel: "页码起始",
    syncStartHint: "首个未排除页从这里开始。",
    applyAll: "仅首次应用到全部",
    syncAll: "同步全部 Slides",
    saveSync: "保存同步设置",
    removeTemplateInstances: "删除已同步区域",
    deleteTemplate: "删除模板",
    syncSummary: "{page} \u00b7 排除 {excluded} \u00b7 更新 {targets}",
    settingsTitle: "设置",
    settingsDesc: "语言与全局设置。",
    languageSettingTitle: "插件语言",
    languageSettingDesc: "切换界面语言。",
    settingsNow: "Now",
    settingsLanguageLabel: "语言",
    saveSettings: "保存设置",
    settingsGoDeck: "回到 Deck",
    settingsPlaceholder: "更多设置后续补充。",
    deckHeroTitle: "Deck",
    deckHeroDesc: "模板、来源、同步。",
    deckQuickTemplateTitle: "保存模板",
    deckQuickTemplateDesc: "保存当前区域。",
    deckQuickSourcesTitle: "内容来源",
    deckQuickSourcesDesc: "绑定文字和来源页。",
    deckQuickSyncTitle: "同步设置",
    deckQuickSyncDesc: "应用、同步、删除。",
    deckQuickSettingsTitle: "插件设置",
    deckQuickSettingsDesc: "语言和全局偏好。",
    equationsHeroTitle: "Equations",
    equationsHeroDesc: "插入、编辑、编号。",
    equationsOverviewTitle: "公式",
    equationsOverviewDesc: "公式工具。",
    equationsQuickInsertTitle: "插入公式",
    equationsQuickInsertDesc: "输入并插入。",
    equationsQuickSelectedTitle: "编辑选中公式",
    equationsQuickSelectedDesc: "更新选中公式。",
    equationsQuickNumberingTitle: "编号与引用",
    equationsQuickNumberingDesc: "批量编号。",
    equationsNumberingScopeLabel: "编号范围",
    equationsNumberingScopeCurrent: "仅当前 slide",
    equationsNumberingScopeAll: "整份 deck",
    equationsNumberingStyleLabel: "编号样式",
    equationsNumberingStyleParen: "(1)",
    equationsNumberingStyleEq: "Eq. 1",
    equationsNumberingStyleEqParen: "Eq. (1)",
    equationsNumberingApply: "生成 / 更新编号",
    equationsNumberingClear: "清空编号",
    equationsNumberingHint: "只处理 display 公式。",
    equationsInsertTitle: "插入公式",
    equationsInsertDesc: "输入 LaTeX 后插入。",
    equationsDisplayModeLabel: "显示模式",
    equationsFontSizeLabel: "字号",
    equationsColorLabel: "颜色",
    equationsInputPlaceholder: "例如：\\int_0^1 x^2 \\, dx = \\frac{1}{3}",
    equationsPreviewEmpty: "输入 LaTeX 预览。",
    equationsInsertButton: "插入到当前画布",
    equationsRefreshButton: "刷新预览",
    equationsItemPreview: "实时预览公式渲染结果",
    equationsItemMode: "切换行内 / 块级公式",
    equationsItemStyle: "统一字号、颜色和对齐方式",
    equationsSelectedTitle: "选中公式检查器",
    equationsSelectedDesc: "编辑当前选中的公式。",
    equationsSelectedEmpty: "未选中插件公式。",
    equationsSelectedPlaceholder: "选中插件创建的公式后，这里会显示源码",
    equationsSelectedPreviewEmpty: "选中公式后预览。",
    equationsAutoOpened: "已检测到公式，自动打开编辑器。",
    snippetTitleCommon: "常用结构",
    snippetTitleSymbols: "希腊字母 & 符号",
    figureSelectedEmpty: "当前未选中 Figure。插入新的或在画布中选中已有 Figure。",
    figureAutoOpened: "已检测到 Figure，自动打开编辑器。",
    figureInserted: "Figure 已插入画布",
    figureUpdated: "Caption 已更新",
    figureDeleted: "Figure 已删除",
    figureDeleteConfirm: "确定删除这个 Figure 吗？",
    figureNumberingApplied: "已更新 {count} 个 Figure 的编号",
    figureCaptionLabel: "Caption 文字",
    figureLabelPrefixLabel: "编号前缀",
    figureWidthLabel: "宽度",
    figureHeightLabel: "高度",
    figureInsertBtn: "插入 Figure",
    figureUpdateBtn: "更新 Caption",
    figureDeleteBtn: "删除 Figure",
    figureNumberingBtn: "重新编号全部 Figure",
    figureNumberingScopeLabel: "编号范围",
    theoremSelectedEmpty: "当前未选中 Theorem 块。",
    theoremAutoOpened: "已检测到 Theorem 块，自动打开编辑器。",
    theoremInserted: "Theorem 块已插入画布",
    theoremUpdated: "Theorem 已更新",
    theoremDeleted: "Theorem 已删除",
    theoremDeleteConfirm: "确定删除这个 Theorem 块吗？",
    theoremNumberingApplied: "已更新 {count} 个 Theorem 的编号",
    tableSelectedEmpty: "当前未选中 Table。",
    tableAutoOpened: "已检测到 Table，自动打开编辑器。",
    tableInserted: "Table 已插入画布",
    tableUpdated: "Caption 已更新",
    tableDeleted: "Table 已删除",
    tableDeleteConfirm: "确定删除这个 Table 吗？",
    tableNumberingApplied: "已更新 {count} 个 Table 的编号",
    crossrefInserted: "引用标记已插入",
    crossrefsUpdated: "已更新 {count} 个引用标记",
    consistencyRunning: "正在检查…",
    consistencyAllClear: "未发现问题，一切一致！",
    consistencyFontMismatch: "字体 {font} 与主字体 {dominantFont} 不一致（{count} 处）",
    consistencyFontSizeNonStandard: "非标准字号 {size}px",
    consistencyColorRare: "低频颜色 {color}（仅 {count} 处）",
    consistencyNumberingGap: "{kind} 编号不连续：期望 {expected}，实际 {actual}",
    consistencyCrossrefBroken: "交叉引用目标已失效（{kind} #{index}）",
    consistencyCrossrefStale: "交叉引用编号过期：{kind} 期望 {expected}，显示 {actual}",
    consistencySpacingPadding: "{kind} 内边距不一致：期望 {expected}px，实际 {actual}px",
    consistencySpacingGap: "{kind} 间距不一致：期望 {expected}px，实际 {actual}px",
    consistencyOrphanMissingChild: "{kind} 结构不完整：缺少 {missing}",
    consistencyLocate: "定位到画布",
    consistencyFix: "修复",
    consistencyFixAll: "全部修复 ({count})",
    consistencyIssueFix: "已修复",
    consistencyAllFixed: "已修复 {count} 个问题",
    errorConsistencyCheck: "一致性检查出错",
    errorNodeNotFound: "节点未找到",
    errorAutoFix: "自动修复失败",
    equationsUpdateButton: "更新公式",
    equationsDeleteButton: "删除公式",
    equationsDeleteConfirm: "删除当前公式？",
    equationsNumberingTitle: "公式编号与引用",
    equationsNumberingDesc: "批量生成或清空编号。",
    componentsHeroTitle: "Components",
    componentsHeroDesc: "学术组件。",
    componentsFigureTitle: "Figure + Caption",
    componentsFigureDesc: "图片与标题。",
    componentsTheoremTitle: "Theorem / Proof",
    componentsTheoremDesc: "定理与证明。",
    componentsFigurePanelTitle: "Figure 组件",
    componentsFigurePanelDesc: "Figure 工具即将补充。",
    componentsTheoremPanelTitle: "Theorem 组件",
    componentsTheoremPanelDesc: "Theorem 工具即将补充。",
    assetsHeroTitle: "Assets",
    assetsHeroDesc: "图表、引用、标题。",
    assetsReferencesTitle: "References 管理",
    assetsReferencesDesc: "文献与引用。",
    assetsChartsTitle: "Charts",
    assetsChartsDesc: "图表工具。",
    assetsCaptionsTitle: "Captions",
    assetsCaptionsDesc: "标题与编号。",
    settingsSaved: "设置已保存",
    chooseTemplateFirst: "请先选择一个模板",
    chooseTemplateNodeFirst: "请先在画布里选中一个模板区域节点",
    textOnlyIndicator: "只有文本节点才能作为页码位置",
    indicatorSelected: "已选择页码节点：{name}",
    customTotalInvalid: "自定义总页数必须大于 0",
    templateSaved: "模板已保存",
    templateUpdated: "模板已更新",
    sourceDetected: "已检测到可同步文字：{name}（{type}）",
    sourceAlreadyBound: "这段文字已经被绑定过了",
    sourceNeedsRule: "内容\u201c{name}\u201d至少需要一条规则",
    rangeInvalid: "内容\u201c{name}\u201d的页码范围无效",
    sourcePageMissing: "内容\u201c{name}\u201d有一条规则还没选择来源 slide",
    rangeStartGreater: "内容\u201c{name}\u201d的起始页不能大于结束页",
    rangeOverlap: "内容\u201c{name}\u201d的页段范围不能重叠",
    sourcesSaved: "内容来源规则已保存",
    saveSyncFirst: "同步设置已保存",
    equationsNeedContent: "请先输入 LaTeX 公式",
    equationsPreviewNotReady: "公式预览还没准备好，请稍等一秒后重试",
    equationsInserted: "公式已插入到当前画布",
    equationsUpdated: "公式已更新",
    equationsDeleted: "公式已删除",
    equationsNumberingApplied: "已更新 {count} 个公式编号",
    equationsNumberingCleared: "已清除 {count} 个公式编号",
    appliedResult: "已应用到 {applied} 个页面，跳过 {skipped} 个",
    syncResult: "已同步 {synced} 个页面",
    removedExcluded: "，移除 {removed} 个排除页模板区域",
    templateConflicts: "，检测到 {count} 处模板区域重叠",
    missingSources: "，另有 {count} 个来源 slide 未找到",
    removedTemplateInstancesDone: "已删除 {count} 个已同步区域",
    deleteSourceConfirm: "删除这个内容来源配置？",
    removeTemplateInstancesConfirm: "删除模板\u201c{name}\u201d已同步出去的所有区域？",
    deleteTemplateConfirm: "删除模板\u201c{name}\u201d？已经插入到各 slides 的区域不会自动删除。",
    sourceMissingPage: "未找到来源 slide",
    slideLabel: "Slide {index} \u00b7 {name}",
    pageExampleOnly: "仅页码，例如 3",
    pageExampleTotal: "页码 / 总数，例如 3 / 10",
    pageExampleTwoDigits: "两位数，例如 02/33",
    pageExampleOf: "英文格式，例如 3 of 10",
    pageExamplePage: "前缀格式，例如 Page 3",
    selectionIdPrefix: "id ",
    mathjaxLoadFailed: "MathJax 加载失败，公式功能不可用。请检查网络连接后重新打开插件。",
    progressMessage: "正在处理第 {current}/{total} 页...",
    errorEmptyLatex: "公式内容不能为空",
    errorEmptySvg: "公式 SVG 为空，请先等待预览完成",
    errorNoInsertTarget: "当前无法定位插入位置",
    errorNoEquationToUpdate: "未找到可更新的公式节点",
    errorEquationCannotUpdate: "当前公式节点无法被更新",
    errorNoEquationToDelete: "未找到可删除的公式节点",
    errorTemplateNodeNotFound: "找不到选中的模板区域节点",
    errorInvalidCustomTotal: "自定义总页数必须是大于 0 的数字",
    errorIndicatorOutsideTemplate: "页码节点必须位于模板区域内部",
    errorIndicatorNotText: "页码节点必须是文本节点",
    errorSelectSlideTemplate: "请在某一页 Slide 内选择模板区域节点",
    errorCurrentPageNotFound: "找不到当前页面",
    errorTemplateNotExist: "模板不存在",
    errorTemplateDeleted: "模板节点已被删除，请重新保存模板",
    errorTemplateNodeMissing: "模板节点不存在，请重新保存模板",
    errorVarMissingRanges: "变量「{name}」缺少范围配置",
    errorVarInvalidRange: "变量「{name}」的第 {index} 个范围页码无效",
    errorVarRangeOrder: "变量「{name}」的第 {index} 个范围起始页不能大于结束页",
    errorVarRangeOverlap: "变量「{name}」的范围发生重叠",
    errorVarMissingName: "第 {index} 个变量缺少名称",
    errorVarInvalidNode: "变量「{name}」的目标节点无效",
    errorVarDuplicateBinding: "变量「{name}」重复绑定了同一个节点",
    errorVarNeedsRange: "变量「{name}」至少需要一个范围",
    errorVarNotTextNode: "变量「{name}」绑定的节点不是文本节点",
    errorSelectOneTextNode: "请在 Figma 中只选中一个文本节点",
    errorSwitchToTemplateSlide: "请切换到模板所在的 Slide 后再检测变量节点",
    errorSwitchToTemplatePage: "请切换到模板所在页面后再检测变量节点",
    errorVarOnlyText: "变量只支持文本节点",
    errorNodeNotInTemplate: "所选节点不在该模板内部",
    errorOperationFailed: "操作失败",
  },
  "en-US": {
    topSubtitle: "Academic Slides Toolkit",
    moduleDeck: "Deck",
    moduleEquations: "Equations",
    moduleComponents: "Components",
    moduleAssets: "Assets",
    moduleSettings: "Settings",
    deckNavOverview: "Overview",
    deckNavTemplate: "Template",
    deckNavSources: "Sources",
    deckNavSync: "Sync",
    equationsNavOverview: "Overview",
    equationsNavInsert: "Insert",
    equationsNavSelected: "Selected",
    equationsNavNumbering: "Numbering",
    componentsNavLibrary: "Library",
    componentsNavFigure: "Figure",
    componentsNavTheorem: "Theorem",
    assetsNavReferences: "References",
    assetsNavCharts: "Charts",
    assetsNavCaptions: "Captions",
    settingsNavLanguage: "Language",
    closePanel: "Close",
    overviewTitle: "Current Template",
    overviewDesc: "Work from the active template.",
    activeTemplateLabel: "Template",
    selectTemplate: "Select a template",
    metaTemplate: "Template Slide",
    metaRules: "Sources",
    metaTargets: "Targets",
    overviewEmpty: "No template selected.",
    overviewActive: "{kind} template \u201c{name}\u201d \u00b7 {page} \u00b7 update {count}",
    templateTitle: "Save Template Region",
    templateDesc: "Select a template region, then save.",
    selectionEmpty: "Select a template region first.",
    refreshSelection: "Refresh Selection",
    indicatorTitle: "Page Number Node",
    indicatorDesc: "Optional: choose a page-number text layer.",
    indicatorIdle: "Auto page numbers off",
    templateNameLabel: "Template Name",
    templateNamePlaceholder: "Example: Top Header / Bottom Footer / Custom Region",
    templateKindLabel: "Template Kind",
    templateKindHeader: "Header",
    templateKindFooter: "Footer",
    templateKindCustom: "Custom",
    placementLabel: "Placement",
    placementTopLeft: "Top Left",
    placementTopCenter: "Top Center",
    placementTopRight: "Top Right",
    placementBottomLeft: "Bottom Left",
    placementBottomCenter: "Bottom Center",
    placementBottomRight: "Bottom Right",
    placementCustom: "Custom Position",
    layoutAreaLabel: "Layout Area",
    layoutAreaSlide: "Slide Bounds",
    layoutAreaSafeArea: "Safe Area",
    safeAreaTitle: "Safe Area Margins",
    safeAreaHint: "Header / footer alignment will use this content box instead of the raw slide edges.",
    safeAreaTop: "Top",
    safeAreaRight: "Right",
    safeAreaBottom: "Bottom",
    safeAreaLeft: "Left",
    pageFormatLabel: "Page Number Format",
    totalTitle: "Total Count",
    totalHint: "Used only with `%t`.",
    totalModeAuto: "Auto count slides with this template enabled",
    totalModeCustom: "Set total count manually",
    templateSummaryDefault: "This will save a {kind} template \u00b7 {placement} \u00b7 {area}",
    templateSummaryWithNumber: "{kind} template \u00b7 {placement} \u00b7 {area} \u00b7 page-number node: {name}",
    templateSummaryWithoutNumber: "{kind} template \u00b7 {placement} \u00b7 {area} \u00b7 no auto page numbers",
    saveTemplate: "Save Template",
    sourceTitle: "Content Sources",
    sourceDesc: "Bind syncable text.",
    sourceEmpty: "Choose a template first.",
    sourceActive: "Active template: {name}",
    bindNote: "Go to the template slide and select one text layer.",
    checkSource: "Use Current Text as Source",
    sourceNameLabel: "Source Name",
    sourceNamePlaceholder: "Example: Section Title",
    confirmAdd: "Add",
    cancel: "Cancel",
    deleteSource: "Delete",
    saveSources: "Save Source Rules",
    discardUnsavedSourcesConfirm: "You have unsaved source-rule changes. Discard them?",
    noSourceRules: "No source rules yet.",
    templateNode: "Template node: {name}",
    rulesCount: "{count} rules",
    sourceSyncPill: "Source slide sync",
    addRange: "Add Page Range Rule",
    rangePreview: "Pages {from}-{to} -> use {page}",
    loadingSlides: "Loading slides...",
    sourceTag: "Template",
    syncTitle: "Sync Settings",
    syncDesc: "Set exclusions and start number.",
    syncEmpty: "Choose a template first.",
    excludeTitle: "Excluded Slides",
    syncStartLabel: "Start Number",
    syncStartHint: "First non-excluded slide starts here.",
    applyAll: "Apply Once to All",
    syncAll: "Sync All Slides",
    saveSync: "Save Sync Settings",
    removeTemplateInstances: "Remove Synced Regions",
    deleteTemplate: "Delete Template",
    syncSummary: "{page} \u00b7 excluded {excluded} \u00b7 update {targets}",
    settingsTitle: "Settings",
    settingsDesc: "Language and global settings.",
    languageSettingTitle: "Plugin Language",
    languageSettingDesc: "Switch UI language.",
    settingsNow: "Now",
    settingsLanguageLabel: "Language",
    saveSettings: "Save Settings",
    settingsGoDeck: "Back to Deck",
    settingsPlaceholder: "More settings later.",
    deckHeroTitle: "Deck",
    deckHeroDesc: "Templates, sources, sync.",
    deckQuickTemplateTitle: "Save Template",
    deckQuickTemplateDesc: "Save current region.",
    deckQuickSourcesTitle: "Content Sources",
    deckQuickSourcesDesc: "Bind text and source slides.",
    deckQuickSyncTitle: "Sync Settings",
    deckQuickSyncDesc: "Apply, sync, remove.",
    deckQuickSettingsTitle: "Plugin Settings",
    deckQuickSettingsDesc: "Language and defaults.",
    equationsHeroTitle: "Equations",
    equationsHeroDesc: "Insert, edit, number.",
    equationsOverviewTitle: "Equations",
    equationsOverviewDesc: "Equation tools.",
    equationsQuickInsertTitle: "Insert Equation",
    equationsQuickInsertDesc: "Type and insert.",
    equationsQuickSelectedTitle: "Edit Selected",
    equationsQuickSelectedDesc: "Update selection.",
    equationsQuickNumberingTitle: "Numbering & Refs",
    equationsQuickNumberingDesc: "Batch numbering.",
    equationsNumberingScopeLabel: "Scope",
    equationsNumberingScopeCurrent: "Current slide only",
    equationsNumberingScopeAll: "Whole deck",
    equationsNumberingStyleLabel: "Style",
    equationsNumberingStyleParen: "(1)",
    equationsNumberingStyleEq: "Eq. 1",
    equationsNumberingStyleEqParen: "Eq. (1)",
    equationsNumberingApply: "Generate / Update",
    equationsNumberingClear: "Clear Numbering",
    equationsNumberingHint: "Display equations only.",
    equationsInsertTitle: "Insert Equation",
    equationsInsertDesc: "Insert LaTeX equations.",
    equationsDisplayModeLabel: "Mode",
    equationsFontSizeLabel: "Size",
    equationsColorLabel: "Color",
    equationsInputPlaceholder: "Example: \\int_0^1 x^2 \\, dx = \\frac{1}{3}",
    equationsPreviewEmpty: "Type LaTeX to preview.",
    equationsInsertButton: "Insert on Canvas",
    equationsRefreshButton: "Refresh Preview",
    equationsItemPreview: "Live equation preview",
    equationsItemMode: "Toggle inline / display mode",
    equationsItemStyle: "Control size, color, and alignment",
    equationsSelectedTitle: "Selected Equation Inspector",
    equationsSelectedDesc: "Edit the selected equation.",
    equationsSelectedEmpty: "No plugin equation selected.",
    equationsSelectedPlaceholder: "When a plugin-created equation is selected, its source will appear here",
    equationsSelectedPreviewEmpty: "Preview selected equation here.",
    equationsAutoOpened: "Equation detected — editor opened automatically.",
    snippetTitleCommon: "Common Structures",
    snippetTitleSymbols: "Greek Letters & Symbols",
    figureSelectedEmpty: "No Figure selected. Insert a new one or select an existing Figure on the canvas.",
    figureAutoOpened: "Figure detected — editor opened automatically.",
    figureInserted: "Figure inserted on the canvas",
    figureUpdated: "Caption updated",
    figureDeleted: "Figure deleted",
    figureDeleteConfirm: "Delete this Figure?",
    figureNumberingApplied: "Updated numbering for {count} Figures",
    figureCaptionLabel: "Caption Text",
    figureLabelPrefixLabel: "Number Prefix",
    figureWidthLabel: "Width",
    figureHeightLabel: "Height",
    figureInsertBtn: "Insert Figure",
    figureUpdateBtn: "Update Caption",
    figureDeleteBtn: "Delete Figure",
    figureNumberingBtn: "Renumber All Figures",
    figureNumberingScopeLabel: "Numbering Scope",
    theoremSelectedEmpty: "No Theorem block selected.",
    theoremAutoOpened: "Theorem block detected — editor opened automatically.",
    theoremInserted: "Theorem block inserted on the canvas",
    theoremUpdated: "Theorem updated",
    theoremDeleted: "Theorem deleted",
    theoremDeleteConfirm: "Delete this Theorem block?",
    theoremNumberingApplied: "Updated numbering for {count} Theorem blocks",
    tableSelectedEmpty: "No Table selected.",
    tableAutoOpened: "Table detected — editor opened automatically.",
    tableInserted: "Table inserted on the canvas",
    tableUpdated: "Caption updated",
    tableDeleted: "Table deleted",
    tableDeleteConfirm: "Delete this Table?",
    tableNumberingApplied: "Updated numbering for {count} Tables",
    crossrefInserted: "Cross-reference inserted",
    crossrefsUpdated: "Updated {count} cross-references",
    consistencyRunning: "Checking…",
    consistencyAllClear: "No issues found — everything is consistent!",
    consistencyFontMismatch: "Font {font} differs from dominant font {dominantFont} ({count} occurrences)",
    consistencyFontSizeNonStandard: "Non-standard font size {size}px",
    consistencyColorRare: "Rare color {color} (only {count} occurrences)",
    consistencyNumberingGap: "{kind} numbering gap: expected {expected}, found {actual}",
    consistencyCrossrefBroken: "Cross-reference target missing ({kind} #{index})",
    consistencyCrossrefStale: "Cross-reference stale: {kind} expected {expected}, shows {actual}",
    consistencySpacingPadding: "{kind} padding inconsistent: expected {expected}px, found {actual}px",
    consistencySpacingGap: "{kind} spacing inconsistent: expected {expected}px, found {actual}px",
    consistencyOrphanMissingChild: "{kind} structure incomplete: missing {missing}",
    consistencyLocate: "Locate on canvas",
    consistencyFix: "Fix",
    consistencyFixAll: "Fix all ({count})",
    consistencyIssueFix: "Fixed",
    consistencyAllFixed: "Fixed {count} issues",
    errorConsistencyCheck: "Consistency check failed",
    errorNodeNotFound: "Node not found",
    errorAutoFix: "Auto-fix failed",
    equationsUpdateButton: "Update Equation",
    equationsDeleteButton: "Delete Equation",
    equationsDeleteConfirm: "Delete the current equation?",
    equationsNumberingTitle: "Equation Numbering & References",
    equationsNumberingDesc: "Generate or clear numbering.",
    componentsHeroTitle: "Components",
    componentsHeroDesc: "Academic blocks.",
    componentsFigureTitle: "Figure + Caption",
    componentsFigureDesc: "Figure and caption.",
    componentsTheoremTitle: "Theorem / Proof",
    componentsTheoremDesc: "Theorem and proof.",
    componentsFigurePanelTitle: "Figure Component",
    componentsFigurePanelDesc: "Figure tools coming soon.",
    componentsTheoremPanelTitle: "Theorem Component",
    componentsTheoremPanelDesc: "Theorem tools coming soon.",
    assetsHeroTitle: "Assets",
    assetsHeroDesc: "Charts, refs, captions.",
    assetsReferencesTitle: "Reference Manager",
    assetsReferencesDesc: "References and citations.",
    assetsChartsTitle: "Charts",
    assetsChartsDesc: "Chart tools.",
    assetsCaptionsTitle: "Captions",
    assetsCaptionsDesc: "Captions and numbering.",
    settingsSaved: "Settings saved",
    chooseTemplateFirst: "Choose a template first",
    chooseTemplateNodeFirst: "Select a template region on the canvas first",
    textOnlyIndicator: "Only text nodes can be used for page numbering",
    indicatorSelected: "Selected page-number node: {name}",
    customTotalInvalid: "Custom total must be greater than 0",
    templateSaved: "Template saved",
    templateUpdated: "Template updated",
    sourceDetected: "Detected syncable text: {name} ({type})",
    sourceAlreadyBound: "This text layer is already bound",
    sourceNeedsRule: "Content \u201c{name}\u201d needs at least one rule",
    rangeInvalid: "Invalid page range in \u201c{name}\u201d",
    sourcePageMissing: "A rule in \u201c{name}\u201d is missing a source slide",
    rangeStartGreater: "In \u201c{name}\u201d, the start page cannot be greater than the end page",
    rangeOverlap: "Page ranges in \u201c{name}\u201d cannot overlap",
    sourcesSaved: "Source rules saved",
    saveSyncFirst: "Sync settings saved",
    equationsNeedContent: "Enter a LaTeX formula first",
    equationsPreviewNotReady: "Equation preview is not ready yet. Wait a second and try again",
    equationsInserted: "Equation inserted on the canvas",
    equationsUpdated: "Equation updated",
    equationsDeleted: "Equation deleted",
    equationsNumberingApplied: "Updated numbering for {count} equations",
    equationsNumberingCleared: "Cleared numbering from {count} equations",
    appliedResult: "Applied to {applied} slides and skipped {skipped}",
    syncResult: "Synced {synced} slides",
    removedExcluded: ", removed {removed} excluded template regions",
    templateConflicts: ", detected {count} overlapping template-region conflicts",
    missingSources: ", and {count} source slides were missing",
    removedTemplateInstancesDone: "Removed {count} synced regions",
    deleteSourceConfirm: "Delete this content source?",
    removeTemplateInstancesConfirm: "Remove all synced regions created from template \u201c{name}\u201d?",
    deleteTemplateConfirm: "Delete template \u201c{name}\u201d? Regions already inserted in slides will not be removed automatically.",
    sourceMissingPage: "Source slide not found",
    slideLabel: "Slide {index} \u00b7 {name}",
    pageExampleOnly: "Current page only, e.g. 3",
    pageExampleTotal: "Current / total, e.g. 3 / 10",
    pageExampleTwoDigits: "Two digits, e.g. 02/33",
    pageExampleOf: "English, e.g. 3 of 10",
    pageExamplePage: "Prefix, e.g. Page 3",
    selectionIdPrefix: "id ",
    mathjaxLoadFailed: "MathJax failed to load. Equation features are unavailable. Check your network and reopen the plugin.",
    progressMessage: "Processing slide {current}/{total}...",
    errorEmptyLatex: "Equation content cannot be empty",
    errorEmptySvg: "Equation SVG is empty. Wait for the preview to complete first",
    errorNoInsertTarget: "Cannot determine insertion position",
    errorNoEquationToUpdate: "No updatable equation node found",
    errorEquationCannotUpdate: "This equation node cannot be updated",
    errorNoEquationToDelete: "No deletable equation node found",
    errorTemplateNodeNotFound: "Cannot find the selected template region node",
    errorInvalidCustomTotal: "Custom total must be a number greater than 0",
    errorIndicatorOutsideTemplate: "Page number node must be inside the template region",
    errorIndicatorNotText: "Page number node must be a text node",
    errorSelectSlideTemplate: "Please select a template region node inside a Slide",
    errorCurrentPageNotFound: "Current page not found",
    errorTemplateNotExist: "Template does not exist",
    errorTemplateDeleted: "Template node has been deleted. Please re-save the template",
    errorTemplateNodeMissing: "Template node does not exist. Please re-save the template",
    errorVarMissingRanges: "Variable \"{name}\" is missing range configuration",
    errorVarInvalidRange: "Range #{index} of variable \"{name}\" has invalid page numbers",
    errorVarRangeOrder: "Range #{index} of variable \"{name}\": start page cannot exceed end page",
    errorVarRangeOverlap: "Ranges of variable \"{name}\" overlap",
    errorVarMissingName: "Variable #{index} is missing a name",
    errorVarInvalidNode: "Target node of variable \"{name}\" is invalid",
    errorVarDuplicateBinding: "Variable \"{name}\" is bound to a node already in use",
    errorVarNeedsRange: "Variable \"{name}\" needs at least one range",
    errorVarNotTextNode: "The node bound by variable \"{name}\" is not a text node",
    errorSelectOneTextNode: "Please select exactly one text node in Figma",
    errorSwitchToTemplateSlide: "Switch to the template's Slide before detecting variable nodes",
    errorSwitchToTemplatePage: "Switch to the template's page before detecting variable nodes",
    errorVarOnlyText: "Variables only support text nodes",
    errorNodeNotInTemplate: "Selected node is not inside this template",
    errorOperationFailed: "Operation failed",
  },
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** HTML-escape a value for safe insertion into markup. */
export function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Escape a value for safe insertion into a JS string literal. */
export function escJs(value: string | number): string {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/</g, "\\x3c");
}

/** Return the message map for the current language, falling back to zh-CN. */
export function getMessages(): Record<string, string> {
  return I18N[state.currentLanguage] || I18N["zh-CN"];
}

/** Translate a key, optionally interpolating `{var}` placeholders. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const messages = getMessages();
  let text = Object.prototype.hasOwnProperty.call(messages, key) ? messages[key] : key;
  if (!vars) return text;

  for (const name in vars) {
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      text = text.replace(new RegExp("\\{" + name + "\\}", "g"), String(vars[name]));
    }
  }
  return text;
}

/** Set the textContent of an element by id using a translated key. */
export function setText(id: string, key: string, vars?: Record<string, string | number>): void {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = t(key, vars);
}

/** Set the placeholder attribute of an element by id using a translated key. */
export function setPlaceholder(id: string, key: string): void {
  const element = document.getElementById(id) as HTMLInputElement | null;
  if (!element) return;
  element.placeholder = t(key);
}

/** Apply all static translation strings to the DOM. */
export function renderStaticLanguage(): void {
  setText("top-subtitle", "topSubtitle");
  setText("module-tab-deck", "moduleDeck");
  setText("module-tab-equations", "moduleEquations");
  setText("module-tab-components", "moduleComponents");
  setText("module-tab-assets", "moduleAssets");
  setText("module-tab-settings", "moduleSettings");
  setText("equations-subnav-overview", "equationsNavOverview");
  setText("deck-subnav-overview", "deckNavOverview");
  setText("deck-subnav-template", "deckNavTemplate");
  setText("deck-subnav-sources", "deckNavSources");
  setText("deck-subnav-sync", "deckNavSync");
  setText("equations-subnav-insert", "equationsNavInsert");
  setText("equations-subnav-selected", "equationsNavSelected");
  setText("equations-subnav-numbering", "equationsNavNumbering");
  setText("components-subnav-library", "componentsNavLibrary");
  setText("components-subnav-figure", "componentsNavFigure");
  setText("components-subnav-theorem", "componentsNavTheorem");
  setText("assets-subnav-references", "assetsNavReferences");
  setText("assets-subnav-charts", "assetsNavCharts");
  setText("assets-subnav-captions", "assetsNavCaptions");
  setText("settings-subnav-language", "settingsNavLanguage");

  const closeButtons = document.querySelectorAll(".panel-close");
  for (let closeIndex = 0; closeIndex < closeButtons.length; closeIndex++) {
    closeButtons[closeIndex].textContent = t("closePanel");
  }

  setText("deck-hero-title", "deckHeroTitle");
  setText("deck-hero-desc", "deckHeroDesc");
  setText("deck-quick-template-title", "deckQuickTemplateTitle");
  setText("deck-quick-template-desc", "deckQuickTemplateDesc");
  setText("deck-quick-sources-title", "deckQuickSourcesTitle");
  setText("deck-quick-sources-desc", "deckQuickSourcesDesc");
  setText("deck-quick-sync-title", "deckQuickSyncTitle");
  setText("deck-quick-sync-desc", "deckQuickSyncDesc");
  setText("deck-quick-settings-title", "deckQuickSettingsTitle");
  setText("deck-quick-settings-desc", "deckQuickSettingsDesc");
  setText("overview-title", "overviewTitle");
  setText("overview-desc", "overviewDesc");
  setText("active-template-label", "activeTemplateLabel");
  setText("meta-template-label", "metaTemplate");
  setText("meta-rules-label", "metaRules");
  setText("meta-targets-label", "metaTargets");
  setText("template-title", "templateTitle");
  setText("template-desc", "templateDesc");
  setText("refresh-selection-btn", "refreshSelection");
  setText("indicator-title", "indicatorTitle");
  setText("indicator-desc", "indicatorDesc");
  setText("tpl-name-label", "templateNameLabel");
  setPlaceholder("tpl-name", "templateNamePlaceholder");
  setText("tpl-kind-label", "templateKindLabel");
  setText("tpl-kind-header", "templateKindHeader");
  setText("tpl-kind-footer", "templateKindFooter");
  setText("tpl-kind-custom", "templateKindCustom");
  setText("tpl-placement-label", "placementLabel");
  setText("tpl-placement-top-left", "placementTopLeft");
  setText("tpl-placement-top-center", "placementTopCenter");
  setText("tpl-placement-top-right", "placementTopRight");
  setText("tpl-placement-bottom-left", "placementBottomLeft");
  setText("tpl-placement-bottom-center", "placementBottomCenter");
  setText("tpl-placement-bottom-right", "placementBottomRight");
  setText("tpl-placement-custom", "placementCustom");
  setText("tpl-layout-area-label", "layoutAreaLabel");
  setText("tpl-layout-area-slide", "layoutAreaSlide");
  setText("tpl-layout-area-safe-area", "layoutAreaSafeArea");
  setText("safe-area-title", "safeAreaTitle");
  setText("safe-area-hint", "safeAreaHint");
  setText("safe-area-top-label", "safeAreaTop");
  setText("safe-area-right-label", "safeAreaRight");
  setText("safe-area-bottom-label", "safeAreaBottom");
  setText("safe-area-left-label", "safeAreaLeft");
  setText("page-fmt-label", "pageFormatLabel");
  setText("total-title", "totalTitle");
  setText("total-hint", "totalHint");
  setText("save-btn", "saveTemplate");
  setText("source-title", "sourceTitle");
  setText("source-desc", "sourceDesc");
  setText("check-source-btn", "checkSource");
  setText("source-name-label", "sourceNameLabel");
  setPlaceholder("source-name-input", "sourceNamePlaceholder");
  setText("confirm-source-btn", "confirmAdd");
  setText("cancel-source-btn", "cancel");
  setText("save-sources-btn", "saveSources");
  setText("sync-title", "syncTitle");
  setText("sync-desc", "syncDesc");
  setText("exclude-title", "excludeTitle");
  setText("sync-loading-placeholder", "loadingSlides");
  setText("sync-start-label", "syncStartLabel");
  setText("sync-start-hint", "syncStartHint");
  setText("apply-btn", "applyAll");
  setText("sync-btn", "syncAll");
  setText("save-sync-btn", "saveSync");
  setText("remove-instances-btn", "removeTemplateInstances");
  setText("delete-template-btn", "deleteTemplate");
  setText("settings-title", "settingsTitle");
  setText("settings-desc", "settingsDesc");
  setText("language-setting-title", "languageSettingTitle");
  setText("language-setting-desc", "languageSettingDesc");
  setText("settings-beta-pill", "settingsNow");
  setText("settings-language-label", "settingsLanguageLabel");
  setText("save-settings-btn", "saveSettings");
  setText("settings-go-deck-btn", "settingsGoDeck");
  setText("settings-placeholder", "settingsPlaceholder");
  setText("equations-hero-title", "equationsHeroTitle");
  setText("equations-hero-desc", "equationsHeroDesc");
  setText("equations-overview-title", "equationsOverviewTitle");
  setText("equations-overview-desc", "equationsOverviewDesc");
  setText("equations-quick-insert-title", "equationsQuickInsertTitle");
  setText("equations-quick-insert-desc", "equationsQuickInsertDesc");
  setText("equations-quick-selected-title", "equationsQuickSelectedTitle");
  setText("equations-quick-selected-desc", "equationsQuickSelectedDesc");
  setText("equations-quick-numbering-title", "equationsQuickNumberingTitle");
  setText("equations-quick-numbering-desc", "equationsQuickNumberingDesc");
  setText("equations-insert-title", "equationsInsertTitle");
  setText("equations-insert-desc", "equationsInsertDesc");
  setText("equations-display-mode-label", "equationsDisplayModeLabel");
  setText("equations-font-size-label", "equationsFontSizeLabel");
  setText("equations-color-label", "equationsColorLabel");
  setPlaceholder("equation-input", "equationsInputPlaceholder");
  setText("equation-preview", "equationsPreviewEmpty");
  setText("equation-insert-btn", "equationsInsertButton");
  setText("equation-refresh-btn", "equationsRefreshButton");
  setText("equations-item-preview", "equationsItemPreview");
  setText("equations-item-mode", "equationsItemMode");
  setText("equations-item-style", "equationsItemStyle");
  setText("equations-selected-title", "equationsSelectedTitle");
  setText("equations-selected-desc", "equationsSelectedDesc");
  setText("equation-selected-status", "equationsSelectedEmpty");
  setPlaceholder("equation-selected-input", "equationsSelectedPlaceholder");
  setText("equations-selected-display-mode-label", "equationsDisplayModeLabel");
  setText("equations-selected-font-size-label", "equationsFontSizeLabel");
  setText("equations-selected-color-label", "equationsColorLabel");
  setText("equation-selected-preview", "equationsSelectedPreviewEmpty");
  setText("equation-update-btn", "equationsUpdateButton");
  setText("equation-delete-btn", "equationsDeleteButton");
  setText("equations-numbering-title", "equationsNumberingTitle");
  setText("equations-numbering-desc", "equationsNumberingDesc");
  setText("equations-numbering-scope-label", "equationsNumberingScopeLabel");
  setText("equations-numbering-style-label", "equationsNumberingStyleLabel");
  setText("equations-numbering-apply-btn", "equationsNumberingApply");
  setText("equations-numbering-clear-btn", "equationsNumberingClear");
  setText("equations-numbering-hint", "equationsNumberingHint");
  setText("snippet-title-common", "snippetTitleCommon");
  setText("snippet-title-greek", "snippetTitleSymbols");
  setText("components-hero-title", "componentsHeroTitle");
  setText("components-hero-desc", "componentsHeroDesc");
  setText("components-card-figure-title", "componentsFigureTitle");
  setText("components-card-figure-desc", "componentsFigureDesc");
  setText("components-card-theorem-title", "componentsTheoremTitle");
  setText("components-card-theorem-desc", "componentsTheoremDesc");
  setText("components-figure-title", "componentsFigurePanelTitle");
  setText("components-figure-desc", "componentsFigurePanelDesc");
  setText("components-theorem-title", "componentsTheoremPanelTitle");
  setText("components-theorem-desc", "componentsTheoremPanelDesc");
  setText("assets-hero-title", "assetsHeroTitle");
  setText("assets-hero-desc", "assetsHeroDesc");
  setText("assets-references-title", "assetsReferencesTitle");
  setText("assets-references-desc", "assetsReferencesDesc");
  setText("assets-charts-title", "assetsChartsTitle");
  setText("assets-charts-desc", "assetsChartsDesc");
  setText("assets-captions-title", "assetsCaptionsTitle");
  setText("assets-captions-desc", "assetsCaptionsDesc");

  const emptyOption = document.querySelector("#active-template-select option[value='']") as HTMLOptionElement | null;
  if (emptyOption) emptyOption.textContent = t("selectTemplate");

  const totalMode = document.getElementById("total-mode") as HTMLSelectElement | null;
  if (totalMode && totalMode.options.length >= 2) {
    totalMode.options[0].text = t("totalModeAuto");
    totalMode.options[1].text = t("totalModeCustom");
  }

  const pageFormat = document.getElementById("page-fmt") as HTMLSelectElement | null;
  if (pageFormat && pageFormat.options.length >= 5) {
    pageFormat.options[0].text = t("pageExampleOnly");
    pageFormat.options[1].text = t("pageExampleTotal");
    pageFormat.options[2].text = t("pageExampleTwoDigits");
    pageFormat.options[3].text = t("pageExampleOf");
    pageFormat.options[4].text = t("pageExamplePage");
  }

  const equationNumberingScope = document.getElementById("equations-numbering-scope") as HTMLSelectElement | null;
  if (equationNumberingScope && equationNumberingScope.options.length >= 2) {
    equationNumberingScope.options[0].text = t("equationsNumberingScopeCurrent");
    equationNumberingScope.options[1].text = t("equationsNumberingScopeAll");
  }

  const equationNumberingStyle = document.getElementById("equations-numbering-style") as HTMLSelectElement | null;
  if (equationNumberingStyle && equationNumberingStyle.options.length >= 3) {
    equationNumberingStyle.options[0].text = t("equationsNumberingStyleParen");
    equationNumberingStyle.options[1].text = t("equationsNumberingStyleEq");
    equationNumberingStyle.options[2].text = t("equationsNumberingStyleEqParen");
  }
}

/**
 * Re-apply all language-dependent UI: static strings plus dynamic panels.
 * Calls into rendering functions that live outside this module (expected to
 * be wired up by the main UI entry point).
 */
export function applyLanguage(): void {
  renderStaticLanguage();

  if (!(window as any).__selectedNodeId && document.getElementById("sel-empty")?.style.display !== "none") {
    setText("sel-empty", "selectionEmpty");
  }

  if (!(window as any).__selectedIndicId) {
    setText("ind-hint", "indicatorIdle");
  }

  document.documentElement.lang = state.currentLanguage === "en-US" ? "en" : "zh";

  // The following rendering calls depend on functions defined elsewhere.
  // They are invoked via the global scope so that this module stays
  // self-contained.  The main UI entry point is expected to expose them.
  if (typeof (window as any).renderModuleShell === "function") (window as any).renderModuleShell();
  if (typeof (window as any).refreshTemplatePanels === "function") (window as any).refreshTemplatePanels();
  if (typeof (window as any).renderBindNote === "function") (window as any).renderBindNote();
  if (typeof (window as any).setTemplateSummary === "function") (window as any).setTemplateSummary();
  if (typeof (window as any).onEquationSelection === "function") (window as any).onEquationSelection((window as any).__selectedEquation);
  if (typeof (window as any).renderEquationInsertPreview === "function") (window as any).renderEquationInsertPreview();
  if (typeof (window as any).renderSourceRules === "function") (window as any).renderSourceRules();
  if (typeof (window as any).renderSyncStep === "function") (window as any).renderSyncStep();
  if (typeof (window as any).updateOverview === "function") (window as any).updateOverview();
}
