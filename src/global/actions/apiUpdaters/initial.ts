import type {
  ApiUpdateAuthorizationError,
  ApiUpdateAuthorizationState,
  ApiUpdateConnectionState,
  ApiUpdateCurrentUser,
  ApiUpdateServerTimeOffset,
  ApiUpdateSession,
} from '../../../api/types';
import type { LangCode } from '../../../types';
import type { McpToolCallMessage, McpToolResponseMessage } from '../../../util/mcpToolHandler';
import type { TelGPTToolCallMessage } from '../../../util/telegptToolHandler';
import type { RequiredGlobalActions } from '../../index';
import type { ActionReturnType, GlobalState } from '../../types';

import { getCurrentTabId } from '../../../util/establishMultitabRole';
import { getShippingError, shouldClosePaymentModal } from '../../../util/getReadableErrorText';
import { unique } from '../../../util/iteratees';
import { handleMcpToolCall, handleMcpToolResponse } from '../../../util/mcpToolHandler';
import { oldSetLanguage } from '../../../util/oldLangProvider';
import { clearWebTokenAuth } from '../../../util/routing';
import { setServerTimeOffset } from '../../../util/serverTime';
import { updateSessionUserId } from '../../../util/sessions';
import { updateUserSubscriptionInfo } from '../../../util/subscriptionHandler';
import { handleTelGPTToolCall } from '../../../util/telegptToolHandler';
import { getTelGPTWebSocket, initTelGPTWebSocket } from '../../../util/telegptWebSocket';
import { forceWebsync } from '../../../util/websync';
import { setChataiStoreBuilderCurrentUserId } from '../../../components/chatAssistant/store/stores';
import { isChatChannel, isChatSuperGroup } from '../../helpers';
import {
  addActionHandler, getGlobal, setGlobal,
} from '../../index';
import { updateUser, updateUserFullInfo } from '../../reducers';
import { updateTabState } from '../../reducers/tabs';
import { selectTabState } from '../../selectors';
import { selectSharedSettings } from '../../selectors/sharedState';

import eventEmitter, { Actions } from '../../../components/chatAssistant/lib/EventEmitter';
import { getDeviceId } from '../../../components/chatAssistant/agent/utils';

addActionHandler('apiUpdate', (global, actions, update): ActionReturnType => {
  switch (update['@type']) {
    case 'updateApiReady':
      onUpdateApiReady(global);
      break;

    case 'updateAuthorizationState':
      onUpdateAuthorizationState(global, update);
      break;

    case 'updateAuthorizationError':
      onUpdateAuthorizationError(global, update);
      break;

    case 'updateWebAuthTokenFailed':
      onUpdateWebAuthTokenFailed(global);
      break;

    case 'updateConnectionState':
      onUpdateConnectionState(global, actions, update);
      break;

    case 'updateSession':
      onUpdateSession(global, actions, update);
      break;

    case 'updateServerTimeOffset':
      onUpdateServerTimeOffset(update);
      break;

    case 'updateCurrentUser':
      setChataiStoreBuilderCurrentUserId(update.currentUser.id);
      onUpdateCurrentUser(global, update);
      break;

    case 'requestReconnectApi':
      global = { ...global, isSynced: false };
      setGlobal(global);

      onUpdateConnectionState(global, actions, {
        '@type': 'updateConnectionState',
        connectionState: 'connectionStateConnecting',
      });
      actions.initApi();
      break;

    case 'requestSync':
      actions.sync();
      break;

    case 'updateFetchingDifference':
      global = { ...global, isFetchingDifference: update.isFetching };
      setGlobal(global);
      break;

    case 'error': {
      Object.values(global.byTabId).forEach(({ id: tabId }) => {
        const paymentShippingError = getShippingError(update.error);
        if (paymentShippingError) {
          actions.addPaymentError({ error: paymentShippingError, tabId });
        } else if (shouldClosePaymentModal(update.error)) {
          actions.closePaymentModal({ tabId });
        } else if (actions.showDialog) {
          actions.showDialog({ data: update.error, tabId });
        }
      });

      break;
    }

    case 'notSupportedInFrozenAccount': {
      actions.showNotification({
        title: {
          key: 'NotificationTitleNotSupportedInFrozenAccount',
        },
        message: {
          key: 'NotificationMessageNotSupportedInFrozenAccount',
        },
        tabId: getCurrentTabId(),
      });
      break;
    }
  }
});

function onUpdateApiReady<T extends GlobalState>(global: T) {
  void oldSetLanguage(selectSharedSettings(global).language as LangCode);
}

function onUpdateAuthorizationState<T extends GlobalState>(global: T, update: ApiUpdateAuthorizationState) {
  global = getGlobal();

  const wasAuthReady = global.authState === 'authorizationStateReady';
  const authState = update.authorizationState;

  global = {
    ...global,
    authState,
    authIsLoading: false,
  };
  setGlobal(global);

  global = getGlobal();

  switch (authState) {
    case 'authorizationStateLoggingOut':
      void forceWebsync(false);

      global = {
        ...global,
        isLoggingOut: true,
      };
      setGlobal(global);
      break;
    case 'authorizationStateWaitCode':
      global = {
        ...global,
        authIsCodeViaApp: update.isCodeViaApp,
      };
      setGlobal(global);
      break;
    case 'authorizationStateWaitPassword':
      global = {
        ...global,
        authHint: update.hint,
      };

      if (update.noReset) {
        global = {
          ...global,
          hasWebAuthTokenPasswordRequired: true,
        };
      }

      setGlobal(global);
      break;
    case 'authorizationStateWaitQrCode':
      global = {
        ...global,
        authIsLoadingQrCode: false,
        authQrCode: update.qrCode,
      };
      setGlobal(global);
      break;
    case 'authorizationStateReady': {
      if (wasAuthReady) {
        break;
      }

      void forceWebsync(true);

      global = {
        ...global,
        isLoggingOut: false,
      };
      Object.values(global.byTabId).forEach(({ id: tabId }) => {
        global = updateTabState(global, {
          isInactive: false,
        }, tabId);
      });
      setGlobal(global);

      break;
    }
  }
}

function onUpdateAuthorizationError<T extends GlobalState>(global: T, update: ApiUpdateAuthorizationError) {
  // TODO: Investigate why TS is not happy with spread for lang related types
  global = {
    ...global,
  };
  global.authErrorKey = update.errorKey;
  setGlobal(global);
}

function onUpdateWebAuthTokenFailed<T extends GlobalState>(global: T) {
  clearWebTokenAuth();
  global = getGlobal();

  global = {
    ...global,
    hasWebAuthTokenFailed: true,
  };
  setGlobal(global);
}

function onUpdateConnectionState<T extends GlobalState>(
  global: T, actions: RequiredGlobalActions, update: ApiUpdateConnectionState,
) {
  const { connectionState } = update;

  global = getGlobal();
  const tabState = selectTabState(global, getCurrentTabId());
  if (connectionState === 'connectionStateReady' && tabState.isMasterTab && tabState.multitabNextAction) {
    // @ts-ignore
    actions[tabState.multitabNextAction.action](tabState.multitabNextAction.payload);
    actions.clearMultitabNextAction({ tabId: tabState.id });
  }

  if (connectionState === global.connectionState) {
    return;
  }

  global = {
    ...global,
    connectionState,
  };
  setGlobal(global);

  if (global.isSynced) {
    const channelStackIds = Object.values(global.byTabId)
      .flatMap((tab) => tab.messageLists)
      .map((messageList) => messageList.chatId)
      .filter((chatId) => {
        const chat = global.chats.byId[chatId];
        return chat && (isChatChannel(chat) || isChatSuperGroup(chat));
      });
    if (connectionState === 'connectionStateReady' && channelStackIds.length) {
      unique(channelStackIds).forEach((chatId) => {
        actions.requestChannelDifference({ chatId });
      });
    }
  }

  if (connectionState === 'connectionStateBroken') {
    actions.signOut({ forceInitApi: true });
  }
}

function onUpdateSession<T extends GlobalState>(global: T, actions: RequiredGlobalActions, update: ApiUpdateSession) {
  const { sessionData } = update;
  const { authRememberMe, authState } = global;
  const isEmpty = !sessionData || !sessionData.mainDcId;

  const isTest = sessionData?.isTest;
  if (isTest) {
    global = {
      ...global,
      config: {
        ...global.config,
        isTestServer: isTest,
      },
    };
    setGlobal(global);
  }

  if (!authRememberMe || authState !== 'authorizationStateReady' || isEmpty) {
    return;
  }

  actions.saveSession({ sessionData });
}

function onUpdateServerTimeOffset(update: ApiUpdateServerTimeOffset) {
  setServerTimeOffset(update.serverTimeOffset);
}

function onUpdateCurrentUser<T extends GlobalState>(global: T, update: ApiUpdateCurrentUser) {
  const { currentUser, currentUserFullInfo } = update;

  global = {
    ...updateUser(global, currentUser.id, currentUser),
    currentUserId: currentUser.id,
  };
  global = updateUserFullInfo(global, currentUser.id, currentUserFullInfo);
  setGlobal(global);

  updateSessionUserId(currentUser.id);

  // 初始化TelGPT WebSocket连接
  const deviceId = getDeviceId();

  initTelGPTWebSocket({
    userId: currentUser.id,
    deviceId,
    onMessage: (message) => {
      // eslint-disable-next-line no-console
      console.log('[TelGPT] Received message:', message);

      // 处理订阅和积分更新消息
      if (message.action === 'subscription-success' || message.action === 'credit-update') {
        const {
          subscriptionType, creditBalance, subscriptionExpiresAt, createdAt, isExpirated,
        } = message.data;
        const payload = {
          subscriptionType,
          creditBalance,
          subscriptionExpiresAt,
          createdAt,
          isExpirated,
        };
        // 更新用户的会员信息
        updateUserSubscriptionInfo(payload);
        if (message.action === 'subscription-success') {
          eventEmitter.emit(Actions.UpgradeSuccess, payload);
        }
      } else if (message.action === "get_messages") {
         // 处理 TelGPT 工具调用请求 (来自服务端的 get_messages 等请求)
        handleTelGPTToolCall(message as TelGPTToolCallMessage).then((response) => {
          // 通过 WebSocket 发送响应回服务端
          const ws = getTelGPTWebSocket();
          if (ws) {
            ws.send(response);
            // eslint-disable-next-line no-console
            console.log('[TelGPT Tool] Response sent:', response);
          }
        }).catch((error) => {
          // eslint-disable-next-line no-console
          console.error('[TelGPT Tool] Tool call failed:', error);
        });
      }

      // 处理 MCP 工具调用请求
      if (message.type === 'mcp-tool-call') {
        handleMcpToolCall(message as McpToolCallMessage).then((response) => {
          // 这里可以通过 WebSocket 发送响应回服务端
          // eslint-disable-next-line no-console
          console.log('[MCP] Sending tool response:', response);
        }).catch((error) => {
          // eslint-disable-next-line no-console
          console.error('[MCP] Tool call failed:', error);
        });
      }

      // 处理 MCP 工具响应
      if (message.type === 'mcp-tool-response') {
        handleMcpToolResponse(message as McpToolResponseMessage);
      }
    },
    onConnect: () => {
      // eslint-disable-next-line no-console
      console.log('[TelGPT] WebSocket connected');
      let global = getGlobal();
      global = {
        ...global,
        telgptWebSocket: {
          isConnected: true,
        },
      };
      setGlobal(global);
    },
    onDisconnect: () => {
      // eslint-disable-next-line no-console
      console.log('[TelGPT] WebSocket disconnected');
      let global = getGlobal();
      global = {
        ...global,
        telgptWebSocket: {
          isConnected: false,
        },
      };
      setGlobal(global);
    },
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('[TelGPT] WebSocket error:', error);
    },
  });
}
