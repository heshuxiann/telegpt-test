/* eslint-disable no-null/no-null */
import { useEffect, useMemo, useState } from '@teact';
import { getGlobal } from '../../../../global';

import { selectChat } from '../../../../global/selectors';
import { IS_ELECTRON } from '../../../../util/browser/windowEnvironment';

import useFlag from '../../../../hooks/useFlag';
import useLastCallback from '../../../../hooks/useLastCallback';

interface TranslateTipStorage {
  headerClosed?: boolean;
  inputClosedChats?: Record<string, boolean>;
}

const STORAGE_KEY = 'translate-tip';

function getTranslateTipData(): TranslateTipStorage {
  const localData = localStorage.getItem(STORAGE_KEY);
  try {
    return JSON.parse(localData || '{}');
  } catch (e) {
    return {};
  }
}

function saveTranslateTipData(data: TranslateTipStorage) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getBaseLanguage(lang = navigator.language) {
  return lang.split('-')[0]; // 取 "-" 之前的部分
}

export function useTranslateTip({ chatId }: { chatId: string }) {
  const [headerTranslateTipOpen, openHeaderTranslateTip, closeHeaderTranslateTip] = useFlag();
  const [inputTranslateTipOpen, openInputTranslateTip, closeInputTranslateTip] = useFlag();

  const [translateTipData, setTranslateTipData] = useState<TranslateTipStorage>(getTranslateTipData());
  const [systemLanguage, setSystemLanguage] = useState<string | null>(
    IS_ELECTRON ? null : getBaseLanguage(),
  );

  const global = getGlobal();
  const chat = selectChat(global, chatId);
  const detectedLanguage = chat?.detectedLanguage;

  useEffect(() => {
    if (IS_ELECTRON && window.electron?.getSystemLanguage) {
      window.electron.getSystemLanguage().then((lang) => {
        setSystemLanguage(getBaseLanguage(lang));
      });
    }
  }, []);

  const shouldShowTip = useMemo(() => {
    if (!detectedLanguage || !systemLanguage) return false;
    return detectedLanguage !== systemLanguage;
  }, [detectedLanguage, systemLanguage]);

  useEffect(() => {
    if (!shouldShowTip) return;

    if (!translateTipData.headerClosed) {
      openHeaderTranslateTip();
    }
  }, [shouldShowTip, translateTipData]);

  const handleCloseHeaderTranslateTip = useLastCallback(() => {
    closeHeaderTranslateTip();
    const newData = {
      ...translateTipData,
      headerClosed: true,
    };
    setTranslateTipData(newData);
    saveTranslateTipData(newData);
  });

  const handleCloseInputTranslateTip = useLastCallback(() => {
    closeInputTranslateTip();
    const newData = {
      ...translateTipData,
      inputClosedChats: {
        ...translateTipData.inputClosedChats,
        [chatId]: true,
      },
    };
    setTranslateTipData(newData);
    saveTranslateTipData(newData);
  });

  const checkAndOpenInputTranslateTip = useLastCallback(() => {
    if (!shouldShowTip) return false;
    if (translateTipData.inputClosedChats?.[chatId]) return false;

    openInputTranslateTip();
    return true;
  });

  return {
    headerTranslateTipOpen,
    openHeaderTranslateTip,
    closeHeaderTranslateTip: handleCloseHeaderTranslateTip,
    inputTranslateTipOpen,
    openInputTranslateTip,
    closeInputTranslateTip: handleCloseInputTranslateTip,
    checkAndOpenInputTranslateTip,
    systemLanguage,
  };
}
