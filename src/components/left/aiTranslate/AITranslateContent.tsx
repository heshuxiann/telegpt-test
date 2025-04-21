/* eslint-disable max-len */
import type { FC } from '../../../lib/teact/teact';
import React, {
  memo,
} from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { ApiLanguage } from '../../../api/types';
import type { ISettings } from '../../../types';

import useHistoryBack from '../../../hooks/useHistoryBack';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';

import Checkbox from '../../ui/Checkbox';
import AutoTranslateLanguage from './AutoTranslateLanguage';

type OwnProps = {
  isActive?: boolean;
  onReset: () => void;
};

type StateProps = {
  languages?: ApiLanguage[];
} & Pick<ISettings, | 'autoTranslate' | 'autoTranslateLanguage'>;

const AITranslateContent: FC<OwnProps & StateProps> = ({
  isActive,
  autoTranslate,
  autoTranslateLanguage,
  onReset,
}) => {
  const {
    setSettingOption,
    // openPremiumModal,
  } = getActions();

  const lang = useOldLang();

  const handleAutoTranslateChange = useLastCallback((newValue: boolean) => {
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

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const { autoTranslate, autoTranslateLanguage } = global.settings.byKey;
    return {
      autoTranslate,
      autoTranslateLanguage: autoTranslateLanguage || 'en',
    };
  },
)(AITranslateContent));
