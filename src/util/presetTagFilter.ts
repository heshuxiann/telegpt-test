import { getGlobal } from "../global"

export function filterPresetTag(orderedIds?: string[]) {
  const global = getGlobal()

  const activeTag = global?.chatFolders?.classifys?.activeTag
  if (!orderedIds || !activeTag || activeTag ==='') return orderedIds

  const allClassifyChat = global?.chatFolders?.classifys?.list
  return allClassifyChat?.filter(o => o?.presetTag.indexOf(activeTag) >= 0)?.map(o => o?.id ?? '')
}
