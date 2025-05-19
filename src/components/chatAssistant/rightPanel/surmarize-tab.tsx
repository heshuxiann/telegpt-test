/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import cx from 'classnames';

import type { CustomSummaryTemplate } from '../store/chatai-summary-template-store';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { CustomizationTemplates } from '../globalSummary/summary-prompt';
import { CloseIcon } from '../icons';
import { ChataiGeneralStore, ChataiSummaryTemplateStore } from '../store';
import { SUMMARY_CHATS } from '../store/general-store';
import { SelectedChats } from './selected-chats';

import { DrawerKey, useDrawer } from '../globalSummary/DrawerContext';

import './surmarize-tab.scss';

const SummarizeTab = () => {
  const [userDefinedTemplate, setUserDefinedTemplate] = useState<CustomSummaryTemplate[]>([]);
  const [lastTemplate, setLastTemplate] = useState<CustomSummaryTemplate | undefined>(undefined);
  const [currentTemplate, setCurrentTemplate] = useState<CustomSummaryTemplate | undefined>(undefined);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const { openDrawer } = useDrawer();
  useEffect(() => {
    ChataiSummaryTemplateStore.getAllSummaryTemplate().then((res) => {
      setUserDefinedTemplate(res || []);
    });
    ChataiGeneralStore.get('lastDefinedPrompt').then((res) => {
      if (res) {
        setLastTemplate(res);
        setCurrentTemplate(res);
      }
    });
    ChataiGeneralStore.get(SUMMARY_CHATS).then((res) => {
      setSelectedChats(res || []);
    });
  }, []);
  const actionsVisable = useMemo(() => {
    // eslint-disable-next-line no-console
    console.log('currentTemplate', currentTemplate);
    // eslint-disable-next-line no-console
    console.log('lastTemplate', lastTemplate);
    return currentTemplate && currentTemplate?.id !== lastTemplate?.id;
  }, [currentTemplate, lastTemplate]);
  const handleCustomization = useCallback(() => {
    openDrawer(DrawerKey.CustomizationPrompt);
  }, [openDrawer]);
  const handleTemplateSelect = useCallback((item: CustomSummaryTemplate) => {
    setCurrentTemplate(item);
  }, []);
  const handleCancel = useCallback(() => {
    setCurrentTemplate(lastTemplate);
  }, [lastTemplate]);
  const handleSave = useCallback(() => {
    ChataiGeneralStore.set('lastDefinedPrompt', currentTemplate);
    setLastTemplate(currentTemplate);
    eventEmitter.emit(Actions.GlobalSummaryTemplateUpdate);
  }, [currentTemplate]);
  const handleDelete = useCallback((e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    ChataiSummaryTemplateStore.deleteSummaryTemplate(id).then(() => {
      setUserDefinedTemplate((prev) => {
        return prev.filter((item) => item.id !== id);
      });
    });
    if (id === lastTemplate?.id) {
      ChataiGeneralStore.delete('lastDefinedPrompt').then(() => {
        setLastTemplate(undefined);
      });
    }
    if (id === currentTemplate?.id) {
      setCurrentTemplate(undefined);
    }
  }, [lastTemplate?.id, currentTemplate?.id]);
  const handleOpenChatSelect = useCallback(async () => {
    const selected = await ChataiGeneralStore.get(SUMMARY_CHATS);
    openDrawer(DrawerKey.ChatPicker, {
      selectedChats: selected,
      onSave: (chats:string[]) => {
        ChataiGeneralStore.set(SUMMARY_CHATS, chats);
        openDrawer(DrawerKey.PersonalizeSettings);
        eventEmitter.emit(Actions.UpdateSummaryChats, { chats });
      },
    });
  }, [openDrawer]);

  const handleDeleteSummaryChat = useCallback((id: string) => {
    const newSelected = selectedChats.filter((item) => item !== id);
    ChataiGeneralStore.set(SUMMARY_CHATS, newSelected);
    eventEmitter.emit(Actions.UpdateSummaryChats, { chats: newSelected });
  }, [selectedChats]);
  return (
    <div className="h-full overflow-hidden relative">
      <div className="h-full flex flex-col px-[18px] overflow-auto">
        <h3 className="text-[18px] font-semibold">What are you curious about?</h3>
        <div className="flex flex-col gap-[10px]">
          {CustomizationTemplates.map((item) => {
            return (
              <div
                key={item.title}
                onClick={() => handleTemplateSelect(item)}
                className={cx('w-fit px-[20px] leading-[40px] border-[1px] border-[#B297FF] rounded-[20px] text-[15px] cursor-pointer', {
                  'bg-[#B297FF] text-white': currentTemplate?.id === item.id,
                })}
              >
                {item.title}
              </div>
            );
          })}
          {userDefinedTemplate.length > 0 && (
            userDefinedTemplate.map((item) => {
              return (
                <div
                  key={item.title}
                  onClick={() => handleTemplateSelect(item)}
                  className={cx('prompt-template-item w-fit px-[20px] leading-[40px] border-[1px] border-[#B297FF] rounded-[20px] text-[15px] cursor-pointer flex items-center gap-[8px]', {
                    'bg-[#B297FF]': currentTemplate?.title === item.title,
                  })}
                >
                  <span>{item.title}</span>
                  <div
                    className="delete-icon w-[20px] h-[20px] cursor-pointer flex items-center justify-center"
                    onClick={(e) => handleDelete(e, item.id)}
                  >
                    <CloseIcon />
                  </div>
                </div>
              );
            })
          )}
          <div
            className="w-[144px] whitespace-nowrap px-[20px] leading-[40px] border-[1px] border-[#B297FF] rounded-[20px] text-[15px] cursor-pointer text-[#8C42F0] font-medium"
            onClick={handleCustomization}
          >
            + Customization
          </div>
        </div>
        <SelectedChats
          onOpenChatSelect={handleOpenChatSelect}
          selected={selectedChats}
          onDelete={handleDeleteSummaryChat}
        />
      </div>
      {actionsVisable ? (
        <div className="flex flex-row justify-center gap-[14px] py-[24px] w-full z-10 bg-white absolute bottom-0 left-0">
          <button
            className="w-[158px] h-[40px] border-[1px] border-[#8C42F0] rounded-[20px]"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="w-[158px] h-[40px] border-[1px] border-[#8C42F0] bg-[#8C42F0] rounded-[20px] text-white"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      ) : null}
    </div>
  );
};
export default SummarizeTab;
