import { ApiMessage } from "../../../api/types";
import { getActions, getGlobal, setGlobal } from "../../../global";
import { selectBot, selectChat } from "../../../global/selectors";
import { ChataiStores, GLOBAL_AI_TAG } from "../store";
import { validateAndFixJsonStructure } from "../utils/util";
import { isSystemBot } from "../../../global/helpers";
import { SERVICE_NOTIFICATIONS_USER_ID } from "../../../config"
import { getAITags } from "./tag-filter"
import { intersection } from "lodash"

export interface AIChatFolder {
  id?: string;
  chatId: number;
  chatTitle?: string;
  categoryTag: string[];
  presetTag: string[];
  AITag: string;
}
export const AI_CHATFOLDERS_LOG_PRE = "aiChatFoldersTask----";
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
  return formatJSONContent(resJson?.text);
}

export async function saveAiChatFolders(list: AIChatFolder[]) {
  let global = getGlobal();

  let activeAITag: string[] = global?.chatFolders?.aiChatFolders?.activeAITag ?? [];
  let allAiChatFolders: AIChatFolder[] = [];
  list.forEach(async (item) => {
    const chat = selectChat(global, item.chatId + "");
    const classifyItem = {
      id: item.chatId + "",
      chatTitle: chat?.title,
      ...item,
    };
    allAiChatFolders.push(classifyItem);
    ChataiStores.aIChatFolders?.addAIChatFolder(classifyItem);
  });
  const aiAllTags = getAITags()
  activeAITag = intersection(aiAllTags, activeAITag)
  ChataiStores.general?.set(GLOBAL_AI_TAG, activeAITag);
  global = {
    ...global,
    chatFolders: {
      ...global.chatFolders,
      aiChatFolders: {
        ...global.chatFolders?.aiChatFolders,
        list: allAiChatFolders,
        activeAITag,
      },
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
        })
      );
      res = res.concat(aiRes);
    }
  }

  return res;
}

export async function deleteAiChatFolders() {
  const { deleteChatFolder } = getActions();

  const res = await ChataiStores.folder?.getAllFolders();
  for (let i = 0; i < (res || [])?.length; i++) {
    const folderInfoDb = res?.[i];
    if (folderInfoDb && folderInfoDb?.from === "AI") {
      // 删除AI分类
      console.log(
        AI_CHATFOLDERS_LOG_PRE + "delete: " + folderInfoDb?.id,
        new Date()
      );
      await deleteChatFolder?.({ id: Number(folderInfoDb?.id) });
      if (i < (res || [])?.length - 1) {
        await sleep(5000);
      }
    }
  }
}

export function isChatBot(chatId: string) {
  const global = getGlobal();
  return (isSystemBot(chatId) || chatId === SERVICE_NOTIFICATIONS_USER_ID) || selectBot(global, chatId);
}
