/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
import React, { useCallback, useState } from 'react';
import { message as showMessage } from 'antd';

import type { IUrgentTopic } from '../api/user-settings';

import { urgentCheckTask } from '../ai-task/urgent-check-task';
import telegptSettings from '../api/user-settings';
import { SelectedChats } from './selected-chats';

import Icon from '../component/Icon';
import { DrawerKey, useDrawerStore } from '../global-summary/DrawerContext';

import './urgent-alert-tab.scss';

const TopicItem = ({ topic, onDelete }: { topic: IUrgentTopic;onDelete: (id: string) => void }) => {
  const { openDrawer } = useDrawerStore();
  const handeleDeleteTopic = () => {
    onDelete(topic.id!);
  };
  const handleEditTopic = () => {
    openDrawer(DrawerKey.AddTopicPanel, topic);
  };
  return (
    <div className="urgent-topic-item p-[20px] bg-[var(--color-chat-hover)] rounded-[8px] flex flex-row items-center justify-between gap-[24px]">
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
    console.log('add topic');
    openDrawer(DrawerKey.AddTopicPanel);
  };
  return (
    <div
      className="urgent-topic-item p-[20px] bg-[var(--color-chat-hover)] rounded-[8px] flex flex-row items-center gap-[8px] text-[#8C42F0] cursor-pointer"
      onClick={handleAddTopic}
    >
      <Icon name="add" />
      <span>Add Topic</span>
    </div>
  );
};

const UrgentAlertTab = () => {
  const { urgent_info } = telegptSettings.telegptSettings;
  const [topics, setTopics] = useState<IUrgentTopic[]>(urgent_info);
  const [selectedChats, setSelectedChats] = useState<string[]>(telegptSettings.telegptSettings.urgent_chat_ids);
  const { openDrawer } = useDrawerStore();
  const handleDelete = useCallback((id: string) => {
    const newSelected = selectedChats.filter((item) => item !== id);
    telegptSettings.setSettingOption({
      urgent_chat_ids: newSelected,
    });
    setSelectedChats(newSelected);
    urgentCheckTask.updateUrgentChats(newSelected);
  }, [selectedChats]);

  const handleOpenChatSelect = useCallback(() => {
    openDrawer(DrawerKey.ChatPicker, {
      selectedChats,
      onSave: (chats: string[]) => {
        telegptSettings.setSettingOption({
          urgent_chat_ids: chats,
        });
        openDrawer(DrawerKey.PersonalizeSettings, {
          activeKey: 1,
        });
        urgentCheckTask.updateUrgentChats(chats);
      },
      onCancel: () => {
        openDrawer(DrawerKey.PersonalizeSettings, {
          activeKey: 1,
        });
      },
      onBack: () => {
        openDrawer(DrawerKey.PersonalizeSettings, {
          activeKey: 1,
        });
      },
    });
  }, [openDrawer, selectedChats]);

  const handeleDeleteTopic = (id:string) => {
    telegptSettings.deleteUrgentTopic(id).then((res:any) => {
      if (res.code === 0) {
        setTopics(topics.filter((t) => t.id !== id));
      } else {
        showMessage.info('delete failed');
      }
    }).catch(() => {
      showMessage.info('delete failed');
    });
  };
  return (
    <div className="h-full overflow-auto px-[18px]">
      <div>
        <h3 className="text-[18px] font-semibold">What types of messages require Alert?</h3>
        <div className="flex flex-col gap-[10px]">
          {topics.map((topic) => {
            return <TopicItem topic={topic} onDelete={handeleDeleteTopic} />;
          })}
          <AddTopic />
        </div>
      </div>
      <SelectedChats
        onOpenChatSelect={handleOpenChatSelect}
        selected={selectedChats}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default UrgentAlertTab;
