// ---------------------------------------------------------------------------
// Slide Templates UI — browse and insert pre-built academic slide layouts
// ---------------------------------------------------------------------------

declare function send(type: string, extra?: Record<string, any>): void;
declare function toast(scope: string, message: string, type?: string): void;
declare function t(key: string, vars?: Record<string, any>): string;

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function insertSlideTemplate(templateType: string): void {
  send("insert-slide-template", { templateType });
}

// ---------------------------------------------------------------------------
// Message handlers
// ---------------------------------------------------------------------------

export function onSlideTemplateInserted(message: any): void {
  toast("slide-templates", t("slideTemplateInserted", { name: message.name || message.templateType }), "success");
}
