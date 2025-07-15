/* eslint-disable */
import { ApiMessage } from "../../../api/types";
import { getActions, getGlobal, setGlobal } from "../../../global";
import { selectBot, selectChat } from "../../../global/selectors";
import {
  ChataiStores,
  GLOBAL_AI_TAG,
  GLOBAL_AICHATFOLDERS_TIP_SHOW,
} from "../store";
import { validateAndFixJsonStructure } from "../utils/util";
import { isSystemBot } from "../../../global/helpers";
import {
  AI_FOLDER_ID,
  AI_FOLDER_TITLE,
  PRESET_FOLDER_ID,
  PRESET_FOLDER_TITLE,
  SERVICE_NOTIFICATIONS_USER_ID,
  UNREAD_FOLDER_ID,
  UNREAD_FOLDER_TITLE,
} from "../../../config";
import { getAITags } from "./tag-filter";
import { intersection } from "lodash";
import eventEmitter, { Actions } from "../lib/EventEmitter";
import { AIChatFolderStep } from "./ai-chatfolders-tip";

export interface AIChatFolder {
  id?: string;
  chatId: number;
  chatTitle?: string;
  categoryTag: string[];
  presetTag: string[];
  AITag: string;
}
export const AICHATFOLDERS_LOG = "aiChatFoldersTask----";
export const AI_CHATFOLDERS_LIST = [
  "Friend",
  "Community",
  "Work",
  "Unrend",
  "Spam",
  "Preset",
  "AI",
];

export const formatJSONContent = (content: string) => {
  try {
    const result = validateAndFixJsonStructure(content.trim());
    if (result.valid) {
      if (result.fixedJson) {
        return JSON.parse(result.fixedJson);
      } else {
        console.error("json parse error", result.error);
      }
    } else {
      console.error("json parse error", result.error);
    }
  } catch (error) {
    console.error("json parse error", error);
    return null;
  }
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function chatAIChatFolders(body: string) {
  try {
    const res = await fetch(
      "https://telegpt-three.vercel.app/classify-generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }
    );
    const resJson = await res.json();
    return replaceToJSON(resJson?.text);
  } catch (error) {
    throw error;
  }
}

export async function saveAiChatFolders(list: AIChatFolder[]) {
  let global = getGlobal();

  let allAiChatFolders: AIChatFolder[] = [];
  list.forEach(async (item) => {
    const chat = selectChat(global, item.chatId + "");
    const classifyItem = {
      id: item.chatId + "",
      chatTitle: chat?.title,
      ...item,
    };
    allAiChatFolders.push(classifyItem);
  });
  global = {
    ...global,
    chatFolders: {
      ...global.chatFolders,
      nextAiChatFolders: allAiChatFolders,
    },
  };
  setGlobal(global);
}

export function groupAiChatFoldersRes(list: AIChatFolder[]) {
  let data: { [key: string]: number[] } = {};
  AI_CHATFOLDERS_LIST.forEach((item) => {
    const listIds = list
      .filter((o) => o?.categoryTag?.indexOf(item) >= 0)
      ?.map((i) => i?.chatId);
    if (listIds?.length) {
      data[item] = listIds;
    }
  });

  return data;
}

export async function batchAiChatFolders(
  chatMessages: { [key: string]: ApiMessage[] },
  batchSize: number
) {
  const chatKeys = Object.keys(chatMessages);
  let res: AIChatFolder[] = [];
  for (let i = 0; i < chatKeys.length; i += batchSize) {
    const batchKeys = chatKeys.slice(i, i + batchSize);
    const chatMsgs = batchKeys.map((chatId) => {
      return {
        chatId,
        messages: chatMessages[chatId]
          .map((message) => message.content.text?.text ?? "")
          .filter((item) => item !== null),
      };
    });
    if (chatMsgs.length) {
      const aiRes = await chatAIChatFolders(
        JSON.stringify({
          messages: chatMsgs,
          flag: true,
        })
      );
      res = res.concat(aiRes);
    }
  }

  return res;
}

export async function deleteAiChatFolders() {
  console.log(AICHATFOLDERS_LOG + "delete-start", new Date());
  const { deleteChatFolder } = getActions();

  const res = await ChataiStores.folder?.getAllFolders();
  for (let i = 0; i < (res || [])?.length; i++) {
    const folderInfoDb = res?.[i];
    if (folderInfoDb) {
      if (
        folderInfoDb?.from === "AI" ||
        folderInfoDb.title === UNREAD_FOLDER_TITLE ||
        folderInfoDb?.title === PRESET_FOLDER_TITLE ||
        folderInfoDb?.title === AI_FOLDER_TITLE
      ) {
        // 删除AI分类, Unread分类, Preset分类, AI分类
        console.log(
          AICHATFOLDERS_LOG + "delete: " + folderInfoDb?.id,
          new Date()
        );
        await deleteChatFolder?.({ id: Number(folderInfoDb?.id) });
        await sleep(3000);
      }
    }
  }
  console.log(AICHATFOLDERS_LOG + "delete-end", new Date());
}

export async function deleteAiChatFoldersFromUser() {
  console.log(AICHATFOLDERS_LOG + "delete-start-user", new Date());
  const { deleteChatFolder } = getActions();

  const res = await ChataiStores.folder?.getAllFolders();
  for (let i = 0; i < (res || [])?.length; i++) {
    const folderInfoDb = res?.[i];
    if (folderInfoDb) {
      if (
        folderInfoDb?.from === "AI" ||
        folderInfoDb.title === UNREAD_FOLDER_TITLE ||
        folderInfoDb?.title === PRESET_FOLDER_TITLE ||
        folderInfoDb?.title === AI_FOLDER_TITLE
      ) {
        // 删除AI分类, Unread分类, Preset分类, AI分类
        console.log(
          AICHATFOLDERS_LOG + "delete: " + folderInfoDb?.id,
          new Date()
        );
        await deleteChatFolder?.({ id: Number(folderInfoDb?.id) });
        await sleep(3000);
      }
    }
  }
  let global = getGlobal();
  global = {
    ...global,
    chatFolders: {
      ...global.chatFolders,
      orderedIds: filterAIFolder(global.chatFolders?.orderedIds ?? []),
      aiChatFolders: {
        ...global.chatFolders?.aiChatFolders,
        list: [],
      },
      nextAiChatFolders: global.chatFolders?.aiChatFolders?.list || [],
    },
  };
  setGlobal(global);
  // ChataiStores.general?.delete(GLOBAL_AICHATFOLDERS_LAST_TIME);
  console.log(AICHATFOLDERS_LOG + "delete-end-user", new Date());
}

export function isChatBot(chatId: string) {
  const global = getGlobal();
  return (
    isSystemBot(chatId) ||
    chatId === SERVICE_NOTIFICATIONS_USER_ID ||
    selectBot(global, chatId)
  );
}

export async function sortChatFolder() {
  const global = getGlobal();
  let ids =
    Object.keys(global.chatFolders.byId)?.map((item) => Number(item)) || [];
  if (ids?.length) {
    ids = [0, ...ids];
  }
  console.log(AICHATFOLDERS_LOG + "sort: ", ids);
  await getActions().sortChatFolders({ folderIds: ids });
}

export function filterAIFolder(ids: number[] | undefined) {
  return ids?.filter(
    (id) =>
      id !== AI_FOLDER_ID && id !== PRESET_FOLDER_ID && id !== UNREAD_FOLDER_ID
  );
}

export function replaceToJSON(text: string) {
  try {
    const jsonString = text
      ?.replaceAll("\n", "")
      ?.replace("```json", "")
      ?.replace("```", "")
      ?.trim();
    return JSON.parse(jsonString);
  } catch (error) {
    try {
      return formatJSONContent(text);
    } catch (error) {
      return undefined;
    }
  }
}

export function updateAiChatFoldersToGlobal(nextAiChatFolders: AIChatFolder[]) {
  let global = getGlobal();
  const aiAllTags = getAITags();
  const activeAITag = intersection(
    aiAllTags,
    global?.chatFolders?.aiChatFolders?.activeAITag ?? []
  );
  ChataiStores.general?.set(GLOBAL_AI_TAG, activeAITag);

  nextAiChatFolders.forEach((classifyItem) => {
    ChataiStores.aIChatFolders?.addAIChatFolder(classifyItem);
  });
  global = {
    ...global,
    chatFolders: {
      ...global.chatFolders,
      aiChatFolders: {
        ...global.chatFolders?.aiChatFolders,
        list: nextAiChatFolders,
        activeAITag,
      },
      nextAiChatFolders: [],
    },
  };
  setGlobal(global);
}

export function hideTip(step: AIChatFolderStep) {
  if (step === AIChatFolderStep.classify) {
    eventEmitter.emit(Actions.UpdateSettingAIChatFoldersLoading, {
      loading: false,
      isApply: false
    });
  } else {
    eventEmitter.emit(Actions.UpdateAIChatFoldersApplying, {
      loading: false,
    });
  }
}

export function showTip() {
  ChataiStores.general?.get(GLOBAL_AICHATFOLDERS_TIP_SHOW)?.then((res) => {
    if (res !== undefined) {
      ChataiStores.general?.set(GLOBAL_AICHATFOLDERS_TIP_SHOW, true);
    }
  });
  eventEmitter.emit(Actions.UpdateAIChatFoldersApplying, {
    loading: false,
    isShowTip: true,
  });
  eventEmitter.emit(Actions.UpdateSettingAIChatFoldersLoading, {
    loading: false,
    isApply: false
  });
}
