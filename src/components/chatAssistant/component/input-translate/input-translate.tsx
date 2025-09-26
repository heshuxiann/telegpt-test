import React, { useCallback, useEffect, useState } from '../../../../lib/teact/teact';

import RoomStorage from '../../room-storage';
import InputLanguageModal from './input-language-modal';
import InputTranslateTip from './input-translate-tip';

import useFlag from '../../../../hooks/useFlag';

import './input-translate.scss';

import aiTranslatePath from '../../assets/input/translate-input.png';

const InputTranslate = (props: { chatId: string }) => {
  const { chatId } = props;
  const [inputLanguageModalOpen, openInputLanguageModal, closeInputLanguageModal] = useFlag();
  const [inputTranslateOptions, setInputTranslateOptions] = useState({
    translateLanguage: 'en',
    autoTranslate: false,
    firstTime: true,
  });
  const [tooltipOpen, openTooltip, closeTooltip] = useFlag();
  useEffect(() => {
    setInputTranslateOptions(RoomStorage.getRoomInputTranslateOptions(chatId));
  }, [chatId]);
  const updateRoomInputTranslateOptions = useCallback((options: {
    translateLanguage: string;
    autoTranslate: boolean;
    firstTime: boolean;
  }) => {
    RoomStorage.updateRoomInputTranslateOptions(chatId, options);
    if (inputTranslateOptions.firstTime) {
      openTooltip();
      setTimeout(() => {
        closeTooltip();
      }, 5000);
    }
  }, [chatId, inputTranslateOptions]);
  return (
    <div className="input-ai-actions">
      <button className="Button input-ai-actions-button" onClick={openInputLanguageModal}>
        {
          inputTranslateOptions.autoTranslate
            ? (
              <span className="text-[var(--color-text-secondary)] text-[14px] font-bold">
                {inputTranslateOptions.translateLanguage.toUpperCase()}
              </span>
            )
            : (
              <img src={aiTranslatePath} alt="Chat AI Logo" />
            )
        }
      </button>
      {tooltipOpen && (
        <InputTranslateTip />
      )}
      <InputLanguageModal
        inputTranslateOptions={inputTranslateOptions}
        isOpen={inputLanguageModalOpen}
        closeInputLanguageModal={closeInputLanguageModal}
        updateRoomInputTranslateOptions={updateRoomInputTranslateOptions}
      />
    </div>
  );
};

export default InputTranslate;
