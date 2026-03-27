import { normalizeStorage } from "./normalize";
import type { PluginStorage } from "./types";

export const STORAGE_KEY = "academicSlides_v2";

export function getPluginData(node: any, key: string): string {
  return node && typeof node.getPluginData === "function" ? node.getPluginData(key) : "";
}

export async function getStorage(): Promise<PluginStorage> {
  const raw = await figma.clientStorage.getAsync(STORAGE_KEY);
  return normalizeStorage(raw || emptyStorage());
}

export async function saveStorage(storage: PluginStorage): Promise<void> {
  await figma.clientStorage.setAsync(STORAGE_KEY, normalizeStorage(storage));
}

export function cleanStaleMapEntries(storage: PluginStorage): void {
  const validTemplateIds = new Set(Object.keys(storage.templates));
  const keysToRemove: string[] = [];
  for (const key of Object.keys(storage.templateInstanceMap)) {
    const templateId = key.split("::")[0];
    if (!validTemplateIds.has(templateId)) {
      keysToRemove.push(key);
    }
  }
  for (let i = 0; i < keysToRemove.length; i++) {
    delete storage.templateInstanceMap[keysToRemove[i]];
  }
}

function emptyStorage(): PluginStorage {
  return {
    templates: {},
    templateInstanceMap: {},
    settings: {
      language: "zh-CN"
    }
  };
}
