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
import {
  ChataiStores,
  GLOBAL_AICHATFOLDERS_LAST_TIME,
  GLOBAL_AICHATFOLDERS_STEP,
  GLOBAL_AICHATFOLDERS_TIP_SHOW,
} from "../store";
import {
  batchAiChatFolders,
  AI_CHATFOLDERS_LIST,
  AICHATFOLDERS_LOG,
  AIChatFolder,
  deleteAiChatFolders,
  groupAiChatFoldersRes,
  isChatBot,
  saveAiChatFolders,
  sleep,
  updateAiChatFoldersTOGlobal,
} from "../ai-chatfolders/util";
import { flatMap, uniq } from "lodash";
import { selectSharedSettings } from "../../../global/selectors/sharedState";
import eventEmitter, { Actions } from "../lib/EventEmitter";
import { AIChatFolderStep } from "../ai-chatfolders/ai-chatfolders-tip";

const AI_CHATFOLDERS_INTERVAL_TIME = 1000 * 60 * 60 * 24 * 7;
const AI_CHATFOLDERS_BATCH_SIZE = 20;

class AIChatFoldersTask {
  private static instance: AIChatFoldersTask | undefined;
  private inited = false;

  public static getInstance() {
    if (!AIChatFoldersTask.instance) {
      AIChatFoldersTask.instance = new AIChatFoldersTask();
    }
    return AIChatFoldersTask.instance;
  }

  async initTask() {
    if (this.inited) return;
    this.inited = true;
    setInterval(async () => {
      console.log(AICHATFOLDERS_LOG + "initTask");
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
    console.log(AICHATFOLDERS_LOG + "aiClassify: ", res, new Date());
    // 2. save classify result
    saveAiChatFolders(res);
    ChataiStores.general?.set(
      GLOBAL_AICHATFOLDERS_LAST_TIME,
      new Date().getTime()
    );
    ChataiStores.general?.set(GLOBAL_AICHATFOLDERS_TIP_SHOW, true);
    ChataiStores.general?.set(GLOBAL_AICHATFOLDERS_STEP, AIChatFolderStep.apply);
    eventEmitter.emit(Actions.UpdateAIChatFoldsLoading, false);
    console.log(AICHATFOLDERS_LOG + "classify-end", new Date());
  }

  async applyChatFolder() {
    console.log(AICHATFOLDERS_LOG + "apply-start", new Date());
    eventEmitter.emit(Actions.UpdateAIChatFoldsLoading, true);
    const global = getGlobal();
    const nextAiChatFolders = global?.chatFolders?.nextAiChatFolders;
    if (!nextAiChatFolders || nextAiChatFolders?.length === 0) {
      eventEmitter.emit(Actions.UpdateAIChatFoldsLoading, false);
      return;
    }
    const groupedRes = groupAiChatFoldersRes(nextAiChatFolders);
    const sortedKeys = Object.keys(groupedRes);
    if (!sortedKeys.length) {
      eventEmitter.emit(Actions.UpdateAIChatFoldsLoading, false);
      return;
    }

    const { addChatFolder, editChatFolder } = getActions();
    console.log(AICHATFOLDERS_LOG + "updateChatFolder: ", sortedKeys);

    // delete all ai chat folder
    await deleteAiChatFolders();
    // add folders
    for (let i = 0; i < sortedKeys.length; i++) {
      const folderTitle = sortedKeys[i];
      if (groupedRes[folderTitle].length) {
        const folder = {
          id: i + 2,
          title: { text: folderTitle, desc: "AI" },
          includedChatIds: groupedRes[folderTitle].map((item) => item + ""),
          excludedChatIds: [],
        };
        const existDb = await ChataiStores.folder?.getFolder(folderTitle);
        const globalFolders = getGlobal().chatFolders?.byId;
        const existFolder = flatMap(globalFolders)?.find(
          (o) => o?.title?.text === folderTitle
        );
        const exist = existDb ? existDb : existFolder;
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
            AICHATFOLDERS_LOG + "update: " + folderTitle,
            folder,
            new Date()
          );
        } else {
          await addChatFolder?.({ folder, from: "AI" });
          console.log(
            AICHATFOLDERS_LOG + "add: " + folderTitle,
            folder,
            new Date()
          );
        }
        await sleep(3000);
      }
    }
    // update global
    updateAiChatFoldersTOGlobal()
    // sort folders
    await this.sortChatFolder();
    // update last classify time
    ChataiStores.general?.set(
      GLOBAL_AICHATFOLDERS_LAST_TIME,
      new Date().getTime()
    );
    ChataiStores.general?.set(GLOBAL_AICHATFOLDERS_TIP_SHOW, false);
    eventEmitter.emit(Actions.UpdateAIChatFoldsLoading, false);
    ChataiStores.general?.set(GLOBAL_AICHATFOLDERS_STEP, AIChatFolderStep.classify);
    console.log(AICHATFOLDERS_LOG + "apply-end", new Date());
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
      AICHATFOLDERS_LOG + "sort: ",
      folderIds,
      new Date(),
      global.chatFolders
    );
  }

  async classifyChatMessageByCount() {
    console.log(AICHATFOLDERS_LOG + "classify-start", new Date());
    eventEmitter.emit(Actions.UpdateAIChatFoldsLoading, true);

    const global = getGlobal();
    const { aiChatFolders } = selectSharedSettings(global);
    if (aiChatFolders !== true) {
      console.log(AICHATFOLDERS_LOG + "enable=false, pass", global);
      eventEmitter.emit(Actions.UpdateAIChatFoldsLoading, false);
      return;
    }
    const lastTime = await ChataiStores.general?.get(
      GLOBAL_AICHATFOLDERS_LAST_TIME
    );
    if (
      lastTime &&
      new Date().getTime() - lastTime < AI_CHATFOLDERS_INTERVAL_TIME
    ) {
      console.log(AICHATFOLDERS_LOG + "pass", lastTime, global);
      eventEmitter.emit(Actions.UpdateAIChatFoldsLoading, false);
      return;
    }
    console.log(AICHATFOLDERS_LOG + "running", lastTime, global.chatFolders);
    let chatMessages: { [key: string]: ApiMessage[] } = {};
    const orderedIds = (getOrderedIds(ALL_FOLDER_ID) || [])?.filter(
      (o) => o !== SERVICE_NOTIFICATIONS_USER_ID
    );
    console.log(AICHATFOLDERS_LOG + "orderedIds:", orderedIds);
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
      AICHATFOLDERS_LOG + "fetchMsg",
      Object.keys(chatMessages).length
    );

    await this.runAIChatFolders(chatMessages);
  }
}

export const aiChatFoldersTask = new AIChatFoldersTask();
