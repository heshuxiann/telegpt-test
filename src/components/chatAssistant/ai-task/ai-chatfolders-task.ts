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
import { ChataiStores, GLOBAL_AICHATFOLDERS_LAST_TIME } from "../store";
import {
  batchAiChatFolders,
  AI_CHATFOLDERS_LIST,
  AI_CHATFOLDERS_LOG_PRE,
  AIChatFolder,
  deleteAiChatFolders,
  groupAiChatFoldersRes,
  isChatBot,
  saveAiChatFolders,
  sleep,
} from "../ai-chatfolders/util";
import { uniq } from "lodash";
import { selectSharedSettings } from "../../../global/selectors/sharedState";

const AI_CHATFOLDERS_INTERVAL_TIME = 1000 * 60 * 60 * 24 * 7;
const AI_CHATFOLDERS_BATCH_SIZE = 20;

class AIChatFoldersTask {
  private static instance: AIChatFoldersTask | undefined;

  public static getInstance() {
    if (!AIChatFoldersTask.instance) {
      AIChatFoldersTask.instance = new AIChatFoldersTask();
    }
    return AIChatFoldersTask.instance;
  }

  async initTask() {
    setInterval(async () => {
      this.classifyChatMessageByCount();
    }, AI_CHATFOLDERS_INTERVAL_TIME);

    setTimeout(() => {
      this.classifyChatMessageByCount();
    }, 1000);
  }

  async runAIChatFolders(chatMessages: { [key: string]: ApiMessage[] }) {
    if (!Object.keys(chatMessages).length) return;
    // 1. ai chat folders classify
    const res: AIChatFolder[] = await batchAiChatFolders(
      chatMessages,
      AI_CHATFOLDERS_BATCH_SIZE
    );
    console.log(AI_CHATFOLDERS_LOG_PRE + "aiClassify: ", res, new Date());
    // 2. save classify result
    saveAiChatFolders(res);
    const groupedRes = groupAiChatFoldersRes(res);
    // 3. update chat folder
    await this.updateChatFolder(groupedRes);
  }

  async updateChatFolder(content: { [key: string]: number[] }) {
    const sortedKeys = Object.keys(content);
    if (!sortedKeys.length) return;

    const { addChatFolder, editChatFolder } = getActions();
    console.log(
      AI_CHATFOLDERS_LOG_PRE + "updateChatFolder: ",
      sortedKeys,
      new Date()
    );

    // delete all ai chat folder
    await deleteAiChatFolders();
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
        if (exist) {
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
            AI_CHATFOLDERS_LOG_PRE + "update: " + folderTitle,
            folder,
            new Date()
          );
        } else {
          await addChatFolder?.({ folder, from: "AI" });
          console.log(
            AI_CHATFOLDERS_LOG_PRE + "add: " + folderTitle,
            folder,
            new Date()
          );
        }
        await sleep(3000);
      }
    }
    await this.sortChatFolder();
    // update last classify time
    ChataiStores.general?.set(
      GLOBAL_AICHATFOLDERS_LAST_TIME,
      new Date().getTime()
    );
    console.log(AI_CHATFOLDERS_LOG_PRE + "end", new Date());
  }

  async sortChatFolder() {
    // sort folders
    const global = getGlobal();
    const ids = Object.keys(global.chatFolders.byId)
      ?.sort(
        (a, b) =>
          (AI_CHATFOLDERS_LIST?.findIndex(
            (item) =>
              item === (global.chatFolders.byId[Number(a)]?.title?.text ?? "")
          ) ?? 0) -
          (AI_CHATFOLDERS_LIST?.findIndex(
            (item) =>
              item === (global.chatFolders.byId[Number(b)]?.title?.text ?? "")
          ) ?? 0)
      )
      ?.map((item) => Number(item));
    const folderIds = [0, ...ids, PRESET_FOLDER_ID, AI_FOLDER_ID];
    folderIds.splice(3, 0, UNREAD_FOLDER_ID);
    await getActions().sortChatFolders({ folderIds });
    console.log(
      AI_CHATFOLDERS_LOG_PRE + "sort: ",
      folderIds,
      new Date(),
      global.chatFolders
    );
  }

  async classifyChatMessageByCount() {
    const global = getGlobal();
    const { aiChatFolders } = selectSharedSettings(global);
    if (aiChatFolders !== true) {
      console.log(AI_CHATFOLDERS_LOG_PRE + "enable=false, pass", global);
      return;
    }
    const lastTime = await ChataiStores.general?.get(
      GLOBAL_AICHATFOLDERS_LAST_TIME
    );
    if (
      lastTime &&
      new Date().getTime() - lastTime < AI_CHATFOLDERS_INTERVAL_TIME
    ) {
      console.log(AI_CHATFOLDERS_LOG_PRE + "pass", lastTime, global);
      return;
    }
    console.log(
      AI_CHATFOLDERS_LOG_PRE + "running",
      lastTime,
      global.chatFolders
    );
    let chatMessages: { [key: string]: ApiMessage[] } = {};
    const orderedIds = (getOrderedIds(ALL_FOLDER_ID) || [])?.filter(
      (o) => o !== SERVICE_NOTIFICATIONS_USER_ID
    );
    console.log(AI_CHATFOLDERS_LOG_PRE + "orderedIds:", orderedIds);
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
      AI_CHATFOLDERS_LOG_PRE + "fetchMsg",
      Object.keys(chatMessages).length
    );

    await this.runAIChatFolders(chatMessages);
  }
}

export const aiChatFoldersTask = new AIChatFoldersTask();
