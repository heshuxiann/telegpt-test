import { intersection } from "lodash";
import { getGlobal } from "../../../global";

export function filterPresetTag(orderedIds?: string[]) {
  const global = getGlobal();

  const activePresetTag = global?.chatFolders?.classifys?.activePresetTag;
  if (!orderedIds || !activePresetTag || !activePresetTag?.length)
    return orderedIds;

  const allClassifyChat = global?.chatFolders?.classifys?.list;
  if (allClassifyChat?.length) {
    return allClassifyChat
      ?.filter((o) => intersection(o?.presetTag, activePresetTag).length)
      ?.map((o) => o?.id ?? "");
  } else {
    return orderedIds;
  }
}

export function filterAITag(orderedIds?: string[]) {
  const global = getGlobal();

  const activeAITag = global?.chatFolders?.classifys?.activeAITag;
  if (!orderedIds || !activeAITag || !activeAITag?.length) return orderedIds;

  const allClassifyChat = global?.chatFolders?.classifys?.list;
  if (allClassifyChat?.length) {
    return allClassifyChat
      ?.filter((o) => intersection(o?.AITag, activeAITag).length)
      ?.map((o) => o?.id ?? "");
  } else {
    return orderedIds;
  }
}

export function getAITags() {
  const global = getGlobal();
  const allClassifyChat = global?.chatFolders?.classifys?.list;

  return (
    allClassifyChat
      ?.filter((o) => o?.AITag?.length)
      ?.flatMap((o) => o?.AITag) ?? []
  );
}
