import { v4 as uuidv4 } from "uuid";
import { ApiMessage } from "../../../api/types";
import eventEmitter, { Actions } from "../lib/EventEmitter";
import { ChataiStores } from "../store";
import { StoreMessage } from "../store/messages-store";
import {
  audioAISummary,
  chatAIGenerate,
  documentAISummary,
  imageAISummary,
  webPageAISummary,
} from "./chat-api";
import { replaceToJSON, sleep } from "../ai-chatfolders/util";
import { getMediaHash } from "../../../global/helpers";
import * as mediaLoader from "../../../util/mediaLoader";
import { message as showMessage } from "antd";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { getActions, getGlobal } from "../../../global";
import { selectChatMessage } from "../../../global/selectors";

pdfjsLib.GlobalWorkerOptions.workerSrc = "pdf.worker.min.js";

const mammoth = require("mammoth");

export async function replyToMention(
  message: ApiMessage,
  isAuto: boolean = false
) {
  if (!message.isMentioned) return;

  let newMessage: StoreMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: uuidv4(),
    createdAt: new Date(),
    role: "assistant",
    annotations: [{ type: "room-ai-reply-mention" }],
    content: JSON.stringify({
      messageId: message.id,
      content: message.content.text?.text,
      isAuto,
      status: "loading",
    }),
  };
  await sendMessageToAIRoom(newMessage);

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
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          messageId: message.id,
          content: message.content.text?.text,
          replys: replaceToJSON(response)?.responses,
          isAuto,
          status: "success",
        }),
      };
      sendMessageToAIRoom(newMessage);
    },
    onFinish: () => {
      // eslint-disable-next-line no-console
      console.log("Finish");
    },
  });
}

export async function photoSummary(
  message: ApiMessage,
  isAuto: boolean = false
) {
  const image = message.content?.photo?.thumbnail?.dataUri;
  if (!image) return;

  let newMessage: StoreMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: uuidv4(),
    createdAt: new Date(),
    role: "assistant",
    annotations: [{ type: "room-ai-media-summary" }],
    content: JSON.stringify({ message, isAuto, status: "loading" }),
  };
  await sendMessageToAIRoom(newMessage);

  imageAISummary(image)
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
      }
    })
    .catch((err) => {
      console.log("error", err);
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          message,
          errorMsg: "Summary error",
          isAuto,
          status: "error",
        }),
      };
      sendMessageToAIRoom(newMessage);
    });
}

export async function webPageSummary(
  message: ApiMessage,
  isAuto: boolean = false
) {
  const webPage = message.content?.webPage;
  if (!webPage) return;

  let newMessage: StoreMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: uuidv4(),
    createdAt: new Date(),
    role: "assistant",
    annotations: [{ type: "room-ai-media-summary" }],
    content: JSON.stringify({ message, isAuto, status: "loading" }),
  };
  await sendMessageToAIRoom(newMessage);

  webPageAISummary(webPage?.url)
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
      }
    })
    .catch((err) => {
      console.log("error", err);
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          message,
          errorMsg: "Summary error",
          isAuto,
          status: "error",
        }),
      };
      sendMessageToAIRoom(newMessage);
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

  let newMessage: StoreMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: uuidv4(),
    createdAt: new Date(),
    role: "assistant",
    annotations: [{ type: "room-ai-media-summary" }],
    content: JSON.stringify({ message, isAuto, status: "loading" }),
  };
  await sendMessageToAIRoom(newMessage);

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
      showMessage.info("The file can't be summarized right now, comming soon.");
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          message,
          errorMsg: "The file can't be summarized right now, comming soon.",
          isAuto,
          status: "error",
        }),
      };
      await sendMessageToAIRoom(newMessage);
      return;
  }
  if (text === "") {
    showMessage.info("The file is empty, no summary required.");
    newMessage = {
      ...newMessage,
      content: JSON.stringify({
        message,
        errorMsg: "The file is empty, no summary required.",
        isAuto,
        status: "error",
      }),
    };
    await sendMessageToAIRoom(newMessage);
    return;
  }

  documentAISummary(text)
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
      }
    })
    .catch((err) => {
      console.log("error", err);
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          message,
          errorMsg: "Summary error",
          isAuto,
          status: "error",
        }),
      };
      sendMessageToAIRoom(newMessage);
    });
}

export async function voiceSummary(
  message: ApiMessage,
  isAuto: boolean = false
) {
  const voice = message.content?.voice;
  if (!voice) return;

  let newMessage: StoreMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: uuidv4(),
    createdAt: new Date(),
    role: "assistant",
    annotations: [{ type: "room-ai-media-summary" }],
    content: JSON.stringify({ message, isAuto, status: "loading" }),
  };
  await sendMessageToAIRoom(newMessage);

  let text = "";
  const global = getGlobal();
  const { isTranscriptionError, transcriptionId } = message;
  if (isTranscriptionError) {
    showMessage.info("Transcription error, no summary required.");
    newMessage = {
      ...newMessage,
      content: JSON.stringify({
        message,
        errorMsg: "Transcription error, no summary required.",
        isAuto,
        status: "error",
      }),
    };
    await sendMessageToAIRoom(newMessage);
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
      message.id
    );
    if (currentMessage?.isTranscriptionError) {
      showMessage.info("Transcription error, no summary required.");
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          message,
          errorMsg: "Transcription error, no summary required.",
          isAuto,
          status: "error",
        }),
      };
      await sendMessageToAIRoom(newMessage);
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
    showMessage.info("No words detected, no summary required.");
    newMessage = {
      ...newMessage,
      content: JSON.stringify({
        message,
        errorMsg: "No words detected, no summary required.",
        isAuto,
        status: "error",
      }),
    };
    await sendMessageToAIRoom(newMessage);
    return;
  }
  documentAISummary(text)
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
      }
    })
    .catch((err) => {
      console.log("error", err);
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          message,
          errorMsg: "Summary error",
          isAuto,
          status: "error",
        }),
      };
      sendMessageToAIRoom(newMessage);
    });
}

export async function voiceToAudioSummary(
  message: ApiMessage,
  isAuto: boolean = false
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
    annotations: [{ type: "room-ai-media-summary" }],
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
  isAuto: boolean = false
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
    annotations: [{ type: "room-ai-media-summary" }],
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
  if (size && size * (4 / 3) > 4 * 1024 * 1024) {
    showMessage.info("File size exceeds limit (4 MB)");
    newMessage = {
      ...newMessage,
      content: JSON.stringify({
        message,
        errorMsg: "File size exceeds limit (4 MB)",
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
    showMessage.info("Can't download the file");
    newMessage = {
      ...newMessage,
      content: JSON.stringify({
        message,
        errorMsg: "Can't download the file",
        isAuto,
        status: "error",
      }),
    };
    await sendMessageToAIRoom(newMessage);
    return;
  }

  const response = await fetch(blobUrl);
  const blob = await response.blob();

  const reader = new FileReader();
  reader.onloadend = function () {
    const base64Data = reader.result?.toString().split(",")[1] || "";
    audioAISummary(
      JSON.stringify({
        audioData: base64Data,
        mimeType: mimeType,
        filename: filename,
      })
    )
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
        }
      })
      .catch((err) => {
        console.log("error", err);
        newMessage = {
          ...newMessage,
          content: JSON.stringify({
            message,
            errorMsg: "Summary error",
            isAuto,
            status: "error",
          }),
        };
        sendMessageToAIRoom(newMessage);
      });
  };
  reader.readAsDataURL(blob);
}
