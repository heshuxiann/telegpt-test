import type { ChangeEvent } from 'react';
import React, { memo, useCallback } from '../../../../lib/teact/teact';
import { withGlobal } from '../../../../global';

import type { ThemeKey } from '../../../../types';
import type { RoomInputTranslateOptions } from '../../utils/room-input-translate';

import { selectChat, selectLanguageCode, selectTheme } from '../../../../global/selectors';
import buildStyle from '../../../../util/buildStyle';
import { updateRoomInputTranslateOptions } from '../../utils/room-input-translate';
import InputLanguageModal from './input-language-modal';
import InputTranslateOpenTip from './input-translate-open-tip';
import InputTranslateTip from './input-translate-tip';

import useFlag from '../../../../hooks/useFlag';
import { useTranslateTip } from '../../../left/main/hooks/useTranslateTip';

import Icon from '../../../common/icons/Icon';
import Menu from '../../../ui/Menu';
import Switcher from '../../../ui/Switcher';

import './input-translate.scss';

import aiTranslatePath from '../../assets/input/translate-input.png';

interface OwnProps {
  chatId: string;
}
interface StateProps {
  detectedLanguage: string | undefined;
  detectedLanguageName: string | undefined;
  inputTranslateOptions: RoomInputTranslateOptions;
  theme: ThemeKey;
}
const InputTranslate = ({ chatId, detectedLanguageName, inputTranslateOptions, theme }: OwnProps & StateProps) => {
  const [inputLanguageModalOpen, openInputLanguageModal, closeInputLanguageModal] = useFlag();

  const [languageMenuOpen, openLanguageMenu, closeLanguageMenu] = useFlag();
  const [tooltipOpen, openTooltip, closeTooltip] = useFlag();
  const { inputTranslateTipOpen, closeInputTranslateTip } = useTranslateTip({ chatId });

  const updateRoomInputTranslateConfig = useCallback((options: RoomInputTranslateOptions) => {
    updateRoomInputTranslateOptions(chatId, options);
  }, [chatId]);

  const handleAutoTranslateChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateRoomInputTranslateConfig({ ...inputTranslateOptions, autoTranslate: e.currentTarget.checked });
  };
  const handleCloseTooltip = (showTurnoffTip: boolean) => {
    closeInputTranslateTip();
    if (showTurnoffTip) {
      openTooltip();
      setTimeout(() => {
        closeTooltip();
      }, 5000);
    }
  };
  return (
    <div className="input-ai-actions relative">
      {
        inputTranslateOptions?.autoTranslate
          ? (
            <button className="Button input-ai-actions-button" onClick={openLanguageMenu}>
              <span className="text-[var(--color-text-secondary)] text-[14px] font-bold">
                {inputTranslateOptions.translateLanguage.toUpperCase()}
              </span>
            </button>
          )
          : (
            <button
              className="Button input-ai-actions-button"
              onClick={() => {
                openLanguageMenu();
              }}
            >
              <img src={aiTranslatePath} alt="Chat AI Logo" />
            </button>
          )
      }

      {tooltipOpen && (
        <InputTranslateOpenTip />
      )}

      {inputTranslateTipOpen && (
        <InputTranslateTip chatId={chatId} onCLose={handleCloseTooltip} />
      )}

      <Menu
        noCloseOnBackdrop
        isOpen={languageMenuOpen}
        onClose={closeLanguageMenu}
        className="input-language-menu"
        {...{
          positionX: 'right',
          positionY: 'bottom',
        }}
      >
        <div className="bg-[var(--color-background)] w-[375px]">
          <div className="text-[18px] font-semibold text-[var(--color-text)] py-[16px] px-[24px] flex justify-between items-center">
            <span>Translation Settings</span>
            <Icon name="close" style={buildStyle('color:#6A7282;font-size:20px;cursor:pointer;')} onClick={closeLanguageMenu} />
          </div>
          <div className="py-[20px] px-[24px] border-[var(--color-background-secondary)] border-t-[1px] border-b-[1px] flex flex-col gap-[12px]">
            {detectedLanguageName ? (
              <div className="text-[14px]">
                <span className="text-[#4A5565] dark:text-white">TelyAI Detected Language in this chat is in </span>
                <span className="text-[#007AFF] font-bold dark:text-white">{detectedLanguageName}</span>
              </div>
            ) : (
              <div className="text-[14px]">
                <span className="text-[#4A5565] dark:text-white">No language detected in this chat.</span>
              </div>
            )}
            <div className="w-full flex items-center justify-between px-[16px] py-[18px] rounded-[12px] bg-[#F7F7F7] dark:bg-[var(--color-chat-hover)]">
              <div className="text-[16px] text-[var(--color-text)]">Auto Translation</div>
              <Switcher
                label=""
                checked={inputTranslateOptions?.autoTranslate}
                noAnimation
                onChange={handleAutoTranslateChange}
              />
            </div>
            <div className="w-full flex items-center justify-between px-[16px] py-[18px] rounded-[12px] bg-[#F7F7F7] dark:bg-[var(--color-chat-hover)]">
              <div className="text-[16px] text-[var(--color-text)]">Language Setting</div>
              <div className="flex items-center gap-[8px]">
                <span className="text-[16px] font-semibold text-[var(--color-text)]">
                  {inputTranslateOptions.translateLanguageName}
                </span>
                <div className="flex items-center justify-center ml-auto" onClick={openInputLanguageModal}>
                  <Icon name="arrow-right" style={buildStyle(`font-size:20px;color:${theme === 'dark' ? '#fff' : '#007AFF'};`)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Menu>
      <InputLanguageModal
        inputTranslateOptions={inputTranslateOptions}
        isOpen={inputLanguageModalOpen}
        closeInputLanguageModal={closeInputLanguageModal}
        updateRoomInputTranslateOptions={updateRoomInputTranslateConfig}
      />
    </div>
  );
};
export default memo(withGlobal<OwnProps>((global, {
  chatId,
}): StateProps => {
  const chat = selectChat(global, chatId);
  const detectedLanguage = chat?.detectedLanguage;
  const language = selectLanguageCode(global);
  const translatedNames = new Intl.DisplayNames([language], { type: 'language' });
  const translatedName = detectedLanguage ? translatedNames.of(detectedLanguage) : undefined;
  const inputTranslateOptions = global.roomInputTranslateOptions[chatId] || {
    translateLanguage: chat?.detectedLanguage || 'en',
    translateLanguageName: translatedName || 'English',
    autoTranslate: false,
  };
  const theme = selectTheme(global);
  return {
    detectedLanguage: chat?.detectedLanguage,
    detectedLanguageName: translatedName,
    inputTranslateOptions,
    theme,
  };
})(InputTranslate));
