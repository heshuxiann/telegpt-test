/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
import type { Message } from 'ai';
import { Dropdown, Popover } from 'antd';
import { getActions, getGlobal } from '../../../global';

import { selectChat, selectUser } from '../../../global/selectors';
import { buildEntityTypeFromIds, getIdsFromEntityTypes, telegptSettings } from '../api/user-settings';
import { cn, formatTimestamp } from '../utils/util';
import MessageActionsItems from './message-actions-button';

import Avatar from '../component/Avatar';
import Icon from '../component/Icon';
import ErrorBoundary from '../ErrorBoundary';
import { DrawerKey, useDrawerStore } from '../global-summary/DrawerContext';

import ActionsIcon from '../assets/actions.png';
import CalendarIcon from '../assets/calendar.png';
import CheckIcon from '../assets/check.png';
import MessageIcon from '../assets/message.png';
import SerenaLogoPath from '../assets/serena.png';
import UserIcon from '../assets/user.png';
import WriteIcon from '../assets/write.png';
import { isUserId } from '../../../util/entities/ids';

interface IProps {
  message: Message;
  deleteMessage: () => void;
}
interface ISummaryInfo {
  summaryMessageCount: number;
  summaryStartTime: number;
  summaryEndTime: number;
  summaryChatIds: Array<string>;
}

interface ISummaryPendingItem {
  chatId: string;
  chatRoomName: string;
  summary: string;
  relevantMessageIds: number[];
}
interface ISummaryGarbageItem {
  chatId: string;
  chatRoomName: string;
  summary: string;
  level: 'high' | 'low';
  relevantMessageIds: number[];
}

interface SummaryTopic {
  chatId: string;
  chatRoomName: string;
  mainTopics: Array<{
    content: string;
    relevantMessageIds: number[];
  }>;
  customTopics: Array<{
    topicName: string;
    summaryItems: Array<{
      content: string;
      relevantMessageIds: number[];
    }>;
  }>;
}

// 新增：按主题聚合的结构（summary-by-topic 模板）
interface SummaryByTopicItem {
  topicName: string;
  relatedChatIds: string[];
  summaryItems: Array<{
    content: string;
    relevantChats: Array<{
      chatId: string;
      messageIds: number[];
    }>;
  }>;
}

/**
 * 时间戳专用时间范围格式化工具
 * @param {number} start 开始时间戳（支持毫秒/秒级）
 * @param {number} end 结束时间戳（支持毫秒/秒级）
 * @returns {string} 格式化后的时间范围字符串
 */
function formatTimestampRange(start: number | undefined, end: number | undefined) {
  // 时间戳标准化处理（自动识别秒/毫秒）
  const normalizeTimestamp = (ts: number) => {
    if (ts.toString().length <= 10) return ts * 1000; // 秒级转毫秒
    return ts; // 毫秒级直接使用
  };

  const startDate = start ? new Date(normalizeTimestamp(start)) : undefined;
  const endDate = end ? new Date(normalizeTimestamp(end)) : undefined;
  const now = new Date();

  // 日期比较函数
  const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();

  const isToday = (date: Date) => isSameDay(date, now);

  // 时间格式化组件
  const formatTime = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const formatDate = (date: Date) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const month = monthNames[date.getMonth()];
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${month} ${pad(date.getDate())} / ${formatTime(date)}`;
  };

  if (!startDate && !endDate) {
    return '';
  }
  if (!startDate && endDate) {
    return `${formatDate(endDate)}`;
  }
  if (startDate && !endDate) {
    return `${formatDate(startDate)}`;
  }
  if (startDate && endDate) {
    // 范围判断逻辑
    if (isToday(startDate) && isToday(endDate)) {
      return `${formatTime(startDate)} - ${formatTime(endDate)}`;
    } else {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
  }
  return '';
}

function mergeTopics(mainTopic: any[], customTopic: any[]): SummaryTopic[] {
  const mergedMap = new Map<string, {
    chatId: string;
    chatRoomName: string;
    mainTopics: Array<{ content: string; relevantMessageIds: number[] }>;
    customTopics: Array<{
      topicName: string;
      summaryItems: Array<{ content: string; relevantMessageIds: number[] }>;
    }>;
  }>();

  // 处理 mainTopic
  if (mainTopic.length > 0) {
    for (const item of mainTopic) {
      const key = item.chatId;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          chatId: item.chatId,
          chatRoomName: item.chatRoomName,
          mainTopics: item.summaryItems || [],
          customTopics: [],
        });
      } else {
        const existing = mergedMap.get(key)!;
        existing.mainTopics.push(...(item.summaryItems || []));
      }
    }
  }

  // 处理 customTopic
  if (customTopic.length > 0) {
    for (const item of customTopic) {
      const key = item.chatId;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          chatId: item.chatId,
          chatRoomName: item.chatRoomName,
          mainTopics: [],
          customTopics: [{
            topicName: item.topicName,
            summaryItems: item.summaryItems || [],
          }],
        });
      } else {
        const existing = mergedMap.get(key)!;
        existing.customTopics.push({
          topicName: item.topicName,
          summaryItems: item.summaryItems || [],
        });
      }
    }
  }

  return Array.from(mergedMap.values());
}

const ChatAvatar = ({
  chatId, classNames, size, style, tooltip,
}: { chatId: string; classNames?: string; size: number; style?: { [key: string]: string }; tooltip?: boolean }) => {
  const global = getGlobal();
  if (!chatId) return null;
  let peer;
  if (isUserId(chatId)) {
    peer = selectUser(global, chatId);
  } else {
    peer = selectChat(global, chatId);
  }
  return (
    <Avatar
      style={style}
      key={chatId}
      className={cn(classNames, 'overlay-avatar inline-block cursor-pointer')}
      size={size}
      peer={peer}
      tooltip={tooltip}
    />
  );
};

const SummaryTopicItem = ({ chatId, topicItem }: {
  chatId: string;
  topicItem: { content: string; relevantMessageIds: number[] }[];
}) => {
  const { openDrawer } = useDrawerStore();
  const showMessageDetail = (chatId: string, relevantMessageIds: number[]) => {
    openDrawer(DrawerKey.OriginalMessages, {
      relevantMessages: [{ chatId, messageIds: relevantMessageIds }],
    });
  };
  return (
    <ErrorBoundary>
      <ul className="list-disc pl-[18px] text-[16px] list-inside">
        {topicItem.map((summaryItem: any) => {
          const { content, relevantMessageIds } = summaryItem;
          if (!content) return null;
          return (
            <li
              role="button"
              className="cursor-pointer text-[15px] break-words"
              onClick={() => showMessageDetail(chatId, relevantMessageIds)}
              data-readable
            >
              {content}
            </li>
          );
        })}
      </ul>
    </ErrorBoundary>
  );
};

// 新增：主题模式下的条目渲染（支持多会话消息定位）
const TopicSummaryItem = ({ topicItems }: {
  topicItems: { content: string; relevantChats: { chatId: string; messageIds: number[] }[] }[];
}) => {
  const { openDrawer } = useDrawerStore();
  const showMessageDetail = (relevantChats: { chatId: string; messageIds: number[] }[]) => {
    const relevantMessages = relevantChats.map((c) => ({ chatId: c.chatId, messageIds: c.messageIds }));
    openDrawer(DrawerKey.OriginalMessages, { relevantMessages });
  };
  return (
    <ErrorBoundary>
      <ul className="list-disc pl-[18px] text-[16px] list-inside">
        {topicItems.map((summaryItem) => {
          const { content, relevantChats } = summaryItem;
          if (!content) return null;
          return (
            <li
              role="button"
              className="cursor-pointer text-[15px] break-words"
              onClick={() => showMessageDetail(relevantChats)}
              data-readable
            >
              {content}
            </li>
          );
        })}
      </ul>
    </ErrorBoundary>
  );
};

const SummaryPenddingItem = ({ pendingItem }: { pendingItem: ISummaryPendingItem }) => {
  const { openDrawer } = useDrawerStore();
  const showMessageDetail = () => {
    openDrawer(DrawerKey.OriginalMessages, {
      relevantMessages: [{ chatId: pendingItem.chatId, messageIds: pendingItem.relevantMessageIds }],
    });
  };
  return (
    <ErrorBoundary>
      <div
        className="flex gap-[8px] my-[4px] cursor-pointer"
        key={pendingItem.chatId}
        onClick={showMessageDetail}
      >
        <img className="w-[18px] h-[18px] mt-[2px]" src={CheckIcon} alt="" />
        <span className="text-[15px]" data-readable>{pendingItem.summary}</span>
        <ChatAvatar size={20} chatId={pendingItem.chatId} />
      </div>
    </ErrorBoundary>
  );
};

const SummaryGarbageItem = ({ garBageItem }: { garBageItem: ISummaryGarbageItem }) => {
  const {
    chatId, chatRoomName, level, summary, relevantMessageIds,
  } = garBageItem;
  const { openDrawer } = useDrawerStore();
  const showMessageDetail = (chatId: string, relevantMessageIds: number[]) => {
    openDrawer(DrawerKey.OriginalMessages, {
      relevantMessages: [{ chatId, messageIds: relevantMessageIds }],
    });
  };
  if (!isUserId(chatId)) {
    return undefined;
  }
  return (
    <ErrorBoundary>
      <div
        className="flex justify-start gap-[8px] my-[16px]"
        key={garBageItem.chatId}
        onClick={() => { showMessageDetail(chatId, relevantMessageIds); }}
      >
        <ChatAvatar chatId={chatId} size={44} />
        <div className="flex flex-col justify-center">
          <p className="text-[16px] font-semibold leading-[20px] mb-[4px]">{chatRoomName}</p>
          <div className="flex justify-start gap-[4px]">
            {level === 'high' ? (
              <span className="text-[#FF543D] text-[14px] whitespace-nowrap">🔴 High-Risk</span>
            ) : (
              <span className="text-[#FF9B05] text-[14px] whitespace-nowrap">🟡 Low-Risk</span>
            )}
            <span className="text-[14px] text-[var(--color-text-secondary)]">{summary}</span>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

const SummaryInfoContent = ({ summaryInfo }: { summaryInfo: ISummaryInfo }) => {
  const { globalsummarytemplate } = telegptSettings.telegptSettings;
  const { showNotification } = getActions();
  const handleSummaryTempChange = (temp: string) => {
    telegptSettings.setSettingOption({
      globalsummarytemplate: temp,
    });
    if (temp === 'summary-by-chat') {
      showNotification({
        message: 'Summaries will be organized by chat next time.',
        icon:'message-succeeded'
      });
    } else {
      showNotification({
        message: 'Summaries will be organized by topic next time.',
        icon:'message-succeeded'
      });
    }
  }
  return (
    <ErrorBoundary>
      <div className="mb-[6px]">
        <div className="flex items-center gap-[8px]">
          <img className="w-[52px] h-[52px] rounded-full ml-[-60px]" src={SerenaLogoPath} alt="" />
          <div>
            <p className="text-[16px] font-semibold">TelyAI</p>
            {summaryInfo?.summaryEndTime ? (
              <p className="text-[14px] text-[#A8A6AC]">{formatTimestamp(summaryInfo.summaryEndTime)}</p>
            ) : null}
          </div>
          <Dropdown
            trigger={['click']}
            placement='bottomRight'
            className='ml-auto'
            menu={{
              items: [
                {
                  key: 'summary-by-chat',
                  label: 'Summarize by Chats',
                },
                {
                  key: 'summary-by-topic',
                  label: 'Summarize by Topics',
                },
              ],
              selectable: true,
              defaultSelectedKeys: [globalsummarytemplate],
              onClick: (key) => {
                handleSummaryTempChange(key.key);
              },
            }}>
            <Icon name="more" className='text-[#5E6272] text-[24px] rotate-90' />
          </Dropdown>
        </div>
        <p className="text-[22px] font-bold mb-[16px]" data-readable>Chat Summary</p>
        <div className="flex items-center flex-wrap">
          <p className="flex items-center gap-[8px] flex-nowrap">
            <img className="w-[16px] h-[16px]" src={CalendarIcon} alt="" />
            <div className="flex items-center gap-[4px]">
              <span className="mr-[4px] font-bold text-[14px]" data-readable data-readable-inline>Time range:</span>
              <span data-readable data-readable-inline>{formatTimestampRange(summaryInfo?.summaryStartTime, summaryInfo?.summaryEndTime)}</span>
            </div>
          </p>
          <p className="flex items-center gap-[8px] flex-nowrap !ml-[20px]">
            <img className="w-[16px] h-[16px]" src={MessageIcon} alt="" />
            <div className="flex items-center gap-[4px]">
              <span className="font-bold text-[14px]" data-readable data-readable-inline>Messages:</span>
              {summaryInfo?.summaryMessageCount ? (
                <span data-readable data-readable-inline>{summaryInfo?.summaryMessageCount}</span>
              ) : null}
            </div>
          </p>
        </div>
        {summaryInfo?.summaryChatIds ? (
          <div className="flex items-center gap-[8px] mt-[10px]">
            <img className="w-[16px] h-[16px]" src={UserIcon} alt="" />
            <span className="font-bold text-[14px]">Groups/friends: </span>
            <div className="flex items-center">
              {summaryInfo.summaryChatIds.slice(0, 10).map((id: string, index: number) => {
                return (
                  <ChatAvatar
                    style={{ zIndex: `${String(summaryInfo.summaryChatIds.length - index)};` }}
                    chatId={id}
                    size={24}
                    classNames="summary-avatar-group !border-solid-[2px] !border-white ml-[-4px]"
                    key={id}
                  />
                );
              })}
              {summaryInfo.summaryChatIds.length > 10 ? (
                <div className="w-[24px] h-[24px] rounded-full bg-[#979797] text-[12px] whitespace-nowrap flex items-center justify-center">
                  {summaryInfo.summaryChatIds.length - 10}+
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </ErrorBoundary>
  );
};

const IgnoreSummaryButton = ({ chatId, handleIgnore }: { chatId: string; handleIgnore: (id: string) => void }) => {
  return (
    <div
      className="flex items-center gap-[4px] cursor-pointer transition-colors duration-200 text-[14px] text-[var(--color-text)]"
      onClick={() => handleIgnore(chatId)}
    >
      <Icon name="eye-crossed" />
      <span className="font-semibold">Ignore this chat</span>
    </div>
  );
};

const MainSummaryByChatContent = ({
  messageId,
  summaryInfo,
  summaryTopic,
  pendingMatters,
  deleteMessage,
}: {
  messageId: string;
  summaryInfo: ISummaryInfo | null;
  summaryTopic: SummaryTopic[];
  pendingMatters: ISummaryPendingItem[];
  deleteMessage: () => void;
}) => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { ignored_summary_chat_ids } = telegptSettings.telegptSettings;
  const ignoredChatIds = getIdsFromEntityTypes(ignored_summary_chat_ids);
  const [ignoredIds, setIgnoredIds] = useState<string[]>(ignoredChatIds);
  const handleIgnore = useCallback((id: string) => {
    const newSelected = [...new Set([...ignoredIds, id])];
    const entityTypes = buildEntityTypeFromIds(newSelected);
    setIgnoredIds(newSelected);
    telegptSettings.setSettingOption({
      ignored_summary_chat_ids: entityTypes,
    }, (res) => {
      if (res.code === 0) {
        getActions().showNotification({
          message: 'This chat will no longer be included in future summaries.',
        });
      }
    });
  }, [ignoredIds]);
  return (
    <div
      className="w-max-[693px] rounded-[10px] pl-[82px] pr-[25px] pt-[20px] pb-[25px] bg-[var(--color-background)]"
      data-message-container
    >
      {/* summary info  */}
      {summaryInfo && <SummaryInfoContent summaryInfo={summaryInfo} />}
      {summaryTopic.length > 0 && (
        <div>
          <p className="flex items-center gap-[8px] mb-[16px]">
            <span className="text-[18px] font-bold" data-readable>Key Topics</span>
            <img className="w-[16px] h-[16px]" src={WriteIcon} alt="" />
          </p>
          {
            summaryTopic.map((item, index) => {
              return (
                <div>
                  <div className="flex items-center justify-between gap-[8px]">
                    {ignoredIds.includes(item.chatId) ? (
                      <div className="flex items-center gap-[8px]">
                        <p className="text-[16px] font-bold" data-readable>{index + 1}.{item.chatRoomName}</p>
                        <ChatAvatar size={20} chatId={item.chatId} />
                      </div>
                    ) : (
                      <Popover
                        className="room-info-popover"
                        placement="top"
                        content={
                          <IgnoreSummaryButton chatId={item.chatId} handleIgnore={handleIgnore} />
                        }
                      >
                        <div className="flex items-center gap-[8px]">
                          <p className="text-[16px] font-bold" data-readable>{index + 1}.{item.chatRoomName}</p>
                          <ChatAvatar size={20} chatId={item.chatId} />
                        </div>
                      </Popover>
                    )}

                  </div>
                  <ul className="list-disc pl-[2px] text-[16px] list-inside">
                    {item.mainTopics.length > 0 && (
                      <li>
                        <span className="text-[16px] font-bold" data-readable>Key Points</span>
                        <SummaryTopicItem chatId={item.chatId} topicItem={item.mainTopics} />
                      </li>
                    )}
                    {
                      item.customTopics.length > 0 && (
                        item.customTopics.map((customTopic) => {
                          return (
                            <li>
                              <span className="text-[16px] font-bold" data-readable>{customTopic.topicName}</span>
                              <SummaryTopicItem chatId={item.chatId} topicItem={customTopic.summaryItems} />
                            </li>
                          );
                        })
                      )
                    }
                  </ul>
                </div>
              );
            })
          }
        </div>
      )}
      {/* pending actions  */}
      {pendingMatters.length > 0 && (
        <div>
          <p className="flex items-center gap-[8px] mb-[16px]">
            <span className="text-[18px] font-bold" data-readable>Actions Items</span>
            <img className="w-[16px] h-[16px]" src={ActionsIcon} alt="" />
          </p>
          {pendingMatters.map((item) => (<SummaryPenddingItem pendingItem={item} />))}
        </div>
      )}
      {/* action buttons  */}
      <MessageActionsItems
        canCopy
        canVoice
        canDelete
        onDelete={deleteMessage}
        message={{ id: messageId } as Message}
      />
    </div>
  );
};

// 新增：按主题渲染的主内容（summary-by-topic 模板）
const MainSummaryByTopicContent = ({
  messageId,
  summaryInfo,
  topics,
  pendingMatters,
  deleteMessage,
}: {
  messageId: string;
  summaryInfo: ISummaryInfo | null;
  topics: SummaryByTopicItem[];
  pendingMatters: ISummaryPendingItem[];
  deleteMessage: () => void;
}) => {
  return (
    <div
      className="w-max-[693px] rounded-[10px] pl-[82px] pr-[25px] pt-[20px] pb-[25px] bg-[var(--color-background)]"
      data-message-container
    >
      {summaryInfo && <SummaryInfoContent summaryInfo={summaryInfo} />}
      {topics.length > 0 && (
        <div>
          <p className="flex items-center gap-[8px] mb-[16px]">
            <span className="text-[18px] font-bold" data-readable>Key Topics</span>
            <img className="w-[16px] h-[16px]" src={WriteIcon} alt="" />
          </p>
          {topics.map((topic, index) => (
            <div>
              <div className="flex items-center justify-between gap-[8px]">
                <div className="flex items-center gap-[8px]">
                  <p className="text-[16px] font-bold" data-readable>{index + 1}.{topic.topicName || 'Untitled Topic'}</p>
                  {/* 关联的群组/好友头像 */}
                  <div className="flex items-center">
                    {topic.relatedChatIds?.slice(0, 6).map((id) => (
                      <ChatAvatar size={20} chatId={id} key={`${topic.topicName}-${id}`} />
                    ))}
                    {topic.relatedChatIds && topic.relatedChatIds.length > 6 ? (
                      <div className="ml-[4px] text-[12px] text-[var(--color-text-secondary)]">{topic.relatedChatIds.length - 6}+</div>
                    ) : null}
                  </div>
                </div>
              </div>
              <TopicSummaryItem topicItems={topic.summaryItems} />
            </div>
          ))}
        </div>
      )}
      {pendingMatters.length > 0 && (
        <div>
          <p className="flex items-center gap-[8px] mb-[16px]">
            <span className="text-[18px] font-bold" data-readable>Actions Items</span>
            <img className="w-[16px] h-[16px]" src={ActionsIcon} alt="" />
          </p>
          {pendingMatters.map((item) => (<SummaryPenddingItem pendingItem={item} />))}
        </div>
      )}
      <MessageActionsItems
        canCopy
        canVoice
        canDelete
        onDelete={deleteMessage}
        message={{ id: messageId } as Message}
      />
    </div>
  );
};
const SummaryContent = ({
  messageId,
  summaryInfo,
  summaryTopic,
  summaryTopicByTopic,
  summaryTemplate,
  pendingMatters,
  garbageMessage,
  deleteMessage,
}:
  {
    messageId: string;
    summaryInfo: ISummaryInfo | null;
    summaryTopic: SummaryTopic[];
    summaryTopicByTopic: SummaryByTopicItem[];
    summaryTemplate: string;
    pendingMatters: ISummaryPendingItem[];
    garbageMessage: ISummaryGarbageItem[];
    deleteMessage: () => void;
  }) => {
  const isChatTemplate = summaryTemplate === 'summary-by-chat';
  return (
    <>
      {isChatTemplate ? (
        (!summaryTopic.length && !pendingMatters.length) ? null : (
          <MainSummaryByChatContent
            messageId={messageId}
            summaryInfo={summaryInfo}
            summaryTopic={summaryTopic}
            pendingMatters={pendingMatters}
            deleteMessage={deleteMessage}
          />
        )
      ) : (
        (!summaryTopicByTopic.length && !pendingMatters.length) ? null : (
          <MainSummaryByTopicContent
            messageId={messageId}
            summaryInfo={summaryInfo}
            topics={summaryTopicByTopic}
            pendingMatters={pendingMatters}
            deleteMessage={deleteMessage}
          />
        )
      )}

      {garbageMessage && garbageMessage.length > 0 && (
        <div className="w-max-[693px] rounded-[10px] bg-[var(--color-background)] pl-[82px] pr-[25px] pt-[20px] pb-[25px] mt-[10px]">
          <div className="flex items-center gap-[8px]">
            <img className="w-[52px] h-[52px] rounded-full ml-[-60px]" src={SerenaLogoPath} alt="" />
            <div>
              <p className="text-[16px] font-semibold">TelyAI</p>
              {summaryInfo?.summaryEndTime ? (
                <p className="text-[14px] text-[#A8A6AC]">{formatTimestamp(summaryInfo.summaryEndTime)}</p>
              ) : null}
            </div>
          </div>
          <p className="text-[22px] font-bold mb-[16px]">Spam Filtering</p>
          <div className="flex items-center gap-[20px]">
            <p className="flex items-center gap-[8px]">
              <img className="w-[16px] h-[16px]" src={CalendarIcon} alt="" />
              <div className="flex items-center">
                <span className="mr-[4px]">Time range:</span>
                {formatTimestampRange(summaryInfo?.summaryStartTime, summaryInfo?.summaryEndTime)}
              </div>
            </p>
          </div>
          {garbageMessage.map((item) => (<SummaryGarbageItem garBageItem={item} />))}
        </div>
      )}
    </>
  );
};
const GlobalSummaryMessage = (props: IProps) => {
  const { message, deleteMessage } = props;
  const [summaryInfo, setSummaryInfo] = useState<ISummaryInfo | null>(null);
  const [pendingMatters, setPendingMatters] = useState<ISummaryPendingItem[]>([]);
  const [garbageMessage, setGarbageMessage] = useState<ISummaryGarbageItem[]>([]);
  const [summaryTopic, setSummaryTopic] = useState<SummaryTopic[]>([]);
  const [summaryTopicByTopic, setSummaryTopicByTopic] = useState<SummaryByTopicItem[]>([]);
  const [summaryTemplate, setSummaryTemplate] = useState<'summary-by-chat' | 'summary-by-topic'>('summary-by-chat');

  const parseMessage = useCallback((messageContent: string) => {
    const messageObj = JSON.parse(messageContent);
    const {
      mainTopic = [], pendingMatters, garbageMessage, customTopic = [], summaryInfo, summaryTemplate = 'summary-by-chat',
    } = messageObj;

    if (pendingMatters) {
      setPendingMatters(pendingMatters as ISummaryPendingItem[]);
    }
    if (garbageMessage) {
      setGarbageMessage(garbageMessage as ISummaryGarbageItem[]);
    }
    if (summaryInfo) {
      setSummaryInfo(summaryInfo as ISummaryInfo);
    }

    setSummaryTemplate(summaryTemplate);

    if (summaryTemplate === 'summary-by-topic') {
      const topics: SummaryByTopicItem[] = [...(mainTopic || []), ...(customTopic || [])];
      setSummaryTopicByTopic(topics);
      setSummaryTopic([]);
    } else {
      const mergeSummaryTopics = mergeTopics(mainTopic, customTopic);
      setSummaryTopic(mergeSummaryTopics);
      setSummaryTopicByTopic([]);
    }
  }, []);

  useEffect(() => {
    try {
      parseMessage(message.content);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [message, parseMessage]);

  if (!summaryInfo) {
    return null;
  }

  return (
    <SummaryContent
      messageId={message.id}
      summaryInfo={summaryInfo}
      summaryTopic={summaryTopic}
      summaryTopicByTopic={summaryTopicByTopic}
      summaryTemplate={summaryTemplate}
      pendingMatters={pendingMatters}
      garbageMessage={garbageMessage}
      deleteMessage={deleteMessage}
    />
  );
};

export default GlobalSummaryMessage;
