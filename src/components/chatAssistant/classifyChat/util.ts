import { ApiMessage } from "../../../api/types";
import { getActions, getGlobal, setGlobal } from "../../../global";
import { selectBot, selectChat } from "../../../global/selectors";
import { ChataiStores, GLOBAL_AI_TAG } from "../store";
import { validateAndFixJsonStructure } from "../utils/util";
import { isSystemBot } from "../../../global/helpers";
import { SERVICE_NOTIFICATIONS_USER_ID } from "../../../config"

export interface ClassifyChatFolder {
  id?: string;
  chatId: number;
  chatTitle?: string;
  categoryTag: string[];
  presetTag: string[];
  AITag: string;
}
export const CLASSICATION_LOG_PRE = "classifyTask----";
export const CLASSICATION_LIST = [
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

async function chatAIClassify(body: string) {
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

export async function saveChatClassify(list: ClassifyChatFolder[]) {
  let global = getGlobal();

  let allClassifyChat: ClassifyChatFolder[] = [];
  list.forEach(async (item) => {
    const chat = selectChat(global, item.chatId + "");
    const classifyItem = {
      id: item.chatId + "",
      chatTitle: chat?.title,
      ...item,
    };
    allClassifyChat.push(classifyItem);
    ChataiStores.chatClassify?.addClassify(classifyItem);
  });
  ChataiStores.general?.set(GLOBAL_AI_TAG, []);
  global = {
    ...global,
    chatFolders: {
      ...global.chatFolders,
      classifys: {
        ...global.chatFolders?.classifys,
        list: allClassifyChat,
        activeAITag: [],
      },
    },
  };
  setGlobal(global);
}

export function groupClassifyRes(list: ClassifyChatFolder[]) {
  let data: { [key: string]: number[] } = {};
  CLASSICATION_LIST.forEach((item) => {
    const listIds = list
      .filter((o) => o?.categoryTag?.indexOf(item) >= 0)
      ?.map((i) => i?.chatId);
    if (listIds?.length) {
      data[item] = listIds;
    }
  });

  return data;
}

export async function batchChatAIClassify(
  chatMessages: { [key: string]: ApiMessage[] },
  batchSize: number
) {
  const chatKeys = Object.keys(chatMessages);
  let res: ClassifyChatFolder[] = [];
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
      const aiClassifyRes = await chatAIClassify(
        JSON.stringify({
          messages: chatMsgs,
        })
      );
      res = res.concat(aiClassifyRes);
    }
  }

  return res;
}

export async function deleteAIClassify() {
  const { deleteChatFolder } = getActions();

  const res = await ChataiStores.folder?.getAllFolders();
  for (let i = 0; i < (res || [])?.length; i++) {
    const folderInfoDb = res?.[i];
    if (folderInfoDb && folderInfoDb?.from === "AI") {
      // 删除AI分类
      console.log(
        CLASSICATION_LOG_PRE + "delete: " + folderInfoDb?.id,
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
