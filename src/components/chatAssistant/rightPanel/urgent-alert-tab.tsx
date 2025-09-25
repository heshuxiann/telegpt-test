import React, { useCallback, useState } from 'react';
import { message as showMessage } from 'antd';
import { getActions, getGlobal } from '../../../global';

import type { IUrgentTopic } from '../api/user-settings';

import { urgentCheckTask } from '../ai-task/urgent-check-task';
import { buildEntityTypeFromIds, getIdsFromEntityTypes, telegptSettings } from '../api/user-settings';
import { RoomsTab } from './rooms-tab';

import Icon from '../component/Icon';
import { DrawerKey, useDrawerStore } from '../global-summary/DrawerContext';

import './urgent-alert-tab.scss';

const TopicItem = ({ topic, onDelete }: { topic: IUrgentTopic; onDelete: (id: string) => void }) => {
  const { openDrawer } = useDrawerStore();
  const handeleDeleteTopic = () => {
    onDelete(topic.id!);
  };
  const handleEditTopic = () => {
    openDrawer(DrawerKey.AddTopicPanel, topic);
  };
  return (
    <div className="urgent-topic-item px-[20px] py-[12px] leading-[24px] bg-[var(--color-chat-hover)] rounded-[8px] flex flex-row items-center justify-between gap-[24px]">
      <div>{topic.topic}</div>
      <div className="urgent-topic-item-actions flex flex-row gap-[8px]">
        <Icon name="edit" className="text-[14px] cursor-pointer" onClick={handleEditTopic} />
        <Icon name="close" className="text-[14px] cursor-pointer" onClick={handeleDeleteTopic} />
      </div>
    </div>
  );
};
const AddTopic = () => {
  const { openDrawer } = useDrawerStore();
  const handleAddTopic = () => {
    const { subscriptionInfo } = getGlobal();
    if ((subscriptionInfo.subscriptionType === 'plus' || subscriptionInfo.subscriptionType === 'pro') && !subscriptionInfo.isExpirated) {
      openDrawer(DrawerKey.AddTopicPanel);
    } else {
      getActions().openPayPackageModal();
    }
  };
  return (
    <div
      className="urgent-topic-item px-[20px] py-[12px] leading-[24px] bg-[var(--color-chat-hover)] rounded-[8px] flex flex-row items-center gap-[8px] text-[var(--color-chat-active)] cursor-pointer"
      onClick={handleAddTopic}
    >
      <Icon name="add" />
      <span>New Topic</span>
    </div>
  );
};

const UrgentAlertTab = () => {
  const { urgent_info, ignored_urgent_chat_ids } = telegptSettings.telegptSettings;
  const selectUrgentChatIds = getIdsFromEntityTypes(ignored_urgent_chat_ids);
  const [topics, setTopics] = useState<IUrgentTopic[]>(urgent_info);
  const [ignoredIds, setIgnoredIds] = useState<string[]>(selectUrgentChatIds);

  const handeleDeleteTopic = (id: string) => {
    telegptSettings.deleteUrgentTopic(id).then((res: any) => {
      if (res.code === 0) {
        setTopics(topics.filter((t) => t.id !== id));
      } else {
        showMessage.info('delete failed');
      }
    }).catch(() => {
      showMessage.info('delete failed');
    });
  };
  const handleIgnored = useCallback(
    (id: string) => {
      const newSelected = [...ignoredIds, id];
      setIgnoredIds(newSelected);
      const entityTypes = buildEntityTypeFromIds(newSelected);
      telegptSettings.setSettingOption({
        ignored_urgent_chat_ids: entityTypes,
      });
      urgentCheckTask.updateUrgentChats(newSelected);
    }, [ignoredIds],
  );
  const handleUnIgnored = useCallback(
    (id: string) => {
      const newSelected = ignoredIds.filter((item) => item !== id);
      setIgnoredIds(newSelected);
      const entityTypes = buildEntityTypeFromIds(newSelected);
      telegptSettings.setSettingOption({
        ignored_urgent_chat_ids: entityTypes,
      });
      urgentCheckTask.updateUrgentChats(newSelected);
    }, [ignoredIds],
  );
  return (
    <div className="h-full overflow-auto px-[18px]">
      <div>
        <h3 className="text-[18px] font-semibold mb-[24px]">What types of messages require Alert?</h3>
        <div className="flex flex-col gap-[10px]">
          {topics.map((topic) => {
            return <TopicItem topic={topic} onDelete={handeleDeleteTopic} />;
          })}
          {topics.length < 10 && <AddTopic />}
        </div>
      </div>
      <RoomsTab ignoredIds={ignoredIds} onIgnored={handleIgnored} onUnIgnored={handleUnIgnored} title="Chats for Urgent" />
    </div>
  );
};

export default UrgentAlertTab;
