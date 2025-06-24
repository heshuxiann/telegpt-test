import React, { useCallback, useEffect, useState } from '../../../../lib/teact/teact';

import RoomStorage from '../../room-storage';
import InputLanguageModal from './input-language-modal';
import InputTranslateTip from './input-translate-tip';

import useFlag from '../../../../hooks/useFlag';

import './input-translate.scss';

import aiTranslatePath from '../../assets/ai-translate.png';

const InputTranslate = (props:{ chatId:string }) => {
  const { chatId } = props;
  const [inputLanguageModalOpen, openInputLanguageModal, closeInputLanguageModal] = useFlag();
  const [translateLanguage, setTranslateLanguage] = useState<string | undefined>(undefined);
  const [tooltipOpen, openTooltip, closeTooltip] = useFlag();
  useEffect(() => {
    setTranslateLanguage(RoomStorage.getRoomTranslateLanguage(chatId));
  }, [chatId]);
  const updateTranslateLanguage = useCallback((langCode: string | undefined) => {
    RoomStorage.updateRoomTranslateLanguage(chatId, langCode);
    setTranslateLanguage(langCode);
    if (!translateLanguage && langCode) {
      openTooltip();
      setTimeout(() => {
        closeTooltip();
      }, 5000);
    }
  }, [chatId, translateLanguage]);
  return (
    <div className="input-ai-actions">
      <button className="Button input-ai-actions-button" onClick={openInputLanguageModal}>
        {
          translateLanguage
            ? (
              <span className="text-[var(--color-text-secondary)] text-[14px] font-bold">
                {translateLanguage.toUpperCase()}
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
        translateLanguage={translateLanguage}
        isOpen={inputLanguageModalOpen}
        closeInputLanguageModal={closeInputLanguageModal}
        updateTranslateLanguage={updateTranslateLanguage}
      />
    </div>
  );
};

export default InputTranslate;
