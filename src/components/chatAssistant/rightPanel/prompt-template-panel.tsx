/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import cx from 'classnames';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { CustomizationTemplates } from '../globalSummary/summary-prompt';
import { ChataiGeneralStore } from '../store';
import { RightPanelKey } from './right-header';

const PromptTemplatePanel = () => {
  const [userDefinedTemplate, setUserDefinedTemplate] = useState<{ title: string;prompt: string }[]>([]);
  const [lastTemplate, setLastTemplate] = useState<{ title: string;prompt: string } | undefined>(undefined);
  const [currentTemplate, setCurrentTemplate] = useState<{ title: string;prompt: string } | undefined>(undefined);
  useEffect(() => {
    ChataiGeneralStore.get('customizationPrompt').then((res) => {
      setUserDefinedTemplate(res || []);
    });
    ChataiGeneralStore.get('lastDefinedPrompt').then((res) => {
      if (res) {
        setLastTemplate(res);
        setCurrentTemplate(res);
      }
    });
  }, []);
  const actionsVisable = useMemo(() => currentTemplate?.title !== lastTemplate?.title, [currentTemplate, lastTemplate]);
  const handleCustomization = useCallback(() => {
    eventEmitter.emit(Actions.ShowGlobalSummaryPanel, {
      rightPanelKey: RightPanelKey.CustomizationPrompt,
    });
  }, []);
  const handleTemplateSelect = useCallback((item: { title: string;prompt: string }) => {
    setCurrentTemplate(item);
  }, []);
  const handleCancel = useCallback(() => {
    setCurrentTemplate(lastTemplate);
  }, [lastTemplate]);
  const handleSave = useCallback(() => {
    ChataiGeneralStore.set('lastDefinedPrompt', currentTemplate);
    setLastTemplate(currentTemplate);
  }, [currentTemplate]);
  return (
    <div className="h-full flex flex-col">
      <h3 className="text-[18px] font-semibold">What are you curious about?</h3>
      <div className="flex flex-col gap-[10px]">
        {CustomizationTemplates.map((item) => {
          return (
            <div
              key={item.title}
              onClick={() => handleTemplateSelect(item)}
              className={cx('w-fit px-[20px] leading-[40px] border-[1px] border-[#B297FF] rounded-[20px] text-[15px] cursor-pointer', {
                'bg-[#B297FF] text-white': currentTemplate?.title === item.title,
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
                className={cx('w-fit px-[20px] leading-[40px] border-[1px] border-[#B297FF] rounded-[20px] text-[15px] cursor-pointer', {
                  'bg-[#B297FF]': currentTemplate?.title === item.title,
                })}
              >
                {item.title}
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
      {actionsVisable ? (
        <div className="flex flex-row justify-center gap-[14px] mt-auto mb-[24px]">
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
export default PromptTemplatePanel;
