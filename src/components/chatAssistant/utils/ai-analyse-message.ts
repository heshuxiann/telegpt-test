import { v4 as uuidv4 } from "uuid";
import { ApiMessage } from "../../../api/types"
import eventEmitter, { Actions } from "../lib/EventEmitter"
import { ChataiStores } from "../store"
import { StoreMessage } from "../store/messages-store"
import { chatAIGenerate, imageAISummary, webPageAISummary } from "./chat-api"
import { formatJSONContent } from "../ai-chatfolders/util"

export function replyToMention(message: ApiMessage, isAuto: boolean = false) {
  chatAIGenerate({
    data: {
      messages: [
        {
          role: "system",
          content:
            "你是一个多语种智能助手。接收用户消息后，自动识别其使用的语言，并用相同的语言进行自然、得体的回复。你应该理解消息的语境，确保回复简洁、友好且符合语言习惯。",
          id: "1",
        },
        {
          role: "user",
          content: `请回复下面的消息: ${message.content.text?.text}, 并给出3个回复，以JSON数据进行返回`,
          id: "2",
        },
      ],
    },
    onResponse: (response) => {
      const content = {
        messageId: message.id,
        content: message.content.text?.text,
        replys: formatJSONContent(response)?.replies,
      };
      const newMessage = {
        chatId: message.chatId,
        timestamp: new Date().getTime(),
        content: JSON.stringify(content),
        id: uuidv4(),
        createdAt: new Date(),
        role: "assistant",
        annotations: [
          {
            type: "room-ai-reply-mention",
          },
        ],
      };
      ChataiStores.message?.storeMessage(newMessage as StoreMessage);
      eventEmitter.emit(Actions.AddRoomAIMessage, newMessage);
    },
    onFinish: () => {
      // eslint-disable-next-line no-console
      console.log("Finish");
    },
  });
}

export function photoSummary(message: ApiMessage, isAuto: boolean = false) {
  const image = message.content?.photo?.thumbnail?.dataUri;
  if (!image) return;
  imageAISummary(image)
    .then((response: any) => {
      if (response?.text) {
        const content = {
          message: message,
          summaryInfo: response?.text,
          isAuto
        };
        const newMessage = {
          chatId: message.chatId,
          timestamp: new Date().getTime(),
          content: JSON.stringify(content),
          id: uuidv4(),
          createdAt: new Date(),
          role: "assistant",
          annotations: [
            {
              type: "room-ai-image-summary",
            },
          ],
        };
        ChataiStores.message?.storeMessage(newMessage as StoreMessage);
        eventEmitter.emit(Actions.AddRoomAIMessage, newMessage);
      }
    })
    .catch((err) => {
      console.log("error", err);
    });
}

export function webPageSummary(message: ApiMessage, isAuto: boolean = false) {
  const webPage = message.content?.webPage;
  if (!webPage) return;
  webPageAISummary(webPage?.url)
    .then((response: any) => {
      if (response?.text) {
        const content = {
          message: message,
          summaryInfo: response?.text,
        };
        const newMessage = {
          chatId: message.chatId,
          timestamp: new Date().getTime(),
          content: JSON.stringify(content),
          id: uuidv4(),
          createdAt: new Date(),
          role: "assistant",
          annotations: [
            {
              type: "room-ai-webpage-summary",
            },
          ],
        };
        ChataiStores.message?.storeMessage(newMessage as StoreMessage);
        eventEmitter.emit(Actions.AddRoomAIMessage, newMessage);
      }
    })
    .catch((err) => {
      console.log("error", err);
    });
}

export function documentSummary(message: ApiMessage, isAuto: boolean = false) {
  const document = message.content?.document;
  if (!document) return;
  debugger;
  if (document.mimeType === "application/pdf") {
  } else if (
    document.mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
  }
}
