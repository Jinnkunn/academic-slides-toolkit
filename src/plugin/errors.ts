// ---------------------------------------------------------------------------
// Plugin error helpers
// ---------------------------------------------------------------------------

export interface PluginError extends Error {
  errorKey: string;
  errorVars: Record<string, any>;
}

/**
 * Create an Error enriched with an i18n error key and interpolation vars.
 */
export function createPluginError(
  errorKey: string,
  fallbackMessage: string,
  vars?: Record<string, any>
): PluginError {
  const error = new Error(fallbackMessage) as PluginError;
  error.errorKey = errorKey;
  error.errorVars = vars || {};
  return error;
}

/**
 * Post an error message to the UI.
 */
export function postError(
  message: string,
  errorKey?: string,
  errorVars?: Record<string, any>
): void {
  figma.ui.postMessage({
    type: "error",
    message,
    errorKey: errorKey || "",
    errorVars: errorVars || {},
  });
}
