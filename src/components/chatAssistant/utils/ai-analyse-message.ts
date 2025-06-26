import { v4 as uuidv4 } from "uuid";
import { ApiMessage } from "../../../api/types";
import eventEmitter, { Actions } from "../lib/EventEmitter";
import { ChataiStores } from "../store";
import { StoreMessage } from "../store/messages-store";
import { chatAIGenerate, imageAISummary, webPageAISummary } from "./chat-api";
import { formatJSONContent } from "../ai-chatfolders/util";
import { getMediaHash } from "../../../global/helpers";
import * as mediaLoader from "../../../util/mediaLoader";
import { message as showMessage } from "antd";
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

const mammoth = require("mammoth");

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
          isAuto,
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
          isAuto,
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

export async function documentSummary(
  message: ApiMessage,
  isAuto: boolean = false
) {
  const document = message.content?.document;
  if (!document) return;

  const mediaHash = getMediaHash(document, "download");
  if (!mediaHash) return;

  await mediaLoader.fetch(mediaHash, 0);
  const blobUrl = mediaLoader.getFromMemory(mediaHash);
  if (!blobUrl) return;

  const response = await fetch(blobUrl);
  const blob = await response.blob();

  const arrayBuffer = await blob.arrayBuffer();
  let text = "";
  switch (document.mimeType) {
    case "text/plain":
      text = new TextDecoder().decode(arrayBuffer);
      break;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword":
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
      break;
    case "application/pdf":
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let pdfText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        pdfText += pageText + '\n';
      }
      text = pdfText;
      break;
    default:
      showMessage.info("The file can't be summarized right now, comming soon.")
      return;
  }
  if (text === '') {
    showMessage.info('The file is empty, no summary required.')
    return
  }

  chatAIGenerate({
    data: {
      messages: [
        {
          role: "system",
          content: DOCUMENT_PROMPT,
          id: "1",
        },
        {
          role: "user",
          content: `请总结以下内容: ${text}`,
          id: "2",
        },
      ],
    },
    onResponse: (response) => {
      const content = {
        message,
        summaryInfo: response,
        isAuto,
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
            type: "room-ai-document-summary",
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

const DOCUMENT_PROMPT = `
## 系统角色
  你是一个内容总结工具，你将根据用户提供的内容，生成简洁明了的摘要，并突出其中的关键信息。
## 输出要求
  - title
  - content
  - 输出格式及字段说明：
  interface Output {
    title: string        // 8-15字核心议题
    content: string[]    // 至少2条, 最多5条
  }
## 输出示例
  [
    {
      "title": "Highlight",
      "content": ["This is a summary of the content."]
    }
  ]
`;
