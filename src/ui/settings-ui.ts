// ---------------------------------------------------------------------------
// Settings UI functions -- extracted from ui.html
// ---------------------------------------------------------------------------

import { state } from "./state";

// Declared helpers from utils / i18n (not yet extracted into their own modules)
declare function send(type: string, extra?: Record<string, any>): void;
declare function toast(scope: string, message: string, type?: string): void;
declare function t(key: string, vars?: Record<string, any>): string;
declare function applyLanguage(): void;

// ---------------------------------------------------------------------------
// applySettings  (ui.html ~line 2828)
// ---------------------------------------------------------------------------
export function applySettings(settings: any): void {
  const language = settings && settings.language === "en-US" ? "en-US" : "zh-CN";
  state.currentLanguage = language;
  (document.getElementById("settings-language") as HTMLSelectElement).value = language;
  applyLanguage();
}

// ---------------------------------------------------------------------------
// saveSettings  (ui.html ~line 3794)
// ---------------------------------------------------------------------------
export function saveSettings(): void {
  const language = (document.getElementById("settings-language") as HTMLSelectElement).value === "en-US" ? "en-US" : "zh-CN";
  send("save-settings", {
    settings: {
      language: language,
    },
  });
}

// ---------------------------------------------------------------------------
// onSettingsReceived  (ui.html ~line 3981)
// ---------------------------------------------------------------------------
export function onSettingsReceived(message: any): void {
  applySettings(message.settings || {});
}

// ---------------------------------------------------------------------------
// onSettingsSaved  (ui.html ~line 3985)
// ---------------------------------------------------------------------------
export function onSettingsSaved(message: any): void {
  applySettings(message.settings || {});
  toast("settings", t("settingsSaved"), "success");
}
