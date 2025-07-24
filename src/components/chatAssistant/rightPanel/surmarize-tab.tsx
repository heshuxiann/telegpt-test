/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, {
  useCallback, useMemo, useState,
} from 'react';
import { message as showMessage } from 'antd';
import cx from 'classnames';
import { getGlobal } from '../../../global';

import type { ISummaryTemplate } from '../api/user-settings';

import telegptSettings from '../api/user-settings';
import { CloseIcon } from '../icons';
import { SelectedChats } from './selected-chats';

import { DrawerKey, useDrawerStore } from '../global-summary/DrawerContext';

import './surmarize-tab.scss';

const SummarizeTab = () => {
  const global = getGlobal();
  const { currentUserId } = global;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { curious_info, summary_chat_ids, curious_id } = telegptSettings.telegptSettings;
  const [summaryTemplate, setSummaryTemplate] = useState<ISummaryTemplate[]>(curious_info);
  const [originSelectedTemp, setOriginSelectedTemp] = useState<string[]>(curious_id);
  const [selectedTemp, setSelectedTemp] = useState<string[]>(curious_id);
  const [selectedChats, setSelectedChats] = useState<string[]>(summary_chat_ids);
  const { openDrawer } = useDrawerStore();

  const actionsVisable = useMemo(() => {
    return selectedTemp !== originSelectedTemp;
  }, [originSelectedTemp, selectedTemp]);

  const handleCustomization = useCallback(() => {
    openDrawer(DrawerKey.CustomizationPrompt);
  }, [openDrawer]);

  const handleTemplateSelect = useCallback((item: ISummaryTemplate) => {
    let newSelected: string[] = [];
    if (selectedTemp.includes(item.id)) {
      newSelected = selectedTemp.filter((id) => id !== item.id);
    } else {
      newSelected = [...selectedTemp, item.id];
    }
    setSelectedTemp(newSelected);
  }, [selectedTemp]);

  const handleCancel = useCallback(() => {
    setSelectedTemp(curious_id);
  }, [curious_id]);

  const handleSave = useCallback(() => {
    telegptSettings.setSettingOption({
      curious_id: selectedTemp,
    });
    setOriginSelectedTemp(selectedTemp);
  }, [selectedTemp]);

  const handleDelete = useCallback((e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedTemp.includes(id)) {
      setSelectedTemp(selectedTemp.filter((item) => item !== id));
      setOriginSelectedTemp(selectedTemp.filter((item) => item !== id));
    }
    // TODO: delete summary template
    telegptSettings.deleteSummarizeTemplate(id).then((res:any) => {
      if (res.code === 0) {
        const newSummaryTemplate = summaryTemplate.filter((item) => item.id !== id);
        setSummaryTemplate(newSummaryTemplate);
      } else {
        showMessage.info('delete failed');
      }
    }).catch(() => {
      showMessage.info('delete failed');
    });
  }, [selectedTemp, summaryTemplate]);

  const handleOpenChatSelect = useCallback(() => {
    openDrawer(DrawerKey.ChatPicker, {
      selectedChats: summary_chat_ids,
      onSave: (chats: string[]) => {
        telegptSettings.setSettingOption({
          summary_chat_ids: chats,
        });
        openDrawer(DrawerKey.PersonalizeSettings, {
          activeKey: 0,
        });
      },
      onCancel: () => {
        openDrawer(DrawerKey.PersonalizeSettings, {
          activeKey: 0,
        });
      },
      onBack: () => {
        openDrawer(DrawerKey.PersonalizeSettings, {
          activeKey: 0,
        });
      },
    });
  }, [openDrawer, summary_chat_ids]);

  const handleDeleteSummaryChat = useCallback((id: string) => {
    const newSelected = selectedChats.filter((item) => item !== id);
    telegptSettings.setSettingOption({
      summary_chat_ids: newSelected,
    });
    setSelectedChats(newSelected);
  }, [selectedChats]);
  return (
    <div className="h-full overflow-hidden relative">
      <div className="h-full flex flex-col px-[18px] overflow-auto">
        <h3 className="text-[18px] font-semibold text-[var(--color-text)">What are you curious about?</h3>
        <div className="flex flex-col gap-[10px]">
          {summaryTemplate.map((item) => {
            return (
              <div
                key={item.topic}
                onClick={() => handleTemplateSelect(item)}
                className={cx('prompt-template-item flex flex-row gap-[8px] items-center w-fit flex-grow-0 px-[20px] h-[42px] leading-[40px] border-[1px] border-[#B297FF] rounded-[20px] text-[15px] cursor-pointer text-[var(--color-text)]', {
                  'bg-[#B297FF] text-white': selectedTemp.includes(item.id),
                })}
              >
                <span>{item.topic}</span>
                {item.user_id === currentUserId && (
                  <div
                    className="delete-icon w-[20px] h-[20px] cursor-pointer flex items-center justify-center"
                    onClick={(e) => handleDelete(e, item.id)}
                  >
                    <CloseIcon />
                  </div>
                )}
              </div>
            );
          })}
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
        <div className="flex flex-row justify-center gap-[14px] py-[24px] px-[18px] w-full z-10  absolute bottom-0 left-0">
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
