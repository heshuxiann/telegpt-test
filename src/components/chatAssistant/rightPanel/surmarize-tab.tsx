import React, {
  useCallback, useMemo, useState,
} from 'react';
import { message as showMessage } from 'antd';
import cx from 'classnames';
import { isEqual } from 'lodash';
import { getGlobal } from '../../../global';

import type { ISummaryTemplate } from '../api/user-settings';

import { buildEntityTypeFromIds, getIdsFromEntityTypes, telegptSettings } from '../api/user-settings';
import { RoomsTab } from './rooms-tab';

import FloatingActionButton from '../component/FloatingActionButton';
import Icon from '../component/Icon';
import Spinner from '../component/Spinner';
import { DrawerKey, useDrawerStore } from '../global-summary/DrawerContext';

const SummaryItem = ({
  template, selectedTemp, handleSelect, onDelete,
}: {
  template: ISummaryTemplate;
  selectedTemp: string[];
  onDelete: (id: string) => void;
  handleSelect: (id: string) => void;
}) => {
  const { openDrawer } = useDrawerStore();
  const global = getGlobal();
  const { currentUserId } = global;
  const handeleDeleteTopic = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(template.id!);
  };
  const handleEditTopic = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    openDrawer(DrawerKey.CustomizationPrompt, template);
  };
  return (
    <div
      className={cx('urgent-topic-item px-[20px] py-[12px] leading-[24px] bg-[var(--color-chat-hover)] rounded-[8px] flex flex-row items-center justify-between gap-[24px]', {
        '!bg-[var(--color-chat-active)] text-white': selectedTemp.includes(template.id!),
      })}
      onClick={() => handleSelect(template.id!)}
    >
      <div>{template.topic}</div>
      {selectedTemp.includes(template.id!) && (
        <Icon className="urgent-topic-item-check" name="check" />
      )}
      {template.user_id === currentUserId && (
        <div className="urgent-topic-item-actions flex flex-row gap-[8px]">
          <Icon name="edit" className="text-[14px] cursor-pointer" onClick={handleEditTopic} />
          <Icon name="close" className="text-[14px] cursor-pointer" onClick={handeleDeleteTopic} />
        </div>
      )}
    </div>
  );
};

const AddSummaryTemplate = () => {
  const { openDrawer } = useDrawerStore();
  const handleAdd = () => {
    openDrawer(DrawerKey.CustomizationPrompt);
  };
  return (
    <div
      className="urgent-topic-item px-[20px] py-[12px] leading-[24px] bg-[var(--color-chat-hover)] rounded-[8px] flex flex-row items-center gap-[8px] text-[var(--color-chat-active)] cursor-pointer"
      onClick={handleAdd}
    >
      <Icon name="add" />
      <span>New Topic</span>
    </div>
  );
};

const SummarizeTab = () => {
  const { curious_info, ignored_summary_chat_ids, curious_id } = telegptSettings.telegptSettings;
  const ignoredChatIds = getIdsFromEntityTypes(ignored_summary_chat_ids);
  const [summaryTemplate, setSummaryTemplate] = useState<ISummaryTemplate[]>(curious_info);
  const [originSelectedTemp, setOriginSelectedTemp] = useState<string[]>(curious_id);
  const [selectedTemp, setSelectedTemp] = useState<string[]>(curious_id);
  const [ignoredIds, setIgnoredIds] = useState<string[]>(ignoredChatIds);
  const [isLoading, setIsLoading] = useState(false);

  const actionsVisable = useMemo(() => {
    return !isEqual(selectedTemp, originSelectedTemp);
  }, [originSelectedTemp, selectedTemp]);

  const handleTemplateSelect = useCallback((selectedId: string) => {
    let newSelected: string[] = [];
    if (selectedTemp.includes(selectedId)) {
      newSelected = selectedTemp.filter((id) => id !== selectedId);
    } else {
      if (selectedTemp.length >= 3) {
        showMessage.info('You can only select up to three topics.');
        return;
      }
      newSelected = [...selectedTemp, selectedId];
    }
    setSelectedTemp(newSelected);
  }, [selectedTemp]);

  const handleSave = useCallback(() => {
    setIsLoading(true);
    telegptSettings.setSettingOption({
      curious_id: selectedTemp,
    }, () => {
      setIsLoading(false);
      setOriginSelectedTemp(selectedTemp);
    });
  }, [selectedTemp]);

  const handleDelete = useCallback((id: string) => {
    if (selectedTemp.includes(id)) {
      const newSelectedTemp = selectedTemp.filter((item) => item !== id);
      setSelectedTemp(newSelectedTemp);
      setOriginSelectedTemp(newSelectedTemp);
      telegptSettings.setSettingOption({
        curious_id: newSelectedTemp,
      });
    }
    // TODO: delete summary template
    telegptSettings.deleteSummarizeTemplate(id).then((res: any) => {
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

  const handleIgnored = useCallback(
    (id: string) => {
      const newSelected = [...new Set([...ignoredIds, id])];
      setIgnoredIds(newSelected);
      const entityTypes = buildEntityTypeFromIds(newSelected);
      telegptSettings.setSettingOption({
        ignored_summary_chat_ids: entityTypes,
      });
    }, [ignoredIds],
  );
  const handleUnIgnored = useCallback(
    (id: string) => {
      const newSelected = ignoredIds.filter((item) => item !== id);
      setIgnoredIds(newSelected);
      const entityTypes = buildEntityTypeFromIds(newSelected);
      telegptSettings.setSettingOption({
        ignored_summary_chat_ids: entityTypes,
      });
    }, [ignoredIds],
  );

  return (
    <div className="h-full overflow-hidden relative">
      <div className="h-full flex flex-col px-[18px] overflow-auto">
        <h3 className="text-[18px] font-semibold text-[var(--color-text) mb-[24px]">Topic Preferences</h3>
        <div className="flex flex-col gap-[10px]">
          {summaryTemplate.map((item) => {
            return (
              <SummaryItem key={item.id} template={item} onDelete={handleDelete} selectedTemp={selectedTemp} handleSelect={handleTemplateSelect} />
            );
          })}
          {summaryTemplate.length < 10 && (
            <AddSummaryTemplate />
          )}
        </div>
        <RoomsTab ignoredIds={ignoredIds} onIgnored={handleIgnored} onUnIgnored={handleUnIgnored} title="Chats for Summary" />
      </div>
      <FloatingActionButton
        isShown={actionsVisable}
        onClick={handleSave}
      >
        {isLoading ? (
          <Spinner color="white" />
        ) : (
          <Icon name="check" className="text-white text-[1.5rem]" />
        )}

      </FloatingActionButton>
    </div>
  );
};
export default SummarizeTab;
