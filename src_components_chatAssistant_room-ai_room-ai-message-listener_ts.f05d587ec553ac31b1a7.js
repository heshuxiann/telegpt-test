"use strict";
(self["webpackChunkTelyAI"] = self["webpackChunkTelyAI"] || []).push([["src_components_chatAssistant_room-ai_room-ai-message-listener_ts"],{

/***/ "./src/components/chatAssistant/room-ai/room-ai-message-listener.ts"
/*!**************************************************************************!*\
  !*** ./src/components/chatAssistant/room-ai/room-ai-message-listener.ts ***!
  \**************************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_ai_analyse_message__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/ai-analyse-message */ "./src/components/chatAssistant/utils/ai-analyse-message.ts");

class RoomAIMessageListener {
  static messageListener(message) {
    const {
      webPage,
      photo,
      video,
      audio,
      voice,
      document,
      text
    } = message.content;
    const isUrl = (0,_utils_ai_analyse_message__WEBPACK_IMPORTED_MODULE_0__.checkIsUrl)(text?.text);
    if (message.isMentioned) {
      (0,_utils_ai_analyse_message__WEBPACK_IMPORTED_MODULE_0__.replyToMention)(message, true);
    } else if (webPage && !text?.text || isUrl) {
      (0,_utils_ai_analyse_message__WEBPACK_IMPORTED_MODULE_0__.webPageSummary)(message, true);
    } else if (photo) {
      (0,_utils_ai_analyse_message__WEBPACK_IMPORTED_MODULE_0__.photoSummary)(message, true);
    } else if (voice) {
      (0,_utils_ai_analyse_message__WEBPACK_IMPORTED_MODULE_0__.voiceToAudioSummary)(message, true);
    } else if (audio) {
      (0,_utils_ai_analyse_message__WEBPACK_IMPORTED_MODULE_0__.audioSummary)(message, true);
    } else if (document) {
      (0,_utils_ai_analyse_message__WEBPACK_IMPORTED_MODULE_0__.documentSummary)(message, true);
    } else if (video) {
      (0,_utils_ai_analyse_message__WEBPACK_IMPORTED_MODULE_0__.videoSummary)(message, true);
    }
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (RoomAIMessageListener);

/***/ }

}]);
//# sourceMappingURL=src_components_chatAssistant_room-ai_room-ai-message-listener_ts.f05d587ec553ac31b1a7.js.map