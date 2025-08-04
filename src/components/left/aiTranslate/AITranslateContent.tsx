/* eslint-disable max-len */
import type { FC } from '../../../lib/teact/teact';
import React, {
  memo,
  useState,
} from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import { telegptSettings } from '../../chatAssistant/api/user-settings';

import useHistoryBack from '../../../hooks/useHistoryBack';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';

import Checkbox from '../../ui/Checkbox';
import AutoTranslateLanguage from './AutoTranslateLanguage';

type OwnProps = {
  isActive?: boolean;
  onReset: () => void;
};
type StateProps = { autoTranslate:boolean | undefined };

const AITranslateContent: FC<OwnProps & StateProps> = ({
  autoTranslate,
  isActive,
  onReset,
}) => {
  const {
    setSettingOption,
    // openPremiumModal,
  } = getActions();
  const lang = useOldLang();

  const [displayAutoTranslate, setDisplayAutoTranslate] = useState(autoTranslate);

  const handleAutoTranslateChange = useLastCallback((newValue: boolean) => {
    setDisplayAutoTranslate(newValue);
    setSettingOption({ autoTranslate: newValue });
    telegptSettings.setSettingOption({
      autotranslate: newValue,
    });
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
          checked={displayAutoTranslate}
          onCheck={handleAutoTranslateChange}
        />
      </div>
      <div className="settings-item settings-item-picker">
        <h4 className="settings-item-header">
          {lang('Language')}
        </h4>
        <AutoTranslateLanguage />
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const {
      autoTranslate,
    } = global.settings.byKey;

    return {
      autoTranslate,
    };
  },
)(AITranslateContent));
