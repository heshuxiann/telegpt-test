import { useEffect, useMemo } from '@teact';

import { selectChat, selectSystemLanguage } from '../../../../global/selectors';
import { useEventListenerTeact } from '../../../chatAssistant/hook/useEventBusTeact';
import { updateHeaderTranslateTipStatus, updateInputTranslateTipStatus } from '../../../chatAssistant/utils/room-input-translate';

import useSelector from '../../../../hooks/data/useSelector';
import useFlag from '../../../../hooks/useFlag';

function getBaseLanguage(lang = navigator.language) {
  return lang.split('-')[0]; // 取 "-" 之前的部分
}

export function useTranslateTip({ chatId }: { chatId: string }) {
  const [
    headerTranslateTipOpen,
    openHeaderTranslateTip,
    closeHeaderTranslateTip,
  ] = useFlag();
  const [inputTranslateTipOpen, openInputTranslateTip, closeInputTranslateTip]
    = useFlag();

  const chat = useSelector((global) => selectChat(global, chatId));
  const globalSystemLanguage = useSelector(selectSystemLanguage);
  const translateTip = useSelector((global) => global.translateTip);

  const detectedLanguage = chat?.detectedLanguage;
  const systemLanguage = globalSystemLanguage ? getBaseLanguage(globalSystemLanguage) : getBaseLanguage();

  useEventListenerTeact('actions:openInputTranslateTip', openInputTranslateTip);

  const shouldShowTip = useMemo(() => {
    if (!detectedLanguage || !systemLanguage) return false;
    return detectedLanguage !== systemLanguage;
  }, [detectedLanguage, systemLanguage]);

  useEffect(() => {
    if (!shouldShowTip) {
      closeHeaderTranslateTip();
      closeInputTranslateTip();
      return;
    }

    if (!translateTip.headerTipClosed) {
      openHeaderTranslateTip();
    } else {
      closeHeaderTranslateTip();
    }

    if (translateTip.inputTipClosedChats?.[chatId]) {
      closeInputTranslateTip();
    }
  }, [chatId, shouldShowTip, translateTip, closeHeaderTranslateTip, closeInputTranslateTip, openHeaderTranslateTip]);

  const handleCloseHeaderTranslateTip = () => {
    closeHeaderTranslateTip();
    updateHeaderTranslateTipStatus(true);
  };

  const handleCloseInputTranslateTip = () => {
    closeInputTranslateTip();
    updateInputTranslateTipStatus(chatId, true);
  };

  return {
    headerTranslateTipOpen,
    openHeaderTranslateTip,
    closeHeaderTranslateTip: handleCloseHeaderTranslateTip,
    inputTranslateTipOpen,
    openInputTranslateTip,
    closeInputTranslateTip: handleCloseInputTranslateTip,
    systemLanguage,
  };
}
