/* eslint-disable */
import { v4 as uuidv4 } from "uuid";
import { ApiMessage } from "../../../api/types";
import eventEmitter, { Actions } from "../lib/EventEmitter";
import { ChataiStores } from "../store";
import { StoreMessage } from "../store/messages-store";
import {
  audioAISummary,
  documentAISummary,
  imageAISummary,
  mentionReply,
  webPageAISummary,
} from "./chat-api";
import { sleep } from "../ai-chatfolders/util";
import { getMediaHash } from "../../../global/helpers";
import * as mediaLoader from "../../../util/mediaLoader";
import { message as showMessage } from "antd";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { getActions, getGlobal } from "../../../global";
import {
  selectChatMessage,
  selectWebPageFromMessage,
} from "../../../global/selectors";
import { AIMessageType } from "../messages/types";

pdfjsLib.GlobalWorkerOptions.workerSrc = "pdf.worker.min.js";

const mammoth = require("mammoth");

export async function replyToMention(
  message: ApiMessage,
  isAuto: boolean = false,
) {
  if (!message.isMentioned || !message.content?.text?.text) return;

  let newMessage: StoreMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: uuidv4(),
    createdAt: new Date(),
    role: "assistant",
    type: AIMessageType.AIReplyMention,
    content: JSON.stringify({
      messageId: message.id,
      content: message.content.text?.text,
      isAuto,
      status: "loading",
    }),
  };
  await sendMessageToAIRoom(newMessage);

  mentionReply({
    message: message.content.text?.text,
    language: getAutoTransLang(),
  })
    .then((response: any) => {
      if (response.text) {
        newMessage = {
          ...newMessage,
          content: JSON.stringify({
            messageId: message.id,
            content: message.content.text?.text,
            replys: response.text,
            isAuto,
            status: "success",
          }),
        };
        sendMessageToAIRoom(newMessage);
      } else {
        sendErrorMessage(newMessage, message, isAuto);
      }
    })
    .catch((err) => {
      console.log("error", err);
      sendErrorMessage(newMessage, message, isAuto);
    });
}

export async function photoSummary(
  message: ApiMessage,
  isAuto: boolean = false,
) {
  const photo = message.content?.photo;
  if (!photo) return;
  const mediaHash = getMediaHash(photo, "download");
  if (!mediaHash) return;
  const mimeType = "image/jpeg";

  let newMessage: StoreMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: uuidv4(),
    createdAt: new Date(),
    role: "assistant",
    type: AIMessageType.AIMediaSummary,
    content: JSON.stringify({ message, isAuto, status: "loading" }),
  };
  await sendMessageToAIRoom(newMessage);

  await handleImageToSummaryText({
    mimeType,
    mediaHash,
    message,
    newMessage,
    isAuto,
  });
}

export async function webPageSummary(
  message: ApiMessage,
  isAuto: boolean = false,
) {
  // const webPage = message.content?.webPage;
  const global = getGlobal();
  const webPage = selectWebPageFromMessage(global, message);
  const url = webPage ? webPage?.url : message.content?.text?.text;
  if (!url || url === "") return;

  let newMessage: StoreMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: uuidv4(),
    createdAt: new Date(),
    role: "assistant",
    type: AIMessageType.AIMediaSummary,
    content: JSON.stringify({ message, isAuto, status: "loading" }),
  };
  await sendMessageToAIRoom(newMessage);

  webPageAISummary({
    url,
    text: message.content?.text?.text || "",
    language: getAutoTransLang(),
  })
    .then((response: any) => {
      if (response?.text) {
        newMessage = {
          ...newMessage,
          content: JSON.stringify({
            message,
            summaryInfo: response?.text,
            isAuto,
            status: "success",
          }),
        };
        sendMessageToAIRoom(newMessage);
      } else {
        sendErrorMessage(newMessage, message, isAuto);
      }
    })
    .catch((err) => {
      console.log("error", err);
      sendErrorMessage(newMessage, message, isAuto);
    });
}

export async function documentSummary(
  message: ApiMessage,
  isAuto: boolean = false,
) {
  const document = message.content?.document;
  if (!document) return;

  const mediaHash = getMediaHash(document, "download");
  if (!mediaHash) return;
  if (checkIsImage(document.mimeType) && isAuto) return;

  let newMessage: StoreMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: uuidv4(),
    createdAt: new Date(),
    role: "assistant",
    type: AIMessageType.AIMediaSummary,
    content: JSON.stringify({ message, isAuto, status: "loading" }),
  };
  await sendMessageToAIRoom(newMessage);

  // image
  if (checkIsImage(document.mimeType)) {
    handleImageToSummaryText({
      mimeType: document.mimeType,
      mediaHash,
      message,
      newMessage,
      isAuto,
    });
    return;
  }
  // video
  if (checkIsVideo(document.mimeType)) {
    await handleAudioToSummaryText({
      mediaHash,
      mimeType: document?.mimeType,
      filename: document?.fileName,
      size: document?.size,
      newMessage,
      message,
      isAuto,
    });
    return;
  }

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
      let pdfText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        pdfText += pageText + "\n";
      }
      text = pdfText;
      break;
    default:
      await sendErrorMessage(newMessage, message, isAuto);
      return;
  }
  if (text === "") {
    await sendErrorMessage(newMessage, message, isAuto);
    return;
  }

  documentAISummary({
    content: text,
    language: getAutoTransLang(),
  })
    .then((response: any) => {
      if (response?.text) {
        newMessage = {
          ...newMessage,
          content: JSON.stringify({
            message: message,
            summaryInfo: response?.text,
            isAuto,
            status: "success",
          }),
        };
        sendMessageToAIRoom(newMessage);
      } else {
        sendErrorMessage(newMessage, message, isAuto);
      }
    })
    .catch((err) => {
      console.log("error", err);
      sendErrorMessage(newMessage, message, isAuto);
    });
}

export async function voiceSummary(
  message: ApiMessage,
  isAuto: boolean = false,
) {
  const voice = message.content?.voice;
  if (!voice) return;

  let newMessage: StoreMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: uuidv4(),
    createdAt: new Date(),
    role: "assistant",
    type: AIMessageType.AIMediaSummary,
    content: JSON.stringify({ message, isAuto, status: "loading" }),
  };
  await sendMessageToAIRoom(newMessage);

  let text = "";
  const global = getGlobal();
  const { isTranscriptionError, transcriptionId } = message;
  if (isTranscriptionError) {
    sendErrorMessage(newMessage, message, isAuto);
    return;
  }
  if (transcriptionId && transcriptionId !== "") {
    text = global?.transcriptions?.[transcriptionId]?.text;
  } else {
    await getActions().transcribeAudio({
      chatId: message.chatId,
      messageId: message.id,
    });
    await sleep(2000);
    const newGlobal = getGlobal();
    const currentMessage = selectChatMessage(
      newGlobal,
      message.chatId,
      message.id,
    );
    if (currentMessage?.isTranscriptionError) {
      sendErrorMessage(newMessage, message, isAuto);
      return;
    }
    if (
      currentMessage?.transcriptionId &&
      currentMessage?.transcriptionId !== ""
    ) {
      text = newGlobal.transcriptions?.[currentMessage?.transcriptionId]?.text;
    }
  }
  if (text === "") {
    await sendErrorMessage(newMessage, message, isAuto);
    return;
  }
  documentAISummary({
    content: text,
    language: getAutoTransLang(),
  })
    .then((response: any) => {
      if (response?.text) {
        newMessage = {
          ...newMessage,
          content: JSON.stringify({
            message: message,
            summaryInfo: response?.text,
            isAuto,
            status: "success",
          }),
        };
        sendMessageToAIRoom(newMessage);
      } else {
        sendErrorMessage(newMessage, message, isAuto);
      }
    })
    .catch((err) => {
      console.log("error", err);
      sendErrorMessage(newMessage, message, isAuto);
    });
}

export async function voiceToAudioSummary(
  message: ApiMessage,
  isAuto: boolean = false,
) {
  const voice = message.content?.voice;
  if (!voice) return;
  const mediaHash = getMediaHash(voice, "download");
  if (!mediaHash) return;
  const maxBase64Length = Math.floor(4 * 1024 * 1024);
  if (
    message.content.audio?.size &&
    message.content.audio?.size * (4 / 3) > maxBase64Length
  ) {
    showMessage.info("File size exceeds limit (4 MB)");
    return;
  }
  //
  let newMessage: StoreMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: uuidv4(),
    createdAt: new Date(),
    role: "assistant",
    type: AIMessageType.AIMediaSummary,
    content: JSON.stringify({ message, isAuto, status: "loading" }),
  };
  await sendMessageToAIRoom(newMessage);

  await handleAudioToSummaryText({
    mediaHash,
    mimeType: "audio/ogg",
    filename: voice?.id + ".ogg",
    size: voice?.size,
    newMessage,
    message,
    isAuto,
  });
}

export async function audioSummary(
  message: ApiMessage,
  isAuto: boolean = false,
) {
  const audio = message.content?.audio;
  if (!audio) return;
  const mediaHash = getMediaHash(audio, "download");
  if (!mediaHash) return;
  //
  let newMessage: StoreMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: uuidv4(),
    createdAt: new Date(),
    role: "assistant",
    type: AIMessageType.AIMediaSummary,
    content: JSON.stringify({ message, isAuto, status: "loading" }),
  };
  await sendMessageToAIRoom(newMessage);

  await handleAudioToSummaryText({
    mediaHash,
    mimeType: audio?.mimeType,
    filename: audio?.fileName,
    size: audio?.size,
    newMessage,
    message,
    isAuto,
  });
}

export async function videoSummary(
  message: ApiMessage,
  isAuto: boolean = false,
) {
  const video = message.content?.video;
  if (!video) return;
  const mediaHash = getMediaHash(video, "download");
  if (!mediaHash) return;
  //
  let newMessage: StoreMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: uuidv4(),
    createdAt: new Date(),
    role: "assistant",
    type: AIMessageType.AIMediaSummary,
    content: JSON.stringify({ message, isAuto, status: "loading" }),
  };
  await sendMessageToAIRoom(newMessage);
  if (video?.mimeType !== "video/mp4") {
    await sendErrorMessage(newMessage, message, isAuto);
    return;
  }

  await handleAudioToSummaryText({
    mediaHash,
    mimeType: video?.mimeType,
    filename: video?.fileName,
    size: video?.size,
    newMessage,
    message,
    isAuto,
  });
}

async function sendMessageToAIRoom(newMessage: StoreMessage) {
  await ChataiStores.message?.storeMessage(newMessage);
  await eventEmitter.emit(Actions.AddRoomAIMessage, newMessage);
}

async function handleAudioToSummaryText({
  mediaHash,
  mimeType,
  filename,
  size,
  newMessage,
  message,
  isAuto,
}: {
  mediaHash: string;
  mimeType?: string;
  filename?: string;
  size?: number;
  newMessage: StoreMessage;
  message: ApiMessage;
  isAuto: boolean;
}) {
  try {
    // check size
    if (
      (isAuto && size && size > 50 * 1024 * 1024) ||
      (!isAuto && size && size > 100 * 1024 * 1024)
    ) {
      showMessage.info("File too large to summarize");
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          message,
          errorMsg: "File too large to summarize",
          isAuto,
          status: "error",
        }),
      };
      await sendMessageToAIRoom(newMessage);
      return;
    }
    // download
    await mediaLoader.fetch(mediaHash, 0);
    const blobUrl = mediaLoader.getFromMemory(mediaHash);
    if (!blobUrl) {
      sendErrorMessage(newMessage, message, isAuto);
      return;
    }

    const response = await fetch(blobUrl);
    const blob = await response.blob();
    //
    const formData = new FormData();
    formData.append("file", blob, filename || "audio.ogg");
    formData.append("language", getAutoTransLang());
    if (mimeType) formData.append("mimeType", mimeType);

    const summaryResponse: any = await audioAISummary(formData);
    if (summaryResponse?.text) {
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          message,
          summaryInfo: summaryResponse?.text,
          isAuto,
          status: "success",
        }),
      };
      sendMessageToAIRoom(newMessage);
    } else {
      sendErrorMessage(newMessage, message, isAuto);
    }
  } catch (err) {
    console.log("error", err);
    sendErrorMessage(newMessage, message, isAuto);
  }
}

async function handleImageToSummaryText({
  mimeType,
  mediaHash,
  message,
  newMessage,
  isAuto,
}: {
  mimeType: string;
  mediaHash: string;
  message: ApiMessage;
  newMessage: StoreMessage;
  isAuto: boolean;
}) {
  // download
  await mediaLoader.fetch(mediaHash, 0);
  const blobUrl = mediaLoader.getFromMemory(mediaHash);
  if (!blobUrl) {
    sendErrorMessage(newMessage, message, isAuto);
    return;
  }

  const response = await fetch(blobUrl);
  const blob = await response.blob();

  const reader = new FileReader();
  reader.onloadend = function () {
    const base64Data = reader.result?.toString().split(",")[1] || "";
    imageAISummary({
      image: `data:${mimeType};base64,` + base64Data,
      language: getAutoTransLang(),
    })
      .then((response: any) => {
        if (response?.text) {
          newMessage = {
            ...newMessage,
            content: JSON.stringify({
              message,
              summaryInfo: JSON.stringify({ text: response?.text }),
              isAuto,
              status: "success",
            }),
          };
          sendMessageToAIRoom(newMessage);
        } else {
          sendErrorMessage(newMessage, message, isAuto);
        }
      })
      .catch((err) => {
        console.log("error", err);
        sendErrorMessage(newMessage, message, isAuto);
      });
  };
  reader.readAsDataURL(blob);
}

export function canSummarize(message: ApiMessage) {
  const { photo, document, webPage, voice, audio, text, video } =
    message?.content;
  const isUrl = checkIsUrl(text?.text);
  const hasText = text?.text && text.text.trim() !== "";

  return (
    photo ||
    document ||
    (webPage && !hasText) ||
    voice ||
    audio ||
    isUrl ||
    video
  );
}

export function isHasUrl(text?: string) {
  const urls = extractUrls(text);
  const hasUrl = urls.length > 0;

  return hasUrl;
}

export function checkIsUrl(text?: string) {
  return (
    typeof text === "string" &&
    /^https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+$/i.test(text)
  );
}

export function checkIsImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

async function sendErrorMessage(
  newMessage: StoreMessage,
  message: ApiMessage,
  isAuto: boolean,
) {
  newMessage = {
    ...newMessage,
    content: JSON.stringify({
      message,
      isAuto,
      status: "error",
    }),
  };
  await sendMessageToAIRoom(newMessage);
}

export function getAutoTransLang() {
  const global = getGlobal();
  const { telyAiLanguage = "en" } = global.settings.byKey;

  return (
    new Intl.DisplayNames([telyAiLanguage], { type: "language" }).of(
      telyAiLanguage,
    ) || "en"
  );
}

export function extractUrls(text?: string): string[] {
  if (typeof text !== "string") return [];

  const urlRegex = /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/gi;
  return text.match(urlRegex) || [];
}

export function checkIsVideo(mimeType: string) {
  return ["video/mp4"].indexOf(mimeType) >= 0;
}
