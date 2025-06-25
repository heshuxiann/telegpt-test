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
import RoomAIMessageListener from "../room-ai/room-ai-message-listener"

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
      const message: ApiMessage = {
        "id": 23,
        "chatId": "5974693797",
        "isOutgoing": false,
        "content": {
            // text: {
            //   text: '开心生活每一天'
            // },
            "photo": {
                "mediaType": "photo",
                "id": "6167787841711619945",
                "thumbnail": {
                    "dataUri": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDACgcHiMeGSgjISMtKygwPGRBPDc3PHtYXUlkkYCZlo+AjIqgtObDoKrarYqMyP/L2u71////m8H////6/+b9//j/2wBDASstLTw1PHZBQXb4pYyl+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj/wAARCAAoABMDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDIVSegJFPk3nkhuPU5pVTgHI/OnvGSuWkU+2eaLgQYB5yKKUjntRQBZW7KRqPKiOB3T/69RTXJmxmONcf3Rio+3b8qb0NJRS1HdiljnoKKQ4z1H5UUxDgzHgEdPSnvGAflfIwOSMc0UUAIY2z99f8AvoUUUUidT//Z",
                    "width": 148,
                    "height": 320
                },
                "sizes": [
                    {
                        "width": 148,
                        "height": 320,
                        "type": "m"
                    },
                    {
                        "width": 360,
                        "height": 779,
                        "type": "x"
                    }
                ],
                "isSpoiler": false,
                "date": 1731401229
            }
        },
        "date": 1731401229,
        "isScheduled": false,
        "isFromScheduled": false,
        "isSilent": false,
        "isPinned": false,
        "isEdited": false,
        "isMediaUnread": false,
        "hasUnreadMention": false,
        "isMentioned": false,
        "isProtected": false,
        "isForwardingAllowed": true,
      }
      // RoomAIMessageListener.messageListener(message)
      // this.classifyChatMessageByCount();
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
