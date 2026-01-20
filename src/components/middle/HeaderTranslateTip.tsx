import React, { memo } from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';

import type { GlobalState } from '../../global/types';

import { selectChat, selectLanguageCode, selectRequestedChatTranslationLanguage } from '../../global/selectors';
import { toggleAutoTranslation } from '../chatAssistant/utils/room-input-translate';

import useLastCallback from '../../hooks/useLastCallback';
import { useTranslateTip } from '../left/main/hooks/useTranslateTip';

import Button from '../ui/Button';

import './HeaderTranslateTip.scss';

interface OwnProps {
  chatId: string;
  onClose: () => void;
}

interface StateProps {
  global: GlobalState;
  isTranslating?: boolean;
  detectedLanguage: string | undefined;
}
const HeaderTranslateTip = ({ global, chatId, isTranslating, detectedLanguage, onClose }: StateProps & OwnProps) => {
  const { requestChatTranslation, setSettingOption } = getActions();
  const { systemLanguage } = useTranslateTip({ chatId });
  const language = selectLanguageCode(global);
  const translatedNames = new Intl.DisplayNames([language], { type: 'language' });
  const detectedLanguageName = detectedLanguage ? translatedNames.of(detectedLanguage) : undefined;
  const translatedName = systemLanguage ? translatedNames.of(systemLanguage) : undefined;
  const handleTranslateClick = useLastCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTranslating) {
      requestChatTranslation({ chatId, toLanguageCode: undefined });
      return;
    }
    if (systemLanguage) {
      setSettingOption({ translationLanguage: systemLanguage });
      requestChatTranslation({ chatId, toLanguageCode: systemLanguage });
      toggleAutoTranslation(true);
    }
    onClose();
  });
  const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };
  const handleStopPropagation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    <div className="header-translate-tip" onClick={handleStopPropagation}>
      <span className="text-transform-none">
        {`I noticed this chat is in ${detectedLanguageName}. Want me to translate it into ${translatedName}?`}
      </span>
      <div className="flex items-center gap-[8px] justify-end mt-[12px]">
        <Button size="tiny" className="!h-[32px] w-[88px] normal-case !bg-white/50 !text-black !m-0" onClick={handleClose}>
          No need
        </Button>
        <Button size="tiny" className="!h-[32px] w-[88px] normal-case !bg-white !text-black !m-0" onClick={handleTranslateClick}>
          Translate
        </Button>
      </div>
      <div className="header-translate-tip-arrow" />
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global, {
    chatId,
  }): StateProps => {
    const isTranslating = Boolean(selectRequestedChatTranslationLanguage(global, chatId));
    const chat = selectChat(global, chatId);
    const detectedLanguage = chat?.detectedLanguage;
    return {
      global,
      isTranslating,
      detectedLanguage,
    };
  },
)(HeaderTranslateTip));
