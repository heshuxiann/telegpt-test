import React, { memo, useCallback, useEffect } from '../../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../../global';

import type { ThemeKey } from '../../../../types';
import type { RoomInputTranslateOptions } from '../../utils/room-input-translate';

import { selectChat, selectLanguageCode, selectTheme } from '../../../../global/selectors';
import buildStyle from '../../../../util/buildStyle';
import { updateRoomInputTranslateOptions } from '../../utils/room-input-translate';
import InputLanguageModal from './input-language-modal';
import InputTranslateTip from './input-translate-tip';

import useFlag from '../../../../hooks/useFlag';

import Icon from '../../../common/icons/Icon';
import Button from '../../../ui/Button';
import Menu from '../../../ui/Menu';

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

  const inputTranslateTip = localStorage.getItem('input-translate-tip');

  const updateRoomInputTranslateConfig = useCallback((options: RoomInputTranslateOptions) => {
    updateRoomInputTranslateOptions(chatId, options);
  }, [chatId]);

  const handleConfirm = useCallback(() => {
    updateRoomInputTranslateConfig({ ...inputTranslateOptions, autoTranslate: true });
    closeLanguageMenu();
  }, [inputTranslateOptions, updateRoomInputTranslateConfig]);

  const closeAutoTranslate = () => {
    updateRoomInputTranslateConfig({ ...inputTranslateOptions, autoTranslate: false });
    getActions().showNotification({ message: 'Input translation is turned off' });
  };
  const handleCloseTooltip = () => {
    closeTooltip();
    localStorage.setItem('input-translate-tip', 'true');
  };
  useEffect(() => {
    if (inputTranslateTip) return;
    openTooltip();
    const timer = setTimeout(() => {
      handleCloseTooltip();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [closeTooltip, openTooltip, chatId, inputTranslateTip]);
  return (
    <div className="input-ai-actions">
      {
        inputTranslateOptions?.autoTranslate
          ? (
            <button className="Button input-ai-actions-button" onClick={closeAutoTranslate}>
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
                handleCloseTooltip();
              }}
            >
              <img src={aiTranslatePath} alt="Chat AI Logo" />
            </button>
          )
      }

      {tooltipOpen && (
        <InputTranslateTip />
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
          <div className="py-[20px] px-[24px] border-[var(--color-background-secondary)] border-t-[1px] border-b-[1px]">
            <div className="w-full bg-[#EFF6FF] border-[1px] border-[#BEDBFF] rounded-[12px] py-[12px] px-[16px] flex gap-[12px] dark:bg-[#766AC830] dark:border-none">
              <Icon name="clock" style={buildStyle(`margin-top:4px;color:${theme === 'dark' ? '#fff' : '#007AFF'};`)} />
              <div>
                <div className="text-[var(--color-text)]">AI Detected Language</div>
                {detectedLanguageName ? (
                  <div className="text-[14px]">
                    <span className="text-[#4A5565] dark:text-white">This conversation is in </span>
                    <span className="text-[#007AFF] font-bold dark:text-white">{detectedLanguageName}</span>
                  </div>
                ) : (
                  <div className="text-[14px]">
                    <span className="text-[#4A5565] dark:text-white">No language detected in this chat.</span>
                  </div>
                )}

              </div>
            </div>
            <div className="text-[14px] text-[#6A7282] font-semibold mt-[20px] mb-[12px] uppercase">Current Setting</div>
            <div className="w-full bg-[#F9FAFB] rounded-[12px] py-[12px] px-[16px] flex gap-[12px] items-center  dark:bg-[var(--color-chat-hover)]">
              <div className="w-[40px] h-[40px] rounded-full bg-[#DBEAFE] flex items-center justify-center ">
                <Icon name="language" style={buildStyle('color:#007AFF;font-size:20px')} />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] text-[#4A5565] dark:text-white">Outgoing messages in</span>
                <span className="text-[16px] font-semibold text-[var(--color-text)]">
                  {detectedLanguageName ? detectedLanguageName : inputTranslateOptions?.translateLanguageName ?? 'English'}
                </span>
              </div>
              <div className="flex items-center justify-center ml-auto" onClick={openInputLanguageModal}>
                <Icon name="arrow-right" style={buildStyle(`font-size:20px;color:${theme === 'dark' ? '#fff' : '#007AFF'};`)} />
              </div>
            </div>
          </div>
          <div className="py-[16px] px-[24px]">
            <Button size="tiny" className="!h-[48px] w-full normal-case" onClick={handleConfirm}>
              Confirm Settings
            </Button>
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
    translateLanguage: 'en',
    translateLanguageName: 'English',
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
