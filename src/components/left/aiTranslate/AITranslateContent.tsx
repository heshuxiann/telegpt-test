/* eslint-disable max-len */
import type { FC } from '../../../lib/teact/teact';
import React, {
  useEffect, useState,
} from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import { CHATAI_IDB_STORE } from '../../../util/browser/idb';

import useHistoryBack from '../../../hooks/useHistoryBack';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';

import Checkbox from '../../ui/Checkbox';
import AutoTranslateLanguage from './AutoTranslateLanguage';

type OwnProps = {
  isActive?: boolean;
  onReset: () => void;
};

const AITranslateContent: FC<OwnProps> = ({
  isActive,
  onReset,
}) => {
  const {
    setSettingOption,
    // openPremiumModal,
  } = getActions();
  const lang = useOldLang();

  const [autoTranslate, setAutoTranslate] = useState(false);

  useEffect(() => {
    CHATAI_IDB_STORE.get('auto-translate').then((value) => {
      setAutoTranslate(value as boolean || false);
    });
  }, []);

  const handleAutoTranslateChange = useLastCallback((newValue: boolean) => {
    CHATAI_IDB_STORE.set('auto-translate', newValue);
    setSettingOption({ autoTranslate: newValue });
  });

  useHistoryBack({
    isActive,
    onBack: onReset,
  });

  return (
    <div className="settings-content settings-language custom-scroll">
      <div className="settings-item">
        <Checkbox
          label={lang('Auto Translate')}
          checked={autoTranslate}
          onCheck={handleAutoTranslateChange}
        />
      </div>
      <div className="settings-item settings-item-picker">
        <h4 className="settings-item-header">
          {lang('Localization.InterfaceLanguage')}
        </h4>
        <AutoTranslateLanguage />
      </div>
    </div>
  );
};

export default AITranslateContent;
