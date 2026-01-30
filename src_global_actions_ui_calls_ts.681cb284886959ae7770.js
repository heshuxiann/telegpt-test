"use strict";
(self["webpackChunkTelyAI"] = self["webpackChunkTelyAI"] || []).push([["src_global_actions_ui_calls_ts"],{

/***/ "./src/global/actions/ui/calls.ts"
/*!****************************************!*\
  !*** ./src/global/actions/ui/calls.ts ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   checkNavigatorUserMediaPermissions: () => (/* binding */ checkNavigatorUserMediaPermissions),
/* harmony export */   getGroupCallAudioContext: () => (/* binding */ getGroupCallAudioContext),
/* harmony export */   getGroupCallAudioElement: () => (/* binding */ getGroupCallAudioElement),
/* harmony export */   initializeSounds: () => (/* binding */ initializeSounds),
/* harmony export */   initializeSoundsForSafari: () => (/* binding */ initializeSoundsForSafari),
/* harmony export */   removeGroupCallAudioElement: () => (/* binding */ removeGroupCallAudioElement)
/* harmony export */ });
/* harmony import */ var _lib_fasterdom_fasterdom__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../lib/fasterdom/fasterdom */ "./src/lib/fasterdom/fasterdom.ts");
/* harmony import */ var _util_browser_windowEnvironment__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../util/browser/windowEnvironment */ "./src/util/browser/windowEnvironment.ts");
/* harmony import */ var _util_clipboard__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../util/clipboard */ "./src/util/clipboard.ts");
/* harmony import */ var _util_establishMultitabRole__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../util/establishMultitabRole */ "./src/util/establishMultitabRole.ts");
/* harmony import */ var _util_iteratees__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../util/iteratees */ "./src/util/iteratees.ts");
/* harmony import */ var _util_oldLangProvider__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../util/oldLangProvider */ "./src/util/oldLangProvider.ts");
/* harmony import */ var _util_safePlay__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../../util/safePlay */ "./src/util/safePlay.ts");
/* harmony import */ var _api_gramjs__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../../api/gramjs */ "./src/api/gramjs/index.ts");
/* harmony import */ var _helpers__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../helpers */ "./src/global/helpers/index.ts");
/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../index */ "./src/global/index.ts");
/* harmony import */ var _reducers_calls__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../reducers/calls */ "./src/global/reducers/calls.ts");
/* harmony import */ var _reducers_tabs__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../reducers/tabs */ "./src/global/reducers/tabs.ts");
/* harmony import */ var _selectors__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../selectors */ "./src/global/selectors/index.ts");
/* harmony import */ var _selectors_calls__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../../selectors/calls */ "./src/global/selectors/calls.ts");
/* harmony import */ var _api_chats__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../api/chats */ "./src/global/actions/api/chats.ts");
















// This is a tiny MP3 file that is silent - retrieved from https://bigsoundbank.com and then modified
// eslint-disable-next-line @stylistic/max-len
const silentSound = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
let audioElement;
let audioContext;
let sounds;

// Workaround: this function is called once on the first user interaction.
// After that, it will be possible to play the notification on iOS without problems.
// https://rosswintle.uk/2019/01/skirting-the-ios-safari-audio-auto-play-policy-for-ui-sound-effects/
function initializeSoundsForSafari() {
  initializeSounds();
  return Promise.all(Object.values(sounds).map(sound => {
    const prevSrc = sound.src;
    sound.src = silentSound;
    sound.muted = true;
    sound.volume = 0.0001;
    return sound.play().then(() => {
      sound.pause();
      sound.volume = 1;
      sound.currentTime = 0;
      sound.muted = false;
      (0,_lib_fasterdom_fasterdom__WEBPACK_IMPORTED_MODULE_0__.requestNextMutation)(() => {
        sound.src = prevSrc;
      });
    });
  }));
}
function initializeSounds() {
  if (sounds) {
    return;
  }
  const joinAudio = new Audio('./voicechat_join.mp3');
  const connectingAudio = new Audio('./voicechat_connecting.mp3');
  connectingAudio.loop = true;
  const leaveAudio = new Audio('./voicechat_leave.mp3');
  const allowTalkAudio = new Audio('./voicechat_onallowtalk.mp3');
  const busyAudio = new Audio('./call_busy.mp3');
  const connectAudio = new Audio('./call_connect.mp3');
  const endAudio = new Audio('./call_end.mp3');
  const incomingAudio = new Audio('./call_incoming.mp3');
  incomingAudio.loop = true;
  const ringingAudio = new Audio('./call_ringing.mp3');
  ringingAudio.loop = true;
  sounds = {
    join: joinAudio,
    allowTalk: allowTalkAudio,
    leave: leaveAudio,
    connecting: connectingAudio,
    incoming: incomingAudio,
    end: endAudio,
    connect: connectAudio,
    busy: busyAudio,
    ringing: ringingAudio
  };
}
async function fetchGroupCall(global, groupCall) {
  if ((0,_selectors__WEBPACK_IMPORTED_MODULE_12__.selectIsCurrentUserFrozen)(global)) return undefined;
  const result = await (0,_api_gramjs__WEBPACK_IMPORTED_MODULE_7__.callApi)('getGroupCall', {
    call: groupCall
  });
  if (!result) return undefined;
  global = (0,_index__WEBPACK_IMPORTED_MODULE_9__.getGlobal)();
  const existingGroupCall = (0,_selectors_calls__WEBPACK_IMPORTED_MODULE_13__.selectGroupCall)(global, groupCall.id);
  global = (0,_reducers_calls__WEBPACK_IMPORTED_MODULE_10__.updateGroupCall)(global, groupCall.id, (0,_util_iteratees__WEBPACK_IMPORTED_MODULE_4__.omit)(result.groupCall, ['connectionState']), undefined, existingGroupCall?.isLoaded ? undefined : result.groupCall.participantsCount);
  (0,_index__WEBPACK_IMPORTED_MODULE_9__.setGlobal)(global);
  return result.groupCall;
}
function requestGroupCallParticipants(groupCall, nextOffset) {
  return (0,_api_gramjs__WEBPACK_IMPORTED_MODULE_7__.callApi)('fetchGroupCallParticipants', {
    call: groupCall,
    offset: nextOffset
  });
}
(0,_index__WEBPACK_IMPORTED_MODULE_9__.addActionHandler)('toggleGroupCallPanel', (global, actions, payload) => {
  const {
    force,
    tabId = (0,_util_establishMultitabRole__WEBPACK_IMPORTED_MODULE_3__.getCurrentTabId)()
  } = payload || {};
  return (0,_reducers_tabs__WEBPACK_IMPORTED_MODULE_11__.updateTabState)(global, {
    isCallPanelVisible: 'force' in (payload || {}) ? force : !(0,_selectors__WEBPACK_IMPORTED_MODULE_12__.selectTabState)(global, tabId).isCallPanelVisible
  }, tabId);
});
(0,_index__WEBPACK_IMPORTED_MODULE_9__.addActionHandler)('createGroupCall', async (global, actions, payload) => {
  const {
    chatId,
    tabId = (0,_util_establishMultitabRole__WEBPACK_IMPORTED_MODULE_3__.getCurrentTabId)()
  } = payload;
  const chat = (0,_selectors__WEBPACK_IMPORTED_MODULE_12__.selectChat)(global, chatId);
  if (!chat) {
    return;
  }
  const result = await (0,_api_gramjs__WEBPACK_IMPORTED_MODULE_7__.callApi)('createGroupCall', {
    peer: chat
  });
  if (!result) return;
  global = (0,_index__WEBPACK_IMPORTED_MODULE_9__.getGlobal)();
  global = (0,_reducers_calls__WEBPACK_IMPORTED_MODULE_10__.updateGroupCall)(global, result.id, {
    ...result,
    chatId
  });
  (0,_index__WEBPACK_IMPORTED_MODULE_9__.setGlobal)(global);
  actions.requestMasterAndJoinGroupCall({
    id: result.id,
    accessHash: result.accessHash,
    tabId
  });
});
(0,_index__WEBPACK_IMPORTED_MODULE_9__.addActionHandler)('createGroupCallInviteLink', async (global, actions, payload) => {
  const {
    tabId = (0,_util_establishMultitabRole__WEBPACK_IMPORTED_MODULE_3__.getCurrentTabId)()
  } = payload || {};
  const groupCall = (0,_selectors_calls__WEBPACK_IMPORTED_MODULE_13__.selectActiveGroupCall)(global);
  if (!groupCall || !groupCall.chatId) {
    return;
  }
  const chat = (0,_selectors__WEBPACK_IMPORTED_MODULE_12__.selectChat)(global, groupCall.chatId);
  if (!chat) {
    return;
  }
  const hasPublicUsername = Boolean((0,_helpers__WEBPACK_IMPORTED_MODULE_8__.getMainUsername)(chat));
  let inviteLink = (0,_selectors__WEBPACK_IMPORTED_MODULE_12__.selectChatFullInfo)(global, chat.id)?.inviteLink;
  if (hasPublicUsername) {
    inviteLink = await (0,_api_gramjs__WEBPACK_IMPORTED_MODULE_7__.callApi)('exportGroupCallInvite', {
      call: groupCall,
      canSelfUnmute: false
    });
  }
  if (!inviteLink) {
    return;
  }
  (0,_util_clipboard__WEBPACK_IMPORTED_MODULE_2__.copyTextToClipboard)(inviteLink);
  actions.showNotification({
    message: {
      key: 'LinkCopied'
    },
    tabId
  });
});
(0,_index__WEBPACK_IMPORTED_MODULE_9__.addActionHandler)('joinVoiceChatByLink', async (global, actions, payload) => {
  const {
    username,
    inviteHash,
    tabId = (0,_util_establishMultitabRole__WEBPACK_IMPORTED_MODULE_3__.getCurrentTabId)()
  } = payload;
  const chat = await (0,_api_chats__WEBPACK_IMPORTED_MODULE_14__.fetchChatByUsername)(global, username);
  if (!chat) {
    actions.showNotification({
      message: _util_oldLangProvider__WEBPACK_IMPORTED_MODULE_5__.oldTranslate('NoUsernameFound'),
      tabId
    });
    return;
  }
  global = (0,_index__WEBPACK_IMPORTED_MODULE_9__.getGlobal)();
  const full = await (0,_api_chats__WEBPACK_IMPORTED_MODULE_14__.loadFullChat)(global, actions, chat);
  if (full?.groupCall) {
    actions.requestMasterAndJoinGroupCall({
      id: full.groupCall.id,
      accessHash: full.groupCall.accessHash,
      inviteHash,
      tabId
    });
  }
});
(0,_index__WEBPACK_IMPORTED_MODULE_9__.addActionHandler)('requestMasterAndJoinGroupCall', (global, actions, payload) => {
  actions.requestMasterAndCallAction({
    action: 'joinGroupCall',
    payload,
    tabId: payload.tabId || (0,_util_establishMultitabRole__WEBPACK_IMPORTED_MODULE_3__.getCurrentTabId)()
  });
});
(0,_index__WEBPACK_IMPORTED_MODULE_9__.addActionHandler)('requestMasterAndAcceptCall', (global, actions, payload) => {
  actions.requestMasterAndCallAction({
    action: 'acceptCall',
    payload: undefined,
    tabId: payload?.tabId || (0,_util_establishMultitabRole__WEBPACK_IMPORTED_MODULE_3__.getCurrentTabId)()
  });
});
(0,_index__WEBPACK_IMPORTED_MODULE_9__.addActionHandler)('joinGroupCall', async (global, actions, payload) => {
  const {
    chatId,
    id,
    accessHash,
    inviteHash,
    tabId = (0,_util_establishMultitabRole__WEBPACK_IMPORTED_MODULE_3__.getCurrentTabId)()
  } = payload;
  if (!_util_browser_windowEnvironment__WEBPACK_IMPORTED_MODULE_1__.ARE_CALLS_SUPPORTED) {
    actions.showNotification({
      message: 'Sorry, your browser doesn\'t support group calls',
      tabId
    });
    return;
  }
  if (global.phoneCall) {
    actions.toggleGroupCallPanel({
      tabId
    });
    return;
  }
  createAudioElement();
  initializeSounds();
  global = (0,_index__WEBPACK_IMPORTED_MODULE_9__.getGlobal)();
  void checkNavigatorUserMediaPermissions(global, actions, true, tabId);
  const {
    groupCalls: {
      activeGroupCallId
    }
  } = global;
  let groupCall = id ? (0,_selectors_calls__WEBPACK_IMPORTED_MODULE_13__.selectGroupCall)(global, id) : (0,_selectors_calls__WEBPACK_IMPORTED_MODULE_13__.selectChatGroupCall)(global, chatId);
  if (groupCall && groupCall.id === activeGroupCallId) {
    actions.toggleGroupCallPanel({
      tabId
    });
    return;
  }
  if (activeGroupCallId) {
    if ('leaveGroupCall' in actions) {
      actions.leaveGroupCall({
        rejoin: payload,
        tabId
      });
    }
    return;
  }
  if (groupCall && activeGroupCallId === groupCall.id) {
    actions.toggleGroupCallPanel({
      tabId
    });
    return;
  }
  if (!groupCall && (!id || !accessHash) && chatId) {
    const chat = (0,_selectors__WEBPACK_IMPORTED_MODULE_12__.selectChat)(global, chatId);
    if (!chat) return;
    await (0,_api_chats__WEBPACK_IMPORTED_MODULE_14__.loadFullChat)(global, actions, chat);
    global = (0,_index__WEBPACK_IMPORTED_MODULE_9__.getGlobal)();
    groupCall = (0,_selectors_calls__WEBPACK_IMPORTED_MODULE_13__.selectChatGroupCall)(global, chatId);
  } else if (!groupCall && id && accessHash) {
    groupCall = await fetchGroupCall(global, {
      id,
      accessHash
    });
  }
  if (!groupCall) return;
  global = (0,_index__WEBPACK_IMPORTED_MODULE_9__.getGlobal)();
  global = (0,_reducers_calls__WEBPACK_IMPORTED_MODULE_10__.updateGroupCall)(global, groupCall.id, {
    ...groupCall,
    inviteHash
  }, undefined, groupCall.participantsCount + 1);
  global = {
    ...global,
    groupCalls: {
      ...global.groupCalls,
      activeGroupCallId: groupCall.id
    }
  };
  (0,_index__WEBPACK_IMPORTED_MODULE_9__.setGlobal)(global);
  actions.toggleGroupCallPanel({
    force: false,
    tabId
  });
});
(0,_index__WEBPACK_IMPORTED_MODULE_9__.addActionHandler)('playGroupCallSound', (global, actions, payload) => {
  const {
    sound
  } = payload;
  if (!sounds?.[sound]) {
    return;
  }
  const doPlay = () => {
    if (sound !== 'connecting') {
      sounds.connecting.pause();
    }
    if (sound !== 'incoming') {
      sounds.incoming.pause();
    }
    if (sound !== 'ringing') {
      sounds.ringing.pause();
    }
    (0,_util_safePlay__WEBPACK_IMPORTED_MODULE_6__["default"])(sounds[sound]);
  };
  doPlay();
});
(0,_index__WEBPACK_IMPORTED_MODULE_9__.addActionHandler)('loadMoreGroupCallParticipants', global => {
  const groupCall = (0,_selectors_calls__WEBPACK_IMPORTED_MODULE_13__.selectActiveGroupCall)(global);
  if (!groupCall) {
    return;
  }
  void requestGroupCallParticipants(groupCall, groupCall.nextOffset);
});
(0,_index__WEBPACK_IMPORTED_MODULE_9__.addActionHandler)('requestMasterAndRequestCall', (global, actions, payload) => {
  actions.requestMasterAndCallAction({
    action: 'requestCall',
    payload,
    tabId: payload.tabId || (0,_util_establishMultitabRole__WEBPACK_IMPORTED_MODULE_3__.getCurrentTabId)()
  });
});
(0,_index__WEBPACK_IMPORTED_MODULE_9__.addActionHandler)('requestCall', (global, actions, payload) => {
  const {
    userId,
    isVideo,
    tabId = (0,_util_establishMultitabRole__WEBPACK_IMPORTED_MODULE_3__.getCurrentTabId)()
  } = payload;
  if (global.phoneCall) {
    actions.toggleGroupCallPanel({
      tabId
    });
    return;
  }
  const user = (0,_selectors__WEBPACK_IMPORTED_MODULE_12__.selectUser)(global, userId);
  if (!user) {
    return;
  }
  initializeSounds();
  global = (0,_index__WEBPACK_IMPORTED_MODULE_9__.getGlobal)();
  void checkNavigatorUserMediaPermissions(global, actions, isVideo, tabId);
  global = (0,_index__WEBPACK_IMPORTED_MODULE_9__.getGlobal)();
  global = {
    ...global,
    phoneCall: {
      id: '',
      state: 'requesting',
      participantId: userId,
      isVideo,
      adminId: global.currentUserId
    }
  };
  (0,_index__WEBPACK_IMPORTED_MODULE_9__.setGlobal)(global);
  actions.toggleGroupCallPanel({
    force: false,
    tabId
  });
});
function createAudioContext() {
  return new (window.AudioContext || window.webkitAudioContext)();
}
const silence = ctx => {
  const oscillator = ctx.createOscillator();
  const dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  return new MediaStream([Object.assign(dst.stream.getAudioTracks()[0], {
    enabled: false
  })]);
};
function createAudioElement() {
  const ctx = createAudioContext();
  audioElement = new Audio();
  audioContext = ctx;
  audioElement.srcObject = silence(ctx);
  (0,_util_safePlay__WEBPACK_IMPORTED_MODULE_6__["default"])(audioElement);
}
function getGroupCallAudioElement() {
  return audioElement;
}
function getGroupCallAudioContext() {
  return audioContext;
}
function removeGroupCallAudioElement() {
  audioElement?.pause();
  audioContext = undefined;
  audioElement = undefined;
}

// This method is used instead of a navigator.permissions.query to determine permission to use a microphone,
// because Firefox does not have support for 'microphone' and 'camera' permissions
// https://github.com/mozilla/standards-positions/issues/19#issuecomment-370158947
function checkNavigatorUserMediaPermissions(global, actions, isVideo, ...[tabId = (0,_util_establishMultitabRole__WEBPACK_IMPORTED_MODULE_3__.getCurrentTabId)()]) {
  if (isVideo) {
    navigator.mediaDevices.getUserMedia({
      video: true
    }).then(stream => {
      if (stream.getVideoTracks().length === 0) {
        actions.showNotification({
          message: _util_oldLangProvider__WEBPACK_IMPORTED_MODULE_5__.oldTranslate('Call.Camera.Error'),
          tabId
        });
      } else {
        stream.getTracks().forEach(track => track.stop());
        checkMicrophonePermission(global, actions, tabId);
      }
    }).catch(() => {
      actions.showNotification({
        message: _util_oldLangProvider__WEBPACK_IMPORTED_MODULE_5__.oldTranslate('Call.Camera.Error'),
        tabId
      });
    });
  } else {
    checkMicrophonePermission(global, actions, tabId);
  }
}
function checkMicrophonePermission(global, actions, ...[tabId = (0,_util_establishMultitabRole__WEBPACK_IMPORTED_MODULE_3__.getCurrentTabId)()]) {
  navigator.mediaDevices.getUserMedia({
    audio: true
  }).then(stream => {
    if (stream.getAudioTracks().length === 0) {
      actions.showNotification({
        message: _util_oldLangProvider__WEBPACK_IMPORTED_MODULE_5__.oldTranslate('RequestAcces.Error.HaveNotAccess.Call'),
        tabId
      });
    } else {
      stream.getTracks().forEach(track => track.stop());
    }
  }).catch(() => {
    actions.showNotification({
      message: _util_oldLangProvider__WEBPACK_IMPORTED_MODULE_5__.oldTranslate('RequestAcces.Error.HaveNotAccess.Call'),
      tabId
    });
  });
}

/***/ }

}]);
//# sourceMappingURL=src_global_actions_ui_calls_ts.681cb284886959ae7770.js.map