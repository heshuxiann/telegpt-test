import React, { memo } from '../../../../lib/teact/teact';
import { withGlobal } from '../../../../global';

import { selectChat, selectLanguageCode } from '../../../../global/selectors';
import { type RoomInputTranslateOptions, updateRoomInputTranslateOptions } from '../../utils/room-input-translate';

import useLastCallback from '../../../../hooks/useLastCallback';

import Button from '../../../ui/Button';

import './input-translate-tip.scss';

interface OwnProps {
  chatId: string;
  onCLose: (showTurnoffTip: boolean) => void;
}

interface StateProps {
  translatedName: string | undefined;
  detectedLanguage: string | undefined;
  inputTranslateOptions: RoomInputTranslateOptions;
}
const InputTranslateTip = ({ chatId, inputTranslateOptions, translatedName, detectedLanguage, onCLose }: StateProps & OwnProps) => {
  const handleOpenInputTranslation = useLastCallback(() => {
    updateRoomInputTranslateOptions(chatId, { ...inputTranslateOptions, autoTranslate: true, translateLanguage: detectedLanguage!, translateLanguageName: translatedName! });
    onCLose(true);
  });
  const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onCLose(false);
  };
  const handleStopPropagation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    <div className="input-translate-tip" onClick={handleStopPropagation}>
      <span className="text-transform-none">
        {`This chat is in ${translatedName}. Turn on real-time input translation?`}
      </span>
      <div className="flex items-center gap-[8px] justify-end mt-[12px]">
        <Button size="tiny" className="!h-[32px] w-[88px] normal-case !bg-white/50 !text-black !m-0" onClick={handleClose}>
          No need
        </Button>
        <Button size="tiny" className="!h-[32px] w-[88px] normal-case !bg-white !text-black !m-0" onClick={handleOpenInputTranslation}>
          Turn on
        </Button>
      </div>
      <div className="input-translate-tip-arrow" />
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global, {
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
    return {
      translatedName,
      detectedLanguage,
      inputTranslateOptions,
    };
  },
)(InputTranslateTip));
