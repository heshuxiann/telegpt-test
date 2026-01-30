(self["webpackChunkTelyAI"] = self["webpackChunkTelyAI"] || []).push([["src_components_chatAssistant_utils_ai-analyse-message_ts"],{

/***/ "./src/components/chatAssistant/utils/ai-analyse-message.ts"
/*!******************************************************************!*\
  !*** ./src/components/chatAssistant/utils/ai-analyse-message.ts ***!
  \******************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   audioSummary: () => (/* binding */ audioSummary),
/* harmony export */   canSummarize: () => (/* binding */ canSummarize),
/* harmony export */   checkIsImage: () => (/* binding */ checkIsImage),
/* harmony export */   checkIsUrl: () => (/* binding */ checkIsUrl),
/* harmony export */   checkIsVideo: () => (/* binding */ checkIsVideo),
/* harmony export */   documentSummary: () => (/* binding */ documentSummary),
/* harmony export */   extractUrls: () => (/* binding */ extractUrls),
/* harmony export */   getAutoTransLang: () => (/* binding */ getAutoTransLang),
/* harmony export */   isHasUrl: () => (/* binding */ isHasUrl),
/* harmony export */   photoSummary: () => (/* binding */ photoSummary),
/* harmony export */   replyToMention: () => (/* binding */ replyToMention),
/* harmony export */   videoSummary: () => (/* binding */ videoSummary),
/* harmony export */   voiceSummary: () => (/* binding */ voiceSummary),
/* harmony export */   voiceToAudioSummary: () => (/* binding */ voiceToAudioSummary),
/* harmony export */   webPageSummary: () => (/* binding */ webPageSummary)
/* harmony export */ });
/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! uuid */ "./node_modules/uuid/dist/esm-browser/v4.js");
/* harmony import */ var _lib_EventEmitter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../lib/EventEmitter */ "./src/components/chatAssistant/lib/EventEmitter.ts");
/* harmony import */ var _store__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../store */ "./src/components/chatAssistant/store/index.ts");
/* harmony import */ var _chat_api__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./chat-api */ "./src/components/chatAssistant/utils/chat-api.ts");
/* harmony import */ var _ai_chatfolders_util__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../ai-chatfolders/util */ "./src/components/chatAssistant/ai-chatfolders/util.ts");
/* harmony import */ var _global_helpers__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../global/helpers */ "./src/global/helpers/index.ts");
/* harmony import */ var _util_mediaLoader__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../../util/mediaLoader */ "./src/util/mediaLoader.ts");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/message/index.js");
/* harmony import */ var pdfjs_dist_legacy_build_pdf__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! pdfjs-dist/legacy/build/pdf */ "./node_modules/pdfjs-dist/legacy/build/pdf.js");
/* harmony import */ var pdfjs_dist_legacy_build_pdf__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(pdfjs_dist_legacy_build_pdf__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _global__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../../global */ "./src/global/index.ts");
/* harmony import */ var _global_selectors__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../../global/selectors */ "./src/global/selectors/index.ts");
/* harmony import */ var _messages_types__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../messages/types */ "./src/components/chatAssistant/messages/types.ts");
/* eslint-disable */












pdfjs_dist_legacy_build_pdf__WEBPACK_IMPORTED_MODULE_8__.GlobalWorkerOptions.workerSrc = "pdf.worker.min.js";
const mammoth = __webpack_require__(/*! mammoth */ "./node_modules/mammoth/lib/index.js");
async function replyToMention(message, isAuto = false) {
  if (!message.isMentioned || !message.content?.text?.text) return;
  let newMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: (0,uuid__WEBPACK_IMPORTED_MODULE_0__["default"])(),
    createdAt: new Date(),
    role: "assistant",
    type: _messages_types__WEBPACK_IMPORTED_MODULE_11__.AIMessageType.AIReplyMention,
    content: JSON.stringify({
      messageId: message.id,
      content: message.content.text?.text,
      isAuto,
      status: "loading"
    })
  };
  await sendMessageToAIRoom(newMessage);
  (0,_chat_api__WEBPACK_IMPORTED_MODULE_3__.mentionReply)({
    message: message.content.text?.text,
    language: getAutoTransLang()
  }).then(response => {
    if (response.text) {
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          messageId: message.id,
          content: message.content.text?.text,
          replys: response.text,
          isAuto,
          status: "success"
        })
      };
      sendMessageToAIRoom(newMessage);
    } else {
      sendErrorMessage(newMessage, message, isAuto);
    }
  }).catch(err => {
    console.log("error", err);
    sendErrorMessage(newMessage, message, isAuto);
  });
}
async function photoSummary(message, isAuto = false) {
  const photo = message.content?.photo;
  if (!photo) return;
  const mediaHash = (0,_global_helpers__WEBPACK_IMPORTED_MODULE_5__.getMediaHash)(photo, "download");
  if (!mediaHash) return;
  const mimeType = "image/jpeg";
  let newMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: (0,uuid__WEBPACK_IMPORTED_MODULE_0__["default"])(),
    createdAt: new Date(),
    role: "assistant",
    type: _messages_types__WEBPACK_IMPORTED_MODULE_11__.AIMessageType.AIMediaSummary,
    content: JSON.stringify({
      message,
      isAuto,
      status: "loading"
    })
  };
  await sendMessageToAIRoom(newMessage);
  await handleImageToSummaryText({
    mimeType,
    mediaHash,
    message,
    newMessage,
    isAuto
  });
}
async function webPageSummary(message, isAuto = false) {
  // const webPage = message.content?.webPage;
  const global = (0,_global__WEBPACK_IMPORTED_MODULE_9__.getGlobal)();
  const webPage = (0,_global_selectors__WEBPACK_IMPORTED_MODULE_10__.selectWebPageFromMessage)(global, message);
  const url = webPage ? webPage?.url : message.content?.text?.text;
  if (!url || url === "") return;
  let newMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: (0,uuid__WEBPACK_IMPORTED_MODULE_0__["default"])(),
    createdAt: new Date(),
    role: "assistant",
    type: _messages_types__WEBPACK_IMPORTED_MODULE_11__.AIMessageType.AIMediaSummary,
    content: JSON.stringify({
      message,
      isAuto,
      status: "loading"
    })
  };
  await sendMessageToAIRoom(newMessage);
  (0,_chat_api__WEBPACK_IMPORTED_MODULE_3__.webPageAISummary)({
    url,
    text: message.content?.text?.text || "",
    language: getAutoTransLang()
  }).then(response => {
    if (response?.text) {
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          message,
          summaryInfo: response?.text,
          isAuto,
          status: "success"
        })
      };
      sendMessageToAIRoom(newMessage);
    } else {
      sendErrorMessage(newMessage, message, isAuto);
    }
  }).catch(err => {
    console.log("error", err);
    sendErrorMessage(newMessage, message, isAuto);
  });
}
async function documentSummary(message, isAuto = false) {
  const document = message.content?.document;
  if (!document) return;
  const mediaHash = (0,_global_helpers__WEBPACK_IMPORTED_MODULE_5__.getMediaHash)(document, "download");
  if (!mediaHash) return;
  if (checkIsImage(document.mimeType) && isAuto) return;
  let newMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: (0,uuid__WEBPACK_IMPORTED_MODULE_0__["default"])(),
    createdAt: new Date(),
    role: "assistant",
    type: _messages_types__WEBPACK_IMPORTED_MODULE_11__.AIMessageType.AIMediaSummary,
    content: JSON.stringify({
      message,
      isAuto,
      status: "loading"
    })
  };
  await sendMessageToAIRoom(newMessage);

  // image
  if (checkIsImage(document.mimeType)) {
    handleImageToSummaryText({
      mimeType: document.mimeType,
      mediaHash,
      message,
      newMessage,
      isAuto
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
      isAuto
    });
    return;
  }
  await _util_mediaLoader__WEBPACK_IMPORTED_MODULE_6__.fetch(mediaHash, 0);
  const blobUrl = _util_mediaLoader__WEBPACK_IMPORTED_MODULE_6__.getFromMemory(mediaHash);
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
      const result = await mammoth.extractRawText({
        arrayBuffer
      });
      text = result.value;
      break;
    case "application/pdf":
      const pdf = await pdfjs_dist_legacy_build_pdf__WEBPACK_IMPORTED_MODULE_8__.getDocument({
        data: arrayBuffer
      }).promise;
      let pdfText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
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
  (0,_chat_api__WEBPACK_IMPORTED_MODULE_3__.documentAISummary)({
    content: text,
    language: getAutoTransLang()
  }).then(response => {
    if (response?.text) {
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          message: message,
          summaryInfo: response?.text,
          isAuto,
          status: "success"
        })
      };
      sendMessageToAIRoom(newMessage);
    } else {
      sendErrorMessage(newMessage, message, isAuto);
    }
  }).catch(err => {
    console.log("error", err);
    sendErrorMessage(newMessage, message, isAuto);
  });
}
async function voiceSummary(message, isAuto = false) {
  const voice = message.content?.voice;
  if (!voice) return;
  let newMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: (0,uuid__WEBPACK_IMPORTED_MODULE_0__["default"])(),
    createdAt: new Date(),
    role: "assistant",
    type: _messages_types__WEBPACK_IMPORTED_MODULE_11__.AIMessageType.AIMediaSummary,
    content: JSON.stringify({
      message,
      isAuto,
      status: "loading"
    })
  };
  await sendMessageToAIRoom(newMessage);
  let text = "";
  const global = (0,_global__WEBPACK_IMPORTED_MODULE_9__.getGlobal)();
  const {
    isTranscriptionError,
    transcriptionId
  } = message;
  if (isTranscriptionError) {
    sendErrorMessage(newMessage, message, isAuto);
    return;
  }
  if (transcriptionId && transcriptionId !== "") {
    text = global?.transcriptions?.[transcriptionId]?.text;
  } else {
    await (0,_global__WEBPACK_IMPORTED_MODULE_9__.getActions)().transcribeAudio({
      chatId: message.chatId,
      messageId: message.id
    });
    await (0,_ai_chatfolders_util__WEBPACK_IMPORTED_MODULE_4__.sleep)(2000);
    const newGlobal = (0,_global__WEBPACK_IMPORTED_MODULE_9__.getGlobal)();
    const currentMessage = (0,_global_selectors__WEBPACK_IMPORTED_MODULE_10__.selectChatMessage)(newGlobal, message.chatId, message.id);
    if (currentMessage?.isTranscriptionError) {
      sendErrorMessage(newMessage, message, isAuto);
      return;
    }
    if (currentMessage?.transcriptionId && currentMessage?.transcriptionId !== "") {
      text = newGlobal.transcriptions?.[currentMessage?.transcriptionId]?.text;
    }
  }
  if (text === "") {
    await sendErrorMessage(newMessage, message, isAuto);
    return;
  }
  (0,_chat_api__WEBPACK_IMPORTED_MODULE_3__.documentAISummary)({
    content: text,
    language: getAutoTransLang()
  }).then(response => {
    if (response?.text) {
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          message: message,
          summaryInfo: response?.text,
          isAuto,
          status: "success"
        })
      };
      sendMessageToAIRoom(newMessage);
    } else {
      sendErrorMessage(newMessage, message, isAuto);
    }
  }).catch(err => {
    console.log("error", err);
    sendErrorMessage(newMessage, message, isAuto);
  });
}
async function voiceToAudioSummary(message, isAuto = false) {
  const voice = message.content?.voice;
  if (!voice) return;
  const mediaHash = (0,_global_helpers__WEBPACK_IMPORTED_MODULE_5__.getMediaHash)(voice, "download");
  if (!mediaHash) return;
  const maxBase64Length = Math.floor(4 * 1024 * 1024);
  if (message.content.audio?.size && message.content.audio?.size * (4 / 3) > maxBase64Length) {
    antd__WEBPACK_IMPORTED_MODULE_7__["default"].info("File size exceeds limit (4 MB)");
    return;
  }
  //
  let newMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: (0,uuid__WEBPACK_IMPORTED_MODULE_0__["default"])(),
    createdAt: new Date(),
    role: "assistant",
    type: _messages_types__WEBPACK_IMPORTED_MODULE_11__.AIMessageType.AIMediaSummary,
    content: JSON.stringify({
      message,
      isAuto,
      status: "loading"
    })
  };
  await sendMessageToAIRoom(newMessage);
  await handleAudioToSummaryText({
    mediaHash,
    mimeType: "audio/ogg",
    filename: voice?.id + ".ogg",
    size: voice?.size,
    newMessage,
    message,
    isAuto
  });
}
async function audioSummary(message, isAuto = false) {
  const audio = message.content?.audio;
  if (!audio) return;
  const mediaHash = (0,_global_helpers__WEBPACK_IMPORTED_MODULE_5__.getMediaHash)(audio, "download");
  if (!mediaHash) return;
  //
  let newMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: (0,uuid__WEBPACK_IMPORTED_MODULE_0__["default"])(),
    createdAt: new Date(),
    role: "assistant",
    type: _messages_types__WEBPACK_IMPORTED_MODULE_11__.AIMessageType.AIMediaSummary,
    content: JSON.stringify({
      message,
      isAuto,
      status: "loading"
    })
  };
  await sendMessageToAIRoom(newMessage);
  await handleAudioToSummaryText({
    mediaHash,
    mimeType: audio?.mimeType,
    filename: audio?.fileName,
    size: audio?.size,
    newMessage,
    message,
    isAuto
  });
}
async function videoSummary(message, isAuto = false) {
  const video = message.content?.video;
  if (!video) return;
  const mediaHash = (0,_global_helpers__WEBPACK_IMPORTED_MODULE_5__.getMediaHash)(video, "download");
  if (!mediaHash) return;
  //
  let newMessage = {
    chatId: message.chatId,
    timestamp: new Date().getTime(),
    id: (0,uuid__WEBPACK_IMPORTED_MODULE_0__["default"])(),
    createdAt: new Date(),
    role: "assistant",
    type: _messages_types__WEBPACK_IMPORTED_MODULE_11__.AIMessageType.AIMediaSummary,
    content: JSON.stringify({
      message,
      isAuto,
      status: "loading"
    })
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
    isAuto
  });
}
async function sendMessageToAIRoom(newMessage) {
  await _store__WEBPACK_IMPORTED_MODULE_2__.ChataiStores.message?.storeMessage(newMessage);
  await _lib_EventEmitter__WEBPACK_IMPORTED_MODULE_1__["default"].emit(_lib_EventEmitter__WEBPACK_IMPORTED_MODULE_1__.Actions.AddRoomAIMessage, newMessage);
}
async function handleAudioToSummaryText({
  mediaHash,
  mimeType,
  filename,
  size,
  newMessage,
  message,
  isAuto
}) {
  try {
    // check size
    if (isAuto && size && size > 50 * 1024 * 1024 || !isAuto && size && size > 100 * 1024 * 1024) {
      antd__WEBPACK_IMPORTED_MODULE_7__["default"].info("File too large to summarize");
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          message,
          errorMsg: "File too large to summarize",
          isAuto,
          status: "error"
        })
      };
      await sendMessageToAIRoom(newMessage);
      return;
    }
    // download
    await _util_mediaLoader__WEBPACK_IMPORTED_MODULE_6__.fetch(mediaHash, 0);
    const blobUrl = _util_mediaLoader__WEBPACK_IMPORTED_MODULE_6__.getFromMemory(mediaHash);
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
    const summaryResponse = await (0,_chat_api__WEBPACK_IMPORTED_MODULE_3__.audioAISummary)(formData);
    if (summaryResponse?.text) {
      newMessage = {
        ...newMessage,
        content: JSON.stringify({
          message,
          summaryInfo: summaryResponse?.text,
          isAuto,
          status: "success"
        })
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
  isAuto
}) {
  // download
  await _util_mediaLoader__WEBPACK_IMPORTED_MODULE_6__.fetch(mediaHash, 0);
  const blobUrl = _util_mediaLoader__WEBPACK_IMPORTED_MODULE_6__.getFromMemory(mediaHash);
  if (!blobUrl) {
    sendErrorMessage(newMessage, message, isAuto);
    return;
  }
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  const reader = new FileReader();
  reader.onloadend = function () {
    const base64Data = reader.result?.toString().split(",")[1] || "";
    (0,_chat_api__WEBPACK_IMPORTED_MODULE_3__.imageAISummary)({
      image: `data:${mimeType};base64,` + base64Data,
      language: getAutoTransLang()
    }).then(response => {
      if (response?.text) {
        newMessage = {
          ...newMessage,
          content: JSON.stringify({
            message,
            summaryInfo: JSON.stringify({
              text: response?.text
            }),
            isAuto,
            status: "success"
          })
        };
        sendMessageToAIRoom(newMessage);
      } else {
        sendErrorMessage(newMessage, message, isAuto);
      }
    }).catch(err => {
      console.log("error", err);
      sendErrorMessage(newMessage, message, isAuto);
    });
  };
  reader.readAsDataURL(blob);
}
function canSummarize(message) {
  const {
    photo,
    document,
    webPage,
    voice,
    audio,
    text,
    video
  } = message?.content;
  const isUrl = checkIsUrl(text?.text);
  const hasText = text?.text && text.text.trim() !== "";
  return photo || document || webPage && !hasText || voice || audio || isUrl || video;
}
function isHasUrl(text) {
  const urls = extractUrls(text);
  const hasUrl = urls.length > 0;
  return hasUrl;
}
function checkIsUrl(text) {
  return typeof text === "string" && /^https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+$/i.test(text);
}
function checkIsImage(mimeType) {
  return mimeType.startsWith("image/");
}
async function sendErrorMessage(newMessage, message, isAuto) {
  newMessage = {
    ...newMessage,
    content: JSON.stringify({
      message,
      isAuto,
      status: "error"
    })
  };
  await sendMessageToAIRoom(newMessage);
}
function getAutoTransLang() {
  const global = (0,_global__WEBPACK_IMPORTED_MODULE_9__.getGlobal)();
  const {
    telyAiLanguage = "en"
  } = global.settings.byKey;
  return new Intl.DisplayNames([telyAiLanguage], {
    type: "language"
  }).of(telyAiLanguage) || "en";
}
function extractUrls(text) {
  if (typeof text !== "string") return [];
  const urlRegex = /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/gi;
  return text.match(urlRegex) || [];
}
function checkIsVideo(mimeType) {
  return ["video/mp4"].indexOf(mimeType) >= 0;
}

/***/ },

/***/ "?0f9d"
/*!********************!*\
  !*** fs (ignored) ***!
  \********************/
() {

/* (ignored) */

/***/ },

/***/ "?239a"
/*!**********************!*\
  !*** http (ignored) ***!
  \**********************/
() {

/* (ignored) */

/***/ },

/***/ "?5d76"
/*!************************!*\
  !*** canvas (ignored) ***!
  \************************/
() {

/* (ignored) */

/***/ },

/***/ "?6bdd"
/*!**********************!*\
  !*** zlib (ignored) ***!
  \**********************/
() {

/* (ignored) */

/***/ },

/***/ "?7812"
/*!*********************!*\
  !*** url (ignored) ***!
  \*********************/
() {

/* (ignored) */

/***/ },

/***/ "?c0f2"
/*!***********************!*\
  !*** https (ignored) ***!
  \***********************/
() {

/* (ignored) */

/***/ }

}]);
//# sourceMappingURL=src_components_chatAssistant_utils_ai-analyse-message_ts.395ebda634e6b3c12a29.js.map