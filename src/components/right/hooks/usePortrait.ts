import { useCallback, useEffect, useState } from '../../../lib/teact/teact';
import { getGlobal } from '../../../global';

import type { TextMessage } from '../../../util/userPortrait';
import type { UserPortraitMessageInfo } from '../../chatAssistant/store/user-portrait-message-store';
import type { UserPortraitInfo } from '../../chatAssistant/store/user-portrait-store';

import {
  getMessageBySendId,
  groupMessagesByHalfHour,
} from '../../../util/userPortrait';
import { ChataiStores } from '../../chatAssistant/store';
import { checkIsUrl } from '../../chatAssistant/utils/ai-analyse-message';
import { chatAIUserActivities, chatAIUserTags } from '../../chatAssistant/utils/chat-api';

type Props = {
  userId: string;
};

export default function usePortrait({ userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<TextMessage[]>([]);
  const [userInfo, setUserInfo] = useState<UserPortraitInfo | undefined>(
    undefined,
  );
  const [newUserInfo, setNewUserInfo] = useState<UserPortraitInfo | undefined>(
    undefined,
  );
  const [portraitMessage, setPortraitMessage] = useState<UserPortraitMessageInfo[]>([]);
  const [chatTags, setChatTags] = useState<string[]>([]);

  const searchUserMessages = useCallback(
    async (senderId: string) => {
      setLoading(true);
      const res = await getMessageBySendId(senderId);
      setMessages(res?.filter((o: TextMessage) => !checkIsUrl(o?.content)));
      setLoading(false);
    },
    [setMessages],
  );

  const getActivityMessage = useCallback(async (senderId: string) => {
    const portraitInfo = await ChataiStores.userPortrait?.getUserPortrait(
      senderId,
    );
    if (portraitInfo) {
      setUserInfo(portraitInfo);
      setNewUserInfo(portraitInfo);
    } else {
      setUserInfo(undefined);
      setNewUserInfo(undefined);
    }
    const res = await ChataiStores.userPortraitMessage?.searchMessageBySenderId(
      senderId,
    );
    setPortraitMessage(res);
  }, []);

  const handleSummaryMessages = useCallback(() => {
    if (messages?.length === 0) return;
    const maxId = Math.max(...messages.map((obj) => obj.messageId));
    if ((!userInfo || !userInfo?.lastMsgId || (userInfo && userInfo?.lastMsgId < maxId))
      && (userId === messages?.[0]?.senderId)
    ) {
      const lastMsgId = userInfo?.lastMsgId ?? 0;
      const chatCountByChatId = messages.reduce((acc: Record<string, number>, message) => {
        acc[message.chatId] = (acc[message.chatId] || 0) + 1;
        return acc;
      }, {});
      const sortedChatIds = Object.entries(chatCountByChatId)
        .sort((a, b) => b[1] - a[1])
        .map((entry) => entry[0]);
      chatAIUserTags({
        messages: messages?.slice(0, 100),
      }).then((res) => {
        if (res.code === 0 && res.data) {
          const userObj = {
            ...userInfo,
            id: userId,
            lastMsgId: maxId,
            langs: res.data?.langs,
            tags: res.data?.tags,
            chatCount: Object.keys(chatCountByChatId).length,
            chatIds: sortedChatIds,
          };
          ChataiStores.userPortrait?.addUserPortrait(userObj);
          setNewUserInfo(userObj);
        }
      });

      const groupMessages = groupMessagesByHalfHour(
        messages.filter((msg) => msg.messageId > lastMsgId),
      );
      if (groupMessages.length === 0) return;
      setLoading(true);
      const global = getGlobal();
      const { autoTranslateLanguage = 'en' } = global.settings.byKey;
      chatAIUserActivities({
        language: autoTranslateLanguage,
        groupMessages,
      }).then((res) => {
        if (res.code === 0 && res.data && res.data.activities && Array.isArray(res.data.activities)) {
          const resultArr: UserPortraitMessageInfo[] = [];
          res.data.activities?.forEach((item: any) => {
            const sourceObj = groupMessages.find((o) => o?.timeRange === item?.timeRange && o?.time === item?.time);
            const obj = {
              id: `${userId}-(${item?.time})-(${item?.timeRange})`,
              senderId: userId,
              isSummary: true,
              time: item?.time,
              timeRange: item?.timeRange,
              summaryTime: new Date().getTime(),
              messageCount: sourceObj?.chatGroups?.reduce(
                (pre: number, cur: any) => pre + ((cur?.messages || [])?.length ?? 0),
                0,
              ) ?? 0,
              chatGroups: item?.chatGroups?.map((chatGroup: any) => ({
                chatId: chatGroup?.chatId,
                title: chatGroup?.title,
                summaryItems: chatGroup?.summaryItems,
              })),
            };
            ChataiStores.userPortraitMessage?.addUserPortraitMessage(obj);
            resultArr.push(obj);
          });
          // delete old summary message TODO

          setPortraitMessage((pre) => [...pre, ...resultArr]);
          setLoading(false);
        }
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [messages, userId, userInfo]);

  const getChatTags = useCallback(() => {
    const newChatTags: string[] = [];
    if (newUserInfo?.chatIds && newUserInfo?.chatIds?.length > 0) {
      newUserInfo?.chatIds?.slice(0, 5).forEach(async (chatI) => {
        const chatFolder = await ChataiStores.aIChatFolders?.getAIChatFolder(chatI);
        newChatTags.push(chatFolder?.summary);
      });
    }
    setChatTags(newChatTags);
  }, [newUserInfo?.chatIds]);

  function resetState() {
    setLoading(false);
    setMessages([]);
    setPortraitMessage([]);
    setNewUserInfo({} as UserPortraitInfo);
    setChatTags([]);
  }

  useEffect(() => {
    handleSummaryMessages();
  }, [messages?.length, userInfo?.lastMsgId, handleSummaryMessages]);

  useEffect(() => {
    getChatTags();
  }, [getChatTags, newUserInfo?.chatIds]);

  useEffect(() => {
    resetState();
    getActivityMessage(userId);
    searchUserMessages(userId);
  }, [userId, searchUserMessages, getActivityMessage]);

  return {
    userPortraitInfo: newUserInfo,
    chatTags,
    portraitMessage,
    loading,
  };
}
