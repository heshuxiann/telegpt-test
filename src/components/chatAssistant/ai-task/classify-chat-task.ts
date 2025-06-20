import { ApiMessage, MAIN_THREAD_ID } from "../../../api/types/messages";
import {
  AI_FOLDER_ID,
  ALL_FOLDER_ID,
  PRESET_FOLDER_ID,
  SERVICE_NOTIFICATIONS_USER_ID,
  UNREAD_FOLDER_ID,
} from "../../../config";
import { getActions, getGlobal } from "../../../global";
import { selectChat, selectChatLastMessageId } from "../../../global/selectors";
import { getOrderedIds } from "../../../util/folderManager";
import { fetchChatMessageByCount } from "../utils/fetch-messages";
import { ChataiStores, GLOBAL_CLASSIFY_LAST_TIME } from "../store";
import {
  batchChatAIClassify,
  CLASSICATION_LIST,
  CLASSICATION_LOG_PRE,
  ClassifyChatFolder,
  deleteAIClassify,
  groupClassifyRes,
  isChatBot,
  saveChatClassify,
  sleep,
} from "../classifyChat/util";
import { uniq } from "lodash";
import { selectSharedSettings } from "../../../global/selectors/sharedState";

const CLASSICATION_INTERVAL_TIME = 1000 * 60 * 60 * 24 * 7;
const CLASSICATION_BATCH_SIZE = 20;

class ClassifyChatTask {
  private static instance: ClassifyChatTask | undefined;

  public static getInstance() {
    if (!ClassifyChatTask.instance) {
      ClassifyChatTask.instance = new ClassifyChatTask();
    }
    return ClassifyChatTask.instance;
  }

  async initTask() {
    setInterval(async () => {
      this.classifyChatMessageByCount();
    }, CLASSICATION_INTERVAL_TIME);

    setTimeout(() => {
      this.classifyChatMessageByCount();
    }, 1000);
  }

  async runClassify(chatMessages: { [key: string]: ApiMessage[] }) {
    if (!Object.keys(chatMessages).length) return;
    // 1. ai classify chat
    const res: ClassifyChatFolder[] = await batchChatAIClassify(
      chatMessages,
      CLASSICATION_BATCH_SIZE
    );
    console.log(CLASSICATION_LOG_PRE + "aiClassify: ", res, new Date());
    // 2. save classify result
    saveChatClassify(res);
    const groupedRes = groupClassifyRes(res);
    // 3. update chat folder
    this.updateChatFolder(groupedRes);
  }

  async updateChatFolder(content: { [key: string]: number[] }) {
    const sortedKeys = Object.keys(content);
    if (!sortedKeys.length) return;

    const { addChatFolder, editChatFolder } = getActions();
    console.log(
      CLASSICATION_LOG_PRE + "updateChatFolder: ",
      sortedKeys,
      new Date()
    );

    // delete all ai chat folder
    await deleteAIClassify();
    // add folders
    for (let i = 0; i < sortedKeys.length; i++) {
      const folderTitle = sortedKeys[i];
      if (content[folderTitle].length) {
        const folder = {
          id: i + 2,
          title: { text: folderTitle, desc: "AI" },
          includedChatIds: content[folderTitle].map((item) => item + ""),
          excludedChatIds: [],
        };
        const exist = await ChataiStores.folder?.getFolder(folderTitle);
        if (exist && exist?.from !== "AI") {
          // 用户已有自定义分类，将用户自定义标签和AI标签对比去重后取合集
          folder.id = Number(exist.id);
          folder.includedChatIds = uniq(
            folder.includedChatIds.concat(exist.includedChatIds)
          );
          await editChatFolder?.({
            id: folder.id,
            folderUpdate: folder,
            from: "AI",
          });
          console.log(
            CLASSICATION_LOG_PRE + "update: " + folderTitle,
            folder,
            new Date()
          );
        } else {
          await addChatFolder?.({ folder, from: "AI" });
          console.log(
            CLASSICATION_LOG_PRE + "add: " + folderTitle,
            folder,
            new Date()
          );
        }
        if (i < sortedKeys.length - 1) {
          await sleep(5000);
        }
      }
    }
    await this.sortChatFolder();
    // update last classify time
    ChataiStores.general?.set(GLOBAL_CLASSIFY_LAST_TIME, new Date().getTime());
    console.log(CLASSICATION_LOG_PRE + "end", new Date());
  }

  async sortChatFolder() {
    // sort folders
    const global = getGlobal();
    const ids = Object.keys(global.chatFolders.byId)
      ?.sort(
        (a, b) =>
          (CLASSICATION_LIST?.findIndex(
            (item) =>
              item === (global.chatFolders.byId[Number(a)]?.title?.text ?? "")
          ) ?? 0) -
          (CLASSICATION_LIST?.findIndex(
            (item) =>
              item === (global.chatFolders.byId[Number(b)]?.title?.text ?? "")
          ) ?? 0)
      )
      ?.map((item) => Number(item));
    const folderIds = [0, ...ids, PRESET_FOLDER_ID, AI_FOLDER_ID];
    folderIds.splice(3, 0, UNREAD_FOLDER_ID);
    await getActions().sortChatFolders({ folderIds });
    console.log(
      CLASSICATION_LOG_PRE + "sort: ",
      folderIds,
      new Date(),
      global.chatFolders
    );
  }

  async classifyChatMessageByCount() {
    const global = getGlobal();
    const { aiChatFolders } = selectSharedSettings(global);
    if (aiChatFolders === false) {
      console.log(CLASSICATION_LOG_PRE + "enable=false", global);
      return;
    }
    const globalClassifyLastTime = await ChataiStores.general?.get(
      GLOBAL_CLASSIFY_LAST_TIME
    );
    if (
      globalClassifyLastTime &&
      new Date().getTime() - globalClassifyLastTime < CLASSICATION_INTERVAL_TIME
    ) {
      console.log(
        CLASSICATION_LOG_PRE + "pass",
        globalClassifyLastTime,
        global
      );
      return;
    }
    console.log(
      CLASSICATION_LOG_PRE + "running",
      globalClassifyLastTime,
      global.chatFolders
    );
    let chatMessages: { [key: string]: ApiMessage[] } = {};
    const orderedIds = (getOrderedIds(ALL_FOLDER_ID) || [])?.filter(
      (o) => o !== SERVICE_NOTIFICATIONS_USER_ID
    );
    for (let i = 0; i < orderedIds.length; i++) {
      const chatId = orderedIds[i];
      const chat = selectChat(global, chatId);
      const chatBot = isChatBot(chatId);
      const chatLastMessageId = selectChatLastMessageId(global, chatId) || 0;
      if (chat && !chatBot && chatLastMessageId) {
        const roomMsgs = await fetchChatMessageByCount({
          chat,
          offsetId: chatLastMessageId,
          addOffset: -1,
          sliceSize: 30,
          threadId: MAIN_THREAD_ID,
          maxCount: 100,
        });
        if (roomMsgs.length) {
          chatMessages[chatId] = roomMsgs;
        }
      }
    }
    console.log(
      CLASSICATION_LOG_PRE + "fetchMsg",
      Object.keys(chatMessages).length
    );

    this.runClassify(chatMessages);
  }
}

export const classifyChatTask = new ClassifyChatTask();
