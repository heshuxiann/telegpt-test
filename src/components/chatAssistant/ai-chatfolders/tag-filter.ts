/* eslint-disable */
import { intersection } from "lodash";
import { getGlobal } from "../../../global";

export function filterPresetTag(orderedIds?: string[]) {
  const global = getGlobal();

  const activePresetTag = global?.chatFolders?.aiChatFolders?.activePresetTag;
  if (!orderedIds || !activePresetTag || !activePresetTag?.length)
    return orderedIds;

  const allAiChatFolders = global?.chatFolders?.aiChatFolders?.list;
  if (allAiChatFolders?.length) {
    return allAiChatFolders
      ?.filter((o) => intersection(o?.presetTag, activePresetTag).length)
      ?.map((o) => o?.id ?? "");
  } else {
    return orderedIds;
  }
}

export function filterAITag(orderedIds?: string[]) {
  const global = getGlobal();

  const activeAITag = global?.chatFolders?.aiChatFolders?.activeAITag;
  if (!orderedIds || !activeAITag || !activeAITag?.length) return orderedIds;

  const allAiChatFolders = global?.chatFolders?.aiChatFolders?.list;
  if (allAiChatFolders?.length) {
    return allAiChatFolders
      ?.filter((o) => intersection(o?.AITag, activeAITag).length)
      ?.map((o) => o?.id ?? "");
  } else {
    return orderedIds;
  }
}

export function getAITags() {
  const global = getGlobal();
  const allAiChatFolders = global?.chatFolders?.aiChatFolders?.list;

  if (!Array.isArray(allAiChatFolders)) return [];

  const tagCountMap: Record<string, number> = {};
  allAiChatFolders.forEach((o: any) => {
    (o?.AITag ?? []).forEach((tag: string) => {
      tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
    });
  });

  const tags = Object.entries(tagCountMap)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 10);

  return tags;
}
