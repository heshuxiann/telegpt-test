import { filterAITag, filterPresetTag } from "../components/chatAssistant/classifyChat/tag-filter"
import { isChatBot } from "../components/chatAssistant/classifyChat/util"
import { AI_FOLDER_ID, ALL_FOLDER_ID, PRESET_FOLDER_ID, UNREAD_FOLDER_ID } from "../config"
import { useEffect } from '../lib/teact/teact';

import {
  addChatsCountCallback,
  addOrderedIdsCallback, addUnreadChatsByFolderIdCallback,
  addUnreadCountersCallback,
  getChatsCount,
  getOrderedIds, getUnreadChatsByFolderId,
  getUnreadCounters,
} from '../util/folderManager';
import useForceUpdate from './useForceUpdate';

export function useFolderManagerForOrderedIds(folderId: number) {
  const forceUpdate = useForceUpdate();

  useEffect(() => addOrderedIdsCallback(folderId, forceUpdate), [folderId, forceUpdate]);

  if (folderId === UNREAD_FOLDER_ID) {
    return getUnreadChatsByFolderId()[ALL_FOLDER_ID]
  }
  if (folderId === PRESET_FOLDER_ID) {
    return filterPresetTag(getOrderedIds(ALL_FOLDER_ID)?.filter(i => !isChatBot(i)))
  }
  if (folderId === AI_FOLDER_ID) {
    return filterAITag(getOrderedIds(ALL_FOLDER_ID)?.filter(i => !isChatBot(i)))
  }

  return getOrderedIds(folderId);
}

export function useFolderManagerForUnreadCounters() {
  const forceUpdate = useForceUpdate();

  useEffect(() => addUnreadCountersCallback(forceUpdate), [forceUpdate]);

  return getUnreadCounters();
}

export function useFolderManagerForChatsCount() {
  const forceUpdate = useForceUpdate();

  useEffect(() => addChatsCountCallback(forceUpdate), [forceUpdate]);

  return getChatsCount();
}

export function useFolderManagerForUnreadChatsByFolder() {
  const forceUpdate = useForceUpdate();

  useEffect(() => addUnreadChatsByFolderIdCallback(forceUpdate), [forceUpdate]);

  return getUnreadChatsByFolderId();
}
