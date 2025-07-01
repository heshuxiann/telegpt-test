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
import { selectChatMessage } from "../../../global/selectors";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

pdfjsLib.GlobalWorkerOptions.workerSrc = "pdf.worker.min.js";

const mammoth = require("mammoth");

export async function replyToMention(
  message: ApiMessage,
  isAuto: boolean = false
) {
  if (!message.isMentioned || !message.content?.text?.text) return;

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

  mentionReply(message.content.text?.text)
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

export async function photoSummary(
  message: ApiMessage,
  isAuto: boolean = false
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
    annotations: [{ type: "room-ai-media-summary" }],
    content: JSON.stringify({ message, isAuto, status: "loading" }),
  };
  await sendMessageToAIRoom(newMessage);

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
    imageAISummary(`data:${mimeType};base64,` + base64Data)
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
  };
  reader.readAsDataURL(blob);
}

export async function webPageSummary(
  message: ApiMessage,
  isAuto: boolean = false
) {
  const webPage = message.content?.webPage;
  const url = webPage ? webPage?.url : message.content?.text?.text;
  if (!url || url === "") return;

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

  webPageAISummary(url)
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
  // check size
  if (size && size > 4.5 * 1024 * 1024) {
    showMessage.info("File size exceeds limit (4.5 MB)");
    newMessage = {
      ...newMessage,
      content: JSON.stringify({
        message,
        errorMsg: "File size exceeds limit (4.5 MB)",
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
  //
  const formData = new FormData();
  formData.append("file", blob, filename || "audio.ogg");
  if (mimeType) formData.append("mimeType", mimeType);
  try {
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
      await sendMessageToAIRoom(newMessage);
    }
  } catch (err) {
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
    await sendMessageToAIRoom(newMessage);
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
    imageAISummary(`data:${mimeType};base64,` + base64Data)
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
  };
  reader.readAsDataURL(blob);
}

export async function videoSummary(
  message: ApiMessage,
  isAuto: boolean = false
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
    annotations: [{ type: "room-ai-media-summary" }],
    content: JSON.stringify({ message, isAuto, status: "loading" }),
  }
  await sendMessageToAIRoom(newMessage);
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
  // const response = await fetch(blobUrl);
  // const blob = await response.blob();

  // const audioBlob = await processVideo(blob);
  await extractAudio(blobUrl)

}

export function canSummarize(message: ApiMessage) {
  const { photo, document, webPage, voice, audio, text } = message?.content;
  const isUrl = checkIsUrl(text?.text);

  return photo || document || webPage || voice || audio || text || isUrl;
}

export function checkIsUrl(text?: string) {
  return (
    typeof text === "string" &&
    /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/i.test(text)
  );
}

export function checkIsImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

const processVideo = async (blob: Blob) => {
  // 1. 加载FFmpeg核心
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
  });
  // 2. 将二进制数据转换为Uint8Array
  const arrayBuffer = await blob.arrayBuffer();
  const videoData = new Uint8Array(arrayBuffer);

  // 3. 写入虚拟文件系统
  await ffmpeg.writeFile('input.mp4', videoData);

  // 4. 执行FFmpeg命令 - 提取音频
  await ffmpeg.exec([
    '-i', 'input.mp4',   // 输入文件
    '-vn',               // 禁用视频流
    '-acodec', 'libmp3lame', // 使用MP3编码器
    '-q:a', '2',         // 音频质量 (0-9, 0最好)
    'output.mp3'         // 输出文件
  ]);

  // 5. 读取生成的音频
  const audioData = await ffmpeg.readFile('output.mp3');
  // 6. 清理文件
  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('output.mp3');

  return new Blob([audioData], { type: 'audio/mpeg' });
};

const extractAudio = async (videoFile: string) => {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
  });
  // 1. 写入视频文件到虚拟文件系统
  await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

  // 2. 执行FFmpeg命令：提取音频并转码为MP3
  await ffmpeg.exec([
    '-i', 'input.mp4',   // 输入文件
    '-vn',               // 禁用视频流
    '-acodec', 'libmp3lame', // 使用MP3编码器
    '-q:a', '2',         // 音频质量 (0-9, 0最好)
    'output.mp3'         // 输出文件
  ]);

  // 3. 读取生成的音频文件
  const audioData = await ffmpeg.readFile('output.mp3');
  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('output.mp3');
  const blob = new Blob([audioData], { type: 'audio/mpeg' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'output.mp3';  // 设置下载文件的名字
  a.click();

  // 释放创建的URL
  URL.revokeObjectURL(url);

};
