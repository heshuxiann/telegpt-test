import React, { memo } from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';

import { selectRequestedChatTranslationLanguage, selectTranslationLanguage } from '../../global/selectors';

import useLastCallback from '../../hooks/useLastCallback';
import { useTranslateTip } from '../left/main/hooks/useTranslateTip';

import Button from '../ui/Button';

import './HeaderTranslateTip.scss';

interface OwnProps {
  chatId: string;
  onClose: () => void;
}

interface StateProps {
  isTranslating?: boolean;
  translationLanguage: string;
}
const HeaderTranslateTip = ({ chatId, isTranslating, onClose }: StateProps & OwnProps) => {
  const { requestChatTranslation, setSettingOption } = getActions();
  const { systemLanguage } = useTranslateTip({ chatId });
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
        I noticed this chat is in English. Want me to translate it into Chinese?
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
    const translationLanguage = selectTranslationLanguage(global);
    return {
      isTranslating,
      translationLanguage,
    };
  },
)(HeaderTranslateTip));
