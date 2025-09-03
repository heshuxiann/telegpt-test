import { useCallback, useEffect, useState } from '../../../lib/teact/teact';
import { getGlobal } from '../../../global';

import type { TextMessage } from '../../../util/userPortrait';
import type { UserPortraitMessageInfo } from '../../chatAssistant/store/user-portrait-message-store';
import type { UserPortraitInfo } from '../../chatAssistant/store/user-portrait-store';

import {
  getMessageBySendId,
  groupMessagesByHalfHour,
} from '../../../util/userPortrait';
import { replaceToJSON } from '../../chatAssistant/ai-chatfolders/util';
import { ChataiStores } from '../../chatAssistant/store';
import { checkIsUrl } from '../../chatAssistant/utils/ai-analyse-message';
import { chatAIGenerate } from '../../chatAssistant/utils/chat-api';

type Props = {
  userId: string;
};

const PROMPT = `
  你是一个专业的数据分析师, 根据提供的消息内容进行分析, 并返回JSON格式数据;
  # 格式要求
    ## 去除所有换行符,确保 JSON 结构紧凑
    ## 严格遵从JSON规范,确保所有的JSON数据正确
  # 数据字段解析
    ## langs: 根据提供的内容，判断出用的是哪种语言，如Chinese, English等; 最多给出两种，按使用频率排序
    ## tags: 根据提供的内容，分析出用户的职业或涉及的行业, 给出最多5个标签;
  # 返回的JSON格式示例
    {
      langs: ['Chinese', 'English'],
      tags: ['Analytical Investor', 'DAO Governance'],
    }
`;

const SUMMARY_PROMPT = `
## 输入字段解释
   - chatGroups: 聊天组
    - chatId: 群聊ID
    - messages: 聊天记录
     - content: 消息内容
   - time: 日期
   - timeRange: 时间范围
# 输出格式要求
    ## 去除所有换行符,确保 JSON 结构紧凑
    ## 严格遵从JSON规范,确保所有的JSON数据正确
## 各模块输出要求
  ## mainTopic(主要话题)
  - 目标：提取各群聊的主要话题、关键数据、时间节点、观点与行动建议，形成“日报风格”的结构化摘要。
    - title：该群聊消息的主要话题简述，需简洁、明确、贴近群内讨论核心
    - content：只提取有实际价值的信息，包括但不限于：
           - 行情数据、交易记录、质押金额、区块信息等
           - 涉及数字、价格、网址、时间等要素的内容
           - 用户的观点、经验分享、操作建议、趋势判断等
    - content 必须剔除下列内容：
      - 单独的短语、问候、无意义的表情或单字回复（如“来了”“哈”“好”）
      - 无法单独体现价值的闲聊碎片
    - 如果多条短句连贯构成有价值的观点或讨论，请合并后保留
    - 如果某个群聊**没有任何有价值的内容**，则**完全省略该群聊，不在输出中显示**
    - 输出格式及字段说明：
      [
        {
          time: 日期, // 原样返回
          timeRange: '时间范围', // 原样返回
          chatGroups: [{
            chatId: 群聊ID, // 原样返回
            title: '8-15字核心议题',
            summaryItems: {       // 至少1条，最多5条
              content: 子话题：数据+行为+建议"结构'; 如无总结内容，则直接返回原信息
              relevantMessageIds: [消息ID1, 消息ID2, ...], // 原样返回
            }[]
          }]
        }
      ]
`;

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

      chatAIGenerate({
        data: {
          messages: [
            { role: 'system', content: PROMPT },
            {
              role: 'user',
              content: messages
                ?.slice(0, 100)
                ?.map((item) => item.content)
                .join(' '),
            },
          ],
        },
        onResponse: (response) => {
          const result = replaceToJSON(response);
          const userObj = {
            ...userInfo,
            id: userId,
            lastMsgId: maxId,
            langs: result?.langs,
            tags: result?.tags,
            chatCount: Object.keys(chatCountByChatId).length,
            chatIds: sortedChatIds,
          };
          ChataiStores.userPortrait?.addUserPortrait(userObj);
          setNewUserInfo(userObj);
        },
      });

      const groupMessages = groupMessagesByHalfHour(
        messages.filter((msg) => msg.messageId > lastMsgId),
      );
      if (groupMessages.length === 0) return;
      setLoading(true);
      const global = getGlobal();
      const { autoTranslateLanguage = 'en' } = global.settings.byKey;
      chatAIGenerate({
        data: {
          messages: [
            { role: 'system', content: SUMMARY_PROMPT },
            { role: 'system', content: `响应必须完全用以下目标语言编写:${autoTranslateLanguage},不要使用其他语言。` },
            { role: 'user', content: JSON.stringify(groupMessages) },
          ],
        },
        onResponse: (response) => {
          const result = replaceToJSON(response);
          const resultArr: UserPortraitMessageInfo[] = [];
          result?.forEach((item: any) => {
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
        },
        onFinish: () => {
          setLoading(false);
        },
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
